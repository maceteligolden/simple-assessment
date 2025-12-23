'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { useParticipantExams } from '@/hooks/api'
import {
  getParticipantExamColumns,
  ParticipantExam,
} from '@/components/ui/data-table/column-definitions'
import { BookOpen } from 'lucide-react'
import { EXAM_ATTEMPT_STATUS } from '@/constants'

export function ParticipantDashboard() {
  // Participant search and filter state for all participant exams
  const [participantSearchQuery, setParticipantSearchQuery] = useState('')
  const [participantStatusFilter, setParticipantStatusFilter] =
    useState<string>('all')
  const [participantAvailabilityFilter, setParticipantAvailabilityFilter] =
    useState<string>('all') // 'all', 'true', 'false'
  const [participantCurrentPage, setParticipantCurrentPage] = useState(1)
  const participantItemsPerPage = 10

  // Fetch all participant exams (for "Exams I Can Participate In" table)
  const {
    exams: participantExams,
    pagination: participantPagination,
    isLoading: isLoadingParticipantExams,
  } = useParticipantExams(
    participantCurrentPage,
    participantItemsPerPage,
    participantSearchQuery.trim() || undefined,
    participantStatusFilter !== 'all' ? participantStatusFilter : undefined,
    participantAvailabilityFilter !== 'all'
      ? participantAvailabilityFilter === 'true'
      : undefined
  )

  const hasActiveParticipantFilters =
    participantSearchQuery.trim() !== '' ||
    participantStatusFilter !== 'all' ||
    participantAvailabilityFilter !== 'all'

  return (
    <div className="mb-8">
      <DataTable<ParticipantExam>
        data={participantExams as ParticipantExam[]}
        columns={getParticipantExamColumns()}
        isLoading={isLoadingParticipantExams}
        loadingText="Loading exams..."
        emptyText={
          hasActiveParticipantFilters ? 'No exams found' : 'No exams available'
        }
        emptyDescription={
          hasActiveParticipantFilters
            ? 'Try adjusting your search or filters.'
            : "You haven't been added to any exams yet."
        }
        searchValue={participantSearchQuery}
        onSearchChange={value => {
          setParticipantSearchQuery(value)
          setParticipantCurrentPage(1)
        }}
        searchPlaceholder="Search exams by title or description..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'all', label: 'All Status' },
              {
                value: EXAM_ATTEMPT_STATUS.NOT_STARTED,
                label: 'Not Started',
              },
              {
                value: EXAM_ATTEMPT_STATUS.IN_PROGRESS,
                label: 'In Progress',
              },
              {
                value: EXAM_ATTEMPT_STATUS.COMPLETED,
                label: 'Completed',
              },
              {
                value: EXAM_ATTEMPT_STATUS.ABANDONED,
                label: 'Abandoned',
              },
            ],
            defaultValue: 'all',
          },
          {
            key: 'availability',
            label: 'Availability',
            type: 'select',
            options: [
              { value: 'all', label: 'All Availability' },
              { value: 'true', label: 'Available Now' },
              { value: 'false', label: 'Not Available' },
            ],
            defaultValue: 'all',
          },
        ]}
        filterValues={{
          status: participantStatusFilter,
          availability: participantAvailabilityFilter,
        }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setParticipantStatusFilter(value)
          } else if (key === 'availability') {
            setParticipantAvailabilityFilter(value)
          }
          setParticipantCurrentPage(1)
        }}
        pagination={participantPagination || null}
        onPageChange={setParticipantCurrentPage}
        title="Exams I Can Participate In"
        titleIcon={<BookOpen className="h-6 w-6 text-blue-500" />}
        itemCount={participantPagination?.total ?? participantExams.length}
      />
    </div>
  )
}
