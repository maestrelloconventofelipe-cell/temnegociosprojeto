import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')

    async function carregarSessao() {
      if (!token) {
        if (ativo) setLoading(false)
        return
      }

      if (stored) {
        try {
          if (ativo) setUser(JSON.parse(stored))
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (ativo) {
            setUser(null)
            setLoading(false)
          }
          return
        }
      }

      try {
        const { data } = await api.get('/auth/me')
        if (!ativo) return
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
      } catch (err) {
        if (!ativo) return
        const status = err?.response?.status
        if (status === 401 || status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregarSessao()

    return () => { ativo = false }
  }, [])

  function login(token, userData) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
