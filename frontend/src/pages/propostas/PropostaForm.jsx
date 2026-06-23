import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import {
  FileText, Building2, Users, DollarSign, AlignLeft,
  UserCog, AlertTriangle, ChevronLeft, Save,
} from 'lucide-react'

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

export default function PropostaForm() {
  const [imoveis, setImoveis] = useState([])
  const [clientes, setClientes] = useState([])
  const [corretores, setCorretores] = useState([])
  const [form, setForm] = useState({
    imovel_id: '', cliente_id: '', tipo: 'compra', valor_proposto: '', observacoes: '', corretor_id: '',
  })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const podeAtribuirCorretor = ['administrador_matriz','diretor_regional','franqueado'].includes(user?.role)

  useEffect(() => {
    Promise.all([
      api.get('/imoveis', { params: { status: 'disponivel' } }),
      api.get('/clientes'),
      podeAtribuirCorretor ? api.get('/corretores') : Promise.resolve({ data: [] }),
    ])
      .then(([im, cl, cor]) => {
        setImoveis(im.data)
        setClientes(cl.data)
        setCorretores(cor.data)
      })
      .catch(() => setErro('Erro ao carregar dados.'))
      .finally(() => setCarregando(false))
  }, [])

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      await api.post('/propostas', {
        ...form,
        imovel_id:     Number(form.imovel_id),
        cliente_id:    Number(form.cliente_id),
        valor_proposto: form.valor_proposto ? Number(form.valor_proposto) : null,
        corretor_id:   form.corretor_id ? Number(form.corretor_id) : null,
      })
      toast('Proposta criada com sucesso!', 'success')
      navigate('/propostas')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao criar proposta.') }
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
          <button onClick={() => navigate('/propostas')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Nova proposta</h1>
              <p className="text-xs text-gray-400">Proposta de compra ou locação de imóvel</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Imóvel e cliente */}
          <SectionCard icon={Building2} title="Imóvel e cliente" accent="#2563eb">
            <div>
              <label className="label">Imóvel *</label>
              <InputIcon icon={Building2} accent="#2563eb">
                <select value={form.imovel_id} onChange={e => set('imovel_id', e.target.value)} required className="input">
                  <option value="">Selecione o imóvel...</option>
                  {imoveis.map(im => (
                    <option key={im.id} value={im.id}>
                      {im.titulo}{im.cidade ? ` — ${im.cidade}` : ''}{im.valor ? ` (R$ ${Number(im.valor).toLocaleString('pt-BR')})` : ''}
                    </option>
                  ))}
                </select>
              </InputIcon>
              {imoveis.length === 0 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-1.5">
                  <AlertTriangle size={12} /> Nenhum imóvel disponível. Cadastre um imóvel primeiro.
                </p>
              )}
            </div>

            <div>
              <label className="label">Cliente *</label>
              <InputIcon icon={Users} accent="#2563eb">
                <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)} required className="input">
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} — {c.tipo}</option>
                  ))}
                </select>
              </InputIcon>
              {clientes.length === 0 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-1.5">
                  <AlertTriangle size={12} /> Nenhum cliente cadastrado. Cadastre um cliente primeiro.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Negócio */}
          <SectionCard icon={DollarSign} title="Tipo e valor" accent="#059669">
            <div>
              <label className="label">Tipo de negócio *</label>
              <div className="flex gap-3">
                {['compra','locacao'].map(t => (
                  <button key={t} type="button" onClick={() => set('tipo', t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      form.tipo === t
                        ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {t === 'compra' ? 'Compra' : 'Locação'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Valor proposto (R$)</label>
              <InputIcon icon={DollarSign} accent="#059669">
                <input type="number" value={form.valor_proposto} onChange={e => set('valor_proposto', e.target.value)}
                  placeholder="Ex: 250000" className="input" />
              </InputIcon>
            </div>

            {podeAtribuirCorretor && corretores.length > 0 && (
              <div>
                <label className="label">Corretor responsável</label>
                <InputIcon icon={UserCog} accent="#059669">
                  <select value={form.corretor_id} onChange={e => set('corretor_id', e.target.value)} className="input">
                    <option value="">Sem corretor</option>
                    {corretores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </InputIcon>
              </div>
            )}
          </SectionCard>

          {/* Observações */}
          <SectionCard icon={AlignLeft} title="Observações" accent="#6b7280">
            <div>
              <label className="label">Condições especiais, prazo, etc.</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                rows={3} placeholder="Condições especiais, prazo, etc." className="input resize-none" />
            </div>
          </SectionCard>

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : 'Criar proposta'}
            </button>
            <button type="button" onClick={() => navigate('/propostas')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
