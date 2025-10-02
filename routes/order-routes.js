// Order Management Routes

const express = require('express');
const router = express.Router();
const orderService = require('../services/order-service');
const emailService = require('../services/email-service');

// Normalize DB order row to API camelCase response
function normalizeOrder(order) {
  if (!order) return null;
  return {
    id: order.id,
    orderNumber: order.order_number,
    customer: order.customer_info ? {
      name: order.customer_info.fullName || order.customer_info.name,
      email: order.customer_info.email,
      phone: order.customer_info.phone,
      street: order.customer_info.address,
      city: order.customer_info.city,
      state: order.customer_info.state,
      zip: order.customer_info.zipCode || order.customer_info.zip,
      country: order.customer_info.country,
      notes: order.customer_info.notes
    } : undefined,
    items: order.items || [],
    total: Number(order.total_amount),
    status: order.status,
    paymentStatus: order.payment_status,
    paymentReference: order.payment_reference,
    shippingAddress: order.shipping_info ? {
      name: order.shipping_info.fullName || order.shipping_info.name,
      street: order.shipping_info.address || order.shipping_info.street,
      city: order.shipping_info.city,
      state: order.shipping_info.state,
      zip: order.shipping_info.zipCode || order.shipping_info.zip,
      country: order.shipping_info.country,
      phone: order.shipping_info.phone
    } : undefined,
    tracking: order.tracking_info,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    deliveredAt: order.delivered_at,
    paymentVerifiedAt: order.payment_verified_at
  };
}

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
      order: normalizeOrder(order)
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
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    res.json({
      status: 'success',
      order: normalizeOrder(order)
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
router.get('/', async (req, res) => {
  try {
    const { status, email } = req.query;
    
    let filteredOrders;
    
    if (status) {
      filteredOrders = await orderService.getOrdersByStatus(status);
    } else if (email) {
      filteredOrders = await orderService.getOrdersByCustomer(email);
    } else {
      filteredOrders = await orderService.getAllOrders();
    }
    
    res.json({
      status: 'success',
      count: filteredOrders.length,
      orders: filteredOrders.map(normalizeOrder)
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
      order: normalizeOrder(order)
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
      order: normalizeOrder(result.order)
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
      order: normalizeOrder(result.order)
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