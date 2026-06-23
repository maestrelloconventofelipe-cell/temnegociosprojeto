import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import { maskCEP } from '../../utils/masks'
import { useBuscaCEP } from '../../hooks/useBuscaCEP'
import {
  Building2, Tag, MapPin, BedDouble, Bath, Car,
  DollarSign, Maximize2, UserCog, ChevronLeft, Save,
  ImagePlus, X, Image as ImageIcon,
} from 'lucide-react'

const TIPOS = ['apartamento','casa','terreno','comercial','rural']
const FINALIDADES = ['venda','locacao','temporada']
const STATUS_LIST = ['disponivel','alugado','vendido','inativo']
const TIPO_LABELS = { apartamento: 'Apartamento', casa: 'Casa', terreno: 'Terreno', comercial: 'Comercial', rural: 'Rural' }
const FINALIDADE_LABELS = { venda: 'Venda', locacao: 'Locação', temporada: 'Temporada' }
const STATUS_LABELS = { disponivel: 'Disponível', alugado: 'Alugado', vendido: 'Vendido', inativo: 'Inativo' }

const INICIAL = {
  titulo: '', tipo: 'apartamento', finalidade: 'venda', valor: '',
  area_total: '', quartos: '', banheiros: '', vagas: '',
  endereco: '', bairro: '', cidade: '', estado: '', cep: '',
  status: 'disponivel', corretor_id: '',
}

function SectionCard({ icon: Icon, title, accent = '#2563eb', children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100" style={{ borderLeft: `3px solid ${accent}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}18` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  )
}

function InputIcon({ icon: Icon, accent = '#2563eb', children }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
        <Icon size={15} style={{ color: accent }} />
      </div>
      <div className="[&>input]:pl-9 [&>select]:pl-9">{children}</div>
    </div>
  )
}

export default function ImovelForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm]                     = useState(INICIAL)
  const [corretores, setCorretores]         = useState([])
  const [carregando, setCarregando]         = useState(isEdit)
  const [salvando, setSalvando]             = useState(false)
  const [erro, setErro]                     = useState('')
  const [fotosNovas, setFotosNovas]         = useState([])     // File[] a enviar
  const [fotosExistentes, setFotosExistentes] = useState([])  // {id, foto}[] do banco
  const [removendoFoto, setRemovendoFoto]   = useState(null)
  const fileInputRef = useRef(null)
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { toast }    = useToast()

  const podeAtribuirCorretor = ['administrador_matriz','diretor_regional','franqueado'].includes(user?.role)

  const { buscar: buscarCEP, buscando: buscandoCEP } = useBuscaCEP(({ logradouro, bairro: b, cidade, estado }) => {
    setForm(prev => ({
      ...prev,
      endereco: logradouro || prev.endereco,
      bairro:   b         || prev.bairro,
      cidade:   cidade    || prev.cidade,
      estado:   estado    || prev.estado,
    }))
  })

  function handleCEP(valor) {
    const mascarado = maskCEP(valor)
    set('cep', mascarado)
    if (mascarado.replace(/\D/g, '').length === 8) buscarCEP(mascarado)
  }

  useEffect(() => {
    if (podeAtribuirCorretor) {
      api.get('/corretores').then(r => setCorretores(r.data)).catch(() => {})
    }
    if (isEdit) {
      api.get(`/imoveis/${id}`)
        .then(r => {
          const d = r.data
          setForm({
            titulo: d.titulo || '', tipo: d.tipo || 'apartamento',
            finalidade: d.tipo_negocio || 'venda',
            valor: d.valor || '', area_total: d.area_total || '',
            quartos: d.quartos || '', banheiros: d.banheiros || '',
            vagas: d.garagens || '', endereco: d.endereco || '',
            bairro: d.bairro || '', cidade: d.cidade || '',
            estado: d.estado || '', cep: d.cep || '',
            status: d.status || 'disponivel', corretor_id: d.corretor || '',
          })
          setFotosExistentes(d.imagens || [])
        })
        .catch(() => setErro('Imóvel não encontrado.'))
        .finally(() => setCarregando(false))
    }
  }, [])

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleNovasFotos(e) {
    const files = Array.from(e.target.files)
    const total = fotosExistentes.length + fotosNovas.length + files.length
    if (total > 10) {
      toast('Limite de 10 fotos por imóvel.', 'error')
      return
    }
    setFotosNovas(prev => [...prev, ...files])
    e.target.value = ''
  }

  function removerFotoNova(index) {
    setFotosNovas(prev => prev.filter((_, i) => i !== index))
  }

  async function removerFotoExistente(fotoId) {
    setRemovendoFoto(fotoId)
    try {
      await api.delete(`/imoveis/${id}/fotos/${fotoId}`)
      setFotosExistentes(prev => prev.filter(f => f.id !== fotoId))
      toast('Foto removida.', 'success')
    } catch {
      toast('Erro ao remover foto.', 'error')
    } finally {
      setRemovendoFoto(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      const payload = {
        ...form,
        valor:      form.valor      ? Number(form.valor)      : null,
        area_total: form.area_total ? Number(form.area_total) : null,
        quartos:    form.quartos    ? Number(form.quartos)    : null,
        banheiros:  form.banheiros  ? Number(form.banheiros)  : null,
        vagas:      form.vagas      ? Number(form.vagas)      : null,
        corretor_id: form.corretor_id ? Number(form.corretor_id) : null,
      }

      let imovelId = id
      if (isEdit) {
        await api.put(`/imoveis/${id}`, payload)
      } else {
        const res = await api.post('/imoveis', payload)
        imovelId = res.data.id
      }

      // Upload das novas fotos
      if (fotosNovas.length > 0) {
        const formData = new FormData()
        fotosNovas.forEach(f => formData.append('fotos', f))
        await api.post(`/imoveis/${imovelId}/fotos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      toast('Imóvel salvo com sucesso!', 'success')
      navigate('/imoveis')
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar imóvel.')
    } finally {
      setSalvando(false)
    }
  }

  const totalFotos = fotosExistentes.length + fotosNovas.length

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl">
        {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/imoveis')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar imóvel' : 'Novo imóvel'}</h1>
              <p className="text-xs text-gray-400">Informações, localização e fotos</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Informações */}
          <SectionCard icon={Tag} title="Informações do imóvel" accent="#2563eb">
            <div>
              <label className="label">Título *</label>
              <input value={form.titulo} onChange={e => set('titulo', e.target.value)} required
                placeholder="Ex: Apartamento 3 quartos centro" className="input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo *</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Finalidade *</label>
                <select value={form.finalidade} onChange={e => set('finalidade', e.target.value)} className="input">
                  {FINALIDADES.map(f => <option key={f} value={f}>{FINALIDADE_LABELS[f]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valor (R$)</label>
                <InputIcon icon={DollarSign} accent="#2563eb">
                  <input type="number" value={form.valor} onChange={e => set('valor', e.target.value)}
                    placeholder="250000" className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Área total (m²)</label>
                <InputIcon icon={Maximize2} accent="#2563eb">
                  <input type="number" value={form.area_total} onChange={e => set('area_total', e.target.value)}
                    placeholder="80" className="input" />
                </InputIcon>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Quartos</label>
                <InputIcon icon={BedDouble} accent="#2563eb">
                  <input type="number" min="0" value={form.quartos} onChange={e => set('quartos', e.target.value)} className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Banheiros</label>
                <InputIcon icon={Bath} accent="#2563eb">
                  <input type="number" min="0" value={form.banheiros} onChange={e => set('banheiros', e.target.value)} className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Vagas</label>
                <InputIcon icon={Car} accent="#2563eb">
                  <input type="number" min="0" value={form.vagas} onChange={e => set('vagas', e.target.value)} className="input" />
                </InputIcon>
              </div>
            </div>
          </SectionCard>

          {/* Localização */}
          <SectionCard icon={MapPin} title="Localização" accent="#0891b2">
            <div>
              <label className="label">Endereço</label>
              <InputIcon icon={MapPin} accent="#0891b2">
                <input value={form.endereco} onChange={e => set('endereco', e.target.value)}
                  placeholder="Rua, número" className="input" />
              </InputIcon>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Bairro</label>
                <input value={form.bairro} onChange={e => set('bairro', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">UF</label>
                <input value={form.estado} onChange={e => set('estado', e.target.value)}
                  maxLength={2} placeholder="SP" className="input uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  CEP
                  {buscandoCEP && <span className="text-xs text-blue-400 font-normal animate-pulse">buscando…</span>}
                </label>
                <input
                  value={form.cep}
                  onChange={e => handleCEP(e.target.value)}
                  placeholder="00000-000"
                  className={`input ${buscandoCEP ? 'opacity-60' : ''}`}
                />
              </div>
              {isEdit && (
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Responsável */}
          {podeAtribuirCorretor && corretores.length > 0 && (
            <SectionCard icon={UserCog} title="Responsável" accent="#7c3aed">
              <div>
                <label className="label">Corretor responsável</label>
                <select value={form.corretor_id} onChange={e => set('corretor_id', e.target.value)} className="input">
                  <option value="">Sem corretor</option>
                  {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </SectionCard>
          )}

          {/* Fotos */}
          <SectionCard icon={ImageIcon} title={`Fotos do imóvel ${totalFotos > 0 ? `(${totalFotos}/10)` : ''}`} accent="#d97706">

            {/* Fotos existentes (edição) */}
            {fotosExistentes.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Fotos salvas</p>
                <div className="flex flex-wrap gap-2">
                  {fotosExistentes.map(f => (
                    <div key={f.id} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src={`/uploads/imoveis/${f.foto}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removerFotoExistente(f.id)}
                        disabled={removendoFoto === f.id}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview de novas fotos */}
            {fotosNovas.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Novas fotos (serão salvas ao confirmar)</p>
                <div className="flex flex-wrap gap-2">
                  {fotosNovas.map((f, i) => (
                    <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-amber-200 shadow-sm">
                      <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removerFotoNova(i)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão de adicionar */}
            {totalFotos < 10 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleNovasFotos}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 border-2 border-dashed border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors w-full justify-center"
                >
                  <ImagePlus size={16} />
                  Adicionar fotos (JPG, PNG, WEBP — máx. {10 - totalFotos} restante{10 - totalFotos !== 1 ? 's' : ''})
                </button>
              </div>
            )}

            {totalFotos === 0 && (
              <p className="text-xs text-gray-400 text-center">Nenhuma foto adicionada. O card do imóvel exibirá um placeholder.</p>
            )}
          </SectionCard>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>
          )}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar imóvel'}
            </button>
            <button type="button" onClick={() => navigate('/imoveis')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
