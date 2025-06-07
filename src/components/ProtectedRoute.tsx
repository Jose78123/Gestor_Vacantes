import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loading } from './Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: 'applicant' | 'employer'
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, profile, loading, error } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading message="Verificando autenticación..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error de autenticación</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/login"
            state={{ from: location }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!profile) {
    return <Loading message="Cargando perfil de usuario..." />
  }

  if (requiredUserType && profile.user_type !== requiredUserType) {
    return (
      <Navigate 
        to={profile.user_type === 'employer' ? '/dashboard' : '/jobs'} 
        replace 
      />
    )
  }

  return <>{children}</>
}