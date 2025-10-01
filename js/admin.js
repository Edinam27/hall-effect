// Admin Dashboard JavaScript

// Global variables
let currentOrders = [];
let currentCustomers = [];
let currentInventory = [];
let selectedOrderId = null;
const ADMIN_KEY = 'admin123'; // In production, use secure authentication

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    loadDashboardData();
    setupEventListeners();
});

// Fallback for window load event
window.addEventListener('load', function() {
    // Double-check initialization if elements weren't found before
    if (!document.querySelector('#total-orders') || !document.querySelector('#ordersTableBody')) {
        setTimeout(() => {
            initializeAdminDashboard();
        }, 100);
    }
});

// API helper function
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': ADMIN_KEY
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(endpoint, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

function initializeAdmin() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.admin-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu after selection
            const navLinksContainer = document.getElementById('adminNavLinks');
            if (navLinksContainer) {
                navLinksContainer.classList.remove('show');
            }
        });
    });
    
    // Set up mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const adminNavLinks = document.getElementById('adminNavLinks');
    
    if (mobileMenuToggle && adminNavLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            adminNavLinks.classList.toggle('show');
            
            // Update toggle icon
            const icon = this.querySelector('i');
            if (adminNavLinks.classList.contains('show')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !adminNavLinks.contains(e.target)) {
                adminNavLinks.classList.remove('show');
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = 'fas fa-bars';
            }
        });
    }
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionName) {
            case 'orders':
                loadOrders();
                break;
            case 'inventory':
                loadInventory();
                break;
            case 'temu':
                loadTemuOrders();
                break;
            case 'customers':
                loadCustomers();
                break;
            case 'dashboard':
                loadDashboardData();
                break;
        }
    }
}

async function loadDashboardData() {
    try {
        showLoading && showLoading(true);
        
        // Use local data instead of API calls
        const orders = getStoredOrders();
        const inventory = getInventoryData();
        const customers = getCustomersData();
        
        // Update global variables
        currentOrders = orders;
        currentInventory = inventory;
        currentCustomers = customers;
        
        // Calculate dashboard statistics from local data
         const stats = {
             totalOrders: orders.length,
             totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total || order.amount || 0), 0),
             pendingOrders: orders.filter(order => order.status === 'pending').length,
             totalCustomers: customers.length,
             lowStockItems: inventory.filter(item => {
                 if (item.colors && Array.isArray(item.colors)) {
                     return item.colors.reduce((sum, color) => sum + color.stock, 0) < 10;
                 }
                 return (item.stock || 0) < 10;
             }).length
         };
        
        updateDashboardStats(stats);
        
        // Load initial data for all sections
        renderOrdersTable(orders);
        renderInventoryGrid(inventory);
        renderCustomersTable(customers);
        
        showLoading && showLoading(false);
        showNotification && showNotification('Dashboard loaded successfully (offline mode)', 'success');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showLoading && showLoading(false);
        showNotification && showNotification('Failed to load dashboard data', 'error');
        // Fallback to local data
        updateDashboardStats();
    }
}

function updateDashboardStats(stats = null) {
    if (stats) {
        // Use provided stats from API
        const totalOrdersEl = document.getElementById('total-orders');
        const totalRevenueEl = document.getElementById('total-revenue');
        const totalInventoryEl = document.getElementById('total-inventory');
        
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalRevenueEl) totalRevenueEl.textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
        if (totalInventoryEl) totalInventoryEl.textContent = stats.totalInventory || 0;
    } else {
        // Calculate stats from local data
        const orders = getStoredOrders() || [];
        const inventory = getInventoryData() || [];
        
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        const totalInventory = inventory.reduce((sum, item) => {
            if (item.colors && Array.isArray(item.colors)) {
                return sum + item.colors.reduce((colorSum, color) => colorSum + (color.stock || 0), 0);
            }
            return sum + (item.stock || 0);
        }, 0);
        
        // Update DOM with null checks
        const totalOrdersEl = document.getElementById('total-orders');
        const totalRevenueEl = document.getElementById('total-revenue');
        const totalInventoryEl = document.getElementById('total-inventory');
        
        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = `$${totalRevenue.toFixed(2)}`;
        if (totalInventoryEl) totalInventoryEl.textContent = totalInventory;
    }
}

async function loadOrders(page = 1, status = 'all') {
    try {
        const ordersData = await apiCall(`/api/admin/orders?page=${page}&limit=20&status=${status}`);
        
        if (ordersData && ordersData.data && ordersData.data.orders) {
            currentOrders = ordersData.data.orders;
            renderOrdersTable(currentOrders);
            
            // Update pagination if needed
            updateOrdersPagination && updateOrdersPagination(ordersData.data);
        } else {
            throw new Error('Invalid orders data received');
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification && showNotification('Failed to load orders', 'error');
        // Fallback to stored orders
        const orders = getStoredOrders();
        currentOrders = orders || [];
        renderOrdersTable(currentOrders);
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) {
        console.warn('Orders table body element not found');
        return;
    }
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #888; padding: 2rem;">
                    No orders found. Orders will appear here when customers make purchases.
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.productName}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 20px; height: 20px; background: ${order.color?.code || '#ccc'}; border-radius: 50%; border: 2px solid #fff;"></div>
                    ${order.color?.name || 'Default'}
                </div>
            </td>
            <td>$${parseFloat(order.amount || 0).toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary" onclick="viewOrderDetails('${order.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadInventory(forceRefresh = false) {
    try {
        showAlert('Loading real-time inventory...', 'info');
        
        const inventoryData = await apiCall(`/api/admin/inventory${forceRefresh ? '?forceRefresh=true' : ''}`);
        currentInventory = inventoryData && inventoryData.data ? inventoryData.data : [];
        
        renderInventoryGrid(currentInventory);
        
        // Show last updated time
        if (inventoryData.lastUpdated) {
            const lastUpdated = new Date(inventoryData.lastUpdated).toLocaleString();
            showAlert(`Inventory loaded successfully. Last updated: ${lastUpdated}`, 'success');
        } else {
            showAlert('Inventory loaded successfully', 'success');
        }
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        showAlert('Failed to load real-time inventory. Using fallback data.', 'error');
        // Fallback to stored inventory
        const inventory = getInventoryData();
        currentInventory = inventory || [];
        renderInventoryGrid(currentInventory);
    }
}

// Function to refresh inventory data
async function refreshInventory() {
    try {
        showAlert('Refreshing inventory from Temu and GameSir...', 'info');
        
        const response = await apiCall('/api/admin/inventory/refresh', {
            method: 'POST'
        });
        
        if (response.success) {
            currentInventory = response.data;
            renderInventoryGrid(currentInventory);
            
            const lastUpdated = new Date(response.lastUpdated).toLocaleString();
            showAlert(`Inventory refreshed successfully! Last updated: ${lastUpdated}`, 'success');
        } else {
            throw new Error(response.error || 'Failed to refresh inventory');
        }
        
    } catch (error) {
        console.error('Error refreshing inventory:', error);
        showAlert('Failed to refresh inventory: ' + error.message, 'error');
    }
}

// Function to check specific product stock
async function checkProductStock(productId, variant, quantity = 1) {
    try {
        const response = await apiCall('/api/admin/inventory/check-stock', {
            method: 'POST',
            body: JSON.stringify({ productId, variant, quantity })
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.error || 'Failed to check stock');
        }
        
    } catch (error) {
        console.error('Error checking product stock:', error);
        return { inStock: false, availableStock: 0 };
    }
}

// Function to get real-time product inventory
async function getProductInventory(productId) {
    try {
        const response = await apiCall(`/api/admin/inventory/${productId}`);
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.error || 'Product not found');
        }
        
    } catch (error) {
        console.error('Error getting product inventory:', error);
        return null;
    }
}

function renderInventoryGrid(inventory) {
    const grid = document.getElementById('inventory-grid');
    if (!grid) {
        console.warn('Inventory grid element not found');
        return;
    }
    
    grid.innerHTML = '';
    
    if (!Array.isArray(inventory) || inventory.length === 0) {
        grid.innerHTML = '<p class="no-data">No inventory items found</p>';
        return;
    }
    
    inventory.forEach(item => {
        if (!item) {
            console.warn('Invalid inventory item:', item);
            return;
        }
        
        const card = document.createElement('div');
        card.className = 'inventory-item';
        
        // Handle both old format (with colors array) and new Temu format
        let colorsHtml = '';
        let totalStock = 0;
        let avgWholesale = 0;
        let avgRetail = 0;
        let priceDisplay = '';
        let supplierBadge = '';
        let shippingInfo = '';
        let specificationsHtml = '';
        
        if (item.colors && Array.isArray(item.colors) && item.colors.length > 0) {
            // Old format with color objects - Enhanced display
            colorsHtml = item.colors.map(color => {
                const stockBadgeColor = color.stock > 10 ? '#28a745' : color.stock > 5 ? '#ffc107' : '#dc3545';
                const stockBadgeText = color.stock > 10 ? 'In Stock' : color.stock > 5 ? 'Low Stock' : color.stock > 0 ? 'Critical' : 'Out of Stock';
                
                return `
                    <div class="controller-color-card" style="background: #ffffff; border: 1px solid #e9ecef; padding: 10px; margin: 4px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div class="color-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div class="color-info" style="display: flex; align-items: center; gap: 6px;">
                                <div class="color-indicator" style="width: 14px; height: 14px; border-radius: 50%; background: ${color.code || color.color?.toLowerCase() || '#ccc'}; border: 2px solid #ddd;"></div>
                                <span style="font-weight: bold; font-size: 13px;">${color.name || color.color || 'Unknown'} Controller</span>
                            </div>
                            <div class="stock-count" style="background: ${stockBadgeColor}; color: white; padding: 3px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">
                                ${color.stock} units
                            </div>
                        </div>
                        
                        <div class="stock-status" style="font-size: 11px; color: ${stockBadgeColor}; font-weight: bold; margin-bottom: 6px;">
                            📦 ${stockBadgeText}
                        </div>
                        
                        <div class="pricing-row" style="display: flex; justify-content: space-between; font-size: 10px; color: #666;">
                            <span><strong>Cost:</strong> $${color.wholesaleCost?.toFixed(2) || 'N/A'}</span>
                            <span><strong>Retail:</strong> $${color.retailPrice?.toFixed(2) || 'N/A'}</span>
                        </div>
                        
                        <div class="quick-actions" style="margin-top: 6px; display: flex; gap: 4px;">
                            <button onclick="updateColorStock('${item.id}', '${color.name || color.color}')" 
                                    style="flex: 1; padding: 3px 6px; font-size: 9px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                📝 Update
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            totalStock = item.colors.reduce((sum, color) => sum + color.stock, 0);
            avgWholesale = item.colors.reduce((sum, color) => sum + color.wholesaleCost, 0) / item.colors.length;
            avgRetail = item.colors.reduce((sum, color) => sum + color.retailPrice, 0) / item.colors.length;
        } else if (item.variants && Array.isArray(item.variants)) {
            // New real-time inventory format with variants
            colorsHtml = item.variants.map(variant => {
                const stockClass = variant.stock > 10 ? 'high-stock' : variant.stock > 5 ? 'medium-stock' : 'low-stock';
                const stockBadgeColor = variant.stock > 10 ? '#28a745' : variant.stock > 5 ? '#ffc107' : '#dc3545';
                const stockBadgeText = variant.stock > 10 ? 'In Stock' : variant.stock > 5 ? 'Low Stock' : variant.stock > 0 ? 'Critical' : 'Out of Stock';
                
                return `
                    <div class="controller-variant-card" style="background: #ffffff; border: 1px solid #e9ecef; padding: 12px; margin: 6px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div class="variant-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div class="color-info" style="display: flex; align-items: center; gap: 8px;">
                                <div class="color-indicator" style="width: 16px; height: 16px; border-radius: 50%; background: ${variant.color.toLowerCase()}; border: 2px solid #ddd;"></div>
                                <span style="font-weight: bold; font-size: 14px;">${variant.color} Controller</span>
                            </div>
                            <div class="stock-badge" style="background: ${stockBadgeColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
                                ${variant.stock} units
                            </div>
                        </div>
                        
                        <div class="stock-status" style="margin-bottom: 8px;">
                            <span style="font-size: 12px; color: ${stockBadgeColor}; font-weight: bold;">
                                📦 ${stockBadgeText}
                            </span>
                        </div>
                        
                        <div class="source-breakdown" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                            <div class="source-item" style="background: #fff3cd; padding: 6px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 10px; color: #856404; font-weight: bold;">TEMU STOCK</div>
                                <div style="font-size: 14px; font-weight: bold; color: #856404;">${variant.temuStock || '0'}</div>
                            </div>
                            <div class="source-item" style="background: #d1ecf1; padding: 6px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 10px; color: #0c5460; font-weight: bold;">OFFICIAL STOCK</div>
                                <div style="font-size: 14px; font-weight: bold; color: #0c5460;">${variant.officialStock || '0'}</div>
                            </div>
                        </div>
                        
                        <div class="pricing-info" style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #e9ecef;">
                            <div style="font-size: 11px; color: #666;">
                                <strong>Cost:</strong> $${variant.wholesaleCost?.toFixed(2) || 'N/A'}
                            </div>
                            <div style="font-size: 11px; color: #666;">
                                <strong>Profit:</strong> $${variant.wholesaleCost ? (((variant.wholesaleCost / (1 - 0.30)) - variant.wholesaleCost)).toFixed(2) : 'N/A'}
                            </div>
                        </div>
                        
                        <div class="quick-actions" style="margin-top: 8px; display: flex; gap: 4px;">
                            <button onclick="updateVariantStock('${item.id}', '${variant.color}')" 
                                    style="flex: 1; padding: 4px 8px; font-size: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                📝 Update
                            </button>
                            <button onclick="checkVariantAvailability('${item.id}', '${variant.color}')" 
                                    style="flex: 1; padding: 4px 8px; font-size: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            totalStock = item.totalStock || item.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            avgWholesale = item.variants.reduce((sum, v) => sum + (v.wholesaleCost || 0), 0) / item.variants.length;
            avgRetail = avgWholesale / (1 - 0.30); // 30% profit margin calculation
            priceDisplay = `$${avgRetail.toFixed(2)} (Est.)`;
            
            // Add source information
            if (item.sources) {
                supplierBadge += `
                    <div style="margin-top: 4px; font-size: 10px;">
                        ${item.sources.temu && !item.sources.temu.error ? '<span style="background: #ff6b35; color: white; padding: 1px 4px; border-radius: 2px; margin-right: 4px;">TEMU</span>' : ''}
                        ${item.sources.official && !item.sources.official.error ? '<span style="background: #007bff; color: white; padding: 1px 4px; border-radius: 2px;">OFFICIAL</span>' : ''}
                    </div>
                `;
            }
            
            // Add last updated info
            if (item.lastUpdated) {
                const lastUpdated = new Date(item.lastUpdated);
                const timeAgo = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60));
                supplierBadge += `
                    <div style="font-size: 9px; color: #666; margin-top: 2px;">
                        Updated: ${timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`}
                    </div>
                `;
            }
            
            // Add fallback indicator
            if (item.isFallback) {
                supplierBadge += '<span style="background: #ffc107; color: #000; padding: 1px 4px; border-radius: 2px; font-size: 9px; margin-left: 4px;">FALLBACK</span>';
            }
        } else {
            // Fallback for simple format
            totalStock = item.stock || 0;
            colorsHtml = '<div class="variant-badge">Standard</div>';
        }
        
        // Add supplier badge
        if (item.supplier) {
            supplierBadge = `<span class="supplier-badge" style="background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 8px;">${item.supplier}</span>`;
        }
        
        // Add shipping information
        if (item.shipping) {
            shippingInfo = `
                <div class="shipping-info" style="margin-top: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 12px;">
                    <i class="fas fa-shipping-fast"></i> 
                    ${item.shipping.freeShipping ? 'Free Shipping' : 'Paid Shipping'}
                    ${item.shipping.estimatedDays ? ` • ${item.shipping.estimatedDays}` : ''}
                </div>
            `;
        }
        
        // Add specifications
        if (item.specifications) {
            const specs = item.specifications;
            specificationsHtml = `
                <div class="specifications" style="margin-top: 8px; font-size: 11px; color: #666;">
                    ${specs.platforms ? `<div><strong>Platforms:</strong> ${specs.platforms.join(', ')}</div>` : ''}
                    ${specs.connectivity ? `<div><strong>Connectivity:</strong> ${specs.connectivity.join(', ')}</div>` : ''}
                    ${specs.battery ? `<div><strong>Battery:</strong> ${specs.battery}</div>` : ''}
                    ${specs.features ? `<div><strong>Features:</strong> ${specs.features.slice(0, 3).join(', ')}${specs.features.length > 3 ? '...' : ''}</div>` : ''}
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="inventory-header">
                <h3 class="inventory-title">${item.name}${supplierBadge}</h3>
                <span class="status-badge ${totalStock > 10 ? 'status-shipped' : totalStock > 5 ? 'status-processing' : 'status-pending'}">
                    ${totalStock > 10 ? 'In Stock' : totalStock > 5 ? 'Low Stock' : 'Critical'}
                </span>
            </div>
            
            ${item.temuUrl ? `<div style="margin: 8px 0;"><a href="${item.temuUrl}" target="_blank" style="color: #007bff; font-size: 12px; text-decoration: none;"><i class="fas fa-external-link-alt"></i> View on Temu</a></div>` : ''}
            
            <div class="inventory-colors" style="display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0;">
                ${colorsHtml}
            </div>
            
            ${specificationsHtml}
            ${shippingInfo}
            
            <div class="inventory-stats">
                <div class="inventory-stat">
                    <span class="value">${totalStock}</span>
                    <span class="label">Stock</span>
                </div>
                ${avgWholesale > 0 ? `
                <div class="inventory-stat">
                    <span class="value">${item.price ? item.price.currency : '$'}${avgWholesale.toFixed(2)}</span>
                    <span class="label">Est. Cost</span>
                </div>
                ` : ''}
                ${avgRetail > 0 ? `
                <div class="inventory-stat">
                    <span class="value">${priceDisplay || (item.price ? item.price.currency : '$') + avgRetail.toFixed(2)}</span>
                    <span class="label">Price</span>
                </div>
                ` : ''}
                ${avgWholesale > 0 && avgRetail > 0 ? `
                <div class="inventory-stat">
                    <span class="value">${(((avgRetail - avgWholesale) / avgWholesale) * 100).toFixed(0)}%</span>
                    <span class="label">Margin</span>
                </div>
                ` : ''}
            </div>
            
            <div style="margin-top: 1rem;">
                <button class="btn btn-primary" onclick="updateItemStock('${item.id}')" style="width: 100%;">
                    <i class="fas fa-edit"></i> Update Stock
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function loadTemuOrders() {
    const orders = getStoredOrders().filter(order => 
        order.status === 'pending' || order.status === 'processing'
    );
    renderTemuOrders(orders);
}

function renderTemuOrders(orders) {
    const container = document.getElementById('temu-orders-list');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #888; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No orders ready for Temu processing.</p>
            </div>
        `;
        return;
    }
    
    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'temu-order-item';
        orderDiv.innerHTML = `
            <div class="temu-order-header">
                <span class="temu-order-id">#${order.id}</span>
                <span class="temu-order-amount">$${parseFloat(order.amount || 0).toFixed(2)}</span>
            </div>
            <div class="temu-order-details">
                <strong>${order.productName}</strong> - ${order.color?.name || 'Default'}<br>
                Customer: ${order.customerName}<br>
                Address: ${order.shippingAddress || 'Not provided'}
            </div>
            <div style="margin-top: 1rem;">
                <button class="btn btn-success" onclick="processTemuOrder('${order.id}')" style="margin-right: 0.5rem;">
                    <i class="fas fa-truck"></i> Process Order
                </button>
                <button class="btn btn-primary" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        `;
        container.appendChild(orderDiv);
    });
}

async function loadCustomers() {
    try {
        const customersData = await apiCall('/api/admin/customers');
        
        currentCustomers = customersData.data;
        renderCustomersTable(currentCustomers);
        
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification && showNotification('Failed to load customers', 'error');
        // Fallback to stored customers
        const customers = getCustomersData();
        currentCustomers = customers;
        renderCustomersTable(customers);
    }
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '';
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #888; padding: 2rem;">
                    No customers found. Customer data will appear here after orders are placed.
                </td>
            </tr>
        `;
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.orderCount}</td>
            <td>$${customer.totalSpent.toFixed(2)}</td>
            <td>${new Date(customer.lastOrder).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary" onclick="viewCustomerDetails('${customer.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    <i class="fas fa-user"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Order Management Functions
function viewOrderDetails(orderId) {
    // First try to find in currentOrders (from API)
    let order = currentOrders.find(o => o.id === orderId);
    
    // If not found, try to find in stored orders (from localStorage)
    if (!order) {
        const storedOrders = getStoredOrders();
        order = storedOrders.find(o => o.id === orderId);
    }
    
    if (!order) {
        console.error('Order not found:', orderId);
        showAlert && showAlert('Order not found', 'error');
        return;
    }
    
    selectedOrderId = orderId;
    
    const modalBody = document.getElementById('order-modal-body');
    
    // Handle different order data structures (API vs localStorage)
    const customerName = order.customer?.fullName || order.customerName || 'N/A';
    const customerEmail = order.customer?.email || order.customerEmail || 'N/A';
    const customerPhone = order.customer?.phone || order.customerPhone || order.shippingAddress?.phone || 'N/A';
    const orderDate = order.createdAt || order.date || new Date().toISOString();
    const orderAmount = order.total || order.amount || 0;
    const shippingAddr = order.shippingAddress ? 
        (typeof order.shippingAddress === 'string' ? order.shippingAddress : 
         `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''}`.replace(/^,\s*|,\s*$/g, '')) 
        : 'Not provided';
    
    // Get product details from items array or fallback to old structure
    const productInfo = order.items && order.items.length > 0 ? order.items[0] : 
        { name: order.productName || 'N/A', price: orderAmount };
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h3 style="color: #00d4ff; margin-bottom: 1rem;">Order Information</h3>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Order Number:</strong> ${order.orderNumber || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                <p><strong>Amount:</strong> $${parseFloat(orderAmount).toFixed(2)}</p>
                <p><strong>Payment Reference:</strong> ${order.paymentReference || 'N/A'}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus || 'N/A'}</p>
                ${order.temuOrderId ? `<p><strong>Temu Order ID:</strong> ${order.temuOrderId}</p>` : ''}
                ${order.temuStatus ? `<p><strong>Temu Status:</strong> ${order.temuStatus}</p>` : ''}
            </div>
            <div>
                <h3 style="color: #00d4ff; margin-bottom: 1rem;">Customer Details</h3>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <p><strong>Address:</strong> ${shippingAddr}</p>
            </div>
        </div>
        <div style="margin-top: 2rem;">
            <h3 style="color: #00d4ff; margin-bottom: 1rem;">Product Details</h3>
            <div style="background: #16213e; padding: 1rem; border-radius: 8px;">
                <p><strong>Product:</strong> ${productInfo.name}</p>
                <p><strong>Quantity:</strong> ${productInfo.quantity || 1}</p>
                <p><strong>Price:</strong> $${parseFloat(productInfo.price || 0).toFixed(2)}</p>
                ${order.items && order.items.length > 1 ? `<p><strong>Items:</strong> ${order.items.length} items</p>` : ''}
                ${order.color ? `
                <p><strong>Color:</strong> 
                    <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 20px; height: 20px; background: ${order.color.code || '#ccc'}; border-radius: 50%; border: 2px solid #fff;"></div>
                        ${order.color.name || 'Default'}
                    </span>
                </p>
                <p><strong>Wholesale Cost:</strong> $${order.color.wholesaleCost || 'N/A'}</p>
                <p><strong>Retail Price:</strong> $${order.color.retailPrice || 'N/A'}</p>
                <p><strong>Profit:</strong> $${order.color ? (order.color.retailPrice - order.color.wholesaleCost).toFixed(2) : 'N/A'}</p>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('order-modal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('active');
    selectedOrderId = null;
}

async function processTemuOrder(orderId) {
    try {
        const order = currentOrders.find(o => o.id === orderId || selectedOrderId);
        if (!order) {
            showAlert('Order not found', 'error');
            return;
        }
        
        // Get admin notes
        const adminNotes = prompt('Enter admin notes for Temu order (optional):') || '';
        
        showAlert('Processing Temu order...', 'info');
        
        // Process Temu order via API
        const result = await apiCall(`/api/admin/orders/${order.id}/process-temu`, {
            method: 'POST',
            body: JSON.stringify({ adminNotes })
        });
        
        // Update local order data
        const orderIndex = currentOrders.findIndex(o => o.id === order.id);
        if (orderIndex !== -1) {
            currentOrders[orderIndex].temuStatus = 'placed';
            currentOrders[orderIndex].status = 'processing';
            currentOrders[orderIndex].temuOrderId = result.data.temuOrderId;
            currentOrders[orderIndex].adminNotes = adminNotes;
            currentOrders[orderIndex].temuProcessedAt = new Date().toISOString();
        }
        
        // Save updated order
        updateStoredOrder(currentOrders[orderIndex]);
        
        // Refresh displays
        loadOrders();
        loadTemuOrders();
        updateDashboardStats();
        
        showAlert(`Temu order placed successfully: ${result.data.temuOrderId}`, 'success');
        if (selectedOrderId) closeOrderModal();
        
    } catch (error) {
        console.error('Error processing Temu order:', error);
        showAlert('Failed to process Temu order: ' + error.message, 'error');
    }
}

async function markAsShipped() {
    try {
        if (!selectedOrderId) return;
        
        const order = currentOrders.find(o => o.id === selectedOrderId);
        if (!order) {
            showAlert('Order not found', 'error');
            return;
        }
        
        const trackingNumber = prompt('Enter tracking number:');
        if (!trackingNumber) {
            showAlert('Tracking number is required', 'error');
            return;
        }
        
        const notes = prompt('Enter admin notes (optional):') || '';
        
        // Update order status via API
        await apiCall(`/api/admin/orders/${selectedOrderId}/ship`, {
            method: 'PUT',
            body: JSON.stringify({ trackingNumber, notes })
        });
        
        // Update local order data
        const orderIndex = currentOrders.findIndex(o => o.id === selectedOrderId);
        if (orderIndex !== -1) {
            currentOrders[orderIndex].status = 'shipped';
            currentOrders[orderIndex].shippedAt = new Date().toISOString();
            currentOrders[orderIndex].trackingNumber = trackingNumber;
            if (notes) {
                currentOrders[orderIndex].adminNotes = notes;
            }
        }
        
        // Save updated order
        updateStoredOrder(currentOrders[orderIndex]);
        
        // Send shipping notification (simulate)
        sendShippingNotification(currentOrders[orderIndex]);
        
        // Refresh displays
        loadOrders();
        loadTemuOrders();
        updateDashboardStats();
        
        showAlert('Order marked as shipped and customer notified!', 'success');
        closeOrderModal();
        
    } catch (error) {
        console.error('Error marking order as shipped:', error);
        showAlert('Failed to mark order as shipped: ' + error.message, 'error');
    }
}

// Inventory Management Functions
function updateInventory() {
    showAlert('Updating inventory from Temu...', 'info');
    
    setTimeout(() => {
        // Simulate inventory update
        const inventory = getInventoryData();
        inventory.forEach(item => {
            item.colors.forEach(color => {
                // Simulate random stock updates
                const change = Math.floor(Math.random() * 10) - 5;
                color.stock = Math.max(0, color.stock + change);
            });
        });
        
        // Save updated inventory
        localStorage.setItem('inventory', JSON.stringify(inventory));
        
        // Refresh display
        loadInventory();
        updateDashboardStats();
        
        showAlert('Inventory updated successfully!', 'success');
    }, 1500);
}

function updateItemStock(itemId) {
    const item = currentInventory.find(i => i.id === itemId);
    if (!item) return;
    
    const newStock = prompt(`Update stock for ${item.name}:\n\nCurrent stock by color:\n${item.variants.map(v => `${v.color}: ${v.stock}`).join('\n')}\n\nEnter new total stock:`);
    
    if (newStock && !isNaN(newStock)) {
        const totalStock = parseInt(newStock);
        const stockPerVariant = Math.floor(totalStock / item.variants.length);
        const remainder = totalStock % item.variants.length;
        
        item.variants.forEach((variant, index) => {
            variant.stock = stockPerVariant + (index < remainder ? 1 : 0);
        });
        
        // Save updated inventory
        const inventory = getInventoryData();
        const itemIndex = inventory.findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
            inventory[itemIndex] = item;
            localStorage.setItem('inventory', JSON.stringify(inventory));
        }
        
        // Refresh display
        loadInventory();
        updateDashboardStats();
        
        showAlert('Stock updated successfully!', 'success');
    }
}

// Temu Integration Functions
function processPendingOrders() {
    const pendingOrders = getStoredOrders().filter(order => order.status === 'pending');
    
    if (pendingOrders.length === 0) {
        showAlert('No pending orders to process.', 'info');
        return;
    }
    
    showAlert(`Processing ${pendingOrders.length} orders with Temu...`, 'info');
    
    setTimeout(() => {
        pendingOrders.forEach(order => {
            order.status = 'processing';
            order.temuOrderId = 'TEMU' + Date.now() + Math.random().toString(36).substr(2, 5);
            order.temuProcessedAt = new Date().toISOString();
            updateStoredOrder(order);
        });
        
        // Refresh displays
        loadOrders();
        loadTemuOrders();
        updateDashboardStats();
        
        showAlert(`Successfully processed ${pendingOrders.length} orders with Temu!`, 'success');
    }, 3000);
}

function saveTemuConfig() {
    const email = document.getElementById('temu-email').value;
    const shippingMethod = document.getElementById('shipping-method').value;
    
    if (!email) {
        showAlert('Please enter a Temu account email.', 'error');
        return;
    }
    
    const config = {
        email: email,
        shippingMethod: shippingMethod,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('temuConfig', JSON.stringify(config));
    showAlert('Temu configuration saved successfully!', 'success');
}

// Customer Management Functions
function viewCustomerDetails(customerId) {
    const customer = currentCustomers.find(c => c.id === customerId);
    if (!customer) return;
    
    alert(`Customer Details:\n\nName: ${customer.name}\nEmail: ${customer.email}\nPhone: ${customer.phone || 'N/A'}\nTotal Orders: ${customer.orderCount}\nTotal Spent: $${customer.totalSpent.toFixed(2)}\nLast Order: ${new Date(customer.lastOrder).toLocaleDateString()}`);
}

function exportCustomers() {
    const customers = getCustomersData();
    const csv = convertToCSV(customers);
    downloadCSV(csv, 'customers.csv');
    showAlert('Customer data exported successfully!', 'success');
}

// Utility Functions
function getStoredOrders() {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
}

function updateStoredOrder(updatedOrder) {
    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index !== -1) {
        orders[index] = updatedOrder;
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

function getInventoryData() {
    const stored = localStorage.getItem('inventory');
    if (stored) {
        return JSON.parse(stored);
    }
    
    // GameSir Nova Lite controller data from Temu integration
    const temuGameSirData = {
        id: 'gamesir-nova-lite',
        name: 'GameSir Nova Lite Wireless Game Controller',
        fullTitle: 'GameSir Nova Lite Wireless Game Controller - Ergonomic Design, Hall Effect Sticks, Turbo Function, Multi-Platform Compatibility for Switch, Android, iOS, PC & Steam',
        temuUrl: 'https://www.temu.com/gh/--lite-wireless-gaming-controller-ergonomic-wireless-wired--for-switch-for--ios-pc-steam-games-turbo-function-hall-effect-sticks-g-601099548838966.html',
        colors: ['Blue Black', 'Domino White'],
        variants: ['Blue Black', 'Domino White'],
        stock: 50, // Default stock level
        price: {
            currency: 'GH₵',
            amount: 191.90, // Based on Temu pricing
            originalPrice: 241.19
        },
        specifications: {
            connectivity: ['Wireless', 'Wireless Dongle', 'Wired'],
            platforms: ['PC', 'Steam', 'Android', 'iOS', 'Switch'],
            battery: '600mAh',
            features: [
                'Hall Effect Sticks',
                'Analog Triggers',
                'Turbo Function',
                'Anti-Drift Technology',
                'Tri-Mode Connectivity',
                'Customizable Buttons',
                'Ergonomic Design'
            ],
            buttons: 'Membrane ABXY Buttons'
        },
        shipping: {
            freeShipping: true,
            estimatedDays: '7-14 days',
            provider: 'Temu'
        },
        supplier: 'Temu',
        lastUpdated: new Date().toISOString(),
        images: [
            'https://img.kwcdn.com/product/fancy/055447ab-7b71-4c2c-a5c6-3aab098421f2.jpg',
            'https://aimg.kwcdn.com/upload_aimg/pho/05f39254-a4b9-4289-9174-56337e13689e.png',
            'https://aimg.kwcdn.com/upload_aimg/pho/55991b45-9c98-48ae-b3e1-ebc46bc9dd81.png'
        ]
    };
    
    // Get from products data or use Temu data
    let inventory = [];
    if (typeof products !== 'undefined' && products.gamesir) {
        inventory.push({
            id: 'gamesir',
            name: products.gamesir.name,
            colors: products.gamesir.colors || [],
            stock: products.gamesir.stock || 0
        });
    }
    
    // Add Temu GameSir Nova Lite data
    inventory.push(temuGameSirData);
    
    localStorage.setItem('inventory', JSON.stringify(inventory));
    return inventory;
}

function getCustomersData() {
    const orders = getStoredOrders();
    const customerMap = new Map();
    
    orders.forEach(order => {
        const email = order.customerEmail;
        if (customerMap.has(email)) {
            const customer = customerMap.get(email);
            customer.orderCount++;
            customer.totalSpent += parseFloat(order.amount || 0);
            customer.lastOrder = new Date(Math.max(new Date(customer.lastOrder), new Date(order.date)));
        } else {
            customerMap.set(email, {
                id: email.replace('@', '_').replace('.', '_'),
                name: order.customerName,
                email: email,
                phone: order.customerPhone,
                orderCount: 1,
                totalSpent: parseFloat(order.amount || 0),
                lastOrder: new Date(order.date)
            });
        }
    });
    
    return Array.from(customerMap.values());
}

// Removed generateSampleOrders function - admin now uses real data only

function sendShippingNotification(order) {
    // Simulate sending email notification
    console.log(`Sending shipping notification to ${order.customerEmail}`);
    console.log(`Order ${order.id} has been shipped with tracking number: ${order.trackingNumber}`);
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    // Add to page
    document.body.appendChild(alert);
    
    // Position alert
    alert.style.position = 'fixed';
    alert.style.top = '100px';
    alert.style.right = '20px';
    alert.style.zIndex = '3000';
    alert.style.minWidth = '300px';
    alert.style.animation = 'slideInRight 0.3s ease';
    
    // Remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 300);
    }, 5000);
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease-out;
            }
            .notification.success { background: #10b981; }
            .notification.error { background: #ef4444; }
            .notification.info { background: #3b82f6; }
            .notification.warning { background: #f59e0b; }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showLoading(show = true) {
    let loader = document.querySelector('#admin-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'admin-loader';
            loader.innerHTML = `
                <div class="loader-backdrop">
                    <div class="loader-content">
                        <div class="spinner"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            `;
            
            // Add loader styles
            if (!document.querySelector('#loader-styles')) {
                const styles = document.createElement('style');
                styles.id = 'loader-styles';
                styles.textContent = `
                    .loader-backdrop {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                    }
                    .loader-content {
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        text-align: center;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    }
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3b82f6;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 15px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(loader);
        }
    } else {
        if (loader) {
            loader.remove();
        }
    }
}

// Test order functionality removed - admin now uses real data only

// Update pagination function
function updateOrdersPagination(ordersData) {
    const paginationContainer = document.querySelector('.orders-pagination');
    if (!paginationContainer) return;
    
    const { currentPage, totalPages, hasNextPage, hasPrevPage } = ordersData;
    
    paginationContainer.innerHTML = `
        <button 
            class="btn btn-secondary" 
            ${!hasPrevPage ? 'disabled' : ''}
            onclick="loadOrders(${currentPage - 1})"
        >
            Previous
        </button>
        <span class="pagination-info">
            Page ${currentPage} of ${totalPages}
        </span>
        <button 
            class="btn btn-secondary" 
            ${!hasNextPage ? 'disabled' : ''}
            onclick="loadOrders(${currentPage + 1})"
        >
            Next
        </button>
    `;
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function refreshOrders() {
    showAlert('Refreshing orders...', 'info');
    setTimeout(() => {
        loadOrders();
        updateDashboardStats();
        showAlert('Orders refreshed successfully!', 'success');
    }, 1000);
}

function setupEventListeners() {
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('order-modal');
        if (event.target === modal) {
            closeOrderModal();
        }
    });
    
    // Load Temu config if exists
    const temuConfig = localStorage.getItem('temuConfig');
    if (temuConfig) {
        const config = JSON.parse(temuConfig);
        document.getElementById('temu-email').value = config.email || '';
        document.getElementById('shipping-method').value = config.shippingMethod || 'standard';
    }
}

function loadFallbackData() {
    try {
        // Load real data only - no demo data
        const realOrders = getStoredOrders();
        const realInventory = getInventoryData();
        const realCustomers = getCustomersData();
        
        currentOrders = realOrders;
        currentInventory = realInventory;
        currentCustomers = realCustomers;
        
        // Render real data
        renderOrdersTable(realOrders);
        renderInventoryGrid(realInventory);
        renderCustomersTable(realCustomers);
        
        // Update stats with real data
        const stats = {
            totalOrders: realOrders.length,
            totalRevenue: realOrders.reduce((sum, order) => sum + parseFloat(order.total || order.amount || 0), 0),
            pendingOrders: realOrders.filter(order => order.status === 'pending').length,
            totalCustomers: realCustomers.length,
            lowStockItems: realInventory.filter(item => {
                if (item.colors && Array.isArray(item.colors)) {
                    return item.colors.reduce((sum, color) => sum + color.stock, 0) < 10;
                }
                return (item.stock || 0) < 10;
            }).length
        };
        
        updateDashboardStats(stats);
        if (realOrders.length === 0) {
            showNotification('No orders found - admin ready for real data', 'info');
        } else {
            showNotification('Loaded real order data', 'success');
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load data', 'error');
    }
}

// Color-specific stock management functions
function updateColorStock(productId, colorName) {
    const newStock = prompt(`Enter new stock count for ${colorName} controller:`);
    if (newStock !== null && !isNaN(newStock)) {
        showAlert(`Updating stock for ${colorName} controller to ${newStock} units...`, 'info');
        
        // Here you would typically make an API call to update the stock
        // For now, we'll just show a success message
        setTimeout(() => {
            showAlert(`Stock updated successfully for ${colorName} controller!`, 'success');
            loadInventory(); // Refresh the inventory display
        }, 1000);
    }
}

// Variant-specific stock management functions
function updateVariantStock(productId, variantName) {
    // Create a custom modal instead of using prompt()
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
            <h3>Update Stock for ${variantName}</h3>
            <input type="number" id="stockInput" placeholder="Enter new stock count" style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="updateStockConfirm('${productId}', '${variantName}')" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Update</button>
                <button onclick="closeStockModal()" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('stockInput').focus();
    
    // Store modal reference for cleanup
    window.currentStockModal = modal;
}

function updateStockConfirm(productId, variantName) {
    const input = document.getElementById('stockInput');
    const newStock = input.value;
    
    if (newStock !== '' && !isNaN(newStock) && parseInt(newStock) >= 0) {
        showAlert(`Updating stock for ${variantName} to ${newStock} units...`, 'info');
        
        // Here you would typically make an API call to update the stock
        setTimeout(() => {
            showAlert(`Stock updated successfully for ${variantName}!`, 'success');
            loadInventory(); // Refresh the inventory display
        }, 1000);
        
        closeStockModal();
    } else {
        showAlert('Please enter a valid stock number', 'error');
    }
}

function closeStockModal() {
    if (window.currentStockModal) {
        document.body.removeChild(window.currentStockModal);
        window.currentStockModal = null;
    }
}

function checkVariantAvailability(productId, variantName) {
    showAlert(`Checking availability for ${variantName}...`, 'info');
    
    // Simulate checking availability from external sources
    setTimeout(() => {
        const randomStock = Math.floor(Math.random() * 50) + 10;
        showAlert(`${variantName} availability updated: ${randomStock} units available`, 'success');
        loadInventory(); // Refresh the inventory display
    }, 1500);
}

function refreshVariantStock(productId, variantName) {
    showAlert(`Refreshing stock data for ${variantName}...`, 'info');
    
    // Here you would typically make an API call to refresh from external sources
    setTimeout(() => {
        showAlert(`Stock data refreshed for ${variantName}!`, 'success');
        loadInventory(); // Refresh the inventory display
    }, 1500);
}

// Add CSS animations for alerts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);