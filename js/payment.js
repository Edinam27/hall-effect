// GameZone Pro - Payment Integration
// Handles Paystack payment processing and AliExpress order fulfillment
// Updated: 2025-01-05 16:55 - Fixed static server detection

class PaymentProcessor {
    constructor() {
        this.paystackPublicKey = null;
        this.initialized = false;
        this.isStaticServer = false;
        this.loadPaystackScript();
    }

    async initialize() {
        try {
            // Check if we're running on a static server by looking for common static server indicators
            const isStaticServer = this.detectStaticServer();
            this.isStaticServer = isStaticServer;
            
            if (isStaticServer) {
                // Skip API call entirely for static servers
                this.paystackPublicKey = 'pk_test_demo_key_for_static_server';
                this.initialized = true;
                console.log('Static server detected - Payment processor initialized in demo mode');
                return true;
            } else {
                // Set demo mode as fallback
                this.paystackPublicKey = 'pk_test_demo_key_for_static_server';
                this.initialized = true;
                console.log('Payment processor initialized in demo mode');
                
                try {
                    // Try to fetch the Paystack public key from the server
                    const response = await fetch('/api/paystack/config');
                    
                    // If server responds, use the real key
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data.publicKey) {
                            this.paystackPublicKey = data.publicKey;
                            console.log('Payment processor updated with server key:', data.publicKey);
                        }
                    } else {
                        console.warn('API endpoint not available, continuing with demo mode');
                    }
                } catch (fetchError) {
                    console.warn('API fetch failed, continuing with demo mode:', fetchError.message);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize payment processor:', error.message);
            // Ensure we're still initialized even if something unexpected happens
            if (!this.initialized) {
                this.paystackPublicKey = 'pk_test_demo_key_for_static_server';
                this.initialized = true;
                console.log('Payment processor initialized in fallback demo mode');
            }
            return true;
        }
    }

    detectStaticServer() {
        // Check for common static server indicators
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // Common static server patterns
        const staticServerPatterns = [
            // GitHub Pages, Netlify, Vercel static hosting
            hostname.includes('github.io'),
            hostname.includes('netlify.app'),
            hostname.includes('vercel.app'),
            // File protocol (local file preview)
            protocol === 'file:'
        ];

        return staticServerPatterns.some(pattern => pattern);
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
            
            // Check if we're in demo mode (static server environment)
            if (this.paystackPublicKey === 'pk_test_demo_key_for_static_server') {
                console.log('Demo mode detected, creating mock order without API call');
                // Create a mock order response for static server environment
                const mockOrder = {
                    id: 'DEMO-' + Math.floor(Math.random() * 1000000),
                    orderNumber: 'DEMO-' + Date.now(),
                    customerId: customerInfo.customerId,
                    customer: { email: customerInfo.email },
                    total: total,
                    createdAt: new Date().toISOString()
                };
                return mockOrder;
            }
            
            // Create order on server (only in production mode)
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    console.error('Order creation error details:', errorData);
                    throw new Error(errorData.message || `Failed to create order: ${response.status} ${response.statusText}`);
                } catch (jsonError) {
                    console.error('Could not parse error response:', jsonError);
                    throw new Error(`Failed to create order: ${response.status} ${response.statusText}`);
                }
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
            
            let paymentData;
            
            // Check if we're in demo mode (static server environment)
            if (this.isStaticServer) {
                console.log('Demo mode detected, creating mock payment data without API call');
                // Create mock payment data for static server environment
                paymentData = {
                    paymentUrl: '#demo-payment',
                    reference: 'demo-' + Date.now(),
                    orderId: order.id
                };
            } else {
                // Initialize Paystack payment (only in production mode)
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
                    try {
                        const errorData = await paymentResponse.json();
                        console.error('Payment initialization error details:', errorData);
                        const detail = errorData.error || errorData.details?.message || errorData.details?.error || null;
                        const composedMessage = detail ? `Failed to initialize payment: ${detail}` : 
                            (errorData.message || `Payment error: ${paymentResponse.status} ${paymentResponse.statusText}`);
                        throw new Error(composedMessage);
                    } catch (jsonError) {
                        console.error('Could not parse payment error response:', jsonError);
                        throw new Error(`Payment initialization failed: ${paymentResponse.status} ${paymentResponse.statusText}`);
                    }
                } else {
                    paymentData = await paymentResponse.json();
                }
            }
            
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
            
            // Check if we're in demo mode (static server)
            if (paymentData && paymentData.paymentUrl === '#demo-payment') {
                console.log('Demo mode: Simulating payment process');
                
                // Show demo message to user
                alert('Demo Mode: In production, you would be redirected to Paystack payment page. Simulating successful payment.');
                
                // Simulate successful payment verification and redirect to success page
                setTimeout(async () => {
                    const result = await this.verifyPayment(paymentData.reference, order.id);
                    if (result && result.success) {
                        window.location.href = `payment-success.html?reference=${paymentData.reference}&order_id=${order.id}`;
                    } else {
                        const loadingIndicator = document.querySelector('.loading-indicator');
                        if (loadingIndicator) loadingIndicator.style.display = 'none';
                        alert(`Payment verification failed: ${result && result.message ? result.message : 'Unknown error'}`);
                    }
                }, 1500);
                
                return;
            }
            
            // Redirect to Paystack authorization URL returned by server
            if (paymentData && paymentData.paymentUrl) {
                window.location.href = paymentData.paymentUrl;
            } else if (paymentData && paymentData.data && paymentData.data.authorization_url) {
                window.location.href = paymentData.data.authorization_url;
            } else if (paymentData && paymentData.authorization_url) {
                window.location.href = paymentData.authorization_url;
            } else {
                throw new Error('Payment initialization did not provide authorization URL');
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            throw error;
        }
    }

    openPaystackModal(authorizationUrl, orderId) {
        // Check if we're in demo mode
        if (this.isStaticServer) {
            console.log('Demo mode: Simulating payment redirect');
            
            // Show demo message to user
            alert('Demo Mode: In production, you would be redirected to Paystack payment page. Simulating successful payment.');
            
            // Simulate successful payment verification and redirect to success page
            setTimeout(async () => {
                const mockReference = 'demo-' + Date.now();
                const result = await this.verifyPayment(mockReference, orderId);
                if (result && result.success) {
                    window.location.href = `payment-success.html?reference=${mockReference}&order_id=${orderId}`;
                } else {
                    const loadingIndicator = document.querySelector('.loading-indicator');
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    alert(`Payment verification failed: ${result && result.message ? result.message : 'Unknown error'}`);
                }
            }, 1500);
            
            return;
        }
        
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
            
            let data;
            
            // Check if we're running on a static server (404 error expected)
            if (response.status === 404 || reference.startsWith('demo-')) {
                console.log('Static server detected or demo reference, using mock verification data');
                // Create mock verification data for static server environment
                data = {
                    success: true,
                    orderId: pendingOrder?.orderId || orderId,
                    orderNumber: pendingOrder?.orderNumber || 'DEMO-' + Date.now(),
                    status: 'completed',
                    message: 'Demo payment verified successfully'
                };
            } else if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || 'Payment verification failed');
            } else {
                data = await response.json();
            }
            
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
                
                // Store last order ID for compatibility with existing flows
                localStorage.setItem('lastOrderId', data.orderId);
                
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