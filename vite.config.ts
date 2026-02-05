
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 改回默认端口，避免与后端的 3000 冲突
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 指向 server.js 运行的端口
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
