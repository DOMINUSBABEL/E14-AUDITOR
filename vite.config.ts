import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.VITE_AI_PROVIDER': JSON.stringify(env.VITE_AI_PROVIDER || 'gemini'),
        'process.env.VITE_OPENAI_BASE_URL': JSON.stringify(env.VITE_OPENAI_BASE_URL),
        'process.env.VITE_OPENAI_MODEL': JSON.stringify(env.VITE_OPENAI_MODEL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
