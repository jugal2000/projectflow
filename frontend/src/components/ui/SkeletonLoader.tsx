import React from 'react'

// A single pulsing gray rectangle — the building block
const Pulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  // animate-pulse = Tailwind class that makes it fade in and out repeatedly
)

// Skeleton for the dashboard stats cards
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    {/* 4 stat cards in a row */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
          <Pulse className="h-3 w-20" />
          <Pulse className="h-8 w-12" />
          <Pulse className="h-3 w-24" />
        </div>
      ))}
    </div>

    {/* Project cards grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 space-y-4">
          <div className="flex justify-between">
            <Pulse className="h-5 w-40" />
            <Pulse className="h-5 w-16 rounded-full" />
          </div>
          <Pulse className="h-3 w-full" />
          <Pulse className="h-3 w-3/4" />
          <Pulse className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Pulse className="h-4 w-20" />
            <Pulse className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Skeleton for the kanban board
const KanbanSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1,2,3,4].map(col => (
      <div key={col} className="bg-gray-50 border-2 border-gray-200 rounded-xl min-h-96">
        {/* Column header */}
        <div className="bg-gray-100 px-4 py-3 rounded-t-xl">
          <Pulse className="h-4 w-24" />
        </div>
        {/* Fake task cards */}
        <div className="p-2 space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-3 w-3/4" />
              <div className="flex justify-between items-center">
                <Pulse className="h-5 w-14 rounded-full" />
                <Pulse className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

// The main export — choose which skeleton to show based on 'type'
interface Props {
  type: 'dashboard' | 'kanban'
}

const SkeletonLoader: React.FC<Props> = ({ type }) => {
  if (type === 'dashboard') return <DashboardSkeleton />
  return (
    <div className="space-y-6">
      {/* Project header skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
        <Pulse className="h-7 w-64" />
        <Pulse className="h-4 w-96 max-w-full" />
        <Pulse className="h-2 w-full rounded-full" />
      </div>
      <KanbanSkeleton />
    </div>
  )
}

export default SkeletonLoader