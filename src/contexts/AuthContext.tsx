import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Mock users for testing when Supabase is not configured
const mockUsers = [
  {
    id: '1',
    email: 'admin@parnaioca.com',
    password: 'admin123',
    user_metadata: { name: 'Administrador' }
  },
  {
    id: '2', 
    email: 'funcionario@parnaioca.com',
    password: 'func123',
    user_metadata: { name: 'Funcionário' }
  }
]

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Don't attempt auth operations if Supabase is not configured
    if (!supabase) {
      // Set mock user as logged out initially
      setUser(null)
      setSession(null)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.email === 'admin@parnaioca.com')
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsAdmin(session?.user?.email === 'admin@parnaioca.com')
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      // Mock authentication when Supabase is not configured
      const mockUser = mockUsers.find(u => u.email === email && u.password === password)
      
      if (mockUser) {
        const mockSession = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: mockUser.id,
            email: mockUser.email,
            user_metadata: mockUser.user_metadata,
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        } as Session
        
        setSession(mockSession)
        setUser(mockSession.user as User)
        setIsAdmin(mockUser.email === 'admin@parnaioca.com')
        
        return { data: { user: mockSession.user, session: mockSession }, error: null }
      } else {
        return { data: null, error: { message: 'Email ou senha incorretos' } }
      }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    if (!supabase) {
      // Mock sign out
      setSession(null)
      setUser(null)
      setIsAdmin(false)
      return
    }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}