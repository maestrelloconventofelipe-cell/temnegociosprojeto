import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet, Filter, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/client'

const TIPOS_LANC = ['receita','despesa']
const CATEGORIAS_REC = ['comissao','aluguel','venda','taxa_administrativa','servico','outro']
const CATEGORIAS_DES = ['aluguel_escritorio','salario','marketing','juridico','manutencao','imposto','outro']
const CAT_LABEL = {
  comissao: 'Comissão', aluguel: 'Aluguel', venda: 'Venda', taxa_administrativa: 'Taxa Adm.',
  servico: 'Serviço', aluguel_escritorio: 'Aluguel escritório', salario: 'Salário',
  marketing: 'Marketing', juridico: 'Jurídico', manutencao: 'Manutenção', imposto: 'Imposto', outro: 'Outro',
}
const STATUS_PAG = ['pendente','pago','atrasado','cancelado']
const STATUS_LABEL = { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado' }
const STATUS_COR   = { pendente: 'warning', pago: 'success', atrasado: 'danger', cancelado: 'secondary' }

const VAZIO = {
  tipo: 'receita', categoria: 'comissao', descricao: '', valor: '',
  data_competencia: '', data_vencimento: '', data_pagamento: '',
  status_pagamento: 'pendente', observacoes: '',
}

function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }

export default function Financeiro() {
  const { user } = useAuth()
  const isGestor = ['administrador_matriz','diretor_regional','franqueado'].includes(user?.role)

  const [lista, setLista]     = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(VAZIO)
  const [editId, setEditId]   = useState(null)
  const [showModal, setShow]  = useState(false)
  const [filtroTipo, setFTipo] = useState('')
  const [filtroStat, setFStat] = useState('')
  const [mes, setMes]         = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  async function carregar() {
    setLoading(true)
    try {
      const r = await api.get('/financeiro', { params: { mes } })
      setLista(r.data)
    } catch { toast.error('Erro ao carregar lançamentos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [mes])

  const receitas  = lista.filter(l => l.tipo === 'receita')
  const despesas  = lista.filter(l => l.tipo === 'despesa')
  const totRec    = receitas.reduce((s, l) => s + Number(l.valor), 0)
  const totDes    = despesas.reduce((s, l) => s + Number(l.valor), 0)
  const totRecPago = receitas.filter(l => l.status_pagamento === 'pago').reduce((s, l) => s + Number(l.valor), 0)
  const totDesPago = despesas.filter(l => l.status_pagamento === 'pago').reduce((s, l) => s + Number(l.valor), 0)
  const saldo      = totRecPago - totDesPago

  function abrir(lanc = null) {
    if (lanc) { setForm({ ...VAZIO, ...lanc }); setEditId(lanc.id) }
    else { setForm(VAZIO); setEditId(null) }
    setShow(true)
  }
  function fechar() { setShow(false); setForm(VAZIO) }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (editId) await api.put(`/financeiro/${editId}`, form)
      else        await api.post('/financeiro', form)
      toast.success(editId ? 'Atualizado!' : 'Lançamento registrado!')
      fechar(); carregar()
    } catch (err) { toast.error(err.response?.data?.erro || 'Erro ao salvar.') }
  }

  async function excluir(id) {
    if (!confirm('Excluir este lançamento?')) return
    try { await api.delete(`/financeiro/${id}`); toast.success('Excluído!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  async function marcarPago(lanc) {
    try {
      await api.patch(`/financeiro/${lanc.id}/pagar`, { data_pagamento: new Date().toISOString().slice(0,10) })
      toast.success('Marcado como pago!')
      carregar()
    } catch { toast.error('Erro ao atualizar.') }
  }

  const categorias = form.tipo === 'receita' ? CATEGORIAS_REC : CATEGORIAS_DES
  const filtrada = lista.filter(l => {
    const ft = !filtroTipo || l.tipo === filtroTipo
    const fs = !filtroStat || l.status_pagamento === filtroStat
    return ft && fs
  })

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Financeiro</h4>
          <p className="text-muted small mb-0">DRE e controle de caixa</p>
        </div>
        {isGestor && (
          <button className="btn btn-primary rounded-3 shadow-sm d-flex align-items-center gap-2" onClick={() => abrir()}>
            <Plus size={16} /> Novo Lançamento
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: '4px solid #22c55e' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>Receitas previstas</small>
              <TrendingUp size={14} className="text-success" />
            </div>
            <div className="fw-bold text-success">{moeda(totRec)}</div>
            <small className="text-muted">Pagas: {moeda(totRecPago)}</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>Despesas previstas</small>
              <TrendingDown size={14} className="text-danger" />
            </div>
            <div className="fw-bold text-danger">{moeda(totDes)}</div>
            <small className="text-muted">Pagas: {moeda(totDesPago)}</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: `4px solid ${saldo >= 0 ? '#3b82f6' : '#dc2626'}` }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>Saldo do mês</small>
              <Wallet size={14} className={saldo >= 0 ? 'text-primary' : 'text-danger'} />
            </div>
            <div className={`fw-bold ${saldo >= 0 ? 'text-primary' : 'text-danger'}`}>{moeda(saldo)}</div>
            <small className="text-muted">Recebido − pago</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>A receber</small>
              <Filter size={14} className="text-warning" />
            </div>
            <div className="fw-bold text-warning">{moeda(totRec - totRecPago)}</div>
            <small className="text-muted">Receitas pendentes</small>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card shadow-sm border-0 rounded-4 p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <input type="month" className="form-control border-0 shadow-none" value={mes}
              onChange={e => setMes(e.target.value)} />
          </div>
          <div className="col-md-3">
            <select className="form-select border-0 shadow-none" value={filtroTipo} onChange={e => setFTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select border-0 shadow-none" value={filtroStat} onChange={e => setFStat(e.target.value)}>
              <option value="">Todos os status</option>
              {STATUS_PAG.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="col-md-3 text-muted small text-end">
            {filtrada.length} de {lista.length} registros
          </div>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TIPO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DESCRIÇÃO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CATEGORIA</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>VALOR</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>VENCIMENTO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-5">Nenhum lançamento no período.</td></tr>
                ) : filtrada.map(l => (
                  <tr key={l.id}>
                    <td>
                      <span className={`badge rounded-pill bg-${l.tipo === 'receita' ? 'success' : 'danger'}-subtle text-${l.tipo === 'receita' ? 'success' : 'danger'}`}>
                        {l.tipo === 'receita' ? '↑' : '↓'} {l.tipo}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <span className="fw-medium">{l.descricao}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{CAT_LABEL[l.categoria] ?? l.categoria}</td>
                    <td className={`fw-bold ${l.tipo === 'receita' ? 'text-success' : 'text-danger'}`}>
                      {moeda(l.valor)}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {l.data_vencimento ? new Date(l.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <span className={`badge bg-${STATUS_COR[l.status_pagamento] ?? 'secondary'} rounded-pill`}>
                        {STATUS_LABEL[l.status_pagamento]}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        {l.status_pagamento !== 'pago' && l.status_pagamento !== 'cancelado' && (
                          <button className="btn btn-outline-success btn-sm rounded-3" title="Marcar como pago"
                            onClick={() => marcarPago(l)}>
                            <CheckCircle size={13} />
                          </button>
                        )}
                        <button className="btn btn-outline-primary btn-sm rounded-3" onClick={() => abrir(l)}>
                          Editar
                        </button>
                        {isGestor && (
                          <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(l.id)}>
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
                <h5 className="modal-title fw-bold">{editId ? 'Editar Lançamento' : 'Novo Lançamento'}</h5>
                <button className="btn-close" onClick={fechar} />
              </div>
              <form onSubmit={salvar}>
                <div className="modal-body px-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">TIPO *</label>
                      <select className="form-select rounded-3" required value={form.tipo}
                        onChange={e => setForm(p => ({ ...p, tipo: e.target.value, categoria: e.target.value === 'receita' ? CATEGORIAS_REC[0] : CATEGORIAS_DES[0] }))}>
                        {TIPOS_LANC.map(t => <option key={t} value={t}>{t === 'receita' ? 'Receita' : 'Despesa'}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">CATEGORIA *</label>
                      <select className="form-select rounded-3" required value={form.categoria}
                        onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                        {categorias.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">DESCRIÇÃO *</label>
                      <input className="form-control rounded-3" required value={form.descricao}
                        onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">VALOR (R$) *</label>
                      <input className="form-control rounded-3" required type="number" step="0.01" min="0"
                        value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATA COMPETÊNCIA</label>
                      <input className="form-control rounded-3" type="date" value={form.data_competencia}
                        onChange={e => setForm(p => ({ ...p, data_competencia: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">DATA VENCIMENTO</label>
                      <input className="form-control rounded-3" type="date" value={form.data_vencimento}
                        onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">STATUS</label>
                      <select className="form-select rounded-3" value={form.status_pagamento}
                        onChange={e => setForm(p => ({ ...p, status_pagamento: e.target.value }))}>
                        {STATUS_PAG.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">DATA PAGAMENTO</label>
                      <input className="form-control rounded-3" type="date" value={form.data_pagamento}
                        onChange={e => setForm(p => ({ ...p, data_pagamento: e.target.value }))} />
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
                    {editId ? 'Salvar alterações' : 'Registrar lançamento'}
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
