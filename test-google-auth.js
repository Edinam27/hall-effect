// Test Google Authentication Flow
// This script tests the Google OAuth integration

require('dotenv').config();

const BASE_URL = 'http://localhost:8080';

async function testGoogleAuthEndpoint() {
    console.log('🧪 Testing Google Authentication Endpoint...\n');

    try {
        // Test 1: Check if the Google auth endpoint exists
        console.log('1. Testing Google auth endpoint availability...');
        const response = await fetch(`${BASE_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();
        
        if (response.status === 400 && data.error === 'Google ID token is required') {
            console.log('✅ Google auth endpoint is working correctly');
            console.log('   - Endpoint responds to POST requests');
            console.log('   - Properly validates required parameters\n');
        } else {
            console.log('❌ Unexpected response from Google auth endpoint');
            console.log('   Response:', data);
            return false;
        }

        // Test 2: Check environment variables
        console.log('2. Checking environment variables...');
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (clientId && clientSecret) {
            console.log('✅ Google OAuth credentials are configured');
            console.log(`   - Client ID: ${clientId.substring(0, 20)}...`);
            console.log(`   - Client Secret: ${clientSecret.substring(0, 10)}...\n`);
        } else {
            console.log('❌ Google OAuth credentials are missing');
            console.log(`   - Client ID: ${clientId ? 'Set' : 'Missing'}`);
            console.log(`   - Client Secret: ${clientSecret ? 'Set' : 'Missing'}\n`);
            return false;
        }

        // Test 3: Check if server can handle auth requests
        console.log('3. Testing server authentication handling...');
        const authTestResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid-token'
            }
        });

        if (authTestResponse.status === 403) {
            console.log('✅ Authentication verification is working');
            console.log('   - Server properly validates tokens');
            console.log('   - Returns appropriate error codes\n');
        } else {
            console.log('❌ Authentication verification may have issues');
            return false;
        }

        console.log('🎉 All Google Authentication tests passed!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Google auth endpoint is accessible');
        console.log('   ✅ Environment variables are configured');
        console.log('   ✅ Server authentication handling works');
        console.log('\n🚀 Ready for Google Sign-In testing!');
        console.log('\nNext steps:');
        console.log('   1. Open http://localhost:3000 in your browser');
        console.log('   2. Click the "Sign in with Google" button');
        console.log('   3. Complete the Google OAuth flow');
        console.log('   4. Verify user profile appears in the navbar');

        return true;

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testGoogleAuthEndpoint()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testGoogleAuthEndpoint };