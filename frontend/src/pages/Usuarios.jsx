import { useState, useEffect } from 'react'
import { Plus, Users, Search, Edit2, Trash2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const ROLES = [
  'administrador_matriz','diretor_regional','franqueado','corretor',
  'captador','financeiro','juridico','funcionario_administrativo','auditor_rede',
]
const ROLE_LABEL = {
  administrador_matriz: 'Adm. Matriz', diretor_regional: 'Diretor Regional',
  franqueado: 'Franqueado', corretor: 'Corretor', captador: 'Captador',
  financeiro: 'Financeiro', juridico: 'Jurídico',
  funcionario_administrativo: 'Func. Adm.', auditor_rede: 'Auditor',
}
const ROLE_COR = {
  administrador_matriz: 'danger', diretor_regional: 'purple', franqueado: 'primary',
  corretor: 'info', captador: 'teal', financeiro: 'success', juridico: 'warning',
  funcionario_administrativo: 'secondary', auditor_rede: 'dark',
}

const VAZIO = { nome: '', email: '', senha: '', role: 'corretor', telefone: '', ativo: true }

export default function Usuarios() {
  const [lista, setLista]     = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca]     = useState('')
  const [form, setForm]       = useState(VAZIO)
  const [editId, setEditId]   = useState(null)
  const [showModal, setShow]  = useState(false)

  async function carregar() {
    setLoading(true)
    try { const r = await api.get('/usuarios'); setLista(r.data) }
    catch { toast.error('Erro ao carregar usuários.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(u = null) {
    if (u) { setForm({ ...VAZIO, ...u, senha: '' }); setEditId(u.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    const payload = { ...form }
    if (editId && !payload.senha) delete payload.senha
    try {
      if (editId) await api.put(`/usuarios/${editId}`, payload)
      else        await api.post('/usuarios', payload)
      toast.success(editId ? 'Usuário atualizado!' : 'Usuário criado!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir este usuário?')) return
    try { await api.delete(`/usuarios/${id}`); toast.success('Excluído!'); carregar() }
    catch (err) { toast.error(err.response?.data?.erro || 'Erro ao excluir.') }
  }

  const filtrada = lista.filter(u =>
    !busca ||
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Equipe</h4>
          <p className="text-muted small mb-0">{lista.length} usuários cadastrados</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
          <input className="form-control border-0 shadow-none" placeholder="Buscar por nome ou e-mail..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>USUÁRIO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>FUNÇÃO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TELEFONE</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-5">Nenhum usuário encontrado.</td></tr>
                ) : filtrada.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome)}&background=0D8ABC&color=fff&size=36`}
                          alt="" className="rounded-circle" style={{ width: '36px', height: '36px' }} />
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>{u.nome}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill bg-${ROLE_COR[u.role] ?? 'secondary'} bg-opacity-10 text-${ROLE_COR[u.role] ?? 'secondary'}`}
                        style={{ border: `1px solid var(--bs-${ROLE_COR[u.role] ?? 'secondary'})` }}>
                        <Shield size={10} className="me-1" />
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.83rem', color: '#64748b' }}>{u.telefone || '—'}</td>
                    <td>
                      <span className={`badge rounded-pill ${u.ativo ? 'bg-success' : 'bg-secondary'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(u)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(u.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Usuário' : 'Novo Usuário'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">NOME COMPLETO *</label>
                      <input className="form-control rounded-3" required value={form.nome}
                        onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">E-MAIL *</label>
                      <input className="form-control rounded-3" required type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">
                        {editId ? 'NOVA SENHA (deixe em branco para manter)' : 'SENHA *'}
                      </label>
                      <input className="form-control rounded-3" type="password"
                        required={!editId} minLength={6} value={form.senha}
                        onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">FUNÇÃO *</label>
                      <select className="form-select rounded-3" required value={form.role}
                        onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.telefone}
                        onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="ativo"
                          checked={form.ativo} onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))} />
                        <label className="form-check-label" htmlFor="ativo">Usuário ativo</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={fechar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-3">
                    {editId ? 'Salvar alterações' : 'Criar usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
