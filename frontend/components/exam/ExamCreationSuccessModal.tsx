'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { Exam } from '@/interfaces'

interface ExamCreationSuccessModalProps {
  exam: Exam | null
  isOpen: boolean
  onClose: () => void
  onCreateAnother: () => void
  isUpdate?: boolean
}

export default function ExamCreationSuccessModal({
  exam,
  isOpen,
  onClose,
  onCreateAnother,
  isUpdate = false,
}: ExamCreationSuccessModalProps) {
  const router = useRouter()

  const handleViewExam = () => {
    if (exam) {
      router.push(`/dashboard/exams/${exam.id}`)
      onClose()
    }
  }

  if (!exam) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {isUpdate
              ? 'Exam Updated Successfully!'
              : 'Exam Created Successfully!'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Your exam &quot;{exam.title}&quot; has been{' '}
            {isUpdate ? 'updated' : 'created'} and is ready to use.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span className="font-medium">Duration:</span>
            <span>{exam.timeLimit || 0} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Questions:</span>
            <span>{exam.questions?.length || 0}</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleViewExam} className="w-full sm:w-auto">
            View Exam Details
          </Button>
          {!isUpdate && (
            <Button
              onClick={onCreateAnother}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Create Another Exam
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
