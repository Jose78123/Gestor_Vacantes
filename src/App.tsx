import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'

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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/confirm-email" element={<EmailConfirmationPage />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Applicant Routes */}
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute requiredUserType="applicant">
                    <JobsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute requiredUserType="applicant">
                    <JobDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute requiredUserType="applicant">
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Employer Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredUserType="employer">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/jobs/new"
                element={
                  <ProtectedRoute requiredUserType="employer">
                    <CreateJobPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/jobs/:jobId/applications"
                element={
                  <ProtectedRoute requiredUserType="employer">
                    <JobApplicationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App