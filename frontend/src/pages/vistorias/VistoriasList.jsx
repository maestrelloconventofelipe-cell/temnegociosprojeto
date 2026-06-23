import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'
import {
  ClipboardCheck, RefreshCw, CalendarDays,
  User, Home, UserCheck, ClipboardList,
} from 'lucide-react'

const TIPOS = {
  entrada:     { label: 'Entrada',     cor: 'bg-green-100 text-green-700'  },
  saida:       { label: 'Saída',       cor: 'bg-red-100 text-red-600'      },
  pre_venda:   { label: 'Pré-venda',   cor: 'bg-blue-100 text-blue-700'    },
  conferencia: { label: 'Conferência', cor: 'bg-purple-100 text-purple-700' },
}

const TIPO_ACCENT = {
  entrada:     '#16a34a',
  saida:       '#dc2626',
  pre_venda:   '#2563eb',
  conferencia: '#7c3aed',
}

function dataBr(d) {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
}

const ROLES_OPERAR = ['administrador_matriz','diretor_regional','franqueado','corretor','captador','juridico']

export default function VistoriasList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [vistorias, setVistorias] = useState([])
  const [resumo, setResumo]       = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]           = useState('')

  const podeOperar = ROLES_OPERAR.includes(user?.role)

  async function carregar() {
    setCarregando(true); setErro('')
    try {
      const params = {}
      if (filtroTipo) params.tipo = filtroTipo
      const [lista, res] = await Promise.all([
        api.get('/vistorias', { params }),
        api.get('/vistorias/resumo'),
      ])
      setVistorias(lista.data)
      setResumo(res.data)
    } catch { setErro('Erro ao carregar vistorias.') }
    finally  { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [filtroTipo])

  async function remover(v) {
    const ok = await confirm(
      `Remover a vistoria de "${v.imovel_titulo || 'imóvel'}" (${dataBr(v.data)})?`,
      { title: 'Remover vistoria', danger: true, confirmText: 'Sim, remover' }
    )
    if (!ok) return
    try {
      await api.delete(`/vistorias/${v.id}`)
      setVistorias(prev => prev.filter(x => x.id !== v.id))
      toast('Vistoria removida.', 'success')
    } catch (e) { toast(e.response?.data?.erro || 'Erro ao remover.', 'error') }
  }

  const kpis = resumo ? [
    { label: 'Total',       valor: resumo.total,       accent: '#2563eb', cor: 'text-blue-700'   },
    { label: 'Entradas',    valor: resumo.entradas,    accent: '#16a34a', cor: 'text-green-600'  },
    { label: 'Saídas',      valor: resumo.saidas,      accent: '#dc2626', cor: 'text-red-600'    },
    { label: 'Pré-vendas',  valor: resumo.pre_vendas,  accent: '#7c3aed', cor: 'text-purple-600' },
  ] : []

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shadow-md shadow-blue-800/30">
            <ClipboardCheck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Vistorias</h1>
            <p className="text-xs text-gray-400">{vistorias.length} vistoria(s)</p>
          </div>
        </div>
        {podeOperar && (
          <Link to="/vistorias/nova" className="btn-primary flex items-center gap-2 text-sm">
            + Nova vistoria
          </Link>
        )}
      </div>

      {/* KPI cards */}
      {resumo && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {kpis.map(k => (
            <div key={k.label} className="card overflow-hidden">
              <div className="h-0.5" style={{ backgroundColor: k.accent }} />
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className={`text-2xl font-bold ${k.cor}`}>{k.valor ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtro por tipo */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {[{ value: '', label: 'Todas' }, ...Object.entries(TIPOS).map(([v, t]) => ({ value: v, label: t.label }))].map(({ value, label }) => (
            <button key={value} onClick={() => setFiltroTipo(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filtroTipo === value
                  ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={carregar}
          className="ml-auto text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100" title="Atualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {carregando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : erro ? (
          <div className="p-12 text-center text-red-500 text-sm">{erro}</div>
        ) : vistorias.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma vistoria encontrada.</p>
            {podeOperar && (
              <Link to="/vistorias/nova" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                Registrar a primeira vistoria
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Imóvel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proprietário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inquilino</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vistoriador</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vistorias.map(v => {
                  const tipo  = TIPOS[v.tipo]
                  const accent = TIPO_ACCENT[v.tipo] ?? '#2563eb'
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${accent}15` }}>
                            <Home size={14} style={{ color: accent }} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 leading-tight">{v.imovel_titulo || '—'}</p>
                            {v.imovel_cidade && <p className="text-xs text-gray-400">{v.imovel_cidade}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tipo?.cor ?? 'bg-gray-100 text-gray-500'}`}>
                          {tipo?.label ?? v.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <CalendarDays size={13} className="text-gray-400" />
                          {dataBr(v.data)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <User size={12} className="text-gray-400 shrink-0" />
                          {v.proprietario_nome || <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <UserCheck size={12} className="text-gray-400 shrink-0" />
                          {v.inquilino_nome || <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs">{v.usuario_nome || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {podeOperar && (
                            <Link to={`/vistorias/${v.id}/editar`}
                              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-medium transition-colors">
                              Editar
                            </Link>
                          )}
                          {podeOperar && (
                            <button onClick={() => remover(v)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-medium transition-colors">
                              Remover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
