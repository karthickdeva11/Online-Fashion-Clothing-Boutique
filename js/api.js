/**
 * api.js - DummyJSON Products API Service
 * Handles all product, category, search, and details data fetching with error handling and caching.
 */

const API_CONFIG = {
  BASE_URL: 'https://dummyjson.com',
  // Curated list of fashion categories available in DummyJSON
  FASHION_CATEGORIES: [
    { slug: 'womens-dresses', name: "Women's Dresses", icon: 'fa-solid fa-person-dress' },
    { slug: 'womens-shoes', name: "Women's Shoes", icon: 'fa-solid fa-shoe-prints' },
    { slug: 'womens-bags', name: "Designer Handbags", icon: 'fa-solid fa-bag-shopping' },
    { slug: 'womens-jewellery', name: "Fine Jewellery", icon: 'fa-solid fa-gem' },
    { slug: 'womens-watches', name: "Luxury Watches", icon: 'fa-solid fa-clock' },
    { slug: 'mens-shirts', name: "Men's Shirts", icon: 'fa-solid fa-shirt' },
    { slug: 'mens-shoes', name: "Men's Footwear", icon: 'fa-solid fa-shoe-prints' },
    { slug: 'mens-watches', name: "Men's Timepieces", icon: 'fa-solid fa-stopwatch' },
    { slug: 'tops', name: "Tops & Blouses", icon: 'fa-solid fa-vest' },
    { slug: 'sunglasses', name: "Haute Eyewear", icon: 'fa-solid fa-glasses' },
    { slug: 'fragrances', name: "Fine Fragrances", icon: 'fa-solid fa-spray-can-sparkles' },
    { slug: 'beauty', name: "Beauty & Cosmetics", icon: 'fa-solid fa-wand-magic-sparkles' }
  ]
};

class DummyJsonAPI {
  constructor() {
    this.cache = new Map();
    this.allProducts = [];
    this.isLoaded = false;
  }

  /**
   * Helper method for network requests with timeout and error handling
   */
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      if (this.cache.has(url)) {
        return { success: true, data: this.cache.get(url), fromCache: true };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache response
      if (!options.method || options.method === 'GET') {
        this.cache.set(url, data);
      }

      return { success: true, data };
    } catch (error) {
      console.error(`DummyJsonAPI Request Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.name === 'AbortError' 
          ? 'Network request timed out. Please check your internet connection.' 
          : error.message || 'Failed to fetch data from the server.'
      };
    }
  }

  /**
   * Fetch all fashion-focused products from DummyJSON
   * Combines fashion categories to ensure only high quality boutique items are returned
   */
  async getFashionProducts() {
    if (this.allProducts.length > 0) {
      return { success: true, products: this.allProducts };
    }

    // Fetch batch of products (DummyJSON has up to 194 products)
    const result = await this.request('/products?limit=194');
    
    if (!result.success) {
      return { success: false, error: result.error, products: [] };
    }

    const fashionSlugs = API_CONFIG.FASHION_CATEGORIES.map(c => c.slug);
    
    // Filter to fashion categories
    let fashionProducts = result.data.products.filter(p => fashionSlugs.includes(p.category));

    // Fallback: If less than 15 products found for any reason, include more items
    if (fashionProducts.length < 15) {
      fashionProducts = result.data.products.slice(0, 30);
    }

    // Enhance products with boutique tags (e.g. isNew, isTrending, isBestSeller)
    this.allProducts = fashionProducts.map((p, index) => {
      // Calculate realistic original price
      const discount = p.discountPercentage || 12;
      const originalPrice = (p.price / (1 - discount / 100)).toFixed(2);
      
      return {
        ...p,
        originalPrice: parseFloat(originalPrice),
        isNew: index % 4 === 0 || p.id > 175,
        isTrending: p.rating >= 4.0 || p.price > 100,
        isBestSeller: p.rating >= 3.8 && (index % 3 === 0 || p.stock < 20)
      };
    });

    this.isLoaded = true;
    return { success: true, products: this.allProducts };
  }

  /**
   * Get products by category slug
   */
  async getProductsByCategory(categorySlug) {
    if (categorySlug === 'all') {
      return this.getFashionProducts();
    }

    const result = await this.request(`/products/category/${encodeURIComponent(categorySlug)}`);
    if (!result.success) {
      // Fallback to local filter if preloaded
      if (this.allProducts.length > 0) {
        const filtered = this.allProducts.filter(p => p.category === categorySlug);
        return { success: true, products: filtered };
      }
      return { success: false, error: result.error, products: [] };
    }

    const products = result.data.products.map(p => {
      const discount = p.discountPercentage || 12;
      const originalPrice = (p.price / (1 - discount / 100)).toFixed(2);
      return {
        ...p,
        originalPrice: parseFloat(originalPrice),
        isNew: p.id % 2 === 0,
        isTrending: p.rating >= 3.8,
        isBestSeller: p.rating >= 4.0
      };
    });

    return { success: true, products };
  }

  /**
   * Search products by keyword
   */
  async searchProducts(query) {
    if (!query || !query.trim()) {
      return this.getFashionProducts();
    }

    const q = query.trim().toLowerCase();

    // Use DummyJSON search API
    const result = await this.request(`/products/search?q=${encodeURIComponent(q)}`);
    
    if (result.success && result.data.products) {
      const fashionSlugs = API_CONFIG.FASHION_CATEGORIES.map(c => c.slug);
      
      // Filter or sort so fashion matches appear first
      let products = result.data.products.filter(p => 
        fashionSlugs.includes(p.category) || 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );

      // Map original prices
      products = products.map(p => {
        const discount = p.discountPercentage || 10;
        const originalPrice = (p.price / (1 - discount / 100)).toFixed(2);
        return {
          ...p,
          originalPrice: parseFloat(originalPrice)
        };
      });

      return { success: true, products };
    }

    // Local search fallback if API search failed or cached
    if (this.allProducts.length > 0) {
      const filtered = this.allProducts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
      return { success: true, products: filtered };
    }

    return { success: false, error: result.error, products: [] };
  }

  /**
   * Fetch single product full details
   */
  async getProductById(id) {
    // Check in cached allProducts first
    const cached = this.allProducts.find(p => p.id === Number(id));
    if (cached && cached.reviews) {
      return { success: true, product: cached };
    }

    const result = await this.request(`/products/${id}`);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const p = result.data;
    const discount = p.discountPercentage || 12;
    const originalPrice = (p.price / (1 - discount / 100)).toFixed(2);
    
    return {
      success: true,
      product: {
        ...p,
        originalPrice: parseFloat(originalPrice)
      }
    };
  }

  /**
   * Get fashion categories metadata
   */
  getCategories() {
    return API_CONFIG.FASHION_CATEGORIES;
  }
}

// Global API singleton
window.boutiqueAPI = new DummyJsonAPI();
