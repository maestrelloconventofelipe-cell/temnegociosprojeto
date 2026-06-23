import { useState } from 'react'
import { User, Mail, Lock, Phone, Save, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const ROLE_LABEL = {
  administrador_matriz: 'Administrador Matriz', diretor_regional: 'Diretor Regional',
  franqueado: 'Franqueado', corretor: 'Corretor', captador: 'Captador',
  financeiro: 'Financeiro', juridico: 'Jurídico',
  funcionario_administrativo: 'Func. Administrativo', auditor_rede: 'Auditor de Rede',
}

export default function Perfil() {
  const { user, login } = useAuth()
  const [nome, setNome]           = useState(user?.nome ?? '')
  const [telefone, setTelefone]   = useState(user?.telefone ?? '')
  const [senhaAtual, setSenhaAt]  = useState('')
  const [novaSenha, setNovaSen]   = useState('')
  const [confirmSenha, setConf]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function salvarPerfil(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await api.put('/usuarios/perfil', { nome, telefone })
      const novoUser = { ...user, nome: r.data.nome ?? nome, telefone: r.data.telefone ?? telefone }
      const token = localStorage.getItem('token') ?? ''
      login(token, novoUser)
      toast.success('Perfil atualizado!')
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function alterarSenha(e) {
    e.preventDefault()
    if (novaSenha !== confirmSenha) { toast.error('Senhas não conferem.'); return }
    if (novaSenha.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres.'); return }
    setSaving(true)
    try {
      await api.put('/usuarios/senha', { senha_atual: senhaAtual, nova_senha: novaSenha })
      toast.success('Senha alterada!')
      setSenhaAt(''); setNovaSen(''); setConf('')
    } catch (err) { toast.error(err.response?.data?.erro || 'Senha atual incorreta.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <h4 className="fw-bold text-dark mb-1">Meu Perfil</h4>
      <p className="text-muted small mb-4">Gerencie seus dados pessoais e senha</p>

      <div className="row g-4">
        {/* Avatar e info */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome ?? 'U')}&background=0D8ABC&color=fff&size=96`}
              alt="avatar" className="rounded-circle mx-auto mb-3 shadow-sm"
              style={{ width: '96px', height: '96px' }} />
            <h5 className="fw-bold text-dark mb-1">{user?.nome}</h5>
            <p className="text-muted small mb-2">{user?.email}</p>
            <span className="badge bg-primary rounded-pill px-3 py-2">
              <Shield size={11} className="me-1" />
              {ROLE_LABEL[user?.role] ?? user?.role}
            </span>
            {user?.tenant_nome && (
              <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
                🏢 {user.tenant_nome}
              </p>
            )}
          </div>
        </div>

        <div className="col-md-8">
          {/* Dados pessoais */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3">
            <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2"><User size={15} /> Dados pessoais</h6>
            <form onSubmit={salvarPerfil}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">NOME COMPLETO</label>
                  <input className="form-control rounded-3" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">E-MAIL</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0 text-muted"><Mail size={14} /></span>
                    <input className="form-control rounded-end rounded-3 bg-light" value={user?.email ?? ''} readOnly />
                  </div>
                  <small className="text-muted">E-mail não pode ser alterado aqui.</small>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">TELEFONE</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0 text-muted"><Phone size={14} /></span>
                    <input className="form-control" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="col-12">
                  <button type="submit" disabled={saving}
                    className="btn btn-primary rounded-3 d-flex align-items-center gap-2">
                    <Save size={15} /> Salvar dados
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Alterar senha */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2"><Lock size={15} /> Alterar senha</h6>
            <form onSubmit={alterarSenha}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">SENHA ATUAL</label>
                  <input className="form-control rounded-3" type="password" required
                    value={senhaAtual} onChange={e => setSenhaAt(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">NOVA SENHA</label>
                  <input className="form-control rounded-3" type="password" required minLength={6}
                    value={novaSenha} onChange={e => setNovaSen(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">CONFIRMAR NOVA SENHA</label>
                  <input className="form-control rounded-3" type="password" required minLength={6}
                    value={confirmSenha} onChange={e => setConf(e.target.value)} />
                </div>
                <div className="col-12">
                  <button type="submit" disabled={saving}
                    className="btn btn-outline-danger rounded-3 d-flex align-items-center gap-2">
                    <Lock size={15} /> Alterar senha
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
