const db = require('../config/db')

async function notificar({ tenant_id, usuario_id = null, tipo = 'sistema', titulo, mensagem, link }) {
  try {
    await db.query(
      `INSERT INTO notificacoes (tenant_id, usuario_id, tipo, titulo, mensagem, link)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenant_id, usuario_id, tipo, titulo, mensagem || null, link || null]
    )
  } catch (err) {
    console.error('[notificar]', err.message)
  }
}

module.exports = { notificar }
