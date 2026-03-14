/**
 * Comprehensive API and Payment Testing Script
 * Tests all available APIs and payment functionalities
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:8080';

// Test results tracking
const testResults = {
  health: false,
  kora_initialize: false,
  kora_verify: false,
  orders_get: false,
  orders_post: false,
  orders_get_by_id: false,
  admin_dashboard: false,
  admin_orders: false,
  errors: []
};

/**
 * Test Health Endpoint
 */
async function testHealthEndpoint() {
  console.log('🏥 Testing Health Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200 && response.data.status === 'OK') {
      testResults.health = true;
      console.log('  ✅ Health endpoint working');
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Health endpoint failed: ${error.message}`);
    testResults.errors.push({ test: 'health', error: error.message });
  }
  return false;
}

/**
 * Test Kora Payment Initialization
 */
async function testKoraInitialize() {
  console.log('\n💳 Testing Kora Payment Initialization...');
  try {
    const response = await axios.post(`${BASE_URL}/api/payment/initialize`, {
      email: 'test@example.com',
      amount: 5000
    });
    
    if (response.status === 200 && response.data.status && response.data.data.authorization_url) {
      testResults.kora_initialize = true;
      console.log('  ✅ Kora initialization working');
      console.log(`  ℹ️ Authorization URL: ${response.data.data.authorization_url}`);
      return response.data.data.reference;
    }
  } catch (error) {
    console.log(`  ❌ Kora initialization failed: ${error.message}`);
    testResults.errors.push({ test: 'kora_initialize', error: error.message });
  }
  return null;
}

/**
 * Test Kora Payment Verification
 */
async function testKoraVerify(reference) {
  console.log('\n🔍 Testing Kora Payment Verification...');
  try {
    const response = await axios.get(`${BASE_URL}/api/payment/verify/${reference}`);
    
    if (response.status === 200) {
      testResults.kora_verify = true;
      console.log('  ✅ Kora verification endpoint working');
      console.log(`  ℹ️ Status: ${response.data.data.status}`);
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Kora verification failed: ${error.message}`);
    testResults.errors.push({ test: 'kora_verify', error: error.message });
  }
  return false;
}

/**
 * Test Orders GET Endpoint
 */
async function testOrdersGet() {
  console.log('\n📋 Testing Orders GET Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/orders`);
    
    if (response.status === 200 && response.data.status === 'success') {
      testResults.orders_get = true;
      console.log('  ✅ Orders GET endpoint working');
      console.log(`  ℹ️ Found ${response.data.count} orders`);
      return response.data.orders;
    }
  } catch (error) {
    console.log(`  ❌ Orders GET failed: ${error.message}`);
    testResults.errors.push({ test: 'orders_get', error: error.message });
  }
  return [];
}

/**
 * Test Orders POST Endpoint
 */
async function testOrdersPost() {
  console.log('\n🛒 Testing Orders POST Endpoint...');
  try {
    const orderData = {
      customer: {
        fullName: 'API Test Customer',
        email: 'apitest@example.com',
        phone: '+1234567890',
        address: '123 API Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      items: [
        {
          productId: 'API-TEST-PROD-1',
          name: 'API Test Product',
          price: 75.99,
          quantity: 1
        }
      ],
      amount: 75.99
    };
    
    const response = await axios.post(`${BASE_URL}/api/orders`, orderData);
    
    if (response.status === 201 && response.data.success) {
      testResults.orders_post = true;
      console.log('  ✅ Orders POST endpoint working');
      console.log(`  ℹ️ Created order: ${response.data.order.orderNumber}`);
      return response.data.order;
    }
  } catch (error) {
    console.log(`  ❌ Orders POST failed: ${error.response?.data?.error || error.message}`);
    testResults.errors.push({ test: 'orders_post', error: error.response?.data?.error || error.message });
  }
  return null;
}

/**
 * Test Orders GET by ID Endpoint
 */
async function testOrdersGetById(orderId) {
  console.log('\n🔍 Testing Orders GET by ID Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/orders/${orderId}`);
    
    if (response.status === 200 && response.data.status === 'success') {
      testResults.orders_get_by_id = true;
      console.log('  ✅ Orders GET by ID endpoint working');
      console.log(`  ℹ️ Retrieved order: ${response.data.order.orderNumber}`);
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Orders GET by ID failed: ${error.message}`);
    testResults.errors.push({ test: 'orders_get_by_id', error: error.message });
  }
  return false;
}

/**
 * Test Admin Dashboard Endpoint
 */
async function testAdminDashboard() {
  console.log('\n📊 Testing Admin Dashboard Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
      headers: {
        'x-admin-key': 'admin123'
      }
    });
    
    if (response.status === 200) {
      testResults.admin_dashboard = true;
      console.log('  ✅ Admin dashboard endpoint working');
      console.log(`  ℹ️ Dashboard data retrieved successfully`);
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Admin dashboard failed: ${error.message}`);
    testResults.errors.push({ test: 'admin_dashboard', error: error.message });
  }
  return false;
}

/**
 * Test Admin Orders Endpoint
 */
async function testAdminOrders() {
  console.log('\n📋 Testing Admin Orders Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/orders`, {
      headers: {
        'x-admin-key': 'admin123'
      }
    });
    
    if (response.status === 200) {
      testResults.admin_orders = true;
      console.log('  ✅ Admin orders endpoint working');
      console.log(`  ℹ️ Admin orders data retrieved successfully`);
      return true;
    }
  } catch (error) {
    console.log(`  ❌ Admin orders failed: ${error.message}`);
    testResults.errors.push({ test: 'admin_orders', error: error.message });
  }
  return false;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Starting Comprehensive API and Payment Tests...\n');
  
  // Test health endpoint first
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('\n❌ Server health check failed. Stopping tests.');
    return;
  }
  
  // Test Kora Payment APIs
  const paymentRef = await testKoraInitialize();
  if (paymentRef) {
    await testKoraVerify(paymentRef);
  } else {
    console.log('  ⚠️ Skipping verification due to initialization failure');
  }
  
  // Test Orders APIs
  const orders = await testOrdersGet();
  const newOrder = await testOrdersPost();
  
  if (newOrder) {
    await testOrdersGetById(newOrder.id);
  } else if (orders.length > 0) {
    await testOrdersGetById(orders[0].id);
  }
  
  // Test Admin APIs
  await testAdminDashboard();
  await testAdminOrders();
  
  // Print summary
  printTestSummary();
}

/**
 * Print test summary
 */
function printTestSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📋 API and Payment Test Summary');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Health Endpoint', result: testResults.health },
    { name: 'Paystack Initialize', result: testResults.paystack_initialize },
    { name: 'Paystack Verify', result: testResults.paystack_verify },
    { name: 'Orders GET', result: testResults.orders_get },
    { name: 'Orders POST', result: testResults.orders_post },
    { name: 'Orders GET by ID', result: testResults.orders_get_by_id },
    { name: 'Admin Dashboard', result: testResults.admin_dashboard },
    { name: 'Admin Orders', result: testResults.admin_orders }
  ];
  
  let passedTests = 0;
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${test.name}: ${status}`);
    if (test.result) passedTests++;
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`📊 Results: ${passedTests}/${tests.length} tests passed`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  const overallStatus = passedTests === tests.length ? '🎉 ALL SYSTEMS OPERATIONAL' : 
                       passedTests >= tests.length * 0.7 ? '⚠️ MOSTLY OPERATIONAL' : 
                       '🚨 SYSTEM ISSUES DETECTED';
  
  console.log(`\n🔄 Overall Status: ${overallStatus}`);
  console.log('='.repeat(50));
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };
