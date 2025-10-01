// Test script for AliExpress and Paystack APIs

require('dotenv').config();
const aliExpressApi = require('./api/aliexpress-api');
const paystackApi = require('./api/paystack-api');

// Test function to check if APIs are working
async function testAPIs() {
  console.log('🧪 Starting API tests...');
  
  // Test results object
  const results = {
    aliexpress: {
      auth: false,
      productDetails: false,
      error: null
    },
    paystack: {
      config: false,
      transaction: false,
      error: null
    }
  };

  // Test AliExpress API
  console.log('\n🔍 Testing AliExpress API...');
  try {
    // Generate AliExpress authorization URL
    console.log('  - Checking AliExpress configuration...');
    try {
      // Generate auth URL manually as it's done in the routes
      const authUrl = `https://auth.aliexpress.com/oauth/authorize?client_id=${process.env.ALIEXPRESS_APP_KEY}&redirect_uri=${encodeURIComponent(process.env.ALIEXPRESS_REDIRECT_URI)}&response_type=code`;
      console.log('  ℹ️ AliExpress authorization URL can be generated');
      
      // Check if tokens are available in the config file
      const fs = require('fs');
      const path = require('path');
      const tokensPath = path.join(__dirname, './config/aliexpress-tokens.json');
      const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
      
      if (tokens.accessToken && tokens.refreshToken) {
        results.aliexpress.auth = true;
        console.log('  ✅ AliExpress tokens are available');
      } else {
        console.log('  ⚠️ AliExpress tokens are not available');
        console.log('  ℹ️ You need to authorize the application first by visiting:');
        console.log(`  ${authUrl}`);
      }
    } catch (error) {
      console.log('  ❌ AliExpress configuration check failed:', error.message);
      console.log('  ℹ️ You may need to check your .env file for ALIEXPRESS_APP_KEY and ALIEXPRESS_REDIRECT_URI');
      results.aliexpress.error = error.message;
    }

    // Test product details API regardless of authentication status
    console.log('  - Testing product details API functionality...');
    try {
      // Use a test product ID - replace with a valid one if needed
      const testProductId = '1005005956024466';
      
      // Check if the getProductDetails function exists
      if (typeof aliExpressApi.getProductDetails === 'function') {
        console.log('  ✅ Product details API function exists');
        
        if (results.aliexpress.auth) {
          try {
            const productDetails = await aliExpressApi.getProductDetails(testProductId);
            results.aliexpress.productDetails = true;
            console.log('  ✅ Product details retrieved successfully');
            console.log('  ℹ️ Product info:', JSON.stringify(productDetails, null, 2).substring(0, 150) + '...');
          } catch (error) {
            console.log('  ❌ Failed to retrieve product details:', error.message);
            console.log('  ℹ️ This is expected if you are not authenticated with AliExpress');
          }
        } else {
          console.log('  ℹ️ Skipping actual API call since authentication is not available');
          console.log('  ℹ️ To test with real data, please authenticate with AliExpress first');
        }
      } else {
        console.log('  ❌ Product details API function does not exist');
        results.aliexpress.error = 'getProductDetails function not found';
      }
    } catch (error) {
      console.log('  ❌ Error testing product details API:', error.message);
      results.aliexpress.error = error.message;
    }
  } catch (error) {
    console.error('  ❌ AliExpress API test failed:', error.message);
    results.aliexpress.error = error.message;
  }

  // Test Paystack API
  console.log('\n💳 Testing Paystack API...');
  try {
    // Check if Paystack API key is configured
    console.log('  - Checking Paystack configuration...');
    if (process.env.PAYSTACK_SECRET_KEY) {
      results.paystack.config = true;
      console.log('  ✅ Paystack API key is configured');
      
      // Test transaction initialization
      console.log('  - Testing transaction initialization...');
      try {
        const testTransaction = await paystackApi.initializeTransaction({
          email: 'test@example.com',
          amount: 1000, // 10.00 in lowest currency unit
          reference: `test-${Date.now()}`,
          callbackUrl: 'http://localhost:8080/payment/callback',
          metadata: {
            custom_fields: [
              {
                display_name: 'Test Order',
                variable_name: 'test_order',
                value: 'test-123'
              }
            ]
          }
        });
        
        results.paystack.transaction = true;
        console.log('  ✅ Transaction initialized successfully');
        console.log('  ℹ️ Authorization URL:', testTransaction.data.authorization_url);
      } catch (error) {
        console.log('  ❌ Failed to initialize transaction:', error.message);
        results.paystack.error = error.message;
      }
    } else {
      console.log('  ❌ Paystack API key is not configured');
      results.paystack.error = 'API key not configured';
    }
  } catch (error) {
    console.error('  ❌ Paystack API test failed:', error.message);
    results.paystack.error = error.message;
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('  AliExpress API:');
  console.log(`    Authentication: ${results.aliexpress.auth ? '✅ Working' : '⚠️ Not Authenticated'}`);
  
  // For product details, we want to show if the function exists even if we couldn't test it
  if (typeof aliExpressApi.getProductDetails === 'function') {
    console.log(`    Product Details API: ✅ Available (${results.aliexpress.productDetails ? 'Tested Successfully' : 'Not Tested'})`); 
  } else {
    console.log(`    Product Details API: ❌ Not Available`);
  }
  
  if (results.aliexpress.error) {
    console.log(`    Error: ${results.aliexpress.error}`);
  }
  
  console.log('  Paystack API:');
  console.log(`    Configuration: ${results.paystack.config ? '✅ Working' : '❌ Failed'}`);
  console.log(`    Transaction: ${results.paystack.transaction ? '✅ Working' : '❌ Failed'}`);
  if (results.paystack.error) {
    console.log(`    Error: ${results.paystack.error}`);
  }
  
  // Overall status
  console.log('\n🔄 Integration Status:');
  console.log(`  AliExpress: ${results.aliexpress.auth ? '✅ Ready' : '⚠️ Requires Authentication'}`); 
  console.log(`  Paystack: ${results.paystack.transaction ? '✅ Ready' : '❌ Not Working'}`);

  return results;
}

// Run the tests
testAPIs().then(() => {
  console.log('\n🏁 API tests completed');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});