import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { BadgeDollarSign, RefreshCw, CheckCircle2 } from 'lucide-react'

const STATUS_LABELS = { pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' }
const STATUS_CORES  = {
  pendente:  'bg-yellow-100 text-yellow-700',
  pago:      'bg-green-100 text-green-700',
  cancelado: 'bg-gray-100 text-gray-500',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function data(d)  { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

const ROLES_VER_TUDO = ['administrador_matriz','diretor_regional','franqueado','financeiro']
const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'

export default function ComissoesList() {
  const { user } = useAuth()
  const [comissoes, setComissoes] = useState([])
  const [resumo, setResumo] = useState(null)
  const [corretores, setCorretores] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCorretor, setFiltroCorretor] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const verTudo = ROLES_VER_TUDO.includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroStatus)   params.status     = filtroStatus
      if (filtroCorretor) params.usuario_id = filtroCorretor
      const [lista, res] = await Promise.all([
        api.get('/comissoes', { params }),
        api.get('/comissoes/resumo'),
      ])
      setComissoes(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar comissões.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => {
    if (verTudo) api.get('/corretores').then(r => setCorretores(r.data)).catch(() => {})
    carregar()
  }, [filtroStatus, filtroCorretor])

  async function pagar(id) {
    const ok = await confirm('Marcar esta comissão como paga?', { title: 'Confirmar pagamento', confirmText: 'Sim, marcar pago' })
    if (!ok) return
    try {
      await api.put(`/comissoes/${id}`, { status: 'pago' })
      toast('Comissão marcada como paga!', 'success')
      carregar()
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao atualizar.', 'error') }
  }

  async function remover(id) {
    const ok = await confirm('Remover esta comissão?', { title: 'Remover comissão', danger: true, confirmText: 'Sim, remover' })
    if (!ok) return
    try {
      await api.delete(`/comissoes/${id}`)
      setComissoes(prev => prev.filter(c => c.id !== id))
      toast('Comissão removida.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const kpis = resumo ? [
    { label: 'Total gerado',    valor: resumo.total_valor,    accent: '#2563eb', cor: 'text-gray-800' },
    { label: 'Já pago',         valor: resumo.total_pago,     accent: '#16a34a', cor: 'text-green-600' },
    { label: 'Pendente',        valor: resumo.total_pendente, accent: '#ca8a04', cor: 'text-yellow-600' },
  ] : []

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <BadgeDollarSign size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Comissões</h1>
            <p className="text-xs text-gray-400">{resumo?.total ?? 0} registro(s)</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {resumo && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {kpis.map(k => (
            <div key={k.label} className="card overflow-hidden">
              <div className="h-0.5" style={{ backgroundColor: k.accent }} />
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.cor}`}>{moeda(k.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={SEL}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {verTudo && corretores.length > 0 && (
          <select value={filtroCorretor} onChange={e => setFiltroCorretor(e.target.value)} className={SEL}>
            <option value="">Todos os corretores</option>
            {corretores.map(c => <option key={c.id} value={c.user_id}>{c.nome}</option>)}
          </select>
        )}
        <button onClick={carregar} className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Atualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-2.5">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-11 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : comissoes.length === 0 ? (
          <div className="p-16 text-center">
            <BadgeDollarSign size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma comissão encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Imóvel','Beneficiário','Tipo','% / Valor negócio','Comissão','Registrado','Status','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {comissoes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{c.imovel_titulo || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-600">{c.usuario_nome || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-500 capitalize text-xs">{c.tipo_operacao || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-600">
                      <span className="font-medium">{c.percentual}%</span>
                      <span className="text-gray-400 ml-1">/ {moeda(c.valor_operacao)}</span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-green-700">{moeda(c.valor_comissao)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(c.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CORES[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {verTudo && c.status === 'pendente' && (
                        <button onClick={() => pagar(c.id)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-colors flex items-center gap-1">
                          <CheckCircle2 size={12} /> Marcar pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
