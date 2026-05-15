import React, { useState } from 'react'
import { taskApi } from '../../services/api'
import type { Task } from '../../types'
import toast from 'react-hot-toast'



interface Props {
  projectSlug: string
  onClose: () => void
  onCreated: (task: Task) => void
}

interface FormState {
  title: string
  description: string
  priority: string
  due_date: string
  estimated_hours: string
}

interface FormErrors {
  title?: string
  estimated_hours?: string
}

const CreateTaskModal: React.FC<Props> = ({ projectSlug, onClose, onCreated }) => {
  const [form, setForm] = useState<FormState>({
    title: '', description: '', priority: 'medium', due_date: '', estimated_hours: '',
  })
  const [errors, setErrors]       = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  // Helper to update one field without writing separate handlers for each
  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      // Clear the error for this field as user types
      if (errors[field as keyof FormErrors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
    }

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!form.title.trim())       errs.title = 'Title is required'
    else if (form.title.length < 3) errs.title = 'Title must be at least 3 characters'
    if (form.estimated_hours && isNaN(Number(form.estimated_hours))) {
      errs.estimated_hours = 'Must be a number'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const res = await taskApi.create(projectSlug, {
        title:           form.title,
        description:     form.description || undefined,
        priority:        form.priority as 'low' | 'medium' | 'high' | 'critical',
        due_date:        form.due_date || undefined,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
      })
      onCreated(res.data.data)
      toast.success('Task created!')
    } catch (err: unknown) {
      // Show API validation errors if any
      const apiErrors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {}
      if (apiErrors.title) setErrors({ title: apiErrors.title[0] })
      else toast.error('Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={setField('title')}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="What needs to be done?"
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={setField('description')}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Optional details…"
            />
          </div>

          {/* Priority + Estimated Hours side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={setField('priority')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Est. Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimated_hours}
                onChange={setField('estimated_hours')}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.estimated_hours ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="e.g. 4"
              />
              {errors.estimated_hours && <p className="text-xs text-red-600 mt-1">{errors.estimated_hours}</p>}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={setField('due_date')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating…
                </>
              ) : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal