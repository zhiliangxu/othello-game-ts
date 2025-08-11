import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    sourcemap: false,
    cssMinify: true,
  },
  test: {
    environment: 'node'
  }
});
