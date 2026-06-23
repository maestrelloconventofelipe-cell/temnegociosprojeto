import { useState, useEffect } from 'react'
import { Plus, Building, MapPin, Search, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const VAZIO = {
  nome_fantasia: '', razao_social: '', cnpj: '', email: '', telefone: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  status: 'ativo',
}

export default function Franquias() {
  const [lista, setLista]     = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca]     = useState('')
  const [form, setForm]       = useState(VAZIO)
  const [editId, setEditId]   = useState(null)
  const [showModal, setShow]  = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  async function carregar() {
    setLoading(true)
    try { const r = await api.get('/tenants'); setLista(r.data) }
    catch { toast.error('Erro ao carregar franquias.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(f = null) {
    if (f) { setForm({ ...VAZIO, ...f }); setEditId(f.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function buscarCep(cep) {
    const c = cep.replace(/\D/g, '')
    if (c.length !== 8) return
    setBuscandoCep(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const d = await r.json()
      if (!d.erro) setForm(p => ({
        ...p,
        endereco: d.logradouro || p.endereco,
        bairro:   d.bairro    || p.bairro,
        cidade:   d.localidade || p.cidade,
        estado:   d.uf        || p.estado,
      }))
    } catch {}
    finally { setBuscandoCep(false) }
  }

  function handleCep(v) {
    v = v.replace(/\D/g, '').slice(0, 8)
    const mascarado = v.length > 5 ? v.replace(/(\d{5})(\d)/, '$1-$2') : v
    setForm(p => ({ ...p, cep: mascarado }))
    if (v.length === 8) buscarCep(v)
  }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/tenants/${editId}`, form)
      else        await api.post('/tenants', form)
      toast.success(editId ? 'Franquia atualizada!' : 'Franquia cadastrada!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function alterarStatus(f) {
    const novoStatus = f.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await api.patch(`/tenants/${f.id}/status`, { status: novoStatus })
      toast.success(`Franquia ${novoStatus === 'ativo' ? 'ativada' : 'desativada'}!`)
      carregar()
    } catch { toast.error('Erro ao alterar status.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta franquia? Esta ação não pode ser desfeita.')) return
    try { await api.delete(`/tenants/${id}`); toast.success('Excluída!'); carregar() }
    catch (err) { toast.error(err.response?.data?.erro || 'Erro ao excluir.') }
  }

  const filtrada = lista.filter(f =>
    !busca ||
    f.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) ||
    f.cidade?.toLowerCase().includes(busca.toLowerCase()) ||
    f.cnpj?.includes(busca)
  )

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Franquias</h4>
          <p className="text-muted small mb-0">{lista.length} unidades cadastradas</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Nova Franquia
        </button>
      </div>

      {/* Busca */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
          <input className="form-control border-0 shadow-none" placeholder="Buscar por nome, cidade ou CNPJ..."
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="row g-3">
          {filtrada.length === 0 ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
                <Building size={40} strokeWidth={1} className="mx-auto mb-3" />
                <p className="mb-0">Nenhuma franquia encontrada.</p>
              </div>
            </div>
          ) : filtrada.map(f => (
            <div key={f.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                <div style={{ height: '4px', background: f.status === 'ativo' ? 'linear-gradient(90deg,#22c55e,#16a34a)' : '#94a3b8' }} />
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                      style={{ width: '42px', height: '42px' }}>
                      <Building size={20} className="text-primary" />
                    </div>
                    <span className={`badge rounded-pill bg-${f.status === 'ativo' ? 'success' : 'secondary'}`}>
                      {f.status === 'ativo' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">{f.nome_fantasia}</h6>
                  {f.razao_social && <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>{f.razao_social}</p>}
                  {f.cnpj && <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>CNPJ: {f.cnpj}</p>}
                  {(f.cidade || f.estado) && (
                    <p className="text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                      <MapPin size={12} className="me-1" />
                      {[f.cidade, f.estado].filter(Boolean).join('/')}
                    </p>
                  )}
                  {f.email && <p className="text-muted mb-2" style={{ fontSize: '0.78rem' }}>✉ {f.email}</p>}

                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-primary btn-sm rounded-3 flex-grow-1" onClick={() => abrir(f)}>
                      <Edit2 size={13} className="me-1" /> Editar
                    </button>
                    <button
                      className={`btn btn-sm rounded-3 ${f.status === 'ativo' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                      onClick={() => alterarStatus(f)} title={f.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                      {f.status === 'ativo' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                    <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(f.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Franquia' : 'Nova Franquia'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">NOME FANTASIA *</label>
                      <input className="form-control rounded-3" required value={form.nome_fantasia}
                        onChange={e => setForm(p => ({ ...p, nome_fantasia: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">RAZÃO SOCIAL</label>
                      <input className="form-control rounded-3" value={form.razao_social}
                        onChange={e => setForm(p => ({ ...p, razao_social: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">CNPJ</label>
                      <input className="form-control rounded-3" maxLength={18} value={form.cnpj}
                        onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">E-MAIL</label>
                      <input className="form-control rounded-3" type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.telefone}
                        onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
                    </div>

                    <div className="col-12"><hr className="my-1" /><small className="text-muted fw-bold">ENDEREÇO</small></div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted d-flex align-items-center gap-2">
                        CEP
                        {buscandoCep && <span className="spinner-border spinner-border-sm text-primary" style={{width:'12px',height:'12px',borderWidth:'2px'}} />}
                      </label>
                      <input className="form-control rounded-3" maxLength={9} value={form.cep}
                        onChange={e => handleCep(e.target.value)}
                        placeholder="00000-000" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">LOGRADOURO</label>
                      <input className="form-control rounded-3" value={form.endereco}
                        onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">NÚMERO</label>
                      <input className="form-control rounded-3" value={form.numero}
                        onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">BAIRRO</label>
                      <input className="form-control rounded-3" value={form.bairro}
                        onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-bold text-muted">CIDADE</label>
                      <input className="form-control rounded-3" value={form.cidade}
                        onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">UF</label>
                      <input className="form-control rounded-3" maxLength={2} value={form.estado}
                        onChange={e => setForm(p => ({ ...p, estado: e.target.value.toUpperCase() }))} />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        <option value="ativo">Ativa</option>
                        <option value="inativo">Inativa</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={fechar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-3">
                    {editId ? 'Salvar alterações' : 'Cadastrar franquia'}
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
