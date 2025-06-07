import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  supabase,
  AuthUser,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  getCurrentUser,
  updateUserProfile,
  resetPassword
} from '../lib/supabase'

export type Profile = {
  id: string
  email: string
  full_name: string
  user_type: 'applicant' | 'employer'
  phone?: string
  location?: string
  skills?: string[]
  experience?: string
  resume_url?: string
  company_name?: string
  company_description?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Función para cargar el perfil del usuario
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) setProfile(data)
    } catch (error) {
      console.error('Error al cargar el perfil:', error)
    }
  }

  // Efecto para verificar la sesión inicial
  useEffect(() => {
    const initialSession = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setIsAuthenticated(!!currentUser)
        
        if (currentUser) {
          await loadUserProfile(currentUser.id)
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error)
      } finally {
        setLoading(false)
      }
    }

    initialSession()

    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_ , session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setIsAuthenticated(!!currentUser)
        
        if (currentUser) {
          await loadUserProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    signUp: async (email: string, password: string, userData: Partial<Profile>) => {
      const { data: { user } } = await signUpWithEmail(email, password)
      if (user) {
        // Intenta crear el perfil, ignora error si ya existe
        try {
          await import('../lib/supabase').then(m => m.createUserProfile(user.id, email, userData))
        } catch (e: any) {
          if (!e.message?.includes('duplicate key')) throw e
        }
        await loadUserProfile(user.id)
      }
    },
    signIn: async (email: string, password: string) => {
      await signInWithEmail(email, password)
    },
    signOut: async () => {
      await supabaseSignOut()
      setProfile(null)
      setIsAuthenticated(false)
    },
    updateProfile: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('No hay usuario autenticado')
      await updateUserProfile(user.id, updates)
      await loadUserProfile(user.id)
    },
    resetPassword,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}