import 'reflect-metadata'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { beforeAll, afterAll } from 'vitest'
import { setupContainer } from '../../src/shared/container'
import { logger } from '../../src/shared/util'

let mongoReplSet: MongoMemoryReplSet

// Global Mongoose configuration for tests
mongoose.set('bufferCommands', false)
mongoose.set('bufferTimeoutMS', 30000)

beforeAll(async () => {
  try {
    // 1. Start In-Memory MongoDB Replica Set for transactions
    mongoReplSet = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        name: 'rs0',
        storageEngine: 'wiredTiger',
      },
    })
    const mongoUri = mongoReplSet.getUri()

    // 2. Connect Mongoose
    await mongoose.connect(mongoUri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    })

    // 3. Re-initialize container for each test run AFTER DB is connected
    setupContainer()

    // 4. Clear database initially
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections()
      for (const collection of collections) {
        await collection.deleteMany({})
      }
    }
  } catch (error) {
    logger.error('FAILED to setup integration tests:', error)
    throw error
  }
}, 120000) // 120s timeout for beforeAll

afterAll(async () => {
  try {
    // 1. Disconnect Mongoose
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }

    // 2. Stop Mongo ReplSet
    if (mongoReplSet) {
      await mongoReplSet.stop()
    }
  } catch (error) {
    logger.error('Error during integration test teardown:', error)
  }
}, 120000) // 120s timeout for afterAll
