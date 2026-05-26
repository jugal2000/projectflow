import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'

const LoginPage         = lazy(() => import('./pages/LoginPage'))
const RegisterPage      = lazy(() => import('./pages/RegisterPage'))
const DashboardPage     = lazy(() => import('./pages/DashboardPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const MyTasksPage       = lazy(() => import('./pages/MyTasksPage'))
const TeamPage          = lazy(() => import('./pages/TeamPage'))
const SettingsPage      = lazy(() => import('./pages/SettingsPage'))

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  </div>
)

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

// Role-restricted routes (admin/manager only)
const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin' && user.role !== 'manager') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  // All roles can see settings actually, so let's allow all
  return <>{children}</>
}

const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index                   element={<DashboardPage />} />
        <Route path="projects/:slug"   element={<ProjectDetailPage />} />
        <Route path="my-tasks"         element={<MyTasksPage />} />
        <Route path="team"             element={
          <ManagerRoute><TeamPage /></ManagerRoute>
        } />
        <Route path="settings"         element={
          <AdminRoute><SettingsPage /></AdminRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '14px',
          },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
)

export default App