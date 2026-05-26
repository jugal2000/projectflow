import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

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

  // Style for active navigation links
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left side: Logo + Navigation menu */}
            <div className="flex items-center gap-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-bold text-indigo-600 hover:text-indigo-700"
              >
                <span className="text-2xl">🚀</span>
                <span className="hidden sm:block">ProjectFlow</span>
              </Link>

              {/* Navigation Menu */}
              <div className="hidden md:flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass}>
                  📊 Dashboard
                </NavLink>
                <NavLink to="/my-tasks" className={navLinkClass}>
                  ✅ My Tasks
                </NavLink>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <NavLink to="/team" className={navLinkClass}>
                    👥 Team
                  </NavLink>
                )}
                {user?.role === 'admin' && (
                  <NavLink to="/settings" className={navLinkClass}>
                    ⚙️ Settings
                  </NavLink>
                )}
              </div>
            </div>

            {/* Right side: User info + logout */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700 leading-tight">
                      {user.name}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
            <NavLink to="/" end className={navLinkClass}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/my-tasks" className={navLinkClass}>
              ✅ My Tasks
            </NavLink>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <NavLink to="/team" className={navLinkClass}>
                👥 Team
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout