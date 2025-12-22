'use client'

import { Button } from '@/components/ui/button'
import { PaginationMeta } from './types'

interface DataTablePaginationProps {
  pagination: PaginationMeta
  onPageChange?: (page: number) => void
  isLoading?: boolean
}

export function DataTablePagination({
  pagination,
  onPageChange,
  isLoading = false,
}: DataTablePaginationProps) {
  const handlePageChange = (page: number) => {
    if (onPageChange && !isLoading) {
      onPageChange(page)
    }
  }

  const getPageNumbers = (): number[] => {
    const pages: number[] = []
    const { page, totalPages } = pagination

    // Always show first page
    if (totalPages > 0) {
      pages.push(1)
    }

    // Show pages around current page
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    // Add ellipsis if needed
    if (start > 2) {
      pages.push(-1) // -1 represents ellipsis
    }

    // Add pages around current
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    // Add ellipsis if needed
    if (end < totalPages - 1) {
      pages.push(-1) // -1 represents ellipsis
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total} items
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev || isLoading}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === -1) {
              return (
                <span key={`ellipsis-${index}`} className="px-2">
                  ...
                </span>
              )
            }
            return (
              <Button
                key={pageNum}
                variant={pagination.page === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                disabled={isLoading}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={!pagination.hasNext || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
