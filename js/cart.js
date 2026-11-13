/**
 * cart.js - Shopping Cart, Coupon Discounts & Order Management
 * Powered by LocalStorage persistence with full calculation logic
 */

const CART_STORAGE_KEY = 'elegance_cart_items';
const COUPON_STORAGE_KEY = 'elegance_applied_coupon';
const ORDERS_STORAGE_KEY = 'elegance_order_history';

// Available Boutique Promo Codes
const PROMO_CODES = {
  'VOGUE25': {
    code: 'VOGUE25',
    type: 'percentage',
    value: 25,
    description: '25% Off Entire Boutique Order',
    minSubtotal: 0
  },
  'LUXE50': {
    code: 'LUXE50',
    type: 'fixed',
    value: 50,
    description: '$50 Off Orders over $200',
    minSubtotal: 200
  },
  'FREESHIP': {
    code: 'FREESHIP',
    type: 'shipping',
    value: 100, // 100% off shipping
    description: 'Complimentary Express Worldwide Shipping',
    minSubtotal: 0
  },
  'FIRST10': {
    code: 'FIRST10',
    type: 'percentage',
    value: 10,
    description: '10% Off Welcome Privilege',
    minSubtotal: 0
  },
  'ELEGANCE20': {
    code: 'ELEGANCE20',
    type: 'fixed',
    value: 20,
    description: '$20 Off Orders over $100',
    minSubtotal: 100
  }
};

class CartService {
  constructor() {
    this.items = this.loadCart();
    this.coupon = this.loadCoupon();
    this.listeners = [];
    this.shippingThreshold = 150.00; // Free shipping over $150
    this.baseShippingFee = 15.00;
    this.taxRate = 0.08; // 8% luxury sales tax
  }

  // Event Subscription for UI Sync
  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.getSummary());
  }

  notify() {
    const summary = this.getSummary();
    this.listeners.forEach(cb => {
      try {
        cb(summary);
      } catch (err) {
        console.error('Error notifying cart listener:', err);
      }
    });
  }

  // LocalStorage Helpers
  loadCart() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  }

  loadCoupon() {
    try {
      const data = localStorage.getItem(COUPON_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveCoupon() {
    try {
      if (this.coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(this.coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error saving coupon to localStorage', e);
    }
  }

  // Core Cart Operations
  addItem(product, quantity = 1, selectedSize = 'M', selectedColor = 'Default') {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const existingIndex = this.items.findIndex(
      item => item.id === product.id && item.size === selectedSize
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += qty;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        originalPrice: Number(product.originalPrice || product.price),
        thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
        category: product.category,
        brand: product.brand || 'Élégance Atelier',
        quantity: qty,
        size: selectedSize,
        color: selectedColor,
        stock: product.stock || 50
      });
    }

    this.saveCart();
    this.notify();
    return { success: true, count: this.getTotalCount() };
  }

  removeItem(productId, size = null) {
    if (size) {
      this.items = this.items.filter(item => !(item.id === productId && item.size === size));
    } else {
      this.items = this.items.filter(item => item.id !== productId);
    }
    this.saveCart();
    this.notify();
  }

  updateQuantity(productId, quantity, size = null) {
    const qty = parseInt(quantity, 10);
    const item = this.items.find(i => i.id === productId && (!size || i.size === size));

    if (item) {
      if (qty <= 0) {
        this.removeItem(productId, size);
        return;
      }
      item.quantity = Math.min(qty, item.stock || 99);
      this.saveCart();
      this.notify();
    }
  }

  incrementQuantity(productId, size = null) {
    const item = this.items.find(i => i.id === productId && (!size || i.size === size));
    if (item) {
      item.quantity += 1;
      this.saveCart();
      this.notify();
    }
  }

  decrementQuantity(productId, size = null) {
    const item = this.items.find(i => i.id === productId && (!size || i.size === size));
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        this.saveCart();
        this.notify();
      } else {
        this.removeItem(productId, size);
      }
    }
  }

  clearCart() {
    this.items = [];
    this.coupon = null;
    this.saveCart();
    this.saveCoupon();
    this.notify();
  }

  // Coupon Logic
  applyCoupon(codeString) {
    if (!codeString || !codeString.trim()) {
      return { success: false, message: 'Please enter a promo code.' };
    }

    const cleanCode = codeString.trim().toUpperCase();
    const promo = PROMO_CODES[cleanCode];

    if (!promo) {
      return { 
        success: false, 
        message: 'Invalid promo code. Try VOGUE25, LUXE50, or FREESHIP.' 
      };
    }

    const subtotal = this.getSubtotal();
    if (promo.minSubtotal && subtotal < promo.minSubtotal) {
      return {
        success: false,
        message: `Promo code requires a minimum spend of $${promo.minSubtotal.toFixed(2)}. Current subtotal: $${subtotal.toFixed(2)}.`
      };
    }

    this.coupon = promo;
    this.saveCoupon();
    this.notify();
    return {
      success: true,
      message: `Coupon "${cleanCode}" applied! ${promo.description}.`,
      coupon: this.coupon
    };
  }

  removeCoupon() {
    this.coupon = null;
    this.saveCoupon();
    this.notify();
    return { success: true, message: 'Coupon removed.' };
  }

  // Financial Calculations
  getSubtotal() {
    return this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  getTotalCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  calculateShipping(subtotal) {
    if (subtotal === 0) return 0;
    if (subtotal >= this.shippingThreshold) return 0;
    if (this.coupon && this.coupon.type === 'shipping') return 0;
    return this.baseShippingFee;
  }

  calculateDiscount(subtotal) {
    if (!this.coupon || subtotal === 0) return 0;

    if (this.coupon.type === 'percentage') {
      return (subtotal * (this.coupon.value / 100));
    }
    if (this.coupon.type === 'fixed') {
      return Math.min(this.coupon.value, subtotal);
    }
    return 0;
  }

  getSummary() {
    const subtotal = this.getSubtotal();
    const discount = this.calculateDiscount(subtotal);
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shipping = this.calculateShipping(subtotal);
    const tax = discountedSubtotal * this.taxRate;
    const total = discountedSubtotal + shipping + tax;
    const totalCount = this.getTotalCount();
    
    // Free shipping progress
    const remainingForFreeShipping = Math.max(0, this.shippingThreshold - subtotal);
    const freeShippingProgress = Math.min(100, (subtotal / this.shippingThreshold) * 100);

    return {
      items: this.items,
      itemCount: totalCount,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      coupon: this.coupon,
      shippingThreshold: this.shippingThreshold,
      remainingForFreeShipping: parseFloat(remainingForFreeShipping.toFixed(2)),
      freeShippingProgress: parseFloat(freeShippingProgress.toFixed(1)),
      isFreeShipping: shipping === 0 && subtotal > 0
    };
  }

  // Order Creation and Persistence
  createOrder(customerInfo) {
    const summary = this.getSummary();
    if (summary.items.length === 0) {
      return { success: false, message: 'Your shopping cart is empty.' };
    }

    const orderId = `ELG-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      orderId,
      date: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      customer: {
        fullName: customerInfo.fullName || 'Valued Client',
        email: customerInfo.email || 'client@elegance.com',
        phone: customerInfo.phone || '',
        address: customerInfo.address || '',
        city: customerInfo.city || '',
        zip: customerInfo.zip || '',
        paymentMethod: customerInfo.paymentMethod || 'Credit Card'
      },
      items: [...this.items],
      pricing: {
        subtotal: summary.subtotal,
        discount: summary.discount,
        couponCode: summary.coupon ? summary.coupon.code : null,
        shipping: summary.shipping,
        tax: summary.tax,
        total: summary.total
      },
      deliveryEstimate: '3 - 5 Business Days via VIP Express Courier',
      status: 'Confirmed & Processing'
    };

    // Save order history in LocalStorage
    try {
      const history = this.getOrderHistory();
      history.unshift(newOrder);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save order to history', e);
    }

    // Clear cart upon successful order
    this.clearCart();

    return { success: true, order: newOrder };
  }

  getOrderHistory() {
    try {
      const data = localStorage.getItem(ORDERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
}

// Global Cart singleton
window.boutiqueCart = new CartService();
