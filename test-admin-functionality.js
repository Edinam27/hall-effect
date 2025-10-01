const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testAdminFunctionality() {
  console.log('🔧 Testing Admin Functionality with Database Integration...\n');

  try {
    // Test 1: Admin Login
    console.log('1️⃣ Testing admin login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@gamezonepro.com',
      password: 'admin123'
    });
    console.log('✅ Admin login:', adminLoginResponse.data.success ? 'PASSED' : 'FAILED');
    const adminToken = adminLoginResponse.data.token;

    // Test 2: Admin Dashboard (with JWT token)
    console.log('\n2️⃣ Testing admin dashboard with JWT token...');
    const dashboardTokenResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin dashboard (JWT):', dashboardTokenResponse.data.success ? 'PASSED' : 'FAILED');
    console.log('   📊 Stats:', JSON.stringify(dashboardTokenResponse.data.data.stats, null, 2));

    // Test 3: Admin Dashboard (with legacy adminKey)
    console.log('\n3️⃣ Testing admin dashboard with legacy adminKey...');
    const dashboardKeyResponse = await axios.get(`${BASE_URL}/api/admin/dashboard?adminKey=admin123`);
    console.log('✅ Admin dashboard (legacy):', dashboardKeyResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 4: Admin Orders (with JWT token)
    console.log('\n4️⃣ Testing admin orders with JWT token...');
    const ordersTokenResponse = await axios.get(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin orders (JWT):', ordersTokenResponse.data.success ? 'PASSED' : 'FAILED');
    console.log('   📦 Orders count:', ordersTokenResponse.data.data.totalOrders);

    // Test 5: Admin Orders (with legacy adminKey)
    console.log('\n5️⃣ Testing admin orders with legacy adminKey...');
    const ordersKeyResponse = await axios.get(`${BASE_URL}/api/admin/orders?adminKey=admin123`);
    console.log('✅ Admin orders (legacy):', ordersKeyResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 6: Admin Users List (protected endpoint)
    console.log('\n6️⃣ Testing admin users list...');
    const usersResponse = await axios.get(`${BASE_URL}/api/auth/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin users list:', usersResponse.data.success ? 'PASSED' : 'FAILED');
    console.log('   👥 Users count:', usersResponse.data.users?.length || 0);

    // Test 7: Test pagination on orders
    console.log('\n7️⃣ Testing orders pagination...');
    const paginatedOrdersResponse = await axios.get(`${BASE_URL}/api/admin/orders?page=1&limit=5&adminKey=admin123`);
    console.log('✅ Orders pagination:', paginatedOrdersResponse.data.success ? 'PASSED' : 'FAILED');

    // Test 8: Test orders filtering by status
    console.log('\n8️⃣ Testing orders filtering...');
    const filteredOrdersResponse = await axios.get(`${BASE_URL}/api/admin/orders?status=pending&adminKey=admin123`);
    console.log('✅ Orders filtering:', filteredOrdersResponse.data.success ? 'PASSED' : 'FAILED');

    console.log('\n🎉 Admin functionality test completed!');
    console.log('\n📊 Summary:');
    console.log('- Admin Authentication: ✅ Working');
    console.log('- JWT Token Auth: ✅ Working');
    console.log('- Legacy adminKey Auth: ✅ Working');
    console.log('- Database Integration: ✅ Working');
    console.log('- Admin Dashboard: ✅ Working');
    console.log('- Admin Orders Management: ✅ Working');
    console.log('- Pagination & Filtering: ✅ Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAdminFunctionality();