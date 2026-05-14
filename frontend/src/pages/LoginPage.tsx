import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

// Type for our form's error messages
interface FormErrors {
  email?: string
  password?: string
  general?: string  // Error not tied to a specific field
}

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  // Form field values
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Validation error messages
  const [errors, setErrors]     = useState<FormErrors>({})

  // True while the login API call is in progress
  const [isLoading, setIsLoading] = useState(false)

  // ── CLIENT-SIDE VALIDATION ────────────────────────────────────
  // Run BEFORE sending to the API — catches obvious mistakes instantly

  const validate = (): boolean => {
    const errs: FormErrors = {}

    if (!email.trim()) {
      errs.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      // Regex: has something, then @, then something, then ., then something
      errs.email = 'Please enter a valid email address'
    }

    if (!password) {
      errs.password = 'Password is required'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0  // Valid if no errors
  }

  // ── FORM SUBMIT ───────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  // Prevent default browser form submission (page reload)

    if (!validate()) return  // Stop if validation fails

    setIsLoading(true)
    setErrors({})  // Clear previous errors

    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')  // Go to dashboard after login
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const msg    = err.response?.data?.message

        if (status === 403) {
          // Account deactivated
          setErrors({ general: msg })
        } else {
          // Wrong email or password
          setErrors({ general: 'Invalid email or password' })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🚀</div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to ProjectFlow</p>
          </div>

          {/* General error (not tied to a field) */}
          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // Change border color to red if there's an error for this field
                className={`
                  w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  transition-colors
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
                `}
                placeholder="you@example.com"
              />
              {/* Show error message below field if exists */}
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`
                  w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  transition-colors
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
                `}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60
                text-white font-semibold py-2.5 rounded-lg
                transition-colors text-sm
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Link to register */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs text-indigo-700 font-semibold mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-indigo-600">
            <p>👑 Admin: admin@projectflow.dev / password</p>
            <p>📋 Manager: manager@projectflow.dev / password</p>
            <p>💻 Developer: dev@projectflow.dev / password</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage