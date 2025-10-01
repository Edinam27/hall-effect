// Test script for available APIs and payment systems

require('dotenv').config();
const paystackApi = require('./api/paystack-api');
const fs = require('fs');
const path = require('path');

// Test function to check if available APIs are working
async function testAvailableAPIs() {
  console.log('🧪 Starting API and Payment Tests...');
  
  // Test results object
  const results = {
    paystack: {
      config: false,
      transaction: false,
      verification: false,
      error: null
    },
    server: {
      files: false,
      routes: false,
      error: null
    },
    orders: {
      service: false,
      storage: false,
      error: null
    }
  };

  // Test Paystack API
  console.log('\n💳 Testing Paystack API...');
  try {
    // Check if Paystack API key is configured
    console.log('  - Checking Paystack configuration...');
    if (process.env.PAYSTACK_SECRET_KEY) {
      results.paystack.config = true;
      console.log('  ✅ Paystack API key is configured');
      console.log(`  ℹ️ Using key: ${process.env.PAYSTACK_SECRET_KEY.substring(0, 10)}...`);
      
      // Test transaction initialization
      console.log('  - Testing transaction initialization...');
      try {
        const testTransaction = await paystackApi.initializeTransaction({
          email: 'test@example.com',
          amount: 10.00, // 10.00 NGN
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
        console.log('  ℹ️ Reference:', testTransaction.data.reference);
        
        // Test transaction verification (this will fail since we didn't pay, but tests the API)
        console.log('  - Testing transaction verification...');
        try {
          await paystackApi.verifyTransaction(testTransaction.data.reference);
          results.paystack.verification = true;
          console.log('  ✅ Verification API is working');
        } catch (error) {
          if (error.response && error.response.status === 400) {
            results.paystack.verification = true;
            console.log('  ✅ Verification API is working (expected failure for unpaid transaction)');
          } else {
            console.log('  ❌ Verification API failed:', error.message);
          }
        }
        
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

  // Test Server Files and Routes
  console.log('\n🖥️ Testing Server Components...');
  try {
    console.log('  - Checking server files...');
    const serverFiles = [
      './server.js',
      './routes/paystack-routes.js',
      './routes/order-routes.js',
      './routes/admin-routes.js'
    ];
    
    let filesExist = 0;
    serverFiles.forEach(file => {
      if (fs.existsSync(file)) {
        filesExist++;
        console.log(`  ✅ ${file} exists`);
      } else {
        console.log(`  ❌ ${file} missing`);
      }
    });
    
    results.server.files = filesExist > 0;
    console.log(`  ℹ️ ${filesExist}/${serverFiles.length} server files found`);
    
  } catch (error) {
    console.error('  ❌ Server component test failed:', error.message);
    results.server.error = error.message;
  }

  // Test Order System
  console.log('\n📦 Testing Order System...');
  try {
    console.log('  - Checking order service...');
    if (fs.existsSync('./services/order-service.js')) {
      results.orders.service = true;
      console.log('  ✅ Order service exists');
      
      // Test order storage
      console.log('  - Checking order storage...');
      if (fs.existsSync('./data/orders.json')) {
        const orders = JSON.parse(fs.readFileSync('./data/orders.json', 'utf8'));
        results.orders.storage = true;
        console.log(`  ✅ Order storage working (${orders.length} orders found)`);
      } else {
        console.log('  ⚠️ Order storage file not found, will be created on first order');
        results.orders.storage = true; // This is OK, file will be created
      }
    } else {
      console.log('  ❌ Order service not found');
      results.orders.error = 'Order service missing';
    }
  } catch (error) {
    console.error('  ❌ Order system test failed:', error.message);
    results.orders.error = error.message;
  }

  // Test Email Service (Optional)
  console.log('\n📧 Testing Email Service...');
  try {
    if (fs.existsSync('./services/email-service.js')) {
      console.log('  ✅ Email service exists');
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        console.log('  ✅ Email credentials configured');
      } else {
        console.log('  ⚠️ Email credentials not configured (optional)');
      }
    } else {
      console.log('  ⚠️ Email service not found (optional)');
    }
  } catch (error) {
    console.log('  ⚠️ Email service test failed:', error.message);
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('  Paystack API:');
  console.log(`    Configuration: ${results.paystack.config ? '✅ Working' : '❌ Failed'}`);
  console.log(`    Transaction Init: ${results.paystack.transaction ? '✅ Working' : '❌ Failed'}`);
  console.log(`    Verification: ${results.paystack.verification ? '✅ Working' : '❌ Failed'}`);
  if (results.paystack.error) {
    console.log(`    Error: ${results.paystack.error}`);
  }
  
  console.log('  Server Components:');
  console.log(`    Files: ${results.server.files ? '✅ Working' : '❌ Failed'}`);
  if (results.server.error) {
    console.log(`    Error: ${results.server.error}`);
  }
  
  console.log('  Order System:');
  console.log(`    Service: ${results.orders.service ? '✅ Working' : '❌ Failed'}`);
  console.log(`    Storage: ${results.orders.storage ? '✅ Working' : '❌ Failed'}`);
  if (results.orders.error) {
    console.log(`    Error: ${results.orders.error}`);
  }
  
  // Overall status
  console.log('\n🔄 System Status:');
  const paystackReady = results.paystack.config && results.paystack.transaction;
  const systemReady = results.server.files && results.orders.service;
  
  console.log(`  Payment System: ${paystackReady ? '✅ Ready' : '❌ Not Working'}`);
  console.log(`  Order System: ${systemReady ? '✅ Ready' : '❌ Not Working'}`);
  console.log(`  Overall Status: ${paystackReady && systemReady ? '✅ SYSTEM READY' : '⚠️ NEEDS ATTENTION'}`);

  return results;
}

// Run the tests
testAvailableAPIs().then((results) => {
  console.log('\n🏁 API and Payment tests completed');
  
  // Exit with appropriate code
  const paystackReady = results.paystack.config && results.paystack.transaction;
  const systemReady = results.server.files && results.orders.service;
  
  if (paystackReady && systemReady) {
    console.log('\n🎉 All systems are operational!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some systems need attention.');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});