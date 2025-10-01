// Order Management Routes

const express = require('express');
const router = express.Router();
const orderService = require('../services/order-service');
const emailService = require('../services/email-service');

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { items, customer, customerInfo, amount } = req.body;
    
    // Accept either 'customer' or 'customerInfo' field
    const customerData = customer || customerInfo;
    
    // Validate required fields
    if (!customerData || !items) {
      return res.status(400).json({
        success: false,
        message: 'Customer and items are required'
      });
    }
    
    // Create order data object
    const orderData = {
      customerInfo: customerData,
      items: items,
      amount: amount || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      paymentStatus: 'pending'
    };
    
    const order = await orderService.createOrder(orderData);
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order by ID
 * @access  Public
 */
router.get('/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    res.json({
      status: 'success',
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders or filter by status or customer
 * @access  Private
 */
router.get('/', (req, res) => {
  try {
    const { status, email } = req.query;
    
    let filteredOrders;
    
    if (status) {
      filteredOrders = orderService.getOrdersByStatus(status);
    } else if (email) {
      filteredOrders = orderService.getOrdersByCustomer(email);
    } else {
      filteredOrders = orderService.getAllOrders();
    }
    
    res.json({
      status: 'success',
      count: filteredOrders.length,
      orders: filteredOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status
 * @access  Private
 */
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status is required'
      });
    }
    
    const order = await orderService.updateOrderStatus(orderId, status);
    
    res.json({
      status: 'success',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/orders/:orderId/tracking
 * @desc    Update order tracking information
 * @access  Private
 */
router.put('/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const trackingInfo = req.body;
    
    if (!trackingInfo.trackingNumber || !trackingInfo.carrier) {
      return res.status(400).json({
        status: 'error',
        message: 'Tracking number and carrier are required'
      });
    }
    
    const result = await orderService.updateOrderTracking(orderId, trackingInfo);
    
    res.json({
      status: 'success',
      order: result.order
    });
  } catch (error) {
    console.error('Error updating order tracking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order tracking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/orders/:orderId/delivered
 * @desc    Mark order as delivered
 * @access  Private
 */
router.put('/:orderId/delivered', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await orderService.markOrderDelivered(orderId);
    
    res.json({
      status: 'success',
      order: result.order
    });
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark order as delivered',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/orders/:orderId/resend-confirmation
 * @desc    Resend order confirmation email
 * @access  Private
 */
router.post('/:orderId/resend-confirmation', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    await emailService.sendOrderConfirmation(orderId);
    
    res.json({
      status: 'success',
      message: 'Order confirmation email sent'
    });
  } catch (error) {
    console.error('Error resending order confirmation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resend order confirmation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;