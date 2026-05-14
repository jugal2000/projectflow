import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  general?: string
}

const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName]                     = useState('')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors]                 = useState<FormErrors>({})
  const [isLoading, setIsLoading]           = useState(false)

  const validate = (): boolean => {
    const errs: FormErrors = {}

    if (!name.trim())       errs.name = 'Name is required'
    else if (name.length < 2) errs.name = 'Name must be at least 2 characters'

    if (!email.trim())      errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'

    if (!password)          errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'

    if (!passwordConfirm)   errs.password_confirmation = 'Please confirm your password'
    else if (password !== passwordConfirm) {
      errs.password_confirmation = 'Passwords do not match'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      await register(name, email, password, passwordConfirm)
      toast.success('Account created! Welcome to ProjectFlow.')
      navigate('/')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // The API returns field-by-field errors for validation failures
        const apiErrors = err.response?.data?.errors ?? {}
        if (Object.keys(apiErrors).length > 0) {
          // Convert API errors format to our local format
          setErrors({
            name:    apiErrors.name?.[0],
            email:   apiErrors.email?.[0],
            password: apiErrors.password?.[0],
          })
        } else {
          setErrors({ general: err.response?.data?.message ?? 'Registration failed' })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper: returns red border class if field has error, normal otherwise
  const fieldClass = (hasError: boolean) => `
    w-full px-4 py-2.5 rounded-lg border text-sm
    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
    transition-colors
    ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
  `

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Join ProjectFlow today</p>
        </div>

        {errors.general && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              id="name" type="text" autoComplete="name"
              value={name} onChange={(e) => setName(e.target.value)}
              className={fieldClass(!!errors.name)}
              placeholder="Jane Doe"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              id="email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={fieldClass(!!errors.email)}
              placeholder="jane@example.com"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              id="password" type="password" autoComplete="new-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={fieldClass(!!errors.password)}
              placeholder="At least 8 characters"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm password
            </label>
            <input
              id="passwordConfirm" type="password" autoComplete="new-password"
              value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
              className={fieldClass(!!errors.password_confirmation)}
              placeholder="Repeat your password"
            />
            {errors.password_confirmation && (
              <p className="text-xs text-red-600 mt-1">{errors.password_confirmation}</p>
            )}
          </div>

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Creating account…
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage