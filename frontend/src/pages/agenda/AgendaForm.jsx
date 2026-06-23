import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import {
  CalendarDays, Type, Clock, AlignLeft, Link2,
  Building2, Users, CheckCircle2, ChevronLeft, Save,
} from 'lucide-react'

const TIPOS   = ['visita','reuniao','ligacao','assinatura','vistoria','outro']
const STATUS  = ['agendado','realizado','cancelado']
const TIPO_LABELS   = { visita: 'Visita', reuniao: 'Reunião', ligacao: 'Ligação', assinatura: 'Assinatura', vistoria: 'Vistoria', outro: 'Outro' }
const STATUS_LABELS = { agendado: 'Agendado', realizado: 'Realizado', cancelado: 'Cancelado' }

const STATUS_CORES = {
  agendado:  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', active: 'bg-blue-700 text-white border-blue-700' },
  realizado: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', active: 'bg-green-700 text-white border-green-700' },
  cancelado: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', active: 'bg-red-600 text-white border-red-600' },
}

function toLocalInput(d) {
  if (!d) return ''
  const dt = new Date(d)
  const pad = n => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

const INICIAL = {
  titulo: '', tipo: 'visita', data_hora: '', descricao: '',
  imovel_id: '', cliente_id: '', status: 'agendado',
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
      <div className="[&>input]:pl-9 [&>select]:pl-9 [&>textarea]:pl-9">{children}</div>
    </div>
  )
}

export default function AgendaForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(INICIAL)
  const [imoveis, setImoveis] = useState([])
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(isEdit)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/imoveis'),
      api.get('/clientes'),
      isEdit ? api.get(`/agenda/${id}`) : Promise.resolve(null),
    ]).then(([im, cl, ag]) => {
      setImoveis(im.data)
      setClientes(cl.data)
      if (ag) {
        const d = ag.data
        setForm({
          titulo: d.titulo || '', tipo: d.tipo || 'visita',
          data_hora: toLocalInput(d.data_hora),
          descricao: d.descricao || '',
          imovel_id: d.imovel_id || '', cliente_id: d.cliente_id || '',
          status: d.status || 'agendado',
        })
      }
    }).catch(() => setErro('Erro ao carregar dados.'))
    .finally(() => setCarregando(false))
  }, [])

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      const payload = {
        ...form,
        imovel_id:  form.imovel_id  ? Number(form.imovel_id)  : null,
        cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
      }
      if (isEdit) await api.put(`/agenda/${id}`, payload)
      else        await api.post('/agenda', payload)
      toast('Compromisso salvo com sucesso!', 'success')
      navigate('/agenda')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar compromisso.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-xl">
        {[1,2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/agenda')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar compromisso' : 'Novo compromisso'}</h1>
              <p className="text-xs text-gray-400">Agendamento e detalhes do compromisso</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Detalhes */}
          <SectionCard icon={CalendarDays} title="Detalhes do compromisso" accent="#2563eb">
            <div>
              <label className="label">Título *</label>
              <InputIcon icon={Type} accent="#2563eb">
                <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  required placeholder="Ex: Visita ao apartamento" className="input" />
              </InputIcon>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo *</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data e hora *</label>
                <InputIcon icon={Clock} accent="#2563eb">
                  <input type="datetime-local" value={form.data_hora} onChange={e => set('data_hora', e.target.value)}
                    required className="input" />
                </InputIcon>
              </div>
            </div>

            <div>
              <label className="label">Descrição</label>
              <InputIcon icon={AlignLeft} accent="#2563eb">
                <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  rows={3} placeholder="Detalhes do compromisso..." className="input resize-none" />
              </InputIcon>
            </div>
          </SectionCard>

          {/* Vínculos */}
          <SectionCard icon={Link2} title="Vínculos" accent="#0891b2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Imóvel vinculado</label>
                <InputIcon icon={Building2} accent="#0891b2">
                  <select value={form.imovel_id} onChange={e => set('imovel_id', e.target.value)} className="input">
                    <option value="">Nenhum</option>
                    {imoveis.map(i => <option key={i.id} value={i.id}>{i.titulo}</option>)}
                  </select>
                </InputIcon>
              </div>
              <div>
                <label className="label">Cliente vinculado</label>
                <InputIcon icon={Users} accent="#0891b2">
                  <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)} className="input">
                    <option value="">Nenhum</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </InputIcon>
              </div>
            </div>
          </SectionCard>

          {/* Status (apenas edição) */}
          {isEdit && (
            <SectionCard icon={CheckCircle2} title="Status" accent="#059669">
              <div className="flex gap-2">
                {STATUS.map(s => {
                  const c = STATUS_CORES[s]
                  const ativo = form.status === s
                  return (
                    <button key={s} type="button" onClick={() => set('status', s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        ativo ? c.active : `${c.bg} ${c.border} ${c.text} hover:opacity-80`
                      }`}>
                      {STATUS_LABELS[s]}
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Agendar compromisso'}
            </button>
            <button type="button" onClick={() => navigate('/agenda')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
