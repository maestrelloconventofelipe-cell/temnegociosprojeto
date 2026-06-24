const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const { status } = req.query

  let sql = `
    SELECT c.*, c.valor AS valor_comissao,
           u.nome AS corretor_nome, i.titulo AS imovel_titulo
    FROM comissoes c
    LEFT JOIN usuarios u ON c.corretor_id = u.id
    LEFT JOIN imoveis i ON c.imovel_id = i.id
    WHERE c.tenant_id = $1
  `
  const p = [tenantId]
  if (['corretor','captador'].includes(role)) {
    sql += ` AND c.corretor_id = $${p.length+1}`; p.push(user_id)
  }
  if (status) { sql += ` AND c.status = $${p.length+1}`; p.push(status) }
  sql += ' ORDER BY c.created_at DESC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar comissões.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT c.*, c.valor AS valor_comissao,
              u.nome AS corretor_nome, i.titulo AS imovel_titulo
       FROM comissoes c
       LEFT JOIN usuarios u ON c.corretor_id = u.id
       LEFT JOIN imoveis i ON c.imovel_id = i.id
       WHERE c.id=$1 AND c.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Comissão não encontrada.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar comissão.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const {
    corretor_id, imovel_id, contrato_id, tipo,
    valor_negocio, percentual, valor_comissao,
    data_competencia, status, observacoes,
  } = req.body
  if (!corretor_id) return res.status(400).json({ erro: 'Corretor é obrigatório.' })

  const valComissao = valor_comissao || (percentual && valor_negocio
    ? (parseFloat(percentual) / 100 * parseFloat(valor_negocio)).toFixed(2)
    : null)
  if (!valComissao) return res.status(400).json({ erro: 'Informe o valor da comissão ou percentual + valor do negócio.' })

  try {
    const { rows } = await db.query(
      `INSERT INTO comissoes
        (tenant_id, corretor_id, imovel_id, contrato_id, tipo,
         valor_negocio, percentual, valor,
         data_competencia, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        tenantId, corretor_id, imovel_id||null, contrato_id||null, tipo||'venda',
        valor_negocio||null, percentual||null, valComissao,
        data_competencia||null, status||'pendente', observacoes||null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar comissão.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    corretor_id, imovel_id, contrato_id, tipo,
    valor_negocio, percentual, valor_comissao,
    data_competencia, status, observacoes,
  } = req.body
  const valComissao = valor_comissao || (percentual && valor_negocio
    ? (parseFloat(percentual) / 100 * parseFloat(valor_negocio)).toFixed(2)
    : null)

  try {
    const result = await db.query(
      `UPDATE comissoes SET
        corretor_id=$1, imovel_id=$2, contrato_id=$3, tipo=$4,
        valor_negocio=$5, percentual=$6, valor=$7,
        data_competencia=$8, status=$9, observacoes=$10
       WHERE id=$11 AND tenant_id=$12`,
      [
        corretor_id, imovel_id||null, contrato_id||null, tipo||'venda',
        valor_negocio||null, percentual||null, valComissao||null,
        data_competencia||null, status||'pendente', observacoes||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Comissão não encontrada.' })
    res.json({ mensagem: 'Comissão atualizada.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar comissão.' })
  }
}

async function pagar(req, res) {
  const tenantId = req.tenant.id
  const { data_pagamento } = req.body
  try {
    const result = await db.query(
      `UPDATE comissoes SET status='pago', data_pagamento=$1 WHERE id=$2 AND tenant_id=$3`,
      [data_pagamento || new Date().toISOString().slice(0,10), req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Comissão não encontrada.' })
    res.json({ mensagem: 'Comissão paga.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao marcar como paga.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM comissoes WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Comissão não encontrada.' })
    res.json({ mensagem: 'Comissão removida.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover comissão.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, pagar, remover }
