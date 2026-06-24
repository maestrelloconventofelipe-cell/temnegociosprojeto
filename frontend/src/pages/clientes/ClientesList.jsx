import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import { Users, Search, RefreshCw, UserX } from 'lucide-react'

const TIPOS = ['proprietario','locatario','comprador']
const TIPO_CORES = {
  proprietario: 'bg-blue-100 text-blue-700',
  locatario:    'bg-green-100 text-green-700',
  comprador:    'bg-purple-100 text-purple-700',
}
const TIPO_LABELS = {
  proprietario: 'Proprietário',
  locatario:    'Locatário',
  comprador:    'Comprador',
}

const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'
const BTN_EDIT   = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors'
const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const podeEditar = ['administrador_matriz','diretor_regional','franqueado','corretor'].includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo) params.tipo = filtroTipo
      const res = await api.get('/clientes', { params })
      setClientes(res.data)
    } catch { setErro('Erro ao carregar clientes.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo])

  async function remover(id, nome) {
    const ok = await confirm(`Remover o cliente "${nome}"?`, { title: 'Remover cliente', danger: true, confirmText: 'Sim, remover' })
    if (!ok) return
    try {
      await api.delete(`/clientes/${id}`)
      setClientes(prev => prev.filter(c => c.id !== id))
      toast('Cliente removido com sucesso.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const lista = clientes.filter(c =>
    !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf?.includes(busca)
  )

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Clientes</h1>
            <p className="text-xs text-gray-400">{clientes.length} cadastrado(s)</p>
          </div>
        </div>
        {podeEditar && (
          <Link to="/clientes/novo" className="btn-primary flex items-center gap-2 text-sm">
            + Novo cliente
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm min-w-[240px] bg-white" />
        </div>
        <div className="flex gap-1.5">
          {['', ...TIPOS].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroTipo === t ? 'bg-blue-800 text-white border-blue-800 shadow-sm' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {t === '' ? 'Todos' : TIPO_LABELS[t]}
            </button>
          ))}
        </div>
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
        ) : lista.length === 0 ? (
          <div className="p-16 text-center">
            <UserX size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum cliente encontrado.</p>
            {podeEditar && <Link to="/clientes/novo" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Cadastrar o primeiro</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nome','CPF','E-mail','Telefone','Tipo','Cidade/UF','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{c.nome}</td>
                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{c.cpf || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-500">{c.email || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-500">{c.telefone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${TIPO_CORES[c.tipo] ?? 'bg-gray-100 text-gray-500'}`}>
                        {TIPO_LABELS[c.tipo] ?? c.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{c.cidade ? `${c.cidade}/${c.estado}` : '—'}</td>
                    <td className="px-4 py-3.5">
                      {podeEditar && (
                        <div className="flex gap-2">
                          <Link to={`/clientes/${c.id}/editar`} className={BTN_EDIT}>Editar</Link>
                          <button onClick={() => remover(c.id, c.nome)} className={BTN_DANGER}>Remover</button>
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
    </>
  )
}
