// Paystack API Routes

const express = require('express');
const router = express.Router();
const paystackApi = require('../api/paystack-api');
const orderService = require('../services/order-service');

/**
 * @route   GET /api/paystack/config
 * @desc    Get Paystack public key for frontend
 * @access  Public
 */
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY
    });
  } catch (error) {
    console.error('Error getting Paystack config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Paystack configuration'
    });
  }
});

/**
 * @route   POST /api/paystack/initialize
 * @desc    Initialize a transaction with Paystack
 * @access  Public
 */
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, reference, callbackUrl, metadata } = req.body;
    
    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and amount are required'
      });
    }
    
    const result = await paystackApi.initializeTransaction({
      email,
      amount,
      reference,
      callbackUrl,
      metadata
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/paystack/verify/:reference
 * @desc    Verify a transaction with Paystack
 * @access  Public
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await paystackApi.verifyTransaction(reference);
    
    // If payment is successful, update order status
    if (result.data.status === 'success' && result.data.metadata && result.data.metadata.orderId) {
      await orderService.updateOrderStatus(result.data.metadata.orderId, 'paid');
      
      // Process the order with AliExpress
      await orderService.processAliExpressOrder(result.data.metadata.orderId);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/paystack/verify/:reference
 * @desc    Verify a transaction with enhanced customer data handling
 * @access  Public
 */
router.post('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    console.log('Verifying payment with enhanced data:', { reference });
    
    // Use the order service's verifyPayment function
    const result = await orderService.verifyPayment(reference);
    
    if (result.success && result.order) {
      const order = result.order;
      
      // Return enhanced response with order information
      res.json({
        success: true,
        status: 'success',
        message: 'Payment verified successfully',
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId || order.customer?.customerId,
        customerEmail: order.customer?.email || order.customerInfo?.email,
        total: order.total,
        aliExpressStatus: order.aliexpressStatus || 'pending'
      });
    } else {
      res.json({
        success: false,
        status: 'failed',
        message: result.message || 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying Paystack transaction with enhanced data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/paystack/process-order
 * @desc    Process an order with Paystack
 * @access  Public
 */
router.post('/process-order', async (req, res) => {
  try {
    const { orderId, email } = req.body;
    
    // Validate required fields
    if (!orderId || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID and email are required'
      });
    }
    
    const result = await orderService.processPayment(orderId, email);
    res.json(result);
  } catch (error) {
    console.error('Error processing order with Paystack:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/paystack/refund
 * @desc    Create a refund with Paystack
 * @access  Private
 */
router.post('/refund', async (req, res) => {
  try {
    const { transaction, amount, currency, customerNote, merchantNote } = req.body;
    
    // Validate required fields
    if (!transaction) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction ID is required'
      });
    }
    
    const result = await paystackApi.createRefund({
      transaction,
      amount,
      currency,
      customerNote,
      merchantNote
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating Paystack refund:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;