'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout'
import { StatCard } from '@/components/dashboard'
import { useMyResults } from '@/hooks/api'
import {
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  Eye,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react'

export default function ResultsPage() {
  const { fetchResults, results, pagination, isLoading, error } = useMyResults()
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchResults(currentPage, 10)
  }, [currentPage, fetchResults])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate statistics from current page results
  // Note: For accurate stats, we'd need all results, but for now we'll show page-level stats
  const totalExams = pagination?.total || results.length
  const passedExams = results.filter(r => r.passed).length
  const averageScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : 0

  // Statistics configuration
  const statistics = useMemo<
    Array<{
      label: string
      value: string | number
      icon: LucideIcon
      iconColor: string
      valueColor?: string
    }>
  >(
    () => [
      {
        label: 'Total Exams',
        value: totalExams,
        icon: Award,
        iconColor: 'text-blue-500',
      },
      {
        label: 'Passed Exams',
        value: passedExams,
        icon: CheckCircle2,
        iconColor: 'text-green-500',
        valueColor: 'text-green-600 dark:text-green-400',
      },
      {
        label: 'Average Score',
        value: `${Math.round(averageScore)}%`,
        icon: TrendingUp,
        iconColor: 'text-purple-500',
        valueColor: 'text-purple-600 dark:text-purple-400',
      },
    ],
    [totalExams, passedExams, averageScore]
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="My Exam Results"
          description="View all your exam attempts and performance"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statistics.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              valueColor={stat.valueColor}
            />
          ))}
        </div>

        {/* Results List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading results...
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Error Loading Results
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => fetchResults(currentPage, 10)}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven&apos;t completed any exams yet.
              </p>
              <Link href="/dashboard/exams/start">
                <Button>Start an Exam</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {results.map(result => {
                const passed = result.passed ?? false
                return (
                  <Card key={result.attemptId}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {passed ? (
                                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                              ) : (
                                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-1">
                                {result.examTitle}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(result.submittedAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Award className="h-4 w-4" />
                                  <span className="capitalize">
                                    {result.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-3">
                          <div className="text-right">
                            <div
                              className={`text-3xl font-bold mb-1 ${
                                passed
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {result.percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.score} / {result.maxScore} points
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/exams/attempts/${result.attemptId}/results`}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!pagination.hasNext || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
