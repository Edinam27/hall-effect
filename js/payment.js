// GameZone Pro - Payment Integration
// Handles Paystack payment processing and AliExpress order fulfillment

class PaymentProcessor {
    constructor() {
        this.paystackPublicKey = null;
        this.initialized = false;
        this.loadPaystackScript();
    }

    async initialize() {
        try {
            // Fetch the Paystack public key from the server
            const response = await fetch('/api/paystack/config');
            
            // Check if we're running on a static server (development mode)
            if (!response.ok) {
                console.warn('API endpoint not available, using demo mode for static server');
                this.paystackPublicKey = 'pk_test_demo_key_for_static_server';
                this.initialized = true;
                console.log('Payment processor initialized in demo mode');
                return true;
            }
            
            const data = await response.json();
            
            if (data.publicKey) {
                this.paystackPublicKey = data.publicKey;
                this.initialized = true;
                console.log('Payment processor initialized successfully with key:', data.publicKey);
                return true;
            } else {
                console.error('Failed to initialize payment processor: No public key received');
                return false;
            }
        } catch (error) {
            console.warn('API endpoint not available, using demo mode for static server:', error.message);
            this.paystackPublicKey = 'pk_test_demo_key_for_static_server';
            this.initialized = true;
            console.log('Payment processor initialized in demo mode');
            return true;
        }
    }

    loadPaystackScript() {
        // Load the Paystack script if it's not already loaded
        if (!document.getElementById('paystack-script')) {
            const script = document.createElement('script');
            script.id = 'paystack-script';
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            
            script.onload = () => {
                console.log('Paystack script loaded');
            };
            
            script.onerror = () => {
                console.error('Failed to load Paystack script');
            };
            
            document.head.appendChild(script);
        }
    }

    async processCheckout(customerInfo) {
        try {
            // Validate customer information
            if (!customerInfo || !customerInfo.customerId) {
                throw new Error('Customer information is required and must include customer ID');
            }
            
            // Get cart data
            const cart = JSON.parse(localStorage.getItem('gamezonepro_cart') || '[]');
            
            if (cart.length === 0) {
                throw new Error('Cart is empty');
            }
            
            // Calculate totals
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            const shipping = 0; // Always free shipping
            const tax = subtotal * 0.07;
            const total = subtotal + shipping + tax;
            
            // Create enhanced order data with customer information
            const orderData = {
                customerInfo: {
                    customerId: customerInfo.customerId,
                    fullName: customerInfo.fullName,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    address: customerInfo.address,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    zipCode: customerInfo.zipCode,
                    country: customerInfo.country,
                    notes: customerInfo.notes || ''
                },
                items: cart.map(item => ({
                    ...item,
                    // Ensure AliExpress product mapping if available
                    aliExpressProductId: item.aliExpressProductId || item.id,
                    aliExpressVariantId: item.aliExpressVariantId || item.sku
                })),
                subtotal,
                shipping,
                tax,
                total,
                paymentMethod: 'paystack'
            };
            
            console.log('Creating order with enhanced customer data:', {
                customerId: orderData.customerInfo.customerId,
                customerEmail: orderData.customerInfo.email,
                itemCount: orderData.items.length,
                total: orderData.total
            });
            
            // Create order on server
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || 'Failed to create order');
            }
            
            const responseData = await response.json();
            const order = responseData.order || responseData; // Handle both response formats
            
            console.log('Order created successfully:', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerId: order.customerId,
                fullOrderObject: order,
                rawResponse: responseData
            });
            
            // Verify order.id exists before payment initialization
            if (!order.id) {
                console.error('Order ID is missing from server response:', { order, responseData });
                throw new Error('Order ID not received from server');
            }
            
            // Initialize Paystack payment
            const paymentResponse = await fetch(`/api/payment/initialize/${order.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: customerInfo.email,
                    customerId: customerInfo.customerId
                })
            });
            
            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || 'Failed to initialize payment');
            }
            
            const paymentData = await paymentResponse.json();
            
            // Store comprehensive order information for verification
            localStorage.setItem('gamezonepro_pending_order', JSON.stringify({
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerId: order.customerId,
                customerEmail: order.customer.email,
                total: order.total,
                createdAt: order.createdAt
            }));
            
            console.log('Payment initialized, redirecting to Paystack...');
            
            // Redirect to Paystack
            window.location.href = paymentData.paymentUrl;
            
        } catch (error) {
            console.error('Checkout error:', error);
            throw error;
        }
    }

    openPaystackModal(authorizationUrl, orderId) {
        // Log the redirect for debugging
        console.log('Redirecting to Paystack payment page:', authorizationUrl);
        
        // Store the current URL to return to after payment
        localStorage.setItem('returnToCheckout', window.location.href);
        
        // Redirect to the Paystack authorization URL
        window.location.href = authorizationUrl;
    }

    async verifyPayment(reference, orderId) {
        try {
            // Get pending order information
            const pendingOrderData = localStorage.getItem('gamezonepro_pending_order');
            let pendingOrder = null;
            
            if (pendingOrderData) {
                try {
                    pendingOrder = JSON.parse(pendingOrderData);
                } catch (e) {
                    console.warn('Failed to parse pending order data:', e);
                }
            }
            
            console.log('Verifying payment with reference:', reference);
            console.log('Pending order:', pendingOrder);
            
            const response = await fetch(`/api/paystack/verify/${reference}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: pendingOrder?.orderId || orderId,
                    customerId: pendingOrder?.customerId
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || 'Payment verification failed');
            }
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Payment verified successfully:', {
                    orderId: data.orderId,
                    orderNumber: data.orderNumber,
                    status: data.status
                });
                
                // Clear cart and pending order data
                localStorage.removeItem('gamezonepro_cart');
                localStorage.removeItem('gamezonepro_pending_order');
                
                // Store successful order information for confirmation page
                localStorage.setItem('gamezonepro_last_order', JSON.stringify({
                    orderId: data.orderId,
                    orderNumber: data.orderNumber,
                    customerId: data.customerId,
                    customerEmail: data.customerEmail,
                    total: data.total,
                    status: data.status,
                    aliExpressStatus: data.aliExpressStatus,
                    verifiedAt: new Date().toISOString()
                }));
                
                return {
                    success: true,
                    orderId: data.orderId,
                    orderNumber: data.orderNumber,
                    customerId: data.customerId,
                    aliExpressStatus: data.aliExpressStatus,
                    message: 'Payment successful! Your order has been processed and will be forwarded to AliExpress.'
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Payment verification failed'
                };
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            return {
                success: false,
                message: error.message || 'An error occurred during payment verification'
            };
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Order status update error:', error);
            return false;
        }
    }
}

// Create a global instance of the payment processor
const paymentProcessor = new PaymentProcessor();

// Initialize the payment processor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    paymentProcessor.initialize();
});

// Export the payment processor for use in other scripts
window.paymentProcessor = paymentProcessor;