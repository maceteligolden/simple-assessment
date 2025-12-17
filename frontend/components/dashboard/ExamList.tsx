'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Exam } from '@/interfaces'

interface ExamListProps {
  exams: Exam[]
  isLoading?: boolean
}

const ITEMS_PER_PAGE = 6

export default function ExamList({ exams, isLoading }: ExamListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) {
      return exams
    }

    const query = searchQuery.toLowerCase()
    return exams.filter(
      (exam) =>
        exam.title.toLowerCase().includes(query) ||
        exam.description?.toLowerCase().includes(query)
    )
  }, [exams, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedExams = filteredExams.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No exams available yet.
        </p>
        <Link href="/dashboard/exams/create">
          <Button>Create Your First Exam</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search exams by title or description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1) // Reset to first page on search
          }}
          className="max-w-md"
        />
      </div>

      {filteredExams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No exams found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedExams.map((exam) => (
              <Card key={exam.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{exam.title}</CardTitle>
                  {exam.description && (
                    <CardDescription className="line-clamp-2">
                      {exam.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Questions:</span>{' '}
                      {exam.questions.length}
                    </p>
                    {exam.timeLimit && (
                      <p>
                        <span className="font-medium">Time Limit:</span>{' '}
                        {exam.timeLimit} minutes
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Created:</span>{' '}
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/dashboard/exams/${exam.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/exams/${exam.id}/start`}
                    className="flex-1"
                  >
                    <Button className="w-full">Start Exam</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  )
}

