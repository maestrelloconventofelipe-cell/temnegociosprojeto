import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { ScrollText, RefreshCw } from 'lucide-react'

const TIPOS   = ['compra_venda','locacao','intermediacao']
const STATUS  = ['ativo','encerrado','cancelado','em_renovacao']
const TIPO_LABELS   = { compra_venda: 'Compra e venda', locacao: 'Locação', intermediacao: 'Intermediação' }
const STATUS_LABELS = { ativo: 'Ativo', encerrado: 'Encerrado', cancelado: 'Cancelado', em_renovacao: 'Em renovação' }
const STATUS_CORES  = {
  ativo:        'bg-green-100 text-green-700',
  encerrado:    'bg-gray-100 text-gray-500',
  cancelado:    'bg-red-100 text-red-600',
  em_renovacao: 'bg-yellow-100 text-yellow-700',
}

function moeda(v) { return v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—' }
function data(d)  { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'
const BTN_EDIT   = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors'
const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'

export default function ContratosList() {
  const [contratos, setContratos] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const podeEditar = ['administrador_matriz','diretor_regional','franqueado','juridico'].includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo)   params.tipo   = filtroTipo
      if (filtroStatus) params.status = filtroStatus
      const res = await api.get('/contratos', { params })
      setContratos(res.data)
    } catch { setErro('Erro ao carregar contratos.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo, filtroStatus])

  async function remover(id) {
    const ok = await confirm('Remover este contrato?', { title: 'Remover contrato', danger: true, confirmText: 'Sim, remover' })
    if (!ok) return
    try {
      await api.delete(`/contratos/${id}`)
      setContratos(prev => prev.filter(c => c.id !== id))
      toast('Contrato removido.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <ScrollText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Contratos</h1>
            <p className="text-xs text-gray-400">{contratos.length} registro(s)</p>
          </div>
        </div>
        {podeEditar && (
          <Link to="/contratos/novo" className="btn-primary flex items-center gap-2 text-sm">
            + Novo contrato
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={SEL}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={SEL}>
          <option value="">Todos os status</option>
          {STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
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
        ) : contratos.length === 0 ? (
          <div className="p-16 text-center">
            <ScrollText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum contrato encontrado.</p>
            {podeEditar && <Link to="/contratos/novo" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Criar o primeiro</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Imóvel','Cliente','Tipo','Valor','Início','Fim','Status','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contratos.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{c.imovel_titulo || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-600">{c.cliente_nome || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-600">{TIPO_LABELS[c.tipo] || c.tipo}</td>
                    <td className="px-4 py-3.5 text-gray-700 font-medium">{moeda(c.valor)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(c.data_inicio)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(c.data_fim)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CORES[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {podeEditar && (
                        <div className="flex gap-2">
                          <Link to={`/contratos/${c.id}/editar`} className={BTN_EDIT}>Editar</Link>
                          <button onClick={() => remover(c.id)} className={BTN_DANGER}>Remover</button>
                        </div>
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
