import 'reflect-metadata'
import app from './app'
import { startServer } from './shared/util'

// Start the server
startServer(app).catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
