'use client'

import { PageHeader } from '@/components/layout'
import { ExaminerDashboard, ParticipantDashboard } from '@/components/dashboard'
import { useAuth } from '@/hooks/api'

export default function DashboardPage() {
  const { isExaminer, isParticipant } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Dashboard" showWelcome />

        {/* Exams Created by User - Only show for examiners */}
        {isExaminer && <ExaminerDashboard />}

        {/* Participant Dashboard - Only show for participants */}
        {isParticipant && <ParticipantDashboard />}
      </main>
    </div>
  )
}
