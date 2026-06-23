import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function ResetarSenha() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) setErro('Link inválido. Solicite um novo.')
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault(); setErro('')
    if (novaSenha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    if (novaSenha !== confirmar) return setErro('As senhas não coincidem.')
    setSalvando(true)
    try {
      await api.post('/auth/resetar-senha', { token, nova_senha: novaSenha })
      setConcluido(true)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao redefinir. O link pode ter expirado.')
    } finally { setSalvando(false) }
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
          {concluido ? (
            /* Sucesso */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Senha redefinida!</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Sua senha foi atualizada com sucesso. Você já pode fazer login com a nova senha.
              </p>
              <Link to="/login"
                className="block w-full text-center bg-blue-800 text-white font-semibold py-2.5 rounded-xl
                           hover:bg-blue-700 transition-colors text-sm">
                Ir para o login
              </Link>
            </div>
          ) : (
            /* Formulário */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Nova senha</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Escolha uma senha segura com pelo menos 6 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nova senha</label>
                  <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                    required placeholder="••••••••" minLength={6} className="input" />
                </div>

                <div>
                  <label className="label">Confirmar nova senha</label>
                  <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
                    required placeholder="••••••••" className="input" />
                </div>

                {/* Força da senha */}
                {novaSenha.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                          forca(novaSenha) >= n
                            ? n <= 1 ? 'bg-red-400' : n <= 2 ? 'bg-amber-400' : n <= 3 ? 'bg-blue-400' : 'bg-green-400'
                            : 'bg-gray-100'
                        }`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{forcaLabel(novaSenha)}</p>
                  </div>
                )}

                {erro && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                    {erro}
                  </div>
                )}

                <button type="submit" disabled={salvando || !token}
                  className="w-full bg-blue-800 text-white font-semibold py-3 rounded-xl
                             hover:bg-blue-700 active:scale-[0.98] transition-all duration-150
                             disabled:opacity-60 shadow-sm flex items-center justify-center gap-2">
                  {salvando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : 'Redefinir senha'}
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

function forca(senha) {
  let f = 0
  if (senha.length >= 6)  f++
  if (senha.length >= 10) f++
  if (/[A-Z]/.test(senha) && /[0-9]/.test(senha)) f++
  if (/[^A-Za-z0-9]/.test(senha)) f++
  return f
}

function forcaLabel(senha) {
  const f = forca(senha)
  return ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][f] || ''
}
