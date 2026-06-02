import React, { useEffect, useState } from 'react'
import { activityApi, type ActivityLogEntry } from '../services/api'
import toast from 'react-hot-toast'

// Map each action to a friendly label + icon
const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  created:          { label: 'created',          icon: '✨', color: 'text-green-600' },
  updated:          { label: 'updated',          icon: '✏️', color: 'text-blue-600' },
  deleted:          { label: 'deleted',          icon: '🗑️', color: 'text-red-600' },
  status_changed:   { label: 'changed status of', icon: '🔄', color: 'text-purple-600' },
  assigned:         { label: 'assigned',         icon: '👤', color: 'text-indigo-600' },
  commented:        { label: 'commented on',     icon: '💬', color: 'text-teal-600' },
  comment_updated:  { label: 'edited a comment on', icon: '💬', color: 'text-blue-600' },
  comment_deleted:  { label: 'deleted a comment on', icon: '💬', color: 'text-red-600' },
}

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-red-100 text-red-700',
  manager:   'bg-blue-100 text-blue-700',
  developer: 'bg-green-100 text-green-700',
}

// Turn an ISO timestamp into a short relative string ("3h ago")
const timeAgo = (iso: string): string => {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const ActivityLogPage: React.FC = () => {
  const [logs, setLogs]           = useState<ActivityLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await activityApi.list({
          action: actionFilter || undefined,
          per_page: 50,
        })
        setLogs(res.data.data)
      } catch {
        toast.error('Failed to load activity log')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [actionFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 mt-1">Audit trail of actions across all projects</p>
        </div>

        {/* Simple action filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700"
        >
          <option value="">All actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="status_changed">Status changed</option>
          <option value="assigned">Assigned</option>
          <option value="commented">Commented</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl mb-4 block">📋</span>
          <p className="text-gray-500 font-medium">No activity recorded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {logs.map(log => {
              const config = ACTION_CONFIG[log.action] ?? {
                label: log.action, icon: '•', color: 'text-gray-600',
              }
              return (
                <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <span className="text-lg flex-shrink-0 mt-0.5">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{log.user?.name ?? 'Someone'}</span>
                      {log.user && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 ${ROLE_BADGE[log.user.role] ?? 'bg-gray-100 text-gray-500'}`}>
                          {log.user.role}
                        </span>
                      )}
                      <span className={`${config.color} mx-1`}>{config.label}</span>
                      <span className="text-gray-600">{log.subject_type} #{log.subject_id}</span>
                    </p>
                    {log.properties && Object.keys(log.properties).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Object.entries(log.properties)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {timeAgo(log.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLogPage