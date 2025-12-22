'use client'

import { useState, FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Exam } from '@/interfaces'

interface DeleteExamModalProps {
  exam: Exam | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => Promise<{ success: boolean; error?: string }>
  isLoading?: boolean
}

export default function DeleteExamModal({
  exam,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteExamModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!password.trim()) {
      setError('Password is required')
      return
    }

    const result = await onConfirm(password)
    if (result.success) {
      setPassword('')
      setError(null)
      onClose()
    } else {
      setError(
        result.error || 'Failed to delete exam. Please check your password.'
      )
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setPassword('')
      setError(null)
      onClose()
    }
  }

  if (!exam) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          <DialogTitle className="text-center text-2xl text-red-600 dark:text-red-400">
            Delete Exam
          </DialogTitle>
          <DialogDescription className="text-center">
            This action cannot be undone. This will permanently delete the exam
            &quot;{exam.title}&quot; and all associated data.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div>
              <label
                htmlFor="delete-password"
                className="block text-sm font-medium mb-2"
              >
                Enter your password to confirm{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="delete-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={error ? 'border-red-500 pr-10' : 'pr-10'}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !password.trim()}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Deleting...' : 'Delete Exam'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
