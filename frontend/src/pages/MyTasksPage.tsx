// import React, { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { taskApi } from '../services/api'
// import type { Task } from '../types'
// import toast from 'react-hot-toast'

// // Task now carries its project info directly from the API
// interface TaskWithProject extends Task {
//   project?: { id: number; name: string; slug: string }
// }

// const PRIORITY_STYLES: Record<string, string> = {
//   low:      'bg-gray-100 text-gray-600',
//   medium:   'bg-blue-100 text-blue-700',
//   high:     'bg-orange-100 text-orange-700',
//   critical: 'bg-red-100 text-red-700',
// }

// const STATUS_STYLES: Record<string, string> = {
//   todo:        'bg-gray-100 text-gray-700',
//   in_progress: 'bg-blue-100 text-blue-700',
//   in_review:   'bg-yellow-100 text-yellow-700',
//   done:        'bg-green-100 text-green-700',
// }

// const STATUS_LABELS: Record<string, string> = {
//   todo:        'To Do',
//   in_progress: 'In Progress',
//   in_review:   'In Review',
//   done:        'Done',
// }

// const MyTasksPage: React.FC = () => {
//   const navigate = useNavigate()
//   const [tasks, setTasks]         = useState<TaskWithProject[]>([])
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     const loadMyTasks = async () => {
//       try {
//         // Single API call — the backend returns all of the current user's
//         // tasks across every project in one query (no more N+1 loop)
//         const res = await taskApi.myTasks()
//         setTasks(res.data.data as TaskWithProject[])
//       } catch {
//         toast.error('Failed to load your tasks')
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     void loadMyTasks()
//   }, [])

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center py-20">
//         <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
//         <p className="text-gray-500 mt-1">Tasks assigned to you across all projects</p>
//       </div>

//       {tasks.length === 0 ? (
//         <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
//           <span className="text-5xl mb-4 block">🎉</span>
//           <p className="text-gray-500 font-medium">No tasks assigned to you</p>
//           <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
//           <div className="divide-y divide-gray-100">
//             {tasks.map(task => (
//               <div
//                 key={task.id}
//                 onClick={() => task.project && navigate(`/projects/${task.project.slug}`)}
//                 className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
//               >
//                 <div className="flex items-center justify-between gap-4 flex-wrap">
//                   <div className="flex-1 min-w-0">
//                     <p className="font-medium text-gray-900 mb-1">{task.title}</p>
//                     <p className="text-xs text-gray-400">
//                       📁 {task.project?.name ?? 'Unknown project'}
//                       {task.due_date && (
//                         <span className={task.is_overdue ? 'text-red-600 font-semibold ml-3' : 'ml-3'}>
//                           {task.is_overdue ? '⚠️ Overdue' : '📅'} {task.due_date}
//                         </span>
//                       )}
//                     </p>
//                   </div>

//                   <div className="flex items-center gap-2 flex-shrink-0">
//                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
//                       {task.priority}
//                     </span>
//                     <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[task.status]}`}>
//                       {STATUS_LABELS[task.status]}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default MyTasksPage

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskApi } from '../services/api'
import type { Task } from '../types'
import toast from 'react-hot-toast'

// Task now carries its project info directly from the API
interface TaskWithProject extends Task {
  project?: { id: number; name: string; slug: string }
}

const PRIORITY_STYLES: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600',
  medium:   'bg-blue-100 text-blue-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const STATUS_STYLES: Record<string, string> = {
  todo:        'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  in_review:   'bg-yellow-100 text-yellow-700',
  done:        'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  in_review:   'In Review',
  done:        'Done',
}

const MyTasksPage: React.FC = () => {
  const navigate = useNavigate()
  const [tasks, setTasks]         = useState<TaskWithProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMyTasks = async () => {
      try {
        // Single API call — the backend returns all of the current user's
        // tasks across every project in one query (no more N+1 loop)
        const res = await taskApi.myTasks()
        setTasks(res.data.data as TaskWithProject[])
      } catch {
        toast.error('Failed to load your tasks')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMyTasks()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">Tasks assigned to you across all projects</p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl mb-4 block">🎉</span>
          <p className="text-gray-500 font-medium">No tasks assigned to you</p>
          <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => task.project && navigate(`/projects/${task.project.slug}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 mb-1">{task.title}</p>
                    <p className="text-xs text-gray-400">
                      📁 {task.project?.name ?? 'Unknown project'}
                      {task.due_date && (
                        <span className={task.is_overdue ? 'text-red-600 font-semibold ml-3' : 'ml-3'}>
                          {task.is_overdue ? '⚠️ Overdue' : '📅'} {task.due_date}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTasksPage