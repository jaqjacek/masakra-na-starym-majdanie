import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const config = JSON.parse(fs.readFileSync('./server_config.json'));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: config.SERVER_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
