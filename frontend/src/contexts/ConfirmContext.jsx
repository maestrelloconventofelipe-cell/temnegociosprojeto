import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

const ConfirmContext = createContext(null)

function ConfirmModal({ title, message, danger, confirmText, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ animation: 'fadeUp 0.2s ease both' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4
                          ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
            {danger
              ? <Trash2 size={22} className="text-red-500" />
              : <AlertTriangle size={22} className="text-amber-500" />}
          </div>
          {title && <h3 className="text-base font-bold text-gray-800 mb-1.5">{title}</h3>}
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                       text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                       active:scale-95 transition-all shadow-sm
                       ${danger
                         ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                         : 'bg-blue-800 hover:bg-blue-700 shadow-blue-200'}`}>
            {confirmText ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmProvider({ children }) {
  const [modal, setModal] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setModal({ message, ...options })
    })
  }, [])

  function handle(result) {
    resolveRef.current?.(result)
    setModal(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <ConfirmModal
          {...modal}
          onConfirm={() => handle(true)}
          onCancel={() => handle(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm precisa estar dentro de ConfirmProvider')
  return ctx
}
