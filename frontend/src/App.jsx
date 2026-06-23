import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Home, Building, Users, DollarSign, Menu,
  ChevronRight, PanelLeftClose, PanelLeftOpen, Search, Moon, Sun,
  LogOut, FileText, ScrollText, Calendar, Award, ClipboardList,
  ClipboardCheck, Folder, BarChart2, Settings,
} from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Notificacoes from './components/Notificacoes'
import ChatBot from './components/ChatBot'

import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Imoveis      from './pages/Imoveis'
import Clientes     from './pages/Clientes'
import Financeiro   from './pages/Financeiro'
import Franquias    from './pages/Franquias'
import Usuarios     from './pages/Usuarios'
import Propostas    from './pages/Propostas'
import Contratos    from './pages/Contratos'
import Agenda       from './pages/Agenda'
import Comissoes    from './pages/Comissoes'
import Tarefas      from './pages/Tarefas'
import Vistorias    from './pages/Vistorias'
import Temporadas   from './pages/Temporadas'
import Documentos   from './pages/Documentos'
import Relatorios   from './pages/Relatorios'
import Configuracoes    from './pages/Configuracoes'
import Perfil           from './pages/Perfil'
import RoyaltiesList    from './pages/royalties/RoyaltiesList'
import AtividadeUsuarios from './pages/admin/AtividadeUsuarios'

const ADMINS    = ['administrador_matriz','diretor_regional','franqueado']
const FIN_ROLES = ['administrador_matriz','diretor_regional','franqueado','financeiro']
const ALL       = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']

function buildMenu(role) {
  const items = []
  const add = (id, Icon, texto, roles) => {
    if (!roles || roles.includes(role)) items.push({ id, Icon, texto })
  }
  add('/dashboard',     LayoutDashboard, 'Dashboard',     ALL)
  add('/imoveis',       Home,            'Imóveis',        ALL)
  add('/clientes',      Users,           'Clientes',       ALL)
  add('/propostas',     FileText,        'Propostas',      ALL)
  add('/contratos',     ScrollText,      'Contratos',      [...ADMINS,'juridico'])
  add('/agenda',        Calendar,        'Agenda',         ALL)
  add('/tarefas',       ClipboardList,   'Tarefas',        ALL)
  add('/vistorias',     ClipboardCheck,  'Vistorias',      [...ADMINS,'corretor','captador'])
  add('/temporadas',    Calendar,        'Temporadas',     [...ADMINS,'corretor'])
  add('/documentos',    Folder,          'Documentos',     ALL)
  add('/financeiro',    DollarSign,      'Financeiro',     FIN_ROLES)
  add('/comissoes',     Award,           'Comissões',      FIN_ROLES)
  add('/relatorios',    BarChart2,       'Relatórios',     ADMINS)
  add('/franquias',     Building,        'Franquias',      ADMINS)
  add('/usuarios',      Users,           'Equipe',         ADMINS)
  add('/configuracoes', Settings,        'Configurações',  ADMINS)
  return items
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null

  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  let currentUser = user

  if (!currentUser && token && storedUser) {
    try {
      currentUser = JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

function BootstrapLayout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const role      = user?.role ?? 'corretor'

  const [mobileAberto, setMobileAberto] = useState(false)
  const [expandida, setExpandida]        = useState(true)
  const [escuro, setEscuro]             = useState(() => localStorage.getItem('theme') === 'dark')
  const [buscaAtiva, setBuscaAtiva]     = useState(false)
  const [termoBusca, setTermoBusca]     = useState('')

  useEffect(() => {
    document.body.classList.toggle('dark-theme', escuro)
    localStorage.setItem('theme', escuro ? 'dark' : 'light')
  }, [escuro])

  const menuItens = buildMenu(role)
  const sw        = expandida ? '280px' : '88px'
  const ir        = path => { navigate(path); setMobileAberto(false) }
  const ativo     = path => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="d-flex bg-light-base" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Toaster position="top-right" />

      <style>{`
        @media (max-width: 768px) {
          .sb-wrap { transform: translateX(${mobileAberto ? '0' : '-100%'}); }
          .mob-overlay { display: ${mobileAberto ? 'block' : 'none'}; }
        }
      `}</style>

      <div className="mob-overlay d-md-none position-fixed top-0 start-0 w-100 h-100"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', zIndex: 1040 }}
        onClick={() => setMobileAberto(false)} />

      {/* ── Sidebar ── */}
      <div className="sb-wrap sidebar-container shadow-lg d-flex flex-column"
        style={{ width: sw, minWidth: sw, background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)', zIndex: 1050, flexShrink: 0 }}>

        <div className={`p-3 d-flex align-items-center ${expandida ? 'justify-content-between' : 'justify-content-center flex-column gap-2'}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '70px' }}>
          <div className="d-flex align-items-center gap-3">
            <img
              src="/logo-tem-negocios.png"
              alt="Tem Negócios"
              style={{
                height: expandida ? '44px' : '36px',
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'drop-shadow(0 1px 6px rgba(99,102,241,0.35))',
                transition: 'height 0.3s',
              }}
            />
            {expandida && (
              <div className="animate__animated animate__fadeIn">
                <div style={{ color: '#93c5fd', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  {user?.tenant_nome ?? 'Gestão Imobiliária'}
                </div>
              </div>
            )}
          </div>
          <button className="btn btn-sm p-2 rounded-circle border-0 d-none d-md-flex text-white"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onClick={() => setExpandida(!expandida)}>
            {expandida ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>

        <div className="d-flex flex-column py-2 w-100 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {expandida && (
            <small className="px-4 mt-1 mb-1 text-nowrap"
              style={{ color: '#60a5fa', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>
              Menu Principal
            </small>
          )}

          {menuItens.map(item => (
            <button key={item.id} onClick={() => ir(item.id)}
              title={!expandida ? item.texto : ''}
              className={`sidebar-btn btn d-flex align-items-center w-100 py-2 rounded-0 border-0 ${ativo(item.id) ? 'active' : ''} ${expandida ? 'justify-content-between px-4' : 'justify-content-center px-0'}`}
              style={{ color: '#93c5fd' }}>
              <div className="d-flex align-items-center gap-3">
                <item.Icon size={19} className={ativo(item.id) ? 'text-white' : ''} />
                {expandida && <span className="fw-medium text-nowrap" style={{ fontSize: '0.87rem' }}>{item.texto}</span>}
              </div>
              {expandida && ativo(item.id) && <ChevronRight size={14} color="#fff" />}
            </button>
          ))}

          <button onClick={logout}
            className={`sidebar-btn btn d-flex align-items-center w-100 py-2 rounded-0 border-0 text-danger mt-2 ${expandida ? 'px-4' : 'justify-content-center px-0'}`}
            title={!expandida ? 'Sair' : ''}>
            <div className="d-flex align-items-center gap-3">
              <LogOut size={19} />
              {expandida && <span className="fw-medium" style={{ fontSize: '0.87rem' }}>Sair da Conta</span>}
            </div>
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0, transition: 'width 0.38s' }}>

        {/* Top bar */}
        <div className="bg-white shadow-sm border-bottom d-flex align-items-center justify-content-between px-3"
          style={{ height: '70px', zIndex: 1020, flexShrink: 0 }}>

          <button className="btn btn-light border-0 p-2 d-md-none me-2" onClick={() => setMobileAberto(true)}>
            <Menu size={22} />
          </button>

          <div className="position-relative flex-grow-1" style={{ maxWidth: '380px' }}>
            <div className={`input-group rounded-pill overflow-hidden border search-bar-bg ${buscaAtiva ? 'border-primary' : 'border-0'}`}
              style={{ background: escuro ? '#334155' : '#f8fafc' }}>
              <span className="input-group-text bg-transparent border-0 text-muted ps-3 pe-1"><Search size={16} /></span>
              <input type="text" className="form-control bg-transparent border-0 shadow-none"
                placeholder="Busca global (Imóveis, Clientes…)"
                value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                onFocus={() => setBuscaAtiva(true)} onBlur={() => setTimeout(() => setBuscaAtiva(false), 150)} />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 ms-3">
            <button className="btn btn-light rounded-circle p-2 border-0" onClick={() => setEscuro(!escuro)}>
              {escuro ? <Sun size={18} className="text-warning" /> : <Moon size={18} className="text-secondary" />}
            </button>
            <Notificacoes escuro={escuro} />
            <div className="rounded-circle ms-1 cursor-pointer border border-2 border-primary overflow-hidden"
              style={{ width: '38px', height: '38px', flexShrink: 0 }}
              onClick={() => navigate('/perfil')} title="Meu Perfil">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome ?? 'U')}&background=0D8ABC&color=fff`}
                alt="avatar" className="w-100 h-100" style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 overflow-auto flex-grow-1">
          <div className="container-fluid p-0 pb-5" style={{ maxWidth: '1400px' }}>
            <Outlet />
          </div>
        </div>
      </div>

      <ChatBot />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route element={<RequireAuth><BootstrapLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/imoveis"       element={<Imoveis />} />
            <Route path="/imoveis/novo"  element={<Imoveis />} />
            <Route path="/clientes"      element={<Clientes />} />
            <Route path="/propostas"     element={<Propostas />} />
            <Route path="/contratos"     element={<Contratos />} />
            <Route path="/agenda"        element={<Agenda />} />
            <Route path="/agenda/:id/editar" element={<Agenda />} />
            <Route path="/tarefas"       element={<Tarefas />} />
            <Route path="/vistorias"     element={<Vistorias />} />
            <Route path="/temporadas"    element={<Temporadas />} />
            <Route path="/documentos"    element={<Documentos />} />
            <Route path="/financeiro"    element={<Financeiro />} />
            <Route path="/comissoes"     element={<Comissoes />} />
            <Route path="/relatorios"    element={<Relatorios />} />
            <Route path="/franquias"     element={<Franquias />} />
            <Route path="/usuarios"      element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil"         element={<Perfil />} />
          </Route>
          {/* Rotas que usam AppLayout próprio (Tailwind) — não aninhar dentro de BootstrapLayout */}
          <Route path="/royalties" element={<RequireAuth><RoyaltiesList /></RequireAuth>} />
          <Route path="/atividade" element={<RequireAuth><AtividadeUsuarios /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
