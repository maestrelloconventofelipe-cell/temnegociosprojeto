import { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import api from '../../api/client'
import {
  ReceiptText, RefreshCw, CheckCircle2, Sparkles,
  AlertTriangle, X, CalendarDays,
} from 'lucide-react'

const STATUS_LABELS = { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado' }
const STATUS_CORES  = {
  pendente:  'bg-yellow-100 text-yellow-700',
  pago:      'bg-green-100 text-green-700',
  atrasado:  'bg-red-100 text-red-600',
  cancelado: 'bg-gray-100 text-gray-500',
}

const MESES_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function data(d)  { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }
function mesLabel(ref) {
  if (!ref) return '—'
  const [y, m] = ref.split('-')
  return `${MESES_LABELS[parseInt(m) - 1]} ${y}`
}

const hoje = new Date()
const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'

export default function RoyaltiesList() {
  const [royalties, setRoyalties]  = useState([])
  const [resumo, setResumo]        = useState(null)
  const [franquias, setFranquias]  = useState([])
  const [filtroStatus, setFiltroStatus]     = useState('')
  const [filtroTenant, setFiltroTenant]     = useState('')
  const [filtroMes, setFiltroMes]           = useState('')
  const [filtroAno, setFiltroAno]           = useState(String(hoje.getFullYear()))
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]            = useState('')

  // Modal gerar
  const [modalGerar, setModalGerar]   = useState(false)
  const [gerandoMes, setGerandoMes]   = useState(String(hoje.getMonth() + 1))
  const [gerandoAno, setGerandoAno]   = useState(String(hoje.getFullYear()))
  const [gerando, setGerando]         = useState(false)

  // Pagamento inline
  const [pagandoId, setPagandoId]     = useState(null)
  const [dataPagto, setDataPagto]     = useState(hoje.toISOString().split('T')[0])
  const [salvandoPagto, setSalvandoPagto] = useState(false)

  const { toast } = useToast()

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroStatus) params.status    = filtroStatus
      if (filtroTenant) params.tenant_id = filtroTenant
      if (filtroMes)    params.mes       = filtroMes
      if (filtroAno)    params.ano       = filtroAno
      const [lista, res, tens] = await Promise.all([
        api.get('/royalties', { params }),
        api.get('/royalties/resumo'),
        api.get('/tenants'),
      ])
      setRoyalties(lista.data)
      setResumo(res.data)
      setFranquias(tens.data)
    } catch { setErro('Erro ao carregar royalties.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroStatus, filtroTenant, filtroMes, filtroAno])

  async function handleGerar() {
    setGerando(true)
    try {
      const r = await api.post('/royalties/gerar', { mes: gerandoMes, ano: gerandoAno })
      toast(r.data.mensagem, 'success')
      setModalGerar(false)
      carregar()
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao gerar royalties.', 'error') }
    finally { setGerando(false) }
  }

  async function handleBaixar(id) {
    setSalvandoPagto(true)
    try {
      await api.put(`/royalties/${id}/baixar`, { data_pagamento: dataPagto })
      toast('Royalty baixado com sucesso!', 'success')
      setPagandoId(null)
      carregar()
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao baixar.', 'error') }
    finally { setSalvandoPagto(false) }
  }

  const anos = [hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1]

  const kpis = resumo ? [
    { label: 'Valor total gerado', valor: resumo.valor_total,    accent: '#2563eb', cor: 'text-gray-800' },
    { label: 'Total pago',         valor: resumo.valor_pago,     accent: '#16a34a', cor: 'text-green-600' },
    { label: 'Pendente',           valor: resumo.valor_pendente, accent: '#ca8a04', cor: 'text-yellow-600' },
    { label: 'Total registros',    valor: resumo.total,          accent: '#6b7280', cor: 'text-gray-600', fmt: 'n' },
  ] : []

  return (
    <>

      {/* Modal gerar royalties */}
      {modalGerar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Sparkles size={17} className="text-emerald-600" />
                </div>
                <h2 className="font-bold text-gray-800">Gerar royalties</h2>
              </div>
              <button onClick={() => setModalGerar(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Calcula os royalties de todas as franquias ativas para o mês selecionado com base no faturamento validado.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="label">Mês</label>
                <select value={gerandoMes} onChange={e => setGerandoMes(e.target.value)} className="input">
                  {MESES_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ano</label>
                <select value={gerandoAno} onChange={e => setGerandoAno(e.target.value)} className="input">
                  {anos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalGerar(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={handleGerar} disabled={gerando}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Sparkles size={14} />
                {gerando ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <ReceiptText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Royalties</h1>
            <p className="text-xs text-gray-400">{royalties.length} registro(s)</p>
          </div>
        </div>
        <button onClick={() => setModalGerar(true)}
          className="btn-primary flex items-center gap-2 text-sm">
          <Sparkles size={14} />
          Gerar mês
        </button>
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
                  {k.fmt === 'n' ? k.valor : moeda(k.valor)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerta atrasados */}
      {resumo?.total_atrasados > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={16} className="shrink-0" />
          <span><strong>{resumo.total_atrasados}</strong> royalty(ies) em atraso.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filtroTenant} onChange={e => setFiltroTenant(e.target.value)} className={SEL}>
          <option value="">Todas as franquias</option>
          {franquias.filter(f => f.tipo !== 'matriz').map(f => (
            <option key={f.id} value={f.id}>{f.nome}</option>
          ))}
        </select>

        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className={SEL}>
          <option value="">Todos os meses</option>
          {MESES_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>

        <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className={SEL}>
          <option value="">Todos os anos</option>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="flex gap-1.5">
          {['','pendente','pago','atrasado','cancelado'].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === s
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === '' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <button onClick={carregar}
          className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Atualizar">
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
        ) : royalties.length === 0 ? (
          <div className="p-16 text-center">
            <ReceiptText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum royalty encontrado.</p>
            <button onClick={() => setModalGerar(true)}
              className="text-blue-600 text-sm hover:underline mt-1 inline-block">
              Gerar royalties do mês
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Franquia','Referência','Fat. base','% Royalty','Valor','Vencimento','Pagamento','Status','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {royalties.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-800">{r.franquia_nome}</p>
                      <p className="text-xs text-gray-400">{r.cidade}/{r.estado}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{mesLabel(r.mes_referencia)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{moeda(r.faturamento_base)}</td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium">{r.percentual}%</td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">{moeda(r.valor_royalty)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(r.vencimento)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(r.pagamento)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CORES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {r.status !== 'pago' && r.status !== 'cancelado' && (
                        pagandoId === r.id ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <CalendarDays size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              <input type="date" value={dataPagto} onChange={e => setDataPagto(e.target.value)}
                                className="border border-gray-200 rounded-lg pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 w-36" />
                            </div>
                            <button onClick={() => handleBaixar(r.id)} disabled={salvandoPagto}
                              className="text-xs px-2 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition-colors">
                              {salvandoPagto ? '...' : 'OK'}
                            </button>
                            <button onClick={() => setPagandoId(null)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setPagandoId(r.id); setDataPagto(hoje.toISOString().split('T')[0]) }}
                            className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-colors flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle2 size={12} /> Baixar
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
