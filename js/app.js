/**
 * app.js - Main Application Controller
 * Handles dynamic product rendering, filtering, sorting, modals, GSAP & AOS animations,
 * drawers, checkout, and interactive features.
 */

// Application State
const AppState = {
  allProducts: [],
  filteredProducts: [],
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  currentPage: 1,
  pageSize: 8,
  currency: 'USD',
  currencyRates: {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 }
  },
  selectedProduct: null
};

// ==========================================================================
// TOAST NOTIFICATIONS SYSTEM
// ==========================================================================
function showToast(message, type = 'info', icon = 'fa-solid fa-circle-check') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Format Price with selected Currency
function formatPrice(amount) {
  const cur = AppState.currencyRates[AppState.currency] || AppState.currencyRates.USD;
  const converted = (amount * cur.rate).toFixed(2);
  return `${cur.symbol}${converted}`;
}

// ==========================================================================
// INITIALIZATION ON DOM READY
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initAnimations();
  initHeroSlider();
  initHeader();
  initCountdown();
  initEventListeners();
  initCartAndWishlistSync();
  await loadProducts();
  restorePreviousScrollPosition();
});

// ==========================================================================
// GSAP & AOS ANIMATIONS SETUP
// ==========================================================================
function initAnimations() {
  // Initialize AOS (Animate on Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      once: true,
      duration: 800,
      easing: 'ease-out-cubic',
      offset: 50
    });
  }

  // Floating badges continuous yoyo animation across all slides
  if (typeof gsap !== 'undefined') {
    gsap.to('.floating-badge-1', {
      y: -12,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    gsap.to('.floating-badge-2', {
      y: 12,
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5
    });
  }
}

// ==========================================================================
// HERO FASHION SLIDER (GSAP POWERED WITH AUTOPLAY & CONTROLS)
// ==========================================================================
function initHeroSlider() {
  const heroSection = document.getElementById('hero');
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.getElementById('hero-prev-btn');
  const nextBtn = document.getElementById('hero-next-btn');
  const currentSlideEl = document.getElementById('hero-current-slide');

  if (!slides || slides.length === 0) return;

  let currentSlideIndex = 0;
  const totalSlides = slides.length;
  let isTransitioning = false;
  let autoplayTimer = null;
  let progressTween = null;
  const slideDuration = 6; // 6 seconds per slide

  // Set initial state
  slides.forEach((slide, idx) => {
    if (idx === 0) {
      slide.classList.add('active');
      slide.style.visibility = 'visible';
      slide.style.opacity = '1';
      slide.style.zIndex = '2';
    } else {
      slide.classList.remove('active');
      slide.style.visibility = 'hidden';
      slide.style.opacity = '0';
      slide.style.zIndex = '1';
    }
  });

  // Initial Entrance Animation for Slide 1
  animateSlideEntrance(slides[0]);
  startAutoplay();

  // Slide Change Handler
  function goToSlide(targetIndex) {
    if (isTransitioning) return;
    if (targetIndex === currentSlideIndex) return;

    isTransitioning = true;
    // Safety unlock after 800ms
    setTimeout(() => { isTransitioning = false; }, 800);

    const oldIndex = currentSlideIndex;
    const newIndex = (targetIndex + totalSlides) % totalSlides;

    const oldSlide = slides[oldIndex];
    const newSlide = slides[newIndex];

    // Cancel ongoing timer & dot progress
    if (autoplayTimer) clearTimeout(autoplayTimer);
    if (progressTween) progressTween.kill();
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(document.querySelectorAll('.hero-dot-progress'));
    }

    // Update Dots & Progress Bars immediately
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === newIndex);
      const fill = dot.querySelector('.hero-dot-progress');
      if (fill) fill.style.width = '0%';
    });

    // Update Slide Counter
    if (currentSlideEl) {
      currentSlideEl.textContent = String(newIndex + 1).padStart(2, '0');
    }

    if (typeof gsap !== 'undefined') {
      // Kill running tweens on slides
      gsap.killTweensOf(oldSlide);
      gsap.killTweensOf(newSlide);
      gsap.killTweensOf(oldSlide.querySelectorAll('*'));
      gsap.killTweensOf(newSlide.querySelectorAll('*'));

      // Stack new slide cleanly on top of old slide
      newSlide.style.visibility = 'visible';
      newSlide.style.zIndex = '3';
      oldSlide.style.zIndex = '2';

      const transitionTl = gsap.timeline({
        onComplete: () => {
          oldSlide.classList.remove('active');
          oldSlide.style.visibility = 'hidden';
          oldSlide.style.opacity = '0';
          oldSlide.style.zIndex = '1';

          newSlide.classList.add('active');
          newSlide.style.opacity = '1';
          newSlide.style.zIndex = '2';

          currentSlideIndex = newIndex;
          isTransitioning = false;
          startAutoplay();
        }
      });

      // Smooth cross-fade
      transitionTl.to(oldSlide, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut'
      }, 0);

      transitionTl.fromTo(newSlide, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 
        0
      );

      // Stagger new slide content
      const eyebrow = newSlide.querySelector('.hero-eyebrow');
      const title = newSlide.querySelector('.hero-title');
      const desc = newSlide.querySelector('.hero-description');
      const cta = newSlide.querySelector('.hero-cta-group');
      const stats = newSlide.querySelector('.hero-stats');
      const imgFrame = newSlide.querySelector('.hero-image-frame');

      if (eyebrow) transitionTl.fromTo(eyebrow, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.06);
      if (title) transitionTl.fromTo(title, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.12);
      if (desc) transitionTl.fromTo(desc, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.2);
      if (cta) transitionTl.fromTo(cta, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.26);
      if (stats) transitionTl.fromTo(stats, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.32);
      if (imgFrame) transitionTl.fromTo(imgFrame, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.65, ease: 'power3.out' }, 0.14);

    } else {
      // Fallback without GSAP
      oldSlide.classList.remove('active');
      oldSlide.style.visibility = 'hidden';
      oldSlide.style.opacity = '0';
      newSlide.classList.add('active');
      newSlide.style.visibility = 'visible';
      newSlide.style.opacity = '1';
      currentSlideIndex = newIndex;
      isTransitioning = false;
      startAutoplay();
    }
  }

  // Animate Slide Content with GSAP Stagger
  function animateSlideEntrance(slideEl) {
    if (typeof gsap === 'undefined' || !slideEl) return;

    const eyebrow = slideEl.querySelector('.hero-eyebrow');
    const title = slideEl.querySelector('.hero-title');
    const desc = slideEl.querySelector('.hero-description');
    const cta = slideEl.querySelector('.hero-cta-group');
    const stats = slideEl.querySelector('.hero-stats');
    const imgFrame = slideEl.querySelector('.hero-image-frame');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1);
    if (title) tl.fromTo(title, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.75 }, 0.18);
    if (desc) tl.fromTo(desc, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.65 }, 0.28);
    if (cta) tl.fromTo(cta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.38);
    if (stats) tl.fromTo(stats, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.45);
    if (imgFrame) tl.fromTo(imgFrame, { opacity: 0, scale: 0.94, y: 15 }, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 0.2);
  }

  // Autoplay with animated progress fill
  function startAutoplay() {
    if (autoplayTimer) clearTimeout(autoplayTimer);
    if (progressTween) progressTween.kill();

    const activeDot = dots[currentSlideIndex];
    if (activeDot) {
      const progressFill = activeDot.querySelector('.hero-dot-progress');
      if (progressFill && typeof gsap !== 'undefined') {
        gsap.set(progressFill, { width: '0%' });
        progressTween = gsap.to(progressFill, {
          width: '100%',
          duration: slideDuration,
          ease: 'none'
        });
      }
    }

    autoplayTimer = setTimeout(() => {
      goToSlide(currentSlideIndex + 1);
    }, slideDuration * 1000);
  }

  // Next & Prev Controls
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(currentSlideIndex + 1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(currentSlideIndex - 1);
    });
  }

  // Dots Pagination Click
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      goToSlide(idx);
    });
  });

  // Pause Autoplay on Hover
  if (heroSection) {
    heroSection.addEventListener('mouseenter', () => {
      if (autoplayTimer) clearTimeout(autoplayTimer);
      if (progressTween) progressTween.pause();
    });

    heroSection.addEventListener('mouseleave', () => {
      if (progressTween) {
        const remainingTime = (1 - (progressTween.progress() || 0)) * slideDuration;
        progressTween.resume();
        autoplayTimer = setTimeout(() => {
          goToSlide(currentSlideIndex + 1);
        }, Math.max(800, remainingTime * 1000));
      } else {
        startAutoplay();
      }
    });

    // Touch Swipe Gestures
    let touchStartX = 0;
    let touchEndX = 0;

    heroSection.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) {
          goToSlide(currentSlideIndex + 1); // Swipe left -> Next
        } else {
          goToSlide(currentSlideIndex - 1); // Swipe right -> Prev
        }
      }
    }, { passive: true });
  }

  // Keyboard Navigation (ArrowLeft / ArrowRight)
  document.addEventListener('keydown', (e) => {
    // Only navigate hero if not focused in inputs or modals
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
    const modalActive = document.querySelector('.modal-backdrop.active');
    if (modalActive) return;

    if (e.key === 'ArrowRight') {
      goToSlide(currentSlideIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      goToSlide(currentSlideIndex - 1);
    }
  });
}

// ==========================================================================
// HEADER & NAVIGATION LOGIC
// ==========================================================================
function initHeader() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const desktopNav = document.getElementById('desktop-nav');
  const currencySelect = document.getElementById('currency-select');

  // Sticky Header Scroll Effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  if (mobileToggle && desktopNav) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      desktopNav.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    desktopNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        desktopNav.classList.remove('active');
      });
    });
  }

  // Currency Switcher
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      AppState.currency = e.target.value;
      renderAllProductSections();
      if (window.boutiqueCart) window.boutiqueCart.notify();
      showToast(`Currency changed to ${AppState.currency}`, 'info', 'fa-solid fa-coins');
    });
  }
}

// ==========================================================================
// SPECIAL OFFERS COUNTDOWN TIMER
// ==========================================================================
function initCountdown() {
  const hoursEl = document.getElementById('countdown-hours');
  const minsEl = document.getElementById('countdown-mins');
  const secsEl = document.getElementById('countdown-secs');

  if (!hoursEl || !minsEl || !secsEl) return;

  // Set target to midnight or 12 hours from now
  let remainingSeconds = 12 * 3600 + 45 * 60 + 30;

  setInterval(() => {
    if (remainingSeconds <= 0) {
      remainingSeconds = 24 * 3600; // reset loop
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const mins = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;

    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(mins).padStart(2, '0');
    secsEl.textContent = String(secs).padStart(2, '0');

    remainingSeconds--;
  }, 1000);
}

// ==========================================================================
// DATA FETCHING VIA DUMMYJSON API
// ==========================================================================
async function loadProducts() {
  const catalogGrid = document.getElementById('catalog-grid');
  renderSkeletons(catalogGrid, 8);

  const result = await window.boutiqueAPI.getFashionProducts();

  if (!result.success) {
    renderErrorState(catalogGrid, result.error);
    showToast('Failed to load products from API. Please try again.', 'error', 'fa-solid fa-triangle-exclamation');
    return;
  }

  AppState.allProducts = result.products;
  AppState.filteredProducts = [...result.products];

  // Render all views
  renderAllProductSections();

  // Refresh AOS after DOM elements are created
  if (typeof AOS !== 'undefined') {
    setTimeout(() => AOS.refresh(), 200);
  }
}

function renderAllProductSections() {
  renderCatalog();
  renderCuratedSection('new-arrivals-grid', p => p.isNew, 4);
  renderCuratedSection('trending-grid', p => p.isTrending, 4);
  renderCuratedSection('bestsellers-grid', p => p.isBestSeller, 4);
}

// ==========================================================================
// RENDERING CATALOG & CURATED SECTIONS
// ==========================================================================
function renderCatalog() {
  const catalogGrid = document.getElementById('catalog-grid');
  const resultsCounter = document.getElementById('results-count');
  const paginationWrapper = document.getElementById('pagination-wrapper');
  const loadMoreBtn = document.getElementById('btn-load-more');
  const loadMoreCounter = document.getElementById('load-more-counter');

  if (!catalogGrid) return;

  const products = AppState.filteredProducts;

  if (products.length === 0) {
    catalogGrid.innerHTML = `
      <div class="catalog-empty-state" data-aos="fade-up">
        <i class="fa-solid fa-magnifying-glass empty-state-icon"></i>
        <h3 class="empty-state-title">No Haute Couture Pieces Found</h3>
        <p class="empty-state-text">We couldn't find any items matching "${AppState.searchQuery || AppState.currentCategory}". Try adjusting your filters or search keywords.</p>
        <button class="btn btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    if (resultsCounter) resultsCounter.innerHTML = `Showing <span>0</span> pieces`;
    if (paginationWrapper) paginationWrapper.style.display = 'none';
    return;
  }

  // Calculate Paginated Slice
  const displayedCount = Math.min(AppState.currentPage * AppState.pageSize, products.length);
  const visibleProducts = products.slice(0, displayedCount);

  catalogGrid.innerHTML = visibleProducts.map(product => createProductCardHTML(product)).join('');

  if (resultsCounter) {
    resultsCounter.innerHTML = `Showing <span>${displayedCount}</span> of <span>${products.length}</span> pieces`;
  }

  // Handle Load More Button
  if (paginationWrapper) {
    if (displayedCount < products.length) {
      paginationWrapper.style.display = 'flex';
      if (loadMoreCounter) {
        loadMoreCounter.textContent = `Displaying ${displayedCount} of ${products.length} products`;
      }
    } else {
      paginationWrapper.style.display = 'none';
    }
  }

  // Re-bind interactive events
  attachCardEventListeners(catalogGrid);
}

function renderCuratedSection(containerId, filterFn, limit = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let items = AppState.allProducts.filter(filterFn);
  if (items.length < limit) {
    items = AppState.allProducts.slice(0, limit);
  } else {
    items = items.slice(0, limit);
  }

  container.innerHTML = items.map(product => createProductCardHTML(product)).join('');
  attachCardEventListeners(container);
}

// Generate Product Card HTML
function createProductCardHTML(product) {
  const isWishlisted = window.boutiqueWishlist ? window.boutiqueWishlist.isInWishlist(product.id) : false;
  const categoryName = product.category.replace(/-/g, ' ');
  const formattedPrice = formatPrice(product.price);
  const formattedOrigPrice = formatPrice(product.originalPrice || product.price);
  const discount = Math.round(product.discountPercentage || 12);

  // Badge logic
  let badgeHTML = '';
  if (product.discountPercentage > 15) {
    badgeHTML = `<span class="badge badge-sale">-${discount}% OFF</span>`;
  } else if (product.isNew) {
    badgeHTML = `<span class="badge badge-new">NEW DROP</span>`;
  } else if (product.isTrending) {
    badgeHTML = `<span class="badge badge-trending">TRENDING</span>`;
  } else if (product.isBestSeller) {
    badgeHTML = `<span class="badge badge-bestseller">BESTSELLER</span>`;
  }

  // Rating stars
  const rating = product.rating || 4.5;
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  let starsHTML = '';
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += '<i class="fa-solid fa-star"></i>';
    } else if (i === fullStars && halfStar) {
      starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
    } else {
      starsHTML += '<i class="fa-regular fa-star"></i>';
    }
  }

  return `
    <div class="product-card" data-id="${product.id}" data-aos="fade-up">
      <div class="product-media">
        <div class="product-badge-group">
          ${badgeHTML}
        </div>
        <div class="card-actions">
          <button class="card-action-btn card-wishlist-btn ${isWishlisted ? 'active-wishlist' : ''}" 
                  data-id="${product.id}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
            <i class="${isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          </button>
          <button class="card-action-btn card-quickview-btn" data-id="${product.id}" title="Quick Look">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
        <img class="product-thumb" src="${product.thumbnail || (product.images && product.images[0])}" 
             alt="${product.title}" loading="lazy" />
      </div>

      <div class="product-info">
        <div class="product-category-brand">
          <span>${categoryName}</span>
          <span>${product.brand || 'Atelier'}</span>
        </div>
        <h4 class="product-title" title="${product.title}">${product.title}</h4>
        
        <div class="product-rating">
          <div class="stars">${starsHTML}</div>
          <span class="rating-num">${rating.toFixed(1)}</span>
          <span class="rating-count">(${product.reviews ? product.reviews.length : 12})</span>
        </div>

        <div class="product-pricing">
          <span class="current-price">${formattedPrice}</span>
          ${product.originalPrice ? `<span class="original-price">${formattedOrigPrice}</span>` : ''}
          <span class="discount-tag">Save ${discount}%</span>
        </div>

        <button class="btn-add-cart" data-id="${product.id}">
          <i class="fa-solid fa-bag-shopping"></i> Add to Bag
        </button>
      </div>
    </div>
  `;
}

// Skeleton Placeholders
function renderSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-box skeleton-img"></div>
      <div class="skeleton-box skeleton-line-sm"></div>
      <div class="skeleton-box skeleton-line"></div>
      <div class="skeleton-box skeleton-line-sm"></div>
      <div class="skeleton-box skeleton-btn"></div>
    </div>
  `).join('');
}

function renderErrorState(container, errorMsg) {
  if (!container) return;
  container.innerHTML = `
    <div class="catalog-error-state" data-aos="fade-up">
      <i class="fa-solid fa-circle-exclamation empty-state-icon" style="color: #ef4444;"></i>
      <h3 class="empty-state-title">Unable to Load Collection</h3>
      <p class="empty-state-text">${errorMsg || 'A network error occurred while communicating with the boutique catalog API.'}</p>
      <button class="btn btn-primary" onclick="loadProducts()">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;
}

// ==========================================================================
// CARD EVENT LISTENERS (QUICK VIEW, ADD TO CART, WISHLIST)
// ==========================================================================
function attachCardEventListeners(container) {
  if (!container) return;

  // Add to Bag buttons
  container.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-id'));
      const product = AppState.allProducts.find(p => p.id === id);
      if (product) {
        window.boutiqueCart.addItem(product, 1);
        showToast(`Added "${product.title}" to your Shopping Bag!`, 'success', 'fa-solid fa-bag-shopping');
        
        // Button feedback
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Added!`;
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 1200);
      }
    });
  });

  // Wishlist toggle buttons
  container.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-id'));
      const product = AppState.allProducts.find(p => p.id === id);
      if (product) {
        const result = window.boutiqueWishlist.toggleItem(product);
        if (result.added) {
          btn.classList.add('active-wishlist');
          btn.querySelector('i').className = 'fa-solid fa-heart';
          showToast(`Saved "${product.title}" to Wishlist!`, 'success', 'fa-solid fa-heart');
        } else {
          btn.classList.remove('active-wishlist');
          btn.querySelector('i').className = 'fa-regular fa-heart';
          showToast(`Removed "${product.title}" from Wishlist.`, 'info', 'fa-regular fa-heart');
        }
      }
    });
  });

  // Quick View buttons & Card click to open modal
  container.querySelectorAll('.card-quickview-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-id'));
      openProductDetailsModal(id);
    });
  });

  container.querySelectorAll('.product-media').forEach(media => {
    media.addEventListener('click', () => {
      const card = media.closest('.product-card');
      if (card) {
        const id = Number(card.getAttribute('data-id'));
        openProductDetailsModal(id);
      }
    });
  });
}

// ==========================================================================
// SEARCH, CATEGORY FILTERING & SORTING LOGIC
// ==========================================================================
function initEventListeners() {
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const sortSelect = document.getElementById('sort-select');
  const loadMoreBtn = document.getElementById('btn-load-more');
  const categoryPillsContainer = document.getElementById('category-pills');

  // Live Search with Debounce
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (searchClearBtn) {
        searchClearBtn.classList.toggle('visible', query.length > 0);
      }

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        AppState.searchQuery = query;
        AppState.currentPage = 1;
        applyFiltersAndSort();
      }, 280);
    });
  }

  // Clear Search
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchClearBtn.classList.remove('visible');
      AppState.searchQuery = '';
      AppState.currentPage = 1;
      applyFiltersAndSort();
    });
  }

  // Sort Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      AppState.currentPage = 1;
      applyFiltersAndSort();
    });
  }

  // Category Pills
  if (categoryPillsContainer) {
    categoryPillsContainer.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPillsContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        AppState.currentCategory = pill.getAttribute('data-category');
        AppState.currentPage = 1;
        applyFiltersAndSort();
      });
    });
  }

  // Featured Categories Cards Click to Filter
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.getAttribute('data-category');
      if (cat) {
        filterByCategory(cat);
      }
    });
  });

  // Load More Button
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      AppState.currentPage += 1;
      renderCatalog();
    });
  }

  // Copy Promo Code Buttons
  document.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          showToast(`Promo code "${code}" copied to clipboard!`, 'success', 'fa-solid fa-ticket');
        }).catch(() => {
          showToast(`Use promo code: ${code}`, 'info', 'fa-solid fa-ticket');
        });
      }
    });
  });

  // Global Link Interceptor: All links outside navbar and footer redirect to custom 404 page
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // Exempt navbar (header, nav, announcement bar, mobile toggle) and footer
    const inNavbar = link.closest('.site-header, header, nav, #desktop-nav, .announcement-bar');
    const inFooter = link.closest('.site-footer, footer');

    if (inNavbar || inFooter) {
      // Allow normal anchor scroll or footer navigation
      return;
    }

    // Save exact scroll position & section so 'Back to Previous Page' returns to the exact same place & area
    sessionStorage.setItem('elegance_return_scroll_y', window.scrollY.toString());
    const nearestSection = link.closest('section[id]') || link.closest('[id]');
    if (nearestSection && nearestSection.id) {
      sessionStorage.setItem('elegance_return_section_id', nearestSection.id);
    }

    // All other links redirect to custom 404 page
    e.preventDefault();
    window.location.href = '404.html';
  });

  // Newsletter Subscription Form with Validation and 404 Redirection
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('newsletter-email');
      const errorBox = document.getElementById('newsletter-error');
      const submitBtn = document.getElementById('newsletter-submit-btn');
      const email = input ? input.value.trim() : '';

      // Validation check
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      let isValid = true;
      let errorMsg = '';

      if (!email) {
        isValid = false;
        errorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Email address is required to request an invitation.';
      } else if (!emailRegex.test(email)) {
        isValid = false;
        errorMsg = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a valid email format (e.g. patron@domain.com).';
      }

      if (!isValid) {
        if (input) {
          input.classList.remove('input-success');
          input.classList.add('input-error');
          input.focus();
        }
        if (errorBox) {
          errorBox.innerHTML = errorMsg;
          errorBox.style.display = 'flex';
        }
        showToast('Please provide a valid email address.', 'warning', 'fa-solid fa-envelope');
        return;
      }

      // Valid form state
      if (input) {
        input.classList.remove('input-error');
        input.classList.add('input-success');
      }
      if (errorBox) {
        errorBox.style.display = 'none';
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Validated & Redirecting...';
      }

      showToast('Invitation request validated! Redirecting to salon portal...', 'success', 'fa-solid fa-circle-check');

      // Save exact scroll position & section so 'Back to Previous Page' returns here
      sessionStorage.setItem('elegance_return_scroll_y', window.scrollY.toString());
      sessionStorage.setItem('elegance_return_section_id', 'newsletter');

      // After validation, redirect to custom 404 page
      setTimeout(() => {
        window.location.href = '404.html?from=newsletter';
      }, 700);
    });

    // Real-time clear error on input
    const newsletterInput = document.getElementById('newsletter-email');
    if (newsletterInput) {
      newsletterInput.addEventListener('input', () => {
        newsletterInput.classList.remove('input-error');
        const errorBox = document.getElementById('newsletter-error');
        if (errorBox) errorBox.style.display = 'none';
      });
    }
  }
}

// Global Category Filter Trigger
window.filterByCategory = function(categorySlug) {
  AppState.currentCategory = categorySlug;
  AppState.currentPage = 1;

  // Update pills UI
  const categoryPillsContainer = document.getElementById('category-pills');
  if (categoryPillsContainer) {
    categoryPillsContainer.querySelectorAll('.category-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-category') === categorySlug);
    });
  }

  applyFiltersAndSort();

  // Smooth scroll to catalog
  const catalogSection = document.getElementById('catalog');
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: 'smooth' });
  }
};

// Reset Filters
window.resetFilters = function() {
  AppState.currentCategory = 'all';
  AppState.searchQuery = '';
  AppState.sortBy = 'default';
  AppState.currentPage = 1;

  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const sortSelect = document.getElementById('sort-select');
  const categoryPillsContainer = document.getElementById('category-pills');

  if (searchInput) searchInput.value = '';
  if (searchClearBtn) searchClearBtn.classList.remove('visible');
  if (sortSelect) sortSelect.value = 'default';

  if (categoryPillsContainer) {
    categoryPillsContainer.querySelectorAll('.category-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-category') === 'all');
    });
  }

  applyFiltersAndSort();
  showToast('Filters cleared.', 'info', 'fa-solid fa-filter');
};

function applyFiltersAndSort() {
  let products = [...AppState.allProducts];

  // 1. Category Filter
  if (AppState.currentCategory !== 'all') {
    products = products.filter(p => p.category === AppState.currentCategory);
  }

  // 2. Search Keyword Filter
  if (AppState.searchQuery && AppState.searchQuery.trim()) {
    const q = AppState.searchQuery.toLowerCase().trim();
    products = products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  // 3. Sorting
  switch (AppState.sortBy) {
    case 'price-asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'name-asc':
      products.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'discount-desc':
      products.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
      break;
    default:
      // Featured: keep original curated order
      break;
  }

  AppState.filteredProducts = products;
  renderCatalog();
}

// ==========================================================================
// PRODUCT DETAILS MODAL LOGIC
// ==========================================================================
async function openProductDetailsModal(productId) {
  const modalBackdrop = document.getElementById('product-modal-backdrop');
  const modalDialog = document.getElementById('product-modal-dialog');
  if (!modalBackdrop || !modalDialog) return;

  // Find in memory or fetch fresh
  let product = AppState.allProducts.find(p => p.id === productId);
  if (!product || !product.reviews) {
    const res = await window.boutiqueAPI.getProductById(productId);
    if (res.success) {
      product = res.product;
    }
  }

  if (!product) {
    showToast('Could not load product details.', 'error');
    return;
  }

  AppState.selectedProduct = product;
  let selectedQty = 1;

  // Prepare images list
  const images = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.thumbnail || ''];

  const formattedPrice = formatPrice(product.price);
  const formattedOrigPrice = formatPrice(product.originalPrice || product.price);
  const discount = Math.round(product.discountPercentage || 12);
  const isWishlisted = window.boutiqueWishlist ? window.boutiqueWishlist.isInWishlist(product.id) : false;

  // Render Reviews
  const reviewsHTML = (product.reviews && product.reviews.length > 0)
    ? product.reviews.map(r => `
        <div class="modal-review-card">
          <div class="modal-review-header">
            <span class="reviewer-name">${r.reviewerName || 'Valued Client'}</span>
            <span class="stars">${'★'.repeat(r.rating || 5)}</span>
          </div>
          <p class="review-comment">"${r.comment}"</p>
        </div>
      `).join('')
    : '<p style="color: #64748b; font-style: italic;">No reviews yet for this limited edition piece.</p>';

  modalDialog.innerHTML = `
    <button class="modal-close-btn" id="modal-close-btn" title="Close"><i class="fa-solid fa-xmark"></i></button>
    
    <div class="modal-product-layout">
      <!-- Image Gallery -->
      <div class="modal-gallery">
        <div class="modal-main-img-box">
          <img id="modal-main-img" class="modal-main-img" src="${images[0]}" alt="${product.title}" />
        </div>
        ${images.length > 1 ? `
          <div class="modal-thumbs">
            ${images.map((img, idx) => `
              <button class="modal-thumb-btn ${idx === 0 ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="Thumbnail ${idx + 1}" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Product Info -->
      <div class="modal-product-info">
        <span class="modal-category-tag">${product.category.replace(/-/g, ' ')}</span>
        <h2 class="modal-title">${product.title}</h2>

        <div class="product-rating" style="margin-bottom: 0.8rem;">
          <span class="stars">${'★'.repeat(Math.floor(product.rating || 4))}</span>
          <span class="rating-num">${(product.rating || 4.5).toFixed(1)}</span>
          <span class="rating-count">(${product.reviews ? product.reviews.length : 3} Verified Reviews)</span>
        </div>

        <div class="modal-pricing">
          <span class="modal-price">${formattedPrice}</span>
          ${product.originalPrice ? `<span class="original-price" style="font-size: 1.1rem;">${formattedOrigPrice}</span>` : ''}
          <span class="discount-tag">Save ${discount}%</span>
        </div>

        <p class="modal-desc">${product.description}</p>

        <!-- Meta specs -->
        <div class="modal-meta-grid">
          <div class="modal-meta-item"><strong>SKU:</strong> ${product.sku || 'ELG-' + product.id}</div>
          <div class="modal-meta-item"><strong>Availability:</strong> <span style="color: #10b981; font-weight: 700;">${product.availabilityStatus || 'In Stock'}</span></div>
          <div class="modal-meta-item"><strong>Shipping:</strong> ${product.shippingInformation || 'Ships overnight'}</div>
          <div class="modal-meta-item"><strong>Return Policy:</strong> ${product.returnPolicy || '30 days returns'}</div>
        </div>

        <!-- Action Row -->
        <div class="modal-actions">
          <div class="qty-counter">
            <button class="qty-btn" id="modal-qty-minus"><i class="fa-solid fa-minus"></i></button>
            <input type="text" class="qty-input" id="modal-qty-input" value="1" readonly />
            <button class="qty-btn" id="modal-qty-plus"><i class="fa-solid fa-plus"></i></button>
          </div>

          <button class="btn-modal-add" id="btn-modal-add-cart">
            <i class="fa-solid fa-bag-shopping"></i> Add to Bag
          </button>

          <button class="btn-modal-wishlist ${isWishlisted ? 'active-wishlist' : ''}" id="btn-modal-wishlist" title="Save to Wishlist">
            <i class="${isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          </button>
        </div>
      </div>

      <!-- Customer Reviews Tab -->
      <div class="modal-reviews-section">
        <h3 class="modal-reviews-title">Verified Customer Reviews</h3>
        <div class="modal-reviews-list">
          ${reviewsHTML}
        </div>
      </div>
    </div>
  `;

  // Open modal
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Modal Gallery Thumbnail switching
  modalDialog.querySelectorAll('.modal-thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modalDialog.querySelectorAll('.modal-thumb-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const src = btn.getAttribute('data-src');
      const mainImg = document.getElementById('modal-main-img');
      if (mainImg) mainImg.src = src;
    });
  });

  // Quantity controls
  const minusBtn = document.getElementById('modal-qty-minus');
  const plusBtn = document.getElementById('modal-qty-plus');
  const qtyInput = document.getElementById('modal-qty-input');

  if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty--;
        qtyInput.value = selectedQty;
      }
    });

    plusBtn.addEventListener('click', () => {
      if (selectedQty < (product.stock || 20)) {
        selectedQty++;
        qtyInput.value = selectedQty;
      }
    });
  }

  // Add to Bag from modal
  const addBtn = document.getElementById('btn-modal-add-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      window.boutiqueCart.addItem(product, selectedQty);
      showToast(`Added ${selectedQty}x "${product.title}" to Bag!`, 'success', 'fa-solid fa-bag-shopping');
      closeProductDetailsModal();
    });
  }

  // Wishlist toggle from modal
  const wishlistBtn = document.getElementById('btn-modal-wishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      const res = window.boutiqueWishlist.toggleItem(product);
      if (res.added) {
        wishlistBtn.classList.add('active-wishlist');
        wishlistBtn.querySelector('i').className = 'fa-solid fa-heart';
        showToast(`Saved "${product.title}" to Wishlist!`, 'success', 'fa-solid fa-heart');
      } else {
        wishlistBtn.classList.remove('active-wishlist');
        wishlistBtn.querySelector('i').className = 'fa-regular fa-heart';
        showToast(`Removed "${product.title}" from Wishlist.`, 'info');
      }
      renderCatalog(); // sync card hearts
    });
  }

  // Close button
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProductDetailsModal);
  }
}

function closeProductDetailsModal() {
  const modalBackdrop = document.getElementById('product-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ==========================================================================
// CART & WISHLIST DRAWERS & LOCALSTORAGE SYNC
// ==========================================================================
function initCartAndWishlistSync() {
  // Sync Cart
  if (window.boutiqueCart) {
    window.boutiqueCart.subscribe(summary => {
      updateCartUI(summary);
    });
  }

  // Sync Wishlist
  if (window.boutiqueWishlist) {
    window.boutiqueWishlist.subscribe(items => {
      updateWishlistUI(items);
    });
  }

  // Open / Close Cart Drawer
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawerBackdrop = document.getElementById('cart-drawer-backdrop');
  const cartDrawerPanel = document.getElementById('cart-drawer-panel');
  const cartCloseBtn = document.getElementById('cart-close-btn');

  if (cartBtn && cartDrawerBackdrop && cartDrawerPanel) {
    cartBtn.addEventListener('click', () => {
      cartDrawerBackdrop.classList.add('active');
      cartDrawerPanel.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeCart = () => {
      cartDrawerBackdrop.classList.remove('active');
      cartDrawerPanel.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    cartDrawerBackdrop.addEventListener('click', closeCart);
  }

  // Open / Close Wishlist Drawer
  const wishlistBtn = document.getElementById('wishlist-btn');
  const wishlistDrawerBackdrop = document.getElementById('wishlist-drawer-backdrop');
  const wishlistDrawerPanel = document.getElementById('wishlist-drawer-panel');
  const wishlistCloseBtn = document.getElementById('wishlist-close-btn');

  if (wishlistBtn && wishlistDrawerBackdrop && wishlistDrawerPanel) {
    wishlistBtn.addEventListener('click', () => {
      wishlistDrawerBackdrop.classList.add('active');
      wishlistDrawerPanel.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeWishlist = () => {
      wishlistDrawerBackdrop.classList.remove('active');
      wishlistDrawerPanel.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (wishlistCloseBtn) wishlistCloseBtn.addEventListener('click', closeWishlist);
    wishlistDrawerBackdrop.addEventListener('click', closeWishlist);
  }

  // Coupon Application inside Cart
  const couponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('cart-coupon-input');
  if (couponBtn && couponInput) {
    couponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim();
      const res = window.boutiqueCart.applyCoupon(code);
      if (res.success) {
        showToast(res.message, 'success', 'fa-solid fa-tag');
        couponInput.value = '';
      } else {
        showToast(res.message, 'warning', 'fa-solid fa-triangle-exclamation');
      }
    });
  }

  // Checkout Button Trigger
  const checkoutBtn = document.getElementById('btn-proceed-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const summary = window.boutiqueCart.getSummary();
      if (summary.itemCount === 0) {
        showToast('Your bag is empty! Explore the collection first.', 'warning');
        return;
      }
      // Close cart and open checkout modal
      if (cartDrawerBackdrop) cartDrawerBackdrop.classList.remove('active');
      if (cartDrawerPanel) cartDrawerPanel.classList.remove('active');
      openCheckoutModal();
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductDetailsModal();
      closeCheckoutModal();
      closeOrderSuccessModal();
      if (cartDrawerBackdrop) cartDrawerBackdrop.classList.remove('active');
      if (cartDrawerPanel) cartDrawerPanel.classList.remove('active');
      if (wishlistDrawerBackdrop) wishlistDrawerBackdrop.classList.remove('active');
      if (wishlistDrawerPanel) wishlistDrawerPanel.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Update Cart UI from Cart Summary
function updateCartUI(summary) {
  // Badges & Total Preview in Header
  const cartBadge = document.getElementById('cart-badge');
  const cartTotalPreview = document.getElementById('cart-total-preview');
  const cartDrawerItemsCount = document.getElementById('cart-drawer-count');

  if (cartBadge) {
    cartBadge.textContent = summary.itemCount;
    cartBadge.classList.add('badge-pulse');
    setTimeout(() => cartBadge.classList.remove('badge-pulse'), 400);
  }

  if (cartTotalPreview) {
    cartTotalPreview.textContent = formatPrice(summary.total);
  }

  if (cartDrawerItemsCount) {
    cartDrawerItemsCount.textContent = `(${summary.itemCount})`;
  }

  // Free Shipping Progress
  const progressFill = document.getElementById('shipping-progress-fill');
  const progressText = document.getElementById('shipping-progress-text');
  if (progressFill && progressText) {
    progressFill.style.width = `${summary.freeShippingProgress}%`;
    if (summary.isFreeShipping) {
      progressText.innerHTML = `🎉 <strong>Complimentary VIP Worldwide Shipping Unlocked!</strong>`;
    } else {
      progressText.innerHTML = `Add <strong>${formatPrice(summary.remainingForFreeShipping)}</strong> more to unlock Free VIP Courier Delivery`;
    }
  }

  // Cart Items List
  const drawerBody = document.getElementById('cart-drawer-body');
  if (!drawerBody) return;

  if (summary.items.length === 0) {
    drawerBody.innerHTML = `
      <div class="drawer-empty">
        <i class="fa-solid fa-bag-shopping"></i>
        <h4>Your Shopping Bag is Empty</h4>
        <p>Explore our curated haute couture selections and discover timeless luxury.</p>
        <button class="btn btn-primary" onclick="closeCartAndScroll()">Explore Collection</button>
      </div>
    `;
  } else {
    drawerBody.innerHTML = summary.items.map(item => `
      <div class="drawer-item" data-id="${item.id}">
        <img class="drawer-item-img" src="${item.thumbnail}" alt="${item.title}" />
        <div class="drawer-item-details">
          <h5 class="drawer-item-title">${item.title}</h5>
          <span class="drawer-item-price">${formatPrice(item.price)}</span>
          <div class="drawer-qty-controls">
            <button class="drawer-qty-btn cart-qty-minus" data-id="${item.id}">-</button>
            <span class="drawer-qty-num">${item.quantity}</span>
            <button class="drawer-qty-btn cart-qty-plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="drawer-item-remove cart-item-remove" data-id="${item.id}" title="Remove item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    // Attach quantity and remove handlers
    drawerBody.querySelectorAll('.cart-qty-minus').forEach(b => {
      b.addEventListener('click', () => {
        const id = Number(b.getAttribute('data-id'));
        window.boutiqueCart.decrementQuantity(id);
      });
    });

    drawerBody.querySelectorAll('.cart-qty-plus').forEach(b => {
      b.addEventListener('click', () => {
        const id = Number(b.getAttribute('data-id'));
        window.boutiqueCart.incrementQuantity(id);
      });
    });

    drawerBody.querySelectorAll('.cart-item-remove').forEach(b => {
      b.addEventListener('click', () => {
        const id = Number(b.getAttribute('data-id'));
        window.boutiqueCart.removeItem(id);
        showToast('Item removed from shopping bag.', 'info');
      });
    });
  }

  // Active Promo Code Pill
  const couponContainer = document.getElementById('applied-coupon-container');
  if (couponContainer) {
    if (summary.coupon) {
      couponContainer.innerHTML = `
        <div class="applied-coupon-pill">
          <div>
            <strong>${summary.coupon.code}</strong>: ${summary.coupon.description}
          </div>
          <button class="remove-coupon-btn" id="remove-coupon-btn" title="Remove promo code">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
      const removeBtn = document.getElementById('remove-coupon-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          window.boutiqueCart.removeCoupon();
          showToast('Coupon removed.', 'info');
        });
      }
    } else {
      couponContainer.innerHTML = '';
    }
  }

  // Financial Breakdown in Cart Drawer
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountRowEl = document.getElementById('cart-discount-row');
  const discountValEl = document.getElementById('cart-discount');
  const shippingEl = document.getElementById('cart-shipping');
  const taxEl = document.getElementById('cart-tax');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.textContent = formatPrice(summary.subtotal);
  if (shippingEl) shippingEl.textContent = summary.shipping === 0 ? 'Complimentary' : formatPrice(summary.shipping);
  if (taxEl) taxEl.textContent = formatPrice(summary.tax);
  if (totalEl) totalEl.textContent = formatPrice(summary.total);

  if (discountRowEl && discountValEl) {
    if (summary.discount > 0) {
      discountRowEl.style.display = 'flex';
      discountValEl.textContent = `-${formatPrice(summary.discount)}`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }
}

// Update Wishlist UI
function updateWishlistUI(items) {
  const badge = document.getElementById('wishlist-badge');
  const drawerCount = document.getElementById('wishlist-drawer-count');
  const drawerBody = document.getElementById('wishlist-drawer-body');

  if (badge) {
    badge.textContent = items.length;
    badge.classList.add('badge-pulse');
    setTimeout(() => badge.classList.remove('badge-pulse'), 400);
  }

  if (drawerCount) {
    drawerCount.textContent = `(${items.length})`;
  }

  if (!drawerBody) return;

  if (items.length === 0) {
    drawerBody.innerHTML = `
      <div class="drawer-empty">
        <i class="fa-regular fa-heart"></i>
        <h4>Your Wishlist is Empty</h4>
        <p>Save items you desire by tapping the heart icon on any piece.</p>
        <button class="btn btn-primary" onclick="closeWishlistAndScroll()">Discover Creations</button>
      </div>
    `;
  } else {
    drawerBody.innerHTML = items.map(item => `
      <div class="drawer-item" data-id="${item.id}">
        <img class="drawer-item-img" src="${item.thumbnail}" alt="${item.title}" />
        <div class="drawer-item-details">
          <h5 class="drawer-item-title">${item.title}</h5>
          <span class="drawer-item-price">${formatPrice(item.price)}</span>
          <button class="btn btn-primary wishlist-move-btn" data-id="${item.id}" style="padding: 0.4rem 0.8rem; font-size: 0.78rem; align-self: flex-start; margin-top: 0.3rem;">
            <i class="fa-solid fa-bag-shopping"></i> Move to Bag
          </button>
        </div>
        <button class="drawer-item-remove wishlist-item-remove" data-id="${item.id}" title="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');

    // Attach Move to Bag & Remove
    drawerBody.querySelectorAll('.wishlist-move-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        window.boutiqueWishlist.moveToCart(id);
        showToast('Moved piece from Wishlist into Shopping Bag!', 'success', 'fa-solid fa-bag-shopping');
        renderCatalog();
      });
    });

    drawerBody.querySelectorAll('.wishlist-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        window.boutiqueWishlist.removeItem(id);
        showToast('Removed from Wishlist.', 'info');
        renderCatalog();
      });
    });
  }
}

// Helper to close drawer and scroll to catalog
window.closeCartAndScroll = function() {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const panel = document.getElementById('cart-drawer-panel');
  if (backdrop) backdrop.classList.remove('active');
  if (panel) panel.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
};

window.closeWishlistAndScroll = function() {
  const backdrop = document.getElementById('wishlist-drawer-backdrop');
  const panel = document.getElementById('wishlist-drawer-panel');
  if (backdrop) backdrop.classList.remove('active');
  if (panel) panel.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
};

// ==========================================================================
// CHECKOUT & ORDER CONFIRMATION MODALS
// ==========================================================================
function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal-backdrop');
  if (!modal) return;

  const summary = window.boutiqueCart.getSummary();
  const summaryList = document.getElementById('checkout-items-summary');
  const totalVal = document.getElementById('checkout-grand-total');

  if (summaryList) {
    summaryList.innerHTML = summary.items.map(i => `
      <div style="display:flex; justify-content:space-between; margin-bottom: 0.4rem; font-size: 0.85rem;">
        <span>${i.quantity}x ${i.title}</span>
        <strong>${formatPrice(i.price * i.quantity)}</strong>
      </div>
    `).join('');
  }

  if (totalVal) {
    totalVal.textContent = formatPrice(summary.total);
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Checkout Form Submission with Validation and 404 Redirection
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.onsubmit = (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('checkout-name');
      const emailInput = document.getElementById('checkout-email');
      const phoneInput = document.getElementById('checkout-phone');
      const cityInput = document.getElementById('checkout-city');
      const addressInput = document.getElementById('checkout-address');
      const zipInput = document.getElementById('checkout-zip');
      const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
      const submitBtn = document.getElementById('checkout-submit-btn');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const cityVal = cityInput ? cityInput.value.trim() : '';
      const addressVal = addressInput ? addressInput.value.trim() : '';
      const zipVal = zipInput ? zipInput.value.trim() : '';

      let formIsValid = true;
      let firstInvalidInput = null;

      function validateField(inputEl, errorId, condition, message) {
        const errorEl = document.getElementById(errorId);
        if (!condition) {
          formIsValid = false;
          if (inputEl) {
            inputEl.classList.remove('input-success');
            inputEl.classList.add('input-error');
            if (!firstInvalidInput) firstInvalidInput = inputEl;
          }
          if (errorEl) {
            errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
            errorEl.style.display = 'flex';
          }
        } else {
          if (inputEl) {
            inputEl.classList.remove('input-error');
            inputEl.classList.add('input-success');
          }
          if (errorEl) {
            errorEl.style.display = 'none';
          }
        }
      }

      // 1. Full Name Validation
      validateField(
        nameInput,
        'error-checkout-name',
        nameVal.length >= 3,
        'Full name is required (minimum 3 characters).'
      );

      // 2. Email Validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      validateField(
        emailInput,
        'error-checkout-email',
        emailRegex.test(emailVal),
        'Please enter a valid email address (e.g. patron@domain.com).'
      );

      // 3. Telephone Validation
      const phoneDigits = phoneVal.replace(/[^0-9]/g, '');
      validateField(
        phoneInput,
        'error-checkout-phone',
        phoneDigits.length >= 7,
        'Please provide a valid phone number (min 7 digits).'
      );

      // 4. City Validation
      validateField(
        cityInput,
        'error-checkout-city',
        cityVal.length >= 2,
        'City name is required (minimum 2 characters).'
      );

      // 5. Address Validation
      validateField(
        addressInput,
        'error-checkout-address',
        addressVal.length >= 5,
        'Delivery address is required (minimum 5 characters).'
      );

      // 6. Postal/ZIP Validation
      validateField(
        zipInput,
        'error-checkout-zip',
        zipVal.length >= 3,
        'Valid postal / ZIP code is required.'
      );

      // 7. Payment Instrument Validation
      const paymentErrorEl = document.getElementById('error-checkout-payment');
      if (!paymentRadio) {
        formIsValid = false;
        if (paymentErrorEl) {
          paymentErrorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please select a payment instrument.';
          paymentErrorEl.style.display = 'flex';
        }
      } else if (paymentErrorEl) {
        paymentErrorEl.style.display = 'none';
      }

      // Check if validation failed
      if (!formIsValid) {
        if (firstInvalidInput) firstInvalidInput.focus();
        showToast('Please correct the highlighted form errors to proceed.', 'warning', 'fa-solid fa-triangle-exclamation');
        return;
      }

      // Form is VALID!
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Details Verified & Authorizing...';
      }

      // Record order in cart service
      const customerInfo = {
        fullName: nameVal,
        email: emailVal,
        phone: phoneVal,
        address: addressVal,
        city: cityVal,
        zip: zipVal,
        paymentMethod: paymentRadio ? paymentRadio.value : 'Credit Card'
      };
      window.boutiqueCart.createOrder(customerInfo);

      showToast('Payment & delivery details validated! Redirecting to confirmation...', 'success', 'fa-solid fa-circle-check');

      // Save exact scroll position & section so 'Back to Previous Page' returns here
      sessionStorage.setItem('elegance_return_scroll_y', window.scrollY.toString());
      sessionStorage.setItem('elegance_return_section_id', 'catalog');

      // After validation, redirect to custom 404 page
      setTimeout(() => {
        window.location.href = '404.html?from=checkout';
      }, 750);
    };

    // Real-time input listener to clear error borders as user types
    ['checkout-name', 'checkout-email', 'checkout-phone', 'checkout-city', 'checkout-address', 'checkout-zip'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          el.classList.remove('input-error');
          const errorEl = document.getElementById('error-' + id);
          if (errorEl) errorEl.style.display = 'none';
        });
      }
    });
  }

  const closeBtn = document.getElementById('checkout-close-btn');
  if (closeBtn) closeBtn.onclick = closeCheckoutModal;
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal-backdrop');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openOrderSuccessModal(order) {
  const modal = document.getElementById('order-success-modal-backdrop');
  if (!modal) return;

  document.getElementById('order-number').textContent = `Order #${order.orderId}`;
  document.getElementById('order-customer-name').textContent = order.customer.fullName;
  document.getElementById('order-shipping-address').textContent = `${order.customer.address}, ${order.customer.city} (${order.customer.zip})`;
  document.getElementById('order-delivery-eta').textContent = order.deliveryEstimate;
  document.getElementById('order-total-charged').textContent = formatPrice(order.pricing.total);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  const continueBtn = document.getElementById('order-continue-btn');
  if (continueBtn) {
    continueBtn.onclick = () => {
      closeOrderSuccessModal();
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    };
  }
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('order-success-modal-backdrop');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ==========================================================================
// SCROLL RESTORATION HELPER (Exact area & position restoration from 404 page)
// ==========================================================================
function restorePreviousScrollPosition() {
  const savedScroll = sessionStorage.getItem('elegance_return_scroll_y') || sessionStorage.getItem('elegance_recent_scroll_y');
  const savedSection = sessionStorage.getItem('elegance_return_section_id');

  if (savedScroll !== null) {
    const targetY = parseFloat(savedScroll);
    sessionStorage.removeItem('elegance_return_scroll_y');
    sessionStorage.removeItem('elegance_return_section_id');
    sessionStorage.removeItem('elegance_recent_scroll_y');

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.scrollTo({
          top: targetY,
          behavior: 'instant'
        });
      }, 70);
    });
  } else if (savedSection) {
    sessionStorage.removeItem('elegance_return_section_id');
    const targetEl = document.getElementById(savedSection);
    if (targetEl) {
      setTimeout(() => {
        targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 70);
    }
  }
}

// BFCache page restoration listener
window.addEventListener('pageshow', () => {
  const savedScroll = sessionStorage.getItem('elegance_return_scroll_y') || sessionStorage.getItem('elegance_recent_scroll_y');
  if (savedScroll !== null) {
    const targetY = parseFloat(savedScroll);
    sessionStorage.removeItem('elegance_return_scroll_y');
    sessionStorage.removeItem('elegance_return_section_id');
    sessionStorage.removeItem('elegance_recent_scroll_y');
    setTimeout(() => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
    }, 60);
  }
});

// Passive scroll tracker to maintain high-accuracy scroll coordinates
let boutiqueScrollTracker;
window.addEventListener('scroll', () => {
  clearTimeout(boutiqueScrollTracker);
  boutiqueScrollTracker = setTimeout(() => {
    sessionStorage.setItem('elegance_recent_scroll_y', window.scrollY.toString());
  }, 100);
}, { passive: true });
