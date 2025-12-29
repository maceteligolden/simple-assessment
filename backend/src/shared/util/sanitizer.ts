import xss from 'xss'

/**
 * XSS Sanitizer utility
 */
export class Sanitizer {
  /**
   * Sanitize a string to prevent XSS
   * @param input - The string to sanitize
   * @returns Sanitized string
   */
  static sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return input
    }
    return xss(input)
  }

  /**
   * Recursively sanitize all string properties of an object or array
   * @param input - The object or array to sanitize
   * @returns Sanitized object or array
   */
  static sanitizeObject<T>(input: T): T {
    if (!input) return input

    if (typeof input === 'string') {
      return this.sanitize(input) as unknown as T
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeObject(item)) as unknown as T
    }

    if (typeof input === 'object' && input !== null) {
      const result = { ...input } as any
      for (const key in result) {
        if (Object.prototype.hasOwnProperty.call(result, key)) {
          result[key] = this.sanitizeObject(result[key])
        }
      }
      return result as T
    }

    return input
  }
}

