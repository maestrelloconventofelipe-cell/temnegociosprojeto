import { useState, useEffect } from 'react'
import { Plus, ClipboardCheck, Search, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const TIPOS  = ['entrada','saida','periodica','emergencial']
const STATUS = ['agendada','realizada','cancelada']
const STATUS_LABEL = { agendada: 'Agendada', realizada: 'Realizada', cancelada: 'Cancelada' }
const STATUS_COR   = { agendada: 'primary', realizada: 'success', cancelada: 'secondary' }

const VAZIO = { imovel_id: '', tipo: 'entrada', data_hora: '', vistoriador: '', status: 'agendada', observacoes: '' }

export default function Vistorias() {
  const [lista, setLista]     = useState([])
  const [imoveis, setImoveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(VAZIO)
  const [editId, setEditId]   = useState(null)
  const [showModal, setShow]  = useState(false)
  const [busca, setBusca]     = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const [rV, rI] = await Promise.all([api.get('/vistorias'), api.get('/imoveis')])
      setLista(rV.data); setImoveis(rI.data)
    } catch { toast.error('Erro ao carregar vistorias.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(v = null) {
    if (v) { setForm({ ...VAZIO, ...v }); setEditId(v.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/vistorias/${editId}`, form)
      else        await api.post('/vistorias', form)
      toast.success(editId ? 'Vistoria atualizada!' : 'Vistoria agendada!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta vistoria?')) return
    try { await api.delete(`/vistorias/${id}`); toast.success('Excluída!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(v =>
    !busca || v.imovel_titulo?.toLowerCase().includes(busca.toLowerCase()) || v.vistoriador?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Vistorias</h4>
          <p className="text-muted small mb-0">{lista.length} registros</p>
        </div>
        <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
          <Plus size={16} /> Nova Vistoria
        </button>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
          <input className="form-control border-0 shadow-none" placeholder="Buscar por imóvel ou vistoriador..."
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
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>IMÓVEL</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TIPO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DATA</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>VISTORIADOR</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted py-5">Nenhuma vistoria encontrada.</td></tr>
                ) : filtrada.map(v => (
                  <tr key={v.id}>
                    <td className="fw-medium" style={{ fontSize: '0.88rem' }}>{v.imovel_titulo || '—'}</td>
                    <td><span className="badge bg-light text-dark rounded-pill">{v.tipo}</span></td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {v.data_hora ? new Date(v.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ fontSize: '0.83rem' }}>{v.vistoriador || '—'}</td>
                    <td>
                      <span className={`badge bg-${STATUS_COR[v.status] ?? 'secondary'} rounded-pill`}>
                        {STATUS_LABEL[v.status]}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(v)}><Edit2 size={13} /></button>
                        <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(v.id)}><Trash2 size={13} /></button>
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
                <h5 className="modal-title fw-bold">{editId ? 'Editar Vistoria' : 'Nova Vistoria'}</h5>
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
                      <label className="form-label small fw-bold text-muted">TIPO</label>
                      <select className="form-select rounded-3" value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
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
                      <label className="form-label small fw-bold text-muted">VISTORIADOR</label>
                      <input className="form-control rounded-3" value={form.vistoriador}
                        onChange={e => setForm(p => ({ ...p, vistoriador: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">OBSERVAÇÕES</label>
                      <textarea className="form-control rounded-3" rows={3} value={form.observacoes}
                        onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 px-4 pb-4">
                  <button type="button" className="btn btn-outline-secondary rounded-3" onClick={fechar}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-3">
                    {editId ? 'Salvar' : 'Agendar vistoria'}
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
