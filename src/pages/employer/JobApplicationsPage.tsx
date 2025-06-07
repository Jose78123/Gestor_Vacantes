import { useState, useEffect } from 'react'
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
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

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
      console.error('Error loading job and applications:', error)
      toast.error('Error al cargar las postulaciones')
      navigate('/employer/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: Application['status']) => {
    if (updating) return

    try {
      setUpdating(true)
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      // Update local state
      setApplications(apps =>
        apps.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      )

      toast.success(
        newStatus === 'accepted'
          ? 'Candidato aceptado exitosamente'
          : 'Candidato rechazado exitosamente'
      )
    } catch (error: any) {
      console.error('Error updating application:', error)
      toast.error('Error al actualizar el estado de la postulación')
    } finally {
      setUpdating(false)
    }
  }

  const toggleApplicantDetails = (applicationId: string) => {
    setExpandedApplicationId(
      expandedApplicationId === applicationId ? null : applicationId
    )
  }




  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  }

  const filteredApplications = applications.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!job) {
    navigate('/employer/dashboard')
    return null
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver al panel
        </button>
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <div className="flex items-center mt-2 text-gray-500">
            <MapPin className="h-5 w-5 mr-2" />
            {job.location}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Postulaciones</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Aceptadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.accepted}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rechazadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.rejected}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-wrap items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Postulaciones ({filteredApplications.length})
            </h3>
            <div className="mt-3 sm:mt-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="accepted">Aceptadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Lista de postulaciones */}
        <div className="divide-y divide-gray-200">
          {/* Applications list header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Candidato</div>
            <div className="col-span-2">Ubicación</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-3">Acciones</div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 text-lg">No hay postulaciones que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className="px-6 py-6">
                <div className="sm:grid sm:grid-cols-12 sm:gap-4">
                  {/* Candidate info */}
                  <div className="col-span-3 mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{application.applicant.full_name}</div>
                        <div className="text-gray-500 text-sm truncate">
                          <a href={`mailto:${application.applicant.email}`} className="hover:text-blue-600">
                            {application.applicant.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-span-2 flex items-center text-gray-500 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {application.applicant.location || 'No especificada'}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center text-gray-500 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {format(new Date(application.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {application.status === 'pending'
                        ? 'Pendiente'
                        : application.status === 'accepted'
                        ? 'Aceptada'
                        : 'Rechazada'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center space-x-3 mt-4 sm:mt-0">
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'accepted')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aceptar
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleApplicantDetails(application.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ver detalles
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expandedApplicationId === application.id && (
                    <div className="col-span-12 mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {application.applicant.phone && (
                          <div className="flex items-center text-gray-500">
                            <Phone className="h-5 w-5 mr-2" />
                            <a href={`tel:${application.applicant.phone}`} className="hover:text-blue-600">
                              {application.applicant.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center text-gray-500">
                          <Mail className="h-5 w-5 mr-2" />
                          <a href={`mailto:${application.applicant.email}`} className="hover:text-blue-600">
                            {application.applicant.email}
                          </a>
                        </div>
                      </div>

                      {application.applicant.skills && application.applicant.skills.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Habilidades</h4>
                          <div className="flex flex-wrap gap-2">
                            {application.applicant.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {application.applicant.experience && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Experiencia</h4>
                          <p className="text-sm text-gray-600">{application.applicant.experience}</p>
                        </div>
                      )}

                      {application.cover_letter && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Carta de presentación</h4>
                          <p className="text-sm text-gray-600">{application.cover_letter}</p>
                        </div>
                      )}

                      {application.applicant.resume_url && (
                        <div className="mt-4">
                          <a
                            href={application.applicant.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Ver CV
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}