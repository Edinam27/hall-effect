// Admin Routes Module
// Handles admin dashboard API endpoints

const express = require('express');
const router = express.Router();
const orderService = require('../services/order-service');
const inventoryService = require('../services/inventory-service');
const paystackApi = require('../api/paystack-api');
const { authenticateToken, requireAdmin, legacyAdminAuth, logAdminAction } = require('../middleware/auth-middleware');

// Use legacy admin auth as fallback for backward compatibility
const adminAuth = (req, res, next) => {
  // Check for admin key first (legacy support)
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  
  if (adminKey === 'admin123') {
    // Set a mock user for legacy compatibility
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@gamezonepro.com',
      role: 'admin'
    };
    return next();
  }
  
  // Try JWT-based authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required'
    });
  }
  
  // Use the auth service to verify token
  const authService = require('../services/auth-service');
  authService.verifyToken(token)
    .then(result => {
      if (result.success && result.user.role === 'admin') {
        req.user = result.user;
        return next();
      } else {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }
    })
    .catch(error => {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    });
};

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await orderService.getAdminStats();
    const inventory = orderService.getInventoryWithProfitMargins();
    
    res.json({
      success: true,
      data: {
        stats,
        inventory
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * GET /api/admin/orders
 * Get orders with pagination and filtering
 */
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const ordersData = await orderService.getAdminOrders(
      parseInt(page),
      parseInt(limit),
      status
    );
    
    res.json({
      success: true,
      data: ordersData
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

/**
 * GET /api/admin/orders/:orderId
 * Get specific order details
 */
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details'
    });
  }
});

/**
 * POST /api/admin/orders/:orderId/process-temu
 * Process Temu order for customer
 */
router.post('/orders/:orderId/process-temu', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminNotes } = req.body;
    
    const result = await orderService.processTemuOrder(orderId, adminNotes);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing Temu order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process Temu order'
    });
  }
});

/**
 * PUT /api/admin/orders/:orderId/temu-status
 * Update Temu order status and tracking
 */
router.put('/orders/:orderId/temu-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { temuStatus, trackingInfo } = req.body;
    
    const result = await orderService.updateTemuOrderStatus(
      orderId,
      temuStatus,
      trackingInfo
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating Temu order status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update Temu order status'
    });
  }
});

/**
 * PUT /api/admin/orders/:orderId/status
 * Update order status
 */
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    const result = await orderService.updateOrderStatus(orderId, {
      status,
      adminNotes: notes,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
});

/**
 * GET /api/admin/inventory
 * Get real-time inventory data with profit margins
 */
router.get('/inventory', async (req, res) => {
  try {
    const { forceRefresh } = req.query;
    const inventory = await inventoryService.getRealTimeInventory(forceRefresh === 'true');
    
    res.json({
      success: true,
      data: inventory,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time inventory data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory data'
    });
  }
});

/**
 * POST /api/admin/inventory/refresh
 * Force refresh real-time inventory data
 */
router.post('/inventory/refresh', async (req, res) => {
  try {
    console.log('Admin requested inventory refresh');
    const inventory = await inventoryService.getRealTimeInventory(true);
    
    res.json({
      success: true,
      data: inventory,
      message: 'Inventory data refreshed successfully',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing inventory data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh inventory data'
    });
  }
});

/**
 * GET /api/admin/inventory/:productId
 * Get real-time inventory for specific product
 */
router.get('/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await inventoryService.getProductInventory(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product inventory'
    });
  }
});

/**
 * POST /api/admin/inventory/check-stock
 * Check if specific product variant is in stock
 */
router.post('/inventory/check-stock', async (req, res) => {
  try {
    const { productId, variant, quantity = 1 } = req.body;
    
    if (!productId || !variant) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and variant are required'
      });
    }
    
    const inStock = await inventoryService.isProductInStock(productId, variant, quantity);
    const product = await inventoryService.getProductInventory(productId);
    
    res.json({
      success: true,
      data: {
        productId,
        variant,
        quantity,
        inStock,
        availableStock: product?.variants?.find(v => v.color === variant)?.stock || 0
      }
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check stock'
    });
  }
});

/**
 * POST /api/admin/paystack/initialize
 * Initialize Paystack payment for Temu order
 */
router.post('/paystack/initialize', async (req, res) => {
  try {
    const { orderId, amount, email, metadata } = req.body;
    
    // Initialize Paystack payment for Temu order cost
    const paymentData = {
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      metadata: {
        orderId,
        purpose: 'temu_order_payment',
        ...metadata
      },
      callback_url: `${req.protocol}://${req.get('host')}/admin.html?payment=success`
    };
    
    const result = await paystackApi.initializePayment(paymentData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment'
    });
  }
});

/**
 * GET /api/admin/customers
 * Get customer data for admin
 */
router.get('/customers', async (req, res) => {
  try {
    const orders = orderService.getAllOrders();
    
    // Extract unique customers
    const customersMap = new Map();
    
    orders.forEach(order => {
      const customerId = order.customer.email;
      if (!customersMap.has(customerId)) {
        customersMap.set(customerId, {
          email: order.customer.email,
          fullName: order.customer.fullName,
          phone: order.customer.phone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
          orders: []
        });
      }
      
      const customer = customersMap.get(customerId);
      customer.totalOrders++;
      customer.totalSpent += order.total;
      customer.orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt
      });
      
      // Update last order date if this order is more recent
      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
      }
    });
    
    const customers = Array.from(customersMap.values())
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Error fetching customer data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer data'
    });
  }
});

/**
 * POST /api/admin/test-order
 * Create a test order for development
 */
router.post('/test-order', async (req, res) => {
  try {
    const testOrderData = {
      customerInfo: {
        fullName: 'Test Customer',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Ghana'
      },
      items: [
        {
          id: 'gamesir-nova-lite-black',
          name: 'GameSir Nova Lite Gaming Controller',
          color: 'Black',
          price: 35.71,
          wholesaleCost: 21.43,
          quantity: 1,
          temuUrl: 'https://www.temu.com/gh/--lite-wireless-gaming-controller-ergonomic-wireless-wired--for-switch-for--ios-pc-steam-games-turbo-function-hall-effect-sticks-g-601099548838966.html'
        }
      ],
      paymentMethod: 'paystack',
      status: 'paid',
      paymentStatus: 'completed'
    };
    
    const order = await orderService.createOrder(testOrderData);
    
    res.json({
      success: true,
      data: order,
      message: 'Test order created successfully'
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test order'
    });
  }
});

module.exports = router;