import axios from 'axios'

// ── IN-MEMORY TOKEN STORAGE ───────────────────────────────────────
// We store the token in memory (a variable), NOT in localStorage.
//
// Why not localStorage?
// localStorage is accessible by ANY JavaScript on the page.
// If there's ever a Cross-Site Scripting (XSS) attack, the attacker
// can steal the token from localStorage.
// A variable in memory is much harder to steal.
//
// Downside: the token is lost on page refresh.
// We handle this by also storing in sessionStorage as a compromise
// (sessionStorage is cleared when the browser tab is closed).

let authToken: string | null = null

// These functions let other files get/set the token
export const setToken = (token: string | null): void => {
  authToken = token
}

export const getToken = (): string | null => authToken

// ── CREATE THE AXIOS INSTANCE ─────────────────────────────────────
// This is a pre-configured version of axios with our API settings

const api = axios.create({
  // VITE_API_BASE_URL comes from the .env file (we'll create it soon)
  // ?? means: if VITE_API_BASE_URL is undefined, use the fallback
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',

  headers: {
    'Content-Type': 'application/json',  // We always send JSON
    'Accept': 'application/json',        // We always want JSON back
  },
})

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────
// This runs BEFORE every request is sent.
// We use it to automatically add the Bearer token to every request.
// Without this, we'd have to manually add the header in every api call.

api.interceptors.request.use(
  (config) => {
    if (authToken) {
      // Add the Authorization header: "Bearer abc123xyz..."
      config.headers.Authorization = `Bearer ${authToken}`
    }
    return config  // Must return config for the request to proceed
  },
  (error) => Promise.reject(error)
)

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────
// This runs AFTER every response is received.
// We use it to handle 401 (Unauthorized) errors automatically.
//
// If the token expires or is invalid, every API call returns 401.
// Instead of handling this in every component, we handle it once here.

api.interceptors.response.use(
  (response) => response,  // Success: just pass through
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Clear the token
      authToken = null

      // Dispatch a custom browser event that AuthContext will listen to
      // This triggers the logout process in our app
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }

    // Always reject so the calling code can also handle the error
    return Promise.reject(error)
  }
)

export default api