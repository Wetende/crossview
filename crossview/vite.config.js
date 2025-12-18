import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src'),
    },
  },
  build: {
    outDir: 'static/dist',
    manifest: true,
    rollupOptions: {
      input: 'frontend/src/main.js',
    },
  },
  server: {
    origin: 'http://localhost:5173',
  },
})
