// Controllers Page JavaScript

// Initialize controllers page
let compareList = [];
let selectedColors = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeControllersPage();
    loadProducts();
    setupControllerEventListeners();
    loadWishlistFromStorage();
    loadCompareFromStorage();
});

// Function specifically for brand pages like gamesir.html
function initControllersPage(filterType = 'all') {
    initializeControllersPage(filterType);
    loadProducts(filterType);
    setupControllerEventListeners(filterType);
    loadWishlistFromStorage();
    loadCompareFromStorage();
}

function initializeControllersPage(filterType = 'all') {
    // Initialize AOS animations
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
}

// Wishlist Functions
function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(productId);
    }
    
    saveWishlistToStorage();
    updateWishlistUI(productId);
    
    // Show notification
    const product = products[productId];
    const message = index > -1 ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`;
    showNotification(message);
}

function loadWishlistFromStorage() {
    const saved = localStorage.getItem('gamezone_wishlist');
    if (saved) {
        wishlist = JSON.parse(saved);
    }
}

function saveWishlistToStorage() {
    localStorage.setItem('gamezone_wishlist', JSON.stringify(wishlist));
}

function updateWishlistUI(productId) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        const wishlistBtn = card.querySelector('.wishlist-btn');
        const isInWishlist = wishlist.includes(productId);
        
        if (isInWishlist) {
            wishlistBtn.classList.add('active');
            wishlistBtn.title = 'Remove from Wishlist';
        } else {
            wishlistBtn.classList.remove('active');
            wishlistBtn.title = 'Add to Wishlist';
        }
    }
}

// Compare Functions
function toggleCompare(productId) {
    const index = compareList.indexOf(productId);
    
    if (index > -1) {
        compareList.splice(index, 1);
    } else {
        if (compareList.length >= 3) {
            showNotification('You can only compare up to 3 products at once');
            return;
        }
        compareList.push(productId);
    }
    
    saveCompareToStorage();
    updateCompareUI(productId);
    updateCompareCounter();
    
    const product = products[productId];
    const message = index > -1 ? `${product.name} removed from compare` : `${product.name} added to compare`;
    showNotification(message);
}

function loadCompareFromStorage() {
    const saved = localStorage.getItem('gamezone_compare');
    if (saved) {
        compareList = JSON.parse(saved);
    }
    updateCompareCounter();
}

function saveCompareToStorage() {
    localStorage.setItem('gamezone_compare', JSON.stringify(compareList));
}

function updateCompareUI(productId) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        const compareBtn = card.querySelector('.compare-btn');
        const isInCompare = compareList.includes(productId);
        
        if (isInCompare) {
            compareBtn.classList.add('active');
            compareBtn.title = 'Remove from Compare';
        } else {
            compareBtn.classList.remove('active');
            compareBtn.title = 'Add to Compare';
        }
    }
}

function updateCompareCounter() {
    const counter = document.getElementById('compare-counter');
    if (counter) {
        counter.textContent = compareList.length;
        counter.style.display = compareList.length > 0 ? 'block' : 'none';
    }
}

function openCompareModal() {
    if (compareList.length === 0) {
        showNotification('Add products to compare first');
        return;
    }
    
    const modal = document.getElementById('compare-modal');
    if (!modal) {
        createCompareModal();
    }
    
    populateCompareModal();
    document.getElementById('compare-modal').style.display = 'block';
}

function createCompareModal() {
    const modal = document.createElement('div');
    modal.id = 'compare-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content compare-modal-content">
            <div class="modal-header">
                <h2>Compare Controllers</h2>
                <button class="close-modal" onclick="closeCompareModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="compare-content" id="compare-content">
                <!-- Compare content will be populated here -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function populateCompareModal() {
    const content = document.getElementById('compare-content');
    if (!content) return;
    
    const compareProducts = compareList.map(id => products[id]).filter(Boolean);
    
    content.innerHTML = `
        <div class="compare-grid">
            ${compareProducts.map(product => `
                <div class="compare-item">
                    <div class="compare-image">
                        <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                        <button class="remove-compare" onclick="toggleCompare('${product.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <h3>${product.name}</h3>
                    <div class="compare-price" data-price="${product.price}"></div>
                    <div class="compare-features">
                        ${product.features ? product.features.slice(0, 3).map(feature => 
                            `<div class="feature-item">${feature}</div>`
                        ).join('') : ''}
                    </div>
                    <div class="compare-specs">
                        ${Object.entries(product.specifications || {}).slice(0, 4).map(([key, value]) => 
                            `<div class="spec-item"><strong>${key}:</strong> ${value}</div>`
                        ).join('')}
                    </div>
                    <button class="btn-add-cart" onclick="addToCartWithOptions('${product.id}')">
                        Add to Cart
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function closeCompareModal() {
    const modal = document.getElementById('compare-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Color Selection Functions
function setupColorSelection() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('color-option')) {
            const card = e.target.closest('.product-card');
            if (!card) return;
            const productId = card.getAttribute('data-product-id');
            if (!productId) return;
            const colorName = e.target.getAttribute('data-color');
            const colorPrice = e.target.getAttribute('data-price');
            const product = products[productId];

            // Update selected color
            selectedColors[productId] = {
                name: colorName,
                price: product ? product.price : parseFloat(colorPrice)
            };
            
            // Update UI
            const colorOptions = card.querySelectorAll('.color-option');
            colorOptions.forEach(option => option.classList.remove('selected'));
            e.target.classList.add('selected');
            
            // Update price and color name
            const priceValue = card.querySelector('.current-price');
            const colorNameSpan = card.querySelector('.selected-color-name');

            // Keep price consistent across colors (use base product price)
            if (priceValue && product) {
                priceValue.setAttribute('data-price', product.price);
            }
            if (colorNameSpan) colorNameSpan.textContent = colorName;

            // Apply currency formatting after updates
            if (typeof updateAllPrices === 'function') {
                updateAllPrices();
            }

            // Update preview image to match selected color, if available
            if (product && product.images && product.images.length) {
                const images = card.querySelectorAll('.product-img');
                const dots = card.querySelectorAll('.dot');
                const colorLower = colorName.toLowerCase();
                let targetIndex = 0;
                product.images.forEach((img, index) => {
                    const imgLower = img.toLowerCase();
                    if (imgLower.includes(`(${colorLower})`) || imgLower.includes(colorLower)) {
                        targetIndex = index;
                    }
                });

                images.forEach(img => img.classList.remove('active'));
                if (images[targetIndex]) images[targetIndex].classList.add('active');

                dots.forEach(dot => dot.classList.remove('active'));
                if (dots[targetIndex]) dots[targetIndex].classList.add('active');
            }
        }
    });
}

// Enhanced Add to Cart with Options
function addToCartWithOptions(productId) {
    const product = products[productId];
    if (!product) return;
    
    const selectedColor = selectedColors[productId];
    const colorName = selectedColor ? selectedColor.name : (product.colors ? product.colors[0].name : null);
    
    // Price stays consistent regardless of color
    const finalPrice = product.price;
    
    // Find color-specific image
    let productImage = product.images[0]; // Default to first image
    if (product.images && colorName) {
        const colorLower = colorName.toLowerCase();
        const colorImage = product.images.find(img => 
            img.toLowerCase().includes(`(${colorLower})`) || 
            img.toLowerCase().includes(`${colorLower}`)
        );
        if (colorImage) {
            productImage = colorImage;
        }
    }
    
    const cartItem = {
        id: productId,
        name: product.name,
        price: finalPrice,
        image: productImage,
        color: colorName,
        quantity: 1
    };
    
    // Check if item with same color already exists
    const existingIndex = cart.findIndex(item => 
        item.id === productId && item.color === colorName
    );
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }
    
    saveCartToStorage();
    updateCartUI();
    showNotification(`${product.name}${colorName ? ` (${colorName})` : ''} added to cart`);
}

// Quick View Modal
function openControllersQuickView(productId) {
    const product = products[productId];
    if (!product) return;
    
    let modal = document.getElementById('controllers-quick-view-modal');
    if (!modal) {
        modal = createControllersQuickViewModal();
    }
    
    populateControllersQuickView(product);
    modal.style.display = 'block';
}

function createControllersQuickViewModal() {
    const modal = document.createElement('div');
    modal.id = 'controllers-quick-view-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content controllers-quick-view-content">
            <button class="close-modal" onclick="closeControllersQuickView()">
                <i class="fas fa-times"></i>
            </button>
            <div class="controllers-quick-view-body" id="controllers-quick-view-body">
                <!-- Quick view content will be populated here -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function populateControllersQuickView(product) {
    const body = document.getElementById('controllers-quick-view-body');
    if (!body) return;
    
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    body.innerHTML = `
        <div class="controllers-quick-view-grid">
            <div class="controllers-quick-view-images">
                <div class="controllers-main-image">
                    <img src="${product.images[0]}" alt="${product.name}" id="controllers-quick-view-main-img">
                </div>
                ${product.images && product.images.length > 1 ? `
                    <div class="controllers-thumbnail-images">
                        ${product.images.map((img, index) => 
                            `<img src="${img}" alt="${product.name}" loading="lazy"
                                  class="controllers-thumbnail ${index === 0 ? 'active' : ''}" 
                                  onclick="changeControllersQuickViewImage('${img}', this)">`
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
                    <span class="current-price" data-price="${product.price}"></span>
                    ${product.originalPrice ? `<span class="original-price" data-price="${product.originalPrice}"></span>` : ''}
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
                                     data-price="${product.price}"
                                     style="background-color: ${color.code}" 
                                     title="${color.name}"
                                     onclick="selectControllersQuickViewColor('${product.id}', '${color.name}', ${product.price})">
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
                    <button class="btn-add-cart" onclick="addToCartWithOptions('${product.id}'); closeControllersQuickView();">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                    <button class="btn-wishlist ${wishlist.includes(product.id) ? 'active' : ''}" 
                            onclick="toggleWishlist('${product.id}')">
                        <i class="fas fa-heart"></i>
                        ${wishlist.includes(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Format prices within the quick view modal
    if (typeof updateAllPrices === 'function') {
        updateAllPrices();
    }
}

function changeControllersQuickViewImage(src, thumbnail) {
    const mainImg = document.getElementById('controllers-quick-view-main-img');
    const thumbnails = document.querySelectorAll('.controllers-thumbnail');
    
    if (mainImg) mainImg.src = src;
    
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    thumbnail.classList.add('active');
}

function selectControllersQuickViewColor(productId, colorName, price) {
    const product = products[productId];
    // Update selected color object for this product
    selectedColors[productId] = {
        name: colorName,
        price: product ? product.price : (price || 0)
    };
    
    // Update UI to show selected color
    const colorOptions = document.querySelectorAll('.controllers-quick-view-colors .color-option');
    colorOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === colorName) {
            option.classList.add('selected');
        }
    });
    
    // Update main image based on selected color
    if (product && product.images) {
        const colorLower = colorName.toLowerCase();
        // Find image that contains the color name
        const colorImage = product.images.find(img => 
            img.toLowerCase().includes(`(${colorLower})`) || 
            img.toLowerCase().includes(`${colorLower}`)
        );
        
        if (colorImage) {
            const mainImage = document.querySelector('.controllers-main-image img');
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
    
    // Keep price consistent across colors (use base product price)
    const currentPriceSpan = document.querySelector('.controllers-quick-view-info .current-price');
    if (currentPriceSpan && product) {
        currentPriceSpan.setAttribute('data-price', product.price);
        if (typeof updateAllPrices === 'function') {
            updateAllPrices();
        }
    }
}

function closeControllersQuickView() {
    const modal = document.getElementById('controllers-quick-view-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Image Carousel Functions
function initializeImageCarousels() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('dot')) {
            const card = e.target.closest('.product-card');
            const index = parseInt(e.target.getAttribute('data-index'));
            const images = card.querySelectorAll('.product-img');
            const dots = card.querySelectorAll('.dot');
            
            // Remove active class from all
            images.forEach(img => img.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            // Add active class to selected
            images[index].classList.add('active');
            e.target.classList.add('active');
        }
    });
}

// Notification System
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize all new features
document.addEventListener('DOMContentLoaded', function() {
    setupColorSelection();
    initializeImageCarousels();
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Load cart from storage
    loadCartFromStorage();
    updateCartUI();
    
    // Setup floating particles
    createFloatingParticles();
});

function setupControllerEventListeners(currentFilter = 'all') {
    // Search functionality
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            searchInput.focus();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => handleSearch(currentFilter));
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => handleSort(currentFilter));
    }
    
    // Add other filter event listeners as needed
    const filterSelects = document.querySelectorAll('select[id$="-filter"]');
    filterSelects.forEach(select => {
        select.addEventListener('change', () => handleFilter(currentFilter));
    });
    
    // Close search on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
    });
    
    // Close search on overlay click
    if (searchOverlay) {
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                closeSearch();
            }
        });
    }
}

function closeSearch() {
    const searchOverlay = document.getElementById('search-overlay');
    if (searchOverlay) {
        searchOverlay.classList.remove('active');
    }
}

// Load and display products with optional filtering
function loadProducts(filterType = 'all') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    // Get controller products from the main products object
    let controllerProducts = Object.values(products).filter(product => 
        product.category === 'controller'
    );
    
    // Apply initial filter based on page type
    if (filterType !== 'all') {
        controllerProducts = applyPageFilter(controllerProducts, filterType);
    }
    
    controllerProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Animate product cards
    gsap.fromTo('.product-card', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );

    // Ensure currency formatting is applied after initial render
    if (typeof updateAllPrices === 'function') {
        updateAllPrices();
    }

    // Generate Product JSON-LD for the visible controllers
    if (Array.isArray(controllerProducts) && controllerProducts.length) {
        generateProductJsonLd(controllerProducts);
    }
}

// Apply page-specific filters
function applyPageFilter(products, filterType) {
    switch (filterType) {
        case 'gamesir':
            return products.filter(product => 
                product.brand && product.brand.toLowerCase().includes('gamesir')
            );

        case 'wireless':
            return products.filter(product => 
                product.specifications && 
                (product.specifications['Connection'] === 'Wireless' ||
                 product.specifications['Connection'] === 'Wireless + USB-C' ||
                 product.specifications['Connectivity'] === 'Wireless' ||
                 product.specifications['Connectivity'] === 'Bluetooth + 2.4GHz')
            );
        case 'mobile':
            return products.filter(product => 
                product.specifications && 
                (product.specifications['Compatibility'] && 
                 product.specifications['Compatibility'].toLowerCase().includes('mobile')) ||
                (product.features && 
                 product.features.some(feature => 
                     feature.toLowerCase().includes('mobile') || 
                     feature.toLowerCase().includes('phone') ||
                     feature.toLowerCase().includes('clip')
                 ))
            );
        case 'pro':
            return products.filter(product => 
                product.features && 
                product.features.some(feature => 
                    feature.toLowerCase().includes('hall effect') ||
                    feature.toLowerCase().includes('pro') ||
                    feature.toLowerCase().includes('tournament') ||
                    feature.toLowerCase().includes('competitive')
                ) ||
                product.price > 100 // Pro controllers are typically higher priced
            );
        default:
            return products;
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', getProductCategory(product));
    card.setAttribute('data-product-id', product.id);
    
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'images/placeholder.webp';
    const isInWishlist = wishlist.includes(product.id);
    const isInCompare = compareList.includes(product.id);
    
    // Generate color options if available
    const colorOptions = product.colors ? product.colors.map(color => 
        `<div class="color-option" 
             data-color="${color.name}" 
             data-price="${product.price}"
             style="background-color: ${color.code}" 
             title="${color.name} - $${product.price}">
        </div>`
    ).join('') : '';
    
    card.innerHTML = `
        <div class="product-image">
            <div class="image-carousel">
                ${product.images ? product.images.map((img, index) => 
                    `<img src="${img}" alt="${product.name}" loading="lazy" class="product-img ${index === 0 ? 'active' : ''}">`
                ).join('') : `<img src="${mainImage}" alt="${product.name}" loading="lazy" class="product-img active">`}
            </div>
            ${product.images && product.images.length > 1 ? `
                <div class="image-dots">
                    ${product.images.map((_, index) => 
                        `<span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`
                    ).join('')}
                </div>
            ` : ''}
            ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ''}
            <div class="product-actions">
                <button class="action-btn wishlist-btn ${isInWishlist ? 'active' : ''}" 
                        onclick="toggleWishlist('${product.id}')" 
                        title="${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="action-btn" onclick="openControllersQuickView('${product.id}')" title="Quick View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn compare-btn ${isInCompare ? 'active' : ''}" 
                        onclick="toggleCompare('${product.id}')" 
                        title="${isInCompare ? 'Remove from Compare' : 'Add to Compare'}">
                    <i class="fas fa-balance-scale"></i>
                </button>
            </div>
        </div>
        
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            
            <div class="product-features">
                ${getProductTags(product).map(tag => `<span class="feature-tag">${tag}</span>`).join('')}
            </div>
            
            <div class="product-rating">
                <div class="stars">${generateStars(product.rating)}</div>
                <span class="rating-text">(${product.reviews || 0} reviews)</span>
            </div>
            
            ${colorOptions ? `
                <div class="color-selection">
                    <label class="color-label">Color:</label>
                    <div class="color-options">
                        ${colorOptions}
                    </div>
                    <span class="selected-color-name">${product.colors[0].name}</span>
                </div>
            ` : ''}
            
            <div class="product-price">
                <span class="current-price" data-price="${product.price}"></span>
                ${product.originalPrice ? `<span class="original-price" data-price="${product.originalPrice}"></span>` : ''}
                ${discount > 0 ? `<span class="discount">${discount}% OFF</span>` : ''}
            </div>
            
            <div class="product-buttons">
                <button class="btn-add-cart" onclick="addToCartWithOptions('${product.id}')">
                    <i class="fas fa-shopping-cart"></i>
                    Add to Cart
                </button>
                <button class="btn-quick-view" onclick="openControllersQuickView('${product.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function getProductCategory(product) {
    const categories = [];
    
    // Brand categories
    if (product.id.includes('gamesir')) categories.push('gamesir');
    
    
    // Feature categories
    if (product.specifications?.Connectivity?.includes('Wireless') || 
        product.specifications?.Connectivity?.includes('Bluetooth')) {
        categories.push('wireless');
    }
    
    if (product.specifications?.Compatibility?.includes('Android') || 
        product.specifications?.Compatibility?.includes('iOS') ||
        product.features?.some(f => f.toLowerCase().includes('mobile'))) {
        categories.push('mobile');
    }
    
    if (product.price >= 80 || 
        product.features?.some(f => f.toLowerCase().includes('pro') || f.toLowerCase().includes('tournament'))) {
        categories.push('pro');
    }
    
    return categories.join(' ');
}

function getProductTags(product) {
    const tags = [];
    
    if (product.features?.some(f => f.toLowerCase().includes('hall effect'))) {
        tags.push('Hall Effect');
    }
    
    if (product.specifications?.Connectivity?.includes('Wireless')) {
        tags.push('Wireless');
    }
    
    if (product.specifications?.Connectivity?.includes('Bluetooth')) {
        tags.push('Bluetooth');
    }
    
    if (product.features?.some(f => f.toLowerCase().includes('rgb'))) {
        tags.push('RGB');
    }
    
    if (product.features?.some(f => f.toLowerCase().includes('programmable'))) {
        tags.push('Programmable');
    }
    
    return tags.slice(0, 3); // Limit to 3 tags
}

function filterProducts(category) {
    const productCards = document.querySelectorAll('.product-card');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Update active filter button
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    // Filter products
    productCards.forEach(card => {
        const cardCategories = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategories.includes(category)) {
            card.style.display = 'block';
            gsap.fromTo(card, 
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
            );
        } else {
            gsap.to(card, {
                opacity: 0,
                scale: 0.8,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    card.style.display = 'none';
                }
            });
        }
    });
    
    // Track filter interaction
    trackEvent('filter_products', {
        category: category,
        timestamp: new Date().toISOString()
    });
}

function sortProducts(sortBy) {
    const productsGrid = document.getElementById('products-grid');
    const productCards = Array.from(productsGrid.children);
    
    productCards.sort((a, b) => {
        const productA = getProductFromCard(a);
        const productB = getProductFromCard(b);
        
        switch (sortBy) {
            case 'price-low':
                return productA.price - productB.price;
            case 'price-high':
                return productB.price - productA.price;
            case 'rating':
                return productB.rating - productA.rating;
            case 'newest':
                return productB.id.localeCompare(productA.id);
            default:
                return 0;
        }
    });
    
    // Re-append sorted cards
    productCards.forEach(card => {
        productsGrid.appendChild(card);
    });
    
    // Animate sorted products
    gsap.fromTo(productCards, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
    );
}

function getProductFromCard(card) {
    const title = card.querySelector('.product-title').textContent;
    return Object.values(products).find(p => p.name === title);
}

function loadMoreProducts() {
    // Simulate loading more products
    const loadMoreBtn = document.querySelector('.load-more-container button');
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    setTimeout(() => {
        loadMoreBtn.innerHTML = '<span>No More Controllers</span>';
        loadMoreBtn.disabled = true;
        loadMoreBtn.style.opacity = '0.5';
    }, 1500);
}

function searchProducts(query) {
    if (!query || query.length < 2) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }
    
    const results = Object.values(products).filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.features?.some(f => f.toLowerCase().includes(query.toLowerCase()))
    );
    
    displaySearchResults(results, query);
}

// Handle search functionality
function handleSearch(currentFilter = 'all') {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase();
    
    let controllerProducts = Object.values(products).filter(product => 
        product.category === 'controller'
    );
    
    // Apply page filter first
    if (currentFilter !== 'all') {
        controllerProducts = applyPageFilter(controllerProducts, currentFilter);
    }
    
    // Then apply search filter
    const filteredProducts = controllerProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.features && product.features.some(feature => 
            feature.toLowerCase().includes(searchTerm)
        )) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm))
    );
    
    displayProducts(filteredProducts);
    
    // Show/hide no results message
    const noResults = document.getElementById('no-results');
    if (noResults) {
        noResults.style.display = filteredProducts.length === 0 ? 'block' : 'none';
    }
}

// Handle sorting
function handleSort(currentFilter = 'all') {
    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect.value;
    
    let controllerProducts = Object.values(products).filter(product => 
        product.category === 'controller'
    );
    
    // Apply page filter first
    if (currentFilter !== 'all') {
        controllerProducts = applyPageFilter(controllerProducts, currentFilter);
    }
    
    // Apply search filter if there's a search term
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        controllerProducts = controllerProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.features && product.features.some(feature => 
                feature.toLowerCase().includes(searchTerm)
            )) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply sorting
    switch (sortValue) {
        case 'price-low':
            controllerProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            controllerProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            controllerProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
        default:
            controllerProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayProducts(controllerProducts);
}

// Handle filtering
function handleFilter(currentFilter = 'all') {
    // Get all current filter values
    const connectionFilter = document.getElementById('connection-filter');
    const brandFilter = document.getElementById('brand-filter');
    const platformFilter = document.getElementById('platform-filter');
    const priceFilter = document.getElementById('price-filter');
    
    let controllerProducts = Object.values(products).filter(product => 
        product.category === 'controller'
    );
    
    // Apply page filter first
    if (currentFilter !== 'all') {
        controllerProducts = applyPageFilter(controllerProducts, currentFilter);
    }
    
    // Apply additional filters
    if (connectionFilter && connectionFilter.value !== 'all') {
        const connectionValue = connectionFilter.value;
        controllerProducts = controllerProducts.filter(product => {
            const connection = product.specifications?.['Connection'] || product.specifications?.['Connectivity'] || '';
            return connection.toLowerCase().includes(connectionValue);
        });
    }
    
    if (brandFilter && brandFilter.value !== 'all') {
        const brandValue = brandFilter.value;
        controllerProducts = controllerProducts.filter(product => 
            product.brand && product.brand.toLowerCase().includes(brandValue)
        );
    }
    
    if (platformFilter && platformFilter.value !== 'all') {
        const platformValue = platformFilter.value;
        controllerProducts = controllerProducts.filter(product => {
            const compatibility = product.specifications?.['Compatibility'] || '';
            return compatibility.toLowerCase().includes(platformValue);
        });
    }
    
    if (priceFilter && priceFilter.value !== 'all') {
        const priceRange = priceFilter.value;
        controllerProducts = controllerProducts.filter(product => {
            const price = product.price;
            switch (priceRange) {
                case '0-50':
                    return price < 50;
                case '50-100':
                    return price >= 50 && price < 100;
                case '100-200':
                    return price >= 100 && price < 200;
                case '200+':
                    return price >= 200;
                default:
                    return true;
            }
        });
    }
    
    // Apply search filter if there's a search term
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        controllerProducts = controllerProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.features && product.features.some(feature => 
                feature.toLowerCase().includes(searchTerm)
            )) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply current sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        const sortValue = sortSelect.value;
        switch (sortValue) {
            case 'price-low':
                controllerProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                controllerProducts.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                controllerProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'name':
            default:
                controllerProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
    }
    
    displayProducts(controllerProducts);
    
    // Show/hide no results message
    const noResults = document.getElementById('no-results');
    if (noResults) {
        noResults.style.display = controllerProducts.length === 0 ? 'block' : 'none';
    }
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #888;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No controllers found for "${query}"</p>
            </div>
        `;
        return;
    }
    
    searchResults.innerHTML = results.map(product => `
        <div class="search-result-item" onclick="selectSearchResult('${product.id}')">
            <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
            <div class="result-info">
                <h4>${product.name}</h4>
                <p data-price="${product.price}"></p>
            </div>
        </div>
    `).join('');
    
    // Apply currency formatting after inserting search results
    if (typeof updateAllPrices === 'function') {
        updateAllPrices();
    }
}

function selectSearchResult(productId) {
    closeSearch();
    openControllersQuickView(productId);
}

function createFloatingParticles() {
    const particleContainers = document.querySelectorAll('.floating-particles');
    
    particleContainers.forEach(container => {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 1}px;
                height: ${Math.random() * 4 + 1}px;
                background: rgba(0, 255, 157, ${Math.random() * 0.5 + 0.1});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 10}s infinite linear;
            `;
            container.appendChild(particle);
        }
    });
}

// Add CSS for particle animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .search-result-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #333;
        cursor: pointer;
        transition: background 0.3s ease;
    }
    
    .search-result-item:hover {
        background: rgba(0, 255, 157, 0.1);
    }
    
    .search-result-item img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
        margin-right: 1rem;
    }
    
    .result-info h4 {
        margin: 0 0 0.5rem 0;
        color: #fff;
        font-size: 1rem;
    }
    
    .result-info p {
        margin: 0;
        color: var(--accent-color);
        font-weight: 600;
    }
`;
document.head.appendChild(style);

// Add displayProducts function
function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    // Ensure currency formatting is applied to newly rendered prices
    if (typeof updateAllPrices === 'function') {
        updateAllPrices();
    }

    // Regenerate Product JSON-LD for the currently displayed set
    if (Array.isArray(products) && products.length) {
        generateProductJsonLd(products);
    }
    
    // Animate product cards
    gsap.fromTo('.product-card', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
}

// Generate and inject Product JSON-LD for a list of products
function generateProductJsonLd(productList) {
    try {
        const origin = window.location.origin || '';
        const priceCurrency = (typeof userCurrency === 'string' && userCurrency) ? userCurrency : 'USD';
        const items = productList.map(p => {
            const images = Array.isArray(p.images) ? p.images.map(img => img.startsWith('http') ? img : `${origin}/${img}`) : [];
            const offers = (Array.isArray(p.colors) && p.colors.length)
                ? p.colors.map(c => ({
                    '@type': 'Offer',
                    price: Number(c.retailPrice || p.price),
                    priceCurrency,
                    availability: 'https://schema.org/InStock',
                    url: `${origin}/controllers.html#${encodeURIComponent(p.id)}-${encodeURIComponent(c.name)}`
                  }))
                : [{
                    '@type': 'Offer',
                    price: Number(p.price),
                    priceCurrency,
                    availability: 'https://schema.org/InStock',
                    url: `${origin}/controllers.html#${encodeURIComponent(p.id)}`
                  }];
            const aggregateRating = (p.rating || p.reviews)
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: Number(p.rating || 0),
                    reviewCount: Number(p.reviews || 0)
                  }
                : undefined;
            return {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: p.name,
                description: p.description,
                sku: p.id,
                brand: p.brand ? { '@type': 'Brand', name: p.brand } : { '@type': 'Brand', name: 'GameZone Pro' },
                image: images,
                offers,
                ...(aggregateRating ? { aggregateRating } : {})
            };
        });

        const graph = {
            '@context': 'https://schema.org',
            '@graph': items
        };

        // Remove existing block to avoid duplicates
        const existing = document.getElementById('product-jsonld');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'product-jsonld';
        script.textContent = JSON.stringify(graph);
        document.head.appendChild(script);
    } catch (e) {
        console.warn('Failed to generate Product JSON-LD:', e);
    }
}

// Export functions for global access
window.filterProducts = filterProducts;
window.sortProducts = sortProducts;
window.loadMoreProducts = loadMoreProducts;
window.searchProducts = searchProducts;
window.closeSearch = closeSearch;
window.selectSearchResult = selectSearchResult;
window.handleSearch = handleSearch;
window.handleSort = handleSort;
window.handleFilter = handleFilter;
window.displayProducts = displayProducts;
window.openControllersQuickView = openControllersQuickView;
window.closeControllersQuickView = closeControllersQuickView;
window.changeControllersQuickViewImage = changeControllersQuickViewImage;
window.selectControllersQuickViewColor = selectControllersQuickViewColor;
window.toggleWishlist = toggleWishlist;
window.addToCartWithOptions = addToCartWithOptions;
window.toggleCompare = toggleCompare;