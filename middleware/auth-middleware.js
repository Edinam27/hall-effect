// Authentication Middleware
// Handles route protection and user authentication

const authService = require('../services/auth-service');

/**
 * Middleware to authenticate users
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required'
    });
  }

  authService.verifyToken(token)
    .then(result => {
      if (!result.success) {
        return res.status(403).json({
          success: false,
          error: result.error
        });
      }

      req.user = result.user;
      next();
    })
    .catch(error => {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    });
}

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
}

/**
 * Middleware to check if user has specific role
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `${role} access required`
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  authService.verifyToken(token)
    .then(result => {
      req.user = result.success ? result.user : null;
      next();
    })
    .catch(error => {
      req.user = null;
      next();
    });
}

/**
 * Legacy admin authentication (for backward compatibility)
 * This maintains compatibility with existing admin routes
 */
function legacyAdminAuth(req, res, next) {
  // Check for new JWT token first
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    authService.verifyToken(token)
      .then(result => {
        if (result.success && result.user.role === 'admin') {
          req.user = result.user;
          return next();
        }
        
        // Fall back to legacy auth
        legacyAuth();
      })
      .catch(error => {
        // Fall back to legacy auth
        legacyAuth();
      });
  } else {
    legacyAuth();
  }

  function legacyAuth() {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    
    if (adminKey !== 'admin123') {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized access. Please use proper authentication.' 
      });
    }
    
    // Set a mock user for legacy compatibility
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@gamezonepro.com',
      role: 'admin'
    };
    
    next();
  }
}

/**
 * Rate limiting middleware for authentication endpoints
 */
const loginAttempts = new Map();

function rateLimitAuth(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!loginAttempts.has(ip)) {
      loginAttempts.set(ip, { count: 0, resetTime: now + windowMs });
    }
    
    const attempts = loginAttempts.get(ip);
    
    if (now > attempts.resetTime) {
      attempts.count = 0;
      attempts.resetTime = now + windowMs;
    }
    
    if (attempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
      });
    }
    
    attempts.count++;
    next();
  };
}

/**
 * Middleware to log admin actions
 */
function logAdminAction(action) {
  return (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function to log after response
    res.send = function(data) {
      // Log the action if user is admin and request was successful
      if (req.user && req.user.role === 'admin') {
        const details = {
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          query: req.query,
          params: req.params
        };
        
        authService.logAdminAction(req.user.id, action, details, req)
          .catch(error => console.error('Failed to log admin action:', error));
      }
      
      // Call the original send function
      originalSend.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
  optionalAuth,
  legacyAdminAuth,
  rateLimitAuth,
  logAdminAction
};