import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  const clearError = () => setError(null)

  // Función para cargar el perfil del usuario
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw profileError
      }

      if (!data) {
        throw new Error('No se encontró el perfil del usuario')
      }

      setProfile(data)
      setIsAuthenticated(true)

      // Redirigir solo si estamos en la página de login o registro
      const currentPath = window.location.pathname
      if (currentPath === '/login' || currentPath === '/register') {
        if (data.user_type === 'employer') {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/jobs', { replace: true })
        }
      }
    } catch (error: any) {
      console.error('Error al cargar el perfil:', error)
      setError(error.message || 'Error al cargar el perfil del usuario')
      if (error.status === 401 || error.status === 403) {
        await handleSignOut()
      }
    }
  }

  // Función para manejar el cierre de sesión
  const handleSignOut = async () => {
    try {
      await supabaseSignOut()
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)
      navigate('/login', { replace: true })
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error)
      setError(error.message || 'Error al cerrar sesión')
    }
  }

  // Efecto para escuchar cambios en la autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        const session = await getCurrentUser()
        
        if (session) {
          setUser(session)
          await loadUserProfile(session.id)
        } else {
          setUser(null)
          setProfile(null)
          setIsAuthenticated(false)
        }
      } catch (error: any) {
        console.error('Error al inicializar la autenticación:', error)
        setError(error.message || 'Error al cargar la sesión')
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [navigate])

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
        const { data: { user } } = await signInWithEmail(email, password)
        if (user) {
          await loadUserProfile(user.id)
        }
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
        setUser(null)
        setIsAuthenticated(false)
        navigate('/login', { replace: true })
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

  // Mostrar un indicador de carga mientras se verifica la sesión inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}