// Payment Routes
// Handles payment initialization and processing

const express = require('express');
const axios = require('axios');
const router = express.Router();
const orderService = require('../services/order-service');
const paystackApi = require('../api/paystack-api');

/**
 * @route   POST /api/payment/initialize/:orderId
 * @desc    Initialize payment for a specific order
 * @access  Public
 */
router.post('/initialize/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { email, customerId } = req.body;
    
    console.log('Payment initialization request:', {
      orderId: orderId,
      orderIdType: typeof orderId,
      email: email,
      customerId: customerId,
      fullUrl: req.originalUrl,
      params: req.params
    });
    
    // Get the order
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Generate a unique reference
    const reference = `GZP-PAY-${Date.now()}-${String(orderId).slice(-8)}`;
    
    // Build currency candidates with sensible defaults and overrides
    const requestedCurrency = (req.body?.currency || '').toString().trim().toUpperCase();
    const envCurrency = (process.env.PAYSTACK_CURRENCY || '').toString().trim().toUpperCase();
    
    // Use hardcoded supported currencies from paystack-api.js
    let currencyCandidates = Array.from(new Set([
      requestedCurrency,
      envCurrency,
      ...paystackApi.SUPPORTED_CURRENCIES // Use the hardcoded list of supported currencies
    ].filter(Boolean)));
    
    console.log('Currency candidates for initialization:', currencyCandidates);

    let baseUsdAmount = Number(order.total_amount);
    let targetCurrency = 'GHS'; // Force GHS as it's the only supported currency
    let gatewayAmount = baseUsdAmount;

    // Validate amount
    if (!Number.isFinite(gatewayAmount) || gatewayAmount <= 0) {
      console.warn('Invalid order amount for payment initialization:', { orderId, total_amount: order.total_amount });
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount'
      });
    }

    async function convertUsdTo(target) {
      if (target === 'USD') return baseUsdAmount;
      try {
        const envKey = `PAYSTACK_USD_TO_${target}_RATE`;
        const envRate = Number(process.env[envKey] || process.env.PAYSTACK_EXCHANGE_RATE);
        let rate = envRate && envRate > 0 ? envRate : null;
        if (!rate) {
          const resp = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
          rate = resp.data?.rates?.[target];
        }
        if (rate && rate > 0) {
          return Math.round(baseUsdAmount * rate * 100) / 100;
        } else {
          console.warn(`No exchange rate for USD->${target}; using USD amount without conversion`);
          return baseUsdAmount;
        }
      } catch (convErr) {
        console.warn('Exchange rate lookup failed; using USD amount:', convErr.message);
        return baseUsdAmount;
      }
    }

    // Determine effective email
    const effectiveEmail = email || (order.customer_info?.email);
    if (!effectiveEmail) {
      console.warn('Missing customer email for payment initialization:', { orderId });
      return res.status(400).json({
        success: false,
        message: 'Customer email is required for payment initialization'
      });
    }

    // Try initializing with currency fallbacks
    let initResult = null;
    let lastError = null;
    for (const curr of currencyCandidates) {
      targetCurrency = curr;
      gatewayAmount = await convertUsdTo(curr);
      const paymentData = {
        email: effectiveEmail,
        amount: gatewayAmount,
        currency: targetCurrency,
        reference,
        callbackUrl: `${req.protocol}://${req.get('host')}/payment/callback`,
        metadata: {
          orderId: order.id,
          orderNumber: order.order_number,
          customerId: customerId || (order.customer_info?.email),
          items: (Array.isArray(order.items) ? order.items : []).map(item => ({
            id: item.productId || item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      };

      console.log('Attempting payment initialization:', {
        currency: targetCurrency,
        amount: paymentData.amount,
        email: paymentData.email,
        reference
      });
      try {
        const result = await paystackApi.initializeTransaction(paymentData);
        initResult = { result, paymentData };
        break;
      } catch (err) {
        lastError = err;
        const code = err.response?.data?.code || err.response?.data?.error?.code;
        const message = err.response?.data?.message || err.message;
        console.warn(`Initialization failed for ${curr}: ${message} (${code || 'no_code'})`);
        if (code !== 'unsupported_currency') {
          // For non-currency errors, stop trying
          break;
        }
      }
    }

    if (!initResult) {
      throw lastError || new Error('Failed to initialize payment with available currencies');
    }

    const { result, paymentData } = initResult;
    
    if (result.status && result.data) {
      // Persist order payment initialization
      await orderService.updateOrderStatus(orderId, {
        status: order.status,
        payment_status: 'initialized',
        payment_reference: reference
      });
      
      console.log('Payment initialized successfully:', {
        reference,
        authorizationUrl: result.data.authorization_url,
        currency: paymentData.currency,
        amount: paymentData.amount
      });
      
      res.json({
        success: true,
        paymentUrl: result.data.authorization_url,
        reference: reference,
        orderId: order.id,
        amount: paymentData.amount,
        currency: paymentData.currency
      });
    } else {
      throw new Error('Failed to initialize payment with Paystack');
    }
    
  } catch (error) {
    console.error('Error initializing payment:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    const paystackMessage = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: paystackMessage,
      details: error.response?.data
    });
  }
});

module.exports = router;