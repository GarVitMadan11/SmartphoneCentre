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
    // Security headers served during development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    }
  },
  preview: {
    // Same headers for `vite preview` (production preview)
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
  }
})

