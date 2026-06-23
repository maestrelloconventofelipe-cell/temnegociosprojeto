const db = require('../config/db')
const { notificar } = require('../services/notificacoes.service')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const { status, tipo } = req.query

  let sql = `
    SELECT a.*, i.titulo AS imovel_titulo, u.nome AS responsavel_nome
    FROM agenda a
    LEFT JOIN imoveis i ON a.imovel_id = i.id
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.tenant_id = $1
  `
  const p = [tenantId]

  if (['corretor','captador','financeiro','juridico'].includes(role)) {
    sql += ` AND a.usuario_id = $${p.length+1}`; p.push(user_id)
  }
  if (tipo)   { sql += ` AND a.tipo = $${p.length+1}`;   p.push(tipo) }
  if (status) { sql += ` AND a.status = $${p.length+1}`; p.push(status) }
  sql += ' ORDER BY a.data_hora ASC'

  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar agenda.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT a.*, i.titulo AS imovel_titulo
       FROM agenda a LEFT JOIN imoveis i ON a.imovel_id = i.id
       WHERE a.id=$1 AND a.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Compromisso não encontrado.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar compromisso.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { user_id } = req.user
  const {
    titulo, tipo, data_hora, duracao_min,
    imovel_id, cliente_nome, cliente_telefone, status, observacoes,
  } = req.body
  if (!titulo || !data_hora) return res.status(400).json({ erro: 'Título e data são obrigatórios.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO agenda
        (tenant_id, usuario_id, imovel_id, titulo, tipo, data_hora,
         duracao_min, cliente_nome, cliente_telefone, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        tenantId, user_id, imovel_id||null,
        titulo, tipo||'visita', data_hora,
        duracao_min||60, cliente_nome||null, cliente_telefone||null,
        status||'agendado', observacoes||null,
      ]
    )
    const id = rows[0].id
    notificar({
      tenant_id: tenantId,
      usuario_id: null,
      tipo: 'agenda',
      titulo: `Novo compromisso: ${titulo}`,
      mensagem: `${tipo || 'visita'} agendado${cliente_nome ? ` com ${cliente_nome}` : ''}`,
      link: '/agenda',
    })
    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar compromisso.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    titulo, tipo, data_hora, duracao_min,
    imovel_id, cliente_nome, cliente_telefone, status, observacoes,
  } = req.body
  try {
    const result = await db.query(
      `UPDATE agenda SET
        titulo=$1, tipo=$2, data_hora=$3, duracao_min=$4,
        imovel_id=$5, cliente_nome=$6, cliente_telefone=$7,
        status=$8, observacoes=$9
       WHERE id=$10 AND tenant_id=$11`,
      [
        titulo, tipo||'visita', data_hora, duracao_min||60,
        imovel_id||null, cliente_nome||null, cliente_telefone||null,
        status||'agendado', observacoes||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Compromisso não encontrado.' })
    res.json({ mensagem: 'Compromisso atualizado.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar compromisso.' })
  }
}

async function atualizarStatus(req, res) {
  const tenantId = req.tenant.id
  const { status } = req.body
  try {
    const result = await db.query(
      'UPDATE agenda SET status=$1 WHERE id=$2 AND tenant_id=$3',
      [status, req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Compromisso não encontrado.' })
    res.json({ mensagem: 'Status atualizado.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar status.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM agenda WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Compromisso não encontrado.' })
    res.json({ mensagem: 'Compromisso removido.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover compromisso.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, atualizarStatus, remover }
