const db = require('../config/db')

// Delegates to documentos table (Supabase storage handles actual files)
async function listar(req, res) {
  const tenantId = req.tenant.id
  const { imovel_id, contrato_id, tipo } = req.query
  let sql = `
    SELECT d.*, u.nome AS usuario_nome
    FROM documentos d
    LEFT JOIN usuarios u ON d.usuario_id = u.id
    WHERE d.tenant_id=$1
  `
  const p = [tenantId]
  if (imovel_id)   { sql += ` AND d.imovel_id=$${p.length+1}`;   p.push(imovel_id) }
  if (contrato_id) { sql += ` AND d.contrato_id=$${p.length+1}`; p.push(contrato_id) }
  if (tipo)        { sql += ` AND d.tipo=$${p.length+1}`;        p.push(tipo) }
  sql += ' ORDER BY d.created_at DESC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar arquivos.' })
  }
}

module.exports = { listar }
