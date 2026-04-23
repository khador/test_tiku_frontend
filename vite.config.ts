import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.31.93',
        changeOrigin: true,
        secure: false,
      },
      // 🔥 重点：代理图片请求到 Nginx
      '/images': {
        target: 'http://192.168.31.93',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})