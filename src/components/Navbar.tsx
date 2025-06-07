import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, User, LogOut, Home, FileText, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada exitosamente')
      navigate('/')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">EmpleosPro</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && profile ? (
              <>
                <Link
                  to={profile.user_type === 'employer' ? '/dashboard' : '/jobs'}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(profile.user_type === 'employer' ? '/dashboard' : '/jobs')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className="h-4 w-4 inline mr-2" />
                  Inicio
                </Link>

                {profile.user_type === 'applicant' && (
                  <>
                    <Link
                      to="/jobs"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/jobs')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Briefcase className="h-4 w-4 inline mr-2" />
                      Empleos
                    </Link>
                    <Link
                      to="/applications"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/applications')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <FileText className="h-4 w-4 inline mr-2" />
                      Mis Postulaciones
                    </Link>
                  </>
                )}

                {profile.user_type === 'employer' && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/dashboard')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <Building2 className="h-4 w-4 inline mr-2" />
                      Dashboard
                    </Link>
                  </>
                )}

                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Perfil
                </Link>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 inline mr-2" />
                  Cerrar Sesión
                </button>

                <div className="pl-3 border-l border-gray-200">
                  <span className="text-sm text-gray-600">
                    {profile.full_name}
                  </span>
                  <div className="text-xs text-gray-500 capitalize">
                    {profile.user_type === 'applicant' ? 'Aspirante' : 'Empleador'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}