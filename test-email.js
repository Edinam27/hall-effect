/**
 * Email Service Test Script
 * 
 * This script tests the email service functionality for order notifications.
 * It verifies that the email templates are loaded correctly and that emails can be sent.
 */

const fs = require('fs');
const path = require('path');
const emailService = require('./services/email-service');

// Mock order data for testing
const mockOrder = {
  orderId: 'TEST-' + Date.now(),
  customer: {
    email: process.env.TEST_EMAIL || 'test@example.com',
    name: 'Test Customer'
  },
  items: [
    {
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'https://via.placeholder.com/150'
    }
  ],
  total: 99.99,
  shippingAddress: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zip: '12345',
    country: 'Test Country'
  },
  trackingInfo: {
    carrier: 'Test Carrier',
    trackingNumber: 'TEST123456789',
    trackingUrl: 'https://example.com/track/TEST123456789'
  },
  status: 'processing',
  createdAt: new Date().toISOString()
};

// Results tracking
const results = {
  templateCheck: {
    orderConfirmation: false,
    shippingConfirmation: false,
    deliveryConfirmation: false
  },
  emailSend: {
    orderConfirmation: false,
    shippingConfirmation: false,
    deliveryConfirmation: false
  },
  errors: []
};

/**
 * Check if email templates exist
 */
async function checkTemplates() {
  console.log('🔍 Checking email templates...');
  
  const templatesDir = path.join(__dirname, 'templates', 'emails');
  const templateFiles = {
    orderConfirmation: 'order-confirmation.hbs',
    shippingConfirmation: 'shipping-confirmation.hbs',
    deliveryConfirmation: 'delivery-confirmation.hbs'
  };
  
  // Check if templates directory exists
  if (!fs.existsSync(templatesDir)) {
    console.log(`  ⚠️ Templates directory not found: ${templatesDir}`);
    console.log('  ℹ️ The email service will use fallback inline templates');
    return;
  }
  
  // Check each template file
  for (const [key, filename] of Object.entries(templateFiles)) {
    const templatePath = path.join(templatesDir, filename);
    if (fs.existsSync(templatePath)) {
      console.log(`  ✅ ${key} template found`);
      results.templateCheck[key] = true;
    } else {
      console.log(`  ⚠️ ${key} template not found: ${templatePath}`);
      console.log('  ℹ️ The email service will use fallback inline template');
    }
  }
}

/**
 * Test sending order confirmation email
 */
async function testOrderConfirmation() {
  console.log('\n📧 Testing order confirmation email...');
  try {
    // Only send actual email if TEST_EMAIL is set
    if (process.env.TEST_EMAIL) {
      await emailService.sendOrderConfirmation(mockOrder);
      results.emailSend.orderConfirmation = true;
      console.log(`  ✅ Order confirmation email sent to ${process.env.TEST_EMAIL}`);
    } else {
      console.log('  ℹ️ Skipping actual email send (TEST_EMAIL not set)');
      console.log('  ℹ️ To test email sending, set TEST_EMAIL environment variable');
      // Check if the function exists and is callable
      if (typeof emailService.sendOrderConfirmation === 'function') {
        console.log('  ✅ sendOrderConfirmation function is available');
        results.emailSend.orderConfirmation = 'function-exists';
      }
    }
  } catch (error) {
    console.log(`  ❌ Failed to send order confirmation email: ${error.message}`);
    results.errors.push({ type: 'orderConfirmation', message: error.message });
  }
}

/**
 * Test sending shipping confirmation email
 */
async function testShippingConfirmation() {
  console.log('\n📧 Testing shipping confirmation email...');
  try {
    // Only send actual email if TEST_EMAIL is set
    if (process.env.TEST_EMAIL) {
      await emailService.sendShippingConfirmation(mockOrder);
      results.emailSend.shippingConfirmation = true;
      console.log(`  ✅ Shipping confirmation email sent to ${process.env.TEST_EMAIL}`);
    } else {
      console.log('  ℹ️ Skipping actual email send (TEST_EMAIL not set)');
      console.log('  ℹ️ To test email sending, set TEST_EMAIL environment variable');
      // Check if the function exists and is callable
      if (typeof emailService.sendShippingConfirmation === 'function') {
        console.log('  ✅ sendShippingConfirmation function is available');
        results.emailSend.shippingConfirmation = 'function-exists';
      }
    }
  } catch (error) {
    console.log(`  ❌ Failed to send shipping confirmation email: ${error.message}`);
    results.errors.push({ type: 'shippingConfirmation', message: error.message });
  }
}

/**
 * Test sending delivery confirmation email
 */
async function testDeliveryConfirmation() {
  console.log('\n📧 Testing delivery confirmation email...');
  try {
    // Update order status for delivery confirmation
    const deliveredOrder = { ...mockOrder, status: 'delivered' };
    
    // Only send actual email if TEST_EMAIL is set
    if (process.env.TEST_EMAIL) {
      await emailService.sendDeliveryConfirmation(deliveredOrder);
      results.emailSend.deliveryConfirmation = true;
      console.log(`  ✅ Delivery confirmation email sent to ${process.env.TEST_EMAIL}`);
    } else {
      console.log('  ℹ️ Skipping actual email send (TEST_EMAIL not set)');
      console.log('  ℹ️ To test email sending, set TEST_EMAIL environment variable');
      // Check if the function exists and is callable
      if (typeof emailService.sendDeliveryConfirmation === 'function') {
        console.log('  ✅ sendDeliveryConfirmation function is available');
        results.emailSend.deliveryConfirmation = 'function-exists';
      }
    }
  } catch (error) {
    console.log(`  ❌ Failed to send delivery confirmation email: ${error.message}`);
    results.errors.push({ type: 'deliveryConfirmation', message: error.message });
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n📋 Email Service Test Summary:');
  
  // Template check results
  console.log('  Email Templates:');
  for (const [key, value] of Object.entries(results.templateCheck)) {
    console.log(`    ${key}: ${value ? '✅ Found' : '⚠️ Not Found (using fallback)'}`);
  }
  
  // Email send results
  console.log('  Email Sending:');
  for (const [key, value] of Object.entries(results.emailSend)) {
    if (value === true) {
      console.log(`    ${key}: ✅ Email Sent`);
    } else if (value === 'function-exists') {
      console.log(`    ${key}: ✅ Function Available (not tested)`);
    } else {
      console.log(`    ${key}: ❌ Failed`);
    }
  }
  
  // Errors
  if (results.errors.length > 0) {
    console.log('  Errors:');
    results.errors.forEach((error, index) => {
      console.log(`    ${index + 1}. ${error.type}: ${error.message}`);
    });
  }
  
  // Overall status
  const allFunctionsExist = Object.values(results.emailSend).every(value => 
    value === true || value === 'function-exists'
  );
  
  console.log('\n🔄 Email Service Status:');
  console.log(`  Overall: ${allFunctionsExist ? '✅ Ready' : '❌ Issues Detected'}`);
  
  if (!process.env.TEST_EMAIL) {
    console.log('\n⚠️ Note: Set TEST_EMAIL environment variable to test actual email sending');
    console.log('  Example: TEST_EMAIL=your@email.com node test-email.js');
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Email Service tests...\n');
  
  try {
    await checkTemplates();
    await testOrderConfirmation();
    await testShippingConfirmation();
    await testDeliveryConfirmation();
    printSummary();
    
    console.log('\n🏁 Email Service tests completed');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runTests();