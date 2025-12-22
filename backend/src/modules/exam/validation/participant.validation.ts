import { z } from 'zod'

/**
 * Validation schemas for participant management
 */

// Add Participant Schema
export const addParticipantSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
})

// Type exports
export type AddParticipantInput = z.infer<typeof addParticipantSchema>
