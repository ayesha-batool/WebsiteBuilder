import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Optional better-auth-ui peers we do not use
      '@instantdb/react': path.resolve(__dirname, './src/shims/empty-module.ts'),
      '@triplit/client': path.resolve(__dirname, './src/shims/empty-module.ts'),
      '@triplit/react': path.resolve(__dirname, './src/shims/empty-module.ts'),
    },
    dedupe: ['react', 'react-dom', 'react-hook-form'],
  },
  optimizeDeps: {
    include: ['react-hook-form', '@hookform/resolvers'],
  },
})
