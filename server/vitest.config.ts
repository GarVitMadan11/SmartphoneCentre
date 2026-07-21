import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'test-jwt-secret-for-unit-tests-only',
      ADMIN_PIN_HASH: '$2a$10$dummyhashherebecryptrequiresaformatthatisvalid',
    },
  },
});
