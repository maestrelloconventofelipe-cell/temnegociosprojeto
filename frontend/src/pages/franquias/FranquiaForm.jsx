import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { maskCNPJ, maskCEP, maskCPF, maskTelefone } from '../../utils/masks'
import { useBuscaCEP } from '../../hooks/useBuscaCEP'
import {
  Network, ChevronLeft, Save,
  Building2, MapPin, User2, FileText, Percent,
  Hash, Mail, Phone, Briefcase, IdCard, BadgeCheck,
  CalendarDays, DollarSign, Info,
} from 'lucide-react'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const TIPOS_FRANQUIA = [
  { value: 'unidade',     label: 'Unidade' },
  { value: 'master',      label: 'Master' },
  { value: 'regional',    label: 'Regional' },
  { value: 'loja_propria',label: 'Loja Própria' },
]
const STATUS_LIST = [
  { value: 'ativa',     label: 'Ativa' },
  { value: 'bloqueada', label: 'Bloqueada' },
  { value: 'suspensa',  label: 'Suspensa' },
  { value: 'cancelada', label: 'Cancelada' },
]

const VAZIO = {
  nome_fantasia: '', razao_social: '', cnpj: '', tipo_franquia: 'unidade', status: 'ativa', data_inicio: '',
  cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  responsavel_nome: '', responsavel_cpf: '', responsavel_rg: '', responsavel_cargo: '',
  responsavel_email: '', responsavel_telefone: '',
  valor_venda_franquia: '', data_venda_franquia: '', taxa_franquia: '',
  contrato_franquia_inicio: '', contrato_franquia_fim: '',
  percentual_royalty: '2', dia_vencimento_royalty: '10',
  observacoes: '',
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

export default function FranquiaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState(VAZIO)
  const [carregando, setCarregando] = useState(!!id)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const editando = !!id

  useEffect(() => {
    if (!id) return
    api.get(`/tenants/${id}`)
      .then(r => {
        const d = r.data
        setForm({
          nome_fantasia:          d.nome_fantasia           ?? '',
          razao_social:           d.razao_social            ?? '',
          cnpj:                   d.cnpj                    ?? '',
          tipo_franquia:          d.tipo_franquia           ?? 'unidade',
          status:                 d.status                  ?? 'ativa',
          data_inicio:            d.data_inicio?.split('T')[0] ?? '',
          cep:                    d.cep                     ?? '',
          endereco:               d.endereco                ?? '',
          numero:                 d.numero                  ?? '',
          complemento:            d.complemento             ?? '',
          bairro:                 d.bairro                  ?? '',
          cidade:                 d.cidade                  ?? '',
          estado:                 d.estado                  ?? '',
          responsavel_nome:       d.responsavel_nome        ?? '',
          responsavel_cpf:        d.responsavel_cpf         ?? '',
          responsavel_rg:         d.responsavel_rg          ?? '',
          responsavel_cargo:      d.responsavel_cargo       ?? '',
          responsavel_email:      d.responsavel_email       ?? '',
          responsavel_telefone:   d.responsavel_telefone    ?? '',
          valor_venda_franquia:   d.valor_venda_franquia    ?? '',
          data_venda_franquia:    d.data_venda_franquia?.split('T')[0] ?? '',
          taxa_franquia:          d.taxa_franquia            ?? '',
          contrato_franquia_inicio: d.contrato_franquia_inicio?.split('T')[0] ?? '',
          contrato_franquia_fim:    d.contrato_franquia_fim?.split('T')[0]    ?? '',
          percentual_royalty:     d.percentual_royalty      ?? '2',
          dia_vencimento_royalty: d.dia_vencimento_royalty  ?? '10',
          observacoes:            d.observacoes             ?? '',
        })
      })
      .catch(() => setErro('Erro ao carregar dados da franquia.'))
      .finally(() => setCarregando(false))
  }, [id])

  const { buscar: buscarCEP, buscando: buscandoCEP } = useBuscaCEP(({ logradouro, bairro: b, cidade, estado }) => {
    setForm(p => ({
      ...p,
      endereco: logradouro || p.endereco,
      bairro:   b         || p.bairro,
      cidade:   cidade    || p.cidade,
      estado:   estado    || p.estado,
    }))
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function handleCEP(valor) {
    const v = maskCEP(valor)
    set('cep', v)
    if (v.replace(/\D/g, '').length === 8) buscarCEP(v)
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      if (editando) {
        await api.put(`/tenants/${id}`, form)
        toast('Franquia atualizada com sucesso!', 'success')
      } else {
        await api.post('/tenants', form)
        toast('Franquia criada com sucesso!', 'success')
        navigate('/franquias')
      }
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/franquias"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shrink-0">
            <ChevronLeft size={16} className="text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30 shrink-0">
            <Network size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {editando ? 'Editar franquia' : 'Nova franquia'}
            </h1>
            {editando && <p className="text-xs text-gray-400">{form.nome_fantasia}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Dados da franquia */}
          <SectionCard icon={Building2} title="Dados da franquia" accent="#2563eb">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da franquia *">
                <InputIcon icon={Building2} accent="#2563eb">
                  <input value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)}
                    required placeholder="Ex: Unidade Centro" className="input" />
                </InputIcon>
              </Field>
              <Field label="Razão social">
                <input value={form.razao_social} onChange={e => set('razao_social', e.target.value)}
                  placeholder="Nome Imóveis LTDA" className="input" />
              </Field>
            </div>

            <Field label="CNPJ *">
              <InputIcon icon={Hash} accent="#2563eb">
                <input value={form.cnpj} onChange={e => set('cnpj', maskCNPJ(e.target.value))}
                  required placeholder="00.000.000/0001-00" className="input" />
              </InputIcon>
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Tipo">
                <select value={form.tipo_franquia} onChange={e => set('tipo_franquia', e.target.value)} className="input">
                  {TIPOS_FRANQUIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Data de início">
                <InputIcon icon={CalendarDays} accent="#2563eb">
                  <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} className="input" />
                </InputIcon>
              </Field>
            </div>
          </SectionCard>

          {/* 2. Endereço */}
          <SectionCard icon={MapPin} title="Endereço" accent="#0891b2">
            <Field label={<span className="flex items-center gap-2">CEP {buscandoCEP && <span className="text-xs text-blue-400 font-normal animate-pulse">buscando…</span>}</span>}>
              <InputIcon icon={MapPin} accent="#0891b2">
                <input value={form.cep} onChange={e => handleCEP(e.target.value)}
                  placeholder="00000-000" className={`input ${buscandoCEP ? 'opacity-60' : ''}`} />
              </InputIcon>
            </Field>
            <Field label="Endereço">
              <input value={form.endereco} onChange={e => set('endereco', e.target.value)}
                placeholder="Rua, avenida..." className="input" />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Número">
                <input value={form.numero} onChange={e => set('numero', e.target.value)}
                  placeholder="123" className="input" />
              </Field>
              <Field label="Complemento">
                <input value={form.complemento} onChange={e => set('complemento', e.target.value)}
                  placeholder="Sala 2" className="input" />
              </Field>
              <Field label="Bairro">
                <input value={form.bairro} onChange={e => set('bairro', e.target.value)} className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade *">
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)} required className="input" />
              </Field>
              <Field label="Estado *">
                <select value={form.estado} onChange={e => set('estado', e.target.value)} required className="input">
                  <option value="">Selecione</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </SectionCard>

          {/* 3. Responsável */}
          <SectionCard icon={User2} title="Responsável legal" accent="#ea580c">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do responsável">
                <InputIcon icon={User2} accent="#ea580c">
                  <input value={form.responsavel_nome} onChange={e => set('responsavel_nome', e.target.value)}
                    placeholder="Nome completo" className="input" />
                </InputIcon>
              </Field>
              <Field label="Cargo">
                <InputIcon icon={Briefcase} accent="#ea580c">
                  <input value={form.responsavel_cargo} onChange={e => set('responsavel_cargo', e.target.value)}
                    placeholder="Sócio-Diretor" className="input" />
                </InputIcon>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CPF">
                <InputIcon icon={IdCard} accent="#ea580c">
                  <input value={form.responsavel_cpf}
                    onChange={e => set('responsavel_cpf', maskCPF(e.target.value))}
                    placeholder="000.000.000-00" className="input" />
                </InputIcon>
              </Field>
              <Field label="RG">
                <InputIcon icon={BadgeCheck} accent="#ea580c">
                  <input value={form.responsavel_rg} onChange={e => set('responsavel_rg', e.target.value)}
                    placeholder="00.000.000-0" className="input" />
                </InputIcon>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail">
                <InputIcon icon={Mail} accent="#ea580c">
                  <input type="email" value={form.responsavel_email}
                    onChange={e => set('responsavel_email', e.target.value)}
                    placeholder="responsavel@email.com" className="input" />
                </InputIcon>
              </Field>
              <Field label="Telefone">
                <InputIcon icon={Phone} accent="#ea580c">
                  <input value={form.responsavel_telefone}
                    onChange={e => set('responsavel_telefone', maskTelefone(e.target.value))}
                    placeholder="(14) 99999-0000" className="input" />
                </InputIcon>
              </Field>
            </div>
          </SectionCard>

          {/* 4. Contrato */}
          <SectionCard icon={FileText} title="Contrato e valores" accent="#7c3aed">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor da franquia (R$)">
                <InputIcon icon={DollarSign} accent="#7c3aed">
                  <input type="number" step="0.01" min="0"
                    value={form.valor_venda_franquia}
                    onChange={e => set('valor_venda_franquia', e.target.value)}
                    placeholder="0,00" className="input" />
                </InputIcon>
              </Field>
              <Field label="Data da venda">
                <InputIcon icon={CalendarDays} accent="#7c3aed">
                  <input type="date" value={form.data_venda_franquia}
                    onChange={e => set('data_venda_franquia', e.target.value)} className="input" />
                </InputIcon>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Início do contrato">
                <InputIcon icon={CalendarDays} accent="#7c3aed">
                  <input type="date" value={form.contrato_franquia_inicio}
                    onChange={e => set('contrato_franquia_inicio', e.target.value)} className="input" />
                </InputIcon>
              </Field>
              <Field label="Fim do contrato">
                <InputIcon icon={CalendarDays} accent="#7c3aed">
                  <input type="date" value={form.contrato_franquia_fim}
                    onChange={e => set('contrato_franquia_fim', e.target.value)} className="input" />
                </InputIcon>
              </Field>
            </div>
            <Field label="Taxa mensal da franquia (R$)">
              <InputIcon icon={DollarSign} accent="#7c3aed">
                <input type="number" step="0.01" min="0"
                  value={form.taxa_franquia}
                  onChange={e => set('taxa_franquia', e.target.value)}
                  placeholder="Taxa fixa mensal, se houver" className="input" />
              </InputIcon>
            </Field>
            <Field label="Observações">
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                rows={3} placeholder="Notas sobre o contrato, condições especiais..."
                className="input resize-none" />
            </Field>
          </SectionCard>

          {/* 5. Royalties */}
          <SectionCard icon={Percent} title="Royalties" accent="#059669">
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 -mt-1">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>Royalties são gerados mensalmente pelo sistema com base no faturamento validado da franquia.</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Percentual de royalty (%)">
                <InputIcon icon={Percent} accent="#059669">
                  <input type="number" step="0.01" min="0" max="100"
                    value={form.percentual_royalty}
                    onChange={e => set('percentual_royalty', e.target.value)}
                    placeholder="2" className="input" />
                </InputIcon>
              </Field>
              <Field label="Dia de vencimento (1–28)">
                <input type="number" min="1" max="28"
                  value={form.dia_vencimento_royalty}
                  onChange={e => set('dia_vencimento_royalty', e.target.value)}
                  placeholder="10" className="input" />
              </Field>
            </div>
            {Number(form.percentual_royalty) > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  Sobre R$ 100.000 de faturamento, o royalty mensal será{' '}
                  <strong>R$ {(100000 * Number(form.percentual_royalty) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                </span>
              </div>
            )}
          </SectionCard>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>
          )}

          <div className="flex gap-3 pt-1 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar franquia'}
            </button>
            <Link to="/franquias" className="btn-ghost">Cancelar</Link>
          </div>

        </form>
      </div>
    </AppLayout>
  )
}
