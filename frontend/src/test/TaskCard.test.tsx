import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Task, User } from '../types'

// Mock dnd-kit so TaskCard renders without real drag context
vi.mock('@dnd-kit/sortable', () => ({
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
  CSS: {
    Transform: { toString: () => '' }
  },
}))

import TaskCard from '../components/tasks/TaskCard'

// ── SAMPLE DATA ───────────────────────────────────────────────────

const mockUser: User = {
  id:         1,
  name:       'Alice Dev',
  email:      'alice@test.com',
  role:       'developer',
  avatar_url: null,
  is_active:  true,
  created_at: new Date().toISOString(),
}

// Factory: creates a complete Task, letting us override specific fields per test
const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id:                  42,
  project_id:          1,
  title:               'Fix login bug',
  description:         'Bug details here',
  status:              'in_progress',
  priority:            'high',
  assignee:            mockUser,
  assigned_to:         1,
  due_date:            '2099-01-01',
  is_overdue:          false,
  estimated_hours:     4,
  actual_hours:        null,
  sort_order:          0,
  allowed_transitions: ['in_review', 'todo'],
  created_at:          new Date().toISOString(),
  updated_at:          new Date().toISOString(),
  ...overrides,
})

// ── TESTS ─────────────────────────────────────────────────────────

describe('TaskCard', () => {

  it('renders the task title', () => {
    render(<TaskCard task={makeTask()} onTaskClick={vi.fn()} />)

    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
  })

  it('renders the priority badge', () => {
    render(<TaskCard task={makeTask()} onTaskClick={vi.fn()} />)

    expect(screen.getByText(/high/i)).toBeInTheDocument()
  })

  it('renders assignee initials in avatar', () => {
    render(<TaskCard task={makeTask()} onTaskClick={vi.fn()} />)

    // "Alice Dev" → first letters → "AD"
    expect(screen.getByText('AD')).toBeInTheDocument()
  })

  it('calls onTaskClick when card is clicked', () => {
    const handleClick = vi.fn()

    render(<TaskCard task={makeTask()} onTaskClick={handleClick} />)

    fireEvent.click(screen.getByText('Fix login bug'))

    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42 })
    )
  })

  it('shows overdue warning when task is overdue', () => {
    render(
      <TaskCard
        task={makeTask({ is_overdue: true, due_date: '2020-01-01' })}
        onTaskClick={vi.fn()}
      />
    )

    expect(screen.getByText(/overdue/i)).toBeInTheDocument()
  })

  it('does not show overdue warning for non-overdue task', () => {
    render(
      <TaskCard
        task={makeTask({ is_overdue: false, due_date: '2099-01-01' })}
        onTaskClick={vi.fn()}
      />
    )

    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument()
  })

  it('does not render avatar when task has no assignee', () => {
    render(
      <TaskCard
        task={makeTask({ assignee: null, assigned_to: null })}
        onTaskClick={vi.fn()}
      />
    )

    expect(screen.queryByText('AD')).not.toBeInTheDocument()
  })
})