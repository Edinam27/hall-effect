const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

async function run() {
  try {
    console.log('Creating test order...');
    const orderRes = await axios.post(`${BASE_URL}/api/orders`, {
      customerInfo: {
        fullName: 'Test User',
        email: 'test.user@example.com',
        phone: '+2348012345678',
        address: '123 Test Street',
        city: 'Lagos',
        state: 'LA',
        zipCode: '100001',
        country: 'NG'
      },
      items: [
        { id: 'sku-123', name: 'Test Item', price: 1000, quantity: 1 }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const order = orderRes.data.order || orderRes.data;
    console.log('Order created:', order);

    if (!order.id) throw new Error('Order ID missing from response');

    console.log('Initializing payment...');
    const payRes = await axios.post(`${BASE_URL}/api/payment/initialize/${order.id}`, {
      email: order.customer?.email || 'test.user@example.com',
      customerId: order.customer?.email || 'test.user@example.com',
      currency: 'GHS' // Use GHS which is the only supported currency
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Payment init response:', payRes.data);

    if (payRes.data.success && payRes.data.paymentUrl) {
      console.log('Authorization URL:', payRes.data.paymentUrl);
      console.log('Reference:', payRes.data.reference);
    } else {
      console.error('Unexpected payment init result:', payRes.data);
    }
  } catch (err) {
    const data = err.response?.data;
    console.error('Test failed:', data || err.message);
  }
}

run();