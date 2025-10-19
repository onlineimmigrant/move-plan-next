'use client'

import { useMemo } from 'react'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  UserCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'

type TicketStatus = 'open' | 'in-progress' | 'closed'

interface TicketStatusTrackerProps {
  status: TicketStatus
  createdAt: string
  assignedTo?: string
  assignedToName?: string
  lastUpdatedAt?: string
  responseTime?: string // e.g., "Usually within 24 hours"
  className?: string
  compact?: boolean
}

interface StatusStep {
  id: TicketStatus
  label: string
  icon: React.ReactNode
  description: string
}

export default function TicketStatusTracker({
  status,
  createdAt,
  assignedTo,
  assignedToName,
  lastUpdatedAt,
  responseTime = 'Usually within 24 hours',
  className = '',
  compact = false
}: TicketStatusTrackerProps) {
  
  // Define status steps
  const steps: StatusStep[] = useMemo(() => [
    {
      id: 'open',
      label: 'Submitted',
      icon: <ClockIcon className="w-5 h-5" />,
      description: 'Your ticket has been received'
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      icon: <ArrowPathIcon className="w-5 h-5" />,
      description: 'Our team is working on your request'
    },
    {
      id: 'closed',
      label: 'Resolved',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      description: 'Your issue has been resolved'
    }
  ], [])

  // Determine current step index
  const currentStepIndex = useMemo(() => {
    return steps.findIndex(step => step.id === status)
  }, [status, steps])

  // Get status color
  const getStatusColor = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) {
      return 'bg-green-500' // Completed
    } else if (stepIndex === currentStepIndex) {
      if (status === 'closed') return 'bg-green-500'
      if (status === 'in-progress') return 'bg-blue-500'
      return 'bg-gray-400'
    }
    return 'bg-gray-200' // Not yet reached
  }

  const getStepTextColor = (stepIndex: number) => {
    if (stepIndex <= currentStepIndex) {
      return 'text-gray-900 font-semibold'
    }
    return 'text-gray-500'
  }

  const getStepIconColor = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) {
      return 'text-green-600'
    } else if (stepIndex === currentStepIndex) {
      if (status === 'closed') return 'text-green-600'
      if (status === 'in-progress') return 'text-blue-600'
      return 'text-gray-600'
    }
    return 'text-gray-400'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${
          status === 'closed' ? 'bg-green-500' :
          status === 'in-progress' ? 'bg-blue-500 animate-pulse' :
          'bg-gray-400'
        }`} />
        <span className="text-sm font-medium text-gray-700 capitalize">
          {status === 'in-progress' ? 'In Progress' : status}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/40 p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight antialiased">
          Ticket Status
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ClockIcon className="w-4 h-4" />
          <span className="antialiased">{getTimeAgo(lastUpdatedAt || createdAt)}</span>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="relative mb-8">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              status === 'closed' ? 'bg-green-500 w-full' :
              status === 'in-progress' ? 'bg-blue-500 w-1/2' :
              'bg-gray-400 w-0'
            }`}
          />
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-3 gap-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isPending = index > currentStepIndex

            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div 
                  className={`
                    relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300 ease-out
                    ${getStatusColor(index)}
                    ${isCurrent && status !== 'closed' ? 'ring-4 ring-offset-2 ring-blue-100' : ''}
                    ${isCurrent && status === 'closed' ? 'ring-4 ring-offset-2 ring-green-100' : ''}
                  `}
                >
                  {isCompleted || (isCurrent && status === 'closed') ? (
                    <CheckCircleIconSolid className="w-6 h-6 text-white" />
                  ) : (
                    <div className={getStepIconColor(index)}>
                      {step.icon}
                    </div>
                  )}
                  
                  {/* Pulse animation for current in-progress step */}
                  {isCurrent && status !== 'closed' && (
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-25" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3">
                  <p className={`text-sm font-medium antialiased ${getStepTextColor(index)}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 antialiased max-w-[100px]">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
        {/* Created */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 antialiased">Created</span>
          <span className="font-medium text-gray-900 antialiased">
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Last Updated */}
        {lastUpdatedAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 antialiased">Last Updated</span>
            <span className="font-medium text-gray-900 antialiased">
              {formatDate(lastUpdatedAt)}
            </span>
          </div>
        )}

        {/* Assigned To */}
        {assignedTo && assignedToName && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 antialiased">Assigned To</span>
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900 antialiased">
                {assignedToName}
              </span>
            </div>
          </div>
        )}

        {/* Response Time */}
        {status === 'open' && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200/60">
            <span className="text-gray-600 antialiased">Expected Response</span>
            <span className="text-blue-600 font-medium antialiased">
              {responseTime}
            </span>
          </div>
        )}

        {/* Resolved Badge */}
        {status === 'closed' && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200/60">
            <CheckCircleIconSolid className="w-5 h-5 text-green-600" />
            <span className="text-green-600 font-semibold antialiased">
              Issue Resolved
            </span>
          </div>
        )}

        {/* In Progress Badge */}
        {status === 'in-progress' && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200/60">
            <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-600 font-semibold antialiased">
              Working on it...
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
