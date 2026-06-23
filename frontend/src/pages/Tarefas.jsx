import { useState, useEffect } from 'react'
import { Plus, ClipboardList, Search, Edit2, Trash2, CheckCircle, Circle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const STATUS = ['pendente','em_andamento','concluida','cancelada']
const STATUS_LABEL = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' }
const STATUS_COR   = { pendente: 'warning', em_andamento: 'info', concluida: 'success', cancelada: 'secondary' }
const PRIORIDADES  = ['baixa','media','alta','urgente']
const PRIORIDADE_LABEL = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' }
const PRIORIDADE_COR   = { baixa: '#22c55e', media: '#3b82f6', alta: '#f59e0b', urgente: '#ef4444' }

const VAZIO = {
  titulo: '', descricao: '', prioridade: 'media',
  responsavel_id: '', data_prazo: '', status: 'pendente',
}

export default function Tarefas() {
  const { user } = useAuth()
  const isGestor = ['administrador_matriz','diretor_regional','franqueado'].includes(user?.role)

  const [lista, setLista]      = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]  = useState(true)
  const [busca, setBusca]      = useState('')
  const [filtroStat, setFStat] = useState('')
  const [filtroMin, setFMin]   = useState('')
  const [form, setForm]        = useState(VAZIO)
  const [editId, setEditId]    = useState(null)
  const [showModal, setShow]   = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const [rT, rU] = await Promise.all([api.get('/tarefas'), api.get('/usuarios')])
      setLista(rT.data); setUsuarios(rU.data)
    } catch { toast.error('Erro ao carregar tarefas.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(t = null) {
    if (t) { setForm({ ...VAZIO, ...t }); setEditId(t.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/tarefas/${editId}`, form)
      else        await api.post('/tarefas', form)
      toast.success(editId ? 'Tarefa atualizada!' : 'Tarefa criada!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function avancarStatus(t) {
    const proximo = { pendente: 'em_andamento', em_andamento: 'concluida' }
    const novoStatus = proximo[t.status]
    if (!novoStatus) return
    try {
      await api.patch(`/tarefas/${t.id}/status`, { status: novoStatus })
      toast.success(`Tarefa ${STATUS_LABEL[novoStatus].toLowerCase()}!`)
      carregar()
    } catch { toast.error('Erro.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta tarefa?')) return
    try { await api.delete(`/tarefas/${id}`); toast.success('Excluída!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const filtrada = lista.filter(t => {
    const q  = busca.toLowerCase()
    const ok = !q || t.titulo?.toLowerCase().includes(q) || t.responsavel_nome?.toLowerCase().includes(q)
    const fs = !filtroStat || t.status === filtroStat
    const fm = !filtroMin  || t.prioridade === filtroMin
    return ok && fs && fm
  })

  const contadores = STATUS.reduce((acc, s) => {
    acc[s] = lista.filter(t => t.status === s).length; return acc
  }, {})

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Tarefas</h4>
          <p className="text-muted small mb-0">{lista.length} tarefas no total</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Kanban badges */}
      <div className="d-flex gap-2 flex-wrap mb-4">
        {STATUS.map(s => (
          <div key={s} className="card border-0 shadow-sm rounded-3 px-3 py-2 d-flex flex-row align-items-center gap-2"
            style={{ cursor: 'pointer', borderLeft: `3px solid var(--bs-${STATUS_COR[s]})` }}
            onClick={() => setFStat(filtroStat === s ? '' : s)}>
            <span className={`badge bg-${STATUS_COR[s]}`}>{contadores[s]}</span>
            <span style={{ fontSize: '0.8rem', color: filtroStat === s ? '#1d4ed8' : '#64748b' }}>{STATUS_LABEL[s]}</span>
          </div>
        ))}
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por título ou responsável..."
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select border-0 shadow-none" value={filtroMin} onChange={e => setFMin(e.target.value)}>
              <option value="">Todas as prioridades</option>
              {PRIORIDADES.map(p => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
            </select>
          </div>
          <div className="col-md-3 text-muted small d-flex align-items-center justify-content-end">
            {filtrada.length} de {lista.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filtrada.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
          <ClipboardList size={40} strokeWidth={1} className="mx-auto mb-3" />
          <p className="mb-0">Nenhuma tarefa encontrada.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtrada.map(t => {
            const prazo = t.data_prazo ? new Date(t.data_prazo + 'T00:00:00') : null
            const atrasada = prazo && prazo < hoje && t.status !== 'concluida' && t.status !== 'cancelada'
            return (
              <div key={t.id} className="card border-0 shadow-sm rounded-4 p-3"
                style={{ borderLeft: `4px solid ${PRIORIDADE_COR[t.prioridade] ?? '#94a3b8'}` }}>
                <div className="d-flex align-items-start gap-3">
                  <button className="btn p-0 mt-1" onClick={() => avancarStatus(t)}>
                    {t.status === 'concluida'
                      ? <CheckCircle size={20} className="text-success" />
                      : <Circle size={20} className="text-muted" />}
                  </button>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <span className={`fw-semibold ${t.status === 'concluida' ? 'text-muted text-decoration-line-through' : 'text-dark'}`}
                          style={{ fontSize: '0.9rem' }}>{t.titulo}</span>
                        {atrasada && (
                          <span className="ms-2 badge bg-danger rounded-pill" style={{ fontSize: '0.62rem' }}>
                            <AlertTriangle size={10} className="me-1" />ATRASADA
                          </span>
                        )}
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <span className="badge rounded-pill" style={{ background: PRIORIDADE_COR[t.prioridade] + '22', color: PRIORIDADE_COR[t.prioridade], fontSize: '0.65rem' }}>
                          {PRIORIDADE_LABEL[t.prioridade]}
                        </span>
                        <span className={`badge bg-${STATUS_COR[t.status]} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </div>
                    </div>
                    {t.descricao && <p className="text-muted mb-1 mt-1" style={{ fontSize: '0.78rem' }}>{t.descricao}</p>}
                    <div className="d-flex gap-3 mt-2" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {t.responsavel_nome && <span>👤 {t.responsavel_nome}</span>}
                      {prazo && (
                        <span style={{ color: atrasada ? '#ef4444' : '#94a3b8' }}>
                          📅 {prazo.toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(t)}>
                      <Edit2 size={12} />
                    </button>
                    {(isGestor || t.responsavel_id === user?.id) && (
                      <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(t.id)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Tarefa' : 'Nova Tarefa'}</h5>
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
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">DESCRIÇÃO</label>
                      <textarea className="form-control rounded-3" rows={2} value={form.descricao}
                        onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">PRIORIDADE</label>
                      <select className="form-select rounded-3" value={form.prioridade}
                        onChange={e => setForm(p => ({ ...p, prioridade: e.target.value }))}>
                        {PRIORIDADES.map(pr => <option key={pr} value={pr}>{PRIORIDADE_LABEL[pr]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">RESPONSÁVEL</label>
                      <select className="form-select rounded-3" value={form.responsavel_id}
                        onChange={e => setForm(p => ({ ...p, responsavel_id: e.target.value }))}>
                        <option value="">Selecione...</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">PRAZO</label>
                      <input className="form-control rounded-3" type="date" value={form.data_prazo}
                        onChange={e => setForm(p => ({ ...p, data_prazo: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={fechar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-3">
                    {editId ? 'Salvar alterações' : 'Criar tarefa'}
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
