import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Check, 
  X, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  cover_letter?: string
  created_at: string
  applicant: {
    id: string
    full_name: string
    email: string
    phone?: string
    location?: string
    skills?: string[]
    experience?: string
    resume_url?: string
  }
}

interface Job {
  id: string
  title: string
  location: string
  employer_id: string
}

export function JobApplicationsPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    if (jobId) {
      loadJobAndApplications()
    }
  }, [jobId, user])

  const loadJobAndApplications = async () => {
    if (!user || !jobId) return

    try {
      // Cargar información del empleo
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, location, employer_id')
        .eq('id', jobId)
        .eq('employer_id', user.id)
        .single()

      if (jobError) throw jobError
      setJob(jobData)

      // Cargar postulaciones con información del candidato
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          profiles!applications_applicant_id_fkey (
            id,
            full_name,
            email,
            phone,
            location,
            skills,
            experience,
            resume_url
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (applicationsError) throw applicationsError

      const applicationsWithApplicant = applicationsData.map(app => ({
        ...app,
        applicant: {
          id: app.profiles.id,
          full_name: app.profiles.full_name,
          email: app.profiles.email,
          phone: app.profiles.phone,
          location: app.profiles.location,
          skills: app.profiles.skills,
          experience: app.profiles.experience,
          resume_url: app.profiles.resume_url,
        }
      }))

      setApplications(applicationsWithApplicant)
    } catch (error: any) {
      console.error('Error loading job applications:', error)
      toast.error('Error al cargar postulaciones')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      setApplications(applications.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus }
          : app
      ))

      toast.success(`Postulación ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'} exitosamente`)
    } catch (error: any) {
      toast.error('Error al actualizar estado de la postulación')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'accepted':
        return <Check className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />
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
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Empleo no encontrado</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Postulaciones para: {job.title}
        </h1>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          {job.location}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600" />
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
            <Check className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aceptadas</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.accepted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <X className="h-8 w-8 text-red-600" />
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
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {selectedStatus === 'all' 
              ? 'No hay postulaciones aún'
              : `No hay postulaciones ${getStatusLabel(selectedStatus).toLowerCase()}`
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStatus === 'all' 
              ? 'Los candidatos comenzarán a postularse pronto.'
              : 'Prueba cambiando el filtro para ver otras postulaciones.'
            }
          </p>
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
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {application.applicant.full_name}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-2">{getStatusLabel(application.status)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <a 
                          href={`mailto:${application.applicant.email}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {application.applicant.email}
                        </a>
                      </div>
                      
                      {application.applicant.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <a 
                            href={`tel:${application.applicant.phone}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {application.applicant.phone}
                          </a>
                        </div>
                      )}
                      
                      {application.applicant.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {application.applicant.location}
                        </div>
                      )}
                    </div>

                    {application.applicant.skills && application.applicant.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Habilidades:</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.applicant.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {application.applicant.experience && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Experiencia:</h4>
                        <p className="text-gray-700 text-sm whitespace-pre-line">
                          {application.applicant.experience}
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Postulado el {format(new Date(application.created_at), 'dd MMMM yyyy', { locale: es })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {application.applicant.resume_url && (
                      <a
                        href={application.applicant.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Ver CV</span>
                      </a>
                    )}

                    {application.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'accepted')}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <Check className="h-4 w-4" />
                          <span>Aceptar</span>
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {application.cover_letter && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center mb-2">
                      <FileText className="h-4 w-4 text-gray-600 mr-2" />
                      <h4 className="text-sm font-medium text-gray-900">
                        Carta de Presentación:
                      </h4>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {application.cover_letter}
                    </p>
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