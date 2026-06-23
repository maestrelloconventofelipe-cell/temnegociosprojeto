const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { status } = req.query
  let sql = `
    SELECT c.*, i.titulo AS imovel_titulo, u.nome AS corretor_nome
    FROM contratos c
    LEFT JOIN imoveis i ON c.imovel_id = i.id
    LEFT JOIN usuarios u ON c.corretor_id = u.id
    WHERE c.tenant_id = $1
  `
  const p = [tenantId]
  if (status) { sql += ` AND c.status = $${p.length+1}`; p.push(status) }
  sql += ' ORDER BY c.created_at DESC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar contratos.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT c.*, i.titulo AS imovel_titulo FROM contratos c
       LEFT JOIN imoveis i ON c.imovel_id = i.id
       WHERE c.id=$1 AND c.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Contrato não encontrado.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar contrato.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, proposta_id, corretor_id, tipo,
    cliente_nome, cliente_cpf, cliente_email, cliente_telefone,
    valor_mensal, valor_total, comissao_percentual,
    data_inicio, data_fim, data_assinatura, status, observacoes,
  } = req.body
  if (!cliente_nome) return res.status(400).json({ erro: 'Nome do cliente é obrigatório.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO contratos
        (tenant_id, imovel_id, proposta_id, corretor_id, tipo,
         cliente_nome, cliente_cpf, cliente_email, cliente_telefone,
         valor_mensal, valor_total, comissao_percentual,
         data_inicio, data_fim, data_assinatura, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        tenantId, imovel_id||null, proposta_id||null, corretor_id||null, tipo||'aluguel',
        cliente_nome, cliente_cpf||null, cliente_email||null, cliente_telefone||null,
        valor_mensal||null, valor_total||null, comissao_percentual||null,
        data_inicio||null, data_fim||null, data_assinatura||null,
        status||'ativo', observacoes||null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar contrato.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, proposta_id, corretor_id, tipo,
    cliente_nome, cliente_cpf, cliente_email, cliente_telefone,
    valor_mensal, valor_total, comissao_percentual,
    data_inicio, data_fim, data_assinatura, status, observacoes,
  } = req.body
  try {
    const result = await db.query(
      `UPDATE contratos SET
        imovel_id=$1, proposta_id=$2, corretor_id=$3, tipo=$4,
        cliente_nome=$5, cliente_cpf=$6, cliente_email=$7, cliente_telefone=$8,
        valor_mensal=$9, valor_total=$10, comissao_percentual=$11,
        data_inicio=$12, data_fim=$13, data_assinatura=$14,
        status=$15, observacoes=$16, updated_at=NOW()
       WHERE id=$17 AND tenant_id=$18`,
      [
        imovel_id||null, proposta_id||null, corretor_id||null, tipo||'aluguel',
        cliente_nome, cliente_cpf||null, cliente_email||null, cliente_telefone||null,
        valor_mensal||null, valor_total||null, comissao_percentual||null,
        data_inicio||null, data_fim||null, data_assinatura||null,
        status||'ativo', observacoes||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Contrato não encontrado.' })
    res.json({ mensagem: 'Contrato atualizado.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar contrato.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM contratos WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Contrato não encontrado.' })
    res.json({ mensagem: 'Contrato removido.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover contrato.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, remover }
