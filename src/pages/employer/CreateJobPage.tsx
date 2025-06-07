import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { SUPPORTED_CURRENCIES } from '../../lib/currency'
import { ArrowLeft, Save, MapPin, Clock, Building2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const jobSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  requirements: z.string().min(20, 'Los requisitos deben tener al menos 20 caracteres'),
  benefits: z.string().optional(),
  location: z.string().min(3, 'La ubicación es requerida'),
  salary: z.coerce.number().min(1, 'El salario debe ser mayor a 0'),
  currency: z.string().min(1, 'Selecciona una moneda'),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'freelance'], {
    required_error: 'Selecciona el tipo de empleo',
  }),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead'], {
    required_error: 'Selecciona el nivel de experiencia',
  }),
  remote_work: z.boolean().default(false),
})

type JobFormData = z.infer<typeof jobSchema>

export function CreateJobPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      currency: 'USD',
      job_type: 'full-time',
      experience_level: 'mid',
      remote_work: false,
    },
  })

  const onSubmit = async (data: JobFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          employer_id: user.id,
          ...data,
          is_active: true,
        })

      if (error) throw error

      toast.success('¡Empleo publicado exitosamente!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Error al publicar empleo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Dashboard
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Publicar Nuevo Empleo
          </h1>
          <p className="text-gray-600 mt-2">
            Completa la información para atraer a los mejores candidatos
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título del Puesto *
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="ej. Desarrollador Frontend Senior"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  {...register('location')}
                  type="text"
                  placeholder="ej. Madrid, España"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Empleo *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <select
                  {...register('job_type')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="full-time">Tiempo Completo</option>
                  <option value="part-time">Medio Tiempo</option>
                  <option value="contract">Contrato</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              {errors.job_type && (
                <p className="mt-1 text-sm text-red-600">{errors.job_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  {...register('salary')}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="50000"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.salary && (
                <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda *
              </label>
              <select
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Puesto *
            </label>
            <textarea
              {...register('description')}
              rows={6}
              placeholder="Describe las responsabilidades, el ambiente de trabajo, objetivos del puesto, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requisitos y Qualificaciones *
            </label>
            <textarea
              {...register('requirements')}
              rows={6}
              placeholder="Lista los requisitos técnicos, experiencia, educación, habilidades necesarias, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.requirements && (
              <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beneficios (Opcional)
            </label>
            <textarea
              {...register('benefits')}
              rows={4}
              placeholder="Lista los beneficios que ofrece el puesto: seguro médico, bonos, horario flexible, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Experiencia *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <select
                  {...register('experience_level')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="entry">Principiante</option>
                  <option value="mid">Intermedio</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Líder</option>
                </select>
              </div>
              {errors.experience_level && (
                <p className="mt-1 text-sm text-red-600">{errors.experience_level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trabajo Remoto
              </label>
              <div className="flex items-center">
                <input
                  {...register('remote_work')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600">Permitir trabajo remoto</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Publicando...' : 'Publicar Empleo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}