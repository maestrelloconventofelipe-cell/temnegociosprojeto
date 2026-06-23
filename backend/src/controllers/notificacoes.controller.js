const db = require('../config/db')

async function listar(req, res) {
  const { user } = req
  try {
    const { rows } = await db.query(
      `SELECT * FROM notificacoes
       WHERE tenant_id = $1
         AND (usuario_id = $2 OR usuario_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.tenant_id, user.user_id]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar notificações.' })
  }
}

async function contarNaoLidas(req, res) {
  const { user } = req
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS total FROM notificacoes
       WHERE tenant_id = $1
         AND (usuario_id = $2 OR usuario_id IS NULL)
         AND lida = FALSE`,
      [user.tenant_id, user.user_id]
    )
    res.json({ total: Number(rows[0].total) })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao contar notificações.' })
  }
}

async function marcarLida(req, res) {
  const { user } = req
  try {
    await db.query(
      `UPDATE notificacoes SET lida = TRUE
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, user.tenant_id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao marcar notificação.' })
  }
}

async function marcarTodasLidas(req, res) {
  const { user } = req
  try {
    await db.query(
      `UPDATE notificacoes SET lida = TRUE
       WHERE tenant_id = $1
         AND (usuario_id = $2 OR usuario_id IS NULL)
         AND lida = FALSE`,
      [user.tenant_id, user.user_id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao marcar notificações.' })
  }
}

async function remover(req, res) {
  const { user } = req
  try {
    await db.query(
      'DELETE FROM notificacoes WHERE id = $1 AND tenant_id = $2',
      [req.params.id, user.tenant_id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover notificação.' })
  }
}

async function criar(req, res) {
  const { user } = req
  const { titulo, mensagem, tipo = 'sistema', link, usuario_id } = req.body
  if (!titulo) return res.status(400).json({ erro: 'Título obrigatório.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO notificacoes (tenant_id, usuario_id, tipo, titulo, mensagem, link)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user.tenant_id, usuario_id || null, tipo, titulo, mensagem || null, link || null]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar notificação.' })
  }
}

module.exports = { listar, contarNaoLidas, marcarLida, marcarTodasLidas, remover, criar }
