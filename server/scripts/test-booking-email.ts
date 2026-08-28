import 'dotenv/config';
import { sendBookingConfirmationEmail } from '../src/services/bookingMailer.js';

async function testBookingEmail() {
  console.log('📧 Testing sendBookingConfirmationEmail with current .env credentials...');

  const result = await sendBookingConfirmationEmail({
    id: 'STC-REALTEST123',
    modelName: 'iPhone 16 Pro',
    storageGb: 128,
    customerName: 'Garvit Madan',
    customerPhone: '9876543210',
    customerEmail: 'garvitmadan511@gmail.com',
    address: 'Flat 101, Galaxy Apartments, Mumbai - 400001',
    pickupDate: '2026-09-01',
    pickupTimeSlot: '10:00 AM - 01:00 PM (Morning)',
    finalPrice: 75350,
    defectDescriptions: [],
    dateCreated: new Date().toISOString(),
  }, 'http://localhost:4000');

  console.log('Result:', result ? '✅ SUCCESS' : '❌ FAILED');
}

testBookingEmail();
