// Test script to check Paystack merchant account details
// This helps identify supported currencies and other merchant configuration

require('dotenv').config();
const paystackApi = require('../api/paystack-api');

async function testPaystackMerchant() {
  console.log('Testing Paystack Merchant API...');
  console.log('PAYSTACK_SECRET_KEY configured:', !!process.env.PAYSTACK_SECRET_KEY);
  
  try {
    const merchant = await paystackApi.getMerchant();
    console.log('Merchant data retrieved successfully:');
    console.log('Business name:', merchant.data?.business_name);
    console.log('Supported currencies:', merchant.data?.currencies);
    console.log('Country:', merchant.data?.country);
    console.log('Default currency:', merchant.data?.default_currency);
    
    // Try a direct transaction initialization with each supported currency
    if (Array.isArray(merchant.data?.currencies)) {
      for (const currency of merchant.data.currencies) {
        console.log(`\nTesting transaction initialization with currency: ${currency}`);
        try {
          const result = await paystackApi.initializeTransaction({
            email: 'test@example.com',
            amount: 1000,
            currency: currency,
            reference: `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            metadata: { test: true }
          });
          console.log(`✅ ${currency} initialization successful:`, {
            status: result.status,
            message: result.message,
            authorizationUrl: result.data?.authorization_url
          });
        } catch (error) {
          console.log(`❌ ${currency} initialization failed:`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
        }
      }
    }
    
    return merchant;
  } catch (error) {
    console.error('Error fetching merchant data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
testPaystackMerchant()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err.message));