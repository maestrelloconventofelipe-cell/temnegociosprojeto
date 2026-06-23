import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import {
  Wallet, Tag, DollarSign, AlignLeft, CalendarDays,
  Link2, ScrollText, TrendingUp, TrendingDown, ChevronLeft, Save,
} from 'lucide-react'

const STATUS_LIST   = ['pendente','pago','atrasado','cancelado']
const STATUS_LABELS = { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado' }

const CATS_RECEITA = ['Aluguel','Comissão de venda','Comissão de locação','Taxa de administração','Outros']
const CATS_DESPESA = ['Salário','Aluguel do escritório','Marketing','Manutenção','Impostos','Materiais','Outros']

const INICIAL = {
  tipo: 'receita', categoria: '', descricao: '', valor: '',
  data_vencimento: '', data_pagamento: '', status: 'pendente', contrato_id: '',
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

export default function FinanceiroForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(INICIAL)
  const [contratos, setContratos] = useState([])
  const [carregando, setCarregando] = useState(isEdit)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    api.get('/contratos').then(r => setContratos(r.data)).catch(() => {})
    if (isEdit) {
      api.get(`/financeiro/${id}`)
        .then(r => {
          const d = r.data
          setForm({
            tipo: d.tipo || 'receita', categoria: d.categoria || '', descricao: d.descricao || '',
            valor: d.valor || '', data_vencimento: d.data_vencimento?.slice(0,10) || '',
            data_pagamento: d.data_pagamento?.slice(0,10) || '', status: d.status || 'pendente',
            contrato_id: d.contrato_id || '',
          })
        })
        .catch(() => setErro('Lançamento não encontrado.'))
        .finally(() => setCarregando(false))
    }
  }, [])

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  const categorias = form.tipo === 'receita' ? CATS_RECEITA : CATS_DESPESA

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      const payload = {
        ...form,
        valor: Number(form.valor),
        contrato_id: form.contrato_id ? Number(form.contrato_id) : null,
      }
      if (isEdit) await api.put(`/financeiro/${id}`, payload)
      else        await api.post('/financeiro', payload)
      toast('Lançamento salvo com sucesso!', 'success')
      navigate('/financeiro')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar lançamento.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-xl">
        {[1,2].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  const isReceita = form.tipo === 'receita'
  const accentTipo = isReceita ? '#059669' : '#dc2626'

  return (
    <AppLayout>
      <div className="max-w-xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/financeiro')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar lançamento' : 'Novo lançamento'}</h1>
              <p className="text-xs text-gray-400">Receita ou despesa financeira</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Tipo e valores */}
          <SectionCard
            icon={isReceita ? TrendingUp : TrendingDown}
            title="Lançamento financeiro"
            accent={accentTipo}
          >
            {/* Toggle tipo */}
            <div>
              <label className="label">Tipo *</label>
              <div className="flex gap-3">
                {['receita','despesa'].map(t => (
                  <button key={t} type="button"
                    onClick={() => { set('tipo', t); set('categoria', '') }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                      form.tipo === t
                        ? t === 'receita'
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {t === 'receita'
                      ? <><TrendingUp size={15} /> Receita</>
                      : <><TrendingDown size={15} /> Despesa</>
                    }
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Categoria</label>
                <InputIcon icon={Tag} accent={accentTipo}>
                  <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input">
                    <option value="">Selecione...</option>
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </InputIcon>
              </div>
              <div>
                <label className="label">Valor (R$) *</label>
                <InputIcon icon={DollarSign} accent={accentTipo}>
                  <input type="number" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)}
                    required placeholder="0,00" className="input" />
                </InputIcon>
              </div>
            </div>

            <div>
              <label className="label">Descrição</label>
              <InputIcon icon={AlignLeft} accent={accentTipo}>
                <input value={form.descricao} onChange={e => set('descricao', e.target.value)}
                  placeholder="Ex: Aluguel imóvel Rua das Flores" className="input" />
              </InputIcon>
            </div>
          </SectionCard>

          {/* Datas e status */}
          <SectionCard icon={CalendarDays} title="Datas e controle" accent="#0891b2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data de vencimento</label>
                <InputIcon icon={CalendarDays} accent="#0891b2">
                  <input type="date" value={form.data_vencimento} onChange={e => set('data_vencimento', e.target.value)} className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Data de pagamento</label>
                <InputIcon icon={CalendarDays} accent="#0891b2">
                  <input type="date" value={form.data_pagamento} onChange={e => set('data_pagamento', e.target.value)} className="input" />
                </InputIcon>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Contrato vinculado</label>
                <InputIcon icon={ScrollText} accent="#0891b2">
                  <select value={form.contrato_id} onChange={e => set('contrato_id', e.target.value)} className="input">
                    <option value="">Nenhum</option>
                    {contratos.map(c => <option key={c.id} value={c.id}>#{c.id} — {c.imovel_titulo}</option>)}
                  </select>
                </InputIcon>
              </div>
            </div>
          </SectionCard>

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Registrar lançamento'}
            </button>
            <button type="button" onClick={() => navigate('/financeiro')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
