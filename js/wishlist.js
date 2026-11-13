/**
 * wishlist.js - Wishlist Management with LocalStorage Persistence
 * Allows users to curate their favorite haute couture pieces.
 */

const WISHLIST_STORAGE_KEY = 'elegance_wishlist_items';

class WishlistService {
  constructor() {
    this.items = this.loadWishlist();
    this.listeners = [];
  }

  // Subscribe to changes
  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.items);
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.items);
      } catch (e) {
        console.error('Wishlist notification error:', e);
      }
    });
  }

  loadWishlist() {
    try {
      const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading wishlist:', e);
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving wishlist:', e);
    }
  }

  isInWishlist(productId) {
    const id = Number(productId);
    return this.items.some(item => item.id === id);
  }

  toggleItem(product) {
    const id = Number(product.id);
    const index = this.items.findIndex(item => item.id === id);

    let added = false;
    if (index > -1) {
      this.items.splice(index, 1);
      added = false;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        originalPrice: Number(product.originalPrice || product.price),
        thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
        category: product.category,
        brand: product.brand || 'Élégance Atelier',
        rating: product.rating || 4.5,
        stock: product.stock || 20
      });
      added = true;
    }

    this.saveWishlist();
    this.notify();
    return { added, total: this.items.length };
  }

  removeItem(productId) {
    const id = Number(productId);
    this.items = this.items.filter(item => item.id !== id);
    this.saveWishlist();
    this.notify();
  }

  clearWishlist() {
    this.items = [];
    this.saveWishlist();
    this.notify();
  }

  moveToCart(productId) {
    const id = Number(productId);
    const item = this.items.find(i => i.id === id);
    if (!item) return false;

    // Add to cart
    if (window.boutiqueCart) {
      window.boutiqueCart.addItem(item, 1);
    }

    // Remove from wishlist
    this.removeItem(id);
    return true;
  }

  getCount() {
    return this.items.length;
  }
}

// Global Wishlist singleton
window.boutiqueWishlist = new WishlistService();
