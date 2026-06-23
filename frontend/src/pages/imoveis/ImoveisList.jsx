import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  Building2, RefreshCw, Home, Search, MapPin,
  Edit, Trash2, BedDouble, Car, Maximize2, BadgeCheck,
} from 'lucide-react'

const TIPOS = ['apartamento','casa','terreno','comercial','rural']
const FINALIDADES = ['venda','locacao','temporada']
const STATUS_LIST = ['disponivel','alugado','vendido','inativo']

const STATUS_CORES = {
  disponivel: 'bg-green-100 text-green-700',
  alugado:    'bg-yellow-100 text-yellow-700',
  vendido:    'bg-blue-100 text-blue-700',
  inativo:    'bg-gray-100 text-gray-500',
}
const TIPO_LABELS = {
  apartamento: 'Apartamento', casa: 'Casa', terreno: 'Terreno',
  comercial: 'Comercial', rural: 'Rural',
}
const FINALIDADE_LABELS = { venda: 'Venda', locacao: 'Locação', temporada: 'Temporada' }
const STATUS_LABELS = { disponivel: 'Disponível', alugado: 'Alugado', vendido: 'Vendido', inativo: 'Inativo' }

function moeda(v) {
  return v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—'
}

const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'

export default function ImoveisList() {
  const [imoveis, setImoveis]               = useState([])
  const [filtroTipo, setFiltroTipo]         = useState('')
  const [filtroFinalidade, setFiltroFinalidade] = useState('')
  const [filtroStatus, setFiltroStatus]     = useState('')
  const [busca, setBusca]                   = useState('')
  const [carregando, setCarregando]         = useState(true)
  const [erro, setErro]                     = useState('')
  const { user }    = useAuth()
  const { toast }   = useToast()
  const { confirm } = useConfirm()

  const podeEditar = ['administrador_matriz','diretor_regional','franqueado','corretor'].includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo)       params.tipo       = filtroTipo
      if (filtroFinalidade) params.finalidade = filtroFinalidade
      if (filtroStatus)     params.status     = filtroStatus
      const res = await api.get('/imoveis', { params })
      setImoveis(res.data)
    } catch { setErro('Erro ao carregar imóveis.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo, filtroFinalidade, filtroStatus])

  async function remover(id, titulo) {
    const ok = await confirm(`Remover o imóvel "${titulo}"?`, {
      title: 'Remover imóvel', danger: true, confirmText: 'Sim, remover',
    })
    if (!ok) return
    try {
      await api.delete(`/imoveis/${id}`)
      setImoveis(prev => prev.filter(i => i.id !== id))
      toast('Imóvel removido com sucesso.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const imoveisFiltrados = imoveis.filter(im => {
    if (!busca) return true
    const t = busca.toLowerCase()
    return (
      im.titulo?.toLowerCase().includes(t) ||
      im.cidade?.toString().toLowerCase().includes(t) ||
      im.endereco?.toLowerCase().includes(t)
    )
  })

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Imóveis</h1>
            <p className="text-xs text-gray-400">{imoveis.length} cadastrado(s)</p>
          </div>
        </div>
        {podeEditar && (
          <Link to="/imoveis/novo" className="btn-primary flex items-center gap-2 text-sm">
            + Novo imóvel
          </Link>
        )}
      </div>

      {/* Filtros + Busca */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por título, cidade ou endereço…"
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm"
          />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={SEL}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
        </select>
        <select value={filtroFinalidade} onChange={e => setFiltroFinalidade(e.target.value)} className={SEL}>
          <option value="">Todas as finalidades</option>
          {FINALIDADES.map(f => <option key={f} value={f}>{FINALIDADE_LABELS[f]}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={SEL}>
          <option value="">Todos os status</option>
          {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button
          onClick={carregar}
          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
          title="Atualizar"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton rounded-2xl h-72" />
          ))}
        </div>
      ) : erro ? (
        <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
      ) : imoveisFiltrados.length === 0 ? (
        <div className="p-16 text-center">
          <Home size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {busca || filtroTipo || filtroFinalidade || filtroStatus
              ? 'Nenhum imóvel encontrado para os filtros selecionados.'
              : 'Nenhum imóvel cadastrado.'}
          </p>
          {podeEditar && !busca && (
            <Link to="/imoveis/novo" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
              Cadastrar o primeiro
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imoveisFiltrados.map(im => (
            <div
              key={im.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group flex flex-col"
            >
              {/* Imagem */}
              {im.img_capa ? (
                <img
                  src={`/uploads/imoveis/${im.img_capa}`}
                  alt={im.titulo}
                  className="w-full h-44 object-cover"
                />
              ) : (
                <div className="w-full h-44 bg-gray-50 flex flex-col items-center justify-center border-b border-gray-100">
                  <Home size={36} className="text-gray-200 mb-1" />
                  <span className="text-xs text-gray-300">Sem foto</span>
                </div>
              )}

              {/* Botões de ação (aparecem no hover) */}
              {podeEditar && (
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/imoveis/${im.id}/editar`}
                    className="w-8 h-8 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center text-blue-600 hover:bg-blue-50"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => remover(im.id, im.titulo)}
                    className="w-8 h-8 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Status badge sobre a imagem */}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CORES[im.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[im.status] ?? im.status}
                </span>
              </div>

              {/* Conteúdo */}
              <div className="p-4 flex flex-col flex-1">
                {/* Tipo + Finalidade */}
                <div className="flex gap-2 mb-2">
                  {im.tipo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {TIPO_LABELS[im.tipo] ?? im.tipo}
                    </span>
                  )}
                  {im.tipo_negocio && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {FINALIDADE_LABELS[im.tipo_negocio] ?? im.tipo_negocio}
                    </span>
                  )}
                </div>

                {/* Título */}
                <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 leading-snug">
                  {im.titulo}
                </h3>

                {/* Valor */}
                <p className="text-lg font-bold text-green-600 mb-2">{moeda(im.valor)}</p>

                {/* Características */}
                {(im.quartos || im.area_total || im.garagens) && (
                  <div className="flex gap-3 text-xs text-gray-400 mb-2">
                    {im.quartos  && <span className="flex items-center gap-1"><BedDouble size={12} />{im.quartos} qts</span>}
                    {im.area_total && <span className="flex items-center gap-1"><Maximize2 size={12} />{im.area_total} m²</span>}
                    {im.garagens && <span className="flex items-center gap-1"><Car size={12} />{im.garagens} vg</span>}
                  </div>
                )}

                {/* Endereço */}
                {im.cidade && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-auto">
                    <MapPin size={12} className="shrink-0" />
                    {im.endereco ? `${im.endereco} — ` : ''}{im.cidade}
                  </p>
                )}

                {/* Corretor + CRECI */}
                {im.corretor_nome && (
                  <div className="mt-1 border-t border-gray-50 pt-2">
                    <p className="text-xs text-gray-400">
                      Corretor: <span className="text-gray-600 font-medium">{im.corretor_nome}</span>
                    </p>
                    {im.corretor_creci && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                        <BadgeCheck size={11} />
                        {im.corretor_creci}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
