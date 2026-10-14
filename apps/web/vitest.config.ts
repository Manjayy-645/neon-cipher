import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    pool: 'threads',
    // In Vitest v4/v5, poolOptions are top-level options:
    // @ts-ignore
    singleThread: true,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '../../packages/game-rules/src/**/*.{test,spec}.{ts,tsx}',
    ],
    alias: [
      { find: /^@neon-cipher\/game-rules\/src\/index$/, replacement: resolve(__dirname, '../../packages/game-rules/src/index.ts') },
      { find: /^@neon-cipher\/game-rules$/, replacement: resolve(__dirname, '../../packages/game-rules/src/index.ts') },
      { find: /^@neon-cipher\/tokens$/, replacement: resolve(__dirname, '../../packages/tokens') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
  },
})
