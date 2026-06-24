import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import {
  Palmtree, RefreshCw, CalendarRange,
  Users, UserCheck, Moon, AlertCircle,
} from 'lucide-react'

const STATUS_LIST   = ['reservada','confirmada','finalizada','cancelada']
const STATUS_LABELS = { reservada: 'Reservada', confirmada: 'Confirmada', finalizada: 'Finalizada', cancelada: 'Cancelada' }
const STATUS_CORES  = {
  reservada:  'bg-blue-100 text-blue-700',
  confirmada: 'bg-green-100 text-green-700',
  finalizada: 'bg-gray-100 text-gray-600',
  cancelada:  'bg-red-100 text-red-500',
}
const STATUS_ACCENT = {
  reservada:  '#2563eb',
  confirmada: '#16a34a',
  finalizada: '#6b7280',
  cancelada:  '#ef4444',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function dataBr(d) { return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—' }

const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'
const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'

const ROLES_OPERAR = ['administrador_matriz','diretor_regional','franqueado','corretor','captador']

export default function TemporadasList() {
  const { user } = useAuth()
  const [temporadas, setTemporadas] = useState([])
  const [resumo, setResumo]         = useState(null)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState('')
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const podeOperar = ROLES_OPERAR.includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroStatus) params.status = filtroStatus
      const [lista, res] = await Promise.all([
        api.get('/temporadas', { params }),
        api.get('/temporadas/resumo'),
      ])
      setTemporadas(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar temporadas.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroStatus])

  async function alterarStatus(t, novoStatus) {
    try {
      await api.put(`/temporadas/${t.id}`, { status: novoStatus })
      setTemporadas(prev => prev.map(x => x.id === t.id ? { ...x, status: novoStatus } : x))
      toast(`Status alterado para "${STATUS_LABELS[novoStatus]}".`, 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao alterar status.', 'error') }
  }

  async function remover(t) {
    const ok = await confirm(
      `Remover a reserva de "${t.imovel_titulo || 'imóvel'}"? Comissões associadas também serão removidas.`,
      { title: 'Remover temporada', danger: true, confirmText: 'Sim, remover' }
    )
    if (!ok) return
    try {
      await api.delete(`/temporadas/${t.id}`)
      setTemporadas(prev => prev.filter(x => x.id !== t.id))
      toast('Temporada removida.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const kpis = resumo ? [
    { label: 'Reservas ativas',   valor: Number(resumo.reservadas) + Number(resumo.confirmadas), accent: '#2563eb', cor: 'text-blue-700',   fmt: 'n' },
    { label: 'Total de noites',   valor: resumo.total_noites,  accent: '#7c3aed', cor: 'text-purple-600', fmt: 'n' },
    { label: 'Receita bruta',     valor: resumo.valor_total,   accent: '#16a34a', cor: 'text-green-600',  fmt: 'R$' },
    { label: 'Taxa do anfitrião', valor: resumo.taxa_total,    accent: '#ca8a04', cor: 'text-yellow-600', fmt: 'R$' },
  ] : []

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <Palmtree size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Temporadas</h1>
            <p className="text-xs text-gray-400">{temporadas.length} reserva(s)</p>
          </div>
        </div>
        {podeOperar && (
          <Link to="/temporadas/nova" className="btn-primary flex items-center gap-2 text-sm">
            + Nova reserva
          </Link>
        )}
      </div>

      {/* KPI cards */}
      {resumo && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {kpis.map(k => (
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
      )}

      {/* Filtros por status */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {['', ...STATUS_LIST].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === s
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === '' ? 'Todas' : STATUS_LABELS[s]}
              {resumo && s !== '' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({resumo[`${s}s`] ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={carregar}
          className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Atualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : temporadas.length === 0 ? (
          <div className="p-16 text-center">
            <Palmtree size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma reserva encontrada.</p>
            {podeOperar && (
              <Link to="/temporadas/nova" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                Criar a primeira reserva
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {temporadas.map(t => {
              const accent = STATUS_ACCENT[t.status] ?? '#6b7280'
              const passada = t.status === 'reservada' && new Date(t.data_fim + 'T23:59:59') < new Date()
              return (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">

                  {/* Ícone de status */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accent}15` }}>
                    <Palmtree size={18} style={{ color: accent }} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{t.imovel_titulo || 'Imóvel'}</span>
                      {t.imovel_cidade && <span className="text-xs text-gray-400">{t.imovel_cidade}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CORES[t.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                      {passada && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                          <AlertCircle size={11} /> Expirada
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarRange size={11} />
                        {dataBr(t.data_inicio)} → {dataBr(t.data_fim)}
                        <span className="text-gray-400 ml-1">({t.noites ?? 0} noite(s))</span>
                      </span>
                      {t.cliente_nome && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {t.cliente_nome}
                        </span>
                      )}
                      {t.corretor_nome && (
                        <span className="flex items-center gap-1">
                          <UserCheck size={11} /> {t.corretor_nome}
                        </span>
                      )}
                    </div>

                    {/* Valores */}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Moon size={11} className="text-gray-400" />
                        <span className="text-gray-500">{moeda(t.valor_diaria)}/noite</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400">Total: </span>
                        <span className="font-semibold text-gray-700">{moeda(t.valor_total)}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400">Taxa ({t.taxa_anfitriao_percentual}%): </span>
                        <span className="font-semibold text-yellow-600">{moeda(t.taxa_anfitriao_valor)}</span>
                      </div>
                    </div>

                    {/* Botões de status */}
                    {podeOperar && t.status !== 'finalizada' && t.status !== 'cancelada' && (
                      <div className="flex gap-2 mt-2">
                        {t.status === 'reservada' && (
                          <button onClick={() => alterarStatus(t, 'confirmada')}
                            className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-colors">
                            Confirmar
                          </button>
                        )}
                        {t.status === 'confirmada' && (
                          <button onClick={() => alterarStatus(t, 'finalizada')}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                            Finalizar
                          </button>
                        )}
                        <button onClick={() => alterarStatus(t, 'cancelada')}
                          className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors">
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {podeOperar && (
                      <Link to={`/temporadas/${t.id}/editar`}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors">
                        Editar
                      </Link>
                    )}
                    {podeOperar && t.status !== 'confirmada' && (
                      <button onClick={() => remover(t)} className={BTN_DANGER}>Remover</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
