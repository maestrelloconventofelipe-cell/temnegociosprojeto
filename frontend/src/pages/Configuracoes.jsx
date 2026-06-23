import { useState } from 'react'
import { Settings, Save, Database, Bell, Shield, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

export default function Configuracoes() {
  const [tab, setTab] = useState('geral')
  const [geral, setGeral] = useState({ nome_sistema: 'Tem Negócios', suporte_email: '', telefone_suporte: '' })
  const [notif, setNotif] = useState({ vencimento_antecedencia: 30, email_alertas: true, push_alertas: false })
  const [saving, setSaving] = useState(false)

  async function salvarGeral(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/configuracoes/geral', geral)
      toast.success('Configurações salvas!')
    } catch { toast.error('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function salvarNotif(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/configuracoes/notificacoes', notif)
      toast.success('Notificações configuradas!')
    } catch { toast.error('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  const tabs = [
    { id: 'geral',      Icon: Globe,    label: 'Geral' },
    { id: 'notificacoes', Icon: Bell,   label: 'Notificações' },
    { id: 'seguranca',  Icon: Shield,   label: 'Segurança' },
    { id: 'banco',      Icon: Database, label: 'Banco de dados' },
  ]

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <Settings size={20} /> Configurações
        </h4>
        <p className="text-muted small mb-0">Configurações gerais do sistema</p>
      </div>

      <div className="d-flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.id}
            className={`btn rounded-3 d-flex align-items-center gap-2 ${tab === t.id ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setTab(t.id)}>
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '600px' }}>
          <h6 className="fw-semibold text-dark mb-3">Configurações gerais</h6>
          <form onSubmit={salvarGeral}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-bold text-muted">NOME DO SISTEMA</label>
                <input className="form-control rounded-3" value={geral.nome_sistema}
                  onChange={e => setGeral(p => ({ ...p, nome_sistema: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold text-muted">E-MAIL DE SUPORTE</label>
                <input className="form-control rounded-3" type="email" value={geral.suporte_email}
                  onChange={e => setGeral(p => ({ ...p, suporte_email: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold text-muted">TELEFONE DE SUPORTE</label>
                <input className="form-control rounded-3" value={geral.telefone_suporte}
                  onChange={e => setGeral(p => ({ ...p, telefone_suporte: e.target.value }))} />
              </div>
              <div className="col-12">
                <button type="submit" disabled={saving}
                  className="btn btn-primary rounded-3 d-flex align-items-center gap-2">
                  <Save size={15} /> Salvar configurações
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {tab === 'notificacoes' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '600px' }}>
          <h6 className="fw-semibold text-dark mb-3">Alertas e notificações</h6>
          <form onSubmit={salvarNotif}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-bold text-muted">ALERTAR VENCIMENTO COM (dias de antecedência)</label>
                <input className="form-control rounded-3" type="number" min="1" max="90" value={notif.vencimento_antecedencia}
                  onChange={e => setNotif(p => ({ ...p, vencimento_antecedencia: e.target.value }))} />
              </div>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="emailAlerta"
                    checked={notif.email_alertas} onChange={e => setNotif(p => ({ ...p, email_alertas: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="emailAlerta">Alertas por e-mail</label>
                </div>
              </div>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="pushAlerta"
                    checked={notif.push_alertas} onChange={e => setNotif(p => ({ ...p, push_alertas: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="pushAlerta">Notificações push</label>
                </div>
              </div>
              <div className="col-12">
                <button type="submit" disabled={saving}
                  className="btn btn-primary rounded-3 d-flex align-items-center gap-2">
                  <Save size={15} /> Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {tab === 'seguranca' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '600px' }}>
          <h6 className="fw-semibold text-dark mb-3">Segurança</h6>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
              <div>
                <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>Autenticação JWT</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Tokens expiram em 8 horas</div>
              </div>
              <span className="badge bg-success rounded-pill">Ativo</span>
            </div>
            <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
              <div>
                <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>Controle por função (RBAC)</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>9 funções configuradas</div>
              </div>
              <span className="badge bg-success rounded-pill">Ativo</span>
            </div>
            <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3">
              <div>
                <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>Senhas com bcrypt</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Hash seguro de senhas</div>
              </div>
              <span className="badge bg-success rounded-pill">Ativo</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'banco' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '600px' }}>
          <h6 className="fw-semibold text-dark mb-3">Banco de dados</h6>
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="fw-semibold text-success mb-1">Supabase PostgreSQL</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>Conectado via DATABASE_URL do backend</div>
            </div>
            <div className="p-3 rounded-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div className="fw-semibold text-primary mb-1">Storage Supabase</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>Bucket: imoveis-fotos · documentos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
