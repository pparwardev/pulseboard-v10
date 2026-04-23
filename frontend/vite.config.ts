import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3001,
    proxy: {
      '/api': { target: 'http://localhost:8001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8001', changeOrigin: true },
      '/profile-photos': { target: 'http://localhost:8001', changeOrigin: true }
    }
  },
  resolve: {
    alias: {
      'xlsx': path.resolve(__dirname, 'node_modules/xlsx/xlsx.mjs')
    }
  },
  optimizeDeps: {
    include: ['xlsx', 'react-pdf']
  }
})
