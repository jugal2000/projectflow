import React from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// Color style for each role badge
const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-red-100 text-red-700 border border-red-200',
  manager:   'bg-blue-100 text-blue-700 border border-blue-200',
  developer: 'bg-green-100 text-green-700 border border-green-200',
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo / Brand */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span className="text-2xl">🚀</span>
              <span>ProjectFlow</span>
            </Link>

            {/* Right side: user info + logout */}
            {user && (
              <div className="flex items-center gap-4">
                {/* User name */}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user.name}
                </span>

                {/* Role badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role]}`}>
                  {user.role}
                </span>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      {/* Outlet renders whatever child route is currently active */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

    </div>
  )
}

export default Layout