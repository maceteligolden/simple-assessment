/**
 * User Roles Constants
 * Defines all available user roles in the system
 */
export const USER_ROLES = {
  EXAMINER: 'examiner',
  PARTICIPANT: 'participant',
} as const

/**
 * Type for user role values
 */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Array of all user role values
 * Automatically generated from USER_ROLES object
 */
export const USER_ROLE_VALUES = Object.values(USER_ROLES) as [
  UserRole,
  ...UserRole[],
]

/**
 * Array of all user role keys
 * Automatically generated from USER_ROLES object
 */
export const USER_ROLE_KEYS = Object.keys(USER_ROLES) as Array<
  keyof typeof USER_ROLES
>
