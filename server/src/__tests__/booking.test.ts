import { describe, it, expect } from 'vitest';
import { validateBookingBody } from '../index';

describe('Booking Body Input Validation', () => {
  const getValidBookingPayload = (): Record<string, unknown> => ({
    customerName: ' Vikramaditya Singh ',
    customerPhone: '9876543210',
    customerEmail: 'vikram@example.com',
    address: 'Flat 101, Galaxy Apartments, Mumbai - 400001',
    pickupDate: '2026-08-01',
    pickupTimeSlot: '12:00 PM - 03:00 PM (Afternoon)',
    modelId: 'apple-15pm',
    storageGb: 256,
    finalPrice: 55000,
    payoutMethod: 'upi',
    finalPayoutAmount: 55000,
  });

  it('should return no errors for a valid booking payload', () => {
    const payload = getValidBookingPayload();
    const errors = validateBookingBody(payload);
    expect(errors).toHaveLength(0);
  });

  it('should return error for invalid customerName', () => {
    const payload = getValidBookingPayload();
    
    // Missing name
    delete payload.customerName;
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerName'));

    // Too short name
    payload.customerName = 'A';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerName'));

    // Wrong type
    payload.customerName = 12345;
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerName'));
  });

  it('should validate Indian mobile numbers', () => {
    const payload = getValidBookingPayload();

    // Invalid prefix (not 6-9)
    payload.customerPhone = '5876543210';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerPhone'));

    // Incorrect digit count (too short)
    payload.customerPhone = '987654321';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerPhone'));

    // Incorrect digit count (too long)
    payload.customerPhone = '98765432101';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerPhone'));

    // Valid number starting with 6, 7, 8, or 9
    payload.customerPhone = '6789012345';
    expect(validateBookingBody(payload)).toHaveLength(0);
    payload.customerPhone = '7789012345';
    expect(validateBookingBody(payload)).toHaveLength(0);
    payload.customerPhone = '8789012345';
    expect(validateBookingBody(payload)).toHaveLength(0);
  });

  it('should validate email format', () => {
    const payload = getValidBookingPayload();

    payload.customerEmail = 'invalid-email';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerEmail'));

    payload.customerEmail = 'name@';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerEmail'));

    payload.customerEmail = '@domain.com';
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('customerEmail'));
  });

  it('should validate address details length', () => {
    const payload = getValidBookingPayload();

    payload.address = 'Short Rd'; // < 10 chars
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('address'));
  });

  it('should validate other mandatory fields', () => {
    const payload = getValidBookingPayload();

    delete payload.pickupDate;
    expect(validateBookingBody(payload)).toContainEqual(expect.stringContaining('pickupDate'));

    const payload2 = getValidBookingPayload();
    delete payload2.pickupTimeSlot;
    expect(validateBookingBody(payload2)).toContainEqual(expect.stringContaining('pickupTimeSlot'));

    const payload3 = getValidBookingPayload();
    delete payload3.storageGb;
    expect(validateBookingBody(payload3)).toContainEqual(expect.stringContaining('storageGb'));

    const payload4 = getValidBookingPayload();
    payload4.finalPrice = -100;
    expect(validateBookingBody(payload4)).toContainEqual(expect.stringContaining('finalPrice'));
  });
});
