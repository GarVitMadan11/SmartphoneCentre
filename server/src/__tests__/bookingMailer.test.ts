import { describe, it, expect } from 'vitest';
import { sendBookingConfirmationEmail, sendAdminBookingNotificationEmail, sendAdminQuoteAlertEmail } from '../services/bookingMailer';

describe('Booking Mailer & Admin Alert Email', () => {
  const sampleBooking = {
    id: 'STC-TEST999',
    modelName: 'iPhone 15 Pro',
    storageGb: 256,
    customerName: 'Garvit Madan',
    customerPhone: '9876543210',
    customerEmail: 'customer@example.com',
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
  });

  it('should run sendBookingConfirmationEmail and dispatch both customer & admin emails without throwing errors', async () => {
    const result = await sendBookingConfirmationEmail(sampleBooking, 'http://localhost:4000');
    expect(result).toBe(true);
  });

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
  });
});

