import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 【新增这一段】强制 Vite 监听局域网所有的 IP
  server: {
    host: true,
    port: 5173,
  }
})