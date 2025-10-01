# Testing Guide

This document provides instructions on how to run the test scripts for the e-commerce application.

## Running All Tests

To run all tests in sequence, use the comprehensive test runner:

```bash
node run-tests.js
```

Or use the npm script:

```bash
npm test
```

This will run all test scripts in sequence and provide a summary of results at the end.

## Available Individual Test Scripts

### 1. API Tests (`test-api.js`)

Tests the AliExpress and Paystack API integrations.

```bash
node test-api.js
```

**What it tests:**
- AliExpress API configuration and authentication status
- AliExpress product details API functionality
- Paystack API configuration
- Paystack transaction initialization

**Notes:**
- AliExpress authentication requires manual authorization via the provided URL
- Paystack tests use the test mode

### 2. Email Service Tests (`test-email.js`)

Tests the email notification service functionality.

```bash
node test-email.js
```

**What it tests:**
- Email template availability
- Order confirmation email functionality
- Shipping confirmation email functionality
- Delivery confirmation email functionality

**Optional environment variables:**
- `TEST_EMAIL`: Set this to your email address to test actual email sending

```bash
TEST_EMAIL=your@email.com node test-email.js
```

### 3. Order Service Tests (`test-order.js`)

Tests the order processing functionality.

```bash
node test-order.js
```

**What it tests:**
- Order creation
- Order retrieval by ID
- Order status updates
- Order listing (all, by status, by customer)
- Order tracking updates
- Order delivery marking

## Test Results Interpretation

The test scripts use the following symbols to indicate test results:

- ✅ **Passed**: The test completed successfully
- ⚠️ **Partial**: The test completed with some limitations (e.g., email sending failed due to missing credentials)
- ❌ **Failed**: The test failed

## Troubleshooting

### Email Tests

If email tests show "Not Found (using fallback)" for templates, this is normal if you haven't created custom email templates. The system will use built-in fallback templates.

To test actual email sending, set the `TEST_EMAIL` environment variable to a valid email address.

### API Tests

If AliExpress API tests show "Not Authenticated", you need to authorize the application by visiting the provided URL. This is a normal part of the OAuth flow.

Paystack API tests should work in test mode without additional configuration.

### Order Tests

If order tracking or delivery marking tests show "Partial (email sending failed)", this is expected in a test environment without email credentials configured.

## Adding New Tests

When adding new functionality to the application, consider adding corresponding test cases to the appropriate test script.