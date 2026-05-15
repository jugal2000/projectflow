import React, { memo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '../../types'
import TaskCard from './TaskCard'

interface Props {
  columnId: TaskStatus          // 'todo' | 'in_progress' | 'in_review' | 'done'
  label: string                 // Display name: 'To Do'
  headerColor: string           // Tailwind class for the header background
  tasks: Task[]                 // Tasks in this column
  onTaskClick: (task: Task) => void
}

// ── WHY memo() HERE? ──────────────────────────────────────────────
// We have 4 columns. When one task moves, only 2 columns change
// (the source and destination). memo() prevents the other 2 from re-rendering.

const KanbanColumn: React.FC<Props> = memo(({
  columnId, label, headerColor, tasks, onTaskClick
}) => {

  // useDroppable makes this element a valid drop target
  // When a card is dragged over this column, isOver becomes true
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div
      className={`
        rounded-xl border-2 flex flex-col min-h-96 transition-colors duration-200
        ${isOver
          ? 'border-indigo-400 bg-indigo-50'    // Highlight when dragging over
          : 'border-gray-200 bg-gray-50'         // Normal state
        }
      `}
    >
      {/* Column header */}
      <div className={`${headerColor} px-4 py-3 rounded-t-xl flex items-center justify-between`}>
        <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
        {/* Task count badge */}
        <span className="bg-white text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center">
          {tasks.length}
        </span>
      </div>

      {/* Task list — this is also the drop zone */}
      {/* We need a ref here AND on SortableContext items for proper drop detection */}
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto">

        {/* SortableContext manages the ordered list of sortable items */}
        <SortableContext
          items={tasks.map(t => t.id)}   // IDs of all tasks in this column
          strategy={verticalListSortingStrategy}  // Vertical list layout
        >
          {tasks.length === 0 ? (
            // Empty state — shown when column has no tasks
            <div className={`
              flex items-center justify-center h-20 rounded-lg border-2 border-dashed
              text-xs text-gray-400
              ${isOver ? 'border-indigo-300' : 'border-gray-200'}
            `}>
              Drop tasks here
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
})

KanbanColumn.displayName = 'KanbanColumn'

export default KanbanColumn