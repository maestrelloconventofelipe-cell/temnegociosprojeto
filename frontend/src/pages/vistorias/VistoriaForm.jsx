import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  ClipboardCheck, ChevronLeft, Save,
  Home, CalendarDays, User, UserCheck, FileText,
} from 'lucide-react'

const TIPOS = [
  { value: 'entrada',     label: 'Entrada'     },
  { value: 'saida',       label: 'Saída'       },
  { value: 'pre_venda',   label: 'Pré-venda'   },
  { value: 'conferencia', label: 'Conferência' },
]

const VAZIO = {
  imovel_id:       '',
  data:            new Date().toISOString().split('T')[0],
  tipo:            'entrada',
  proprietario_id: '',
  inquilino_id:    '',
  texto:           '',
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

function Field({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>
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

export default function VistoriaForm() {
  const { id } = useParams()
  const navigate  = useNavigate()
  const { toast } = useToast()

  const [form, setForm]           = useState(VAZIO)
  const [imoveis, setImoveis]     = useState([])
  const [clientes, setClientes]   = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  const editando = !!id

  useEffect(() => {
    const carregar = async () => {
      try {
        const [imovRes, cliRes] = await Promise.all([
          api.get('/imoveis'),
          api.get('/clientes', { params: { tabela: 'comprador' } }),
        ])
        setImoveis(imovRes.data)
        setClientes(cliRes.data)

        if (id) {
          const { data: v } = await api.get(`/vistorias/${id}`)
          setForm({
            imovel_id:       String(v.imovel       ?? ''),
            data:            v.data?.split('T')[0]  ?? '',
            tipo:            v.tipo                 ?? 'entrada',
            proprietario_id: String(v.proprietario ?? ''),
            inquilino_id:    String(v.inquilino     ?? ''),
            texto:           v.texto                ?? '',
          })
        }
      } catch { setErro('Erro ao carregar dados.') }
      finally  { setCarregando(false) }
    }
    carregar()
  }, [id])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true); setErro('')
    try {
      if (editando) {
        await api.put(`/vistorias/${id}`, form)
        toast('Vistoria atualizada!', 'success')
      } else {
        await api.post('/vistorias', form)
        toast('Vistoria registrada com sucesso!', 'success')
        navigate('/vistorias')
      }
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl">
        {[1,2,3].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  const imovelSel = imoveis.find(i => String(i.id) === form.imovel_id)

  return (
    <AppLayout>
      <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vistorias"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0">
            <ChevronLeft size={16} className="text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30 shrink-0">
            <ClipboardCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {editando ? 'Editar vistoria' : 'Nova vistoria'}
            </h1>
            {editando && imovelSel && (
              <p className="text-xs text-gray-400">{imovelSel.titulo}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Imóvel e data */}
          <SectionCard icon={Home} title="Imóvel e data" accent="#2563eb">
            <Field label="Imóvel *">
              <InputIcon icon={Home} accent="#2563eb">
                <select value={form.imovel_id} onChange={e => set('imovel_id', e.target.value)} required className="input">
                  <option value="">Selecione o imóvel</option>
                  {imoveis.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.titulo}{i.cidade ? ` — ${i.cidade}` : ''}
                    </option>
                  ))}
                </select>
              </InputIcon>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Data da vistoria *">
                <InputIcon icon={CalendarDays} accent="#2563eb">
                  <input type="date" value={form.data}
                    onChange={e => set('data', e.target.value)}
                    required className="input" />
                </InputIcon>
              </Field>
              <Field label="Tipo *">
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} required className="input">
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>
          </SectionCard>

          {/* 2. Partes envolvidas */}
          <SectionCard icon={User} title="Partes envolvidas" accent="#0891b2">
            <Field label="Proprietário">
              <InputIcon icon={User} accent="#0891b2">
                <select value={form.proprietario_id} onChange={e => set('proprietario_id', e.target.value)} className="input">
                  <option value="">Não informado</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </InputIcon>
            </Field>
            <Field label="Inquilino / Comprador">
              <InputIcon icon={UserCheck} accent="#0891b2">
                <select value={form.inquilino_id} onChange={e => set('inquilino_id', e.target.value)} className="input">
                  <option value="">Não informado</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </InputIcon>
            </Field>
          </SectionCard>

          {/* 3. Observações */}
          <SectionCard icon={FileText} title="Observações" accent="#ea580c">
            <Field label="Descrição / laudo da vistoria">
              <textarea
                value={form.texto}
                onChange={e => set('texto', e.target.value)}
                rows={6}
                placeholder="Descreva o estado geral do imóvel, itens verificados, condições das paredes, piso, instalações, etc."
                className="input resize-none"
              />
            </Field>
          </SectionCard>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>
          )}

          <div className="flex gap-3 pt-1 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Registrar vistoria'}
            </button>
            <Link to="/vistorias" className="btn-ghost">Cancelar</Link>
          </div>

        </form>
      </div>
    </AppLayout>
  )
}
