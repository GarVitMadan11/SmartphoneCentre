import 'dotenv/config';

async function testPostBooking() {
  console.log('🧪 Testing POST http://localhost:4000/api/bookings...');
  
  const payload = {
    customerName: 'Garvit Madan API Test',
    customerPhone: '9876543210',
    customerEmail: 'garvitmadan511@gmail.com',
    address: 'Flat 901, Pearl Heights, Mumbai - 400050',
    pickupDate: '2026-09-02',
    pickupTimeSlot: '09:00 AM - 12:00 PM (Morning)',
    modelId: 'apple-15pm',
    storageGb: 256,
    finalPrice: 55000,
    payoutMethod: 'upi',
    payoutDetails: { upiId: 'garvit@okaxis' },
    defectIds: [],
  };

  try {
    const res = await fetch('http://localhost:4000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testPostBooking();
