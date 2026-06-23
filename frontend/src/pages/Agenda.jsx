import { useState, useEffect } from 'react'
import { Plus, Calendar, Search, Edit2, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const TIPOS = ['visita','reuniao','ligacao','assinatura','vistoria','outro']
const TIPO_LABEL = { visita: 'Visita', reuniao: 'Reunião', ligacao: 'Ligação', assinatura: 'Assinatura', vistoria: 'Vistoria', outro: 'Outro' }
const TIPO_ICONE = { visita: '🏠', reuniao: '👥', ligacao: '📞', assinatura: '✍️', vistoria: '🔍', outro: '📋' }
const STATUS = ['agendado','realizado','cancelado','remarcado']
const STATUS_LABEL = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado', remarcado: 'Remarcado' }
const STATUS_COR   = { agendado: 'primary', realizado: 'success', cancelado: 'danger', remarcado: 'warning' }

const VAZIO = {
  titulo: '', tipo: 'visita', data_hora: '', duracao_min: 60,
  cliente_nome: '', cliente_telefone: '', imovel_id: '',
  status: 'agendado', observacoes: '',
}

export default function Agenda() {
  const [lista, setLista]      = useState([])
  const [imoveis, setImoveis]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [busca, setBusca]      = useState('')
  const [filtroStat, setFStat] = useState('agendado')
  const [form, setForm]        = useState(VAZIO)
  const [editId, setEditId]    = useState(null)
  const [showModal, setShow]   = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const [rA, rI] = await Promise.all([api.get('/agenda'), api.get('/imoveis')])
      setLista(rA.data); setImoveis(rI.data)
    } catch { toast.error('Erro ao carregar agenda.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(a = null) {
    if (a) { setForm({ ...VAZIO, ...a }); setEditId(a.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/agenda/${editId}`, form)
      else        await api.post('/agenda', form)
      toast.success(editId ? 'Compromisso atualizado!' : 'Compromisso agendado!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir este compromisso?')) return
    try { await api.delete(`/agenda/${id}`); toast.success('Excluído!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  async function marcarRealizado(id) {
    try { await api.patch(`/agenda/${id}/status`, { status: 'realizado' }); toast.success('Marcado como realizado!'); carregar() }
    catch { toast.error('Erro.') }
  }

  const filtrada = lista.filter(a => {
    const q  = busca.toLowerCase()
    const ok = !q || a.titulo?.toLowerCase().includes(q) || a.cliente_nome?.toLowerCase().includes(q)
    const fs = !filtroStat || a.status === filtroStat
    return ok && fs
  })

  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const [futuros, passados] = filtrada.reduce(([f, p], a) => {
    const d = new Date(a.data_hora)
    return d >= hoje ? [[...f, a], p] : [f, [...p, a]]
  }, [[], []])

  function AgendaItem({ a }) {
    const d = new Date(a.data_hora)
    const isHoje = d.toDateString() === hoje.toDateString()
    return (
      <div className="card border-0 shadow-sm rounded-4 mb-2 overflow-hidden">
        <div className="d-flex">
          <div className="d-flex flex-column align-items-center justify-content-center px-3"
            style={{ minWidth: '70px', background: isHoje ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #f1f5f9' }}>
            <div className="fw-bold text-primary" style={{ fontSize: '1.3rem', lineHeight: 1 }}>
              {String(d.getDate()).padStart(2,'0')}
            </div>
            <div className="text-muted text-uppercase" style={{ fontSize: '0.62rem' }}>
              {d.toLocaleString('pt-BR', { month: 'short' })}
            </div>
            <div className="text-muted" style={{ fontSize: '0.68rem' }}>
              {String(d.getHours()).padStart(2,'0')}:{String(d.getMinutes()).padStart(2,'0')}
            </div>
          </div>
          <div className="flex-grow-1 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span style={{ fontSize: '1rem' }}>{TIPO_ICONE[a.tipo]}</span>
                  <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{a.titulo}</span>
                  {isHoje && <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.6rem' }}>HOJE</span>}
                </div>
                <div className="d-flex gap-3" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <span>{TIPO_LABEL[a.tipo]}</span>
                  {a.cliente_nome && <span>👤 {a.cliente_nome}</span>}
                  {a.duracao_min  && <span><Clock size={10} className="me-1" />{a.duracao_min}min</span>}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge bg-${STATUS_COR[a.status] ?? 'secondary'} rounded-pill`}>
                  {STATUS_LABEL[a.status]}
                </span>
                {a.status === 'agendado' && (
                  <button className="btn btn-outline-success btn-sm rounded-3" style={{ fontSize: '0.7rem' }}
                    onClick={() => marcarRealizado(a.id)}>✓</button>
                )}
                <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(a)}>
                  <Edit2 size={12} />
                </button>
                <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(a.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Agenda</h4>
          <p className="text-muted small mb-0">{lista.filter(a => a.status === 'agendado').length} compromissos agendados</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Novo Compromisso
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="row g-2">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por título ou cliente..."
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="col-md-5">
            <select className="form-select border-0 shadow-none" value={filtroStat} onChange={e => setFStat(e.target.value)}>
              <option value="">Todos</option>
              {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          {futuros.length > 0 && (
            <div className="mb-4">
              <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                Próximos ({futuros.length})
              </small>
              {futuros.map(a => <AgendaItem key={a.id} a={a} />)}
            </div>
          )}
          {passados.length > 0 && (
            <div>
              <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
                Anteriores ({passados.length})
              </small>
              {passados.map(a => <AgendaItem key={a.id} a={a} />)}
            </div>
          )}
          {filtrada.length === 0 && (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
              <Calendar size={40} strokeWidth={1} className="mx-auto mb-3" />
              <p className="mb-0">Nenhum compromisso encontrado.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Compromisso' : 'Novo Compromisso'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">TÍTULO *</label>
                      <input className="form-control rounded-3" required value={form.titulo}
                        onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">TIPO</label>
                      <select className="form-select rounded-3" value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-muted">DATA E HORA *</label>
                      <input className="form-control rounded-3" required type="datetime-local" value={form.data_hora}
                        onChange={e => setForm(p => ({ ...p, data_hora: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DURAÇÃO (min)</label>
                      <input className="form-control rounded-3" type="number" min="15" step="15"
                        value={form.duracao_min}
                        onChange={e => setForm(p => ({ ...p, duracao_min: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">NOME DO CLIENTE</label>
                      <input className="form-control rounded-3" value={form.cliente_nome}
                        onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.cliente_telefone}
                        onChange={e => setForm(p => ({ ...p, cliente_telefone: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">IMÓVEL</label>
                      <select className="form-select rounded-3" value={form.imovel_id}
                        onChange={e => setForm(p => ({ ...p, imovel_id: e.target.value }))}>
                        <option value="">Selecione (opcional)...</option>
                        {imoveis.map(im => <option key={im.id} value={im.id}>{im.titulo}</option>)}
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
                    {editId ? 'Salvar alterações' : 'Agendar compromisso'}
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
