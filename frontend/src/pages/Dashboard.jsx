import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'
import {
  Building2, Users, FileText, ScrollText,
  TrendingUp, TrendingDown, Wallet, Clock, ArrowRight,
  CheckSquare, AlertTriangle, Award,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'

const ROLE_LABELS = {
  administrador_matriz: 'Adm. Matriz', diretor_regional: 'Diretor Regional',
  franqueado: 'Franqueado', corretor: 'Corretor', captador: 'Captador',
  financeiro: 'Financeiro', juridico: 'Jurídico',
  funcionario_administrativo: 'Func. Adm.', auditor_rede: 'Auditor',
}
const TIPO_AGENDA  = { visita: 'Visita', reuniao: 'Reunião', ligacao: 'Ligação', assinatura: 'Assinatura', vistoria: 'Vistoria', outro: 'Outro' }
const ICONE_AGENDA = { visita: '🏠', reuniao: '👥', ligacao: '📞', assinatura: '✍️', vistoria: '🔍', outro: '📋' }
const CORES_IMOVEIS = ['#3b82f6','#f97316','#22c55e','#9ca3af']
const CORES_FUNIL   = ['#eab308','#22c55e','#3b82f6']

const FIN_ROLES    = ['administrador_matriz','diretor_regional','franqueado','financeiro']
const GESTOR_ROLES = ['administrador_matriz','diretor_regional','franqueado']

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function dataHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function useCountUp(end, dur = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!end || end <= 0) { setVal(end ?? 0); return }
    const t0 = performance.now()
    let raf
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end])
  return val
}

function KpiCard({ label, valor, sub, accent = '#3b82f6', textColor, countTarget, Icon, onClick }) {
  const counted = useCountUp(countTarget ?? 0)
  const display = countTarget != null ? counted : valor
  return (
    <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden"
      onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${accent}, ${accent}66)` }} />
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <span className="text-muted fw-bold text-uppercase"
            style={{ fontSize: '0.62rem', letterSpacing: '0.09em' }}>{label}</span>
          {Icon && (
            <div className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: '34px', height: '34px', background: accent + '1a', flexShrink: 0 }}>
              <Icon size={16} style={{ color: accent }} />
            </div>
          )}
        </div>
        <div className="fw-bold" style={{ fontSize: '1.75rem', color: textColor ?? accent, lineHeight: 1 }}>
          {display}
        </div>
        {sub && <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.73rem' }}>{sub}</p>}
      </div>
    </div>
  )
}

function Skeleton({ style }) {
  return <div className="skeleton rounded-4" style={{ height: '100px', ...style }} />
}

function TooltipEscuro({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-3 shadow-lg px-3 py-2" style={{ background: '#1e293b', border: '1px solid #334155', fontSize: 13 }}>
      <p className="fw-bold text-muted mb-1" style={{ fontSize: 11, textTransform: 'uppercase' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="mb-0 fw-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? moeda(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function SectionTitle({ children, cor = '#3b82f6' }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <div className="rounded-pill" style={{ width: '14px', height: '3px', background: cor }} />
      <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.09em' }}>
        {children}
      </span>
    </div>
  )
}

function TarefasWidget({ tarefas, onNavigate }) {
  const total = (tarefas.pendente + tarefas.em_andamento + tarefas.concluida) || 1
  const itens = [
    { label: 'Pendentes',    val: tarefas.pendente,     cor: '#eab308' },
    { label: 'Em andamento', val: tarefas.em_andamento, cor: '#3b82f6' },
    { label: 'Concluídas',   val: tarefas.concluida,    cor: '#22c55e' },
  ]
  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 h-100"
      onClick={onNavigate} style={{ cursor: 'pointer' }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-3 d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px', background: '#f3e8ff' }}>
            <CheckSquare size={14} style={{ color: '#7c3aed' }} />
          </div>
          <span className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>Tarefas</span>
        </div>
        <ArrowRight size={13} className="text-muted" />
      </div>
      <div className="d-flex flex-column gap-2">
        {itens.map(it => (
          <div key={it.label}>
            <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.72rem' }}>
              <span className="text-muted">{it.label}</span>
              <span className="fw-bold" style={{ color: it.cor }}>{it.val}</span>
            </div>
            <div className="rounded-pill overflow-hidden" style={{ height: '5px', background: '#f1f5f9' }}>
              <div className="rounded-pill h-100"
                style={{ width: `${(it.val / total) * 100}%`, background: it.cor }} />
            </div>
          </div>
        ))}
      </div>
      {tarefas.atrasadas > 0 && (
        <div className="d-flex align-items-center gap-2 rounded-3 mt-3 px-3 py-2"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={12} className="text-danger" />
          <span className="text-danger fw-medium" style={{ fontSize: '0.72rem' }}>
            {tarefas.atrasadas} tarefa{tarefas.atrasadas > 1 ? 's' : ''} atrasada{tarefas.atrasadas > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [dados, setDados]       = useState(null)
  const [graficos, setGraficos] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/dashboard/graficos')])
      .then(([d, g]) => { setDados(d.data); setGraficos(g.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const im    = dados?.imoveis   ?? {}
  const cl    = dados?.clientes  ?? {}
  const pr    = dados?.propostas ?? {}
  const ct    = dados?.contratos ?? {}
  const fin   = dados?.financeiro
  const agenda = dados?.agenda ?? []

  const meses         = graficos?.meses         ?? []
  const imoveisPie    = graficos?.imoveis        ?? []
  const funil         = graficos?.funil          ?? []
  const topCorretores = graficos?.top_corretores ?? []
  const tarefas       = graficos?.tarefas        ?? {}

  const temFin    = FIN_ROLES.includes(user?.role)
  const isGestor  = GESTOR_ROLES.includes(user?.role)
  const temNegocios = meses.some(m => m.vendas > 0 || m.alugueis > 0)

  return (
    <div className="animate__animated animate__fadeIn">

      {/* Greeting */}
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">
          Olá, <span className="text-primary">{user?.nome?.split('—')[0].trim()}</span> 👋
        </h4>
        <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
          {user?.tenant_nome} · <span>{ROLE_LABELS[user?.role]}</span>
        </p>
      </div>

      {loading ? (
        <div className="row g-3 mb-4">
          {[0,1,2,3].map(i => <div key={i} className="col-6 col-md-3"><Skeleton /></div>)}
        </div>
      ) : dados && (
        <div>

          {/* KPIs Operacionais */}
          <SectionTitle cor="#3b82f6">Operacional</SectionTitle>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <KpiCard label="Imóveis" Icon={Building2} accent="#3b82f6"
                countTarget={im.total ?? 0}
                sub={`${im.disponiveis ?? 0} disponíveis`}
                onClick={() => navigate('/imoveis')} />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard label="Clientes" Icon={Users} accent="#7c3aed"
                countTarget={cl.total ?? 0}
                sub={cl.novos_mes > 0 ? `+${cl.novos_mes} este mês` : 'nenhum novo este mês'}
                onClick={() => navigate('/clientes')} />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard label="Em andamento" Icon={FileText} accent="#d97706" textColor="#b45309"
                countTarget={pr.pendentes ?? 0}
                sub={`${pr.aprovadas_mes ?? 0} aprovadas este mês`}
                onClick={() => navigate('/propostas')} />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard label="Contratos ativos" Icon={ScrollText} accent="#16a34a"
                countTarget={ct.ativos ?? 0}
                sub={ct.vencem_30_dias > 0 ? `⚠ ${ct.vencem_30_dias} vencem em 30 dias` : 'nenhum a vencer'}
                onClick={() => navigate('/contratos')} />
            </div>
          </div>

          {/* KPIs Financeiros */}
          {fin && (
            <>
              <SectionTitle cor="#22c55e">Financeiro — mês atual</SectionTitle>
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <KpiCard label="Receitas pagas" Icon={TrendingUp} accent="#16a34a"
                    valor={moeda(fin.receitas_mes)} onClick={() => navigate('/financeiro')} />
                </div>
                <div className="col-6 col-md-3">
                  <KpiCard label="Despesas pagas" Icon={TrendingDown} accent="#dc2626"
                    valor={moeda(fin.despesas_mes)} onClick={() => navigate('/financeiro')} />
                </div>
                <div className="col-6 col-md-3">
                  <KpiCard label="Saldo do mês" Icon={Wallet}
                    accent={fin.saldo_mes >= 0 ? '#2563eb' : '#dc2626'}
                    valor={moeda(fin.saldo_mes)} onClick={() => navigate('/financeiro')} />
                </div>
                <div className="col-6 col-md-3">
                  <KpiCard label="A receber" Icon={Clock} accent="#ea580c"
                    valor={moeda(fin.a_receber)}
                    sub={fin.total_atrasados > 0 ? `⚠ ${fin.total_atrasados} em atraso` : undefined}
                    onClick={() => navigate('/financeiro')} />
                </div>
              </div>
            </>
          )}

          {/* Gráficos */}
          {graficos && (
            <>
              <SectionTitle cor="#6366f1">Análise visual</SectionTitle>
              <div className="row g-3 mb-3">

                {/* Receitas vs Despesas */}
                {temFin && meses.length > 0 && (
                  <div className="col-12 col-lg-8">
                    <div className="card shadow-sm border-0 rounded-4 p-4"
                      onClick={() => navigate('/financeiro')} style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <h6 className="fw-semibold text-dark mb-0">Receitas vs Despesas — últimos 6 meses</h6>
                        <ArrowRight size={13} className="text-muted" />
                      </div>
                      <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={meses} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                            tickFormatter={v => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`} />
                          <Tooltip content={<TooltipEscuro />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={30} />
                          <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Imóveis por status */}
                <div className={`col-12 ${temFin && meses.length > 0 ? 'col-lg-4' : 'col-lg-4'}`}>
                  <div className="card shadow-sm border-0 rounded-4 p-4 h-100"
                    onClick={() => navigate('/imoveis')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <h6 className="fw-semibold text-dark mb-0">Imóveis por status</h6>
                      <ArrowRight size={13} className="text-muted" />
                    </div>
                    {imoveisPie.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={170}>
                          <PieChart>
                            <Pie data={imoveisPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                              dataKey="value" paddingAngle={3}>
                              {imoveisPie.map((_, i) => <Cell key={i} fill={CORES_IMOVEIS[i % CORES_IMOVEIS.length]} />)}
                            </Pie>
                            <Tooltip content={<TooltipEscuro />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="d-flex flex-wrap gap-2 justify-content-center mt-2">
                          {imoveisPie.map((item, i) => (
                            <div key={item.name} className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              <div className="rounded-circle" style={{ width: '8px', height: '8px', background: CORES_IMOVEIS[i % CORES_IMOVEIS.length] }} />
                              {item.name} <strong>({item.value})</strong>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '140px' }}>Sem dados</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Negócios fechados + Funil + Tarefas */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-lg-8">
                  <div className="card shadow-sm border-0 rounded-4 p-4"
                    onClick={() => navigate('/contratos')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <h6 className="fw-semibold text-dark mb-0">Negócios fechados — últimos 6 meses</h6>
                      <ArrowRight size={13} className="text-muted" />
                    </div>
                    {temNegocios ? (
                      <ResponsiveContainer width="100%" height={210}>
                        <AreaChart data={meses}>
                          <defs>
                            <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<TooltipEscuro />} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Area type="monotone" dataKey="vendas"   name="Vendas"   stroke="#3b82f6" strokeWidth={2} fill="url(#gV)" dot={{ r: 3, fill: '#3b82f6' }} />
                          <Area type="monotone" dataKey="alugueis" name="Aluguéis" stroke="#f97316" strokeWidth={2} fill="url(#gA)" dot={{ r: 3, fill: '#f97316' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ minHeight: '180px' }}>
                        <FileText size={32} strokeWidth={1} />
                        <span className="mt-2 small">Nenhum negócio fechado nos últimos 6 meses</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-lg-4 d-flex flex-column gap-3">
                  {/* Funil */}
                  <div className="card shadow-sm border-0 rounded-4 p-4"
                    onClick={() => navigate('/propostas')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold text-dark mb-0">Situação de negócios</h6>
                      <ArrowRight size={13} className="text-muted" />
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {funil.map((item, i) => (
                        <div key={item.name} className="d-flex align-items-center gap-3">
                          <div className="rounded-circle" style={{ width: '8px', height: '8px', background: CORES_FUNIL[i], flexShrink: 0 }} />
                          <span className="text-muted flex-grow-1" style={{ fontSize: '0.77rem' }}>{item.name}</span>
                          <span className="fw-bold" style={{ color: CORES_FUNIL[i], fontSize: '0.9rem' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tarefas */}
                  {Object.keys(tarefas).length > 0 && <TarefasWidget tarefas={tarefas} onNavigate={() => navigate('/tarefas')} />}
                </div>
              </div>

              {/* Top Corretores */}
              {isGestor && topCorretores.length > 0 && (
                <div className="card shadow-sm border-0 rounded-4 p-4 mb-3"
                  onClick={() => navigate('/relatorios')} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{ width: '28px', height: '28px', background: '#fef3c7' }}>
                        <Award size={14} style={{ color: '#d97706' }} />
                      </div>
                      <h6 className="fw-semibold text-dark mb-0">Top Corretores — negócios fechados</h6>
                    </div>
                    <ArrowRight size={13} className="text-muted" />
                  </div>
                  <ResponsiveContainer width="100%" height={topCorretores.length * 44 + 20}>
                    <BarChart data={topCorretores} layout="vertical" barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip content={<TooltipEscuro />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="vendas"   name="Vendas"   fill="#3b82f6" radius={[0,4,4,0]} />
                      <Bar dataKey="alugueis" name="Aluguéis" fill="#f97316" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Próximos compromissos */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <SectionTitle cor="#f59e0b">Próximos compromissos</SectionTitle>
            <button className="btn btn-link text-primary p-0 d-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem' }} onClick={() => navigate('/agenda')}>
              Ver todos <ArrowRight size={12} />
            </button>
          </div>

          {agenda.length === 0 ? (
            <div className="card shadow-sm border-0 rounded-4 p-5 text-center text-muted">
              <p className="mb-1">Nenhum compromisso agendado.</p>
              <button className="btn btn-link p-0 text-primary" onClick={() => navigate('/agenda')}>Agendar agora</button>
            </div>
          ) : (
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              {agenda.map((a, idx) => (
                <div key={a.id}
                  className={`d-flex align-items-center gap-3 px-4 py-3 agenda-item ${idx < agenda.length - 1 ? 'border-bottom' : ''}`}
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => navigate('/agenda')}
                  onMouseEnter={e => e.currentTarget.classList.add('bg-light')}
                  onMouseLeave={e => e.currentTarget.classList.remove('bg-light')}>
                  <div className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '36px', background: '#eff6ff', fontSize: '1rem', flexShrink: 0 }}>
                    {ICONE_AGENDA[a.tipo] ?? '📋'}
                  </div>
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="fw-semibold text-dark mb-0 text-truncate" style={{ fontSize: '0.88rem' }}>{a.titulo}</p>
                    <p className="text-muted mb-0" style={{ fontSize: '0.72rem' }}>
                      {TIPO_AGENDA[a.tipo]} · {dataHora(a.data_hora)}
                      {a.cliente_nome && <> · {a.cliente_nome}</>}
                    </p>
                  </div>
                  <ArrowRight size={13} className="text-muted flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
