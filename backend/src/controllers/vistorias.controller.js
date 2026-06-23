const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { status, tipo } = req.query
  let sql = `
    SELECT v.*, i.titulo AS imovel_titulo, u.nome AS responsavel_nome
    FROM vistorias v
    LEFT JOIN imoveis i ON v.imovel_id = i.id
    LEFT JOIN usuarios u ON v.responsavel_id = u.id
    WHERE v.tenant_id = $1
  `
  const p = [tenantId]
  if (status) { sql += ` AND v.status=$${p.length+1}`; p.push(status) }
  if (tipo)   { sql += ` AND v.tipo=$${p.length+1}`;   p.push(tipo) }
  sql += ' ORDER BY v.data_vistoria DESC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar vistorias.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT v.*, i.titulo AS imovel_titulo
       FROM vistorias v LEFT JOIN imoveis i ON v.imovel_id = i.id
       WHERE v.id=$1 AND v.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Vistoria não encontrada.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar vistoria.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, contrato_id, responsavel_id, tipo,
    data_vistoria, status, laudo, observacoes,
  } = req.body
  if (!imovel_id) return res.status(400).json({ erro: 'Imóvel é obrigatório.' })
  try {
    const { rows } = await db.query(
      `INSERT INTO vistorias
        (tenant_id, imovel_id, contrato_id, responsavel_id, tipo,
         data_vistoria, status, laudo, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        tenantId, imovel_id, contrato_id||null, responsavel_id||null,
        tipo||'entrada', data_vistoria||null,
        status||'agendada', laudo||null, observacoes||null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar vistoria.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, contrato_id, responsavel_id, tipo,
    data_vistoria, status, laudo, observacoes,
  } = req.body
  try {
    const result = await db.query(
      `UPDATE vistorias SET
        imovel_id=$1, contrato_id=$2, responsavel_id=$3, tipo=$4,
        data_vistoria=$5, status=$6, laudo=$7, observacoes=$8, updated_at=NOW()
       WHERE id=$9 AND tenant_id=$10`,
      [
        imovel_id, contrato_id||null, responsavel_id||null, tipo||'entrada',
        data_vistoria||null, status||'agendada', laudo||null, observacoes||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Vistoria não encontrada.' })
    res.json({ mensagem: 'Vistoria atualizada.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar vistoria.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM vistorias WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Vistoria não encontrada.' })
    res.json({ mensagem: 'Vistoria removida.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover vistoria.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, remover }
