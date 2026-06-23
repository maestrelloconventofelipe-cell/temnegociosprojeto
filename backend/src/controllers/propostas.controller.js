const db = require('../config/db')
const { notificar } = require('../services/notificacoes.service')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const { status } = req.query
  let sql = `
    SELECT p.*, i.titulo AS imovel_titulo, u.nome AS corretor_nome
    FROM propostas p
    LEFT JOIN imoveis i ON p.imovel_id = i.id
    LEFT JOIN usuarios u ON p.corretor_id = u.id
    WHERE p.tenant_id = $1
  `
  const params = [tenantId]
  if (role === 'corretor') { sql += ` AND p.corretor_id = $${params.length+1}`; params.push(user_id) }
  if (status)              { sql += ` AND p.status = $${params.length+1}`;      params.push(status) }
  sql += ' ORDER BY p.created_at DESC'
  try {
    const { rows } = await db.query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar propostas.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT p.*, i.titulo AS imovel_titulo, u.nome AS corretor_nome
       FROM propostas p
       LEFT JOIN imoveis i ON p.imovel_id = i.id
       LEFT JOIN usuarios u ON p.corretor_id = u.id
       WHERE p.id=$1 AND p.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Proposta não encontrada.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar proposta.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { user_id } = req.user
  const {
    imovel_id, tipo, cliente_nome, cliente_email, cliente_telefone,
    valor_ofertado, valor_entrada, condicoes, status, observacoes,
  } = req.body
  if (!cliente_nome) return res.status(400).json({ erro: 'Nome do cliente é obrigatório.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO propostas
        (tenant_id, imovel_id, corretor_id, tipo, cliente_nome, cliente_email,
         cliente_telefone, valor_ofertado, valor_entrada, condicoes, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        tenantId, imovel_id||null, user_id, tipo||'venda',
        cliente_nome, cliente_email||null, cliente_telefone||null,
        valor_ofertado||null, valor_entrada||null,
        condicoes||null, status||'pendente', observacoes||null,
      ]
    )
    const id = rows[0].id
    notificar({
      tenant_id: tenantId,
      usuario_id: null,
      tipo: 'proposta',
      titulo: `Nova proposta de ${cliente_nome}`,
      mensagem: valor_ofertado ? `Valor: R$ ${Number(valor_ofertado).toLocaleString('pt-BR')}` : null,
      link: '/propostas',
    })
    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar proposta.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, tipo, cliente_nome, cliente_email, cliente_telefone,
    valor_ofertado, valor_entrada, condicoes, status, observacoes,
  } = req.body
  try {
    const result = await db.query(
      `UPDATE propostas SET
        imovel_id=$1, tipo=$2, cliente_nome=$3, cliente_email=$4,
        cliente_telefone=$5, valor_ofertado=$6, valor_entrada=$7,
        condicoes=$8, status=$9, observacoes=$10, updated_at=NOW()
       WHERE id=$11 AND tenant_id=$12`,
      [
        imovel_id||null, tipo||'venda', cliente_nome, cliente_email||null,
        cliente_telefone||null, valor_ofertado||null, valor_entrada||null,
        condicoes||null, status||'pendente', observacoes||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Proposta não encontrada.' })
    res.json({ mensagem: 'Proposta atualizada.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar proposta.' })
  }
}

async function atualizarStatus(req, res) {
  const tenantId = req.tenant.id
  const { status } = req.body
  const validos = ['pendente','em_analise','aprovada','recusada','cancelada']
  if (!validos.includes(status)) return res.status(400).json({ erro: 'Status inválido.' })
  try {
    const { rows: antes } = await db.query(
      'SELECT cliente_nome, corretor_id FROM propostas WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    const result = await db.query(
      'UPDATE propostas SET status=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3',
      [status, req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Proposta não encontrada.' })
    if ((status === 'aprovada' || status === 'recusada') && antes.length) {
      const label = status === 'aprovada' ? 'aprovada' : 'recusada'
      notificar({
        tenant_id: tenantId,
        usuario_id: antes[0].corretor_id,
        tipo: 'proposta',
        titulo: `Proposta ${label}: ${antes[0].cliente_nome}`,
        link: '/propostas',
      })
    }
    res.json({ mensagem: 'Status atualizado.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar status.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM propostas WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Proposta não encontrada.' })
    res.json({ mensagem: 'Proposta removida.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover proposta.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, atualizarStatus, remover }
