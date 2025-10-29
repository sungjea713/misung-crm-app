import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { cacheBustPlugin } from './vite-plugin-cache-bust';

export default defineConfig({
  plugins: [react(), cacheBustPlugin()],
  root: 'src/frontend',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    // 프로덕션 빌드에서 파일명에 해시 추가 (캐시 버스팅)
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
    // 개발 서버 캐시 설정
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend'),
    },
  },
  // CSS HMR 개선
  css: {
    devSourcemap: true,
  },
  // 최적화 설정
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // 개발 환경에서도 캐시 버스팅 활성화
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().getTime()),
  },
});
