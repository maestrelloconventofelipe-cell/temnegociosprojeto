const db = require('../config/db')

const ROLES_FIN = ['administrador_matriz','diretor_regional','franqueado','financeiro']

async function safe(fn) {
  try { return await fn() } catch { return null }
}

async function resumo(req, res) {
  const tenantId = req.tenant.id
  const { user_id: userId, role } = req.user
  const isCorretor = ['corretor','captador'].includes(role)

  const [imRes, prRes, clRes, ctRes, finRes, agRes, tkRes] = await Promise.all([
    safe(() => db.query(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN status='disponivel' THEN 1 ELSE 0 END) AS disponiveis,
        SUM(CASE WHEN status='alugado'    THEN 1 ELSE 0 END) AS alugados,
        SUM(CASE WHEN status='vendido'    THEN 1 ELSE 0 END) AS vendidos
      FROM imoveis
      WHERE tenant_id=$1 ${isCorretor ? 'AND corretor_id=$2' : ''}
    `, isCorretor ? [tenantId, userId] : [tenantId])),

    safe(() => db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pendente')   AS pendentes,
        COUNT(*) FILTER (WHERE status='em_analise') AS em_analise,
        COUNT(*) FILTER (WHERE status='aprovada')   AS aprovadas,
        COUNT(*) FILTER (WHERE status='recusada')   AS recusadas,
        COUNT(*) FILTER (WHERE status='aprovada' AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS aprovadas_mes,
        COUNT(*) AS total
      FROM propostas
      WHERE tenant_id=$1 ${isCorretor ? 'AND corretor_id=$2' : ''}
    `, isCorretor ? [tenantId, userId] : [tenantId])),

    safe(() => db.query(`
      SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS novos_mes
      FROM clientes WHERE tenant_id=$1
    `, [tenantId])),

    safe(() => db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='ativo')    AS ativos,
        COUNT(*) FILTER (WHERE data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS vencem_30_dias,
        COUNT(*) AS total
      FROM contratos
      WHERE tenant_id=$1
    `, [tenantId])),

    ROLES_FIN.includes(role) ? safe(() => db.query(`
      SELECT
        COALESCE(SUM(valor) FILTER (
          WHERE tipo='receita' AND status_pagamento='pago'
          AND TO_CHAR(data_vencimento,'YYYY-MM')=TO_CHAR(NOW(),'YYYY-MM')
        ), 0) AS receitas_mes,
        COALESCE(SUM(valor) FILTER (
          WHERE tipo='despesa' AND status_pagamento='pago'
          AND TO_CHAR(data_vencimento,'YYYY-MM')=TO_CHAR(NOW(),'YYYY-MM')
        ), 0) AS despesas_mes,
        COALESCE(SUM(valor) FILTER (
          WHERE tipo='receita' AND status_pagamento='pendente'
        ), 0) AS a_receber,
        COUNT(*) FILTER (
          WHERE status_pagamento='atrasado'
        ) AS total_atrasados
      FROM financeiro WHERE tenant_id=$1
    `, [tenantId])) : Promise.resolve(null),

    safe(() => db.query(`
      SELECT id, titulo, tipo, data_hora, status,
             cliente_nome, observacoes
      FROM agenda
      WHERE tenant_id=$1
        AND data_hora >= NOW()
        AND status NOT IN ('cancelado','realizado')
        ${isCorretor ? 'AND usuario_id=$2' : ''}
      ORDER BY data_hora ASC LIMIT 5
    `, isCorretor ? [tenantId, userId] : [tenantId])),

    safe(() => db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pendente')     AS pendente,
        COUNT(*) FILTER (WHERE status='em_andamento') AS em_andamento,
        COUNT(*) FILTER (WHERE status='concluida')    AS concluida,
        COUNT(*) FILTER (WHERE data_prazo < CURRENT_DATE AND status NOT IN ('concluida','cancelada')) AS atrasadas
      FROM tarefas
      WHERE tenant_id=$1 ${isCorretor ? 'AND (responsavel_id=$2 OR criador_id=$2)' : ''}
    `, isCorretor ? [tenantId, userId] : [tenantId])),
  ])

  const im  = imRes?.rows?.[0]  ?? {}
  const pr  = prRes?.rows?.[0]  ?? {}
  const cl  = clRes?.rows?.[0]  ?? {}
  const ct  = ctRes?.rows?.[0]  ?? {}
  const fin = finRes?.rows?.[0] ?? null
  const ag  = agRes?.rows       ?? []
  const tk  = tkRes?.rows?.[0]  ?? {}

  res.json({
    imoveis:   im,
    clientes:  cl,
    propostas: pr,
    contratos: ct,
    financeiro: fin ? {
      ...fin,
      saldo_mes: Number(fin.receitas_mes) - Number(fin.despesas_mes),
    } : null,
    agenda: ag,
    tarefas: tk,
  })
}

async function graficos(req, res) {
  const tenantId = req.tenant.id
  const { user_id: userId, role } = req.user
  const isCorretor = ['corretor','captador'].includes(role)

  // Base map of last 6 months
  const mesesMap = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    mesesMap[key] = { mes: label, receitas: 0, despesas: 0, vendas: 0, alugueis: 0 }
  }

  try {
    const [finMes, negMes, funilRes, imoveisRes, corretoresRes, tarefasRes] = await Promise.all([
      ROLES_FIN.includes(role) ? safe(() => db.query(`
        SELECT TO_CHAR(data_vencimento,'YYYY-MM') AS mes,
          COALESCE(SUM(valor) FILTER (WHERE tipo='receita' AND status_pagamento='pago'), 0) AS receitas,
          COALESCE(SUM(valor) FILTER (WHERE tipo='despesa' AND status_pagamento='pago'), 0) AS despesas
        FROM financeiro
        WHERE tenant_id=$1
          AND data_vencimento >= (CURRENT_DATE - INTERVAL '5 months')
        GROUP BY mes ORDER BY mes
      `, [tenantId])) : Promise.resolve(null),

      safe(() => db.query(`
        SELECT TO_CHAR(created_at,'YYYY-MM') AS mes,
          COUNT(*) FILTER (WHERE tipo='venda')   AS vendas,
          COUNT(*) FILTER (WHERE tipo='aluguel') AS alugueis
        FROM propostas
        WHERE tenant_id=$1
          AND status IN ('aprovada')
          AND created_at >= (NOW() - INTERVAL '5 months')
          ${isCorretor ? 'AND corretor_id=$2' : ''}
        GROUP BY mes ORDER BY mes
      `, isCorretor ? [tenantId, userId] : [tenantId])),

      safe(() => db.query(`
        SELECT status, COUNT(*) AS total
        FROM propostas WHERE tenant_id=$1 GROUP BY status
      `, [tenantId])),

      safe(() => db.query(`
        SELECT status, COUNT(*) AS total FROM imoveis WHERE tenant_id=$1 GROUP BY status
      `, [tenantId])),

      !isCorretor ? safe(() => db.query(`
        SELECT u.nome,
          COUNT(DISTINCT p.id) FILTER (WHERE p.tipo='venda')   AS vendas,
          COUNT(DISTINCT p.id) FILTER (WHERE p.tipo='aluguel') AS alugueis,
          COUNT(DISTINCT p.id) AS total
        FROM usuarios u
        LEFT JOIN propostas p ON p.corretor_id=u.id AND p.tenant_id=$1 AND p.status='aprovada'
        WHERE u.tenant_id=$1
        GROUP BY u.id, u.nome
        HAVING COUNT(DISTINCT p.id) > 0
        ORDER BY total DESC LIMIT 5
      `, [tenantId])) : Promise.resolve(null),

      safe(() => db.query(`
        SELECT status, COUNT(*) AS total FROM tarefas
        WHERE tenant_id=$1
          ${isCorretor ? 'AND (responsavel_id=$2 OR criador_id=$2)' : ''}
        GROUP BY status
      `, isCorretor ? [tenantId, userId] : [tenantId])),
    ])

    finMes?.rows?.forEach(r => {
      if (mesesMap[r.mes]) {
        mesesMap[r.mes].receitas = Number(r.receitas)
        mesesMap[r.mes].despesas = Number(r.despesas)
      }
    })
    negMes?.rows?.forEach(r => {
      if (mesesMap[r.mes]) {
        mesesMap[r.mes].vendas   = Number(r.vendas)
        mesesMap[r.mes].alugueis = Number(r.alugueis)
      }
    })

    const STATUS_FUNIL = { pendente: 'Pendentes', em_analise: 'Em análise', aprovada: 'Aprovadas', recusada: 'Recusadas' }
    const ORDEM_FUNIL  = ['pendente', 'em_analise', 'aprovada']
    const funilMap = {}
    funilRes?.rows?.forEach(r => { funilMap[r.status] = Number(r.total) })
    const funil = ORDEM_FUNIL.map(s => ({ name: STATUS_FUNIL[s], value: funilMap[s] ?? 0 }))

    const STATUS_LABEL = { disponivel: 'Disponível', alugado: 'Alugado', vendido: 'Vendido', inativo: 'Inativo' }
    const tarefaMap = {}
    tarefasRes?.rows?.forEach(r => { tarefaMap[r.status] = Number(r.total) })

    res.json({
      meses:  Object.values(mesesMap),
      funil,
      imoveis: imoveisRes?.rows?.map(r => ({
        name:  STATUS_LABEL[r.status] ?? r.status ?? '—',
        value: Number(r.total),
      })) ?? [],
      top_corretores: corretoresRes?.rows?.map(c => ({
        nome:     c.nome,
        vendas:   Number(c.vendas),
        alugueis: Number(c.alugueis),
        total:    Number(c.total),
      })) ?? [],
      tarefas: {
        pendente:     tarefaMap.pendente     ?? 0,
        em_andamento: tarefaMap.em_andamento ?? 0,
        concluida:    tarefaMap.concluida    ?? 0,
        atrasadas:    tarefaMap.atrasadas    ?? 0,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ erro: 'Erro ao carregar gráficos.' })
  }
}

module.exports = { resumo, graficos }
