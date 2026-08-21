import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // P-2b: Automatically compress & convert images to WebP on production build.
    // Reduces 82.9MB of device catalog PNGs by ~60-75% (est. output: ~20-30MB).
    ViteImageOptimizer({
      png:  { quality: 82 },
      jpg:  { quality: 82 },
      jpeg: { quality: 82 },
      webp: { lossless: false, quality: 82 },
      gif:  {},
      // Output WebP for all supported types
      includePublic: true,
      logStats: true,
    }),
  ],
  server: {
    port: 3000,
    open: true,
    // Proxy API requests to Express backend
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Security headers served during development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    }
  },
  preview: {
    // Same proxy and security headers for `vite preview` (production preview)
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    }
  },
  build: {
    // Disable sourcemaps in production — prevents source code exposure
    sourcemap: false,
    // Raise chunk size warning threshold slightly for framer-motion
    chunkSizeWarningLimit: 700,
  },
  define: {
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
    ),
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(
      process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBmhYvC0BrBU6hXVVFu4GwUigZsM0NEMD0'
    ),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(
      process.env.VITE_FIREBASE_AUTH_DOMAIN || 'rephonix-f2cfa.firebaseapp.com'
    ),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_PROJECT_ID || 'rephonix-f2cfa'
    ),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET || 'rephonix-f2cfa.firebasestorage.app'
    ),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '730993464038'
    ),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(
      process.env.VITE_FIREBASE_APP_ID || '1:730993464038:web:b31db03a76e5355c7a6127'
    ),
    'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-FGXD69F6MB'
    ),
  },
})

