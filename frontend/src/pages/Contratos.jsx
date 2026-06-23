import { useState, useEffect } from 'react'
import { Plus, ScrollText, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const TIPOS   = ['venda','aluguel','temporada','administracao']
const STATUS  = ['ativo','encerrado','cancelado','suspenso']
const STATUS_LABEL = { ativo: 'Ativo', encerrado: 'Encerrado', cancelado: 'Cancelado', suspenso: 'Suspenso' }
const STATUS_COR   = { ativo: 'success', encerrado: 'secondary', cancelado: 'danger', suspenso: 'warning' }

const VAZIO = {
  imovel_id: '', proposta_id: '', tipo: 'aluguel',
  cliente_nome: '', cliente_cpf: '', cliente_email: '', cliente_telefone: '',
  valor_mensal: '', valor_total: '', comissao_percentual: '',
  data_inicio: '', data_fim: '', data_assinatura: '',
  status: 'ativo', observacoes: '',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function diasRestantes(dataFim) {
  if (!dataFim) return null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const fim   = new Date(dataFim + 'T00:00:00')
  return Math.round((fim - hoje) / 86400000)
}

export default function Contratos() {
  const { user } = useAuth()
  const isGestor = ['administrador_matriz','diretor_regional','franqueado','juridico'].includes(user?.role)

  const [lista, setLista]      = useState([])
  const [imoveis, setImoveis]  = useState([])
  const [loading, setLoading]  = useState(true)
  const [busca, setBusca]      = useState('')
  const [filtroStat, setFStat] = useState('ativo')
  const [form, setForm]        = useState(VAZIO)
  const [editId, setEditId]    = useState(null)
  const [showModal, setShow]   = useState(false)

  async function carregar() {
    setLoading(true)
    try {
      const [rC, rI] = await Promise.all([api.get('/contratos'), api.get('/imoveis')])
      setLista(rC.data); setImoveis(rI.data)
    } catch { toast.error('Erro ao carregar contratos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrir(c = null) {
    if (c) { setForm({ ...VAZIO, ...c }); setEditId(c.id) }
    else   { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/contratos/${editId}`, form)
      else        await api.post('/contratos', form)
      toast.success(editId ? 'Contrato atualizado!' : 'Contrato registrado!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir este contrato?')) return
    try { await api.delete(`/contratos/${id}`); toast.success('Excluído!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(c => {
    const q  = busca.toLowerCase()
    const ok = !q || c.cliente_nome?.toLowerCase().includes(q) || c.imovel_titulo?.toLowerCase().includes(q)
    const fs = !filtroStat || c.status === filtroStat
    return ok && fs
  })

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Contratos</h4>
          <p className="text-muted small mb-0">{lista.filter(c => c.status === 'ativo').length} ativos</p>
        </div>
        {isGestor && (
          <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
            <Plus size={16} /> Novo Contrato
          </button>
        )}
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="row g-2">
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
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>VIGÊNCIA</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-5">Nenhum contrato encontrado.</td></tr>
                ) : filtrada.map(c => {
                  const dias = diasRestantes(c.data_fim)
                  const venceBreve = c.status === 'ativo' && dias !== null && dias <= 30 && dias >= 0
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="fw-semibold text-dark" style={{ fontSize: '0.88rem' }}>{c.cliente_nome}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{c.cliente_cpf}</div>
                      </td>
                      <td style={{ fontSize: '0.83rem', maxWidth: '160px' }} className="text-truncate">{c.imovel_titulo || '—'}</td>
                      <td><span className="badge bg-light text-dark rounded-pill">{c.tipo}</span></td>
                      <td className="fw-semibold text-primary" style={{ fontSize: '0.88rem' }}>
                        {moeda(c.valor_mensal || c.valor_total)}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        <div style={{ color: '#64748b' }}>
                          {c.data_inicio ? new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                          {' → '}
                          {c.data_fim ? new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                        </div>
                        {venceBreve && (
                          <div className="d-flex align-items-center gap-1 text-warning" style={{ fontSize: '0.7rem' }}>
                            <AlertTriangle size={11} /> vence em {dias}d
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${STATUS_COR[c.status] ?? 'secondary'} rounded-pill`}>
                          {STATUS_LABEL[c.status]}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
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
                  )
                })}
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
                <h5 className="modal-title fw-bold">{editId ? 'Editar Contrato' : 'Novo Contrato'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">IMÓVEL</label>
                      <select className="form-select rounded-3" value={form.imovel_id}
                        onChange={e => setForm(p => ({ ...p, imovel_id: e.target.value }))}>
                        <option value="">Selecione o imóvel...</option>
                        {imoveis.map(im => <option key={im.id} value={im.id}>{im.titulo}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">TIPO *</label>
                      <select className="form-select rounded-3" required value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        {TIPOS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status}
                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                        {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">NOME DO CLIENTE *</label>
                      <input className="form-control rounded-3" required value={form.cliente_nome}
                        onChange={e => setForm(p => ({ ...p, cliente_nome: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">CPF DO CLIENTE</label>
                      <input className="form-control rounded-3" value={form.cliente_cpf}
                        onChange={e => setForm(p => ({ ...p, cliente_cpf: e.target.value }))} placeholder="000.000.000-00" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">E-MAIL</label>
                      <input className="form-control rounded-3" type="email" value={form.cliente_email}
                        onChange={e => setForm(p => ({ ...p, cliente_email: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">TELEFONE</label>
                      <input className="form-control rounded-3" value={form.cliente_telefone}
                        onChange={e => setForm(p => ({ ...p, cliente_telefone: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR MENSAL (R$)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0"
                        value={form.valor_mensal}
                        onChange={e => setForm(p => ({ ...p, valor_mensal: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR TOTAL (R$)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0"
                        value={form.valor_total}
                        onChange={e => setForm(p => ({ ...p, valor_total: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">COMISSÃO (%)</label>
                      <input className="form-control rounded-3" type="number" step="0.01" min="0" max="100"
                        value={form.comissao_percentual}
                        onChange={e => setForm(p => ({ ...p, comissao_percentual: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATA INÍCIO</label>
                      <input className="form-control rounded-3" type="date" value={form.data_inicio}
                        onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATA FIM</label>
                      <input className="form-control rounded-3" type="date" value={form.data_fim}
                        onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATA ASSINATURA</label>
                      <input className="form-control rounded-3" type="date" value={form.data_assinatura}
                        onChange={e => setForm(p => ({ ...p, data_assinatura: e.target.value }))} />
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
                    {editId ? 'Salvar alterações' : 'Registrar contrato'}
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
