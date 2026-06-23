import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  CheckSquare, RefreshCw, Clock, AlertTriangle,
  CalendarDays, User, CheckCheck, Circle, Loader, XCircle, Plus,
} from 'lucide-react'

const STATUS = {
  pendente:     { label: 'Pendente',     cor: 'bg-yellow-100 text-yellow-700', border: 'border-l-yellow-400', icon: Circle,    btn: 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' },
  em_andamento: { label: 'Em andamento', cor: 'bg-blue-100 text-blue-700',     border: 'border-l-blue-400',   icon: Loader,    btn: 'border-blue-200 text-blue-600 hover:bg-blue-50' },
  concluida:    { label: 'Concluída',    cor: 'bg-green-100 text-green-700',   border: 'border-l-green-400',  icon: CheckCheck, btn: 'border-green-200 text-green-600 hover:bg-green-50' },
  cancelada:    { label: 'Cancelada',    cor: 'bg-gray-100 text-gray-500',     border: 'border-l-gray-300',   icon: XCircle,   btn: 'border-gray-200 text-gray-500 hover:bg-gray-50' },
}

const PROXIMOS_STATUS = {
  pendente:     'em_andamento',
  em_andamento: 'concluida',
}

const ROLES_GESTOR = ['administrador_matriz','diretor_regional','franqueado']

function dataBr(d) { return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—' }
function horaBr(h) { return h ? h.slice(0, 5) : '' }

function isAtrasada(t) {
  return !['concluida','cancelada'].includes(t.status) && new Date(t.data + 'T23:59:59') < new Date()
}

export default function TarefasList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [tarefas, setTarefas]     = useState([])
  const [resumo, setResumo]       = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [apenasMinhas, setApenasMinhas] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]           = useState('')

  const isGestor = ROLES_GESTOR.includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      if (apenasMinhas) params.apenas_minhas = 'true'
      const [lista, res] = await Promise.all([
        api.get('/tarefas', { params }),
        api.get('/tarefas/resumo'),
      ])
      setTarefas(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar tarefas.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroStatus, apenasMinhas])

  async function avancarStatus(t) {
    const proximo = PROXIMOS_STATUS[t.status]
    if (!proximo) return
    try {
      await api.patch(`/tarefas/${t.id}/status`, { status: proximo })
      setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, status: proximo } : x))
      toast(`Tarefa marcada como "${STATUS[proximo].label}".`, 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro.', 'error') }
  }

  async function cancelar(t) {
    try {
      await api.patch(`/tarefas/${t.id}/status`, { status: 'cancelada' })
      setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, status: 'cancelada' } : x))
      toast('Tarefa cancelada.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro.', 'error') }
  }

  async function remover(t) {
    const ok = await confirm(
      `Remover a tarefa "${t.titulo}"?`,
      { title: 'Remover tarefa', danger: true, confirmText: 'Sim, remover' }
    )
    if (!ok) return
    try {
      await api.delete(`/tarefas/${t.id}`)
      setTarefas(prev => prev.filter(x => x.id !== t.id))
      toast('Tarefa removida.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const kpis = resumo ? [
    { label: 'Pendentes',     valor: resumo.pendentes,    accent: '#ca8a04', cor: 'text-yellow-600' },
    { label: 'Em andamento',  valor: resumo.em_andamento, accent: '#2563eb', cor: 'text-blue-700'   },
    { label: 'Concluídas',    valor: resumo.concluidas,   accent: '#16a34a', cor: 'text-green-600'  },
    { label: 'Atrasadas',     valor: resumo.atrasadas,    accent: '#dc2626', cor: 'text-red-600'    },
  ] : []

  // Agrupa por data para exibição
  const grupos = useMemo(() => {
    const map = {}
    tarefas.forEach(t => {
      const key = t.data
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [tarefas])

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <CheckSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Tarefas</h1>
            <p className="text-xs text-gray-400">{tarefas.length} tarefa(s)</p>
          </div>
        </div>
        <Link to="/tarefas/nova" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Nova tarefa
        </Link>
      </div>

      {/* KPIs */}
      {resumo && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {kpis.map(k => (
            <div key={k.label} className="card overflow-hidden">
              <div className="h-0.5" style={{ backgroundColor: k.accent }} />
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.cor}`}>{k.valor ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerta atrasadas */}
      {resumo?.atrasadas > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={15} className="shrink-0" />
          <span>Você tem <strong>{resumo.atrasadas}</strong> tarefa(s) em atraso.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: '', label: 'Todas' }, ...Object.entries(STATUS).map(([v, s]) => ({ value: v, label: s.label }))].map(({ value, label }) => (
            <button key={value} onClick={() => setFiltroStatus(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === value
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {label}
              {resumo && value !== '' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({resumo[value === 'em_andamento' ? 'em_andamento' : value + 's'] ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {isGestor && (
          <button onClick={() => setApenasMinhas(p => !p)}
            className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              apenasMinhas
                ? 'bg-blue-800 text-white border-blue-800'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            Minhas tarefas
          </button>
        )}

        <button onClick={carregar}
          className={`${isGestor ? '' : 'ml-auto'} text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100`}
          title="Atualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Lista agrupada por data */}
      {carregando ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : erro ? (
        <div className="card p-12 text-center text-red-500 text-sm">{erro}</div>
      ) : tarefas.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckSquare size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma tarefa encontrada.</p>
          <Link to="/tarefas/nova" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
            Criar a primeira tarefa
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {grupos.map(([data, items]) => {
            const isHoje = data === hoje
            const isPassado = data < hoje
            return (
              <div key={data}>
                {/* Cabeçalho do grupo de data */}
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={13} className={isHoje ? 'text-blue-600' : isPassado ? 'text-red-400' : 'text-gray-400'} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    isHoje ? 'text-blue-700' : isPassado ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {isHoje ? 'Hoje' : dataBr(data)}
                  </span>
                  {isPassado && <span className="text-[10px] text-red-400 font-medium">— atrasado</span>}
                  <div className="flex-1 h-px bg-gray-100 ml-1" />
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>

                <div className="space-y-2">
                  {items.map(t => {
                    const st = STATUS[t.status] ?? STATUS.pendente
                    const StIcon = st.icon
                    const atrasada = isAtrasada(t)
                    const proximo  = PROXIMOS_STATUS[t.status]
                    return (
                      <div key={t.id}
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 ${st.border} flex items-start gap-4 px-5 py-4 hover:shadow-md transition-shadow ${
                          t.status === 'concluida' ? 'opacity-60' : ''
                        }`}>

                        {/* Ícone de status */}
                        <div className="mt-0.5 shrink-0">
                          <StIcon size={16} className={
                            t.status === 'pendente'     ? 'text-yellow-500' :
                            t.status === 'em_andamento' ? 'text-blue-500 animate-spin' :
                            t.status === 'concluida'    ? 'text-green-500' : 'text-gray-400'
                          } style={t.status === 'em_andamento' ? { animationDuration: '3s' } : {}} />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className={`font-semibold text-sm ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {t.titulo}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cor}`}>
                              {st.label}
                            </span>
                            {atrasada && (
                              <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                                <AlertTriangle size={10} /> Atrasada
                              </span>
                            )}
                          </div>

                          {t.descricao && <p className="text-xs text-gray-500 mb-1">{t.descricao}</p>}
                          {t.obs && <p className="text-xs text-gray-400 line-clamp-1">{t.obs}</p>}

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {horaBr(t.hora)}
                            </span>
                            {t.usuario_nome && (
                              <span className="flex items-center gap-1">
                                <User size={11} /> {t.usuario_nome}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {proximo && (
                            <button onClick={() => avancarStatus(t)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${st.btn}`}>
                              {proximo === 'em_andamento' ? 'Iniciar' : 'Concluir'}
                            </button>
                          )}
                          {!['concluida','cancelada'].includes(t.status) && (
                            <button onClick={() => cancelar(t)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 font-medium transition-colors">
                              Cancelar
                            </button>
                          )}
                          <Link to={`/tarefas/${t.id}/editar`}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors text-center">
                            Editar
                          </Link>
                          <button onClick={() => remover(t)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors">
                            Remover
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
