import { useEffect, useRef, useCallback } from 'react'

const INATIVO_MS  = 3 * 60 * 1000        // 3 minutos → logout
const AVISO_MS    = INATIVO_MS - 30_000   // 2:30 → exibe aviso

const EVENTOS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown']

export function useIdleTimer({ onAviso, onLogout, ativo = true }) {
  const timerLogout = useRef(null)
  const timerAviso  = useRef(null)

  const limpar = useCallback(() => {
    clearTimeout(timerLogout.current)
    clearTimeout(timerAviso.current)
  }, [])

  const resetar = useCallback(() => {
    limpar()
    timerAviso.current  = setTimeout(onAviso,  AVISO_MS)
    timerLogout.current = setTimeout(onLogout, INATIVO_MS)
  }, [onAviso, onLogout, limpar])

  useEffect(() => {
    if (!ativo) { limpar(); return }
    EVENTOS.forEach(e => window.addEventListener(e, resetar, { passive: true }))
    resetar()
    return () => {
      EVENTOS.forEach(e => window.removeEventListener(e, resetar))
      limpar()
    }
  }, [ativo, resetar, limpar])

  // Ao voltar para a aba, checa se o tempo já passou
  useEffect(() => {
    if (!ativo) return
    const onVisivel = () => { if (document.visibilityState === 'visible') resetar() }
    document.addEventListener('visibilitychange', onVisivel)
    return () => document.removeEventListener('visibilitychange', onVisivel)
  }, [ativo, resetar])
}
