// Payment Routes
// Handles payment initialization and processing

const express = require('express');
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
    
    // Prepare payment data
    const paymentData = {
      email: email || (order.customer_info?.email),
      amount: Math.round(Number(order.total_amount) * 100), // Convert to kobo (Paystack expects amount in kobo)
      reference,
      callback_url: `${req.protocol}://${req.get('host')}/payment-success.html`,
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
    
    console.log('Payment data prepared:', {
      email: paymentData.email,
      amount: paymentData.amount,
      reference: paymentData.reference,
      orderId: paymentData.metadata.orderId
    });
    
    // Initialize transaction with Paystack
    const result = await paystackApi.initializeTransaction(paymentData);
    
    if (result.status && result.data) {
      // Update order with payment reference
      order.payment_reference = reference;
      order.payment_status = 'initialized';
      order.updated_at = new Date().toISOString();
      
      // Save the order (this will be handled by the order service)
      await orderService.updateOrderStatus(orderId, order.status);
      
      console.log('Payment initialized successfully:', {
        reference,
        authorizationUrl: result.data.authorization_url
      });
      
      res.json({
        success: true,
        paymentUrl: result.data.authorization_url,
        reference: reference,
        orderId: order.id,
        amount: Number(order.total_amount)
      });
    } else {
      throw new Error('Failed to initialize payment with Paystack');
    }
    
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;