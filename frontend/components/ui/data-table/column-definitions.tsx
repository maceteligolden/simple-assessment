import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ColumnDef } from './types'
import { Exam } from '@/interfaces'
import { FileText, Users, Clock, Calendar, Eye, Edit, Play } from 'lucide-react'
import { EXAM_ATTEMPT_STATUS } from '@/constants'

// Extended Exam type with additional fields from API
export interface ExamWithCounts extends Exam {
  questionCount?: number
  participantCount?: number
  [key: string]: unknown
}

// Participant Exam type
export interface ParticipantExam {
  examId: string
  participantId: string
  title: string
  description?: string
  duration: number
  questionCount: number
  accessCode: string
  addedAt: string
  attemptStatus?: typeof EXAM_ATTEMPT_STATUS[keyof typeof EXAM_ATTEMPT_STATUS]
  attemptId?: string
  score?: number
  maxScore?: number
  percentage?: number
  startedAt?: string
  submittedAt?: string
  isAvailable: boolean
  [key: string]: unknown
}

/**
 * Get status badge for exam attempt status
 */
const getStatusBadge = (status?: string): ReactNode => {
  const statusValue =
    status === 'not_started' || !status ? 'not_started' : status

  const statusConfig: Record<string, { label: string; className: string }> = {
    not_started: {
      label: 'Not Started',
      className:
        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    },
    'in-progress': {
      label: 'In Progress',
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    completed: {
      label: 'Completed',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    submitted: {
      label: 'Completed',
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    abandoned: {
      label: 'Abandoned',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const config = statusConfig[statusValue] || statusConfig.not_started

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

/**
 * Get availability badge
 */
const getAvailabilityBadge = (isAvailable: boolean): ReactNode => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAvailable
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}
    >
      {isAvailable ? 'Available' : 'Not Available'}
    </span>
  )
}

/**
 * Column definitions for examiner exams table
 */
export const getExaminerExamColumns = (): ColumnDef<ExamWithCounts>[] => [
  {
    key: 'title',
    header: 'Title',
    accessor: row => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.title}
        </div>
        {row.description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
            {row.description}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'questions',
    header: 'Questions',
    accessor: row => (
      <div className="flex items-center text-sm text-gray-900 dark:text-white">
        <FileText className="h-4 w-4 mr-2 text-gray-400" />
        {row.questionCount ?? row.questions.length}
      </div>
    ),
  },
  {
    key: 'participants',
    header: 'Participants',
    accessor: row => (
      <div className="flex items-center text-sm text-gray-900 dark:text-white">
        <Users className="h-4 w-4 mr-2 text-gray-400" />
        {(row as ExamWithCounts).participantCount ?? 0}
      </div>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    accessor: row => (
      <div className="flex items-center text-sm text-gray-900 dark:text-white">
        <Clock className="h-4 w-4 mr-2 text-gray-400" />
        {row.timeLimit} min
      </div>
    ),
  },
  {
    key: 'created',
    header: 'Created',
    accessor: row => (
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <Calendar className="h-4 w-4 mr-2" />
        {new Date(row.createdAt).toLocaleDateString()}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    accessor: row => getAvailabilityBadge(row.availableAnytime),
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    accessor: row => (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/dashboard/exams/${row.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
        <Link href={`/dashboard/exams/${row.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </Link>
      </div>
    ),
  },
]

/**
 * Column definitions for participant exams table
 */
export const getParticipantExamColumns = (): ColumnDef<ParticipantExam>[] => [
  {
    key: 'title',
    header: 'Title',
    accessor: row => (
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.title}
        </div>
        {row.description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
            {row.description}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'questions',
    header: 'Questions',
    accessor: row => (
      <div className="flex items-center text-sm text-gray-900 dark:text-white">
        <FileText className="h-4 w-4 mr-2 text-gray-400" />
        {row.questionCount}
      </div>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    accessor: row => (
      <div className="flex items-center text-sm text-gray-900 dark:text-white">
        <Clock className="h-4 w-4 mr-2 text-gray-400" />
        {row.duration} min
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    accessor: row => getStatusBadge(row.attemptStatus),
  },
  {
    key: 'availability',
    header: 'Availability',
    accessor: row => getAvailabilityBadge(row.isAvailable),
  },
  {
    key: 'action',
    header: 'Action',
    align: 'right',
    accessor: row => {
      const status =
        row.attemptStatus === 'not_started' || !row.attemptStatus
          ? 'not_started'
          : row.attemptStatus

      if (status === EXAM_ATTEMPT_STATUS.NOT_STARTED) {
        return (
          <Link href={`/dashboard/exams/start?code=${row.accessCode}`}>
            <Button size="sm">Start Exam</Button>
          </Link>
        )
      }

      if (
        status === EXAM_ATTEMPT_STATUS.COMPLETED ||
        status === EXAM_ATTEMPT_STATUS.SUBMITTED
      ) {
        return row.attemptId ? (
          <Link href={`/dashboard/exams/attempts/${row.attemptId}/results`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Results
            </Button>
          </Link>
        ) : (
          <span className="text-gray-400 text-sm">No results</span>
        )
      }

      if (status === EXAM_ATTEMPT_STATUS.IN_PROGRESS) {
        return row.attemptId ? (
          <Link href={`/dashboard/exams/attempts/${row.attemptId}/take`}>
            <Button size="sm">
              <Play className="h-4 w-4 mr-1" />
              Continue
            </Button>
          </Link>
        ) : (
          <span className="text-gray-400 text-sm">In Progress</span>
        )
      }

      return <span className="text-gray-400 text-sm">Abandoned</span>
    },
  },
]
