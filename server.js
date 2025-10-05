// GameZone Pro - Backend Server
// Production-ready server for Render deployment

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize database connection
const { initializeDatabase } = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Import custom modules with error handling
let paystackApi, emailService, orderService;
try {
  if (fs.existsSync('./api/paystack-api.js')) {
    paystackApi = require('./api/paystack-api');
  }
  if (fs.existsSync('./services/email-service.js')) {
    emailService = require('./services/email-service');
  }
  if (fs.existsSync('./services/order-service.js')) {
    orderService = require('./services/order-service');
  }
} catch (error) {
  console.log('Some optional modules not found, continuing with basic functionality');
}

// Initialize database on startup (optional skip via env)
async function startServer() {
  try {
    const skipDbInit = process.env.SKIP_DB_INIT === 'true';
    if (skipDbInit) {
      console.log('Skipping database initialization via SKIP_DB_INIT=true');
    } else {
      await initializeDatabase();
      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '/')));

// Health check route for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes with error handling
if (fs.existsSync('./routes/auth-routes.js')) {
  app.use('/api/auth', require('./routes/auth-routes'));
}
if (fs.existsSync('./routes/user-profile-routes.js')) {
  app.use('/api/profile', require('./routes/user-profile-routes'));
}
if (fs.existsSync('./routes/paystack-routes.js')) {
  app.use('/api/paystack', require('./routes/paystack-routes'));
}
if (fs.existsSync('./routes/order-routes.js')) {
  app.use('/api/orders', require('./routes/order-routes'));
}
if (fs.existsSync('./routes/payment-routes.js')) {
  app.use('/api/payment', require('./routes/payment-routes'));
}
if (fs.existsSync('./routes/admin-routes.js')) {
  app.use('/api/admin', require('./routes/admin-routes'));
}

// Paystack callback route
app.get('/payment/callback', (req, res) => {
  const reference = req.query.reference;
  const orderId = req.query.order_id || '';
  
  // Redirect to success page with reference and order ID
  res.redirect(`/payment-success.html?reference=${reference}&order_id=${orderId}`);
});

// Webhook routes with error handling
if (paystackApi && paystackApi.handleWebhook) {
  app.post('/webhooks/paystack', paystackApi.handleWebhook);
}

// Catch-all route for SPA (only for non-API routes)
app.get('*', (req, res, next) => {
  // Skip catch-all for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server with database initialization
startServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GameZone Pro Server running on port ${PORT}`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`⚡ Ready to handle requests!`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Authentication: http://localhost:${PORT}/api/auth`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});