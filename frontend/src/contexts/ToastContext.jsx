import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const DURATION = 4000

const TIPOS = {
  success: { Icon: CheckCircle2, iconCor: 'text-green-500', bar: 'bg-green-400', border: 'border-green-100' },
  error:   { Icon: XCircle,      iconCor: 'text-red-500',   bar: 'bg-red-400',   border: 'border-red-100'   },
  warning: { Icon: AlertTriangle,iconCor: 'text-amber-500', bar: 'bg-amber-400', border: 'border-amber-100' },
  info:    { Icon: Info,         iconCor: 'text-blue-500',  bar: 'bg-blue-400',  border: 'border-blue-100'  },
}

function ToastItem({ id, message, type, onDismiss }) {
  const cfg = TIPOS[type] ?? TIPOS.info
  const { Icon } = cfg

  return (
    <div className={`relative flex items-start gap-3 w-80 bg-white border ${cfg.border}
                    rounded-2xl shadow-xl shadow-gray-200/60 p-4 overflow-hidden`}
      style={{ animation: 'slideInRight 0.3s ease both' }}>
      <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconCor}`} />
      <p className="flex-1 text-sm text-gray-700 font-medium leading-snug">{message}</p>
      <button onClick={() => onDismiss(id)}
        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 -mt-0.5 -mr-0.5 p-0.5 rounded-lg hover:bg-gray-100">
        <X size={13} />
      </button>
      <div className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        style={{ animation: `shrinkBar ${DURATION}ms linear forwards` }} />
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), DURATION + 300)
  }, [])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider')
  return ctx
}
