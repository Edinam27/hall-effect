// Test script to try each currency individually with Paystack
require('dotenv').config();
const paystackApi = require('../api/paystack-api');

async function testCurrency(currency) {
  console.log(`\nTesting currency: ${currency}`);
  try {
    const result = await paystackApi.initializeTransaction({
      email: 'test@example.com',
      amount: 1000,
      currency: currency,
      reference: `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      metadata: { test: true }
    });
    console.log(`✅ SUCCESS with ${currency}:`, {
      status: result.status,
      message: result.message,
      authorizationUrl: result.data?.authorization_url
    });
    return { currency, success: true, result };
  } catch (error) {
    console.log(`❌ FAILED with ${currency}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return { currency, success: false, error };
  }
}

async function main() {
  console.log('Testing Paystack with different currencies...');
  console.log('PAYSTACK_SECRET_KEY configured:', !!process.env.PAYSTACK_SECRET_KEY);
  
  // Test each currency individually
  const currencies = ['NGN', 'USD', 'GHS', 'ZAR', 'KES', 'XOF', 'EGP'];
  const results = [];
  
  for (const currency of currencies) {
    const result = await testCurrency(currency);
    results.push(result);
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  const successful = results.filter(r => r.success);
  console.log(`Successful currencies: ${successful.map(r => r.currency).join(', ') || 'NONE'}`);
  console.log(`Failed currencies: ${results.filter(r => !r.success).map(r => r.currency).join(', ')}`);
  
  return results;
}

// Run the test
main()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err.message));