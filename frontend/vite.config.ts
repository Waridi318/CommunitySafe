import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://<user>.github.io/CommunitySafe/
export default defineConfig({
  base: '/CommunitySafe/',
  plugins: [react(), tailwindcss()],
})
