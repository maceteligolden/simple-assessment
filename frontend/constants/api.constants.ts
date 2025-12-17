export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  // Exam endpoints
  EXAMS: {
    BASE: '/api/exams',
    BY_ID: (id: string) => `/api/exams/${id}`,
    START: (id: string) => `/api/exams/${id}/start`,
    SUBMIT: (id: string) => `/api/exams/${id}/submit`,
    RESULTS: (id: string) => `/api/exams/${id}/results`,
  },
  // Results endpoints
  RESULTS: {
    BASE: '/api/results',
    BY_ID: (id: string) => `/api/results/${id}`,
    MY_RESULTS: '/api/results/me',
  },
} as const

