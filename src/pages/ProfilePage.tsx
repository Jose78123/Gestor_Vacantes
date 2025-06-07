import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { User, Building2, Upload, FileText, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nombre completo es requerido'),
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
  company_name: z.string().optional(),
  company_description: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      skills: profile?.skills?.join(', ') || '',
      experience: profile?.experience || '',
      company_name: profile?.company_name || '',
      company_description: profile?.company_description || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    try {
      const updateData: any = {
        full_name: data.full_name,
        phone: data.phone || null,
        location: data.location || null,
      }

      if (profile?.user_type === 'applicant') {
        updateData.skills = data.skills 
          ? data.skills.split(',').map(s => s.trim()).filter(s => s)
          : []
        updateData.experience = data.experience || null
      }

      if (profile?.user_type === 'employer') {
        updateData.company_name = data.company_name || null
        updateData.company_description = data.company_description || null
      }

      await updateProfile(updateData)
      toast.success('Perfil actualizado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe exceder los 5MB')
      return
    }

    setUploadingResume(true)
    try {
      const fileName = `resume_${profile?.id}_${Date.now()}.pdf`
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      await updateProfile({ resume_url: data.publicUrl })
      toast.success('Currículum subido exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al subir currículum')
    } finally {
      setUploadingResume(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {profile.user_type === 'employer' ? (
                <Building2 className="h-12 w-12 text-blue-600" />
              ) : (
                <User className="h-12 w-12 text-blue-600" />
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-gray-600 capitalize">
                {profile.user_type === 'applicant' ? 'Aspirante' : 'Empleador'}
              </p>
              {profile.user_type === 'employer' && profile.company_name && (
                <p className="text-gray-500">{profile.company_name}</p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                {...register('full_name')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ubicación
            </label>
            <input
              {...register('location')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ciudad, País"
            />
          </div>

          {profile.user_type === 'applicant' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Habilidades (separadas por comas)
                </label>
                <input
                  {...register('skills')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="JavaScript, React, Node.js, Python..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experiencia
                </label>
                <textarea
                  {...register('experience')}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe tu experiencia laboral..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currículum (PDF)
                </label>
                <div className="flex items-center space-x-4">
                  {profile.resume_url ? (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600">Currículum subido</span>
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Ver PDF
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No hay currículum subido</span>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="sr-only"
                      disabled={uploadingResume}
                    />
                    <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>
                        {uploadingResume ? 'Subiendo...' : 'Subir PDF'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {profile.user_type === 'employer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la Empresa
                </label>
                <input
                  {...register('company_name')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción de la Empresa
                </label>
                <textarea
                  {...register('company_description')}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe tu empresa..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}