import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // or the subpath your app is served from, e.g. '/filir/'
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
  },
  build: {
    outDir: 'dist',
    manifest: true,
    sourcemap: false,
  },
})
