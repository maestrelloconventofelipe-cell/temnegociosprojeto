import { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Home, Wallet,
         ChevronRight, ArrowLeft, Building2, Users, TrendingUp,
         Clock, Star, Bot, BookOpen, Video, Bell, BarChart3,
         MessageCircle, HeadphonesIcon, Shield, Cloud,
         Lightbulb, Wifi, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const PERFIS = [
  {
    id: 'admin',
    Icone: ShieldCheck,
    cor: '#a78bfa',
    bg: '#4c1d95',
    titulo: 'Tem Admin',
    desc: 'Acesso completo ao sistema',
  },
  {
    id: 'corretor',
    Icone: Home,
    cor: '#fdba74',
    bg: '#7c2d12',
    titulo: 'Corretores',
    desc: 'Acesso ao CRM do Corretor',
  },
  {
    id: 'financeiro',
    Icone: Wallet,
    cor: '#6ee7b7',
    bg: '#064e3b',
    titulo: 'Financeiro',
    desc: 'Acesso ao módulo financeiro',
  },
]

function destinoPorRole(role) {
  return role === 'financeiro' ? '/financeiro'
    : (role === 'corretor' || role === 'captador') ? '/imoveis'
    : '/dashboard'
}

const lbl = {
  color: '#94a3b8', fontSize: '0.63rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px',
}
function inp(pl = '12px', pr = '12px') {
  return {
    width: '100%', padding: `10px ${pr} 10px ${pl}`, borderRadius: '8px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '0.83rem', outline: 'none', display: 'block',
  }
}

export default function Login() {
  const [passo, setPasso]           = useState(1)
  const [perfil, setPerfil]         = useState(null)
  const [tenantId, setTenantId]     = useState('')
  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [verSenha, setVerSenha]     = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [franquias, setFranquias]   = useState([])
  const { login, user } = useAuth()

  useEffect(() => {
    if (user) { window.location.replace(destinoPorRole(user.role)); return }
    api.get('/tenants/public').then(r => {
      setFranquias(r.data)
      if (r.data.length === 1) setTenantId(String(r.data[0].id))
    }).catch(() => {})
  }, [])

  function selecionarPerfil(p) { setPerfil(p); setPasso(2) }
  function voltar() { setPasso(1); setPerfil(null) }

  async function handleLogin(e) {
    e.preventDefault()
    if (!tenantId) { toast.error('Selecione a franquia.'); return }
    setCarregando(true)
    try {
      const res = await api.post('/auth/login', { tenant_id: Number(tenantId), email, senha })
      login(res.data.token, res.data.user)
      toast.success(`Bem-vindo(a), ${res.data.user.nome.split(' ')[0]}!`)
      window.location.replace(destinoPorRole(res.data.user.role))
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Credenciais inválidas.')
    } finally { setCarregando(false) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════════════════════════════════
          PAINEL ESQUERDO — Seleção de perfil
      ══════════════════════════════════════════ */}
      <div style={{
        width: '340px', flexShrink: 0, minHeight: '100vh',
        background: 'linear-gradient(180deg,#0d1b3e 0%,#0f2557 55%,#0a1a35 100%)',
        display: 'flex', flexDirection: 'column', padding: '32px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute',width:'260px',height:'260px',borderRadius:'50%',background:'rgba(99,102,241,0.06)',top:'-60px',right:'-60px',pointerEvents:'none' }} />
        <div style={{ position:'absolute',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(59,130,246,0.05)',bottom:'80px',left:'-50px',pointerEvents:'none' }} />

        {/* Logo */}
        <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'36px' }}>
          <img
            src="/logo-tem-negocios.png"
            alt="Tem Negócios"
            style={{ height:'52px', width:'auto', objectFit:'contain', filter:'drop-shadow(0 2px 8px rgba(99,102,241,0.4))' }}
          />
        </div>

        {passo === 1 ? (
          <div style={{ flex:1 }}>
            <h2 style={{ color:'white',fontWeight:800,fontSize:'1.2rem',margin:'0 0 4px 0' }}>Quem está acessando?</h2>
            <p style={{ color:'#93c5fd',fontSize:'0.78rem',margin:'0 0 24px 0' }}>Selecione seu perfil para continuar</p>

            <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
              {PERFIS.map(p => (
                <button key={p.id} onClick={() => selecionarPerfil(p)}
                  style={{
                    background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:'12px',padding:'13px 14px',display:'flex',alignItems:'center',
                    gap:'12px',cursor:'pointer',width:'100%',textAlign:'left',transition:'all 0.18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background='rgba(255,255,255,0.09)'
                    e.currentTarget.style.borderColor=p.cor+'55'
                    e.currentTarget.style.transform='translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background='rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'
                    e.currentTarget.style.transform='translateX(0)'
                  }}
                >
                  <div style={{ width:'40px',height:'40px',borderRadius:'10px',background:p.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <p.Icone size={19} color={p.cor} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'white',fontWeight:700,fontSize:'0.9rem',lineHeight:1.3 }}>{p.titulo}</div>
                    <div style={{ color:'#64748b',fontSize:'0.7rem',marginTop:'2px' }}>{p.desc}</div>
                  </div>
                  <ChevronRight size={15} color="#475569" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex:1,display:'flex',flexDirection:'column' }}>
            <button onClick={voltar} style={{
              background:'none',border:'none',color:'#93c5fd',cursor:'pointer',
              display:'flex',alignItems:'center',gap:'6px',fontSize:'0.78rem',
              padding:0,marginBottom:'20px',fontWeight:600,
            }}>
              <ArrowLeft size={13} /> Voltar
            </button>

            {perfil && (
              <div style={{
                display:'flex',alignItems:'center',gap:'10px',
                background:`${perfil.bg}55`,border:`1px solid ${perfil.cor}33`,
                borderRadius:'10px',padding:'10px 13px',marginBottom:'20px',
              }}>
                <div style={{ width:'32px',height:'32px',borderRadius:'8px',background:perfil.bg,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <perfil.Icone size={16} color={perfil.cor} />
                </div>
                <div>
                  <div style={{ color:'white',fontWeight:600,fontSize:'0.82rem' }}>{perfil.titulo}</div>
                  <div style={{ color:'#64748b',fontSize:'0.65rem' }}>{perfil.desc}</div>
                </div>
              </div>
            )}

            <h2 style={{ color:'white',fontWeight:800,fontSize:'1.1rem',margin:'0 0 4px 0' }}>Entrar no sistema</h2>
            <p style={{ color:'#93c5fd',fontSize:'0.75rem',margin:'0 0 20px 0' }}>Preencha suas credenciais de acesso</p>

            <form onSubmit={handleLogin} style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
              <div>
                <label style={lbl}>Franquia *</label>
                <select required value={tenantId} onChange={e => setTenantId(e.target.value)} style={inp()}>
                  <option value="" style={{ background:'#0f2557' }}>Selecione a franquia...</option>
                  {franquias.map(f => (
                    <option key={f.id} value={f.id} style={{ background:'#0f2557',color:'white' }}>
                      {f.nome} — {f.cidade}/{f.estado}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>E-mail *</label>
                <div style={{ position:'relative' }}>
                  <Mail size={13} color="#475569" style={{ position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)' }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seuemail@dominio.com" style={inp('36px')}
                    onFocus={e => e.target.style.borderColor='#3b82f6'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              <div>
                <label style={lbl}>Senha *</label>
                <div style={{ position:'relative' }}>
                  <Lock size={13} color="#475569" style={{ position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)' }} />
                  <input type={verSenha ? 'text' : 'password'} required value={senha} onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••" style={inp('36px','36px')}
                    onFocus={e => e.target.style.borderColor='#3b82f6'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                  />
                  <button type="button" onClick={() => setVerSenha(!verSenha)}
                    style={{ position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#475569',padding:0 }}>
                    {verSenha ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={carregando} style={{
                marginTop:'4px',padding:'12px',borderRadius:'10px',
                background: carregando ? '#1d4ed8' : 'linear-gradient(135deg,#4f46e5,#2563eb)',
                border:'none',color:'white',fontWeight:700,fontSize:'0.88rem',
                cursor: carregando ? 'not-allowed' : 'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                boxShadow:'0 4px 14px rgba(79,70,229,0.4)', opacity: carregando ? 0.85 : 1,
              }}>
                {carregando
                  ? <><span style={{ width:'14px',height:'14px',border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }} /> Autenticando...</>
                  : 'Entrar no Sistema'
                }
              </button>
            </form>
          </div>
        )}

        <div style={{ marginTop:'24px',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'14px' }}>
          <p style={{ color:'#334155',fontSize:'0.65rem',textAlign:'center',margin:0 }}>
            Tem Negócios Imobiliários · Gestão de Franquias
          </p>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: #334155 !important; }
        `}</style>
      </div>

      {/* ══════════════════════════════════════════
          PAINEL DIREITO — Conteúdo / Marketing
      ══════════════════════════════════════════ */}
      <div style={{ flex:1, overflowY:'auto', background:'#f0f4ff', display:'flex', flexDirection:'column' }}>

        {/* Hero */}
        <div style={{
          background:'linear-gradient(135deg,#dbeafe 0%,#ede9fe 100%)',
          padding:'32px 32px 28px', display:'flex', gap:'20px', alignItems:'flex-start',
        }}>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'2rem',fontWeight:900,color:'#0f172a',lineHeight:1.15,margin:'0 0 12px 0' }}>
              Bem-vindo à<br /><span style={{ color:'#2563eb' }}>Tem Negócios!</span>
            </h1>
            <p style={{ color:'#475569',fontSize:'0.85rem',lineHeight:1.65,margin:'0 0 24px 0',maxWidth:'420px' }}>
              A plataforma completa para gestão imobiliária que conecta pessoas,
              oportunidades e resultados.<br />
              Aqui você tem todas as ferramentas para organizar seu dia a dia,
              fortalecer relacionamentos e fechar mais negócios com eficiência e segurança.
            </p>
            <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
              {[
                { Ic: Building2,  label:'Mais organização' },
                { Ic: Users,      label:'Mais produtividade' },
                { Ic: TrendingUp, label:'Mais resultados' },
                { Ic: Clock,      label:'Mais tempo para você' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',minWidth:'72px' }}>
                  <div style={{ width:'46px',height:'46px',background:'white',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
                    <f.Ic size={20} color="#2563eb" />
                  </div>
                  <span style={{ color:'#334155',fontSize:'0.66rem',fontWeight:600,textAlign:'center',lineHeight:1.3 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget IA */}
          <div style={{ background:'white',borderRadius:'16px',padding:'18px',width:'210px',flexShrink:0,boxShadow:'0 4px 20px rgba(0,0,0,0.08)',border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px' }}>
              <div style={{ width:'30px',height:'30px',background:'#dbeafe',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Bot size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight:700,fontSize:'0.75rem',color:'#0f172a' }}>Conte com a IA</div>
                <div style={{ fontSize:'0.62rem',color:'#60a5fa' }}>da Tem Negócios</div>
              </div>
            </div>
            <p style={{ fontSize:'0.7rem',color:'#64748b',margin:'0 0 12px 0',lineHeight:1.5 }}>
              Para te ajudar a vender, alugar e encantar seus clientes!
            </p>
            <button style={{ width:'100%',padding:'8px',background:'#2563eb',border:'none',borderRadius:'8px',color:'white',fontWeight:600,fontSize:'0.72rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px' }}>
              <MessageCircle size={12} /> Conversar com a IA
            </button>
          </div>
        </div>

        {/* Linha do meio: Dica / Indicadores / IA */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px',padding:'16px 32px 0' }}>

          {/* Dica do dia */}
          <div style={{ background:'white',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'12px' }}>
              <Lightbulb size={14} color="#f59e0b" />
              <span style={{ fontWeight:700,fontSize:'0.8rem',color:'#0f172a' }}>Dica do dia</span>
            </div>
            <div style={{ display:'flex',gap:'10px',alignItems:'flex-start' }}>
              <Star size={28} color="#f59e0b" fill="#fef3c7" style={{ flexShrink:0,marginTop:'2px' }} />
              <p style={{ fontSize:'0.75rem',color:'#475569',lineHeight:1.55,margin:0,fontStyle:'italic' }}>
                "Cadastre fotos de qualidade e descrições completas para aumentar a taxa de conversão dos seus imóveis."
              </p>
            </div>
          </div>

          {/* Indicadores da rede */}
          <div style={{ background:'white',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'12px' }}>
              <Wifi size={14} color="#2563eb" />
              <span style={{ fontWeight:700,fontSize:'0.8rem',color:'#0f172a' }}>Indicadores da rede</span>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>
              {[
                { Ic: Building2,  num:'12.548', label:'Imóveis Ativos', cor:'#2563eb' },
                { Ic: Users,      num:'3.125',  label:'Corretores',     cor:'#7c3aed' },
                { Ic: BarChart3,  num:'187',    label:'Franquias',      cor:'#0891b2' },
                { Ic: TrendingUp, num:'842',    label:'Leads Hoje',     cor:'#059669' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center',padding:'8px',background:'#f8fafc',borderRadius:'8px' }}>
                  <s.Ic size={15} color={s.cor} style={{ marginBottom:'3px' }} />
                  <div style={{ fontWeight:800,fontSize:'1.05rem',color:'#0f172a',lineHeight:1 }}>{s.num}</div>
                  <div style={{ fontSize:'0.6rem',color:'#64748b',lineHeight:1.3,marginTop:'2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IA Tem Negócios */}
          <div style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81)',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'10px' }}>
              <Bot size={14} color="#818cf8" />
              <span style={{ fontWeight:700,fontSize:'0.8rem',color:'white' }}>IA Tem Negócios</span>
            </div>
            <p style={{ fontSize:'0.7rem',color:'#a5b4fc',lineHeight:1.4,margin:'0 0 10px 0' }}>Nosso assistente inteligente auxilia em:</p>
            {['Avaliação de imóveis','Atendimento inicial via WhatsApp','Contratos e documentos','Relatórios gerenciais'].map(item => (
              <div key={item} style={{ display:'flex',alignItems:'center',gap:'6px',marginBottom:'5px' }}>
                <div style={{ width:'5px',height:'5px',borderRadius:'50%',background:'#818cf8',flexShrink:0 }} />
                <span style={{ fontSize:'0.68rem',color:'#c7d2fe' }}>{item}</span>
              </div>
            ))}
            <button style={{ marginTop:'12px',width:'100%',padding:'8px',background:'rgba(129,140,248,0.2)',border:'1px solid rgba(129,140,248,0.35)',borderRadius:'8px',color:'#c7d2fe',fontWeight:600,fontSize:'0.7rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px' }}>
              Conversar com a IA <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {/* Linha inferior: Treinamento / Novidades / Suporte */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px',padding:'16px 32px' }}>

          {/* Central de Treinamento */}
          <div style={{ background:'white',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'4px' }}>
              <BookOpen size={14} color="#7c3aed" />
              <span style={{ fontWeight:700,fontSize:'0.8rem',color:'#0f172a' }}>Central de Treinamento</span>
            </div>
            <p style={{ fontSize:'0.7rem',color:'#64748b',margin:'0 0 14px 0',lineHeight:1.4 }}>
              Aprenda, evolua e descubra todo o potencial da plataforma.
            </p>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px',marginBottom:'12px' }}>
              {[
                { Ic: Video,     label:'Vídeos' },
                { Ic: BookOpen,  label:'Manuais' },
                { Ic: Users,     label:'Cursos' },
                { Ic: Bell,      label:'Novidades' },
              ].map(t => (
                <div key={t.label} style={{ textAlign:'center',padding:'8px',background:'#f5f3ff',borderRadius:'8px',cursor:'pointer' }}>
                  <t.Ic size={15} color="#7c3aed" />
                  <div style={{ fontSize:'0.62rem',color:'#6d28d9',fontWeight:600,marginTop:'3px' }}>{t.label}</div>
                </div>
              ))}
            </div>
            <button style={{ width:'100%',padding:'7px',background:'none',border:'1px solid #7c3aed',borderRadius:'8px',color:'#7c3aed',fontWeight:600,fontSize:'0.7rem',cursor:'pointer' }}>
              Acessar central de treinamento →
            </button>
          </div>

          {/* Novidades da plataforma */}
          <div style={{ background:'white',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:'7px' }}>
                <Bell size={14} color="#0891b2" />
                <span style={{ fontWeight:700,fontSize:'0.8rem',color:'#0f172a' }}>Novidades da plataforma</span>
              </div>
              <span style={{ fontSize:'0.65rem',color:'#0891b2',cursor:'pointer',fontWeight:600 }}>Ver todas</span>
            </div>
            {[
              'Novo módulo de avaliações com IA',
              'Integração com WhatsApp Business',
              'Relatórios personalizados',
            ].map(item => (
              <div key={item} style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px' }}>
                <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:'#0891b2',flexShrink:0 }} />
                <span style={{ fontSize:'0.72rem',color:'#334155',flex:1 }}>{item}</span>
                <span style={{ background:'#dcfce7',color:'#166534',fontSize:'0.58rem',fontWeight:700,padding:'2px 6px',borderRadius:'4px' }}>Novo</span>
              </div>
            ))}
          </div>

          {/* Precisa de ajuda */}
          <div style={{ background:'white',borderRadius:'14px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'8px' }}>
              <HeadphonesIcon size={14} color="#0891b2" />
              <span style={{ fontWeight:700,fontSize:'0.8rem',color:'#0f172a' }}>Precisa de ajuda?</span>
            </div>
            <p style={{ fontSize:'0.72rem',color:'#64748b',lineHeight:1.5,margin:'0 0 14px 0' }}>
              Nossa equipe de suporte está pronta para te atender.
            </p>
            <button style={{
              width:'100%',padding:'9px',background:'#0891b2',border:'none',
              borderRadius:'8px',color:'white',fontWeight:700,fontSize:'0.72rem',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
            }}>
              <HeadphonesIcon size={12} /> Abrir chamado de suporte →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop:'1px solid #e2e8f0',padding:'14px 32px',display:'flex',gap:'32px',background:'white',marginTop:'auto' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
            <Shield size={14} color="#64748b" />
            <div>
              <div style={{ fontWeight:600,fontSize:'0.7rem',color:'#334155' }}>Segurança e privacidade</div>
              <div style={{ fontSize:'0.62rem',color:'#94a3b8' }}>Seus dados protegidos com tecnologia de ponta</div>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
            <Cloud size={14} color="#64748b" />
            <div>
              <div style={{ fontWeight:600,fontSize:'0.7rem',color:'#334155' }}>Sistema 100% na nuvem</div>
              <div style={{ fontSize:'0.62rem',color:'#94a3b8' }}>Acesse de qualquer lugar, a qualquer hora</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
