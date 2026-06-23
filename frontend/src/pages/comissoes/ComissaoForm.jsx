import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import {
  BadgeDollarSign, ScrollText, UserCog, DollarSign,
  Percent, TrendingUp, ChevronLeft, Save,
} from 'lucide-react'

function moeda(v) { return v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '' }

const INICIAL = { contrato_id: '', corretor_id: '', valor_total: '', percentual: '' }

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

export default function ComissaoForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(INICIAL)
  const [contratos, setContratos] = useState([])
  const [corretores, setCorretores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  const percentual    = Number(form.percentual) || 0
  const valorTotal    = Number(form.valor_total) || 0
  const valorCorretor = parseFloat((valorTotal * percentual / 100).toFixed(2))
  const valorFranquia  = parseFloat((valorTotal - valorCorretor).toFixed(2))

  useEffect(() => {
    Promise.all([
      api.get('/contratos'),
      api.get('/corretores'),
      isEdit ? api.get(`/comissoes/${id}`) : Promise.resolve(null),
    ]).then(([ct, cr, cm]) => {
      setContratos(ct.data)
      setCorretores(cr.data)
      if (cm) {
        const d = cm.data
        setForm({
          contrato_id: d.contrato_id || '', corretor_id: d.corretor_id || '',
          valor_total: d.valor_total || '', percentual: d.percentual || '',
        })
      }
    }).catch(() => setErro('Erro ao carregar dados.'))
    .finally(() => setCarregando(false))
  }, [])

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setErro(''); setSalvando(true)
    try {
      const payload = {
        contrato_id: Number(form.contrato_id),
        corretor_id: Number(form.corretor_id),
        valor_total: valorTotal,
        percentual:  percentual,
      }
      if (isEdit) await api.put(`/comissoes/${id}`, payload)
      else        await api.post('/comissoes', payload)
      toast('Comissão salva com sucesso!', 'success')
      navigate('/comissoes')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar comissão.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-lg">
        {[1,2].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-lg">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/comissoes')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <BadgeDollarSign size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar comissão' : 'Nova comissão'}</h1>
              <p className="text-xs text-gray-400">Registro de comissão por negócio fechado</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Vínculos */}
          <SectionCard icon={ScrollText} title="Contrato e corretor" accent="#2563eb">
            <div>
              <label className="label">Contrato *</label>
              <InputIcon icon={ScrollText} accent="#2563eb">
                <select value={form.contrato_id} onChange={e => set('contrato_id', e.target.value)} required className="input">
                  <option value="">Selecione...</option>
                  {contratos.map(c => (
                    <option key={c.id} value={c.id}>#{c.id} — {c.imovel_titulo} ({c.tipo})</option>
                  ))}
                </select>
              </InputIcon>
            </div>
            <div>
              <label className="label">Corretor *</label>
              <InputIcon icon={UserCog} accent="#2563eb">
                <select value={form.corretor_id} onChange={e => set('corretor_id', e.target.value)} required className="input">
                  <option value="">Selecione...</option>
                  {corretores.map(c => <option key={c.user_id} value={c.user_id}>{c.nome}</option>)}
                </select>
              </InputIcon>
            </div>
          </SectionCard>

          {/* Valores */}
          <SectionCard icon={DollarSign} title="Valores" accent="#059669">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valor total do negócio (R$) *</label>
                <InputIcon icon={DollarSign} accent="#059669">
                  <input type="number" step="0.01" value={form.valor_total}
                    onChange={e => set('valor_total', e.target.value)}
                    required placeholder="0,00" className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Percentual de comissão (%) *</label>
                <InputIcon icon={Percent} accent="#059669">
                  <input type="number" step="0.01" min="0" max="100" value={form.percentual}
                    onChange={e => set('percentual', e.target.value)}
                    required placeholder="Ex: 6" className="input" />
                </InputIcon>
              </div>
            </div>

            {/* Preview do cálculo */}
            {valorTotal > 0 && percentual > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Cálculo automático</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor total do negócio</span>
                  <span className="font-medium text-gray-700">{moeda(valorTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Comissão total ({percentual}%)</span>
                  <span className="font-medium text-gray-700">{moeda(valorTotal * percentual / 100)}</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 mt-1 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 font-medium">Corretor recebe</span>
                    <span className="font-bold text-green-700">{moeda(valorCorretor)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700 font-medium">Franquia recebe</span>
                    <span className="font-bold text-blue-700">{moeda(valorFranquia)}</span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Registrar comissão'}
            </button>
            <button type="button" onClick={() => navigate('/comissoes')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
