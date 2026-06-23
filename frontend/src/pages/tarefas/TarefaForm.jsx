import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  CheckSquare, ChevronLeft, Save,
  FileText, CalendarDays, Clock, User, AlignLeft,
} from 'lucide-react'

const TIPOS_STATUS = [
  { value: 'pendente',     label: 'Pendente',     bg: 'bg-yellow-600', border: 'border-yellow-600' },
  { value: 'em_andamento', label: 'Em andamento', bg: 'bg-blue-700',   border: 'border-blue-700'   },
  { value: 'concluida',    label: 'Concluída',    bg: 'bg-green-700',  border: 'border-green-700'  },
  { value: 'cancelada',    label: 'Cancelada',    bg: 'bg-gray-500',   border: 'border-gray-500'   },
]

const ROLES_GESTOR = ['administrador_matriz','diretor_regional','franqueado']

const VAZIO = {
  titulo:     '',
  descricao:  '',
  data:       new Date().toISOString().split('T')[0],
  hora:       '09:00',
  usuario_id: '',
  status:     'pendente',
  obs:        '',
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

export default function TarefaForm() {
  const { id } = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { toast } = useToast()

  const [form, setForm]         = useState(VAZIO)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  const editando  = !!id
  const isGestor  = ROLES_GESTOR.includes(user?.role)

  useEffect(() => {
    const carregar = async () => {
      try {
        if (isGestor) {
          const { data: lista } = await api.get('/usuarios')
          setUsuarios(lista)
        }
        if (id) {
          const { data: t } = await api.get(`/tarefas/${id}`)
          setForm({
            titulo:     t.titulo     ?? '',
            descricao:  t.descricao  ?? '',
            data:       t.data?.split('T')[0] ?? '',
            hora:       t.hora?.slice(0,5)    ?? '09:00',
            usuario_id: String(t.usuario ?? ''),
            status:     t.status     ?? 'pendente',
            obs:        t.obs        ?? '',
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
        await api.put(`/tarefas/${id}`, form)
        toast('Tarefa atualizada!', 'success')
      } else {
        await api.post('/tarefas', form)
        toast('Tarefa criada!', 'success')
        navigate('/tarefas')
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

  return (
    <AppLayout>
      <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tarefas"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0">
            <ChevronLeft size={16} className="text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30 shrink-0">
            <CheckSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {editando ? 'Editar tarefa' : 'Nova tarefa'}
            </h1>
            {editando && form.titulo && (
              <p className="text-xs text-gray-400 truncate max-w-xs">{form.titulo}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Dados da tarefa */}
          <SectionCard icon={FileText} title="Dados da tarefa" accent="#2563eb">
            <Field label="Título *">
              <InputIcon icon={FileText} accent="#2563eb">
                <input type="text" value={form.titulo}
                  onChange={e => set('titulo', e.target.value)}
                  required maxLength={40} placeholder="Nome da tarefa"
                  className="input" />
              </InputIcon>
            </Field>

            <Field label="Descrição curta">
              <InputIcon icon={AlignLeft} accent="#2563eb">
                <input type="text" value={form.descricao}
                  onChange={e => set('descricao', e.target.value)}
                  maxLength={100} placeholder="Resumo em até 100 caracteres"
                  className="input" />
              </InputIcon>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Data *">
                <InputIcon icon={CalendarDays} accent="#2563eb">
                  <input type="date" value={form.data}
                    onChange={e => set('data', e.target.value)}
                    required className="input" />
                </InputIcon>
              </Field>
              <Field label="Hora *">
                <InputIcon icon={Clock} accent="#2563eb">
                  <input type="time" value={form.hora}
                    onChange={e => set('hora', e.target.value)}
                    required className="input" />
                </InputIcon>
              </Field>
            </div>

            {isGestor && (
              <Field label="Responsável">
                <InputIcon icon={User} accent="#2563eb">
                  <select value={form.usuario_id} onChange={e => set('usuario_id', e.target.value)} className="input">
                    <option value="">Minha tarefa</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </InputIcon>
              </Field>
            )}
          </SectionCard>

          {/* 2. Status (apenas edição) */}
          {editando && (
            <SectionCard icon={CheckSquare} title="Status" accent="#7c3aed">
              <div className="flex flex-wrap gap-2">
                {TIPOS_STATUS.map(s => {
                  const ativo = form.status === s.value
                  return (
                    <button key={s.value} type="button"
                      onClick={() => set('status', s.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        ativo
                          ? `${s.bg} ${s.border} text-white shadow-sm`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* 3. Observações */}
          <SectionCard icon={AlignLeft} title="Observações" accent="#ea580c">
            <Field label="Detalhes adicionais">
              <textarea
                value={form.obs}
                onChange={e => set('obs', e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Informações complementares, contexto, links, etc."
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
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
            <Link to="/tarefas" className="btn-ghost">Cancelar</Link>
          </div>

        </form>
      </div>
    </AppLayout>
  )
}
