// Order Service Module
// Handles order processing, payment integration, and Temu fulfillment

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { sql } = require('../config/database');

// Import API modules
let paystackApi, emailService, inventoryService;
try {
  if (fs.existsSync('../api/paystack-api.js')) {
    paystackApi = require('../api/paystack-api');
  }
  if (fs.existsSync('./email-service.js')) {
    emailService = require('./email-service');
  }
  if (fs.existsSync('./inventory-service.js')) {
    inventoryService = require('./inventory-service');
  }
} catch (error) {
  console.log('Some optional modules not found in order service');
}

/**
 * Initialize orders table if it doesn't exist
 */
async function initializeOrdersTable() {
  try {
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

    await sql`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders((customer_info->>'email'));
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    `;

    console.log('Orders table initialized successfully');
  } catch (error) {
    console.error('Error initializing orders table:', error);
  }
}

// Initialize the table
initializeOrdersTable();

/**
 * Generate a unique order number
 */
function generateOrderNumber() {
  const prefix = 'GZP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Sync successful Paystack transactions into Neon orders
 * - Upserts orders based on Paystack metadata (orderId/orderNumber) or reference
 * - Marks payment_status as completed and status as paid
 * - Creates missing orders using transaction data
 */
exports.syncPaystackTransactionsToOrders = async (params = {}) => {
  if (!paystackApi) {
    throw new Error('Paystack API module unavailable');
  }
  try {
    const query = { perPage: params.perPage || 100 };
    if (params.status) query.status = params.status; else query.status = 'success';
    if (params.customer) query.customer = params.customer;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;

    const resp = await paystackApi.listTransactions(query);
    const txs = Array.isArray(resp?.data) ? resp.data : [];

    let created = 0;
    let updated = 0;
    const results = [];

    for (const tx of txs) {
      try {
        const status = tx.status || tx.gateway_response || '';
        if (String(status).toLowerCase() !== 'success') continue;

        const reference = tx.reference;
        const metadata = tx.metadata || {};
        const metaOrderId = metadata.orderId || metadata.order_id || null;
        const metaOrderNumber = metadata.orderNumber || metadata.order_number || null;

        // Try to find existing order by id/number/reference
        let order = null;
        if (metaOrderId) {
          const rows = await sql`SELECT * FROM orders WHERE id = ${String(metaOrderId)}`;
          order = rows[0] || null;
        }
        if (!order && metaOrderNumber) {
          const rows = await sql`SELECT * FROM orders WHERE order_number = ${String(metaOrderNumber)}`;
          order = rows[0] || null;
        }
        if (!order && reference) {
          const rows = await sql`SELECT * FROM orders WHERE payment_reference = ${String(reference)}`;
          order = rows[0] || null;
        }

        const amount = typeof tx.amount === 'number' ? Math.round(tx.amount) / 100 : Number(tx.amount || 0) / 100;
        const customer = tx.customer || {};

        if (order) {
          // Update payment status if not completed
          await sql`
            UPDATE orders
            SET payment_status = ${'completed'}, status = ${order.status === 'delivered' ? order.status : 'paid'},
                payment_reference = ${reference || order.payment_reference}, payment_verified_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${order.id}
          `;
          const rows = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
          results.push({ action: 'updated', order: rows[0], reference });
          updated += 1;
        } else {
          // Create a new order row from transaction data
          const id = metaOrderId || uuidv4();
          const orderNumber = metaOrderNumber || (reference ? `PS-${reference.slice(-8)}` : generateOrderNumber());
          const items = Array.isArray(metadata.items) ? metadata.items : [
            {
              id: metadata.productId || 'unknown',
              name: 'Paystack Payment',
              quantity: 1,
              price: amount
            }
          ];
          const customerInfo = {
            email: customer.email || metadata.customerEmail || 'unknown@customer',
            fullName: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || metadata.customerName || 'Unknown Customer',
            phone: customer.phone || metadata.phone || null,
            customerId: metadata.customerId || null
          };
          const shippingInfo = metadata.shippingInfo || {
            address: metadata.address || null,
            city: metadata.city || null,
            state: metadata.state || null,
            country: metadata.country || null,
            zipCode: metadata.zip || null
          };

          await sql`
            INSERT INTO orders (id, order_number, customer_info, items, total_amount, status, payment_status, payment_reference, shipping_info)
            VALUES (${id}, ${orderNumber}, ${sql.json(customerInfo)}, ${sql.json(items)}, ${amount}, ${'paid'}, ${'completed'}, ${reference}, ${sql.json(shippingInfo)})
            ON CONFLICT (id) DO NOTHING
          `;
          const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
          results.push({ action: 'created', order: rows[0], reference });
          created += 1;
        }
      } catch (rowErr) {
        results.push({ action: 'error', reference: tx.reference, error: rowErr.message });
      }
    }

    return { created, updated, processed: txs.length, results };
  } catch (error) {
    console.error('Error syncing Paystack transactions:', error);
    throw error;
  }
};

/**
 * Persist order to local file as a fallback when DB is unavailable
 */
function saveOrderFallback(order) {
  try {
    const fallbackDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    const file = path.join(fallbackDir, 'orders-fallback.json');
    let existing = [];
    if (fs.existsSync(file)) {
      try {
        existing = JSON.parse(fs.readFileSync(file, 'utf8')) || [];
      } catch (_) {
        existing = [];
      }
    }
    existing.push(order);
    fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    console.log('💾 Order persisted to fallback store:', { orderId: order.id, orderNumber: order.order_number });
  } catch (err) {
    console.error('❌ Failed to write fallback order:', err);
  }
}

/**
 * Validate customer information
 */
function validateCustomerInfo(customerInfo) {
  const errors = [];
  
  if (!customerInfo) {
    errors.push('Customer information is required');
    return errors;
  }
  
  // Required field validation
  const requiredFields = {
    fullName: 'Full name',
    email: 'Email address',
    phone: 'Phone number',
    address: 'Shipping address',
    city: 'City',
    state: 'State/Province',
    zipCode: 'Zip/Postal code',
    country: 'Country'
  };
  
  for (const [field, label] of Object.entries(requiredFields)) {
    if (!customerInfo[field] || customerInfo[field].toString().trim().length === 0) {
      errors.push(`${label} is required`);
    }
  }
  
  // Email validation
  if (customerInfo.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      errors.push('Please provide a valid email address');
    }
  }
  
  // Phone validation
  if (customerInfo.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    if (!phoneRegex.test(customerInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Please provide a valid phone number');
    }
  }
  
  return errors;
}

/**
 * Create a new order with enhanced customer data handling
 */
exports.createOrder = async (orderData) => {
  try {
    const { customerInfo, items, paymentMethod, amount, status, paymentStatus } = orderData;
    
    // Validate customer information
    const validationErrors = validateCustomerInfo(customerInfo);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    
    // Calculate order totals
    const subtotal = amount || items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = 0; // Always free shipping
    const tax = subtotal * 0.07; // 7% tax rate
    const total = subtotal + shipping + tax;
    
    // Create order data
    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();
    
    const customerData = {
      fullName: customerInfo.fullName.trim(),
      email: customerInfo.email.trim().toLowerCase(),
      phone: customerInfo.phone.trim(),
      address: customerInfo.address.trim(),
      city: customerInfo.city.trim(),
      state: customerInfo.state.trim(),
      zipCode: customerInfo.zipCode.trim(),
      country: customerInfo.country,
      notes: customerInfo.notes || ''
    };
    
    const shippingData = {
      fullName: customerInfo.fullName.trim(),
      address: customerInfo.address.trim(),
      city: customerInfo.city.trim(),
      state: customerInfo.state.trim(),
      zipCode: customerInfo.zipCode.trim(),
      country: customerInfo.country,
      phone: customerInfo.phone.trim()
    };
    
    let order;
    try {
      // Insert order into database
      await sql`
        INSERT INTO orders (
          id, order_number, customer_info, items, total_amount,
          status, payment_status, shipping_info
        ) VALUES (
          ${orderId}, ${orderNumber}, ${JSON.stringify(customerData)},
          ${JSON.stringify(items)}, ${total},
          ${status || 'pending'}, ${paymentStatus || 'pending'}, ${JSON.stringify(shippingData)}
        )
      `;

      // Retrieve the created order
      const [dbOrder] = await sql`
        SELECT * FROM orders WHERE id = ${orderId}
      `;
      order = dbOrder;
    } catch (dbError) {
      const msg = (dbError && dbError.message) || '';
      const isTimeout = msg.includes('fetch failed') || (dbError && dbError.sourceError && dbError.sourceError.code === 'UND_ERR_CONNECT_TIMEOUT');
      if (!isTimeout) {
        throw dbError;
      }
      // Graceful fallback to local file persistence
      order = {
        id: orderId,
        order_number: orderNumber,
        customer_info: customerData,
        items,
        total_amount: total,
        status: status || 'pending',
        payment_status: paymentStatus || 'pending',
        shipping_info: shippingData,
        created_at: new Date().toISOString(),
        fallback: true
      };
      saveOrderFallback(order);
      console.warn('⚠️ Database unavailable; order saved to local fallback.');
    }
    
    // Update inventory for each item
    if (inventoryService) {
      for (const item of items) {
        try {
          await inventoryService.updateStock(item.id, -item.quantity);
        } catch (inventoryError) {
          console.error(`Error updating inventory for item ${item.id}:`, inventoryError);
        }
      }
    }
    
    // Log order creation
    console.log('Order created successfully:', {
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmail: customerData.email,
      itemCount: items.length,
      total: order.total_amount
    });
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Update order status with additional data
 */
exports.updateOrderStatus = async (orderId, statusUpdate) => {
  try {
    const order = await exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Normalize update payload
    const isStringUpdate = typeof statusUpdate === 'string';
    const updateObj = isStringUpdate ? { status: statusUpdate } : (statusUpdate || {});
    
    const newStatus = updateObj.status ?? order.status;
    const newPaymentStatus = updateObj.payment_status ?? (newStatus === 'paid' ? 'completed' : order.payment_status);
    const newPaymentReference = updateObj.payment_reference ?? order.payment_reference;
    const newTrackingInfo = updateObj.tracking_info !== undefined ? updateObj.tracking_info : order.tracking_info;
    
    // Persist updates to DB
    await sql`
      UPDATE orders
      SET 
        status = ${newStatus},
        payment_status = ${newPaymentStatus},
        payment_reference = ${newPaymentReference},
        tracking_info = ${newTrackingInfo ? JSON.stringify(newTrackingInfo) : newTrackingInfo},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `;
    
    // Send order confirmation when payment completes
    if (newStatus === 'paid' || newPaymentStatus === 'completed') {
      try {
        await emailService.sendOrderConfirmation(order.id);
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
      }
    }
    
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
    
    console.log('Order status updated:', {
      orderId: updated.id,
      orderNumber: updated.order_number,
      newStatus: updated.status,
      paymentStatus: updated.payment_status
    });
    
    return updated;
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    throw error;
  }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (orderId) => {
  try {
    const [order] = await sql`
      SELECT * FROM orders 
      WHERE id = ${orderId} OR order_number = ${orderId}
    `;
    return order;
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
};

/**
 * Update order status
 */
// Removed duplicate updateOrderStatus; unified above to support string or object updates

/**
 * Process payment with Paystack
 */
exports.processPayment = async (orderId, customerEmail) => {
  try {
    const order = await exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Generate a unique reference
    const reference = `GZP-PAY-${Date.now()}`;
    
    // Initialize transaction with Paystack
    const paymentData = {
      email: customerEmail,
      amount: Number(order.total_amount),
      currency: process.env.PAYSTACK_CURRENCY || 'USD',
      reference,
      callbackUrl: `${process.env.WEBSITE_URL}/payment/callback`,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        items: (Array.isArray(order.items) ? order.items : []).map(item => ({
          id: item.productId || item.id,
          name: item.name,
          quantity: item.quantity
        }))
      }
    };
    
    const result = await paystackApi.initializeTransaction(paymentData);
    
    await sql`
      UPDATE orders
      SET payment_reference = ${reference}, payment_status = ${'initialized'}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `;
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
    
    return {
      order: updated,
      paymentUrl: result.data.authorization_url
    };
  } catch (error) {
    console.error(`Error processing payment for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Verify payment with Paystack
 */
exports.verifyPayment = async (reference) => {
  try {
    const result = await paystackApi.verifyTransaction(reference);
    
    if (result.data.status === 'success') {
      // Find the order by payment reference in DB
      const [order] = await sql`SELECT * FROM orders WHERE payment_reference = ${reference}`;
      if (order) {
        await sql`
          UPDATE orders
          SET payment_status = ${'completed'}, status = ${'paid'}, payment_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${order.id}
        `;
        const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
        
        // Process the order with AliExpress
        await exports.processAliExpressOrder(updated.id);
        
        // Send confirmation email
        await emailService.sendOrderConfirmation(updated.id);
        
        return { success: true, order: updated };
      }
      return { success: true, order: null };
    } else {
      return { success: false, message: 'Payment verification failed' };
    }
  } catch (error) {
    console.error(`Error verifying payment ${reference}:`, error);
    throw error;
  }
};

/**
 * Process order with AliExpress using enhanced customer data
 */
exports.processAliExpressOrder = async (orderId) => {
  try {
    const order = exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Validate that customer information is complete for shipping
    if (!order.shippingAddress || !order.shippingAddress.fullName) {
      throw new Error('Complete shipping address is required for AliExpress order processing');
    }
    
    // Update order status to processing
    await exports.updateOrderStatus(orderId, {
      status: 'processing',
      aliexpressStatus: 'processing',
      aliexpressProcessingStartedAt: new Date().toISOString()
    });
    
    console.log('Starting AliExpress order processing for order:', orderId);
    
    // Process each item in the order
    const aliExpressOrders = [];
    const failedItems = [];
    
    for (const item of order.items) {
      try {
        console.log(`Processing item ${item.id} for AliExpress...`);
        
        // Prepare AliExpress order data with enhanced customer information
        const aliExpressOrderData = {
          productId: item.aliExpressProductId || item.id,
          quantity: item.quantity,
          variantId: item.aliExpressVariantId || item.sku,
          
          // Enhanced shipping address using the new structure
          logistics_address: {
            contact_person: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            address: order.shippingAddress.address,
            city: order.shippingAddress.city,
            province: order.shippingAddress.state,
            country: order.shippingAddress.country,
            zip: order.shippingAddress.zipCode
          },
          
          // Order metadata
          order_memo: `GameZone Pro Order #${order.orderNumber} - Customer: ${order.customer.fullName}${order.notes ? ' - ' + order.notes : ''}`,
          
          // Product details
          unit_price: {
            amount: item.price,
            currency_code: 'USD'
          }
        };
        
        // Process order item (simplified without external API)
        const processedOrder = {
          localItemId: item.id,
          localOrderId: order.id,
          processedAt: new Date().toISOString(),
          status: 'processed',
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        };
        
        aliExpressOrders.push(processedOrder);
        
        console.log(`Successfully processed item ${item.id}`);
        
      } catch (itemError) {
        console.error(`Failed to process item ${item.id} for AliExpress:`, itemError);
        failedItems.push({
          itemId: item.id,
          itemName: item.name,
          error: itemError.message,
          failedAt: new Date().toISOString()
        });
      }
    }
    
    // Determine overall status based on results
    let finalStatus = 'ordered';
    let aliexpressStatus = 'completed';
    
    if (failedItems.length > 0) {
      if (aliExpressOrders.length === 0) {
        // All items failed
        finalStatus = 'error';
        aliexpressStatus = 'failed';
      } else {
        // Some items failed
        finalStatus = 'partially_ordered';
        aliexpressStatus = 'partial';
      }
    }
    
    // Update order with AliExpress order information
    await exports.updateOrderStatus(orderId, {
      aliExpressOrders: aliExpressOrders,
      aliexpressFailedItems: failedItems,
      status: finalStatus,
      aliexpressStatus: aliexpressStatus,
      aliexpressProcessingCompletedAt: new Date().toISOString(),
      aliexpressOrderCount: aliExpressOrders.length,
      aliexpressFailedCount: failedItems.length
    });
    
    console.log('AliExpress order processing completed:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      successfulOrders: aliExpressOrders.length,
      failedItems: failedItems.length,
      finalStatus: finalStatus
    });
    
    // Send notification email about AliExpress processing results
    try {
      await emailService.sendAliExpressProcessingNotification(order.id, {
        successfulOrders: aliExpressOrders.length,
        failedItems: failedItems.length,
        aliExpressOrders: aliExpressOrders
      });
    } catch (emailError) {
      console.error('Error sending AliExpress processing notification:', emailError);
    }
    
    return {
      success: aliExpressOrders.length > 0,
      order: exports.getOrderById(orderId),
      aliExpressOrders: aliExpressOrders,
      failedItems: failedItems,
      summary: {
        totalItems: order.items.length,
        successfulOrders: aliExpressOrders.length,
        failedItems: failedItems.length
      }
    };
    
  } catch (error) {
    console.error(`Error processing AliExpress order for order ${orderId}:`, error);
    
    // Update order status to error
    try {
      await exports.updateOrderStatus(orderId, {
        status: 'error',
        aliexpressStatus: 'failed',
        aliexpressError: error.message,
        aliexpressErrorAt: new Date().toISOString()
      });
    } catch (updateError) {
      console.error('Error updating order status after AliExpress failure:', updateError);
    }
    
    throw error;
  }
};

/**
 * Retry failed AliExpress orders
 */
exports.retryFailedAliExpressOrders = async () => {
  try {
    const failedOrders = await sql`
      SELECT * FROM orders 
      WHERE status IN ('error', 'partially_ordered')
      ORDER BY updated_at DESC
    `;
    
    console.log(`Found ${failedOrders.length} orders with AliExpress issues to retry`);
    
    const retryResults = [];
    
    for (const order of failedOrders) {
      try {
        console.log(`Retrying AliExpress processing for order ${order.id}`);
        const result = await exports.processAliExpressOrder(order.id);
        retryResults.push({
          orderId: order.id,
          success: result.success,
          summary: result.summary
        });
      } catch (error) {
        console.error(`Retry failed for order ${order.id}:`, error);
        retryResults.push({
          orderId: order.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      totalRetried: failedOrders.length,
      results: retryResults,
      successful: retryResults.filter(r => r.success).length,
      failed: retryResults.filter(r => !r.success).length
    };
    
  } catch (error) {
    console.error('Error retrying failed AliExpress orders:', error);
    throw error;
  }
};

/**
 * Get customer order history
 */
exports.getCustomerOrderHistory = async (customerEmail) => {
  const rows = await sql`
    SELECT * FROM orders 
    WHERE customer_info->>'email' = ${customerEmail}
    ORDER BY created_at DESC
  `;
  return rows;
};

/**
 * Get orders requiring AliExpress retry
 */
exports.getOrdersRequiringAliExpressRetry = async () => {
  const rows = await sql`
    SELECT * FROM orders WHERE status IN ('error', 'partially_ordered')
  `;
  return rows;
};

/**
 * Update order with tracking information
 */
exports.updateOrderTracking = async (orderId, trackingInfo) => {
  try {
    const order = await exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Persist tracking info and status
    await sql`
      UPDATE orders
      SET 
        tracking_info = ${JSON.stringify(trackingInfo)},
        status = ${'shipped'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `;
    
    // Send shipping confirmation email
    await emailService.sendShippingConfirmation(orderId, trackingInfo);
    
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
    return { success: true, order: updated };
  } catch (error) {
    console.error(`Error updating tracking for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Mark order as delivered
 */
exports.markOrderDelivered = async (orderId) => {
  try {
    const order = await exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Persist delivery status
    await sql`
      UPDATE orders
      SET 
        status = ${'delivered'},
        delivered_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `;
    
    // Send delivery confirmation email
    await emailService.sendDeliveryConfirmation(orderId);
    
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
    return { success: true, order: updated };
  } catch (error) {
    console.error(`Error marking order ${orderId} as delivered:`, error);
    throw error;
  }
};

/**
 * Get all orders
 */
exports.getAllOrders = async () => {
  try {
    const orders = await sql`
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `;
    return orders;
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
};

/**
 * Get orders by status
 */
exports.getOrdersByStatus = async (status) => {
  try {
    const orders = await sql`
      SELECT * FROM orders 
      WHERE status = ${status}
      ORDER BY created_at DESC
    `;
    return orders;
  } catch (error) {
    console.error('Error getting orders by status:', error);
    throw error;
  }
};

/**
 * Get orders by customer email
 */
exports.getOrdersByCustomer = async (email) => {
  try {
    const orders = await sql`
      SELECT * FROM orders 
      WHERE customer_info->>'email' = ${email}
      ORDER BY created_at DESC
    `;
    return orders;
  } catch (error) {
    console.error('Error getting orders by customer:', error);
    throw error;
  }
};

// ===== ADMIN & TEMU INTEGRATION FUNCTIONS =====

/**
 * Calculate profit margin for products
 */
function calculateProfitMargin(wholesaleCost, targetMargin = 0.30) {
  const retailPrice = wholesaleCost / (1 - targetMargin);
  const profit = retailPrice - wholesaleCost;
  return {
    wholesaleCost,
    retailPrice: Math.ceil(retailPrice * 100) / 100, // Round up to nearest cent
    profit: Math.ceil(profit * 100) / 100,
    marginPercentage: targetMargin * 100
  };
}

/**
 * Get inventory data with profit calculations
 */
exports.getInventoryWithProfitMargins = () => {
  // This would typically fetch from your product database
  // For now, using the GameSir controller data from script.js
  const products = [
    {
      id: 'gamesir-nova-lite',
      name: 'GameSir Nova Lite Gaming Controller',
      temuUrl: 'https://www.temu.com/gh/--lite-wireless-gaming-controller-ergonomic-wireless-wired--for-switch-for--ios-pc-steam-games-turbo-function-hall-effect-sticks-g-601099548838966.html',
      variants: [
        { color: 'Black', wholesaleCost: 12.50, stock: 15 },
        { color: 'White', wholesaleCost: 12.50, stock: 12 },
        { color: 'Blue', wholesaleCost: 12.50, stock: 8 },
        { color: 'Red', wholesaleCost: 12.50, stock: 10 }
      ]
    }
  ];

  return products.map(product => ({
    ...product,
    variants: product.variants.map(variant => ({
      ...variant,
      pricing: calculateProfitMargin(variant.wholesaleCost)
    }))
  }));
};

/**
 * Process Temu order for customer
 */
exports.processTemuOrder = async (orderId, adminNotes = '') => {
  try {
    const order = await exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Simulate Temu API call (replace with actual Temu API integration)
    const temuOrderData = {
      customerAddress: order.shippingAddress,
      items: order.items.map(item => ({
        productId: item.id,
        color: item.color || 'Black',
        quantity: item.quantity,
        temuUrl: item.temuUrl || 'https://www.temu.com/gh/--lite-wireless-gaming-controller-ergonomic-wireless-wired--for-switch-for--ios-pc-steam-games-turbo-function-hall-effect-sticks-g-601099548838966.html'
      })),
      totalCost: order.items.reduce((total, item) => total + (item.wholesaleCost * item.quantity), 0)
    };

    // Simulate Temu order placement
    const temuResponse = await simulateTemuOrderPlacement(temuOrderData);
    
    // Update order with Temu information in DB
    await sql`
      UPDATE orders
      SET temu_order_id = ${temuResponse.orderId}, status = ${'processing'}, admin_notes = ${adminNotes}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order.id}
    `;
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
    
    // Send customer notification
    if (emailService) {
      try {
        await emailService.sendOrderConfirmation(updated.id);
      } catch (emailError) {
        console.error('Error sending order processing email:', emailError);
      }
    }
    
    return {
      success: true,
      temuOrderId: temuResponse.orderId,
      trackingNumber: temuResponse.trackingNumber,
      estimatedDelivery: temuResponse.estimatedDelivery
    };
  } catch (error) {
    console.error('Error processing Temu order:', error);
    throw error;
  }
};

/**
 * Simulate Temu order placement (replace with actual API)
 */
async function simulateTemuOrderPlacement(orderData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    orderId: `TEMU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trackingNumber: `TM${Date.now().toString().slice(-8)}`,
    estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed'
  };
}

/**
 * Update Temu order status and tracking
 */
exports.updateTemuOrderStatus = async (orderId, temuStatus, trackingInfo = {}) => {
  try {
    const order = await exports.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Merge tracking info and update status
    const mergedTracking = { ...(order.tracking_info || {}), ...trackingInfo };
    let newStatus = order.status;
    let deliveredAt = null;
    if (temuStatus === 'shipped') {
      newStatus = 'shipped';
    } else if (temuStatus === 'delivered') {
      newStatus = 'delivered';
      deliveredAt = new Date().toISOString();
    }
    await sql`
      UPDATE orders
      SET status = ${newStatus}, tracking_info = ${JSON.stringify(mergedTracking)}, updated_at = CURRENT_TIMESTAMP, delivered_at = ${deliveredAt}
      WHERE id = ${order.id}
    `;
    const [updated] = await sql`SELECT * FROM orders WHERE id = ${order.id}`;
    
    // Send notifications
    if (emailService) {
      try {
        if (temuStatus === 'shipped') {
          await emailService.sendShippingConfirmation(order.id);
        } else if (temuStatus === 'delivered') {
          await emailService.sendDeliveryConfirmation(order.id);
        }
      } catch (emailError) {
        console.error('Error sending Temu status email:', emailError);
      }
    }
    
    return { success: true, order: updated };
  } catch (error) {
    console.error('Error updating Temu order status:', error);
    throw error;
  }
};

/**
 * Get admin dashboard statistics
 */
exports.getAdminStats = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get all orders
    const allOrders = await sql`SELECT * FROM orders`;
    
    // Calculate stats
    const todayOrders = allOrders.filter(order => new Date(order.created_at) >= today);
    const weekOrders = allOrders.filter(order => new Date(order.created_at) >= thisWeek);
    const monthOrders = allOrders.filter(order => new Date(order.created_at) >= thisMonth);
    
    const pendingOrders = allOrders.filter(order => order.status === 'pending');
    const processingOrders = allOrders.filter(order => order.status === 'processing');
    const shippedOrders = allOrders.filter(order => order.status === 'shipped');
    
    // Default revenue derived from completed Neon orders (fallback)
    let totalRevenueFallback = allOrders
      .filter(order => order.payment_status === 'completed')
      .reduce((total, order) => total + parseFloat(order.total_amount), 0);
    
    const totalProfit = allOrders
      .filter(order => order.payment_status === 'completed')
      .reduce((total, order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const orderProfit = items.reduce((itemTotal, item) => {
          const wholesaleCost = item.wholesaleCost || 21.43; // Default GameSir cost
          const profit = (item.price - wholesaleCost) * item.quantity;
          return itemTotal + profit;
        }, 0);
        return total + orderProfit;
      }, 0);
    
    // Derive totals from Paystack transactions (source of truth)
    let paystackOrderCount = 0;
    let paystackRevenue = 0;
    const currencyCounts = {};
    let dominantCurrency = null;
    try {
      const paystackApi = require('../api/paystack-api');
      const perPage = 100;
      let page = 1;
      // Limit pagination to avoid heavy loads; adjust as needed
      while (page <= 3) {
        const txResp = await paystackApi.listTransactions({ status: 'success', perPage, page });
        const txs = Array.isArray(txResp?.data) ? txResp.data : [];
        txs.forEach(tx => {
          paystackOrderCount += 1;
          // Paystack amounts are in the smallest unit (e.g. kobo); normalize by /100
          const amt = Number(tx.amount || 0) / 100;
          paystackRevenue += amt;
          const cur = (tx.currency || 'NGN').toUpperCase();
          currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
        });
        if (txs.length < perPage) break;
        page += 1;
      }
      dominantCurrency = Object.keys(currencyCounts).sort((a, b) => (currencyCounts[b] || 0) - (currencyCounts[a] || 0))[0] || null;
    } catch (err) {
      console.warn('Failed to fetch Paystack transactions for stats:', err.message);
    }

    const finalTotalOrders = paystackOrderCount || allOrders.length;
    const finalTotalRevenue = paystackRevenue || totalRevenueFallback;
    const finalProfitMargin = finalTotalRevenue > 0 ? Math.round((totalProfit / finalTotalRevenue) * 100) : 0;

    return {
      totalOrders: finalTotalOrders,
      todayOrders: todayOrders.length,
      weekOrders: weekOrders.length,
      monthOrders: monthOrders.length,
      pendingOrders: pendingOrders.length,
      processingOrders: processingOrders.length,
      shippedOrders: shippedOrders.length,
      totalRevenue: Math.round(finalTotalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: finalProfitMargin,
      revenueCurrency: dominantCurrency // may be null; frontend should handle display
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    throw error;
  }
};

/**
 * Get orders for admin dashboard with pagination
 */
exports.getAdminOrders = async (page = 1, limit = 20, status = 'all') => {
  try {
    let query;
    
    if (status !== 'all') {
      query = sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`;
    } else {
      query = sql`SELECT * FROM orders ORDER BY created_at DESC`;
    }
    
    const allOrders = await query;

    // Build a transaction map from Paystack to override Neon order fields
    // Keys: orderId, orderNumber, reference
    const txByKey = new Map();
    try {
      const paystackApi = require('../api/paystack-api');
      const perPage = 100;
      const statuses = ['success', 'failed', 'abandoned'];
      for (const st of statuses) {
        let p = 1;
        // Limit pages to avoid heavy loads; adjust as needed
        while (p <= 3) {
          const txResp = await paystackApi.listTransactions({ status: st, perPage, page: p });
          const txs = Array.isArray(txResp?.data) ? txResp.data : [];
          txs.forEach(tx => {
            const md = tx.metadata || {};
            const keys = [
              md.orderId,
              md.order_id,
              md.orderNumber,
              md.order_number,
              tx.reference
            ].filter(Boolean).map(v => String(v));
            keys.forEach(k => {
              if (!txByKey.has(k)) txByKey.set(k, tx);
            });
          });
          if (txs.length < perPage) break;
          p += 1;
        }
      }
    } catch (refErr) {
      console.warn('Paystack transactions fetch failed for admin orders mapping:', refErr.message);
    }
    
    // Normalize order fields from Paystack: status, payment_status, total_amount
    const normalizedOrders = allOrders.map(order => {
      let out = { ...order };
      const matchKeys = [
        order.id && String(order.id),
        order.order_number && String(order.order_number),
        order.payment_reference && String(order.payment_reference)
      ].filter(Boolean);
      const tx = matchKeys.map(k => txByKey.get(k)).find(Boolean);

      if (tx) {
        const txStatus = (tx.status || '').toLowerCase();
        // payment_status
        if (txStatus === 'success') out.payment_status = 'completed';
        else if (txStatus === 'failed') out.payment_status = 'failed';
        else if (txStatus === 'abandoned') out.payment_status = 'abandoned';

        // status
        if (txStatus === 'success') out.status = 'paid';
        else if (txStatus === 'failed') out.status = 'failed';
        else if (txStatus === 'abandoned' && (out.status === 'pending' || out.status === 'processing')) {
          out.status = 'pending';
        }

        // amount override from Paystack (minor units → major)
        if (typeof tx.amount === 'number') {
          const majorAmount = Math.round((tx.amount / 100 + Number.EPSILON) * 100) / 100;
          out.total_amount = majorAmount;
        }
      } else {
        // If no tx found but DB says completed, keep 'paid'
        if ((out.payment_status === 'completed') && (out.status === 'pending' || out.status === 'processing')) {
          out.status = 'paid';
        }
      }

      return out;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = normalizedOrders.slice(startIndex, endIndex);
    
    return {
      orders: paginatedOrders,
      totalOrders: normalizedOrders.length,
      totalPages: Math.ceil(normalizedOrders.length / limit),
      currentPage: page,
      hasNextPage: endIndex < normalizedOrders.length,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('Error getting admin orders:', error);
    throw error;
  }
};
