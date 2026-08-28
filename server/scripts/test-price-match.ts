import 'dotenv/config';

async function testPriceMatchAlert() {
  console.log('🧪 Testing POST http://localhost:4000/api/quotes/price-match with dedicated Amber template...');

  const payload = {
    customerPhone: '9034997719',
    customerName: 'Garvit Madan (Price Match Test)',
    customerEmail: 'garvitmadan511@gmail.com',
    modelName: 'iPhone 17 Pro Max',
    storageGb: 256,
    currentQuote: 59650,
    expectedPrice: 65615,
    comments: 'Customer requested a price match for 65k target price',
    refCode: 'MATCH-TEST99'
  };

  try {
    const res = await fetch('http://localhost:4000/api/quotes/price-match', {
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

testPriceMatchAlert();
