import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Inject Doubao API key; prefer env var, fallback to provided key
        'process.env.DOUBAO_API_KEY': JSON.stringify(env.DOUBAO_API_KEY || '552e8f29-b293-409d-ad60-cefb365401a1')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
