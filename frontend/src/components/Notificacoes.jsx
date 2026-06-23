import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Info, Calendar, ClipboardList, FileText, DollarSign, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const TIPO_ICONE = {
  agenda:   <Calendar size={15} className="text-primary" />,
  tarefa:   <ClipboardList size={15} className="text-warning" />,
  proposta: <FileText size={15} className="text-success" />,
  contrato: <FileText size={15} className="text-info" />,
  financeiro: <DollarSign size={15} className="text-success" />,
  sistema:  <Settings size={15} className="text-secondary" />,
}

function tempoRelativo(data) {
  const diff = (Date.now() - new Date(data).getTime()) / 1000
  if (diff < 60)   return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function Notificacoes({ escuro }) {
  const [aberto, setAberto]         = useState(false)
  const [lista, setLista]           = useState([])
  const [naoLidas, setNaoLidas]     = useState(0)
  const [carregando, setCarregando] = useState(false)
  const ref    = useRef(null)
  const navigate = useNavigate()

  async function carregar() {
    try {
      const [r1, r2] = await Promise.all([
        api.get('/notificacoes'),
        api.get('/notificacoes/nao-lidas'),
      ])
      setLista(r1.data)
      setNaoLidas(r2.data.total)
    } catch {}
  }

  useEffect(() => {
    carregar()
    const id = setInterval(carregar, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function fora(e) { if (ref.current && !ref.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [])

  async function marcarLida(notif) {
    if (!notif.lida) {
      await api.put(`/notificacoes/${notif.id}/lida`).catch(() => {})
      setLista(l => l.map(n => n.id === notif.id ? { ...n, lida: true } : n))
      setNaoLidas(c => Math.max(0, c - 1))
    }
    if (notif.link) { setAberto(false); navigate(notif.link) }
  }

  async function marcarTodas() {
    setCarregando(true)
    await api.put('/notificacoes/todas-lidas').catch(() => {})
    setLista(l => l.map(n => ({ ...n, lida: true })))
    setNaoLidas(0)
    setCarregando(false)
  }

  async function remover(e, id) {
    e.stopPropagation()
    await api.delete(`/notificacoes/${id}`).catch(() => {})
    setLista(l => l.filter(n => n.id !== id))
    setNaoLidas(c => {
      const era = lista.find(n => n.id === id)
      return era && !era.lida ? Math.max(0, c - 1) : c
    })
  }

  const bg    = escuro ? '#1e293b' : '#fff'
  const borda = escuro ? '#334155' : '#e2e8f0'
  const txt   = escuro ? '#f1f5f9' : '#1e293b'
  const sub   = escuro ? '#94a3b8' : '#64748b'
  const hover = escuro ? '#273347' : '#f8fafc'

  return (
    <div className="position-relative" ref={ref}>
      <button
        className="btn btn-light rounded-circle p-2 border-0 position-relative"
        onClick={() => { setAberto(!aberto); if (!aberto) carregar() }}
        title="Notificações"
      >
        <Bell size={18} />
        {naoLidas > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem', minWidth: '18px', padding: '3px 5px' }}>
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="position-absolute end-0 mt-2 shadow-lg rounded-4 overflow-hidden"
          style={{ width: '360px', zIndex: 2000, background: bg, border: `1px solid ${borda}` }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between px-3 py-2"
            style={{ borderBottom: `1px solid ${borda}` }}>
            <span className="fw-bold" style={{ color: txt, fontSize: '0.9rem' }}>
              Notificações {naoLidas > 0 && <span className="badge bg-danger ms-1" style={{ fontSize: '0.65rem' }}>{naoLidas}</span>}
            </span>
            {naoLidas > 0 && (
              <button className="btn btn-link btn-sm p-0 text-decoration-none d-flex align-items-center gap-1"
                style={{ color: '#3b82f6', fontSize: '0.75rem' }}
                onClick={marcarTodas} disabled={carregando}>
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {lista.length === 0 ? (
              <div className="text-center py-5" style={{ color: sub }}>
                <Bell size={32} strokeWidth={1} className="mb-2 d-block mx-auto" style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '0.85rem' }}>Nenhuma notificação</span>
              </div>
            ) : (
              lista.map(n => (
                <div key={n.id}
                  onClick={() => marcarLida(n)}
                  className="d-flex align-items-start gap-3 px-3 py-2 position-relative"
                  style={{
                    cursor: n.link ? 'pointer' : 'default',
                    background: n.lida ? 'transparent' : (escuro ? 'rgba(59,130,246,0.08)' : '#eff6ff'),
                    borderBottom: `1px solid ${borda}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = hover}
                  onMouseLeave={e => e.currentTarget.style.background = n.lida ? 'transparent' : (escuro ? 'rgba(59,130,246,0.08)' : '#eff6ff')}
                >
                  {!n.lida && (
                    <span className="position-absolute" style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#3b82f6', top: '50%', left: '8px', transform: 'translateY(-50%)'
                    }} />
                  )}
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 mt-1"
                    style={{ width: '32px', height: '32px', background: escuro ? '#334155' : '#f1f5f9' }}>
                    {TIPO_ICONE[n.tipo] ?? <Info size={15} className="text-muted" />}
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div className="fw-semibold" style={{ fontSize: '0.82rem', color: txt, lineHeight: 1.3 }}>{n.titulo}</div>
                    {n.mensagem && (
                      <div style={{ fontSize: '0.75rem', color: sub, marginTop: '2px', lineHeight: 1.4 }}
                        className="text-truncate">{n.mensagem}</div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: sub, marginTop: '3px' }}>
                      {tempoRelativo(n.created_at)}
                    </div>
                  </div>
                  <button className="btn p-1 border-0 flex-shrink-0"
                    style={{ color: sub, background: 'transparent', opacity: 0.6 }}
                    onClick={e => remover(e, n.id)}
                    title="Remover">
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {lista.length > 0 && (
            <div className="text-center py-2" style={{ borderTop: `1px solid ${borda}` }}>
              <button className="btn btn-link btn-sm text-decoration-none p-0"
                style={{ color: '#3b82f6', fontSize: '0.78rem' }}
                onClick={() => { marcarTodas(); setAberto(false) }}>
                Limpar todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
