import { useState, useEffect } from 'react'
import { Plus, FileText, Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const STATUS = ['pendente','em_analise','aprovada','recusada','cancelada']
const STATUS_LABEL = { pendente: 'Pendente', em_analise: 'Em análise', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada' }
const STATUS_COR   = { pendente: 'warning', em_analise: 'info', aprovada: 'success', recusada: 'danger', cancelada: 'secondary' }
const TIPOS        = ['venda','aluguel','temporada']

const VAZIO = {
  imovel_id: '', cliente_nome: '', cliente_email: '', cliente_telefone: '',
  tipo: 'venda', valor_ofertado: '', valor_entrada: '', condicoes: '',
  status: 'pendente', observacoes: '',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Propostas() {
  const { user } = useAuth()
  const isGestor = ['administrador_matriz','diretor_regional','franqueado','juridico'].includes(user?.role)

  const [lista, setLista]       = useState([])
  const [imoveis, setImoveis]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [busca, setBusca]       = useState('')
  const [filtroStat, setFStat]  = useState('')
  const [form, setForm]         = useState(VAZIO)
  const [editId, setEditId]     = useState(null)
  const [showModal, setShow]    = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const [rP, rI] = await Promise.all([api.get('/propostas'), api.get('/imoveis')])
      setLista(rP.data); setImoveis(rI.data)
    } catch { toast.error('Erro ao carregar propostas.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(p = null) {
    if (p) { setForm({ ...VAZIO, ...p }); setEditId(p.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/propostas/${editId}`, form)
      else        await api.post('/propostas', form)
      toast.success(editId ? 'Proposta atualizada!' : 'Proposta registrada!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function mudarStatus(id, status) {
    try {
      await api.patch(`/propostas/${id}/status`, { status })
      toast.success(`Proposta ${STATUS_LABEL[status].toLowerCase()}!`)
      carregar()
    } catch { toast.error('Erro ao atualizar status.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta proposta?')) return
    try { await api.delete(`/propostas/${id}`); toast.success('Excluída!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(p => {
    const q = busca.toLowerCase()
    const ok = !q || p.cliente_nome?.toLowerCase().includes(q) || p.imovel_titulo?.toLowerCase().includes(q)
    const fs = !filtroStat || p.status === filtroStat
    return ok && fs
  })

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Propostas</h4>
          <p className="text-muted small mb-0">{lista.length} propostas cadastradas</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Nova Proposta
        </button>
      </div>

      {/* Filtros */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por cliente ou imóvel..."
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="col-md-5">
            <select className="form-select border-0 shadow-none" value={filtroStat} onChange={e => setFStat(e.target.value)}>
              <option value="">Todos os status</option>
              {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
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
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CLIENTE</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>IMÓVEL</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TIPO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>VALOR</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DATA</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-5">Nenhuma proposta encontrada.</td></tr>
                ) : filtrada.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>{p.cliente_nome}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.cliente_email}</div>
                    </td>
                    <td style={{ fontSize: '0.83rem', maxWidth: '180px' }} className="text-truncate">{p.imovel_titulo || '—'}</td>
                    <td><span className="badge bg-light text-dark rounded-pill">{p.tipo}</span></td>
                    <td className="fw-semibold text-primary" style={{ fontSize: '0.88rem' }}>{moeda(p.valor_ofertado)}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <span className={`badge bg-${STATUS_COR[p.status] ?? 'secondary'} rounded-pill`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        {isGestor && p.status === 'em_analise' && (
                          <>
                            <button className="btn btn-outline-success btn-sm rounded-3" title="Aprovar"
                              onClick={() => mudarStatus(p.id, 'aprovada')}><CheckCircle size={13} /></button>
                            <button className="btn btn-outline-danger btn-sm rounded-3" title="Recusar"
                              onClick={() => mudarStatus(p.id, 'recusada')}><XCircle size={13} /></button>
                          </>
                        )}
                        {p.status === 'pendente' && (
                          <button className="btn btn-outline-info btn-sm rounded-3" style={{ fontSize: '0.72rem' }}
                            onClick={() => mudarStatus(p.id, 'em_analise')}>Analisar</button>
                        )}
                        <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(p)}>
                          <Edit2 size={13} />
                        </button>
                        {isGestor && (
                          <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(p.id)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
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
                <h5 className="modal-title fw-bold">{editId ? 'Editar Proposta' : 'Nova Proposta'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">IMÓVEL</label>
                      <select className="form-select rounded-3" value={form.imovel_id}
                        onChange={e => setForm(p => ({ ...p, imovel_id: e.target.value }))}>
                        <option value="">Selecione o imóvel...</option>
                        {imoveis.map(im => <option key={im.id} value={im.id}>{im.titulo} — {im.cidade}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">NOME DO CLIENTE *</label>
                      <input className="form-control rounded-3" required value={form.cliente_nome}
                        onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">E-MAIL DO CLIENTE</label>
                      <input className="form-control rounded-3" type="email" value={form.cliente_email}
                        onChange={e => setForm(p => ({ ...p, cliente_email: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.cliente_telefone}
                        onChange={e => setForm(p => ({ ...p, cliente_telefone: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TIPO</label>
                      <select className="form-select rounded-3" value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">VALOR OFERTADO (R$) *</label>
                      <input className="form-control rounded-3" required type="number" step="0.01" min="0"
                        value={form.valor_ofertado}
                        onChange={e => setForm(p => ({ ...p, valor_ofertado: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">VALOR DE ENTRADA (R$)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0"
                        value={form.valor_entrada}
                        onChange={e => setForm(p => ({ ...p, valor_entrada: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">CONDIÇÕES DE PAGAMENTO</label>
                      <textarea className="form-control rounded-3" rows={2} value={form.condicoes}
                        onChange={e => setForm(p => ({ ...p, condicoes: e.target.value }))} />
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
                    {editId ? 'Salvar alterações' : 'Registrar proposta'}
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
