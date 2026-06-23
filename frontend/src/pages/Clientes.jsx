import { useState, useEffect } from 'react'
import { Plus, Search, Users, Trash2, Edit2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const TIPOS       = ['comprador','proprietario','locatario']
const TIPO_LABEL  = { comprador: 'Comprador', proprietario: 'Proprietário', locatario: 'Locatário' }
const TIPO_COR    = { comprador: 'primary', proprietario: 'success', locatario: 'info' }

const VAZIO = {
  nome: '', cpf: '', email: '', telefone: '',
  tipo: 'comprador', cep: '', endereco: '', bairro: '', cidade: '', estado: '',
  observacoes: '', status: 'ativo',
}

export default function Clientes() {
  const { user } = useAuth()
  const podeEditar = ['administrador_matriz','diretor_regional','franqueado','corretor'].includes(user?.role)

  const [lista, setLista]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [busca, setBusca]       = useState('')
  const [filtroTipo, setFTipo]  = useState('')
  const [form, setForm]         = useState(VAZIO)
  const [editId, setEditId]     = useState(null)
  const [showModal, setShow]    = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const params = {}
      if (filtroTipo) params.tipo = filtroTipo
      const r = await api.get('/clientes', { params })
      setLista(r.data)
    } catch { toast.error('Erro ao carregar clientes.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo])

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

  function abrir(c = null) {
    if (c) { setForm({ ...VAZIO, ...c }); setEditId(c.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/clientes/${editId}`, form)
      else        await api.post('/clientes', form)
      toast.success(editId ? 'Cliente atualizado!' : 'Cliente cadastrado!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id, nome) {
    if (!confirm(`Excluir o cliente "${nome}"?`)) return
    try { await api.delete(`/clientes/${id}`); toast.success('Cliente removido!'); carregar() }
    catch (err) { toast.error(err.response?.data?.erro || 'Erro ao excluir.') }
  }

  const filtrada = lista.filter(c => {
    const q = busca.toLowerCase()
    return !q || c.nome?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.cpf?.includes(q)
  })

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Clientes</h4>
          <p className="text-muted small mb-0">{lista.length} cadastrado(s)</p>
        </div>
        {podeEditar && (
          <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
            <Plus size={16} /> Novo Cliente
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por nome, CPF ou e-mail..."
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="col-md-4">
            <select className="form-select border-0 shadow-none" value={filtroTipo} onChange={e => setFTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>
          <div className="col-md-2 text-end">
            {(busca || filtroTipo) && (
              <button className="btn btn-outline-secondary btn-sm rounded-3" onClick={() => { setBusca(''); setFTipo('') }}>Limpar</button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filtrada.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
          <Users size={40} strokeWidth={1} className="mx-auto mb-3" />
          <p className="mb-0">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  {['Nome','CPF','E-mail','Telefone','Tipo','Cidade/UF','Ações'].map(h => (
                    <th key={h} style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrada.map(c => (
                  <tr key={c.id}>
                    <td className="fw-semibold" style={{ fontSize: '0.88rem' }}>{c.nome}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>{c.cpf || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.email || '—'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.telefone || '—'}</td>
                    <td>
                      <span className={`badge rounded-pill bg-${TIPO_COR[c.tipo] ?? 'secondary'}`}>
                        {TIPO_LABEL[c.tipo] ?? c.tipo}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {c.cidade ? `${c.cidade}/${c.estado || ''}` : '—'}
                    </td>
                    <td>
                      {podeEditar && (
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(c)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(c.id, c.nome)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Cliente' : 'Novo Cliente'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">NOME *</label>
                      <input className="form-control rounded-3" required value={form.nome}
                        onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">TIPO</label>
                      <select className="form-select rounded-3" value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">CPF / CNPJ</label>
                      <input className="form-control rounded-3" value={form.cpf}
                        onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.telefone}
                        onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-0000" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">E-MAIL</label>
                      <input className="form-control rounded-3" type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
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
                        onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, avenida..." />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">UF</label>
                      <input className="form-control rounded-3" maxLength={2} value={form.estado}
                        onChange={e => setForm(p => ({ ...p, estado: e.target.value.toUpperCase() }))} placeholder="SP" />
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

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">OBSERVAÇÕES</label>
                      <textarea className="form-control rounded-3" rows={2} value={form.observacoes}
                        onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={fechar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-3">
                    {editId ? 'Salvar alterações' : 'Cadastrar cliente'}
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
