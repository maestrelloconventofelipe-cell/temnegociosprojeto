import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-red-500 mb-2">403</p>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Acesso negado</h1>
        <p className="text-gray-400 text-sm mb-8">Você não tem permissão para acessar esta página.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-800 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
