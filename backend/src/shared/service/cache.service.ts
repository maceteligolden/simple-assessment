import { injectable } from 'tsyringe'
import NodeCache from 'node-cache'
import { logger } from '../util/logger'
import { ENV } from '../constants'

/**
 * Cache Service Interface
 * Defines the contract for cache operations
 */
export interface ICacheService {
  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or undefined if not found
   */
  get<T>(key: string): T | undefined

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (optional, uses default if not provided)
   * @returns true if successful
   */
  set<T>(key: string, value: T, ttlSeconds?: number): boolean

  /**
   * Delete a value from cache
   * @param key - Cache key
   * @returns Number of deleted keys
   */
  delete(key: string): number

  /**
   * Delete multiple keys from cache
   * @param keys - Array of cache keys
   * @returns Number of deleted keys
   */
  deleteMany(keys: string[]): number

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns true if key exists
   */
  has(key: string): boolean

  /**
   * Get multiple values from cache
   * @param keys - Array of cache keys
   * @returns Object with key-value pairs for found keys
   */
  getMany<T>(keys: string[]): Record<string, T>

  /**
   * Set multiple values in cache
   * @param keyValuePairs - Object with key-value pairs
   * @param ttlSeconds - Time to live in seconds (optional, uses default if not provided)
   * @returns true if all successful
   */
  setMany<T>(keyValuePairs: Record<string, T>, ttlSeconds?: number): boolean

  /**
   * Clear all cache entries
   */
  clear(): void

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStats(): {
    hits: number
    misses: number
    keys: number
    ksize: number
    vsize: number
  }

  /**
   * Flush all expired entries
   * @returns Number of flushed entries
   */
  flushExpired(): number

  /**
   * Get all keys in cache
   * @returns Array of cache keys
   */
  keys(): string[]
}

/**
 * Cache Service Implementation
 * Simple cache abstraction using node-cache
 */
@injectable()
export class CacheService implements ICacheService {
  private cache: NodeCache

  constructor() {
    // Use ENV constants for configuration
    const defaultTTL = ENV.CACHE_DEFAULT_TTL_SECONDS
    const checkPeriod = ENV.CACHE_CHECK_PERIOD_SECONDS

    const options: NodeCache.Options = {
      stdTTL: defaultTTL, // Default TTL for all keys
      checkperiod: checkPeriod, // How often to check for expired keys
      useClones: true, // Clone values to prevent reference issues
      deleteOnExpire: true, // Automatically delete expired keys
      enableLegacyCallbacks: false, // Use promises instead of callbacks
    }

    this.cache = new NodeCache(options)

    // Set up event listeners for monitoring
    this.setupEventListeners()

    logger.info('CacheService initialized', {
      defaultTTL,
      checkPeriod,
    })
  }

  /**
   * Set up event listeners for cache monitoring
   */
  private setupEventListeners(): void {
    this.cache.on('set', (key, _value) => {
      logger.debug('Cache set', { key })
    })

    this.cache.on('del', (key, _value) => {
      logger.debug('Cache deleted', { key })
    })

    this.cache.on('expired', (key, _value) => {
      logger.debug('Cache expired', { key })
    })

    this.cache.on('flush', () => {
      logger.info('Cache flushed')
    })
  }

  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key)
      if (value !== undefined) {
        logger.debug('Cache hit', { key })
      } else {
        logger.debug('Cache miss', { key })
      }
      return value
    } catch (error) {
      logger.error('Error getting from cache', error, { key })
      return undefined
    }
  }

  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    try {
      // node-cache.set() accepts ttl as number or uses default if not provided
      const success =
        ttlSeconds !== undefined
          ? this.cache.set<T>(key, value, ttlSeconds)
          : this.cache.set<T>(key, value)
      if (success) {
        logger.debug('Cache set', {
          key,
          ttl: ttlSeconds || 'default',
        })
      }
      return success
    } catch (error) {
      logger.error('Error setting cache', error, { key })
      return false
    }
  }

  delete(key: string): number {
    try {
      const deleted = this.cache.del(key)
      if (deleted > 0) {
        logger.debug('Cache deleted', { key })
      }
      return deleted
    } catch (error) {
      logger.error('Error deleting from cache', error, { key })
      return 0
    }
  }

  deleteMany(keys: string[]): number {
    try {
      const deleted = this.cache.del(keys)
      logger.debug('Cache deleted many', { keys, deleted })
      return deleted
    } catch (error) {
      logger.error('Error deleting many from cache', error, { keys })
      return 0
    }
  }

  has(key: string): boolean {
    try {
      return this.cache.has(key)
    } catch (error) {
      logger.error('Error checking cache', error, { key })
      return false
    }
  }

  getMany<T>(keys: string[]): Record<string, T> {
    try {
      const values = this.cache.mget<T>(keys)
      logger.debug('Cache get many', {
        keys,
        found: Object.keys(values).length,
      })
      return values
    } catch (error) {
      logger.error('Error getting many from cache', error, { keys })
      return {}
    }
  }

  setMany<T>(keyValuePairs: Record<string, T>, ttlSeconds?: number): boolean {
    try {
      // Convert to array of [key, value, ttl] tuples
      // node-cache.mset() expects ValueSetItem which is [key, value] or [key, value, ttl]
      const entries = Object.entries(keyValuePairs).map(([key, value]) => {
        if (ttlSeconds !== undefined) {
          return [key, value, ttlSeconds]
        }
        return [key, value]
      })

      // Type assertion through unknown to handle tuple types
      const success = this.cache.mset(
        entries as unknown as NodeCache.ValueSetItem<T>[]
      )
      if (success) {
        logger.debug('Cache set many', {
          keys: Object.keys(keyValuePairs),
          ttl: ttlSeconds || 'default',
        })
      }
      return success
    } catch (error) {
      logger.error('Error setting many in cache', error, {
        keys: Object.keys(keyValuePairs),
      })
      return false
    }
  }

  clear(): void {
    try {
      this.cache.flushAll()
      logger.info('Cache cleared')
    } catch (error) {
      logger.error('Error clearing cache', error)
    }
  }

  getStats(): {
    hits: number
    misses: number
    keys: number
    ksize: number
    vsize: number
  } {
    try {
      const stats = this.cache.getStats()
      return {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
        ksize: stats.ksize,
        vsize: stats.vsize,
      }
    } catch (error) {
      logger.error('Error getting cache stats', error)
      return {
        hits: 0,
        misses: 0,
        keys: 0,
        ksize: 0,
        vsize: 0,
      }
    }
  }

  flushExpired(): number {
    try {
      const stats = this.cache.getStats()
      const beforeKeys = stats.keys
      this.cache.flushAll()
      const afterStats = this.cache.getStats()
      const flushed = beforeKeys - afterStats.keys
      logger.debug('Cache expired entries flushed', { flushed })
      return flushed
    } catch (error) {
      logger.error('Error flushing expired cache entries', error)
      return 0
    }
  }

  keys(): string[] {
    try {
      return this.cache.keys()
    } catch (error) {
      logger.error('Error getting cache keys', error)
      return []
    }
  }
}
