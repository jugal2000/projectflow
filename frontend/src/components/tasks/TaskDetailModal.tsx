import React, { useEffect, useState } from 'react'
import { taskApi, userApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { Task, TaskStatus, User } from '../../types'
import CommentsSection from '../comments/CommentsSection'
import toast from 'react-hot-toast'

interface Props {
  task: Task
  onClose: () => void
  onUpdate: (task: Task) => void
  onDelete: (taskId: number) => void
}

// Status display labels
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  in_review:   'In Review',
  done:        'Done',
}

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done']

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-blue-100 text-blue-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const TaskDetailModal: React.FC<Props> = ({ task, onClose, onUpdate, onDelete }) => {
  const { user } = useAuth()

  // Inline editing state
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc,  setEditingDesc]  = useState(false)
  const [title,        setTitle]        = useState(task.title)
  const [description,  setDescription]  = useState(task.description ?? '')
  const [isSaving,     setIsSaving]     = useState(false)
  const [isDeleting,   setIsDeleting]   = useState(false)

  // Reassign-related state
  const [users, setUsers] = useState<User[]>([])
  const [isReassigning, setIsReassigning] = useState(false)

  // Permissions
  const canEdit = user?.role === 'admin'
    || user?.role === 'manager'
    || task.assigned_to === user?.id

  const canReassign = user?.role === 'admin' || user?.role === 'manager'

  // Load users for the reassign dropdown (only if user has permission)
  useEffect(() => {
    if (!canReassign) return

    const loadUsers = async () => {
      try {
        const res = await userApi.list()
        setUsers(res.data.data)
      } catch {
        // Non-critical: dropdown will just be empty
      }
    }
    void loadUsers()
  }, [canReassign])

  // Save a single field (title or description)
  const saveField = async (field: 'title' | 'description', value: string) => {
    if (!value.trim()) return
    setIsSaving(true)
    try {
      const res = await taskApi.update(task.id, { [field]: value })
      onUpdate(res.data.data)
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
      if (field === 'title')       setEditingTitle(false)
      if (field === 'description') setEditingDesc(false)
    }
  }

  // Handle status button click
  const handleStatusChange = async (newStatus: TaskStatus) => {
    // Don't allow clicking disallowed transitions (button is also disabled in the UI)
    if (!task.allowed_transitions.includes(newStatus)) {
      toast.error(
        `You can't move this task directly from ${STATUS_LABELS[task.status]} to ${STATUS_LABELS[newStatus]}. ` +
        `Tasks must move one step at a time.`
      )
      return
    }

    let actualHours: number | undefined

    // Special rule: moving to "done" requires actual_hours
    if (newStatus === 'done') {
      const input = window.prompt('Enter actual hours spent (e.g. 4 or 2.5):')

      // User clicked Cancel — silently abort, no error needed
      if (input === null) return

      const trimmed = input.trim()

      // Empty input
      if (trimmed === '') {
        toast.error('Please enter the number of hours spent before marking this task as done.')
        return
      }

      const parsed = Number(trimmed)

      // Not a valid number (catches "abc", "4abc", etc.)
      if (Number.isNaN(parsed)) {
        toast.error(`"${trimmed}" is not a valid number. Please enter a number like 4 or 2.5.`)
        return
      }

      // Zero or negative (you can't spend 0 or negative hours on a completed task)
      if (parsed <= 0) {
        toast.error('Hours spent must be greater than 0.')
        return
      }

      // Unreasonably high (sanity check — 9999 matches the backend validation max)
      if (parsed > 9999) {
        toast.error('Hours spent seems too high. Please enter a realistic value.')
        return
      }

      actualHours = parsed
    }

    try {
      const res = await taskApi.changeStatus(task.id, newStatus, actualHours)
      onUpdate(res.data.data)

      // Use a contextual message — completing a task is meaningful, not just "moved"
      if (newStatus === 'done') {
        toast.success(`Task marked complete with ${actualHours} hours logged 🎉`)
      } else {
        toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`)
      }
    } catch (err) {
      // Extract the API's friendly message if available
      const error = err as { response?: { status?: number; data?: { message?: string } } }
      const apiMessage = error.response?.data?.message
      const status = error.response?.status

      let displayMessage: string
      if (apiMessage) {
        displayMessage = apiMessage
      } else if (status === 403) {
        displayMessage = "You're not allowed to change this task's status."
      } else if (status === 422) {
        displayMessage = 'Invalid status change. Please check the task state and try again.'
      } else {
        displayMessage = 'Could not update status. Please try again.'
      }

      toast.error(displayMessage)
    }
  }

  // Handle reassigning the task to a different team member
  const handleReassign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    // Empty string from the select means "unassign"
    const newAssigneeId = value === '' ? null : Number(value)

    // No change — don't fire the API
    if (newAssigneeId === task.assigned_to) return

    setIsReassigning(true)
    try {
      const res = await taskApi.assign(task.id, newAssigneeId)
      onUpdate(res.data.data)

      if (newAssigneeId === null) {
        toast.success('Task unassigned')
      } else {
        const assignedName = res.data.data.assignee?.name ?? 'team member'
        toast.success(`Task assigned to ${assignedName}`)
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } } }
      const status = error.response?.status
      const apiMessage = error.response?.data?.message

      let displayMessage: string
      if (apiMessage) {
        displayMessage = apiMessage
      } else if (status === 403) {
        displayMessage = "You're not allowed to reassign this task."
      } else {
        displayMessage = 'Could not reassign task. Please try again.'
      }
      toast.error(displayMessage)
    } finally {
      setIsReassigning(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    setIsDeleting(true)
    try {
      await taskApi.delete(task.id)
      onDelete(task.id)
    } catch {
      toast.error('Failed to delete task')
      setIsDeleting(false)
    }
  }

  // Close modal when clicking outside (on the dark overlay)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    // Dark overlay background
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
    >
      {/* Modal panel */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* ── HEADER ── */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0">

            {/* Title — click to edit */}
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => saveField('title', title)}
                onKeyDown={e => e.key === 'Enter' && saveField('title', title)}
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-indigo-400 outline-none pb-1"
              />
            ) : (
              <h2
                className={`text-xl font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors ${canEdit ? '' : 'cursor-default'}`}
                onClick={() => canEdit && setEditingTitle(true)}
                title={canEdit ? 'Click to edit title' : ''}
              >
                {task.title}
              </h2>
            )}

            {/* Priority + overdue badges */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
              {task.is_overdue && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  ⚠️ Overdue
                </span>
              )}
              {task.due_date && (
                <span className="text-xs text-gray-400">Due: {task.due_date}</span>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0 p-1"
          >
            ✕
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="p-6 space-y-6">

          {/* Status buttons */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map(s => {
                const isCurrent  = task.status === s
                const isAllowed  = task.allowed_transitions.includes(s)

                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={!isAllowed || isCurrent}
                    className={`
                      text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                      ${isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isAllowed
                        ? 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300'
                        : 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                      }
                    `}
                    title={!isAllowed && !isCurrent ? 'Transition not allowed' : ''}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Assignee
            </p>

            {/* Current assignee display */}
            {task.assignee ? (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{task.assignee.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {task.assignee.role}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mb-2">Unassigned</p>
            )}

            {/* Reassign dropdown — admin/manager only */}
            {canReassign && (
              <div className="mt-2">
                <select
                  value={task.assigned_to ?? ''}
                  onChange={handleReassign}
                  disabled={isReassigning}
                  className="w-full max-w-xs text-sm px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
                {isReassigning && (
                  <p className="text-xs text-gray-500 mt-1">Updating assignment…</p>
                )}
              </div>
            )}
          </div>

          {/* Description — click to edit */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Description
            </p>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-indigo-400 rounded-lg px-3 py-2 outline-none resize-none focus:ring-2 focus:ring-indigo-200"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveField('description', description)}
                    disabled={isSaving}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingDesc(false); setDescription(task.description ?? '') }}
                    className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => canEdit && setEditingDesc(true)}
                className={`
                  text-sm rounded-lg p-2 -m-2 min-h-8 transition-colors
                  ${task.description ? 'text-gray-700' : 'text-gray-400 italic'}
                  ${canEdit ? 'cursor-pointer hover:bg-gray-50' : ''}
                `}
                title={canEdit ? 'Click to edit description' : ''}
              >
                {task.description ?? 'No description. Click to add one…'}
              </p>
            )}
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Estimated Hours</p>
              <p className="text-lg font-bold text-gray-800">
                {task.estimated_hours ?? '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Actual Hours</p>
              <p className="text-lg font-bold text-gray-800">
                {task.actual_hours ?? '—'}
              </p>
            </div>
          </div>

          {/* Threaded comments */}
          <div className="border-t border-gray-100 pt-6">
            <CommentsSection taskId={task.id} />
          </div>
        </div>

        {/* ── FOOTER — delete button for managers/admins ── */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="px-6 pb-6 flex justify-end border-t border-gray-100 pt-4">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-60 transition-colors"
            >
              {isDeleting ? 'Deleting…' : '🗑 Delete Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskDetailModal