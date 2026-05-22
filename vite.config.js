import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      '/api_dnl/v1': {
        target: 'https://portal.incorpus.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
