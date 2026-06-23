import { useState, useEffect, useRef } from 'react'
import { Plus, Search, X, Upload, MapPin, Home, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const TIPOS      = ['Casa','Apartamento','Terreno','Comercial','Cobertura','Lote','Sítio','Fazenda']
const FINALIDADES = ['Venda','Aluguel','Temporada']
const STATUS      = ['disponivel','vendido','alugado','em_negociacao','suspenso']
const STATUS_LABEL = { disponivel: 'Disponível', vendido: 'Vendido', alugado: 'Alugado', em_negociacao: 'Em negociação', suspenso: 'Suspenso' }
const STATUS_COR   = { disponivel: 'success', vendido: 'primary', alugado: 'info', em_negociacao: 'warning', suspenso: 'secondary' }

const ROLE_GESTOR = ['administrador_matriz','diretor_regional','franqueado']

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

const VAZIO = {
  titulo: '', tipo: 'Casa', finalidade: 'Venda', valor: '', valor_negociacao: '',
  area_total: '', area_util: '', quartos: '', banheiros: '', vagas: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  descricao: '', status: 'disponivel', destaque: false,
  corretor_id: '', captador_id: '',
}

export default function Imoveis() {
  const { user } = useAuth()
  const isGestor  = ROLE_GESTOR.includes(user?.role)

  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [busca, setBusca]         = useState('')
  const [filtroStatus, setFiltro] = useState('')
  const [form, setForm]           = useState(VAZIO)
  const [editId, setEditId]       = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [fotos, setFotos]           = useState([])
  const [fotosExist, setFotosExist] = useState([])
  const [uploading, setUploading]   = useState(false)
  const [corretores, setCorretores] = useState([])
  const [buscandoCep, setBuscandoCep] = useState(false)
  const fileRef = useRef()

  async function carregar() {
    setLoading(true)
    try {
      const r = await api.get('/imoveis')
      setLista(r.data)
    } catch { toast.error('Erro ao carregar imóveis.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    carregar()
    api.get('/usuarios?role=corretor').then(r => setCorretores(r.data ?? [])).catch(() => {})
  }, [])

  function abrir(imovel = null) {
    if (imovel) {
      setForm({ ...VAZIO, ...imovel })
      setEditId(imovel.id)
      setFotosExist(imovel.fotos ?? [])
    } else {
      setForm(VAZIO)
      setEditId(null)
      setFotosExist([])
    }
    setFotos([])
    setShowModal(true)
  }

  function fechar() { setShowModal(false); setForm(VAZIO); setFotos([]); setFotosExist([]) }

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

  async function uploadFotos(id) {
    const formData = new FormData()
    fotos.forEach(f => formData.append('fotos', f))
    try {
      const r = await api.post(`/imoveis/${id}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return r.data.urls || []
    } catch {
      return []
    }
  }

  async function salvar(e) {
    e.preventDefault()
    setUploading(true)
    try {
      const payload = { ...form, valor: Number(form.valor) || 0 }
      let id = editId
      if (editId) {
        await api.put(`/imoveis/${editId}`, payload)
      } else {
        const r = await api.post('/imoveis', payload)
        id = r.data.id
      }
      // Sincronizar remoção de fotos existentes antes de adicionar novas
      if (editId) {
        await api.patch(`/imoveis/${id}/fotos`, { fotos: fotosExist })
      }
      if (fotos.length > 0 && id) {
        await uploadFotos(id)
      }
      toast.success(editId ? 'Imóvel atualizado!' : 'Imóvel cadastrado!')
      fechar()
      carregar()
    } catch (err) {
      toast.error(err.response?.data?.erro || 'Erro ao salvar.')
    } finally { setUploading(false) }
  }

  async function excluir(id) {
    if (!confirm('Excluir este imóvel?')) return
    try { await api.delete(`/imoveis/${id}`); toast.success('Excluído!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(im => {
    const q = busca.toLowerCase()
    const ok = !q || im.titulo?.toLowerCase().includes(q) || im.cidade?.toLowerCase().includes(q) || im.bairro?.toLowerCase().includes(q)
    const st = !filtroStatus || im.status === filtroStatus
    return ok && st
  })

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Imóveis</h4>
          <p className="text-muted small mb-0">{lista.length} imóveis cadastrados</p>
        </div>
        {isGestor && (
          <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
            <Plus size={16} /> Novo Imóvel
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por título, cidade, bairro..."
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="col-md-4">
            <select className="form-select border-0 shadow-none" value={filtroStatus} onChange={e => setFiltro(e.target.value)}>
              <option value="">Todos os status</option>
              {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="col-md-2 text-end">
            {(busca || filtroStatus) && (
              <button className="btn btn-outline-secondary btn-sm rounded-3"
                onClick={() => { setBusca(''); setFiltro('') }}>Limpar</button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filtrada.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
          <Home size={40} strokeWidth={1} className="mx-auto mb-3 text-muted" />
          <p className="mb-0">Nenhum imóvel encontrado.</p>
        </div>
      ) : (
        <div className="row g-3">
          {filtrada.map(im => (
            <div key={im.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                {im.fotos?.[0] ? (
                  <img src={im.fotos[0]} alt={im.titulo} className="card-img-top"
                    style={{ height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center bg-light"
                    style={{ height: '140px' }}>
                    <Home size={36} className="text-muted" strokeWidth={1} />
                  </div>
                )}
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge bg-${STATUS_COR[im.status] ?? 'secondary'} rounded-pill`}>
                      {STATUS_LABEL[im.status]}
                    </span>
                    <span className="badge bg-light text-muted rounded-pill">{im.finalidade}</span>
                  </div>
                  <h6 className="fw-semibold text-dark mb-1 text-truncate">{im.titulo}</h6>
                  <p className="text-muted mb-2" style={{ fontSize: '0.78rem' }}>
                    <MapPin size={12} className="me-1" />
                    {[im.bairro, im.cidade, im.estado].filter(Boolean).join(', ') || '—'}
                  </p>
                  <div className="d-flex gap-3 mb-3" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {im.tipo && <span>🏠 {im.tipo}</span>}
                    {im.quartos > 0 && <span>🛏 {im.quartos} qtos</span>}
                    {im.area_total > 0 && <span>📐 {im.area_total}m²</span>}
                  </div>
                  <div className="fw-bold text-primary mb-3"
                    style={{ fontSize: '1.1rem' }}>{moeda(im.valor)}</div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm rounded-3 flex-grow-1"
                      onClick={() => abrir(im)}>
                      <Edit2 size={13} className="me-1" /> Editar
                    </button>
                    {isGestor && (
                      <button className="btn btn-outline-danger btn-sm rounded-3"
                        onClick={() => excluir(im.id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
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
          <div className="modal-dialog modal-xl" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Imóvel' : 'Novo Imóvel'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    {/* Título */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">TÍTULO *</label>
                      <input className="form-control rounded-3" required
                        value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TIPO</label>
                      <select className="form-select rounded-3" value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">FINALIDADE</label>
                      <select className="form-select rounded-3" value={form.finalidade}
                        onChange={e => setForm(p => ({ ...p, finalidade: e.target.value }))}>
                        {FINALIDADES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>

                    {/* Valores */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR (R$) *</label>
                      <input className="form-control rounded-3" required type="number" step="0.01" min="0"
                        value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR NEGOCIAÇÃO</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0"
                        value={form.valor_negociacao}
                        onChange={e => setForm(p => ({ ...p, valor_negociacao: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">ÁREA TOTAL (m²)</label>
                      <input className="form-control rounded-3" type="number" min="0"
                        value={form.area_total} onChange={e => setForm(p => ({ ...p, area_total: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">ÁREA ÚTIL (m²)</label>
                      <input className="form-control rounded-3" type="number" min="0"
                        value={form.area_util} onChange={e => setForm(p => ({ ...p, area_util: e.target.value }))} />
                    </div>

                    {/* Características */}
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">QUARTOS</label>
                      <input className="form-control rounded-3" type="number" min="0"
                        value={form.quartos} onChange={e => setForm(p => ({ ...p, quartos: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">BANHEIROS</label>
                      <input className="form-control rounded-3" type="number" min="0"
                        value={form.banheiros} onChange={e => setForm(p => ({ ...p, banheiros: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">VAGAS</label>
                      <input className="form-control rounded-3" type="number" min="0"
                        value={form.vagas} onChange={e => setForm(p => ({ ...p, vagas: e.target.value }))} />
                    </div>
                    <div className="col-md-3 d-flex align-items-end">
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" id="destaque"
                          checked={form.destaque} onChange={e => setForm(p => ({ ...p, destaque: e.target.checked }))} />
                        <label className="form-check-label small" htmlFor="destaque">Destaque</label>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="col-12"><hr className="my-1" /><small className="text-muted fw-bold">ENDEREÇO</small></div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted d-flex align-items-center gap-2">
                        CEP
                        {buscandoCep && <span className="spinner-border spinner-border-sm text-primary" style={{width:'12px',height:'12px',borderWidth:'2px'}} />}
                      </label>
                      <input className="form-control rounded-3" maxLength={9}
                        value={form.cep}
                        onChange={e => handleCep(e.target.value)}
                        placeholder="00000-000" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">LOGRADOURO</label>
                      <input className="form-control rounded-3" value={form.endereco}
                        onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small fw-bold text-muted">NÚMERO</label>
                      <input className="form-control rounded-3" value={form.numero}
                        onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">COMPLEMENTO</label>
                      <input className="form-control rounded-3" value={form.complemento}
                        onChange={e => setForm(p => ({ ...p, complemento: e.target.value }))} />
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

                    {/* Responsáveis */}
                    {isGestor && corretores.length > 0 && (
                      <>
                        <div className="col-12"><hr className="my-1" /><small className="text-muted fw-bold">RESPONSÁVEIS</small></div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted">CORRETOR</label>
                          <select className="form-select rounded-3" value={form.corretor_id}
                            onChange={e => setForm(p => ({ ...p, corretor_id: e.target.value }))}>
                            <option value="">Nenhum</option>
                            {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted">CAPTADOR</label>
                          <select className="form-select rounded-3" value={form.captador_id}
                            onChange={e => setForm(p => ({ ...p, captador_id: e.target.value }))}>
                            <option value="">Nenhum</option>
                            {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Descrição */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">DESCRIÇÃO</label>
                      <textarea className="form-control rounded-3" rows={3} value={form.descricao}
                        onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                    </div>

                    {/* Fotos */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">FOTOS</label>
                      {fotosExist.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {fotosExist.map((url, i) => (
                            <div key={i} className="position-relative">
                              <img src={url} alt="" className="rounded-3 object-fit-cover"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                              <button type="button"
                                className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 p-0"
                                style={{ width: '20px', height: '20px', fontSize: '10px' }}
                                onClick={() => setFotosExist(prev => prev.filter((_, j) => j !== i))}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-2 border-dashed rounded-3 p-4 text-center"
                        style={{ border: '2px dashed #cbd5e1', cursor: 'pointer' }}
                        onClick={() => fileRef.current?.click()}>
                        <Upload size={20} className="text-muted mb-1" />
                        <p className="text-muted mb-0 small">
                          {fotos.length > 0 ? `${fotos.length} arquivo(s) selecionado(s)` : 'Clique para adicionar fotos'}
                        </p>
                      </div>
                      <input ref={fileRef} type="file" className="d-none" multiple accept="image/*"
                        onChange={e => setFotos(Array.from(e.target.files))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={fechar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-3" disabled={uploading}>
                    {uploading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                    {editId ? 'Salvar alterações' : 'Cadastrar imóvel'}
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
