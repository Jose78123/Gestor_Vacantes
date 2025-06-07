import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { CurrencyConverter } from '../../components/CurrencyConverter'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MapPin,
  Briefcase,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  cover_letter?: string
  created_at: string
  job: {
    id: string
    title: string
    location: string
    salary: number
    currency: string
    job_type: string
    is_active: boolean
    employer: {
      company_name: string
    }
  }
}

export function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    loadApplications()
  }, [user])

  const loadApplications = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            location,
            salary,
            currency,
            job_type,
            is_active,
            profiles!jobs_employer_id_fkey (
              company_name
            )
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const applicationsWithJob = data.map(app => ({
        ...app,
        job: {
          ...app.jobs,
          employer: {
            company_name: app.jobs.profiles?.company_name || 'Empresa no especificada'
          }
        }
      }))

      setApplications(applicationsWithJob)
    } catch (error: any) {
      console.error('Error loading applications:', error)
      toast.error('Error al cargar postulaciones')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'accepted':
        return 'Aceptado'
      case 'rejected':
        return 'Rechazado'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getJobTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'full-time': 'Tiempo Completo',
      'part-time': 'Medio Tiempo',
      'contract': 'Contrato',
      'freelance': 'Freelance'
    }
    return types[type] || type
  }

  const filteredApplications = applications.filter(app => {
    if (selectedStatus === 'all') return true
    return app.status === selectedStatus
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mis Postulaciones
        </h1>
        <p className="text-gray-600">
          Historial completo de tus postulaciones a empleos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aceptadas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-600 hover:text-yellow-600'
            }`}
          >
            Pendientes ({stats.pending})
          </button>
          <button
            onClick={() => setSelectedStatus('accepted')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedStatus === 'accepted'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            Aceptadas ({stats.accepted})
          </button>
          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedStatus === 'rejected'
                ? 'bg-red-100 text-red-700'
                : 'text-gray-600 hover:text-red-600'
            }`}
          >
            Rechazadas ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Lista de postulaciones */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {selectedStatus === 'all' 
              ? 'No tienes postulaciones aún'
              : `No tienes postulaciones ${getStatusLabel(selectedStatus).toLowerCase()}`
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStatus === 'all' 
              ? 'Comienza explorando empleos disponibles.'
              : 'Prueba cambiando el filtro para ver otras postulaciones.'
            }
          </p>
          {selectedStatus === 'all' && (
            <div className="mt-6">
              <Link
                to="/jobs"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Ver Empleos Disponibles
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Link
                        to={`/jobs/${application.job.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {application.job.title}
                      </Link>
                      {!application.job.is_active && (
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center mb-2">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 font-medium">
                        {application.job.employer.company_name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {application.job.location}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {getJobTypeLabel(application.job.job_type)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Postulado el {format(new Date(application.created_at), 'dd MMMM yyyy', { locale: es })}
                    </div>
                  </div>

                  <div className="text-right space-y-3">
                    <CurrencyConverter
                      amount={application.job.salary}
                      baseCurrency={application.job.currency}
                    />
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="ml-2">{getStatusLabel(application.status)}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/jobs/${application.job.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Empleo
                      </Link>
                    </div>
                  </div>
                </div>

                {application.cover_letter && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Carta de Presentación:
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {application.cover_letter}
                    </p>
                  </div>
                )}

                {application.status === 'accepted' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">
                          ¡Felicitaciones!
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          Tu postulación ha sido aceptada. El empleador debería contactarte pronto 
                          con los siguientes pasos del proceso.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {application.status === 'rejected' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          Postulación no seleccionada
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          Lamentablemente, no fuiste seleccionado para esta posición. 
                          ¡Sigue postulándote a otros empleos!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}