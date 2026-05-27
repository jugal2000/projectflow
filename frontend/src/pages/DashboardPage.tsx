// import React, { useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import { useProjects } from '../hooks/useProjects'
// import SkeletonLoader from '../components/ui/SkeletonLoader'
// import type { Project, ProjectStatus } from '../types'

// // ── STATUS DISPLAY CONFIG ─────────────────────────────────────────
// const STATUS_LABELS: Record<ProjectStatus, string> = {
//   planning:  'Planning',
//   active:    'Active',
//   on_hold:   'On Hold',
//   completed: 'Completed',
//   archived:  'Archived',
// }

// const STATUS_COLORS: Record<ProjectStatus, string> = {
//   planning:  'bg-gray-100 text-gray-600',
//   active:    'bg-green-100 text-green-700',
//   on_hold:   'bg-yellow-100 text-yellow-700',
//   completed: 'bg-blue-100 text-blue-700',
//   archived:  'bg-red-100 text-red-700',
// }

// // ── STAT CARD ─────────────────────────────────────────────────────
// // The 4 summary boxes at the top of the dashboard

// interface StatCardProps {
//   label: string
//   value: number | string
//   icon: string
//   color: string
//   subtitle?: string
// }

// const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtitle }) => (
//   <div className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm`}>
//     <div className="flex items-start justify-between">
//       <div>
//         <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
//         <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
//         {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
//       </div>
//       <span className="text-2xl">{icon}</span>
//     </div>
//   </div>
// )

// // ── PROJECT CARD ──────────────────────────────────────────────────
// // Each project shown as a card in the grid

// interface ProjectCardProps {
//   project: Project
//   onClick: () => void
// }

// const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
//   // Calculate completion percentage
//   const pct = project.total_tasks > 0
//     ? Math.round((project.done_tasks / project.total_tasks) * 100)
//     : 0

//   return (
//     <div
//       onClick={onClick}
//       className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
//     >
//       {/* Header: name + status badge */}
//       <div className="flex items-start justify-between gap-3 mb-3">
//         <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
//           {project.name}
//         </h3>
//         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[project.status]}`}>
//           {STATUS_LABELS[project.status]}
//         </span>
//       </div>

//       {/* Description */}
//       <p className="text-sm text-gray-500 line-clamp-2 mb-4">
//         {project.description}
//       </p>

//       {/* Progress bar */}
//       <div className="mb-3">
//         <div className="flex justify-between text-xs text-gray-400 mb-1">
//           <span>Progress</span>
//           <span>{pct}%</span>
//         </div>
//         <div className="w-full bg-gray-100 rounded-full h-1.5">
//           <div
//             className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
//             style={{ width: `${pct}%` }}
//           />
//         </div>
//       </div>

//       {/* Footer: task count + owner */}
//       <div className="flex items-center justify-between text-xs text-gray-400">
//         <span>📋 {project.total_tasks} tasks</span>
//         <span>👤 {project.owner.name}</span>
//       </div>
//     </div>
//   )
// }

// // ── MAIN DASHBOARD PAGE ───────────────────────────────────────────

// const DashboardPage: React.FC = () => {
//   const { user } = useAuth()
//   const navigate  = useNavigate()

//   // Filter and search state
//   const [statusFilter, setStatusFilter] = useState('')
//   const [searchQuery, setSearchQuery]   = useState('')

//   // Fetch projects using our hook (search is debounced inside the hook)
//   const { projects, isLoading, error, reload } = useProjects({
//     status: statusFilter || undefined,
//     search: searchQuery  || undefined,
//   })

//   // ── DASHBOARD STATS ───────────────────────────────────────────
//   // Calculate summary numbers from the loaded projects
//   // useMemo = only recalculate when 'projects' array changes

//   const stats = useMemo(() => {
//     const totalProjects  = projects.length
//     const activeProjects = projects.filter(p => p.status === 'active').length

//     // Count tasks assigned to ME across all projects
//     const myActiveTasks = projects.reduce((sum, project) => {
//       const myCount = (project.task_summary?.['in_progress'] ?? 0)
//       return sum + myCount
//     }, 0)

//     // Count overdue tasks (we know total done, total tasks)
//     const totalDone = projects.reduce((sum, p) => sum + p.done_tasks, 0)
//     const total     = projects.reduce((sum, p) => sum + p.total_tasks, 0)

//     return { totalProjects, activeProjects, myActiveTasks, totalDone, total }
//   }, [projects])

//   if (isLoading) return <SkeletonLoader type="dashboard" />

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 text-center">
//         <span className="text-4xl mb-4">😕</span>
//         <p className="text-gray-600 mb-4">{error}</p>
//         <button
//           onClick={reload}
//           className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
//         >
//           Try Again
//         </button>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-8">

//       {/* ── PAGE HEADER ── */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">
//           Good day, {user?.name?.split(' ')[0]} 👋
//         </h1>
//         <p className="text-gray-500 mt-1">Here's what's happening across your projects.</p>
//       </div>

//       {/* ── SUMMARY STAT CARDS ── */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//         <StatCard
//           label="Total Projects"
//           value={stats.totalProjects}
//           icon="📁"
//           color="text-indigo-600"
//         />
//         <StatCard
//           label="Active Projects"
//           value={stats.activeProjects}
//           icon="🔥"
//           color="text-green-600"
//         />
//         <StatCard
//           label="Tasks In Progress"
//           value={stats.myActiveTasks}
//           icon="⚡"
//           color="text-orange-600"
//         />
//         <StatCard
//           label="Tasks Completed"
//           value={stats.totalDone}
//           icon="✅"
//           color="text-blue-600"
//           subtitle={`of ${stats.total} total`}
//         />
//       </div>

//       {/* ── FILTER BAR ── */}
//       <div className="flex flex-col sm:flex-row gap-3">

//         {/* Search input */}
//         <div className="relative flex-1">
//   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
//   <input
//     type="search"
//     placeholder="Search projects…"
//     value={searchQuery}
//     onChange={(e) => setSearchQuery(e.target.value)}
//     onKeyDown={(e) => {
//       // Prevent form submission on Enter key (which causes page refresh)
//       if (e.key === 'Enter') e.preventDefault()
//     }}
//     className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
//     autoComplete="off"
//   />
// </div>

//         {/* Status filter dropdown */}
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700"
//         >
//           <option value="">All Statuses</option>
//           <option value="planning">Planning</option>
//           <option value="active">Active</option>
//           <option value="on_hold">On Hold</option>
//           <option value="completed">Completed</option>
//           <option value="archived">Archived</option>
//         </select>
//       </div>

//       {/* ── PROJECT GRID ── */}
//       {projects.length === 0 ? (
//         // Empty state
//         <div className="text-center py-20">
//           <span className="text-5xl mb-4 block">📭</span>
//           <p className="text-gray-500 font-medium">No projects found</p>
//           <p className="text-gray-400 text-sm mt-1">
//             {searchQuery || statusFilter
//               ? 'Try changing your filters'
//               : 'Projects will appear here once created'}
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {projects.map(project => (
//             <ProjectCard
//               key={project.id}
//               project={project}
//              onClick={() => navigate(`/projects/${encodeURIComponent(project.slug)}`)}
//             />
//           ))}
//         </div>
//       )}

//     </div>
//   )
// }

// export default DashboardPage


// code 2


// import React, { useCallback, useMemo, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'
// import { useProjects } from '../hooks/useProjects'
// import SkeletonLoader from '../components/ui/SkeletonLoader'
// import type { Project, ProjectStatus } from '../types'
// import CreateProjectModal from '../components/projects/CreateProjectModal'

// // ── STATUS DISPLAY CONFIG ─────────────────────────────────────────
// const STATUS_LABELS: Record<ProjectStatus, string> = {
//   planning:  'Planning',
//   active:    'Active',
//   on_hold:   'On Hold',
//   completed: 'Completed',
//   archived:  'Archived',
// }

// const STATUS_COLORS: Record<ProjectStatus, string> = {
//   planning:  'bg-gray-100 text-gray-600',
//   active:    'bg-green-100 text-green-700',
//   on_hold:   'bg-yellow-100 text-yellow-700',
//   completed: 'bg-blue-100 text-blue-700',
//   archived:  'bg-red-100 text-red-700',
// }

// // ── STAT CARD ─────────────────────────────────────────────────────

// interface StatCardProps {
//   label: string
//   value: number | string
//   icon: string
//   color: string
//   subtitle?: string
// }

// const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtitle }) => (
//   <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
//     <div className="flex items-start justify-between">
//       <div>
//         <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
//         <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
//         {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
//       </div>
//       <span className="text-2xl">{icon}</span>
//     </div>
//   </div>
// )

// // ── PROJECT CARD ──────────────────────────────────────────────────

// interface ProjectCardProps {
//   project: Project
//   onClick: () => void
//   disabled: boolean
// }

// const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, onClick, disabled }) => {
//   const pct = project.total_tasks > 0
//     ? Math.round((project.done_tasks / project.total_tasks) * 100)
//     : 0

//   // FIX 4: Prevent multiple rapid clicks at the card level
//   const handleClick = useCallback(
//     (e: React.MouseEvent) => {
//       e.preventDefault()
//       e.stopPropagation()
//       if (disabled) return
//       onClick()
//     },
//     [onClick, disabled]
//   )

//   return (
//     <div
//       onClick={handleClick}
//       role="button"
//       tabIndex={0}
//       onKeyDown={(e) => {
//         if (e.key === 'Enter' || e.key === ' ') {
//           e.preventDefault()
//           handleClick(e as unknown as React.MouseEvent)
//         }
//       }}
//       className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group ${
//         disabled ? 'opacity-60 cursor-wait' : 'cursor-pointer'
//       }`}
//     >
//       <div className="flex items-start justify-between gap-3 mb-3">
//         <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
//           {project.name}
//         </h3>
//         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[project.status]}`}>
//           {STATUS_LABELS[project.status]}
//         </span>
//       </div>

//       <p className="text-sm text-gray-500 line-clamp-2 mb-4">
//         {project.description}
//       </p>

//       <div className="mb-3">
//         <div className="flex justify-between text-xs text-gray-400 mb-1">
//           <span>Progress</span>
//           <span>{pct}%</span>
//         </div>
//         <div className="w-full bg-gray-100 rounded-full h-1.5">
//           <div
//             className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
//             style={{ width: `${pct}%` }}
//           />
//         </div>
//       </div>

//       <div className="flex items-center justify-between text-xs text-gray-400">
//         <span>📋 {project.total_tasks} tasks</span>
//         <span>👤 {project.owner.name}</span>
//       </div>
//     </div>
//   )
// })

// ProjectCard.displayName = 'ProjectCard'

// // ── MAIN DASHBOARD PAGE ───────────────────────────────────────────

// const DashboardPage: React.FC = () => {
//   const { user } = useAuth()
//   const navigate = useNavigate()

//   const [statusFilter, setStatusFilter] = useState('')
//   const [searchQuery, setSearchQuery]   = useState('')

//   // FIX 4: Prevent multiple navigation triggers from rapid clicks
//   const [isNavigating, setIsNavigating] = useState(false)

//   const [showCreateModal, setShowCreateModal] = useState(false)

//   const { projects, isLoading, error, reload } = useProjects({
//     status: statusFilter || undefined,
//     search: searchQuery  || undefined,
//   })

//   // ── DASHBOARD STATS ───────────────────────────────────────────
//   const stats = useMemo(() => {
//     const totalProjects  = projects.length
//     const activeProjects = projects.filter(p => p.status === 'active').length

//     const myActiveTasks = projects.reduce((sum, project) => {
//       const myCount = (project.task_summary?.['in_progress'] ?? 0)
//       return sum + myCount
//     }, 0)

//     const totalDone = projects.reduce((sum, p) => sum + p.done_tasks, 0)
//     const total     = projects.reduce((sum, p) => sum + p.total_tasks, 0)

//     return { totalProjects, activeProjects, myActiveTasks, totalDone, total }
//   }, [projects])

//   // FIX 2 & 4: Safe navigation with debounce and proper slug handling
//   const handleProjectClick = useCallback(
//     (slug: string) => {
//       if (isNavigating) return
//       if (!slug || slug.trim() === '') {
//         console.error('Invalid project slug')
//         return
//       }
//       setIsNavigating(true)
//       navigate(`/projects/${encodeURIComponent(slug)}`)
//       // Re-enable after short delay so user can click another project later
//       setTimeout(() => setIsNavigating(false), 1000)
//     },
//     [navigate, isNavigating]
//   )

//   // FIX 3: Role-based welcome message
//   const roleMessage = useMemo(() => {
//     if (!user) return ''
//     switch (user.role) {
//       case 'admin':
//         return 'You have full administrator access across all projects and teams.'
//       case 'manager':
//         return 'Manage your projects, assign tasks, and oversee your team.'
//       case 'developer':
//         return 'View your assigned tasks and team activity.'
//       default:
//         return "Here's what's happening across your projects."
//     }
//   }, [user])

//   if (isLoading) return <SkeletonLoader type="dashboard" />

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 text-center">
//         <span className="text-4xl mb-4">😕</span>
//         <p className="text-gray-600 mb-4">{error}</p>
//         <button
//           onClick={reload}
//           className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
//         >
//           Try Again
//         </button>
//       </div>
//     )
//   }

//   // FIX 3: Check if user can manage (admin or manager only)
//   const canManage = user?.role === 'admin' || user?.role === 'manager'

//   return (
//     <div className="space-y-8">

//       {/* ── PAGE HEADER ── FIX 3: Role-based UI ── */}
//       <div className="flex items-start justify-between gap-4 flex-wrap">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             Good day, {user?.name?.split(' ')[0]} 👋
//           </h1>
//           <p className="text-gray-500 mt-1">{roleMessage}</p>
//         </div>

//         {/* FIX 3: Only admin/manager sees New Project button */}
//         {canManage && (
//           <button
//             type="button"
//             onClick={() => setShowCreateModal(true)}
//             className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
//           >
//             <span>+</span> New Project
//           </button>
//         )}
//       </div>

//       {/* ── SUMMARY STAT CARDS ── */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//         <StatCard
//           label="Total Projects"
//           value={stats.totalProjects}
//           icon="📁"
//           color="text-indigo-600"
//         />
//         <StatCard
//           label="Active Projects"
//           value={stats.activeProjects}
//           icon="🔥"
//           color="text-green-600"
//         />
//         <StatCard
//           label="Tasks In Progress"
//           value={stats.myActiveTasks}
//           icon="⚡"
//           color="text-orange-600"
//         />
//         <StatCard
//           label="Tasks Completed"
//           value={stats.totalDone}
//           icon="✅"
//           color="text-blue-600"
//           subtitle={`of ${stats.total} total`}
//         />
//       </div>

//       {/* ── FILTER BAR ── FIX 1: Search doesn't refresh page ── */}
//       <div className="flex flex-col sm:flex-row gap-3">

//         {/* Search input — wrapped to prevent any form submission */}
//         <div
//           className="relative flex-1"
//           onSubmit={(e) => e.preventDefault()}
//         >
//           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10">
//             🔍
//           </span>
//           <input
//             type="text"
//             placeholder="Search projects…"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             onKeyDown={(e) => {
//               // FIX 1: Prevent any default Enter behavior including page refresh
//               if (e.key === 'Enter') {
//                 e.preventDefault()
//                 e.stopPropagation()
//               }
//             }}
//             className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
//             autoComplete="off"
//             spellCheck="false"
//           />
//         </div>

//         {/* Status filter dropdown */}
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700"
//         >
//           <option value="">All Statuses</option>
//           <option value="planning">Planning</option>
//           <option value="active">Active</option>
//           <option value="on_hold">On Hold</option>
//           <option value="completed">Completed</option>
//           <option value="archived">Archived</option>
//         </select>
//       </div>

//       {/* ── PROJECT GRID ── */}
//       {projects.length === 0 ? (
//         <div className="text-center py-20">
//           <span className="text-5xl mb-4 block">📭</span>
//           <p className="text-gray-500 font-medium">No projects found</p>
//           <p className="text-gray-400 text-sm mt-1">
//             {searchQuery || statusFilter
//               ? 'Try changing your filters'
//               : 'Projects will appear here once created'}
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           {projects.map(project => (
//             <ProjectCard
//               key={project.id}
//               project={project}
//               disabled={isNavigating}
//               onClick={() => handleProjectClick(project.slug)}
//             />
//           ))}
//         </div>
//       )}

// {/* New Project Modal */}
// {showCreateModal && (
//   <CreateProjectModal
//     onClose={() => setShowCreateModal(false)}
//     onCreated={() => {
//       setShowCreateModal(false)
//       reload() // Refresh the project list to show the new project
//     }}
//   />
// )}

//     </div>
//   )
// }

// export default DashboardPage



// code 3

import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../hooks/useProjects'
import SkeletonLoader from '../components/ui/SkeletonLoader'
import type { Project, ProjectStatus } from '../types'
import CreateProjectModal from '../components/projects/CreateProjectModal'

// ── STATUS DISPLAY CONFIG ─────────────────────────────────────────
const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning:  'Planning',
  active:    'Active',
  on_hold:   'On Hold',
  completed: 'Completed',
  archived:  'Archived',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning:  'bg-gray-100 text-gray-600',
  active:    'bg-green-100 text-green-700',
  on_hold:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  archived:  'bg-red-100 text-red-700',
}

// ── STAT CARD ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  icon: string
  color: string
  subtitle?: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </div>
)

// ── PROJECT CARD ──────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project
  onClick: () => void
  disabled: boolean
}

const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, onClick, disabled }) => {
  const pct = project.total_tasks > 0
    ? Math.round((project.done_tasks / project.total_tasks) * 100)
    : 0

  // Prevent multiple rapid clicks at the card level
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      onClick()
    },
    [onClick, disabled]
  )

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e as unknown as React.MouseEvent)
        }
      }}
      className={`bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group ${
        disabled ? 'opacity-60 cursor-wait' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[project.status]}`}>
          {STATUS_LABELS[project.status]}
        </span>
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
        {project.description}
      </p>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>📋 {project.total_tasks} tasks</span>
        <span>👤 {project.owner.name}</span>
      </div>
    </div>
  )
})

ProjectCard.displayName = 'ProjectCard'

// ── MAIN DASHBOARD PAGE ───────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery]   = useState('')

  // Prevent multiple navigation triggers from rapid clicks
  const [isNavigating, setIsNavigating] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)

  // UPDATED: Now also destructuring isRefreshing for smooth search experience
  const { projects, isLoading, isRefreshing, error, reload } = useProjects({
    status: statusFilter || undefined,
    search: searchQuery  || undefined,
  })

  // ── DASHBOARD STATS ───────────────────────────────────────────
  const stats = useMemo(() => {
    const totalProjects  = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length

    const myActiveTasks = projects.reduce((sum, project) => {
      const myCount = (project.task_summary?.['in_progress'] ?? 0)
      return sum + myCount
    }, 0)

    const totalDone = projects.reduce((sum, p) => sum + p.done_tasks, 0)
    const total     = projects.reduce((sum, p) => sum + p.total_tasks, 0)

    return { totalProjects, activeProjects, myActiveTasks, totalDone, total }
  }, [projects])

  // Safe navigation with debounce and proper slug handling
  const handleProjectClick = useCallback(
    (slug: string) => {
      if (isNavigating) return
      if (!slug || slug.trim() === '') {
        console.error('Invalid project slug')
        return
      }
      setIsNavigating(true)
      navigate(`/projects/${encodeURIComponent(slug)}`)
      setTimeout(() => setIsNavigating(false), 1000)
    },
    [navigate, isNavigating]
  )

  // Role-based welcome message
  const roleMessage = useMemo(() => {
    if (!user) return ''
    switch (user.role) {
      case 'admin':
        return 'You have full administrator access across all projects and teams.'
      case 'manager':
        return 'Manage your projects, assign tasks, and oversee your team.'
      case 'developer':
        return 'View your assigned tasks and team activity.'
      default:
        return "Here's what's happening across your projects."
    }
  }, [user])

  // Only show skeleton on the very first load — not on every search
  if (isLoading) return <SkeletonLoader type="dashboard" />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-4">😕</span>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={reload}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div className="space-y-8">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good day, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">{roleMessage}</p>
        </div>

        {/* Only admin/manager sees New Project button */}
        {canManage && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span> New Project
          </button>
        )}
      </div>

      {/* ── SUMMARY STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects}
          icon="📁"
          color="text-indigo-600"
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon="🔥"
          color="text-green-600"
        />
        <StatCard
          label="Tasks In Progress"
          value={stats.myActiveTasks}
          icon="⚡"
          color="text-orange-600"
        />
        <StatCard
          label="Tasks Completed"
          value={stats.totalDone}
          icon="✅"
          color="text-blue-600"
          subtitle={`of ${stats.total} total`}
        />
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* UPDATED: Search input with inline spinner — no page refresh */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search projects…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Prevent any default Enter behavior including page refresh
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            autoComplete="off"
            spellCheck="false"
          />
          {/* Loading spinner inside the search box while filtering */}
          {isRefreshing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Status filter dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* ── PROJECT GRID ── */}
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchQuery || statusFilter
              ? 'Try changing your filters'
              : 'Projects will appear here once created'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              disabled={isNavigating}
              onClick={() => handleProjectClick(project.slug)}
            />
          ))}
        </div>
      )}

      {/* ── NEW PROJECT MODAL ── */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            reload() // Refresh the project list to show the new project
          }}
        />
      )}

    </div>
  )
}

export default DashboardPage