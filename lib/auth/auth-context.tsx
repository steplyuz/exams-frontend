'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { examsAuthApi } from '@/lib/api/endpoints'
import type { ExamsMe } from '@/lib/api/types'

interface AuthContextValue {
  user: ExamsMe | null
  isLoading: boolean
  isAuthenticated: boolean
  homeUrl: string
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// AuthProvider can be mounted/re-run during React Strict Mode and several
// layouts/components can subscribe at once. Keep one in-flight request and a
// short cache so a page never fires a /exams-auth/me request per consumer.
//
// MUHIM: bu APP FAQAT exams-auth (MK ID + SMS OTP) orqali autentifikatsiya
// qiladi — asosiy Steply `/users/me/` bu yerda ISHLATILMAYDI (butunlay
// mustaqil, mos kelmaydigan cookie/JWT domeni).
let mePromise: Promise<ExamsMe | null> | null = null
let cachedMe: ExamsMe | null = null
let cacheAt = 0
const CACHE_MS = 15_000

function invalidateAuthCache() {
  cachedMe = null
  cacheAt = 0
}

async function loadMe(force = false): Promise<ExamsMe | null> {
  const now = Date.now()
  if (!force && now - cacheAt < CACHE_MS) return cachedMe
  if (mePromise) return mePromise

  mePromise = examsAuthApi.me()
    .then((me) => {
      cachedMe = me
      cacheAt = Date.now()
      return me
    })
    .catch(() => {
      cachedMe = null
      cacheAt = Date.now()
      return null
    })
    .finally(() => {
      mePromise = null
    })

  return mePromise
}

export function homeUrlForRole(_role?: string | null): string {
  return '/exams'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExamsMe | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async (force = false) => {
    const me = await loadMe(force)
    setUser(me)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void load()

    const onChange = () => {
      invalidateAuthCache()
      void load(true)
    }

    window.addEventListener('steply:auth-changed', onChange)
    return () => window.removeEventListener('steply:auth-changed', onChange)
  }, [load])

  const logout = useCallback(async () => {
    try {
      await examsAuthApi.logout()
    } finally {
      invalidateAuthCache()
      setUser(null)
    }
  }, [])

  const homeUrl = homeUrlForRole()

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      homeUrl,
      refresh: () => load(true),
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return ctx
}
