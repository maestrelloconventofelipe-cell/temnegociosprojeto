import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import AppLayout from '../../layouts/AppLayout'

// ── helpers ────────────────────────────────────────────────────────────────
function moeda(v) { return `R$ ${Number(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
function fdata(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

function exportCSV(filename, headers, rows) {
  const lines = [
    headers.join(';'),
    ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')),
  ]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const ROLES_GESTOR = ['administrador_matriz','diretor_regional','franqueado','financeiro']

// ── card de totais ──────────────────────────────────────────────────────────
function TotalCard({ label, valor, cor = 'text-gray-800', isMoeda = true }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${cor}`}>{isMoeda ? moeda(valor) : valor}</p>
    </div>
  )
}

// ── botões de ação ──────────────────────────────────────────────────────────
function Acoes({ onGerar, onCSV, carregando, temDados }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={onGerar} disabled={carregando}
        className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
        {carregando ? 'Gerando...' : 'Gerar relatório'}
      </button>
      {temDados && (
        <>
          <button onClick={onCSV}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Exportar CSV
          </button>
          <button onClick={() => window.print()}
            className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Imprimir / PDF
          </button>
        </>
      )}
    </div>
  )
}

// ── aba financeiro ──────────────────────────────────────────────────────────
function RelFinanceiro() {
  const hoje = new Date()
  const primeiroDia = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-01`
  const ultimoDia   = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).toISOString().slice(0,10)

  const [filtros, setFiltros] = useState({ data_inicio: primeiroDia, data_fim: ultimoDia, tipo: '', status: '' })
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  async function gerar() {
    setCarregando(true); setErro(''); setDados(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v))
      const res = await api.get('/relatorios/financeiro', { params })
      setDados(res.data)
    } catch { setErro('Erro ao gerar relatório.') }
    finally  { setCarregando(false) }
  }

  function csv() {
    exportCSV('financeiro.csv',
      ['Tipo','Categoria','Descrição','Valor','Vencimento','Pagamento','Status'],
      dados.rows.map(r => [r.tipo, r.categoria, r.descricao, r.valor, fdata(r.data_venc), fdata(r.data_pgto), r.status])
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        {[['data_inicio','Data início'],['data_fim','Data fim']].map(([k,l]) => (
          <div key={k}>
            <label className="label">{l}</label>
            <input type="date" value={filtros[k]} onChange={e => setF(k, e.target.value)} className="input w-40" />
          </div>
        ))}
        <div>
          <label className="label">Tipo</label>
          <select value={filtros.tipo} onChange={e => setF('tipo', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select value={filtros.status} onChange={e => setF('status', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>
        <Acoes onGerar={gerar} onCSV={csv} carregando={carregando} temDados={!!dados} />
      </div>

      {erro && <div className="text-red-500 text-sm">{erro}</div>}

      {dados && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <TotalCard label="Receitas pagas"  valor={dados.totais.total_receitas} cor="text-green-600" />
            <TotalCard label="Despesas pagas"  valor={dados.totais.total_despesas} cor="text-red-600" />
            <TotalCard label="Saldo"           valor={dados.totais.saldo}          cor={dados.totais.saldo >= 0 ? 'text-blue-700' : 'text-red-600'} />
            <TotalCard label="A receber"       valor={dados.totais.a_receber}      cor="text-green-500" />
            <TotalCard label="A pagar"         valor={dados.totais.a_pagar}        cor="text-orange-500" />
          </div>
          <div className="bg-white rounded-xl border overflow-hidden print-area">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Tipo','Categoria','Descrição','Valor','Vencimento','Pagamento','Status'].map(h =>
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.rows.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum resultado.</td></tr>
                  : dados.rows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.tipo === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{r.categoria || '—'}</td>
                      <td className="px-4 py-2 text-gray-800">{r.descricao || '—'}</td>
                      <td className={`px-4 py-2 font-semibold ${r.tipo === 'receita' ? 'text-green-700' : 'text-red-600'}`}>{moeda(r.valor)}</td>
                      <td className="px-4 py-2 text-gray-500">{fdata(r.data_venc)}</td>
                      <td className="px-4 py-2 text-gray-500">{fdata(r.data_pgto)}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{r.status}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── aba comissões ───────────────────────────────────────────────────────────
function RelComissoes() {
  const hoje = new Date()
  const [filtros, setFiltros] = useState({ data_inicio: `${hoje.getFullYear()}-01-01`, data_fim: hoje.toISOString().slice(0,10), status: '' })
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  async function gerar() {
    setCarregando(true); setErro(''); setDados(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v))
      const res = await api.get('/relatorios/comissoes', { params })
      setDados(res.data)
    } catch { setErro('Erro ao gerar relatório.') }
    finally  { setCarregando(false) }
  }

  function csv() {
    exportCSV('comissoes.csv',
      ['Beneficiário','Imóvel','Tipo operação','Valor negócio','Comissão','Status','Data'],
      dados.rows.map(r => [r.usuario_nome, r.imovel_titulo, r.tipo_operacao, r.valor_operacao, r.valor_comissao, r.status, fdata(r.created_at)])
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        {[['data_inicio','Data início'],['data_fim','Data fim']].map(([k,l]) => (
          <div key={k}>
            <label className="label">{l}</label>
            <input type="date" value={filtros[k]} onChange={e => setF(k, e.target.value)} className="input w-40" />
          </div>
        ))}
        <div>
          <label className="label">Status</label>
          <select value={filtros.status} onChange={e => setF('status', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <Acoes onGerar={gerar} onCSV={csv} carregando={carregando} temDados={!!dados} />
      </div>

      {erro && <div className="text-red-500 text-sm">{erro}</div>}

      {dados && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <TotalCard label="Total em comissões" valor={dados.totais.total_valor}    cor="text-gray-800" />
            <TotalCard label="Já pago"            valor={dados.totais.total_pago}    cor="text-green-700" />
            <TotalCard label="Pendente"           valor={dados.totais.total_pendente} cor="text-yellow-600" />
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Beneficiário','Imóvel','Tipo','Valor negócio','Comissão','Status','Data'].map(h =>
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.rows.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum resultado.</td></tr>
                  : dados.rows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">{r.usuario_nome || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{r.imovel_titulo || '—'}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize text-xs">{r.tipo_operacao || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{moeda(r.valor_operacao)}</td>
                      <td className="px-4 py-2 font-semibold text-green-700">{moeda(r.valor_comissao)}</td>
                      <td className="px-4 py-2 capitalize text-gray-500">{r.status}</td>
                      <td className="px-4 py-2 text-gray-500">{fdata(r.created_at)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── aba contratos ───────────────────────────────────────────────────────────
function RelContratos() {
  const [filtros, setFiltros] = useState({ tipo: '', status: 'ativo', data_inicio: '', data_fim: '' })
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  async function gerar() {
    setCarregando(true); setErro(''); setDados(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v))
      const res = await api.get('/relatorios/contratos', { params })
      setDados(res.data)
    } catch { setErro('Erro ao gerar relatório.') }
    finally  { setCarregando(false) }
  }

  function csv() {
    exportCSV('contratos.csv',
      ['Imóvel','Cidade','Cliente','Tipo','Valor','Início','Fim','Status'],
      dados.rows.map(r => [r.imovel_titulo, r.imovel_cidade, r.cliente_nome, r.tipo, r.valor, fdata(r.data_inicio), fdata(r.data_fim), r.status])
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Tipo</label>
          <select value={filtros.tipo} onChange={e => setF('tipo', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="locacao">Locação</option>
            <option value="compra_venda">Compra e venda</option>
            <option value="intermediacao">Intermediação</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select value={filtros.status} onChange={e => setF('status', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="encerrado">Encerrado</option>
            <option value="cancelado">Cancelado</option>
            <option value="em_renovacao">Em renovação</option>
          </select>
        </div>
        {[['data_inicio','Início de'],['data_fim','Fim até']].map(([k,l]) => (
          <div key={k}>
            <label className="label">{l}</label>
            <input type="date" value={filtros[k]} onChange={e => setF(k, e.target.value)} className="input w-40" />
          </div>
        ))}
        <Acoes onGerar={gerar} onCSV={csv} carregando={carregando} temDados={!!dados} />
      </div>

      {erro && <div className="text-red-500 text-sm">{erro}</div>}

      {dados && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TotalCard label="Total"          valor={dados.totais.total}      isMoeda={false} />
            <TotalCard label="Ativos"         valor={dados.totais.ativos}     isMoeda={false} cor="text-green-600" />
            <TotalCard label="Vencem em 30d"  valor={dados.totais.vencem_30}  isMoeda={false} cor={dados.totais.vencem_30 > 0 ? 'text-orange-500' : 'text-gray-800'} />
            <TotalCard label="Valor total"    valor={dados.totais.total_valor} cor="text-blue-700" />
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Imóvel','Cliente','Tipo','Valor','Início','Fim','Status'].map(h =>
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.rows.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum resultado.</td></tr>
                  : dados.rows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">{r.imovel_titulo}</td>
                      <td className="px-4 py-2 text-gray-600">{r.cliente_nome}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{r.tipo.replace('_',' ')}</td>
                      <td className="px-4 py-2 text-gray-600">{r.valor ? moeda(r.valor) : '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{fdata(r.data_inicio)}</td>
                      <td className="px-4 py-2 text-gray-500">{fdata(r.data_fim)}</td>
                      <td className="px-4 py-2 capitalize text-gray-500">{r.status.replace('_',' ')}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── aba imóveis ─────────────────────────────────────────────────────────────
function RelImoveis() {
  const [filtros, setFiltros] = useState({ tipo_imovel: '', tipo_negocio: '', status_imovel: '', cidade: '' })
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  function setF(k, v) { setFiltros(p => ({ ...p, [k]: v })) }

  async function gerar() {
    setCarregando(true); setErro(''); setDados(null)
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([,v]) => v))
      const res = await api.get('/relatorios/imoveis', { params })
      setDados(res.data)
    } catch { setErro('Erro ao gerar relatório.') }
    finally  { setCarregando(false) }
  }

  function csv() {
    exportCSV('imoveis.csv',
      ['Título','Tipo','Negócio','Valor','Área','Quartos','Cidade','Status','Corretor'],
      dados.rows.map(r => [r.titulo, r.tipo_imovel, r.tipo_negocio, r.valor, r.area_total, r.quartos, r.cidade, r.status_imovel, r.corretor_nome])
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Tipo</label>
          <select value={filtros.tipo_imovel} onChange={e => setF('tipo_imovel', e.target.value)} className="input">
            <option value="">Todos</option>
            {['apartamento','casa','terreno','comercial','rural'].map(t =>
              <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
            )}
          </select>
        </div>
        <div>
          <label className="label">Negócio</label>
          <select value={filtros.tipo_negocio} onChange={e => setF('tipo_negocio', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="venda">Venda</option>
            <option value="locacao">Locação</option>
            <option value="temporada">Temporada</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select value={filtros.status_imovel} onChange={e => setF('status_imovel', e.target.value)} className="input">
            <option value="">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="alugado">Alugado</option>
            <option value="vendido">Vendido</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div>
          <label className="label">Cidade</label>
          <input value={filtros.cidade} onChange={e => setF('cidade', e.target.value)} placeholder="Buscar..." className="input w-36" />
        </div>
        <Acoes onGerar={gerar} onCSV={csv} carregando={carregando} temDados={!!dados} />
      </div>

      {erro && <div className="text-red-500 text-sm">{erro}</div>}

      {dados && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TotalCard label="Total"        valor={dados.totais.total}       isMoeda={false} />
            <TotalCard label="Disponíveis"  valor={dados.totais.disponiveis} isMoeda={false} cor="text-blue-600" />
            <TotalCard label="Alugados"     valor={dados.totais.alugados}    isMoeda={false} cor="text-orange-500" />
            <TotalCard label="Vendidos"     valor={dados.totais.vendidos}    isMoeda={false} cor="text-green-600" />
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Título','Tipo','Finalidade','Valor','Área','Quartos','Cidade','Status','Corretor'].map(h =>
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.rows.length === 0
                  ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">Nenhum resultado.</td></tr>
                  : dados.rows.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">{r.titulo}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{r.tipo_imovel}</td>
                      <td className="px-4 py-2 text-gray-500 capitalize">{r.tipo_negocio}</td>
                      <td className="px-4 py-2 text-gray-600">{r.valor ? moeda(r.valor) : '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{r.area_total ? `${r.area_total}m²` : '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{r.quartos ?? '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{r.cidade}</td>
                      <td className="px-4 py-2 capitalize text-gray-500">{r.status_imovel}</td>
                      <td className="px-4 py-2 text-gray-500">{r.corretor_nome || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── página principal ────────────────────────────────────────────────────────
const ABAS = [
  { id: 'financeiro', label: 'Financeiro',  roles: ROLES_GESTOR },
  { id: 'comissoes',  label: 'Comissões',   roles: ROLES_GESTOR },
  { id: 'contratos',  label: 'Contratos',   roles: null },
  { id: 'imoveis',    label: 'Imóveis',     roles: null },
]

export default function Relatorios() {
  const { user } = useAuth()
  const [aba, setAba] = useState(null)

  const abasVisiveis = ABAS.filter(a => !a.roles || a.roles.includes(user?.role))

  const abaAtual = aba ?? abasVisiveis[0]?.id

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-xs text-gray-400 mt-0.5">Aplique os filtros e clique em "Gerar relatório"</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 border-b">
        {abasVisiveis.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              abaAtual === a.id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {abaAtual === 'financeiro' && <RelFinanceiro />}
      {abaAtual === 'comissoes'  && <RelComissoes />}
      {abaAtual === 'contratos'  && <RelContratos />}
      {abaAtual === 'imoveis'    && <RelImoveis />}
    </AppLayout>
  )
}
