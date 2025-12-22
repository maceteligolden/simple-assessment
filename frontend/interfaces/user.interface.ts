export type UserRole = 'examiner' | 'participant'

/**
 * User interface (legacy - use UserProfileOutput from auth.interface.ts)
 * @deprecated Use UserProfileOutput from auth.interface.ts
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
  updatedAt: string
}
