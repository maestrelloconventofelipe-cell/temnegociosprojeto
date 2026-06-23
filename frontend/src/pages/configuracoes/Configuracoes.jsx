import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { maskCNPJ, maskCEP, maskCPF, maskTelefone } from '../../utils/masks'
import {
  Building2, Hash, MapPin, Mail, Phone, Award, Percent,
  Info, ShieldAlert, Save, Globe, User2, Landmark,
  CreditCard, QrCode, Briefcase, IdCard, BadgeCheck,
} from 'lucide-react'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const TIPOS_CHAVE_PIX = [
  { value: 'cpf',       label: 'CPF' },
  { value: 'cnpj',      label: 'CNPJ' },
  { value: 'email',     label: 'E-mail' },
  { value: 'telefone',  label: 'Telefone' },
  { value: 'aleatoria', label: 'Chave aleatória' },
]

const VAZIO = {
  nome_fantasia: '', razao_social: '', cnpj: '',
  endereco: '', numero: '', complemento: '', bairro: '', cep: '', cidade: '', estado: '',
  responsavel_nome: '', responsavel_cpf: '', responsavel_rg: '', responsavel_cargo: '',
  responsavel_email: '', responsavel_telefone: '',
  telefone: '', email: '', creci: '', logo: '',
  comissao_venda_imob: '', comissao_venda_corretor: '',
  comissao_aluguel_imob: '', comissao_aluguel_corretor: '',
  nome_banco: '', tipo_conta: '', agencia: '', conta: '',
  nome_beneficiario: '', tipo_chave_pix: '', chave_pix: '',
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
  return (
    <div>
      <label className="label">{label}</label>
      {children}
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

export default function Configuracoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState(VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)

  const podeEditar  = ['administrador_matriz','diretor_regional'].includes(user?.role)
  const isSuperAdmin = user?.role === 'administrador_matriz'

  useEffect(() => {
    api.get('/configuracoes')
      .then(r => {
        const d   = r.data
        const cfg = d.config ?? {}
        setForm({
          nome_fantasia:           d.nome_fantasia           ?? '',
          razao_social:            d.razao_social            ?? '',
          cnpj:                    d.cnpj                    ?? '',
          endereco:                d.endereco                ?? '',
          numero:                  d.numero                  ?? '',
          complemento:             d.complemento             ?? '',
          bairro:                  d.bairro                  ?? '',
          cep:                     d.cep                     ?? '',
          cidade:                  d.cidade                  ?? '',
          estado:                  d.estado                  ?? '',
          responsavel_nome:        d.responsavel_nome        ?? '',
          responsavel_cpf:         d.responsavel_cpf         ?? '',
          responsavel_rg:          d.responsavel_rg          ?? '',
          responsavel_cargo:       d.responsavel_cargo       ?? '',
          responsavel_email:       d.responsavel_email       ?? '',
          responsavel_telefone:    d.responsavel_telefone    ?? '',
          telefone:                cfg.telefone              ?? '',
          email:                   cfg.email                 ?? '',
          creci:                   cfg.creci                 ?? '',
          logo:                    d.logo                    ?? '',
          comissao_venda_imob:     cfg.comissao_venda_imob   ?? '',
          comissao_venda_corretor: cfg.comissao_venda_corretor ?? '',
          comissao_aluguel_imob:   cfg.comissao_aluguel_imob ?? '',
          comissao_aluguel_corretor: cfg.comissao_aluguel_corretor ?? '',
          nome_banco:              cfg.nome_banco            ?? '',
          tipo_conta:              cfg.tipo_conta            ?? '',
          agencia:                 cfg.agencia               ?? '',
          conta:                   cfg.conta                 ?? '',
          nome_beneficiario:       cfg.nome_beneficiario     ?? '',
          tipo_chave_pix:          cfg.tipo_chave_pix        ?? '',
          chave_pix:               cfg.chave_pix             ?? '',
        })
      })
      .catch(() => setErro('Erro ao carregar configurações.'))
      .finally(() => setCarregando(false))
  }, [])

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function buscarCep(valor) {
    const c = valor.replace(/\D/g, '')
    if (c.length !== 8) return
    setBuscandoCep(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const d = await r.json()
      if (!d.erro) setForm(p => ({ ...p, endereco: d.logradouro || p.endereco, bairro: d.bairro || p.bairro, cidade: d.localidade || p.cidade, estado: d.uf || p.estado }))
    } catch {}
    finally { setBuscandoCep(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      await api.put('/configuracoes', form)
      toast('Configurações salvas com sucesso!', 'success')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-2xl">
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  const dis = 'input disabled:bg-gray-50 disabled:text-gray-400 disabled:shadow-none disabled:cursor-default'

  const pctVendaCorretor = Number(form.comissao_venda_corretor) || 0
  const pctVendaImob     = Number(form.comissao_venda_imob)     || 0

  return (
    <AppLayout>
      <div className="max-w-2xl">

        {/* Cabeçalho */}
        <div className="flex items-start gap-4 mb-6 animate-fade-up">
          <div className="w-11 h-11 rounded-xl bg-blue-800 flex items-center justify-center shrink-0 shadow-md shadow-blue-800/30">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Configurações da franquia</h1>
            <p className="text-xs text-gray-400 mt-0.5">{user?.tenant_nome}</p>
          </div>
        </div>

        {!podeEditar && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5 animate-fade-up">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>Visualização somente. Apenas Diretor Regional e Adm. Matriz podem editar.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 1. Dados da franquia */}
          <SectionCard icon={Building2} title="Dados da franquia" accent="#2563eb">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da franquia *">
                <InputIcon icon={Building2} accent="#2563eb">
                  <input value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)}
                    required disabled={!podeEditar} placeholder="Ex: Unidade Centro" className={dis} />
                </InputIcon>
              </Field>
              <Field label="Razão social">
                <input value={form.razao_social} onChange={e => set('razao_social', e.target.value)}
                  disabled={!podeEditar} placeholder="Nome Imóveis LTDA" className={dis} />
              </Field>
            </div>

            <Field label="CNPJ">
              <InputIcon icon={Hash} accent="#2563eb">
                <input value={form.cnpj} onChange={e => set('cnpj', maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0001-00" disabled={!podeEditar} className={dis} />
              </InputIcon>
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label={<span className="flex items-center gap-2">CEP {buscandoCep && <span className="text-xs text-blue-400 font-normal animate-pulse">buscando…</span>}</span>}>
                <input value={form.cep}
                  onChange={e => { const v = maskCEP(e.target.value); set('cep', v); if (podeEditar) buscarCep(v) }}
                  placeholder="00000-000" disabled={!podeEditar} className={dis} />
              </Field>
              <Field label="Cidade">
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                  disabled={!podeEditar} className={dis} />
              </Field>
              <Field label="Estado">
                <select value={form.estado} onChange={e => set('estado', e.target.value)}
                  disabled={!podeEditar} className={dis}>
                  <option value="">—</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Endereço">
              <InputIcon icon={MapPin} accent="#2563eb">
                <input value={form.endereco} onChange={e => set('endereco', e.target.value)}
                  placeholder="Rua, avenida..." disabled={!podeEditar} className={dis} />
              </InputIcon>
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Número">
                <input value={form.numero} onChange={e => set('numero', e.target.value)}
                  placeholder="123" disabled={!podeEditar} className={dis} />
              </Field>
              <Field label="Complemento">
                <input value={form.complemento} onChange={e => set('complemento', e.target.value)}
                  placeholder="Sala 2" disabled={!podeEditar} className={dis} />
              </Field>
              <Field label="Bairro">
                <input value={form.bairro} onChange={e => set('bairro', e.target.value)}
                  disabled={!podeEditar} className={dis} />
              </Field>
            </div>
          </SectionCard>

          {/* 2. Responsável legal */}
          <SectionCard icon={User2} title="Responsável legal" accent="#ea580c">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do responsável">
                <InputIcon icon={User2} accent="#ea580c">
                  <input value={form.responsavel_nome} onChange={e => set('responsavel_nome', e.target.value)}
                    disabled={!podeEditar} placeholder="Nome completo" className={dis} />
                </InputIcon>
              </Field>
              <Field label="Cargo">
                <InputIcon icon={Briefcase} accent="#ea580c">
                  <input value={form.responsavel_cargo} onChange={e => set('responsavel_cargo', e.target.value)}
                    disabled={!podeEditar} placeholder="Sócio-Diretor" className={dis} />
                </InputIcon>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CPF">
                <InputIcon icon={IdCard} accent="#ea580c">
                  <input value={form.responsavel_cpf}
                    onChange={e => set('responsavel_cpf', maskCPF(e.target.value))}
                    disabled={!podeEditar} placeholder="000.000.000-00" className={dis} />
                </InputIcon>
              </Field>
              <Field label="RG">
                <InputIcon icon={BadgeCheck} accent="#ea580c">
                  <input value={form.responsavel_rg} onChange={e => set('responsavel_rg', e.target.value)}
                    disabled={!podeEditar} placeholder="00.000.000-0" className={dis} />
                </InputIcon>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail do responsável">
                <InputIcon icon={Mail} accent="#ea580c">
                  <input type="email" value={form.responsavel_email}
                    onChange={e => set('responsavel_email', e.target.value)}
                    disabled={!podeEditar} placeholder="responsavel@email.com" className={dis} />
                </InputIcon>
              </Field>
              <Field label="Telefone do responsável">
                <InputIcon icon={Phone} accent="#ea580c">
                  <input value={form.responsavel_telefone}
                    onChange={e => set('responsavel_telefone', maskTelefone(e.target.value))}
                    disabled={!podeEditar} placeholder="(14) 99999-0000" className={dis} />
                </InputIcon>
              </Field>
            </div>
          </SectionCard>

          {/* 3. Contato e identidade */}
          <SectionCard icon={Phone} title="Contato e identidade" accent="#0891b2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone da franquia">
                <InputIcon icon={Phone} accent="#0891b2">
                  <input value={form.telefone} onChange={e => set('telefone', maskTelefone(e.target.value))}
                    placeholder="(14) 99999-0000" disabled={!podeEditar} className={dis} />
                </InputIcon>
              </Field>
              <Field label="E-mail institucional">
                <InputIcon icon={Mail} accent="#0891b2">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="unidade@temneg.com" disabled={!podeEditar} className={dis} />
                </InputIcon>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CRECI">
                <InputIcon icon={Award} accent="#0891b2">
                  <input value={form.creci} onChange={e => set('creci', e.target.value)}
                    placeholder="CRECI-SP 12345-J" disabled={!podeEditar} className={dis} />
                </InputIcon>
              </Field>
              <Field label="Logo (arquivo)">
                <InputIcon icon={Globe} accent="#0891b2">
                  <input value={form.logo} onChange={e => set('logo', e.target.value)}
                    placeholder="logo.png" disabled={!podeEditar} className={dis} />
                </InputIcon>
              </Field>
            </div>
          </SectionCard>

          {/* 4. Comissões */}
          <SectionCard icon={Percent} title="Comissões padrão" accent="#059669">
            <p className="text-xs text-gray-400 -mt-1 flex items-center gap-1.5">
              <Info size={12} />
              Percentuais sugeridos ao registrar novas comissões. Ajustáveis por lançamento.
            </p>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Venda</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Franquia (%)">
                  <InputIcon icon={Percent} accent="#059669">
                    <input type="number" step="0.01" min="0" max="100"
                      value={form.comissao_venda_imob}
                      onChange={e => set('comissao_venda_imob', e.target.value)}
                      placeholder="Ex: 3" disabled={!podeEditar} className={dis} />
                  </InputIcon>
                </Field>
                <Field label="Corretor (%)">
                  <InputIcon icon={Percent} accent="#059669">
                    <input type="number" step="0.01" min="0" max="100"
                      value={form.comissao_venda_corretor}
                      onChange={e => set('comissao_venda_corretor', e.target.value)}
                      placeholder="Ex: 3" disabled={!podeEditar} className={dis} />
                  </InputIcon>
                </Field>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Locação</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Franquia (%)">
                  <InputIcon icon={Percent} accent="#059669">
                    <input type="number" step="0.01" min="0" max="100"
                      value={form.comissao_aluguel_imob}
                      onChange={e => set('comissao_aluguel_imob', e.target.value)}
                      placeholder="Ex: 5" disabled={!podeEditar} className={dis} />
                  </InputIcon>
                </Field>
                <Field label="Corretor (%)">
                  <InputIcon icon={Percent} accent="#059669">
                    <input type="number" step="0.01" min="0" max="100"
                      value={form.comissao_aluguel_corretor}
                      onChange={e => set('comissao_aluguel_corretor', e.target.value)}
                      placeholder="Ex: 5" disabled={!podeEditar} className={dis} />
                  </InputIcon>
                </Field>
              </div>
            </div>

            {(pctVendaCorretor > 0 || pctVendaImob > 0) && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  Venda de <strong>R$ 200.000</strong>: corretor{' '}
                  <strong>R$ {(200000 * pctVendaCorretor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>{' '}
                  · franquia{' '}
                  <strong>R$ {(200000 * pctVendaImob / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
            )}
          </SectionCard>

          {/* 5. Dados bancários — somente administrador_matriz */}
          {isSuperAdmin && (
            <SectionCard icon={Landmark} title="Dados bancários e PIX" accent="#4f46e5">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Banco">
                  <InputIcon icon={Landmark} accent="#4f46e5">
                    <input value={form.nome_banco} onChange={e => set('nome_banco', e.target.value)}
                      placeholder="Ex: Bradesco" className="input" />
                  </InputIcon>
                </Field>
                <Field label="Tipo de conta">
                  <select value={form.tipo_conta} onChange={e => set('tipo_conta', e.target.value)} className="input">
                    <option value="">—</option>
                    <option value="corrente">Corrente</option>
                    <option value="poupanca">Poupança</option>
                  </select>
                </Field>
                <Field label="Beneficiário">
                  <InputIcon icon={User2} accent="#4f46e5">
                    <input value={form.nome_beneficiario} onChange={e => set('nome_beneficiario', e.target.value)}
                      placeholder="Nome completo ou razão social" className="input" />
                  </InputIcon>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Agência">
                  <InputIcon icon={CreditCard} accent="#4f46e5">
                    <input value={form.agencia} onChange={e => set('agencia', e.target.value)}
                      placeholder="0000" className="input" />
                  </InputIcon>
                </Field>
                <Field label="Conta">
                  <InputIcon icon={CreditCard} accent="#4f46e5">
                    <input value={form.conta} onChange={e => set('conta', e.target.value)}
                      placeholder="00000-0" className="input" />
                  </InputIcon>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de chave PIX">
                  <InputIcon icon={QrCode} accent="#4f46e5">
                    <select value={form.tipo_chave_pix} onChange={e => set('tipo_chave_pix', e.target.value)} className="input pl-9">
                      <option value="">Selecione</option>
                      {TIPOS_CHAVE_PIX.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </InputIcon>
                </Field>
                <Field label="Chave PIX">
                  <InputIcon icon={QrCode} accent="#4f46e5">
                    <input value={form.chave_pix} onChange={e => set('chave_pix', e.target.value)}
                      placeholder="CPF, CNPJ, e-mail ou chave" className="input" />
                  </InputIcon>
                </Field>
              </div>
            </SectionCard>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>
          )}

          {podeEditar && (
            <div className="flex gap-3 pt-1 pb-4">
              <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
                <Save size={15} />
                {salvando ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          )}

        </form>
      </div>
    </AppLayout>
  )
}
