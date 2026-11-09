import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During development, /api/* calls go to the Express server
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
