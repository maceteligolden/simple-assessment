'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useAuth,
  useExamDetail,
  useDeleteExam,
  useAddParticipant,
  useParticipants,
  useRemoveParticipant,
  useSearchUser,
} from '@/hooks/api'
import {
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
  Edit,
  Key,
  Plus,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DeleteExamModal } from '@/components/exam'
import { useToast } from '@/hooks/ui/useToast'

export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const { user, isAuthenticated, isExaminer, bypassAuth } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [showAddParticipantDialog, setShowAddParticipantDialog] =
    useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [newParticipantEmail, setNewParticipantEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  )
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search user hook
  const {
    searchUser,
    searchResult,
    isSearching,
    error: searchError,
  } = useSearchUser()

  // Fetch exam details
  const {
    exam,
    participants: examParticipants,
    isLoading: isLoadingExam,
    error: examError,
    refetch: refetchExam,
  } = useExamDetail(examId)

  // Fetch participants separately (with more details)
  const {
    participants,
    isLoading: isLoadingParticipants,
    refetch: refetchParticipants,
  } = useParticipants(examId)

  // Add participant hook
  const {
    addParticipant,
    isLoading: isAddingParticipant,
    error: addParticipantError,
  } = useAddParticipant(examId, () => {
    refetchParticipants()
    refetchExam()
    setShowAddParticipantDialog(false)
    setNewParticipantEmail('')
    toastSuccess('Participant added successfully')
  })

  // Remove participant hook
  const { removeParticipant, isLoading: isRemovingParticipant } =
    useRemoveParticipant(examId, () => {
      refetchParticipants()
      refetchExam()
      toastSuccess('Participant removed successfully')
    })

  // Delete exam hook
  const { deleteExam, isLoading: isDeleting } = useDeleteExam(() => {
    router.push('/dashboard')
    toastSuccess('Exam deleted successfully')
  })

  useEffect(() => {
    if (!bypassAuth && !isAuthenticated) {
      router.push('/')
    }
  }, [bypassAuth, isAuthenticated, router])

  // Check if user is the creator and is an examiner
  const isCreator =
    bypassAuth || (exam && user && exam.creatorId === user.id && isExaminer)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toastSuccess('Copied to clipboard')
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle email input change with debounced search
  const handleEmailChange = (value: string) => {
    setNewParticipantEmail(value)
    setEmailError('')
    setShowDropdown(true)

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // Validate email format first
    if (!value.trim()) {
      setShowDropdown(false)
      return
    }

    if (!validateEmail(value.trim())) {
      setShowDropdown(false)
      return
    }

    // Debounce search - wait 500ms after user stops typing
    const timeout = setTimeout(async () => {
      await searchUser(value.trim())
    }, 500)

    setSearchTimeout(timeout)
  }

  // Handle clicking on dropdown item
  const handleSelectUser = () => {
    if (searchResult) {
      // User is already selected, just close dropdown
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const handleAddParticipant = async () => {
    setEmailError('')

    if (!newParticipantEmail.trim()) {
      setEmailError('Email is required')
      return
    }

    if (!validateEmail(newParticipantEmail.trim())) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Check if user exists
    if (!searchResult) {
      setEmailError('User not found. Please search for a valid user email.')
      return
    }

    // Check if participant already exists
    const existingParticipant = participants.find(
      p => p.email.toLowerCase() === newParticipantEmail.trim().toLowerCase()
    )

    if (existingParticipant) {
      setEmailError('This email is already added')
      return
    }

    const result = await addParticipant(newParticipantEmail.trim())
    if (!result.success) {
      setEmailError(result.error || 'Failed to add participant')
      toastError(result.error || 'Failed to add participant')
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this participant? This action cannot be undone.'
      )
    ) {
      return
    }

    const result = await removeParticipant(participantId)
    if (!result.success) {
      toastError(result.error || 'Failed to remove participant')
    }
  }

  const handleDeleteConfirm = async (password: string) => {
    return await deleteExam(examId, password)
  }

  const handleViewParticipantResult = (participantId: string) => {
    router.push(
      `/dashboard/exams/${examId}/participants/${participantId}/result`
    )
  }

  if (!bypassAuth && (!isAuthenticated || !isCreator)) {
    return null
  }

  if (isLoadingExam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </main>
      </div>
    )
  }

  if (examError || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-red-500 mb-4">
                  {examError || 'Exam not found'}
                </p>
                <Link href="/dashboard">
                  <Button>Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Use participants from useParticipants hook (has more details) or fallback to exam participants
  const displayParticipants =
    participants.length > 0 ? participants : examParticipants

  const totalScore = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {exam.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/exams/${exam.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Exam
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Exam
            </Button>
          </div>
        </div>

        {/* Exam Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Duration:</span>{' '}
                  {exam.timeLimit} minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Availability:</span>{' '}
                  {exam.availableAnytime
                    ? 'Anytime'
                    : exam.startDate && exam.endDate
                      ? `${new Date(exam.startDate).toLocaleString()} - ${new Date(exam.endDate).toLocaleString()}`
                      : 'Not set'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  <span className="font-medium">Questions:</span>{' '}
                  {exam.questions.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  <span className="font-medium">Total Points:</span>{' '}
                  {totalScore}
                </span>
              </div>
              {exam.randomizeQuestions && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Questions will be randomized for participants
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {exam.questions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No questions added yet
                  </p>
                ) : (
                  exam.questions.map((question, index) => (
                    <div
                      key={question.id || index}
                      className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <span className="font-medium">Q{index + 1}:</span>{' '}
                      {typeof question.question === 'string'
                        ? question.question
                        : question.question.text || ''}
                      <span className="text-gray-500 ml-2">
                        ({question.points || 1} pts)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants ({displayParticipants.length})
              </CardTitle>
              <Button
                onClick={() => setShowAddParticipantDialog(true)}
                size="sm"
                disabled={isAddingParticipant}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingParticipant ? 'Adding...' : 'Add Participant'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingParticipants ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : displayParticipants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No participants yet.</p>
                <p className="text-sm mt-2">
                  Share the exam access code with participants to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Access Code</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayParticipants.map(participant => (
                      <tr key={participant.id} className="border-b">
                        <td className="p-2">{participant.email}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                              {participant.accessCode}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(participant.accessCode)
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            {participant.hasCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewParticipantResult(participant.id)
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Result
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(participant.accessCode)
                              }
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Copy Code
                            </Button>
                            {!participant.hasStarted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveParticipant(participant.id)
                                }
                                disabled={isRemovingParticipant}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Participant Dialog */}
      <Dialog
        open={showAddParticipantDialog}
        onOpenChange={setShowAddParticipantDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Participant</DialogTitle>
            <DialogDescription>
              Enter the participant&apos;s email address to generate a unique
              access code for them.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="relative">
              <label
                htmlFor="participant-email"
                className="block text-sm font-medium mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="participant-email"
                  type="email"
                  value={newParticipantEmail}
                  onChange={e => handleEmailChange(e.target.value)}
                  placeholder="Search by email..."
                  className={
                    emailError
                      ? 'border-red-500'
                      : searchResult
                        ? 'border-green-500'
                        : ''
                  }
                  disabled={isAddingParticipant}
                  onFocus={() => {
                    setShowDropdown(true)
                    // Trigger search if email is valid
                    if (
                      newParticipantEmail.trim() &&
                      validateEmail(newParticipantEmail.trim())
                    ) {
                      searchUser(newParticipantEmail.trim())
                    }
                  }}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Dropdown Results */}
              {showDropdown &&
                newParticipantEmail.trim() &&
                validateEmail(newParticipantEmail.trim()) && (
                  <div ref={dropdownRef} className="mt-2 relative">
                    {isSearching ? (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                        <div className="p-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          <p className="text-sm text-gray-500">Searching...</p>
                        </div>
                      </div>
                    ) : searchResult ? (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-md shadow-lg">
                        <div
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md transition-colors"
                          onClick={handleSelectUser}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {searchResult.firstName} {searchResult.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {searchResult.email} • {searchResult.role}
                              </p>
                            </div>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              Selected
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : searchError ? (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-md shadow-lg">
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {searchError}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded-md shadow-lg">
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              User not found. Please ensure the user has an
                              account.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
              {addParticipantError && (
                <p className="text-sm text-red-500 mt-1">
                  {addParticipantError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddParticipantDialog(false)
                setNewParticipantEmail('')
                setEmailError('')
                setShowDropdown(false)
                if (searchTimeout) {
                  clearTimeout(searchTimeout)
                  setSearchTimeout(null)
                }
              }}
              disabled={isAddingParticipant}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddParticipant}
              disabled={isAddingParticipant || !searchResult || isSearching}
            >
              {isAddingParticipant ? 'Adding...' : 'Add Participant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Exam Modal */}
      <DeleteExamModal
        exam={exam}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  )
}
