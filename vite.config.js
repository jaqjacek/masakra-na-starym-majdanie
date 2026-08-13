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
        target: (process.env.VITE_SERVER_URL || config.SERVER_URL || 'http://127.0.0.1:3001').replace('localhost', '127.0.0.1'),
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && res.writeHead) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Backend server unavailable' }));
            }
          });
        }
      },
      '/socket.io': {
        target: (process.env.VITE_SERVER_URL || config.SERVER_URL || 'http://127.0.0.1:3001').replace('localhost', '127.0.0.1'),
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err) => {
            // Suppress unhandled socket hang-up during server restart
          });
        }
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
