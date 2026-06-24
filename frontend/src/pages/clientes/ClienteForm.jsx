import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import { maskCPF, maskCNPJ, maskTelefone, maskCEP } from '../../utils/masks'
import { useBuscaCEP } from '../../hooks/useBuscaCEP'
import {
  Users, User, MapPin, Mail, Phone, Hash,
  ChevronLeft, Save, Loader2,
} from 'lucide-react'

const TIPOS = ['proprietario','locatario','comprador']
const TIPO_LABELS = { proprietario: 'Proprietário', locatario: 'Locatário', comprador: 'Comprador' }

const INICIAL = {
  nome: '', cpf: '', email: '', telefone: '', tipo: 'comprador',
  cep: '', endereco: '', cidade: '', estado: '', observacoes: '', status: 'ativo',
}

function maskDocumento(v) {
  const raw = v.replace(/\D/g, '').slice(0, 14)
  if (raw.length <= 11) return maskCPF(raw)
  return maskCNPJ(raw)
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

export default function ClienteForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(INICIAL)
  const [carregando, setCarregando] = useState(isEdit)
  const [salvando, setSalvando] = useState(false)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  const { buscar: buscarCEP, buscando: buscandoCEP } = useBuscaCEP(({ logradouro, bairro, cidade, estado }) => {
    setForm(prev => ({
      ...prev,
      endereco: logradouro ? (bairro ? `${logradouro} - ${bairro}` : logradouro) : prev.endereco,
      cidade:   cidade || prev.cidade,
      estado:   estado || prev.estado,
    }))
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleCEP(valor) {
    const mascarado = maskCEP(valor)
    set('cep', mascarado)
    if (mascarado.replace(/\D/g, '').length === 8) buscarCEP(mascarado)
  }

  function handleDocumento(valor) {
    const mascarado = maskDocumento(valor)
    set('cpf', mascarado)
    const limpo = mascarado.replace(/\D/g, '')
    if (limpo.length === 14) buscarCNPJApi(limpo)
  }

  async function buscarCNPJApi(limpo) {
    setBuscandoCNPJ(true)
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`)
      if (!r.ok) return
      const d = await r.json()
      if (!d.razao_social) return

      setForm(prev => {
        const nome = prev.nome || d.nome_fantasia || d.razao_social
        const email = d.email ? d.email.toLowerCase() : prev.email
        const telefone = d.ddd_telefone_1
          ? maskTelefone(d.ddd_telefone_1.replace(/\D/g, ''))
          : prev.telefone
        return { ...prev, nome, email, telefone }
      })

      if (d.cep) {
        const cepLimpo = d.cep.replace(/\D/g, '')
        set('cep', maskCEP(cepLimpo))
        buscarCEP(maskCEP(cepLimpo))
      }

      toast('Dados da empresa preenchidos automaticamente.', 'success')
    } catch {}
    finally { setBuscandoCNPJ(false) }
  }

  useEffect(() => {
    if (isEdit) {
      api.get(`/clientes/${id}`)
        .then(r => {
          const d = r.data
          setForm({
            nome: d.nome || '', cpf: d.cpf || '', email: d.email || '',
            telefone: d.telefone || '', tipo: d.tipo || 'comprador',
            cep: '', endereco: d.endereco || '', cidade: d.cidade || '',
            estado: d.estado || '', observacoes: d.observacoes || '', status: d.status || 'ativo',
          })
        })
        .catch(() => setErro('Cliente não encontrado.'))
        .finally(() => setCarregando(false))
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      // cep is UI-only for auto-fill; backend ignores unknown fields
      if (isEdit) await api.put(`/clientes/${id}`, form)
      else        await api.post('/clientes', form)
      toast('Cliente salvo com sucesso!', 'success')
      navigate('/clientes')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar cliente.') }
    finally       { setSalvando(false) }
  }

  const carregandoEndereco = buscandoCEP || buscandoCNPJ

  if (carregando) return (
    <div className="space-y-4 max-w-xl">
      {[1,2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-xl">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/clientes')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar cliente' : 'Novo cliente'}</h1>
              <p className="text-xs text-gray-400">Dados cadastrais do cliente</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Dados pessoais */}
          <SectionCard icon={User} title="Dados pessoais" accent="#2563eb">
            <div>
              <label className="label flex items-center gap-2">
                Nome completo *
                {buscandoCNPJ && <Loader2 size={12} className="animate-spin text-blue-400" />}
              </label>
              <InputIcon icon={User} accent="#2563eb">
                <input value={form.nome} onChange={e => set('nome', e.target.value)}
                  required placeholder="Nome do cliente" className="input" />
              </InputIcon>
            </div>

            <div>
              <label className="label">Tipo *</label>
              <div className="flex gap-2">
                {TIPOS.map(t => (
                  <button key={t} type="button" onClick={() => set('tipo', t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      form.tipo === t
                        ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                        : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}>
                    {TIPO_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  CPF / CNPJ
                  {buscandoCNPJ && <span className="text-xs text-blue-400 font-normal animate-pulse">buscando…</span>}
                </label>
                <InputIcon icon={Hash} accent="#2563eb">
                  <input
                    value={form.cpf}
                    onChange={e => handleDocumento(e.target.value)}
                    placeholder="000.000.000-00"
                    className={`input ${buscandoCNPJ ? 'opacity-60' : ''}`}
                  />
                </InputIcon>
                <p className="text-xs text-gray-400 mt-1">Digite o CNPJ para preenchimento automático</p>
              </div>
              <div>
                <label className="label">Telefone</label>
                <InputIcon icon={Phone} accent="#2563eb">
                  <input value={form.telefone} onChange={e => set('telefone', maskTelefone(e.target.value))}
                    placeholder="(14) 99999-0000" className="input" />
                </InputIcon>
              </div>
            </div>

            <div>
              <label className="label">E-mail</label>
              <InputIcon icon={Mail} accent="#2563eb">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="cliente@email.com" className="input" />
              </InputIcon>
            </div>
          </SectionCard>

          {/* Endereço */}
          <SectionCard icon={MapPin} title="Endereço" accent="#0891b2">
            <div>
              <label className="label flex items-center gap-2">
                CEP
                {carregandoEndereco && <span className="text-xs text-blue-400 font-normal animate-pulse">buscando…</span>}
              </label>
              <InputIcon icon={MapPin} accent="#0891b2">
                <input
                  value={form.cep}
                  onChange={e => handleCEP(e.target.value)}
                  placeholder="00000-000"
                  className={`input ${carregandoEndereco ? 'opacity-60' : ''}`}
                />
              </InputIcon>
              <p className="text-xs text-gray-400 mt-1">Preencha o CEP para completar o endereço automaticamente</p>
            </div>
            <div>
              <label className="label">Endereço</label>
              <InputIcon icon={MapPin} accent="#0891b2">
                <input value={form.endereco} onChange={e => set('endereco', e.target.value)}
                  placeholder="Rua, número, bairro" className="input" />
              </InputIcon>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Cidade</label>
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">UF</label>
                <input value={form.estado} onChange={e => set('estado', e.target.value)}
                  maxLength={2} placeholder="SP" className="input uppercase" />
              </div>
            </div>
          </SectionCard>

          {/* Observações / Status */}
          <SectionCard icon={User} title="Informações adicionais" accent="#6b7280">
            <div>
              <label className="label">Observações</label>
              <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
                rows={3} placeholder="Informações adicionais..." className="input resize-none" />
            </div>
            {isEdit && (
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            )}
          </SectionCard>

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
            <button type="button" onClick={() => navigate('/clientes')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
  )
}
