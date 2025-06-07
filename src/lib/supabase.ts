import { createClient, AuthResponse, User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos específicos para el manejo de usuarios
export type AuthUser = User
export type AuthSession = {
  user: AuthUser | null
  error: Error | null
}

// Funciones de autenticación mejoradas
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: { [key: string]: any }
): Promise<AuthResponse> => {
  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  if (response.error) throw response.error
  return response
}

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await supabase.auth.signInWithPassword({ email, password })
  if (response.error) throw response.error
  return response
}

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Funciones de gestión de sesión
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentSession = async (): Promise<AuthSession> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return { user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

// Funciones de actualización de perfil
export const updateUserProfile = async (
  userId: string,
  updates: { [key: string]: any }
) => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  
  if (error) throw error
}

// Función para recuperación de contraseña
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

// Suscripción a cambios de autenticación
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange((_, session) => {
    callback(session?.user ?? null)
  })
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          employer_id: string
          title: string
          description: string
          requirements: string
          location: string
          salary: number
          currency: string
          job_type: 'full-time' | 'part-time' | 'contract' | 'freelance'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          cover_letter?: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
    }
  }
}