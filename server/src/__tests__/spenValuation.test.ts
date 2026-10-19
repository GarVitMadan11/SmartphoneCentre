import { describe, it, expect } from 'vitest';
import { calculateServerValuation, generateQuoteSignature, verifyQuoteSignature } from '../services/valuation.js';

describe('S-Pen Defect & Valuation Engine', () => {
  it('should properly deduct ₹2,000 for defect-spen-missing on flagship devices', () => {
    const basePrice = 50000;
    const priceWithoutSpenDefect = calculateServerValuation(basePrice, 'flagship', []);
    const priceWithSpenDefect = calculateServerValuation(basePrice, 'flagship', ['defect-spen-missing']);

    expect(priceWithoutSpenDefect).toBe(50000);
    expect(priceWithSpenDefect).toBe(48000);
    expect(priceWithoutSpenDefect! - priceWithSpenDefect!).toBe(2000);
  });

  it('should sign and verify quotes containing defect-spen-missing correctly', () => {
    process.env.QUOTE_SIGNING_SECRET = 'test-spen-signing-secret-key-12345';
    const modelLegacyId = 'sam-s24u';
    const storageGb = 256;
    const defectIds = ['defect-spen-missing', 'defect-box-missing'];
    const finalPrice = 45500;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const signature = generateQuoteSignature(modelLegacyId, storageGb, defectIds, finalPrice, expiresAt);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(64); // SHA-256 hex string

    // Verification must pass with valid signature
    const isValid = verifyQuoteSignature(modelLegacyId, storageGb, defectIds, finalPrice, expiresAt, signature);
    expect(isValid).toBe(true);

    // Tampering with defectIds must fail
    const isTampered = verifyQuoteSignature(modelLegacyId, storageGb, ['defect-box-missing'], finalPrice, expiresAt, signature);
    expect(isTampered).toBe(false);
  });
});
