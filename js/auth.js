// Authentication and User Profile Management
// Handles Google OAuth, user sessions, and profile data

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        // Check for existing session
        await this.checkAuthStatus();
        this.setupEventListeners();
        this.initializeGoogleSignIn();
    }

    async checkAuthStatus() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.showAuthButtons();
                return;
            }

            // Verify token with server
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    await this.loadUserProfile();
                    this.showUserProfile();
                    await this.loadUserCart();
                } else {
                    this.logout();
                }
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.logout();
        }
    }

    setupEventListeners() {
        // Google login button
        const googleLoginBtn = document.getElementById('google-login-btn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleGoogleSignIn();
            });
        }

        // Regular login button (for future implementation)
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Profile dropdown items
        const viewProfileBtn = document.getElementById('view-profile');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfileModal();
            });
        }

        const viewOrdersBtn = document.getElementById('view-orders');
        if (viewOrdersBtn) {
            viewOrdersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showOrdersModal();
            });
        }

        const viewWishlistBtn = document.getElementById('view-wishlist');
        if (viewWishlistBtn) {
            viewWishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showWishlistModal();
            });
        }
    }

    initializeGoogleSignIn() {
        // Initialize Google Sign-In when the API is loaded
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: '637222691071-vs5pdlrci0ir4pt5gjgeb8bm95604bh1.apps.googleusercontent.com',
                callback: this.handleGoogleResponse.bind(this)
            });
            
            // Create a hidden Google Sign-In button
            this.createHiddenGoogleButton();
        } else {
            // Retry after a short delay if Google API isn't loaded yet
            setTimeout(() => this.initializeGoogleSignIn(), 1000);
        }
    }

    createHiddenGoogleButton() {
        // Remove any existing hidden button
        const existingButton = document.getElementById('hidden-google-btn');
        if (existingButton) {
            existingButton.remove();
        }

        // Create a hidden div for the Google button
        const hiddenDiv = document.createElement('div');
        hiddenDiv.id = 'hidden-google-btn';
        hiddenDiv.style.position = 'absolute';
        hiddenDiv.style.top = '-1000px';
        hiddenDiv.style.left = '-1000px';
        hiddenDiv.style.visibility = 'hidden';
        document.body.appendChild(hiddenDiv);

        // Render the actual Google Sign-In button
        google.accounts.id.renderButton(hiddenDiv, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            width: 250
        });
    }

    async handleGoogleSignIn() {
        try {
            // Find the hidden Google button and click it
            const hiddenButton = document.getElementById('hidden-google-btn');
            if (hiddenButton) {
                // Find the actual Google button inside the hidden div
                const googleButton = hiddenButton.querySelector('div[role="button"]');
                if (googleButton) {
                    googleButton.click();
                } else {
                    this.createHiddenGoogleButton();
                    // Try again after a short delay
                    setTimeout(() => {
                        const newGoogleButton = document.getElementById('hidden-google-btn')?.querySelector('div[role="button"]');
                        if (newGoogleButton) {
                            newGoogleButton.click();
                        }
                    }, 100);
                }
            } else {
                this.createHiddenGoogleButton();
                // Try again after a short delay
                setTimeout(() => {
                    this.handleGoogleSignIn();
                }, 100);
            }
        } catch (error) {
            console.error('Google Sign-In error:', error);
            this.showNotification('Google Sign-In is currently unavailable. Please try again later.', 'error');
        }
    }

    showGoogleSignInPopup() {
        // Create a temporary div for the Google Sign-In button
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '-1000px';
        tempDiv.style.left = '-1000px';
        document.body.appendChild(tempDiv);

        google.accounts.id.renderButton(tempDiv, {
            theme: 'outline',
            size: 'large',
            type: 'standard'
        });

        // Trigger the button click programmatically
        setTimeout(() => {
            const googleBtn = tempDiv.querySelector('div[role="button"]');
            if (googleBtn) {
                googleBtn.click();
            }
            // Clean up
            document.body.removeChild(tempDiv);
        }, 100);
    }

    async handleGoogleResponse(response) {
        try {
            const idToken = response.credential;
            
            // Send token to server for verification
            const serverResponse = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idToken })
            });

            const data = await serverResponse.json();

            if (data.success) {
                // Store auth token
                localStorage.setItem('authToken', data.token);
                
                this.currentUser = data.user;
                this.isAuthenticated = true;
                
                await this.loadUserProfile();
                this.showUserProfile();
                await this.loadUserCart();
                
                this.showNotification(`Welcome ${data.user.first_name || data.user.email}!`, 'success');
            } else {
                throw new Error(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Google auth error:', error);
            this.showNotification('Authentication failed. Please try again.', 'error');
        }
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.userProfile = data.profile;
                }
            }
        } catch (error) {
            console.error('Load profile error:', error);
        }
    }

    async loadUserCart() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/profile/cart', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update cart display
                    this.updateCartDisplay(data.cart);
                    
                    // Merge with local cart if exists
            const localCart = JSON.parse(localStorage.getItem('gamezonepro_cart') || localStorage.getItem('cart') || '[]');
            if (localCart.length > 0) {
                await this.mergeLocalCart(localCart);
            }
                }
            }
        } catch (error) {
            console.error('Load cart error:', error);
        }
    }

    async mergeLocalCart(localCart) {
        try {
            const token = localStorage.getItem('authToken');
            
            for (const item of localCart) {
                await fetch('/api/profile/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(item)
                });
            }
            
            // Clear local cart after merging
            localStorage.removeItem('cart');
            localStorage.removeItem('gamezonepro_cart');
            
            // Reload cart to get updated data
            await this.loadUserCart();
        } catch (error) {
            console.error('Merge cart error:', error);
        }
    }

    async addToCart(item) {
        if (!this.isAuthenticated) {
            // Add to local storage if not authenticated
            const localCart = JSON.parse(localStorage.getItem('gamezonepro_cart') || '[]');
            const existingIndex = localCart.findIndex(cartItem => 
                cartItem.id === item.id && cartItem.color === item.color
            );
            
            if (existingIndex >= 0) {
                localCart[existingIndex].quantity += item.quantity || 1;
            } else {
                localCart.push(item);
            }
            
            localStorage.setItem('gamezonepro_cart', JSON.stringify(localCart));
            localStorage.setItem('cart', JSON.stringify(localCart)); // Keep both for compatibility
            this.updateCartDisplay(localCart);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/profile/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(item)
            });

            const data = await response.json();
            if (data.success) {
                await this.loadUserCart();
                this.showNotification('Item added to cart!', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Failed to add item to cart', 'error');
        }
    }

    async removeFromCart(itemId, color) {
        if (!this.isAuthenticated) {
            const localCart = JSON.parse(localStorage.getItem('gamezonepro_cart') || '[]');
            const updatedCart = localCart.filter(item => 
                !(item.id === itemId && item.color === color)
            );
            localStorage.setItem('gamezonepro_cart', JSON.stringify(updatedCart));
            localStorage.setItem('cart', JSON.stringify(updatedCart)); // Keep both for compatibility
            this.updateCartDisplay(updatedCart);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/profile/cart/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: itemId, color })
            });

            const data = await response.json();
            if (data.success) {
                await this.loadUserCart();
                this.showNotification('Item removed from cart', 'success');
            }
        } catch (error) {
            console.error('Remove from cart error:', error);
        }
    }

    updateCartDisplay(cartItems) {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCount.textContent = totalItems;
        }
    }

    showAuthButtons() {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }

    showUserProfile() {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        const profileAvatar = document.getElementById('profile-avatar');
        const profileName = document.getElementById('profile-name');
        
        if (authButtons) authButtons.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        
        if (this.currentUser) {
            if (profileAvatar) {
                profileAvatar.src = this.currentUser.profile_picture || '/images/default-avatar.png';
                profileAvatar.alt = this.currentUser.first_name || 'User';
            }
            
            if (profileName) {
                profileName.textContent = this.currentUser.first_name || 
                    this.currentUser.email?.split('@')[0] || 'User';
            }
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userProfile = null;
        
        this.showAuthButtons();
        
        // Clear cart display
        this.updateCartDisplay([]);
        
        this.showNotification('Logged out successfully', 'success');
    }

    showLoginModal() {
        // Placeholder for future login modal implementation
        this.showNotification('Regular login coming soon! Please use Google Sign-In for now.', 'info');
    }

    showProfileModal() {
        // Placeholder for profile modal
        this.showNotification('Profile management coming soon!', 'info');
    }

    showOrdersModal() {
        // Placeholder for orders modal
        this.showNotification('Order history coming soon!', 'info');
    }

    showWishlistModal() {
        // Placeholder for wishlist modal
        this.showNotification('Wishlist coming soon!', 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}