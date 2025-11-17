import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize build output
    target: 'es2015',
    minify: 'esbuild', // Use esbuild for faster minification
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking strategy for better code splitting
        manualChunks: {
          // Vendor chunks - separate large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts'],

          // Feature-based chunks
          'auth': [
            './src/pages/auth/Login.tsx',
            './src/stores/authStore.ts',
          ],
          'inventory': [
            './src/pages/inventory/ProductList.tsx',
            './src/pages/inventory/ProductDetails.tsx',
            './src/pages/inventory/InventoryLots.tsx',
          ],
          'sales': [
            './src/pages/sales/POSInterface.tsx',
            './src/pages/sales/SalesOrders.tsx',
          ],
          'purchase': [
            './src/pages/purchase/PurchaseOrders.tsx',
          ],
          'management': [
            './src/pages/suppliers/SupplierList.tsx',
            './src/pages/customers/CustomerList.tsx',
            './src/pages/users/UserList.tsx',
          ],
          'reports': [
            './src/pages/reports/Reports.tsx',
          ],
          // Modal chunks - separate large modals
          'modals': [
            './src/components/modals/CustomerProfileModal.tsx',
            './src/components/modals/LotDetailsModal.tsx',
            './src/components/modals/PurchaseOrderDetailsModal.tsx',
            './src/components/modals/SalesOrderDetailsModal.tsx',
            './src/components/modals/SupplierDetailsModal.tsx',
            './src/components/modals/ReceiptModal.tsx',
            './src/components/modals/ProductFormModal.tsx',
            './src/components/modals/ReceiveInventoryModal.tsx',
          ],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Source map for production debugging (optional, can be disabled for smaller builds)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'recharts',
    ],
  },
});
