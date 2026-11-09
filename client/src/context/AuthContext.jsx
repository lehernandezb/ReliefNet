import { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On page load, restore the session if a token is saved
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    const { token, user } = await api.post('/auth/login', { username, password })
    tokenStore.set(token)
    setUser(user)
    return user
  }

  async function register(form) {
    const { token, user } = await api.post('/auth/register', form)
    tokenStore.set(token)
    setUser(user)
    return user
  }

  function logout() {
    tokenStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext)

/** Where each role lands after logging in */
// oxlint-disable-next-line react/only-export-components
export const HOME_BY_ROLE = {
  Admin: '/admin',
  Dispatcher: '/dispatcher',
  Client: '/client',
}
