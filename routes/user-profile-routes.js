// User Profile Routes
// Handles user profile, cart, and user-specific data endpoints

const express = require('express');
const router = express.Router();
const userProfileService = require('../services/user-profile-service');
const { authenticateToken } = require('../middleware/auth-middleware');

/**
 * GET /api/profile
 * Get user profile with cart and other data
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await userProfileService.getUserProfile(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/profile/cart
 * Get user's cart items
 */
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await userProfileService.getUserProfile(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      cart: result.profile.cart_items || []
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile/cart/add
 * Add item to cart
 */
router.post('/cart/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, name, price, color, quantity, image } = req.body;

    if (!id || !name || !price || !color) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, name, price, and color are required'
      });
    }

    const result = await userProfileService.addToCart(userId, {
      id,
      name,
      price,
      color,
      quantity: quantity || 1,
      image
    });

    res.json(result);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/profile/cart/remove
 * Remove item from cart
 */
router.delete('/cart/remove', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, color } = req.body;

    if (!id || !color) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and color are required'
      });
    }

    const result = await userProfileService.removeFromCart(userId, id, color);
    res.json(result);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/cart/update
 * Update item quantity in cart
 */
router.put('/cart/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, color, quantity } = req.body;

    if (!id || !color || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, color, and quantity are required'
      });
    }

    const result = await userProfileService.updateCartItemQuantity(userId, id, color, quantity);
    res.json(result);
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/profile/cart/clear
 * Clear all items from cart
 */
router.delete('/cart/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await userProfileService.clearCart(userId);
    res.json(result);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/profile/wishlist
 * Get user's wishlist items
 */
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await userProfileService.getUserProfile(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      wishlist: result.profile.wishlist_items || []
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile/wishlist/add
 * Add item to wishlist
 */
router.post('/wishlist/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, name, price, image } = req.body;

    if (!id || !name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Product ID, name, and price are required'
      });
    }

    const result = await userProfileService.addToWishlist(userId, {
      id,
      name,
      price,
      image
    });

    res.json(result);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/profile/wishlist/remove
 * Remove item from wishlist
 */
router.delete('/wishlist/remove', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const result = await userProfileService.removeFromWishlist(userId, id);
    res.json(result);
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/addresses
 * Update shipping addresses
 */
router.put('/addresses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addresses } = req.body;

    if (!Array.isArray(addresses)) {
      return res.status(400).json({
        success: false,
        error: 'Addresses must be an array'
      });
    }

    const result = await userProfileService.updateShippingAddresses(userId, addresses);
    res.json(result);
  } catch (error) {
    console.error('Update addresses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/preferences
 * Update user preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Preferences must be an object'
      });
    }

    const result = await userProfileService.updatePreferences(userId, preferences);
    res.json(result);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;