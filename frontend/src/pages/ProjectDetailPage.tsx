import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { projectApi, taskApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { Project, Task, TaskStatus } from '../types'
import KanbanBoard from '../components/tasks/KanbanBoard'
import TaskDetailModal from '../components/tasks/TaskDetailModal'
import CreateTaskModal from '../components/tasks/CreateTaskModal'
import SkeletonLoader from '../components/ui/SkeletonLoader'

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', active: 'Active', on_hold: 'On Hold',
  completed: 'Completed', archived: 'Archived',
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700', completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-red-100 text-red-700',
}

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [project,          setProject]          = useState<Project | null>(null)
  const [tasks,            setTasks]            = useState<Task[]>([])
  const [isLoading,        setIsLoading]        = useState(true)
  const [selectedTask,     setSelectedTask]     = useState<Task | null>(null)
  const [showCreateModal,  setShowCreateModal]  = useState(false)

  // Load project + all tasks together
  const loadData = useCallback(async () => {
    if (!slug) return
    try {
      const [projRes, taskRes] = await Promise.all([
        projectApi.get(slug),
        taskApi.list(slug, { per_page: 100 }),
      ])
      setProject(projRes.data.data)
      setTasks(taskRes.data.data)
    } catch (err: unknown) {
      // Show the actual error message for debugging
      const axiosError = err as { response?: { data?: { message?: string }; status?: number } }
      const msg = axiosError.response?.data?.message ?? (err instanceof Error ? err.message : 'Unknown error')
      const status = axiosError.response?.status ?? 'No response'
      console.error('Project load failed:', status, msg, err)
      toast.error(`Error ${status}: ${msg}`)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }, [slug, navigate])

  // The data load is intentionally triggered from an effect.
  useEffect(() => {
    const executeLoadData = async () => {
      await loadData()
    }

    void executeLoadData()
  }, [loadData])

  // ── OPTIMISTIC STATUS CHANGE ──────────────────────────────────
  // "Optimistic" = update the UI immediately BEFORE the API responds
  // If the API fails, we rollback to the previous state
  // This makes the UI feel instant even on slow connections

  const handleStatusChange = useCallback(async (
    taskId: number,
    newStatus: TaskStatus,
    actualHours?: number
  ) => {
    // Save current state in case we need to rollback
    const previousTasks = tasks

    // Immediately update UI (optimistic update)
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )

    try {
      const res = await taskApi.changeStatus(taskId, newStatus, actualHours)
      // Replace with real data from server (has updated timestamps etc.)
      setTasks(prev => prev.map(t => t.id === taskId ? res.data.data : t))
    } catch (err: unknown) {
      // ROLLBACK — restore previous state
      setTasks(previousTasks)
      const message = err instanceof Error
        ? err.message
        : 'Status update failed'
      toast.error(message)
    }
  }, [tasks])

  const handleReorder = useCallback(async (
    updates: Array<{ id: number; sort_order: number }>
  ) => {
    // Optimistically update sort_order in local state
    setTasks(prev =>
      prev.map(t => {
        const update = updates.find(u => u.id === t.id)
        return update ? { ...t, sort_order: update.sort_order } : t
      })
    )
    try {
      await taskApi.reorder(updates)
    } catch {
      toast.error('Reorder failed')
      loadData()  // Reload from server to get correct order
    }
  }, [loadData])

  const handleTaskCreated = useCallback((newTask: Task) => {
    setTasks(prev => [...prev, newTask])
    setShowCreateModal(false)
  }, [])

  const handleTaskUpdated = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelectedTask(updated)  // Update the modal too
  }, [])

  const handleTaskDeleted = useCallback((taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setSelectedTask(null)
  }, [])

  if (isLoading) return <SkeletonLoader type="kanban" />
  if (!project)  return null

  const canManage    = user?.role === 'admin' || user?.role === 'manager'
  const completionPct = project.total_tasks > 0
    ? Math.round((project.done_tasks / project.total_tasks) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* ── PROJECT HEADER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">

            {/* Name + Status */}
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm mb-3">{project.description}</p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>👤 <strong>{project.owner.name}</strong></span>
              {project.start_date && <span>📅 Start: {project.start_date}</span>}
              {project.end_date   && <span>🏁 End: {project.end_date}</span>}
              {project.budget     && (
                <span>💰 Budget: ${Number(project.budget).toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Create Task button */}
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + New Task
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Overall Progress</span>
            <span>{completionPct}% complete · {project.done_tasks}/{project.total_tasks} tasks done</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      <KanbanBoard
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onReorder={handleReorder}
        onTaskClick={setSelectedTask}
      />

      {/* ── MODALS ── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdated}
          onDelete={handleTaskDeleted}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          projectSlug={project.slug}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  )
}

export default ProjectDetailPage