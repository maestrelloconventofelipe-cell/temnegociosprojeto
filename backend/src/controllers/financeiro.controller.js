const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { tipo, status, mes } = req.query

  let sql = 'SELECT * FROM financeiro WHERE tenant_id=$1'
  const p = [tenantId]

  if (tipo)   { sql += ` AND tipo=$${p.length+1}`;             p.push(tipo) }
  if (status) { sql += ` AND status_pagamento=$${p.length+1}`; p.push(status) }
  if (mes) {
    // mes = '2025-06'
    sql += ` AND TO_CHAR(COALESCE(data_vencimento, data_competencia, created_at::date),'YYYY-MM') = $${p.length+1}`
    p.push(mes)
  }

  sql += ' ORDER BY COALESCE(data_vencimento, created_at) ASC'

  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar lançamentos.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      'SELECT * FROM financeiro WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar lançamento.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const {
    tipo, categoria, descricao, valor,
    data_competencia, data_vencimento, data_pagamento,
    status_pagamento, observacoes,
  } = req.body

  if (!tipo || !valor || !descricao) {
    return res.status(400).json({ erro: 'Tipo, valor e descrição são obrigatórios.' })
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const statusVal = status_pagamento || 'pendente'

  try {
    const { rows } = await db.query(
      `INSERT INTO financeiro
        (tenant_id, tipo, categoria, descricao, valor,
         data_competencia, data_vencimento, data_pagamento,
         status, status_pagamento, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        tenantId, tipo, categoria || 'outro', descricao, valor,
        data_competencia || hoje, data_vencimento || hoje, data_pagamento || null,
        statusVal, statusVal, observacoes || null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar lançamento.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    tipo, categoria, descricao, valor,
    data_competencia, data_vencimento, data_pagamento,
    status_pagamento, observacoes,
  } = req.body

  const hoje = new Date().toISOString().slice(0, 10)
  const statusVal = status_pagamento || 'pendente'

  try {
    const result = await db.query(
      `UPDATE financeiro SET
        tipo=$1, categoria=$2, descricao=$3, valor=$4,
        data_competencia=$5, data_vencimento=$6, data_pagamento=$7,
        status=$8, status_pagamento=$8, observacoes=$9
       WHERE id=$10 AND tenant_id=$11`,
      [
        tipo, categoria || 'outro', descricao, valor,
        data_competencia || hoje, data_vencimento || hoje, data_pagamento || null,
        statusVal, observacoes || null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
    res.json({ mensagem: 'Lançamento atualizado.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar lançamento.' })
  }
}

async function pagar(req, res) {
  const tenantId = req.tenant.id
  const { data_pagamento } = req.body
  try {
    const result = await db.query(
      `UPDATE financeiro SET status='pago', status_pagamento='pago', data_pagamento=$1 WHERE id=$2 AND tenant_id=$3`,
      [data_pagamento || new Date().toISOString().slice(0,10), req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
    res.json({ mensagem: 'Marcado como pago.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao marcar como pago.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM financeiro WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
    res.json({ mensagem: 'Lançamento removido.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover lançamento.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, pagar, remover }
