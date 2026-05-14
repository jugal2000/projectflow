import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { authApi } from '../services/api'
import { setToken } from '../services/axios'
import type { User } from '../types'

// ── DEFINE WHAT THE CONTEXT HOLDS ────────────────────────────────
// Any component that calls useAuth() gets all of these

interface AuthContextValue {
  user: User | null           // The logged-in user, or null if not logged in
  isLoading: boolean          // True while we check if user is already logged in
  isAuthenticated: boolean    // Shortcut: true if user is not null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>
  logout: () => Promise<void>
}

// createContext creates the context with null as default value
const AuthContext = createContext<AuthContextValue | null>(null)

// ── TOKEN STORAGE KEY ─────────────────────────────────────────────
// We use sessionStorage as a compromise between security and convenience
// sessionStorage: cleared when browser tab is closed (safer than localStorage)
const TOKEN_KEY = 'pf_token'

// ── AUTH PROVIDER ─────────────────────────────────────────────────
// This component wraps the entire app and provides auth to all children

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Start as true because we haven't checked yet

  // ── CHECK IF USER IS ALREADY LOGGED IN ────────────────────────
  // When the page loads (or refreshes), check if there's a saved token
  // and if so, fetch the user data automatically

  const initSession = useCallback(async () => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY)

    if (!savedToken) {
      // No saved token — user is not logged in
      setIsLoading(false)
      return
    }

    // There's a saved token — try to use it
    setToken(savedToken)  // Put it in memory so axios will use it

    try {
      const res = await authApi.me()  // Ask the API "who am I?"
      setUser(res.data.data)           // Save the user data
    } catch {
      // Token was invalid (expired, deleted, etc.) — clear it
      sessionStorage.removeItem(TOKEN_KEY)
      setToken(null)
    } finally {
      setIsLoading(false)  // Done checking, regardless of outcome
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(initSession)

    // Listen for the auto-logout event from our axios interceptor
    // When a 401 response comes in, axios fires this event
    const handleAutoLogout = () => {
      setUser(null)
      sessionStorage.removeItem(TOKEN_KEY)
    }

    window.addEventListener('auth:logout', handleAutoLogout)

    // Cleanup: remove the event listener when the component unmounts
    return () => window.removeEventListener('auth:logout', handleAutoLogout)
  }, [initSession])

  // ── LOGIN FUNCTION ────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<void> => {
    const res = await authApi.login({ email, password })
    const { token, user: userData } = res.data.data

    // Save the token in 2 places:
    // 1. In memory (axios will use this for requests)
    // 2. In sessionStorage (survives page refresh)
    setToken(token)
    sessionStorage.setItem(TOKEN_KEY, token)

    setUser(userData)
  }

  // ── REGISTER FUNCTION ─────────────────────────────────────────
  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<void> => {
    const res = await authApi.register({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    const { token, user: userData } = res.data.data

    setToken(token)
    sessionStorage.setItem(TOKEN_KEY, token)
    setUser(userData)
  }

  // ── LOGOUT FUNCTION ───────────────────────────────────────────
  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()  // Tell the server to delete the token
    } catch {
      // Even if the API call fails, we still log out locally
    } finally {
      setToken(null)
      sessionStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,  // !! converts to boolean: null → false, object → true
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── useAuth HOOK ──────────────────────────────────────────────────
// This is how components access the auth context
// Usage: const { user, login, logout } = useAuth()

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)

  // If someone uses useAuth() outside of AuthProvider, throw a helpful error
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }

  return ctx
}