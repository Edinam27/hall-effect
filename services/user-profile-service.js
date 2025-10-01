// User Profile Service
// Handles user profiles, cart management, and user-specific data

const { sql } = require('../config/database');

/**
 * Get user profile with cart and other data
 */
async function getUserProfile(userId) {
  try {
    const profiles = await sql`
      SELECT up.*, u.email, u.first_name, u.last_name, u.profile_picture
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = ${userId}
    `;

    if (profiles.length === 0) {
      // Create profile if it doesn't exist
      await sql`
        INSERT INTO user_profiles (user_id)
        VALUES (${userId})
      `;

      // Get the newly created profile
      const newProfiles = await sql`
        SELECT up.*, u.email, u.first_name, u.last_name, u.profile_picture
        FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE up.user_id = ${userId}
      `;

      return {
        success: true,
        profile: newProfiles[0]
      };
    }

    return {
      success: true,
      profile: profiles[0]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update cart items for a user
 */
async function updateCart(userId, cartItems) {
  try {
    await sql`
      UPDATE user_profiles 
      SET cart_items = ${JSON.stringify(cartItems)}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;

    return {
      success: true,
      message: 'Cart updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add item to cart
 */
async function addToCart(userId, item) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) {
      throw new Error('Failed to get user profile');
    }

    let cartItems = profile.profile.cart_items || [];
    
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(cartItem => 
      cartItem.id === item.id && cartItem.color === item.color
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      cartItems[existingItemIndex].quantity += item.quantity || 1;
    } else {
      // Add new item to cart
      cartItems.push({
        id: item.id,
        name: item.name,
        price: item.price,
        color: item.color,
        quantity: item.quantity || 1,
        image: item.image,
        addedAt: new Date().toISOString()
      });
    }

    return await updateCart(userId, cartItems);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove item from cart
 */
async function removeFromCart(userId, itemId, color) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) {
      throw new Error('Failed to get user profile');
    }

    let cartItems = profile.profile.cart_items || [];
    cartItems = cartItems.filter(item => 
      !(item.id === itemId && item.color === color)
    );

    return await updateCart(userId, cartItems);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update item quantity in cart
 */
async function updateCartItemQuantity(userId, itemId, color, quantity) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) {
      throw new Error('Failed to get user profile');
    }

    let cartItems = profile.profile.cart_items || [];
    const itemIndex = cartItems.findIndex(item => 
      item.id === itemId && item.color === color
    );

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cartItems.splice(itemIndex, 1);
      } else {
        cartItems[itemIndex].quantity = quantity;
      }
    }

    return await updateCart(userId, cartItems);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clear cart
 */
async function clearCart(userId) {
  try {
    return await updateCart(userId, []);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update wishlist items
 */
async function updateWishlist(userId, wishlistItems) {
  try {
    await sql`
      UPDATE user_profiles 
      SET wishlist_items = ${JSON.stringify(wishlistItems)}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;

    return {
      success: true,
      message: 'Wishlist updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add item to wishlist
 */
async function addToWishlist(userId, item) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) {
      throw new Error('Failed to get user profile');
    }

    let wishlistItems = profile.profile.wishlist_items || [];
    
    // Check if item already exists in wishlist
    const existingItem = wishlistItems.find(wishlistItem => 
      wishlistItem.id === item.id
    );

    if (!existingItem) {
      wishlistItems.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        addedAt: new Date().toISOString()
      });
    }

    return await updateWishlist(userId, wishlistItems);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Remove item from wishlist
 */
async function removeFromWishlist(userId, itemId) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) {
      throw new Error('Failed to get user profile');
    }

    let wishlistItems = profile.profile.wishlist_items || [];
    wishlistItems = wishlistItems.filter(item => item.id !== itemId);

    return await updateWishlist(userId, wishlistItems);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update shipping addresses
 */
async function updateShippingAddresses(userId, addresses) {
  try {
    await sql`
      UPDATE user_profiles 
      SET shipping_addresses = ${JSON.stringify(addresses)}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;

    return {
      success: true,
      message: 'Shipping addresses updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user preferences
 */
async function updatePreferences(userId, preferences) {
  try {
    await sql`
      UPDATE user_profiles 
      SET preferences = ${JSON.stringify(preferences)}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;

    return {
      success: true,
      message: 'Preferences updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getUserProfile,
  updateCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  updateWishlist,
  addToWishlist,
  removeFromWishlist,
  updateShippingAddresses,
  updatePreferences
};