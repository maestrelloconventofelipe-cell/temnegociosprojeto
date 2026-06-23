import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import {
  ScrollText, Users, Building2, FileText, Link2,
  DollarSign, CalendarDays, AlignLeft, Globe, ChevronLeft, Save,
} from 'lucide-react'

const TIPOS  = ['compra_venda','locacao','intermediacao']
const STATUS = ['ativo','encerrado','cancelado','em_renovacao']
const TIPO_LABELS   = { compra_venda: 'Compra e venda', locacao: 'Locação', intermediacao: 'Intermediação' }
const STATUS_LABELS = { ativo: 'Ativo', encerrado: 'Encerrado', cancelado: 'Cancelado', em_renovacao: 'Em renovação' }

const INICIAL = {
  imovel_id: '', cliente_id: '', proposta_id: '', tipo: 'locacao',
  valor: '', data_inicio: '', data_fim: '', status: 'ativo',
  documento_url: '', observacoes: '',
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

export default function ContratoForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(INICIAL)
  const [imoveis, setImoveis] = useState([])
  const [clientes, setClientes] = useState([])
  const [propostas, setPropostas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      api.get('/imoveis'),
      api.get('/clientes'),
      api.get('/propostas', { params: { status: 'aprovada' } }),
      isEdit ? api.get(`/contratos/${id}`) : Promise.resolve(null),
    ]).then(([im, cl, pr, ct]) => {
      setImoveis(im.data)
      setClientes(cl.data)
      setPropostas(pr.data)
      if (ct) {
        const d = ct.data
        setForm({
          imovel_id: d.imovel_id || '', cliente_id: d.cliente_id || '',
          proposta_id: d.proposta_id || '', tipo: d.tipo || 'locacao',
          valor: d.valor || '', data_inicio: d.data_inicio?.slice(0,10) || '',
          data_fim: d.data_fim?.slice(0,10) || '', status: d.status || 'ativo',
          documento_url: d.documento_url || '', observacoes: d.observacoes || '',
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
        imovel_id:   Number(form.imovel_id),
        cliente_id:  Number(form.cliente_id),
        proposta_id: form.proposta_id ? Number(form.proposta_id) : null,
        valor:       form.valor ? Number(form.valor) : null,
      }
      if (isEdit) await api.put(`/contratos/${id}`, payload)
      else        await api.post('/contratos', payload)
      toast('Contrato salvo com sucesso!', 'success')
      navigate('/contratos')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar contrato.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl">
        {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/contratos')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <ScrollText size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar contrato' : 'Novo contrato'}</h1>
              <p className="text-xs text-gray-400">Partes, vigência e condições contratuais</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Partes */}
          <SectionCard icon={Users} title="Partes e tipo" accent="#2563eb">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Imóvel *</label>
                <InputIcon icon={Building2} accent="#2563eb">
                  <select value={form.imovel_id} onChange={e => set('imovel_id', e.target.value)} required className="input">
                    <option value="">Selecione...</option>
                    {imoveis.map(i => <option key={i.id} value={i.id}>{i.titulo}</option>)}
                  </select>
                </InputIcon>
              </div>
              <div>
                <label className="label">Cliente *</label>
                <InputIcon icon={Users} accent="#2563eb">
                  <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)} required className="input">
                    <option value="">Selecione...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </InputIcon>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo *</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="input">
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Proposta vinculada</label>
                <InputIcon icon={Link2} accent="#2563eb">
                  <select value={form.proposta_id} onChange={e => set('proposta_id', e.target.value)} className="input">
                    <option value="">Nenhuma</option>
                    {propostas.map(p => <option key={p.id} value={p.id}>#{p.id} — {p.imovel_titulo}</option>)}
                  </select>
                </InputIcon>
              </div>
            </div>
          </SectionCard>

          {/* Vigência e valor */}
          <SectionCard icon={CalendarDays} title="Vigência e valor" accent="#0891b2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Valor (R$)</label>
                <InputIcon icon={DollarSign} accent="#0891b2">
                  <input type="number" value={form.valor} onChange={e => set('valor', e.target.value)}
                    placeholder="0,00" className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Data início</label>
                <InputIcon icon={CalendarDays} accent="#0891b2">
                  <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" />
                </InputIcon>
              </div>
              <div>
                <label className="label">Data fim</label>
                <InputIcon icon={CalendarDays} accent="#0891b2">
                  <input type="date" value={form.data_fim} onChange={e => set('data_fim', e.target.value)} className="input" />
                </InputIcon>
              </div>
            </div>
            {isEdit && (
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  {STATUS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            )}
          </SectionCard>

          {/* Documentação */}
          <SectionCard icon={FileText} title="Documentação" accent="#7c3aed">
            <div>
              <label className="label">Link do documento</label>
              <InputIcon icon={Globe} accent="#7c3aed">
                <input value={form.documento_url} onChange={e => set('documento_url', e.target.value)}
                  placeholder="https://..." className="input" />
              </InputIcon>
            </div>
            <div>
              <label className="label">Observações</label>
              <InputIcon icon={AlignLeft} accent="#7c3aed">
                <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                  rows={3} className="input resize-none" />
              </InputIcon>
            </div>
          </SectionCard>

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar contrato'}
            </button>
            <button type="button" onClick={() => navigate('/contratos')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
