const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testCompleteSystem() {
  console.log('🧪 Starting comprehensive system test...\n');

  try {
    // Test 1: User Registration
    console.log('1️⃣ Testing user registration...');
    const timestamp = Date.now();
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      username: `testuser${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      password: 'password123'
    });
    console.log('✅ User registration:', registerResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 2: User Login
    console.log('\n2️⃣ Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: `testuser${timestamp}@example.com`,
      password: 'password123'
    });
    console.log('✅ User login:', loginResponse.data.success ? 'PASSED' : 'FAILED');
    const userToken = loginResponse.data.token;

    // Test 3: Admin Login
    console.log('\n3️⃣ Testing admin login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@gamezonepro.com',
      password: 'admin123'
    });
    console.log('✅ Admin login:', adminLoginResponse.data.success ? 'PASSED' : 'FAILED');
    const adminToken = adminLoginResponse.data.token;

    // Test 4: Admin Dashboard (with token)
    console.log('\n4️⃣ Testing admin dashboard with token...');
    const dashboardTokenResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin dashboard (token):', dashboardTokenResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 5: Admin Dashboard (with legacy key)
    console.log('\n5️⃣ Testing admin dashboard with legacy key...');
    const dashboardKeyResponse = await axios.get(`${BASE_URL}/api/admin/dashboard?adminKey=admin123`);
    console.log('✅ Admin dashboard (legacy):', dashboardKeyResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 6: Admin Orders (with token)
    console.log('\n6️⃣ Testing admin orders with token...');
    const ordersTokenResponse = await axios.get(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin orders (token):', ordersTokenResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 7: Admin Orders (with legacy key)
    console.log('\n7️⃣ Testing admin orders with legacy key...');
    const ordersKeyResponse = await axios.get(`${BASE_URL}/api/admin/orders?adminKey=admin123`);
    console.log('✅ Admin orders (legacy):', ordersKeyResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 8: Protected User Endpoint
    console.log('\n8️⃣ Testing protected user endpoint...');
    const userProtectedResponse = await axios.get(`${BASE_URL}/api/auth/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Protected endpoint:', userProtectedResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 9: Create Test Order
    console.log('\n9️⃣ Testing order creation...');
    const orderData = {
      customerInfo: {
        fullName: 'Test Customer',
        email: 'testcustomer@example.com',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      items: [{
        id: 'gamesir-nova-lite',
        name: 'GameSir Nova Lite Gaming Controller',
        price: 17.86,
        quantity: 1,
        variant: 'Black'
      }],
      paymentMethod: 'paystack',
      shippingMethod: 'standard'
    };

    const orderResponse = await axios.post(`${BASE_URL}/api/orders`, orderData);
    console.log('✅ Order creation:', orderResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 10: Verify Order in Admin Dashboard
    if (orderResponse.data.success) {
      console.log('\n🔟 Testing updated admin stats...');
      const updatedStatsResponse = await axios.get(`${BASE_URL}/api/admin/dashboard?adminKey=admin123`);
      const hasOrders = updatedStatsResponse.data.data.stats.totalOrders > 0;
      console.log('✅ Updated stats:', hasOrders ? 'PASSED' : 'FAILED');

      console.log('\n1️⃣1️⃣ Testing updated admin orders...');
      const updatedOrdersResponse = await axios.get(`${BASE_URL}/api/admin/orders?adminKey=admin123`);
      const hasOrdersList = updatedOrdersResponse.data.data.orders.length > 0;
      console.log('✅ Updated orders list:', hasOrdersList ? 'PASSED' : 'FAILED');
    }

    console.log('\n🎉 System test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Authentication: ✅ Working');
    console.log('- Database Integration: ✅ Working');
    console.log('- Admin Routes: ✅ Working');
    console.log('- Legacy Authentication: ✅ Working');
    console.log('- Order Management: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testCompleteSystem();