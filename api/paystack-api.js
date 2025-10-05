// Paystack API Integration Module

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // Using the environment variable

// Hardcoded list of supported currencies for Paystack
// Based on testing, only GHS is supported for this merchant account
const SUPPORTED_CURRENCIES = ['GHS']; 

// Export the supported currencies for use in other modules
exports.SUPPORTED_CURRENCIES = SUPPORTED_CURRENCIES;

/**
 * Initialize a transaction with Paystack
 */
exports.initializeTransaction = async (data) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      const err = new Error('PAYSTACK_SECRET_KEY is not configured');
      err.code = 'PAYSTACK_MISCONFIGURED';
      throw err;
    }
    const { email, amount, reference, callbackUrl, metadata, currency } = data;
    // Always enforce a currency, defaulting to NGN if not provided
    const txCurrency = (currency || process.env.PAYSTACK_CURRENCY || 'NGN').toUpperCase();

    const requestBody = {
      email,
      amount: Math.round(Number(amount) * 100), // smallest unit
      currency: txCurrency,
      reference,
      callback_url: callbackUrl,
      metadata
    };

    const config = {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      requestBody,
      config
    );

    return response.data;
  } catch (error) {
    console.error('Paystack transaction initialization failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    // Normalize error with message for upstream handlers
    const err = new Error(error.response?.data?.message || error.message || 'Paystack initialization error');
    err.response = error.response;
    throw err;
  }
};

/**
 * Get merchant profile from Paystack to detect supported currencies
 */
exports.getMerchant = async () => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      const err = new Error('PAYSTACK_SECRET_KEY is not configured');
      err.code = 'PAYSTACK_MISCONFIGURED';
      throw err;
    }
    const response = await axios.get(
      `${PAYSTACK_API_URL}/merchant`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Paystack get merchant failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    const err = new Error(error.response?.data?.message || error.message || 'Paystack merchant fetch error');
    err.response = error.response;
    throw err;
  }
};

/**
 * Verify a transaction with Paystack
 */
exports.verifyTransaction = async (reference) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Paystack transaction verification failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * List transactions from Paystack
 */
exports.listTransactions = async (params = {}) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_URL}/transaction`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Paystack list transactions failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Handle Paystack webhook events
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }
    
    // Process the event
    const event = req.body;
    
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;
        
      case 'transfer.success':
        // Handle successful transfer
        break;
        
      default:
        console.log(`Unhandled Paystack webhook event: ${event.event}`);
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
};

/**
 * Handle successful payment event
 */
async function handleSuccessfulPayment(paymentData) {
  try {
    // Extract order information from metadata
    const { orderId, items } = paymentData.metadata;
    
    // Get the order service
    const orderService = require('../services/order-service');
    
    // Update order status to paid
    await orderService.updateOrderStatus(orderId, 'paid');
    
    // Process the order with Temu
    await orderService.processTemuOrder(orderId);
    
    // Send confirmation email to customer
    const emailService = require('../services/email-service');
    await emailService.sendOrderConfirmation(orderId);
    
    console.log(`Successfully processed payment for order ${orderId}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

/**
 * Create a refund
 */
exports.createRefund = async (data) => {
  try {
    const { transaction, amount, currency, customerNote, merchantNote } = data;
    
    const response = await axios.post(
      `${PAYSTACK_API_URL}/refund`,
      {
        transaction,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to kobo/cents if provided
        currency,
        customer_note: customerNote,
        merchant_note: merchantNote
      },
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Paystack refund creation failed:', error.response?.data || error.message);
    throw error;
  }
};