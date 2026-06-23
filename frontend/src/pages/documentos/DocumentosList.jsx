import { useState, useEffect, useRef } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  FolderOpen, Upload, RefreshCw, Download, Trash2,
  FileText, FileImage, File, X, Plus,
  Building2, Users, ScrollText, ClipboardCheck, Package,
} from 'lucide-react'

const REGISTROS = {
  geral:     { label: 'Geral',      cor: 'bg-gray-100 text-gray-600',    icon: Package     },
  imovel:    { label: 'Imóvel',     cor: 'bg-blue-100 text-blue-700',    icon: Building2   },
  cliente:   { label: 'Cliente',    cor: 'bg-cyan-100 text-cyan-700',    icon: Users       },
  contrato:  { label: 'Contrato',   cor: 'bg-green-100 text-green-700',  icon: ScrollText  },
  vistoria:  { label: 'Vistoria',   cor: 'bg-orange-100 text-orange-700',icon: ClipboardCheck },
}

const EXT_ICONE = {
  pdf:  { icon: FileText,  cor: 'text-red-500',   bg: 'bg-red-50'    },
  doc:  { icon: FileText,  cor: 'text-blue-600',  bg: 'bg-blue-50'   },
  docx: { icon: FileText,  cor: 'text-blue-600',  bg: 'bg-blue-50'   },
  xls:  { icon: FileText,  cor: 'text-green-600', bg: 'bg-green-50'  },
  xlsx: { icon: FileText,  cor: 'text-green-600', bg: 'bg-green-50'  },
  png:  { icon: FileImage, cor: 'text-purple-500',bg: 'bg-purple-50' },
  jpg:  { icon: FileImage, cor: 'text-purple-500',bg: 'bg-purple-50' },
  jpeg: { icon: FileImage, cor: 'text-purple-500',bg: 'bg-purple-50' },
}

function extInfo(arquivo) {
  const ext = arquivo?.split('.').pop()?.toLowerCase() ?? ''
  return EXT_ICONE[ext] ?? { icon: File, cor: 'text-gray-400', bg: 'bg-gray-50' }
}

function dataBr(d) { return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—' }
function tamanhoLabel(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const VAZIO_FORM = { nome: '', descricao: '', registro: 'geral', id_reg: '' }

export default function DocumentosList() {
  const { toast }   = useToast()
  const { confirm } = useConfirm()
  const fileRef     = useRef(null)

  const [docs, setDocs]           = useState([])
  const [resumo, setResumo]       = useState(null)
  const [filtroReg, setFiltroReg] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]           = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm]           = useState(VAZIO_FORM)
  const [arquivo, setArquivo]     = useState(null)
  const [enviando, setEnviando]   = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroReg) params.registro = filtroReg
      const [lista, res] = await Promise.all([
        api.get('/arquivos', { params }),
        api.get('/arquivos/resumo'),
      ])
      setDocs(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar documentos.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroReg])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function abrirModal() { setForm(VAZIO_FORM); setArquivo(null); setModalAberto(true) }
  function fecharModal() { setModalAberto(false); setArquivo(null) }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setArquivo(f); if (!form.nome) set('nome', f.name.replace(/\.[^/.]+$/, '')) }
  }

  function onFileChange(e) {
    const f = e.target.files[0]
    if (f) { setArquivo(f); if (!form.nome) set('nome', f.name.replace(/\.[^/.]+$/, '')) }
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!arquivo) return toast('Selecione um arquivo.', 'error')
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('arquivo',  arquivo)
      fd.append('nome',     form.nome)
      fd.append('descricao',form.descricao)
      fd.append('registro', form.registro)
      fd.append('id_reg',   form.id_reg || '0')
      await api.post('/arquivos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast('Documento enviado!', 'success')
      fecharModal()
      carregar()
    } catch (err) { toast(err.response?.data?.erro || 'Erro ao enviar.', 'error') }
    finally       { setEnviando(false) }
  }

  async function remover(doc) {
    const ok = await confirm(
      `Remover o documento "${doc.nome}"? O arquivo será excluído permanentemente.`,
      { title: 'Remover documento', danger: true, confirmText: 'Sim, remover' }
    )
    if (!ok) return
    try {
      await api.delete(`/arquivos/${doc.id}`)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      toast('Documento removido.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const kpis = resumo ? [
    { label: 'Total',      valor: resumo.total,     accent: '#2563eb' },
    { label: 'Imóveis',    valor: resumo.imoveis,   accent: '#0891b2' },
    { label: 'Clientes',   valor: resumo.clientes,  accent: '#7c3aed' },
    { label: 'Contratos',  valor: resumo.contratos, accent: '#16a34a' },
  ] : []

  return (
    <AppLayout>
      {/* Modal de upload */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Upload size={16} className="text-blue-600" /> Enviar documento
              </h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : arquivo ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}>
                <input ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  onChange={onFileChange} />
                {arquivo ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    {(() => { const { icon: Ic, cor } = extInfo(arquivo.name); return <Ic size={20} className={cor} /> })()}
                    <div className="text-left">
                      <p className="text-sm font-semibold truncate max-w-xs">{arquivo.name}</p>
                      <p className="text-xs text-gray-400">{tamanhoLabel(arquivo.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Arraste ou <span className="text-blue-600 font-medium">clique para selecionar</span></p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, imagens • até 10 MB</p>
                  </>
                )}
              </div>

              <div>
                <label className="label">Nome do documento *</label>
                <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
                  required maxLength={50} placeholder="Ex: Contrato de compra e venda" className="input" />
              </div>

              <div>
                <label className="label">Descrição</label>
                <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  maxLength={500} placeholder="Breve descrição (opcional)" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoria</label>
                  <select value={form.registro} onChange={e => set('registro', e.target.value)} className="input">
                    {Object.entries(REGISTROS).map(([v, r]) => (
                      <option key={v} value={v}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {form.registro !== 'geral' && (
                  <div>
                    <label className="label">ID do registro</label>
                    <input type="number" value={form.id_reg} onChange={e => set('id_reg', e.target.value)}
                      placeholder="Nº do registro" className="input" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={enviando || !arquivo}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <Upload size={14} />
                  {enviando ? 'Enviando...' : 'Enviar documento'}
                </button>
                <button type="button" onClick={fecharModal} className="btn-ghost">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <FolderOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Documentos</h1>
            <p className="text-xs text-gray-400">{docs.length} documento(s)</p>
          </div>
        </div>
        <button onClick={abrirModal} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Upload documento
        </button>
      </div>

      {/* KPIs */}
      {resumo && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {kpis.map(k => (
            <div key={k.label} className="card overflow-hidden">
              <div className="h-0.5" style={{ backgroundColor: k.accent }} />
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-gray-800">{k.valor ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-2 items-center">
        {[{ value: '', label: 'Todos' }, ...Object.entries(REGISTROS).map(([v, r]) => ({ value: v, label: r.label }))].map(({ value, label }) => (
          <button key={value} onClick={() => setFiltroReg(value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filtroReg === value
                ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>
            {label}
          </button>
        ))}
        <button onClick={carregar}
          className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Lista */}
      <div className="card overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : docs.length === 0 ? (
          <div className="p-16 text-center">
            <FolderOpen size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum documento encontrado.</p>
            <button onClick={abrirModal} className="text-blue-600 text-sm hover:underline mt-1">
              Enviar o primeiro documento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map(doc => {
              const { icon: Ic, cor, bg } = extInfo(doc.arquivo)
              const reg = REGISTROS[doc.registro]
              const RegIcon = reg?.icon ?? Package
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                  {/* Ícone do arquivo */}
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Ic size={18} className={cor} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-gray-800 text-sm truncate">{doc.nome}</span>
                      {reg && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${reg.cor}`}>
                          <RegIcon size={9} /> {reg.label}
                          {doc.id_reg > 0 && <span className="opacity-70">#{doc.id_reg}</span>}
                        </span>
                      )}
                    </div>
                    {doc.descricao && <p className="text-xs text-gray-400 truncate">{doc.descricao}</p>}
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                      <span>{dataBr(doc.data_cad)}</span>
                      {doc.usuario_nome && <span>por {doc.usuario_nome}</span>}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`/uploads/documentos/${doc.arquivo}`} target="_blank" rel="noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors" title="Baixar">
                      <Download size={14} />
                    </a>
                    <button onClick={() => remover(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors" title="Remover">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
