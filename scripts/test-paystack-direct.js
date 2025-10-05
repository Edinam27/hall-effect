// Direct test for Paystack API with GHS currency
require('dotenv').config();
const paystackApi = require('../api/paystack-api');

async function testPaystackDirect() {
  console.log('Testing Paystack API directly with GHS currency...');
  console.log('PAYSTACK_SECRET_KEY configured:', !!process.env.PAYSTACK_SECRET_KEY);
  
  try {
    const result = await paystackApi.initializeTransaction({
      email: 'test@example.com',
      amount: 1000,
      currency: 'GHS',
      reference: `TEST-DIRECT-${Date.now()}`,
      metadata: { test: true }
    });
    
    console.log('✅ Payment initialization successful!');
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    console.log('Authorization URL:', result.data?.authorization_url);
    console.log('Reference:', result.data?.reference);
    
    return result;
  } catch (error) {
    console.error('❌ Payment initialization failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
testPaystackDirect()
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err.message));