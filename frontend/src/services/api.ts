// This file has one function for every API endpoint.
// Components import these functions instead of using axios directly.

import api from './axios'
import type {
  ApiResponse,
  Comment,
  LoginCredentials,
  PaginatedResponse,
  Project,
  ProjectStats,
  RegisterData,
  Task,
  User,
} from '../types'

// ── AUTH API ──────────────────────────────────────────────────────

export const authApi = {
  // Returns a token and user object
  login: (data: LoginCredentials) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data),

  register: (data: RegisterData) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data),

  // No request body needed — the token in the header identifies the user
  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  // Returns the currently logged-in user
  me: () =>
    api.get<ApiResponse<User>>('/auth/me'),
}

// ── PROJECTS API ──────────────────────────────────────────────────

export const projectApi = {
  // params = optional filters like { status: 'active', search: 'ecommerce' }
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }),

  get: (slug: string) =>
    api.get<ApiResponse<Project>>(`/projects/${slug}`),

  create: (data: Partial<Project>) =>
    api.post<ApiResponse<Project>>('/projects', data),

  update: (slug: string, data: Partial<Project>) =>
    api.put<ApiResponse<Project>>(`/projects/${slug}`, data),

  delete: (slug: string) =>
    api.delete<ApiResponse<null>>(`/projects/${slug}`),

  stats: (slug: string) =>
    api.get<ApiResponse<ProjectStats>>(`/projects/${slug}/stats`),
}

// ── TASKS API ─────────────────────────────────────────────────────

export const taskApi = {
  list: (slug: string, params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Task>>(`/projects/${slug}/tasks`, { params }),

  create: (slug: string, data: Partial<Task>) =>
    api.post<ApiResponse<Task>>(`/projects/${slug}/tasks`, data),

  update: (id: number, data: Partial<Task>) =>
    api.put<ApiResponse<Task>>(`/tasks/${id}`, data),

  // Change task status — separate from update() because of business rules
  changeStatus: (id: number, status: string, actualHours?: number) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, {
      status,
      actual_hours: actualHours,
    }),

  assign: (id: number, userId: number | null) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}/assign`, { user_id: userId }),

  // Bulk reorder after drag and drop
  reorder: (tasks: Array<{ id: number; sort_order: number }>) =>
    api.post<ApiResponse<null>>('/tasks/reorder', { tasks }),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`),
}

// ── COMMENTS API ──────────────────────────────────────────────────

export const commentApi = {
  list: (taskId: number) =>
    api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`),

  // parentId is optional — only for replies
  create: (taskId: number, body: string, parentId?: number) =>
    api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, {
      body,
      parent_id: parentId,
    }),

  update: (id: number, body: string) =>
    api.put<ApiResponse<Comment>>(`/comments/${id}`, { body }),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/comments/${id}`),
}