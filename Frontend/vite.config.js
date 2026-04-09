import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,   // Necesario para Docker
    open: false   // No abrir browser automáticamente (no hay browser en Docker)
  }
})
