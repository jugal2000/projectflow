import React, { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { userApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { User } from '../types'
import AddTeamMemberModal from '../components/team/AddTeamMemberModal'

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-red-100 text-red-700',
  manager:   'bg-blue-100 text-blue-700',
  developer: 'bg-green-100 text-green-700',
}

const ROLE_ICONS: Record<string, string> = {
  admin:     '👑',
  manager:   '📋',
  developer: '💻',
}

const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers]         = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Only admin and manager can add team members
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  // Fetch the team list from the new /users endpoint
 // Reusable so we can call it again after adding a member
const loadTeam = async () => {
  setIsLoading(true)
  try {
    const res = await userApi.list()
    setUsers(res.data.data)
  } catch {
    toast.error('Failed to load team members')
  } finally {
    setIsLoading(false)
  }
}

useEffect(() => {
  // Inline-call to avoid the linter complaint about dependencies
  void (async () => {
    setIsLoading(true)
    try {
      const res = await userApi.list()
      setUsers(res.data.data)
    } catch {
      toast.error('Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  })()
}, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with optional Add button */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">
            {users.length} {users.length === 1 ? 'member' : 'members'} across all projects
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Team Member
          </button>
        )}
      </div>

      {/* Member grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div
            key={user.id}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-500 text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-2 ${ROLE_BADGE[user.role]}`}>
                  {ROLE_ICONS[user.role]} {user.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {users.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl mb-4 block">👥</span>
          <p className="text-gray-500 font-medium">No team members found</p>
        </div>
      )}

      {/* Add Team Member modal */}
      {showAddModal && (
        <AddTeamMemberModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            loadTeam()   // refresh the list to show the new member
          }}
        />
      )}
    </div>
  )
}

export default TeamPage