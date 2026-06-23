import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const STATUS = ['disponivel','reservado','ocupado','bloqueado']
const STATUS_LABEL = { disponivel: 'Disponível', reservado: 'Reservado', ocupado: 'Ocupado', bloqueado: 'Bloqueado' }
const STATUS_COR   = { disponivel: 'success', reservado: 'warning', ocupado: 'info', bloqueado: 'secondary' }

const VAZIO = {
  imovel_id: '', hospede_nome: '', hospede_email: '', hospede_telefone: '',
  data_entrada: '', data_saida: '', valor_diaria: '', valor_total: '',
  num_hospedes: '', status: 'reservado', observacoes: '',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Temporadas() {
  const [lista, setLista]     = useState([])
  const [imoveis, setImoveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca]     = useState('')
  const [form, setForm]       = useState(VAZIO)
  const [editId, setEditId]   = useState(null)
  const [showModal, setShow]  = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const [rT, rI] = await Promise.all([api.get('/temporadas'), api.get('/imoveis?finalidade=Temporada')])
      setLista(rT.data); setImoveis(rI.data)
    } catch { toast.error('Erro ao carregar temporadas.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(t = null) {
    if (t) { setForm({ ...VAZIO, ...t }); setEditId(t.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  function calcTotal(entrada, saida, diaria) {
    if (!entrada || !saida || !diaria) return ''
    const dias = Math.round((new Date(saida) - new Date(entrada)) / 86400000)
    return dias > 0 ? (dias * parseFloat(diaria)).toFixed(2) : ''
  }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/temporadas/${editId}`, form)
      else        await api.post('/temporadas', form)
      toast.success(editId ? 'Reserva atualizada!' : 'Reserva criada!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta reserva?')) return
    try { await api.delete(`/temporadas/${id}`); toast.success('Excluída!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(t =>
    !busca || t.hospede_nome?.toLowerCase().includes(busca.toLowerCase()) || t.imovel_titulo?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Temporadas</h4>
          <p className="text-muted small mb-0">{lista.length} reservas</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Nova Reserva
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
          <input className="form-control border-0 shadow-none" placeholder="Buscar por hóspede ou imóvel..."
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
                <Calendar size={40} strokeWidth={1} className="mx-auto mb-3" />
                <p className="mb-0">Nenhuma reserva encontrada.</p>
              </div>
            </div>
          ) : filtrada.map(t => (
            <div key={t.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className={`badge bg-${STATUS_COR[t.status] ?? 'secondary'} rounded-pill`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <div className="d-flex gap-1">
                    <button className="btn btn-outline-primary btn-sm rounded-3 p-1" onClick={() => abrir(t)}><Edit2 size={12} /></button>
                    <button className="btn btn-outline-danger btn-sm rounded-3 p-1" onClick={() => excluir(t.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
                <h6 className="fw-semibold text-dark mb-1">{t.hospede_nome}</h6>
                <p className="text-muted mb-1" style={{ fontSize: '0.78rem' }}>🏠 {t.imovel_titulo || '—'}</p>
                <div className="d-flex gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
                  <span>📅 {t.data_entrada ? new Date(t.data_entrada + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                  <span>→</span>
                  <span>{t.data_saida ? new Date(t.data_saida + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                </div>
                {t.valor_total && (
                  <div className="fw-bold text-primary mt-2">{moeda(t.valor_total)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Reserva' : 'Nova Reserva'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">IMÓVEL</label>
                      <select className="form-select rounded-3" value={form.imovel_id}
                        onChange={e => setForm(p => ({ ...p, imovel_id: e.target.value }))}>
                        <option value="">Selecione...</option>
                        {imoveis.map(im => <option key={im.id} value={im.id}>{im.titulo}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">NOME DO HÓSPEDE *</label>
                      <input className="form-control rounded-3" required value={form.hospede_nome}
                        onChange={e => setForm(p => ({ ...p, hospede_nome: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.hospede_telefone}
                        onChange={e => setForm(p => ({ ...p, hospede_telefone: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">ENTRADA *</label>
                      <input className="form-control rounded-3" required type="date" value={form.data_entrada}
                        onChange={e => setForm(p => {
                          const v = { ...p, data_entrada: e.target.value }
                          v.valor_total = calcTotal(e.target.value, p.data_saida, p.valor_diaria)
                          return v
                        })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">SAÍDA *</label>
                      <input className="form-control rounded-3" required type="date" value={form.data_saida}
                        onChange={e => setForm(p => {
                          const v = { ...p, data_saida: e.target.value }
                          v.valor_total = calcTotal(p.data_entrada, e.target.value, p.valor_diaria)
                          return v
                        })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Nº HÓSPEDES</label>
                      <input className="form-control rounded-3" type="number" min="1" value={form.num_hospedes}
                        onChange={e => setForm(p => ({ ...p, num_hospedes: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DIÁRIA (R$)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0" value={form.valor_diaria}
                        onChange={e => setForm(p => {
                          const v = { ...p, valor_diaria: e.target.value }
                          v.valor_total = calcTotal(p.data_entrada, p.data_saida, e.target.value)
                          return v
                        })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TOTAL (R$)</label>
                      <input className="form-control rounded-3 bg-light" readOnly value={form.valor_total} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
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
                    {editId ? 'Salvar' : 'Criar reserva'}
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
