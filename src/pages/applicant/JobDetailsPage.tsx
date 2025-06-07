import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { CurrencyConverter } from '../../components/CurrencyConverter'
import { MapPin, Clock, Briefcase, Building2, ArrowLeft, Send, FileText } from 'lucide-react'
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
    company_description?: string
  }
}

const applicationSchema = z.object({
  cover_letter: z.string().optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  useEffect(() => {
    if (id) {
      loadJobDetails()
      checkApplicationStatus()
    }
  }, [id, user])

  const loadJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles!jobs_employer_id_fkey (
            company_name,
            company_description
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) throw error

      const jobWithEmployer = {
        ...data,
        employer: {
          company_name: data.profiles?.company_name || 'Empresa no especificada',
          company_description: data.profiles?.company_description
        }
      }

      setJob(jobWithEmployer)
    } catch (error: any) {
      console.error('Error loading job details:', error)
      toast.error('Error al cargar detalles del empleo')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user || !profile || !job) return

    setApplying(true)
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_letter: data.cover_letter,
          status: 'pending'
        })

      if (error) throw error

      toast.success('Aplicación enviada exitosamente')
      setHasApplied(true)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      toast.error('Error al enviar la aplicación')
    } finally {
      setApplying(false)
    }
  }

  const checkApplicationStatus = async () => {
    if (!user || !id) return

    try {
      const { data, error } = await supabase
        .from('applications')
        .select()
        .eq('job_id', id)
        .eq('applicant_id', user.id)
        .maybeSingle()

      if (error) throw error

      setHasApplied(!!data)
    } catch (error: any) {
      console.error('Error checking application status:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!job) return null

  const getExperienceLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      'entry': 'Principiante',
      'mid': 'Intermedio',
      'senior': 'Senior',
      'lead': 'Líder'
    }
    return levels[level] || level
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Volver a empleos
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <div className="mt-2 flex items-center text-gray-600">
                <Building2 className="h-5 w-5 mr-2" />
                {job.employer.company_name}
              </div>
            </div>
            <div className="text-right">
              <CurrencyConverter 
                amount={job.salary} 
                baseCurrency={job.currency}
                className="text-2xl font-semibold text-green-600" 
              />
              <p className="text-sm text-gray-500 mt-1">Salario Base</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>
                {job.location}
                {job.remote_work && <span className="ml-1">(Trabajo Remoto)</span>}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <Briefcase className="h-5 w-5 mr-2" />
              <span>{getJobTypeLabel(job.job_type)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span>Publicado el {format(new Date(job.created_at), "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FileText className="h-5 w-5 mr-2" />
              <span>Nivel: {getExperienceLevelLabel(job.experience_level)}</span>
            </div>
          </div>

          {job.benefits && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Beneficios</h3>
              <p className="text-gray-600">{job.benefits}</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción del puesto</h3>
            <div className="prose max-w-none text-gray-600">
              {job.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Requisitos</h3>
            <div className="prose max-w-none text-gray-600">
              {job.requirements.split('\n').map((requirement, index) => (
                <p key={index} className="mb-4">{requirement}</p>
              ))}
            </div>
          </div>

          {job.employer.company_description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sobre la empresa</h3>
              <p className="text-gray-600">{job.employer.company_description}</p>
            </div>
          )}
        </div>

        {user && profile?.user_type === 'applicant' && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {hasApplied ? (
              <div className="text-center">
                <p className="text-gray-600">Ya has aplicado a esta vacante</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-1">
                    Carta de presentación (opcional)
                  </label>
                  <textarea
                    id="cover_letter"
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Cuéntanos por qué eres el candidato ideal para este puesto..."
                    {...register('cover_letter')}
                  />
                  {errors.cover_letter && (
                    <p className="mt-1 text-sm text-red-600">{errors.cover_letter.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={applying}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Aplicar ahora
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}