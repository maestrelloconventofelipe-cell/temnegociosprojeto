import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  CalendarDays, RefreshCw, Clock, Building2, User,
  AlertCircle, Home, Users,
} from 'lucide-react'

const TIPOS   = ['visita','reuniao','ligacao','assinatura','vistoria','outro']
const STATUS  = ['agendado','realizado','cancelado']
const TIPO_LABELS   = { visita: 'Visita', reuniao: 'Reunião', ligacao: 'Ligação', assinatura: 'Assinatura', vistoria: 'Vistoria', outro: 'Outro' }
const STATUS_LABELS = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado' }
const STATUS_CORES  = {
  agendado:  'bg-blue-100 text-blue-700',
  realizado: 'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-500',
}
const TIPO_ICONES = { visita: '🏠', reuniao: '👥', ligacao: '📞', assinatura: '✍️', vistoria: '🔍', outro: '📋' }
const TIPO_ACCENT = { visita: '#2563eb', reuniao: '#7c3aed', ligacao: '#0891b2', assinatura: '#059669', vistoria: '#d97706', outro: '#6b7280' }

function dataHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'
const BTN_EDIT   = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors'
const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'

export default function AgendaList() {
  const [compromissos, setCompromissos] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo)   params.tipo   = filtroTipo
      if (filtroStatus) params.status = filtroStatus
      const res = await api.get('/agenda', { params })
      setCompromissos(res.data)
    } catch { setErro('Erro ao carregar agenda.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo, filtroStatus])

  async function remover(id) {
    const ok = await confirm('Remover este compromisso?', { title: 'Remover compromisso', danger: true, confirmText: 'Sim, remover' })
    if (!ok) return
    try {
      await api.delete(`/agenda/${id}`)
      setCompromissos(prev => prev.filter(c => c.id !== id))
      toast('Compromisso removido.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const hoje = compromissos.filter(c => {
    const d = new Date(c.data_hora)
    const n = new Date()
    return d.toDateString() === n.toDateString() && c.status === 'agendado'
  })

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <CalendarDays size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Agenda</h1>
            <p className="text-xs text-gray-400">{compromissos.length} compromisso(s)</p>
          </div>
        </div>
        <Link to="/agenda/novo" className="btn-primary flex items-center gap-2 text-sm">
          + Novo compromisso
        </Link>
      </div>

      {/* Alerta de hoje */}
      {hoje.length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl px-4 py-3 mb-4">
          <CalendarDays size={16} className="shrink-0" />
          <span>Você tem <strong>{hoje.length}</strong> compromisso(s) agendado(s) para hoje.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={SEL}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
        <div className="flex gap-1.5">
          {['', ...STATUS].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === s ? 'bg-blue-800 text-white border-blue-800 shadow-sm' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === '' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button onClick={carregar} className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Atualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : compromissos.length === 0 ? (
          <div className="p-16 text-center">
            <CalendarDays size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum compromisso encontrado.</p>
            <Link to="/agenda/novo" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Agendar o primeiro</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {compromissos.map(c => {
              const passado = new Date(c.data_hora) < new Date() && c.status === 'agendado'
              const accent = TIPO_ACCENT[c.tipo] ?? '#6b7280'
              return (
                <div key={c.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors ${passado ? 'bg-red-50/20' : ''}`}>
                  {/* Ícone do tipo */}
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${accent}15` }}>
                    {TIPO_ICONES[c.tipo] ?? '📋'}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{c.titulo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CORES[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      {passado && (
                        <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                          <AlertCircle size={11} /> Atrasado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                      <Clock size={11} />
                      {TIPO_LABELS[c.tipo]} · {dataHora(c.data_hora)}
                    </p>
                    {c.descricao && <p className="text-sm text-gray-500 truncate">{c.descricao}</p>}
                    <div className="flex gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                      {c.imovel_titulo && (
                        <span className="flex items-center gap-1"><Home size={11} /> {c.imovel_titulo}</span>
                      )}
                      {c.cliente_nome && (
                        <span className="flex items-center gap-1"><Users size={11} /> {c.cliente_nome}</span>
                      )}
                      {c.usuario_nome && (
                        <span className="flex items-center gap-1"><User size={11} /> {c.usuario_nome}</span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 shrink-0">
                    <Link to={`/agenda/${c.id}/editar`} className={BTN_EDIT}>Editar</Link>
                    <button onClick={() => remover(c.id)} className={BTN_DANGER}>Remover</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
