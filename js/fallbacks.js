// Fallback implementations for offline functionality

// GSAP Fallback - Simple animation library
if (typeof gsap === 'undefined') {
  window.gsap = {
    to: function(target, options) {
      const element = typeof target === 'string' ? document.querySelector(target) : target;
      if (!element) return;
      
      const duration = (options.duration || 1) * 1000;
      const startTime = Date.now();
      
      // Get initial values
      const initialValues = {};
      Object.keys(options).forEach(prop => {
        if (prop !== 'duration' && prop !== 'ease' && prop !== 'onComplete') {
          if (prop === 'rotation') {
            initialValues[prop] = 0;
          } else if (prop === 'scale') {
            initialValues[prop] = 1;
          } else {
            initialValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
          }
        }
      });
      
      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Simple easing function
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        Object.keys(options).forEach(prop => {
          if (prop !== 'duration' && prop !== 'ease' && prop !== 'onComplete') {
            const startValue = initialValues[prop];
            const endValue = options[prop];
            const currentValue = startValue + (endValue - startValue) * eased;
            
            if (prop === 'rotation') {
              element.style.transform = `rotate(${currentValue}deg)`;
            } else if (prop === 'scale') {
              element.style.transform = `scale(${currentValue})`;
            } else {
              element.style[prop] = currentValue + (prop.includes('opacity') ? '' : 'px');
            }
          }
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else if (options.onComplete) {
          options.onComplete();
        }
      }
      
      requestAnimationFrame(animate);
      return this;
    },
    
    fromTo: function(target, from, to) {
      const element = typeof target === 'string' ? document.querySelector(target) : target;
      if (!element) return;
      
      // Apply initial values
      Object.keys(from).forEach(prop => {
        if (prop === 'rotation') {
          element.style.transform = `rotate(${from[prop]}deg)`;
        } else if (prop === 'scale') {
          element.style.transform = `scale(${from[prop]})`;
        } else {
          element.style[prop] = from[prop] + (prop.includes('opacity') ? '' : 'px');
        }
      });
      
      // Animate to target values
      return this.to(target, to);
    },
    
    set: function(target, options) {
      const element = typeof target === 'string' ? document.querySelector(target) : target;
      if (!element) return;
      
      Object.keys(options).forEach(prop => {
        if (prop === 'rotation') {
          element.style.transform = `rotate(${options[prop]}deg)`;
        } else if (prop === 'scale') {
          element.style.transform = `scale(${options[prop]})`;
        } else {
          element.style[prop] = options[prop] + (prop.includes('opacity') ? '' : 'px');
        }
      });
      
      return this;
    }
  };
  
  console.log('GSAP fallback loaded');
}

// Paystack Fallback - Mock implementation for offline testing
if (typeof PaystackPop === 'undefined') {
  window.PaystackPop = {
    setup: function(options) {
      return {
        openIframe: function() {
          console.log('Paystack offline mode - simulating payment');
          
          // Simulate payment process
          setTimeout(() => {
            if (options.onSuccess) {
              options.onSuccess({
                reference: 'offline_' + Date.now(),
                status: 'success',
                transaction: 'offline_transaction',
                message: 'Payment simulated (offline mode)'
              });
            }
          }, 2000);
        }
      };
    }
  };
  
  console.log('Paystack fallback loaded');
}

// Font Awesome Fallback - Basic icons using Unicode
if (!document.querySelector('link[href*="font-awesome"]')) {
  const style = document.createElement('style');
  style.textContent = `
    .fas, .fa {
      font-family: Arial, sans-serif;
      font-style: normal;
      font-weight: bold;
    }
    .fa-sync::before { content: '↻'; }
    .fa-reload::before { content: '⟲'; }
    .fa-spinner::before { content: '◐'; }
    .fa-spin {
      animation: fa-spin 1s infinite linear;
    }
    @keyframes fa-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .fa-shopping-cart::before { content: '🛒'; }
    .fa-user::before { content: '👤'; }
    .fa-envelope::before { content: '✉'; }
    .fa-phone::before { content: '📞'; }
    .fa-map-marker::before { content: '📍'; }
    .fa-check::before { content: '✓'; }
    .fa-times::before { content: '✕'; }
    .fa-edit::before { content: '✎'; }
    .fa-trash::before { content: '🗑'; }
    .fa-eye::before { content: '👁'; }
    .fa-download::before { content: '⬇'; }
    .fa-upload::before { content: '⬆'; }
    .fa-search::before { content: '🔍'; }
    .fa-filter::before { content: '🔽'; }
    .fa-sort::before { content: '↕'; }
    .fa-cog::before { content: '⚙'; }
    .fa-home::before { content: '🏠'; }
    .fa-dashboard::before { content: '📊'; }
    .fa-list::before { content: '📋'; }
    .fa-box::before { content: '📦'; }
    .fa-users::before { content: '👥'; }
  `;
  document.head.appendChild(style);
  
  console.log('Font Awesome fallback loaded');
}

// Google Fonts Fallback
if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
  const style = document.createElement('style');
  style.textContent = `
    body, .poppins {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .inter {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
  `;
  document.head.appendChild(style);
  
  console.log('Google Fonts fallback loaded');
}

console.log('All fallbacks initialized');