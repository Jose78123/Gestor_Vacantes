import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { CurrencyConverter } from '../../components/CurrencyConverter'
import { MapPin, Clock, Briefcase, Search, Filter } from 'lucide-react'
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
  employer: {
    company_name: string
  }
}

export function JobsPage() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles!jobs_employer_id_fkey (
            company_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const jobsWithEmployer = data.map(job => ({
        ...job,
        employer: {
          company_name: job.profiles?.company_name || 'Empresa no especificada'
        }
      }))

      setJobs(jobsWithEmployer)
    } catch (error: any) {
      console.error('Error loading jobs:', error)
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

    return matchesSearch && matchesLocation && matchesJobType
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-48"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Empleos Disponibles
        </h1>
        <p className="text-gray-600">
          {filteredJobs.length} empleo{filteredJobs.length !== 1 ? 's' : ''} encontrado{filteredJobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar empleos, empresas o palabras clave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ciudad, país..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Empleo
                </label>
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="full-time">Tiempo Completo</option>
                  <option value="part-time">Medio Tiempo</option>
                  <option value="contract">Contrato</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || locationFilter || jobTypeFilter
              ? 'Prueba ajustando tus filtros de búsqueda.'
              : 'Vuelve más tarde para ver nuevas oportunidades.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 font-medium mb-2">
                      {job.employer.company_name}
                    </p>
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
                        {format(new Date(job.created_at), 'dd MMMM yyyy', { locale: es })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-2">
                      <CurrencyConverter
                        amount={job.salary}
                        baseCurrency={job.currency}
                        className="text-right"
                      />
                    </div>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ver Detalles
                    </Link>
                  </div>
                </div>
                
                <p className="text-gray-600 line-clamp-3">
                  {job.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}