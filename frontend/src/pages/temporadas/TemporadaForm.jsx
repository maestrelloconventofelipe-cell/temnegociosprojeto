import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import api from '../../api/client'
import {
  Palmtree, ChevronLeft, Save,
  Home, CalendarRange, Users, Percent,
  Moon, DollarSign, UserCheck, Info,
} from 'lucide-react'

const STATUS_LIST = [
  { value: 'reservada',  label: 'Reservada',  bg: 'bg-blue-700',  border: 'border-blue-700'  },
  { value: 'confirmada', label: 'Confirmada', bg: 'bg-green-700', border: 'border-green-700' },
  { value: 'finalizada', label: 'Finalizada', bg: 'bg-gray-500',  border: 'border-gray-500'  },
  { value: 'cancelada',  label: 'Cancelada',  bg: 'bg-red-600',   border: 'border-red-600'   },
]

const VAZIO = {
  imovel_id: '', cliente_id: '', corretor_id: '', corretor_captador_id: '',
  data_inicio: '', data_fim: '', valor_diaria: '',
  taxa_anfitriao_percentual: '10',
  status: 'reservada',
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
      <div className="[&>input]:pl-9 [&>select]:pl-9">{children}</div>
    </div>
  )
}

export default function TemporadaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState(VAZIO)
  const [imoveis, setImoveis]     = useState([])
  const [clientes, setClientes]   = useState([])
  const [corretores, setCorretores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  const editando = !!id

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [imovRes, cliRes, corRes] = await Promise.all([
          api.get('/imoveis'),
          api.get('/clientes', { params: { tabela: 'comprador' } }),
          api.get('/corretores'),
        ])
        setImoveis(imovRes.data)
        setClientes(cliRes.data)
        setCorretores(corRes.data)

        if (id) {
          const { data: t } = await api.get(`/temporadas/${id}`)
          setForm({
            imovel_id:                String(t.imovel_id   ?? ''),
            cliente_id:               String(t.cliente_id  ?? ''),
            corretor_id:              String(t.corretor_id ?? ''),
            corretor_captador_id:     String(t.corretor_captador_id ?? ''),
            data_inicio:              t.data_inicio?.split('T')[0] ?? '',
            data_fim:                 t.data_fim?.split('T')[0]    ?? '',
            valor_diaria:             String(t.valor_diaria ?? ''),
            taxa_anfitriao_percentual: String(t.taxa_anfitriao_percentual ?? '10'),
            status:                   t.status ?? 'reservada',
          })
        }
      } catch (e) { setErro('Erro ao carregar dados.') }
      finally     { setCarregando(false) }
    }
    carregarDados()
  }, [id])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  // Cálculos automáticos
  const noites = useMemo(() => {
    if (!form.data_inicio || !form.data_fim) return 0
    const diff = Math.ceil((new Date(form.data_fim) - new Date(form.data_inicio)) / 86400000)
    return diff > 0 ? diff : 0
  }, [form.data_inicio, form.data_fim])

  const valorTotal = useMemo(() =>
    parseFloat(((parseFloat(form.valor_diaria) || 0) * noites).toFixed(2)),
    [form.valor_diaria, noites]
  )

  const taxa = useMemo(() =>
    parseFloat((valorTotal * (parseFloat(form.taxa_anfitriao_percentual) || 0) / 100).toFixed(2)),
    [valorTotal, form.taxa_anfitriao_percentual]
  )

  const percTaxa = parseFloat(form.taxa_anfitriao_percentual) || 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (noites <= 0) return setErro('Data de saída deve ser após a data de entrada.')
    setSalvando(true); setErro('')
    try {
      if (editando) {
        await api.put(`/temporadas/${id}`, form)
        toast('Temporada atualizada!', 'success')
      } else {
        await api.post('/temporadas', form)
        toast('Reserva criada com sucesso!', 'success')
        navigate('/temporadas')
      }
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <div className="space-y-4 max-w-2xl">
      {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/temporadas"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0">
            <ChevronLeft size={16} className="text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30 shrink-0">
            <Palmtree size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {editando ? 'Editar reserva' : 'Nova reserva de temporada'}
            </h1>
            {editando && form.imovel_id && (
              <p className="text-xs text-gray-400">
                {imoveis.find(i => String(i.id) === form.imovel_id)?.titulo}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Imóvel e período */}
          <SectionCard icon={Home} title="Imóvel e período" accent="#2563eb">
            <Field label="Imóvel *">
              <InputIcon icon={Home} accent="#2563eb">
                <select value={form.imovel_id} onChange={e => set('imovel_id', e.target.value)} required className="input">
                  <option value="">Selecione o imóvel</option>
                  {imoveis.map(i => (
                    <option key={i.id} value={i.id}>{i.titulo}{i.cidade ? ` — ${i.cidade}` : ''}</option>
                  ))}
                </select>
              </InputIcon>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Check-in *">
                <InputIcon icon={CalendarRange} accent="#2563eb">
                  <input type="date" value={form.data_inicio}
                    onChange={e => set('data_inicio', e.target.value)}
                    required className="input" />
                </InputIcon>
              </Field>
              <Field label="Check-out *">
                <InputIcon icon={CalendarRange} accent="#2563eb">
                  <input type="date" value={form.data_fim}
                    onChange={e => set('data_fim', e.target.value)}
                    required min={form.data_inicio || undefined} className="input" />
                </InputIcon>
              </Field>
            </div>

            {noites > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700">
                <Moon size={14} className="shrink-0" />
                <span><strong>{noites}</strong> noite(s) · {form.data_inicio && new Date(form.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')} → {form.data_fim && new Date(form.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
            )}

            <Field label="Valor da diária (R$) *">
              <InputIcon icon={DollarSign} accent="#2563eb">
                <input type="number" step="0.01" min="0"
                  value={form.valor_diaria}
                  onChange={e => set('valor_diaria', e.target.value)}
                  required placeholder="0,00" className="input" />
              </InputIcon>
            </Field>

            {valorTotal > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{noites} noite(s) × {`R$ ${(parseFloat(form.valor_diaria)||0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                  <span className="font-bold text-blue-800 text-base">{`R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                </div>
              </div>
            )}
          </SectionCard>

          {/* 2. Hóspede e responsável */}
          <SectionCard icon={Users} title="Hóspede e responsável" accent="#0891b2">
            <Field label="Hóspede (cliente)">
              <InputIcon icon={Users} accent="#0891b2">
                <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)} className="input">
                  <option value="">Selecione o hóspede</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </InputIcon>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Corretor responsável">
                <InputIcon icon={UserCheck} accent="#0891b2">
                  <select value={form.corretor_id} onChange={e => set('corretor_id', e.target.value)} className="input">
                    <option value="">Sem corretor</option>
                    {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </InputIcon>
              </Field>
              <Field label="Corretor captador">
                <InputIcon icon={UserCheck} accent="#0891b2">
                  <select value={form.corretor_captador_id} onChange={e => set('corretor_captador_id', e.target.value)} className="input">
                    <option value="">Sem captador</option>
                    {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </InputIcon>
              </Field>
            </div>
          </SectionCard>

          {/* 3. Taxa do anfitrião */}
          <SectionCard icon={Percent} title="Taxa do anfitrião" accent="#059669">
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 -mt-1">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Taxa cobrada sobre o valor total da hospedagem. A comissão é gerada automaticamente e dividida entre franquia e matriz.
              </span>
            </div>

            <Field label="Percentual da taxa (%)">
              <InputIcon icon={Percent} accent="#059669">
                <input type="number" step="0.01" min="0" max="100"
                  value={form.taxa_anfitriao_percentual}
                  onChange={e => set('taxa_anfitriao_percentual', e.target.value)}
                  className="input" />
              </InputIcon>
            </Field>

            {valorTotal > 0 && percTaxa > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor total da hospedagem</span>
                  <span className="font-semibold text-gray-700">{`R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taxa do anfitrião ({percTaxa}%)</span>
                  <span className="font-bold text-emerald-700">{`R$ ${taxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Franquia (50%)</span>
                    <span>{`R$ ${(taxa * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Matriz (50%)</span>
                    <span>{`R$ ${(taxa * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* 4. Status (apenas edição) */}
          {editando && (
            <SectionCard icon={Palmtree} title="Status da reserva" accent="#7c3aed">
              <div className="flex flex-wrap gap-2">
                {STATUS_LIST.map(s => {
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

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>
          )}

          <div className="flex gap-3 pt-1 pb-4">
            <button type="submit" disabled={salvando || noites <= 0} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar reserva'}
            </button>
            <Link to="/temporadas" className="btn-ghost">Cancelar</Link>
          </div>

        </form>
      </div>
  )
}
