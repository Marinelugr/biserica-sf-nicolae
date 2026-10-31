import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  // testele de autorizare importă și pagini .tsx
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
