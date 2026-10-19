import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../services/bookingMailer.js';
import { generateQuoteSignature, verifyQuoteSignature } from '../services/valuation.js';

describe('Security Hardening & Input Sanitization', () => {
  describe('HTML Sanitization (escapeHtml)', () => {
    it('should escape HTML tags and dangerous characters', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = escapeHtml(malicious);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should escape ampersands and single quotes', () => {
      const input = "Tom & Jerry's Store";
      const sanitized = escapeHtml(input);
      expect(sanitized).toBe('Tom &amp; Jerry&#39;s Store');
    });

    it('should handle null and undefined safely', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('Cryptographic Quote Signing & Tamper Detection', () => {
    it('should sign and verify a valid quote', () => {
      const modelId = 'apple-iphone-15-pro';
      const storageGb = 256;
      const defectIds = ['defect-body-scuffs'];
      const price = 65000;
      const expiresAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const signature = generateQuoteSignature(modelId, storageGb, defectIds, price, expiresAtIso);
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 HMAC hex string

      const isValid = verifyQuoteSignature(modelId, storageGb, defectIds, price, expiresAtIso, signature);
      expect(isValid).toBe(true);
    });

    it('should reject a quote signature if price was tampered with', () => {
      const modelId = 'apple-iphone-15-pro';
      const storageGb = 256;
      const defectIds = ['defect-body-scuffs'];
      const realPrice = 65000;
      const tamperedPrice = 99999;
      const expiresAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const signature = generateQuoteSignature(modelId, storageGb, defectIds, realPrice, expiresAtIso);
      const isValid = verifyQuoteSignature(modelId, storageGb, defectIds, tamperedPrice, expiresAtIso, signature);
      expect(isValid).toBe(false);
    });

    it('should reject an expired quote signature', () => {
      const modelId = 'apple-iphone-15-pro';
      const storageGb = 256;
      const defectIds: string[] = [];
      const price = 50000;
      const expiredIso = new Date(Date.now() - 5000).toISOString();

      const signature = generateQuoteSignature(modelId, storageGb, defectIds, price, expiredIso);
      const isValid = verifyQuoteSignature(modelId, storageGb, defectIds, price, expiredIso, signature);
      expect(isValid).toBe(false);
    });
  });
});
