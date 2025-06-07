import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Briefcase, Users, TrendingUp, Shield } from 'lucide-react'

export function HomePage() {
  const { user, profile } = useAuth()

  if (user && profile) {
    // Redirigir según el tipo de usuario
    if (profile.user_type === 'employer') {
      window.location.href = '/dashboard'
      return null
    } else {
      window.location.href = '/jobs'
      return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Encuentra tu{' '}
              <span className="text-blue-600">Trabajo Ideal</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              La plataforma profesional que conecta talento con oportunidades. 
              Más de 10,000 empleos disponibles con salarios en tiempo real en tu moneda preferida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
              >
                Registrarse como Aspirante
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Registrar Empresa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir EmpleosPro?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nuestra plataforma ofrece herramientas avanzadas para que encuentres 
              el trabajo perfecto o el candidato ideal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Miles de Empleos
              </h3>
              <p className="text-gray-600">
                Accede a una amplia variedad de oportunidades laborales en todas las industrias.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Salarios en Tiempo Real
              </h3>
              <p className="text-gray-600">
                Ve los salarios convertidos a tu moneda local con tasas de cambio actualizadas.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Red Profesional
              </h3>
              <p className="text-gray-600">
                Conecta con empleadores y profesionales de tu área de interés.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Proceso Seguro
              </h3>
              <p className="text-gray-600">
                Plataforma segura con verificación de empresas y protección de datos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-blue-200">Empleos Activos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">5,000+</div>
              <div className="text-blue-200">Empresas Registradas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">25,000+</div>
              <div className="text-blue-200">Profesionales</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">15+</div>
              <div className="text-blue-200">Monedas Soportadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Comienza tu búsqueda hoy!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Únete a miles de profesionales que ya encontraron su trabajo ideal 
            a través de nuestra plataforma.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
          >
            Crear Cuenta Gratuita
          </Link>
        </div>
      </div>
    </div>
  )
}