const db = require('../config/db')

async function listar(req, res) {
  const tenantId = req.tenant.id
  const { status, imovel_id } = req.query
  let sql = `
    SELECT t.*,
           i.titulo   AS imovel_titulo,
           i.cidade   AS imovel_cidade,
           c.nome     AS cliente_nome,
           u.nome     AS corretor_nome,
           CASE
             WHEN t.data_inicio IS NOT NULL AND t.data_fim IS NOT NULL
             THEN (t.data_fim::date - t.data_inicio::date)
             ELSE 0
           END AS noites,
           ROUND((COALESCE(t.valor_total,0) * COALESCE(t.taxa_anfitriao_percentual,10) / 100)::numeric, 2) AS taxa_anfitriao_valor
    FROM temporadas t
    LEFT JOIN imoveis  i ON t.imovel_id   = i.id
    LEFT JOIN clientes c ON t.cliente_id  = c.id
    LEFT JOIN usuarios u ON t.corretor_id = u.id
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

async function resumo(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='reservada')  AS reservadas,
        COUNT(*) FILTER (WHERE status='confirmada') AS confirmadas,
        COUNT(*) FILTER (WHERE status='finalizada') AS finalizadas,
        COUNT(*) FILTER (WHERE status='cancelada')  AS canceladas,
        COALESCE(SUM(CASE WHEN status IN ('reservada','confirmada','finalizada')
          THEN data_fim::date - data_inicio::date ELSE 0 END), 0) AS total_noites,
        COALESCE(SUM(CASE WHEN status IN ('reservada','confirmada','finalizada')
          THEN valor_total ELSE 0 END), 0) AS valor_total,
        COALESCE(SUM(CASE WHEN status IN ('reservada','confirmada','finalizada')
          THEN ROUND(valor_total * taxa_anfitriao_percentual / 100, 2) ELSE 0 END), 0) AS taxa_total
      FROM temporadas WHERE tenant_id=$1
    `, [tenantId])
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao calcular resumo.' })
  }
}

async function buscar(req, res) {
  const tenantId = req.tenant.id
  try {
    const { rows } = await db.query(
      `SELECT t.*, i.titulo AS imovel_titulo,
              CASE WHEN t.data_inicio IS NOT NULL AND t.data_fim IS NOT NULL
                   THEN (t.data_fim::date - t.data_inicio::date) ELSE 0 END AS noites,
              ROUND((COALESCE(t.valor_total,0) * COALESCE(t.taxa_anfitriao_percentual,10) / 100)::numeric, 2) AS taxa_anfitriao_valor
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
    imovel_id, cliente_id,
    corretor_id, corretor_captador_id,
    hospede_nome, hospede_email, hospede_telefone, hospede_cpf,
    data_inicio, data_fim, valor_diaria,
    taxa_anfitriao_percentual, taxa_limpeza,
    num_hospedes, status, plataforma, observacoes,
  } = req.body

  if (!imovel_id) {
    return res.status(400).json({ erro: 'Imóvel é obrigatório.' })
  }

  try {
    const dias = data_inicio && data_fim
      ? Math.max(1, Math.ceil((new Date(data_fim) - new Date(data_inicio)) / 86400000))
      : null
    const vDiaria = parseFloat(valor_diaria) || 0
    const total = dias ? (vDiaria * dias).toFixed(2) : null
    const percTaxa = parseFloat(taxa_anfitriao_percentual) || 10
    const valTaxa  = total ? parseFloat((parseFloat(total) * percTaxa / 100).toFixed(2)) : 0

    const { rows } = await db.query(
      `INSERT INTO temporadas
        (tenant_id, imovel_id, cliente_id, corretor_id, corretor_captador_id,
         hospede_nome, hospede_email, hospede_telefone, hospede_cpf,
         data_inicio, data_fim, valor_diaria, valor_total,
         taxa_anfitriao_percentual, taxa_anfitriao_valor, taxa_limpeza,
         num_hospedes, status, plataforma, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id`,
      [
        tenantId, imovel_id,
        cliente_id || null, corretor_id || null, corretor_captador_id || null,
        hospede_nome || null, hospede_email || null, hospede_telefone || null, hospede_cpf || null,
        data_inicio || null, data_fim || null,
        vDiaria || null, total || null,
        percTaxa, valTaxa, parseFloat(taxa_limpeza) || 0,
        num_hospedes || 1, status || 'reservada', plataforma || null, observacoes || null,
      ]
    )
    res.status(201).json({ id: rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao criar temporada.', detalhe: err.message })
  }
}

async function atualizar(req, res) {
  const tenantId = req.tenant.id
  const {
    imovel_id, cliente_id,
    corretor_id, corretor_captador_id,
    hospede_nome, hospede_email, hospede_telefone, hospede_cpf,
    data_inicio, data_fim, valor_diaria,
    taxa_anfitriao_percentual, taxa_limpeza,
    num_hospedes, status, plataforma, observacoes,
  } = req.body
  try {
    const dias = data_inicio && data_fim
      ? Math.max(1, Math.ceil((new Date(data_fim) - new Date(data_inicio)) / 86400000))
      : null
    const vDiaria = parseFloat(valor_diaria) || 0
    const total = dias ? (vDiaria * dias).toFixed(2) : null
    const percTaxa = parseFloat(taxa_anfitriao_percentual) || 10
    const valTaxa  = total ? parseFloat((parseFloat(total) * percTaxa / 100).toFixed(2)) : 0

    const result = await db.query(
      `UPDATE temporadas SET
        imovel_id=$1, cliente_id=$2, corretor_id=$3, corretor_captador_id=$4,
        hospede_nome=$5, hospede_email=$6, hospede_telefone=$7, hospede_cpf=$8,
        data_inicio=$9, data_fim=$10, valor_diaria=$11, valor_total=$12,
        taxa_anfitriao_percentual=$13, taxa_anfitriao_valor=$14, taxa_limpeza=$15,
        num_hospedes=$16, status=$17, plataforma=$18, observacoes=$19, updated_at=NOW()
       WHERE id=$20 AND tenant_id=$21`,
      [
        imovel_id, cliente_id || null, corretor_id || null, corretor_captador_id || null,
        hospede_nome || null, hospede_email || null, hospede_telefone || null, hospede_cpf || null,
        data_inicio || null, data_fim || null,
        vDiaria || null, total || null,
        percTaxa, valTaxa, parseFloat(taxa_limpeza) || 0,
        num_hospedes || 1, status || 'reservada', plataforma || null, observacoes || null,
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

module.exports = { listar, buscar, resumo, criar, atualizar, remover }
