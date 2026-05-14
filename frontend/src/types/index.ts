// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS FOR THE ENTIRE APP
// ═══════════════════════════════════════════════════════════════
// These match EXACTLY the JSON that our Laravel API sends back.
// If the API changes, we update these types and TypeScript
// will show errors everywhere the change affects.

// ── USER ─────────────────────────────────────────────────────────

// UserRole can only be one of these 3 strings — nothing else
export type UserRole = 'admin' | 'manager' | 'developer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  avatar_url: string | null  // string OR null (not undefined)
  is_active: boolean
  created_at: string         // ISO date string from the API
}

// ── PROJECT ───────────────────────────────────────────────────────

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'archived'

export interface Project {
  id: number
  name: string
  slug: string               // URL-friendly version of name
  description: string
  status: ProjectStatus
  owner: User                // Nested user object
  start_date: string
  end_date: string | null
  budget: string | null      // Comes as string from API (decimal type)
  task_summary: Record<TaskStatus, number>
  // Record<K, V> = an object where keys are K and values are V
  // e.g. { todo: 3, in_progress: 2, in_review: 1, done: 5 }
  total_tasks: number
  done_tasks: number
  created_at: string
  updated_at: string
}

// ── TASK ──────────────────────────────────────────────────────────

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee: User | null        // null if unassigned
  assigned_to: number | null   // just the ID
  due_date: string | null
  is_overdue: boolean          // calculated by the API
  estimated_hours: number | null
  actual_hours: number | null
  sort_order: number
  allowed_transitions: TaskStatus[]  // which statuses we can move to
  created_at: string
  updated_at: string
}

// ── COMMENT ───────────────────────────────────────────────────────

export interface Comment {
  id: number
  body: string
  parent_id: number | null
  author: User
  replies: Comment[]         // Nested comments — same type, recursive!
  created_at: string
  updated_at: string
  can_edit: boolean          // Can the current user edit this?
}

// ── ACTIVITY LOG ──────────────────────────────────────────────────

export interface ActivityLog {
  id: number
  action: string
  properties: Record<string, unknown> | null
  user: User
  created_at: string
}

// ── PROJECT STATS ─────────────────────────────────────────────────

export interface ProjectStats {
  tasks_by_status: Record<TaskStatus, number>
  total_tasks: number
  estimated_hours: number
  actual_hours: number
  overdue_count: number
  completion_pct: number
}

// ── API RESPONSE WRAPPERS ─────────────────────────────────────────
// These match the shape of every response from our BaseController

// Single item response: { success: true, message: "...", data: {...} }
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// Paginated response: { success: true, data: [...], meta: {...} }
export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// ── FORM DATA TYPES ───────────────────────────────────────────────
// Used when sending data TO the API

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}