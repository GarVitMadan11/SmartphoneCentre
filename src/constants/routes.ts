// Admin Portal Route Configuration
export const SECRET_ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/rpx';

// Decoy paths that automated bots and scanners attempt to probe
export const DECOY_ADMIN_PATHS = [
  '/wp-admin',
  '/administrator',
  '/cpanel',
  '/backend',
  '/control-panel'
];
