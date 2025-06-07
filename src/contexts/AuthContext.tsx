import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  supabase,
  AuthUser,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
  getCurrentUser,
  updateUserProfile,
  resetPassword,
  createUserProfile
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
  error: string | null
  isAuthenticated: boolean
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
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
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const clearError = () => setError(null)

  // Función para cargar el perfil del usuario con mejor manejo de errores
  const loadUserProfile = async (userId: string) => {
    try {
      setLoading(true)
      clearError()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }
      
      if (!data) {
        throw new Error('No se encontró el perfil del usuario')
      }
      
      setProfile(data)
    } catch (error: any) {
      console.error('Error al cargar el perfil:', error)
      setError(error.message || 'Error al cargar el perfil del usuario')
      // Si hay un error al cargar el perfil, no deberíamos mantener una sesión inválida
      if (error.status === 401 || error.status === 403) {
        await supabaseSignOut()
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  // Efecto para verificar la sesión inicial
  useEffect(() => {
    const initialSession = async () => {
      try {
        setLoading(true)
        clearError()
        
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setIsAuthenticated(!!currentUser)
        
        if (currentUser) {
          await loadUserProfile(currentUser.id)
        }
      } catch (error: any) {
        console.error('Error al verificar la sesión:', error)
        setError(error.message || 'Error al verificar la sesión')
        // Si hay un error de sesión, limpiamos todo
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    initialSession()

    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          clearError()
          const currentUser = session?.user ?? null
          setUser(currentUser)
          setIsAuthenticated(!!currentUser)
          
          if (currentUser) {
            await loadUserProfile(currentUser.id)
          } else {
            setProfile(null)
          }
        } catch (error: any) {
          console.error('Error en el cambio de estado de autenticación:', error)
          setError(error.message || 'Error en la autenticación')
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    signUp: async (email: string, password: string, userData: Partial<Profile>) => {
      try {
        setLoading(true)
        clearError()
        const { data: { user } } = await signUpWithEmail(email, password)
        if (user) {
          try {
            await createUserProfile(user.id, email, userData)
          } catch (e: any) {
            if (!e.message?.includes('duplicate key')) throw e
          }
          await loadUserProfile(user.id)
        }
      } catch (error: any) {
        console.error('Error en el registro:', error)
        setError(error.message || 'Error al registrar el usuario')
        throw error
      } finally {
        setLoading(false)
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        setLoading(true)
        clearError()
        await signInWithEmail(email, password)
      } catch (error: any) {
        console.error('Error en el inicio de sesión:', error)
        setError(error.message || 'Error al iniciar sesión')
        throw error
      } finally {
        setLoading(false)
      }
    },
    signOut: async () => {
      try {
        setLoading(true)
        clearError()
        await supabaseSignOut()
        setProfile(null)
        setIsAuthenticated(false)
      } catch (error: any) {
        console.error('Error al cerrar sesión:', error)
        setError(error.message || 'Error al cerrar sesión')
      } finally {
        setLoading(false)
      }
    },
    updateProfile: async (updates: Partial<Profile>) => {
      try {
        setLoading(true)
        clearError()
        if (!user) throw new Error('No hay usuario autenticado')
        await updateUserProfile(user.id, updates)
        await loadUserProfile(user.id)
      } catch (error: any) {
        console.error('Error al actualizar el perfil:', error)
        setError(error.message || 'Error al actualizar el perfil')
        throw error
      } finally {
        setLoading(false)
      }
    },
    resetPassword,
    refreshProfile: async () => {
      if (user) {
        await loadUserProfile(user.id)
      }
    },
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}