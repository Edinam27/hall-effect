// Authentication Service
// Handles user authentication, registration, and session management

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sql } = require('../config/database');
require('dotenv').config();

// JWT secret key (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * Register a new user
 */
async function registerUser(userData) {
  try {
    const { username, email, password, role = 'user' } = userData;

    // Validate input
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `;

    if (existingUser.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${username}, ${email}, ${passwordHash}, ${role})
      RETURNING id, username, email, role, created_at
    `;

    return {
      success: true,
      user: newUser[0],
      message: 'User registered successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Authenticate user login
 */
async function loginUser(email, password) {
  try {
    // Find user by email
    const users = await sql`
      SELECT id, username, email, password_hash, role, is_active
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create session record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: 'Login successful'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify JWT token
 */
async function verifyToken(token) {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists and is not expired
    const sessions = await sql`
      SELECT s.*, u.username, u.email, u.role, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${token} 
      AND s.expires_at > CURRENT_TIMESTAMP
    `;

    if (sessions.length === 0) {
      throw new Error('Invalid or expired session');
    }

    const session = sessions[0];

    // Check if user is still active
    if (!session.is_active) {
      throw new Error('Account is deactivated');
    }

    return {
      success: true,
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email,
        role: session.role
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logout user (invalidate session)
 */
async function logoutUser(token) {
  try {
    await sql`
      DELETE FROM user_sessions 
      WHERE session_token = ${token}
    `;

    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Change user password
 */
async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Get current user
    const users = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;

    // Invalidate all existing sessions for this user
    await sql`
      DELETE FROM user_sessions WHERE user_id = ${userId}
    `;

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  try {
    const users = await sql`
      SELECT id, username, email, role, created_at, last_login
      FROM users 
      WHERE id = ${userId}
    `;

    if (users.length === 0) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: users[0]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions() {
  try {
    const result = await sql`
      DELETE FROM user_sessions 
      WHERE expires_at < CURRENT_TIMESTAMP
    `;

    console.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}

/**
 * Log admin action
 */
async function logAdminAction(userId, action, details = {}, req = null) {
  try {
    const ipAddress = req ? req.ip || req.connection.remoteAddress : null;
    const userAgent = req ? req.get('User-Agent') : null;

    await sql`
      INSERT INTO admin_logs (user_id, action, details, ip_address, user_agent)
      VALUES (${userId}, ${action}, ${JSON.stringify(details)}, ${ipAddress}, ${userAgent})
    `;
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

/**
 * Verify Google OAuth token and get user info
 */
async function verifyGoogleToken(idToken) {
  try {
    if (!googleClient) {
      throw new Error('Google OAuth not configured');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
      success: true,
      user: {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        profilePicture: payload.picture,
        emailVerified: payload.email_verified
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle Google OAuth login/registration
 */
async function googleAuth(idToken) {
  try {
    // Verify Google token
    const verificationResult = await verifyGoogleToken(idToken);
    if (!verificationResult.success) {
      throw new Error(verificationResult.error);
    }

    const googleUser = verificationResult.user;

    // Check if user exists by Google ID or email
    const existingUsers = await sql`
      SELECT id, username, email, google_id, first_name, last_name, profile_picture, role, is_active
      FROM users 
      WHERE google_id = ${googleUser.googleId} OR email = ${googleUser.email}
    `;

    let user;

    if (existingUsers.length > 0) {
      // User exists, update Google ID if not set
      user = existingUsers[0];
      
      if (!user.google_id) {
        await sql`
          UPDATE users 
          SET google_id = ${googleUser.googleId}, 
              first_name = ${googleUser.firstName},
              last_name = ${googleUser.lastName},
              profile_picture = ${googleUser.profilePicture},
              auth_provider = 'google',
              last_login = CURRENT_TIMESTAMP
          WHERE id = ${user.id}
        `;
      } else {
        // Just update last login
        await sql`
          UPDATE users 
          SET last_login = CURRENT_TIMESTAMP 
          WHERE id = ${user.id}
        `;
      }
    } else {
      // Create new user
      const newUsers = await sql`
        INSERT INTO users (
          email, google_id, first_name, last_name, profile_picture, 
          auth_provider, role, username
        )
        VALUES (
          ${googleUser.email}, ${googleUser.googleId}, ${googleUser.firstName}, 
          ${googleUser.lastName}, ${googleUser.profilePicture}, 'google', 'user',
          ${googleUser.email.split('@')[0] + '_' + Date.now()}
        )
        RETURNING id, username, email, google_id, first_name, last_name, profile_picture, role, is_active
      `;
      
      user = newUsers[0];

      // Create user profile
      await sql`
        INSERT INTO user_profiles (user_id)
        VALUES (${user.id})
      `;
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create session record
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePicture: user.profile_picture,
        role: user.role
      },
      message: 'Google authentication successful'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  logoutUser,
  changePassword,
  getUserProfile,
  cleanupExpiredSessions,
  logAdminAction,
  verifyGoogleToken,
  googleAuth
};