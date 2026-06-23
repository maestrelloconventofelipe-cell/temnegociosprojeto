import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { Wallet, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

const STATUS_LIST   = ['pendente','pago','atrasado','cancelado']
const STATUS_LABELS = { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado' }
const STATUS_CORES  = {
  pendente:  'bg-yellow-100 text-yellow-700',
  pago:      'bg-green-100 text-green-700',
  atrasado:  'bg-red-100 text-red-600',
  cancelado: 'bg-gray-100 text-gray-500',
}

function moeda(v) { return v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00' }
function data(d)  { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'
const BTN_EDIT   = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors'
const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'

export default function FinanceiroList() {
  const hoje = new Date()
  const [lancamentos, setLancamentos] = useState([])
  const [resumo, setResumo] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const podeEditar = ['administrador_matriz','diretor_regional','franqueado','financeiro'].includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo)   params.tipo   = filtroTipo
      if (filtroStatus) params.status = filtroStatus
      if (mes)          params.mes    = mes
      if (ano)          params.ano    = ano
      const [lista, res] = await Promise.all([
        api.get('/financeiro', { params }),
        api.get('/financeiro/resumo'),
      ])
      setLancamentos(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar dados financeiros.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo, filtroStatus, mes, ano])

  async function remover(id) {
    const ok = await confirm('Remover este lançamento?', { title: 'Remover lançamento', danger: true, confirmText: 'Sim, remover' })
    if (!ok) return
    try {
      await api.delete(`/financeiro/${id}`)
      setLancamentos(prev => prev.filter(l => l.id !== id))
      toast('Lançamento removido.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const kpis = resumo ? [
    { label: 'Receitas pagas',  valor: resumo.total_receitas, accent: '#16a34a', cor: 'text-green-600' },
    { label: 'Despesas pagas',  valor: resumo.total_despesas, accent: '#dc2626', cor: 'text-red-600' },
    { label: 'Saldo',           valor: resumo.saldo,          accent: resumo.saldo >= 0 ? '#1d4ed8' : '#dc2626', cor: resumo.saldo >= 0 ? 'text-blue-700' : 'text-red-700' },
    { label: 'A receber',       valor: resumo.a_receber,      accent: '#22c55e', cor: 'text-green-500' },
    { label: 'A pagar',         valor: resumo.a_pagar,        accent: '#f97316', cor: 'text-orange-500' },
  ] : []

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Financeiro</h1>
            <p className="text-xs text-gray-400">{lancamentos.length} lançamento(s)</p>
          </div>
        </div>
        {podeEditar && (
          <Link to="/financeiro/novo" className="btn-primary flex items-center gap-2 text-sm">
            + Novo lançamento
          </Link>
        )}
      </div>

      {/* KPI cards */}
      {resumo && (
        <div className="grid grid-cols-5 gap-3 mb-4">
          {kpis.map(k => (
            <div key={k.label} className="card overflow-hidden">
              <div className="h-0.5" style={{ backgroundColor: k.accent }} />
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-lg font-bold ${k.cor}`}>{moeda(k.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerta de atrasos */}
      {resumo?.total_atrasados > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={16} className="shrink-0" />
          <span><strong>{resumo.total_atrasados}</strong> lançamento(s) em atraso</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {['','receita','despesa'].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                filtroTipo === t
                  ? t === 'receita' ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : t === 'despesa' ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {t === 'receita' && <TrendingUp size={12} />}
              {t === 'despesa' && <TrendingDown size={12} />}
              {t === '' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={SEL}>
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={mes} onChange={e => setMes(e.target.value)} className={SEL}>
          <option value="">Todos os meses</option>
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={ano} onChange={e => setAno(e.target.value)} className={SEL}>
          <option value="">Todos os anos</option>
          {[hoje.getFullYear()-1, hoje.getFullYear(), hoje.getFullYear()+1].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
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
        ) : lancamentos.length === 0 ? (
          <div className="p-16 text-center">
            <Wallet size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum lançamento encontrado.</p>
            {podeEditar && <Link to="/financeiro/novo" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Criar o primeiro</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Tipo','Categoria','Descrição','Valor','Vencimento','Pagamento','Status','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lancamentos.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${l.tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {l.tipo === 'receita' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {l.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{l.categoria || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-800 font-medium">{l.descricao || '—'}</td>
                    <td className={`px-4 py-3.5 font-semibold ${l.tipo === 'receita' ? 'text-green-700' : 'text-red-600'}`}>
                      {moeda(l.valor)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{data(l.data_vencimento)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(l.data_pagamento)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CORES[l.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {podeEditar && (
                        <div className="flex gap-2">
                          <Link to={`/financeiro/${l.id}/editar`} className={BTN_EDIT}>Editar</Link>
                          <button onClick={() => remover(l.id)} className={BTN_DANGER}>Remover</button>
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
