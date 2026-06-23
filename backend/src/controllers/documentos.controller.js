const db = require('../config/db')

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
    res.status(500).json({ erro: 'Erro ao listar documentos.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const { user_id } = req.user
  const { nome, tipo, categoria, url, tamanho, imovel_id, contrato_id } = req.body
  if (!nome || !url) return res.status(400).json({ erro: 'Nome e URL são obrigatórios.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO documentos
        (tenant_id, usuario_id, imovel_id, contrato_id, nome, tipo, url, tamanho)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        tenantId, user_id,
        imovel_id||null, contrato_id||null,
        nome, tipo||categoria||'outro', url, tamanho||null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao salvar documento.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM documentos WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Documento não encontrado.' })
    res.json({ mensagem: 'Documento removido.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover documento.' })
  }
}

module.exports = { listar, criar, remover }
