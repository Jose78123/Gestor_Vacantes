import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export function EmailConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">¡Correo confirmado!</h1>
        <p className="text-gray-600 mb-6">
          Tu correo electrónico ha sido verificado exitosamente. Ahora puedes iniciar sesión en la plataforma.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Ir a Iniciar Sesión
        </Link>
      </div>
    </div>
  )
}
