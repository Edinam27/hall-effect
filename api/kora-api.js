// Kora API Integration Module

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const KORA_API_URL = 'https://api.korapay.com/merchant/api/v1';
const KORA_SECRET_KEY = process.env.KORA_SECRET_KEY;
const KORA_PUBLIC_KEY = process.env.KORA_PUBLIC_KEY;

/**
 * Initialize a transaction with Kora
 */
exports.initializeTransaction = async (data) => {
  try {
    if (!KORA_SECRET_KEY) {
      // Fallback for demo/test if key not present, or throw error
      console.warn('KORA_SECRET_KEY is not configured');
    }
    
    const { email, amount, reference, callbackUrl, metadata, currency, customerName } = data;
    const txCurrency = (currency || process.env.PAYMENT_CURRENCY || 'NGN').toUpperCase();

    // Kora expects amount in standard units (e.g., 100.00 for 100 NGN), not minor units (kobo)
    // based on typical Kora usage.
    
    const requestBody = {
      reference,
      customer: {
        email,
        name: customerName || email // Fallback if name not provided
      },
      amount: Number(amount), 
      currency: txCurrency,
      redirect_url: callbackUrl,
      notification_url: callbackUrl, // Using callback as webhook for simplicity in this context, or separate if needed
      metadata
    };

    const config = {
      headers: {
        'Authorization': `Bearer ${KORA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(
      `${KORA_API_URL}/charges/initialize`,
      requestBody,
      config
    );

    // Normalize response to match expected format for frontend
    // Kora returns { status: true, data: { checkout_url: '...' } }
    if (response.data.status && response.data.data.checkout_url) {
        return {
            status: true,
            message: 'Authorization URL created',
            data: {
                authorization_url: response.data.data.checkout_url,
                access_code: response.data.data.reference, // Use reference as access code equivalent
                reference: response.data.data.reference
            }
        };
    }
    
    return response.data;
  } catch (error) {
    console.error('Kora transaction initialization failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    const err = new Error(error.response?.data?.message || error.message || 'Kora initialization error');
    err.response = error.response;
    throw err;
  }
};

/**
 * Verify a transaction with Kora
 */
exports.verifyTransaction = async (reference) => {
  try {
    const response = await axios.get(
      `${KORA_API_URL}/charges/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${KORA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Normalize Kora response to look like Paystack for compatibility if needed
    // Kora: { status: true, data: { status: 'success', amount: 100, ... } }
    // Paystack: { status: true, data: { status: 'success', amount: 10000 (kobo), ... } }
    
    if (response.data.status && response.data.data) {
        const data = response.data.data;
        // Ensure status matches 'success'
        if (data.status === 'success') {
            return {
                status: true,
                message: 'Verification successful',
                data: {
                    status: 'success',
                    reference: data.reference,
                    amount: Math.round(data.amount * 100), // Convert to minor units for compatibility
                    currency: data.currency,
                    metadata: data.metadata,
                    customer: data.customer
                }
            };
        }
    }

    return response.data;
  } catch (error) {
    console.error('Kora transaction verification failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * List transactions from Kora
 */
exports.listTransactions = async (params = {}) => {
  try {
    const { page, perPage, status } = params;
    
    const response = await axios.get(
      `${KORA_API_URL}/charges`,
      {
        params: {
            page: page || 1,
            limit: perPage || 20,
            status: status
        },
        headers: {
          'Authorization': `Bearer ${KORA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Normalize response
    // Kora returns { status: true, data: { charges: [...], pagination: {...} } } or similar
    // We want to return { status: true, data: [...] } or { data: [...] }
    
    if (response.data.status && response.data.data) {
        // Depending on API version, it might be data.charges or data directly array
        // Assuming standard pagination response
        const charges = Array.isArray(response.data.data) ? response.data.data : (response.data.data.charges || []);
        
        // Map charges to match Paystack format if needed (amount * 100)
        const mappedCharges = charges.map(c => ({
            ...c,
            amount: c.amount * 100 // Convert to minor units
        }));

        return {
            status: true,
            message: 'Transactions retrieved',
            data: mappedCharges,
            meta: response.data.data.pagination // If available
        };
    }
    
    return response.data;
  } catch (error) {
    console.error('Kora list transactions failed:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Handle Kora webhook events
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-korapay-signature'];
    
    if (!signature) {
        return res.status(401).json({ status: 'error', message: 'No signature provided' });
    }

    const hash = crypto
      .createHmac('sha256', KORA_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== signature) {
      return res.status(401).json({ status: 'error', message: 'Invalid signature' });
    }
    
    // Process the event
    const event = req.body;
    // Kora events: charge.success
    
    if (event.event === 'charge.success') {
        await handleSuccessfulPayment(event.data);
    }
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Kora webhook:', error);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
};

/**
 * Handle successful payment event
 */
async function handleSuccessfulPayment(paymentData) {
  try {
    // Extract order information from metadata
    const { orderId } = paymentData.metadata || {};
    
    if (!orderId) {
        console.warn('No orderId in payment metadata');
        return;
    }

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
