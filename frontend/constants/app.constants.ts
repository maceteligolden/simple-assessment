export const APP_CONFIG = {
  APP_NAME: 'Simple Assessment Platform',
  APP_DESCRIPTION: 'A minimal online exam and assessment platform',
  VERSION: '1.0.0',
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
  EXAM_ATTEMPT: 'exam_attempt',
} as const

export const EXAM_CONFIG = {
  MIN_TIME_LIMIT: 5, // minutes
  MAX_TIME_LIMIT: 300, // minutes
  DEFAULT_TIME_LIMIT: 60, // minutes
  MAX_QUESTIONS: 100,
  MIN_QUESTIONS: 1,
} as const

export const PROCTORING_CONFIG = {
  FOCUS_WARNING_THRESHOLD: 3, // number of times before warning
  TAB_SWITCH_WARNING: true,
  COPY_PASTE_DISABLED: true,
} as const

export const USER_ROLES = {
  EXAMINER: 'examiner',
  PARTICIPANT: 'participant',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

