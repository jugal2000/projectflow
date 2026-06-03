import echo from '../services/echo'
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

  useEffect(() => {
    const executeLoadData = async () => {
      await loadData()
    }
    void executeLoadData()
  }, [loadData])

  // ── REAL-TIME UPDATES ─────────────────────────────────────────
  // Subscribe to this project's channel and listen for task changes.
  // Guarded with `!echo` so the page still works when Reverb isn't running.
  useEffect(() => {
    if (!project || !echo) return

    const channelName = `project.${project.id}`
    const channel = echo.channel(channelName)

    channel.listen('.task.updated', (event: {
      action: string
      task: Task
    }) => {
      const { action, task: updatedTask } = event

      if (action === 'created') {
        setTasks(prev => {
          if (prev.some(t => t.id === updatedTask.id)) return prev
          return [...prev, updatedTask]
        })
        toast.success(`New task added: ${updatedTask.title}`, { icon: '✨' })
      } else if (action === 'deleted') {
        setTasks(prev => prev.filter(t => t.id !== updatedTask.id))
        toast(`Task removed: ${updatedTask.title}`, { icon: '🗑️' })
      } else {
        setTasks(prev =>
          prev.map(t => t.id === updatedTask.id ? updatedTask : t)
        )
      }
    })

    return () => {
      echo?.leave(channelName)
    }
  }, [project])

  // ── OPTIMISTIC STATUS CHANGE (kanban drag) ────────────────────
  // Optimistically updates UI before API confirms; rolls back on failure
  // and shows a friendly toast based on the API's error response.
  const handleStatusChange = useCallback(async (
    taskId: number,
    newStatus: TaskStatus,
    actualHours?: number
  ) => {
    const previousTasks = tasks

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    )

    try {
      const res = await taskApi.changeStatus(taskId, newStatus, actualHours)
      setTasks(prev => prev.map(t => t.id === taskId ? res.data.data : t))
    } catch (err: unknown) {
      // ROLLBACK
      setTasks(previousTasks)

      // Extract the friendly message from the API response
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string } }
      }
      const apiMessage = axiosError.response?.data?.message
      const status = axiosError.response?.status

      let displayMessage: string
      if (apiMessage) {
        displayMessage = apiMessage
      } else if (status === 403) {
        displayMessage = "You're not allowed to change this task's status. Only the assignee or a manager/admin can do that."
      } else if (status === 422) {
        displayMessage = 'Invalid status transition. Tasks must move one step at a time (todo → in_progress → in_review → done).'
      } else {
        displayMessage = 'Status update failed'
      }

      toast.error(displayMessage)
    }
  }, [tasks])

  const handleReorder = useCallback(async (
    updates: Array<{ id: number; sort_order: number }>
  ) => {
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
      loadData()
    }
  }, [loadData])

 const handleTaskCreated = useCallback((newTask: Task) => {
  setTasks(prev => {
    if (prev.some(task => task.id === newTask.id)) {
      return prev; // already exists, do nothing
    }

    return [...prev, newTask];
  });

  setShowCreateModal(false);
}, []);

  const handleTaskUpdated = useCallback((updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }, [])

  // Removes deleted task from the board and shows a confirmation toast
  const handleTaskDeleted = useCallback((taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setSelectedTask(null)
    toast.success('Task deleted')
  }, [])

  if (isLoading) return <SkeletonLoader type="kanban" />
  if (!project)  return null

  const canManage = user?.role === 'admin' || user?.role === 'manager'

// Compute totals from the live tasks array (not the stale project object),
// so the progress bar updates immediately when tasks are created, deleted,
// or moved between columns.
const totalTasks = tasks.length
const doneTasks  = tasks.filter(t => t.status === 'done').length
const completionPct = totalTasks > 0
  ? Math.round((doneTasks / totalTasks) * 100)
  : 0
  return (
    <div className="space-y-6">

      {/* ── PROJECT HEADER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">

            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>

            <p className="text-gray-500 text-sm mb-3">{project.description}</p>

            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>👤 <strong>{project.owner.name}</strong></span>
              {project.start_date && <span>📅 Start: {project.start_date}</span>}
              {project.end_date   && <span>🏁 End: {project.end_date}</span>}
              {project.budget     && (
                <span>💰 Budget: ${Number(project.budget).toLocaleString()}</span>
              )}
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + New Task
            </button>
          )}
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Overall Progress</span>
            <span>{completionPct}% complete · {doneTasks}/{totalTasks} tasks done</span>
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