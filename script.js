// GameZone Pro - Interactive JavaScript
// AI-Powered Gaming Controller Store

// Global Variables
let cart = [];
let wishlist = [];
let currentReview = 0;
let isLoading = true;
let currentFilter = 'all';
let userCurrency = 'USD';
let exchangeRates = {};
const FORCE_USD_DISPLAY = true;

// Currency Configuration
const currencyConfig = {
    'USD': { symbol: '$', name: 'US Dollar' },
    'EUR': { symbol: '€', name: 'Euro' },
    'GBP': { symbol: '£', name: 'British Pound' },
    'CAD': { symbol: 'C$', name: 'Canadian Dollar' },
    'AUD': { symbol: 'A$', name: 'Australian Dollar' },
    'JPY': { symbol: '¥', name: 'Japanese Yen' },
    'CNY': { symbol: '¥', name: 'Chinese Yuan' },
    'INR': { symbol: '₹', name: 'Indian Rupee' },
    'BRL': { symbol: 'R$', name: 'Brazilian Real' },
    'MXN': { symbol: '$', name: 'Mexican Peso' }
};

// Currency Detection and Conversion Functions
async function detectUserCurrency() {
    if (FORCE_USD_DISPLAY) {
        userCurrency = 'USD';
        return;
    }
    try {
        // Try to get user's location
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        
        // Map country codes to currencies
        const countryCurrencyMap = {
            'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD',
            'JP': 'JPY', 'CN': 'CNY', 'IN': 'INR', 'BR': 'BRL',
            'MX': 'MXN', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR',
            'ES': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR'
        };
        
        userCurrency = countryCurrencyMap[countryCode] || 'USD';
    } catch (error) {
        console.log('Could not detect user location, defaulting to USD');
        userCurrency = 'USD';
    }
}

async function fetchExchangeRates() {
    if (FORCE_USD_DISPLAY) {
        exchangeRates = { USD: 1 };
        return;
    }
    try {
        // Using a free exchange rate API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRates = data.rates;
        exchangeRates.USD = 1; // Base currency
    } catch (error) {
        console.log('Could not fetch exchange rates, using default rates');
        // Fallback exchange rates (approximate)
        exchangeRates = {
            'USD': 1,
            'EUR': 0.85,
            'GBP': 0.73,
            'CAD': 1.25,
            'AUD': 1.35,
            'JPY': 110,
            'CNY': 6.45,
            'INR': 74,
            'BRL': 5.2,
            'MXN': 20
        };
    }
}

function convertPrice(usdPrice) {
    if (FORCE_USD_DISPLAY) return usdPrice;
    if (!exchangeRates[userCurrency]) return usdPrice;
    return (usdPrice * exchangeRates[userCurrency]).toFixed(2);
}

function formatPrice(price) {
    const convertedPrice = convertPrice(price);
    const currency = FORCE_USD_DISPLAY ? currencyConfig['USD'] : currencyConfig[userCurrency];
    
    if (!FORCE_USD_DISPLAY && (userCurrency === 'JPY' || userCurrency === 'CNY' || userCurrency === 'INR')) {
        return `${currency.symbol}${Math.round(convertedPrice)}`;
    }
    return `${currency.symbol}${convertedPrice}`;
}

// Initialize currency on page load
async function initializeCurrency() {
    if (FORCE_USD_DISPLAY) {
        userCurrency = 'USD';
        exchangeRates = { USD: 1 };
        updateAllPrices();
        return;
    }
    await detectUserCurrency();
    await fetchExchangeRates();
    updateAllPrices();
}

function updateAllPrices() {
    // Update all price displays on the page, excluding color-option elements
    document.querySelectorAll('[data-price]').forEach(element => {
        // Skip color-option elements to avoid showing price text inside them
        if (element.classList.contains('color-option')) {
            return;
        }
        const usdPrice = parseFloat(element.dataset.price);
        element.textContent = formatPrice(usdPrice);
    });
}

// SEO Keywords for tracking
const seoKeywords = {
    'pc': ['best gaming controller for pc', 'hall effect gaming controller', 'tmr sensor gamepad', 'controller for steam deck', 'pc gaming controller 2025', 'razer wolverine v3 pro', 'no stick drift controller'],
    'xbox': ['buy xbox controller wireless', 'xbox elite controller series 2', 'gaming controller with paddles', 'xbox series x controller', 'gamesir g7 se', 'hall effect xbox controller'],
    'mobile': ['bluetooth controller for mobile gaming', 'wireless controller under $58', 'mobile gamepad', 'android gaming controller', 'ios controller support'],
    'pro': ['pro controller tournament legal', 'custom gaming controller design', 'controller for fighting games', 'esports gaming controller', 'tournament grade controller', 'competitive gaming gear'],
    'hall_effect': ['hall effect controller', 'tmr sensor technology', 'no stick drift guarantee', 'magnetic joystick controller', 'drift-free gaming controller'],
    'wireless': ['wireless gamepad', 'bluetooth gaming controller', '2.4ghz wireless controller', 'low latency wireless', 'wireless controller with charging dock']
};

// Product Data
const products = {

    'gamesir': {
        id: 'gamesir',
        name: 'GameSir Nova Lite Gaming Controller',
        category: 'controller',
        price: 28.74, // Retail price
        originalPrice: 34.49,
        wholesaleCost: 12.50,
        temuUrl: 'https://www.temu.com/gh/--lite-wireless-gaming-controller-ergonomic-wireless-wired--for-switch-for--ios-pc-steam-games-turbo-function-hall-effect-sticks-g-601099548838966.html',
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 18,
                wholesaleCost: 12.50,
                retailPrice: 28.74 // Retail price
            },
            {
                name: 'White',
                code: '#FFFFFF',
                stock: 22,
                wholesaleCost: 12.50,
                retailPrice: 28.74
            },
            {
                name: 'Blue',
                code: '#0066CC',
                stock: 20,
                wholesaleCost: 12.50,
                retailPrice: 20.53
            },
            {
                name: 'Red',
                code: '#CC0000',
                stock: 15,
                wholesaleCost: 12.50,
                retailPrice: 17.85
            }
        ],
        images: [
            'images/GameSir Nova Lite (white).webp',
            'images/GameSir Nova Lite (black).webp',
            'images/GameSir Nova Lite (blue).webp',
            'images/GameSir Nova Lite (pink).webp',
            'images/GameSir Nova Lite (green).webp',
            'images/GameSir Nova Lite (yellow).webp',
            'images/GameSir Nova Lite (in-box).webp',
            'images/GameSir Nova Lite.webp'
        ],
        description: 'Advanced mobile gaming controller with mechanical triggers and phone clamp. Designed for mobile esports champions and streaming.',
        features: [
            'Mechanical triggers with adjustable sensitivity',
            'Universal phone clamp (4-6.7 inches)',
            'Low latency wireless connection',
            'Programmable buttons and macros',
            'Ergonomic grip for extended gaming sessions'
        ],
        specifications: {
            'Connectivity': 'Bluetooth 5.0',
            'Battery Life': '25 hours',
            'Charging': 'USB-C',
            'Compatibility': 'Android, iOS, PC',
            'Weight': '280g',
            'Phone Support': '4-6.7 inch phones'
        },
        stock: 45, // Total across all colors
        rating: 4.7,
        reviews: 1923
    },
    'gamesir-g7se': {
        id: 'gamesir-g7se',
        name: 'GameSir G7 SE Wired Gaming Controller',
        category: 'controller',
        price: 51.74, // Retail price
        originalPrice: 63.24,
        wholesaleCost: 22.50,
        temuUrl: 'https://www.temu.com/gamesir-g7-se-wired-controller',
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 20,
                wholesaleCost: 22.50,
                retailPrice: 51.74 // Retail price
            },
            {
                name: 'White',
                code: '#FFFFFF',
                stock: 18,
                wholesaleCost: 22.50,
                retailPrice: 51.74
            }
        ],
        images: [
            'images/gamesir g7 se (orange).webp',
            'images/GameSir G7 SE 1 (orange).webp',
            'images/GameSir G7 SE 2 (orange).webp',
            'images/GameSir G7 SE 3 (blue).webp'
        ],
        description: 'Professional wired gaming controller with Hall Effect joysticks and triggers. Tournament-grade precision for competitive gaming.',
        features: [
            'Hall Effect joysticks and triggers - Zero drift',
            'Wired USB-C connection for zero latency',
            'Customizable button mapping',
            'Tournament legal for esports',
            'Compatible with Xbox Series X|S, PC, Steam Deck'
        ],
        specifications: {
            'Connectivity': 'Wired USB-C',
            'Latency': '< 1ms',
            'Compatibility': 'Xbox Series X|S, PC, Steam Deck',
            'Weight': '230g',
            'Cable Length': '3m'
        },
        stock: 38,
        rating: 4.8,
        reviews: 1456
    },
    'gamesir-supernova': {
        id: 'gamesir-supernova',
        name: 'GameSir Super Nova Wireless Controller',
        category: 'controller',
        price: 80.49, // Calculated from wholesaleCost with 30% margin
        originalPrice: 114.99,
        wholesaleCost: 48.99,
        temuUrl: 'https://www.temu.com/gamesir-super-nova-wireless',
        colors: [
            {
                name: 'Cosmic Black',
                code: '#1a1a1a',
                stock: 12,
                wholesaleCost: 48.99,
                retailPrice: 80.49 // 48.99 / (1 - 0.30) = 69.99
            },
            {
                name: 'Galaxy White',
                code: '#f5f5f5',
                stock: 10,
                wholesaleCost: 48.99,
                retailPrice: 80.49
            }
        ],
        images: [
            'images/GameSir Super Nova Wireless Controller (Black).webp',
            'images/GameSir Super Nova Wireless Controller 1 (Black).webp',
            'images/GameSir Super Nova Wireless Controller 2.webp',
            'images/GameSir Super Nova Wireless Controller 3 (Black).webp',
            'images/GameSir Super Nova Wireless Controller 4 (white).webp',
            'images/GameSir Super Nova Wireless Controller 5 (white).webp'
        ],
        description: 'Premium wireless gaming controller with RGB lighting and Hall Effect technology. Perfect for PC and console gaming.',
        features: [
            'Hall Effect joysticks and triggers',
            'RGB lighting with customizable effects',
            'Wireless 2.4GHz + Bluetooth dual mode',
            '30-hour battery life',
            'Programmable back paddles',
            'Multi-platform compatibility'
        ],
        specifications: {
            'Connectivity': 'Wireless 2.4GHz, Bluetooth 5.0',
            'Battery Life': '30 hours',
            'Charging': 'USB-C fast charging',
            'Compatibility': 'PC, Xbox, PlayStation, Switch, Mobile',
            'Weight': '285g',
            'RGB Zones': '16.7 million colors'
        },
        stock: 35,
        rating: 4.9,
        reviews: 892
    },
    'gamesir-t7': {
        id: 'gamesir-t7',
        name: 'GameSir T7 Mobile Gaming Controller',
        category: 'controller',
        price: 54.20, // Calculated from wholesaleCost with 30% margin
        originalPrice: 80.49,
        wholesaleCost: 32.99,
        temuUrl: 'https://www.temu.com/gamesir-t7-mobile-controller',
        colors: [
            {
                name: 'White',
                code: '#FFFFFF',
                stock: 25,
                wholesaleCost: 32.99,
                retailPrice: 54.20 // 32.99 / (1 - 0.30) = 47.13
            },
            {
                name: 'Blue',
                code: '#0066cc',
                stock: 20,
                wholesaleCost: 32.99,
                retailPrice: 54.20
            }
        ],
        images: [
            'images/GameSir T7 Mobile Gaming Controller (white).webp',
            'images/GameSir T7 Mobile Gaming Controller 1 (white).webp',
            'images/GameSir T7 Mobile Gaming Controller 2 (white).webp',
            'images/GameSir T7 Mobile Gaming Controller 3 (white).webp',
            'images/GameSir T7 Mobile Gaming Controller 4 (blue).webp',
            
        ],
        description: 'Compact mobile gaming controller with telescopic design. Perfect for mobile esports and cloud gaming.',
        features: [
            'Telescopic design for phones 4-6.7 inches',
            'Hall Effect joysticks for precision',
            'Bluetooth 5.0 low latency connection',
            'Portable and lightweight design',
            'Compatible with iOS and Android',
            '20-hour battery life'
        ],
        specifications: {
            'Connectivity': 'Bluetooth 5.0',
            'Battery Life': '20 hours',
            'Charging': 'USB-C',
            'Compatibility': 'iOS, Android, PC',
            'Weight': '180g',
            'Phone Support': '4-6.7 inch phones'
        },
        stock: 45,
        rating: 4.6,
        reviews: 2134
    },
    'gamesir-g7pro': {
        id: 'gamesir-g7pro',
        name: 'GameSir G7 Pro Wireless Controller',
        category: 'controller',
        price: 87.06, // Calculated from wholesaleCost with 30% margin
        originalPrice: 99.99,
        wholesaleCost: 52.99,
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 15,
                wholesaleCost: 52.99,
                retailPrice: 87.06 // 52.99 / (1 - 0.30) = 75.70
            },
            {
                name: 'White',
                code: '#FFFFFF',
                stock: 12,
                wholesaleCost: 52.99,
                retailPrice: 87.06
            }
        ],
        images: [
            'images/GameSir G7 pro (white).webp',
            'images/GameSir G7 pro 1 (Black).webp',
            'images/GameSir G7 pro 3 (Black).webp',
            'images/GameSir G7 pro 4 (Black).webp'
        ],
        description: 'Professional wireless gaming controller with Hall Effect technology and customizable features. Designed for competitive gaming and esports.',
        features: [
            'Hall Effect joysticks and triggers - Zero drift',
            'Wireless 2.4GHz + Bluetooth connectivity',
            'Customizable button mapping',
            'Tournament-grade build quality',
            'Compatible with Xbox, PC, Steam Deck',
            '25-hour battery life'
        ],
        specifications: {
            'Connectivity': 'Wireless 2.4GHz, Bluetooth 5.0',
            'Battery Life': '25 hours',
            'Charging': 'USB-C',
            'Compatibility': 'Xbox Series X|S, PC, Steam Deck',
            'Weight': '265g',
            'Dimensions': '155 × 107 × 62mm'
        },
        stock: 33,
        rating: 4.8,
        reviews: 1247
    },
    'gamesir-nova2lite': {
        id: 'gamesir-nova2lite',
        name: 'GameSir Nova 2 Lite Mobile Controller',
        category: 'controller',
        price: 65.70, // Calculated from wholesaleCost with 30% margin
        originalPrice: 91.99,
        wholesaleCost: 39.99,
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 22,
                wholesaleCost: 39.99,
                retailPrice: 65.70 // 39.99 / (1 - 0.30) = 57.13
            },
            {
                name: 'White',
                code: '#FFFFFF',
                stock: 18,
                wholesaleCost: 39.99,
                retailPrice: 65.70
            }
        ],
        images: [
            'images/GameSir Nova 2 Lite (white).webp',
            'images/GameSir Nova 2 Lite 1 (white).webp',
            'images/GameSir Nova 2 Lite 2 (Black).webp',
            'images/GameSir Nova 2 Lite 3 (black).webp'
        ],
        description: 'Advanced mobile gaming controller with telescopic design and Hall Effect joysticks. Perfect for mobile esports and cloud gaming.',
        features: [
            'Telescopic design for phones 4-6.7 inches',
            'Hall Effect joysticks for precision',
            'Bluetooth 5.0 low latency connection',
            'Ergonomic grip design',
            'Compatible with iOS and Android',
            '18-hour battery life'
        ],
        specifications: {
            'Connectivity': 'Bluetooth 5.0',
            'Battery Life': '18 hours',
            'Charging': 'USB-C',
            'Compatibility': 'iOS, Android, PC',
            'Weight': '195g',
            'Phone Support': '4-6.7 inch phones'
        },
        stock: 40,
        rating: 4.7,
        reviews: 892
    },
    'gamesir-x5lite': {
        id: 'gamesir-x5lite',
        name: 'GameSir X5 Lite Gaming Controller',
        category: 'controller',
        price: 49.27, // Calculated from wholesaleCost with 30% margin
        originalPrice: 74.74,
        wholesaleCost: 29.99,
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 18,
                wholesaleCost: 29.99,
                retailPrice: 49.27 // 29.99 / (1 - 0.30) = 42.84
            }
        ],
        images: [
            'images/GameSir X5 Lite Type-C Mobile Gaming Controller (Lime).webp',
            'images/GameSir X5 Lite Type-C Mobile Gaming Controller 1 (Black).webp',
            'images/GameSir X5 Lite Type-C Mobile Gaming Controller 1 (Lime).webp',
            'images/GameSir X5 Lite Type-C Mobile Gaming Controller 2 (Lime).webp',
            'images/GameSir X5 Lite Type-C Mobile Gaming Controller 3 (Lime).webp'
        ],
        description: 'Compact wireless gaming controller with excellent battery life and multi-platform support. Great value for casual and competitive gaming.',
        features: [
            'Wireless Bluetooth connectivity',
            'Multi-platform compatibility',
            'Ergonomic lightweight design',
            'Long battery life',
            'Responsive button layout',
            'Affordable gaming solution'
        ],
        specifications: {
            'Connectivity': 'Bluetooth 5.0',
            'Battery Life': '22 hours',
            'Charging': 'USB-C',
            'Compatibility': 'PC, Android, iOS',
            'Weight': '175g',
            'Dimensions': '145 × 98 × 58mm'
        },
        stock: 28,
        rating: 4.5,
        reviews: 634
    },
    'gamesir-cyclone2': {
        id: 'gamesir-cyclone2',
        name: 'GameSir Cyclone 2 Controller',
        category: 'controller',
        price: 77.20, // Calculated from wholesaleCost with 30% margin
        originalPrice: 103.49,
        wholesaleCost: 46.99,
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 20,
                wholesaleCost: 46.99,
                retailPrice: 77.20 // 46.99 / (1 - 0.30) = 67.13
            },
            {
                name: 'Blue',
                code: '#0066cc',
                stock: 15,
                wholesaleCost: 46.99,
                retailPrice: 77.20
            }
        ],
        images: [
            'images/GameSir Cyclone 2 Multiplatform Controller (Black).webp',
            'images/GameSir Cyclone 2 Multiplatform Controller 1.webp'
        ],
        description: 'High-performance wireless controller with advanced features and premium build quality. Designed for serious gamers and esports professionals.',
        features: [
            'Advanced wireless technology',
            'Precision analog sticks',
            'Customizable button mapping',
            'Premium build materials',
            'Multi-platform support',
            'Fast charging capability'
        ],
        specifications: {
            'Connectivity': 'Wireless 2.4GHz, Bluetooth 5.0',
            'Battery Life': '28 hours',
            'Charging': 'USB-C fast charging',
            'Compatibility': 'PC, Xbox, PlayStation, Switch',
            'Weight': '275g',
            'Dimensions': '158 × 109 × 64mm'
        },
        stock: 35,
        rating: 4.8,
        reviews: 756
    },
    'gamesir-x2s': {
        id: 'gamesir-x2s',
        name: 'GameSir X2s Mobile Gaming Controller',
        category: 'controller',
        price: 64.06, // Calculated from wholesaleCost with 30% margin
        originalPrice: 86.24,
        wholesaleCost: 38.99,
        temuUrl: 'https://www.temu.com/gamesir-x2s-mobile-controller',
        colors: [
            {
                name: 'Black',
                code: '#000000',
                stock: 25,
                wholesaleCost: 38.99,
                retailPrice: 64.06 // 38.99 / (1 - 0.30) = 55.70
            }
        ],
        images: [
            'images/GameSir X2s Type-C Mobile Gaming Controller.webp',
            'images/GameSir X2s Type-C Mobile Gaming Controller 1.webp',
            'images/GameSir X2s Type-C Mobile Gaming Controller 2.webp'
        ],
        description: 'Compact mobile gaming controller with telescopic design and Hall Effect joysticks. Perfect for mobile gaming on the go.',
        features: [
            'Telescopic design for phones 4-6.7 inches',
            'Hall Effect joysticks for precision',
            'Bluetooth 5.0 low latency connection',
            'Ultra-portable design',
            'Compatible with iOS and Android',
            '15-hour battery life'
        ],
        specifications: {
            'Connectivity': 'Bluetooth 5.0',
            'Battery Life': '15 hours',
            'Charging': 'USB-C',
            'Compatibility': 'iOS, Android, PC',
            'Weight': '165g',
            'Phone Support': '4-6.7 inch phones'
        },
        stock: 52,
        rating: 4.4,
        reviews: 1156
    }
};

// AI-Generated Testimonials
const aiTestimonials = [

    {
        name: 'Sarah Johnson',
        role: 'Mobile Gaming Streamer',
        avatar: '',
        text: 'GameSir Nova Lite is perfect for mobile gaming! The mechanical triggers give me a competitive edge in mobile esports, and the phone clamp is incredibly convenient. Highly recommended!',
        product: 'GameSir Nova Lite',
        rating: 5
    },
    {
        name: 'Mike Rodriguez',
        role: 'Gaming Enthusiast',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        text: 'Amazing build quality and customer service! My controller arrived quickly and works flawlessly across all my gaming platforms. GameZone Pro definitely knows their stuff!',
        product: 'Both Controllers',
        rating: 5
    }
];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Show loading screen
    showLoadingScreen();
    
    // Initialize currency detection and conversion
    initializeCurrency();
    
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });
    
    // Initialize GSAP animations
    initializeGSAPAnimations();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize product image carousels
    initializeProductCarousels();
    
    // Initialize image hover slideshow
    initializeImageHoverSlideshow();
    
    // Load cart from localStorage
    loadCartFromStorage();
    
    // Load wishlist from localStorage
    loadWishlistFromStorage();
    
    // Initialize review carousel
    initializeReviewCarousel();
    
    // Setup scroll effects
    setupScrollEffects();
    
    // Hide loading screen after delay
    setTimeout(() => {
        hideLoadingScreen();
    }, 3000);
    
    // Show spin wheel after delay (first visit)
    setTimeout(() => {
        if (!localStorage.getItem('spinWheelShown')) {
            showSpinWheel();
            localStorage.setItem('spinWheelShown', 'true');
        }
    }, 10000);
}

// Loading Screen Functions
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '1';
        loadingScreen.style.visibility = 'visible';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        isLoading = false;
    }
}

// GSAP Animations
function initializeGSAPAnimations() {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero controller animation
    gsap.to('#hero-controller', {
        rotationY: 360,
        duration: 20,
        repeat: -1,
        ease: 'none'
    });
    
    // Floating particles animation
    gsap.to('.floating-particles', {
        backgroundPosition: '200px 200px',
        duration: 20,
        repeat: -1,
        ease: 'none'
    });
    
    // Product cards hover animation
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
    
    // Scroll-triggered animations
    gsap.fromTo('.section-title', {
        y: 50,
        opacity: 0
    }, {
        y: 0,
        opacity: 1,
        duration: 1,
        scrollTrigger: {
            trigger: '.section-title',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
        }
    });
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', toggleCart);
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Window scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Window resize events
    window.addEventListener('resize', handleResize);
    
    // Keyboard events
    document.addEventListener('keydown', handleKeydown);
}

// Scroll Effects
function setupScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// Handle Scroll
function handleScroll() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

// Handle Keyboard Events
function handleKeydown(e) {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        closeAllModals();
    }
    
    // Cart shortcuts
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        toggleCart();
    }
}

// Handle Window Resize with debouncing
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Adjust modal positioning and sizing on resize
        const activeModal = document.querySelector('.modal[style*="display: flex"], .modal-overlay.active');
        if (activeModal) {
            // Force reflow to ensure proper positioning
            activeModal.style.display = activeModal.style.display;
            
            // Adjust modal content max dimensions
            const modalContent = activeModal.querySelector('.modal-content');
            if (modalContent) {
                // Reset max dimensions to allow CSS media queries to take effect
                modalContent.style.maxWidth = '';
                modalContent.style.maxHeight = '';
                
                // Force a reflow
                modalContent.offsetHeight;
            }
        }
        
        // Recalculate image dimensions in quick view
        const quickViewImages = document.querySelectorAll('.controllers-main-image img');
        quickViewImages.forEach(img => {
            // Force image to recalculate its dimensions
            img.style.maxHeight = '';
            img.offsetHeight; // Force reflow
        });
    }, 100); // Debounce resize events
}

// Product Image Carousels
function initializeProductCarousels() {
    document.querySelectorAll('.product-card').forEach(card => {
        const images = card.querySelectorAll('.product-img');
        const dots = card.querySelectorAll('.image-dots .dot');
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                // Remove active class from all images and dots
                images.forEach(img => img.classList.remove('active'));
                dots.forEach(d => d.classList.remove('active'));
                
                // Add active class to selected image and dot
                images[index].classList.add('active');
                dot.classList.add('active');
            });
        });
    });
}

// Cart Functions
function addToCart(productId, price, selectedColor = null) {
    const product = products[productId];
    if (!product) return;
    
    // Get selected color or default to first color
    const color = selectedColor || (product.colors && product.colors[0] ? product.colors[0].name : 'Default');
    
    const cartItem = {
        id: productId,
        name: product.name,
        price: price,
        image: product.images[0],
        color: color,
        quantity: 1
    };
    
    // Use auth manager if available and user is authenticated
    if (window.authManager && window.authManager.isAuthenticated) {
        window.authManager.addToCart(cartItem);
    } else {
        // Use local cart for non-authenticated users
        addToLocalCart(cartItem);
    }
    
    // Analytics tracking
    trackEvent('add_to_cart', {
        product_id: productId,
        product_name: product.name,
        price: price,
        color: color
    });
}

function addToLocalCart(item) {
    // Check if product already in cart with same color
    const existingItem = cart.find(cartItem => 
        cartItem.id === item.id && cartItem.color === item.color
    );
    
    if (existingItem) {
        existingItem.quantity += item.quantity || 1;
    } else {
        cart.push(item);
    }
    
    window.cart = cart; // Sync with global cart
    updateCartUI();
    saveCartToStorage();
    showCartNotification('Product added to cart!');
}

function removeFromCart(productId, color = null) {
    // Use auth manager if available and user is authenticated
    if (window.authManager && window.authManager.isAuthenticated) {
        window.authManager.removeFromCart(productId, color);
    } else {
        // Use local cart for non-authenticated users
        if (color) {
            cart = cart.filter(item => !(item.id === productId && item.color === color));
        } else {
            cart = cart.filter(item => item.id !== productId);
        }
        
        window.cart = cart; // Sync with global cart
        updateCartUI();
        saveCartToStorage();
        showCartNotification('Product removed from cart');
    }
}

function updateQuantity(productId, newQuantity, color = null) {
    if (newQuantity <= 0) {
        removeFromCart(productId, color);
        return;
    }
    
    const item = cart.find(item => color ? (item.id === productId && item.color === color) : item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        updateCartUI();
        saveCartToStorage();
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    // Sync with global cart if available
    if (window.cart && window.cart !== cart) {
        cart = window.cart;
    }
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Update cart items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <button class="btn-primary" onclick="scrollToProducts()">START SHOPPING</button>
                </div>
            `;
            if (cartFooter) cartFooter.style.display = 'none';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        ${item.color ? `<div class="cart-item-variant">Color: ${item.color}</div>` : ''}
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-controls">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1}, '${item.color || ''}')">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-display">${item.quantity}</span>
                                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1}, '${item.color || ''}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="remove-item" onclick="removeFromCart('${item.id}', '${item.color || ''}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            if (cartFooter) cartFooter.style.display = 'block';
        }
    }
    
    // Update totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartSubtotal) cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (cartTotal) cartTotal.textContent = `$${subtotal.toFixed(2)}`;
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
    }
}

function saveCartToStorage() {
    localStorage.setItem('gamezonepro_cart', JSON.stringify(cart));
    // Sync with global cart
    window.cart = cart;
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('gamezonepro_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

// Wishlist Functions
function toggleWishlist(productId) {
    const product = products[productId];
    if (!product) return;
    
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    const button = document.querySelector(`[onclick="toggleWishlist('${productId}')"]`);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        if (button) {
            button.classList.remove('active');
            button.innerHTML = '<i class="far fa-heart"></i>';
        }
        showCartNotification('Removed from wishlist');
    } else {
        wishlist.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.images[0]
        });
        if (button) {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-heart"></i>';
        }
        showCartNotification('Added to wishlist!');
    }
    
    saveWishlistToStorage();
}

function saveWishlistToStorage() {
    localStorage.setItem('gamezonepro_wishlist', JSON.stringify(wishlist));
}

function loadWishlistFromStorage() {
    const savedWishlist = localStorage.getItem('gamezonepro_wishlist');
    if (savedWishlist) {
        wishlist = JSON.parse(savedWishlist);
        
        // Update wishlist button states
        wishlist.forEach(item => {
            const button = document.querySelector(`[onclick="toggleWishlist('${item.id}')"]`);
            if (button) {
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-heart"></i>';
            }
        });
    }
}

// Bundle Functions
function addBundle() {
    addToCart('gamesir', 28.74);
    addToCart('gamesir-g7se', 51.74);
    
    // Apply bundle discount
    const bundleDiscount = 23; // $23 off
    cart.push({
        id: 'bundle_discount',
        name: 'Bundle Discount',
        price: -bundleDiscount,
        image: 'images/bundle-offer.svg',
        quantity: 1
    });
    
    updateCartUI();
    saveCartToStorage();
    showCartNotification('Bundle added to cart with $23 discount!');
    
    // Track bundle purchase
    trackEvent('add_bundle', {
        bundle_name: 'Ultimate Gaming Bundle',
        discount: bundleDiscount
    });
}

// Review Carousel
function initializeReviewCarousel() {
    showReview(0);
}

function showReview(index) {
    const reviews = document.querySelectorAll('.review-card');
    const dots = document.querySelectorAll('.review-dots .dot');
    
    reviews.forEach(review => review.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (reviews[index]) {
        reviews[index].classList.add('active');
    }
    if (dots[index]) {
        dots[index].classList.add('active');
    }
    
    currentReview = index;
}

function nextReview() {
    const reviews = document.querySelectorAll('.review-card');
    const nextIndex = (currentReview + 1) % reviews.length;
    showReview(nextIndex);
}

function previousReview() {
    const reviews = document.querySelectorAll('.review-card');
    const prevIndex = (currentReview - 1 + reviews.length) % reviews.length;
    showReview(prevIndex);
}

// Auto-advance reviews
setInterval(() => {
    if (!isLoading) {
        nextReview();
    }
}, 5000);

// Homepage Quick View Modal
function openHomepageQuickView(productId) {
    const product = products[productId];
    if (!product) return;
    
    let modal = document.getElementById('homepage-quick-view-modal');
    if (!modal) {
        modal = createHomepageQuickViewModal();
    }
    
    populateHomepageQuickView(product);
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

function createHomepageQuickViewModal() {
    const modal = document.createElement('div');
    modal.id = 'homepage-quick-view-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content quick-view-content">
            <button class="close-modal" onclick="closeHomepageQuickView()">
                <i class="fas fa-times"></i>
            </button>
            <div class="quick-view-body" id="homepage-quick-view-body">
                <!-- Quick view content will be populated here -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function populateHomepageQuickView(product) {
    const body = document.getElementById('homepage-quick-view-body');
    if (!body) return;
    
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    body.innerHTML = `
        <div class="controllers-quick-view-grid">
            <div class="controllers-quick-view-images">
                <div class="controllers-main-image">
                    <img src="${product.images[0]}" alt="${product.name}" id="homepage-quick-view-main-img">
                </div>
                ${product.images && product.images.length > 1 ? `
                    <div class="controllers-thumbnail-images">
                        ${product.images.map((img, index) => 
                            `<img src="${img}" alt="${product.name}" 
                                  class="controllers-thumbnail ${index === 0 ? 'active' : ''}" 
                                  onclick="changeHomepageQuickViewImage('${img}', this)">`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="controllers-quick-view-info">
                <h2>${product.name}</h2>
                <div class="controllers-rating">
                    <div class="stars">${generateStars(product.rating)}</div>
                    <span>(${product.reviews || 0} reviews)</span>
                </div>
                <div class="controllers-price">
                    <span class="current-price">$${product.price}</span>
                    ${product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span>` : ''}
                    ${discount > 0 ? `<span class="discount">${discount}% OFF</span>` : ''}
                </div>
                <p class="controllers-description">${product.description}</p>
                
                ${product.colors ? `
                    <div class="controllers-quick-view-colors">
                        <label>Color:</label>
                        <div class="color-options">
                            ${product.colors.map((color, index) => 
                                `<div class="color-option ${index === 0 ? 'selected' : ''}" 
                                     data-color="${color.name}" 
                                     data-price="${color.retailPrice || product.price}"
                                     style="background-color: ${color.code}" 
                                     title="${color.name}"
                                     onclick="selectHomepageQuickViewColor('${product.id}', '${color.name}', ${color.retailPrice || product.price})">
                                </div>`
                            ).join('')}
                        </div>
                        <span class="selected-color-name">${product.colors[0].name}</span>
                    </div>
                ` : ''}
                
                <div class="controllers-features">
                    <h4>Key Features:</h4>
                    <ul>
                        ${product.features ? product.features.slice(0, 4).map(feature => 
                            `<li>${feature}</li>`
                        ).join('') : ''}
                    </ul>
                </div>
                
                <div class="controllers-actions">
                    <button class="btn-add-cart" onclick="addToCartWithColor('${product.id}', ${product.price}); closeHomepageQuickView();">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                    <button class="btn-wishlist ${wishlist && wishlist.includes(product.id) ? 'active' : ''}" 
                            onclick="toggleWishlist('${product.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Track homepage quick view
    trackEvent('homepage_quick_view', {
        product_id: product.id,
        product_name: product.name
    });
}

function selectHomepageQuickViewColor(productId, colorName, price) {
    // Update selected color for this product
    if (!window.selectedColors) {
        window.selectedColors = {};
    }
    window.selectedColors[productId] = colorName;
    
    // Update UI to show selected color
    const colorOptions = document.querySelectorAll('.homepage-quick-view-colors .color-option');
    if (colorOptions) {
        colorOptions.forEach(option => {
            if (option) {
                option.classList.remove('selected');
                if (option.dataset && option.dataset.color === colorName) {
                    option.classList.add('selected');
                }
            }
        });
    }
    
    // Update main image based on selected color
    const product = products[productId];
    if (product && product.images) {
        const colorLower = colorName.toLowerCase();
        // Find image that contains the color name
        const colorImage = product.images.find(img => 
            img.toLowerCase().includes(`(${colorLower})`) || 
            img.toLowerCase().includes(`${colorLower}`)
        );
        
        if (colorImage) {
            const mainImage = document.querySelector('.homepage-main-image img');
            if (mainImage) {
                mainImage.src = colorImage;
                mainImage.alt = `${product.name} - ${colorName}`;
            }
        }
    }
    
    // Update color name display
    const colorNameSpan = document.querySelector('.selected-color-name');
    if (colorNameSpan) {
        colorNameSpan.textContent = colorName;
    }
    
    // Update price if different
    const currentPriceSpan = document.querySelector('.homepage-price .current');
    if (currentPriceSpan && price) {
        currentPriceSpan.textContent = `$${price}`;
    }
    
    // Update button price
    const addToCartBtn = document.querySelector('.homepage-actions .btn-add-cart');
    if (addToCartBtn && price) {
        addToCartBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> ADD TO CART - $${price}`;
        addToCartBtn.setAttribute('onclick', `addToCartWithColor('${productId}', ${price})`);
    }
}

function addToCartWithColor(productId, price) {
    const selectedColor = window.selectedColors ? window.selectedColors[productId] : null;
    const product = products[productId];
    
    if (product && selectedColor) {
        // Find the color object to get the correct price
        const colorObj = product.colors ? product.colors.find(c => c.name === selectedColor) : null;
        const finalPrice = colorObj ? (colorObj.retailPrice || product.price) : price;
        
        // Find color-specific image
        let productImage = product.images[0]; // Default to first image
        if (product.images && selectedColor) {
            const colorLower = selectedColor.toLowerCase();
            const colorImage = product.images.find(img => 
                img.toLowerCase().includes(`(${colorLower})`) || 
                img.toLowerCase().includes(`${colorLower}`)
            );
            if (colorImage) {
                productImage = colorImage;
            }
        }
        
        // Add to cart with color information
        const cartItem = {
            id: productId,
            name: product.name,
            price: finalPrice,
            color: selectedColor,
            image: productImage,
            quantity: 1
        };
        
        // Check if item with same color already exists
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.color === selectedColor);
        
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push(cartItem);
        }
        
        updateCartUI();
        saveCartToStorage();
        showCartNotification(`${product.name} (${selectedColor}) added to cart!`);
    } else {
        // Fallback to regular addToCart if no color selected
        addToCart(productId, price);
    }
}

function closeHomepageQuickView() {
    const modal = document.getElementById('homepage-quick-view-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function changeHomepageQuickViewImage(imageSrc, thumbnail) {
    const mainImg = document.getElementById('homepage-quick-view-main-img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (mainImg) {
        mainImg.src = imageSrc;
    }
    
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });
    
    if (thumbnail) {
        thumbnail.classList.add('active');
    }
}

// Compare Modal
function openCompareModal() {
    const modal = document.getElementById('compare-modal');
    const content = modal.querySelector('.compare-table');
    
    if (modal && content) {
        content.innerHTML = generateComparisonTable();
        modal.classList.add('active');
    }
}

function closeCompareModal() {
    const modal = document.getElementById('compare-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function generateComparisonTable() {
    const product1 = products['gamesir'];
    const product2 = products['gamesir'];
    
    return `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>
                        <img src="${product1.images[0]}" alt="${product1.name}">
                        <h4>${product1.name}</h4>
                    </th>
                    <th>
                        <img src="${product2.images[0]}" alt="${product2.name}">
                        <h4>${product2.name}</h4>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Price</td>
                    <td class="highlight">$${product1.price}</td>
                    <td>$${product2.price}</td>
                </tr>
                <tr>
                    <td>Connectivity</td>
                    <td>${product1.specifications.Connectivity}</td>
                    <td>${product2.specifications.Connectivity}</td>
                </tr>
                <tr>
                    <td>Battery Life</td>
                    <td class="highlight">${product1.specifications['Battery Life']}</td>
                    <td>${product2.specifications['Battery Life']}</td>
                </tr>
                <tr>
                    <td>Weight</td>
                    <td class="highlight">${product1.specifications.Weight}</td>
                    <td>${product2.specifications.Weight}</td>
                </tr>
                <tr>
                    <td>Special Features</td>
                    <td>Hall Effect Joysticks</td>
                    <td class="highlight">RGB Lighting</td>
                </tr>
                <tr>
                    <td>Rating</td>
                    <td class="highlight">${product1.rating}/5 (${product1.reviews} reviews)</td>
                    <td>${product2.rating}/5 (${product2.reviews} reviews)</td>
                </tr>
                <tr>
                    <td>Actions</td>
                    <td>
                        <button class="btn-add-cart" onclick="addToCart('gamesir', ${product1.price})">
                            Add to Cart
                        </button>
                    </td>
                    <td>
                        <button class="btn-add-cart" onclick="addToCart('gamesir', ${product2.price})">
                            Add to Cart
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
}

// Image hover slideshow functionality
let hoverIntervals = new Map();

function initializeImageHoverSlideshow() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const imageContainer = card.querySelector('.product-image-container');
        const mainImage = card.querySelector('.product-image');
        const imageDots = card.querySelectorAll('.image-dot');
        
        if (imageContainer && mainImage && imageDots.length > 1) {
            let currentImageIndex = 0;
            const productId = card.querySelector('[onclick*="openHomepageQuickView"]')?.getAttribute('onclick')?.match(/openHomepageQuickView\('([^']+)'\)/)?.[1];
            
            if (productId && products[productId]) {
                const productImages = products[productId].images;
                
                imageContainer.addEventListener('mouseenter', () => {
                    if (productImages.length > 1) {
                        const interval = setInterval(() => {
                            currentImageIndex = (currentImageIndex + 1) % Math.min(productImages.length, imageDots.length);
                            
                            // Update main image
                            mainImage.src = productImages[currentImageIndex];
                            
                            // Update active dot
                            imageDots.forEach((dot, index) => {
                                dot.classList.toggle('active', index === currentImageIndex);
                            });
                        }, 1000); // Change image every 1 second
                        
                        hoverIntervals.set(card, interval);
                    }
                });
                
                imageContainer.addEventListener('mouseleave', () => {
                    const interval = hoverIntervals.get(card);
                    if (interval) {
                        clearInterval(interval);
                        hoverIntervals.delete(card);
                        
                        // Reset to first image
                        currentImageIndex = 0;
                        mainImage.src = productImages[0];
                        imageDots.forEach((dot, index) => {
                            dot.classList.toggle('active', index === 0);
                        });
                    }
                });
            }
        }
    });
}

// Modern Spin to Win Wheel
let isSpinning = false;
let currentRotation = 0;

const WHEEL_PRIZES = [
    { text: '5% OFF', color: '#FF6B6B', value: 5, weight: 25 },
    { text: '10% OFF', color: '#4ECDC4', value: 10, weight: 20 },
    { text: 'FREE SHIPPING', color: '#45B7D1', value: 'shipping', weight: 15 },
    { text: '15% OFF', color: '#96CEB4', value: 15, weight: 15 },
    { text: '20% OFF', color: '#FECA57', value: 20, weight: 10 },
    { text: 'TRY AGAIN', color: '#FF9FF3', value: 0, weight: 8 },
    { text: '25% OFF', color: '#54A0FF', value: 25, weight: 5 },
    { text: '30% OFF', color: '#5F27CD', value: 30, weight: 2 }
];

function showSpinWheel() {
    const modal = document.getElementById('spin-modal');
    if (modal) {
        generateModernSpinWheel();
        modal.classList.add('active');
        
        // Add entrance animation
        setTimeout(() => {
            const wheelContainer = modal.querySelector('.wheel-container');
            if (wheelContainer) {
                wheelContainer.classList.add('loaded');
            }
        }, 100);
    }
}

function closeSpinModal() {
    const modal = document.getElementById('spin-modal');
    if (modal) {
        modal.classList.remove('active');
        isSpinning = false;
        
        // Reset wheel state
        const wheel = document.getElementById('wheel');
        const spinBtn = document.getElementById('spin-btn');
        const wheelContainer = modal.querySelector('.wheel-container');
        
        if (wheel) {
            wheel.style.transform = 'rotate(0deg)';
            currentRotation = 0;
        }
        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.textContent = 'SPIN NOW';
        }
        if (wheelContainer) {
            wheelContainer.classList.remove('loaded');
        }
    }
}

function generateModernSpinWheel() {
    const wheel = document.getElementById('wheel');
    if (!wheel) return;
    
    const segmentAngle = 360 / WHEEL_PRIZES.length;
    
    wheel.innerHTML = WHEEL_PRIZES.map((prize, index) => {
        const rotation = segmentAngle * index;
        const nextRotation = segmentAngle * (index + 1);
        
        return `
            <div class="wheel-segment" style="
                transform: rotate(${rotation}deg);
                background: linear-gradient(135deg, ${prize.color}, ${adjustBrightness(prize.color, -20)});
                border-right: 2px solid rgba(255, 255, 255, 0.2);
            " data-prize-index="${index}">
                <span>${prize.text}</span>
            </div>
        `;
    }).join('');
    
    // Add subtle rotation animation when wheel is generated
    wheel.style.transform = 'rotate(0deg)';
    wheel.style.transition = 'none';
    currentRotation = 0;
}

function adjustBrightness(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function getWeightedRandomPrize() {
    const totalWeight = WHEEL_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
        random -= WHEEL_PRIZES[i].weight;
        if (random <= 0) {
            return { prize: WHEEL_PRIZES[i], index: i };
        }
    }
    
    return { prize: WHEEL_PRIZES[0], index: 0 };
}

function spinWheel() {
    if (isSpinning) return;
    
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    
    if (!wheel || !spinBtn) return;
    
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.textContent = 'SPINNING...';
    
    // Add spinning class for additional effects
    wheel.classList.add('spinning');
    
    // Get weighted random prize
    const { prize, index } = getWeightedRandomPrize();
    
    // Calculate target rotation
    const segmentAngle = 360 / WHEEL_PRIZES.length;
    const targetSegmentRotation = (segmentAngle * index) + (segmentAngle / 2);
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = (360 * spins) - targetSegmentRotation;
    
    // Apply smooth spinning animation
    wheel.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
    wheel.style.transform = `rotate(${currentRotation + finalRotation}deg)`;
    currentRotation += finalRotation;
    
    // Add sound effect (if available)
    playSpinSound();
    
    // Show result after animation
    setTimeout(() => {
        wheel.classList.remove('spinning');
        showModernPrizeResult(prize);
        
        // Track spin result
        if (typeof trackEvent === 'function') {
            trackEvent('spin_wheel', {
                prize: prize.text,
                value: prize.value,
                weight: prize.weight
            });
        }
        
        isSpinning = false;
    }, 4200);
}

function playSpinSound() {
    // Create a simple audio context for spin sound effect
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silently fail if audio context is not supported
    }
}

function showModernPrizeResult(prize) {
    const modal = document.getElementById('spin-modal');
    const content = modal.querySelector('.spin-wheel-container');
    
    if (!content) return;
    
    const prizeCode = prize.value === 'shipping' ? 'FREESHIP' : `SPIN${prize.value}`;
    const prizeEmoji = prize.value === 'shipping' ? '🚚' : prize.value === 0 ? '😅' : '🎉';
    
    content.innerHTML = `
        <div class="prize-result">
            <h2>${prizeEmoji} ${prize.value === 0 ? 'Better Luck Next Time!' : 'CONGRATULATIONS!'} ${prizeEmoji}</h2>
            <div class="prize-display">
                <h3>You won: ${prize.text}</h3>
            </div>
            ${prize.value !== 0 ? `
                <p>Use code: <strong>${prizeCode}</strong></p>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 10px;">
                    ${prize.value === 'shipping' ? 'Free shipping on your next order!' : `Save ${prize.value}% on your purchase!`}
                </p>
            ` : `
                <p style="color: var(--text-secondary);">Don't worry, you can try again later!</p>
            `}
            <div class="prize-actions">
                ${prize.value !== 0 ? `
                    <button class="btn-primary" onclick="applyDiscount('${prize.value}'); closeSpinModal();">
                        CLAIM NOW
                    </button>
                    <button class="btn-secondary" onclick="closeSpinModal()">
                        SAVE FOR LATER
                    </button>
                ` : `
                    <button class="btn-primary" onclick="generateModernSpinWheel(); document.getElementById('spin-btn').disabled = false; document.getElementById('spin-btn').textContent = 'TRY AGAIN';">
                        TRY AGAIN
                    </button>
                    <button class="btn-secondary" onclick="closeSpinModal()">
                        MAYBE LATER
                    </button>
                `}
            </div>
        </div>
    `;
}

function applyDiscount(value) {
    if (value === 'shipping') {
        showCartNotification('Free shipping applied!');
        localStorage.setItem('freeShipping', 'true');
    } else if (value > 0) {
        showCartNotification(`${value}% discount applied!`);
        localStorage.setItem('discountPercent', value);
    }
}

// Newsletter Subscription
function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();
    
    if (!email) {
        showCartNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showCartNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Simulate API call
    showCartNotification('Thank you for subscribing! Check your email for 10% off code.');
    emailInput.value = '';
    
    // Track subscription
    trackEvent('newsletter_subscribe', {
        email: email
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Checkout Process
function proceedToCheckout() {
    if (cart.length === 0) {
        showCartNotification('Your cart is empty', 'error');
        return;
    }
    
    // Show notification and redirect to checkout page
    showCartNotification('Redirecting to secure checkout...');
    
    // Track checkout initiation
    trackEvent('begin_checkout', {
        cart_value: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        item_count: cart.reduce((sum, item) => sum + item.quantity, 0)
    });
    
    // Save cart to localStorage before redirecting
    saveCartToStorage();
    
    // Redirect to checkout page
    setTimeout(() => {
        window.location.href = 'checkout.html';
    }, 1000);
}

// Utility Functions
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

function showCartNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 5000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Analytics Tracking
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4 tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, parameters);
    }
    
    // Console log for development
    console.log('Event tracked:', eventName, parameters);
}

// AI-Enhanced Features
function getPersonalizedRecommendations() {
    // Simulate AI recommendations based on user behavior
    const viewedProducts = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
    const cartProducts = cart.map(item => item.id);
    
    // Simple recommendation logic for GameSir products
    const gamesirProducts = ['gamesir', 'gamesir-g7se', 'gamesir-supernova', 'gamesir-t7', 'gamesir-g7pro', 'gamesir-nova2lite', 'gamesir-x5lite', 'gamesir-cyclone2'];
    const availableRecommendations = gamesirProducts.filter(product => !cartProducts.includes(product));
    
    return availableRecommendations.slice(0, 2); // Return up to 2 recommendations
}

function showAbandonedCartReminder() {
    // Show reminder if cart has items but user hasn't checked out
    if (cart.length > 0) {
        setTimeout(() => {
            if (cart.length > 0) {
                showCartNotification('Don\'t forget your items! Complete your purchase now.');
            }
        }, 300000); // 5 minutes
    }
}

// Initialize abandoned cart reminder
setTimeout(showAbandonedCartReminder, 1000);

// Auto-save cart every 30 seconds
setInterval(() => {
    if (cart.length > 0) {
        saveCartToStorage();
    }
}, 30000);

// Performance monitoring
window.addEventListener('load', () => {
    // Track page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackEvent('page_load_time', { load_time: loadTime });
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno
    });
});

// Export functions for global access
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.toggleWishlist = toggleWishlist;
window.addBundle = addBundle;
window.toggleCart = toggleCart;
window.openHomepageQuickView = openHomepageQuickView;
window.closeHomepageQuickView = closeHomepageQuickView;
window.changeHomepageQuickViewImage = changeHomepageQuickViewImage;
window.selectHomepageQuickViewColor = selectHomepageQuickViewColor;
window.addToCartWithColor = addToCartWithColor;
window.openCompareModal = openCompareModal;
window.closeCompareModal = closeCompareModal;
window.showSpinWheel = showSpinWheel;
window.closeSpinModal = closeSpinModal;
window.spinWheel = spinWheel;
window.subscribeNewsletter = subscribeNewsletter;
window.proceedToCheckout = proceedToCheckout;
window.scrollToProducts = scrollToProducts;
window.nextReview = nextReview;
window.previousReview = previousReview;
window.filterProducts = filterProducts;

// SEO and Category Filtering Functions
function filterProducts(category) {
    currentFilter = category;
    
    // Track category selection for SEO analytics
    trackEvent('category_filter', {
        category: category,
        keywords: seoKeywords[category] || []
    });
    
    // Update URL with category parameter for SEO
    const url = new URL(window.location);
    url.searchParams.set('category', category);
    window.history.pushState({}, '', url);
    
    // Highlight active category
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add visual feedback
    event.target.classList.add('active');
    
    // Scroll to products section
    scrollToProducts();
    
    // Show category-specific notification
    const categoryNames = {
        'pc': 'PC Gaming Controllers',
        'xbox': 'Xbox Controllers',
        'mobile': 'Mobile Gaming Controllers',
        'pro': 'Pro Gaming Controllers'
    };
    
    showCartNotification(`Showing ${categoryNames[category] || 'All Controllers'}`);
    
    // Update page title for SEO
    updatePageTitleForCategory(category);
}

function updatePageTitleForCategory(category) {
    const categoryTitles = {
        'pc': 'Best Gaming Controller for PC | Hall Effect Joysticks - GameZone Pro',
        'xbox': 'Buy Xbox Controller Wireless | Xbox Elite Series 2 - GameZone Pro',
        'mobile': 'Bluetooth Controller for Mobile Gaming | Under $58 - GameZone Pro',
        'pro': 'Pro Gaming Controllers | Tournament Legal | Custom Design - GameZone Pro'
    };
    
    if (categoryTitles[category]) {
        document.title = categoryTitles[category];
    }
}

// SEO Keyword Tracking
function trackKeywordInteraction(keyword, action = 'view') {
    trackEvent('seo_keyword_interaction', {
        keyword: keyword,
        action: action,
        timestamp: new Date().toISOString()
    });
}

// Initialize SEO features on page load
function initializeSEO() {
    // Check URL parameters for category
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category && seoKeywords[category]) {
        currentFilter = category;
        updatePageTitleForCategory(category);
    }
    
    // Track page view with keywords
    trackEvent('page_view', {
        page: 'home',
        keywords: Object.values(seoKeywords).flat(),
        filter: currentFilter
    });
}

// Add to initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeSEO();
});

// Enhanced product search functionality
function searchProducts(query) {
    const searchTerms = query.toLowerCase().split(' ');
    const allKeywords = Object.values(seoKeywords).flat();
    
    // Track search query
    trackEvent('search', {
        search_term: query,
        matched_keywords: allKeywords.filter(keyword => 
            searchTerms.some(term => keyword.includes(term))
        )
    });
    
    // Show search results notification
    showCartNotification(`Searching for: ${query}`);
}

// Export new functions
window.searchProducts = searchProducts;
window.trackKeywordInteraction = trackKeywordInteraction;