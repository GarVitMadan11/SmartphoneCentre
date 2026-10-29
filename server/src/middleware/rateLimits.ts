import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many requests. Please try again later.' },
  skip: () => isDev,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true,
  skip: () => isDev,
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many booking submissions. Please try again later.' },
  skip: () => isDev,
});

export const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many order tracking attempts. Please try again in 15 minutes.' },
  skip: () => isDev,
});

export const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many lead events. Please wait.' },
  skip: () => isDev,
});

