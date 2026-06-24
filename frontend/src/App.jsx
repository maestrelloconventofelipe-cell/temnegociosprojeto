import {
  BrowserRouter, Routes, Route, Navigate, Outlet,
  useNavigate, useLocation,
} from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Home, Building, Users, DollarSign, Menu,
  PanelLeftClose, PanelLeftOpen, Search, Moon, Sun,
  LogOut, FileText, ScrollText, Calendar, Award, ClipboardList,
  ClipboardCheck, Folder, BarChart2, Settings, Palmtree,
  ChevronRight, Activity, Crown,
} from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import Notificacoes from './components/Notificacoes'
import ChatBot from './components/ChatBot'

/* ── Pages (Bootstrap layout) ── */
import Login           from './pages/Login'
import Dashboard       from './pages/Dashboard'
import Imoveis         from './pages/Imoveis'
import Financeiro      from './pages/Financeiro'
import Franquias       from './pages/Franquias'
import Usuarios        from './pages/Usuarios'
import Propostas       from './pages/Propostas'
import Contratos       from './pages/Contratos'
import Agenda          from './pages/Agenda'
import Comissoes       from './pages/Comissoes'
import Tarefas         from './pages/Tarefas'
import Vistorias       from './pages/Vistorias'
import Documentos      from './pages/Documentos'
import Relatorios      from './pages/Relatorios'
import Configuracoes   from './pages/Configuracoes'
import Perfil          from './pages/Perfil'
/* ── Pages (AppLayout/Tailwind — standalone) ── */
import ClientesList    from './pages/clientes/ClientesList'
import ClienteForm     from './pages/clientes/ClienteForm'
import TemporadasList  from './pages/temporadas/TemporadasList'
import TemporadaForm   from './pages/temporadas/TemporadaForm'
import RoyaltiesList   from './pages/royalties/RoyaltiesList'
import AtividadeUsuarios from './pages/admin/AtividadeUsuarios'

/* ── Role constants ── */
const ADMINS    = ['administrador_matriz','diretor_regional','franqueado']
const FIN_ROLES = ['administrador_matriz','diretor_regional','franqueado','financeiro']
const CORR      = ['administrador_matriz','diretor_regional','franqueado','corretor','captador']
const ALL       = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','financeiro','juridico','funcionario_administrativo','auditor_rede']

/* ── Menu structure (sections) ── */
function buildMenu(role) {
  const section = (label, items) => ({ label, items: items.filter(i => !i.roles || i.roles.includes(role)) })
  const item    = (id, Icon, texto, roles, badge) => ({ id, Icon, texto, roles, badge })

  return [
    section('Principal', [
      item('/dashboard', LayoutDashboard, 'Dashboard', ALL),
    ]),
    section('Imóveis & Clientes', [
      item('/imoveis',    Home,      'Imóveis',   ALL),
      item('/clientes',   Users,     'Clientes',  ALL),
      item('/propostas',  FileText,  'Propostas', ALL),
      item('/agenda',     Calendar,  'Agenda',    ALL),
      item('/tarefas',    ClipboardList, 'Tarefas', ALL),
    ]),
    section('Operacional', [
      item('/contratos',   ScrollText,    'Contratos',   [...ADMINS,'juridico']),
      item('/vistorias',   ClipboardCheck,'Vistorias',   [...ADMINS,'corretor','captador']),
      item('/temporadas',  Palmtree,      'Temporadas',  [...ADMINS,'corretor','captador']),
      item('/documentos',  Folder,        'Documentos',  ALL),
    ]),
    section('Financeiro', [
      item('/financeiro', DollarSign, 'Financeiro',  FIN_ROLES),
      item('/comissoes',  Award,      'Comissões',   FIN_ROLES),
      item('/royalties',  Crown,      'Royalties',   ADMINS),
    ]),
    section('Administração', [
      item('/relatorios',    BarChart2, 'Relatórios',    ADMINS),
      item('/franquias',     Building,  'Franquias',     ADMINS),
      item('/usuarios',      Users,     'Equipe',        ADMINS),
      item('/atividade',     Activity,  'Atividade',     ADMINS),
      item('/configuracoes', Settings,  'Configurações', ADMINS),
    ]),
  ].map(s => ({ ...s, items: s.items.filter(Boolean) }))
   .filter(s => s.items.length > 0)
}

/* ── RequireAuth ── */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null

  const token      = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  let current = user

  if (!current && token && storedUser) {
    try { current = JSON.parse(storedUser) }
    catch { localStorage.removeItem('token'); localStorage.removeItem('user') }
  }
  if (!current) return <Navigate to="/login" replace />
  return children
}

/* ── Sidebar nav button ── */
function NavBtn({ item, expandida, ativo, onClick }) {
  const isAtivo = ativo(item.id)
  return (
    <button
      key={item.id}
      onClick={() => onClick(item.id)}
      title={!expandida ? item.texto : ''}
      className={`
        sidebar-btn btn d-flex align-items-center w-100 rounded-0 border-0 py-2
        ${expandida ? 'justify-content-between px-4' : 'justify-content-center px-0'}
        ${isAtivo ? 'active' : ''}
      `}
      style={{ color: '#93c5fd', minHeight: '40px' }}
    >
      <div className="d-flex align-items-center gap-3">
        <item.Icon
          size={18}
          className={isAtivo ? 'text-white' : ''}
          style={{ flexShrink: 0 }}
        />
        {expandida && (
          <span className="fw-medium text-nowrap" style={{ fontSize: '0.85rem' }}>
            {item.texto}
          </span>
        )}
      </div>
      {expandida && isAtivo && <ChevronRight size={13} color="#fff" />}
    </button>
  )
}

/* ── Section label ── */
function SectionLabel({ label, expandida }) {
  if (!expandida) return <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 16px' }} />
  return (
    <div style={{ padding: '14px 16px 4px', color: '#60a5fa', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.85 }}>
      {label}
    </div>
  )
}

/* ── Main Bootstrap Layout ── */
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

  const menuSections = buildMenu(role)
  const sw = expandida ? '260px' : '76px'
  const ir = path => { navigate(path); setMobileAberto(false) }
  const ativo = path => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="d-flex bg-light-base" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Toaster position="top-right" />

      <style>{`
        .sidebar-btn { transition: background 0.15s, transform 0.1s; }
        .sidebar-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .sidebar-btn.active { background: rgba(255,255,255,0.12) !important; border-right: 2px solid #60a5fa !important; }
        .sidebar-btn.active:hover { background: rgba(255,255,255,0.16) !important; }
        @media (max-width: 768px) {
          .sb-wrap { transform: translateX(${mobileAberto ? '0' : '-100%'}); }
          .mob-overlay { display: ${mobileAberto ? 'block' : 'none'}; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div
        className="mob-overlay d-md-none position-fixed top-0 start-0 w-100 h-100"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 1040 }}
        onClick={() => setMobileAberto(false)}
      />

      {/* ── Sidebar ── */}
      <div
        className="sb-wrap sidebar-container d-flex flex-column shadow-lg"
        style={{
          width: sw, minWidth: sw, flexShrink: 0,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)',
          zIndex: 1050,
          transition: 'width 0.28s cubic-bezier(.4,0,.2,1), min-width 0.28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Logo / header */}
        <div
          className={`p-3 d-flex align-items-center ${expandida ? 'justify-content-between' : 'justify-content-center flex-column gap-2'}`}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '66px' }}
        >
          <div className="d-flex align-items-center gap-2">
            <img
              src="/logo-tem-negocios.png"
              alt="Tem Negócios"
              style={{
                height: expandida ? '40px' : '32px',
                width: 'auto', objectFit: 'contain', flexShrink: 0,
                filter: 'drop-shadow(0 1px 6px rgba(99,102,241,0.35))',
                transition: 'height 0.28s',
              }}
            />
            {expandida && (
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ color: '#93c5fd', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user?.tenant_nome ?? 'Tem Negócios'}
                </div>
                <div style={{ color: '#475569', fontSize: '0.55rem', marginTop: '1px' }}>
                  {user?.role === 'administrador_matriz' ? 'Matriz' : user?.nome?.split(' ')[0]}
                </div>
              </div>
            )}
          </div>
          <button
            className="btn btn-sm p-2 rounded-circle border-0 d-none d-md-flex text-white"
            style={{ background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}
            onClick={() => setExpandida(!expandida)}
            title={expandida ? 'Recolher menu' : 'Expandir menu'}
          >
            {expandida ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        {/* Menu sections */}
        <div className="d-flex flex-column py-1 flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {menuSections.map((section) => (
            <div key={section.label}>
              <SectionLabel label={section.label} expandida={expandida} />
              {section.items.map(item => (
                <NavBtn
                  key={item.id}
                  item={item}
                  expandida={expandida}
                  ativo={ativo}
                  onClick={ir}
                />
              ))}
            </div>
          ))}

          {/* Divider + logout */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '6px' }}>
            <button
              onClick={logout}
              className={`sidebar-btn btn d-flex align-items-center w-100 py-2 rounded-0 border-0 text-danger ${expandida ? 'px-4' : 'justify-content-center px-0'}`}
              title={!expandida ? 'Sair' : ''}
            >
              <div className="d-flex align-items-center gap-3">
                <LogOut size={17} style={{ flexShrink: 0 }} />
                {expandida && <span className="fw-medium" style={{ fontSize: '0.85rem' }}>Sair da conta</span>}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>

        {/* Top bar */}
        <div
          className="bg-white shadow-sm border-bottom d-flex align-items-center justify-content-between px-3"
          style={{ height: '66px', zIndex: 1020, flexShrink: 0 }}
        >
          <button className="btn btn-light border-0 p-2 d-md-none me-2" onClick={() => setMobileAberto(true)}>
            <Menu size={22} />
          </button>

          <div className="position-relative flex-grow-1" style={{ maxWidth: '360px' }}>
            <div
              className={`input-group rounded-pill overflow-hidden border ${buscaAtiva ? 'border-primary' : 'border-0'}`}
              style={{ background: escuro ? '#334155' : '#f1f5f9' }}
            >
              <span className="input-group-text bg-transparent border-0 text-muted ps-3 pe-1">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-0 shadow-none"
                placeholder="Busca global (Imóveis, Clientes…)"
                style={{ fontSize: '0.83rem' }}
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                onFocus={() => setBuscaAtiva(true)}
                onBlur={() => setTimeout(() => setBuscaAtiva(false), 150)}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 ms-3">
            <button className="btn btn-light rounded-circle p-2 border-0" onClick={() => setEscuro(!escuro)} title={escuro ? 'Modo claro' : 'Modo escuro'}>
              {escuro ? <Sun size={17} className="text-warning" /> : <Moon size={17} className="text-secondary" />}
            </button>
            <Notificacoes escuro={escuro} />
            <div
              className="rounded-circle ms-1 overflow-hidden"
              style={{ width: '36px', height: '36px', flexShrink: 0, cursor: 'pointer', border: '2px solid #3b82f6' }}
              onClick={() => navigate('/perfil')}
              title="Meu Perfil"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome ?? 'U')}&background=1e3a8a&color=fff&size=72`}
                alt="avatar"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 overflow-auto flex-grow-1">
          <div className="container-fluid p-0 pb-5" style={{ maxWidth: '1440px' }}>
            <Outlet />
          </div>
        </div>
      </div>

      <ChatBot />
    </div>
  )
}

/* ── Root App ── */
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Bootstrap layout (main app shell) — todas as páginas ficam aqui */}
            <Route element={<RequireAuth><BootstrapLayout /></RequireAuth>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"              element={<Dashboard />} />
              <Route path="/imoveis"                element={<Imoveis />} />
              <Route path="/imoveis/novo"           element={<Imoveis />} />
              <Route path="/propostas"              element={<Propostas />} />
              <Route path="/contratos"              element={<Contratos />} />
              <Route path="/agenda"                 element={<Agenda />} />
              <Route path="/agenda/:id/editar"      element={<Agenda />} />
              <Route path="/tarefas"                element={<Tarefas />} />
              <Route path="/vistorias"              element={<Vistorias />} />
              <Route path="/documentos"             element={<Documentos />} />
              <Route path="/financeiro"             element={<Financeiro />} />
              <Route path="/comissoes"              element={<Comissoes />} />
              <Route path="/relatorios"             element={<Relatorios />} />
              <Route path="/franquias"              element={<Franquias />} />
              <Route path="/usuarios"               element={<Usuarios />} />
              <Route path="/configuracoes"          element={<Configuracoes />} />
              <Route path="/perfil"                 element={<Perfil />} />
              {/* Páginas Tailwind — dentro do mesmo shell para manter sidebar */}
              <Route path="/clientes"               element={<ClientesList />} />
              <Route path="/clientes/novo"          element={<ClienteForm />} />
              <Route path="/clientes/:id/editar"    element={<ClienteForm />} />
              <Route path="/temporadas"             element={<TemporadasList />} />
              <Route path="/temporadas/nova"        element={<TemporadaForm />} />
              <Route path="/temporadas/:id/editar"  element={<TemporadaForm />} />
              <Route path="/royalties"              element={<RoyaltiesList />} />
              <Route path="/atividade"              element={<AtividadeUsuarios />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
