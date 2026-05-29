import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { userApi, type CreateUserPayload } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface Props {
  onClose: () => void
  onCreated: () => void   // called after a successful create so the parent can refresh
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  role?: string
  general?: string
}

const AddTeamMemberModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { user } = useAuth()

  // Form state
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<CreateUserPayload['role']>('developer')

  const [errors, setErrors]     = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Which roles can the CURRENT user assign?
  // Admin can assign any role; manager cannot create admins.
  const availableRoles = useMemo<CreateUserPayload['role'][]>(() => {
    if (user?.role === 'admin')   return ['admin', 'manager', 'developer']
    if (user?.role === 'manager') return ['manager', 'developer']
    return []  // developers can't use this modal at all
  }, [user])

  const validate = (): boolean => {
    const errs: FormErrors = {}

    if (!name.trim())                    errs.name = 'Name is required'
    else if (name.trim().length < 2)     errs.name = 'Name must be at least 2 characters'

    if (!email.trim())                   errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email'

    if (!password)                       errs.password = 'Password is required'
    else if (password.length < 8)        errs.password = 'Password must be at least 8 characters'

    if (!availableRoles.includes(role))  errs.role = 'Please pick a valid role'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      await userApi.create({ name: name.trim(), email: email.trim(), password, role })
      toast.success(`${name.trim()} added to the team`)
      onCreated()
    } catch (err) {
      // The API may return field-by-field validation errors
      if (axios.isAxiosError(err)) {
        const apiErrors = err.response?.data?.errors ?? {}
        if (Object.keys(apiErrors).length > 0) {
          setErrors({
            name:     apiErrors.name?.[0],
            email:    apiErrors.email?.[0],
            password: apiErrors.password?.[0],
            role:     apiErrors.role?.[0],
          })
        } else {
          setErrors({
            general: err.response?.data?.message ?? 'Could not add team member',
          })
        }
      } else {
        setErrors({ general: 'Could not add team member. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // If somehow a developer opens this modal, render nothing
  if (availableRoles.length === 0) return null

  const fieldClass = (hasError: boolean) => `
    w-full px-4 py-2.5 rounded-lg border text-sm
    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
    transition-colors
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
  `

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Team Member</h2>
            <p className="text-sm text-gray-500 mt-0.5">Create an account for a new teammate</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {errors.general && (
          <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass(!!errors.name)}
              placeholder="Jane Doe"
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass(!!errors.email)}
              placeholder="jane@projectflow.dev"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Temporary password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass(!!errors.password)}
              placeholder="At least 8 characters"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Share this with the new member so they can log in.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CreateUserPayload['role'])}
              className={fieldClass(!!errors.role)}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {isSubmitting ? 'Adding…' : 'Add Member'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTeamMemberModal