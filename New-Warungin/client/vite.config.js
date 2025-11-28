import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  // Performance optimizations
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Enable detailed error overlay in development
    hmr: {
      overlay: true, // Show error overlay on screen
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Don't rewrite, keep /api
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('❌ Proxy Error:', err);
            console.error('Error details:', {
              message: err.message,
              code: err.code,
              stack: err.stack,
            });
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('📤 Sending Request:', req.method, req.url);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (process.env.NODE_ENV === 'development') {
              const statusColor = proxyRes.statusCode >= 400 ? '🔴' : proxyRes.statusCode >= 300 ? '🟡' : '🟢';
              console.log(`${statusColor} Response:`, proxyRes.statusCode, req.url);
              if (proxyRes.statusCode >= 400) {
                console.error('Error Response Details:', {
                  status: proxyRes.statusCode,
                  url: req.url,
                  headers: proxyRes.headers,
                });
              }
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development', // Enable sourcemap in development for debugging
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Keep console.log in development
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    // Code splitting optimization
    rollupOptions: {
      output: {
        // Add hash to chunk filenames for better cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor';
            }
            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'ui-vendor';
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'chart-vendor';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
          // Component chunks - ensure all views are included
          if (id.includes('/views/')) {
            const match = id.match(/\/views\/([^/]+)/);
            if (match) {
              const viewName = match[1];
              // Keep component names for better debugging
              return viewName;
            }
          }
        },
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
});

