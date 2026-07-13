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
        target: process.env.VITE_SERVER_URL || config.SERVER_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase warning limit slightly if needed
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
