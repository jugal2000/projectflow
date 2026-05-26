import React, { useEffect, useState } from 'react'
import api from '../services/axios'
import toast from 'react-hot-toast'
import type { User, Project } from '../types'

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
  const [users, setUsers]         = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // We get team members from the projects we have access to
    // Since there's no /users endpoint, we extract from projects
    const loadTeam = async () => {
      try {
        const res = await api.get<{ data: Project[] }>('/projects', {
          params: { per_page: 100 },
        })

        // Extract unique owners from all projects
        const usersMap = new Map<number, User>()

        // Use Project type instead of 'any' to fix the TypeScript error
        res.data.data.forEach((p: Project) => {
          if (p.owner && !usersMap.has(p.owner.id)) {
            usersMap.set(p.owner.id, p.owner)
          }
        })

        setUsers(Array.from(usersMap.values()))
      } catch {
        toast.error('Failed to load team members')
      } finally {
        setIsLoading(false)
      }
    }

    loadTeam()
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <p className="text-gray-500 mt-1">People you work with across projects</p>
      </div>

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

      {users.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl mb-4 block">👥</span>
          <p className="text-gray-500 font-medium">No team members found</p>
        </div>
      )}
    </div>
  )
}

export default TeamPage