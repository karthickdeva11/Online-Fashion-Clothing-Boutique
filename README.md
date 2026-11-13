# ÉLÉGANCE ATELIER - Online Fashion & Clothing Boutique

A modern, high-end **Haute Couture & Luxury Ready-to-Wear Online Fashion Boutique** built with pure **HTML5, CSS3, and JavaScript (Vanilla)** integrated with the **DummyJSON Products API**. Enhanced with **GSAP** and **AOS (Animate on Scroll)** animations.

---

## ✨ Features & Requirements Fulfilled

### 1. Required Homepage Sections
- **Top Announcement Bar**: Displays promotional privileges, complimentary VIP express shipping notification, currency selector (`USD`, `EUR`, `GBP`), and concierge contact.
- **Brand Logo & Favicon**: The custom brand logo image (`logo_0027.webp`) is positioned across the site (Header navigation, Footer, VIP Checkout modal, Order Success modal, and browser Favicon).
- **Header & Navigation**: Sticky luxury navigation with brand logo image, smooth navigation links, wishlist badge counter, interactive cart bag with live subtotal, and an animated mobile hamburger menu.
- **Hero Section (Interactive Fashion Slider)**:
  - Multi-slide luxury carousel featuring 4 editorial fashion departments:
    1. *Spring/Summer Haute Couture 2026* (Evening Gowns)
    2. *Sartorial Mastery & Menswear* (Tailored Suits & Chronographs)
    3. *Atelier Leather & Haute Jewellery* (Designer Handbags & Diamonds)
    4. *Runway Statement & Haute Eyewear* (Paris Fashion Week Drops)
  - **GSAP Dynamic Stagger Transitions**: Headlines, eyebrows, descriptions, stats, and imagery animate fluidly on every slide change.
  - **Rich Controls**: Circular Prev/Next navigation buttons, animated progress-fill pagination dots, live slide counter (`01 / 04`), autoplay (6s interval), pause on hover, touch/swipe gestures, and keyboard arrow controls.
  - Continuous floating GSAP yoyo badges (*Bespoke Atelier*, *VIP White Glove Courier*).
- **Featured Categories**: 6 curated department cards (*Women's Evening Gowns*, *Men's Tailored Shirts*, *Designer Handbags*, *Fine Jewellery*, *Haute Footwear*, *Luxury Timepieces*) with hover zoom and click-to-filter capabilities.
- **Product Catalog (Main Dynamic Hub)**:
  - Real-time live search by product name/description with 280ms debounce.
  - Category filter pills (*All*, *Evening Gowns*, *Men's Shirts*, *Women's Shoes*, *Bags*, *Jewellery*, *Watches*, *Sunglasses*).
  - Sorting functionality (*Price: Low to High*, *Price: High to Low*, *Patron Rating: High to Low*, *Name: A to Z*, *Highest Discount*).
  - Product cards featuring badges (*NEW DROP*, *TRENDING*, *BESTSELLER*, *-X% OFF*), star rating score, review counts, original vs. discounted pricing, wishlist toggle, and quick add-to-bag.
  - "Load More" pagination with progress counter.
  - Shimmering skeleton loaders during data fetch and graceful error handling.
- **Curated Showcases**:
  - **New Arrivals**: The freshest drops straight from international ateliers.
  - **Trending Products**: Highlighting the most coveted luxury essentials.
  - **Best Sellers**: Showcasing timeless iconic pieces with top client appraisals.
- **Special Offers**:
  - Live ticking countdown timer for the private flash sale.
  - 3 promotional privilege cards with one-click copy code functionality and instant toast notifications:
    1. **`VOGUE25`**: 25% Off Entire Boutique Order
    2. **`LUXE50`**: $50 Off Orders over $200
    3. **`FREESHIP`**: 100% Off VIP Express Worldwide Courier
- **Customer Testimonials**: 3+ verified client reviews from fashion editors, art collectors, and creative directors with photos and star ratings.
- **Newsletter Subscription**: Private Circle invite with real-time email regex validation; after successful validation, redirects patrons to the custom `404.html` salon archive.
- **Footer**: Brand philosophy, boutique departments, customer concierge links, global flagship addresses (*Paris*, *Milan*, *New York*, *Tokyo*), accepted payment badges, and social media channels. (Exempt from 404 redirection).
- **Custom 404 Page (`404.html`)**:
  - All non-navbar and non-footer hyperlinks across the boutique automatically redirect to this custom 404 page.
  - Forms (Newsletter and VIP Checkout) execute full field validation first; once validated, they redirect to `404.html` displaying dynamic verification badges.
  - **Zero-Distraction Layout**: Navigation bar completely removed for a centered, bespoke luxury presentation.
  - **Two Action Buttons**:
    1. **"Back to Previous Page"**: Employs synchronized session history & pixel-accurate scroll restoration (`window.history.back()`) to take patrons back to the exact same place, section, and scroll position they departed from.
    2. **"Back to Home"**: Directly returns to the boutique home page at the top.
  - Integrated brand logo (`logo_0027.webp`) in the card header and footer.

### 2. API Integration (DummyJSON)
- Fetches real-time products from `https://dummyjson.com/products`.
- Filters fashion departments (`womens-dresses`, `womens-shoes`, `womens-bags`, `womens-jewellery`, `womens-watches`, `mens-shirts`, `mens-shoes`, `mens-watches`, `tops`, `sunglasses`).
- Live search query endpoint integration (`/products/search?q=`).
- Single product detail retrieval (`/products/{id}`).
- Comprehensive error handling and skeleton loading states.

### 3. JavaScript Functionalities & State Persistence
- **Shopping Bag (Cart)**:
  - Slide-out drawer with backdrop blur.
  - Add, remove, increment, and decrement item quantities.
  - Automatic calculation of subtotal, discount, shipping, tax (8%), and grand total.
  - Promo coupon redemption system with validation.
  - Free shipping progress bar (unlocks complimentary delivery at $150).
  - Persisted in browser `localStorage` (`elegance_cart_items`).
- **Wishlist**:
  - Slide-out drawer displaying favorited pieces.
  - Instant heart icon toggle on product cards and product details modal.
  - Move to Cart functionality directly from wishlist drawer.
  - Persisted in browser `localStorage` (`elegance_wishlist_items`).
- **Product Details Modal**:
  - Multi-image gallery with thumbnail switcher.
  - Title, SKU, availability status, shipping info, and return policy.
  - Quantity selector (+ / -) with Add to Bag and Wishlist buttons.
  - Real customer reviews extracted directly from DummyJSON.
- **Checkout & Order Validation**:
  - VIP checkout modal with full validation for Name, Email, Phone, City, Address, ZIP, and Payment instrument selection.
  - Highlights input errors with visual alerts; upon successful validation, authorizes order and redirects to `404.html?from=checkout`.
- **Mobile Responsive Drawer**:
  - Slide-out mobile navigation drawer on screens $\le 768\text{px}$.
- **Toast Alerts**:
  - Floating toast notifications for feedback across all interactions.

### 4. Animations (GSAP & AOS)
- **GSAP (GreenSock)**:
  - Staggered hero typography entrance (`.hero-eyebrow`, `.hero-title`, `.hero-description`, `.hero-cta-group`, `.hero-stats`).
  - Continuous smooth floating yoyo effect for decorative badges (`.floating-badge-1`, `.floating-badge-2`).
- **AOS (Animate on Scroll)**:
  - Cards, section headers, promotional offers, and testimonials smoothly fade and slide up into view as user scrolls.

---

## 📁 Project Folder Structure

```
Online fashion clothing/
├── index.html          # Main boutique homepage
├── 404.html            # Standalone luxury 404 error page
├── README.md           # Documentation and guide
├── css/
│   └── style.css       # Core responsive stylesheet (variables, grid, modals, drawers)
└── js/
    ├── api.js          # DummyJSON API service, endpoints, caching & error handling
    ├── cart.js         # Cart logic, coupon discounts, order placement, LocalStorage
    ├── wishlist.js     # Wishlist management and LocalStorage persistence
    └── app.js          # Controller: dynamic rendering, search, filters, modals, GSAP/AOS
```

---

## 🎟️ Active Boutique Promo Codes

| Promo Code | Discount Offer | Condition |
| :--- | :--- | :--- |
| **`VOGUE25`** | **25% OFF** | Valid on any order size |
| **`LUXE50`** | **$50 OFF** | Orders over $200 |
| **`FREESHIP`** | **100% Free Shipping** | Complimentary express courier |
| **`FIRST10`** | **10% OFF** | Welcome privilege code |
| **`ELEGANCE20`** | **$20 OFF** | Orders over $100 |

---

## 🚀 How to Run the Application

You can open `index.html` directly in any modern web browser or serve it via a local development server:

### Option 1: Double-click or open directly in browser
Simply double-click `index.html` or open it with Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option 2: Run via Node.js local server
```bash
# Using npx serve (recommended)
npx serve .

# Or using Python 3
python -m http.server 8000
```
Open `http://localhost:3000` or `http://localhost:8000` in your web browser.
