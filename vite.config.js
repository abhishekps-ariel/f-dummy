import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5173,
    allowedHosts: ['bloodstained-superornamentally-ivonne.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'https://localhost:44321',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
