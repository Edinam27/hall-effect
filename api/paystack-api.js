// Paystack API Integration Module

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const PAYSTACK_API_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY; // Using the environment variable

/**
 * Initialize a transaction with Paystack
 */
exports.initializeTransaction = async (data) => {
  try {
    const { email, amount, reference, callbackUrl, metadata } = data;
    
    const response = await axios.post(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount * 100), // Convert to kobo/cents (Paystack uses the smallest currency unit)
        reference,
        callback_url: callbackUrl,
        metadata
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
    console.error('Paystack transaction initialization failed:', error.response?.data || error.message);
    throw error;
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