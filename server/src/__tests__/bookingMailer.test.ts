import { describe, it, expect, vi } from 'vitest';

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-test-id-12345' }),
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));

import {
  sendBookingUnderReviewEmail,
  sendBookingApprovalEmail,
  sendBookingConfirmationEmail,
  sendAdminBookingNotificationEmail,
  sendAdminQuoteAlertEmail,
  sendAdminStepLeadEmail,
  sendAdminReviewSummaryEmail,
} from '../services/bookingMailer';

describe('Booking Mailer & Admin Alert Email', () => {
  const sampleBooking = {
    id: 'RPX-2610-TEST',
    modelName: 'iPhone 15 Pro',
    storageGb: 256,
    customerName: 'Garvit Madan',
    customerPhone: '9876543210',
    customerEmail: 'garvitmadan511+test@gmail.com',
    address: 'Flat 402, Sunshine Towers, Delhi - 110001',
    pickupDate: '2026-09-01',
    pickupTimeSlot: '10:00 AM - 01:00 PM (Morning)',
    finalPrice: 65000,
    defectDescriptions: ['Minor scratches on screen'],
    dateCreated: new Date().toISOString(),
  };

  it('should run sendAdminBookingNotificationEmail without throwing errors', async () => {
    const result = await sendAdminBookingNotificationEmail(sampleBooking, null, 'http://localhost:4000');
    expect(result).toBe(true);
  }, 30000);

  it('should run sendBookingUnderReviewEmail and dispatch customer & admin review alert without throwing errors', async () => {
    const result = await sendBookingUnderReviewEmail(sampleBooking, 'http://localhost:4000');
    expect(result).toBe(true);
  }, 30000);

  it('should run sendBookingApprovalEmail and dispatch customer confirmation without throwing errors', async () => {
    const result = await sendBookingApprovalEmail(sampleBooking, 'http://localhost:4000');
    expect(result).toBe(true);
  }, 30000);

  it('should run sendBookingConfirmationEmail backward-compatibility alias without throwing errors', async () => {
    const result = await sendBookingConfirmationEmail(sampleBooking, 'http://localhost:4000');
    expect(result).toBe(true);
  }, 30000);

  it('should run sendAdminQuoteAlertEmail for logged-in quote generation without throwing errors', async () => {
    const result = await sendAdminQuoteAlertEmail({
      customerName: 'Garvit Madan',
      customerPhone: '9876543210',
      customerEmail: 'garvit@example.com',
      modelName: 'iPhone 16 Pro',
      storageGb: 128,
      estimatedPayout: 75350,
      retentionPercentage: 100,
      defects: [],
      refCode: 'SCH-TEST123',
    });
    expect(result).toBe(true);
  }, 15000);

  it('should run sendAdminStepLeadEmail when user reaches Step 2 without throwing errors', async () => {
    const result = await sendAdminStepLeadEmail({
      modelName: 'Galaxy S24 Ultra',
      brandName: 'SAMSUNG',
      storageGb: 256,
      ramGb: 12,
      basePrice: 43250,
      customerName: 'Garvit Madan (Unit Test)',
      customerPhone: '9034997719',
      customerEmail: 'garvitmadan511@gmail.com',
      deviceType: 'phone',
      sourceUrl: 'http://localhost:5173/sell-used-samsung-galaxy-s24-ultra-256gb',
    });
    expect(result).toBe(true);
  }, 15000);

  it('should run sendAdminReviewSummaryEmail when user clicks Review Summary without throwing errors', async () => {
    const result = await sendAdminReviewSummaryEmail({
      modelName: 'iPhone 16 Pro Max',
      brandName: 'APPLE',
      storageGb: 256,
      estimatedPayout: 72400,
      retentionPercentage: 88,
      defects: ['Original Battery Health 80% - 85%'],
      customerName: 'Garvit Madan (Unit Test)',
      customerPhone: '9034997719',
      customerEmail: 'garvitmadan511@gmail.com',
      deviceType: 'phone',
      sourceUrl: 'http://localhost:5173/sell-used-apple-iphone-16-pro-max-256gb',
    });
    expect(result).toBe(true);
  }, 15000);
});


