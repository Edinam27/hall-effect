// Email Service Module
// Handles sending emails for order confirmations and shipping updates

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Create email transporter
let transporter;

/**
 * Initialize the email service
 */
exports.initialize = () => {
  // Create a transporter object using SMTP transport
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.error('Email service initialization failed:', error);
    } else {
      console.log('Email service ready to send messages');
    }
  });
};

/**
 * Load and compile an email template
 */
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  return handlebars.compile(templateSource);
}

/**
 * Send an email
 */
async function sendEmail(options) {
  if (!transporter) {
    exports.initialize();
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'GameZone Pro'}" <${process.env.EMAIL_FROM || 'noreply@gamezonepro.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send order confirmation email
 */
exports.sendOrderConfirmation = async (orderId) => {
  try {
    // Get order details
    const orderService = require('./order-service');
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Prepare template data
    const templateData = {
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: (item.price * item.quantity).toFixed(2)
      })),
      subtotal: order.subtotal.toFixed(2),
      shipping: order.shipping.toFixed(2),
      tax: order.tax.toFixed(2),
      total: order.total.toFixed(2),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      estimatedDelivery: order.estimatedDelivery
    };
    
    // Load and compile template
    let template;
    try {
      template = loadTemplate('order-confirmation');
    } catch (error) {
      // Fallback to inline template if file not found
      console.warn('Order confirmation template not found, using fallback template');
      template = handlebars.compile(`
        <h1>Thank you for your order!</h1>
        <p>Hello {{customerName}},</p>
        <p>Your order #{{orderNumber}} has been confirmed and is being processed.</p>
        <h2>Order Summary</h2>
        <table>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          {{#each items}}
          <tr>
            <td>{{name}}</td>
            <td>{{quantity}}</td>
            <td>${{price}}</td>
            <td>${{total}}</td>
          </tr>
          {{/each}}
        </table>
        <p><strong>Subtotal:</strong> ${{subtotal}}</p>
        <p><strong>Shipping:</strong> ${{shipping}}</p>
        <p><strong>Tax:</strong> ${{tax}}</p>
        <p><strong>Total:</strong> ${{total}}</p>
        <h2>Shipping Information</h2>
        <p>{{shippingAddress.name}}</p>
        <p>{{shippingAddress.street}}</p>
        <p>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zip}}</p>
        <p>{{shippingAddress.country}}</p>
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        <p>Thank you for shopping with GameZone Pro!</p>
      `);
    }
    
    // Render template with data
    const html = template(templateData);
    
    // Send email
    await sendEmail({
      to: order.customer.email,
      subject: `GameZone Pro - Order Confirmation #${order.orderNumber}`,
      html
    });
    
    console.log(`Order confirmation email sent for order ${orderId}`);
    return true;
  } catch (error) {
    console.error(`Error sending order confirmation email for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Send shipping confirmation email
 */
exports.sendShippingConfirmation = async (orderId, trackingInfo) => {
  try {
    // Get order details
    const orderService = require('./order-service');
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Prepare template data
    const templateData = {
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      trackingNumber: trackingInfo.trackingNumber,
      trackingUrl: trackingInfo.trackingUrl,
      carrier: trackingInfo.carrier,
      estimatedDelivery: trackingInfo.estimatedDelivery || order.estimatedDelivery,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      })),
      shippingAddress: order.shippingAddress
    };
    
    // Load and compile template
    let template;
    try {
      template = loadTemplate('shipping-confirmation');
    } catch (error) {
      // Fallback to inline template if file not found
      console.warn('Shipping confirmation template not found, using fallback template');
      template = handlebars.compile(`
        <h1>Your Order Has Shipped!</h1>
        <p>Hello {{customerName}},</p>
        <p>Great news! Your order #{{orderNumber}} has been shipped and is on its way to you.</p>
        <h2>Tracking Information</h2>
        <p><strong>Carrier:</strong> {{carrier}}</p>
        <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
        <p><strong>Tracking Link:</strong> <a href="{{trackingUrl}}">Click here to track your package</a></p>
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        <h2>Order Summary</h2>
        <ul>
          {{#each items}}
          <li>{{name}} (Qty: {{quantity}})</li>
          {{/each}}
        </ul>
        <h2>Shipping Address</h2>
        <p>{{shippingAddress.name}}</p>
        <p>{{shippingAddress.street}}</p>
        <p>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zip}}</p>
        <p>{{shippingAddress.country}}</p>
        <p>Thank you for shopping with GameZone Pro!</p>
      `);
    }
    
    // Render template with data
    const html = template(templateData);
    
    // Send email
    await sendEmail({
      to: order.customer.email,
      subject: `GameZone Pro - Your Order #${order.orderNumber} Has Shipped!`,
      html
    });
    
    console.log(`Shipping confirmation email sent for order ${orderId}`);
    return true;
  } catch (error) {
    console.error(`Error sending shipping confirmation email for order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Send delivery confirmation email
 */
exports.sendDeliveryConfirmation = async (orderId) => {
  try {
    // Get order details
    const orderService = require('./order-service');
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Prepare template data
    const templateData = {
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      }))
    };
    
    // Load and compile template
    let template;
    try {
      template = loadTemplate('delivery-confirmation');
    } catch (error) {
      // Fallback to inline template if file not found
      console.warn('Delivery confirmation template not found, using fallback template');
      template = handlebars.compile(`
        <h1>Your Order Has Been Delivered!</h1>
        <p>Hello {{customerName}},</p>
        <p>Your order #{{orderNumber}} has been delivered. We hope you enjoy your new gaming controller!</p>
        <h2>Order Summary</h2>
        <ul>
          {{#each items}}
          <li>{{name}} (Qty: {{quantity}})</li>
          {{/each}}
        </ul>
        <p>If you have any questions or need assistance with your product, please visit our <a href="https://gamezonepro.com/support">support page</a>.</p>
        <p>Thank you for shopping with GameZone Pro!</p>
      `);
    }
    
    // Render template with data
    const html = template(templateData);
    
    // Send email
    await sendEmail({
      to: order.customer.email,
      subject: `GameZone Pro - Your Order #${order.orderNumber} Has Been Delivered!`,
      html
    });
    
    console.log(`Delivery confirmation email sent for order ${orderId}`);
    return true;
  } catch (error) {
    console.error(`Error sending delivery confirmation email for order ${orderId}:`, error);
    throw error;
  }
};