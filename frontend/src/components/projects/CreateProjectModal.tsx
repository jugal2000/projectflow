import React, { useState } from 'react'
import { projectApi } from '../../services/api'
import type { Project } from '../../types'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
  onCreated: (project: Project) => void
}

interface FormState {
  name: string
  description: string
  status: string
  start_date: string
  end_date: string
  budget: string
}

interface FormErrors {
  name?: string
  description?: string
  start_date?: string
  general?: string
}

// Type for API error responses
interface ApiError {
  response?: {
    status?: number
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
  message?: string
}

const CreateProjectModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    status: 'planning',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: '',
  })
  const [errors, setErrors]       = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  // Update one field
  const setField =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!form.name.trim())            errs.name = 'Project name is required'
    else if (form.name.length < 3)    errs.name = 'Name must be at least 3 characters'
    if (!form.description.trim())     errs.description = 'Description is required'
    if (!form.start_date)             errs.start_date = 'Start date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name:        form.name.trim(),
        description: form.description.trim(),
        status:      form.status,
        start_date:  form.start_date,
      }
      if (form.end_date) payload.end_date = form.end_date
      if (form.budget)   payload.budget   = Number(form.budget)

      const res = await projectApi.create(payload)
      onCreated(res.data.data)
      toast.success('Project created successfully!')
    } catch (err) {
      // Properly typed error handling - no 'any' used
      const error  = err as ApiError
      const status = error.response?.status ?? 'no response'
      const msg    = error.response?.data?.message ?? error.message ?? 'Failed to create project'
      const apiErr = error.response?.data?.errors ?? {}

      if (apiErr.name) setErrors({ name: apiErr.name[0] })
      else setErrors({ general: `Error ${status}: ${msg}` })

      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {errors.general && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={setField('name')}
              placeholder="e.g. E-Commerce Platform"
              autoFocus
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={setField('description')}
              rows={3}
              placeholder="What is this project about?"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${
                errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Status + Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={setField('status')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="planning">📋 Planning</option>
                <option value="active">🔥 Active</option>
                <option value="on_hold">⏸ On Hold</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Budget <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.budget}
                onChange={setField('budget')}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={setField('start_date')}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                  errors.start_date ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={setField('end_date')}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Buttons */}
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
              ) : (
                '+ Create Project'
              )}
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

export default CreateProjectModal