import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useIdleTimer } from '../hooks/useIdleTimer'
import {
  LayoutDashboard, Building2, Users, FileText, ScrollText,
  Wallet, CalendarDays, BadgeDollarSign, BarChart2, UserCog, Settings,
  LogOut, Menu, X, Clock, Network, ReceiptText, Palmtree, ClipboardCheck,
  CheckSquare, FolderOpen, Activity,
} from 'lucide-react'

// Conjuntos de perfis
const ADMIN      = ['administrador_matriz']
const GESTORES   = ['administrador_matriz','diretor_regional','franqueado']
const FINANCEIRO = ['administrador_matriz','diretor_regional','franqueado','financeiro']
const OPERACAO   = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','juridico','funcionario_administrativo','auditor_rede']
const COM_CORRETOR = [...FINANCEIRO, 'corretor','captador','juridico','funcionario_administrativo','auditor_rede']

const GRUPOS = [
  {
    label: 'Geral',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: COM_CORRETOR },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { path: '/imoveis',    label: 'Imóveis',    icon: Building2,      roles: OPERACAO },
      { path: '/clientes',   label: 'Clientes',   icon: Users,          roles: OPERACAO },
      { path: '/propostas',  label: 'Propostas',  icon: FileText,       roles: OPERACAO },
      { path: '/contratos',  label: 'Contratos',  icon: ScrollText,     roles: GESTORES },
      { path: '/agenda',     label: 'Agenda',     icon: CalendarDays,   roles: OPERACAO },
      { path: '/temporadas', label: 'Temporadas', icon: Palmtree,       roles: OPERACAO },
      { path: '/vistorias',  label: 'Vistorias',  icon: ClipboardCheck, roles: OPERACAO },
      { path: '/tarefas',    label: 'Tarefas',    icon: CheckSquare,    roles: OPERACAO },
      { path: '/documentos', label: 'Documentos', icon: FolderOpen,     roles: OPERACAO },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { path: '/financeiro', label: 'Financeiro', icon: Wallet,          roles: FINANCEIRO },
      { path: '/comissoes',  label: 'Comissões',  icon: BadgeDollarSign, roles: COM_CORRETOR },
      { path: '/relatorios', label: 'Relatórios', icon: BarChart2,       roles: FINANCEIRO },
    ],
  },
  {
    label: 'Rede',
    items: [
      { path: '/franquias', label: 'Franquias', icon: Network,     roles: ADMIN },
      { path: '/royalties', label: 'Royalties', icon: ReceiptText, roles: ADMIN },
    ],
  },
  {
    label: 'Administração',
    items: [
      { path: '/usuarios',      label: 'Usuários',    icon: UserCog,  roles: GESTORES },
      { path: '/atividade',     label: 'Atividade',   icon: Activity, roles: ADMIN },
      { path: '/configuracoes', label: 'Configurações', icon: Settings, roles: GESTORES },
    ],
  },
]

const ROLE_LABELS = {
  administrador_matriz: 'Adm. Matriz', diretor_regional: 'Diretor Regional', franqueado: 'Franqueado',
  corretor: 'Corretor', captador: 'Captador', financeiro: 'Financeiro', juridico: 'Jurídico',
  funcionario_administrativo: 'Func. Adm.', auditor_rede: 'Auditor',
}

function iniciais(nome) {
  return nome?.split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() ?? '?'
}

// Modal de aviso de inatividade com countdown
function ModalInatividade({ segundos, onContinuar, onSair }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4 text-center animate-fade-up">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock size={28} className="text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Sessão prestes a expirar</h2>
        <p className="text-sm text-gray-500 mb-5">
          Por inatividade, você será desconectado em{' '}
          <span className="font-bold text-amber-600 tabular-nums">{segundos}s</span>.
        </p>
        <div className="flex gap-3">
          <button onClick={onSair}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            Sair agora
          </button>
          <button onClick={onContinuar}
            className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm">
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

function SidebarConteudo({ user, location, onNavegar, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center px-5 py-6 border-b border-white/10">
        <img src="/logo.png" alt="Tem Negócios" className="h-14 w-14 object-contain mb-2 drop-shadow-md" />
        <p className="font-bold text-sm text-white">Tem Negócios</p>
        <p className="text-blue-300 text-xs mt-0.5 truncate text-center w-full">{user?.tenant_nome}</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {GRUPOS.map(grupo => {
          const itensVisiveis = grupo.items.filter(i => i.roles.includes(user?.role))
          if (!itensVisiveis.length) return null
          return (
            <div key={grupo.label}>
              <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5">
                {grupo.label}
              </p>
              <div className="space-y-0.5">
                {itensVisiveis.map(item => {
                  const Icon = item.icon
                  const ativo = location.pathname.startsWith(item.path)
                  return (
                    <Link key={item.path} to={item.path} onClick={onNavegar}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        ativo
                          ? 'bg-white/15 text-white font-semibold ring-1 ring-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                          : 'text-blue-200/80 hover:bg-white/8 hover:text-white hover:translate-x-0.5'
                      }`}>
                      <Icon size={15} className={`shrink-0 transition-colors ${ativo ? 'text-blue-300' : ''}`} />
                      <span className="flex-1">{item.label}</span>
                      {ativo && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Perfil */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {iniciais(user?.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.nome?.split('—')[0].trim()}</p>
            <p className="text-[10px] text-blue-300">{ROLE_LABELS[user?.role]}</p>
          </div>
          <button onClick={onLogout} title="Sair"
            className="text-blue-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const [countdown, setCountdown] = useState(30)

  function handleLogout() {
    setMostrarAviso(false)
    logout()
    navigate('/login', { replace: true })
  }

  function fechar() { setSidebarAberta(false) }

  const onAviso = useCallback(() => {
    setCountdown(30)
    setMostrarAviso(true)
  }, [])

  const onLogout = useCallback(() => {
    handleLogout()
  }, [])

  // Countdown de 30s depois do aviso
  useEffect(() => {
    if (!mostrarAviso) return
    if (countdown <= 0) { handleLogout(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [mostrarAviso, countdown])

  function continuar() {
    setMostrarAviso(false)
    setCountdown(30)
  }

  useIdleTimer({
    ativo: !!user,
    onAviso,
    onLogout,
  })

  const todasItems = GRUPOS.flatMap(g => g.items)
  const paginaAtual = todasItems.find(i => location.pathname.startsWith(i.path))?.label ?? ''

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Modal inatividade */}
      {mostrarAviso && (
        <ModalInatividade
          segundos={countdown}
          onContinuar={continuar}
          onSair={handleLogout}
        />
      )}

      {/* ── Overlay mobile ── */}
      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={fechar} />
      )}

      {/* ── Sidebar desktop (estática) ── */}
      <aside className="hidden lg:flex w-60 bg-blue-950 text-white flex-col shrink-0 shadow-xl">
        <SidebarConteudo user={user} location={location} onNavegar={fechar} onLogout={handleLogout} />
      </aside>

      {/* ── Sidebar mobile (drawer) ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-blue-950 text-white flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button onClick={fechar}
          className="absolute top-4 right-4 text-blue-300 hover:text-white p-1 rounded-lg hover:bg-white/10">
          <X size={18} />
        </button>
        <SidebarConteudo user={user} location={location} onNavegar={fechar} onLogout={handleLogout} />
      </aside>

      {/* ── Conteúdo principal ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3.5 flex items-center gap-3 shrink-0 shadow-sm">
          <button onClick={() => setSidebarAberta(true)}
            className="lg:hidden text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
            <span className="text-gray-400 text-xs hidden sm:block">Tem Negócios</span>
            {paginaAtual && (
              <>
                <span className="text-gray-300 hidden sm:block">/</span>
                <span className="font-semibold text-gray-700 truncate">{paginaAtual}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 hidden md:block truncate max-w-40">{user?.email}</span>
            <div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center text-[11px] font-bold text-white">
              {iniciais(user?.nome)}
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
