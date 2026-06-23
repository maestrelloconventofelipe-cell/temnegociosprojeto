const db = require('../config/db')
const { notificar } = require('../services/notificacoes.service')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { role, user_id } = req.user
  const { status, prioridade } = req.query

  let sql = `
    SELECT t.*, u.nome AS responsavel_nome, c.nome AS criador_nome
    FROM tarefas t
    LEFT JOIN usuarios u ON t.responsavel_id = u.id
    LEFT JOIN usuarios c ON t.criador_id = c.id
    WHERE t.tenant_id = $1
  `
  const p = [tenantId]
  if (['corretor','captador'].includes(role)) {
    sql += ` AND (t.responsavel_id=$${p.length+1} OR t.criador_id=$${p.length+1})`
    p.push(user_id)
  }
  if (status)    { sql += ` AND t.status=$${p.length+1}`;     p.push(status) }
  if (prioridade){ sql += ` AND t.prioridade=$${p.length+1}`; p.push(prioridade) }
  sql += ' ORDER BY t.created_at DESC'

  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar tarefas.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { user_id } = req.user
  const { titulo, descricao, prioridade, responsavel_id, data_prazo, status } = req.body
  if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO tarefas
        (tenant_id, criador_id, responsavel_id, titulo, descricao, prioridade, status, data_prazo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        tenantId, user_id, responsavel_id||null,
        titulo, descricao||null, prioridade||'media',
        status||'pendente', data_prazo||null,
      ]
    )
    const id = rows[0].id
    if (responsavel_id && responsavel_id !== user_id) {
      notificar({
        tenant_id: tenantId,
        usuario_id: Number(responsavel_id),
        tipo: 'tarefa',
        titulo: `Nova tarefa atribuída: ${titulo}`,
        mensagem: descricao || null,
        link: '/tarefas',
      })
    }
    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar tarefa.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const { titulo, descricao, prioridade, responsavel_id, data_prazo, status } = req.body
  try {
    const result = await db.query(
      `UPDATE tarefas SET
        titulo=$1, descricao=$2, prioridade=$3, responsavel_id=$4,
        data_prazo=$5, status=$6, updated_at=NOW()
       WHERE id=$7 AND tenant_id=$8`,
      [
        titulo, descricao||null, prioridade||'media',
        responsavel_id||null, data_prazo||null, status||'pendente',
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Tarefa não encontrada.' })
    res.json({ mensagem: 'Tarefa atualizada.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar tarefa.' })
  }
}

async function atualizarStatus(req, res) {
  const tenantId = req.tenant.id
  const { status } = req.body
  try {
    const { rows: antes } = await db.query(
      'SELECT titulo, criador_id FROM tarefas WHERE id=$1 AND tenant_id=$2',
      [req.params.id, tenantId]
    )
    const result = await db.query(
      'UPDATE tarefas SET status=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3',
      [status, req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Tarefa não encontrada.' })
    if (status === 'concluida' && antes.length) {
      notificar({
        tenant_id: tenantId,
        usuario_id: antes[0].criador_id,
        tipo: 'tarefa',
        titulo: `Tarefa concluída: ${antes[0].titulo}`,
        link: '/tarefas',
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
      'DELETE FROM tarefas WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Tarefa não encontrada.' })
    res.json({ mensagem: 'Tarefa removida.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover tarefa.' })
  }
}

module.exports = { listar, criar, atualizar, atualizarStatus, remover }
