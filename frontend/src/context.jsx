import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)
const ToastContext = createContext(() => {})

export const useAuth = () => useContext(AuthContext)
export const useToast = () => useContext(ToastContext)

export function Providers({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000) // popup disappears after 5s
  }, [])

  useEffect(() => {
    api('/auth/me/').then((d) => setUser(d.user)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const d = await api('/auth/login/', { method: 'POST', body: { email, password } })
    setUser(d.user)
    return d.user
  }
  const logout = async () => {
    await api('/auth/logout/', { method: 'POST' })
    setUser(null)
  }

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      <ToastContext.Provider value={toast}>
        {children}
        <div className="fixed top-20 left-4 lg:top-2.5 lg:left-[19rem] z-[100] space-y-2 w-[min(92vw,20rem)]">
          {toasts.map((t) => (
            <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-medium border shadow-lg ${colors[t.type]}`}>
              {t.message}
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  )
}
