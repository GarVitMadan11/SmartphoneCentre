// Secret Admin Portal Route Configuration
// In production, override VITE_ADMIN_PATH in .env to use a custom obfuscated route URL.
export const SECRET_ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/rephonix-ops-x89';

// Decoy paths that automated bots and scanners attempt to probe
export const DECOY_ADMIN_PATHS = [
  '/admin',
  '/wp-admin',
  '/administrator',
  '/admin-login',
  '/cpanel',
  '/backend',
  '/control-panel'
];
