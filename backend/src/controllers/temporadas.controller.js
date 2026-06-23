const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { status, imovel_id } = req.query
  let sql = `
    SELECT t.*, i.titulo AS imovel_titulo
    FROM temporadas t
    LEFT JOIN imoveis i ON t.imovel_id = i.id
    WHERE t.tenant_id = $1
  `
  const p = [tenantId]
  if (status)    { sql += ` AND t.status=$${p.length+1}`;    p.push(status) }
  if (imovel_id) { sql += ` AND t.imovel_id=$${p.length+1}`; p.push(imovel_id) }
  sql += ' ORDER BY t.data_inicio DESC'
  try {
    const { rows } = await db.query(sql, p)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao listar temporadas.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT t.*, i.titulo AS imovel_titulo
       FROM temporadas t LEFT JOIN imoveis i ON t.imovel_id = i.id
       WHERE t.id=$1 AND t.tenant_id=$2`,
      [req.params.id, tenantId]
    )
    if (!rows.length) return res.status(404).json({ erro: 'Temporada não encontrada.' })
    res.json(rows[0])
  } catch {
    res.status(500).json({ erro: 'Erro ao buscar temporada.' })
  }
}

async function criar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, hospede_nome, hospede_email, hospede_telefone, hospede_cpf,
    data_inicio, data_fim, valor_diaria, valor_total, taxa_limpeza,
    num_hospedes, status, plataforma, observacoes,
  } = req.body
  if (!imovel_id || !hospede_nome) {
    return res.status(400).json({ erro: 'Imóvel e nome do hóspede são obrigatórios.' })
  }
  try {
    const dias = data_inicio && data_fim
      ? Math.max(1, Math.ceil((new Date(data_fim) - new Date(data_inicio)) / 86400000))
      : null
    const total = valor_total || (valor_diaria && dias
      ? (parseFloat(valor_diaria) * dias + parseFloat(taxa_limpeza || 0)).toFixed(2)
      : null)

    const { rows } = await db.query(
      `INSERT INTO temporadas
        (tenant_id, imovel_id, hospede_nome, hospede_email, hospede_telefone, hospede_cpf,
         data_inicio, data_fim, valor_diaria, valor_total, taxa_limpeza,
         num_hospedes, status, plataforma, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        tenantId, imovel_id,
        hospede_nome, hospede_email||null, hospede_telefone||null, hospede_cpf||null,
        data_inicio||null, data_fim||null,
        valor_diaria||null, total||null, taxa_limpeza||0,
        num_hospedes||1, status||'reservado', plataforma||null, observacoes||null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar temporada.' })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, hospede_nome, hospede_email, hospede_telefone, hospede_cpf,
    data_inicio, data_fim, valor_diaria, valor_total, taxa_limpeza,
    num_hospedes, status, plataforma, observacoes,
  } = req.body
  try {
    const result = await db.query(
      `UPDATE temporadas SET
        imovel_id=$1, hospede_nome=$2, hospede_email=$3, hospede_telefone=$4, hospede_cpf=$5,
        data_inicio=$6, data_fim=$7, valor_diaria=$8, valor_total=$9, taxa_limpeza=$10,
        num_hospedes=$11, status=$12, plataforma=$13, observacoes=$14, updated_at=NOW()
       WHERE id=$15 AND tenant_id=$16`,
      [
        imovel_id, hospede_nome, hospede_email||null, hospede_telefone||null, hospede_cpf||null,
        data_inicio||null, data_fim||null,
        valor_diaria||null, valor_total||null, taxa_limpeza||0,
        num_hospedes||1, status||'reservado', plataforma||null, observacoes||null,
        req.params.id, tenantId,
      ]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Temporada não encontrada.' })
    res.json({ mensagem: 'Temporada atualizada.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao atualizar temporada.' })
  }
}

async function remover(req, res) {
  const tenantId = req.tenant.id
  try {
    const result = await db.query(
      'DELETE FROM temporadas WHERE id=$1 AND tenant_id=$2', [req.params.id, tenantId]
    )
    if (result.rowCount === 0) return res.status(404).json({ erro: 'Temporada não encontrada.' })
    res.json({ mensagem: 'Temporada removida.' })
  } catch {
    res.status(500).json({ erro: 'Erro ao remover temporada.' })
  }
}

module.exports = { listar, buscar, criar, atualizar, remover }
