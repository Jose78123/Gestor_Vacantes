import React, { useState, useEffect } from 'react'
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

  const checkApplicationStatus = async () => {
    if (!user || !id) return

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('applicant_id', user.id)
        .single()

      if (data) {
        setHasApplied(true)
      }
    } catch (error) {
      // No hay aplicación existente
      setHasApplied(false)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user || !id) return

    setApplying(true)
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          applicant_id: user.id,
          cover_letter: data.cover_letter || null,
          status: 'pending',
        })

      if (error) throw error

      setHasApplied(true)
      toast.success('¡Postulación enviada exitosamente!')
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar postulación')
    } finally {
      setApplying(false)
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Empleo no encontrado</h2>
          <p className="text-gray-600 mt-2">El empleo que buscas no existe o ha sido removido.</p>
        </div>
      </div>
    )
  }

  // Verificar si el usuario puede postularse
  const canApply = profile?.user_type === 'applicant' && !hasApplied && profile?.resume_url

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a empleos
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {job.title}
              </h1>
              <div className="flex items-center mb-4">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-xl text-gray-700 font-medium">
                  {job.employer.company_name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {getJobTypeLabel(job.job_type)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Publicado el {format(new Date(job.created_at), 'dd MMMM yyyy', { locale: es })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <CurrencyConverter
                amount={job.salary}
                baseCurrency={job.currency}
                className="mb-4"
              />
              {hasApplied && (
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                  Ya postulaste a este empleo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-8">
          {/* Descripción */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Descripción del Puesto
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>

          {/* Requisitos */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Requisitos
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {job.requirements}
              </p>
            </div>
          </div>

          {/* Información de la empresa */}
          {job.employer.company_description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sobre la Empresa
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {job.employer.company_description}
              </p>
            </div>
          )}

          {/* Formulario de postulación */}
          {profile?.user_type === 'applicant' && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Postularse a este Empleo
              </h2>

              {!profile.resume_url ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <FileText className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Currículum requerido
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Necesitas subir tu currículum antes de postularte.{' '}
                        <button
                          onClick={() => navigate('/profile')}
                          className="font-medium underline hover:text-yellow-600"
                        >
                          Ir a mi perfil
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasApplied ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-5 w-5 bg-green-400 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Postulación enviada
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Ya enviaste tu postulación para este empleo. 
                        Puedes revisar el estado en tu{' '}
                        <button
                          onClick={() => navigate('/applications')}
                          className="font-medium underline hover:text-green-600"
                        >
                          historial de postulaciones
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carta de Presentación (Opcional)
                    </label>
                    <textarea
                      {...register('cover_letter')}
                      rows={6}
                      placeholder="Escribe una carta de presentación personalizada para este empleo..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.cover_letter && (
                      <p className="mt-1 text-sm text-red-600">{errors.cover_letter.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Tu currículum será enviado automáticamente con esta postulación.
                    </div>
                    <button
                      type="submit"
                      disabled={applying}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      <span>{applying ? 'Enviando...' : 'Enviar Postulación'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}