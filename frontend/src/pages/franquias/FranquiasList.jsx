import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { Network, RefreshCw, Search, StoreIcon } from 'lucide-react'

const TIPOS_FRANQUIA = ['unidade','master','regional','loja_propria']
const TIPO_LABELS    = { unidade: 'Unidade', master: 'Master', regional: 'Regional', loja_propria: 'Loja Própria' }
const TIPO_CORES     = {
  unidade:     'bg-blue-100 text-blue-700',
  master:      'bg-purple-100 text-purple-700',
  regional:    'bg-green-100 text-green-700',
  loja_propria:'bg-orange-100 text-orange-700',
}
const STATUS_LABELS = { ativa: 'Ativa', bloqueada: 'Bloqueada', suspensa: 'Suspensa', cancelada: 'Cancelada' }
const STATUS_CORES  = {
  ativa:     'bg-green-100 text-green-700',
  bloqueada: 'bg-red-100 text-red-600',
  suspensa:  'bg-orange-100 text-orange-600',
  cancelada: 'bg-gray-100 text-gray-500',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function data(d)  { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'
const BTN_EDIT   = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors'
const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'

export default function FranquiasList() {
  const [franquias, setFranquias]  = useState([])
  const [resumo, setResumo]        = useState(null)
  const [filtroTipo, setFiltroTipo]       = useState('')
  const [filtroStatus, setFiltroStatus]   = useState('')
  const [busca, setBusca]          = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]            = useState('')
  const { toast } = useToast()
  const { confirm } = useConfirm()

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo)   params.tipo_franquia = filtroTipo
      if (filtroStatus) params.status        = filtroStatus
      const [lista, res] = await Promise.all([
        api.get('/tenants', { params }),
        api.get('/tenants/resumo'),
      ])
      setFranquias(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar franquias.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo, filtroStatus])

  async function alterarStatus(f, novoStatus) {
    try {
      await api.put(`/tenants/${f.id}`, { status: novoStatus })
      setFranquias(prev => prev.map(x => x.id === f.id ? { ...x, status: novoStatus } : x))
      toast(`Status alterado para "${STATUS_LABELS[novoStatus]}".`, 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao alterar status.', 'error') }
  }

  async function remover(f) {
    const ok = await confirm(`Remover a franquia "${f.nome_fantasia || f.nome}"? Esta ação é irreversível.`, {
      title: 'Remover franquia', danger: true, confirmText: 'Sim, remover'
    })
    if (!ok) return
    try {
      await api.delete(`/tenants/${f.id}`)
      setFranquias(prev => prev.filter(x => x.id !== f.id))
      toast('Franquia removida.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const lista = useMemo(() =>
    franquias.filter(f =>
      !busca || (f.nome_fantasia || f.nome)?.toLowerCase().includes(busca.toLowerCase()) ||
      f.cidade?.toLowerCase().includes(busca.toLowerCase())
    ), [franquias, busca]
  )

  const kpis = resumo ? [
    { label: 'Total de franquias', valor: resumo.total,             accent: '#2563eb', cor: 'text-gray-800',   fmt: 'n' },
    { label: 'Ativas',             valor: resumo.ativas,            accent: '#16a34a', cor: 'text-green-600',  fmt: 'n' },
    { label: 'Bloqueadas',         valor: Number(resumo.bloqueadas) + Number(resumo.canceladas || 0), accent: '#dc2626', cor: 'text-red-600', fmt: 'n' },
    { label: 'Royalties pendentes',valor: resumo.royalties_pendentes, accent: '#ca8a04', cor: 'text-yellow-600', fmt: 'R$' },
  ] : []

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <Network size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Rede de franquias</h1>
            <p className="text-xs text-gray-400">{lista.length} unidade(s) encontrada(s)</p>
          </div>
        </div>
        <Link to="/franquias/nova" className="btn-primary flex items-center gap-2 text-sm">
          + Nova franquia
        </Link>
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

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou cidade..."
            className="border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm w-52" />
        </div>

        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={SEL}>
          <option value="">Todos os tipos</option>
          {TIPOS_FRANQUIA.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>

        <div className="flex gap-1.5">
          {['','ativa','bloqueada','suspensa','cancelada'].map(s => (
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
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : lista.length === 0 ? (
          <div className="p-16 text-center">
            <StoreIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma franquia encontrada.</p>
            <Link to="/franquias/nova" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Cadastrar a primeira</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Franquia','Tipo','Royalty %','Responsável','Início','Status','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-800">{f.nome_fantasia || f.nome}</p>
                      <p className="text-xs text-gray-400">{f.cidade}{f.estado ? `/${f.estado}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_CORES[f.tipo_franquia] ?? 'bg-gray-100 text-gray-500'}`}>
                        {TIPO_LABELS[f.tipo_franquia] ?? f.tipo_franquia}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium">{f.percentual_royalty ?? 2}%</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{f.responsavel_nome || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-500">{data(f.data_inicio)}</td>
                    <td className="px-4 py-3.5">
                      <select value={f.status}
                        onChange={e => alterarStatus(f, e.target.value)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${STATUS_CORES[f.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <Link to={`/franquias/${f.id}/editar`} className={BTN_EDIT}>Editar</Link>
                        <button onClick={() => remover(f)} className={BTN_DANGER}>Remover</button>
                      </div>
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
