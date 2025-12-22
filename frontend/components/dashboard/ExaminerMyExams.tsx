'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { useExams } from '@/hooks/api'
import {
  getExaminerExamColumns,
  ExamWithCounts,
} from '@/components/ui/data-table/column-definitions'
import { BookOpen } from 'lucide-react'

export function ExaminerMyExams() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all') // 'all', 'true', 'false'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Build options for useExams hook
  const examOptions = useMemo(
    () => ({
      search: searchQuery.trim() || undefined,
      isActive:
        isActiveFilter === 'all'
          ? undefined
          : isActiveFilter === 'true'
            ? true
            : false,
      page: currentPage,
      limit: itemsPerPage,
    }),
    [searchQuery, isActiveFilter, currentPage]
  )

  const {
    exams: createdExams,
    isLoading: isLoadingExams,
    pagination,
  } = useExams(examOptions)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleFilterChange = (value: string) => {
    setIsActiveFilter(value)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const hasActiveFilters = searchQuery.trim() !== '' || isActiveFilter !== 'all'

  return (
    <DataTable<ExamWithCounts>
      data={createdExams as ExamWithCounts[]}
      columns={getExaminerExamColumns()}
      isLoading={isLoadingExams}
      loadingText="Loading exams..."
      emptyText={hasActiveFilters ? 'No exams found' : 'No exam available'}
      emptyDescription={
        hasActiveFilters
          ? 'Try adjusting your search or filters.'
          : "You haven't created any exams yet. Create your first exam to get started."
      }
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search exams by title or description..."
      filters={[
        {
          key: 'isActive',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'all', label: 'All Exams' },
            { value: 'true', label: 'Active Only' },
            { value: 'false', label: 'Inactive Only' },
          ],
          defaultValue: 'all',
        },
      ]}
      filterValues={{ isActive: isActiveFilter }}
      onFilterChange={(key, value) => {
        if (key === 'isActive') {
          handleFilterChange(value)
        }
      }}
      pagination={pagination || null}
      onPageChange={setCurrentPage}
      title="My Created Exams"
      titleIcon={<BookOpen className="h-6 w-6 text-blue-500" />}
      itemCount={pagination?.total ?? createdExams.length}
    />
  )
}
