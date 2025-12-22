import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { logger } from '../util/logger'
import { ResponseUtil } from '../util/response'
import { HTTP_STATUS } from '../constants'

/**
 * Validation middleware factory
 * Creates a middleware that validates request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param validatePart - Which part of the request to validate ('body' | 'query' | 'params')
 * @returns Express middleware function
 */
export function validate(
  schema: ZodSchema,
  validatePart: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Handle nested schemas (e.g., { body: {...} })
      const dataToValidate = { [validatePart]: req[validatePart] }
      schema.parse(dataToValidate)
      logger.debug('Validation passed', {
        path: req.path,
        method: req.method,
        validatePart,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors,
        })

        ResponseUtil.error(
          res,
          'Validation failed',
          HTTP_STATUS.BAD_REQUEST,
          errors
        )
        return
      }

      logger.error('Unexpected validation error', error)
      ResponseUtil.error(
        res,
        'An error occurred during validation',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }
  }
}
