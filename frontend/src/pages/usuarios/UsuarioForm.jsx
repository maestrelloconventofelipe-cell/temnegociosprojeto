import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import { useToast } from '../../contexts/ToastContext'
import AppLayout from '../../layouts/AppLayout'
import {
  UserCog, User, Mail, Shield, Lock, Eye, EyeOff,
  ChevronLeft, Save, BadgeCheck,
} from 'lucide-react'

const ROLES = ['administrador_matriz','diretor_regional','franqueado','corretor','financeiro','juridico','funcionario_administrativo']
const ROLE_LABELS = {
  administrador_matriz: 'Adm. Matriz', diretor_regional: 'Diretor Regional', franqueado: 'Franqueado',
  corretor: 'Corretor', captador: 'Captador', financeiro: 'Financeiro', juridico: 'Jurídico',
  funcionario_administrativo: 'Func. Adm.', auditor_rede: 'Auditor',
}

const INICIAL = { nome: '', email: '', senha: '', confirmar_senha: '', role: 'corretor', status: 'ativo', creci: '' }

const ROLES_COM_CRECI = ['corretor', 'captador']

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

function PasswordInput({ value, onChange, placeholder, accent = '#0891b2' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
        <Lock size={15} style={{ color: accent }} />
      </div>
      <input
        type={show ? 'text' : 'password'}
        value={value} onChange={onChange}
        placeholder={placeholder}
        className="input pl-9 pr-10"
      />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function UsuarioForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const [form, setForm] = useState(INICIAL)
  const [carregando, setCarregando] = useState(isEdit)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()
  const { toast } = useToast()

  const rolesDisponiveis = user?.role === 'administrador_matriz'
    ? ROLES
    : ROLES.filter(r => r !== 'administrador_matriz')

  useEffect(() => {
    if (!isEdit) return
    api.get(`/usuarios/${id}`)
      .then(r => {
        const d = r.data
        setForm({ nome: d.nome, email: d.email, senha: '', confirmar_senha: '', role: d.role, status: d.status, creci: d.creci || '' })
      })
      .catch(() => setErro('Usuário não encontrado.'))
      .finally(() => setCarregando(false))
  }, [])

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    if (!isEdit && !form.senha)            return setErro('Senha é obrigatória para novo usuário.')
    if (form.senha && form.senha !== form.confirmar_senha) return setErro('As senhas não coincidem.')
    if (form.senha && form.senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')

    setSalvando(true)
    try {
      const payload = { nome: form.nome, email: form.email, role: form.role, status: form.status, creci: form.creci || null }
      if (form.senha) payload.senha = form.senha

      if (isEdit) await api.put(`/usuarios/${id}`, payload)
      else        await api.post('/usuarios', payload)
      toast('Usuário salvo com sucesso!', 'success')
      navigate('/usuarios')
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar usuário.') }
    finally       { setSalvando(false) }
  }

  if (carregando) return (
    <AppLayout>
      <div className="space-y-4 max-w-lg">
        {[1,2].map(i => <div key={i} className="skeleton h-44 rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="max-w-lg">

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6 animate-fade-up">
          <button onClick={() => navigate('/usuarios')}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
              <UserCog size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isEdit ? 'Editar usuário' : 'Novo usuário'}</h1>
              <p className="text-xs text-gray-400">Acesso e perfil do membro da equipe</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Dados */}
          <SectionCard icon={User} title="Dados do usuário" accent="#2563eb">
            <div>
              <label className="label">Nome completo *</label>
              <InputIcon icon={User} accent="#2563eb">
                <input value={form.nome} onChange={e => set('nome', e.target.value)}
                  required placeholder="Ex: João Silva" className="input" />
              </InputIcon>
            </div>
            <div>
              <label className="label">E-mail *</label>
              <InputIcon icon={Mail} accent="#2563eb">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  required placeholder="joao@temneg.com" className="input" />
              </InputIcon>
            </div>
            <div>
              <label className="label">Perfil *</label>
              <InputIcon icon={Shield} accent="#2563eb">
                <select value={form.role} onChange={e => set('role', e.target.value)} className="input">
                  {rolesDisponiveis.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </InputIcon>
            </div>
            {/* CRECI — visível apenas para corretor e captador */}
            {ROLES_COM_CRECI.includes(form.role) && (
              <div>
                <label className="label">CRECI</label>
                <InputIcon icon={BadgeCheck} accent="#2563eb">
                  <input
                    value={form.creci}
                    onChange={e => set('creci', e.target.value)}
                    placeholder="Ex: CRECI/SP 123456"
                    className="input"
                    maxLength={30}
                  />
                </InputIcon>
                <p className="text-xs text-gray-400 mt-1">Registro no Conselho Regional de Corretores de Imóveis</p>
              </div>
            )}

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

          {/* Senha */}
          <SectionCard icon={Lock} title={isEdit ? 'Alterar senha' : 'Senha de acesso'} accent="#0891b2">
            {isEdit && (
              <p className="text-xs text-gray-400 -mt-1">Deixe em branco para manter a senha atual.</p>
            )}
            <div>
              <label className="label">{isEdit ? 'Nova senha' : 'Senha *'}</label>
              <PasswordInput
                value={form.senha}
                onChange={e => set('senha', e.target.value)}
                placeholder={isEdit ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
                accent="#0891b2"
              />
            </div>
            <div>
              <label className="label">Confirmar senha</label>
              <PasswordInput
                value={form.confirmar_senha}
                onChange={e => set('confirmar_senha', e.target.value)}
                placeholder="Repita a senha"
                accent="#0891b2"
              />
            </div>
          </SectionCard>

          {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{erro}</div>}

          <div className="flex gap-3 pb-4">
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {salvando ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar usuário'}
            </button>
            <button type="button" onClick={() => navigate('/usuarios')} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
