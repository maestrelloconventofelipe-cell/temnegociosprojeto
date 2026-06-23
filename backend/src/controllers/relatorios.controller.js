const db = require('../config/db')

async function financeiro(req, res) {
  const tenantId = req.tenant.id
  const { data_inicio, data_fim, tipo, status } = req.query
  let sql = `
    SELECT id, descricao, tipo, categoria, valor,
           data_vencimento, data_pagamento, status_pagamento
    FROM financeiro WHERE tenant_id=$1
  `
  const p = [tenantId]
  if (tipo)        { sql += ` AND tipo=$${p.length+1}`;                  p.push(tipo) }
  if (status)      { sql += ` AND status_pagamento=$${p.length+1}`;      p.push(status) }
  if (data_inicio) { sql += ` AND data_vencimento>=$${p.length+1}`;      p.push(data_inicio) }
  if (data_fim)    { sql += ` AND data_vencimento<=$${p.length+1}`;      p.push(data_fim) }
  sql += ' ORDER BY data_vencimento ASC'
  try {
    const { rows } = await db.query(sql, p)
    const total_receitas = rows.filter(r => r.tipo === 'receita' && r.status_pagamento === 'pago').reduce((s, r) => s + Number(r.valor), 0)
    const total_despesas = rows.filter(r => r.tipo === 'despesa' && r.status_pagamento === 'pago').reduce((s, r) => s + Number(r.valor), 0)
    const a_receber      = rows.filter(r => r.tipo === 'receita' && r.status_pagamento !== 'pago').reduce((s, r) => s + Number(r.valor), 0)
    const a_pagar        = rows.filter(r => r.tipo === 'despesa' && r.status_pagamento !== 'pago').reduce((s, r) => s + Number(r.valor), 0)
    res.json({ rows, totais: { total_receitas, total_despesas, saldo: total_receitas - total_despesas, a_receber, a_pagar } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao gerar relatório financeiro.' })
  }
}

async function comissoes(req, res) {
  const tenantId = req.tenant.id
  const { data_inicio, data_fim, corretor_id, status } = req.query
  let sql = `
    SELECT c.id, c.tipo, c.valor_negocio, c.percentual, c.valor_comissao,
           c.status, c.data_competencia, c.data_pagamento,
           u.nome AS corretor_nome, i.titulo AS imovel_titulo
    FROM comissoes c
    LEFT JOIN usuarios u ON c.corretor_id = u.id
    LEFT JOIN imoveis  i ON c.imovel_id   = i.id
    WHERE c.tenant_id=$1
  `
  const p = [tenantId]
  if (status)      { sql += ` AND c.status=$${p.length+1}`;            p.push(status) }
  if (corretor_id) { sql += ` AND c.corretor_id=$${p.length+1}`;       p.push(corretor_id) }
  if (data_inicio) { sql += ` AND c.data_competencia>=$${p.length+1}`; p.push(data_inicio) }
  if (data_fim)    { sql += ` AND c.data_competencia<=$${p.length+1}`; p.push(data_fim) }
  sql += ' ORDER BY c.data_competencia DESC'
  try {
    const { rows } = await db.query(sql, p)
    const total_valor    = rows.reduce((s, r) => s + Number(r.valor_comissao), 0)
    const total_pago     = rows.filter(r => r.status === 'pago').reduce((s, r) => s + Number(r.valor_comissao), 0)
    const total_pendente = rows.filter(r => r.status !== 'pago').reduce((s, r) => s + Number(r.valor_comissao), 0)
    res.json({ rows, totais: { total: rows.length, total_valor, total_pago, total_pendente } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao gerar relatório de comissões.' })
  }
}

async function contratos(req, res) {
  const tenantId = req.tenant.id
  const { data_inicio, data_fim, tipo, status } = req.query
  let sql = `
    SELECT c.id, c.tipo, c.cliente_nome, c.valor_mensal, c.valor_total,
           c.data_inicio, c.data_fim, c.status,
           i.titulo AS imovel_titulo, u.nome AS corretor_nome
    FROM contratos c
    LEFT JOIN imoveis  i ON c.imovel_id   = i.id
    LEFT JOIN usuarios u ON c.corretor_id = u.id
    WHERE c.tenant_id=$1
  `
  const p = [tenantId]
  if (tipo)        { sql += ` AND c.tipo=$${p.length+1}`;        p.push(tipo) }
  if (status)      { sql += ` AND c.status=$${p.length+1}`;      p.push(status) }
  if (data_inicio) { sql += ` AND c.data_inicio>=$${p.length+1}`; p.push(data_inicio) }
  if (data_fim)    { sql += ` AND c.data_fim<=$${p.length+1}`;   p.push(data_fim) }
  sql += ' ORDER BY c.data_inicio DESC'
  try {
    const { rows } = await db.query(sql, p)
    const total_valor = rows.reduce((s, r) => s + Number(r.valor_total ?? r.valor_mensal ?? 0), 0)
    const ativos    = rows.filter(r => r.status === 'ativo').length
    const vencem_30 = rows.filter(r => {
      if (!r.data_fim) return false
      const dias = (new Date(r.data_fim) - new Date()) / 86400000
      return dias >= 0 && dias <= 30
    }).length
    res.json({ rows, totais: { total: rows.length, ativos, vencem_30, total_valor } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao gerar relatório de contratos.' })
  }
}

async function imoveis(req, res) {
  const tenantId = req.tenant.id
  const { finalidade, status, cidade } = req.query
  let sql = `
    SELECT id, titulo, tipo, finalidade, valor, area_total, quartos, vagas,
           cidade, estado, status, created_at
    FROM imoveis WHERE tenant_id=$1
  `
  const p = [tenantId]
  if (finalidade) { sql += ` AND finalidade=$${p.length+1}`; p.push(finalidade) }
  if (status)     { sql += ` AND status=$${p.length+1}`;     p.push(status) }
  if (cidade)     { sql += ` AND cidade ILIKE $${p.length+1}`; p.push(`%${cidade}%`) }
  sql += ' ORDER BY status ASC, titulo ASC'
  try {
    const { rows } = await db.query(sql, p)
    const disponiveis = rows.filter(r => r.status === 'disponivel').length
    const alugados    = rows.filter(r => r.status === 'alugado').length
    const vendidos    = rows.filter(r => r.status === 'vendido').length
    res.json({ rows, totais: { total: rows.length, disponiveis, alugados, vendidos } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao gerar relatório de imóveis.' })
  }
}

module.exports = { financeiro, comissoes, contratos, imoveis }
