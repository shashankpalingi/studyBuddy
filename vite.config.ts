import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cloudinary': {
        target: 'https://api.cloudinary.com/v1_1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cloudinary/, ''),
        secure: false
      }
    }
  }
}); 