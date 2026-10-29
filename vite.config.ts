import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:5001'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': apiTarget } },
  preview: { proxy: { '/api': apiTarget } },
})
