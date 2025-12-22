'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Exam } from '@/interfaces'

interface ExamCreationSuccessProps {
  exam: Exam
  onCreateAnother: () => void
}

export default function ExamCreationSuccess({
  exam,
  onCreateAnother,
}: ExamCreationSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">
                Exam Created Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your exam &quot;{exam.title}&quot; has been created and is ready
                to use.
              </p>
            </div>

            <div className="pt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">Duration:</span> {exam.timeLimit}{' '}
                minutes
              </p>
              <p>
                <span className="font-medium">Questions:</span>{' '}
                {exam.questions.length}
              </p>
            </div>

            <div className="flex gap-4 justify-center pt-6">
              <Link href={`/dashboard/exams/${exam.id}`}>
                <Button>View Exam Details</Button>
              </Link>
              <Button onClick={onCreateAnother} variant="outline">
                Create Another Exam
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
