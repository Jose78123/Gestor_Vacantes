import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { CurrencyConverter } from '../../components/CurrencyConverter'
import { MapPin, Clock, Briefcase, Search, Filter, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Job {
  id: string
  title: string
  description: string
  requirements: string
  location: string
  salary: number
  currency: string
  job_type: string
  is_active: boolean
  created_at: string
  benefits?: string
  experience_level: 'entry' | 'mid' | 'senior' | 'lead'
  remote_work: boolean
  employer: {
    company_name: string
  }
}

export function JobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('')
  const [remoteWorkFilter, setRemoteWorkFilter] = useState<boolean | ''>('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles!jobs_employer_id_fkey (
            company_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const jobsWithEmployer = data.map(job => ({
        ...job,
        employer: {
          company_name: job.employer?.company_name || 'Empresa no especificada'
        }
      }))

      setJobs(jobsWithEmployer)
    } catch (error: any) {
      console.error('Error loading jobs:', error)
      setError('No se pudieron cargar los empleos. Por favor, verifica tu conexión e intenta de nuevo.')
      toast.error('Error al cargar empleos')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.employer.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = !locationFilter || 
                           job.location.toLowerCase().includes(locationFilter.toLowerCase())
    
    const matchesJobType = !jobTypeFilter || job.job_type === jobTypeFilter

    const matchesExperienceLevel = !experienceLevelFilter || 
                                 job.experience_level === experienceLevelFilter

    const matchesRemoteWork = remoteWorkFilter === '' || 
                             job.remote_work === remoteWorkFilter

    return matchesSearch && 
           matchesLocation && 
           matchesJobType && 
           matchesExperienceLevel && 
           matchesRemoteWork
  })

  const getJobTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'full-time': 'Tiempo Completo',
      'part-time': 'Medio Tiempo',
      'contract': 'Contrato',
      'freelance': 'Freelance'
    }
    return types[type] || type
  }

  const getExperienceLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      'entry': 'Principiante',
      'mid': 'Intermedio',
      'senior': 'Senior',
      'lead': 'Líder'
    }
    return levels[level] || level
  }


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{error}</h2>
          <button
            onClick={() => loadJobs()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar empleos por título, descripción o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                placeholder="Filtrar por ubicación"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de empleo
              </label>
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="full-time">Tiempo Completo</option>
                <option value="part-time">Medio Tiempo</option>
                <option value="contract">Contrato</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de experiencia
              </label>
              <select
                value={experienceLevelFilter}
                onChange={(e) => setExperienceLevelFilter(e.target.value)}
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="entry">Principiante</option>
                <option value="mid">Intermedio</option>
                <option value="senior">Senior</option>
                <option value="lead">Líder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trabajo remoto
              </label>
              <select
                value={String(remoteWorkFilter)}
                onChange={(e) => setRemoteWorkFilter(e.target.value === '' ? '' : e.target.value === 'true')}
                className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Job listings */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No se encontraron empleos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-gray-600 mt-1">{job.employer.company_name}</p>
                </div>
                <div className="text-right">
                  <CurrencyConverter amount={job.salary} baseCurrency={job.currency} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center text-gray-500">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{job.location}</span>
                  {job.remote_work && <span className="ml-1">(Remoto)</span>}
                </div>
                <div className="flex items-center text-gray-500">
                  <Briefcase className="h-5 w-5 mr-1" />
                  <span>{getJobTypeLabel(job.job_type)}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-5 w-5 mr-1" />
                  <span>{format(new Date(job.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
                {job.experience_level && (
                  <div className="text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                      {getExperienceLevelLabel(job.experience_level)}
                    </span>
                  </div>
                )}
              </div>

              {job.benefits && (
                <div className="mt-4">
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Beneficios:</span> {job.benefits}
                  </p>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}