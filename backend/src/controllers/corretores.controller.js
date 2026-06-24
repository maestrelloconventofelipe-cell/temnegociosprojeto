const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT id, nome, email, telefone, perfil AS role
       FROM usuarios
       WHERE tenant_id=$1
         AND perfil IN ('corretor','captador')
         AND status='ativo'
       ORDER BY nome`,
      [tenantId]
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar corretores.' })
  }
}

module.exports = { listar }
