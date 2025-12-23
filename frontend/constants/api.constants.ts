export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SIGNUP: '/api/v1/auth/signup',
    SIGNIN: '/api/v1/auth/signin',
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: '/api/v1/auth/profile',
    SIGNOUT: '/api/v1/auth/signout',
    SIGNOUT_ALL: '/api/v1/auth/signout-all',
    SEARCH: '/api/v1/auth/search',
    // Legacy endpoints (deprecated)
    REGISTER: '/api/v1/auth/signup',
    LOGIN: '/api/v1/auth/signin',
    LOGOUT: '/api/v1/auth/signout',
    ME: '/api/v1/auth/profile',
  },
  // Exam endpoints
  EXAMS: {
    BASE: '/api/v1/exams',
    BY_ID: (id: string) => `/api/v1/exams/${id}`,
    BY_CODE: (code: string) => `/api/v1/exams/by-code/${code}`,
    START: '/api/v1/exams/start',
    SUBMIT: (attemptId: string) => `/api/v1/exams/attempts/${attemptId}/submit`,
    RESULTS: (attemptId: string) => `/api/v1/exams/attempts/${attemptId}/results`,
    EXAM_RESULTS: (examId: string) => `/api/v1/exams/${examId}/results`,
  },
  // Exam Attempt endpoints
  ATTEMPTS: {
    NEXT_QUESTION: (attemptId: string) => `/api/v1/exams/attempts/${attemptId}/questions/next`,
    SUBMIT_ANSWER: (attemptId: string, questionId: string) => `/api/v1/exams/attempts/${attemptId}/answers/${questionId}`,
  },
  // Results endpoints
  RESULTS: {
    BASE: '/api/results',
    BY_ID: (id: string) => `/api/results/${id}`,
    MY_RESULTS: '/api/results/me',
  },
} as const
