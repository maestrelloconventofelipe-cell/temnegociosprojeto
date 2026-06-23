import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  FileText, RefreshCw, Building2, User, DollarSign,
  UserCheck, ArrowRight, CheckCircle2, XCircle, Clock, AlertCircle,
} from 'lucide-react'

const STATUS_LIST = ['pendente','em_analise','aprovada','recusada','cancelada']
const STATUS = {
  pendente:   { label: 'Pendente',    cor: 'bg-yellow-100 text-yellow-700', accent: '#ca8a04', border: 'border-l-yellow-400', icon: Clock         },
  em_analise: { label: 'Em análise',  cor: 'bg-blue-100 text-blue-700',     accent: '#2563eb', border: 'border-l-blue-400',   icon: AlertCircle   },
  aprovada:   { label: 'Aprovada',    cor: 'bg-green-100 text-green-700',   accent: '#16a34a', border: 'border-l-green-400',  icon: CheckCircle2  },
  recusada:   { label: 'Recusada',    cor: 'bg-red-100 text-red-600',       accent: '#dc2626', border: 'border-l-red-400',    icon: XCircle       },
  cancelada:  { label: 'Cancelada',   cor: 'bg-gray-100 text-gray-500',     accent: '#9ca3af', border: 'border-l-gray-300',   icon: XCircle       },
}

const TIPO_COR = {
  compra:  'bg-blue-50 text-blue-700',
  locacao: 'bg-purple-50 text-purple-700',
  aluguel: 'bg-purple-50 text-purple-700',
  venda:   'bg-blue-50 text-blue-700',
}
const TIPO_LABEL = {
  compra: 'Compra', locacao: 'Locação', aluguel: 'Locação', venda: 'Compra',
}

function moeda(v) {
  return v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—'
}

export default function PropostasList() {
  const { user }    = useAuth()
  const { toast }   = useToast()
  const { confirm } = useConfirm()
  const navigate    = useNavigate()

  const [propostas, setPropostas]   = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState('')
  const [alterandoId, setAlterandoId] = useState(null)

  const podeEditar = ['administrador_matriz','diretor_regional','franqueado','corretor'].includes(user?.role)
  const podeGerar  = ['administrador_matriz','diretor_regional','franqueado','juridico'].includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      if (filtroTipo)   params.tipo   = filtroTipo
      const res = await api.get('/propostas', { params })
      setPropostas(res.data)
    } catch { setErro('Erro ao carregar propostas.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroStatus, filtroTipo])

  async function mudarStatus(p, novoStatus) {
    setAlterandoId(p.id)
    try {
      await api.patch(`/propostas/${p.id}/status`, { status: novoStatus, tipo: p.tipo })
      setPropostas(prev => prev.map(x => x.id === p.id ? { ...x, status: novoStatus } : x))
      toast(`Status alterado para "${STATUS[novoStatus]?.label}".`, 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao atualizar status.', 'error') }
    finally     { setAlterandoId(null) }
  }

  async function remover(p) {
    const ok = await confirm(
      `Remover a proposta de "${p.imovel_titulo || 'imóvel'}"?`,
      { title: 'Remover proposta', danger: true, confirmText: 'Sim, remover' }
    )
    if (!ok) return
    try {
      await api.delete(`/propostas/${p.id}`, { params: { tipo: p.tipo } })
      setPropostas(prev => prev.filter(x => x.id !== p.id))
      toast('Proposta removida.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  // KPIs
  const total       = propostas.length
  const aprovadas   = propostas.filter(p => p.status === 'aprovada').length
  const pendentes   = propostas.filter(p => p.status === 'pendente' || p.status === 'em_analise').length
  const valorTotal  = propostas.filter(p => p.status === 'aprovada').reduce((s, p) => s + Number(p.valor_proposto || 0), 0)

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Propostas</h1>
            <p className="text-xs text-gray-400">{total} proposta(s)</p>
          </div>
        </div>
        {podeEditar && (
          <Link to="/propostas/nova" className="btn-primary flex items-center gap-2 text-sm">
            + Nova proposta
          </Link>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',          valor: total,     accent: '#2563eb', fmt: 'n',  cor: 'text-blue-700'   },
          { label: 'Em negociação',  valor: pendentes, accent: '#ca8a04', fmt: 'n',  cor: 'text-yellow-600' },
          { label: 'Aprovadas',      valor: aprovadas, accent: '#16a34a', fmt: 'n',  cor: 'text-green-600'  },
          { label: 'Valor aprovado', valor: valorTotal,accent: '#7c3aed', fmt: 'R$', cor: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="card overflow-hidden">
            <div className="h-0.5" style={{ backgroundColor: k.accent }} />
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-1">{k.label}</p>
              <p className={`text-xl font-bold ${k.cor}`}>
                {k.fmt === 'R$' ? moeda(k.valor) : k.valor}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Status pills clicáveis */}
      <div className="card p-4 mb-4 flex flex-wrap gap-2 items-center">
        {[{ value: '', label: 'Todas' }, ...STATUS_LIST.map(s => ({ value: s, label: STATUS[s].label }))].map(({ value, label }) => (
          <button key={value} onClick={() => setFiltroStatus(value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filtroStatus === value
                ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {label}
            {value && <span className="ml-1.5 opacity-60">({propostas.filter(p => p.status === value).length})</span>}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm">
            <option value="">Compra + Locação</option>
            <option value="compra">Compra</option>
            <option value="locacao">Locação</option>
          </select>
          <button onClick={carregar}
            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Cards de propostas */}
      {carregando ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : erro ? (
        <div className="card p-12 text-center text-red-500 text-sm">{erro}</div>
      ) : propostas.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma proposta encontrada.</p>
          {podeEditar && (
            <Link to="/propostas/nova" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
              Criar a primeira proposta
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {propostas.map(p => {
            const st     = STATUS[p.status] ?? STATUS.pendente
            const StIcon = st.icon
            const tipo   = TIPO_LABEL[p.tipo] ?? p.tipo
            const tipoCor = TIPO_COR[p.tipo] ?? 'bg-gray-100 text-gray-600'
            return (
              <div key={p.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${st.border} flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow`}>

                {/* Ícone de status */}
                <div className="shrink-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${st.accent}18` }}>
                    <StIcon size={16} style={{ color: st.accent }} />
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{p.imovel_titulo || 'Imóvel'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tipoCor}`}>{tipo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cor}`}>{st.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    {p.cliente_nome && (
                      <span className="flex items-center gap-1">
                        <User size={11} /> {p.cliente_nome}
                      </span>
                    )}
                    {p.corretor_nome && (
                      <span className="flex items-center gap-1">
                        <UserCheck size={11} /> {p.corretor_nome}
                      </span>
                    )}
                    {p.valor_proposto && (
                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                        <DollarSign size={11} /> {moeda(p.valor_proposto)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Mudar status */}
                  {podeEditar && !['aprovada','recusada','cancelada'].includes(p.status) && (
                    <select
                      value={p.status}
                      disabled={alterandoId === p.id}
                      onChange={e => mudarStatus(p, e.target.value)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${st.cor}`}>
                      {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
                    </select>
                  )}

                  {/* Gerar contrato — só para aprovadas */}
                  {p.status === 'aprovada' && podeGerar && (
                    <Link to="/contratos/novo"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold transition-colors shadow-sm">
                      <ArrowRight size={12} /> Gerar contrato
                    </Link>
                  )}

                  {podeEditar && (
                    <button onClick={() => remover(p)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors">
                      Remover
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
