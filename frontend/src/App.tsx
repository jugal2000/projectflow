// import React from 'react'
// import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'
// import { AuthProvider, useAuth } from './context/AuthContext'

// // Pages — we'll create these next
// import LoginPage from './pages/LoginPage'
// import RegisterPage from './pages/RegisterPage'
// import DashboardPage from './pages/DashboardPage'
// import ProjectDetailPage from './pages/ProjectDetailPage'

// // Layout — the navbar wrapper
// import Layout from './components/layout/Layout'

// // ── PROTECTED ROUTE ───────────────────────────────────────────────
// // If user is NOT logged in, redirect to /login
// // If user IS logged in, show the page

// const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth()

//   // While we check if the user is logged in, show a spinner
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
//       </div>
//     )
//   }

//   // Not authenticated → go to login
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />
//     // replace = don't add /login to browser history (so Back button works properly)
//   }

//   return <>{children}</>
// }

// // ── GUEST ROUTE ───────────────────────────────────────────────────
// // If user IS already logged in, redirect away from login/register pages
// // (no point showing login page to someone already logged in)

// const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth()

//   if (isLoading) return null  // Show nothing while checking

//   if (isAuthenticated) {
//     return <Navigate to="/" replace />  // Already logged in → go to dashboard
//   }

//   return <>{children}</>
// }

// // ── ROUTES ────────────────────────────────────────────────────────
// // Defines which component shows for each URL

// const AppRoutes: React.FC = () => (
//   <Routes>
//     {/* Public routes — anyone can visit */}
//     <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
//     <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

//     {/* Protected routes — must be logged in */}
//     {/* Layout wraps all these pages (provides the navbar) */}
//     <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
//       <Route index element={<DashboardPage />} />
//       {/* index = this is the default route, matches "/" */}

//       <Route path="/projects/:slug" element={<ProjectDetailPage />} />
//       {/* :slug = dynamic segment — matches anything, e.g. /projects/e-commerce-platform */}
//     </Route>

//     {/* Catch-all: unknown URLs go to dashboard */}
//     <Route path="*" element={<Navigate to="/" replace />} />
//   </Routes>
// )

// // ── ROOT APP COMPONENT ────────────────────────────────────────────
// // BrowserRouter = enables URL-based navigation
// // AuthProvider = provides login state to the whole app
// // Toaster = the notification popup system

// const App: React.FC = () => (
//   <BrowserRouter>
//     <AuthProvider>
//       <AppRoutes />
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             borderRadius: '10px',
//             background: '#1e293b',
//             color: '#f8fafc',
//             fontSize: '14px',
//           },
//         }}
//       />
//     </AuthProvider>
//   </BrowserRouter>
// )

// export default App

import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'

// ── LAZY LOADING ──────────────────────────────────────────────────
// lazy() = only download the page's code when the user navigates to it
// This makes the initial load faster
const LoginPage         = lazy(() => import('./pages/LoginPage'))
const RegisterPage      = lazy(() => import('./pages/RegisterPage'))
const DashboardPage     = lazy(() => import('./pages/DashboardPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))

// ── LOADING FALLBACK ──────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  </div>
)

// ── PROTECTED ROUTE ───────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ── GUEST ROUTE ───────────────────────────────────────────────────
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

// ── ROUTES ────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected — all wrapped in Layout (navbar) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index                   element={<DashboardPage />} />
        <Route path="projects/:slug"   element={<ProjectDetailPage />} />
      </Route>

      {/* Catch-all */}
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