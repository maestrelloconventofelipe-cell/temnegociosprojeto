import { useState } from 'react'
import { BarChart2, Download, FileText, TrendingUp, Users, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const RELATORIOS = [
  { id: 'imoveis',    icone: FileText,   titulo: 'Imóveis',      desc: 'Lista completa de imóveis com status e valores', cor: '#3b82f6' },
  { id: 'clientes',   icone: Users,      titulo: 'Clientes',     desc: 'Relatório de clientes e propostas', cor: '#7c3aed' },
  { id: 'financeiro', icone: DollarSign, titulo: 'Financeiro',   desc: 'DRE detalhado do período selecionado', cor: '#22c55e' },
  { id: 'comissoes',  icone: TrendingUp, titulo: 'Comissões',    desc: 'Comissões por corretor e período', cor: '#f59e0b' },
  { id: 'contratos',  icone: FileText,   titulo: 'Contratos',    desc: 'Contratos ativos, vencidos e encerrados', cor: '#ef4444' },
]

export default function Relatorios() {
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [gerandoId, setGerando] = useState(null)

  async function gerar(id) {
    setGerando(id)
    try {
      const r = await api.get(`/relatorios/${id}`, { params: { mes: periodo }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_${id}_${periodo}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Relatório gerado!')
    } catch {
      toast.error('Erro ao gerar relatório. Verifique se o endpoint existe no backend.')
    } finally { setGerando(null) }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-0">Relatórios</h4>
          <p className="text-muted small mb-0">Gere e exporte relatórios do sistema</p>
        </div>
        <div>
          <label className="form-label small fw-bold text-muted mb-1 d-block">PERÍODO</label>
          <input type="month" className="form-control rounded-3" value={periodo} onChange={e => setPeriodo(e.target.value)} />
        </div>
      </div>

      <div className="row g-3">
        {RELATORIOS.map(rel => {
          const Icon = rel.icone
          return (
            <div key={rel.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <div className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: '44px', height: '44px', background: rel.cor + '18', flexShrink: 0 }}>
                    <Icon size={20} style={{ color: rel.cor }} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">{rel.titulo}</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>{rel.desc}</p>
                  </div>
                </div>
                <button className="btn btn-outline-primary rounded-3 d-flex align-items-center gap-2 w-100 justify-content-center"
                  disabled={gerandoId === rel.id} onClick={() => gerar(rel.id)}>
                  {gerandoId === rel.id
                    ? <span className="spinner-border spinner-border-sm" />
                    : <Download size={15} />}
                  Exportar CSV
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mt-4">
        <div className="d-flex align-items-center gap-3">
          <BarChart2 size={20} className="text-muted" />
          <div>
            <h6 className="fw-semibold text-dark mb-0">Dashboard analítico</h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Para análise visual completa com gráficos, acesse o <strong>Dashboard</strong> principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
