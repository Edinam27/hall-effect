// GameZone Pro - Checkout Page Script
// Handles checkout form submission and payment processing

// Initialize variables (use global cart from script.js if available)
let checkoutCart = window.cart || [];
let subtotal = 0;
let shipping = 0;
let discount = 0;
let total = 0;

// Country codes mapping for international phone numbers is defined below

// DOM elements
const checkoutForm = document.getElementById('checkout-form');
const checkoutItemsContainer = document.getElementById('checkout-items');
const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
const checkoutShippingEl = document.getElementById('checkout-shipping');
const checkoutTaxEl = document.getElementById('checkout-tax');
const checkoutDiscountEl = document.getElementById('checkout-discount');
const checkoutTotalEl = document.getElementById('checkout-total');
const discountRowEl = document.getElementById('discount-row');

// Check if required elements exist
if (!checkoutForm || !checkoutItemsContainer) {
    console.warn('Required checkout elements not found on this page');
}

// Load cart data from localStorage
function loadCartFromStorage() {
    // Load cart from localStorage directly
    const savedCart = localStorage.getItem('gamezonepro_cart');
    if (savedCart) {
        checkoutCart = JSON.parse(savedCart);
    }
    
    // Update global cart if available
    if (window.cart !== undefined) {
        window.cart = checkoutCart;
    }
    
    // Check if we're on the payment success page
    const isPaymentSuccessPage = window.location.pathname.includes('payment-success.html');
    
    if (checkoutCart.length > 0) {
        updateCheckoutSummary();
        console.log('Cart loaded from storage:', checkoutCart);
    } else if (!isPaymentSuccessPage) {
        // Only redirect to home page if cart is empty and we're not on the payment success page
        console.log('Cart is empty, redirecting to home');
        window.location.href = 'index.html';
    } else {
        console.log('On payment success page with empty cart - this is expected after successful payment');
    }
}

// Update the checkout summary with cart items and totals
function updateCheckoutSummary() {
    // Clear the items container (with null check)
    if (checkoutItemsContainer) {
        checkoutItemsContainer.innerHTML = '';
    }
    
    // Calculate totals
    subtotal = 0;
    
    // Add each item to the summary
    checkoutCart.forEach(item => {
        // Skip bundle discount from item display but include in calculation
        if (item.id === 'bundle_discount') {
            subtotal += item.price * item.quantity;
            return;
        }
        
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        // Create item element
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                ${item.color ? `<div class="cart-item-variant">Color: ${item.color}</div>` : ''}
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
        `;
        
        if (checkoutItemsContainer) {
            checkoutItemsContainer.appendChild(itemElement);
        }
    });
    
    // Set shipping cost (always free)
    shipping = 0;
    
    // Calculate tax (7% of subtotal to match payment.js)
    const tax = subtotal * 0.07;
    
    // Get discount from localStorage if available
    const savedDiscount = localStorage.getItem('discount');
    if (savedDiscount) {
        const discountData = JSON.parse(savedDiscount);
        if (discountData.type === 'percentage') {
            discount = subtotal * (discountData.value / 100);
            if (discountRowEl) discountRowEl.style.display = 'flex';
        } else if (discountData.type === 'shipping') {
            shipping = 0;
            discount = 0;
            if (discountRowEl) discountRowEl.style.display = 'none';
        }
    } else {
        discount = 0;
        if (discountRowEl) discountRowEl.style.display = 'none';
    }
    
    // Calculate total (including tax to match payment.js)
    total = subtotal + shipping + tax - discount;
    
    // Update the summary elements (with null checks)
    if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (checkoutShippingEl) checkoutShippingEl.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (checkoutTaxEl) checkoutTaxEl.textContent = `$${tax.toFixed(2)}`;
    if (checkoutDiscountEl) checkoutDiscountEl.textContent = `-$${discount.toFixed(2)}`;
    if (checkoutTotalEl) checkoutTotalEl.textContent = `$${total.toFixed(2)}`;
    
    // Update cart count in the navbar and sync with global cart
    if (window.cart) {
        window.cart = checkoutCart;
    }
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = checkoutCart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Update global cart UI if function is available
    if (typeof window.updateCartUI === 'function') {
        window.updateCartUI();
    }
}

// Validate customer information form
function validateCustomerInfo(customerInfo) {
    const errors = [];
    
    // Required field validation
    if (!customerInfo.fullName || customerInfo.fullName.trim().length < 2) {
        errors.push('Full name must be at least 2 characters long');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.email || !emailRegex.test(customerInfo.email)) {
        errors.push('Please enter a valid email address');
    }
    
    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    if (!customerInfo.phone || !phoneRegex.test(customerInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Please enter a valid phone number');
    }
    
    // Address validation
    if (!customerInfo.address || customerInfo.address.trim().length < 5) {
        errors.push('Shipping address must be at least 5 characters long');
    }
    
    if (!customerInfo.city || customerInfo.city.trim().length < 2) {
        errors.push('City must be at least 2 characters long');
    }
    
    if (!customerInfo.state || customerInfo.state.trim().length < 2) {
        errors.push('State/Province must be at least 2 characters long');
    }
    
    if (!customerInfo.zipCode || customerInfo.zipCode.trim().length < 3) {
        errors.push('Zip/Postal code must be at least 3 characters long');
    }
    
    if (!customerInfo.country) {
        errors.push('Please select a country');
    }
    
    return errors;
}

// Save customer information locally
function saveCustomerInfoLocally(customerInfo) {
    try {
        // Create customer data object with timestamp
        const customerData = {
            ...customerInfo,
            savedAt: new Date().toISOString(),
            id: generateCustomerId()
        };
        
        // Save to localStorage
        localStorage.setItem('gamezonepro_customer_info', JSON.stringify(customerData));
        
        // Also maintain a history of customer information
        let customerHistory = JSON.parse(localStorage.getItem('gamezonepro_customer_history') || '[]');
        customerHistory.unshift(customerData);
        
        // Keep only last 5 customer records
        customerHistory = customerHistory.slice(0, 5);
        localStorage.setItem('gamezonepro_customer_history', JSON.stringify(customerHistory));
        
        console.log('Customer information saved locally:', customerData.id);
        return customerData;
    } catch (error) {
        console.error('Error saving customer information locally:', error);
        throw new Error('Failed to save customer information');
    }
}

// Generate unique customer ID
function generateCustomerId() {
    return 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Load saved customer information
function loadSavedCustomerInfo() {
    try {
        const savedCustomer = localStorage.getItem('gamezonepro_customer_info');
        if (savedCustomer) {
            const customerData = JSON.parse(savedCustomer);
            
            // Auto-fill form with saved data
            document.getElementById('fullName').value = customerData.fullName || '';
            document.getElementById('email').value = customerData.email || '';
            document.getElementById('address').value = customerData.address || '';
            document.getElementById('city').value = customerData.city || '';
            document.getElementById('state').value = customerData.state || '';
            document.getElementById('zipCode').value = customerData.zipCode || '';
            
            // Set country first so we can apply country code to phone
            const countrySelect = document.getElementById('country');
            if (countrySelect) {
                countrySelect.value = customerData.country || '';
                
                // Apply country code to phone if needed
                const phoneInput = document.getElementById('phone');
                if (phoneInput && customerData.country) {
                    // If phone doesn't have country code, add it
                    if (customerData.phone && !customerData.phone.startsWith('+')) {
                        const countryCode = countryCodes[customerData.country];
                        phoneInput.value = countryCode ? countryCode + ' ' + customerData.phone : customerData.phone;
                    } else {
                        phoneInput.value = customerData.phone || '';
                    }
                } else if (phoneInput) {
                    phoneInput.value = customerData.phone || '';
                }
            } else {
                // Fallback if country select not found
                const phoneInput = document.getElementById('phone');
                if (phoneInput) {
                    phoneInput.value = customerData.phone || '';
                }
            }
            
            console.log('Customer information loaded from storage');
        }
    } catch (error) {
        console.error('Error loading saved customer information:', error);
    }
}

// Show validation errors
function showValidationErrors(errors) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());
    
    if (errors.length > 0) {
        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-errors';
        errorContainer.innerHTML = `
            <div class="error-header">
                <i class="fas fa-exclamation-triangle"></i>
                Please correct the following errors:
            </div>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        // Insert error container before the form
        checkoutForm.parentNode.insertBefore(errorContainer, checkoutForm);
        
        // Scroll to error container
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        return false;
    }
    
    return true;
}

// Function to display payment errors
function showPaymentError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.payment-error-container');
    existingErrors.forEach(error => error.remove());
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'payment-error-container';
    errorContainer.innerHTML = `
        <div class="payment-error-message">
            <i class="fas fa-exclamation-circle"></i>
            ${message || 'Error processing payment'}
        </div>
        <button class="close-error-btn" onclick="closePaymentError()">&times;</button>
    `;
    
    // Insert error container before the form
    checkoutForm.parentNode.insertBefore(errorContainer, checkoutForm);
    
    // Scroll to error container
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Function to close payment error alert
function closePaymentError() {
    const errorContainer = document.querySelector('.payment-error-container');
    if (errorContainer) {
        errorContainer.remove();
    }
}

// Handle form submission
function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    // Clear any previous errors
    closePaymentError();
    
    // Get form data
    const formData = new FormData(checkoutForm);
    const customerInfo = {
        fullName: formData.get('fullName').trim(),
        email: formData.get('email').trim().toLowerCase(),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        city: formData.get('city').trim(),
        state: formData.get('state').trim(),
        zipCode: formData.get('zipCode').trim(),
        country: formData.get('country'),
        notes: formData.get('notes').trim()
    };
    
    // Validate customer information
    const validationErrors = validateCustomerInfo(customerInfo);
    if (!showValidationErrors(validationErrors)) {
        return; // Stop if validation fails
    }
    
    // Show loading indicator
    showLoadingIndicator();
    
    try {
        // Save customer information locally
        const savedCustomerData = saveCustomerInfoLocally(customerInfo);
        
        // Add customer ID to the customer info for order processing
        customerInfo.customerId = savedCustomerData.id;
        
        // Process payment
        processPayment(customerInfo);
    } catch (error) {
        hideLoadingIndicator();
        // Show error message in UI instead of alert
        showPaymentError(`Error saving customer information: ${error.message}`);
    }
}

// Show loading indicator
function showLoadingIndicator() {
    // Create loading indicator if it doesn't exist
    if (!document.querySelector('.loading-indicator')) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Processing your payment...</div>
        `;
        document.body.appendChild(loadingIndicator);
    }
    
    // Show the loading indicator
    document.querySelector('.loading-indicator').style.display = 'flex';
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Process payment using the payment processor
async function processPayment(customerInfo) {
    try {
        // Check if payment processor is available
        if (!window.paymentProcessor) {
            throw new Error('Payment processor not available');
        }
        
        // Ensure payment processor is initialized
        if (!window.paymentProcessor.initialized) {
            const initialized = await window.paymentProcessor.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize payment processor');
            }
        }
        
        // Process the checkout with cart data and customer info
        await window.paymentProcessor.processCheckout(customerInfo);
        
        // The payment processor will handle the redirect to Paystack
        // The loading indicator will remain until the user is redirected
        
    } catch (error) {
        // Hide loading indicator
        hideLoadingIndicator();
        
        // Show error message
        console.error('Payment processing error:', error);
        alert(`Payment processing error: ${error.message}`);
    }
}

// Check if this is a return from Paystack payment
function checkPaymentReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const orderId = localStorage.getItem('lastOrderId');
    
    console.log('Checking payment return:', { reference, orderId });
    
    if (reference && orderId) {
        // Show loading indicator
        showLoadingIndicator();
        
        // Verify the payment
        verifyPayment(reference, orderId);
    } else if (window.location.pathname.includes('payment-success.html')) {
        // If we're on the success page but don't have reference/orderId in URL,
        // check if we have an orderId in localStorage
        const lastOrderId = localStorage.getItem('lastOrderId');
        if (lastOrderId) {
            console.log('On success page with order ID:', lastOrderId);
        } else {
            // No order ID found, redirect to home
            console.log('No order ID found, redirecting to home');
            window.location.href = 'index.html';
        }
    }
}

// Verify payment with the server
async function verifyPayment(reference, orderId) {
    try {
        // Check if payment processor is available
        if (!window.paymentProcessor) {
            throw new Error('Payment processor not available');
        }
        
        // Verify the payment
        const result = await window.paymentProcessor.verifyPayment(reference, orderId);
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        if (result.success) {
            // Show success message
            showSuccessMessage(orderId);
            
            // Clear cart and discount
            localStorage.removeItem('gamezonepro_cart');
            localStorage.removeItem('discount');
        } else {
            // Show error message
            alert(`Payment verification failed: ${result.message}`);
        }
    } catch (error) {
        // Hide loading indicator
        hideLoadingIndicator();
        
        // Show error message
        console.error('Payment verification error:', error);
        alert(`Payment verification error: ${error.message}`);
    }
}

// Show success message
function showSuccessMessage(orderId) {
    // Hide checkout form and summary
    document.querySelector('.checkout-container').style.display = 'none';
    
    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h2 class="success-title">Payment Successful!</h2>
        <p class="success-text">Thank you for your purchase. Your order has been placed successfully.</p>
        <div class="order-details">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Status:</strong> Processing</p>
            <p><strong>Estimated Delivery:</strong> 7-10 business days</p>
        </div>
        <p>A confirmation email has been sent to your email address.</p>
        <a href="index.html" class="back-to-home">Back to Home</a>
    `;
    
    // Add success message to the page
    document.querySelector('.checkout-section .container').appendChild(successMessage);
    
    // Show the success message
    successMessage.style.display = 'block';
    
    // Update page title
    document.title = 'Order Confirmation - GameZone Pro';
}

// Country code mapping
const countryCodes = {
    'NG': '+234', // Nigeria
    'GH': '+233', // Ghana
    'ZA': '+27',  // South Africa
    'KE': '+254', // Kenya
    'CI': '+225', // Côte d'Ivoire
    'RW': '+250', // Rwanda
    'EG': '+20',  // Egypt
    'US': '+1',   // United States
    'CA': '+1',   // Canada
    'GB': '+44',  // United Kingdom
    'AU': '+61',  // Australia
    'AE': '+971'  // United Arab Emirates
};

// Function to update phone field with country code
function updatePhoneWithCountryCode() {
    const countrySelect = document.getElementById('country');
    const phoneInput = document.getElementById('phone');
    
    if (!countrySelect || !phoneInput) return;
    
    const selectedCountry = countrySelect.value;
    const countryCode = countryCodes[selectedCountry] || '';
    
    // Only update if phone is empty or only contains a different country code
    const currentValue = phoneInput.value.trim();
    const hasCountryCode = Object.values(countryCodes).some(code => 
        currentValue.startsWith(code));
    
    if (currentValue === '' || hasCountryCode) {
        phoneInput.value = countryCode + (hasCountryCode ? currentValue.substring(currentValue.indexOf(' ') + 1) : '');
    }
}

// Update phone input with country code
function updatePhoneWithCountryCode() {
    const countrySelect = document.getElementById('country');
    const phoneInput = document.getElementById('phone');
    
    if (!countrySelect || !phoneInput) return;
    
    const countryCode = countryCodes[countrySelect.value];
    if (!countryCode) return;
    
    // Only update if phone is empty or doesn't already have a country code
    if (!phoneInput.value || !phoneInput.value.startsWith('+')) {
        phoneInput.value = countryCode + ' ';
    }
}

// Initialize the checkout page
function initCheckout() {
    // Load cart data
    loadCartFromStorage();
    
    // Load previously saved customer information
    loadSavedCustomerInfo();
    
    // Add event listener to the checkout form
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        
        // Add real-time validation
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => validateSingleField(fieldName, field.value));
                field.addEventListener('input', () => clearFieldError(fieldName));
            }
        });
        
        // Add country change event to update phone with country code
        const countrySelect = document.getElementById('country');
        if (countrySelect) {
            countrySelect.addEventListener('change', updatePhoneWithCountryCode);
            
            // Apply country code on page load if country is selected but phone is empty
            if (countrySelect.value) {
                updatePhoneWithCountryCode();
            }
        }
    }
    
    // Check if this is a return from Paystack payment
    checkPaymentReturn();
}

// Validate single field in real-time
function validateSingleField(fieldName, value) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldName) {
        case 'fullName':
            if (!value || value.trim().length < 2) {
                isValid = false;
                errorMessage = 'Full name must be at least 2 characters long';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value || !emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
        case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
            if (!value || !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
            break;
        case 'address':
            if (!value || value.trim().length < 5) {
                isValid = false;
                errorMessage = 'Shipping address must be at least 5 characters long';
            }
            break;
        case 'city':
            if (!value || value.trim().length < 2) {
                isValid = false;
                errorMessage = 'City must be at least 2 characters long';
            }
            break;
        case 'state':
            if (!value || value.trim().length < 2) {
                isValid = false;
                errorMessage = 'State/Province must be at least 2 characters long';
            }
            break;
        case 'zipCode':
            if (!value || value.trim().length < 3) {
                isValid = false;
                errorMessage = 'Zip/Postal code must be at least 3 characters long';
            }
            break;
        case 'country':
            if (!value) {
                isValid = false;
                errorMessage = 'Please select a country';
            }
            break;
    }
    
    // Show/hide field-specific error
    showFieldError(fieldName, isValid ? '' : errorMessage);
    
    return isValid;
}

// Show field-specific error
function showFieldError(fieldName, errorMessage) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    // Remove existing error for this field
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    if (errorMessage) {
        // Add error styling to field
        field.classList.add('error');
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = errorMessage;
        
        // Insert error message after the field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    } else {
        // Remove error styling
        field.classList.remove('error');
    }
}

// Clear field error
function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    if (field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});