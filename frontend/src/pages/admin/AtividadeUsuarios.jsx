import { useState, useEffect } from 'react'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import { Activity, RefreshCw, Circle, BadgeCheck } from 'lucide-react'

const ROLE_LABELS = {
  administrador_matriz:      'Admin',
  diretor_regional:          'Dir. Regional',
  franqueado:                'Franqueado',
  corretor:                  'Corretor',
  captador:                  'Captador',
  financeiro:                'Financeiro',
  juridico:                  'Jurídico',
  funcionario_administrativo:'Func. Adm.',
  auditor_rede:              'Auditor',
}

const ROLE_CORES = {
  administrador_matriz:      'bg-purple-100 text-purple-700',
  diretor_regional:          'bg-blue-100 text-blue-700',
  franqueado:                'bg-indigo-100 text-indigo-700',
  corretor:                  'bg-emerald-100 text-emerald-700',
  captador:                  'bg-teal-100 text-teal-700',
  financeiro:                'bg-amber-100 text-amber-700',
  juridico:                  'bg-rose-100 text-rose-700',
  funcionario_administrativo:'bg-gray-100 text-gray-600',
  auditor_rede:              'bg-cyan-100 text-cyan-700',
}

function iniciais(nome) {
  return nome?.split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() ?? '?'
}

function statusAtividade(ultimoLogin) {
  if (!ultimoLogin) return { label: 'Nunca entrou', cor: 'text-gray-300', dot: 'bg-gray-200' }
  const diff = Date.now() - new Date(ultimoLogin).getTime()
  const horas = diff / (1000 * 60 * 60)
  if (horas < 1)   return { label: 'Online agora',     cor: 'text-green-600',  dot: 'bg-green-500' }
  if (horas < 8)   return { label: 'Hoje',             cor: 'text-green-500',  dot: 'bg-green-400' }
  if (horas < 48)  return { label: 'Ontem',            cor: 'text-yellow-600', dot: 'bg-yellow-400' }
  if (horas < 168) return { label: 'Esta semana',      cor: 'text-orange-500', dot: 'bg-orange-400' }
  return { label: 'Inativo',                           cor: 'text-gray-400',  dot: 'bg-gray-300' }
}

function dataHora(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AtividadeUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const res = await api.get('/usuarios/atividade')
      setUsuarios(res.data)
    } catch { setErro('Erro ao carregar atividade dos usuários.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  const onlineHoje  = usuarios.filter(u => {
    if (!u.ultimo_login) return false
    return (Date.now() - new Date(u.ultimo_login).getTime()) < 8 * 60 * 60 * 1000
  }).length

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center justify-center shadow-md shadow-purple-700/30">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Atividade dos Usuários</h1>
            <p className="text-xs text-gray-400">{usuarios.length} usuário(s) · {onlineHoje} ativo(s) hoje</p>
          </div>
        </div>
        <button
          onClick={carregar}
          className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          title="Atualizar"
        >
          <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',        valor: usuarios.length,                                                                         cor: 'bg-gray-50 border-gray-200' },
          { label: 'Ativos hoje',  valor: onlineHoje,                                                                              cor: 'bg-green-50 border-green-200' },
          { label: 'Esta semana',  valor: usuarios.filter(u => u.ultimo_login && (Date.now() - new Date(u.ultimo_login)) < 7*24*3600*1000).length, cor: 'bg-blue-50 border-blue-200' },
          { label: 'Sem acesso',   valor: usuarios.filter(u => !u.ultimo_login).length,                                            cor: 'bg-gray-50 border-gray-200' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl border p-4 ${card.cor}`}>
            <p className="text-2xl font-bold text-gray-800">{card.valor}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : erro ? (
        <div className="text-center text-red-500 text-sm p-12">{erro}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Usuário', 'CRECI', 'Perfil', 'E-mail', 'Último acesso', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map(u => {
                  const ativ = statusAtividade(u.ultimo_login)
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Avatar + nome */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {iniciais(u.nome)}
                          </div>
                          <span className="font-semibold text-gray-800">{u.nome}</span>
                        </div>
                      </td>

                      {/* CRECI */}
                      <td className="px-4 py-3.5">
                        {u.creci ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <BadgeCheck size={12} />
                            {u.creci}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Perfil */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_CORES[u.role] ?? 'bg-gray-100 text-gray-500'}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>

                      {/* E-mail */}
                      <td className="px-4 py-3.5 text-gray-500">{u.email}</td>

                      {/* Último login */}
                      <td className="px-4 py-3.5 text-gray-500 tabular-nums">{dataHora(u.ultimo_login)}</td>

                      {/* Status de atividade */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Circle size={8} className={`${ativ.dot} fill-current`} />
                          <span className={`text-xs font-medium ${ativ.cor}`}>{ativ.label}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
