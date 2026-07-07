import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/authApi'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getUser())
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user && !!storage.getAccessToken()

  const setAuthData = useCallback((authResponse) => {
    storage.setAuth({
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
      user: authResponse.user,
    })
    setUser(authResponse.user)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    setAuthData(data.data)
    return data.data
  }, [setAuthData])

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload)
    setAuthData(data.data)
    return data.data
  }, [setAuthData])

  const logout = useCallback(async () => {
    const refreshToken = storage.getRefreshToken()
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } finally {
      storage.clearAuth()
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.getMe()
    const updatedUser = data.data
    const refreshToken = storage.getRefreshToken()
    const accessToken = storage.getAccessToken()
    if (refreshToken && accessToken) {
      storage.setAuth({ accessToken, refreshToken, user: updatedUser })
    }
    setUser(updatedUser)
    return updatedUser
  }, [])

  useEffect(() => {
    const init = async () => {
      if (!storage.getAccessToken()) {
        setLoading(false)
        return
      }
      try {
        await refreshUser()
      } catch {
        storage.clearAuth()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [refreshUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, isAuthenticated, login, register, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
