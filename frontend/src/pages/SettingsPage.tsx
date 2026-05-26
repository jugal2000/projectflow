import React from 'react'
import { useAuth } from '../context/AuthContext'

const SettingsPage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-500 text-white text-2xl font-bold flex items-center justify-center">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
            <p className="text-sm font-medium text-gray-800 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
            <p className="text-sm font-medium text-gray-800">
              {user?.is_active ? '✅ Active' : '⛔ Inactive'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">User ID</p>
            <p className="text-sm font-medium text-gray-800">#{user?.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
            <p className="text-sm font-medium text-gray-800">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* App Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About ProjectFlow</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>✨ Version: 1.0.0</p>
          <p>🚀 Built with React, TypeScript, Laravel, and Tailwind CSS</p>
          <p>🔐 Token-based authentication via Laravel Sanctum</p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage