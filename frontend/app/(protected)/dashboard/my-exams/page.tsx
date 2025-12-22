'use client'

import { PageHeader } from '@/components/layout'
import { ExaminerMyExams, ParticipantMyExams } from '@/components/dashboard'
import { useAuth } from '@/hooks/api'

export default function MyExamsPage() {
  const { isExaminer, isParticipant, isAuthenticated, bypassAuth } = useAuth()

  if (!bypassAuth && !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="My Exams"
          description={
            isExaminer
              ? 'View all exams you have created'
              : 'View all exams you can participate in'
          }
        />

        {/* Participant Table - Exams I Can Participate In */}
        {isParticipant && <ParticipantMyExams />}

        {/* Examiner Table - Created Exams */}
        {isExaminer && <ExaminerMyExams />}
      </div>
    </div>
  )
}
