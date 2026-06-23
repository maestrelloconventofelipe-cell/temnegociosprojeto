const db = require('../config/db');

async function verificarTenant(req, res, next) {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ erro: 'Tenant não identificado na sessão.' });
  }
  try {
    const { rows } = await db.query(
      'SELECT id, nome_fantasia AS nome, status FROM tenants WHERE id=$1',
      [tenantId]
    );
    if (!rows.length || rows[0].status !== 'ativa') {
      return res.status(403).json({ erro: 'Franquia inativa ou não encontrada.' });
    }
    req.tenant = rows[0];
    next();
  } catch {
    return res.status(500).json({ erro: 'Erro ao verificar franquia.' });
  }
}

module.exports = { verificarTenant };
