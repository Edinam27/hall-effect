// Direct payment test that bypasses database
require('dotenv').config();
const paystackApi = require('../api/paystack-api');

async function testDirectPayment() {
  try {
    console.log('Testing direct payment with Paystack...');
    
    // Create a mock order
    const mockOrder = {
      id: 'mock-order-' + Date.now(),
      amount: 1000,
      customer: {
        email: 'test@example.com'
      }
    };
    
    console.log('Mock order created:', mockOrder);
    
    // Initialize payment directly with Paystack API
    console.log('Initializing payment with GHS currency...');
    const paymentData = {
      email: mockOrder.customer.email,
      amount: mockOrder.amount,
      currency: 'GHS',
      reference: `DIRECT-${mockOrder.id}`,
      metadata: {
        order_id: mockOrder.id
      }
    };
    
    const result = await paystackApi.initializeTransaction(paymentData);
    
    console.log('✅ Payment initialization successful!');
    console.log('Status:', result.status);
    console.log('Message:', result.message);
    console.log('Authorization URL:', result.data?.authorization_url);
    console.log('Reference:', result.data?.reference);
    
    return { success: true, paymentUrl: result.data?.authorization_url, reference: result.data?.reference };
  } catch (error) {
    console.error('❌ Payment initialization failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Run the test
testDirectPayment()
  .then(result => {
    if (result.success) {
      console.log('Test completed successfully');
    } else {
      console.error('Test failed:', result.error);
    }
  });