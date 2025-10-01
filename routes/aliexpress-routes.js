// AliExpress API Routes

const express = require('express');
const router = express.Router();
const aliExpressApi = require('../api/aliexpress-api');

/**
 * @route   GET /api/aliexpress/products/:productId
 * @desc    Get product details from AliExpress
 * @access  Private
 */
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await aliExpressApi.getProductDetails(productId);
    res.json(product);
  } catch (error) {
    console.error('Error fetching AliExpress product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/aliexpress/orders
 * @desc    Place an order on AliExpress
 * @access  Private
 */
router.post('/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const result = await aliExpressApi.placeOrder(orderData);
    res.json(result);
  } catch (error) {
    console.error('Error placing AliExpress order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to place order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/aliexpress/orders/:orderId
 * @desc    Get order status from AliExpress
 * @access  Private
 */
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await aliExpressApi.getOrderStatus(orderId);
    res.json(order);
  } catch (error) {
    console.error('Error fetching AliExpress order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/aliexpress/auth
 * @desc    Get AliExpress authorization URL
 * @access  Private
 */
router.get('/auth', (req, res) => {
  const authUrl = `https://auth.aliexpress.com/oauth/authorize?client_id=${process.env.ALIEXPRESS_APP_KEY}&redirect_uri=${encodeURIComponent(process.env.ALIEXPRESS_REDIRECT_URI)}&response_type=code`;
  res.json({ authUrl });
});

module.exports = router;