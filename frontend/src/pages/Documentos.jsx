import { useState, useEffect } from 'react'
import { Plus, Folder, Search, Download, Trash2, Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const CATEGORIAS = ['contrato','proposta','vistoria','identificacao','procuracao','laudo','outro']
const CAT_LABEL  = { contrato: 'Contrato', proposta: 'Proposta', vistoria: 'Vistoria', identificacao: 'Identificação', procuracao: 'Procuração', laudo: 'Laudo', outro: 'Outro' }

export default function Documentos() {
  const [lista, setLista]      = useState([])
  const [loading, setLoading]  = useState(true)
  const [busca, setBusca]      = useState('')
  const [filtroCat, setFCat]   = useState('')
  const [nome, setNome]        = useState('')
  const [categoria, setCat]    = useState('outro')
  const [arquivo, setArquivo]  = useState(null)
  const [uploading, setUpl]    = useState(false)

  async function carregar() {
    setLoading(true)
    try { const r = await api.get('/documentos'); setLista(r.data) }
    catch { toast.error('Erro ao carregar documentos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  async function enviar(e) {
    e.preventDefault()
    if (!arquivo) { toast.error('Selecione um arquivo.'); return }
    setUpl(true)
    try {
      const formData = new FormData()
      formData.append('arquivo', arquivo)
      const upRes = await api.post('/documentos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { url, tamanho } = upRes.data
      await api.post('/documentos', { nome: nome || arquivo.name, categoria, url, tamanho })
      toast.success('Documento enviado!')
      setNome(''); setCat('outro'); setArquivo(null)
      carregar()
    } catch (err) { toast.error(err.response?.data?.erro || err.message || 'Erro ao enviar.') }
    finally { setUpl(false) }
  }

  async function excluir(id) {
    if (!confirm('Excluir este documento?')) return
    try { await api.delete(`/documentos/${id}`); toast.success('Excluído!'); carregar() }
    catch { toast.error('Erro ao excluir.') }
  }

  const filtrada = lista.filter(d => {
    const q  = busca.toLowerCase()
    const ok = !q || d.nome?.toLowerCase().includes(q)
    const fc = !filtroCat || d.categoria === filtroCat
    return ok && fc
  })

  function tamanhoHuman(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1048576).toFixed(1)} MB`
  }

  return (
    <div>
      <h4 className="fw-bold text-dark mb-1">Documentos</h4>
      <p className="text-muted small mb-4">{lista.length} arquivos</p>

      {/* Upload */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h6 className="fw-semibold text-dark mb-3 d-flex align-items-center gap-2"><Upload size={16} /> Enviar documento</h6>
        <form onSubmit={enviar}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted">NOME</label>
              <input className="form-control rounded-3" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do documento" />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted">CATEGORIA</label>
              <select className="form-select rounded-3" value={categoria} onChange={e => setCat(e.target.value)}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted">ARQUIVO *</label>
              <input className="form-control rounded-3" type="file" required
                onChange={e => setArquivo(e.target.files[0])} />
            </div>
            <div className="col-md-2">
              <button type="submit" disabled={uploading} className="btn btn-primary rounded-3 w-100">
                {uploading ? <span className="spinner-border spinner-border-sm" /> : 'Enviar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card shadow-sm border-0 rounded-4 p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><Search size={15} className="text-muted" /></span>
              <input className="form-control border-0 shadow-none" placeholder="Buscar por nome..."
                value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
          <div className="col-md-5">
            <select className="form-select border-0 shadow-none" value={filtroCat} onChange={e => setFCat(e.target.value)}>
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : filtrada.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center text-muted">
          <Folder size={40} strokeWidth={1} className="mx-auto mb-3" />
          <p className="mb-0">Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>NOME</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CATEGORIA</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TAMANHO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DATA</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrada.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FileText size={16} className="text-muted" />
                        <span className="fw-medium" style={{ fontSize: '0.88rem' }}>{d.nome}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark rounded-pill">{CAT_LABEL[d.categoria] ?? d.categoria}</span></td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{tamanhoHuman(d.tamanho)}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        <a href={d.url} target="_blank" rel="noreferrer" className="btn btn-outline-success btn-sm rounded-3">
                          <Download size={13} />
                        </a>
                        <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => excluir(d.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
