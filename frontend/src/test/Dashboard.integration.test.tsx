import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── MOCKS ─────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  projectApi: {
    list:  vi.fn(),
    get:   vi.fn(),
    stats: vi.fn(),
  },
  taskApi: {
    list: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id:         1,
      name:       'Admin User',
      role:       'admin',
      email:      'admin@test.com',
      is_active:  true,
      avatar_url: null,
      created_at: '',
    },
    isAuthenticated: true,
    isLoading:       false,
    logout:          vi.fn(),
    login:           vi.fn(),
    register:        vi.fn(),
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

// ── FULLY MOCK dnd-kit to prevent KanbanColumn errors ─────────────
vi.mock('@dnd-kit/core', () => ({
  DndContext:     ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay:    () => null,
  PointerSensor:  class {},
  closestCorners: vi.fn(),
  useSensor:      vi.fn(),
  useSensors:     vi.fn(() => []),
  useDroppable:   () => ({
    setNodeRef: vi.fn(),
    isOver:     false,
  }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  verticalListSortingStrategy: {},
  arrayMove:                   vi.fn(),
  useSortable: () => ({
    attributes:  {},
    listeners:   {},
    setNodeRef:  vi.fn(),
    transform:   null,
    transition:  null,
    isDragging:  false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

import { projectApi, taskApi } from '../services/api'
import DashboardPage     from '../pages/DashboardPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'

// ── SAMPLE DATA ───────────────────────────────────────────────────

const mockOwner = {
  id:         1,
  name:       'Admin User',
  email:      'admin@test.com',
  role:       'admin' as const,
  avatar_url: null,
  is_active:  true,
  created_at: '',
}

const mockProjects = [
  {
    id:           1,
    name:         'E-Commerce Platform',
    slug:         'e-commerce-platform',
    description:  'Build a full e-commerce website.',
    status:       'active' as const,
    owner:        mockOwner,
    start_date:   '2025-01-01',
    end_date:     null,
    budget:       null,
    task_summary: { todo: 2, in_progress: 1, in_review: 0, done: 2 },
    total_tasks:  5,
    done_tasks:   2,
    created_at:   '',
    updated_at:   '',
  },
]

const mockTasks = [
  {
    id:                  1,
    project_id:          1,
    title:               'Set up CI/CD pipeline',
    description:         null,
    status:              'done' as const,
    priority:            'high' as const,
    assignee:            mockOwner,
    assigned_to:         1,
    due_date:            null,
    is_overdue:          false,
    estimated_hours:     8,
    actual_hours:        10,
    sort_order:          0,
    allowed_transitions: ['in_review' as const],
    created_at:          '',
    updated_at:          '',
  },
  {
    id:                  2,
    project_id:          1,
    title:               'Shopping cart functionality',
    description:         null,
    status:              'todo' as const,
    priority:            'high' as const,
    assignee:            null,
    assigned_to:         null,
    due_date:            '2025-04-01',
    is_overdue:          true,
    estimated_hours:     24,
    actual_hours:        null,
    sort_order:          0,
    allowed_transitions: ['in_progress' as const],
    created_at:          '',
    updated_at:          '',
  },
]

// ── TESTS ─────────────────────────────────────────────────────────

describe('Dashboard Integration', () => {

  beforeEach(() => {
    vi.mocked(projectApi.list).mockResolvedValue({
      data: {
        success: true,
        message: 'Success',
        data:    mockProjects,
        meta:    { current_page: 1, last_page: 1, per_page: 18, total: 1 },
      },
    } as never)

    vi.mocked(projectApi.get).mockResolvedValue({
      data: {
        success: true,
        message: 'Success',
        data:    mockProjects[0],
      },
    } as never)

    vi.mocked(taskApi.list).mockResolvedValue({
      data: {
        success: true,
        message: 'Success',
        data:    mockTasks,
        meta:    { current_page: 1, last_page: 1, per_page: 100, total: 2 },
      },
    } as never)
  })

  // ── DASHBOARD TESTS ─────────────────────────────────────────────

  it('loads and displays project name on the dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for project name to appear
    await waitFor(() => {
      expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument()
    })
  })

  it('shows project description on dashboard card', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/build a full e-commerce/i)).toBeInTheDocument()
    })
  })

  it('shows project status badge on dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument()
    })

    // Use getAllByText since "Active" might appear multiple times
    // and check at least one exists
    const activeElements = screen.getAllByText(/active/i)
    expect(activeElements.length).toBeGreaterThan(0)
  })

  // ── PROJECT DETAIL / KANBAN TESTS ───────────────────────────────

  it('shows kanban column headers on project detail page', async () => {
    render(
      <MemoryRouter initialEntries={['/projects/e-commerce-platform']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for project to load
    await waitFor(() => {
      expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument()
    }, { timeout: 3000 })

    // All 4 kanban column headers must be visible
    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('In Review')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('shows task titles on the kanban board', async () => {
    render(
      <MemoryRouter initialEntries={['/projects/e-commerce-platform']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Set up CI/CD pipeline')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText('Shopping cart functionality')).toBeInTheDocument()
  })
})