import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { CurrencyConverter } from '../../components/CurrencyConverter'
import { 
  Plus, 
  Briefcase, 
  Users, 
  Eye, 
  Edit, 
  MoreVertical,
  MapPin,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Job {
  id: string
  title: string
  description: string
  location: string
  salary: number
  currency: string
  job_type: string
  is_active: boolean
  created_at: string
  // application_count se calcula después
  application_count?: number
  applications?: Application[]
}

interface Application {
  id: string
  job_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  })

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Cargar empleos con postulaciones anidadas
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          applications (
            id,
            job_id,
            status,
            created_at
          )
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      // jobsData puede ser null
      const jobsWithCounts: Job[] = (jobsData || []).map((job: any) => ({
        ...job,
        application_count: job.applications ? job.applications.length : 0,
      }))

      const activeJobs = jobsWithCounts.filter((job: Job) => job.is_active).length
      const allApplications = jobsWithCounts.flatMap((job: Job) => job.applications || [])
      const pendingApplications = allApplications.filter((app: Application) => app.status === 'pending').length
      const totalApplications = allApplications.length

      setJobs(jobsWithCounts)

      // Calcular estadísticas
      const totalJobs = jobsWithCounts.length

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications
      })

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      toast.error('Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !currentStatus })
        .eq('id', jobId)

      if (error) throw error

      setJobs(jobs.map(job => 
        job.id === jobId 
          ? { ...job, is_active: !currentStatus }
          : job
      ))

      toast.success(`Empleo ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
      
      // Actualizar estadísticas
      if (!currentStatus) {
        setStats(prev => ({ ...prev, activeJobs: prev.activeJobs + 1 }))
      } else {
        setStats(prev => ({ ...prev, activeJobs: prev.activeJobs - 1 }))
      }
    } catch (error: any) {
      toast.error('Error al actualizar estado del empleo')
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-24"></div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow h-64"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard de Empleador
            </h1>
            <p className="text-gray-600">
              Bienvenido, {profile?.full_name}
            </p>
            {profile && (profile as Profile).company_name && (
              <p className="text-gray-500">{(profile as Profile).company_name}</p>
            )}
          </div>
          <Link
            to="/dashboard/jobs/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Publicar Empleo</span>
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Empleos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empleos Activos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Postulaciones</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApplications}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de empleos */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Mis Empleos Publicados</h2>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No has publicado empleos aún
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza publicando tu primer empleo para atraer candidatos.
            </p>
            <div className="mt-6">
              <Link
                to="/dashboard/jobs/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Publicar Primer Empleo
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {job.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {getJobTypeLabel(job.job_type)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(job.created_at), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {job.application_count} postulacion{job.application_count !== 1 ? 'es' : ''}
                      </div>
                    </div>

                    <p className="text-gray-600 line-clamp-2 mb-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="text-right space-y-3">
                    <CurrencyConverter
                      amount={job.salary}
                      baseCurrency={job.currency}
                    />

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/dashboard/jobs/${job.id}/applications`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Postulaciones
                        {(job.application_count ?? 0) > 0 && (
                          <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {job.application_count ?? 0}
                          </span>
                        )}
                      </Link>

                      <div className="relative group">
                        <button className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver como candidato
                          </Link>
                          <Link
                            to={`/dashboard/jobs/${job.id}/edit`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar empleo
                          </Link>
                          <button
                            onClick={() => toggleJobStatus(job.id, job.is_active)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {job.is_active ? 'Desactivar' : 'Activar'} empleo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  company_name?: string
  // ...other properties
}