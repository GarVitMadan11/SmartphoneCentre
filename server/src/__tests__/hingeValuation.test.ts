import { describe, it, expect } from 'vitest';
import { calculateServerValuation, generateQuoteSignature, verifyQuoteSignature } from '../services/valuation.js';

describe('Foldable & Flip Hinge Valuation Engine', () => {
  it('should deduct properly for defect-body-hinge on flagship foldable phones', () => {
    const basePrice = 60000;
    const priceFlawless = calculateServerValuation(basePrice, 'flagship', []);
    const priceFaultyHinge = calculateServerValuation(basePrice, 'flagship', ['defect-body-hinge']);

    // 20% deduction + ₹2,000 fixed capped by body cap (.20 = ₹12,000)
    expect(priceFlawless).toBe(60000);
    expect(priceFaultyHinge).toBeLessThan(priceFlawless!);
    // Body cap is 20%, so deduction is capped at 12000
    expect(priceFlawless! - priceFaultyHinge!).toBe(12000);
  });

  it('should deduct properly for defect-screen-crease on inner flexible displays', () => {
    const basePrice = 50000;
    const priceFlawless = calculateServerValuation(basePrice, 'flagship', []);
    const priceFaultyCrease = calculateServerValuation(basePrice, 'flagship', ['defect-screen-crease']);

    // 35% deduction + ₹1,500 capped by screen cap (.40 = ₹20,000)
    expect(priceFlawless).toBe(50000);
    expect(priceFaultyCrease).toBeLessThan(priceFlawless!);
    // 35% of 50000 = 17500 + 1500 = 19000 (within 20000 cap)
    expect(priceFlawless! - priceFaultyCrease!).toBe(19000);
  });

  it('should sign and verify quotes containing defect-body-hinge and defect-screen-crease', () => {
    process.env.QUOTE_SIGNING_SECRET = 'test-hinge-signing-secret-key-12345';
    const modelLegacyId = 'sam-fold6';
    const storageGb = 512;
    const defectIds = ['defect-body-hinge', 'defect-screen-crease'];
    const finalPrice = 32000;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const signature = generateQuoteSignature(modelLegacyId, storageGb, defectIds, finalPrice, expiresAt);
    expect(signature).toBeDefined();
    expect(signature.length).toBe(64);

    const isValid = verifyQuoteSignature(modelLegacyId, storageGb, defectIds, finalPrice, expiresAt, signature);
    expect(isValid).toBe(true);

    const isTampered = verifyQuoteSignature(modelLegacyId, storageGb, ['defect-body-hinge'], finalPrice, expiresAt, signature);
    expect(isTampered).toBe(false);
  });
});
