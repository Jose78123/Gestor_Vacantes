import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Loading } from './components/Loading'
import { useAuth } from './contexts/AuthContext'

// Pages
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { EmailConfirmationPage } from './pages/auth/EmailConfirmationPage'

// Applicant Pages
import { JobsPage } from './pages/applicant/JobsPage'
import { JobDetailsPage } from './pages/applicant/JobDetailsPage'
import { ApplicationsPage } from './pages/applicant/ApplicationsPage'

// Employer Pages
import { DashboardPage } from './pages/employer/DashboardPage'
import { CreateJobPage } from './pages/employer/CreateJobPage'
import { JobApplicationsPage } from './pages/employer/JobApplicationsPage'

// Componente envoltorio para manejar el estado de carga inicial
function AppContent() {
  const { loading, isAuthenticated, profile } = useAuth()

  if (loading) {
    return <Loading message="Iniciando aplicación..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to={profile?.user_type === 'employer' ? '/dashboard' : '/jobs'} replace /> : <LoginPage />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to={profile?.user_type === 'employer' ? '/dashboard' : '/jobs'} replace /> : <RegisterPage />
          } />
          <Route path="/confirm-email" element={<EmailConfirmationPage />} />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Applicant Routes */}
          <Route path="/jobs" element={
            <ProtectedRoute requiredUserType="applicant">
              <JobsPage />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute requiredUserType="applicant">
              <JobDetailsPage />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute requiredUserType="applicant">
              <ApplicationsPage />
            </ProtectedRoute>
          } />

          {/* Employer Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredUserType="employer">
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/create-job" element={
            <ProtectedRoute requiredUserType="employer">
              <CreateJobPage />
            </ProtectedRoute>
          } />
          <Route path="/job-applications/:jobId" element={
            <ProtectedRoute requiredUserType="employer">
              <JobApplicationsPage />
            </ProtectedRoute>
          } />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}

export default App