import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Application {
  id: string
  job_id: string
  status: 'pending' | 'accepted' | 'rejected'
  cover_letter?: string
  created_at: string
  job: {
    title: string
    location: string
    employer: {
      company_name: string
    }
  }
}

export function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          cover_letter,
          created_at,
          job:jobs (
            title,
            location,
            employer:profiles!jobs_employer_id_fkey (
              company_name
            )
          )
        `)
        .eq('applicant_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(
        (data as any[]).map(app => ({
          ...app,
          job: {
            ...Array.isArray(app.job) ? app.job[0] : app.job,
            employer: Array.isArray(app.job?.employer) ? app.job.employer[0] : app.job?.employer
          }
        }))
      )
    } catch (error: any) {
      console.error('Error loading applications:', error)
      toast.error('Error al cargar las postulaciones')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status: Application['status']) => {
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

  const getStatusLabel = (status: Application['status']) => {
    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada'
    }
    return labels[status]
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Postulaciones</h1>

      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">Aún no has aplicado a ningún empleo</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ver empleos disponibles
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map(application => (
            <div key={application.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/jobs/${application.job_id}`}
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {application.job.title}
                    </Link>
                    <div className="mt-1 flex items-center text-gray-500">
                      <Building2 className="h-5 w-5 mr-2" />
                      {application.job.employer.company_name}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClass(
                      application.status
                    )}`}
                  >
                    {getStatusLabel(application.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-5 w-5 mr-2" />
                    {application.job.location}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-5 w-5 mr-2" />
                    {format(new Date(application.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                </div>

                {application.cover_letter && (
                  <div className="mt-4 text-gray-600">
                    <p className="font-medium mb-1">Carta de presentación:</p>
                    <p className="text-sm">{application.cover_letter}</p>
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