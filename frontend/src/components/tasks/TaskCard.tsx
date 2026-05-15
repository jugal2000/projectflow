import React, { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  task: Task
  onTaskClick: (task: Task) => void
  isDragging?: boolean   // True when this card is being dragged (the overlay copy)
}

// Color classes for each priority level
const PRIORITY_STYLES: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-blue-100 text-blue-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const PRIORITY_ICONS: Record<string, string> = {
  low: '▽', medium: '◇', high: '▲', critical: '🔴',
}

// ── WHY memo() HERE? ──────────────────────────────────────────────
// memo() means: only re-render this component if its PROPS changed.
// Without memo: when ANY task changes, ALL cards re-render.
// With memo: only the changed card re-renders.
// On a board with 50 tasks, this is a huge performance win.

const TaskCard: React.FC<Props> = memo(({ task, onTaskClick, isDragging = false }) => {

  // useSortable gives us everything needed for drag-and-drop
  const {
    attributes,    // Accessibility attributes (aria-*)
    listeners,     // Event handlers (onMouseDown, onTouchStart, etc.)
    setNodeRef,    // Ref to attach to our DOM element
    transform,     // Current drag position (x, y offset)
    transition,    // CSS transition for smooth animation
    isDragging: isSortableDragging, // True when THIS card is being dragged
  } = useSortable({ id: task.id })

  // Convert the transform object to a CSS string
  // e.g. { x: 10, y: 20 } → "translate3d(10px, 20px, 0)"
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Make original card semi-transparent while dragging
    // (the DragOverlay shows the "ghost" that follows your cursor)
    opacity: isSortableDragging ? 0.3 : 1,
  }

  // Get initials from assignee's name for the avatar
  // "Alice Dev" → "AD"
  const avatarInitials = task.assignee
    ? task.assignee.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null

  return (
    <div
      ref={setNodeRef}         // Connect this div to dnd-kit
      style={style}            // Apply drag transform
      {...attributes}          // Accessibility attributes
      {...listeners}           // Drag event handlers
      onClick={() => {
        // Don't open the modal if user is dragging
        if (!isDragging && !isSortableDragging) {
          onTaskClick(task)
        }
      }}
      className={`
        bg-white rounded-lg border border-gray-200 p-3
        cursor-pointer select-none
        hover:shadow-md hover:border-indigo-200
        transition-shadow
        ${isDragging ? 'shadow-xl rotate-1' : ''}
      `}
    >
      {/* Task title */}
      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>

      {/* Priority badge + assignee avatar */}
      <div className="flex items-center justify-between gap-2">
        <span className={`
          text-xs font-semibold px-2 py-0.5 rounded-full
          ${PRIORITY_STYLES[task.priority]}
        `}>
          {PRIORITY_ICONS[task.priority]} {task.priority}
        </span>

        {/* Assignee avatar circle */}
        {avatarInitials && (
          <div
            className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
            title={task.assignee?.name}
          >
            {avatarInitials}
          </div>
        )}
      </div>

      {/* Due date — red if overdue */}
      {task.due_date && (
        <div className={`
          mt-2 text-xs flex items-center gap-1
          ${task.is_overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}
        `}>
          {task.is_overdue ? (
            <>
              <span>⚠️</span>
              <span>
                Overdue {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
              </span>
            </>
          ) : (
            <>
              <span>📅</span>
              <span>Due {task.due_date}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
})

// displayName helps with debugging in React DevTools
TaskCard.displayName = 'TaskCard'

export default TaskCard