import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { UserCog, RefreshCw, UserX, BadgeCheck } from 'lucide-react'

const ROLES = ['administrador_matriz','diretor_regional','franqueado','corretor','financeiro','juridico','funcionario_administrativo']
const ROLE_LABELS = {
  administrador_matriz:    'Adm. Matriz',
  diretor_regional:        'Diretor Regional',
  franqueado:              'Franqueado',
  corretor:                'Corretor',
  captador:                'Captador',
  financeiro:              'Financeiro',
  juridico:                'Jurídico',
  funcionario_administrativo: 'Func. Adm.',
  auditor_rede:            'Auditor',
}
const ROLE_CORES = {
  administrador_matriz:       'bg-purple-100 text-purple-700',
  diretor_regional:           'bg-blue-100 text-blue-700',
  franqueado:                 'bg-green-100 text-green-700',
  corretor:                   'bg-yellow-100 text-yellow-700',
  financeiro:                 'bg-orange-100 text-orange-700',
  juridico:                   'bg-red-100 text-red-700',
  funcionario_administrativo: 'bg-pink-100 text-pink-700',
}

function iniciais(nome) {
  return nome?.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase() ?? '?'
}

const SEL = 'border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 shadow-sm'
const BTN_EDIT   = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors'
const BTN_DANGER = 'text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors'

export default function UsuariosList() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [filtroRole, setFiltroRole] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('ativo')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const podeRemover = ['administrador_matriz','diretor_regional'].includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroRole)   params.role   = filtroRole
      if (filtroStatus) params.status = filtroStatus
      const res = await api.get('/usuarios', { params })
      setUsuarios(res.data)
    } catch { setErro('Erro ao carregar usuários.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroRole, filtroStatus])

  async function toggleStatus(u) {
    if (u.id === user?.id) return toast('Você não pode alterar sua própria conta.', 'warning')
    const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await api.put(`/usuarios/${u.id}`, { status: novoStatus })
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, status: novoStatus } : x))
      toast(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}.`, 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao alterar status.', 'error') }
  }

  async function remover(u) {
    if (u.id === user?.id) return toast('Você não pode remover sua própria conta.', 'warning')
    const ok = await confirm(`Remover o usuário "${u.nome}"? Esta ação é irreversível.`, {
      title: 'Remover usuário', danger: true, confirmText: 'Sim, remover'
    })
    if (!ok) return
    try {
      await api.delete(`/usuarios/${u.id}`)
      setUsuarios(prev => prev.filter(x => x.id !== u.id))
      toast('Usuário removido.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <UserCog size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Usuários</h1>
            <p className="text-xs text-gray-400">{usuarios.length} membro(s) · {user?.tenant_nome}</p>
          </div>
        </div>
        <Link to="/usuarios/novo" className="btn-primary flex items-center gap-2 text-sm">
          + Novo usuário
        </Link>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filtroRole} onChange={e => setFiltroRole(e.target.value)} className={SEL}>
          <option value="">Todos os perfis</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <div className="flex gap-1.5">
          {['ativo','inativo',''].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === s ? 'bg-blue-800 text-white border-blue-800 shadow-sm' : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === '' ? 'Todos' : s === 'ativo' ? 'Ativos' : 'Inativos'}
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
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : usuarios.length === 0 ? (
          <div className="p-16 text-center">
            <UserX size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum usuário encontrado.</p>
            <Link to="/usuarios/novo" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Criar o primeiro</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {usuarios.map(u => (
              <div key={u.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors ${u.status === 'inativo' ? 'opacity-60' : ''}`}>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 select-none">
                  {iniciais(u.nome)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{u.nome}</span>
                    {u.id === user?.id && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">você</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_CORES[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    {u.status === 'inativo' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">Inativo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                  {u.creci && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <BadgeCheck size={11} />
                      {u.creci}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/usuarios/${u.id}/editar`} className={BTN_EDIT}>Editar</Link>
                  {u.id !== user?.id && (
                    <button onClick={() => toggleStatus(u)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        u.status === 'ativo'
                          ? 'border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-300'
                          : 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
                      }`}>
                      {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                    </button>
                  )}
                  {podeRemover && u.id !== user?.id && (
                    <button onClick={() => remover(u)} className={BTN_DANGER}>Remover</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
