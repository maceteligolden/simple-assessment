import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.config.js',
        '**/index.ts',
        '**/*.interface.ts',
        '**/*.model.ts',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    exclude: ['test/integration/**', 'node_modules/**', 'dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

