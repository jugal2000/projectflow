import React, { memo, useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '../../types'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'

// Column definitions — order matters (left to right)
const COLUMNS: {
  id: TaskStatus
  label: string
  headerColor: string
}[] = [
  { id: 'todo',        label: 'To Do',       headerColor: 'bg-gray-100' },
  { id: 'in_progress', label: 'In Progress',  headerColor: 'bg-blue-100' },
  { id: 'in_review',   label: 'In Review',    headerColor: 'bg-yellow-100' },
  { id: 'done',        label: 'Done',         headerColor: 'bg-green-100' },
]

interface Props {
  tasks: Task[]
  onStatusChange: (taskId: number, status: TaskStatus, actualHours?: number) => void
  onReorder: (updates: Array<{ id: number; sort_order: number }>) => void
  onTaskClick: (task: Task) => void
}

// ── WHY memo() HERE? ──────────────────────────────────────────────
// The entire board is wrapped in memo so it only re-renders
// when the tasks array or handlers actually change.

const KanbanBoard: React.FC<Props> = memo(({
  tasks,
  onStatusChange,
  onReorder,
  onTaskClick,
}) => {

  // The task currently being dragged (for showing in DragOverlay)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // ── GROUP TASKS BY STATUS ─────────────────────────────────────
  // useMemo = only recalculate when tasks changes, not on every render
  // This is important! Without useMemo, this runs on EVERY re-render
  // even if tasks hasn't changed.

  const columnTasks = useMemo(() => {
    // Start with empty arrays for each column
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [], in_progress: [], in_review: [], done: [],
    }

    // Put each task in the right column
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }

    // Sort tasks within each column by sort_order
    for (const key of Object.keys(grouped) as TaskStatus[]) {
      grouped[key].sort((a, b) => a.sort_order - b.sort_order)
    }

    return grouped
  }, [tasks])   // Only recompute when tasks array changes

  // ── DND SENSORS ───────────────────────────────────────────────
  // Sensors detect HOW the user initiates dragging
  // PointerSensor works for both mouse and touch
  // distance: 5 means user must move 5px before drag starts
  // This prevents accidentally dragging when just clicking

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  // ── DRAG START ─────────────────────────────────────────────────
  // Called when user starts dragging a card
  // useCallback = memoize this function so KanbanColumn doesn't re-render
  // when other things change

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find(t => t.id === Number(event.active.id))
    setActiveTask(task ?? null)
  }, [tasks])

  // ── DRAG END ───────────────────────────────────────────────────
  // Called when user drops a card
  // This is where all the logic happens

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null)  // Clear the dragged task

    const { active, over } = event
    if (!over) return  // Dropped in an invalid area

    const activeId   = Number(active.id)
    const overId     = String(over.id)
    const activeTask = tasks.find(t => t.id === activeId)

    if (!activeTask) return

    // ── CASE 1: Dropped on a COLUMN ───────────────────────────
    // The over.id is a column ID (e.g. 'todo', 'in_progress')
    const isColumnDrop = COLUMNS.some(c => c.id === overId)

    if (isColumnDrop) {
      const newStatus = overId as TaskStatus

      // Only do something if status actually changed
      if (activeTask.status !== newStatus) {
        // Special case: moving to 'done' requires actual hours
        if (newStatus === 'done') {
          const hours = window.prompt(
            'How many hours did this task actually take?\n(Required to mark as Done)'
          )
          if (!hours || isNaN(Number(hours)) || Number(hours) < 0) {
            return  // User cancelled or entered invalid input
          }
          onStatusChange(activeId, newStatus, Number(hours))
        } else {
          onStatusChange(activeId, newStatus)
        }
      }
      return
    }

    // ── CASE 2: Dropped on another TASK ───────────────────────
    // The over.id is a task ID (a number)
    const overTask = tasks.find(t => t.id === Number(over.id))
    if (!overTask) return

    if (activeTask.status === overTask.status) {
      // Same column — REORDER within column
      const colTasks  = columnTasks[activeTask.status]
      const oldIndex  = colTasks.findIndex(t => t.id === activeId)
      const newIndex  = colTasks.findIndex(t => t.id === Number(over.id))

      if (oldIndex !== newIndex) {
        // arrayMove returns a new array with the item moved
        // e.g. arrayMove(['a','b','c'], 0, 2) → ['b','c','a']
        const reordered = arrayMove(colTasks, oldIndex, newIndex)

        // Build the update payload: [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }, ...]
        const updates = reordered.map((t, i) => ({ id: t.id, sort_order: i }))
        onReorder(updates)
      }
    } else {
      // Different column — change STATUS to match the target column
      if (overTask.status === 'done') {
        const hours = window.prompt('How many hours did this task take?')
        if (!hours || isNaN(Number(hours))) return
        onStatusChange(activeId, overTask.status, Number(hours))
      } else {
        onStatusChange(activeId, overTask.status)
      }
    }
  }, [tasks, columnTasks, onStatusChange, onReorder])

  return (
    // DndContext is the container for all drag-and-drop behavior
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      // closestCorners = figure out which column/task the dragged card is closest to
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 4 columns side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            headerColor={col.headerColor}
            tasks={columnTasks[col.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {/* DragOverlay = the "ghost" card that follows your cursor while dragging */}
      {/* It renders OUTSIDE the normal layout so it floats on top of everything */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onTaskClick={() => {}}
            isDragging={true}   // Tells the card to use the dragging style
          />
        ) : null}
      </DragOverlay>

    </DndContext>
  )
})

KanbanBoard.displayName = 'KanbanBoard'

export default KanbanBoard