import { useState, useEffect } from 'react'
import { Award, Search, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const STATUS = ['pendente','pago','cancelado']
const STATUS_LABEL = { pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' }
const STATUS_COR   = { pendente: 'warning', pago: 'success', cancelado: 'secondary' }
const TIPOS = ['venda','aluguel','captacao','indicacao','outro']

const VAZIO = {
  corretor_id: '', imovel_id: '', contrato_id: '',
  tipo: 'venda', valor_negocio: '', percentual: '', valor_comissao: '',
  data_competencia: '', data_pagamento: '',
  status: 'pendente', observacoes: '',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Comissoes() {
  const { user } = useAuth()
  const isGestor = ['administrador_matriz','diretor_regional','franqueado','financeiro'].includes(user?.role)

  const [lista, setLista]      = useState([])
  const [corretores, setCorr]  = useState([])
  const [imoveis, setImoveis]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [busca, setBusca]      = useState('')
  const [filtroStat, setFStat] = useState('')
  const [form, setForm]        = useState(VAZIO)
  const [editId, setEditId]    = useState(null)
  const [showModal, setShow]   = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const [rC, rU, rI] = await Promise.all([
        api.get('/comissoes'), api.get('/usuarios'), api.get('/imoveis'),
      ])
      setLista(rC.data); setCorr(rU.data); setImoveis(rI.data)
    } catch { toast.error('Erro ao carregar comissões.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function calcularComissao(perc, valor) {
    const p = parseFloat(perc) || 0
    const v = parseFloat(valor) || 0
    return ((p / 100) * v).toFixed(2)
  }

  function abrir(c = null) {
    if (c) { setForm({ ...VAZIO, ...c }); setEditId(c.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    const payload = {
      ...form,
      valor_comissao: form.valor_comissao || calcularComissao(form.percentual, form.valor_negocio),
    }
    try {
      if (editId) await api.put(`/comissoes/${editId}`, payload)
      else        await api.post('/comissoes', payload)
      toast.success(editId ? 'Comissão atualizada!' : 'Comissão registrada!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function marcarPago(id) {
    try {
      await api.patch(`/comissoes/${id}/pagar`, { data_pagamento: new Date().toISOString().slice(0,10) })
      toast.success('Comissão paga!'); carregar()
    } catch { toast.error('Erro.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta comissão?')) return
    try { await api.delete(`/comissoes/${id}`); toast.success('Excluída!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(c => {
    const q  = busca.toLowerCase()
    const ok = !q || c.corretor_nome?.toLowerCase().includes(q) || c.imovel_titulo?.toLowerCase().includes(q)
    const fs = !filtroStat || c.status === filtroStat
    return ok && fs
  })

  const totalPago    = filtrada.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.valor_comissao), 0)
  const totalPend    = filtrada.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor_comissao), 0)

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Comissões</h4>
          <p className="text-muted small mb-0">{lista.length} registros</p>
        </div>
        {isGestor && (
          <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
            <Plus size={16} /> Nova Comissão
          </button>
        )}
      </div>

      {/* Resumo */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: '4px solid #22c55e' }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.6rem' }}>Total pago</small>
            <div className="fw-bold text-success fs-5">{moeda(totalPago)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: '4px solid #f59e0b' }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.6rem' }}>A pagar</small>
            <div className="fw-bold text-warning fs-5">{moeda(totalPend)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: '4px solid #3b82f6' }}>
            <small className="text-muted fw-bold text-uppercase d-block mb-1" style={{ fontSize: '0.6rem' }}>Total geral</small>
            <div className="fw-bold text-primary fs-5">{moeda(totalPago + totalPend)}</div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por corretor ou imóvel..."
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
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CORRETOR</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>IMÓVEL</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TIPO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>NEGÓCIO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>%</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>COMISSÃO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted py-5">Nenhuma comissão encontrada.</td></tr>
                ) : filtrada.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>{c.corretor_nome}</div>
                    </td>
                    <td style={{ fontSize: '0.83rem', maxWidth: '150px' }} className="text-truncate text-muted">
                      {c.imovel_titulo || '—'}
                    </td>
                    <td><span className="badge bg-light text-dark rounded-pill">{c.tipo}</span></td>
                    <td style={{ fontSize: '0.83rem' }}>{moeda(c.valor_negocio)}</td>
                    <td style={{ fontSize: '0.83rem', color: '#64748b' }}>{c.percentual}%</td>
                    <td className="fw-bold text-success">{moeda(c.valor_comissao)}</td>
                    <td>
                      <span className={`badge bg-${STATUS_COR[c.status] ?? 'secondary'} rounded-pill`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        {c.status === 'pendente' && isGestor && (
                          <button className="btn btn-outline-success btn-sm rounded-3" title="Marcar pago"
                            onClick={() => marcarPago(c.id)}><CheckCircle size={13} /></button>
                        )}
                        <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(c)}>
                          <Edit2 size={13} />
                        </button>
                        {isGestor && (
                          <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(c.id)}>
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

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 1055, overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg" style={{ margin: '1.75rem auto' }}>
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold">{editId ? 'Editar Comissão' : 'Nova Comissão'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">CORRETOR *</label>
                      <select className="form-select rounded-3" required value={form.corretor_id}
                        onChange={e => setForm(p => ({ ...p, corretor_id: e.target.value }))}>
                        <option value="">Selecione...</option>
                        {corretores.filter(u => ['corretor','captador','franqueado'].includes(u.role)).map(u =>
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        )}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">IMÓVEL</label>
                      <select className="form-select rounded-3" value={form.imovel_id}
                        onChange={e => setForm(p => ({ ...p, imovel_id: e.target.value }))}>
                        <option value="">Selecione (opcional)...</option>
                        {imoveis.map(im => <option key={im.id} value={im.id}>{im.titulo}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">TIPO</label>
                      <select className="form-select rounded-3" value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR DO NEGÓCIO (R$)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0"
                        value={form.valor_negocio}
                        onChange={e => setForm(p => ({
                          ...p, valor_negocio: e.target.value,
                          valor_comissao: calcularComissao(p.percentual, e.target.value),
                        }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">PERCENTUAL (%)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0" max="100"
                        value={form.percentual}
                        onChange={e => setForm(p => ({
                          ...p, percentual: e.target.value,
                          valor_comissao: calcularComissao(e.target.value, p.valor_negocio),
                        }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR COMISSÃO (R$)</label>
                      <input className="form-control rounded-3 bg-light" readOnly
                        value={form.valor_comissao || calcularComissao(form.percentual, form.valor_negocio)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATA COMPETÊNCIA</label>
                      <input className="form-control rounded-3" type="date" value={form.data_competencia}
                        onChange={e => setForm(p => ({ ...p, data_competencia: e.target.value }))} />
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
                    {editId ? 'Salvar alterações' : 'Registrar comissão'}
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
