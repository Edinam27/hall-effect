// API Testing Script for Hall Effect Next.js Application
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🚀 Starting API Tests...\n');

  // Test 1: Register a new user
  console.log('1. Testing User Registration...');
  try {
    const registerResponse = await fetch(${BASE_URL}/api/auth/register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890'
      }),
    });

    const registerData = await registerResponse.json();
    console.log('✅ Register Response:', registerData);
  } catch (error) {
    console.log('❌ Register Error:', error.message);
  }

  // Test 2: Login
  console.log('\n2. Testing User Login...');
  try {
    const loginResponse = await fetch(${BASE_URL}/api/auth/login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login Response:', loginData);
  } catch (error) {
    console.log('❌ Login Error:', error.message);
  }

  console.log('\n🏁 API Tests Completed!');
}

// Run the tests
testAPI().catch(console.error);
