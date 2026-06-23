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
  const { user_id } = req.user
  const {
    tipo, categoria, descricao, valor,
    data_competencia, data_vencimento, data_pagamento,
    status_pagamento, observacoes,
  } = req.body

  if (!tipo || !valor || !descricao) {
    return res.status(400).json({ erro: 'Tipo, valor e descrição são obrigatórios.' })
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO financeiro
        (tenant_id, tipo, categoria, descricao, valor,
         data_competencia, data_vencimento, data_pagamento,
         status_pagamento, observacoes, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        tenantId, tipo, categoria||null, descricao, valor,
        data_competencia||null, data_vencimento||null, data_pagamento||null,
        status_pagamento||'pendente', observacoes||null, user_id,
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

  try {
    const result = await db.query(
      `UPDATE financeiro SET
        tipo=$1, categoria=$2, descricao=$3, valor=$4,
        data_competencia=$5, data_vencimento=$6, data_pagamento=$7,
        status_pagamento=$8, observacoes=$9
       WHERE id=$10 AND tenant_id=$11`,
      [
        tipo, categoria||null, descricao, valor,
        data_competencia||null, data_vencimento||null, data_pagamento||null,
        status_pagamento||'pendente', observacoes||null,
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
      `UPDATE financeiro SET status_pagamento='pago', data_pagamento=$1 WHERE id=$2 AND tenant_id=$3`,
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
