import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('mapbox')) return 'vendor-mapbox';
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('@react-three')) return 'vendor-r3f';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000, // 警告の閾値を2MBに設定
    // 圧縮の最適化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});