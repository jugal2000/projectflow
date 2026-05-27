// // import { useCallback, useEffect, useRef, useState } from 'react'
// // import { projectApi } from '../services/api'
// // import type { Project } from '../types'

// // // These are the options you can pass to customize the hook's behavior
// // interface UseProjectsOptions {
// //   status?: string   // Filter by status e.g. 'active'
// //   search?: string   // Search by name
// //   page?: number     // Which page of results
// // }

// // interface UseProjectsReturn {
// //   projects: Project[]
// //   isLoading: boolean
// //   error: string | null
// //   totalPages: number
// //   reload: () => void  // Call this to manually refresh
// // }

// // export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
// //   const [projects, setProjects]     = useState<Project[]>([])
// //   const [isLoading, setIsLoading]   = useState(true)
// //   const [error, setError]           = useState<string | null>(null)
// //   const [totalPages, setTotalPages] = useState(1)

// //   // ── DEBOUNCED SEARCH ──────────────────────────────────────────
// //   // "Debounce" means: wait until the user STOPS typing before searching
// //   // Without debounce: every keystroke fires an API call
// //   //   user types "e" → API call, "ec" → API call, "eco" → API call...
// //   // With 350ms debounce: only fires AFTER user stops typing for 350ms
// //   //   user types "ecommerce" → waits → ONE API call
// //   //
// //   // useRef stores a value that doesn't cause a re-render when it changes
// //   // We use it to hold the timer ID so we can cancel it

// //   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
// //   const [debouncedSearch, setDebouncedSearch] = useState(options.search ?? '')

// //   useEffect(() => {
// //     // Cancel any pending timer
// //     if (debounceTimer.current) clearTimeout(debounceTimer.current)

// //     // Start a new timer — after 350ms, update the debounced search value
// //     debounceTimer.current = setTimeout(() => {
// //       setDebouncedSearch(options.search ?? '')
// //     }, 350)

// //     // Cleanup: cancel timer if component unmounts or search changes again
// //     return () => {
// //       if (debounceTimer.current) clearTimeout(debounceTimer.current)
// //     }
// //   }, [options.search])  // Re-run whenever search changes

// //   // ── FETCH PROJECTS ────────────────────────────────────────────
// //   // useCallback = memoizes this function so it doesn't get recreated
// //   // on every render. The function only changes when its dependencies change.

// //   const fetchProjects = useCallback(async () => {
// //     setIsLoading(true)
// //     setError(null)

// //     try {
// //       // Build the query params object — only include defined values
// //       const params: Record<string, string | number> = { per_page: 18 }
// //       if (options.status)  params.status = options.status
// //       if (debouncedSearch) params.search = debouncedSearch
// //       if (options.page)    params.page   = options.page

// //       const res = await projectApi.list(params)
// //       setProjects(res.data.data)
// //       setTotalPages(res.data.meta.last_page)
// //     } catch {
// //       setError('Failed to load projects. Please try again.')
// //     } finally {
// //       setIsLoading(false)
// //     }
// //   }, [options.status, options.page, debouncedSearch])
// //   // ↑ Only recreate fetchProjects when these values change

// //   // Run fetchProjects whenever it changes (i.e., when filters change)
// //   useEffect(() => {
// //     const loadProjects = async () => {
// //       await fetchProjects()
// //     }

// //     void loadProjects()
// //   }, [fetchProjects])

// //   return { projects, isLoading, error, totalPages, reload: fetchProjects }
// // }

// import { useCallback, useEffect, useRef, useState } from 'react'
// import { projectApi } from '../services/api'
// import type { Project } from '../types'

// interface UseProjectsOptions {
//   status?: string
//   search?: string
//   page?: number
// }

// interface UseProjectsReturn {
//   projects: Project[]
//   isLoading: boolean      // True only on first load
//   isRefreshing: boolean   // True when re-fetching with new filters
//   error: string | null
//   totalPages: number
//   reload: () => void
// }

// export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
//   const [projects, setProjects]         = useState<Project[]>([])
//   const [isLoading, setIsLoading]       = useState(true)
//   const [isRefreshing, setIsRefreshing] = useState(false)
//   const [error, setError]               = useState<string | null>(null)
//   const [totalPages, setTotalPages]     = useState(1)

//   // Track if this is the first load
//   const isFirstLoad = useRef(true)

//   // ── DEBOUNCED SEARCH ──────────────────────────────────────────
//   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
//   const [debouncedSearch, setDebouncedSearch] = useState(options.search ?? '')

//   useEffect(() => {
//     if (debounceTimer.current) clearTimeout(debounceTimer.current)
//     debounceTimer.current = setTimeout(() => {
//       setDebouncedSearch(options.search ?? '')
//     }, 400) // 400ms wait after typing stops

//     return () => {
//       if (debounceTimer.current) clearTimeout(debounceTimer.current)
//     }
//   }, [options.search])

//   // ── FETCH PROJECTS ────────────────────────────────────────────
//   const fetchProjects = useCallback(async () => {
//     // Use loading only on first load — use refreshing on subsequent fetches
//     // This prevents the skeleton from showing every time you type
//     if (isFirstLoad.current) {
//       setIsLoading(true)
//     } else {
//       setIsRefreshing(true)
//     }
//     setError(null)

//     try {
//       const params: Record<string, string | number> = { per_page: 18 }
//       if (options.status)  params.status = options.status
//       if (debouncedSearch) params.search = debouncedSearch
//       if (options.page)    params.page   = options.page

//       const res = await projectApi.list(params)
//       setProjects(res.data.data)
//       setTotalPages(res.data.meta.last_page)
//     } catch {
//       setError('Failed to load projects. Please try again.')
//     } finally {
//       setIsLoading(false)
//       setIsRefreshing(false)
//       isFirstLoad.current = false  // After first call, all future calls are refreshes
//     }
//   }, [options.status, options.page, debouncedSearch])

//   useEffect(() => {
//     fetchProjects()
//   }, [fetchProjects])

//   return { projects, isLoading, isRefreshing, error, totalPages, reload: fetchProjects }
// }

import { useEffect, useRef, useState } from 'react'
import { projectApi } from '../services/api'
import type { Project } from '../types'

interface UseProjectsOptions {
  status?: string
  search?: string
  page?: number
}

interface UseProjectsReturn {
  projects: Project[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  totalPages: number
  reload: () => void
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects]         = useState<Project[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [totalPages, setTotalPages]     = useState(1)

  // Use STATE (not ref) for reload trigger so React tracks it properly
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const isFirstLoad = useRef(true)

  // ── DEBOUNCED SEARCH ──────────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState(options.search ?? '')

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(options.search ?? '')
    }, 400)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [options.search])

  // ── FETCH PROJECTS ────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      if (isFirstLoad.current) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      try {
        const params: Record<string, string | number> = { per_page: 18 }
        if (options.status)  params.status = options.status
        if (debouncedSearch) params.search = debouncedSearch
        if (options.page)    params.page   = options.page

        const res = await projectApi.list(params)
        setProjects(res.data.data)
        setTotalPages(res.data.meta.last_page)
      } catch {
        setError('Failed to load projects. Please try again.')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
        isFirstLoad.current = false
      }
    }

    void fetchProjects()
  }, [options.status, options.page, debouncedSearch, reloadTrigger])

  // Manual reload — increment the trigger to re-run the effect
  const reload = () => {
    setReloadTrigger(prev => prev + 1)
  }

  return {
    projects,
    isLoading,
    isRefreshing,
    error,
    totalPages,
    reload,
  }
}