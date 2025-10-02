// Authentication Routes
// Handles user authentication endpoints

const express = require('express');
const router = express.Router();
const authService = require('../services/auth-service');
const { authenticateToken, requireAdmin, rateLimitAuth, logAdminAction } = require('../middleware/auth-middleware');
// Use rate limiting only in production to ease local testing
const isProd = process.env.NODE_ENV === 'production';
const registerRateLimit = isProd ? rateLimitAuth(3, 15 * 60 * 1000) : (req, res, next) => next();
const loginRateLimit = isProd ? rateLimitAuth(5, 15 * 60 * 1000) : (req, res, next) => next();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerRateLimit, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    // Only admins can create admin users
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot create admin users through registration'
      });
    }

    const result = await authService.registerUser({
      username,
      email,
      password,
      role: role || 'user'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    const result = await authService.logoutUser(token);
    res.json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await authService.getUserProfile(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify token validity
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token is valid'
  });
});

// Admin-only routes
/**
 * POST /api/auth/admin/create-user
 * Create a new user (admin only)
 */
router.post('/admin/create-user', 
  authenticateToken, 
  requireAdmin, 
  logAdminAction('CREATE_USER'),
  async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, email, and password are required'
        });
      }

      const result = await authService.registerUser({
        username,
        email,
        password,
        role: role || 'user'
      });

      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      console.error('Admin create user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/auth/admin/users
 * Get all users (admin only)
 */
router.get('/admin/users', 
  authenticateToken, 
  requireAdmin,
  async (req, res) => {
    try {
      const { sql } = require('../config/database');
      
      const users = await sql`
        SELECT id, username, email, role, created_at, last_login, is_active
        FROM users
        ORDER BY created_at DESC
      `;

      res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/auth/admin/users/:userId/status
 * Update user status (admin only)
 */
router.put('/admin/users/:userId/status', 
  authenticateToken, 
  requireAdmin,
  logAdminAction('UPDATE_USER_STATUS'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const { sql } = require('../config/database');

      await sql`
        UPDATE users 
        SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `;

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/auth/admin/logs
 * Get admin action logs (admin only)
 */
router.get('/admin/logs', 
  authenticateToken, 
  requireAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      const { sql } = require('../config/database');

      const logs = await sql`
        SELECT l.*, u.username, u.email
        FROM admin_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalCount = await sql`
        SELECT COUNT(*) as count FROM admin_logs
      `;

      res.json({
        success: true,
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit)
        }
      });
    } catch (error) {
      console.error('Get admin logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/auth/google
 * Google OAuth authentication
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
    }

    const result = await authService.googleAuth(idToken);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;