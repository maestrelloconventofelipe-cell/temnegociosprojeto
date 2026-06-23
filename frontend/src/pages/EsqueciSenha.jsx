import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function EsqueciSenha() {
  const [franquias, setFranquias] = useState([])
  const [tenantId, setTenantId] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.get('/tenants/public').then(r => setFranquias(r.data)).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault(); setErro(''); setEnviando(true)
    try {
      await api.post('/auth/esqueci-senha', { email, tenant_id: Number(tenantId) })
      setEnviado(true)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao processar. Tente novamente.')
    } finally { setEnviando(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6
                    bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.05),_transparent_60%)]">
      <div className="w-full max-w-sm animate-scale-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Tem Negócios" className="h-12 w-12 object-contain mx-auto mb-3" />
          <h1 className="text-xl font-bold text-blue-900">Tem Negócios</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 p-8">
          {enviado ? (
            /* Estado: email enviado */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📬</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Verifique seu e-mail</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá
                as instruções para redefinir sua senha em breve.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Não recebeu? Verifique a pasta de spam ou{' '}
                <button onClick={() => setEnviado(false)} className="text-blue-600 hover:underline font-medium">
                  tente novamente
                </button>
              </p>
              <Link to="/login"
                className="block w-full text-center bg-blue-800 text-white font-semibold py-2.5 rounded-xl
                           hover:bg-blue-700 transition-colors text-sm">
                Voltar ao login
              </Link>
            </div>
          ) : (
            /* Estado: formulário */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Esqueceu a senha?</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Informe sua franquia e e-mail para receber o link de redefinição.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Franquia</label>
                  <select value={tenantId} onChange={e => setTenantId(e.target.value)} required className="input">
                    <option value="">Selecione a franquia...</option>
                    {franquias.map(f => (
                      <option key={f.id} value={f.id}>{f.nome} — {f.cidade}/{f.estado}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="seu@email.com" className="input" />
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                    {erro}
                  </div>
                )}

                <button type="submit" disabled={enviando}
                  className="w-full bg-blue-800 text-white font-semibold py-3 rounded-xl
                             hover:bg-blue-700 active:scale-[0.98] transition-all duration-150
                             disabled:opacity-60 shadow-sm flex items-center justify-center gap-2">
                  {enviando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : 'Enviar link de redefinição'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
