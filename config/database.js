// Database Configuration for Neon PostgreSQL
// Handles connection setup and query execution

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL);

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully:', result[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Initialize database tables
 */
async function initializeTables() {
  try {
    // Create users table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        profile_picture TEXT,
        role VARCHAR(20) DEFAULT 'user',
        auth_provider VARCHAR(20) DEFAULT 'local',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Create user profiles table for storing cart and user-specific data
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cart_items JSONB DEFAULT '[]',
        wishlist_items JSONB DEFAULT '[]',
        shipping_addresses JSONB DEFAULT '[]',
        billing_addresses JSONB DEFAULT '[]',
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        customer_info JSONB NOT NULL,
        items JSONB NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_reference VARCHAR(255),
        shipping_info JSONB,
        tracking_info JSONB,
        aliexpress_order_id VARCHAR(255),
        temu_order_id VARCHAR(255),
        admin_notes TEXT,
        profit_margin DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        payment_verified_at TIMESTAMP
      )
    `;

    // Create sessions table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create admin_logs table for audit trail
    await sql`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders((customer_info->>'email'))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)`;

    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error.message);
    return false;
  }
}

/**
 * Create default admin user if not exists
 */
async function createDefaultAdmin() {
  try {
    const bcrypt = require('bcryptjs');
    
    // Check if admin user exists
    const existingAdmin = await sql`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `;

    if (existingAdmin.length === 0) {
      const defaultPassword = 'admin123'; // Change this in production
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      await sql`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ('admin', 'admin@gamezonepro.com', ${hashedPassword}, 'admin')
      `;

      console.log('✅ Default admin user created');
      console.log('📧 Email: admin@gamezonepro.com');
      console.log('🔑 Password: admin123 (Please change this!)');
    }
  } catch (error) {
    console.error('❌ Failed to create default admin:', error.message);
  }
}

/**
 * Execute raw SQL query
 */
async function query(text, params = []) {
  try {
    if (params.length > 0) {
      return await sql(text, ...params);
    } else {
      return await sql`${text}`;
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get database connection instance
 */
function getConnection() {
  return sql;
}

/**
 * Initialize database tables and default data
 */
async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Test connection first
    await testConnection();
    
    // Create tables
    await initializeTables();
    
    // Create default admin user
    await createDefaultAdmin();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  sql,
  testConnection,
  initializeTables,
  initializeDatabase,
  createDefaultAdmin,
  query,
  getConnection
};