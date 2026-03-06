// Payment API Routes (Kora)

const express = require('express');
const router = express.Router();
const paymentApi = require('../api/kora-api');
const orderService = require('../services/order-service');

/**
 * @route   GET /api/payment/config
 * @desc    Get Payment public key for frontend
 * @access  Public
 */
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      publicKey: process.env.KORA_PUBLIC_KEY,
      provider: 'kora'
    });
  } catch (error) {
    console.error('Error getting Payment config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Payment configuration'
    });
  }
});

/**
 * @route   POST /api/payment/initialize
 * @desc    Initialize a transaction
 * @access  Public
 */
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, reference, callbackUrl, metadata, currency, customerName } = req.body;
    
    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and amount are required'
      });
    }
    
    const result = await paymentApi.initializeTransaction({
      email,
      amount,
      reference,
      callbackUrl,
      metadata,
      currency: process.env.PAYMENT_CURRENCY || 'NGN',
      customerName
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error initializing transaction:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment initialization failed'
    });
  }
});

/**
 * @route   GET /api/payment/verify/:reference
 * @desc    Verify a transaction
 * @access  Public
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    const result = await paymentApi.verifyTransaction(reference);
    
    res.json(result);
  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Payment verification failed'
    });
  }
});

/**
 * @route   POST /api/payment/webhook
 * @desc    Handle payment webhooks
 * @access  Public
 */
router.post('/webhook', paymentApi.handleWebhook);

module.exports = router;
