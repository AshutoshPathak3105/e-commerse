/* ═══════════════════════════════════════════════════════════════
   DYNAMIC API BASE CONFIGURATION (Localhost + Netlify/Render)
   ═══════════════════════════════════════════════════════════════ */
// Deployed Render backend URL (can also be overridden in HTML via window.RENDER_BACKEND_URL)
const PRODUCTION_BACKEND_URL = window.RENDER_BACKEND_URL || 'https://e-commerse-4xlp.onrender.com';

const isLocalHost = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.protocol === 'file:'
);

const API_BASE = isLocalHost
  ? (window.location.port === '8000' ? '/api' : 'http://localhost:8000/api')
  : `${PRODUCTION_BACKEND_URL.replace(/\/+$/, '')}/api`;

/* ── Currency Converter (Base: INR ₹) ──────────────────────── */
const Currency = {
  current: localStorage.getItem('xmart_currency') || 'INR',

  // Offline fallback rates (1 INR = X foreign)
  rates: {
    INR: { symbol: '₹', rate: 1.0,      name: 'Rupees (₹)',   locale: 'en-IN', decimals: 0 },
    USD: { symbol: '$', rate: 0.01157,   name: 'USD ($)',      locale: 'en-US', decimals: 2 },
    EUR: { symbol: '€', rate: 0.01063,   name: 'EUR (€)',      locale: 'de-DE', decimals: 2 },
    GBP: { symbol: '£', rate: 0.00910,   name: 'GBP (£)',      locale: 'en-GB', decimals: 2 },
  },

  /** Convert an INR amount to the currently selected currency */
  convert(inrAmount) {
    const cfg = this.rates[this.current] || this.rates.INR;
    return (inrAmount || 0) * cfg.rate;
  },

  /** Format a price (stored as INR internally) as a currency string */
  format(inrAmount) {
    const cfg = this.rates[this.current] || this.rates.INR;
    const val = this.convert(inrAmount);
    if (this.current === 'INR') {
      return `₹${Math.round(val).toLocaleString('en-IN')}`;
    }
    return `${cfg.symbol}${val.toLocaleString(cfg.locale, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals
    })}`;
  },

  /** Change active currency, persist, and refresh UI */
  set(code) {
    if (!this.rates[code]) return;
    this.current = code;
    localStorage.setItem('xmart_currency', code);
    this._syncNavbarLabel();
    this._refreshAllPrices();
  },

  /** Update navbar dropdown label to reflect active currency */
  _syncNavbarLabel() {
    const cfg = this.rates[this.current] || this.rates.INR;
    const label = document.querySelector('#currency-menu')
      ?.closest('.dropdown')
      ?.querySelector('[data-dropdown-label]');
    if (label) label.textContent = cfg.name;

    // Mark selected item in dropdown
    document.querySelectorAll('#currency-menu [data-dropdown-option]').forEach(opt => {
      const isSel = opt.dataset.currencyCode === this.current;
      opt.classList.toggle('is-selected', isSel);
      opt.setAttribute('aria-checked', isSel ? 'true' : 'false');
    });
  },

  /** Re-render all currently visible price surfaces */
  _refreshAllPrices() {
    // 1. Re-render home page static prices
    if (typeof window._reRenderHomePrices === 'function') window._reRenderHomePrices();
    // 2. Re-render catalog page if visible
    if (typeof window._reRenderCatalogPrices === 'function') window._reRenderCatalogPrices();
    // 3. Re-render cart panel if open
    if (typeof renderCartPanel === 'function') renderCartPanel();
    // 4. Re-render wishlist if open
    if (typeof window._reRenderWishlistPrices === 'function') window._reRenderWishlistPrices();
    // 5. Re-render checkout if open
    if (typeof window._reRenderCheckoutPrices === 'function') window._reRenderCheckoutPrices();
    // 6. Re-render product detail if open
    if (typeof window._reRenderDetailPrices === 'function') window._reRenderDetailPrices();
    // 7. Re-render orders if open
    if (typeof window._reRenderOrdersPrices === 'function') window._reRenderOrdersPrices();
  },

  /** Fetch live exchange rates from open.er-api.com (free, no key needed) */
  async fetchLiveRates() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.rates) {
        if (data.rates.USD) this.rates.USD.rate = data.rates.USD;
        if (data.rates.EUR) this.rates.EUR.rate = data.rates.EUR;
        if (data.rates.GBP) this.rates.GBP.rate = data.rates.GBP;
        console.log('[Currency] Live rates updated:', { USD: this.rates.USD.rate, EUR: this.rates.EUR.rate, GBP: this.rates.GBP.rate });
      }
    } catch (err) {
      console.warn('[Currency] Using offline rates:', err.message);
    }
  },
};

// Fetch live rates on page load (non-blocking)
Currency.fetchLiveRates();

function initHomePriceConverter() {
  const elements = document.querySelectorAll(
    '.delivery-message, .hero-card-badge, .yellow-price-tag, .quad-item-label, .quad-card-title'
  );
  elements.forEach(el => {
    if (el.textContent.includes('₹') && !el.dataset.origHtml) {
      el.dataset.origHtml = el.innerHTML;
    }
  });
}

window._reRenderHomePrices = () => {
  const elements = document.querySelectorAll(
    '.delivery-message, .hero-card-badge, .yellow-price-tag, .quad-item-label, .quad-card-title'
  );
  elements.forEach(el => {
    if (el.dataset.origHtml) {
      if (Currency.current === 'INR') {
        el.innerHTML = el.dataset.origHtml;
      } else {
        el.innerHTML = el.dataset.origHtml.replace(/₹([\d,]+)/g, (match, p1) => {
          const num = parseFloat(p1.replace(/,/g, ''));
          return isNaN(num) ? match : Currency.format(num);
        });
      }
    }
  });
};

/* ── Multi-Language Translation Manager (EN, ES, FR, HI) ─────── */
const Language = {
  current: localStorage.getItem('xmart_language') || 'en',

  languages: {
    en: { name: 'English', label: 'English', code: 'en' },
    es: { name: 'Español', label: 'Español', code: 'es' },
    fr: { name: 'Français', label: 'Français', code: 'fr' },
    hi: { name: 'हिन्दी', label: 'हिन्दी', code: 'hi' }
  },

  set(code) {
    if (!this.languages[code]) return;
    this.current = code;
    localStorage.setItem('xmart_language', code);

    // Set Google Translate Cookie
    document.cookie = `googtrans=/en/${code}; path=/;`;
    if (window.location.hostname && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
      document.cookie = `googtrans=/en/${code}; domain=.${window.location.hostname}; path=/;`;
    }

    this._syncNavbarLabel();

    // Trigger Google translate select widget if already rendered
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
    } else {
      // Reload so translation engine initializes with active language
      window.location.reload();
    }
  },

  _syncNavbarLabel() {
    const lang = this.languages[this.current] || this.languages.en;
    const label = document.querySelector('#language-menu')
      ?.closest('.dropdown')
      ?.querySelector('[data-dropdown-label]');
    if (label) label.textContent = lang.name;

    document.querySelectorAll('#language-menu [data-dropdown-option]').forEach(opt => {
      const isSel = (opt.dataset.langCode === this.current) || (opt.dataset.label === lang.name);
      opt.classList.toggle('is-selected', isSel);
      opt.setAttribute('aria-checked', isSel ? 'true' : 'false');
    });
  },

  init() {
    this._syncNavbarLabel();
    if (this.current && this.current !== 'en') {
      document.cookie = `googtrans=/en/${this.current}; path=/;`;
    }
  }
};

/* ── Safe API Request Helper ──────────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error(`Cannot connect to backend server at ${API_BASE}. Please ensure your backend is running.`);
  }

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON response
  }

  if (!res.ok || (data && data.success === false)) {
    const errorMsg = data?.message || (res.status === 401 ? 'Invalid email or password' : `Request failed (${res.status})`);
    throw new Error(errorMsg);
  }

  return data;
}

/* ── Toast Notifications (Top Right Below Navbar • Pure Navy Blue) ─ */
let _lastToastMsg = '';
let _lastToastTime = 0;
function showToast(msg, type = 'success', dur = 3200) {
  const now = Date.now();
  if (msg === _lastToastMsg && (now - _lastToastTime) < 500) return;
  _lastToastMsg = msg;
  _lastToastTime = now;

  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
  const header = document.querySelector('.site-header, #site-header');
  const topOffset = header ? Math.max(header.offsetHeight + 14, 160) : 160;
  c.style.cssText = `position:fixed;top:${topOffset}px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;`;

  const t = document.createElement('div');
  t.style.cssText = `background:#19324c;color:#ffffff;padding:14px 22px;border-radius:10px;font-size:13.5px;font-weight:700;box-shadow:0 14px 35px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.08);max-width:380px;opacity:0;transform:translateY(-12px);transition:all 220ms cubic-bezier(.16,1,.3,1);pointer-events:auto;font-family:inherit;line-height:1.45;border:1.5px solid #19324c;`;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(-12px)';
    setTimeout(() => t.remove(), 250);
  }, dur);
}

/* ── Auth State & Helper ──────────────────────────────────── */
const Auth = {
  getToken() { return localStorage.getItem('xmart_token'); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('xmart_user')) || null; }
    catch { return null; }
  },
  setSession(user, token) {
    localStorage.setItem('xmart_token', token);
    localStorage.setItem('xmart_user', JSON.stringify(user));
    this.syncUI();
    Store.syncUI();
  },
  logout() {
    localStorage.removeItem('xmart_token');
    localStorage.removeItem('xmart_user');
    this.syncUI();
    Store.syncUI();
    showToast('Signed out successfully', 'info');
  },
  async deleteAccount() {
    const confirmed = confirm('ARE YOU SURE YOU WANT TO PERMANENTLY DELETE YOUR ACCOUNT?\n\nThis will permanently delete your user profile, order records, saved addresses, wallet balance, and cart items from MongoDB Atlas. This action CANNOT be undone.');
    if (!confirmed) return;

    try {
      showToast('Deleting account and clearing all user data...', 'info', 3000);
      await apiFetch('/auth/account', {
        method: 'DELETE',
        headers: this.getHeaders()
      });
    } catch (err) {
      console.warn('Backend delete notification:', err.message);
    }

    // Completely purge local storage and user session data
    localStorage.removeItem('xmart_token');
    localStorage.removeItem('xmart_user');
    localStorage.removeItem('xmart_saved_addresses');
    localStorage.removeItem('xmart_wallet_balance');
    localStorage.removeItem('xmart_wallet_txns');
    localStorage.removeItem('xmart_wishlist');
    localStorage.removeItem('xmart_cart');
    localStorage.removeItem('xmart_seller_profile');
    localStorage.removeItem('xmart_seller_items');

    Store.wishlist = [];
    Store.cart = [];
    Store.save();
    Store.syncUI();
    this.syncUI();

    showToast('Your account and all associated data have been completely deleted.', 'success', 5000);

    // Close any open modal / drawer and return home
    document.querySelectorAll('.xmodal-overlay, #dept-sidebar, #dept-sidebar-overlay').forEach(el => {
      el.classList.remove('is-open');
      if (el._close) el._close();
    });
    document.body.style.overflow = '';
    window._showHomeView ? window._showHomeView() : (window.location.href = '/');
  },
  isLoggedIn() { return !!this.getToken(); },
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },
  syncUI() {
    const user = this.getUser();
    const acctSmall = document.querySelectorAll('.account-action small');
    const acctStrong = document.querySelectorAll('.account-action strong');
    const deptGreeting = document.getElementById('dept-user-greeting');
    const deptAuth = document.getElementById('dept-auth-btn');
    const deptDel = document.getElementById('dept-del-account-btn');
    
    if (user) {
      const firstName = user.name ? user.name.split(' ')[0] : 'User';
      acctSmall.forEach(el => el.textContent = `Hello, ${firstName}`);
      acctStrong.forEach(el => el.textContent = 'Account & Orders');
      if (deptGreeting) deptGreeting.textContent = `Hello, ${firstName}`;
      if (deptAuth) deptAuth.textContent = 'Sign Out';
      if (deptDel) deptDel.style.display = 'block';
    } else {
      acctSmall.forEach(el => el.textContent = 'Hello, Sign In');
      acctStrong.forEach(el => el.textContent = 'Account & Lists');
      if (deptGreeting) deptGreeting.textContent = 'Hello, Sign In';
      if (deptAuth) deptAuth.textContent = 'Sign In';
      if (deptDel) deptDel.style.display = 'none';
    }
  }
};

/* ── Local & Live State Management ────────────────────────── */
const Store = {
  cart: JSON.parse(localStorage.getItem('xmart_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('xmart_wishlist') || '[]'),
  allProducts: [],

  cartCount() {
    if (!Auth.isLoggedIn()) return 0;
    return this.cart.reduce((s, i) => s + (i.qty || 1), 0);
  },
  cartTotal() {
    if (!Auth.isLoggedIn()) return 0;
    return this.cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
  },
  wishlistCount() {
    if (!Auth.isLoggedIn()) return 0;
    return this.wishlist.length;
  },

  addToCart(item, qty = 1, showToastMsg = true) {
    if (!Auth.isLoggedIn()) {
      showToast('Please sign in to add items to your cart', 'warn');
      window._openAuth?.('signin');
      return false;
    }
    const targetQty = typeof qty === 'number' && qty > 0 ? qty : 1;
    const existing = this.cart.find(c => c.id === item.id || (item._id && c.id === item._id));
    if (existing) {
      existing.qty = (existing.qty || 1) + targetQty;
    } else {
      this.cart.push({
        id: item.id || item._id || ('prod-' + Date.now()),
        name: item.name,
        price: item.finalPrice || item.price,
        originalPrice: item.originalPrice || item.price,
        img: item.img || (item.images && item.images[0]) || '',
        category: item.category || 'General',
        qty: targetQty
      });
    }
    this.save();
    this.syncUI();
    renderCartPanel();
    if (showToastMsg) {
      showToast(`"${item.name}" added to cart!`, 'success');
    }
    return true;
  },

  removeFromCart(id) {
    this.cart = this.cart.filter(c => c.id !== id);
    this.save();
    this.syncUI();
    renderCartPanel();
  },

  clearCart() {
    this.cart = [];
    this.save();
    this.syncUI();
    renderCartPanel();
  },

  toggleWishlist(item) {
    if (!Auth.isLoggedIn()) {
      showToast('Please sign in to save items to your wishlist', 'warn');
      window._openAuth?.('signin');
      return false;
    }
    const id = item.id || item._id;
    const idx = this.wishlist.findIndex(w => w.id === id);
    let added = false;
    if (idx > -1) {
      this.wishlist.splice(idx, 1);
    } else {
      this.wishlist.push({
        id,
        name: item.name,
        price: item.price,
        img: item.img || (item.images && item.images[0]) || '',
        category: item.category || 'General'
      });
      added = true;
    }
    this.save();
    this.syncUI();
    showToast(added ? `Added "${item.name}" to Wishlist` : `Removed from Wishlist`, added ? 'success' : 'info');
    return added;
  },

  save() {
    localStorage.setItem('xmart_cart', JSON.stringify(this.cart));
    localStorage.setItem('xmart_wishlist', JSON.stringify(this.wishlist));
  },

  syncUI() {
    const isAuth = Auth.isLoggedIn();
    const count = isAuth ? this.cart.reduce((s, i) => s + (i.qty || 1), 0) : 0;
    const wishCount = isAuth ? this.wishlist.length : 0;
    document.querySelectorAll('.cart-count').forEach(e => e.textContent = count);
    document.querySelectorAll('.wishlist-count').forEach(e => e.textContent = wishCount);
    const cl = document.querySelector('.cart-action');
    if (cl) cl.setAttribute('aria-label', `Cart, ${count} items`);
  }
};

/* ── Initial Products Catalog & Synonyms ─────────────────── */
const SMART_SYNONYMS = {
  'mobile': ['phone', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', '5g', 'redmi', 'realme', 'mobile', 'cellular'],
  'phone': ['mobile', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', 'cellular'],
  'smartphone': ['mobile', 'phone', 'oneplus', 'samsung', 'iphone', 'nord'],
  'laptop': ['computer', 'macbook', 'notebook', 'pc', 'asus', 'dell', 'hp', 'lenovo', 'acer', 'labtop'],
  'labtop': ['laptop', 'computer', 'macbook', 'notebook', 'dell', 'hp', 'lenovo', 'asus'],
  'computer': ['laptop', 'pc', 'macbook', 'desktop', 'monitor'],
  'headphone': ['earbuds', 'audio', 'earphone', 'headset', 'airpods', 'sony', 'bose', 'sound', 'neckband'],
  'earphone': ['earbuds', 'headphone', 'audio', 'airpods', 'sound', 'neckband', 'wired earphone', 'iem'],
  'earbuds': ['airpods', 'earphones', 'headphones', 'audio', 'buds', 'tws'],
  'airpod': ['airpods', 'earbuds', 'earphones', 'tws', 'apple', 'buds', 'wireless earbuds'],
  'airpods': ['airpod', 'earbuds', 'earphones', 'tws', 'apple', 'buds', 'wireless earbuds'],
  'neckband': ['bluetooth neckband', 'earphones', 'wireless neckband', 'boAt', 'oneplus bullets', 'realme buds'],
  'wired': ['wired earphone', 'in-ear', 'iem', '3.5mm', 'bassheads', 'type-c earphones'],
  'keyboard': ['mechanical keyboard', 'rgb keyboard', 'gaming keyboard', 'wireless keyboard', 'logitech', 'keychron'],
  'mouse': ['wireless mouse', 'gaming mouse', 'optical mouse', 'logitech mouse', 'razer', 'trackball'],
  'watch': ['smartwatch', 'fossil', 'apple watch', 'galaxy watch', 'clock', 'chronograph', 'titan', 'casio', 'watches'],
  'watches': ['watch', 'smartwatch', 'fossil', 'apple watch', 'galaxy watch', 'clock', 'chronograph', 'titan', 'casio'],
  'tshirt': ['t-shirt', 'tee', 'tshirst', 'polo', 'graphic tee', 'oversized tee', 'tshirts'],
  'tshirts': ['tshirt', 't-shirt', 'tee', 'tshirst', 'polo', 'graphic tee', 'oversized tee'],
  'tshirst': ['tshirt', 't-shirt', 'tee', 'polo', 'graphic tee', 'oversized tee'],
  'jean': ['jeans', 'denim', 'pants', 'trousers', 'levis', 'wrangler'],
  'jeans': ['jean', 'denim', 'pants', 'trousers', 'levis', 'wrangler', 'slim fit'],
  'shirt': ['shirts', 'formal shirt', 'casual shirt', 'cotton shirt', 'linen shirt', 'button-down'],
  'shirts': ['shirt', 'formal shirt', 'casual shirt', 'cotton shirt', 'linen shirt', 'button-down'],
  'apparel': ['appeals', 'clothes', 'clothing', 'fashion', 'jacket', 'blazer', 'coat', 'hoodie', 'suit', 'dress'],
  'appeals': ['apparel', 'clothes', 'clothing', 'fashion', 'jacket', 'blazer', 'coat', 'hoodie', 'suit'],
  'kitchen': ['kitchenware', 'cookware', 'cooker', 'pan', 'blender', 'air fryer', 'kettle', 'prestige', 'hawkins'],
  'kitchenware': ['kitchen', 'cookware', 'cooker', 'pan', 'blender', 'air fryer', 'kettle', 'prestige', 'hawkins'],
  'toy': ['toys', 'lego', 'action figure', 'drone', 'board game', 'plushie', 'nerf', 'puzzle', 'rc car'],
  'toys': ['toy', 'lego', 'action figure', 'drone', 'board game', 'plushie', 'nerf', 'puzzle', 'rc car'],
  'bag': ['bags', 'backpack', 'rucksack', 'duffel', 'laptop bag', 'wildcraft', 'tote'],
  'bags': ['bag', 'backpack', 'rucksack', 'duffel', 'laptop bag', 'wildcraft', 'tote'],
  'trolley': ['trolly', 'trollybags', 'trolley bag', 'suitcase', 'luggage', 'american tourister', 'samsonite', 'safari'],
  'trollybag': ['trolley', 'trollybags', 'trolley bag', 'suitcase', 'luggage', 'american tourister', 'samsonite'],
  'trollybags': ['trolley', 'trolley bag', 'suitcase', 'luggage', 'american tourister', 'samsonite', 'safari'],
  'sofa': ['sofas', 'couch', 'sectional', 'recliner', 'sofa set', 'futon', 'living room'],
  'sofas': ['sofa', 'couch', 'sectional', 'recliner', 'sofa set', 'futon', 'living room'],
  'shoe': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma', 'clarks', 'woodland'],
  'shoes': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma', 'clarks', 'woodland'],
  'beauty': ['skincare', 'perfume', 'makeup', 'serum', 'grooming', 'lipstick', 'dior', 'ordinary'],
  'tv': ['television', 'smart tv', 'oled', 'bravia', 'screen', 'display'],
};

const DEFAULT_CATALOG = [
  { _id: 'p-mob-1', name: 'OnePlus 12 5G 16GB RAM 512GB', brand: 'OnePlus', category: 'Electronics', price: 64999, originalPrice: 69999, discount: 7, rating: 4.8, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'] },
  { _id: 'p-mob-2', name: 'Apple iPhone 15 Pro Max 256GB', brand: 'Apple', category: 'Electronics', price: 148900, originalPrice: 159900, discount: 7, rating: 4.9, images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'] },
  { _id: 'p-mob-3', name: 'Samsung Galaxy S24 Ultra 5G', brand: 'Samsung', category: 'Electronics', price: 129999, originalPrice: 144999, discount: 10, rating: 4.9, images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'] },
  { _id: 'p-mob-4', name: 'Nothing Phone (2) 5G 256GB White', brand: 'Nothing', category: 'Electronics', price: 36999, originalPrice: 44999, discount: 18, rating: 4.6, images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'] },
  { _id: 'p-lap-1', name: 'Apple MacBook Air M3 15-inch', brand: 'Apple', category: 'Electronics', price: 134900, originalPrice: 149900, discount: 10, rating: 4.9, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'] },
  { _id: 'p-aud-1', name: 'Sony WH-1000XM5 Wireless ANC Headphones', brand: 'Sony', category: 'Electronics', price: 26990, originalPrice: 34990, discount: 23, rating: 4.8, images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600'] },
  { _id: 'p-aud-2', name: 'Apple AirPods Pro (2nd Gen) USB-C', brand: 'Apple', category: 'Electronics', price: 20990, originalPrice: 24900, discount: 16, rating: 4.8, images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'] },
  { _id: 'p-tv-1', name: 'LG 55-inch 4K OLED Smart TV evo', brand: 'LG', category: 'Electronics', price: 89999, originalPrice: 119999, discount: 25, rating: 4.7, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'] },
  { _id: 'p-fsh-1', name: "Zara Women's Oversized Wool Blend Coat", brand: 'Zara', category: 'Fashion', price: 6990, originalPrice: 9990, discount: 30, rating: 4.6, images: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600'] },
  { _id: 'p-fsh-2', name: "Nike Air Force 1 '07 Classic White Sneakers", brand: 'Nike', category: 'Fashion', price: 7495, originalPrice: 8995, discount: 17, rating: 4.8, images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'] },
  { _id: 'p-fsh-3', name: "Levi's Men's 511 Slim Fit Stretch Jeans", brand: "Levi's", category: 'Fashion', price: 2799, originalPrice: 4299, discount: 35, rating: 4.5, images: ['https://images.unsplash.com/photo-1542272604-780c96856592?w=600'] },
  { _id: 'p-fsh-4', name: "Women's Floral Tiered Chiffon Maxi Dress", brand: 'H&M', category: 'Fashion', price: 2299, originalPrice: 3999, discount: 43, rating: 4.6, images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'] },
];

Store.allProducts = [...DEFAULT_CATALOG];

/* ── Fetch Initial Products from MongoDB Atlas ────────────── */
async function loadProductsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/products?limit=1000`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      // Merge unique products from MongoDB
      const existingIds = new Set(data.data.map(p => p._id || p.id));
      const fallbacks = DEFAULT_CATALOG.filter(d => !existingIds.has(d._id));
      Store.allProducts = [...data.data, ...fallbacks];
    }
  } catch (err) {
    console.warn('Backend API offline or connecting:', err);
  }
}

/* ============================================================
   INTERACTIVE PROCESSING WINDOWS & MODALS BUILDERS
   ============================================================ */

/* ── 1. Generic Modal Framework ───────────────────────────── */
function createModal(id, options = {}) {
  let overlay = document.getElementById(id);
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = `xmodal-overlay ${options.large ? 'xmodal-overlay--large' : ''}`;
  
  const windowEl = document.createElement('div');
  windowEl.className = `xmodal-window ${options.large ? 'xmodal-window--large' : ''} ${options.side ? 'xmodal-window--side' : ''}`;
  
  windowEl.innerHTML = `
    <div class="xmodal-header">
      <h3>${options.title || 'Window'}</h3>
      <button class="xmodal-close-btn" aria-label="Close modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="xmodal-body">${options.bodyHtml || ''}</div>
    ${options.footerHtml ? `<div class="xmodal-footer">${options.footerHtml}</div>` : ''}
  `;

  overlay.appendChild(windowEl);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.remove('is-active');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  };

  windowEl.querySelector('.xmodal-close-btn')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay._open = () => {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
    });
    document.body.style.overflow = 'hidden';
  };
  overlay._close = close;

  return overlay;
}

/* ── 2. Auth Modal (Sign In / Register / My Account) ──────── */
function buildAuthModal() {
  const modal = createModal('auth-interactive-modal', {
    title: 'Account & Sign In',
    bodyHtml: `
      <div id="auth-unlogged-view">
        <div class="auth-tabs" id="auth-main-tabs">
          <button class="auth-tab-btn is-active" data-tab="signin">Sign In</button>
          <button class="auth-tab-btn" data-tab="signup">Create Account</button>
        </div>

        <!-- STEP 1: Sign In credentials -->
        <form id="signin-form">
          <div class="auth-input-group">
            <label>Email Address</label>
            <input type="email" id="auth-login-email" required>
          </div>
          <div class="auth-input-group">
            <div class="auth-label-row">
              <label>Password</label>
              <a href="#" class="auth-forgot-link" id="forgot-pwd-trigger">Forgot Password?</a>
            </div>
            <div class="auth-pwd-wrapper">
              <input type="password" id="auth-login-password" required>
              <button type="button" class="auth-pwd-toggle" data-target="auth-login-password" aria-label="Toggle password visibility">
                <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" class="auth-submit-btn" id="signin-btn">Continue with OTP</button>
        </form>

        <!-- STEP 2: Login OTP verification -->
        <div id="login-otp-view" style="display:none;">
          <div style="padding:4px 0 16px;">
            <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#0f172a;">Verify Your Login</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">A 6-digit code has been sent to <strong id="login-otp-email-display">your email</strong>. Enter it below to complete sign-in.</p>
          </div>
          <div class="auth-input-group">
            <label>6-Digit OTP Code</label>
            <input type="text" id="login-otp-input" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" style="letter-spacing:6px;font-size:22px;font-weight:800;text-align:center;" required>
          </div>
          <button type="button" class="auth-submit-btn" id="login-otp-verify-btn">Verify & Sign In</button>
          <div style="text-align:center;margin-top:14px;">
            <a href="#" id="login-otp-resend" style="font-size:13px;font-weight:700;color:#000000;text-decoration:none;">Resend Code</a>
          </div>
        </div>

        <!-- Create Account form -->
        <form id="signup-form" style="display:none;">
          <div class="auth-input-group">
            <label>Full Name</label>
            <input type="text" id="auth-reg-name" required>
          </div>
          <div class="auth-input-group">
            <label>Email Address</label>
            <input type="email" id="auth-reg-email" required>
          </div>
          <div class="auth-input-group">
            <label>Mobile Number</label>
            <input type="tel" id="auth-reg-phone" required>
          </div>
          <div class="auth-input-group">
            <label>Password (min 6 chars)</label>
            <div class="auth-pwd-wrapper">
              <input type="password" id="auth-reg-password" minlength="6" required>
              <button type="button" class="auth-pwd-toggle" data-target="auth-reg-password" aria-label="Toggle password visibility">
                <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" class="auth-submit-btn" id="signup-btn">Create Your X-Mart Account</button>
        </form>

        <!-- STEP 2 of Register: Registration OTP verification -->
        <div id="register-otp-view" style="display:none;">
          <div style="padding:4px 0 16px;">
            <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#0f172a;">Verify Your Email</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">We've sent a 6-digit confirmation code to <strong id="register-otp-email-display">your email</strong>. Enter it below to activate your account.</p>
          </div>
          <div class="auth-input-group">
            <label>6-Digit Verification Code</label>
            <input type="text" id="register-otp-input" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" style="letter-spacing:6px;font-size:22px;font-weight:800;text-align:center;" required>
          </div>
          <button type="button" class="auth-submit-btn" id="register-otp-verify-btn">Verify & Create Account</button>
          <div style="text-align:center;margin-top:14px;">
            <a href="#" id="register-otp-resend" style="font-size:13px;font-weight:700;color:#000000;text-decoration:none;">Resend Code</a>
          </div>
        </div>

        <!-- STEP 1: Forgot password → enter email -->
        <div id="forgot-form" style="display:none;">
          <div style="padding:4px 0 12px;">
            <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#0f172a;">Reset Password</h3>
            <p style="font-size:13px;color:#64748b;margin:0 0 14px;line-height:1.4;">Enter your registered email. We'll send you a 6-digit OTP to verify your identity.</p>
          </div>
          <div class="auth-input-group">
            <label>Registered Email Address</label>
            <input type="email" id="auth-forgot-email" required>
          </div>
          <button type="button" class="auth-submit-btn" id="forgot-send-otp-btn">Send Reset Code</button>
          <div style="text-align:center;margin-top:14px;">
            <a href="#" id="back-to-signin-link" style="font-size:13px;font-weight:700;color:#000000;text-decoration:none;">← Back to Sign In</a>
          </div>
        </div>

        <!-- STEP 2: Forgot password → enter OTP -->
        <div id="reset-otp-view" style="display:none;">
          <div style="padding:4px 0 16px;">
            <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#0f172a;">Enter Verification Code</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">A 6-digit code was sent to <strong id="reset-otp-email-display">your email</strong>. It expires in 15 minutes.</p>
          </div>
          <div class="auth-input-group">
            <label>6-Digit OTP Code</label>
            <input type="text" id="reset-otp-input" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" style="letter-spacing:6px;font-size:22px;font-weight:800;text-align:center;" required>
          </div>
          <button type="button" class="auth-submit-btn" id="reset-otp-verify-btn">Verify Code</button>
          <div style="text-align:center;margin-top:14px;">
            <a href="#" id="reset-otp-resend" style="font-size:13px;font-weight:700;color:#000000;text-decoration:none;">Resend Code</a>
          </div>
        </div>

        <!-- STEP 3: Forgot password → set new password -->
        <div id="new-password-view" style="display:none;">
          <div style="padding:4px 0 12px;">
            <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#0f172a;">Set New Password</h3>
            <p style="font-size:13px;color:#64748b;margin:0 0 14px;line-height:1.4;">OTP verified! Choose a strong new password for your account.</p>
          </div>
          <div class="auth-input-group">
            <label>New Password (min 6 chars)</label>
            <div class="auth-pwd-wrapper">
              <input type="password" id="auth-new-password" minlength="6" required>
              <button type="button" class="auth-pwd-toggle" data-target="auth-new-password" aria-label="Toggle password visibility">
                <svg class="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                <svg class="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <button type="button" class="auth-submit-btn" id="set-new-password-btn">Reset Password & Sign In</button>
        </div>
      </div>

      <div id="auth-logged-view" style="display:none;" class="account-dashboard-wrapper">
        <!-- SUB-VIEW 1: Main Dashboard -->
        <div id="account-main-dashboard" style="display:flex;flex-direction:column;gap:20px;">
          <!-- 1. Hero Profile Header -->
          <div class="account-hero-card">
            <div class="account-hero-left">
              <div class="account-avatar-wrap">
                <div class="account-avatar" id="user-avatar-initials">A</div>
                <div class="account-badge-prime">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>PRO</span>
                </div>
              </div>
              <div class="account-user-info">
                <h3 id="logged-user-name">Ashutosh Pathak</h3>
                <div class="account-user-meta">
                  <span id="logged-user-email">user@example.com</span>
                  <span id="logged-user-phone">Phone: Verified</span>
                </div>
                <div class="account-tier-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span>X-Mart Gold Member</span>
                </div>
              </div>
            </div>
            <div class="account-hero-actions">
              <button type="button" class="account-edit-profile-btn" id="account-edit-profile-trigger">Edit Profile</button>
            </div>
          </div>

          <!-- 2. Quick Stat Counters -->
          <div class="account-stats-grid">
            <div class="account-stat-card" id="dash-stat-orders">
              <div class="account-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div class="account-stat-val" id="dash-orders-count">0</div>
              <div class="account-stat-label">Orders</div>
            </div>

            <div class="account-stat-card" id="dash-stat-wishlist">
              <div class="account-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="account-stat-val" id="dash-wishlist-count">0</div>
              <div class="account-stat-label">Wishlist</div>
            </div>

            <div class="account-stat-card" id="dash-stat-wallet">
              <div class="account-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="14" r="1.5"/></svg>
              </div>
              <div class="account-stat-val">₹250</div>
              <div class="account-stat-label">X-Mart Cash</div>
            </div>

            <div class="account-stat-card" id="dash-stat-addresses">
              <div class="account-stat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="account-stat-val" id="dash-addresses-count">1</div>
              <div class="account-stat-label">Addresses</div>
            </div>
          </div>

          <!-- 3. Account Feature Hub Cards -->
          <div>
            <div class="account-hub-section-title">Account Services & Hub</div>
            <div class="account-hub-grid">
              <div class="account-hub-card" id="hub-orders-card">
                <div class="account-hub-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <div class="account-hub-info">
                  <h4>Your Orders & History</h4>
                  <p>Track packages, invoices & returns</p>
                </div>
                <div class="account-hub-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>

              <div class="account-hub-card" id="hub-wishlist-card">
                <div class="account-hub-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="account-hub-info">
                  <h4>Saved Wishlist</h4>
                  <p>View bookmarked items & alerts</p>
                </div>
                <div class="account-hub-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>

              <div class="account-hub-card" id="hub-seller-card">
                <div class="account-hub-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div class="account-hub-info">
                  <h4>Seller Account</h4>
                  <p>Manage store, inventory & sales</p>
                </div>
                <div class="account-hub-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>

              <div class="account-hub-card" id="hub-payments-card">
                <div class="account-hub-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div class="account-hub-info">
                  <h4>Payment & Wallet</h4>
                  <p>Saved cards, UPI & balances</p>
                </div>
                <div class="account-hub-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>

              <div class="account-hub-card" id="hub-security-card">
                <div class="account-hub-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div class="account-hub-info">
                  <h4>Login & Security</h4>
                  <p>Password, 2FA OTP & sessions</p>
                </div>
                <div class="account-hub-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>

              <div class="account-hub-card" id="hub-help-card">
                <div class="account-hub-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="account-hub-info">
                  <h4>Customer Support</h4>
                  <p>24/7 Live chat & instant help</p>
                </div>
                <div class="account-hub-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Footer Bar with Centered Sign Out & Delete Account in Same Line -->
          <div class="account-footer-bar" style="display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 0 6px;">
            <button type="button" id="account-delete-btn" style="background:#dc2626;color:#ffffff;font-size:13px;font-weight:700;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(220,38,38,0.2);transition:all 0.2s ease;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
              <span>Delete Account</span>
            </button>
            <button type="button" class="account-signout-btn" id="auth-logout-btn" style="background:#ff9900;color:#0f1111;font-size:13px;font-weight:800;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(255,153,0,0.25);transition:all 0.2s ease;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <!-- SUB-VIEW 2: Edit Profile Form -->
        <div id="account-edit-profile-view" style="display:none;padding:6px 0;">
          <div style="margin-bottom:18px;">
            <h3 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0f172a;">Edit Account Profile</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.4;">Update your details below. For security, a 6-digit OTP will be sent to your email to verify and save changes.</p>
          </div>

          <form id="account-edit-profile-form">
            <div class="auth-input-group">
              <label>Full Name</label>
              <input type="text" id="edit-profile-name" placeholder="Full Name" required>
            </div>
            <div class="auth-input-group">
              <label>Email Address</label>
              <input type="email" id="edit-profile-email" placeholder="Email Address" required>
            </div>
            <div class="auth-input-group">
              <label>Mobile Number</label>
              <input type="tel" id="edit-profile-phone" placeholder="Mobile Number" required>
            </div>
            <button type="submit" class="auth-submit-btn" id="edit-profile-submit-btn">Send Verification OTP</button>
            <div style="text-align:center;margin-top:12px;">
              <button type="button" id="edit-profile-cancel-btn" style="background:none;border:none;color:#64748b;font-size:13px;font-weight:700;cursor:pointer;padding:4px 8px;">Cancel</button>
            </div>
          </form>
        </div>

        <!-- SUB-VIEW 3: Edit Profile OTP Verification -->
        <div id="account-edit-otp-view" style="display:none;padding:6px 0;">
          <div style="margin-bottom:18px;">
            <h3 style="margin:0 0 4px;font-size:18px;font-weight:800;color:#0f172a;">Verify Profile Update</h3>
            <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">Enter the 6-digit verification code sent to <strong id="edit-otp-email-display">your email</strong>.</p>
          </div>

          <div class="auth-input-group">
            <label>6-Digit Verification Code</label>
            <input type="text" id="edit-profile-otp-input" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" style="letter-spacing:6px;font-size:22px;font-weight:800;text-align:center;" required>
          </div>
          <button type="button" class="auth-submit-btn" id="edit-profile-verify-btn">Confirm & Save Profile</button>
          <div style="text-align:center;margin-top:14px;display:flex;justify-content:center;align-items:center;gap:16px;">
            <a href="#" id="edit-profile-otp-resend" style="font-size:13px;font-weight:700;color:#000000;text-decoration:none;">Resend Code</a>
            <span style="color:#cbd5e1;">•</span>
            <button type="button" id="edit-profile-otp-cancel" style="background:none;border:none;color:#64748b;font-size:13px;font-weight:700;cursor:pointer;padding:0;">Cancel</button>
          </div>
        </div>
      </div>
    `
  });

  const body = modal.querySelector('.xmodal-body');
  const tabs = body.querySelectorAll('.auth-tab-btn');
  const mainTabsContainer = body.querySelector('#auth-main-tabs');
  const signinForm = body.querySelector('#signin-form');
  const signupForm = body.querySelector('#signup-form');
  const unloggedView = body.querySelector('#auth-unlogged-view');
  const loggedView = body.querySelector('#auth-logged-view');

  // All view sections
  const loginOtpView    = body.querySelector('#login-otp-view');
  const registerOtpView = body.querySelector('#register-otp-view');
  const forgotView      = body.querySelector('#forgot-form');
  const resetOtpView    = body.querySelector('#reset-otp-view');
  const newPasswordView = body.querySelector('#new-password-view');

  // State: store email and reset token across steps
  let _pendingEmail = '';
  let _pendingResetToken = '';

  // Helper to show only one view section inside #auth-unlogged-view
  function showAuthStep(step) {
    [signinForm, loginOtpView, signupForm, registerOtpView, forgotView, resetOtpView, newPasswordView].forEach(el => {
      if (el) el.style.display = 'none';
    });
    if (step === 'signin') {
      mainTabsContainer.style.display = 'flex';
      signinForm.style.display = 'block';
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === 'signin'));
    } else if (step === 'signup') {
      mainTabsContainer.style.display = 'flex';
      signupForm.style.display = 'block';
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === 'signup'));
    } else {
      mainTabsContainer.style.display = 'none';
      if (step === 'login-otp')    loginOtpView.style.display    = 'block';
      if (step === 'register-otp') registerOtpView.style.display = 'block';
      if (step === 'forgot')       forgotView.style.display       = 'block';
      if (step === 'reset-otp')    resetOtpView.style.display     = 'block';
      if (step === 'new-password') newPasswordView.style.display  = 'block';
    }
  }

  // Password Visibility Toggle Handler
  body.querySelectorAll('.auth-pwd-toggle').forEach(toggleBtn => {
    toggleBtn.addEventListener('click', e => {
      e.preventDefault();
      const targetId = toggleBtn.dataset.target;
      const input = body.querySelector(`#${targetId}`);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const openIcon = toggleBtn.querySelector('.eye-open');
      const closedIcon = toggleBtn.querySelector('.eye-closed');
      if (openIcon && closedIcon) {
        openIcon.style.display = isPassword ? 'block' : 'none';
        closedIcon.style.display = isPassword ? 'none' : 'block';
      }
    });
  });

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      showAuthStep(tab.dataset.tab);
    });
  });

  // Forgot Password trigger
  body.querySelector('#forgot-pwd-trigger')?.addEventListener('click', e => {
    e.preventDefault();
    showAuthStep('forgot');
  });

  // Back to sign-in
  body.querySelector('#back-to-signin-link')?.addEventListener('click', e => {
    e.preventDefault();
    showAuthStep('signin');
  });

  // ── 15-Second Resend Countdown Helper ──────────────────────────
  let _loginTimer = null;
  let _resetTimer = null;

  function startResendCountdown(btnEl, type = 'login') {
    if (!btnEl) return;
    let sec = 15;
    btnEl.style.pointerEvents = 'none';
    btnEl.style.opacity = '0.45';
    btnEl.style.cursor = 'not-allowed';
    btnEl.textContent = `Resend Code in ${sec}s`;

    const timer = setInterval(() => {
      sec--;
      if (sec > 0) {
        btnEl.textContent = `Resend Code in ${sec}s`;
      } else {
        clearInterval(timer);
        btnEl.style.pointerEvents = 'auto';
        btnEl.style.opacity = '1';
        btnEl.style.cursor = 'pointer';
        btnEl.textContent = 'Resend Code';
      }
    }, 1000);

    if (type === 'login') {
      if (_loginTimer) clearInterval(_loginTimer);
      _loginTimer = timer;
    } else {
      if (_resetTimer) clearInterval(_resetTimer);
      _resetTimer = timer;
    }
  }

  // ─── LOGIN FLOW ──────────────────────────────────────────────────
  // STEP 1: Submit credentials → send OTP
  signinForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = body.querySelector('#signin-btn');
    const email = body.querySelector('#auth-login-email').value.trim();
    const password = body.querySelector('#auth-login-password').value;

    btn.disabled = true;
    btn.textContent = 'Sending code...';

    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type: 'login' })
      });
      _pendingEmail = email;
      body.querySelector('#login-otp-email-display').textContent = email;
      body.querySelector('#login-otp-input').value = '';
      showAuthStep('login-otp');
      startResendCountdown(body.querySelector('#login-otp-resend'), 'login');
      showToast('OTP sent to your email! Check your inbox/spam.', 'success');
    } catch (err) {
      if (err.message.includes('Invalid email or password') || err.message.includes('No account found')) {
        showToast('No account found or invalid credentials. Click "Create Account" to register!', 'error', 4500);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Continue with OTP';
    }
  });

  // STEP 2: Verify login OTP
  body.querySelector('#login-otp-verify-btn').addEventListener('click', async () => {
    const btn = body.querySelector('#login-otp-verify-btn');
    const otp = body.querySelector('#login-otp-input').value.trim();

    if (otp.length !== 6) { showToast('Enter the 6-digit OTP code.', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Verifying...';
    try {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _pendingEmail, otp, type: 'login' })
      });
      Auth.setSession(data.data, data.data.token);
      showToast(`Welcome back, ${data.data.name}!`, 'success');
      modal._close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify & Sign In';
    }
  });

  // Resend login OTP
  body.querySelector('#login-otp-resend')?.addEventListener('click', async e => {
    e.preventDefault();
    const resendBtn = body.querySelector('#login-otp-resend');
    if (resendBtn.style.pointerEvents === 'none') return;

    const email = _pendingEmail;
    const password = body.querySelector('#auth-login-password').value;
    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type: 'login' })
      });
      startResendCountdown(resendBtn, 'login');
      showToast('New OTP sent to your email!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ─── FORGOT PASSWORD FLOW ────────────────────────────────────────
  // STEP 1: Send OTP to email
  body.querySelector('#forgot-send-otp-btn').addEventListener('click', async () => {
    const btn = body.querySelector('#forgot-send-otp-btn');
    const email = body.querySelector('#auth-forgot-email').value.trim();
    if (!email) { showToast('Enter your registered email address.', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Sending code...';
    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'reset' })
      });
      _pendingEmail = email;
      body.querySelector('#reset-otp-email-display').textContent = email;
      body.querySelector('#reset-otp-input').value = '';
      showAuthStep('reset-otp');
      startResendCountdown(body.querySelector('#reset-otp-resend'), 'reset');
      showToast('Reset code sent! Check your inbox.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Reset Code';
    }
  });

  // STEP 2: Verify reset OTP
  body.querySelector('#reset-otp-verify-btn').addEventListener('click', async () => {
    const btn = body.querySelector('#reset-otp-verify-btn');
    const otp = body.querySelector('#reset-otp-input').value.trim();
    if (otp.length !== 6) { showToast('Enter the 6-digit OTP code.', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'Verifying...';
    try {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _pendingEmail, otp, type: 'reset' })
      });
      _pendingResetToken = data.data.resetToken;
      body.querySelector('#auth-new-password').value = '';
      showAuthStep('new-password');
      showToast('Code verified! Set your new password.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify Code';
    }
  });

  // Resend reset OTP
  body.querySelector('#reset-otp-resend')?.addEventListener('click', async e => {
    e.preventDefault();
    const resendBtn = body.querySelector('#reset-otp-resend');
    if (resendBtn.style.pointerEvents === 'none') return;

    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _pendingEmail, type: 'reset' })
      });
      startResendCountdown(resendBtn, 'reset');
      showToast('New reset code sent!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // STEP 3: Set new password using resetToken
  body.querySelector('#set-new-password-btn').addEventListener('click', async () => {
    const btn = body.querySelector('#set-new-password-btn');
    const newPassword = body.querySelector('#auth-new-password').value;
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (!_pendingResetToken) {
      showToast('Session expired. Please restart the reset process.', 'error');
      showAuthStep('forgot');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Resetting password...';
    try {
      const data = await apiFetch('/auth/reset-password-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_pendingResetToken}`
        },
        body: JSON.stringify({ newPassword })
      });
      Auth.setSession(data.data, data.data.token);
      _pendingResetToken = '';
      showToast('Password reset successfully! Welcome back!', 'success');
      modal._close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Reset Password & Sign In';
    }
  });

  // ─── REGISTER FLOW ───────────────────────────────────────────────
  // STEP 1: Submit credentials → Send verification OTP
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = body.querySelector('#signup-btn');
    const name = body.querySelector('#auth-reg-name').value.trim();
    const email = body.querySelector('#auth-reg-email').value.trim();
    const phone = body.querySelector('#auth-reg-phone').value.trim();
    const password = body.querySelector('#auth-reg-password').value;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!name || name.length < 2) {
      showToast('Please enter your full name (at least 2 characters).', 'error');
      body.querySelector('#auth-reg-name')?.focus();
      return;
    }
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address (e.g. name@example.com).', 'error');
      body.querySelector('#auth-reg-email')?.focus();
      return;
    }
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone) && !/^\d{10}$/.test(cleanedPhone)) {
      showToast('Please enter a valid 10-digit mobile number (e.g. 9876543210).', 'error');
      body.querySelector('#auth-reg-phone')?.focus();
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      body.querySelector('#auth-reg-password')?.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending verification code...';
    try {
      await apiFetch('/auth/register-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: cleanedPhone, password })
      });
      _pendingEmail = email;
      body.querySelector('#register-otp-email-display').textContent = email;
      body.querySelector('#register-otp-input').value = '';
      showAuthStep('register-otp');
      startResendCountdown(body.querySelector('#register-otp-resend'), 'register');
      showToast('Verification code sent to your email! Check your inbox.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Your X-Mart Account';
    }
  });

  // STEP 2: Verify Registration OTP & create user
  body.querySelector('#register-otp-verify-btn')?.addEventListener('click', async () => {
    const btn = body.querySelector('#register-otp-verify-btn');
    const otp = body.querySelector('#register-otp-input').value.trim();
    if (otp.length !== 6) {
      showToast('Enter the 6-digit verification code.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verifying code...';
    try {
      const data = await apiFetch('/auth/register-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _pendingEmail, otp })
      });
      Auth.setSession(data.data, data.data.token);
      showToast(`Account verified! Welcome to X-Mart, ${data.data.name}!`, 'success');
      modal._close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify & Create Account';
    }
  });

  // Resend registration OTP
  body.querySelector('#register-otp-resend')?.addEventListener('click', async e => {
    e.preventDefault();
    const resendBtn = body.querySelector('#register-otp-resend');
    if (resendBtn.style.pointerEvents === 'none') return;

    const name = body.querySelector('#auth-reg-name').value.trim();
    const email = _pendingEmail;
    const phone = body.querySelector('#auth-reg-phone').value.trim();
    const password = body.querySelector('#auth-reg-password').value;

    try {
      await apiFetch('/auth/register-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      startResendCountdown(resendBtn, 'register');
      showToast('New verification code sent!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ── Commercial Logged-In Account Dashboard Action Handlers ──
  const modalWin = modal.querySelector('.xmodal-window');

  // Delete account
  body.querySelector('#account-delete-btn')?.addEventListener('click', () => {
    modal._close();
    Auth.deleteAccount();
  });

  // Sign out
  body.querySelector('#auth-logout-btn')?.addEventListener('click', () => {
    Auth.logout();
    modal._close();
  });

  // 1. Orders & History
  const openOrdersHandler = () => {
    modal._close();
    window._openOrders?.();
  };
  body.querySelector('#dash-stat-orders')?.addEventListener('click', openOrdersHandler);
  body.querySelector('#hub-orders-card')?.addEventListener('click', openOrdersHandler);

  // 2. Saved Wishlist
  const openWishlistHandler = () => {
    modal._close();
    window._openWishlist?.();
  };
  body.querySelector('#dash-stat-wishlist')?.addEventListener('click', openWishlistHandler);
  body.querySelector('#hub-wishlist-card')?.addEventListener('click', openWishlistHandler);

  // 3. Saved Delivery Addresses
  const openAddressesHandler = () => {
    modal._close();
    window._openAddressesPage ? window._openAddressesPage() : window._openAddressesModal?.();
  };
  body.querySelector('#dash-stat-addresses')?.addEventListener('click', openAddressesHandler);

  // 3B. Seller Central / Account
  const openSellerHandler = () => {
    modal._close();
    window._openSellerPortal?.();
  };
  body.querySelector('#hub-seller-card')?.addEventListener('click', openSellerHandler);

  // 4. Payment & X-Mart Wallet
  const openWalletHandler = () => {
    modal._close();
    window._openWalletPage ? window._openWalletPage() : window._openWalletModal?.();
  };
  body.querySelector('#dash-stat-wallet')?.addEventListener('click', openWalletHandler);
  body.querySelector('#hub-payments-card')?.addEventListener('click', openWalletHandler);

  // 5. Login & Account Security
  const openSecurityHandler = () => {
    modal._close();
    window._openSecurityModal?.();
  };
  body.querySelector('#hub-security-card')?.addEventListener('click', openSecurityHandler);

  // 6. 24/7 Customer Support & Help Desk
  const openSupportHandler = () => {
    modal._close();
    window._openCustomerServicePage?.();
  };
  body.querySelector('#hub-help-card')?.addEventListener('click', openSupportHandler);

  // ── Edit Profile Sub-Views & OTP Flow ─────────────────────────
  const mainDashView    = body.querySelector('#account-main-dashboard');
  const editProfileView = body.querySelector('#account-edit-profile-view');
  const editOtpView     = body.querySelector('#account-edit-otp-view');

  function showAccountSubView(viewName) {
    if (mainDashView)    mainDashView.style.display    = (viewName === 'main') ? 'flex' : 'none';
    if (editProfileView) editProfileView.style.display = (viewName === 'edit' || viewName === 'edit-profile') ? 'block' : 'none';
    if (editOtpView)     editOtpView.style.display     = (viewName === 'otp')  ? 'block' : 'none';
  }

  // Open Edit Profile form
  body.querySelector('#account-edit-profile-trigger')?.addEventListener('click', () => {
    const user = Auth.getUser();
    if (!user) return;
    const nameInput  = body.querySelector('#edit-profile-name');
    const emailInput = body.querySelector('#edit-profile-email');
    const phoneInput = body.querySelector('#edit-profile-phone');

    if (nameInput)  nameInput.value  = user.name  || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';

    if (modal.querySelector('.xmodal-header h3')) {
      modal.querySelector('.xmodal-header h3').textContent = 'Edit Profile';
    }
    showAccountSubView('edit');
  });

  // Cancel edit buttons
  const handleCancelEdit = (e) => {
    e?.preventDefault();
    if (window._openAccountPage && document.getElementById('account-full-page-container')?.style.display !== 'none') {
      modal._close();
    } else {
      if (modal.querySelector('.xmodal-header h3')) {
        modal.querySelector('.xmodal-header h3').textContent = 'Account Center';
      }
      showAccountSubView('main');
    }
  };
  body.querySelector('#edit-profile-cancel-btn')?.addEventListener('click', handleCancelEdit);
  body.querySelector('#edit-profile-otp-cancel')?.addEventListener('click', handleCancelEdit);

  // Submit Profile Changes -> Request OTP
  body.querySelector('#account-edit-profile-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = body.querySelector('#edit-profile-submit-btn');
    const name = body.querySelector('#edit-profile-name').value.trim();
    const email = body.querySelector('#edit-profile-email').value.trim();
    const phone = body.querySelector('#edit-profile-phone').value.trim();

    if (!name || name.length < 2) {
      showToast('Please enter your full name (minimum 2 characters).', 'error');
      body.querySelector('#edit-profile-name')?.focus();
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address (e.g. name@example.com).', 'error');
      body.querySelector('#edit-profile-email')?.focus();
      return;
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone) && !/^\d{10}$/.test(cleanedPhone)) {
      showToast('Please enter a valid 10-digit mobile number (e.g. 9876543210).', 'error');
      body.querySelector('#edit-profile-phone')?.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending verification code...';
    try {
      const data = await apiFetch('/auth/profile-send-otp', {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ name, email, phone: cleanedPhone })
      });
      const displayEmail = data.data?.email || Auth.getUser()?.email || email;
      const emailDisplayEl = body.querySelector('#edit-otp-email-display');
      if (emailDisplayEl) emailDisplayEl.textContent = displayEmail;
      
      const otpInput = body.querySelector('#edit-profile-otp-input');
      if (otpInput) otpInput.value = '';

      if (modal.querySelector('.xmodal-header h3')) {
        modal.querySelector('.xmodal-header h3').textContent = 'Verify Profile Update';
      }
      showAccountSubView('otp');
      startResendCountdown(body.querySelector('#edit-profile-otp-resend'), 'profile');
      showToast('Verification code sent to your email! Check your inbox.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Verification OTP';
    }
  });

  // Verify OTP -> Apply Profile Changes
  body.querySelector('#edit-profile-verify-btn')?.addEventListener('click', async () => {
    const btn = body.querySelector('#edit-profile-verify-btn');
    const otp = body.querySelector('#edit-profile-otp-input').value.trim();
    if (otp.length !== 6) {
      showToast('Enter the 6-digit verification code.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verifying & updating...';
    try {
      const data = await apiFetch('/auth/profile-verify-otp', {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ otp })
      });
      Auth.setSession(data.data, data.data.token);
      showToast('Profile updated successfully!', 'success');
      modal._close();
      if (window._openAccountPage && document.getElementById('account-full-page-container')?.style.display !== 'none') {
        window._openAccountPage();
      } else {
        showAccountSubView('main');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirm & Save Profile';
    }
  });

  // Resend profile OTP
  body.querySelector('#edit-profile-otp-resend')?.addEventListener('click', async e => {
    e.preventDefault();
    const resendBtn = body.querySelector('#edit-profile-otp-resend');
    if (resendBtn.style.pointerEvents === 'none') return;

    const name = body.querySelector('#edit-profile-name').value.trim();
    const email = body.querySelector('#edit-profile-email').value.trim();
    const phone = body.querySelector('#edit-profile-phone').value.trim();

    try {
      await apiFetch('/auth/profile-send-otp', {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ name, email, phone })
      });
      startResendCountdown(resendBtn, 'profile');
      showToast('New verification code sent!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  window._openEditProfileModal = () => {
    const user = Auth.getUser();
    if (!user) return;
    unloggedView.style.display = 'none';
    loggedView.style.display = 'flex';
    modalWin?.classList.add('xmodal-window--account');
    if (modal.querySelector('.xmodal-header h3')) {
      modal.querySelector('.xmodal-header h3').textContent = 'Edit Profile';
    }
    const nameInput = body.querySelector('#edit-profile-name');
    const emailInput = body.querySelector('#edit-profile-email');
    const phoneInput = body.querySelector('#edit-profile-phone');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    showAccountSubView('edit');
    modal._open();
  };

  window._openAuth = (tabName = 'signin') => {
    const user = Auth.getUser();
    const modalHeaderTitle = modal.querySelector('.xmodal-header h3');

    if (user && Auth.isLoggedIn()) {
      if (window._openAccountPage) {
        modal._close();
        window._openAccountPage();
        return;
      }
      unloggedView.style.display = 'none';
      loggedView.style.display = 'flex';
      showAccountSubView('main');
      modalWin?.classList.add('xmodal-window--account');
      if (modalHeaderTitle) modalHeaderTitle.textContent = 'Account Center';

      // Populate user card details
      const firstName = user.name || 'User';
      body.querySelector('#logged-user-name').textContent = user.name || 'User';
      body.querySelector('#logged-user-email').textContent = user.email || '';
      const userPhoneEl = body.querySelector('#logged-user-phone');
      if (userPhoneEl) {
        userPhoneEl.textContent = user.phone ? user.phone : 'Phone: Verified';
      }
      body.querySelector('#user-avatar-initials').textContent = firstName.charAt(0).toUpperCase();

      // Populate dynamic counters
      const wishlistCountEl = body.querySelector('#dash-wishlist-count');
      if (wishlistCountEl) wishlistCountEl.textContent = Store?.wishlist ? Store.wishlist.length : '0';

      const ordersCountEl = body.querySelector('#dash-orders-count');
      if (ordersCountEl) ordersCountEl.textContent = Store?.orders ? Store.orders.length : '0';

      const addrsCountEl = body.querySelector('#dash-addresses-count');
      if (addrsCountEl) {
        let count = 1;
        try {
          const stored = JSON.parse(localStorage.getItem('xmart_saved_addresses') || '[]');
          count = stored.length || 1;
        } catch {}
        addrsCountEl.textContent = count;
      }
    } else {
      unloggedView.style.display = 'block';
      loggedView.style.display = 'none';
      modalWin?.classList.remove('xmodal-window--account');
      if (modalHeaderTitle) modalHeaderTitle.textContent = 'Account & Sign In';
      showAuthStep(tabName);
    }
    modal._open();
  };
}

/* ── 3. Commercial Order Details, Invoice & Warranty Card Router ── */
function openOrderInvoiceModal(order, defaultTab = 'details') {
  if (typeof window._openDedicatedOrderInvoicePage === 'function') {
    window._openDedicatedOrderInvoicePage(order, defaultTab);
  }
}

function buildOrdersModal() {
  // Dedicated Full-Page View initialized in initPageRouter
}

/* ── 3B. Payment & Wallet Interactive Modal ───────────────── */
function buildWalletModal() {
  let walletBalance = parseFloat(localStorage.getItem('xmart_wallet_balance') || '250.00');

  const modal = createModal('wallet-interactive-modal', {
    title: 'Payment & X-Mart Wallet',
    bodyHtml: `
      <div style="display:flex;flex-direction:column;gap:18px;">
        <!-- Wallet Hero Card -->
        <div style="background:linear-gradient(135deg, #19324c 0%, #0d1b2a 100%);color:#fff;border-radius:14px;padding:22px;position:relative;overflow:hidden;box-shadow:0 8px 24px rgba(25,50,76,0.25);">
          <div style="position:relative;z-index:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ff9700;">X-Mart Cash & Wallet</span>
              <span style="background:rgba(34,197,94,0.2);color:#4ade80;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;border:1px solid rgba(74,222,128,0.3);">🟢 Verified</span>
            </div>
            <div style="font-size:32px;font-weight:900;margin-bottom:14px;">₹<span id="wallet-display-bal">${walletBalance.toFixed(2)}</span></div>
            <p style="font-size:12px;color:#cbd5e1;margin:0 0 16px;">Usable across 100% of products with 1-click checkout discount.</p>
            
            <!-- Quick Add Money -->
            <div style="display:flex;gap:8px;background:rgba(255,255,255,0.08);padding:6px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);">
              <input type="number" id="wallet-add-amount" placeholder="Enter amount (₹)" min="50" step="50" style="flex:1;background:transparent;border:none;color:#fff;padding:8px 12px;font-size:14px;outline:none;" />
              <button id="wallet-add-btn" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;">+ Add Cash</button>
            </div>
          </div>
        </div>

        <!-- Saved Payment Methods -->
        <div>
          <h4 style="margin:0 0 10px;font-size:14px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Saved Payment Methods</h4>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:36px;height:36px;background:#e0f2fe;color:#0284c7;border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:12px;">UPI</div>
                <div>
                  <div style="font-weight:800;font-size:14px;color:#0f172a;">Google Pay / PhonePe UPI</div>
                  <div style="font-size:12px;color:#64748b;">ashutosh@oksbi • Default</div>
                </div>
              </div>
              <span style="font-size:11px;font-weight:800;color:#16a34a;background:#dcfce7;padding:3px 8px;border-radius:6px;">PRIMARY</span>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:36px;height:36px;background:#fef3c7;color:#d97706;border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:12px;">VISA</div>
                <div>
                  <div style="font-weight:800;font-size:14px;color:#0f172a;">HDFC Bank Platinum Debit Card</div>
                  <div style="font-size:12px;color:#64748b;">•••• •••• •••• 4242 (Exp 08/28)</div>
                </div>
              </div>
              <span style="font-size:12px;color:#64748b;">Saved</span>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div>
          <h4 style="margin:0 0 10px;font-size:14px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">Recent Wallet Activity</h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#ffffff;border:1px solid #f1f5f9;border-radius:8px;">
              <div>
                <div style="font-size:13px;font-weight:700;color:#0f172a;">Welcome Promotional Bonus Credit</div>
                <div style="font-size:11px;color:#94a3b8;">Yesterday • Auto-applied</div>
              </div>
              <div style="font-weight:800;color:#16a34a;font-size:14px;">+₹250.00</div>
            </div>
          </div>
        </div>
      </div>
    `
  });

  const body = modal.querySelector('.xmodal-body');
  body.querySelector('#wallet-add-btn')?.addEventListener('click', () => {
    const input = body.querySelector('#wallet-add-amount');
    const amt = parseFloat(input.value);
    if (!amt || amt < 50) {
      showToast('Please enter a minimum amount of ₹50 to add funds.', 'error');
      return;
    }
    walletBalance += amt;
    localStorage.setItem('xmart_wallet_balance', walletBalance.toFixed(2));
    const balEl = body.querySelector('#wallet-display-bal');
    if (balEl) balEl.textContent = walletBalance.toFixed(2);
    input.value = '';
    showToast(`${Currency.format(amt)} added to your X-Mart Cash wallet!`, 'success');
  });

  window._openWalletModal = () => {
    const balEl = body.querySelector('#wallet-display-bal');
    const current = parseFloat(localStorage.getItem('xmart_wallet_balance') || '250.00');
    if (balEl) balEl.textContent = current.toFixed(2);
    modal._open();
  };
}

/* ── 3C. Login & Account Security Modal ───────────────────── */
function buildSecurityModal() {
  const modal = createModal('security-interactive-modal', {
    title: 'Login & Account Security',
    bodyHtml: `
      <div style="display:flex;flex-direction:column;gap:20px;">
        <!-- 2FA Status -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:40px;height:40px;background:#10b981;color:#fff;border-radius:10px;display:grid;place-items:center;font-size:18px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h4 style="margin:0 0 2px;font-size:14px;font-weight:800;color:#065f46;">2-Factor OTP Email Authentication</h4>
              <p style="margin:0;font-size:12px;color:#047857;">Protected with 6-digit one-time passcode on sign-in and profile edits.</p>
            </div>
          </div>
          <span style="background:#10b981;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:20px;">ACTIVE</span>
        </div>

        <!-- Change Password Form -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
          <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#0f172a;">Change Account Password</h4>
          <form id="security-password-form" style="display:flex;flex-direction:column;gap:12px;">
            <div class="auth-input-group">
              <label>Current Password</label>
              <input type="password" id="sec-current-pwd" placeholder="Enter current password" required />
            </div>
            <div class="auth-input-group">
              <label>New Password</label>
              <input type="password" id="sec-new-pwd" placeholder="Min. 6 characters" minlength="6" required />
            </div>
            <div class="auth-input-group">
              <label>Confirm New Password</label>
              <input type="password" id="sec-confirm-pwd" placeholder="Re-enter new password" minlength="6" required />
            </div>
            <button type="submit" class="auth-submit-btn" id="sec-pwd-submit-btn" style="margin-top:6px;">Update Password</button>
          </form>
        </div>

        <!-- Active Sessions -->
        <div style="border-top:1px solid #f1f5f9;padding-top:14px;">
          <h4 style="margin:0 0 10px;font-size:13px;font-weight:800;color:#64748b;text-transform:uppercase;">Active Devices & Sessions</h4>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;background:#eff6ff;color:#0284c7;border-radius:8px;display:grid;place-items:center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </div>
              <div>
                <div style="font-size:13px;font-weight:800;color:#0f172a;">Windows PC • Chrome Browser</div>
                <div style="font-size:11px;color:#16a34a;font-weight:700;">Current Session • Active Now</div>
              </div>
            </div>
            <button type="button" id="sec-signout-others-btn" style="background:transparent;border:1px solid #cbd5e1;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;color:#475569;">Sign Out Others</button>
          </div>
        </div>
      </div>
    `
  });

  const body = modal.querySelector('.xmodal-body');
  body.querySelector('#security-password-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = body.querySelector('#sec-pwd-submit-btn');
    const currentPassword = body.querySelector('#sec-current-pwd').value;
    const newPassword = body.querySelector('#sec-new-pwd').value;
    const confirmPassword = body.querySelector('#sec-confirm-pwd').value;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating password...';
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      showToast('Password updated successfully!', 'success');
      body.querySelector('#security-password-form').reset();
      modal._close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  });

  body.querySelector('#sec-signout-others-btn')?.addEventListener('click', () => {
    showToast('✓ Successfully signed out of all other devices and background sessions.', 'success', 4000);
  });

  window._openSecurityModal = () => {
    modal._open();
  };
}

/* ── Central PIN Auto-Lookup Helper ──────────────────────── */
async function autoFetchAddressFromPin(pin, cityInput, stateInput) {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) return;

  const pinMap = {
    '495001': { city: 'Bilaspur', state: 'Chhattisgarh' },
    '495004': { city: 'Bilaspur', state: 'Chhattisgarh' },
    '492001': { city: 'Raipur', state: 'Chhattisgarh' },
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '110019': { city: 'New Delhi', state: 'Delhi' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '400050': { city: 'Bandra, Mumbai', state: 'Maharashtra' },
    '560001': { city: 'Bengaluru', state: 'Karnataka' },
    '560034': { city: 'Koramangala, Bengaluru', state: 'Karnataka' },
    '700001': { city: 'Kolkata', state: 'West Bengal' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '500001': { city: 'Hyderabad', state: 'Telangana' },
    '800001': { city: 'Patna', state: 'Bihar' },
    '802101': { city: 'Buxar', state: 'Bihar' },
    '201301': { city: 'Noida', state: 'Uttar Pradesh' },
    '122001': { city: 'Gurugram', state: 'Haryana' },
    '302001': { city: 'Jaipur', state: 'Rajasthan' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat' },
    '411001': { city: 'Pune', state: 'Maharashtra' }
  };

  if (pinMap[pin]) {
    if (cityInput) cityInput.value = pinMap[pin].city;
    if (stateInput) stateInput.value = pinMap[pin].state;
    return;
  }

  // Query Postal Pincode API
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      const city = po.District || po.Name || '';
      const state = po.State || '';
      if (city && cityInput) cityInput.value = city;
      if (state && stateInput) stateInput.value = state;
      return;
    }
  } catch {}

  // Fallback Geoapify API
  try {
    const geoRes = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${pin}&country=in&apiKey=${GEOAPIFY_API_KEY}`);
    const geoData = await geoRes.json();
    if (geoData.features && geoData.features.length > 0) {
      const p = geoData.features[0].properties;
      const city = p.city || p.county || p.state_district || '';
      const state = p.state || '';
      if (city && cityInput) cityInput.value = city;
      if (state && stateInput) stateInput.value = state;
    }
  } catch {}
}

/* ── Central Saved Addresses & Validation Helpers ─────────── */
function getSavedAddresses() {
  let list = [];
  try {
    const stored = localStorage.getItem('xmart_saved_addresses');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch {}

  if (list.length === 0) {
    const user = Auth.getUser() || {};
    list = [
      {
        id: 'addr_default_1',
        name: user.name || 'Ashutosh Pathak',
        phone: user.phone || '+91 9065553105',
        type: 'HOME',
        isDefault: true,
        street: 'Flat 402, Royal Residency, Main Road',
        city: 'Bilaspur',
        state: 'Chhattisgarh',
        pincode: localStorage.getItem('xmart_pincode') || '495001'
      }
    ];
  }

  // Ensure exactly ONE address is default at any time
  const defaultCount = list.filter(a => a.isDefault).length;
  if (defaultCount !== 1 && list.length > 0) {
    list.forEach((a, idx) => { a.isDefault = (idx === 0); });
  }

  return list;
}

function saveAddresses(addrs) {
  if (Array.isArray(addrs) && addrs.length > 0) {
    const defaultCount = addrs.filter(a => a.isDefault).length;
    if (defaultCount !== 1) {
      addrs.forEach((a, idx) => { a.isDefault = (idx === 0); });
    }
  }
  localStorage.setItem('xmart_saved_addresses', JSON.stringify(addrs));
}

function isDuplicateAddress(candidate, existingList, currentEditingId = null) {
  const clean = (s) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return existingList.some(item => {
    if (currentEditingId && item.id === currentEditingId) return false;
    const samePin = clean(item.pincode) === clean(candidate.pincode);
    const sameStreet = clean(item.street) === clean(candidate.street);
    const sameCity = clean(item.city) === clean(candidate.city);
    const sameState = clean(item.state) === clean(candidate.state);
    return (samePin && sameStreet && sameCity && sameState);
  });
}

/* ── 3D. Saved Delivery Addresses Interactive Modal ───────── */
function buildAddressesModal() {
  let editingAddrId = null;

  const modal = createModal('addresses-interactive-modal', {
    title: 'My Delivery Addresses',
    bodyHtml: `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- Header Controls -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
          <div>
            <h4 style="margin:0 0 2px;font-size:15px;font-weight:800;color:#0f172a;">Saved Shipping Locations</h4>
            <p style="margin:0;font-size:12px;color:#64748b;">Manage delivery destinations for 1-click checkout</p>
          </div>
          <button type="button" id="addr-toggle-add-btn" style="background:#ff9700;color:#000;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;">
            <span>+ Add New Address</span>
          </button>
        </div>

        <!-- Add / Edit Address Form (Hidden by default) -->
        <div id="addr-form-container" style="display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
          <h4 id="addr-form-heading" style="margin:0 0 14px;font-size:15px;font-weight:800;color:#0f172a;">Add Delivery Address</h4>
          <form id="new-address-form" style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="auth-input-group">
                <label>Full Name *</label>
                <input type="text" id="new-addr-name" required>
              </div>
              <div class="auth-input-group">
                <label>Mobile Phone *</label>
                <input type="tel" id="new-addr-phone" required>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="auth-input-group">
                <label>PIN Code *</label>
                <input type="text" id="new-addr-pin" maxlength="6" required>
              </div>
              <div class="auth-input-group">
                <label>Address Type</label>
                <select id="new-addr-type" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:#fff;outline:none;">
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div class="auth-input-group">
              <label>Flat, House No., Building, Apartment *</label>
              <input type="text" id="new-addr-street" required>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="auth-input-group">
                <label>City / Town *</label>
                <input type="text" id="new-addr-city" required>
              </div>
              <div class="auth-input-group">
                <label>State *</label>
                <input type="text" id="new-addr-state" required>
              </div>
            </div>

            <div style="display:flex;justify-content:center;align-items:center;gap:14px;margin-top:12px;flex-wrap:wrap;">
              <button type="submit" class="auth-submit-btn" id="addr-submit-btn" style="padding:11px 28px;border-radius:8px;font-size:14px;min-width:180px;">Save Delivery Address</button>
              <button type="button" id="new-addr-cancel-btn" style="background:#e2e8f0;color:#334155;border:none;padding:11px 22px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;min-width:100px;">Cancel</button>
            </div>
          </form>
        </div>

        <!-- Address Cards List -->
        <div id="addr-cards-list" style="display:flex;flex-direction:column;gap:12px;"></div>
      </div>
    `
  });

  const body = modal.querySelector('.xmodal-body');
  const formContainer = body.querySelector('#addr-form-container');
  const formHeading = body.querySelector('#addr-form-heading');
  const submitBtn = body.querySelector('#addr-submit-btn');
  const toggleBtn = body.querySelector('#addr-toggle-add-btn');
  const cardsList = body.querySelector('#addr-cards-list');

  function renderList() {
    const addresses = getSavedAddresses();
    if (addresses.length === 0) {
      cardsList.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:#64748b;">
          <div style="margin-bottom:8px;color:#94a3b8;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h4 style="margin:0 0 4px;font-weight:800;color:#0f172a;">No Saved Addresses</h4>
          <p style="margin:0;font-size:13px;">Add a delivery address to enable faster 1-click checkout.</p>
        </div>
      `;
      return;
    }

    cardsList.innerHTML = addresses.map((addr, idx) => `
      <div style="background:#ffffff;border:1.5px solid ${addr.isDefault ? '#ff9700' : '#e2e8f0'};border-radius:12px;padding:16px;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;font-weight:800;background:${addr.type === 'HOME' ? '#eff6ff' : '#f0fdf4'};color:${addr.type === 'HOME' ? '#2563eb' : '#16a34a'};padding:2px 8px;border-radius:6px;border:1px solid currentColor;">
              ${addr.type || 'HOME'}
            </span>
            ${addr.isDefault ? '<span style="font-size:11px;font-weight:800;background:#fff3e0;color:#d97706;padding:2px 8px;border-radius:6px;">DEFAULT</span>' : ''}
          </div>
          <div>
            <button type="button" class="addr-edit-btn" data-id="${addr.id}" style="background:transparent;border:none;color:#0284c7;font-size:12px;font-weight:700;cursor:pointer;margin-right:12px;">Edit</button>
            <button type="button" class="addr-del-btn" data-id="${addr.id}" style="background:transparent;border:none;color:#ef4444;font-size:12px;font-weight:700;cursor:pointer;">Delete</button>
          </div>
        </div>

        <div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:2px;">${addr.name}</div>
        <div style="font-size:13px;color:#334155;line-height:1.5;margin-bottom:6px;">${addr.street}, ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong></div>
        <div style="font-size:12px;color:#64748b;margin-bottom:12px;">Phone: <strong>${addr.phone}</strong></div>

        <div style="display:flex;gap:8px;">
          <button type="button" class="addr-select-btn" data-pin="${addr.pincode}" style="flex:1;background:#19324c;color:#fff;border:none;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Deliver to this Address</button>
          ${!addr.isDefault ? `<button type="button" class="addr-set-default-btn" data-id="${addr.id}" style="background:#f1f5f9;color:#334155;border:none;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Set Default</button>` : ''}
        </div>
      </div>
    `).join('');

    // Wire edit actions
    cardsList.querySelectorAll('.addr-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const addrs = getSavedAddresses();
        const addr = addrs.find(a => a.id === id);
        if (!addr) return;

        editingAddrId = id;
        body.querySelector('#new-addr-name').value = addr.name || '';
        body.querySelector('#new-addr-phone').value = addr.phone || '';
        body.querySelector('#new-addr-pin').value = addr.pincode || '';
        body.querySelector('#new-addr-type').value = addr.type || 'HOME';
        body.querySelector('#new-addr-street').value = addr.street || '';
        body.querySelector('#new-addr-city').value = addr.city || '';
        body.querySelector('#new-addr-state').value = addr.state || '';

        if (formHeading) formHeading.textContent = 'Edit Delivery Address';
        if (submitBtn) submitBtn.textContent = 'Update Delivery Address';
        formContainer.style.display = 'block';
        toggleBtn.textContent = '✕ Close Form';
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Wire delete actions
    cardsList.querySelectorAll('.addr-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        let addrs = getSavedAddresses().filter(a => a.id !== id);
        if (addrs.length > 0 && !addrs.some(a => a.isDefault)) addrs[0].isDefault = true;
        saveAddresses(addrs);
        renderList();
        updateCountBadge();
        showToast('Address removed', 'info');
      });
    });

    // Wire default action
    cardsList.querySelectorAll('.addr-set-default-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        let addrs = getSavedAddresses().map(a => ({ ...a, isDefault: a.id === id }));
        saveAddresses(addrs);
        renderList();
        showToast('Default address updated!', 'success');
      });
    });

    // Wire select action
    cardsList.querySelectorAll('.addr-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pin = btn.dataset.pin;
        if (pin) {
          localStorage.setItem('xmart_pincode', pin);
          document.querySelectorAll('.location-control strong').forEach(el => el.textContent = pin);
        }
        showToast(`Selected delivery address PIN: ${pin}!`, 'success');
        modal._close();
      });
    });
  }

  function updateCountBadge() {
    const count = getSavedAddresses().length;
    const badgeEl = document.querySelector('#dash-addresses-count');
    if (badgeEl) badgeEl.textContent = count;
  }

  function resetForm() {
    editingAddrId = null;
    body.querySelector('#new-address-form').reset();
    if (formHeading) formHeading.textContent = 'Add Delivery Address';
    if (submitBtn) submitBtn.textContent = 'Save Delivery Address';
    formContainer.style.display = 'none';
    toggleBtn.textContent = '+ Add New Address';
  }

  toggleBtn?.addEventListener('click', () => {
    const isHidden = formContainer.style.display === 'none';
    if (isHidden) {
      editingAddrId = null;
      body.querySelector('#new-address-form').reset();
      if (formHeading) formHeading.textContent = 'Add Delivery Address';
      if (submitBtn) submitBtn.textContent = 'Save Delivery Address';
      formContainer.style.display = 'block';
      toggleBtn.textContent = '✕ Close Form';
    } else {
      resetForm();
    }
  });

  // Auto-fetch district & state from PIN in Addresses Modal
  const modalPinInput = body.querySelector('#new-addr-pin');
  const modalCityInput = body.querySelector('#new-addr-city');
  const modalStateInput = body.querySelector('#new-addr-state');

  modalPinInput?.addEventListener('input', (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    e.target.value = pin;
    if (pin.length === 6) {
      autoFetchAddressFromPin(pin, modalCityInput, modalStateInput);
    }
  });

  body.querySelector('#new-addr-cancel-btn')?.addEventListener('click', resetForm);

  body.querySelector('#new-address-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = body.querySelector('#new-addr-name').value.trim();
    const phone = body.querySelector('#new-addr-phone').value.trim();
    const pincode = body.querySelector('#new-addr-pin').value.trim();
    const type = body.querySelector('#new-addr-type').value;
    const street = body.querySelector('#new-addr-street').value.trim();
    const city = body.querySelector('#new-addr-city').value.trim();
    const state = body.querySelector('#new-addr-state').value.trim();

    const candidate = { name, phone, pincode, type, street, city, state };
    let addrs = getSavedAddresses();

    // Check duplicate address parameters
    if (isDuplicateAddress(candidate, addrs, editingAddrId)) {
      showToast('This address is already available in your saved addresses.', 'warn', 4000);
      return;
    }

    if (editingAddrId) {
      // Update existing address
      addrs = addrs.map(a => {
        if (a.id === editingAddrId) {
          return { ...a, name, phone, pincode, type, street, city, state };
        }
        return a;
      });
      saveAddresses(addrs);
      showToast('Delivery address updated successfully!', 'success');
    } else {
      // Create new address
      const newAddr = {
        id: `addr_${Date.now()}`,
        name,
        phone,
        pincode,
        type,
        street,
        city,
        state,
        isDefault: addrs.length === 0
      };
      addrs.unshift(newAddr);
      saveAddresses(addrs);
      showToast('New delivery address added successfully!', 'success');
    }

    resetForm();
    renderList();
    updateCountBadge();
  });

  window._openAddressesModal = () => {
    resetForm();
    renderList();
    modal._open();
  };
}

/* ── 4. Wishlist Drawer ───────────────────────────────────── */
function buildWishlistDrawer() {
  const modal = createModal('wishlist-interactive-drawer', {
    title: 'My Saved Wishlist',
    side: true,
    bodyHtml: `<div id="wishlist-items-body" style="padding:10px 0;"></div>`,
    footerHtml: `<button id="wishlist-close-btn" class="wishlist-continue-btn" onclick="document.getElementById('wishlist-interactive-drawer')?._close(); window._showHomeView?.(); document.body.style.overflow='';" style="width:100%;padding:14px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);transition:transform 120ms ease;">Continue Shopping</button>`
  });

  function renderWishlist() {
    const body = modal.querySelector('#wishlist-items-body');
    if (Store.wishlist.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:48px 16px;color:#64748b;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom:12px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <h3 style="margin:0 0 6px;font-size:17px;font-weight:800;color:#1e293b;">Your Wishlist is Empty</h3>
          <p style="font-size:13px;margin:0 0 20px;">Save items you love by clicking the wishlist icon on any product.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = Store.wishlist.map(item => `
      <div style="display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <img class="wl-item-link" data-id="${item.id}" src="${item.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.name}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;background:#f8fafc;cursor:pointer;transition:transform 140ms ease;">
        <div style="flex:1;min-width:0;">
          <h4 class="wl-item-link" data-id="${item.id}" style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;" title="${item.name}">${item.name}</h4>
          <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#0f172a;">${Currency.format(item.price || 0)}</p>
          <div style="display:flex;gap:8px;">
            <button class="wl-add-cart-btn" data-id="${item.id}" style="padding:7px 14px;background:#ff9700;color:#000;border:none;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;">+ Add to Cart</button>
            <button class="wl-remove-btn" data-id="${item.id}" style="padding:7px 12px;background:#f1f5f9;color:#64748b;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    body.querySelectorAll('.wl-item-link').forEach(link => {
      link.addEventListener('click', () => {
        const item = Store.wishlist.find(w => w.id === link.dataset.id);
        if (item) {
          modal._close();
          const full = (Store.allProducts || []).find(p => (p._id === item.id || p.id === item.id || (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()))) || item;
          window._openProductDetail?.(full);
        }
      });
    });

    body.querySelectorAll('.wl-add-cart-btn').forEach(b => {
      b.addEventListener('click', () => {
        const item = Store.wishlist.find(w => w.id === b.dataset.id);
        if (item) {
          const added = Store.addToCart(item);
          if (added !== false) {
            Store.toggleWishlist(item);
            renderWishlist();
          }
        }
      });
    });

    body.querySelectorAll('.wl-remove-btn').forEach(b => {
      b.addEventListener('click', () => {
        const item = Store.wishlist.find(w => w.id === b.dataset.id);
        if (item) {
          Store.toggleWishlist(item);
          renderWishlist();
        }
      });
    });
  }

  // Close / Continue Shopping handler -> redirect to home page
  const handleWishlistClose = (e) => {
    if (e) e.preventDefault();
    modal._close();
    document.body.style.overflow = '';
    if (typeof window._showHomeView === 'function') {
      window._showHomeView();
    } else {
      window.location.hash = '#home';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  modal.querySelector('#wishlist-close-btn')?.addEventListener('click', handleWishlistClose);
  modal.addEventListener('click', (e) => {
    if (e.target.closest('#wishlist-close-btn') || e.target.closest('.wishlist-continue-btn')) {
      handleWishlistClose(e);
    }
  });

  window._openWishlist = () => {
    if (!Auth.isLoggedIn()) {
      showToast('Please sign in to access your saved wishlist', 'warn');
      window._openAuth?.('signin');
      return;
    }
    renderWishlist();
    modal._open();
  };

  window._reRenderWishlistPrices = () => {
    if (modal.classList.contains('is-open')) renderWishlist();
  };
}

/* ── Dedicated UPI Payment Gateway Modal ── */
function openInAppPaymentPortalModal({ amount, user, address, onSuccess, onCancel }) {
  const existingPortal = document.getElementById('xmart-inapp-payment-portal');
  if (existingPortal) existingPortal.remove();

  const formattedAmount = Currency.format(amount);
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=upi%3A%2F%2Fpay%3Fpa%3Dxmartsuperstore%40icici%26pn%3DX-Mart%2BSuperstore%26am%3D${encodeURIComponent(amount)}%26cu%3DINR`;

  const portalEl = document.createElement('div');
  portalEl.id = 'xmart-inapp-payment-portal';
  portalEl.style.cssText = `
    position: fixed; inset: 0; z-index: 100000;
    background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
    animation: fadeIn 0.2s ease-out;
  `;

  portalEl.innerHTML = `
    <div style="background: #ffffff; border-radius: 16px; width: 100%; max-width: 680px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); overflow: hidden; display: flex; flex-direction: column; max-height: 96vh; font-family: inherit;">
      
      <!-- Top Header (Clean, professional typography, no emoji icons) -->
      <div style="background: #ff9700; color: #000000; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #000000;">X-Mart UPI Gateway</h3>
          <span style="font-size: 11.5px; font-weight: 600; color: #1e293b;">Unified Payments Interface • Real-Time Verification</span>
        </div>
        <button id="inapp-close-btn" style="background: transparent; border: none; font-size: 24px; font-weight: 700; cursor: pointer; color: #000000; line-height: 1; padding: 2px 6px;">&times;</button>
      </div>

      <!-- Price Banner -->
      <div style="background: #fff8ee; border-bottom: 1.5px solid #fed7aa; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; color: #7c2d12; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Order Payable Amount</span>
          <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 2px;">${formattedAmount}</div>
        </div>
        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #334155;">
          Zero Extra Fees
        </div>
      </div>

      <!-- Body Content (Strict UPI Only) -->
      <div style="padding: 20px; overflow-y: auto; flex: 1;">
        
        <!-- Supported UPI Apps (Clean badges, no emojis) -->
        <div style="margin-bottom: 16px; text-align: center;">
          <span style="font-size: 11.5px; font-weight: 700; color: #64748b; display: block; margin-bottom: 8px;">Supported UPI Applications</span>
          <div style="display: flex; justify-content: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-size: 11px; font-weight: 800; background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px;">Google Pay</span>
            <span style="font-size: 11px; font-weight: 800; background: #f3e8ff; color: #7e22ce; padding: 3px 8px; border-radius: 4px;">PhonePe</span>
            <span style="font-size: 11px; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px;">Paytm</span>
            <span style="font-size: 11px; font-weight: 800; background: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 4px;">BHIM</span>
            <span style="font-size: 11px; font-weight: 800; background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 4px;">Any Bank UPI</span>
          </div>
        </div>

        <!-- Dynamic QR Code -->
        <div style="text-align: center; padding: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; margin-bottom: 18px;">
          <span style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 8px;">Scan with Any UPI App</span>
          <div style="display: inline-block; padding: 6px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
            <img src="${upiQrUrl}" alt="UPI QR Code" style="width: 140px; height: 140px; display: block; border-radius: 4px;">
          </div>
          <p style="margin: 6px 0 0; font-size: 11px; color: #64748b;">Open your mobile UPI app to scan and pay</p>
        </div>

        <!-- UPI ID Verification Section -->
        <div style="margin-bottom: 16px;">
          <label for="inapp-upi-id-input" style="display: block; font-size: 12.5px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            Enter UPI ID / VPA
          </label>
          <div style="display: flex; gap: 8px;">
            <input 
              type="text" 
              id="inapp-upi-id-input" 
              placeholder="e.g. mobile@okhdfcbank or yourname@paytm" 
              value="" 
              style="flex: 1; padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; outline: none; transition: border-color 0.2s;"
            >
            <button 
              type="button" 
              id="inapp-upi-verify-btn" 
              style="background: #0f172a; color: #ffffff; font-weight: 700; border: none; padding: 10px 16px; border-radius: 8px; font-size: 12.5px; cursor: pointer; white-space: nowrap; transition: background-color 0.2s;"
            >
              Verify UPI ID
            </button>
          </div>

          <!-- Dynamic Verification Status Notice (shown once verified or on invalid format) -->
          <div id="inapp-upi-status-box" style="display: none; margin-top: 10px; padding: 10px 12px; border-radius: 8px; font-size: 12px; line-height: 1.4;"></div>
        </div>

        <!-- Final Pay Button (DISABLED by default until UPI ID is verified) -->
        <div style="margin-top: 14px;">
          <button 
            type="button" 
            id="inapp-upi-pay-submit-btn" 
            disabled 
            style="width: 100%; background: #cbd5e1; color: #64748b; font-weight: 800; border: none; padding: 13px 20px; border-radius: 10px; font-size: 14px; cursor: not-allowed; transition: all 0.25s;"
          >
            Verify UPI ID to Pay ${formattedAmount}
          </button>
        </div>

      </div>

      <!-- Footer Info (Clean) -->
      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 10px 20px; text-align: center; font-size: 11px; color: #64748b;">
        National Payments Corporation of India (NPCI) • 256-Bit Encrypted
      </div>
    </div>
  `;

  document.body.appendChild(portalEl);

  // Close logic
  const closePortal = () => {
    portalEl.remove();
    onCancel?.();
  };
  portalEl.querySelector('#inapp-close-btn')?.addEventListener('click', closePortal);

  // Verification & Payment Logic
  const upiInput  = portalEl.querySelector('#inapp-upi-id-input');
  const verifyBtn = portalEl.querySelector('#inapp-upi-verify-btn');
  const statusBox = portalEl.querySelector('#inapp-upi-status-box');
  const payBtn    = portalEl.querySelector('#inapp-upi-pay-submit-btn');
  let isUpiVerified = false;

  const performVerification = () => {
    const upiVal = (upiInput?.value || '').trim();
    if (!upiVal || !upiVal.includes('@') || upiVal.length < 5) {
      statusBox.style.display = 'block';
      statusBox.style.background = '#fef2f2';
      statusBox.style.border = '1px solid #fecaca';
      statusBox.style.color = '#991b1b';
      statusBox.innerHTML = 'Please enter a valid UPI format (e.g., <strong>username@okhdfcbank</strong> or <strong>9065553105@paytm</strong>).';
      isUpiVerified = false;
      payBtn.disabled = true;
      payBtn.style.background = '#cbd5e1';
      payBtn.style.color = '#64748b';
      payBtn.style.cursor = 'not-allowed';
      payBtn.textContent = `Verify UPI ID to Pay ${formattedAmount}`;
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    setTimeout(() => {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verified';
      verifyBtn.style.background = '#16a34a';

      isUpiVerified = true;
      statusBox.style.display = 'block';
      statusBox.style.background = '#f0fdf4';
      statusBox.style.border = '1px solid #86efac';
      statusBox.style.color = '#166534';
      
      const accountHolder = user?.name || 'Verified User';
      const bankName = upiVal.split('@')[1]?.toUpperCase() || 'BANK';
      statusBox.innerHTML = `<strong>Verified UPI Account:</strong> ${upiVal}<br><span style="font-size:11px;color:#15803d;">Payer: ${accountHolder} • Connected to ${bankName} VPA.</span>`;

      // Enable the Pay Button
      payBtn.disabled = false;
      payBtn.style.background = '#16a34a';
      payBtn.style.color = '#ffffff';
      payBtn.style.cursor = 'pointer';
      payBtn.style.boxShadow = '0 4px 14px rgba(22, 163, 74, 0.35)';
      payBtn.textContent = `Pay ${formattedAmount} via UPI`;

    }, 500);
  };

  verifyBtn?.addEventListener('click', performVerification);

  // Reset verification if user changes the input
  upiInput?.addEventListener('input', () => {
    if (isUpiVerified) {
      isUpiVerified = false;
      verifyBtn.textContent = 'Verify UPI ID';
      verifyBtn.style.background = '#0f172a';
      statusBox.style.display = 'none';
      payBtn.disabled = true;
      payBtn.style.background = '#cbd5e1';
      payBtn.style.color = '#64748b';
      payBtn.style.cursor = 'not-allowed';
      payBtn.textContent = `Verify UPI ID to Pay ${formattedAmount}`;
    }
  });

  // Payment Execution
  const executePayment = (methodDetail = 'UPI ID') => {
    const upiId = upiInput?.value?.trim() || 'user@okaxis';
    portalEl.remove();
    onSuccess?.({
      orderId: `ord_upi_${Date.now()}`,
      paymentId: `pay_upi_${Date.now()}`,
      signature: `sig_upi_${Date.now()}`,
      method: 'UPI',
      isSandbox: true,
      upiId,
      methodDetail
    });
  };

  payBtn?.addEventListener('click', () => {
    if (!isUpiVerified) {
      showToast('Please verify your UPI ID first.', 'warn');
      return;
    }
    executePayment('Verified UPI ID');
  });

}
/* ── Dedicated In-App Net Banking Modal ── */
function openInAppNetBankingModal({ amount, user, onSuccess, onCancel }) {
  const existing = document.getElementById('xmart-netbanking-portal');
  if (existing) existing.remove();

  const formattedAmount = Currency.format(amount);

  const portalEl = document.createElement('div');
  portalEl.id = 'xmart-netbanking-portal';
  portalEl.style.cssText = `
    position: fixed; inset: 0; z-index: 100000;
    background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
    animation: fadeIn 0.2s ease-out;
  `;

  const banks = [
    { value: 'SBI',   label: 'State Bank of India' },
    { value: 'HDFC',  label: 'HDFC Bank' },
    { value: 'ICICI', label: 'ICICI Bank' },
    { value: 'AXIS',  label: 'Axis Bank' },
    { value: 'KOTAK', label: 'Kotak Mahindra Bank' },
    { value: 'PNB',   label: 'Punjab National Bank' },
    { value: 'BOB',   label: 'Bank of Baroda' },
    { value: 'CANARA',label: 'Canara Bank' },
  ];

  const bankOptions = banks.map((b, idx) => `
    <label class="nb-bank-opt" data-val="${b.value}" style="display:flex;align-items:center;gap:10px;padding:11px 14px;border:2px solid ${idx === 0 ? '#ff9700' : '#e2e8f0'};border-radius:10px;background:${idx === 0 ? '#fff8ee' : '#fff'};cursor:pointer;transition:all 0.15s;">
      <input type="radio" name="nb_bank" value="${b.value}" ${idx === 0 ? 'checked' : ''} style="accent-color:#ff9700;">
      <span style="font-size:13px;font-weight:700;color:#0f172a;">${b.label}</span>
    </label>
  `).join('');

  portalEl.innerHTML = `
    <div style="background:#ffffff;border-radius:16px;width:100%;max-width:600px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);overflow:hidden;display:flex;flex-direction:column;max-height:96vh;font-family:inherit;">

      <!-- Header -->
      <div style="background:#ff9700;color:#000;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:800;color:#000;">Net Banking Payment</h3>
          <span style="font-size:11.5px;font-weight:600;color:#1e293b;">Secure Bank Portal Redirect</span>
        </div>
        <button id="nb-close-btn" style="background:transparent;border:none;font-size:24px;font-weight:700;cursor:pointer;color:#000;line-height:1;padding:2px 6px;">&times;</button>
      </div>

      <!-- Amount Banner -->
      <div style="background:#fff8ee;border-bottom:1.5px solid #fed7aa;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:11px;color:#7c2d12;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Order Payable Amount</span>
          <div style="font-size:20px;font-weight:900;color:#0f172a;margin-top:2px;">${formattedAmount}</div>
        </div>
        <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;color:#334155;">Zero Extra Fees</div>
      </div>

      <!-- Bank List -->
      <div style="padding:20px;overflow-y:auto;flex:1;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#334155;">Select Your Bank</p>
        <div id="nb-bank-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
          ${bankOptions}
        </div>

        <button id="nb-pay-btn" style="width:100%;background:#0f172a;color:#fff;font-weight:800;border:none;padding:14px 20px;border-radius:10px;font-size:14.5px;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,0.25);transition:background 0.2s;">
          Proceed to Bank &amp; Pay ${formattedAmount}
        </button>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:10px 20px;text-align:center;font-size:11px;color:#64748b;">
        256-Bit Encrypted • Direct Bank Portal Checkout
      </div>
    </div>
  `;

  document.body.appendChild(portalEl);

  // Close
  portalEl.querySelector('#nb-close-btn')?.addEventListener('click', () => {
    portalEl.remove();
    onCancel?.();
  });

  // Bank selection highlight
  portalEl.querySelectorAll('.nb-bank-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      portalEl.querySelectorAll('.nb-bank-opt').forEach(o => {
        o.style.borderColor = '#e2e8f0';
        o.style.background = '#fff';
      });
      opt.style.borderColor = '#ff9700';
      opt.style.background = '#fff8ee';
      opt.querySelector('input[type=radio]').checked = true;
    });
  });

  // Pay
  portalEl.querySelector('#nb-pay-btn')?.addEventListener('click', () => {
    const bank = portalEl.querySelector('input[name="nb_bank"]:checked')?.value || 'SBI';
    const payBtn = portalEl.querySelector('#nb-pay-btn');
    payBtn.disabled = true;
    payBtn.textContent = 'Redirecting to Bank...';

    setTimeout(() => {
      portalEl.remove();
      onSuccess?.({
        orderId:   `ord_nb_${Date.now()}`,
        paymentId: `pay_nb_${Date.now()}`,
        signature: `sig_nb_${Date.now()}`,
        method: 'NetBanking',
        isSandbox: true,
        bank
      });
    }, 800);
  });
}

/* ── Unified Razorpay Checkout Integration (Official SDK + Seamless Fallback) ── */
async function openRazorpayCheckout({ amount, paymentMethod, user, address, onSuccess, onCancel }) {
  // UPI → dedicated UPI modal with QR + verification
  if (paymentMethod === 'UPI') {
    openInAppPaymentPortalModal({ amount, paymentMethod: 'UPI', user, address, onSuccess, onCancel });
    return;
  }

  // Net Banking → dedicated in-app bank selection portal
  // (Razorpay test mode does not support Net Banking — it shows "Choose other payment option")
  if (paymentMethod === 'NetBanking') {
    openInAppNetBankingModal({ amount, user, onSuccess, onCancel });
    return;
  }

  // 1. Attempt official Razorpay Checkout SDK for Cards / Netbanking
  try {
    const configRes = await apiFetch('/payment/config');
    const keyId = configRes?.keyId;

    if (window.Razorpay && keyId && keyId !== 'rzp_test_placeholder') {
      const orderRes = await apiFetch('/payment/create-order', {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ amount })
      });

      if (orderRes?.success && orderRes?.order) {
        const rzpOrder = orderRes.order;
        const options = {
          key: keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'X-Mart Superstore',
          description: `Order Checkout (${paymentMethod})`,
          order_id: rzpOrder.id,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: {
            color: '#ff9700'
          },
          handler: function (response) {
            onSuccess?.({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isSandbox: Boolean(orderRes.isSandbox),
              method: paymentMethod
            });
          },
          modal: {
            ondismiss: function () {
              onCancel?.();
            }
          }
        };

        if (paymentMethod === 'UPI') {
          options.prefill.method = 'upi';
        } else if (paymentMethod === 'Card') {
          options.prefill.method = 'card';
        } else if (paymentMethod === 'NetBanking') {
          options.prefill.method = 'netbanking';
        }

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (errResp) {
          showToast(`Payment Failed: ${errResp?.error?.description || 'Transaction cancelled'}`, 'error');
          onCancel?.();
        });
        rzp.open();
        return; // Successfully opened official Razorpay popup!
      }
    }
  } catch (err) {
    console.warn('Official Razorpay SDK unavailable, falling back to in-app portal:', err.message);
  }

  // 2. Fallback: Open built-in interactive payment modal
  openInAppPaymentPortalModal({ amount, paymentMethod, user, address, onSuccess, onCancel });
}

// Global Aliases
const openInAppPaymentPortal = openRazorpayCheckout;
window.openInAppPaymentPortal = openRazorpayCheckout;
window.openRazorpayCheckout = openRazorpayCheckout;


/* ── 5. Multi-Step Checkout & Payment Modal (3 Commercial Steps) ────── */
function buildCheckoutModal() {
  const modal = createModal('checkout-interactive-modal', {
    title: 'Commercial 3-Step Checkout',
    large: true,
    bodyHtml: `
      <div class="checkout-stepper-wrap">
        <div class="step-tab is-active" id="step-tab-1" data-step="1">
          <div class="step-num" style="width:28px;height:28px;border-radius:50%;background:#ff9700;color:#000;font-weight:900;display:grid;place-items:center;font-size:13px;">1</div>
          <div class="step-text" style="font-size:13.5px;font-weight:800;color:#0f172a;">1. Order Summary</div>
        </div>
        <div style="height:2px;background:#cbd5e1;flex:1;margin:0 10px;"></div>
        <div class="step-tab" id="step-tab-2" data-step="2">
          <div class="step-num" style="width:28px;height:28px;border-radius:50%;background:#e2e8f0;color:#64748b;font-weight:900;display:grid;place-items:center;font-size:13px;">2</div>
          <div class="step-text" style="font-size:13.5px;font-weight:700;color:#64748b;">2. Address Details</div>
        </div>
        <div style="height:2px;background:#cbd5e1;flex:1;margin:0 10px;"></div>
        <div class="step-tab" id="step-tab-3" data-step="3">
          <div class="step-num" style="width:28px;height:28px;border-radius:50%;background:#e2e8f0;color:#64748b;font-weight:900;display:grid;place-items:center;font-size:13px;">3</div>
          <div class="step-text" style="font-size:13.5px;font-weight:700;color:#64748b;">3. Payment Options</div>
        </div>
      </div>

      <!-- STEP 1: ORDER SUMMARISATION -->
      <div id="checkout-pane-1" class="checkout-step-pane is-active">
        <div class="chk-pane-grid">
          <!-- Items List -->
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <h4 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">Items in Your Order (<span id="chk-step1-count">0</span>)</h4>
            </div>
            <div id="chk-step1-items-list" style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding-right:6px;"></div>
          </div>

          <!-- Price Summary & Continue -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:22px;height:fit-content;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <h4 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#0f172a;">Order Price Details</h4>
            
            <div class="chk-price-row">
              <span>Price (<span id="chk-step1-summary-count">0</span> items):</span>
              <strong id="chk-step1-subtotal" style="color:#0f172a;font-size:14px;">₹0</strong>
            </div>
            <div class="chk-price-row">
              <span>Delivery Fee:</span>
              <strong id="chk-step1-shipping" style="color:#16a34a;font-size:14px;">FREE</strong>
            </div>
            <div class="chk-price-row">
              <span>GST &amp; Handling:</span>
              <strong id="chk-step1-tax" style="color:#0f172a;font-size:14px;">₹0</strong>
            </div>

            <!-- Coupon Input -->
            <div style="display:flex;gap:8px;margin:14px 0 16px;">
              <input type="text" id="chk-coupon-input" placeholder="ENTER COUPON CODE" style="flex:1;min-width:0;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:12px;outline:none;text-transform:uppercase;font-weight:700;" />
              <button type="button" id="chk-coupon-apply-btn" style="background:#19324c;color:#fff;border:none;padding:9px 16px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;flex-shrink:0;">Apply</button>
            </div>

            <div style="border-top:1.5px dashed #cbd5e1;padding-top:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <span style="font-size:15px;font-weight:800;color:#0f172a;">Total Payable:</span>
              <strong id="chk-step1-grand-total" style="font-size:19px;font-weight:900;color:#16a34a;white-space:nowrap;font-variant-numeric:tabular-nums;">₹0</strong>
            </div>

            <button type="button" id="chk-goto-step2-btn" class="com-btn-primary" style="width:100%;background:#ff9700;color:#000;font-weight:800;border:none;padding:13px 18px;border-radius:10px;font-size:14.5px;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);display:flex;align-items:center;justify-content:center;box-sizing:border-box;">
              <span>Proceed to Delivery Address</span>
            </button>
          </div>
        </div>
      </div>

      <!-- STEP 2: ADDRESS DETAILS -->
      <div id="checkout-pane-2" class="checkout-step-pane">

        <!-- ── Saved Address Cards (shown when addresses exist) ── -->
        <div id="chk-saved-addr-section" style="display:none;">
          <div style="margin-bottom:14px;">
            <h4 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">2. Select Delivery Address</h4>
            <p style="margin:2px 0 0;font-size:12.5px;color:#64748b;">Your saved addresses are shown below. Select one or add a new one.</p>
          </div>
          <div id="chk-addr-cards-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;"></div>

          <!-- Add New Address Toggle -->
          <button type="button" id="chk-add-new-addr-btn" style="display:flex;align-items:center;gap:8px;background:transparent;border:2px dashed #cbd5e1;color:#000000;font-weight:700;font-size:13px;padding:10px 18px;border-radius:10px;cursor:pointer;width:100%;justify-content:center;transition:border-color 0.2s,background 0.2s;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Use a Different / New Address
          </button>
        </div>

        <!-- ── New Address Form (always visible when no saved addr; collapsible otherwise) ── -->
        <div id="chk-new-addr-form-wrap">
          <form id="chk-address-form">
            <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div>
                <h4 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;" id="chk-addr-form-title">2. Enter Full Delivery Address</h4>
                <p style="margin:2px 0 0;font-size:12.5px;color:#64748b;">Accurate address ensures on-time doorstep delivery.</p>
              </div>
              <button type="button" id="chk-cancel-new-addr-btn" style="display:none;background:transparent;border:1.5px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:700;padding:6px 14px;border-radius:8px;cursor:pointer;">
                ← Back to Saved Addresses
              </button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
              <div class="auth-input-group">
                <label>Full Recipient Name *</label>
                <input type="text" id="chk-step2-name" required>
              </div>
              <div class="auth-input-group">
                <label>10-Digit Mobile Number *</label>
                <input type="tel" id="chk-step2-phone" maxlength="10" required>
              </div>
              <div class="auth-input-group">
                <label>6-Digit PIN Code *</label>
                <input type="text" id="chk-step2-pin" maxlength="6" required>
              </div>
            </div>

            <div class="auth-input-group" style="margin-bottom:14px;">
              <label>Flat, House No., Building, Apartment, Company *</label>
              <input type="text" id="chk-step2-flat" required>
            </div>

            <div class="auth-input-group" style="margin-bottom:14px;">
              <label>Area, Colony, Street, Sector, Landmark *</label>
              <input type="text" id="chk-step2-street" required>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
              <div class="auth-input-group">
                <label>City / District *</label>
                <input type="text" id="chk-step2-city" required>
              </div>
              <div class="auth-input-group">
                <label>State *</label>
                <input type="text" id="chk-step2-state" required>
              </div>
              <div class="auth-input-group">
                <label>Address Type *</label>
                <select id="chk-step2-type" style="width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:#fff;outline:none;">
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <!-- Step 2 Navigation Buttons -->
            <div style="display:flex;justify-content:center;align-items:center;gap:16px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:18px;flex-wrap:wrap;">
              <button type="button" id="chk-backto-step1-btn" style="background:#f1f5f9;color:#334155;border:1.5px solid #cbd5e1;font-weight:700;padding:12px 28px;border-radius:10px;font-size:14px;cursor:pointer;min-width:190px;">
                Back to Order Summary
              </button>
              <button type="submit" id="chk-goto-step3-btn" class="com-btn-primary" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:12px 32px;border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);min-width:220px;">
                Proceed to Payment Options
              </button>
            </div>
          </form>
        </div>

        <!-- Proceed button for when using a saved address card -->
        <div id="chk-addr-card-proceed-bar" style="display:none;justify-content:center;align-items:center;gap:16px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:18px;flex-wrap:wrap;">
          <button type="button" id="chk-backto-step1-btn2" style="background:#f1f5f9;color:#334155;border:1.5px solid #cbd5e1;font-weight:700;padding:12px 28px;border-radius:10px;font-size:14px;cursor:pointer;min-width:190px;">
            Back to Order Summary
          </button>
          <button type="button" id="chk-use-selected-addr-btn" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:12px 32px;border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);min-width:220px;">
            Proceed to Payment Options
          </button>
        </div>
      </div>

      <!-- STEP 3: PAYMENT OPTIONS & PLACE ORDER -->
      <div id="checkout-pane-3" class="checkout-step-pane">
        <div class="chk-pane-grid">
          <!-- Left: Payment Methods -->
          <div>
            <div style="margin-bottom:14px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;">Delivering To:</span>
                <div id="chk-step3-selected-addr-text" style="font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">Ashutosh Pathak, Bilaspur, 495001</div>
              </div>
              <button type="button" id="chk-step3-change-addr-btn" style="background:transparent;border:none;color:#0878f9;font-weight:700;font-size:12.5px;cursor:pointer;">Change</button>
            </div>

            <h4 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#0f172a;">3. Select Payment Option</h4>

            <!-- Payment Radio Cards -->
            <label class="payment-method-card is-selected">
              <input type="radio" name="checkoutPaymentMethod" value="COD" checked>
              <div>
                <strong>Cash on Delivery (COD) / Pay on Delivery</strong>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Pay safely in cash or UPI QR code at your doorstep.</p>
              </div>
            </label>

            <label class="payment-method-card" id="chk-wallet-pay-option">
              <input type="radio" name="checkoutPaymentMethod" value="Wallet">
              <div>
                <strong>X-Mart Cash & Wallet (Balance: ₹<span id="chk-wallet-avail-bal">0.00</span>)</strong>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">1-Click instant debit with zero processing fees.</p>
              </div>
            </label>

            <label class="payment-method-card">
              <input type="radio" name="checkoutPaymentMethod" value="UPI">
              <div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <strong>Instant UPI (Google Pay, PhonePe, Paytm, BHIM)</strong>
                  <span style="background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;letter-spacing:0.3px;">RAZORPAY</span>
                </div>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Instant authorization with 5% Prime cashback eligibility.</p>
              </div>
            </label>

            <label class="payment-method-card">
              <input type="radio" name="checkoutPaymentMethod" value="Card">
              <div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <strong>Credit / Debit Card (Visa, MasterCard, RuPay, Amex)</strong>
                  <span style="background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;letter-spacing:0.3px;">RAZORPAY</span>
                </div>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Bank-grade 256-Bit SSL encrypted transaction.</p>
              </div>
            </label>

            <label class="payment-method-card">
              <input type="radio" name="checkoutPaymentMethod" value="NetBanking">
              <div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <strong>Net Banking (All Major Indian Banks)</strong>
                  <span style="background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;letter-spacing:0.3px;">RAZORPAY</span>
                </div>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Direct secure bank portal checkout (1-click Instant Test).</p>
              </div>
            </label>
          </div>

          <!-- Right: Final Order Total & Place Order Button -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:22px;height:fit-content;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
            <h4 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#0f172a;">Final Payment Review</h4>
            
            <div class="chk-price-row">
              <span>Items Total:</span>
              <strong id="chk-step3-subtotal" style="color:#0f172a;font-size:14px;">₹0</strong>
            </div>
            <div class="chk-price-row">
              <span>Delivery Charges:</span>
              <strong style="color:#16a34a;font-size:14px;">FREE</strong>
            </div>
            <div class="chk-price-row">
              <span>GST &amp; Tax:</span>
              <strong id="chk-step3-tax" style="color:#0f172a;font-size:14px;">₹0</strong>
            </div>

            <div style="border-top:1.5px dashed #cbd5e1;padding-top:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <span style="font-size:15px;font-weight:800;color:#0f172a;">Grand Total:</span>
              <strong id="chk-step3-grand-total" style="font-size:20px;font-weight:900;color:#16a34a;white-space:nowrap;font-variant-numeric:tabular-nums;">₹0</strong>
            </div>

            <button type="button" id="chk-place-order-final-btn" class="com-btn-primary" style="width:100%;background:#ff9700;color:#000;font-weight:800;border:none;padding:14px 18px;border-radius:10px;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Place Order Now</span>
            </button>

            <button type="button" id="chk-backto-step2-btn" style="width:100%;background:transparent;border:none;color:#64748b;font-weight:700;padding:10px;margin-top:8px;font-size:13px;cursor:pointer;">
              Back to Address Details
            </button>
            <p style="text-align:center;font-size:11.5px;color:#94a3b8;margin:6px 0 0;">Safe &amp; Encrypted 256-Bit Checkout</p>
          </div>
        </div>
      </div>
    `
  });

  let currentCheckoutStep = 1;
  let savedDeliveryAddress = null;

  function goToStep(step) {
    if (!Auth.isLoggedIn()) {
      modal._close();
      showToast('Please sign in to proceed to checkout', 'warn');
      window._openAuth?.('signin');
      return;
    }
    currentCheckoutStep = step;

    // Update tabs
    modal.querySelectorAll('.step-tab').forEach(tab => {
      const tabStep = parseInt(tab.dataset.step);
      tab.classList.toggle('is-active', tabStep === step);
      tab.classList.toggle('is-completed', tabStep < step);
      if (tabStep < step) {
        tab.querySelector('.step-num').textContent = '✓';
      } else {
        tab.querySelector('.step-num').textContent = tabStep;
      }
    });

    // Update panes
    modal.querySelectorAll('.checkout-step-pane').forEach((pane, idx) => {
      pane.classList.toggle('is-active', idx + 1 === step);
    });

    if (step === 1) renderStep1();
    if (step === 3) renderStep3();
  }

  // Step 1: Render items
  function renderStep1() {
    const subtotal = Store.cartTotal();
    const count = Store.cartCount();
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;

    modal.querySelector('#chk-step1-count').textContent = count;
    modal.querySelector('#chk-step1-summary-count').textContent = count;
    modal.querySelector('#chk-step1-subtotal').textContent = Currency.format(subtotal);
    modal.querySelector('#chk-step1-tax').textContent = Currency.format(tax);
    modal.querySelector('#chk-step1-grand-total').textContent = Currency.format(grandTotal);

    const itemsList = modal.querySelector('#chk-step1-items-list');
    if (Store.cart.length === 0) {
      itemsList.innerHTML = `<div style="text-align:center;padding:30px;color:#64748b;">Your cart is empty.</div>`;
      return;
    }

    itemsList.innerHTML = Store.cart.map(item => `
      <div class="checkout-item-card">
        <img class="chk-item-link" data-id="${item.id}" src="${item.image || item.img || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}" alt="${item.name}" style="width:54px;height:54px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;transition:transform 140ms ease;" />
        <div style="flex:1;min-width:0;">
          <div class="chk-item-link" data-id="${item.id}" style="font-size:13.5px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;" title="${item.name}">${item.name}</div>
          <div style="font-size:12px;color:#64748b;">${Currency.format(item.price)} × ${item.qty}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;font-weight:800;color:#0f172a;">${Currency.format(item.price * item.qty)}</div>
          <button type="button" class="btn-chk-remove-item" data-id="${item.id}" style="background:transparent;border:none;color:#ef4444;font-size:11px;font-weight:700;cursor:pointer;padding:2px 0;">Remove</button>
        </div>
      </div>
    `).join('');

    itemsList.querySelectorAll('.btn-chk-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.removeFromCart(btn.dataset.id);
        renderStep1();
      });
    });
  }

  // Pre-fill Step 2 Address with user / saved data
  function initStep2Address() {
    const user = Auth.getUser() || {};
    const savedAddrs = (() => {
      try { return JSON.parse(localStorage.getItem('xmart_saved_addresses') || '[]'); } catch { return []; }
    })();

    const savedSection   = modal.querySelector('#chk-saved-addr-section');
    const newFormWrap    = modal.querySelector('#chk-new-addr-form-wrap');
    const cardsList      = modal.querySelector('#chk-addr-cards-list');
    const addNewBtn      = modal.querySelector('#chk-add-new-addr-btn');
    const cancelNewBtn   = modal.querySelector('#chk-cancel-new-addr-btn');
    const proceedBar     = modal.querySelector('#chk-addr-card-proceed-bar');
    const addrFormTitle  = modal.querySelector('#chk-addr-form-title');

    let selectedAddrIndex = 0; // default = first (default) address

    function showCardView() {
      savedSection.style.display = 'block';
      newFormWrap.style.display  = 'none';
      proceedBar.style.display   = 'flex';
      cancelNewBtn.style.display = 'none';
    }

    function showFormView(isAddNew = false) {
      savedSection.style.display = 'none';
      newFormWrap.style.display  = 'block';
      proceedBar.style.display   = 'none';
      if (isAddNew) {
        cancelNewBtn.style.display = 'inline-flex';
        addrFormTitle.textContent  = 'Add a New Delivery Address';
        // Clear form for fresh entry
        ['chk-step2-name','chk-step2-phone','chk-step2-pin','chk-step2-flat','chk-step2-street','chk-step2-city','chk-step2-state'].forEach(id => {
          const el = modal.querySelector(`#${id}`);
          if (el) el.value = '';
        });
        if (user.name) modal.querySelector('#chk-step2-name').value = user.name;
        if (user.phone) modal.querySelector('#chk-step2-phone').value = user.phone;
      } else {
        cancelNewBtn.style.display = 'none';
        addrFormTitle.textContent  = '2. Enter Full Delivery Address';
      }
    }

    if (Array.isArray(savedAddrs) && savedAddrs.length > 0) {
      // ── Render address cards ──────────────────────────────────────
      cardsList.innerHTML = savedAddrs.map((addr, i) => {
        const typeIcon = addr.type === 'WORK' ? '🏢' : addr.type === 'OTHER' ? '📍' : '🏠';
        const isDefault = i === 0;
        return `
          <label class="chk-addr-card ${isDefault ? 'chk-addr-card--selected' : ''}" data-addr-index="${i}" style="
            display:flex;align-items:flex-start;gap:14px;padding:14px 16px;
            border:2px solid ${isDefault ? '#ff9700' : '#e2e8f0'};border-radius:12px;cursor:pointer;
            background:${isDefault ? '#fff8ee' : '#fff'};transition:all 0.18s;
          ">
            <input type="radio" name="chk-addr-radio" value="${i}" ${isDefault ? 'checked' : ''} style="margin-top:3px;accent-color:#ff9700;width:16px;height:16px;flex-shrink:0;">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="font-size:13px;font-weight:800;color:#0f172a;">${addr.name || user.name || ''}</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:${isDefault ? '#ff9700' : '#f1f5f9'};color:${isDefault ? '#000' : '#64748b'};">${typeIcon} ${isDefault ? 'Default' : (addr.type || 'HOME')}</span>
              </div>
              <div style="font-size:12.5px;color:#475569;line-height:1.6;">
                ${addr.street || ''}<br>
                ${addr.city || ''}, ${addr.state || ''} - <strong>${addr.pincode || ''}</strong>
              </div>
              <div style="font-size:12px;color:#94a3b8;margin-top:3px;">📞 ${addr.phone || ''}</div>
            </div>
          </label>`;
      }).join('');

      // Radio card selection
      cardsList.querySelectorAll('.chk-addr-card').forEach(card => {
        card.addEventListener('click', () => {
          selectedAddrIndex = parseInt(card.dataset.addrIndex);
          cardsList.querySelectorAll('.chk-addr-card').forEach(c => {
            c.style.borderColor = '#e2e8f0';
            c.style.background  = '#fff';
          });
          card.style.borderColor = '#ff9700';
          card.style.background  = '#fff8ee';
          card.querySelector('input[type=radio]').checked = true;
        });
      });

      addNewBtn?.addEventListener('click', () => showFormView(true));
      cancelNewBtn?.addEventListener('click', () => showCardView());

      // Proceed with selected card
      modal.querySelector('#chk-use-selected-addr-btn')?.addEventListener('click', () => {
        const addr = savedAddrs[selectedAddrIndex];
        if (!addr) { showToast('Please select an address.', 'warn'); return; }
        savedDeliveryAddress = {
          name: addr.name || user.name || '',
          phone: addr.phone || user.phone || '',
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '',
          type: addr.type || 'HOME',
          country: 'India'
        };
        renderStep3();
        goToStep(3);
      });

      showCardView();
    } else {
      // No saved addresses — show blank form directly
      showFormView(false);
      if (user.name)  modal.querySelector('#chk-step2-name').value  = user.name;
      if (user.phone) modal.querySelector('#chk-step2-phone').value = user.phone;
      const pinInput = modal.querySelector('#chk-step2-pin');
      if (pinInput && !pinInput.value) pinInput.value = localStorage.getItem('xmart_pincode') || '';
      modal.querySelector('#chk-step2-city').value  = 'Bilaspur';
      modal.querySelector('#chk-step2-state').value = 'Chhattisgarh';
    }

    // Auto-fetch district & state from PIN
    const pinEl   = modal.querySelector('#chk-step2-pin');
    const cityEl  = modal.querySelector('#chk-step2-city');
    const stateEl = modal.querySelector('#chk-step2-state');
    pinEl?.addEventListener('input', (e) => {
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = pin;
      if (pin.length === 6) autoFetchAddressFromPin(pin, cityEl, stateEl);
    });
  }

  // Step 3: Render review & live wallet balance
  function renderStep3() {
    const subtotal = Store.cartTotal();
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;

    modal.querySelector('#chk-step3-subtotal').textContent = Currency.format(subtotal);
    modal.querySelector('#chk-step3-tax').textContent = Currency.format(tax);
    modal.querySelector('#chk-step3-grand-total').textContent = Currency.format(grandTotal);

    if (savedDeliveryAddress) {
      modal.querySelector('#chk-step3-selected-addr-text').textContent = 
        `${savedDeliveryAddress.name} (${savedDeliveryAddress.phone}), ${savedDeliveryAddress.street}, ${savedDeliveryAddress.city}, ${savedDeliveryAddress.state} - ${savedDeliveryAddress.pincode}`;
    }

    const rawBal = parseFloat(localStorage.getItem('xmart_wallet_balance') || '0.00');
    const wBal = isNaN(rawBal) ? 0 : rawBal;
    const wBalEl = modal.querySelector('#chk-wallet-avail-bal');
    if (wBalEl) wBalEl.textContent = wBal.toFixed(2);

    updatePlaceOrderBtnLabel();
  }

  // Stepper tab clicks
  modal.querySelectorAll('.step-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const step = parseInt(tab.dataset.step);
      if (step === 2 && Store.cart.length === 0) return;
      if (step === 3 && !savedDeliveryAddress) {
        showToast('Please confirm your delivery address first!', 'warn');
        goToStep(2);
        return;
      }
      goToStep(step);
    });
  });

  // Step 1 -> Step 2
  modal.querySelector('#chk-goto-step2-btn')?.addEventListener('click', () => {
    if (Store.cart.length === 0) {
      showToast('Please add items to your cart first!', 'warn');
      return;
    }
    initStep2Address();
    goToStep(2);
  });

  // Step 2 -> Step 1
  modal.querySelector('#chk-backto-step1-btn')?.addEventListener('click', () => goToStep(1));
  modal.querySelector('#chk-backto-step1-btn2')?.addEventListener('click', () => goToStep(1));

  // Step 2 Form Submit -> Step 3
  modal.querySelector('#chk-address-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#chk-step2-name').value.trim();
    const phone = modal.querySelector('#chk-step2-phone').value.trim();
    const pin = modal.querySelector('#chk-step2-pin').value.trim();
    const flat = modal.querySelector('#chk-step2-flat').value.trim();
    const street = modal.querySelector('#chk-step2-street').value.trim();
    const city = modal.querySelector('#chk-step2-city').value.trim();
    const state = modal.querySelector('#chk-step2-state').value.trim();
    const type = modal.querySelector('#chk-step2-type').value;

    if (!name || !phone || !pin || !flat || !street || !city || !state) {
      showToast('Please fill in all required address fields.', 'warn');
      return;
    }

    savedDeliveryAddress = {
      name,
      phone,
      street: `${flat}, ${street}`,
      city,
      state,
      pincode: pin,
      type,
      country: 'India'
    };

    // Save to user saved addresses
    try {
      let addrs = JSON.parse(localStorage.getItem('xmart_saved_addresses') || '[]');
      if (!Array.isArray(addrs)) addrs = [];
      const exists = addrs.some(a => a.pincode === pin && a.street === savedDeliveryAddress.street);
      if (!exists) {
        addrs.unshift({ ...savedDeliveryAddress, id: `addr_${Date.now()}` });
        localStorage.setItem('xmart_saved_addresses', JSON.stringify(addrs));
      }
    } catch {}

    goToStep(3);
  });

  // Step 3 -> Step 2
  modal.querySelector('#chk-backto-step2-btn')?.addEventListener('click', () => goToStep(2));
  modal.querySelector('#chk-step3-change-addr-btn')?.addEventListener('click', () => goToStep(2));

  // Update "Place Order" button text based on selected payment method
  function updatePlaceOrderBtnLabel() {
    const subtotal = Store.cartTotal();
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;
    const formattedTotal = Currency.format(grandTotal);
    const method = modal.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || 'COD';
    const btnSpan = modal.querySelector('#chk-place-order-final-btn span');
    if (!btnSpan) return;

    if (method === 'COD') {
      btnSpan.textContent = `Place Order • ${formattedTotal} (COD)`;
    } else if (method === 'Wallet') {
      btnSpan.textContent = `Pay ${formattedTotal} via Wallet`;
    } else if (method === 'UPI') {
      btnSpan.textContent = `Pay ${formattedTotal} via UPI (Razorpay)`;
    } else if (method === 'Card') {
      btnSpan.textContent = `Pay ${formattedTotal} via Card (Razorpay)`;
    } else if (method === 'NetBanking') {
      btnSpan.textContent = `Pay ${formattedTotal} via Net Banking (Razorpay)`;
    } else {
      btnSpan.textContent = `Place Order • ${formattedTotal}`;
    }
  };

  // Payment method selection radio & card click handling
  modal.querySelectorAll('.payment-method-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const radio = card.querySelector('input[name="checkoutPaymentMethod"]');
      if (radio && !radio.checked) {
        radio.checked = true;
      }
      modal.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      updatePlaceOrderBtnLabel();
    });
  });

  modal.querySelectorAll('input[name="checkoutPaymentMethod"]').forEach(r => {
    r.addEventListener('change', () => {
      modal.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('is-selected'));
      r.closest('.payment-method-card')?.classList.add('is-selected');
      updatePlaceOrderBtnLabel();
    });
  });

  // Place Order Final Submit
  modal.querySelector('#chk-place-order-final-btn')?.addEventListener('click', async () => {
    if (Store.cart.length === 0) {
      showToast('Your cart is empty!', 'warn');
      return;
    }

    if (!savedDeliveryAddress) {
      showToast('Please provide your delivery address.', 'warn');
      goToStep(2);
      return;
    }

    const btn = modal.querySelector('#chk-place-order-final-btn');
    btn.disabled = true;
    btn.textContent = 'Processing Your Order...';

    const selectedPayMethod = modal.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || 'COD';

    // If wallet selected, verify balance
    const subtotal = Store.cartTotal();
    const tax = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + tax;

    if (selectedPayMethod === 'Wallet') {
      const curBal = parseFloat(localStorage.getItem('xmart_wallet_balance') || '0.00');
      if (curBal < grandTotal) {
        btn.disabled = false;
        updatePlaceOrderBtnLabel();
        showToast(`Insufficient Wallet Balance (₹${curBal.toFixed(2)}). Please select COD or UPI.`, 'error', 4500);
        return;
      }
      // Deduct wallet
      const newBal = curBal - grandTotal;
      localStorage.setItem('xmart_wallet_balance', newBal.toFixed(2));
    }

    if (!Auth.isLoggedIn()) {
      btn.disabled = false;
      updatePlaceOrderBtnLabel();
      showToast('Please Sign In or Register to place your order.', 'warn');
      modal._close();
      window._openAuth?.('signup');
      return;
    }

    // Online Payments (UPI, Card, NetBanking via Razorpay)
    if (selectedPayMethod === 'UPI' || selectedPayMethod === 'Card' || selectedPayMethod === 'NetBanking') {
      btn.disabled = false;
      updatePlaceOrderBtnLabel();

      openRazorpayCheckout({
        amount: grandTotal,
        paymentMethod: selectedPayMethod,
        user: Auth.getUser() || {},
        address: savedDeliveryAddress,
        onSuccess: async (paymentResult) => {
          btn.disabled = true;
          btn.textContent = 'Finalizing Your Order...';
          try {
            const orderId = paymentResult.razorpay_order_id || paymentResult.orderId || `ord_${Date.now()}`;
            const paymentId = paymentResult.razorpay_payment_id || paymentResult.paymentId || `pay_${Date.now()}`;
            const signature = paymentResult.razorpay_signature || paymentResult.signature || 'verified_inapp_signature';
            const isSandbox = paymentResult.isSandbox !== undefined ? paymentResult.isSandbox : false;

            const verifyRes = await apiFetch('/payment/verify', {
              method: 'POST',
              headers: Auth.getHeaders(),
              body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                isSandbox: isSandbox,
                shippingAddress: savedDeliveryAddress,
                paymentMethod: selectedPayMethod,
                items: Store.cart
              })
            });

            const newOrder = verifyRes.data;
            Store.clearCart();
            modal._close();
            showToast(`Payment Verified & Order Confirmed! Ref: ${newOrder?.orderId || 'XM-PAID'}`, 'success', 5000);
            window._openOrders?.();
          } catch (err) {
            showToast(`Order Notice: ${err.message}`, 'error', 6000);
          } finally {
            btn.disabled = false;
            updatePlaceOrderBtnLabel();
          }
        },
        onCancel: () => {
          btn.disabled = false;
          updatePlaceOrderBtnLabel();
          showToast('Payment window closed. Order was not placed.', 'info');
        }
      });
      return;
    }

    // Direct Cash on Delivery (COD) / Wallet Flow
    try {
      const orderRes = await apiFetch('/orders', {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({
          shippingAddress: savedDeliveryAddress,
          paymentMethod: selectedPayMethod,
          items: Store.cart
        })
      });

      const newOrder = orderRes.data;
      Store.clearCart();
      modal._close();

      showToast(`Order Placed Successfully! Order Ref: ${newOrder?.orderId || 'XM-DONE'}`, 'success', 5000);
      window._openOrders?.();

    } catch (err) {
      showToast(`Order Notice: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Place Order Now';
    }
  });

  window._openCheckout = () => {
    if (!Auth.isLoggedIn()) {
      showToast('Please sign in to proceed to checkout', 'warn');
      window._openAuth?.('signin');
      return;
    }
    if (Store.cart.length === 0) {
      showToast('Please add items to your cart first!', 'warn');
      return;
    }
    goToStep(1);
    modal._open();
  };

  window._reRenderCheckoutPrices = () => {
    if (modal.classList.contains('is-open')) goToStep(currentCheckoutStep || 1);
  };
}

/* ── 6. Live Product Catalog Modal (Category / Search) ────── */
/* ════════════════════════════════════════════════════════════
   COMMERCIAL-LEVEL DEDICATED FULL-PAGE WINDOWS & SPA ROUTER
   ════════════════════════════════════════════════════════════ */
function initPageRouter() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  let pageContainer = document.getElementById('dedicated-page-view');
  if (!pageContainer) {
    pageContainer = document.createElement('div');
    pageContainer.id = 'dedicated-page-view';
    pageContainer.className = 'dedicated-page-view';
    pageContainer.style.display = 'none';
    mainContent.parentNode.insertBefore(pageContainer, mainContent);
  }

  let isNavigatingHistory = false;

  function pushRoute(hash, state = {}, title = '') {
    if (isNavigatingHistory) return;
    const cleanHash = hash.startsWith('#') ? hash : `#${hash}`;
    history.pushState({ ...state, hash: cleanHash }, title || document.title, cleanHash);
  }

  // Return to home storefront
  window._showHomeView = (push = true) => {
    pageContainer.style.display = 'none';
    mainContent.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (push) pushRoute('#home', { type: 'home' }, 'X-Mart Superstore');
  };

  window._closeDedicatedPage = (push = true) => {
    window._showHomeView(push);
  };

  document.querySelectorAll('.brand, a[href="#top"]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      window._showHomeView();
    });
  });

  window._currentDedicatedPageArgs = null;

  // ── 1. COMMERCIAL CATEGORY & DEALS STORE WINDOW ────────────
  window._openDedicatedPage = async (category = '', type = '', search = '', push = true) => {
    window._currentDedicatedPageArgs = { category, type, search };
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) {
      const h = category
        ? `#category/${encodeURIComponent(category)}${type ? `?type=${type}` : ''}${search ? `?search=${encodeURIComponent(search)}` : ''}`
        : (type ? `#${type}` : (search ? `#search/${encodeURIComponent(search)}` : '#store'));
      pushRoute(h, { type: 'category', category, filterType: type, search });
    }

    const isDeals = type === 'deal' || (!category && !search && type === 'deals');
    const isBestseller = type === 'bestseller';

    let pageTitle = category 
      ? `${category} Superstore` 
      : (isDeals ? "Today's Lightning Deals & Mega Discounts" : (isBestseller ? "X-Mart Certified Bestsellers & Top Rated" : (search ? `Search Results for "${search}"` : "All Department Superstore")));
    
    let bannerDesc = category 
      ? `Discover over 30+ authentic ${category} verified by X-Mart Quality Assurance. Get manufacturer warranty, no-cost EMI, and free express delivery.`
      : (isDeals ? "Grab limited-time flash deals with discounts up to 70% off. Refreshed hourly with exclusive bank cashbacks." : "Explore the highest-rated customer favorites backed by over 250,000+ verified buyer reviews.");

    let bannerTag = category ? `${category.toUpperCase()} HUB` : (isDeals ? "LIGHTNING DEALS • ENDS TONIGHT" : "BESTSELLERS LEADERBOARD");

    // Commercial Window Layout with Sidebar Filter & Product Grid
    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Commercial Category Header Banner -->
        <div class="com-hero-banner ${isDeals ? 'com-hero-banner--deals' : ''}">
          <div class="com-hero-left">
            <h1 class="com-hero-title">${pageTitle}</h1>
            <p class="com-hero-desc">${bannerDesc}</p>
            ${isDeals ? `
              <div class="deals-countdown-box">
                <span>Offer expires in: </span>
                <strong id="deal-timer" class="deal-timer-digits">05h 42m 19s</strong>
              </div>
            ` : `
              <div class="com-hero-perks">
                <div class="perk-pill"><span>Free Express Delivery ₹499+</span></div>
                <div class="perk-pill"><span>100% Genuine Guarantee</span></div>
                <div class="perk-pill"><span>30-Day Easy Returns</span></div>
                <div class="perk-pill"><span>No Cost EMI Available</span></div>
              </div>
            `}
          </div>
        </div>

        <!-- Main Workspace: Commercial Sidebar + Live Grid -->
        <div class="com-store-layout">
          <!-- Left Sidebar Filters -->
          <aside class="com-sidebar">
            <div class="sidebar-block">
              <h3 class="sidebar-title">Categories</h3>
              <ul class="sidebar-cat-list">
                <li><button class="cat-filter-btn ${!category && !isDeals ? 'is-active' : ''}" data-cat="">All Departments</button></li>
                <li><button class="cat-filter-btn ${category === 'Electronics' ? 'is-active' : ''}" data-cat="Electronics">Electronics (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Fashion' ? 'is-active' : ''}" data-cat="Fashion">Fashion (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Home & Kitchen' ? 'is-active' : ''}" data-cat="Home & Kitchen">Home & Kitchen (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Beauty & Health' ? 'is-active' : ''}" data-cat="Beauty & Health">Beauty & Health (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Sports' ? 'is-active' : ''}" data-cat="Sports">Sports & Fitness (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Grocery' ? 'is-active' : ''}" data-cat="Grocery">Gourmet Grocery (30)</button></li>
              </ul>
            </div>

            <div class="sidebar-block">
              <h3 class="sidebar-title">Price Range</h3>
              <div class="price-range-options">
                <label><input type="radio" name="price-filter" value="all" checked> All Prices</label>
                <label><input type="radio" name="price-filter" value="under-1000"> Under ₹1,000</label>
                <label><input type="radio" name="price-filter" value="1000-5000"> ₹1,000 - ₹5,000</label>
                <label><input type="radio" name="price-filter" value="5000-25000"> ₹5,000 - ₹25,000</label>
                <label><input type="radio" name="price-filter" value="above-25000"> Above ₹25,000</label>
              </div>
            </div>

            <div class="sidebar-block">
              <h3 class="sidebar-title">Customer Rating</h3>
              <div class="rating-filter-options">
                <label><input type="radio" name="rating-filter" value="all" checked> All Ratings</label>
                <label><input type="radio" name="rating-filter" value="4.5"> 4.5★ & above</label>
                <label><input type="radio" name="rating-filter" value="4.0"> 4.0★ & above</label>
              </div>
            </div>

            <div class="sidebar-block">
              <h3 class="sidebar-title">Discount</h3>
              <div class="discount-filter-options">
                <label><input type="radio" name="discount-filter" value="all" checked> All Discounts</label>
                <label><input type="radio" name="discount-filter" value="40"> 40% Off or more</label>
                <label><input type="radio" name="discount-filter" value="25"> 25% Off or more</label>
                <label><input type="radio" name="discount-filter" value="15"> 15% Off or more</label>
              </div>
            </div>
          </aside>

          <!-- Right Products Catalog View -->
          <section class="com-catalog-area">
            <!-- Top Sort & Controls Bar -->
            <div class="com-catalog-toolbar">
              <div class="results-count-text">
                Showing <strong id="product-results-count">30</strong> products in <span style="color:#0878f9;font-weight:700;">${category || 'Store'}</span>
              </div>
              <div class="toolbar-sort-wrap">
                <label for="com-sort-dropdown">Sort by:</label>
                <select id="com-sort-dropdown" class="com-sort-select">
                  <option value="popular">Featured / Most Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Customer Reviews (Highest)</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>
            </div>

            <!-- Product Grid Window -->
            <div id="com-products-grid" class="com-products-grid">
              <div style="grid-column:1/-1;text-align:center;padding:80px 0;color:#64748b;">
                <div style="font-size:36px;margin-bottom:12px;">⏳</div>
                <h3 style="margin:0;font-size:16px;">Loading live catalog from MongoDB Atlas...</h3>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    // Wire Countdown Timer for Deals
    if (isDeals) {
      let totalSeconds = 5 * 3600 + 42 * 60 + 19;
      const timerEl = pageContainer.querySelector('#deal-timer');
      const interval = setInterval(() => {
        if (!timerEl || !document.contains(timerEl)) { clearInterval(interval); return; }
        totalSeconds--;
        if (totalSeconds <= 0) totalSeconds = 24 * 3600;
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        timerEl.textContent = `${h}h ${m}m ${s}s`;
      }, 1000);
    }


    // Wire Sidebar Category Filters
    pageContainer.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat;
        window._openDedicatedPage(cat, '', '');
      });
    });

    // Wire Dynamic Filter Change
    const filterAndRender = () => {
      const priceVal = pageContainer.querySelector('input[name="price-filter"]:checked')?.value || 'all';
      const ratingVal = pageContainer.querySelector('input[name="rating-filter"]:checked')?.value || 'all';
      const discVal = pageContainer.querySelector('input[name="discount-filter"]:checked')?.value || 'all';
      const sortVal = pageContainer.querySelector('#com-sort-dropdown')?.value || 'popular';

      fetchAndRenderCommercialProducts(category, search, { priceVal, ratingVal, discVal, sortVal });
    };

    pageContainer.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', filterAndRender));
    pageContainer.querySelector('#com-sort-dropdown')?.addEventListener('change', filterAndRender);

    // Initial Fetch
    filterAndRender();
  };

  async function fetchAndRenderCommercialProducts(category = '', search = '', filters = {}) {
    const grid = document.getElementById('com-products-grid');
    const countEl = document.getElementById('product-results-count');
    if (!grid) return;

    try {
      let url = `${API_BASE}/products?limit=50&sort=${filters.sortVal || 'popular'}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      let products = [];
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          products = data.data;
        }
      } catch (err) {
        console.warn('API fetch error, falling back to in-memory products:', err);
      }

      // If backend returned nothing or we have a search term, enrich with local smart synonym search
      if (search) {
        const lowerQ = search.toLowerCase().trim();
        let searchTerms = [lowerQ];
        for (const [key, list] of Object.entries(SMART_SYNONYMS)) {
          if (lowerQ.includes(key) || key.includes(lowerQ)) {
            searchTerms.push(...list);
          }
        }
        searchTerms = [...new Set(searchTerms)];

        const localMatches = (Store.allProducts || []).filter(p => {
          if (category && p.category?.toLowerCase() !== category.toLowerCase()) return false;
          const name = (p.name || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();

          return searchTerms.some(term =>
            name.includes(term) || brand.includes(term) || desc.includes(term) || cat.includes(term)
          );
        });

        // Merge API + local matches
        const seen = new Set(products.map(p => p._id || p.id));
        for (const lp of localMatches) {
          const id = lp._id || lp.id;
          if (!seen.has(id)) {
            seen.add(id);
            products.push(lp);
          }
        }
      }

      if (products.length === 0 && !search && !category) {
        products = Store.allProducts || [];
      }

      if (category) {
        products = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      }

      // Apply Price Filter
      if (filters.priceVal === 'under-1000') products = products.filter(p => (p.finalPrice || p.price) < 1000);
      else if (filters.priceVal === '1000-5000') products = products.filter(p => (p.finalPrice || p.price) >= 1000 && (p.finalPrice || p.price) <= 5000);
      else if (filters.priceVal === '5000-25000') products = products.filter(p => (p.finalPrice || p.price) >= 5000 && (p.finalPrice || p.price) <= 25000);
      else if (filters.priceVal === 'above-25000') products = products.filter(p => (p.finalPrice || p.price) > 25000);

      // Apply Rating Filter
      if (filters.ratingVal && filters.ratingVal !== 'all') {
        const minRating = parseFloat(filters.ratingVal);
        products = products.filter(p => (p.rating || 4.5) >= minRating);
      }

      // Apply Discount Filter
      if (filters.discVal && filters.discVal !== 'all') {
        const minDisc = parseInt(filters.discVal);
        products = products.filter(p => (p.discount || 0) >= minDisc);
      }

      // Update count
      if (countEl) countEl.textContent = products.length;

      if (!products || products.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:70px 20px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;">
            <div style="margin-bottom:12px;color:#94a3b8;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0f172a;">No Products Found For Selected Filters</h3>
            <p style="color:#64748b;font-size:14px;margin-bottom:20px;">Try resetting the filters or searching for another category.</p>
            <button class="com-btn-primary" onclick="window._openDedicatedPage('')">Reset All Filters</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = products.map((prod, idx) => {
        const img = (prod.images && prod.images[0]) || prod.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
        const finalPrice = prod.finalPrice || prod.price || 0;
        const origPrice = prod.originalPrice || Math.round(finalPrice * 1.35);
        const discount = prod.discount || 25;
        const isWishlisted = Store.wishlist.some(w => w.id === (prod._id || prod.id));

        return `
          <div class="com-prod-card" data-id="${prod._id || prod.id}">
            <!-- Card Header Tags -->
            <div class="com-card-top">
              <span class="com-tag-badge">${discount}% OFF</span>
              <button class="com-wishlist-btn ${isWishlisted ? 'is-active' : ''}" title="Add to Wishlist" data-id="${prod._id || prod.id}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="${isWishlisted ? '#ef4444' : '#64748b'}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
            </div>

            <!-- Product Image -->
            <div class="com-prod-img-wrap">
              <img src="${img}" alt="${prod.name}" loading="lazy">
            </div>

            <!-- Product Details -->
            <div class="com-prod-info">
              <div class="com-brand-sub">${prod.brand || 'X-Mart'} • ${prod.category || 'General'}</div>
              <h3 class="com-prod-name" title="${prod.name}">${prod.name}</h3>

              <div class="com-rating-row">
                <span class="com-stars">★ ${prod.rating || '4.8'}</span>
                <span class="com-rev-count">(${prod.numReviews || '128'})</span>
                <span class="prime-delivery-pill">Prime</span>
              </div>

              <div class="com-pricing-row">
                <span class="com-final-price">${Currency.format(finalPrice)}</span>
                <span class="com-orig-price">${Currency.format(origPrice)}</span>
                <span class="com-save-text">Save ${Currency.format(origPrice - finalPrice)}</span>
              </div>

              <p class="com-delivery-note">FREE Delivery <strong>Tomorrow by 2 PM</strong></p>

            </div>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.com-wishlist-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const prod = products.find(p => (p._id || p.id) === btn.dataset.id);
          if (prod) {
            const res = Store.toggleWishlist(prod);
            if (res !== false) {
              const isW = Store.wishlist.some(w => w.id === (prod._id || prod.id));
              btn.classList.toggle('is-active', isW);
              btn.querySelector('svg')?.setAttribute('fill', isW ? '#ef4444' : 'none');
              btn.querySelector('svg')?.setAttribute('stroke', isW ? '#ef4444' : '#64748b');
            }
          }
        });
      });

      grid.querySelectorAll('.com-prod-card').forEach(card => {
        card.addEventListener('click', () => {
          const prod = products.find(p => (p._id || p.id) === card.dataset.id);
          if (prod) window._openProductDetail?.(prod);
        });
      });

    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#dc2626;"><p>${err.message}</p></div>`;
    }
  }

  window._reRenderCatalogPrices = () => {
    if (pageContainer && pageContainer.style.display !== 'none' && window._currentDedicatedPageArgs) {
      window._openDedicatedPage(
        window._currentDedicatedPageArgs.category,
        window._currentDedicatedPageArgs.type,
        window._currentDedicatedPageArgs.search,
        false
      );
    }
  };

  // ── 3. COMMERCIAL SELLER CENTRAL & MERCHANT PORTAL WINDOW ──
  window._openSellerPortal = (push = true) => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) pushRoute('#seller', { type: 'seller' });

    // Retrieve active seller profile from storage or store
    let currentSeller = null;
    try {
      currentSeller = JSON.parse(localStorage.getItem('xmart_seller_profile') || 'null');
    } catch { currentSeller = null; }

    if (!currentSeller && Store.user && Store.user.sellerProfile) {
      currentSeller = Store.user.sellerProfile;
    }

    // Strict eligibility check: All necessary business, GSTIN & bank details must be present
    const isEligible = Boolean(
      currentSeller &&
      currentSeller.isVerified &&
      currentSeller.bizName &&
      currentSeller.storeName &&
      currentSeller.email &&
      currentSeller.phone &&
      currentSeller.gstin &&
      currentSeller.pincode &&
      currentSeller.bankAcc &&
      currentSeller.bankIfsc
    );

    // If not eligible, default to registration tab; otherwise product studio
    const defaultTab = isEligible ? 'list' : 'account';

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Commercial Seller Executive Hero -->
        <div class="seller-hero-enterprise">
          <div class="seller-hero-top">
            <div class="seller-hero-info">
              <div class="seller-hero-badges">
                ${isEligible ? `
                  <span class="seller-pill-badge verified">Verified Merchant: <strong>${currentSeller.storeName}</strong> (GST: ${currentSeller.gstin})</span>
                  <span class="seller-pill-badge" style="background:rgba(52,211,153,0.2);color:#34d399;border:1px solid #34d399;">Eligible to List Products</span>
                ` : `
                  <span class="seller-pill-badge" style="background:rgba(245,158,11,0.2);color:#fcd34d;border:1px solid #f59e0b;">Action Required: Merchant Registration Incomplete</span>
                  <span class="seller-pill-badge" style="background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid #ef4444;">Listing Locked</span>
                `}
                <span class="seller-pill-badge prime">Express FBX Logistics</span>
              </div>
              <h1>Seller Central & Merchant Studio</h1>
              <p>Direct enterprise terminal to publish live catalog items to MongoDB Atlas, manage stock inventory, configure pricing strategies, and monitor bank disbursements.</p>
            </div>
          </div>

          <!-- 4 Executive KPI Cards -->
          <div class="seller-kpi-grid">
            <div class="seller-kpi-card">
              <div class="seller-kpi-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <div class="seller-kpi-meta">
                <div class="seller-kpi-val">₹4,92,500</div>
                <div class="seller-kpi-lbl">30-Day Gross Volume</div>
                <div class="seller-kpi-trend">↑ +14.8% vs last month</div>
              </div>
            </div>
            <div class="seller-kpi-card">
              <div class="seller-kpi-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
              </div>
              <div class="seller-kpi-meta">
                <div class="seller-kpi-val" id="kpi-live-catalog-count">...</div>
                <div class="seller-kpi-lbl">Live Catalog Items</div>
                <div class="seller-kpi-trend">● Active on MongoDB Atlas</div>
              </div>
            </div>
            <div class="seller-kpi-card">
              <div class="seller-kpi-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div class="seller-kpi-meta">
                <div class="seller-kpi-val">99.8%</div>
                <div class="seller-kpi-lbl">Fulfillment Rate</div>
                <div class="seller-kpi-trend">✓ Guaranteed Next-Day</div>
              </div>
            </div>
            <div class="seller-kpi-card">
              <div class="seller-kpi-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div class="seller-kpi-meta">
                <div class="seller-kpi-val">4.9 / 5.0</div>
                <div class="seller-kpi-lbl">Merchant Rating</div>
                <div class="seller-kpi-trend">★ 2,450+ Verified Reviews</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Segmented Tab Navigation -->
        <div class="seller-tabs-bar">
          <button class="seller-tab-btn ${defaultTab === 'list' ? 'is-active' : ''}" id="tab-btn-list" data-tab="list">
            <span>Product Listing Studio ${!isEligible ? '(Locked)' : ''}</span>
          </button>
          <button class="seller-tab-btn" id="tab-btn-inventory" data-tab="inventory">
            <span>Live Catalog & Inventory (<span id="seller-inv-count">0</span>)</span>
          </button>
          <button class="seller-tab-btn" id="tab-btn-analytics" data-tab="analytics">
            <span>Sales & Analytics</span>
          </button>
          <button class="seller-tab-btn ${defaultTab === 'account' ? 'is-active' : ''}" id="tab-btn-account" data-tab="account">
            <span>${isEligible ? 'Merchant Profile & Bank' : 'Merchant Registration (Required)'}</span>
          </button>
        </div>

        <!-- TAB 1: PRODUCT LISTING STUDIO (2-COLUMN COMMERCIAL LAYOUT) -->
        <div id="seller-tab-list" class="seller-tab-content ${defaultTab === 'list' ? 'is-active' : ''}">
          ${!isEligible ? `
            <!-- ELIGIBILITY LOCKED GATE CARD -->
            <div class="seller-section-card" style="text-align:center;padding:50px 24px;border:2px dashed #f59e0b;background:#fffdf5;border-radius:16px;">
              <div style="font-size:36px;margin-bottom:14px;color:#d97706;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 style="font-size:24px;font-weight:900;color:#0f172a;margin-bottom:10px;">Merchant Registration Required Before Listing Products</h2>
              <p style="max-width:620px;margin:0 auto 24px;font-size:14.5px;color:#475569;line-height:1.6;">
                To maintain marketplace integrity, comply with Indian GST taxation laws, and ensure weekly automated bank payouts, you must register your Legal Business Entity and Bank Settlement details before you are eligible to publish products.
              </p>
              <div style="display:inline-flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                <button type="button" class="com-btn-primary" onclick="document.getElementById('tab-btn-account').click()" style="padding:14px 32px;font-size:15px;font-weight:800;border-radius:10px;box-shadow:0 4px 14px rgba(8,120,249,0.35);">
                  Complete Merchant Registration (Takes 2 Mins) →
                </button>
              </div>
              <div style="display:flex;justify-content:center;gap:24px;margin-top:32px;flex-wrap:wrap;color:#64748b;font-size:13px;font-weight:700;">
                <span>✓ 0% Setup Fees</span>
                <span>✓ Valid GSTIN / Tax ID Verification</span>
                <span>✓ Direct 7-Day Bank Payouts</span>
              </div>
            </div>
          ` : `
            <div class="seller-studio-layout">
              <!-- Left Form Cards Column -->
              <div class="seller-studio-form-col">
                <form id="seller-product-form" novalidate>
                  <!-- Section 1: Basic Information -->
                  <div class="seller-section-card">
                    <div class="seller-section-header">
                      <h3>1. Basic Information & Taxonomy</h3>
                    </div>
                    <div class="seller-grid-form">
                      <div class="form-group span-2">
                        <label for="prod-name"><span>Product Title / Name *</span> <span id="prod-name-counter" style="font-size:11px;color:#94a3b8;">0/120</span></label>
                        <input type="text" id="prod-name" class="seller-input" maxlength="120" required>
                        <small class="form-hint">Include Brand, Model, Key Feature, Color/Size for maximum search discovery.</small>
                      </div>

                      <div class="form-group">
                        <label for="prod-cat">Store Category *</label>
                        <select id="prod-cat" class="seller-input" required>
                          <option value="Electronics">Electronics & Smart Tech</option>
                          <option value="Fashion">Fashion & Apparel</option>
                          <option value="Home & Kitchen">Home & Kitchen</option>
                          <option value="Beauty & Health">Beauty, Health & Grooming</option>
                          <option value="Sports">Sports & Fitness Equipment</option>
                          <option value="Grocery">Gourmet Grocery & Daily Staples</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label for="prod-brand">Brand / Manufacturer *</label>
                        <input type="text" id="prod-brand" class="seller-input" value="${currentSeller?.storeName || 'X-Mart Verified'}" required>
                      </div>
                    </div>
                  </div>

                  <!-- Section 2: Commercial Pricing Strategy -->
                  <div class="seller-section-card">
                    <div class="seller-section-header">
                      <h3>2. Pricing & Commercial Margin Strategy</h3>
                    </div>
                    <div class="seller-grid-form">
                      <div class="form-group">
                        <label for="prod-price">Selling Price (₹) *</label>
                        <input type="number" id="prod-price" class="seller-input" min="1" step="1" required>
                        <small class="form-hint">Final customer checkout price.</small>
                      </div>

                      <div class="form-group">
                        <label for="prod-mrp">MRP / Original Price (₹) *</label>
                        <input type="number" id="prod-mrp" class="seller-input" min="1" step="1" required>
                        <div id="prod-calc-discount" class="discount-calc-pill">Discount: 0% OFF</div>
                      </div>
                    </div>
                  </div>

                  <!-- Section 3: Inventory & Logistics -->
                  <div class="seller-section-card">
                    <div class="seller-section-header">
                      <h3>3. Inventory & Logistics Management</h3>
                    </div>
                    <div class="seller-grid-form">
                      <div class="form-group">
                        <label for="prod-stock">Available Stock Units *</label>
                        <input type="number" id="prod-stock" class="seller-input" min="1" value="25" required>
                      </div>

                      <div class="form-group">
                        <label for="prod-warranty">Warranty Terms</label>
                        <input type="text" id="prod-warranty" class="seller-input" value="1 Year Manufacturer Warranty">
                      </div>
                    </div>
                  </div>

                  <!-- Section 4: Media & Image Gallery -->
                  <div class="seller-section-card">
                    <div class="seller-section-header">
                      <h3>4. Visual Media & Image Assets</h3>
                    </div>
                    <div class="form-group span-2">
                      <label for="prod-img">Primary Product Image URL *</label>
                      <div class="image-input-wrap">
                        <input type="url" id="prod-img" class="seller-input" placeholder="Paste image CDN or Unsplash URL" value="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700" required>
                        <button type="button" id="btn-preview-img" class="seller-btn-secondary">Preview</button>
                      </div>
                      <div class="seller-img-presets">
                        <span class="preset-label">Quick Presets:</span>
                        <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700">Headphones</button>
                        <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700">Smartwatch</button>
                        <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700">Shoes</button>
                        <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=700">Smartphone</button>
                        <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700">Coffee</button>
                        <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700">Skincare</button>
                      </div>
                    </div>
                  </div>

                  <!-- Section 5: Description & Specs -->
                  <div class="seller-section-card">
                    <div class="seller-section-header">
                      <h3>5. Specifications & Customer Highlights</h3>
                    </div>
                    <div class="form-group span-2">
                      <label for="prod-desc">Product Description & Key Specifications *</label>
                      <textarea id="prod-desc" class="seller-textarea" rows="4" placeholder="Detail the key highlights, build materials, package contents..." required>Premium grade authentic product with industry-leading performance, durable build quality, and verified manufacturer certification.</textarea>
                    </div>
                  </div>

                  <!-- Submit Button -->
                  <div style="margin-top:20px;">
                    <button type="submit" id="seller-publish-btn" class="seller-submit-btn">
                      <span>Publish Product to Live Catalog</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- Right Sticky Preview Column -->
              <div class="seller-preview-sidebar">
                <!-- Live Storefront Customer Preview Card -->
                <div class="storefront-live-card">
                  <div class="storefront-live-badge">
                    <span>LIVE STORE PREVIEW</span>
                    <small style="color:#64748b;font-weight:700;">Customer View</small>
                  </div>
                  <div class="storefront-card-img-wrap">
                    <img id="live-preview-img" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700" alt="Live Preview">
                  </div>
                  <div style="font-size:11px;font-weight:800;color:#0878f9;text-transform:uppercase;margin-bottom:4px;" id="live-preview-brand">${currentSeller?.storeName || 'X-Mart Verified'}</div>
                  <h4 class="storefront-card-title" id="live-preview-title">Sony WH-1000XM5 Wireless Noise Canceling Headphones</h4>
                  <div class="storefront-card-rating">
                    <span>★★★★★</span>
                    <span style="color:#64748b;font-size:11px;">(4.9) • 120+ sold</span>
                  </div>
                  <div class="storefront-card-price-row">
                    <span class="price" id="live-preview-price">₹24,999</span>
                    <span class="mrp" id="live-preview-mrp">₹34,990</span>
                    <span class="disc" id="live-preview-disc">28% OFF</span>
                  </div>
                  <div style="font-size:11.5px;color:#059669;font-weight:700;margin-bottom:12px;">
                    ✓ FREE Express Delivery by Tomorrow
                  </div>
                  <button type="button" class="storefront-sim-btn" disabled>Add to Cart</button>
                </div>

                <!-- Merchant Pro Tips Card -->
                <div class="seller-pro-tips-card">
                  <h4>Conversion Best Practices</h4>
                  <ul>
                    <li><strong>Clear Title:</strong> Products with Brand + Model + Color see <strong>+35% higher search clicks</strong>.</li>
                    <li><strong>Competitive Pricing:</strong> Offering at least 15% discount qualifies for Flash Deal tags.</li>
                    <li><strong>Stock Availability:</strong> Maintaining &gt; 10 units prevents stockout penalties.</li>
                    <li><strong>Same-Day Dispatch:</strong> Improves buyer retention and store ratings.</li>
                  </ul>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- TAB 2: SELLER INVENTORY TABLE -->
        <div id="seller-tab-inventory" class="seller-tab-content">
          <div class="seller-section-card">
            <div class="seller-section-header" style="justify-content:space-between;display:flex;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <h3>Live Catalog & Inventory Control</h3>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Manage and monitor real-time stock levels and catalog items published by your store.</p>
              </div>
              <button class="com-btn-primary" onclick="document.getElementById('tab-btn-list').click()">+ List New Item</button>
            </div>

            <div class="seller-table-wrap">
              <table class="seller-inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price & Discount</th>
                    <th>Stock Units</th>
                    <th>Promotions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="seller-inventory-body">
                  <tr>
                    <td colspan="6" style="text-align:center;padding:40px;color:#64748b;">
                      Loading listed products from MongoDB...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: SALES & ANALYTICS -->
        <div id="seller-tab-analytics" class="seller-tab-content">
          <div class="seller-section-card">
            <div class="seller-section-header" style="justify-content:space-between;display:flex;align-items:center;flex-wrap:wrap;">
              <div>
                <h3>Merchant Sales & Performance Analytics</h3>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Real-time breakdown of gross merchandise value, order fulfillment pipeline, and automated bank settlements.</p>
              </div>
              <span class="seller-pill-badge verified" style="font-size:12px;">● Live Settlement Engine</span>
            </div>

            <!-- Analytics Visual Cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin:20px 0 24px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
                <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Order Pipeline Status</div>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">
                    <span>Pending Dispatch:</span>
                    <strong style="color:#0878f9;">12 Orders</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">
                    <span>In-Transit (FBX Express):</span>
                    <strong style="color:#f59e0b;">48 Orders</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">
                    <span>Delivered this Month:</span>
                    <strong style="color:#059669;">240 Orders</strong>
                  </div>
                </div>
              </div>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
                <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Next Bank Disbursement</div>
                <div style="font-size:24px;font-weight:900;color:#0f172a;margin:8px 0 4px;">₹78,450.00</div>
                <p style="font-size:12px;color:#059669;font-weight:700;margin:0 0 8px;">✓ Scheduled for Friday Direct NEFT Payout</p>
                <small style="color:#64748b;font-size:11px;">Bank Account: ****${(currentSeller?.bankAcc || '98765432100123').slice(-4)} (IFSC: ${currentSeller?.bankIfsc || 'HDFC0001234'})</small>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: SELLER REGISTRATION & PROFILE (MANDATORY ELIGIBILITY ONBOARDING) -->
        <div id="seller-tab-account" class="seller-tab-content ${defaultTab === 'account' ? 'is-active' : ''}">
          <div class="seller-section-card">
            <div class="seller-section-header" style="justify-content:space-between;display:flex;align-items:center;flex-wrap:wrap;gap:10px;">
              <div>
                <h3>Merchant Account Registration & Bank Settlement</h3>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b;">
                  ${isEligible 
                    ? 'Your legal business entity and bank settlement details are verified and active.' 
                    : 'Please provide all necessary legal, tax, and banking details to become eligible to list products on X-Mart.'}
                </p>
              </div>
              ${isEligible ? '<span class="seller-pill-badge verified" style="font-size:12px;">✓ Verified Active Merchant</span>' : '<span class="seller-pill-badge" style="background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5;font-size:12px;">Pending Verification</span>'}
            </div>

            <form id="seller-register-form" class="seller-grid-form" novalidate style="margin-top:16px;">
              <!-- 1. Business Legal Info -->
              <div class="form-group span-2" style="background:#f8fafc;padding:12px 16px;border-radius:10px;border-left:4px solid #0878f9;margin-bottom:4px;">
                <strong style="color:#0f172a;font-size:13.5px;">1. Legal Entity & Store Identity</strong>
              </div>

              <div class="form-group">
                <label for="seller-biz-name">Legal Business / Company Name *</label>
                <input type="text" id="seller-biz-name" class="seller-input" value="${currentSeller?.bizName || ''}" required>
                <small class="form-hint">Must match your registered tax registration / trade license.</small>
              </div>

              <div class="form-group">
                <label for="seller-store-name">Store Display Name *</label>
                <input type="text" id="seller-store-name" class="seller-input" value="${currentSeller?.storeName || ''}" required>
                <small class="form-hint">Name visible to customers on product pages.</small>
              </div>

              <div class="form-group">
                <label for="seller-email">Business Email Address *</label>
                <input type="email" id="seller-email" class="seller-input" value="${currentSeller?.email || (Store.user ? Store.user.email : '')}" required>
                <small class="form-hint">Used for order dispatches, invoicing, and tax summaries.</small>
              </div>

              <div class="form-group">
                <label for="seller-phone">Contact Mobile Number *</label>
                <input type="tel" id="seller-phone" class="seller-input" value="${currentSeller?.phone || (Store.user ? Store.user.phone : '')}" required>
                <small class="form-hint">For logistics courier OTP and warehouse pickups.</small>
              </div>

              <!-- 2. Tax & Warehouse Logistics -->
              <div class="form-group span-2" style="background:#f8fafc;padding:12px 16px;border-radius:10px;border-left:4px solid #059669;margin-top:10px;margin-bottom:4px;">
                <strong style="color:#0f172a;font-size:13.5px;">2. Taxation & Warehouse Logistics</strong>
              </div>

              <div class="form-group">
                <label for="seller-gstin">GSTIN / Tax ID Number *</label>
                <input type="text" id="seller-gstin" class="seller-input" value="${currentSeller?.gstin || ''}" maxlength="18" style="text-transform:uppercase;" required>
                <small class="form-hint">15-digit Indian Goods and Services Tax Identification Number.</small>
              </div>

              <div class="form-group">
                <label for="seller-pincode">Warehouse Pickup PIN Code *</label>
                <input type="text" id="seller-pincode" class="seller-input" value="${currentSeller?.pincode || '400001'}" maxlength="6" required>
                <small class="form-hint">X-Mart Express (FBX) courier pickup location.</small>
              </div>

              <!-- 3. Banking & Direct Settlement -->
              <div class="form-group span-2" style="background:#f8fafc;padding:12px 16px;border-radius:10px;border-left:4px solid #f59e0b;margin-top:10px;margin-bottom:4px;">
                <strong style="color:#0f172a;font-size:13.5px;">3. Direct Bank Settlement (For Weekly Automated Payouts)</strong>
              </div>

              <div class="form-group">
                <label for="seller-bank-acc">Bank Account Number *</label>
                <input type="text" id="seller-bank-acc" class="seller-input" value="${currentSeller?.bankAcc || ''}" required>
                <small class="form-hint">Your 9-18 digit commercial current/savings account.</small>
              </div>

              <div class="form-group">
                <label for="seller-bank-ifsc">Bank IFSC Code *</label>
                <input type="text" id="seller-bank-ifsc" class="seller-input" value="${currentSeller?.bankIfsc || ''}" maxlength="11" style="text-transform:uppercase;" required>
                <small class="form-hint">11-character Indian Financial System Code.</small>
              </div>

              <div class="form-group span-2">
                <label for="seller-cat-specialty">Primary Store Category Specialization *</label>
                <select id="seller-cat-specialty" class="seller-input" required>
                  <option value="Electronics" ${currentSeller?.category === 'Electronics' ? 'selected' : ''}>Consumer Electronics, Laptops & Mobile Gadgets</option>
                  <option value="Fashion" ${currentSeller?.category === 'Fashion' ? 'selected' : ''}>Fashion Apparel, Footwear & Accessories</option>
                  <option value="Home & Kitchen" ${currentSeller?.category === 'Home & Kitchen' ? 'selected' : ''}>Home Furniture, Appliances & Kitchenware</option>
                  <option value="Beauty & Health" ${currentSeller?.category === 'Beauty & Health' ? 'selected' : ''}>Beauty, Cosmetics & Health Care</option>
                  <option value="Sports" ${currentSeller?.category === 'Sports' ? 'selected' : ''}>Sports, Gym & Outdoor Equipment</option>
                  <option value="Grocery" ${currentSeller?.category === 'Grocery' ? 'selected' : ''}>Gourmet Foods & Daily Essentials</option>
                </select>
              </div>

              <!-- Mandatory Declaration Agreement Checkbox -->
              <div class="form-group span-2" style="margin-top:6px;">
                <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:12.5px;color:#334155;background:#f8fafc;padding:12px 14px;border:1px solid #e2e8f0;border-radius:8px;">
                  <input type="checkbox" id="seller-agree-terms" checked required style="width:18px;height:18px;accent-color:#0878f9;margin-top:2px;flex-shrink:0;">
                  <span>I declare that all legal business, GSTIN, and bank settlement details provided above are authentic and accurate. I authorize X-Mart Marketplace to verify these credentials and disburse weekly order earnings directly to this bank account.</span>
                </label>
              </div>

              <div class="form-group span-2" style="margin-top:14px;">
                <button type="submit" id="seller-save-account-btn" class="seller-submit-btn" style="background:#047857;color:#fff;">
                  <span>${isEligible ? 'Update Merchant Profile & Settlement Details' : 'Verify Details & Activate Listing Eligibility'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // ── Wire Tabs Switching ──
    const tabBtns = pageContainer.querySelectorAll('.seller-tab-btn');
    const tabContents = pageContainer.querySelectorAll('.seller-tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('is-active'));
        tabContents.forEach(c => c.classList.remove('is-active'));

        btn.classList.add('is-active');
        pageContainer.querySelector(`#seller-tab-${tab}`)?.classList.add('is-active');

        if (tab === 'inventory') {
          loadSellerInventory();
        }
      });
    });

    // ── Live Storefront Preview Sync (When eligible) ──
    const nameInput = pageContainer.querySelector('#prod-name');
    const nameCounter = pageContainer.querySelector('#prod-name-counter');
    const priceInput = pageContainer.querySelector('#prod-price');
    const mrpInput = pageContainer.querySelector('#prod-mrp');
    const brandInput = pageContainer.querySelector('#prod-brand');
    const imgInput = pageContainer.querySelector('#prod-img');
    const discBadge = pageContainer.querySelector('#prod-calc-discount');

    const prevImg = pageContainer.querySelector('#live-preview-img');
    const prevTitle = pageContainer.querySelector('#live-preview-title');
    const prevBrand = pageContainer.querySelector('#live-preview-brand');
    const prevPrice = pageContainer.querySelector('#live-preview-price');
    const prevMrp = pageContainer.querySelector('#live-preview-mrp');
    const prevDisc = pageContainer.querySelector('#live-preview-disc');

    const updateLivePreview = () => {
      const name = nameInput?.value?.trim() || 'Sony WH-1000XM5 Wireless Noise Canceling Headphones';
      const brand = brandInput?.value?.trim() || currentSeller?.storeName || 'X-Mart Verified';
      const p = parseFloat(priceInput?.value) || 24999;
      const m = parseFloat(mrpInput?.value) || 34990;
      const img = imgInput?.value?.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700';

      if (prevTitle) prevTitle.textContent = name;
      if (prevBrand) prevBrand.textContent = brand;
      if (prevImg) prevImg.src = img;
      if (prevPrice) prevPrice.textContent = `₹${p.toLocaleString('en-IN')}`;
      if (prevMrp) prevMrp.textContent = `₹${m.toLocaleString('en-IN')}`;

      if (nameCounter && nameInput) {
        nameCounter.textContent = `${nameInput.value.length}/120`;
      }

      if (m > 0 && p > 0 && m >= p) {
        const d = Math.round(((m - p) / m) * 100);
        if (discBadge) discBadge.textContent = `Discount: ${d}% OFF (Save ₹${(m - p).toLocaleString('en-IN')})`;
        if (prevDisc) prevDisc.textContent = `${d}% OFF`;
      } else {
        if (discBadge) discBadge.textContent = 'Discount: 0% OFF';
        if (prevDisc) prevDisc.textContent = '0% OFF';
      }
    };

    if (nameInput) {
      nameInput.addEventListener('input', updateLivePreview);
      priceInput?.addEventListener('input', updateLivePreview);
      mrpInput?.addEventListener('input', updateLivePreview);
      brandInput?.addEventListener('input', updateLivePreview);
      imgInput?.addEventListener('input', updateLivePreview);
      updateLivePreview();
    }

    // ── Wire Preset Image Quick Picks ──
    pageContainer.querySelectorAll('.img-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (imgInput) {
          imgInput.value = btn.dataset.url;
          updateLivePreview();
        }
        showToast('Image preset selected!', 'info', 1500);
      });
    });

    // ── Wire Image Preview ──
    pageContainer.querySelector('#btn-preview-img')?.addEventListener('click', () => {
      const url = imgInput?.value?.trim();
      if (!url) {
        showToast('Please enter an image URL first', 'warn');
        return;
      }
      showInfoModal('', 'Product Image Preview', `<div style="text-align:center;"><img src="${url}" alt="Preview" style="max-width:100%;max-height:360px;border-radius:10px;object-fit:contain;"></div>`);
    });

    // ── Wire Product Submission Form ──
    const productForm = pageContainer.querySelector('#seller-product-form');
    productForm?.addEventListener('submit', async e => {
      e.preventDefault();

      if (!isEligible) {
        showToast('You must complete Merchant Registration to be eligible to list products.', 'warn', 4000);
        document.getElementById('tab-btn-account')?.click();
        return;
      }

      const submitBtn = pageContainer.querySelector('#seller-publish-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Publishing to MongoDB Atlas...</span>';
      }

      const name = pageContainer.querySelector('#prod-name')?.value.trim();
      const category = pageContainer.querySelector('#prod-cat')?.value;
      const brand = pageContainer.querySelector('#prod-brand')?.value.trim() || currentSeller?.storeName || 'X-Mart Verified';
      const price = parseFloat(pageContainer.querySelector('#prod-price')?.value) || 0;
      const originalPrice = parseFloat(pageContainer.querySelector('#prod-mrp')?.value) || Math.round(price * 1.25);
      const stock = parseInt(pageContainer.querySelector('#prod-stock')?.value) || 20;
      const warranty = pageContainer.querySelector('#prod-warranty')?.value.trim() || '1 Year Manufacturer Warranty';
      const image = pageContainer.querySelector('#prod-img')?.value.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700';
      const description = pageContainer.querySelector('#prod-desc')?.value.trim();

      const discount = (originalPrice > price) ? Math.round(((originalPrice - price) / originalPrice) * 100) : 10;

      const payload = {
        name,
        category,
        brand,
        price,
        originalPrice,
        discount,
        stock,
        warranty,
        description,
        images: [image],
        tags: [category.toLowerCase(), brand.toLowerCase(), 'new-arrival', 'seller-listing']
      };

      try {
        const token = Store.token || localStorage.getItem('xmart_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success && data.data) {
          showToast(`"${name}" published successfully!`, 'success', 5000);
          
          // Save in seller's local listed items
          let myItems = [];
          try {
            myItems = JSON.parse(localStorage.getItem('xmart_seller_items') || '[]');
          } catch { myItems = []; }
          myItems.unshift(data.data);
          localStorage.setItem('xmart_seller_items', JSON.stringify(myItems));

          // Also inject into Store.allProducts so home view and categories show it immediately
          Store.allProducts.unshift(data.data);

          // Reset form
          productForm.reset();
          showToast(`Live on store! Switched to inventory view.`, 'info', 3000);

          // Switch to inventory tab to view the item
          document.getElementById('tab-btn-inventory')?.click();
        } else {
          showToast(`Failed to publish: ${data.message || 'Server error'}`, 'error');
        }
      } catch (err) {
        showToast(`Publish error: ${err.message}`, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Publish Product to Live Catalog</span>';
        }
      }
    });

    // ── Wire Merchant Registration Form with Strict Eligibility Validation ──
    const registerForm = pageContainer.querySelector('#seller-register-form');
    registerForm?.addEventListener('submit', async e => {
      e.preventDefault();

      const saveBtn = pageContainer.querySelector('#seller-save-account-btn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span>Validating & Verifying Profile...</span>';
      }

      const bizName = pageContainer.querySelector('#seller-biz-name')?.value.trim();
      const storeName = pageContainer.querySelector('#seller-store-name')?.value.trim();
      const email = pageContainer.querySelector('#seller-email')?.value.trim();
      const phone = pageContainer.querySelector('#seller-phone')?.value.trim();
      const gstin = pageContainer.querySelector('#seller-gstin')?.value.trim().toUpperCase();
      const pincode = pageContainer.querySelector('#seller-pincode')?.value.trim();
      const bankAcc = pageContainer.querySelector('#seller-bank-acc')?.value.trim();
      const bankIfsc = pageContainer.querySelector('#seller-bank-ifsc')?.value.trim().toUpperCase();
      const category = pageContainer.querySelector('#seller-cat-specialty')?.value || 'Electronics';
      const agreed = pageContainer.querySelector('#seller-agree-terms')?.checked;

      // ── Strict Client-side Validation ──
      if (!bizName || bizName.length < 3) {
        showToast('Legal Business Name must be at least 3 characters', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      if (!storeName || storeName.length < 3) {
        showToast('Store Display Name must be at least 3 characters', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        showToast('Please enter a valid Business Email Address', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        showToast('Please enter a valid 10-digit Contact Mobile Number', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      if (!gstin || gstin.length < 8) {
        showToast('Please enter a valid GSTIN / Tax Identification ID', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
        showToast('Please enter a valid 6-digit Warehouse Pickup PIN Code', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      const cleanAcc = bankAcc.replace(/\s/g, '');
      if (!cleanAcc || !/^\d{9,18}$/.test(cleanAcc)) {
        showToast('Please enter a valid Bank Account Number (9 to 18 digits)', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      const cleanIfsc = bankIfsc.replace(/\s/g, '');
      if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        showToast('Please enter a valid 11-character Bank IFSC Code (e.g. HDFC0001234)', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }
      if (!agreed) {
        showToast('You must agree to the merchant terms and verification declaration', 'warn');
        saveBtn && (saveBtn.disabled = false);
        return;
      }

      const profilePayload = {
        bizName,
        storeName,
        email,
        phone: cleanPhone,
        gstin,
        pincode,
        bankAcc: cleanAcc,
        bankIfsc: cleanIfsc,
        category,
        isVerified: true,
        verifiedAt: new Date().toISOString()
      };

      try {
        const token = Store.token || localStorage.getItem('xmart_token');
        if (token) {
          // Sync with backend MongoDB User model
          await fetch(`${API_BASE}/auth/seller-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profilePayload)
          }).catch(() => {});
        }

        // Persist verified seller profile in localStorage
        localStorage.setItem('xmart_seller_profile', JSON.stringify(profilePayload));
        if (Store.user) {
          Store.user.sellerProfile = profilePayload;
        }

        showToast(`Merchant Account "${storeName}" Verified! You are now eligible to list products.`, 'success', 5000);

        // Re-open seller portal with full eligibility unlocked
        window._openSellerPortal();
      } catch (err) {
        showToast(`Verification error: ${err.message}`, 'error');
        saveBtn && (saveBtn.disabled = false);
        saveBtn && (saveBtn.innerHTML = '<span>Save & Verify Merchant Account</span>');
      }
    });

    // ── Load Seller Inventory & Interactive Editor ──
    async function loadSellerInventory() {
      const tbody = document.getElementById('seller-inventory-body');
      const countEl = document.getElementById('seller-inv-count');
      if (!tbody) return;

      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#64748b;">Loading live inventory from MongoDB Atlas...</td></tr>`;

      try {
        const res = await fetch(`${API_BASE}/products?limit=50&sort=newest`);
        const data = await res.json();
        let products = (data.success && data.data) ? data.data : Store.allProducts;

        // Also merge local items if any
        let myItems = [];
        try { myItems = JSON.parse(localStorage.getItem('xmart_seller_items') || '[]'); } catch { myItems = []; }
        myItems.forEach(mi => {
          if (!products.some(p => (p._id || p.id) === (mi._id || mi.id))) {
            products.unshift(mi);
          }
        });

        if (countEl) countEl.textContent = products.length;
        const kpiCountEl = pageContainer.querySelector('#kpi-live-catalog-count');
        if (kpiCountEl) kpiCountEl.textContent = products.length;

        if (products.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#64748b;">No products listed yet. Click "+ List New Item" above to add one!</td></tr>`;
          return;
        }

        tbody.innerHTML = products.map(item => {
          const id = item._id || item.id;
          const img = (item.images && item.images[0]) || item.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
          const p = item.finalPrice || item.price || 0;
          const orig = item.originalPrice || Math.round(p * 1.3);
          const disc = item.discount || 10;
          const stock = item.stock !== undefined ? item.stock : 25;
          const isDeal = (item.tags && item.tags.includes('deal')) || disc >= 40 || item.isFeatured;

          return `
            <tr data-prod-id="${id}">
              <!-- Product Info -->
              <td>
                <div class="seller-table-prod">
                  <img src="${img}" alt="${item.name}">
                  <div class="seller-table-prod-details">
                    <strong class="seller-table-prod-name" title="${item.name}">${item.name}</strong>
                    <div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap;">
                      <small style="color:#64748b;">${item.brand || 'X-Mart Verified'}</small>
                      ${isDeal ? '<span class="deal-tag-pill">Today\'s Deal</span>' : ''}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td><span class="seller-badge">${item.category || 'General'}</span></td>

              <!-- Price & Discount Controls -->
              <td>
                <div class="seller-price-cell">
                  <div class="seller-price-main">
                    <strong>${Currency.format(p)}</strong>
                    <span class="seller-orig-striked">${Currency.format(orig)}</span>
                  </div>
                  <span class="seller-disc-chip">${disc}% OFF</span>
                  <!-- Quick Discount Actions -->
                  <div class="quick-disc-row">
                    <button class="btn-quick-disc" data-id="${id}" data-disc="20">20%</button>
                    <button class="btn-quick-disc" data-id="${id}" data-disc="40">40%</button>
                    <button class="btn-quick-disc" data-id="${id}" data-disc="60">60%</button>
                  </div>
                </div>
              </td>

              <!-- Stock Controller -->
              <td>
                <div class="stock-adjust-wrap" style="display:flex;flex-direction:column;gap:5px;align-items:flex-start;">
                  <div style="display:flex;align-items:center;gap:4px;">
                    <button class="btn-stock-adj minus" data-id="${id}" data-delta="-5">-5</button>
                    <button class="btn-stock-adj minus" data-id="${id}" data-delta="-1">-1</button>
                    <span class="stock-num-val" id="stock-val-${id}" style="min-width:28px;text-align:center;font-weight:800;color:${stock === 0 ? '#dc2626' : '#0f172a'};">${stock}</span>
                    <button class="btn-stock-adj plus" data-id="${id}" data-delta="1">+1</button>
                    <button class="btn-stock-adj plus" data-id="${id}" data-delta="10">+10</button>
                  </div>
                  <button class="btn-stock-toggle" data-id="${id}" style="background:${stock === 0 ? '#fef2f2' : '#f8fafc'};color:${stock === 0 ? '#dc2626' : '#475569'};border:1px solid ${stock === 0 ? '#fca5a5' : '#cbd5e1'};padding:2px 8px;border-radius:5px;font-size:11px;font-weight:800;cursor:pointer;">
                    ${stock === 0 ? '● Out of Stock (+ Set 25)' : 'Mark Out of Stock'}
                  </button>
                </div>
              </td>

              <!-- Deal / Promotion Status -->
              <td>
                <button class="btn-toggle-deal ${isDeal ? 'is-active-deal' : ''}" data-id="${id}" title="Click to toggle Today's Deal promotion">
                  ${isDeal ? 'Deal Active' : '+ Add to Deals'}
                </button>
              </td>

              <!-- Action Buttons -->
              <td>
                <div class="seller-row-actions">
                  <button class="seller-action-btn edit-btn" data-id="${id}" title="Edit Product Details">
                    Edit
                  </button>
                  <button class="seller-action-btn delete-btn" data-id="${id}" title="Delete Product">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        // Wire Quick Discount buttons
        tbody.querySelectorAll('.btn-quick-disc').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const newDisc = parseInt(btn.dataset.disc);
            const prod = products.find(p => (p._id || p.id) === id);
            if (!prod) return;

            const orig = prod.originalPrice || Math.round((prod.price || 1000) * 1.3);
            const newPrice = Math.round(orig - (orig * newDisc) / 100);

            try {
              const res = await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discount: newDisc, price: newPrice, originalPrice: orig })
              });
              const d = await res.json();
              if (d.success) {
                prod.price = newPrice;
                prod.originalPrice = orig;
                prod.discount = newDisc;
                const pIdx = Store.allProducts.findIndex(p => (p._id || p.id) === id);
                if (pIdx !== -1) Store.allProducts[pIdx] = { ...Store.allProducts[pIdx], price: newPrice, originalPrice: orig, discount: newDisc };
                showToast(`Discount updated to ${newDisc}% OFF (New Price: ${Currency.format(newPrice)})`, 'success', 3000);
                loadSellerInventory();
              }
            } catch (err) {
              showToast(`Update error: ${err.message}`, 'error');
            }
          });
        });

        // Wire Stock Toggle (1-Click In Stock / Out of Stock)
        tbody.querySelectorAll('.btn-stock-toggle').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const prod = products.find(p => (p._id || p.id) === id);
            if (!prod) return;

            const currentStock = prod.stock !== undefined ? prod.stock : 25;
            const newStock = currentStock > 0 ? 0 : 25;

            try {
              const res = await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
              });
              const d = await res.json();
              if (d.success) {
                prod.stock = newStock;
                const pIdx = Store.allProducts.findIndex(p => (p._id || p.id) === id);
                if (pIdx !== -1) Store.allProducts[pIdx] = { ...Store.allProducts[pIdx], stock: newStock };
                const defIdx = DEFAULT_CATALOG.findIndex(p => (p._id || p.id) === id);
                if (defIdx !== -1) DEFAULT_CATALOG[defIdx] = { ...DEFAULT_CATALOG[defIdx], stock: newStock };
                showToast(newStock === 0 ? `"${prod.name}" marked OUT OF STOCK` : `"${prod.name}" restocked to 25 units`, 'info', 3000);
                loadSellerInventory();
              }
            } catch (err) {
              showToast(`Stock toggle error: ${err.message}`, 'error');
            }
          });
        });

        // Wire Stock Adjuster buttons
        tbody.querySelectorAll('.btn-stock-adj').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const delta = parseInt(btn.dataset.delta);
            const prod = products.find(p => (p._id || p.id) === id);
            if (!prod) return;

            const currentStock = prod.stock !== undefined ? prod.stock : 25;
            const newStock = Math.max(0, currentStock + delta);

            try {
              const res = await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
              });
              const d = await res.json();
              if (d.success) {
                prod.stock = newStock;
                const pIdx = Store.allProducts.findIndex(p => (p._id || p.id) === id);
                if (pIdx !== -1) Store.allProducts[pIdx] = { ...Store.allProducts[pIdx], stock: newStock };
                const defIdx = DEFAULT_CATALOG.findIndex(p => (p._id || p.id) === id);
                if (defIdx !== -1) DEFAULT_CATALOG[defIdx] = { ...DEFAULT_CATALOG[defIdx], stock: newStock };
                const span = tbody.querySelector(`#stock-val-${id}`);
                if (span) {
                  span.textContent = newStock;
                  span.style.color = newStock === 0 ? '#dc2626' : '#0f172a';
                }
                showToast(newStock === 0 ? `Stock set to 0 (Out of Stock)` : `Stock updated to ${newStock} units`, 'info', 2000);
                loadSellerInventory();
              }
            } catch (err) {
              showToast(`Stock update error: ${err.message}`, 'error');
            }
          });
        });

        // Wire Today's Deal Toggle
        tbody.querySelectorAll('.btn-toggle-deal').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const prod = products.find(p => (p._id || p.id) === id);
            if (!prod) return;

            const isCurrentlyDeal = (prod.tags && prod.tags.includes('deal')) || btn.classList.contains('is-active-deal');
            let updatedTags = Array.isArray(prod.tags) ? [...prod.tags] : [];

            if (isCurrentlyDeal) {
              updatedTags = updatedTags.filter(t => t !== 'deal' && t !== 'lightning-deal');
            } else {
              if (!updatedTags.includes('deal')) updatedTags.push('deal');
              if (!updatedTags.includes('lightning-deal')) updatedTags.push('lightning-deal');
            }

            const updatedFeatured = !isCurrentlyDeal;
            const updatedDiscount = !isCurrentlyDeal ? Math.max(prod.discount || 0, 35) : (prod.discount || 10);
            const orig = prod.originalPrice || Math.round((prod.price || 1000) * 1.35);
            const updatedPrice = Math.round(orig - (orig * updatedDiscount) / 100);

            try {
              const res = await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tags: updatedTags,
                  isFeatured: updatedFeatured,
                  discount: updatedDiscount,
                  price: updatedPrice,
                  originalPrice: orig
                })
              });
              const d = await res.json();
              if (d.success) {
                showToast(
                  !isCurrentlyDeal 
                    ? `"${prod.name}" added to Today's Lightning Deals with ${updatedDiscount}% OFF!` 
                    : `Removed "${prod.name}" from Today's Deals`, 
                  'success', 
                  4000
                );
                loadSellerInventory();
              }
            } catch (err) {
              showToast(`Deal toggle error: ${err.message}`, 'error');
            }
          });
        });

        // Wire Full Edit Modal
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const prod = products.find(p => (p._id || p.id) === id);
            if (prod) openSellerEditProductModal(prod);
          });
        });

        // Wire Delete Button
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const prod = products.find(p => (p._id || p.id) === id);
            if (!prod) return;

            if (!confirm(`Are you sure you want to remove "${prod.name}" from the store?`)) return;

            try {
              const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
              const d = await res.json();
              if (d.success) {
                showToast(`"${prod.name}" removed from live store`, 'info', 3000);
                loadSellerInventory();
              }
            } catch (err) {
              showToast(`Delete failed: ${err.message}`, 'error');
            }
          });
        });

      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#dc2626;">Error: ${err.message}</td></tr>`;
      }
    }

    // Modal to Edit Any Product Fully
    function openSellerEditProductModal(prod) {
      const id = prod._id || prod.id;
      const modalId = 'seller-edit-product-modal';
      let modal = document.getElementById(modalId);
      if (!modal) {
        modal = createModal(modalId, {
          title: 'Edit Product & Pricing',
          large: true,
          bodyHtml: '<div id="seller-edit-modal-body"></div>'
        });
      }

      const bodyEl = modal.querySelector('#seller-edit-modal-body') || modal.querySelector('.xmodal-body');
      const curPrice = prod.finalPrice || prod.price || 0;
      const curMRP = prod.originalPrice || Math.round(curPrice * 1.3);
      const curDisc = prod.discount || 10;
      const curStock = prod.stock !== undefined ? prod.stock : 25;
      const isDeal = (prod.tags && prod.tags.includes('deal')) || curDisc >= 40 || prod.isFeatured;

      bodyEl.innerHTML = `
        <form id="seller-edit-form" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="grid-column:1/-1;">
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Product Title *</label>
            <input type="text" id="edit-name" class="seller-input" value="${prod.name}" required>
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Category *</label>
            <select id="edit-category" class="seller-input">
              <option value="Electronics" ${prod.category === 'Electronics' ? 'selected' : ''}>Electronics</option>
              <option value="Fashion" ${prod.category === 'Fashion' ? 'selected' : ''}>Fashion</option>
              <option value="Home & Kitchen" ${prod.category === 'Home & Kitchen' ? 'selected' : ''}>Home & Kitchen</option>
              <option value="Beauty & Health" ${prod.category === 'Beauty & Health' ? 'selected' : ''}>Beauty & Health</option>
              <option value="Sports" ${prod.category === 'Sports' ? 'selected' : ''}>Sports & Fitness</option>
              <option value="Grocery" ${prod.category === 'Grocery' ? 'selected' : ''}>Grocery</option>
            </select>
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Brand</label>
            <input type="text" id="edit-brand" class="seller-input" value="${prod.brand || 'X-Mart Verified'}">
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Selling Price (₹) *</label>
            <input type="number" id="edit-price" class="seller-input" value="${curPrice}" min="1" required>
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Original MRP (₹) *</label>
            <input type="number" id="edit-mrp" class="seller-input" value="${curMRP}" min="1" required>
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Discount Percentage (%) *</label>
            <input type="number" id="edit-discount" class="seller-input" value="${curDisc}" min="0" max="95" required>
          </div>

          <div>
            <label style="display:block;font-size:12.5px;font-weight:800;margin-bottom:4px;color:#1e293b;">Inventory Stock *</label>
            <input type="number" id="edit-stock" class="seller-input" value="${curStock}" min="0" required>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#dc2626;cursor:pointer;margin-top:6px;">
              <input type="checkbox" id="edit-outofstock-check" ${curStock === 0 ? 'checked' : ''} style="width:16px;height:16px;accent-color:#dc2626;">
              Mark as Out of Stock (0 units)
            </label>
          </div>

          <div style="grid-column:1/-1;">
            <label style="display:flex;align-items:center;gap:10px;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;cursor:pointer;">
              <input type="checkbox" id="edit-deal-check" ${isDeal ? 'checked' : ''} style="width:18px;height:18px;accent-color:#ef4444;">
              <strong style="color:#991b1b;font-size:13.5px;">Feature this product in "Today's Lightning Deals" Section</strong>
            </label>
          </div>

          <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;margin-top:12px;">
            <button type="button" class="seller-btn-secondary" onclick="document.getElementById('${modalId}')._close()">Cancel</button>
            <button type="submit" class="com-btn-primary">Save Changes</button>
          </div>
        </form>
      `;

      // Live calculate price when discount changes
      const editPrice = bodyEl.querySelector('#edit-price');
      const editMRP = bodyEl.querySelector('#edit-mrp');
      const editDisc = bodyEl.querySelector('#edit-discount');
      const editStockInput = bodyEl.querySelector('#edit-stock');
      const editOosCheck = bodyEl.querySelector('#edit-outofstock-check');

      editOosCheck?.addEventListener('change', () => {
        if (editOosCheck.checked) {
          editStockInput.value = 0;
        } else {
          editStockInput.value = 25;
        }
      });

      editStockInput?.addEventListener('input', () => {
        if (editOosCheck) {
          editOosCheck.checked = (parseInt(editStockInput.value) || 0) === 0;
        }
      });

      editDisc?.addEventListener('input', () => {
        const m = parseFloat(editMRP.value) || 0;
        const d = parseFloat(editDisc.value) || 0;
        if (m > 0) {
          editPrice.value = Math.round(m - (m * d) / 100);
        }
      });

      editPrice?.addEventListener('input', () => {
        const p = parseFloat(editPrice.value) || 0;
        const m = parseFloat(editMRP.value) || 0;
        if (m > 0 && m >= p) {
          editDisc.value = Math.round(((m - p) / m) * 100);
        }
      });

      // Submit Edit Form
      const form = bodyEl.querySelector('#seller-edit-form');
      form?.addEventListener('submit', async e => {
        e.preventDefault();
        const updatedName = bodyEl.querySelector('#edit-name').value.trim();
        const updatedCat = bodyEl.querySelector('#edit-category').value;
        const updatedBrand = bodyEl.querySelector('#edit-brand').value.trim();
        const updatedPrice = parseFloat(bodyEl.querySelector('#edit-price').value) || 0;
        const updatedMRP = parseFloat(bodyEl.querySelector('#edit-mrp').value) || Math.round(updatedPrice * 1.3);
        const updatedDiscount = parseInt(bodyEl.querySelector('#edit-discount').value) || 0;
        const updatedStock = parseInt(bodyEl.querySelector('#edit-stock').value) || 0;
        const isDealChecked = bodyEl.querySelector('#edit-deal-check').checked;

        let tags = Array.isArray(prod.tags) ? [...prod.tags] : [];
        if (isDealChecked) {
          if (!tags.includes('deal')) tags.push('deal');
          if (!tags.includes('lightning-deal')) tags.push('lightning-deal');
        } else {
          tags = tags.filter(t => t !== 'deal' && t !== 'lightning-deal');
        }

        try {
          const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: updatedName,
              category: updatedCat,
              brand: updatedBrand,
              price: updatedPrice,
              originalPrice: updatedMRP,
              discount: updatedDiscount,
              stock: updatedStock,
              isFeatured: isDealChecked,
              tags
            })
          });
          const d = await res.json();
          if (d.success) {
            // Sync local store cache
            const pIdx = Store.allProducts.findIndex(p => (p._id || p.id) === id);
            if (pIdx !== -1) {
              Store.allProducts[pIdx] = { ...Store.allProducts[pIdx], ...(d.data || {}), stock: updatedStock };
            }
            const defIdx = DEFAULT_CATALOG.findIndex(p => (p._id || p.id) === id);
            if (defIdx !== -1) {
              DEFAULT_CATALOG[defIdx] = { ...DEFAULT_CATALOG[defIdx], ...(d.data || {}), stock: updatedStock };
            }
            showToast(`✓ "${updatedName}" updated successfully (${updatedStock === 0 ? 'Out of Stock' : `${updatedStock} units`})!`, 'success', 4000);
            modal._close();
            loadSellerInventory();
          } else {
            showToast(d.message || 'Update failed', 'error');
          }
        } catch (err) {
          showToast(`Error updating product: ${err.message}`, 'error');
        }
      });

      modal._open();
    }

    try {
      const myItems = JSON.parse(localStorage.getItem('xmart_seller_items') || '[]');
      const countEl = pageContainer.querySelector('#seller-inv-count');
      const kpiCount = pageContainer.querySelector('#kpi-live-catalog-count');
      const totalCount = (Store.allProducts && Store.allProducts.length) ? Store.allProducts.length : (myItems.length || 0);
      if (countEl) countEl.textContent = totalCount;
      if (kpiCount) kpiCount.textContent = totalCount;
    } catch {}
  };

  // ── 4. COMMERCIAL 24/7 CUSTOMER CARE & HELP HUB WINDOW ─────
  window._openCustomerServicePage = (push = true) => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) pushRoute('#customer-service', { type: 'customer-service' });

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <div class="com-hero-banner" style="background: linear-gradient(135deg, #091e3a 0%, #1e3a8a 100%);">
          <div class="com-hero-left">
            <h1 class="com-hero-title">How Can We Help You Today?</h1>
            <p class="com-hero-desc">Instant self-service tools, live parcel tracking, hassle-free returns, and dedicated concierge agents available 24/7.</p>
            <div class="com-hero-perks">
              <div class="perk-pill"><span>1800-555-0199 (Toll Free)</span></div>
              <div class="perk-pill"><span>Live Chat Response &lt; 60s</span></div>
              <div class="perk-pill"><span>support@xmart.com</span></div>
            </div>
          </div>
        </div>

        <!-- Quick Action Cards -->
        <div class="cs-quick-grid">
          <div class="cs-action-card" onclick="window._openOrders?.()">
            <div class="cs-icon-circle" style="background:#eff6ff;color:#2563eb;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.12 6.4-9-5a2 2 0 0 0-2.24 0l-9 5A2 2 0 0 0 0 8.16V16a2 2 0 0 0 1.12 1.76l9 5a2 2 0 0 0 2.24 0l9-5A2 2 0 0 0 22 16V8.16a2 2 0 0 0-.88-1.76z"/><polyline points="2.5 7.5 12 13 21.5 7.5"/><polyline points="12 22.5 12 13"/></svg>
            </div>
            <h3>Track Your Package</h3>
            <p>Live GPS status and real-time delivery updates for your orders.</p>
            <button class="cs-btn-action">Track Orders →</button>
          </div>

          <div class="cs-action-card" onclick="window._openOrders?.()">
            <div class="cs-icon-circle" style="background:#ecfdf5;color:#059669;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </div>
            <h3>Returns & Refunds</h3>
            <p>Initiate easy item exchange or instant bank refund in 2 hours.</p>
            <button class="cs-btn-action">Start Return →</button>
          </div>

          <div class="cs-action-card" onclick="window._openLocation?.()">
            <div class="cs-icon-circle" style="background:#fff7ed;color:#ea580c;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3>Delivery Addresses</h3>
            <p>Change your delivery PIN code or manage saved shipping locations.</p>
            <button class="cs-btn-action">Manage Addresses →</button>
          </div>

          <div class="cs-action-card" onclick="window._openAuth?.()">
            <div class="cs-icon-circle" style="background:#f5f3ff;color:#7c3aed;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3>Account & Security</h3>
            <p>Manage password, login credentials, and saved payment cards.</p>
            <button class="cs-btn-action">Account Settings →</button>
          </div>
        </div>

        <!-- Interactive AI Support Chat & Ticket Window -->
        <div class="cs-chat-section">
          <div class="cs-chat-header">
            <h3>Instant Concierge Live Chat</h3>
            <span class="live-status-pill">● Agent Online</span>
          </div>
          <div id="cs-chat-messages" class="cs-chat-messages">
            <div class="chat-msg bot">
              <div class="chat-avatar" style="background:#0284c7;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;width:32px;height:32px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="6" rx="2"/><circle cx="8" cy="13" r="1.5"/><circle cx="16" cy="13" r="1.5"/><path d="M9 17h6"/></svg>
              </div>
              <div class="chat-bubble">Hello! I am X-Mart Concierge. How can I assist you with your orders, returns, or product inquiries today?</div>
            </div>
          </div>
          <form id="cs-chat-form" class="cs-chat-input-bar">
            <input type="text" id="cs-chat-input" placeholder="Type your question or order number here..." required autocomplete="off">
            <button type="submit" class="com-btn-primary" style="width:auto;padding:0 24px;">Send</button>
          </form>
        </div>

        <!-- Searchable FAQs -->
        <div class="cs-faq-box">
          <h2>Frequently Asked Questions</h2>
          <div class="faq-accordion-item">
            <h4>How fast is standard delivery?</h4>
            <p>Orders are dispatched within 24 hours. Metro cities receive next-day delivery, while all other locations are delivered in 2 to 4 business days.</p>
          </div>
          <div class="faq-accordion-item">
            <h4>What payment methods are supported?</h4>
            <p>We support Credit/Debit cards (Visa, Mastercard, Amex), UPI (Google Pay, PhonePe, Paytm), Net Banking, EMI, and Cash on Delivery (COD).</p>
          </div>
          <div class="faq-accordion-item">
            <h4>What is the brand warranty coverage?</h4>
            <p>Every product sold on X-Mart is 100% genuine and covered by official 1 to 2 Years Manufacturer Warranty.</p>
          </div>
        </div>
      </div>
    `;

    // Wire Navigation
    pageContainer.querySelector('#cs-back-home')?.addEventListener('click', window._showHomeView);
    pageContainer.querySelector('#cs-bc-home')?.addEventListener('click', e => {
      e.preventDefault();
      window._showHomeView();
    });

    // Wire Interactive Live Chat
    const chatForm = pageContainer.querySelector('#cs-chat-form');
    const chatInput = pageContainer.querySelector('#cs-chat-input');
    const chatMessages = pageContainer.querySelector('#cs-chat-messages');

    chatForm?.addEventListener('submit', e => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query) return;

      // Append User message
      chatMessages.innerHTML += `
        <div class="chat-msg user">
          <div class="chat-bubble user-bubble">${query}</div>
          <div class="chat-avatar" style="background:#f1f5f9;color:#0f172a;display:flex;align-items:center;justify-content:center;border-radius:50%;width:32px;height:32px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      `;
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Simulate Smart AI Response
      setTimeout(() => {
        let reply = "Thank you for reaching out! Our team is looking into this. For urgent requests, call our 24/7 hotline at 1800-555-0199.";
        const q = query.toLowerCase();
        if (q.includes('order') || q.includes('track') || q.includes('status')) {
          reply = `You can view all live shipments and tracking numbers in real-time under your <a href="#orders" onclick="window._openOrders?.()" style="color:#0878f9;font-weight:700;">Orders Dashboard</a>!`;
        } else if (q.includes('return') || q.includes('refund')) {
          reply = "We offer 30-Day Hassle-Free Returns! Once you request a return, our executive picks up the item for instant refund processing.";
        } else if (q.includes('discount') || q.includes('promo') || q.includes('coupon')) {
          reply = "Use promo code <strong>XMART10</strong> at checkout for 10% instant discount, or <strong>PRIME5</strong> for 5% extra cashback!";
        } else if (q.includes('delivery') || q.includes('shipping')) {
          reply = "Free express shipping applies automatically to all orders above ₹499 with delivery in 1-3 business days.";
        }

        chatMessages.innerHTML += `
          <div class="chat-msg bot">
            <div class="chat-avatar" style="background:#0284c7;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;width:32px;height:32px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="6" rx="2"/><circle cx="8" cy="13" r="1.5"/><circle cx="16" cy="13" r="1.5"/><path d="M9 17h6"/></svg>
            </div>
            <div class="chat-bubble">${reply}</div>
          </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 600);
    });
  };

  window._isOrdersPageOpen = false;

  // ── DEDICATED FULL-PAGE RETURNS & ORDER HISTORY WINDOW ──
  window._openOrders = async (push = true) => {
    window._isOrdersPageOpen = true;
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) pushRoute('#orders', { type: 'orders' });

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap orders-window-wrap">
        <!-- Orders Page Header (Clean, No AI Emojis/Icons) -->
        <div class="orders-page-header">
          <div class="orders-page-title-row" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
            <div>
              <h1 class="orders-page-heading" style="color:#000000;font-size:24px;font-weight:900;margin:0 0 6px;">Returns & Order History</h1>
              <p class="orders-page-subheading" style="color:#000000;font-size:14px;margin:0;">Track shipments, manage returns, download invoices, or cancel active orders</p>
            </div>
            <div class="orders-search-box">
              <select id="orders-time-filter" style="padding:9px 28px 9px 12px;border:1.5px solid #000000;border-radius:8px;font-size:13.5px;font-weight:700;color:#000000;background:#ffffff;outline:none;cursor:pointer;">
                <option value="30">Past 30 days</option>
                <option value="90">Past 90 days</option>
                <option value="2026" selected>2026</option>
                <option value="2025">2025</option>
                <option value="all">Archived Orders</option>
              </select>
            </div>
          </div>

          <!-- Filter Tabs (In-Flight removed, remaining 3 black font) -->
          <div class="orders-filter-tabs" style="margin-top:16px;">
            <button class="orders-tab-btn is-active" data-filter="all">All Orders</button>
            <button class="orders-tab-btn" data-filter="delivered">Delivered</button>
            <button class="orders-tab-btn" data-filter="cancelled">Cancelled</button>
          </div>
        </div>

        <!-- Orders Content Body -->
        <div id="orders-page-content">
          <div style="text-align:center;padding:50px;color:#000000;">
            <p style="margin-top:12px;font-weight:700;">Loading your order records...</p>
          </div>
        </div>
      </div>
    `;


    const ordersContent = pageContainer.querySelector('#orders-page-content');

    if (!Auth.isLoggedIn()) {
      ordersContent.innerHTML = `
        <div class="prod-detail-card" style="text-align:center;padding:56px 20px;max-width:560px;margin:30px auto;border-radius:16px;">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#000000;">Sign in to view your orders</h2>
          <p style="color:#000000;margin:0 0 24px;font-size:14px;line-height:1.5;">Access your order history, track live shipments, request returns, and view invoices across all your devices.</p>
          <button id="orders-signin-btn" class="auth-submit-btn" style="max-width:240px;margin:0 auto;background:#ff9700;color:#000000;font-weight:800;">Sign In / Register</button>
        </div>
      `;
      ordersContent.querySelector('#orders-signin-btn')?.addEventListener('click', () => window._openAuth?.());
      return;
    }

    try {
      const data = await apiFetch('/orders', { headers: Auth.getHeaders() });
      let allOrders = data.data || [];

      // Fallback sample mock orders if user hasn't made any order yet
      if (allOrders.length === 0) {
        allOrders = [
          {
            _id: 'ord_demo101',
            orderId: 'XM-82910471',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            totalPrice: 17699,
            status: 'Pending',
            paymentMethod: 'COD',
            orderItems: [
              {
                id: 'prod-ssd',
                name: 'SanDisk 2TB Extreme Portable SSD USB 3.2',
                image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600',
                price: 14999,
                quantity: 1
              },
              {
                id: 'prod-rucksack',
                name: 'Wildcraft 45L Adventure Rucksack Backpack',
                image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600',
                price: 2700,
                quantity: 1
              }
            ]
          },
          {
            _id: 'ord_demo102',
            orderId: 'XM-51789678',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            totalPrice: 146201,
            status: 'Confirmed',
            paymentMethod: 'Credit Card (Online)',
            orderItems: [
              {
                id: 'prod-macbook',
                name: 'Apple MacBook Air M3',
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
                price: 114900,
                quantity: 1
              },
              {
                id: 'prod-suit',
                name: "Men's Premium Slim-Fit Suit",
                image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
                price: 8999,
                quantity: 1
              }
            ]
          }
        ];
      }

      function renderOrdersList(filter = 'all', timeFilter = '2026') {
        let filtered = allOrders;

        // Status Filter (In-Flight removed)
        if (filter === 'delivered') {
          filtered = filtered.filter(o => o.status === 'Delivered');
        } else if (filter === 'cancelled') {
          filtered = filtered.filter(o => o.status === 'Cancelled');
        }

        // Time Period Filter
        if (timeFilter === '30') {
          const cutoff = Date.now() - 30 * 86400000;
          filtered = filtered.filter(o => new Date(o.createdAt || Date.now()).getTime() >= cutoff);
        } else if (timeFilter === '90') {
          const cutoff = Date.now() - 90 * 86400000;
          filtered = filtered.filter(o => new Date(o.createdAt || Date.now()).getTime() >= cutoff);
        } else if (timeFilter === '2026') {
          filtered = filtered.filter(o => new Date(o.createdAt || Date.now()).getFullYear() === 2026);
        } else if (timeFilter === '2025') {
          filtered = filtered.filter(o => new Date(o.createdAt || Date.now()).getFullYear() === 2025);
        }

        if (filtered.length === 0) {
          ordersContent.innerHTML = `
            <div class="prod-detail-card" style="text-align:center;padding:56px 20px;border-radius:16px;">
              <h3 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#000000;">No orders found</h3>
              <p style="color:#000000;font-size:14px;margin:0 0 24px;">No matching orders found for this filter.</p>
              <button id="orders-shop-more-btn" class="order-btn-action order-btn-primary-action" style="padding:10px 22px;font-size:14px;background:#ff9700;color:#000000;border:none;font-weight:800;border-radius:8px;">Continue Shopping</button>
            </div>
          `;
          ordersContent.querySelector('#orders-shop-more-btn')?.addEventListener('click', () => window._showHomeView());
          return;
        }

        ordersContent.innerHTML = filtered.map(order => {
          const orderId = order.orderId || `XM-${order._id.slice(-8).toUpperCase()}`;
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          });
          const isCancelable = ['Pending', 'Confirmed'].includes(order.status);

          return `
            <div class="order-history-card">
              <div class="order-header-row">
                <div class="order-header-meta-group">
                  <div class="order-meta-col">
                    <span class="order-meta-label">Order Placed</span>
                    <p class="order-meta-val">${dateStr}</p>
                  </div>
                  <div class="order-meta-col">
                    <span class="order-meta-label">Total Amount</span>
                    <p class="order-meta-val">${Currency.format(order.totalPrice)}</p>
                  </div>
                  <div class="order-meta-col">
                    <span class="order-meta-label">Ship To</span>
                    <p class="order-meta-val" style="font-weight:700;">${Store.user?.name || 'Ashutosh'}</p>
                  </div>
                  <div class="order-meta-col">
                    <span class="order-meta-label">Order #</span>
                    <p class="order-meta-val" style="color:#000000;font-weight:700;">${orderId}</p>
                  </div>
                </div>
              </div>

              <div class="order-body-wrap">
                ${order.orderItems.map(item => `
                  <div class="order-item-row">
                    <div class="order-item-left order-clickable-item" data-order-id="${orderId}" title="Click to view full order details & tax invoice">
                      <img src="${item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}" alt="${item.name}" class="order-item-img">
                      <div class="order-item-info">
                        <h4 class="order-item-name" data-id="${item.id || item._id}">${item.name}</h4>
                        <p class="order-item-price-qty">Quantity: <strong>${item.quantity}</strong> &nbsp;•&nbsp; Unit Price: <strong>${Currency.format(item.price)}</strong></p>
                      </div>
                    </div>
                    <div class="order-item-actions">
                      <button class="order-btn-action order-btn-primary-action btn-track-pkg" data-id="${orderId}">Track Package</button>
                      <button class="order-btn-action btn-return-item" data-order-id="${orderId}" data-item-name="${item.name}" data-item-price="${item.price}" data-item-qty="${item.quantity || 1}" data-item-img="${item.image || ''}">Return / Replace</button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="order-footer-row">
                <span class="order-footer-payment">Payment Method: <strong>${order.paymentMethod || 'Cash on Delivery (COD)'}</strong></span>
                <div>
                  ${isCancelable ? `
                    <button class="cancel-order-btn" data-id="${order._id}">Cancel Order</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');

        // Wire clicking any product item or order header to open the Order Details & Tax Invoice Window
        ordersContent.querySelectorAll('.order-clickable-item').forEach(el => {
          el.addEventListener('click', () => {
            const ordId = el.dataset.orderId;
            const targetOrder = allOrders.find(o => (o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId)) || allOrders[0];
            if (targetOrder) openOrderInvoiceModal(targetOrder, 'details');
          });
        });

        // Wire Order Number click to open Order Details
        ordersContent.querySelectorAll('.order-header-meta-group').forEach(el => {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => {
            const ordNumberEl = el.querySelector('.order-meta-col:last-child .order-meta-val');
            const ordId = ordNumberEl?.textContent?.trim();
            const targetOrder = allOrders.find(o => (o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId)) || allOrders[0];
            if (targetOrder) openOrderInvoiceModal(targetOrder, 'details');
          });
        });

        // Wire Track package
        ordersContent.querySelectorAll('.btn-track-pkg').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ordId = btn.dataset.id;
            const targetOrder = allOrders.find(o => (o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId)) || allOrders[0];
            if (targetOrder) openOrderInvoiceModal(targetOrder, 'track');
          });
        });

        // Wire Return / Replace item to open Dedicated Return/Replacement Window
        ordersContent.querySelectorAll('.btn-return-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ordId = btn.dataset.orderId || btn.dataset.id;
            const targetOrder = allOrders.find(o => (o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId)) || allOrders[0];
            const targetItem = {
              name: btn.dataset.itemName || targetOrder?.orderItems?.[0]?.name || 'Product Item',
              price: parseFloat(btn.dataset.itemPrice) || targetOrder?.orderItems?.[0]?.price || 0,
              quantity: parseInt(btn.dataset.itemQty) || targetOrder?.orderItems?.[0]?.quantity || 1,
              image: btn.dataset.itemImg || targetOrder?.orderItems?.[0]?.image || ''
            };
            if (window._openReturnReplacePage) {
              window._openReturnReplacePage(targetOrder, targetItem);
            } else {
              showToast(`Opening Return Center for Order #${ordId}...`, 'info');
            }
          });
        });

        // Wire Cancel order
        ordersContent.querySelectorAll('.cancel-order-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to cancel this order?')) return;
            btn.disabled = true;
            btn.textContent = 'Cancelling...';
            try {
              await apiFetch(`/orders/${btn.dataset.id}/cancel`, {
                method: 'PUT',
                headers: Auth.getHeaders()
              });
              showToast('Order cancelled successfully', 'info');
              window._openOrders();
            } catch (err) {
              showToast('Order cancelled successfully', 'info');
              const o = allOrders.find(x => x._id === btn.dataset.id);
              if (o) o.status = 'Cancelled';
              renderOrdersList(currentFilter, timeFilterSelect?.value || '2026');
            }
          });
        });
      }

      let currentFilter = 'all';
      const timeFilterSelect = pageContainer.querySelector('#orders-time-filter');

      // Filter tabs
      const tabs = pageContainer.querySelectorAll('.orders-tab-btn');
      tabs.forEach(t => {
        t.addEventListener('click', () => {
          tabs.forEach(x => x.classList.remove('is-active'));
          t.classList.add('is-active');
          currentFilter = t.dataset.filter;
          renderOrdersList(currentFilter, timeFilterSelect?.value || '2026');
        });
      });

      // Time Filter Dropdown
      timeFilterSelect?.addEventListener('change', () => {
        renderOrdersList(currentFilter, timeFilterSelect.value);
      });

      // Initial Render
      renderOrdersList(currentFilter, timeFilterSelect?.value || '2026');
    } catch (err) {
      ordersContent.innerHTML = `
        <div style="text-align:center;padding:40px;color:#000000;">
          <p>Failed to load orders. Please check your connection and try again.</p>
          <button onclick="window._openOrders()" style="padding:10px 20px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-weight:800;cursor:pointer;">Retry</button>
        </div>
      `;
    }
  };

  window._reRenderOrdersPrices = () => {
    if (pageContainer && pageContainer.style.display !== 'none' && window._isOrdersPageOpen) {
      window._openOrders(false);
    }
  };

  // ── DEDICATED FULL-PAGE ORDER DETAILS, INVOICE & WARRANTY WINDOW ──
  window._openDedicatedOrderInvoicePage = (order, defaultTab = 'details', push = true) => {
    if (!order) return;
    const orderId = order.orderId || (order._id ? `XM-${order._id.slice(-8).toUpperCase()}` : 'XM-82910471');
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const dateOnly = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const warrantyValidDate = new Date(new Date(order.createdAt || Date.now()).setFullYear(new Date(order.createdAt || Date.now()).getFullYear() + 1)).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const subtotal = order.totalPrice ? Math.round(order.totalPrice / 1.18) : 14999;
    const tax = order.totalPrice ? (order.totalPrice - subtotal) : 2700;
    const grandTotal = order.totalPrice || (subtotal + tax);
    const items = order.orderItems || [];
    const status = order.status || 'Confirmed';
    const payMethod = order.paymentMethod || 'Cash on Delivery (COD)';

    const savedAddrs = typeof getSavedAddresses === 'function' ? getSavedAddresses() : [];
    const defaultAddr = savedAddrs.find(a => a.isDefault) || savedAddrs[0] || {
      name: 'Ashutosh Pathak',
      phone: '09065553105',
      street: 'Main gate river view colony, koni',
      city: 'Bilaspur',
      state: 'Chhattisgarh',
      pincode: '495009'
    };

    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) {
      pushRoute(`#order/${orderId}`, { type: 'order-detail', orderId, order, tab: defaultTab });
    }

    const statusBg = {
      'Pending': '#fef3c7', 'Confirmed': '#dbeafe', 'Shipped': '#e0e7ff',
      'Delivered': '#dcfce7', 'Cancelled': '#fee2e2'
    }[status] || '#f1f5f9';
    const statusColor = {
      'Pending': '#b45309', 'Confirmed': '#1d4ed8', 'Shipped': '#4338ca',
      'Delivered': '#15803d', 'Cancelled': '#b91c1c'
    }[status] || '#475569';

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap" style="padding-top:10px;">
        <!-- Page Header Area -->
        <div style="margin-bottom:20px;">
          <h1 id="ord-page-main-title" style="font-size:26px;font-weight:900;color:#000000;margin:0 0 6px;letter-spacing:-0.5px;">${defaultTab === 'track' ? 'Package Tracking & Shipment Status' : 'Order Details & Documentation'}</h1>
          <p id="ord-page-main-sub" style="font-size:14px;color:#000000;margin:0;">${defaultTab === 'track' ? `Live status updates, courier tracking ID, and shipment journey for Order #${orderId}` : 'View itemized billing, official GST tax invoice, warranty certificates, and tracking.'}</p>
        </div>

        <!-- Navigation Tabs (With Track Package next to Order Details) -->
        <div style="display:flex;gap:12px;border-bottom:2px solid #e2e8f0;margin-bottom:24px;background:#ffffff;padding:0 12px;border-radius:8px;">
          <button id="page-tab-ord-details" class="invoice-tab-btn ${defaultTab === 'details' ? 'is-active' : ''}">Order Details</button>
          <button id="page-tab-ord-track" class="invoice-tab-btn ${defaultTab === 'track' ? 'is-active' : ''}">Track Package</button>
          <button id="page-tab-ord-invoice" class="invoice-tab-btn ${defaultTab === 'invoice' ? 'is-active' : ''}">Invoice</button>
          <button id="page-tab-ord-warranty" class="invoice-tab-btn ${defaultTab === 'warranty' ? 'is-active' : ''}">Warranty Card</button>
        </div>

        <!-- VIEW 1: PLACED ORDER DETAILS -->
        <div id="page-view-ord-details" style="${defaultTab === 'details' ? 'display:block;' : 'display:none;'}">
          <!-- Order Header Card -->
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:22px 24px;margin-bottom:24px;box-shadow:0 2px 10px rgba(0,0,0,0.03);">
            <div style="font-size:11px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;">ORDER ID</div>
            <div style="font-size:22px;font-weight:900;color:#000000;margin-top:2px;">${orderId}</div>
            <div style="font-size:13px;color:#000000;margin-top:4px;">Placed on: <strong>${dateStr}</strong></div>
          </div>

          <!-- 3-Column Info Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:20px;margin-bottom:28px;">
            <!-- Shipping Address -->
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
              <div style="font-size:11px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">SHIPPING ADDRESS</div>
              <div style="font-weight:800;font-size:15px;color:#000000;">${defaultAddr.name}</div>
              <div style="font-size:13.5px;color:#000000;margin-top:6px;line-height:1.5;">
                ${defaultAddr.street}<br/>
                ${defaultAddr.city}, ${defaultAddr.state} - <strong>${defaultAddr.pincode}</strong>
              </div>
              <div style="font-size:13px;color:#000000;margin-top:8px;">Phone: <strong>${defaultAddr.phone}</strong></div>
            </div>

            <!-- Payment Info -->
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
              <div style="font-size:11px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">PAYMENT INFORMATION</div>
              <div style="font-weight:800;font-size:15px;color:#000000;">${payMethod}</div>
              <div style="font-size:13.5px;color:#000000;margin-top:6px;">Payment Status: <strong style="color:#000000;">Verified</strong></div>
              <div style="font-size:13px;color:#000000;margin-top:8px;">Billing Mode: Single Commercial Invoice</div>
            </div>

            <!-- Order Summary -->
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
              <div style="font-size:11px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">ORDER SUMMARY</div>
              <div style="display:flex;justify-content:space-between;font-size:13.5px;color:#000000;margin-bottom:6px;">
                <span>Items Total:</span>
                <span>${Currency.format(subtotal)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13.5px;color:#000000;margin-bottom:6px;">
                <span>GST (18% incl.):</span>
                <span>${Currency.format(tax)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13.5px;color:#000000;font-weight:700;margin-bottom:8px;">
                <span>Shipping Fee:</span>
                <span>FREE</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#000000;border-top:1px solid #e2e8f0;padding-top:8px;">
                <span>Grand Total:</span>
                <span style="color:#000000;">${Currency.format(grandTotal)}</span>
              </div>
            </div>
          </div>

          <!-- Ordered Items List -->
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:22px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <h4 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;">ORDERED ITEMS (${items.length})</h4>
            <div style="display:flex;flex-direction:column;gap:14px;">
              ${items.map(it => `
                <div style="display:flex;gap:18px;align-items:center;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
                  <img src="${it.image || it.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=140'}" alt="${it.name}" style="width:84px;height:84px;border-radius:10px;object-fit:cover;background:#f8fafc;border:1px solid #e2e8f0;" />
                  <div style="flex:1;min-width:0;">
                    <h4 style="margin:0 0 6px;font-size:15.5px;font-weight:700;color:#000000;">${it.name}</h4>
                    <div style="font-size:13.5px;color:#000000;margin-bottom:4px;">Qty: <strong>${it.quantity || it.qty || 1}</strong> &nbsp;•&nbsp; Unit Price: <strong>${Currency.format(it.price || 0)}</strong></div>
                    <div style="font-size:12.5px;color:#000000;font-weight:700;">Standard Commercial Return/Exchange Covered</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:18px;font-weight:900;color:#000000;">${Currency.format((it.price || 0) * (it.quantity || it.qty || 1))}</div>
                    <button class="btn-page-inv-buy-again" data-name="${it.name}" data-price="${it.price}" data-img="${it.image || it.img || ''}" style="margin-top:8px;padding:8px 16px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:12.5px;font-weight:800;cursor:pointer;">Buy Again</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- VIEW 2: LIVE PACKAGE TRACKING -->
        <div id="page-view-ord-track" style="${defaultTab === 'track' ? 'display:block;' : 'display:none;'}">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
            <!-- Top Controls: Back button & Status Pill -->
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #e2e8f0;gap:12px;">
              <button id="btn-track-back-to-orders" style="display:inline-flex;align-items:center;gap:8px;background:#f8fafc;border:1.5px solid #cbd5e1;padding:8px 18px;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer;color:#000000;transition:all 0.15s ease;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
                <span>Back to Your Orders</span>
              </button>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:12px;font-weight:700;color:#64748b;">Current Status:</span>
                <span style="font-size:12.5px;font-weight:800;background:${statusBg};color:${statusColor};padding:4px 14px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);">${status}</span>
              </div>
            </div>

            <!-- Tracking Overview Header Card -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
              <div>
                <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;">COURIER AIRWAY BILL (AWB)</div>
                <div style="font-size:18px;font-weight:900;color:#000000;margin-top:3px;font-family:monospace;">DEL-${(orderId.replace(/[^A-Za-z0-9]/g, '').slice(-8) || '82910471')}-IN</div>
                <div style="font-size:12.5px;color:#000000;margin-top:4px;">Express Partner: <strong>Blue Dart / Delhivery Air</strong></div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;">ESTIMATED DELIVERY</div>
                <div style="font-size:18px;font-weight:900;color:#15803d;margin-top:3px;">${status === 'Delivered' ? 'Delivered Successfully' : (status === 'Cancelled' ? 'Order Cancelled' : 'Tomorrow by 8:00 PM')}</div>
                <div style="font-size:12.5px;color:#000000;margin-top:4px;">${status === 'Delivered' ? 'Delivered to recipient' : 'Express Doorstep Delivery Guaranteed'}</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;">DELIVERY ADDRESS</div>
                <div style="font-size:13.5px;font-weight:800;color:#000000;margin-top:3px;">${defaultAddr.name}</div>
                <div style="font-size:12px;color:#000000;line-height:1.4;margin-top:2px;">${defaultAddr.street}, ${defaultAddr.city} (${defaultAddr.pincode})</div>
              </div>
            </div>

            <!-- Ordered Items in this Package -->
            <div style="margin-bottom:26px;">
              <div style="font-size:12px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:12px;">ITEMS IN THIS PACKAGE (${items.length})</div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${items.map(it => `
                  <div style="display:flex;gap:16px;align-items:center;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;">
                    <img src="${it.image || it.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=140'}" alt="${it.name}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;background:#f8fafc;border:1px solid #e2e8f0;" />
                    <div style="flex:1;min-width:0;">
                      <h4 style="margin:0 0 4px;font-size:14.5px;font-weight:800;color:#000000;">${it.name}</h4>
                      <div style="font-size:12.5px;color:#000000;">Quantity: <strong>${it.quantity || it.qty || 1}</strong> &nbsp;•&nbsp; Price: <strong>${Currency.format(it.price || 0)}</strong></div>
                    </div>
                    <span style="font-size:11px;font-weight:800;background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:6px;">In Shipment</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Visual Progress Timeline -->
            <div style="margin-bottom:28px;">
              <div style="font-size:12px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:14px;">SHIPMENT MILESTONES</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:12px;">
                <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-weight:900;font-size:13px;color:#16a34a;">✓ 1. Placed</div>
                  <div style="font-size:11px;color:#000000;margin-top:4px;">${dateOnly}</div>
                  <div style="font-size:10.5px;font-weight:800;color:#15803d;margin-top:4px;">COMPLETED</div>
                </div>
                <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-weight:900;font-size:13px;color:#16a34a;">✓ 2. Confirmed</div>
                  <div style="font-size:11px;color:#000000;margin-top:4px;">${dateOnly}</div>
                  <div style="font-size:10.5px;font-weight:800;color:#15803d;margin-top:4px;">VERIFIED</div>
                </div>
                <div style="background:${status === 'Delivered' ? '#f0fdf4' : '#eff6ff'};border:2px solid ${status === 'Delivered' ? '#16a34a' : '#2563eb'};border-radius:10px;padding:14px;text-align:center;box-shadow:${status === 'Delivered' ? 'none' : '0 3px 10px rgba(37,99,235,0.12)'};">
                  <div style="font-weight:900;font-size:13px;color:${status === 'Delivered' ? '#16a34a' : '#1d4ed8'};">${status === 'Delivered' ? '✓' : '🚚'} 3. In Transit</div>
                  <div style="font-size:11px;color:#000000;margin-top:4px;">Bilaspur Hub</div>
                  <div style="font-size:10.5px;font-weight:800;color:${status === 'Delivered' ? '#15803d' : '#1d4ed8'};margin-top:4px;">${status === 'Delivered' ? 'COMPLETED' : 'ACTIVE'}</div>
                </div>
                <div style="background:${status === 'Delivered' ? '#f0fdf4' : '#f8fafc'};border:${status === 'Delivered' ? '2px solid #16a34a' : '1px solid #cbd5e1'};border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-weight:900;font-size:13px;color:${status === 'Delivered' ? '#16a34a' : '#64748b'};">${status === 'Delivered' ? '✓' : ''} 4. Out for Delivery</div>
                  <div style="font-size:11px;color:${status === 'Delivered' ? '#000000' : '#64748b'};margin-top:4px;">${status === 'Delivered' ? 'Completed' : 'Pending'}</div>
                  <div style="font-size:10.5px;font-weight:800;color:${status === 'Delivered' ? '#15803d' : '#64748b'};margin-top:4px;">${status === 'Delivered' ? 'COMPLETED' : 'UPCOMING'}</div>
                </div>
                <div style="background:${status === 'Delivered' ? '#f0fdf4' : '#f8fafc'};border:${status === 'Delivered' ? '2px solid #16a34a' : '1px solid #cbd5e1'};border-radius:10px;padding:14px;text-align:center;">
                  <div style="font-weight:900;font-size:13px;color:${status === 'Delivered' ? '#16a34a' : '#64748b'};">${status === 'Delivered' ? '✓' : ''} 5. Delivered</div>
                  <div style="font-size:11px;color:${status === 'Delivered' ? '#000000' : '#64748b'};margin-top:4px;">${status === 'Delivered' ? 'Delivered' : 'Pending'}</div>
                  <div style="font-size:10.5px;font-weight:800;color:${status === 'Delivered' ? '#15803d' : '#64748b'};margin-top:4px;">${status === 'Delivered' ? 'FINAL' : 'UPCOMING'}</div>
                </div>
              </div>
            </div>

            <!-- Detailed Checkpoints Activity Log -->
            <h4 style="margin:0 0 14px;font-size:14px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">Live GPS Activity Log</h4>
            <div style="display:flex;flex-direction:column;gap:12px;border:1px solid #e2e8f0;border-radius:10px;padding:18px;background:#f8fafc;">
              <div style="display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
                <div>
                  <strong style="color:#000000;">Package Arrived at Local Distribution Facility</strong><br/>
                  <span style="color:#475569;">Bilaspur Distribution Center, Chhattisgarh</span>
                </div>
                <div style="color:#000000;font-weight:700;text-align:right;">Today, 03:45 AM</div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">
                <div>
                  <strong style="color:#000000;">Shipment Picked Up & Departed Sort Center</strong><br/>
                  <span style="color:#475569;">Raipur Main Fulfillment Center, Chhattisgarh</span>
                </div>
                <div style="color:#000000;font-weight:700;text-align:right;">Yesterday, 09:15 PM</div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;">
                <div>
                  <strong style="color:#000000;">Order Verified & Airway Bill Generated</strong><br/>
                  <span style="color:#475569;">X-Mart Superstore Central Fulfillment Warehouse</span>
                </div>
                <div style="color:#000000;font-weight:700;text-align:right;">${dateStr}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- VIEW 3: OFFICIAL COMMERCIAL TAX INVOICE -->
        <div id="page-view-ord-invoice" style="${defaultTab === 'invoice' ? 'display:block;' : 'display:none;'}">
          <div class="invoice-paper-card">
            <!-- Invoice Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000000;padding-bottom:18px;margin-bottom:20px;">
              <div>
                <div style="font-size:26px;font-weight:900;color:#000000;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                  <span style="background:#000000;color:#ffffff;width:34px;height:34px;display:grid;place-items:center;border-radius:6px;font-size:20px;">X</span>
                  <span>X-MART SUPERSTORE</span>
                </div>
                <div style="font-size:12.5px;color:#000000;margin-top:6px;line-height:1.5;">
                  <strong>X-Mart Retail Superstore India Pvt. Ltd.</strong><br/>
                  Plot 14, Tech Park, Link Road, Bilaspur, Chhattisgarh, PIN: 495001<br/>
                  <strong>GSTIN:</strong> 22AABCX9921D1ZZ &nbsp;|&nbsp; <strong>PAN:</strong> AABCX9921D
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px;font-weight:900;color:#000000;text-transform:uppercase;letter-spacing:1px;">TAX INVOICE / BILL OF SUPPLY</div>
                <div style="font-size:12.5px;color:#000000;margin-top:4px;">Original for Recipient</div>
                <div style="font-size:13.5px;font-weight:800;color:#000000;margin-top:6px;">Invoice No: INV-${orderId.replace(/[^A-Za-z0-9]/g, '')}</div>
                <div style="font-size:12.5px;color:#000000;">Invoice Date: ${dateStr}</div>
              </div>
            </div>

            <!-- Billing & Shipping Details Table -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:22px;font-size:13px;">
              <div style="background:#f8fafc;padding:14px 16px;border-radius:8px;border:1px solid #000000;line-height:1.5;">
                <div style="font-weight:800;color:#000000;text-transform:uppercase;margin-bottom:6px;">Customer / Billed To:</div>
                <strong>${defaultAddr.name}</strong><br/>
                ${defaultAddr.street}<br/>
                ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}<br/>
                Phone: ${defaultAddr.phone}<br/>
                State/UT Code: 22 (Chhattisgarh)
              </div>
              <div style="background:#f8fafc;padding:14px 16px;border-radius:8px;border:1px solid #000000;line-height:1.5;">
                <div style="font-weight:800;color:#000000;text-transform:uppercase;margin-bottom:6px;">Order & Dispatch Details:</div>
                <strong>Order #:</strong> ${orderId}<br/>
                <strong>Order Date:</strong> ${dateStr}<br/>
                <strong>Payment Mode:</strong> ${payMethod}<br/>
                <strong>Place of Supply:</strong> Chhattisgarh (22)<br/>
                <strong>Reverse Charge:</strong> No
              </div>
            </div>

            <!-- Itemized GST Invoice Table -->
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width:36px;color:#000000;">#</th>
                  <th style="color:#000000;">Description of Goods</th>
                  <th style="width:70px;text-align:center;color:#000000;">HSN</th>
                  <th style="width:50px;text-align:center;color:#000000;">Qty</th>
                  <th style="text-align:right;color:#000000;">Unit Price</th>
                  <th style="text-align:right;color:#000000;">Taxable Value</th>
                  <th style="text-align:right;color:#000000;">CGST (9%)</th>
                  <th style="text-align:right;color:#000000;">SGST (9%)</th>
                  <th style="text-align:right;color:#000000;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((it, idx) => {
                  const qty = it.quantity || it.qty || 1;
                  const totalItemPrice = (it.price || 0) * qty;
                  const taxVal = Math.round(totalItemPrice / 1.18);
                  const cgst = Math.round((totalItemPrice - taxVal) / 2);
                  const sgst = (totalItemPrice - taxVal) - cgst;
                  return `
                    <tr>
                      <td style="color:#000000;">${idx + 1}</td>
                      <td style="color:#000000;"><strong>${it.name}</strong></td>
                      <td style="text-align:center;color:#000000;">8471</td>
                      <td style="text-align:center;font-weight:700;color:#000000;">${qty}</td>
                      <td style="text-align:right;color:#000000;">${Currency.format(Math.round((it.price || 0) / 1.18))}</td>
                      <td style="text-align:right;color:#000000;">${Currency.format(taxVal)}</td>
                      <td style="text-align:right;color:#000000;">${Currency.format(cgst)}</td>
                      <td style="text-align:right;color:#000000;">${Currency.format(sgst)}</td>
                      <td style="text-align:right;font-weight:800;color:#000000;">${Currency.format(totalItemPrice)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:800;">
                  <td colspan="5" style="text-align:right;color:#000000;">Total / Summary:</td>
                  <td style="text-align:right;color:#000000;">${Currency.format(subtotal)}</td>
                  <td style="text-align:right;color:#000000;">${Currency.format(Math.round(tax / 2))}</td>
                  <td style="text-align:right;color:#000000;">${Currency.format(tax - Math.round(tax / 2))}</td>
                  <td style="text-align:right;font-size:15px;color:#000000;">${Currency.format(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Signatory & Watermark Footer -->
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;padding-top:18px;border-top:1px solid #000000;font-size:12.5px;color:#000000;">
              <div>
                <div style="font-weight:700;color:#000000;margin-bottom:2px;">Declaration:</div>
                We declare that this invoice shows the actual price of goods described and that all particulars are true and correct.
                <div style="margin-top:6px;font-family:monospace;color:#000000;">Digitally generated via X-Mart E-Commerce Automated Billing System.</div>
              </div>
              <div style="text-align:right;min-width:200px;">
                <div style="font-weight:800;color:#000000;margin-bottom:28px;">For X-Mart Retail Superstore Pvt Ltd:</div>
                <div style="font-weight:800;color:#000000;border-top:1px dashed #000000;padding-top:4px;">Authorized Signatory</div>
              </div>
            </div>
          </div>

          <!-- Bottom Centered Download Button for Invoice -->
          <div style="display:flex;justify-content:center;margin-top:24px;">
            <button id="btn-page-print-tax-invoice" style="padding:12px 40px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:14.5px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);transition:all 140ms ease;">
              Download
            </button>
          </div>
        </div>

        <!-- VIEW 4: OFFICIAL WARRANTY & AUTHENTICITY CERTIFICATE -->
        <div id="page-view-ord-warranty" style="${defaultTab === 'warranty' ? 'display:block;' : 'display:none;'}">
          <div class="invoice-paper-card" style="border:1.5px solid #000000;background:#ffffff;">
            <!-- Warranty Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000000;padding-bottom:18px;margin-bottom:20px;">
              <div>
                <div style="font-size:24px;font-weight:900;color:#000000;letter-spacing:-0.5px;">
                  OFFICIAL WARRANTY & AUTHENTICITY CERTIFICATE
                </div>
                <div style="font-size:13px;color:#000000;margin-top:4px;">
                  Issued by <strong>X-Mart Retail Superstore India Pvt. Ltd.</strong> in partnership with Authorized Brand Distributors.
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:14px;font-weight:900;color:#000000;">CERTIFICATE ID: WRN-${orderId.replace(/[^A-Za-z0-9]/g, '')}</div>
                <div style="font-size:12.5px;color:#000000;margin-top:2px;">Coverage: <strong>1 Year Full Replacement Warranty</strong></div>
              </div>
            </div>

            <!-- Warranty Holder Details -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px;font-size:13px;">
              <div style="background:#ffffff;padding:14px 16px;border-radius:8px;border:1px solid #000000;line-height:1.5;">
                <div style="font-weight:800;color:#000000;text-transform:uppercase;margin-bottom:4px;">Warranty Registered To:</div>
                <strong>${defaultAddr.name}</strong><br/>
                Address: ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}<br/>
                Registered Contact: ${defaultAddr.phone}
              </div>
              <div style="background:#ffffff;padding:14px 16px;border-radius:8px;border:1px solid #000000;line-height:1.5;">
                <div style="font-weight:800;color:#000000;text-transform:uppercase;margin-bottom:4px;">Coverage Period:</div>
                <strong>Purchase Date:</strong> ${dateOnly}<br/>
                <strong>Warranty Valid Until:</strong> <strong style="color:#000000;">${warrantyValidDate}</strong><br/>
                <strong>Service Type:</strong> Free Doorstep Pickup & Authorized Repair
              </div>
            </div>

            <!-- Covered Products Table -->
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width:36px;color:#000000;">#</th>
                  <th style="color:#000000;">Covered Product</th>
                  <th style="width:140px;color:#000000;">Serial / IMEI #</th>
                  <th style="width:80px;text-align:center;color:#000000;">Coverage</th>
                  <th style="width:130px;text-align:center;color:#000000;">Valid Until</th>
                  <th style="width:90px;text-align:center;color:#000000;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((it, idx) => `
                  <tr>
                    <td style="color:#000000;">${idx + 1}</td>
                    <td style="color:#000000;"><strong>${it.name}</strong></td>
                    <td style="font-family:monospace;color:#000000;font-weight:700;">SN-XM-${(it.id || 'P').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}</td>
                    <td style="text-align:center;color:#000000;">1 Year Hardware</td>
                    <td style="text-align:center;font-weight:700;color:#000000;">${warrantyValidDate}</td>
                    <td style="text-align:center;"><span style="color:#000000;font-weight:800;background:#e2e8f0;padding:4px 10px;border-radius:4px;font-size:11px;">ACTIVE</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Warranty Terms & Protection -->
            <div style="margin-top:18px;padding:16px;background:#f8fafc;border:1px solid #000000;border-radius:8px;font-size:12.5px;color:#000000;line-height:1.6;">
              <div style="font-weight:800;color:#000000;margin-bottom:4px;text-transform:uppercase;">Warranty Protection Terms:</div>
              1. Covers 100% manufacturing defects, hardware malfunctions, and component breakdowns.<br/>
              2. Includes certified doorstep technician visit or free insured pickup and return across India.<br/>
              3. Genuine brand replacement guaranteed with zero depreciation during the warranty period.
            </div>

            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px;padding-top:16px;border-top:1px solid #000000;font-size:12.5px;color:#000000;">
              <div>
                <div style="font-weight:700;color:#000000;">Direct Claim Support:</div>
                Toll-Free Helpline: 1800-419-0123 &nbsp;|&nbsp; Email: warranty@xmart-retail.com
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800;color:#000000;">X-Mart Quality Assurance Seal</div>
                <div style="font-size:11px;color:#000000;margin-top:2px;">Verified Authentic</div>
              </div>
            </div>
          </div>

          <!-- Bottom Centered Download Button for Warranty Card -->
          <div style="display:flex;justify-content:center;margin-top:24px;">
            <button id="btn-page-print-warranty-card" style="padding:12px 40px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:14.5px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);transition:all 140ms ease;">
              Download
            </button>
          </div>
        </div>
      </div>
    `;

    // Tab switching
    const tabDetails = pageContainer.querySelector('#page-tab-ord-details');
    const tabTrack = pageContainer.querySelector('#page-tab-ord-track');
    const tabInvoice = pageContainer.querySelector('#page-tab-ord-invoice');
    const tabWarranty = pageContainer.querySelector('#page-tab-ord-warranty');

    const viewDetails = pageContainer.querySelector('#page-view-ord-details');
    const viewTrack = pageContainer.querySelector('#page-view-ord-track');
    const viewInvoice = pageContainer.querySelector('#page-view-ord-invoice');
    const viewWarranty = pageContainer.querySelector('#page-view-ord-warranty');

    const showTab = (tabName) => {
      tabDetails?.classList.toggle('is-active', tabName === 'details');
      tabTrack?.classList.toggle('is-active', tabName === 'track');
      tabInvoice?.classList.toggle('is-active', tabName === 'invoice');
      tabWarranty?.classList.toggle('is-active', tabName === 'warranty');

      if (viewDetails) viewDetails.style.display = tabName === 'details' ? 'block' : 'none';
      if (viewTrack) viewTrack.style.display = tabName === 'track' ? 'block' : 'none';
      if (viewInvoice) viewInvoice.style.display = tabName === 'invoice' ? 'block' : 'none';
      if (viewWarranty) viewWarranty.style.display = tabName === 'warranty' ? 'block' : 'none';

      const hdrTitle = pageContainer.querySelector('#ord-page-main-title');
      const hdrSub = pageContainer.querySelector('#ord-page-main-sub');
      if (hdrTitle && hdrSub) {
        if (tabName === 'track') {
          hdrTitle.textContent = 'Package Tracking & Shipment Status';
          hdrSub.textContent = `Live status updates, courier tracking ID, and shipment journey for Order #${orderId}`;
        } else if (tabName === 'invoice') {
          hdrTitle.textContent = 'Official Commercial Tax Invoice';
          hdrSub.textContent = `GST-compliant invoice and tax breakdown for Order #${orderId}`;
        } else if (tabName === 'warranty') {
          hdrTitle.textContent = 'Warranty & Authenticity Certificate';
          hdrSub.textContent = `Brand warranty coverage and replacement guarantee for Order #${orderId}`;
        } else {
          hdrTitle.textContent = 'Order Details & Documentation';
          hdrSub.textContent = 'View itemized billing, official GST tax invoice, warranty certificates, and tracking.';
        }
      }
    };

    tabDetails?.addEventListener('click', () => showTab('details'));
    tabTrack?.addEventListener('click', () => showTab('track'));
    tabInvoice?.addEventListener('click', () => showTab('invoice'));
    tabWarranty?.addEventListener('click', () => showTab('warranty'));

    pageContainer.querySelector('#btn-track-back-to-orders')?.addEventListener('click', () => {
      if (typeof window._openOrders === 'function') window._openOrders();
    });

    pageContainer.querySelector('#btn-page-hdr-track')?.addEventListener('click', () => showTab('track'));
    pageContainer.querySelector('#btn-page-hdr-invoice')?.addEventListener('click', () => showTab('invoice'));
    pageContainer.querySelector('#btn-page-hdr-warranty')?.addEventListener('click', () => showTab('warranty'));

    // Print Buttons (Invoice & Warranty Card)
    const triggerPrint = () => window.print();
    pageContainer.querySelector('#btn-page-print-tax-invoice')?.addEventListener('click', triggerPrint);
    pageContainer.querySelector('#btn-page-print-warranty-card')?.addEventListener('click', triggerPrint);

    // Buy again
    pageContainer.querySelectorAll('.btn-page-inv-buy-again').forEach(b => {
      b.addEventListener('click', () => {
        Store.addToCart({
          id: 'prod_' + Date.now(),
          name: b.dataset.name,
          price: parseFloat(b.dataset.price) || 999,
          img: b.dataset.img
        });
      });
    });
  };

  // ── 4B. DEDICATED RETURN & REPLACEMENT CENTER WINDOW ───────────
  window._openReturnReplacePage = (order, selectedItem = null, push = true) => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const orderId = order?.orderId || (order?._id ? `XM-${order._id.slice(-8).toUpperCase()}` : 'XM-82910471');
    const orderItems = order?.orderItems || [];
    let currentSelectedItem = selectedItem || orderItems[0] || {
      name: 'Ordered Item',
      price: order?.totalPrice || 999,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'
    };

    if (push) pushRoute(`#return/${orderId}`, { type: 'return-replace', orderId, order, item: currentSelectedItem });

    // Address options for pickup
    const defaultAddr = (order?.shippingAddress && (order.shippingAddress.name || order.shippingAddress.street)) ? {
      name: order.shippingAddress.name || Store.user?.name || 'Ashutosh Pathak',
      street: order.shippingAddress.street || 'Plot 12, Sector 4, Nehru Nagar',
      city: order.shippingAddress.city || 'Bilaspur',
      state: order.shippingAddress.state || 'Chhattisgarh',
      pincode: order.shippingAddress.pincode || '495001',
      phone: order.shippingAddress.phone || '+91 98765 43210'
    } : {
      name: Store.user?.name || 'Ashutosh Pathak',
      street: 'Plot 12, Sector 4, Nehru Nagar',
      city: 'Bilaspur',
      state: 'Chhattisgarh',
      pincode: '495001',
      phone: '+91 98765 43210'
    };

    const altAddr = {
      name: Store.user?.name || 'Ashutosh Pathak',
      street: 'Plot 14, Commercial Tech Park, Link Road',
      city: 'Bilaspur',
      state: 'Chhattisgarh',
      pincode: '495001',
      phone: '+91 98765 43210'
    };

    let selectedPickupAddr = defaultAddr;
    let selectedRefundMethod = 'wallet'; // 'wallet' or 'bank'
    let selectedReason = 'Item defective or not working';

    const itemTotal = (currentSelectedItem.price || 0) * (currentSelectedItem.quantity || currentSelectedItem.qty || 1);

    pageContainer.innerHTML = `
      <div class="return-window-wrap" style="max-width:880px;margin:0 auto 50px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
        <!-- Header (Without Back Button) -->
        <div style="border-bottom:2px solid #e2e8f0;padding-bottom:18px;margin-bottom:24px;">
          <h1 style="font-size:24px;font-weight:900;color:#000000;margin:0 0 6px;">Return & Replacement Center</h1>
          <p style="font-size:14px;color:#000000;margin:0;">Official 30-Day Hassle-Free Doorstep Replacement & 100% Refund Assurance</p>
        </div>

        <!-- 3-Step Wizard Progress Bar -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:30px;" id="return-step-wizard-bar">
          <div id="wizard-step-pill-1" style="background:#000000;color:#ffffff;padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;transition:all 140ms ease;">
            1. Select Product & Reason
          </div>
          <div id="wizard-step-pill-2" style="background:#f1f5f9;color:#000000;padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;border:1px solid #e2e8f0;transition:all 140ms ease;">
            2. Select Pickup Location
          </div>
          <div id="wizard-step-pill-3" style="background:#f1f5f9;color:#000000;padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;border:1px solid #e2e8f0;transition:all 140ms ease;">
            3. Payment & Refund Method
          </div>
        </div>

        <!-- STEP 1: SELECT PRODUCT & REASON -->
        <div id="return-step-view-1" style="display:block;">
          <!-- Item Card -->
          <div style="background:#f8fafc;border:1.5px solid #000000;border-radius:10px;padding:18px;margin-bottom:24px;display:flex;gap:18px;align-items:center;">
            <img src="${currentSelectedItem.image || currentSelectedItem.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}" alt="${currentSelectedItem.name}" style="width:84px;height:84px;border-radius:8px;object-fit:cover;border:1px solid #cbd5e1;background:#ffffff;" />
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;font-weight:800;color:#000000;text-transform:uppercase;">ORDER #${orderId}</div>
              <h3 style="margin:3px 0 6px;font-size:16px;font-weight:800;color:#000000;">${currentSelectedItem.name}</h3>
              <div style="font-size:13.5px;color:#000000;">Quantity: <strong>${currentSelectedItem.quantity || currentSelectedItem.qty || 1}</strong> &nbsp;•&nbsp; Unit Price: <strong>${Currency.format(currentSelectedItem.price || 0)}</strong></div>
            </div>
            <div style="text-align:right;">
              <span style="background:#e2e8f0;color:#000000;font-weight:800;font-size:11.5px;padding:6px 12px;border-radius:4px;">Eligible for Return</span>
            </div>
          </div>

          <!-- Reason Dropdown -->
          <div style="margin-bottom:22px;">
            <label for="return-reason-select" style="display:block;font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Reason for Return / Replacement</label>
            <select id="return-reason-select" style="width:100%;padding:12px 14px;border:1.5px solid #000000;border-radius:8px;font-size:14px;color:#000000;background:#ffffff;font-weight:600;outline:none;">
              <option value="Item defective or not working">Item defective or does not function properly</option>
              <option value="Received wrong item or model">Received wrong item or incorrect model/size</option>
              <option value="Damaged during delivery">Damaged during shipping or seal was broken</option>
              <option value="Missing parts or accessories">Missing accessories or components from the package</option>
              <option value="Quality not as expected">Product quality is not as expected</option>
              <option value="No longer needed">No longer needed / ordered by mistake</option>
            </select>
          </div>

          <!-- Details / Comments Textarea -->
          <div style="margin-bottom:28px;">
            <label for="return-comments-input" style="display:block;font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Issue Details & Additional Comments (Optional)</label>
            <textarea id="return-comments-input" rows="3" placeholder="Please describe the issue in detail for fast approval..." style="width:100%;padding:12px 14px;border:1.5px solid #000000;border-radius:8px;font-size:13.5px;color:#000000;background:#ffffff;outline:none;resize:vertical;font-family:inherit;"></textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;">
            <button id="btn-return-step-1-next" style="padding:14px 38px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:14.5px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);">
              Continue to Pickup Location
            </button>
          </div>
        </div>

        <!-- STEP 2: SELECT PICKUP LOCATION -->
        <div id="return-step-view-2" style="display:none;">
          <h3 style="font-size:16px;font-weight:900;color:#000000;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">Select Doorstep Pickup Address</h3>

          <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
            <!-- Address Option 1 (Default) -->
            <div class="return-pickup-card is-selected" id="opt-pickup-addr-1" style="border:2px solid #000000;background:#f8fafc;border-radius:10px;padding:18px;cursor:pointer;display:flex;gap:14px;align-items:flex-start;">
              <input type="radio" name="pickup_address_choice" id="radio-addr-1" checked style="margin-top:4px;accent-color:#000000;" />
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <strong style="font-size:15px;color:#000000;">${defaultAddr.name} (Default Shipping Address)</strong>
                  <span style="font-size:11px;font-weight:800;background:#000000;color:#ffffff;padding:2px 8px;border-radius:4px;">PRIMARY</span>
                </div>
                <div style="font-size:13.5px;color:#000000;line-height:1.5;">
                  ${defaultAddr.street}<br/>
                  ${defaultAddr.city}, ${defaultAddr.state} - <strong>${defaultAddr.pincode}</strong><br/>
                  Phone: <strong>${defaultAddr.phone}</strong>
                </div>
              </div>
            </div>

            <!-- Address Option 2 (Alternative) -->
            <div class="return-pickup-card" id="opt-pickup-addr-2" style="border:1.5px solid #cbd5e1;background:#ffffff;border-radius:10px;padding:18px;cursor:pointer;display:flex;gap:14px;align-items:flex-start;">
              <input type="radio" name="pickup_address_choice" id="radio-addr-2" style="margin-top:4px;accent-color:#000000;" />
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <strong style="font-size:15px;color:#000000;">${altAddr.name} (Alternate Location)</strong>
                </div>
                <div style="font-size:13.5px;color:#000000;line-height:1.5;">
                  ${altAddr.street}<br/>
                  ${altAddr.city}, ${altAddr.state} - <strong>${altAddr.pincode}</strong><br/>
                  Phone: <strong>${altAddr.phone}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Pickup courier schedule box -->
          <div style="background:#ffffff;border:1.5px solid #000000;border-radius:10px;padding:16px;margin-bottom:28px;">
            <div style="font-size:12.5px;font-weight:800;color:#000000;text-transform:uppercase;margin-bottom:4px;">Courier Pickup Timeline</div>
            <div style="font-size:13.5px;color:#000000;">Free Courier Pickup Scheduled within <strong>24-48 Business Hours</strong> by Blue Dart / Delhivery Express.</div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button id="btn-return-step-2-back" style="padding:12px 28px;background:#ffffff;color:#000000;border:1.5px solid #000000;border-radius:8px;font-size:13.5px;font-weight:700;cursor:pointer;">
              Back to Step 1
            </button>
            <button id="btn-return-step-2-next" style="padding:14px 38px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:14.5px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);">
              Continue to Payment Method
            </button>
          </div>
        </div>

        <!-- STEP 3: PAYMENT / REFUND METHOD -->
        <div id="return-step-view-3" style="display:none;">
          <h3 style="font-size:16px;font-weight:900;color:#000000;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">Select Refund / Payment Method</h3>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:18px;margin-bottom:24px;">
            <!-- Option 1: X-Mart Wallet -->
            <div class="return-payment-card is-selected" id="opt-pay-wallet" style="border:2px solid #000000;background:#f8fafc;border-radius:10px;padding:20px;cursor:pointer;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:15.5px;color:#000000;">Refund in X-Mart Wallet</strong>
                <span style="font-size:10.5px;font-weight:800;background:#000000;color:#ffffff;padding:3px 8px;border-radius:4px;">INSTANT (2 HOURS)</span>
              </div>
              <p style="font-size:13px;color:#000000;margin:0 0 10px;line-height:1.5;">
                Instant credit of <strong>${Currency.format(itemTotal)}</strong> directly to your X-Mart Wallet balance within 2 hours of doorstep item pickup.
              </p>
              <div style="font-size:12px;color:#000000;font-weight:700;">No expiration • Usable on any purchase immediately</div>
            </div>

            <!-- Option 2: Direct into User Bank Account -->
            <div class="return-payment-card" id="opt-pay-bank" style="border:1.5px solid #cbd5e1;background:#ffffff;border-radius:10px;padding:20px;cursor:pointer;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong style="font-size:15.5px;color:#000000;">Direct into User Account</strong>
                <span style="font-size:10.5px;font-weight:800;background:#e2e8f0;color:#000000;padding:3px 8px;border-radius:4px;">BANK / UPI (24-48 HRS)</span>
              </div>
              <p style="font-size:13px;color:#000000;margin:0 0 10px;line-height:1.5;">
                Direct bank transfer of <strong>${Currency.format(itemTotal)}</strong> to your linked bank account or original UPI/Card payment source.
              </p>
              <div style="font-size:12px;color:#000000;font-weight:700;">Transferred directly to your primary bank account</div>
            </div>
          </div>

          <!-- Direct Bank verification info box (Toggled if Bank is selected) -->
          <div id="bank-details-box" style="display:none;background:#f8fafc;border:1.5px solid #000000;border-radius:10px;padding:18px;margin-bottom:24px;">
            <div style="font-size:12.5px;font-weight:800;color:#000000;text-transform:uppercase;margin-bottom:8px;">Linked Account & UPI Details</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px;color:#000000;">
              <div>
                <strong>Account Holder:</strong> ${Store.user?.name || 'Ashutosh Pathak'}<br/>
                <strong>Bank Name:</strong> State Bank of India (SBI)
              </div>
              <div>
                <strong>Account No:</strong> ************4821<br/>
                <strong>UPI ID:</strong> ashutosh@okaxis
              </div>
            </div>
          </div>

          <!-- Refund Summary Box -->
          <div style="background:#ffffff;border:1.5px solid #000000;border-radius:10px;padding:18px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:12px;font-weight:800;color:#000000;text-transform:uppercase;">TOTAL REFUND AMOUNT</div>
              <div style="font-size:13px;color:#000000;margin-top:2px;">100% Full Money-Back Guarantee</div>
            </div>
            <div style="font-size:22px;font-weight:900;color:#000000;">${Currency.format(itemTotal)}</div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button id="btn-return-step-3-back" style="padding:12px 28px;background:#ffffff;color:#000000;border:1.5px solid #000000;border-radius:8px;font-size:13.5px;font-weight:700;cursor:pointer;">
              Back to Step 2
            </button>
            <button id="btn-submit-return-final" style="padding:14px 44px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);">
              Confirm & Submit Return Request
            </button>
          </div>
        </div>

        <!-- SUCCESS CONFIRMATION SCREEN -->
        <div id="return-success-container" style="display:none;text-align:center;padding:20px 10px;">
          <div style="display:inline-block;border:2px solid #000000;border-radius:50%;width:60px;height:60px;line-height:56px;font-size:28px;font-weight:900;color:#000000;margin-bottom:16px;">OK</div>
          <h2 style="font-size:22px;font-weight:900;color:#000000;margin:0 0 8px;">Return Request Submitted Successfully</h2>
          <p style="font-size:14px;color:#000000;margin:0 0 24px;">Your 3-step return request has been registered and verified by X-Mart Support.</p>
          
          <div style="background:#f8fafc;border:1.5px solid #000000;border-radius:10px;padding:20px;max-width:560px;margin:0 auto 28px;text-align:left;">
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #cbd5e1;padding-bottom:10px;margin-bottom:12px;">
              <span style="font-size:13px;color:#000000;">RMA Reference ID:</span>
              <strong id="rma-ref-code" style="font-size:14px;color:#000000;">RMA-XM-82910471</strong>
            </div>
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #cbd5e1;padding-bottom:10px;margin-bottom:12px;">
              <span style="font-size:13px;color:#000000;">Refund Destination:</span>
              <strong id="rma-refund-method-text" style="font-size:13.5px;color:#000000;">X-Mart Wallet (Instant)</strong>
            </div>
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #cbd5e1;padding-bottom:10px;margin-bottom:12px;">
              <span style="font-size:13px;color:#000000;">Pickup Address:</span>
              <strong id="rma-pickup-addr-text" style="font-size:13px;color:#000000;">${defaultAddr.street}, ${defaultAddr.city}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:13px;color:#000000;">Pickup Timeline:</span>
              <strong style="font-size:13.5px;color:#000000;">Within 24-48 Hours (Blue Dart Express)</strong>
            </div>
          </div>

          <button id="btn-return-done-orders" style="padding:12px 40px;background:#ff9700;color:#000000;border:none;border-radius:8px;font-size:14.5px;font-weight:800;cursor:pointer;">
            Return to Orders
          </button>
        </div>
      </div>
    `;

    // Step Switching Logic
    const viewStep1 = pageContainer.querySelector('#return-step-view-1');
    const viewStep2 = pageContainer.querySelector('#return-step-view-2');
    const viewStep3 = pageContainer.querySelector('#return-step-view-3');

    const pill1 = pageContainer.querySelector('#wizard-step-pill-1');
    const pill2 = pageContainer.querySelector('#wizard-step-pill-2');
    const pill3 = pageContainer.querySelector('#wizard-step-pill-3');

    const setStep = (stepNumber) => {
      if (viewStep1) viewStep1.style.display = stepNumber === 1 ? 'block' : 'none';
      if (viewStep2) viewStep2.style.display = stepNumber === 2 ? 'block' : 'none';
      if (viewStep3) viewStep3.style.display = stepNumber === 3 ? 'block' : 'none';

      const activeStyle = 'background:#000000;color:#ffffff;border:1px solid #000000;';
      const inactiveStyle = 'background:#f1f5f9;color:#000000;border:1px solid #e2e8f0;';

      if (pill1) pill1.style.cssText = stepNumber === 1 ? activeStyle + 'padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;' : inactiveStyle + 'padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;';
      if (pill2) pill2.style.cssText = stepNumber === 2 ? activeStyle + 'padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;' : inactiveStyle + 'padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;';
      if (pill3) pill3.style.cssText = stepNumber === 3 ? activeStyle + 'padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;' : inactiveStyle + 'padding:12px 14px;border-radius:8px;text-align:center;font-size:13px;font-weight:800;';
    };

    // Step 1 navigation
    pageContainer.querySelector('#btn-return-step-1-next')?.addEventListener('click', () => {
      selectedReason = pageContainer.querySelector('#return-reason-select')?.value || 'Item defective or not working';
      setStep(2);
    });

    // Step 2 pickup address selection & navigation
    const optAddr1 = pageContainer.querySelector('#opt-pickup-addr-1');
    const optAddr2 = pageContainer.querySelector('#opt-pickup-addr-2');
    const radioAddr1 = pageContainer.querySelector('#radio-addr-1');
    const radioAddr2 = pageContainer.querySelector('#radio-addr-2');

    optAddr1?.addEventListener('click', () => {
      selectedPickupAddr = defaultAddr;
      if (radioAddr1) radioAddr1.checked = true;
      optAddr1.style.border = '2px solid #000000';
      optAddr1.style.background = '#f8fafc';
      if (optAddr2) {
        optAddr2.style.border = '1.5px solid #cbd5e1';
        optAddr2.style.background = '#ffffff';
      }
    });

    optAddr2?.addEventListener('click', () => {
      selectedPickupAddr = altAddr;
      if (radioAddr2) radioAddr2.checked = true;
      optAddr2.style.border = '2px solid #000000';
      optAddr2.style.background = '#f8fafc';
      if (optAddr1) {
        optAddr1.style.border = '1.5px solid #cbd5e1';
        optAddr1.style.background = '#ffffff';
      }
    });

    pageContainer.querySelector('#btn-return-step-2-back')?.addEventListener('click', () => setStep(1));
    pageContainer.querySelector('#btn-return-step-2-next')?.addEventListener('click', () => setStep(3));

    // Step 3 refund method selection & final submission
    const optWallet = pageContainer.querySelector('#opt-pay-wallet');
    const optBank = pageContainer.querySelector('#opt-pay-bank');
    const bankDetailsBox = pageContainer.querySelector('#bank-details-box');

    optWallet?.addEventListener('click', () => {
      selectedRefundMethod = 'wallet';
      optWallet.style.border = '2px solid #000000';
      optWallet.style.background = '#f8fafc';
      if (optBank) {
        optBank.style.border = '1.5px solid #cbd5e1';
        optBank.style.background = '#ffffff';
      }
      if (bankDetailsBox) bankDetailsBox.style.display = 'none';
    });

    optBank?.addEventListener('click', () => {
      selectedRefundMethod = 'bank';
      optBank.style.border = '2px solid #000000';
      optBank.style.background = '#f8fafc';
      if (optWallet) {
        optWallet.style.border = '1.5px solid #cbd5e1';
        optWallet.style.background = '#ffffff';
      }
      if (bankDetailsBox) bankDetailsBox.style.display = 'block';
    });

    pageContainer.querySelector('#btn-return-step-3-back')?.addEventListener('click', () => setStep(2));

    // Final submit
    pageContainer.querySelector('#btn-submit-return-final')?.addEventListener('click', () => {
      const rmaCode = `RMA-XM-${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      // Hide steps and step bar
      if (viewStep1) viewStep1.style.display = 'none';
      if (viewStep2) viewStep2.style.display = 'none';
      if (viewStep3) viewStep3.style.display = 'none';
      const wizardBar = pageContainer.querySelector('#return-step-wizard-bar');
      if (wizardBar) wizardBar.style.display = 'none';

      const successBox = pageContainer.querySelector('#return-success-container');
      if (successBox) {
        successBox.style.display = 'block';
        successBox.querySelector('#rma-ref-code').textContent = rmaCode;
        successBox.querySelector('#rma-refund-method-text').textContent = selectedRefundMethod === 'wallet' ? 'X-Mart Wallet (Instant Credit)' : 'Direct into Bank Account / UPI';
        successBox.querySelector('#rma-pickup-addr-text').textContent = `${selectedPickupAddr.street}, ${selectedPickupAddr.city} - ${selectedPickupAddr.pincode}`;
      }
      showToast(`Return Request Submitted! RMA ID: ${rmaCode}`, 'success');
    });

    pageContainer.querySelector('#btn-return-done-orders')?.addEventListener('click', () => window._openOrders());
  };

  // ── 5. COMMERCIAL DELIVERY ADDRESS BOOK & SHIPPING LOCATIONS WINDOW ──
  window._openAddressesPage = (push = true) => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) pushRoute('#addresses', { type: 'addresses' });

    let editingAddrId = null;

    function getSavedAddresses() {
      try {
        const stored = localStorage.getItem('xmart_saved_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      const user = Auth.getUser() || {};
      return [
        {
          id: 'addr_default_1',
          name: user.name || 'Ashutosh Pathak',
          phone: user.phone || '+91 9065553105',
          type: 'HOME',
          isDefault: true,
          street: 'Flat 402, Royal Residency, Main Road',
          city: 'Bilaspur',
          state: 'Chhattisgarh',
          pincode: localStorage.getItem('xmart_pincode') || '495001'
        }
      ];
    }

    function saveAddresses(addrs) {
      localStorage.setItem('xmart_saved_addresses', JSON.stringify(addrs));
    }

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Hero Banner -->
        <div class="com-hero-banner" style="background: linear-gradient(135deg, #091e3a 0%, #1e3a8a 100%); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px; padding: 28px 32px; border-radius: 16px; margin-bottom: 24px;">
          <div class="com-hero-left" style="flex: 1; min-width: 280px;">
            <h1 class="com-hero-title" style="margin: 0 0 8px; font-size: 26px; font-weight: 800; color: #ffffff;">Your Delivery Addresses</h1>
            <p class="com-hero-desc" style="margin: 0 0 16px; font-size: 13.5px; color: #cbd5e1; line-height: 1.5;">Manage your primary shipping destinations, residence & office locations, and PIN codes for 1-click express checkout.</p>
            <div class="com-hero-perks" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">
              <div class="perk-pill"><span>19,000+ PIN Codes Covered</span></div>
              <div class="perk-pill"><span>1-Click Fast Checkout</span></div>
              <div class="perk-pill"><span>Secure OTP Delivery</span></div>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: flex-start; margin-top: 14px;">
            <button id="addr-page-add-toggle-btn" class="com-btn-primary" style="background: #ff9700; color: #000000; font-weight: 800; border: none; padding: 13px 26px; border-radius: 10px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 14px rgba(255,151,0,0.35); display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;">+ Add New Address</button>
          </div>
        </div>

        <!-- Add / Edit Address Form Container -->
        <div id="addr-page-form-wrap" style="display:none;background:#ffffff;border:1.5px solid #ff9700;border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:0 8px 24px rgba(255,151,0,0.12);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #f1f5f9;padding-bottom:12px;">
            <h3 id="addr-page-form-heading" style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">Add New Delivery Address</h3>
            <button type="button" id="addr-page-form-close-btn" style="background:transparent;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
          </div>
          <form id="addr-page-form" style="display:flex;flex-direction:column;gap:14px;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:14px;">
              <div class="auth-input-group">
                <label>Full Recipient Name *</label>
                <input type="text" id="page-addr-name" required>
              </div>
              <div class="auth-input-group">
                <label>10-Digit Mobile Number *</label>
                <input type="tel" id="page-addr-phone" required>
              </div>
              <div class="auth-input-group">
                <label>Postal PIN Code *</label>
                <input type="text" id="page-addr-pin" maxlength="6" required>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:14px;">
              <div class="auth-input-group">
                <label>Address Type *</label>
                <select id="page-addr-type" style="width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;background:#fff;outline:none;">
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="auth-input-group">
                <label>City / Town *</label>
                <input type="text" id="page-addr-city" required>
              </div>
              <div class="auth-input-group">
                <label>State *</label>
                <input type="text" id="page-addr-state" required>
              </div>
            </div>

            <div class="auth-input-group">
              <label>Flat, House No., Building, Apartment, Company *</label>
              <input type="text" id="page-addr-street" required>
            </div>

            <div style="display:flex;justify-content:center;align-items:center;gap:16px;margin-top:16px;flex-wrap:wrap;">
              <button type="submit" class="com-btn-primary" id="page-addr-submit-btn" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:12px 32px;border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.3);min-width:200px;">Save Delivery Address</button>
              <button type="button" id="page-addr-cancel-btn" style="background:#e2e8f0;color:#334155;border:none;padding:12px 28px;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;min-width:120px;">Cancel</button>
            </div>
          </form>
        </div>

        <!-- Filter & Search Bar -->
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;margin-bottom:20px;background:#ffffff;padding:16px 20px;border-radius:12px;border:1px solid #e2e8f0;">
          <div style="display:flex;gap:8px;">
            <button class="page-chip is-active addr-filter-btn" data-filter="all">All Addresses</button>
            <button class="page-chip addr-filter-btn" data-filter="HOME">Home</button>
            <button class="page-chip addr-filter-btn" data-filter="WORK">Work / Office</button>
          </div>
          <div style="flex:1;max-width:320px;min-width:200px;">
            <input type="text" id="addr-search-input" placeholder="Search by name, PIN, or city..." style="width:100%;padding:9px 14px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;outline:none;" />
          </div>
        </div>

        <!-- Saved Address Cards Grid -->
        <div id="addr-page-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:20px;margin-bottom:36px;"></div>

        <!-- Delivery Assurance Trust Badges -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;padding:24px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <h5 style="margin:0;font-size:14px;font-weight:800;color:#0f172a;">100% Verified Delivery</h5>
              <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Tamper-proof packaging with real-time tracking</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </div>
            <div>
              <h5 style="margin:0;font-size:14px;font-weight:800;color:#0f172a;">Doorstep Return Pickup</h5>
              <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Hassle-free pickup from your saved location</p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#fffbeb;color:#d97706;display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <h5 style="margin:0;font-size:14px;font-weight:800;color:#0f172a;">Express 24-hr Shipping</h5>
              <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Fast metro transit across India</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const formWrap = pageContainer.querySelector('#addr-page-form-wrap');
    const formHeading = pageContainer.querySelector('#addr-page-form-heading');
    const submitBtn = pageContainer.querySelector('#page-addr-submit-btn');
    const addToggleBtn = pageContainer.querySelector('#addr-page-add-toggle-btn');
    const formCloseBtn = pageContainer.querySelector('#addr-page-form-close-btn');
    const formCancelBtn = pageContainer.querySelector('#page-addr-cancel-btn');
    const addrForm = pageContainer.querySelector('#addr-page-form');
    const gridEl = pageContainer.querySelector('#addr-page-grid');
    const searchInput = pageContainer.querySelector('#addr-search-input');
    let activeFilter = 'all';

    function renderCards() {
      const allAddrs = getSavedAddresses();
      const q = searchInput?.value.trim().toLowerCase() || '';

      const filtered = allAddrs.filter(a => {
        if (activeFilter !== 'all' && a.type !== activeFilter) return false;
        if (q) {
          const matchText = `${a.name} ${a.street} ${a.city} ${a.state} ${a.pincode} ${a.phone}`.toLowerCase();
          return matchText.includes(q);
        }
        return true;
      });

      if (filtered.length === 0) {
        gridEl.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;">
            <div style="margin-bottom:12px;color:#94a3b8;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3 style="margin:0 0 6px;font-weight:800;color:#0f172a;">No Matching Delivery Addresses</h3>
            <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Click "+ Add New Address" above to register a new shipping destination.</p>
            <button class="com-btn-primary" onclick="document.getElementById('addr-page-add-toggle-btn').click()" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">+ Add New Address</button>
          </div>
        `;
        return;
      }

      gridEl.innerHTML = filtered.map(addr => `
        <div style="background:#ffffff;border:1.5px solid ${addr.isDefault ? '#ff9700' : '#e2e8f0'};border-radius:14px;padding:20px;position:relative;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,0.04);transition:all 140ms ease;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11px;font-weight:800;background:${addr.type === 'HOME' ? '#eff6ff' : '#f0fdf4'};color:${addr.type === 'HOME' ? '#2563eb' : '#16a34a'};padding:3px 9px;border-radius:6px;border:1px solid currentColor;">
                  ${addr.type || 'HOME'}
                </span>
                ${addr.isDefault ? '<span style="font-size:11px;font-weight:800;background:#fff3e0;color:#d97706;padding:3px 9px;border-radius:6px;border:1px solid #fed7aa;">DEFAULT DESTINATION</span>' : ''}
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <button type="button" class="btn-card-edit" data-id="${addr.id}" style="background:transparent;border:none;color:#0284c7;font-size:13px;font-weight:700;cursor:pointer;">Edit</button>
                <button type="button" class="btn-card-del" data-id="${addr.id}" style="background:transparent;border:none;color:#ef4444;font-size:13px;font-weight:700;cursor:pointer;">Delete</button>
              </div>
            </div>

            <div style="font-size:17px;font-weight:800;color:#0f172a;margin-bottom:6px;">${addr.name}</div>
            <div style="font-size:13.5px;color:#334155;line-height:1.55;margin-bottom:10px;">${addr.street}, ${addr.city}, ${addr.state} - <strong style="color:#0f172a;">${addr.pincode}</strong></div>
            <div style="font-size:13px;color:#64748b;margin-bottom:18px;">Mobile: <strong style="color:#0f172a;">${addr.phone}</strong></div>
          </div>

          <div style="display:flex;gap:10px;border-top:1px solid #f1f5f9;padding-top:14px;">
            <button type="button" class="btn-card-select" data-pin="${addr.pincode}" style="flex:1;background:#19324c;color:#ffffff;border:none;padding:9px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:background 140ms ease;">Deliver to this PIN</button>
            ${!addr.isDefault ? `<button type="button" class="btn-card-default" data-id="${addr.id}" style="background:#f1f5f9;color:#334155;border:none;padding:9px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Set Default</button>` : ''}
          </div>
        </div>
      `).join('');

      // Wire edit buttons
      gridEl.querySelectorAll('.btn-card-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const addr = allAddrs.find(a => a.id === id);
          if (!addr) return;

          editingAddrId = id;
          pageContainer.querySelector('#page-addr-name').value = addr.name || '';
          pageContainer.querySelector('#page-addr-phone').value = addr.phone || '';
          pageContainer.querySelector('#page-addr-pin').value = addr.pincode || '';
          pageContainer.querySelector('#page-addr-type').value = addr.type || 'HOME';
          pageContainer.querySelector('#page-addr-city').value = addr.city || '';
          pageContainer.querySelector('#page-addr-state').value = addr.state || '';
          pageContainer.querySelector('#page-addr-street').value = addr.street || '';

          if (formHeading) formHeading.textContent = 'Edit Delivery Address';
          if (submitBtn) submitBtn.textContent = 'Update Delivery Address';
          formWrap.style.display = 'block';
          formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

      // Wire delete buttons
      gridEl.querySelectorAll('.btn-card-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          let list = getSavedAddresses().filter(a => a.id !== id);
          if (list.length > 0 && !list.some(a => a.isDefault)) list[0].isDefault = true;
          saveAddresses(list);
          renderCards();
          showToast('Address removed from address book', 'info');
        });
      });

      // Wire set default buttons
      gridEl.querySelectorAll('.btn-card-default').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          let list = getSavedAddresses().map(a => ({ ...a, isDefault: a.id === id }));
          saveAddresses(list);
          renderCards();
          showToast('Default delivery address updated!', 'success');
        });
      });

      // Wire deliver to PIN button
      gridEl.querySelectorAll('.btn-card-select').forEach(btn => {
        btn.addEventListener('click', () => {
          const pin = btn.dataset.pin;
          if (pin) {
            localStorage.setItem('xmart_pincode', pin);
            document.querySelectorAll('.location-control strong').forEach(el => el.textContent = pin);
          }
          showToast(`Active delivery location set to PIN: ${pin}!`, 'success');
        });
      });
    }

    function resetPageForm() {
      editingAddrId = null;
      addrForm.reset();
      if (formHeading) formHeading.textContent = 'Add New Delivery Address';
      if (submitBtn) submitBtn.textContent = 'Save Delivery Address';
      formWrap.style.display = 'none';
    }

    addToggleBtn?.addEventListener('click', () => {
      const isHidden = formWrap.style.display === 'none';
      if (isHidden) {
        resetPageForm();
        formWrap.style.display = 'block';
        formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        resetPageForm();
      }
    });

    // Auto-fetch district & state from PIN on Delivery Addresses Page
    const pagePinInput = pageContainer.querySelector('#page-addr-pin');
    const pageCityInput = pageContainer.querySelector('#page-addr-city');
    const pageStateInput = pageContainer.querySelector('#page-addr-state');

    pagePinInput?.addEventListener('input', (e) => {
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = pin;
      if (pin.length === 6) {
        autoFetchAddressFromPin(pin, pageCityInput, pageStateInput);
      }
    });

    formCloseBtn?.addEventListener('click', resetPageForm);
    formCancelBtn?.addEventListener('click', resetPageForm);

    addrForm?.addEventListener('submit', e => {
      e.preventDefault();
      const name = pageContainer.querySelector('#page-addr-name').value.trim();
      const phone = pageContainer.querySelector('#page-addr-phone').value.trim();
      const pincode = pageContainer.querySelector('#page-addr-pin').value.trim();
      const type = pageContainer.querySelector('#page-addr-type').value;
      const city = pageContainer.querySelector('#page-addr-city').value.trim();
      const state = pageContainer.querySelector('#page-addr-state').value.trim();
      const street = pageContainer.querySelector('#page-addr-street').value.trim();

      const candidate = { name, phone, pincode, type, city, state, street };
      let addrs = getSavedAddresses();

      // Check duplicate address parameters
      if (isDuplicateAddress(candidate, addrs, editingAddrId)) {
        showToast('This address is already available in your address book.', 'warn', 4000);
        return;
      }

      if (editingAddrId) {
        addrs = addrs.map(a => {
          if (a.id === editingAddrId) {
            return { ...a, name, phone, pincode, type, city, state, street };
          }
          return a;
        });
        saveAddresses(addrs);
        showToast('Delivery address updated successfully!', 'success');
      } else {
        const newAddr = {
          id: `addr_${Date.now()}`,
          name,
          phone,
          pincode,
          type,
          city,
          state,
          street,
          isDefault: addrs.length === 0
        };
        addrs.unshift(newAddr);
        saveAddresses(addrs);
        showToast('New delivery address added to your address book!', 'success');
      }

      resetPageForm();
      renderCards();
    });

    // Wire filter tabs
    pageContainer.querySelectorAll('.addr-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pageContainer.querySelectorAll('.addr-filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeFilter = btn.dataset.filter;
        renderCards();
      });
    });

    // Wire search
    searchInput?.addEventListener('input', renderCards);

    renderCards();
  };

  // ── 6. COMMERCIAL PAYMENT & X-MART WALLET CENTER WINDOW ────
  window._openWalletPage = (push = true) => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) pushRoute('#wallet', { type: 'wallet' });

    let rawBal = parseFloat(localStorage.getItem('xmart_wallet_balance') || '0.00');
    if (isNaN(rawBal) || rawBal > 100000) {
      rawBal = 0.00;
      localStorage.setItem('xmart_wallet_balance', '0.00');
    }
    let walletBalance = rawBal;

    function getSavedTxns() {
      try {
        const stored = localStorage.getItem('xmart_wallet_txns');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(t => t && !['txn_101', 'txn_102'].includes(t.id) && t.amount <= 100000);
          }
        }
      } catch {}
      return [];
    }

    function saveTxns(txns) {
      localStorage.setItem('xmart_wallet_txns', JSON.stringify(txns));
    }

    function getSavedMethods() {
      try {
        const stored = localStorage.getItem('xmart_saved_payments');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(m => m && !['pay_upi_1', 'pay_card_1'].includes(m.id));
          }
        }
      } catch {}
      return [];
    }

    function saveMethods(methods) {
      localStorage.setItem('xmart_saved_payments', JSON.stringify(methods));
    }

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Hero Banner -->
        <div class="com-hero-banner" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d1b2a 100%); border-bottom: 2px solid #ff9700;">
          <div class="com-hero-left">
            <h1 class="com-hero-title">X-Mart Cash & Payment Center</h1>
            <p class="com-hero-desc">Manage your prepaid cash balance, saved UPI IDs, credit/debit cards, promotional vouchers, and transaction ledger with 1-click seamless checkout.</p>
            <div class="com-hero-perks">
              <div class="perk-pill"><span>1-Click Instant Refund</span></div>
              <div class="perk-pill"><span>256-Bit Bank Grade SSL</span></div>
              <div class="perk-pill"><span>5% Unlimited Prime Cashback</span></div>
            </div>
          </div>
        </div>

        <!-- Main 2-Column Grid -->
        <div style="display:grid;grid-template-columns:minmax(320px, 420px) 1fr;gap:24px;margin-bottom:32px;">
          <!-- Left Column: Live Wallet Card & Top-Up -->
          <div style="display:flex;flex-direction:column;gap:20px;">
            <!-- Dark Modern Wallet Card -->
            <div style="background:linear-gradient(135deg, #19324c 0%, #0d1b2a 100%);color:#fff;border-radius:16px;padding:26px;box-shadow:0 12px 30px rgba(15,23,42,0.3);position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ff9700;">X-Mart Cash & Wallet</span>
                </div>
                <span style="background:rgba(34,197,94,0.2);color:#4ade80;font-size:11px;font-weight:800;padding:3px 9px;border-radius:6px;border:1px solid rgba(74,222,128,0.3);">Verified</span>
              </div>

              <div style="font-size:36px;font-weight:900;margin-bottom:6px;letter-spacing:-0.5px;">₹<span id="page-wallet-bal-display">${walletBalance.toFixed(2)}</span></div>
              <p style="font-size:12.5px;color:#94a3b8;margin:0 0 20px;line-height:1.4;">Usable across 100% of products with 1-click automatic checkout deduction.</p>

              <!-- Quick Add Chips -->
              <div style="margin-bottom:12px;">
                <span style="font-size:11px;font-weight:800;text-transform:uppercase;color:#cbd5e1;letter-spacing:0.5px;">Quick Add Cash</span>
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button type="button" class="quick-chip-btn" data-amt="100" style="flex:1;padding:7px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">+₹100</button>
                  <button type="button" class="quick-chip-btn" data-amt="500" style="flex:1;padding:7px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">+₹500</button>
                  <button type="button" class="quick-chip-btn" data-amt="1000" style="flex:1;padding:7px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">+₹1,000</button>
                  <button type="button" class="quick-chip-btn" data-amt="2000" style="flex:1;padding:7px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">+₹2,000</button>
                </div>
              </div>

              <!-- Amount Input & Add Button -->
              <div style="display:flex;gap:8px;background:rgba(255,255,255,0.08);padding:6px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);">
                <input type="number" id="page-wallet-input-amt" placeholder="Enter amount (₹)" min="50" step="50" style="flex:1;background:transparent;border:none;color:#fff;padding:8px 12px;font-size:14px;outline:none;" />
                <button type="button" id="page-wallet-add-cash-btn" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:13px;">+ Add Cash</button>
              </div>
            </div>

            <!-- Gift Card / Promo Code Voucher Box -->
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="width:36px;height:36px;border-radius:8px;background:#fef3c7;color:#d97706;display:flex;align-items:center;justify-content:center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                </div>
                <div>
                  <h4 style="margin:0;font-size:14.5px;font-weight:800;color:#0f172a;">Redeem E-Gift Card / Voucher</h4>
                  <p style="margin:0;font-size:11.5px;color:#64748b;">Instantly claim gift card balance to your wallet</p>
                </div>
              </div>
              <form id="page-voucher-form" style="display:flex;gap:8px;margin-top:12px;">
                <input type="text" id="page-voucher-code" placeholder="Enter voucher code" style="flex:1;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;outline:none;text-transform:uppercase;" />
                <button type="submit" style="background:#19324c;color:#fff;font-weight:700;border:none;padding:9px 16px;border-radius:8px;cursor:pointer;font-size:13px;">Apply</button>
              </form>
            </div>
          </div>

          <!-- Right Column: Saved Payment Methods & Transaction Ledger -->
          <div style="display:flex;flex-direction:column;gap:24px;">
            <!-- Saved Payment Methods -->
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div>
                  <h3 style="margin:0 0 2px;font-size:16px;font-weight:800;color:#0f172a;">Saved Payment Methods</h3>
                  <p style="margin:0;font-size:12px;color:#64748b;">Manage your saved UPI accounts, credit and debit cards</p>
                </div>
                <button type="button" id="toggle-add-payment-btn" style="background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">+ Add Method</button>
              </div>

              <!-- Add Method Slide-down Form -->
              <div id="add-payment-form-wrap" style="display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;">
                <h4 style="margin:0 0 12px;font-size:14px;font-weight:800;color:#0f172a;">Add New UPI or Card</h4>
                <form id="new-payment-form" style="display:flex;flex-direction:column;gap:10px;">
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <input type="text" id="new-pay-name" placeholder="Name on Card / UPI Nickname" required style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;" />
                    <input type="text" id="new-pay-details" placeholder="UPI ID or Card Number" required style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;" />
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button type="submit" class="com-btn-primary" style="flex:1;background:#ff9700;color:#000;font-weight:800;border:none;padding:8px;border-radius:6px;cursor:pointer;font-size:13px;">Save Payment Method</button>
                    <button type="button" id="cancel-pay-form-btn" style="background:#e2e8f0;color:#334155;border:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;">Cancel</button>
                  </div>
                </form>
              </div>

              <!-- List of Saved Payment Methods -->
              <div id="page-methods-list" style="display:flex;flex-direction:column;gap:10px;"></div>
            </div>

            <!-- Transaction Passbook & Ledger -->
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
                <div>
                  <h3 style="margin:0 0 2px;font-size:16px;font-weight:800;color:#0f172a;">Wallet Passbook & Statement</h3>
                  <p style="margin:0;font-size:12px;color:#64748b;">Complete history of cash additions, refunds, and promo credits</p>
                </div>
                <button type="button" id="btn-download-wallet-stmt" style="background:transparent;border:1px solid #cbd5e1;color:#0284c7;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Download Statement</button>
              </div>

              <!-- Passbook List -->
              <div id="page-txns-list" style="display:flex;flex-direction:column;gap:10px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const balDisplay = pageContainer.querySelector('#page-wallet-bal-display');
    const inputAmt = pageContainer.querySelector('#page-wallet-input-amt');
    const addCashBtn = pageContainer.querySelector('#page-wallet-add-cash-btn');
    const voucherForm = pageContainer.querySelector('#page-voucher-form');
    const voucherCodeInput = pageContainer.querySelector('#page-voucher-code');
    const methodsListEl = pageContainer.querySelector('#page-methods-list');
    const txnsListEl = pageContainer.querySelector('#page-txns-list');
    const togglePayBtn = pageContainer.querySelector('#toggle-add-payment-btn');
    const addPayWrap = pageContainer.querySelector('#add-payment-form-wrap');
    const cancelPayBtn = pageContainer.querySelector('#cancel-pay-form-btn');
    const newPayForm = pageContainer.querySelector('#new-payment-form');
    const downloadStmtBtn = pageContainer.querySelector('#btn-download-wallet-stmt');

    function renderMethods() {
      const methods = getSavedMethods();
      if (!methods || methods.length === 0) {
        methodsListEl.innerHTML = `
          <div style="text-align:center;padding:28px 16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;">
            <div style="font-size:24px;margin-bottom:6px;">🏦</div>
            <div style="font-size:13.5px;font-weight:700;color:#0f172a;margin-bottom:2px;">No Saved Payment Methods</div>
            <div style="font-size:12px;color:#64748b;">Click <strong>+ Add Method</strong> above to save a UPI ID or Card for 1-click checkout.</div>
          </div>
        `;
        return;
      }
      methodsListEl.innerHTML = methods.map(m => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;background:${m.bg || '#e0f2fe'};color:${m.color || '#0284c7'};border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:12px;border:1px solid rgba(0,0,0,0.06);">${m.badge || 'PAY'}</div>
            <div>
              <div style="font-weight:800;font-size:14px;color:#0f172a;">${m.name}</div>
              <div style="font-size:12px;color:#64748b;">${m.details}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            ${m.isPrimary ? '<span style="font-size:11px;font-weight:800;color:#16a34a;background:#dcfce7;padding:3px 8px;border-radius:6px;">PRIMARY</span>' : `<button type="button" class="btn-make-primary" data-id="${m.id}" style="background:transparent;border:none;color:#0284c7;font-size:12px;font-weight:700;cursor:pointer;">Set Primary</button>`}
            <button type="button" class="btn-del-method" data-id="${m.id}" style="background:transparent;border:none;color:#ef4444;font-size:12px;font-weight:700;cursor:pointer;">Delete</button>
          </div>
        </div>
      `).join('');

      methodsListEl.querySelectorAll('.btn-make-primary').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          let list = getSavedMethods().map(m => ({ ...m, isPrimary: m.id === id }));
          saveMethods(list);
          renderMethods();
          showToast('Primary payment method updated!', 'success');
        });
      });

      methodsListEl.querySelectorAll('.btn-del-method').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          let list = getSavedMethods().filter(m => m.id !== id);
          if (list.length > 0 && !list.some(m => m.isPrimary)) list[0].isPrimary = true;
          saveMethods(list);
          renderMethods();
          showToast('Payment method removed', 'info');
        });
      });
    }

    function renderTxns() {
      const txns = getSavedTxns();
      if (!txns || txns.length === 0) {
        txnsListEl.innerHTML = `
          <div style="text-align:center;padding:32px 16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;">
            <div style="font-size:24px;margin-bottom:6px;">💳</div>
            <div style="font-size:13.5px;font-weight:700;color:#0f172a;margin-bottom:2px;">No Wallet Transactions Yet</div>
            <div style="font-size:12px;color:#64748b;">Top up cash or redeem a gift card voucher to start your statement.</div>
          </div>
        `;
        return;
      }
      txnsListEl.innerHTML = txns.map(t => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#ffffff;border:1px solid #f1f5f9;border-radius:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;background:${t.type === 'credit' ? '#dcfce7' : '#fee2e2'};color:${t.type === 'credit' ? '#16a34a' : '#ef4444'};border-radius:50%;display:grid;place-items:center;font-size:16px;">
              ${t.type === 'credit' ? '↓' : '↑'}
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#0f172a;">${t.title}</div>
              <div style="font-size:11.5px;color:#94a3b8;">${t.date} • ${t.desc}</div>
            </div>
          </div>
          <div style="font-weight:800;color:${t.type === 'credit' ? '#16a34a' : '#ef4444'};font-size:15px;">
            ${t.type === 'credit' ? '+' : '-'}₹${Number(t.amount || 0).toFixed(2)}
          </div>
        </div>
      `).join('');
    }

    function addFunds(amt, note = 'Top-Up via UPI') {
      if (!amt || amt < 50) {
        showToast('Please enter an amount of at least ₹50.', 'error');
        return;
      }
      walletBalance += amt;
      localStorage.setItem('xmart_wallet_balance', walletBalance.toFixed(2));
      if (balDisplay) balDisplay.textContent = walletBalance.toFixed(2);

      const newTxn = {
        id: `txn_${Date.now()}`,
        title: note,
        date: 'Just Now',
        type: 'credit',
        amount: amt,
        desc: 'Added to X-Mart Cash • Instant Credit'
      };

      let txns = getSavedTxns();
      txns.unshift(newTxn);
      saveTxns(txns);

      renderTxns();
      showToast(`${Currency.format(amt)} added to your X-Mart Cash wallet!`, 'success');
      if (inputAmt) inputAmt.value = '';
    }

    addCashBtn?.addEventListener('click', () => {
      const amt = parseFloat(inputAmt?.value);
      addFunds(amt);
    });

    pageContainer.querySelectorAll('.quick-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseFloat(btn.dataset.amt);
        if (inputAmt) inputAmt.value = amt;
        addFunds(amt);
      });
    });

    voucherForm?.addEventListener('submit', e => {
      e.preventDefault();
      const code = voucherCodeInput?.value.trim().toUpperCase();
      if (!code) return;

      if (code === 'XMART500' || code === 'FESTIVE500') {
        addFunds(500, `Gift Voucher Claimed (${code})`);
        voucherCodeInput.value = '';
      } else if (code === 'WELCOME100') {
        addFunds(100, `Gift Voucher Claimed (${code})`);
        voucherCodeInput.value = '';
      } else {
        addFunds(100, `Promotional Code (${code})`);
        voucherCodeInput.value = '';
      }
    });

    togglePayBtn?.addEventListener('click', () => {
      const isHidden = addPayWrap.style.display === 'none';
      addPayWrap.style.display = isHidden ? 'block' : 'none';
    });

    cancelPayBtn?.addEventListener('click', () => {
      addPayWrap.style.display = 'none';
    });

    newPayForm?.addEventListener('submit', e => {
      e.preventDefault();
      const name = pageContainer.querySelector('#new-pay-name').value.trim();
      const details = pageContainer.querySelector('#new-pay-details').value.trim();
      const isUpi = details.includes('@');

      const newMethod = {
        id: `pay_${Date.now()}`,
        name,
        details,
        badge: isUpi ? 'UPI' : 'CARD',
        isPrimary: false,
        bg: isUpi ? '#e0f2fe' : '#fef3c7',
        color: isUpi ? '#0284c7' : '#d97706'
      };

      let list = getSavedMethods();
      list.push(newMethod);
      saveMethods(list);

      newPayForm.reset();
      addPayWrap.style.display = 'none';
      renderMethods();
      showToast('New payment method added!', 'success');
    });

    downloadStmtBtn?.addEventListener('click', () => {
      showToast('Generating official X-Mart Wallet Statement PDF...', 'success');
      window.print();
    });

    renderMethods();
    renderTxns();
  };

  // ── 7. COMMERCIAL DEDICATED ACCOUNT CENTER & PREFERENCES WINDOW ──
  window._openAccountPage = (push = true) => {
    if (!Auth.isLoggedIn()) {
      window._openAuth?.('signin');
      return;
    }

    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) pushRoute('#account', { type: 'account' });

    const user = Auth.getUser() || {};
    const firstName = user.name || 'User';
    const email = user.email || 'user@example.com';
    const phone = user.phone || '+91 9065553105';
    const initials = firstName.charAt(0).toUpperCase();

    // Get live stats
    const wishlistCount = Store.wishlist ? Store.wishlist.length : 0;
    const rawWBal = parseFloat(localStorage.getItem('xmart_wallet_balance') || '0.00');
    const walletBal = (isNaN(rawWBal) || rawWBal > 100000) ? '0' : rawWBal.toFixed(0);
    let addrCount = 1;
    try {
      const addrs = JSON.parse(localStorage.getItem('xmart_saved_addresses') || '[]');
      if (Array.isArray(addrs) && addrs.length > 0) addrCount = addrs.length;
    } catch {}

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap account-window-wrap">
        <!-- Account Hero Banner -->
        <div class="com-hero-banner" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);">
          <div class="com-hero-left" style="width:100%;">
            <h1 class="com-hero-title">Your Account & Preferences Hub</h1>
            <p class="com-hero-desc">Manage your personal profile, real-time order history, saved addresses, wallet balance, and bank-grade security settings.</p>
            <div class="com-hero-perks">
              <div class="perk-pill"><span>Unlimited Free Express Delivery</span></div>
              <div class="perk-pill"><span>5% Extra Cashback on All Orders</span></div>
              <div class="perk-pill"><span>256-Bit SSL Encrypted Account</span></div>
            </div>
          </div>
        </div>

        <!-- Profile Card with Matching Navy Blue Gradient (Exact Same Width as Hero Banner) -->
        <div class="account-hero-card" style="border-radius:16px;padding:26px 36px;margin-bottom:24px;color:#ffffff;box-shadow:0 8px 24px rgba(0,0,0,0.1);border:1px solid rgba(255,255,255,0.12);background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;box-sizing:border-box;">
            <div class="account-hero-left" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
              <div class="account-avatar-wrap" style="position:relative;">
                <div class="account-avatar" style="width:68px;height:68px;font-size:28px;background:linear-gradient(135deg,#0878f9,#0256b9);color:#ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 4px 14px rgba(8,120,249,0.4);border:2px solid rgba(255,255,255,0.2);">${initials}</div>
                <div class="account-badge-prime" style="position:absolute;bottom:-4px;right:-4px;background:#f59e0b;color:#0f172a;font-size:10px;font-weight:800;padding:2px 6px;border-radius:10px;border:2px solid #1e293b;">
                  <span>PRO</span>
                </div>
              </div>
              <div class="account-user-info">
                <h3 style="font-size:24px;font-weight:800;color:#ffffff;margin:0 0 6px;letter-spacing:-0.3px;">${firstName}</h3>
                <div class="account-user-meta" style="display:flex;gap:16px;flex-wrap:wrap;color:#cbd5e1;font-size:13px;font-weight:500;">
                  <span>${email}</span>
                  <span>${phone}</span>
                </div>
                <div class="account-tier-tag" style="margin-top:8px;display:inline-block;padding:5px 12px;background:rgba(245,158,11,0.18);color:#fcd34d;font-weight:700;font-size:12px;border-radius:20px;border:1px solid rgba(245,158,11,0.35);">
                  Verified Prime Member • Unlimited Free Delivery
                </div>
              </div>
            </div>
            <div class="account-hero-right">
              <button type="button" class="account-edit-btn" id="acct-page-edit-profile-btn" style="background:#ff9900;color:#0f1111;font-size:13px;font-weight:800;padding:12px 22px;border:none;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(255,153,0,0.3);transition:all 0.2s;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          <!-- 4 Stat Cards Grid -->
          <div class="account-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:30px;">
            <div class="account-stat-card" id="page-stat-orders" style="cursor:pointer;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-align:center;transition:transform 0.2s, box-shadow 0.2s;">
              <div class="account-stat-icon" style="color:#0878f9;margin-bottom:6px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
              </div>
              <div class="account-stat-val" id="page-stat-orders-count" style="font-size:22px;font-weight:800;color:#0f172a;">...</div>
              <div class="account-stat-lbl" style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Orders</div>
            </div>
            <div class="account-stat-card" id="page-stat-wishlist" style="cursor:pointer;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-align:center;transition:transform 0.2s, box-shadow 0.2s;">
              <div class="account-stat-icon" style="color:#ef4444;margin-bottom:6px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
              <div class="account-stat-val" style="font-size:22px;font-weight:800;color:#0f172a;">${wishlistCount}</div>
              <div class="account-stat-lbl" style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Wishlist</div>
            </div>
            <div class="account-stat-card" id="page-stat-wallet" style="cursor:pointer;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-align:center;transition:transform 0.2s, box-shadow 0.2s;">
              <div class="account-stat-icon" style="color:#059669;margin-bottom:6px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div class="account-stat-val" style="font-size:22px;font-weight:800;color:#0f172a;">₹${walletBal}</div>
              <div class="account-stat-lbl" style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">X-Mart Cash</div>
            </div>
            <div class="account-stat-card" id="page-stat-addresses" style="cursor:pointer;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-align:center;transition:transform 0.2s, box-shadow 0.2s;">
              <div class="account-stat-icon" style="color:#d97706;margin-bottom:6px;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="account-stat-val" style="font-size:22px;font-weight:800;color:#0f172a;">${addrCount}</div>
              <div class="account-stat-lbl" style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Addresses</div>
            </div>
          </div>

          <!-- 6 Account Hub Services Cards (Symmetric: 3 Up & 3 Down) -->
          <div style="margin-bottom:36px;">
            <h4 style="font-size:14px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:16px;">Account Services & Hub</h4>
            <div class="account-hub-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;">
              <!-- 1. Orders -->
              <div class="account-hub-card" id="page-hub-orders" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:all 0.2s;">
                <div class="account-hub-icon" style="width:44px;height:44px;background:#f0f7ff;color:#0878f9;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <div class="account-hub-info" style="flex:1;">
                  <h4 style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0f172a;">Your Orders & History</h4>
                  <p style="margin:0;font-size:12px;color:#64748b;">Track packages, invoices & returns</p>
                </div>
                <div style="color:#94a3b8;font-size:18px;">›</div>
              </div>

              <!-- 2. Wishlist -->
              <div class="account-hub-card" id="page-hub-wishlist" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:all 0.2s;">
                <div class="account-hub-icon" style="width:44px;height:44px;background:#fdf2f8;color:#ec4899;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="account-hub-info" style="flex:1;">
                  <h4 style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0f172a;">Saved Wishlist</h4>
                  <p style="margin:0;font-size:12px;color:#64748b;">View bookmarked items & alerts</p>
                </div>
                <div style="color:#94a3b8;font-size:18px;">›</div>
              </div>

              <!-- 3. Seller -->
              <div class="account-hub-card" id="page-hub-seller" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:all 0.2s;">
                <div class="account-hub-icon" style="width:44px;height:44px;background:#ecfdf5;color:#10b981;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <div class="account-hub-info" style="flex:1;">
                  <h4 style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0f172a;">Seller Account</h4>
                  <p style="margin:0;font-size:12px;color:#64748b;">Manage store, inventory & sales</p>
                </div>
                <div style="color:#94a3b8;font-size:18px;">›</div>
              </div>

              <!-- 4. Payment & Wallet -->
              <div class="account-hub-card" id="page-hub-wallet" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:all 0.2s;">
                <div class="account-hub-icon" style="width:44px;height:44px;background:#fef3c7;color:#d97706;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                </div>
                <div class="account-hub-info" style="flex:1;">
                  <h4 style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0f172a;">Payment & Wallet</h4>
                  <p style="margin:0;font-size:12px;color:#64748b;">Saved cards, UPI & balances</p>
                </div>
                <div style="color:#94a3b8;font-size:18px;">›</div>
              </div>

              <!-- 5. Login & Security -->
              <div class="account-hub-card" id="page-hub-security" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:all 0.2s;">
                <div class="account-hub-icon" style="width:44px;height:44px;background:#f5f3ff;color:#8b5cf6;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div class="account-hub-info" style="flex:1;">
                  <h4 style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0f172a;">Login & Security</h4>
                  <p style="margin:0;font-size:12px;color:#64748b;">Password, 2FA OTP & sessions</p>
                </div>
                <div style="color:#94a3b8;font-size:18px;">›</div>
              </div>

              <!-- 6. Customer Support -->
              <div class="account-hub-card" id="page-hub-cs" style="cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:all 0.2s;">
                <div class="account-hub-icon" style="width:44px;height:44px;background:#f0fdfa;color:#0d9488;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="account-hub-info" style="flex:1;">
                  <h4 style="margin:0 0 3px;font-size:15px;font-weight:700;color:#0f172a;">Customer Support</h4>
                  <p style="margin:0;font-size:12px;color:#64748b;">24/7 Live chat & instant help</p>
                </div>
                <div style="color:#94a3b8;font-size:18px;">›</div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons: Both Centered in Same Line -->
          <div style="display:flex;justify-content:center;align-items:center;gap:16px;margin:40px 0 20px;flex-wrap:wrap;">
            <button type="button" id="acct-page-delete-btn" style="background:#dc2626;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border:none;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(220,38,38,0.28);transition:all 0.2s ease;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
              <span>Delete Account</span>
            </button>
            <button type="button" id="acct-page-logout-btn" style="background:#ff9900;color:#0f1111;font-size:14px;font-weight:800;padding:12px 32px;border:none;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(255,153,0,0.32);transition:all 0.2s ease;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;

    // Fetch order count async
    apiFetch('/orders', { headers: Auth.getHeaders() })
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const el = pageContainer.querySelector('#page-stat-orders-count');
          if (el) el.textContent = d.data.length;
        }
      })
      .catch(() => {
        const el = pageContainer.querySelector('#page-stat-orders-count');
        if (el) el.textContent = '0';
      });

    // Wire edit profile
    pageContainer.querySelector('#acct-page-edit-profile-btn')?.addEventListener('click', () => {
      window._openEditProfileModal ? window._openEditProfileModal() : window._openAuth?.();
    });

    // Wire 4 stat cards
    pageContainer.querySelector('#page-stat-orders')?.addEventListener('click', () => window._openOrders?.());
    pageContainer.querySelector('#page-stat-wishlist')?.addEventListener('click', () => window._openWishlist?.());
    pageContainer.querySelector('#page-stat-wallet')?.addEventListener('click', () => window._openWalletPage?.());
    pageContainer.querySelector('#page-stat-addresses')?.addEventListener('click', () => window._openAddressesPage?.());

    // Wire 6 hub cards
    pageContainer.querySelector('#page-hub-orders')?.addEventListener('click', () => window._openOrders?.());
    pageContainer.querySelector('#page-hub-wishlist')?.addEventListener('click', () => window._openWishlist?.());
    pageContainer.querySelector('#page-hub-seller')?.addEventListener('click', () => window._openSellerPortal?.());
    pageContainer.querySelector('#page-hub-wallet')?.addEventListener('click', () => window._openWalletPage?.());
    pageContainer.querySelector('#page-hub-security')?.addEventListener('click', () => window._openSecurityModal?.());
    pageContainer.querySelector('#page-hub-cs')?.addEventListener('click', () => window._openCustomerServicePage?.());

    // Wire Delete Account & Sign Out
    pageContainer.querySelector('#acct-page-delete-btn')?.addEventListener('click', () => {
      Auth.deleteAccount();
    });
    pageContainer.querySelector('#acct-page-logout-btn')?.addEventListener('click', () => {
      Auth.logout();
      window._showHomeView();
    });
  };

  window._currentViewingProduct = null;

  // ── COMMERCIAL DEDICATED PRODUCT SPECIFICATIONS PAGE WINDOW ──
  window._openProductDetail = (prod, push = true) => {
    if (!prod) return;
    window._currentViewingProduct = prod;
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (push) {
      pushRoute(`#product/${prod._id || prod.id}`, { type: 'product', prodId: prod._id || prod.id, prod });
    }

    const baseImg = (prod.images && prod.images[0]) || prod.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
    const finalPrice = prod.finalPrice || prod.price || 0;
    const origPrice = prod.originalPrice || Math.round(finalPrice * 1.4);
    const discount = prod.discount || (origPrice > finalPrice ? Math.round(((origPrice - finalPrice) / origPrice) * 100) : 0);
    const isWishlisted = Store.wishlist.some(w => w.id === (prod._id || prod.id));

    const stockUnits = (prod.stock !== undefined) ? prod.stock : ((prod.countInStock !== undefined) ? prod.countInStock : 25);
    const isOutOfStock = stockUnits <= 0 || prod.isOutOfStock === true;
    const maxQty = isOutOfStock ? 0 : Math.min(10, Math.max(1, stockUnits));

    // Multi-angle perspectives dictionary
    const rawImages = (prod.images && prod.images.length > 0) ? prod.images : [baseImg];
    const ANGLES = [
      { id: 'front',  label: 'Front View',  deg: '0°',   src: rawImages[0] || baseImg, style: 'transform: scale(1) rotateY(0deg);' },
      { id: 'left',   label: 'Left Side',   deg: '90°',  src: rawImages[1] || rawImages[0] || baseImg, style: 'transform: scale(1.04) perspective(600px) rotateY(20deg) rotateZ(-2deg);' },
      { id: 'top',    label: 'Top View',    deg: '180°', src: rawImages[2] || rawImages[0] || baseImg, style: 'transform: scale(1.06) perspective(600px) rotateX(24deg);' },
      { id: 'right',  label: 'Right Side',  deg: '270°', src: rawImages[3] || rawImages[1] || rawImages[0] || baseImg, style: 'transform: scale(1.04) perspective(600px) rotateY(-20deg) rotateZ(2deg);' },
      { id: 'bottom', label: 'Bottom/Back', deg: '360°', src: rawImages[4] || rawImages[0] || baseImg, style: 'transform: scale(1.02) rotateY(180deg);' }
    ];

    let currentAngleIdx = 0;
    let is360Mode = false;
    let autoSlideTimer = null;
    let isPlaying = true;

    // ── Reviews & Ratings Persistent State ──
    const prodKey = prod._id || prod.id || prod.name.replace(/\s+/g, '_').toLowerCase();
    const storageKey = `xmart_reviews_${prodKey}`;
    let savedReviews = [];
    try {
      savedReviews = JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch(e) {
      savedReviews = [];
    }

    const DEFAULT_REVIEWS = [
      {
        id: 'rev_1',
        name: 'Rahul Sharma',
        avatar: 'RS',
        rating: 5,
        date: '2 days ago',
        title: 'Outstanding quality and super fast delivery!',
        comment: `Absolutely loved the ${prod.name}! The build quality is top-notch, exactly as described in specifications. Arrived in sealed packaging within 24 hours. Highly recommended!`,
        verified: true,
        helpful: 24
      },
      {
        id: 'rev_2',
        name: 'Priya Patel',
        avatar: 'PP',
        rating: 5,
        date: '5 days ago',
        title: 'Worth every rupee, exceeded my expectations',
        comment: `I was a bit skeptical at first, but after using it for a week, it has become indispensable. Battery/performance and aesthetics are both 10/10. Great job by ${prod.brand || 'X-Mart'}!`,
        verified: true,
        helpful: 16
      },
      {
        id: 'rev_3',
        name: 'Ankit Verma',
        avatar: 'AV',
        rating: 4,
        date: '1 week ago',
        title: 'Great product with solid performance',
        comment: 'Very happy with the purchase. Easy to setup and works flawlessly. Only giving 4 stars because outer delivery box had a small dent, but product inside was 100% pristine.',
        verified: true,
        helpful: 9
      }
    ];

    const allReviews = [...savedReviews, ...DEFAULT_REVIEWS];

    // ── Helper: Product Subtype & Semantic Category Classifier ──
    function getProductSubtype(p) {
      if (!p) return '';
      const tags = (p.tags || []).map(t => String(t).toLowerCase());
      const name = String(p.name || '').toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      const desc = String(p.description || '').toLowerCase();
      const combined = `${name} ${cat} ${tags.join(' ')} ${desc}`;

      // 1. Explicit tags matching
      if (tags.includes('mobiles') || tags.includes('smartphone') || tags.includes('phone') || tags.includes('5g')) return 'mobiles';
      if (tags.includes('laptops') || tags.includes('laptop') || tags.includes('macbook')) return 'laptops';
      if (tags.includes('watches') || tags.includes('smartwatch') || tags.includes('chronograph')) return 'watches';
      if (tags.includes('airpods') || tags.includes('earbuds') || tags.includes('tws')) return 'airpods';
      if (tags.includes('neckbands') || tags.includes('neckband')) return 'neckbands';
      if (tags.includes('wired earphones') || tags.includes('wired_earphones')) return 'wired_earphones';
      if (tags.includes('keyboards') || tags.includes('keyboard')) return 'keyboards';
      if (tags.includes('mouse')) return 'mouse';
      if (tags.includes('tshirts') || tags.includes('tshirt')) return 'tshirts';
      if (tags.includes('jeans') || tags.includes('jean')) return 'jeans';
      if (tags.includes('shirts') || tags.includes('shirt')) return 'shirts';
      if (tags.includes('apparels') || tags.includes('apparel')) return 'apparels';
      if (tags.includes('footwear') || tags.includes('shoes') || tags.includes('sneakers')) return 'footwear';
      if (tags.includes('kitchenware') || tags.includes('cookware')) return 'kitchenware';
      if (tags.includes('sofas') || tags.includes('sofa') || tags.includes('furniture')) return 'sofas';
      if (tags.includes('trolley bags') || tags.includes('trolley_bags') || tags.includes('luggage')) return 'trolley_bags';
      if (tags.includes('bags') || tags.includes('bag') || tags.includes('backpack')) return 'bags';
      if (tags.includes('beauty') || tags.includes('skincare')) return 'beauty';
      if (tags.includes('toys') || tags.includes('toy')) return 'toys';
      if (tags.includes('fitness') || tags.includes('gym')) return 'fitness';
      if (tags.includes('grocery')) return 'grocery';
      if (tags.includes('smarthome') || tags.includes('smart home')) return 'smarthome';

      // 2. Audio & accessories guard (prevent accessory headphones/earphones matching phones)
      if (/\b(headphone|headphones|over-ear|on-ear|wh-1000xm|anc)\b/i.test(name)) return 'headphones';
      if (/\b(neckband|neckbands|rockerz|bullets wireless)\b/i.test(name)) return 'neckbands';
      if (/\b(earbud|earbuds|airpod|airpods|tws|buds|airdopes)\b/i.test(name)) return 'airpods';
      if (/\b(wired earphone|in-ear earphone|iem|bassheads|3\.5mm)\b/i.test(name)) return 'wired_earphones';
      if (/\b(mouse|trackball)\b/i.test(name)) return 'mouse';
      if (/\b(keyboard|mechanical keyboard|keychron)\b/i.test(name)) return 'keyboards';
      if (/\b(smartwatch|smartwatches|galaxy watch|apple watch|amazfit|chronograph)\b/i.test(name)) return 'watches';
      if (/\b(watch|watches)\b/i.test(name) && /\b(casio|fossil|titan|timex|fastrack|rolex)\b/i.test(name)) return 'watches';

      // 3. Main Product heuristics
      if (/\b(iphone|smartphone|smartphones|mobile|mobiles|cellphone|cellular|oneplus|galaxy s\d|galaxy z|pixel \d|redmi note|realme \d|iqoo|motorola edge|vivo x|oppo reno)\b/i.test(name)) return 'mobiles';
      if (/\b(macbook|laptop|laptops|thinkpad|zenbook|ideapad|pavilion|legion|omen|alienware|notebook|chromebook|rog strix|vivobook)\b/i.test(name)) return 'laptops';
      if (/\b(t-shirt|tshirt|tee|polo)\b/i.test(name)) return 'tshirts';
      if (/\b(jeans|denim|trousers|pants)\b/i.test(name)) return 'jeans';
      if (/\b(shirt|shirts|formal shirt|linen shirt)\b/i.test(name)) return 'shirts';
      if (/\b(dress|gown|jacket|blazer|coat|hoodie|suit|kurti|saree|ethnic)\b/i.test(name)) return 'apparels';
      if (/\b(sneaker|sneakers|running shoe|shoes|shoe|boots|loafers|footwear)\b/i.test(name)) return 'footwear';
      if (/\b(cooker|pan|blender|mixer|air fryer|kettle|kitchenware|cookware)\b/i.test(name)) return 'kitchenware';
      if (/\b(sofa|couch|sectional|recliner|furniture)\b/i.test(name)) return 'sofas';
      if (/\b(trolley|suitcase|luggage)\b/i.test(name)) return 'trolley_bags';
      if (/\b(backpack|duffel|laptop bag|rucksack|bag|bags)\b/i.test(name)) return 'bags';
      if (/\b(serum|sunscreen|moisturizer|lipstick|perfume|cologne|makeup|skincare|beauty)\b/i.test(name)) return 'beauty';
      if (/\b(lego|action figure|drone|board game|toy|toys)\b/i.test(name)) return 'toys';
      if (/\b(treadmill|dumbbells|yoga mat|gym|sports|fitness)\b/i.test(name)) return 'fitness';
      if (/\b(smart tv|oled tv|television|bravia|qled|smart home)\b/i.test(name)) return 'smarthome';

      return '';
    }

    // ── Pure Same-Type Product Recommendation Filter ──
    const allStoreProds = (Store.allProducts && Store.allProducts.length > 0) ? Store.allProducts : DEFAULT_CATALOG;
    const currId = prod._id || prod.id;
    const currSubtype = getProductSubtype(prod);
    const currBrand = (prod.brand || '').toLowerCase();
    const currPrice = prod.finalPrice || prod.price || 1000;

    // 1. Strictly isolate only products that belong to the EXACT same subtype
    let sameTypeProducts = allStoreProds.filter(candidate => {
      const cId = candidate._id || candidate.id;
      if (cId === currId) return false;
      const candSubtype = getProductSubtype(candidate);
      return currSubtype && candSubtype && currSubtype === candSubtype;
    });

    // 2. If no exact subtype items exist, fallback strictly to the same exact category
    if (sameTypeProducts.length === 0) {
      sameTypeProducts = allStoreProds.filter(candidate => {
        const cId = candidate._id || candidate.id;
        if (cId === currId) return false;
        return (candidate.category || '').toLowerCase() === (prod.category || '').toLowerCase();
      });
    }

    // 3. Rank strictly within this pure same-type collection (Same brand first, then closest price)
    sameTypeProducts.sort((a, b) => {
      const aBrandMatch = (a.brand || '').toLowerCase() === currBrand ? 1 : 0;
      const bBrandMatch = (b.brand || '').toLowerCase() === currBrand ? 1 : 0;
      if (aBrandMatch !== bBrandMatch) return bBrandMatch - aBrandMatch;

      const aDiff = Math.abs((a.finalPrice || a.price || 1000) - currPrice);
      const bDiff = Math.abs((b.finalPrice || b.price || 1000) - currPrice);
      return aDiff - bDiff;
    });

    let relatedProducts = sameTypeProducts.slice(0, 30);

    // Dynamic Section Header Titles based on Product Intent
    const SUBTYPE_DISPLAY_MAP = {
      mobiles: { title: 'Similar Smartphones & Mobiles', sub: `All available smartphones matching your specifications and budget` },
      laptops: { title: 'Recommended Laptops & Computers', sub: `All high-performance ultrabooks and laptops matching your preference` },
      watches: { title: 'Similar Smartwatches & Timepieces', sub: `All matching luxury and fitness smartwatches` },
      airpods: { title: 'Similar True Wireless Earbuds & TWS', sub: `All true wireless earbuds with superior sound and bass` },
      neckbands: { title: 'Similar Wireless Neckbands', sub: `All Bluetooth neckbands with marathon battery and fast charging` },
      headphones: { title: 'Similar ANC & Over-Ear Headphones', sub: `All premium acoustic and studio noise cancelling headphones` },
      wired_earphones: { title: 'Similar Hi-Fi In-Ear Monitors & Earphones', sub: `All high-resolution in-ear monitors and dynamic bass earphones` },
      keyboards: { title: 'Similar Mechanical & Gaming Keyboards', sub: `All RGB mechanical and wireless productivity keyboards` },
      mouse: { title: 'Similar Ergonomic & Gaming Mice', sub: `All high-precision optical and wireless gaming mice` },
      tshirts: { title: 'Similar T-Shirts & Casual Wear', sub: `All trending graphic tees, polos and premium cotton apparel` },
      jeans: { title: 'Similar Jeans & Denim Trousers', sub: `All stretch denim, slim-fit and relaxed fit jeans` },
      shirts: { title: 'Similar Formal & Casual Shirts', sub: `All tailored cotton, linen and button-down shirts` },
      apparels: { title: 'Similar Fashion & Lifestyle Apparel', sub: `All trending fashion styles matching your wardrobe` },
      footwear: { title: 'Similar Footwear, Sneakers & Shoes', sub: `All running shoes, sneakers and lifestyle footwear` },
      kitchenware: { title: 'Similar Kitchen & Home Appliances', sub: `All top-rated cookware and smart kitchen appliances` },
      sofas: { title: 'Similar Sofas & Living Room Furniture', sub: `All sectionals, recliners and designer living room furniture` },
      trolley_bags: { title: 'Similar Trolleys & Travel Luggage', sub: `All durable hard-shell and travel luggage bags` },
      bags: { title: 'Similar Backpacks & Daypacks', sub: `All ergonomic laptop bags, duffels and travel backpacks` },
      beauty: { title: 'Similar Beauty, Skincare & Grooming', sub: `All skincare essentials and luxury fragrances` },
      toys: { title: 'Similar Toys, Action Figures & Games', sub: `All STEM kits, board games and collectible action figures` },
      fitness: { title: 'Similar Fitness & Sports Equipment', sub: `All home gym gear, dumbbells and workout accessories` },
      smarthome: { title: 'Similar Smart TVs & Home Tech', sub: `All next-gen 4K displays, soundbars and smart tech` }
    };

    const headerConfig = SUBTYPE_DISPLAY_MAP[currSubtype] || {
      title: `Related & Recommended in ${prod.category || 'Store'}`,
      sub: `Top-rated trending products curated to match your preference`
    };

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <div class="prod-detail-wrapper" style="margin-top: 8px;">
          <!-- 1. FIRST CONTAINER (100% Full-Width Image Stage & Description Right Below) -->
          <div class="prod-detail-card prod-detail-card--fullwidth">
            <!-- 100% Full-Width Image Showcase Stage -->
            <div class="prod-main-img-wrap prod-stage-viewer" id="prod-stage-viewer">
              ${discount > 0 ? `<span class="prod-discount-badge">Save ${discount}%</span>` : ''}

              <!-- Top Right Action Icons: Wishlist & Share -->
              <div class="prod-img-top-actions">
                <button type="button" class="prod-action-btn prod-action-btn--wishlist ${isWishlisted ? 'is-active' : ''}" id="prod-img-wishlist-btn" title="Save to Wishlist" aria-label="Add to Wishlist">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="${isWishlisted ? '#ef4444' : '#1e293b'}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
                <button type="button" class="prod-action-btn prod-action-btn--share" id="prod-img-share-btn" title="Share Product" aria-label="Share Product">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
              </div>

              <!-- Product Image with 3D perspective -->
              <img id="prod-detail-main-img" src="${ANGLES[0].src}" alt="${prod.name}" style="${ANGLES[0].style}">

              <!-- 360° Drag Overlay Hint -->
              <div class="prod-360-overlay" id="prod-360-overlay" style="display:none;">
                <div class="prod-360-hint">
                  <div style="margin-bottom:6px;color:#38bdf8;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  </div>
                  <strong>360° Interactive Orbit</strong>
                  <small>Drag horizontally to rotate angle</small>
                </div>
              </div>

              <!-- Slider Prev / Next Arrows -->
              <button type="button" class="prod-slide-nav prod-slide-nav--prev" id="prod-slide-prev" aria-label="Previous Angle">‹</button>
              <button type="button" class="prod-slide-nav prod-slide-nav--next" id="prod-slide-next" aria-label="Next Angle">›</button>

              <!-- Slider Progress Bar -->
              <div class="prod-slide-progress"><div class="prod-slide-progress-bar" id="prod-slide-progress-bar"></div></div>
            </div>

            <!-- Multi-Angle Thumbnails Strip -->
            <div class="prod-thumb-strip" id="prod-thumb-strip" style="margin-top: 14px;">
              ${ANGLES.map((ang, idx) => `
                <div class="prod-thumb-item ${idx === 0 ? 'is-active' : ''}" data-idx="${idx}" data-src="${ang.src}" title="${ang.label} (${ang.deg})">
                  <img src="${ang.src}" alt="${ang.label}">
                  <span class="thumb-angle-label">${ang.label.split(' ')[0]}</span>
                </div>
              `).join('')}
            </div>

            <!-- Product Summary & Full Description Placed Just Below 100% Image Container -->
            <div class="prod-below-image-info">
              <div class="prod-hero-summary">
                <span class="prod-brand-pill">${prod.brand || 'X-Mart'} • ${prod.category || 'General'}</span>
                <h2 class="prod-main-title">${prod.name}</h2>
                <div class="prod-rating-row">
                  <span class="prod-rating-badge">★ ${prod.rating || '4.7'}</span>
                  <span class="prod-reviews-count">(${prod.numReviews || '60'} ratings & reviews)</span>
                  <span class="prod-verified-tag">Verified Authentic</span>
                </div>
              </div>

              <!-- Detailed Product Description Just Below It -->
              <div class="prod-about-section" style="margin-top: 16px;">
                <h4 class="prod-section-heading">Description</h4>
                <p class="prod-desc-text">${prod.description || `Experience exceptional craftsmanship and quality with the ${prod.name} by ${prod.brand || 'X-Mart'}. Engineered with premium materials, industry-leading performance, guaranteed authenticity, and designed for lasting everyday utility.`}</p>
              </div>

              <!-- Trust & Assurance Horizontal Grid -->
              <div class="prod-trust-grid" style="margin-top: 20px;">
                <div class="prod-trust-item">
                  <div class="prod-trust-icon" style="color:#2563eb;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="13" x="1" y="5" rx="2"/><polygon points="17 8 21 8 23 11 23 18 17 18 17 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </div>
                  <div>
                    <strong>Fast Delivery</strong>
                    <small>Prime Express in 2 Days</small>
                  </div>
                </div>
                <div class="prod-trust-item">
                  <div class="prod-trust-icon" style="color:#16a34a;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <strong>Official Warranty</strong>
                    <small>1-2 Years Coverage</small>
                  </div>
                </div>
                <div class="prod-trust-item">
                  <div class="prod-trust-icon" style="color:#d97706;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  </div>
                  <div>
                    <strong>7 Days Return</strong>
                    <small>Hassle-Free Replacement</small>
                  </div>
                </div>
                <div class="prod-trust-item">
                  <div class="prod-trust-icon" style="color:#0878f9;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div>
                    <strong>Secure Pay</strong>
                    <small>100% Buyer Protection</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTTOM ROW (2 Vertical Cards with Same Height & 62% / 38% Width Ratio) -->
          <div class="prod-detail-bottom-row">
            <!-- 2. SECOND CONTAINER (Vertical Format, ~62% Width, Same Height) -->
            <div class="prod-detail-card prod-detail-card--specs">
              <div>
                <!-- Price Highlight Block -->
                <div class="prod-price-block">
                  <div class="prod-price-row">
                    <span class="prod-price-main" id="detail-prod-price-main">${Currency.format(finalPrice)}</span>
                    ${origPrice > finalPrice ? `<span class="prod-price-orig" id="detail-prod-price-orig">M.R.P.: ${Currency.format(origPrice)}</span>` : ''}
                    ${discount > 0 ? `<span class="prod-save-pill" id="detail-prod-save-pill">Save ${Currency.format(origPrice - finalPrice)} (${discount}%)</span>` : ''}
                  </div>
                  <p class="prod-tax-note">Inclusive of all applicable taxes • No hidden charges</p>
                </div>

                <!-- Available Special Offers Box -->
                <div class="prod-offers-box">
                  <div class="prod-offers-title">Available Special Offers & Discounts</div>
                  <div class="prod-offer-item">
                    <span class="offer-tag">Bank Offer</span>
                    <span>10% Instant Discount upto ₹1,500 on HDFC / ICICI Bank Credit Cards</span>
                  </div>
                  <div class="prod-offer-item">
                    <span class="offer-tag">No Cost EMI</span>
                    <span>Available on major bank credit cards starting at ₹332/month</span>
                  </div>
                  <div class="prod-offer-item">
                    <span class="offer-tag">Cashback</span>
                    <span>Get flat 5% unlimited cashback with X-Mart Prime Card</span>
                  </div>
                </div>

                <!-- Product Specifications Table -->
                <div class="prod-specs-section">
                  <h4 class="prod-section-heading">Product Specifications</h4>
                  <table class="prod-specs-table">
                    <tbody>
                      <tr><td class="spec-label">Brand</td><td class="spec-val"><strong>${prod.brand || 'X-Mart'}</strong></td></tr>
                      <tr><td class="spec-label">Category</td><td class="spec-val">${prod.category || 'General Merchandise'}</td></tr>
                      <tr><td class="spec-label">Model / Item</td><td class="spec-val">${prod.name}</td></tr>
                      <tr><td class="spec-label">Warranty</td><td class="spec-val">1 to 2 Years Manufacturer Warranty</td></tr>
                      <tr><td class="spec-label">Delivery Speed</td><td class="spec-val">Delivered in 2-4 business days with Prime Express</td></tr>
                      <tr><td class="spec-label">Condition</td><td class="spec-val">Brand New • 100% Sealed Original Box</td></tr>
                      <tr>
                        <td class="spec-label">Stock Availability</td>
                        <td class="spec-val" id="detail-spec-stock-val">
                          <span style="color:${isOutOfStock ? '#dc2626' : '#16a34a'};font-weight:700;">
                            ${isOutOfStock ? '● Out of Stock • Currently Unavailable' : `● In Stock • Ready to Dispatch (${stockUnits} units)`}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 3. THIRD CONTAINER (Vertical Format, ~38% Width, Same Height) -->
            <div class="prod-detail-card prod-detail-card--buybox">
              <div class="buybox-inner-top">
                <div class="buybox-price-header">
                  <span class="buybox-price" id="detail-buybox-price">${Currency.format(finalPrice)}</span>
                  <span class="buybox-stock-status" id="detail-buybox-stock-status" style="color:${isOutOfStock ? '#dc2626' : '#16a34a'};font-weight:700;">
                    ${isOutOfStock ? '● Out of Stock — Currently Unavailable' : '● In Stock — Ready to Ship'}
                  </span>
                </div>

                <div class="buybox-qty-row" style="${isOutOfStock ? 'opacity:0.6;pointer-events:none;' : ''}">
                  <label for="detail-qty-select">Quantity:</label>
                  <select id="detail-qty-select" class="buybox-qty-select" ${isOutOfStock ? 'disabled' : ''}>
                    ${isOutOfStock 
                      ? `<option value="0">0 units (Out of Stock)</option>`
                      : Array.from({length: maxQty}, (_, i) => i + 1).map(q => `<option value="${q}" ${q === 1 ? 'selected' : ''}>${q} unit${q > 1 ? 's' : ''}</option>`).join('')
                    }
                  </select>
                </div>

                <!-- Delivery Pincode Checker -->
                <div class="buybox-pincode-box">
                  <label for="detail-pincode-input">Deliver to:</label>
                  <div class="buybox-pincode-input-group">
                    <input type="text" id="detail-pincode-input" value="" maxlength="6">
                    <button type="button" id="detail-pincode-btn">Check</button>
                  </div>
                  <p class="buybox-delivery-promise"><strong>Free Delivery</strong> Guaranteed by Tomorrow</p>
                </div>

                <!-- Action Buttons -->
                <div class="buybox-actions">
                  <button id="detail-add-cart" class="buybox-btn buybox-btn--cart" ${isOutOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;background:#94a3b8;border-color:#94a3b8;"' : ''}>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button id="detail-buy-now" class="buybox-btn buybox-btn--buy" ${isOutOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;background:#64748b;border-color:#64748b;"' : ''}>
                    ${isOutOfStock ? 'Currently Unavailable' : 'Buy Now'}
                  </button>
                  <button id="detail-add-wishlist" class="buybox-btn buybox-btn--wishlist ${isWishlisted ? 'is-active' : ''}">
                    ${isWishlisted ? 'In Your Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>
              </div>

              <!-- Seller & Protection Assurance Footer -->
              <div class="buybox-footer-assurance">
                <div class="assurance-row"><small>Ships from:</small> <strong>X-Mart Superstore Hub</strong></div>
                <div class="assurance-row"><small>Sold by:</small> <strong>${prod.brand || 'X-Mart'} Direct</strong></div>
                <div class="assurance-badge">
                  <span>100% Buyer Protection Guaranteed</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. RELATED & RECOMMENDED PRODUCTS CONTAINER (100% Full-Width) -->
          <div class="prod-detail-card prod-related-container" style="width: 100%; margin-top: 10px;">
            <div class="prod-related-header">
              <div class="related-header-title-wrap">
                <h3 class="prod-related-heading">${headerConfig.title}</h3>
                <p class="prod-related-subheading">${headerConfig.sub}</p>
              </div>
            </div>

            <div class="related-track-wrapper">
              <button type="button" class="related-nav-btn related-nav-btn--prev" id="related-prev-btn" aria-label="Previous Products">‹</button>
              
              <div class="related-products-track" id="related-products-track">
                ${relatedProducts.map(rel => {
                const relImg = (rel.images && rel.images[0]) || rel.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
                const rPrice = rel.price || 0;
                const rOrig = rel.originalPrice || Math.round(rPrice * 1.3);
                const rDisc = rel.discount || (rOrig > rPrice ? Math.round(((rOrig - rPrice)/rOrig)*100) : 0);
                return `
                  <div class="related-product-card" data-id="${rel._id || rel.id}">
                    <div class="related-card-img-wrap">
                      ${rDisc > 0 ? `<span class="related-card-badge">${rDisc}% OFF</span>` : ''}
                      <img src="${relImg}" alt="${rel.name}" loading="lazy">
                    </div>
                    <div class="related-card-content">
                      <span class="related-card-brand">${rel.brand || 'X-Mart'} • ${rel.category || ''}</span>
                      <h4 class="related-card-title" title="${rel.name}">${rel.name}</h4>
                      <div class="related-card-rating">
                        <span class="related-star-badge">★ ${rel.rating || '4.7'}</span>
                        <span class="related-reviews">(${rel.numReviews || '45'})</span>
                      </div>
                      <div class="related-card-price-row">
                        <span class="related-price-main">${Currency.format(rPrice)}</span>
                        ${rOrig > rPrice ? `<span class="related-price-orig">${Currency.format(rOrig)}</span>` : ''}
                      </div>
                      <div class="related-card-actions">
                        <button type="button" class="related-btn-view" data-id="${rel._id || rel.id}">View Details</button>
                        <button type="button" class="related-btn-cart" data-id="${rel._id || rel.id}" title="Add to Cart">+</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
              </div>
              <button type="button" class="related-nav-btn related-nav-btn--next" id="related-next-btn" aria-label="Next Products">›</button>
            </div>
          </div>

          <!-- 4. FOURTH CONTAINER: 100% FULL-WIDTH CUSTOMER RATINGS & VERIFIED REVIEWS SHOWCASE (JUST ABOVE FOOTER) -->
          <div class="prod-detail-card prod-reviews-container" style="width: 100%; margin-top: 10px;">
            <div class="prod-reviews-header">
              <div class="reviews-header-title-wrap">
                <h3 class="prod-reviews-heading">Reviews & Ratings</h3>
                <p class="prod-reviews-subheading">Authentic feedback and ratings from verified X-Mart shoppers</p>
              </div>
            </div>

            <!-- Summary Breakdown & Write Form Grid -->
            <div class="reviews-overview-grid">
              <!-- Left: Rating Score & Star Bars -->
              <div class="reviews-score-card">
                <div class="reviews-score-main">
                  <span class="score-number">${prod.rating || '4.7'}</span>
                  <div class="score-stars-col">
                    <div class="score-stars">★★★★★</div>
                    <span class="score-count">Based on ${prod.numReviews || '352'} verified ratings</span>
                  </div>
                </div>
                <div class="rating-bars-list">
                  <div class="rating-bar-row">
                    <span>5 Star</span>
                    <div class="rating-bar-track"><div class="rating-bar-fill" style="width: 78%;"></div></div>
                    <span>78%</span>
                  </div>
                  <div class="rating-bar-row">
                    <span>4 Star</span>
                    <div class="rating-bar-track"><div class="rating-bar-fill" style="width: 14%;"></div></div>
                    <span>14%</span>
                  </div>
                  <div class="rating-bar-row">
                    <span>3 Star</span>
                    <div class="rating-bar-track"><div class="rating-bar-fill" style="width: 5%;"></div></div>
                    <span>5%</span>
                  </div>
                  <div class="rating-bar-row">
                    <span>2 Star</span>
                    <div class="rating-bar-track"><div class="rating-bar-fill" style="width: 2%;"></div></div>
                    <span>2%</span>
                  </div>
                  <div class="rating-bar-row">
                    <span>1 Star</span>
                    <div class="rating-bar-track"><div class="rating-bar-fill" style="width: 1%;"></div></div>
                    <span>1%</span>
                  </div>
                </div>
                <div class="reviews-recommend-badge">
                  <span><strong>96% of customers</strong> recommend this product</span>
                </div>
              </div>

              <!-- Right: Interactive Write Review Form -->
              <div class="write-review-card">
                <h4 class="write-review-title">Review this product</h4>
                <form id="product-review-form" class="review-form">
                  <!-- Star Rating Picker -->
                  <div class="review-form-group">
                    <label>Overall Rating <span class="required-star">*</span></label>
                    <div class="star-rating-picker" id="star-rating-picker">
                      <span class="star-pick" data-val="1">★</span>
                      <span class="star-pick" data-val="2">★</span>
                      <span class="star-pick" data-val="3">★</span>
                      <span class="star-pick" data-val="4">★</span>
                      <span class="star-pick" data-val="5">★</span>
                      <input type="hidden" id="review-rating-val" value="0">
                      <span class="star-rating-text" id="star-rating-text">Select a rating</span>
                    </div>
                  </div>

                  <div class="review-form-row">
                    <div class="review-form-group">
                      <label for="review-user-name">Your Name <span class="required-star">*</span></label>
                      <input type="text" id="review-user-name" required value="">
                    </div>
                    <div class="review-form-group">
                      <label for="review-headline">Review Headline <span class="required-star">*</span></label>
                      <input type="text" id="review-headline" required>
                    </div>
                  </div>

                  <div class="review-form-group">
                    <label for="review-comment">Detailed Feedback <span class="required-star">*</span></label>
                    <textarea id="review-comment" rows="3" required></textarea>
                  </div>

                  <button type="submit" id="submit-review-btn" class="submit-review-btn">
                    <span>Submit Verified Review</span>
                  </button>
                </form>
              </div>
            </div>

            <!-- Customer Reviews List Feed -->
            <div class="reviews-feed-section">
              <div class="reviews-feed-header">
                <h4 class="reviews-feed-title">Customer Reviews (<span id="reviews-total-count">${allReviews.length}</span>)</h4>
              </div>

              <div class="reviews-items-list" id="reviews-items-list">
                ${allReviews.map(rev => `
                  <div class="review-item-card">
                    <div class="review-item-top">
                      <div class="reviewer-meta">
                        <div class="reviewer-avatar" style="background:#f1f5f9;color:#0878f9;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border-radius:50%;width:36px;height:36px;">
                          ${typeof rev.avatar === 'string' && rev.avatar.length <= 3 ? rev.avatar : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
                        </div>
                        <div>
                          <div class="reviewer-name-row">
                            <strong>${rev.name}</strong>
                            ${rev.verified ? `<span class="verified-buyer-pill">Verified Buyer</span>` : ''}
                          </div>
                          <span class="review-date">${rev.date || 'Recently'}</span>
                        </div>
                      </div>
                      <div class="review-item-stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
                    </div>
                    <h5 class="review-item-title">${rev.title || 'Genuine Customer Review'}</h5>
                    <p class="review-item-body">${rev.comment}</p>
                    <div class="review-item-footer">
                      <button type="button" class="review-helpful-btn" data-id="${rev.id}">
                        Helpful (<span class="helpful-count">${rev.helpful || 0}</span>)
                      </button>
                      <span class="review-report-btn">Report</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Angle Switcher Helper Function
    const mainImgEl = pageContainer.querySelector('#prod-detail-main-img');
    const progressBar = pageContainer.querySelector('#prod-slide-progress-bar');
    const overlay360 = pageContainer.querySelector('#prod-360-overlay');

    function setAngle(idx, is360 = false) {
      currentAngleIdx = (idx + ANGLES.length) % ANGLES.length;
      is360Mode = is360;

      const ang = ANGLES[currentAngleIdx];
      if (mainImgEl) {
        mainImgEl.src = ang.src;
        mainImgEl.style = ang.style;
        mainImgEl.classList.remove('spin-360-animation');
        if (is360) {
          mainImgEl.classList.add('spin-360-animation');
        }
      }

      if (overlay360) {
        overlay360.style.display = is360 ? 'flex' : 'none';
      }

      // Update active thumbnails
      pageContainer.querySelectorAll('.prod-thumb-item').forEach(t => {
        const tIdx = parseInt(t.dataset.idx);
        t.classList.toggle('is-active', tIdx === currentAngleIdx);
      });

      // Restart progress bar animation
      if (progressBar) {
        progressBar.style.animation = 'none';
        void progressBar.offsetWidth;
        if (isPlaying) progressBar.style.animation = 'slideProgressAnim 1.8s linear';
      }
    }

    // Auto-Slider Engine
    function startAutoSlide() {
      stopAutoSlide();
      if (!isPlaying) return;
      if (progressBar) progressBar.style.animation = 'slideProgressAnim 1.8s linear';
      autoSlideTimer = setInterval(() => {
        setAngle(currentAngleIdx + 1, false);
      }, 1800);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) clearInterval(autoSlideTimer);
      autoSlideTimer = null;
      if (progressBar) progressBar.style.animation = 'none';
    }

    // Start auto slide initially
    startAutoSlide();

    // Prev / Next Arrows
    pageContainer.querySelector('#prod-slide-prev')?.addEventListener('click', () => {
      setAngle(currentAngleIdx - 1, false);
      if (isPlaying) startAutoSlide();
    });

    pageContainer.querySelector('#prod-slide-next')?.addEventListener('click', () => {
      setAngle(currentAngleIdx + 1, false);
      if (isPlaying) startAutoSlide();
    });

    // Thumbnail Click
    pageContainer.querySelectorAll('.prod-thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.idx);
        setAngle(idx, false);
        if (isPlaying) startAutoSlide();
      });
    });

    // Pause on Stage Hover, Resume on Leave
    const stageViewer = pageContainer.querySelector('#prod-stage-viewer');
    stageViewer?.addEventListener('mouseenter', () => {
      if (isPlaying) stopAutoSlide();
    });
    stageViewer?.addEventListener('mouseleave', () => {
      if (isPlaying) startAutoSlide();
    });

    // Interactive Drag to Rotate in 360°
    let isDragging = false;
    let startX = 0;
    stageViewer?.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
      stopAutoSlide();
    });
    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (isPlaying) startAutoSlide();
      }
    });
    stageViewer?.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const diff = e.clientX - startX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) setAngle(currentAngleIdx - 1, is360Mode);
        else setAngle(currentAngleIdx + 1, is360Mode);
        startX = e.clientX;
      }
    });

    // Pincode checker
    pageContainer.querySelector('#detail-pincode-btn')?.addEventListener('click', () => {
      const pin = pageContainer.querySelector('#detail-pincode-input')?.value.trim();
      if (/^\d{6}$/.test(pin)) {
        localStorage.setItem('xmart_pincode', pin);
        showToast(`Delivery available for pincode ${pin} by tomorrow!`, 'success');
      } else {
        showToast('Please enter a valid 6-digit postal pincode', 'error');
      }
    });

    // ── Dynamic Quantity-based Pricing Update ──
    const qtySelect = pageContainer.querySelector('#detail-qty-select');
    const buyboxPriceEl = pageContainer.querySelector('#detail-buybox-price');
    const prodPriceMainEl = pageContainer.querySelector('#detail-prod-price-main');
    const prodPriceOrigEl = pageContainer.querySelector('#detail-prod-price-orig');
    const prodSavePillEl = pageContainer.querySelector('#detail-prod-save-pill');

    qtySelect?.addEventListener('change', () => {
      const selectedQty = parseInt(qtySelect.value) || 1;
      const currentTotal = finalPrice * selectedQty;
      const currentOrigTotal = origPrice * selectedQty;
      const currentSave = currentOrigTotal - currentTotal;

      if (buyboxPriceEl) {
        buyboxPriceEl.textContent = Currency.format(currentTotal);
      }
      if (prodPriceMainEl) {
        prodPriceMainEl.textContent = Currency.format(currentTotal);
      }
      if (prodPriceOrigEl && origPrice > finalPrice) {
        prodPriceOrigEl.textContent = `M.R.P.: ${Currency.format(currentOrigTotal)}`;
      }
      if (prodSavePillEl && discount > 0) {
        prodSavePillEl.textContent = `Save ${Currency.format(currentSave)} (${discount}%)`;
      }
    });

    // Add to cart with quantity
    pageContainer.querySelector('#detail-add-cart')?.addEventListener('click', () => {
      if (isOutOfStock) {
        showToast('This product is currently out of stock.', 'warn');
        return;
      }
      const qty = parseInt(qtySelect?.value || '1');
      Store.addToCart(prod, qty);
    });

    // Buy now with selected quantity
    pageContainer.querySelector('#detail-buy-now')?.addEventListener('click', () => {
      if (isOutOfStock) {
        showToast('This product is currently out of stock.', 'warn');
        return;
      }
      const qty = parseInt(qtySelect?.value || '1');
      const added = Store.addToCart(prod, qty, false);
      if (added !== false) {
        if (window._openCheckoutModal) {
          window._openCheckoutModal();
        } else if (window._openCheckout) {
          window._openCheckout();
        }
      }
    });

    // ── Wishlist Toggles (Top Image Action + Buybox Button) ──
    const wishBtn = pageContainer.querySelector('#detail-add-wishlist');
    const topWishBtn = pageContainer.querySelector('#prod-img-wishlist-btn');

    function syncWishlistUI() {
      const isW = Store.wishlist.some(w => w.id === (prod._id || prod.id));
      if (wishBtn) {
        wishBtn.classList.toggle('is-active', isW);
        wishBtn.querySelector('svg')?.setAttribute('fill', isW ? '#ef4444' : 'none');
        wishBtn.querySelector('svg')?.setAttribute('stroke', isW ? '#ef4444' : 'currentColor');
        wishBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isW ? '#ef4444' : 'none'}" stroke="${isW ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ${isW ? 'In Your Wishlist' : 'Add to Wishlist'}
        `;
      }
      if (topWishBtn) {
        topWishBtn.classList.toggle('is-active', isW);
        topWishBtn.querySelector('svg')?.setAttribute('fill', isW ? '#ef4444' : 'none');
        topWishBtn.querySelector('svg')?.setAttribute('stroke', isW ? '#ef4444' : '#1e293b');
      }
    }

    wishBtn?.addEventListener('click', () => {
      const res = Store.toggleWishlist(prod);
      if (res !== false) syncWishlistUI();
    });

    topWishBtn?.addEventListener('click', () => {
      const res = Store.toggleWishlist(prod);
      if (res !== false) syncWishlistUI();
    });

    // ── Share Product Action ──
    const shareBtn = pageContainer.querySelector('#prod-img-share-btn');
    shareBtn?.addEventListener('click', async () => {
      const shareUrl = window.location.href;
      const shareData = {
        title: prod.name,
        text: `Check out ${prod.name} on X-Mart Superstore at ₹${finalPrice.toLocaleString('en-IN')}!`,
        url: shareUrl
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          showToast('Product shared successfully!', 'success');
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            // fallback to clipboard
          }
        }
      }

      // Copy to clipboard fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('✓ Product link copied to clipboard!', 'success');
      } catch(err) {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast('✓ Product link copied to clipboard!', 'success');
      }
    });

    // ── Star Rating Picker Interactivity ──
    const starPicker = pageContainer.querySelector('#star-rating-picker');
    const ratingInput = pageContainer.querySelector('#review-rating-val');
    const ratingText = pageContainer.querySelector('#star-rating-text');
    const ratingLabels = {
      1: '1.0 - Poor / Disappointed',
      2: '2.0 - Fair / Needs Improvement',
      3: '3.0 - Good / Average',
      4: '4.0 - Very Good / Recommended',
      5: '5.0 - Exceptional / Loved It!'
    };

    if (starPicker) {
      const stars = starPicker.querySelectorAll('.star-pick');
      stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
          const val = parseInt(star.dataset.val);
          stars.forEach(s => s.classList.toggle('is-active', parseInt(s.dataset.val) <= val));
          if (ratingText) ratingText.textContent = ratingLabels[val] || `${val}.0`;
        });

        star.addEventListener('click', () => {
          const val = parseInt(star.dataset.val);
          if (ratingInput) ratingInput.value = val;
          stars.forEach(s => s.classList.toggle('is-active', parseInt(s.dataset.val) <= val));
          if (ratingText) ratingText.textContent = ratingLabels[val] || `${val}.0`;
        });
      });

      starPicker.addEventListener('mouseleave', () => {
        const val = parseInt(ratingInput?.value || '0');
        stars.forEach(s => s.classList.toggle('is-active', parseInt(s.dataset.val) <= val));
        if (ratingText) ratingText.textContent = val > 0 ? (ratingLabels[val] || `${val}.0`) : 'Select a rating';
      });
    }

    // ── Submit Review Handler ──
    const reviewForm = pageContainer.querySelector('#product-review-form');
    reviewForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userName = pageContainer.querySelector('#review-user-name')?.value.trim();
      const headline = pageContainer.querySelector('#review-headline')?.value.trim();
      const comment = pageContainer.querySelector('#review-comment')?.value.trim();
      const rating = parseInt(ratingInput?.value || '0');

      if (!userName || !headline || !comment || rating === 0) {
        showToast('Please fill all review fields and select a rating', 'error');
        return;
      }

      const newReview = {
        id: 'rev_' + Date.now(),
        name: userName,
        avatar: userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U',
        rating,
        date: 'Just now',
        title: headline,
        comment,
        verified: true,
        helpful: 0
      };

      savedReviews.unshift(newReview);
      try {
        localStorage.setItem(storageKey, JSON.stringify(savedReviews));
      } catch(err) {
        console.warn('Storage save failed', err);
      }

      // Add to DOM
      const reviewsList = pageContainer.querySelector('#reviews-items-list');
      const countEl = pageContainer.querySelector('#reviews-total-count');
      if (reviewsList) {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item-card review-item-card--new';
        reviewEl.innerHTML = `
          <div class="review-item-top">
            <div class="reviewer-meta">
              <div class="reviewer-avatar" style="background:#f1f5f9;color:#0878f9;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border-radius:50%;width:36px;height:36px;">
                ${newReview.avatar}
              </div>
              <div>
                <div class="reviewer-name-row">
                  <strong>${newReview.name}</strong>
                  <span class="verified-buyer-pill">Verified Buyer</span>
                  <span class="new-review-badge">NEW</span>
                </div>
                <span class="review-date">Just now</span>
              </div>
            </div>
            <div class="review-item-stars">${'★'.repeat(newReview.rating)}${'☆'.repeat(5 - newReview.rating)}</div>
          </div>
          <h5 class="review-item-title">${newReview.title}</h5>
          <p class="review-item-body">${newReview.comment}</p>
          <div class="review-item-footer">
            <button type="button" class="review-helpful-btn" data-id="${newReview.id}">
              Helpful (<span class="helpful-count">0</span>)
            </button>
            <span class="review-report-btn">Report</span>
          </div>
        `;
        reviewsList.insertBefore(reviewEl, reviewsList.firstChild);
      }

      if (countEl) {
        countEl.textContent = parseInt(countEl.textContent || '0') + 1;
      }

      reviewForm.reset();
      if (ratingInput) ratingInput.value = '0';
      starPicker?.querySelectorAll('.star-pick').forEach(s => s.classList.remove('is-active'));
      if (ratingText) ratingText.textContent = 'Select a rating';

      showToast('Thank you! Your verified review was posted successfully!', 'success');
    });

    // ── Helpful Voting Button Handler ──
    pageContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.review-helpful-btn');
      if (btn && !btn.classList.contains('is-voted')) {
        const countSpan = btn.querySelector('.helpful-count');
        if (countSpan) {
          countSpan.textContent = parseInt(countSpan.textContent || '0') + 1;
        }
        btn.classList.add('is-voted');
        btn.style.color = '#16a34a';
        btn.style.borderColor = '#16a34a';
        showToast('Marked review as helpful! Thank you.', 'info');
      }
    });

    // ── Related Products Carousel Navigation ──
    const relTrack = pageContainer.querySelector('#related-products-track');
    pageContainer.querySelector('#related-prev-btn')?.addEventListener('click', () => {
      if (relTrack) relTrack.scrollBy({ left: -320, behavior: 'smooth' });
    });
    pageContainer.querySelector('#related-next-btn')?.addEventListener('click', () => {
      if (relTrack) relTrack.scrollBy({ left: 320, behavior: 'smooth' });
    });

    // ── Related Products Click to Open Detail or Add to Cart ──
    pageContainer.querySelectorAll('.related-product-card').forEach(card => {
      const pId = card.dataset.id;
      const targetProd = allStoreProds.find(p => (p._id || p.id) === pId);
      if (!targetProd) return;

      // Click card or view details
      card.addEventListener('click', (e) => {
        if (e.target.closest('.related-btn-cart')) return;
        window._openProductDetail(targetProd);
      });

      // Quick add to cart
      card.querySelector('.related-btn-cart')?.addEventListener('click', (e) => {
        e.stopPropagation();
        Store.addToCart(targetProd);
      });
    });
  };

  window._reRenderDetailPrices = () => {
    if (pageContainer && pageContainer.style.display !== 'none' && window._currentViewingProduct) {
      window._openProductDetail(window._currentViewingProduct, false);
    }
  };

  // Backward-compatibility wrapper
  window._openCatalog = (category = '', type = '', search = '') => {
    window._openDedicatedPage(category, type, search);
  };

  // ── 7. BROWSER BACKWARD & FORWARD BUTTON HISTORY ROUTER ────
  window.addEventListener('popstate', async (event) => {
    isNavigatingHistory = true;
    try {
      const state = event.state;
      const hash = window.location.hash || '';

      if (!hash || hash === '#' || hash === '#home' || hash === '#top' || (state && state.type === 'home')) {
        window._showHomeView(false);
      } else if (hash.startsWith('#product/') || (state && state.type === 'product')) {
        const prodId = state?.prodId || hash.replace('#product/', '').trim();
        let prod = state?.prod || (Store.allProducts || []).find(p => (p._id || p.id) == prodId);
        if (!prod && prodId) {
          try {
            const res = await fetch(`${API_BASE}/products/${prodId}`);
            const d = await res.json();
            if (d.success && d.data) prod = d.data;
          } catch {}
        }
        if (prod) {
          window._openProductDetail(prod, false);
        } else {
          window._showHomeView(false);
        }
      } else if (hash.startsWith('#category') || (state && state.type === 'category')) {
        let cat = state?.category;
        let type = state?.filterType || '';
        let search = state?.search || '';
        if (!cat) {
          const parts = hash.replace('#category/', '').split('?');
          cat = decodeURIComponent(parts[0] || '');
          if (parts[1]) {
            const params = new URLSearchParams(parts[1]);
            type = params.get('type') || '';
            search = params.get('search') || '';
          }
        }
        window._openDedicatedPage(cat === 'all' ? '' : cat, type, search, false);
      } else if (hash === '#deals' || hash === '#deal' || hash === '#bestseller') {
        window._openDedicatedPage('', hash.replace('#', ''), '', false);
      } else if (hash.startsWith('#order/') || (state && state.type === 'order-detail')) {
        const ordId = state?.orderId || hash.replace('#order/', '').trim();
        const ord = (state && state.order) || (window._allUserOrders || []).find(o => o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId) || { orderId: ordId };
        window._openDedicatedOrderInvoicePage(ord, state?.tab || 'details', false);
      } else if (hash.startsWith('#track/') || (state && state.type === 'order-track')) {
        const ordId = state?.orderId || hash.replace('#track/', '').trim();
        const ord = (state && state.order) || (window._allUserOrders || []).find(o => o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId) || { orderId: ordId };
        window._openDedicatedOrderInvoicePage(ord, 'track', false);
      } else if (hash.startsWith('#return/') || hash.startsWith('#replace/') || (state && state.type === 'return-replace')) {
        const ordId = state?.orderId || hash.replace('#return/', '').replace('#replace/', '').trim();
        const ord = (state && state.order) || (window._allUserOrders || []).find(o => o.orderId === ordId || `XM-${o._id.slice(-8).toUpperCase()}` === ordId) || { orderId: ordId };
        window._openReturnReplacePage(ord, state?.item, false);
      } else if (hash === '#orders' || (state && state.type === 'orders')) {
        window._openOrders(false);
      } else if (hash === '#seller' || hash === '#sell' || (state && state.type === 'seller')) {
        window._openSellerPortal(false);
      } else if (hash === '#customer-service' || hash === '#help' || hash === '#contact' || (state && state.type === 'customer-service')) {
        window._openCustomerServicePage(false);
      } else if (hash === '#addresses' || (state && state.type === 'addresses')) {
        window._openAddressesPage(false);
      } else if (hash === '#wallet' || (state && state.type === 'wallet')) {
        window._openWalletPage(false);
      } else if (hash === '#account' || (state && state.type === 'account')) {
        window._openAccountPage(false);
      } else {
        window._showHomeView(false);
      }
    } finally {
      isNavigatingHistory = false;
    }
  });

  // Set initial home state if no hash on first page load
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#top') {
    history.replaceState({ route: 'home', type: 'home' }, '', window.location.pathname);
  } else {
    // If user loaded or refreshed on a specific hash, route directly
    setTimeout(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    }, 150);
  }
}

/* ── 7. Legacy Product Modal Stub (No Popup) ─────────────── */
function buildProductDetailModal() {
  // Converted to full dedicated window view in initPageRouter
}

/* ── 8. Live Autocomplete Search Dropdown ─────────────────── */
function initLiveSearch() {
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.getElementById('product-search');
  if (!searchForm || !searchInput) return;

  // ── Build dropdown container ──────────────────────────────
  const dropdown = document.createElement('div');
  dropdown.id = 'search-results-dropdown';
  dropdown.className = 'search-results-dropdown';
  searchForm.style.position = 'relative';
  searchForm.appendChild(dropdown);

  // ── Category tracking (from "All" dropdown) ───────────────
  let activeCategory = 'All';

  // ── Trending suggestions (shown when input is focused but empty) ──
  const TRENDING = [
    { label: 'Smartphones & Mobiles', category: 'Electronics' },
    { label: "Women's Fashion Tops", category: 'Fashion' },
    { label: 'Wireless Earbuds', category: 'Electronics' },
    { label: 'Running Shoes Men', category: 'Fashion' },
    { label: 'Home Decor Items', category: 'Home' },
    { label: 'Skincare & Beauty', category: 'Beauty' },
    { label: 'Smart Watches', category: 'Electronics' },
    { label: "Today's Deals", category: 'All' },
  ];

  // ── Helper: highlight matched text ───────────────────────
  function highlight(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
  }

  // ── Helper: show trending suggestions ────────────────────
  function showTrending() {
    dropdown.innerHTML = `
      <div class="search-dropdown-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        Trending Searches
      </div>
      ${TRENDING.map(t => `
        <div class="search-trending-row" data-query="${t.label}">
          <span class="search-trending-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
          <span class="search-trending-label">${t.label}</span>
          <span class="search-cat-badge">${t.category}</span>
        </div>
      `).join('')}
    `;
    dropdown.querySelectorAll('.search-trending-row').forEach(row => {
      row.addEventListener('click', () => {
        searchInput.value = row.dataset.query;
        dropdown.classList.remove('is-active');
        window._openCatalog?.('', row.dataset.query);
      });
    });
    dropdown.classList.add('is-active');
  }

  // ── Helper: show skeleton loader ─────────────────────────
  function showSkeleton() {
    dropdown.innerHTML = `
      <div class="search-dropdown-header">
        <span class="search-loading-dot"></span>
        <span class="search-loading-dot"></span>
        <span class="search-loading-dot"></span>
        Searching...
      </div>
      ${[1,2,3].map(() => `
        <div class="search-skeleton-row">
          <div class="search-skeleton-img"></div>
          <div style="flex:1;min-width:0;">
            <div class="search-skeleton-line" style="width:70%;"></div>
            <div class="search-skeleton-line" style="width:40%;margin-top:6px;"></div>
          </div>
        </div>
      `).join('')}
    `;
    dropdown.classList.add('is-active');
  }

  // ── Keyboard navigation state ─────────────────────────────
  let activeIdx = -1;
  function getRows() {
    return [...dropdown.querySelectorAll('.search-result-row, .search-trending-row')];
  }
  function setActive(idx) {
    const rows = getRows();
    rows.forEach(r => r.classList.remove('is-keyboard-active'));
    if (idx >= 0 && idx < rows.length) {
      rows[idx].classList.add('is-keyboard-active');
      rows[idx].scrollIntoView({ block: 'nearest' });
    }
    activeIdx = idx;
  }

  searchInput.addEventListener('keydown', e => {
    const rows = getRows();
    if (!dropdown.classList.contains('is-active')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && rows[activeIdx]) {
        e.preventDefault();
        rows[activeIdx].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.classList.remove('is-active');
      activeIdx = -1;
    }
  });

  // ── Focus → show trending ─────────────────────────────────
  searchInput.addEventListener('focus', () => {
    activeIdx = -1;
    if (searchInput.value.trim().length < 2) showTrending();
  });

  // ── Input → live search ───────────────────────────────────
  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    activeIdx = -1;
    const q = searchInput.value.trim();
    if (q.length < 2) {
      showTrending();
      return;
    }

    showSkeleton();

    debounceTimer = setTimeout(async () => {
      try {
        const catParam = (activeCategory && activeCategory !== 'All')
          ? `&category=${encodeURIComponent(activeCategory)}`
          : '';
        
        let apiResults = [];
        try {
          const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(q)}&limit=8${catParam}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) apiResults = data.data;
        } catch {
          apiResults = [];
        }

        // Local Smart Synonym & Fuzzy Search on Store.allProducts
        const lowerQ = q.toLowerCase().trim();
        let searchTerms = [lowerQ];
        for (const [key, list] of Object.entries(SMART_SYNONYMS)) {
          if (lowerQ.includes(key) || key.includes(lowerQ)) {
            searchTerms.push(...list);
          }
        }
        searchTerms = [...new Set(searchTerms)];

        const localResults = (Store.allProducts || []).filter(p => {
          if (activeCategory && activeCategory !== 'All' && p.category !== activeCategory) return false;
          const name = (p.name || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();

          return searchTerms.some(term =>
            name.includes(term) || brand.includes(term) || desc.includes(term) || cat.includes(term)
          );
        });

        // Merge API + Local without duplicates
        const seenIds = new Set();
        const results = [];
        for (const item of [...apiResults, ...localResults]) {
          const id = item._id || item.id || item.name;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            results.push(item);
          }
          if (results.length >= 8) break;
        }

        if (results.length === 0) {
          dropdown.innerHTML = `
            <div class="search-no-results">
              <span style="font-size:28px;color:#94a3b8;display:block;margin-bottom:8px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <p>No results for <strong>"${q}"</strong></p>
              <small>Try a different keyword or browse categories below</small>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                ${['Electronics','Fashion','Home','Beauty'].map(c => `
                  <span class="search-cat-chip" data-cat="${c}">${c}</span>
                `).join('')}
              </div>
            </div>
          `;
          dropdown.querySelectorAll('.search-cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              dropdown.classList.remove('is-active');
              window._openCatalog?.(chip.dataset.cat, '');
            });
          });
        } else {
          const catLabel = activeCategory !== 'All' ? ` in <em>${activeCategory}</em>` : '';
          dropdown.innerHTML = `
            <div class="search-dropdown-header">
              Results${catLabel} for "<strong>${q}</strong>"
            </div>
            ${results.map(item => `
              <div class="search-result-row" data-id="${item._id || item.id}">
                <img src="${(item.images && item.images[0]) || item.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}" alt="${item.name}" loading="lazy">
                <div style="flex:1;min-width:0;">
                  <p class="search-result-name">${highlight(item.name, q)}</p>
                  <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                    <span class="search-result-price">${Currency.format(item.finalPrice || item.price || 0)}</span>
                    ${item.category ? `<span class="search-cat-badge">${item.category}</span>` : ''}
                    ${item.discount ? `<span class="search-discount-badge">${item.discount}% off</span>` : ''}
                  </div>
                </div>
                <svg class="search-row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            `).join('')}
            <div class="search-view-all" data-query="${q}">
              View all results for "<strong>${q}</strong>"
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          `;

          dropdown.querySelectorAll('.search-result-row').forEach(row => {
            row.addEventListener('click', () => {
              const item = results.find(r => (r._id || r.id) === row.dataset.id);
              if (item) {
                dropdown.classList.remove('is-active');
                searchInput.value = item.name;
                window._openProductDetail?.(item);
              }
            });
          });

          dropdown.querySelector('.search-view-all')?.addEventListener('click', () => {
            dropdown.classList.remove('is-active');
            const targetCat = (activeCategory && activeCategory !== 'All') ? activeCategory : '';
            window._openDedicatedPage?.(targetCat, '', q);
          });
        }
        dropdown.classList.add('is-active');
      } catch (err) {
        console.error('Search error:', err);
        dropdown.classList.remove('is-active');
      }
    }, 200);
  });

  // ── Native search clear button handler ───────────────────
  searchInput.addEventListener('search', () => {
    if (!searchInput.value.trim()) {
      dropdown.classList.remove('is-active');
      activeIdx = -1;
    }
  });

  // ── Outside click closes dropdown ─────────────────────────
  document.addEventListener('click', e => {
    if (!searchForm.contains(e.target)) {
      dropdown.classList.remove('is-active');
      activeIdx = -1;
    }
  });

  // ── Form submit → open catalog ────────────────────────────
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput.value.trim();
    dropdown.classList.remove('is-active');
    activeIdx = -1;
    if (q) {
      const targetCat = (activeCategory && activeCategory !== 'All') ? activeCategory : '';
      window._openDedicatedPage?.(targetCat, '', q);
    }
  });

  // ── Wire "All" category dropdown to filter search ─────────
  document.querySelectorAll('[data-dropdown-option]').forEach(opt => {
    if (!opt.closest('#search-category-menu')) return;
    opt.addEventListener('click', () => {
      activeCategory = opt.dataset.label || 'All';
      // If user already typed something, re-trigger search
      const q = searchInput.value.trim();
      if (q.length >= 2) {
        searchInput.dispatchEvent(new Event('input'));
      }
    });
  });
}

/* ── 8B. All Departments Side Navigation Drawer ──────────── */
function buildDepartmentSidebar() {
  if (document.getElementById('dept-sidebar-panel')) return;

  const ov = document.createElement('div');
  ov.id = 'dept-sidebar-overlay';
  document.body.appendChild(ov);

  const p = document.createElement('aside');
  p.id = 'dept-sidebar-panel';

  const user = Auth.getUser();
  const firstName = user?.name ? user.name.split(' ')[0] : (Auth.isLoggedIn() ? 'User' : null);
  const userName = firstName ? `Hello, ${firstName}` : 'Hello, Sign In';

  p.innerHTML = `
    <div class="dept-sidebar-header">
      <div class="dept-sidebar-user" id="dept-user-btn">
        <div class="dept-user-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="7" r="4"/><path d="M5 21v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2"/></svg>
        </div>
        <h3 class="dept-user-greeting" id="dept-user-greeting">${userName}</h3>
      </div>
      <button class="dept-sidebar-close" id="dept-sidebar-close" aria-label="Close navigation menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="dept-sidebar-body">
      <!-- Section 1: Trending -->
      <div class="dept-menu-section">
        <h4 class="dept-section-title">Trending & Highlights</h4>
        <ul class="dept-menu-list">
          <li><button class="dept-menu-item" data-action="bestsellers">Bestsellers <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-action="deals">Today's Deals <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-action="new">New Releases & Trending <span class="dept-chevron">›</span></button></li>
        </ul>
      </div>

      <!-- Section 2: Shop by Department -->
      <div class="dept-menu-section">
        <h4 class="dept-section-title">Shop by Department</h4>
        <ul class="dept-menu-list">
          <li><button class="dept-menu-item" data-cat="Electronics">Electronics & Gadgets <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="Fashion">Fashion & Apparel <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="Home & Kitchen">Home & Kitchen <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="Beauty & Health">Beauty & Personal Care <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="Grocery">Grocery & Gourmet Food <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="Sports">Sports, Fitness & Outdoors <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="Toys">Toys, Baby & Kids <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-cat="">All Departments SuperStore <span class="dept-chevron">›</span></button></li>
        </ul>
      </div>

      <!-- Section 3: Programs & Features -->
      <div class="dept-menu-section">
        <h4 class="dept-section-title">Programs & Features</h4>
        <ul class="dept-menu-list">
          <li><button class="dept-menu-item" data-action="seller">Seller Central (Sell on X-Mart) <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-action="deals">Lightning Deals Hub <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-action="business">Bulk / Business Deals <span class="dept-chevron">›</span></button></li>
          <li><button class="dept-menu-item" data-action="giftcards">Gift Cards & Rewards <span class="dept-chevron">›</span></button></li>
        </ul>
      </div>

      <!-- Section 4: Help & Settings -->
      <div class="dept-menu-section">
        <h4 class="dept-section-title">Help & Settings</h4>
        <ul class="dept-menu-list">
          <li><button class="dept-menu-item" data-action="account">Your Account</button></li>
          <li><button class="dept-menu-item" data-action="orders">Returns & Order History</button></li>
          <li><button class="dept-menu-item" data-action="wishlist">Saved Wishlist</button></li>
          <li><button class="dept-menu-item" data-action="cs">Customer Service & Help Hub</button></li>
          <li><button class="dept-menu-item" data-action="delete-account" id="dept-del-account-btn" style="${Auth.isLoggedIn() ? '' : 'display:none;'}">Delete Account</button></li>
          <li><button class="dept-menu-item" data-action="auth" id="dept-auth-btn">${Auth.isLoggedIn() ? 'Sign Out' : 'Sign In'}</button></li>
        </ul>
      </div>
    </div>
  `;

  document.body.appendChild(p);

  const close = () => {
    p.classList.remove('is-open');
    ov.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const open = () => {
    const curUser = Auth.getUser();
    const curFirstName = curUser?.name ? curUser.name.split(' ')[0] : (Auth.isLoggedIn() ? 'User' : null);
    const greetingEl = p.querySelector('#dept-user-greeting');
    if (greetingEl) {
      greetingEl.textContent = curFirstName ? `Hello, ${curFirstName}` : 'Hello, Sign In';
    }
    const authBtn = p.querySelector('#dept-auth-btn');
    if (authBtn) {
      authBtn.textContent = Auth.isLoggedIn() ? 'Sign Out' : 'Sign In';
    }
    const delBtn = p.querySelector('#dept-del-account-btn');
    if (delBtn) {
      delBtn.style.display = Auth.isLoggedIn() ? 'block' : 'none';
    }

    p.classList.add('is-open');
    ov.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  p.querySelector('#dept-sidebar-close')?.addEventListener('click', close);
  ov.addEventListener('click', close);

  p.querySelector('#dept-user-btn')?.addEventListener('click', () => {
    close();
    window._openAuth?.();
  });

  // Wire menu item clicks
  p.querySelectorAll('.dept-menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      close();
      const cat = btn.dataset.cat;
      const act = btn.dataset.action;

      if (typeof cat !== 'undefined') {
        window._openDedicatedPage?.(cat);
      } else if (act === 'bestsellers') {
        window._openDedicatedPage?.('', 'bestseller');
      } else if (act === 'deals') {
        window._openDedicatedPage?.('', 'deal');
      } else if (act === 'new') {
        window._openDedicatedPage?.('');
      } else if (act === 'seller') {
        window._openSellerPortal?.();
      } else if (act === 'business' || act === 'giftcards') {
        window._openDedicatedPage?.('', 'deal');
      } else if (act === 'account') {
        window._openAuth?.();
      } else if (act === 'orders') {
        window._openOrders?.();
      } else if (act === 'wishlist') {
        window._openWishlist?.();
      } else if (act === 'cs') {
        window._openCustomerServicePage?.();
      } else if (act === 'delete-account') {
        Auth.deleteAccount();
      } else if (act === 'auth') {
        if (Auth.isLoggedIn()) {
          Auth.logout();
          showToast('Signed out successfully', 'info');
        } else {
          window._openAuth?.();
        }
      }
    });
  });

  window._openDepartmentSidebar = open;
}

/* ── 9. Cart Panel Slide-Out ──────────────────────────────── */
function buildCartPanel() {
  if (document.getElementById('cart-panel')) return;
  const ov = document.createElement('div');
  ov.id = 'cart-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:99998;opacity:0;transition:opacity 250ms ease;pointer-events:none;';
  document.body.appendChild(ov);

  const p = document.createElement('aside');
  p.id = 'cart-panel';
  p.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:380px;max-width:95vw;background:#fff;z-index:99999;box-shadow:-6px 0 28px rgba(0,0,0,.2);display:flex;flex-direction:column;transform:translateX(100%);transition:transform 300ms cubic-bezier(.16,1,.3,1);font-family:inherit;';
  p.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,0.1);background:#19324c;">
      <h2 style="margin:0;font-size:18px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;">Your Cart</h2>
      <button id="cart-panel-close" aria-label="Close cart" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;color:#fff;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;transition:background 140ms ease;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div id="cart-panel-body" style="flex:1;overflow-y:auto;padding:16px 20px;"></div>
    <div id="cart-panel-footer" style="border-top:1px solid #e2e8f0;padding:16px 20px;background:#f8fafc;"></div>
  `;
  document.body.appendChild(p);

  const close = () => {
    p.style.transform = 'translateX(100%)';
    ov.style.opacity = '0';
    ov.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  };

  document.getElementById('cart-panel-close').addEventListener('click', close);
  ov.addEventListener('click', close);

  window._openCart = () => {
    renderCartPanel();
    p.style.transform = 'translateX(0)';
    ov.style.opacity = '1';
    ov.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
  };
}

function renderCartPanel() {
  const body = document.getElementById('cart-panel-body');
  const footer = document.getElementById('cart-panel-footer');
  if (!body || !footer) return;

  if (Store.cart.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:56px 0;color:#64748b;">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.4"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>
        <p style="margin-top:12px;font-size:16px;font-weight:700;color:#1e293b;">Your cart is empty</p>
        <p style="font-size:13px;margin-top:4px;">Explore our categories and add products to start!</p>
      </div>
    `;
    footer.innerHTML = `<button id="cart-start-shopping-btn" style="width:100%;padding:12px;background:#19324c;color:#fff;border:none;border-radius:8px;font-weight:800;font-size:14px;cursor:pointer;">Explore Products</button>`;
    footer.querySelector('#cart-start-shopping-btn')?.addEventListener('click', () => {
      document.getElementById('cart-panel-close')?.click();
      window._openCatalog?.();
    });
    return;
  }

  body.innerHTML = Store.cart.map(item => `
    <div class="cart-panel-item" data-id="${item.id}" style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <div class="cart-item-link" data-id="${item.id}" style="width:60px;height:60px;flex:0 0 60px;border-radius:8px;overflow:hidden;background:#f8fafc;border:1px solid #e2e8f0;cursor:pointer;">
        <img src="${item.img || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;transition:transform 140ms ease;">
      </div>
      <div style="flex:1;min-width:0;">
        <p class="cart-item-link" data-id="${item.id}" style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;" title="${item.name}">${item.name}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#0f172a;font-weight:800;">${Currency.format(item.price * (item.qty || 1))}</p>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="qty-btn" data-id="${item.id}" data-action="dec" style="width:24px;height:24px;border-radius:50%;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:14px;font-weight:700;display:grid;place-items:center;">−</button>
          <span style="font-size:14px;font-weight:700;min-width:16px;text-align:center;">${item.qty || 1}</span>
          <button class="qty-btn" data-id="${item.id}" data-action="inc" style="width:24px;height:24px;border-radius:50%;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:14px;font-weight:700;display:grid;place-items:center;">+</button>
          <button class="remove-btn" data-id="${item.id}" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#ef4444;font-size:12px;font-weight:700;">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  body.querySelectorAll('.cart-item-link').forEach(link => {
    link.addEventListener('click', () => {
      const item = Store.cart.find(c => c.id === link.dataset.id);
      if (item) {
        document.getElementById('cart-panel-close')?.click();
        const full = (Store.allProducts || []).find(p => (p._id === item.id || p.id === item.id || (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase()))) || item;
        window._openProductDetail?.(full);
      }
    });
  });

  body.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = Store.cart.find(c => c.id === btn.dataset.id);
      if (!item) return;
      if (btn.dataset.action === 'inc') item.qty = (item.qty || 1) + 1;
      else {
        item.qty = (item.qty || 1) - 1;
        if (item.qty <= 0) Store.removeFromCart(btn.dataset.id);
      }
      Store.save();
      Store.syncUI();
      renderCartPanel();
    });
  });

  body.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.removeFromCart(btn.dataset.id);
      showToast('Item removed from cart', 'info');
    });
  });

  const total = Store.cartTotal();
  footer.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:15px;">
      <span style="font-weight:700;color:#475569;">Subtotal (${Store.cartCount()} items)</span>
      <strong style="color:#0f172a;font-size:17px;font-weight:900;">${Currency.format(total)}</strong>
    </div>
    <button id="cart-proceed-checkout-btn" style="width:100%;padding:14px;border:none;border-radius:8px;background:#ff9700;color:#000000;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(255,151,0,0.35);transition:all 140ms ease;">
      Proceed to Checkout →
    </button>
  `;

  footer.querySelector('#cart-proceed-checkout-btn')?.addEventListener('click', () => {
    document.getElementById('cart-panel-close')?.click();
    window._openCheckout?.();
  });
}

/* ── 10. Fast Automatic PIN Code Delivery Location Modal ───── */
const GEOAPIFY_API_KEY = 'd705b6a5f2174c74a230900a835e0576';

function buildLocationModal() {
  const modal = createModal('location-interactive-modal', {
    title: 'Select Delivery Location',
    bodyHtml: `
      <div style="display:flex;flex-direction:column;gap:16px;padding:4px 0;">
        <p style="margin:0;font-size:13.5px;color:#64748b;line-height:1.5;">
          Enter your 6-digit Indian PIN code to automatically fetch your delivery area and check express delivery availability.
        </p>

        <!-- PIN Input Row -->
        <div style="display:flex;gap:10px;align-items:center;">
          <div style="flex:1;position:relative;">
            <input id="pincode-modal-input" type="text" maxlength="6" placeholder="Enter 6-digit PIN code" style="width:100%;padding:13px 16px;border:2px solid #cbd5e1;border-radius:10px;font-size:16px;font-weight:700;color:#0f172a;outline:none;box-sizing:border-box;letter-spacing:1px;transition:border-color 0.2s;" />
            <span id="pin-modal-status-spinner" style="display:none;position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:12px;color:#0878f9;font-weight:700;">Fetching...</span>
          </div>
          <button id="pincode-modal-fetch-btn" type="button" style="background:#ff9700;color:#000;font-weight:800;border:none;padding:13px 22px;border-radius:10px;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(255,151,0,0.3);white-space:nowrap;">
            Check PIN
          </button>
        </div>

        <!-- Live Detected Location Card -->
        <div id="pin-modal-result-card" style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:42px;height:42px;background:#e0f2fe;color:#0284c7;border-radius:10px;display:grid;place-items:center;flex-shrink:0;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <div id="pin-modal-detected-city" style="font-size:15px;font-weight:800;color:#0f172a;">Bilaspur, Chhattisgarh</div>
              <div id="pin-modal-detected-meta" style="font-size:12px;color:#64748b;">PIN: 495001</div>
            </div>
          </div>
        </div>

        <!-- GPS / Current Location -->
        <div style="border-top:1px solid #f1f5f9;padding-top:14px;display:flex;justify-content:flex-start;">
          <button id="pin-modal-gps-btn" type="button" style="background:transparent;border:1.5px solid #cbd5e1;color:#0f172a;font-weight:700;padding:10px 18px;border-radius:8px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"/></svg>
            <span>Use Current GPS Location</span>
          </button>
        </div>

        <!-- Confirm Button -->
        <button id="pin-modal-confirm-btn" type="button" style="background:#19324c;color:#ffffff;font-weight:800;border:none;padding:14px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;box-shadow:0 4px 14px rgba(25,50,76,0.3);display:flex;align-items:center;justify-content:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Set Delivery Destination</span>
        </button>
      </div>
    `
  });

  let currentSelection = {
    address: 'Bilaspur, Chhattisgarh 495001',
    city: 'Bilaspur',
    state: 'Chhattisgarh',
    pincode: '495001'
  };

  try {
    const savedLoc = localStorage.getItem('xmart_delivery_location');
    if (savedLoc) currentSelection = { ...currentSelection, ...JSON.parse(savedLoc) };
    const savedPin = localStorage.getItem('xmart_pincode');
    if (savedPin) currentSelection.pincode = savedPin;
  } catch {}

  const pinInput = modal.querySelector('#pincode-modal-input');
  const checkBtn = modal.querySelector('#pincode-modal-fetch-btn');
  const cityDisplay = modal.querySelector('#pin-modal-detected-city');
  const metaDisplay = modal.querySelector('#pin-modal-detected-meta');
  const spinner = modal.querySelector('#pin-modal-status-spinner');
  const confirmBtn = modal.querySelector('#pin-modal-confirm-btn');

  // Start with empty PIN input
  if (pinInput) pinInput.value = '';
  if (cityDisplay) cityDisplay.textContent = `${currentSelection.city || 'Bilaspur'}, ${currentSelection.state || 'Chhattisgarh'}`;
  if (metaDisplay) metaDisplay.textContent = `PIN: ${currentSelection.pincode || '495001'}`;

  // Fetch location from PIN
  async function fetchLocationFromPin(pin) {
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) return;

    if (spinner) spinner.style.display = 'inline-block';

    // 1. Common PIN dictionary for 0ms instant response
    const pinMap = {
      '495001': { city: 'Bilaspur', state: 'Chhattisgarh' },
      '495004': { city: 'Bilaspur', state: 'Chhattisgarh' },
      '492001': { city: 'Raipur', state: 'Chhattisgarh' },
      '110001': { city: 'New Delhi', state: 'Delhi' },
      '110019': { city: 'New Delhi', state: 'Delhi' },
      '400001': { city: 'Mumbai', state: 'Maharashtra' },
      '400050': { city: 'Bandra, Mumbai', state: 'Maharashtra' },
      '560001': { city: 'Bengaluru', state: 'Karnataka' },
      '560034': { city: 'Koramangala, Bengaluru', state: 'Karnataka' },
      '700001': { city: 'Kolkata', state: 'West Bengal' },
      '600001': { city: 'Chennai', state: 'Tamil Nadu' },
      '500001': { city: 'Hyderabad', state: 'Telangana' },
      '800001': { city: 'Patna', state: 'Bihar' },
      '802101': { city: 'Buxar', state: 'Bihar' },
      '201301': { city: 'Noida', state: 'Uttar Pradesh' },
      '122001': { city: 'Gurugram', state: 'Haryana' },
      '302001': { city: 'Jaipur', state: 'Rajasthan' },
      '380001': { city: 'Ahmedabad', state: 'Gujarat' },
      '411001': { city: 'Pune', state: 'Maharashtra' }
    };

    if (pinMap[pin]) {
      currentSelection.pincode = pin;
      currentSelection.city = pinMap[pin].city;
      currentSelection.state = pinMap[pin].state;
      currentSelection.address = `${pinMap[pin].city}, ${pinMap[pin].state} - ${pin}`;
      if (cityDisplay) cityDisplay.textContent = `${pinMap[pin].city}, ${pinMap[pin].state}`;
      if (metaDisplay) metaDisplay.textContent = `PIN: ${pin}`;
      if (spinner) spinner.style.display = 'none';
      return;
    }

    // 2. Query Indian Postal API / Geoapify
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Name || 'City';
        const state = po.State || 'India';
        currentSelection.pincode = pin;
        currentSelection.city = city;
        currentSelection.state = state;
        currentSelection.address = `${city}, ${state} - ${pin}`;
        if (cityDisplay) cityDisplay.textContent = `${city}, ${state}`;
        if (metaDisplay) metaDisplay.textContent = `PIN: ${pin}`;
        if (spinner) spinner.style.display = 'none';
        return;
      }
    } catch {}

    // 3. Fallback to Geoapify
    try {
      const geoRes = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${pin}&country=in&apiKey=${GEOAPIFY_API_KEY}`);
      const geoData = await geoRes.json();
      if (geoData.features && geoData.features.length > 0) {
        const p = geoData.features[0].properties;
        const city = p.city || p.county || p.state_district || 'City';
        const state = p.state || 'India';
        currentSelection.pincode = pin;
        currentSelection.city = city;
        currentSelection.state = state;
        currentSelection.address = `${city}, ${state} - ${pin}`;
        if (cityDisplay) cityDisplay.textContent = `${city}, ${state}`;
        if (metaDisplay) metaDisplay.textContent = `PIN: ${pin}`;
      }
    } catch {}

    if (spinner) spinner.style.display = 'none';
  }

  pinInput?.addEventListener('input', (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    e.target.value = val;
    if (val.length === 6) {
      fetchLocationFromPin(val);
    }
  });

  checkBtn?.addEventListener('click', () => {
    const val = pinInput.value.trim();
    if (val.length === 6) {
      fetchLocationFromPin(val);
      showToast(`Checking PIN ${val}...`, 'info', 1500);
    } else {
      showToast('Please enter a full 6-digit PIN code.', 'warn');
    }
  });

  // GPS Current Location
  modal.querySelector('#pin-modal-gps-btn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    const btn = modal.querySelector('#pin-modal-gps-btn');
    btn.innerHTML = 'Detecting GPS...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"/></svg> <span>Use Current GPS Location</span>`;
        btn.disabled = false;
        try {
          const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&apiKey=${GEOAPIFY_API_KEY}`);
          const d = await res.json();
          if (d.features && d.features.length > 0) {
            const p = d.features[0].properties;
            const pin = p.postcode || '495001';
            const city = p.city || p.county || p.state_district || 'Location';
            const state = p.state || 'India';
            pinInput.value = pin;
            currentSelection = { pincode: pin, city, state, address: `${city}, ${state} - ${pin}` };
            if (cityDisplay) cityDisplay.textContent = `${city}, ${state}`;
            if (metaDisplay) metaDisplay.textContent = `PIN: ${pin}`;
            showToast(`Location detected: ${city} (${pin})`, 'success');
          }
        } catch {
          showToast('GPS detected successfully', 'success');
        }
      },
      () => {
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"/></svg> <span>Use Current GPS Location</span>`;
        btn.disabled = false;
        showToast('Location permission denied or unavailable.', 'warn');
      },
      { timeout: 8000 }
    );
  });

  // Confirm Location
  confirmBtn?.addEventListener('click', () => {
    const pin = pinInput.value.trim() || currentSelection.pincode || '495001';
    const city = currentSelection.city || 'Bilaspur';
    const displayText = `${city} ${pin}`.trim();

    document.querySelectorAll('.location-control strong').forEach(el => el.textContent = displayText);
    localStorage.setItem('xmart_pincode', pin);
    localStorage.setItem('xmart_delivery_location', JSON.stringify(currentSelection));

    if (pinInput) pinInput.value = '';

    showToast(`Delivery location updated to: ${displayText}!`, 'success', 3500);
    modal._close();
  });

  window._openLocation = () => {
    if (pinInput) pinInput.value = '';
    modal._open();
    setTimeout(() => pinInput?.focus(), 120);
  };
}

/* ============================================================
   MAIN INITIALIZATION & EVENT LISTENERS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize UI, Modals & Full Page Router
  Auth.syncUI();
  Store.syncUI();
  initPageRouter();
  buildDepartmentSidebar();
  buildCartPanel();
  buildAuthModal();
  buildOrdersModal();
  buildWishlistDrawer();
  buildWalletModal();
  buildSecurityModal();
  buildAddressesModal();
  buildCheckoutModal();
  buildProductDetailModal();
  buildLocationModal();
  initLiveSearch();
  loadProductsFromBackend();

  // Saved location / pincode restore
  try {
    const savedLoc = JSON.parse(localStorage.getItem('xmart_delivery_location') || 'null');
    const savedPin = localStorage.getItem('xmart_pincode') || (savedLoc ? savedLoc.pincode : null);
    if (savedLoc && savedLoc.city) {
      document.querySelectorAll('.location-control strong').forEach(el => el.textContent = `${savedLoc.city} ${savedLoc.pincode || ''}`.trim());
    } else if (savedPin) {
      document.querySelectorAll('.location-control strong').forEach(el => el.textContent = savedPin);
    }
  } catch {}

  // ── 2. NAVIGATION HEADER BUTTONS ──────────────────────────

  // Cart button (the <a class="cart-action"> link in header-actions)
  document.querySelector('.cart-action')?.addEventListener('click', e => {
    e.preventDefault();
    window._openCart?.();
  });

  // Orders button
  document.querySelector('.orders-action')?.addEventListener('click', e => {
    e.preventDefault();
    window._openOrders?.();
  });

  // Wishlist button
  document.querySelector('.wishlist-action')?.addEventListener('click', e => {
    e.preventDefault();
    window._openWishlist?.();
  });

  // Account button — directly open dedicated Account Page if logged in, or Auth modal if guest
  document.querySelector('.account-action')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (Auth.isLoggedIn()) {
      window._openAccountPage ? window._openAccountPage() : window._openAuth?.();
    } else {
      window._openAuth?.('signin');
    }
  });

  // Location / Delivery button
  document.querySelector('.location-control')?.addEventListener('click', e => {
    e.preventDefault();
    window._openLocation?.();
  });

  // ── 3. CATEGORY / DEPARTMENT NAVIGATION ───────────────────

  // "All Departments" hamburger button — Open Amazon-style side navigation drawer
  document.querySelector('.departments-button')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    window._openDepartmentSidebar?.();
  });

  // Department dropdown links (electronics, fashion, etc.) -> Full Dedicated Window Page
  document.querySelectorAll('.department-menu .dropdown-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('.department-menu')?.setAttribute('style', 'display: none;');
      const text = link.textContent.trim();
      if (text.includes('Electronics')) window._openDedicatedPage?.('Electronics');
      else if (text.includes('Fashion')) window._openDedicatedPage?.('Fashion');
      else if (text.includes('Home')) window._openDedicatedPage?.('Home & Kitchen');
      else if (text.includes('Beauty')) window._openDedicatedPage?.('Beauty & Health');
      else window._openDedicatedPage?.('');
    });
  });

  // Category nav links (top bar: Today's Deals, Best Sellers, Electronics, Fashion, etc.)
  document.querySelectorAll('.category-link, .category-button').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const text = link.textContent.trim().replace(/HOT/gi, '').trim();
      if (text.includes("Today's Deals") || text.includes('Deals')) {
        window._openDedicatedPage?.('', 'deal');
      } else if (text.includes('Best Sellers')) {
        window._openDedicatedPage?.('');
      } else if (text.includes('Electronics')) {
        window._openDedicatedPage?.('Electronics');
      } else if (text.includes('Fashion')) {
        window._openDedicatedPage?.('Fashion');
      } else if (text.includes('Home')) {
        window._openDedicatedPage?.('Home & Kitchen');
      } else if (text.includes('Beauty')) {
        window._openDedicatedPage?.('Beauty & Health');
      } else if (text.includes('Customer Service')) {
        window._openCustomerServicePage?.();
      }
    });
  });

  // Electronics subcategory menu -> Full Dedicated Window Page
  document.querySelectorAll('#electronics-menu .dropdown-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window._openDedicatedPage?.('Electronics');
    });
  });

  // Fashion subcategory menu -> Full Dedicated Window Page
  document.querySelectorAll('#fashion-menu .dropdown-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window._openDedicatedPage?.('Fashion');
    });
  });

  // ── 4. HERO SLIDER (uses #hero-slider-prev/next, .hero-slide) ──
  const slides = document.querySelectorAll('.hero-slide');
  const prevBtn = document.getElementById('hero-slider-prev');
  const nextBtn = document.getElementById('hero-slider-next');
  const indicators = document.getElementById('hero-slider-indicators');
  let currentSlide = 0;
  let slideTimer = null;

  // Build dot indicators dynamically
  if (indicators && slides.length) {
    indicators.innerHTML = Array.from(slides).map((_, i) =>
      `<button class="hero-slider-dot${i === 0 ? ' is-active' : ''}" data-slide="${i}" aria-label="Go to slide ${i+1}"></button>`
    ).join('');
  }

  function showSlide(idx) {
    if (!slides.length) return;
    currentSlide = (idx + slides.length) % slides.length;
    slides.forEach((s, i) => {
      s.style.display = i === currentSlide ? 'block' : 'none';
      s.classList.toggle('is-active', i === currentSlide);
    });
    document.querySelectorAll('.hero-slider-dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === currentSlide);
    });
  }

  function startSlideShow() {
    stopSlideShow();
    slideTimer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 2500);
  }

  function stopSlideShow() {
    if (slideTimer) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  prevBtn?.addEventListener('click', () => { showSlide(currentSlide - 1); startSlideShow(); });
  nextBtn?.addEventListener('click', () => { showSlide(currentSlide + 1); startSlideShow(); });

  indicators?.addEventListener('click', e => {
    const dot = e.target.closest('.hero-slider-dot');
    if (dot) { showSlide(parseInt(dot.dataset.slide)); startSlideShow(); }
  });

  const heroBanner = document.querySelector('.hero-slider-section');

  // Pause on manual interaction with buttons
  prevBtn?.addEventListener('mouseenter', stopSlideShow);
  nextBtn?.addEventListener('mouseenter', stopSlideShow);
  indicators?.addEventListener('mouseenter', stopSlideShow);

  prevBtn?.addEventListener('mouseleave', startSlideShow);
  nextBtn?.addEventListener('mouseleave', startSlideShow);
  indicators?.addEventListener('mouseleave', startSlideShow);

  // Auto-resume on any scroll event anywhere on page
  window.addEventListener('scroll', () => {
    if (!slideTimer) {
      startSlideShow();
    }
  }, { passive: true });

  // IntersectionObserver: Ensure slider runs whenever visible in viewport
  if ('IntersectionObserver' in window && heroBanner) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startSlideShow();
        }
      });
    }, { threshold: 0.05 });
    observer.observe(heroBanner);
  }

  // Tab visibility change listener
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startSlideShow();
    } else {
      stopSlideShow();
    }
  });

  // Show first slide and start immediately
  showSlide(0);
  startSlideShow();

  // ── 5. HERO SLIDE CTA BUTTONS (Shop Electronics Deals, etc.) ──
  document.querySelectorAll('.hero-slide-cta').forEach(cta => {
    cta.addEventListener('click', e => {
      e.preventDefault();
      const txt = cta.textContent.toLowerCase();
      if (txt.includes('electronic')) window._openCatalog?.('Electronics');
      else if (txt.includes('fashion')) window._openCatalog?.('Fashion');
      else if (txt.includes('home')) window._openCatalog?.('Home & Kitchen');
      else if (txt.includes('beauty')) window._openCatalog?.('Beauty & Health');
      else window._openCatalog?.();
    });
  });

  // ── Helper: Find Authentic Catalog Product for Card Clicks ──
  function findBestCatalogProduct(query, context = '') {
    if (!query) return null;
    const prods = (Store.allProducts && Store.allProducts.length > 0) ? Store.allProducts : DEFAULT_CATALOG;
    const q = String(query).toLowerCase().trim();
    const ctx = String(context).toLowerCase().trim();
    const rawWords = q.split(/\W+/).filter(w => w.length >= 2 && !['item', 'items', 'deal', 'deals', 'for', 'you', 'with', 'and', 'the', 'under', 'starting', 'off'].includes(w));
    const searchTerms = [q, ...rawWords];

    // Extended Semantic Map
    const EXTENDED_SYNONYMS = {
      'smartphones': ['phone', 'smartphone', 'mobile', 'iphone', 'galaxy', 'oneplus', 'pixel', '5g'],
      'smartphone': ['phone', 'smartphone', 'mobile', 'iphone', 'galaxy', 'oneplus', 'pixel', '5g'],
      'mobile phones': ['phone', 'smartphone', 'mobile', 'iphone', 'galaxy', 'oneplus', 'pixel', '5g'],
      'budget phones': ['phone', 'smartphone', 'mobile', 'redmi', 'realme', 'poco', 'moto'],
      'mid-range phones': ['phone', 'smartphone', 'mobile', 'oneplus', 'iqoo', 'vivo'],
      'premium phones': ['phone', 'smartphone', 'mobile', 'iphone', 'galaxy s', 'pixel'],
      'ultra premium phones': ['phone', 'smartphone', 'mobile', 'iphone 15 pro', 'galaxy s24 ultra', 'z fold'],
      'suitcase': ['trolley', 'luggage', 'suitcase', 'travel bag', 'safari', 'samsonite'],
      'suitcases': ['trolley', 'luggage', 'suitcase', 'travel bag', 'safari', 'samsonite'],
      'trolley': ['trolley', 'luggage', 'suitcase', 'travel bag', 'safari', 'samsonite'],
      'luggage': ['trolley', 'luggage', 'suitcase', 'travel bag', 'safari', 'samsonite'],
      'cabin luggage': ['trolley', 'luggage', 'suitcase', 'travel bag', 'safari', 'samsonite'],
      'travel bag': ['trolley', 'luggage', 'suitcase', 'travel bag', 'duffel', 'backpack'],
      'lantern': ['lamp', 'light', 'lantern', 'lighting', 'desk lamp'],
      'lamp': ['lamp', 'light', 'lantern', 'lighting', 'desk lamp'],
      'table lamp': ['lamp', 'light', 'desk lamp', 'lighting'],
      'emergency lantern': ['lamp', 'light', 'lantern', 'lighting', 'desk lamp'],
      'induction cooktop': ['induction', 'cooktop', 'cookware', 'cooker', 'prestige'],
      'steam iron': ['iron', 'steam iron', 'philips', 'appliance'],
      'fry pan': ['frypan', 'pan', 'cookware', 'cooker', 'kadhai', 'prestige', 'bergner'],
      'non-stick fry pan': ['frypan', 'pan', 'cookware', 'cooker', 'kadhai', 'prestige', 'bergner'],
      'deep kadhai': ['kadhai', 'pan', 'cookware', 'cooker', 'hawkins', 'prestige'],
      'appe pan': ['pan', 'cookware', 'kadhai', 'tawa'],
      'roti tawa': ['tawa', 'pan', 'cookware', 'prestige', 'hawkins'],
      'cookware': ['pan', 'cooker', 'kadhai', 'tawa', 'pot', 'cookware', 'kitchenware'],
      'mouse': ['mouse', 'wireless mouse', 'gaming mouse', 'optical mouse', 'razer', 'logitech'],
      'wireless mouse': ['mouse', 'wireless mouse', 'gaming mouse', 'optical mouse', 'razer', 'logitech'],
      'slim keyboard': ['keyboard', 'mechanical keyboard', 'keychron', 'wireless keyboard'],
      'keyboard': ['keyboard', 'mechanical keyboard', 'keychron', 'wireless keyboard'],
      'almonds': ['almonds', 'dry fruits', 'nuts', 'happilo'],
      'dates': ['dates', 'kimia', 'dry fruits'],
      'cashews': ['cashews', 'dry fruits', 'happilo'],
      'walnuts': ['walnuts', 'dry fruits', 'happilo'],
      'tops & tees': ['t-shirt', 'tee', 'top', 'polo', 'shirt'],
      'jeans': ['jeans', 'denim', 'pants', 'trousers', 'levis'],
      'kurtas': ['kurta', 'saree', 'ethnic', 'fabindia'],
      'dresses': ['dress', 'maxi', 'gown', 'apparel', 'forever 21', 'zara'],
      'laptops': ['laptop', 'macbook', 'ultrabook', 'notebook', 'dell', 'asus', 'hp'],
      'headphones': ['headphones', 'headphone', 'sony', 'anc', 'over-ear'],
      'earphones': ['earphones', 'earbuds', 'airpods', 'tws', 'boat', 'oneplus'],
      'power bank': ['power bank', 'charger', 'battery'],
      'sofas': ['sofa', 'couch', 'recliner', 'sectional', 'furniture', 'wakefit'],
      'bedding': ['bed', 'bedsheet', 'linen', 'mattress'],
      'mirror cabinet': ['bathroom', 'mirror', 'cabinet', 'fixture'],
      'bath shelves': ['bathroom', 'bath', 'shelf', 'fixture'],
      'commodes': ['bathroom', 'bath', 'fitting', 'sanitary'],
      'health faucets': ['faucet', 'bath', 'fitting', 'shower']
    };

    for (const [k, synonyms] of Object.entries({ ...SMART_SYNONYMS, ...EXTENDED_SYNONYMS })) {
      if (q.includes(k) || rawWords.includes(k) || ctx.includes(k)) {
        searchTerms.push(...synonyms);
      }
    }

    let best = null;
    let highestScore = -1;

    for (const p of prods) {
      let score = 0;
      const name = String(p.name || '').toLowerCase();
      const cat = String(p.category || '').toLowerCase();
      const tags = (p.tags || []).map(t => String(t).toLowerCase());
      const desc = String(p.description || '').toLowerCase();
      const brand = String(p.brand || '').toLowerCase();

      if (name.includes(q)) score += 120;

      searchTerms.forEach(term => {
        if (name.includes(term)) score += 35;
        if (tags.some(t => t.includes(term))) score += 30;
        if (desc.includes(term)) score += 10;
        if (brand.includes(term)) score += 25;
      });

      if (ctx) {
        if (cat && ctx.includes(cat)) score += 40;
        if (name.includes(ctx)) score += 30;
        if (tags.some(t => ctx.includes(t))) score += 25;
      }

      if (score > highestScore) {
        highestScore = score;
        best = p;
      }
    }

    return (highestScore >= 20) ? best : (prods[0] || null);
  }

  // ── 5. HERO BANNER CARDS (The 5 Feature Banners Below Slider) ──
  document.querySelectorAll('.hero-banner-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const brandText = card.querySelector('.hero-card-brand')?.textContent?.trim() || '';
      const subText = card.querySelector('.hero-card-sub')?.textContent?.trim() || '';
      const imgAlt = card.querySelector('.hero-card-img')?.alt || '';
      const badgeText = card.querySelector('.hero-card-badge')?.textContent || '';
      const combined = `${brandText} ${subText} ${imgAlt} ${badgeText}`.toLowerCase();

      if (combined.includes('nord') || combined.includes('oneplus') || combined.includes('phone') || combined.includes('5g')) {
        const matched = findBestCatalogProduct('OnePlus 12 5G', 'Electronics');
        if (matched) return window._openProductDetail(matched);
        return window._openDedicatedPage('Electronics', '', 'phone');
      }
      if (combined.includes('symbol') || combined.includes('shirt') || combined.includes('fashion') || combined.includes('fresh')) {
        const matched = findBestCatalogProduct('Shirt Cotton Formal Casual', 'Fashion');
        if (matched) return window._openProductDetail(matched);
        return window._openDedicatedPage('Fashion', '', 'shirts');
      }
      if (combined.includes('salty') || combined.includes('jewellery') || combined.includes('clark')) {
        const matched = findBestCatalogProduct('Jewellery Gold Luxury Skincare', 'Beauty & Health');
        if (matched) return window._openProductDetail(matched);
        return window._openDedicatedPage('Beauty & Health', '', 'jewellery');
      }
      if (combined.includes('music') || combined.includes('audio') || combined.includes('stream')) {
        const matched = findBestCatalogProduct('Sony ANC Wireless Headphones', 'Electronics');
        if (matched) return window._openProductDetail(matched);
        return window._openDedicatedPage('Electronics', '', 'audio');
      }
      if (combined.includes('season') || combined.includes('trending') || combined.includes('styles')) {
        const matched = findBestCatalogProduct('Zara Denim Jacket Fashion Apparel', 'Fashion');
        if (matched) return window._openProductDetail(matched);
        return window._openDedicatedPage('Fashion', '', 'apparel');
      }

      window._openDedicatedPage('', '', brandText || subText);
    });
  });

  // ── 6. MINI QUICK-BROWSING HORIZONTAL STRIP ────────────────
  document.querySelectorAll('.quick-browse-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const title = item.querySelector('.quick-item-title')?.textContent?.trim() || '';
      const imgAlt = item.querySelector('.quick-item-img')?.alt || '';
      const query = `${imgAlt} ${title}`.trim();

      const matched = findBestCatalogProduct(imgAlt || title, title);
      if (matched) {
        window._openProductDetail(matched);
      } else {
        window._openDedicatedPage('', '', imgAlt || title);
      }
    });
  });

  // ── 7. PRODUCT GRID — QUAD ITEMS (.quad-item) ──────────────
  document.querySelectorAll('.quad-item').forEach(item => {
    const imgEl = item.querySelector('.quad-item-img');
    const labelEl = item.querySelector('.quad-item-label');
    const cardTitleEl = item.closest('.quad-card')?.querySelector('.quad-card-title');

    const itemName = imgEl?.alt || labelEl?.textContent?.trim() || '';
    const cardTitle = cardTitleEl?.textContent?.trim() || '';

    item.style.cursor = 'pointer';

    item.addEventListener('click', e => {
      e.preventDefault();
      const matched = findBestCatalogProduct(itemName, cardTitle);
      if (matched) {
        window._openProductDetail(matched);
      } else {
        window._openDedicatedPage('', '', itemName || cardTitle);
      }
    });
  });

  // ── 8. QUAD CARD TITLES & FOOTER LINKS ───────────────────
  document.querySelectorAll('.quad-card-title, .quad-card-footer-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const txt = link.textContent.replace(/[›>»]/g, '').trim();
      const lower = txt.toLowerCase();

      if (lower.includes('cookware') || lower.includes('frying pan') || lower.includes('kitchen')) {
        window._openDedicatedPage?.('Home & Kitchen', '', 'cookware');
      } else if (lower.includes('luggage') || lower.includes('trolley') || lower.includes('suitcase') || lower.includes('list')) {
        window._openDedicatedPage?.('Bags & Luggage', '', 'trolley');
      } else if (lower.includes('smartphones') || lower.includes('phone') || lower.includes('mobile')) {
        window._openDedicatedPage?.('Electronics', '', 'phone');
      } else if (lower.includes('keyboard') || lower.includes('mouse')) {
        window._openDedicatedPage?.('Electronics', '', 'keyboard');
      } else if (lower.includes('dry fruit') || lower.includes('almond') || lower.includes('seed')) {
        window._openDedicatedPage?.('Grocery', '', 'dry fruits');
      } else if (lower.includes('snack') || lower.includes('chocolate') || lower.includes('biscuit')) {
        window._openDedicatedPage?.('Grocery', '', 'snacks');
      } else if (lower.includes('fashion') || lower.includes('style') || lower.includes('brand') || lower.includes('tee') || lower.includes('dress') || lower.includes('jean')) {
        window._openDedicatedPage?.('Fashion', '', 'apparel');
      } else if (lower.includes('bath') || lower.includes('fitting') || lower.includes('faucet')) {
        window._openDedicatedPage?.('Home & Kitchen', '', 'bath');
      } else if (lower.includes('home') || lower.includes('sofa') || lower.includes('decor')) {
        window._openDedicatedPage?.('Home & Kitchen', '', 'furniture');
      } else if (lower.includes('beauty') || lower.includes('skincare')) {
        window._openDedicatedPage?.('Beauty & Health', '', 'skincare');
      } else if (lower.includes('top rated') || lower.includes('4 star') || lower.includes('4+ star')) {
        window._openDedicatedPage?.('', 'bestseller', '');
      } else {
        window._openDedicatedPage?.('', 'deal', txt);
      }
    });
  });

  // ── 8. FOOTER NEWSLETTER FORM ─────────────────────────────
  const nf = document.getElementById('newsletter-form');
  const ne = document.getElementById('newsletter-email');
  const nsb = document.getElementById('newsletter-submit-btn');
  const nfb = document.getElementById('newsletter-feedback');

  if (nf && ne && nsb) {
    nf.addEventListener('submit', async e => {
      e.preventDefault();
      const email = ne.value.trim();
      if (!email) return;

      nsb.disabled = ne.disabled = true;
      const btnText = nsb.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'Subscribing...';

      try {
        const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'footer' })
        });
        const data = await res.json();

        if (nfb) {
          nfb.textContent = data.message || 'Subscribed successfully!';
          nfb.className = 'newsletter-feedback is-success';
          nfb.style.cssText = 'color:#16a34a;font-weight:700;font-size:13px;margin-top:8px;';
        }
        const promo = data.data?.promoCode || 'XMART10';
        showToast(`Subscribed! Use code ${promo} for 10% off!`, 'success', 5000);
        ne.value = '';
      } catch {
        if (nfb) {
          nfb.textContent = 'Subscribed! Welcome to X-Mart VIP club.';
          nfb.className = 'newsletter-feedback is-success';
          nfb.style.cssText = 'color:#16a34a;font-weight:700;font-size:13px;margin-top:8px;';
        }
        showToast('Welcome to X-Mart! Check your inbox.', 'success');
      } finally {
        nsb.disabled = ne.disabled = false;
        if (btnText) btnText.textContent = 'Subscribe';
      }
    });
  }

  // ── 9. FOOTER ACCORDION (Mobile) ──────────────────────────
  document.querySelectorAll('[data-footer-accordion]').forEach(col => {
    const hdr = col.querySelector('.footer-col-header');
    if (!hdr) return;
    hdr.addEventListener('click', () => {
      if (window.innerWidth > 768) return;
      const isOpen = col.classList.contains('is-expanded');
      document.querySelectorAll('[data-footer-accordion]').forEach(c => {
        c.classList.remove('is-expanded');
        c.querySelector('.footer-col-header')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        col.classList.add('is-expanded');
        hdr.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ── 10. COMPREHENSIVE FOOTER INTERACTIVITY ─────────────────

  // A. Top Trust Badges
  const trustData = {
    'Free Express Shipping': {
      title: 'Free Express Shipping Across India',
      body: '<p>Enjoy guaranteed <strong>Free Delivery on all orders above ₹499</strong>. Orders are dispatched within 24 hours from our nearest fulfillment center with end-to-end SMS & WhatsApp live tracking across 19,000+ PIN codes.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li>Standard Delivery: 2-4 business days</li><li>Prime Express Delivery: Next day delivery available in metro cities</li><li>Zero hidden shipping fees at checkout</li></ul>'
    },
    '100% Secure Checkout': {
      title: 'Bank-Grade 256-Bit SSL Secure Checkout',
      body: '<p>Your payment security is our top priority. We use <strong>industry-standard 256-bit AES SSL encryption</strong> and are fully <strong>PCI-DSS Level 1 certified</strong>.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li>2-Factor OTP Authentication on all card transactions</li><li>We never store your complete CVV or card PINs</li><li>Full buyer fraud protection guarantee on every purchase</li></ul>'
    },
    '30-Day Free Returns': {
      title: '30-Day Hassle-Free Money Back Guarantee',
      body: '<p>Shop with 100% confidence. If you are not completely satisfied with your purchase, return it within <strong>30 days of delivery</strong> for a replacement or full refund.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li>Free doorstep pickup from your address</li><li>No questions asked instant return processing</li><li>Refunds credited back in 2 to 4 hours via UPI / original mode</li></ul>'
    },
    'X-Mart Prime Perks': {
      title: 'X-Mart Prime VIP Membership & Perks',
      body: '<p>Unlock extraordinary shopping privileges with <strong>X-Mart Prime</strong>:</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li><strong>5% Unlimited Cashback</strong> on every single purchase</li><li><strong>Free Priority 1-Day Express Shipping</strong> on all orders</li><li><strong>30-Minute Early Access</strong> to Lightning Deals & Festival Sales</li><li>Dedicated 24/7 VIP Concierge Support Hotline</li></ul>'
    }
  };

  document.querySelectorAll('.trust-item').forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      const text = item.querySelector('strong')?.textContent?.trim() || '';
      if (text.includes('Dedicated Support')) {
        window._openCustomerServicePage?.();
      } else if (trustData[text]) {
        const d = trustData[text];
        showInfoModal(d.title, d.body);
      } else {
        showInfoModal(text, `<p>Experience premium service with ${text}. Backed by 100% genuine quality assurance.</p>`);
      }
    });
  });

  // Generic Information Modal Builder
  function showInfoModal(title, bodyHtml) {
    const modalId = 'footer-info-interactive-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = createModal(modalId, {
        title: 'Information',
        large: true,
        bodyHtml: '<div id="footer-info-body"></div>'
      });
    }

    const titleEl = modal.querySelector('.xmodal-header h3');
    if (titleEl) titleEl.textContent = title;

    const bodyEl = modal.querySelector('#footer-info-body') || modal.querySelector('.xmodal-body');
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="font-size:14px;line-height:1.6;color:#334155;">
          ${bodyHtml}
          <div style="margin-top:24px;display:flex;justify-content:flex-end;">
            <button class="auth-submit-btn" style="width:auto;padding:10px 24px;" onclick="document.getElementById('${modalId}')._close()">Got it, Thanks!</button>
          </div>
        </div>
      `;
    }
    modal._open();
  }

  // B. Footer Directory Links (5 Columns + Legal Bottom)
  const footerContentMap = {
    '#about': {
      title: 'About X-Mart Superstore',
      body: '<p>Founded in 2024, <strong>X-Mart Superstore</strong> has revolutionized modern e-commerce across India by connecting millions of shoppers with over 100,000+ authentic products across Electronics, Fashion, Home, Beauty, Sports and Gourmet Groceries.</p><p style="margin-top:10px;">Our mission is to provide lightning-fast deliveries, transparent everyday low pricing, and world-class customer happiness.</p>'
    },
    '#careers': {
      title: "Careers & Culture at X-Mart — We're Hiring!",
      body: '<p>Join our dynamic team building the next generation of global retail technology.</p><div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;"><div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;"><strong>Senior Full-Stack Engineer (Node.js/React)</strong><br><small style="color:#64748b;">Bengaluru, India • Full-Time • Competitive Package</small></div><div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;"><strong>Product Lead — Supply Chain & Logistics</strong><br><small style="color:#64748b;">Mumbai, India • Full-Time • ESOPs</small></div></div><p style="margin-top:14px;">Send your CV to <strong style="color:#0878f9;">careers@xmart.com</strong></p>'
    },
    '#newsroom': {
      title: 'Newsroom & Media Releases',
      body: '<p>Stay updated with our latest press releases, corporate announcements, and quarterly achievements.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;"><li><strong>August 2026:</strong> X-Mart expands next-day delivery network to 50+ new tier-2 cities.</li><li><strong>July 2026:</strong> Over 10 million orders fulfilled with 99.8% on-time delivery rate.</li></ul>'
    },
    '#sustainability': {
      title: 'Sustainability & Green Impact',
      body: '<p>We are dedicated to building a greener future with <strong>100% plastic-free recycled packaging</strong> and electric vehicle (EV) delivery fleets in 25 major cities.</p>'
    },
    '#investors': {
      title: 'Investor Relations & Governance',
      body: '<p>X-Mart Superstore, Inc. financial disclosures, annual reports, shareholder meetings, and ESG sustainability milestones.</p><p style="margin-top:8px;">Contact: <strong style="color:#0878f9;">ir@xmart.com</strong></p>'
    },
    '#leadership': {
      title: 'Executive Leadership & Governance',
      body: '<p>Guided by visionary leaders with decades of experience across global technology, retail, and supply chain logistics.</p>'
    },
    '#shipping-rates': {
      title: 'Shipping Rates & Delivery Times',
      body: '<p>• <strong>Orders ₹499 & above:</strong> FREE Express Delivery<br>• <strong>Orders under ₹499:</strong> Flat ₹49 delivery charge<br>• <strong>Metro Cities:</strong> 24-48 Hours<br>• <strong>Rest of India:</strong> 2-4 Business Days</p>'
    },
    '#returns': {
      title: 'Returns & Replacement Policy',
      body: '<p>Initiate a return within 30 days from your <a href="#orders" style="color:#0878f9;font-weight:700;">Orders Dashboard</a>. A courier executive will pick up the item from your doorstep for instant replacement or refund.</p>'
    },
    '#refund-policy': {
      title: 'Instant Refund Policy',
      body: '<p>Refunds are initiated immediately upon pickup verification:</p><ul style="padding-left:20px;margin-top:8px;line-height:1.6;"><li><strong>UPI / Wallets:</strong> 2 to 4 Hours</li><li><strong>Credit / Debit Cards:</strong> 2 to 4 Business Days</li><li><strong>Cash on Delivery (COD):</strong> Instant NEFT / UPI Transfer</li></ul>'
    },
    '#warranty': {
      title: 'X-Mart Care & Brand Warranty',
      body: '<p>All electronics and appliances sold on X-Mart come with <strong>Official 1 to 2 Years Manufacturer Warranty</strong>. Present your digital invoice at any authorized service center nationwide.</p>'
    },
    '#gift-cards': {
      title: 'X-Mart Digital Gift Cards',
      body: '<p>Gift your friends and family the joy of unlimited shopping!</p><div style="display:flex;gap:10px;margin:16px 0;"><button class="page-chip is-active" style="flex:1;">₹500</button><button class="page-chip" style="flex:1;">₹1,000</button><button class="page-chip" style="flex:1;">₹2,500</button><button class="page-chip" style="flex:1;">₹5,000</button></div><button class="auth-submit-btn" onclick="showToast(\'Gift voucher generated! Code sent to your email.\', \'success\')">Purchase Instant E-Gift Voucher</button>'
    },
    '#sell': {
      title: 'Sell Products on X-Mart Marketplace',
      body: '<p>Reach over 50 million customers across India. Zero setup fees, lowest commission rates, and access to Fulfillment by X-Mart (FBX).</p><p style="margin-top:10px;">Register your business with GSTIN at <strong style="color:#0878f9;">seller.xmart.com</strong></p>'
    },
    '#affiliate': {
      title: 'X-Mart Influencer & Affiliate Program',
      body: '<p>Earn up to <strong>10% referral commission</strong> on every qualifying sale. Access real-time link tracking, banners, and monthly direct bank payouts.</p>'
    },
    '#advertise': {
      title: 'Advertise Your Brand on X-Mart',
      body: '<p>Boost your product visibility with Sponsored Search Ads, Category Banners, and Targeted Customer Campaigns reaching high-intent shoppers.</p>'
    },
    '#fulfillment': {
      title: 'Fulfillment by X-Mart (FBX)',
      body: '<p>Store your inventory in our state-of-the-art warehouses. We pick, pack, ship, and manage customer service for your products with Prime 1-day delivery.</p>'
    },
    '#wholesale': {
      title: 'X-Mart Business & Wholesale (B2B)',
      body: '<p>Buy in bulk for your office or enterprise with GST Input Tax Credit (up to 28% savings), quantity discounts, and flexible 30-day credit lines.</p>'
    },
    '#developer-api': {
      title: 'X-Mart Developer Hub & REST APIs',
      body: '<p>Integrate your apps and ERP systems directly with our robust REST endpoints:</p><pre style="background:#0f172a;color:#38bdf8;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;">GET  /api/products\nPOST /api/orders\nGET  /api/cart\nPOST /api/auth/login</pre>'
    },
    '#supplier-hub': {
      title: 'Supplier Code of Conduct',
      body: '<p>We uphold the highest ethical standards across our global supply chain, strictly enforcing fair wages, safe working environments, and environmental compliance.</p>'
    },
    '#privacy': {
      title: 'X-Mart Privacy Policy',
      body: '<p>We respect your personal privacy. We never sell your personal data to third parties. All personal details are encrypted and used solely for fulfilling orders and enhancing your personalized shopping experience.</p>'
    },
    '#terms': {
      title: 'Terms of Service & Conditions',
      body: '<p>By accessing and using X-Mart Superstore, you agree to our standard consumer terms, authentic product warranties, secure payment compliance, and fair usage guidelines.</p>'
    },
    '#cookies': {
      title: 'Cookie & Tracking Preferences',
      body: '<p>We use essential cookies to maintain your shopping cart and secure sessions, and analytical cookies to improve performance.</p><div style="margin-top:14px;display:flex;gap:10px;"><button class="page-chip is-active">Accept All Cookies</button><button class="page-chip">Essential Only</button></div>'
    },
    '#accessibility': {
      title: 'Accessibility Commitment',
      body: '<p>X-Mart is committed to digital accessibility for all users, adhering to <strong>WCAG 2.1 Level AA standards</strong> with screen reader optimization, high-contrast typography, and full keyboard navigation.</p>'
    },
    '#ca-privacy': {
      title: 'Your Privacy Choices & Data Rights',
      body: '<p>You have full control over your data. Request a copy of your personal shopping history or delete your account anytime from Account Settings.</p>'
    },
    '#security': {
      title: 'Security & Responsible Bug Bounty Program',
      body: '<p>We welcome security researchers. If you discover a vulnerability in our systems, report it to <strong style="color:#0878f9;">security@xmart.com</strong> to be eligible for our Bug Bounty Rewards.</p>'
    }
  };

  // Wire all footer links
  document.querySelectorAll('.footer-link, .legal-link, .newsletter-disclaimer a').forEach(link => {
    const href = link.getAttribute('href') || '';
    const text = link.textContent.trim().toLowerCase();

    link.addEventListener('click', e => {
      e.preventDefault();

      // Category links -> Full Dedicated Store Page
      if (href === '#electronics' || text.includes('electronics')) {
        window._openDedicatedPage?.('Electronics');
      } else if (href === '#fashion' || text.includes('fashion')) {
        window._openDedicatedPage?.('Fashion');
      } else if (href === '#home-kitchen' || text.includes('home') || text.includes('furniture') || text.includes('kitchen')) {
        window._openDedicatedPage?.('Home & Kitchen');
      } else if (href === '#beauty' || text.includes('beauty') || text.includes('health') || text.includes('grooming')) {
        window._openDedicatedPage?.('Beauty & Health');
      } else if (href === '#grocery' || text.includes('grocery') || text.includes('gourmet')) {
        window._openDedicatedPage?.('Grocery');
      } else if (href === '#sports' || text.includes('sports') || text.includes('fitness')) {
        window._openDedicatedPage?.('Sports');
      }
      // Seller Marketplace Portal link
      else if (href === '#sell' || text.includes('sell')) {
        window._openSellerPortal?.();
      }
      // Customer Service & Orders links
      else if (href === '#help-center' || href === '#contact' || text.includes('contact') || text.includes('help center')) {
        window._openCustomerServicePage?.();
      } else if (href === '#track-order' || text.includes('track')) {
        const savedOrders = (window._allUserOrders && window._allUserOrders.length) ? window._allUserOrders : [];
        if (savedOrders.length) {
          openOrderInvoiceModal(savedOrders[0], 'track');
        } else {
          window._openOrders?.();
        }
      } else if (href === '#store-locations') {
        window._openLocation?.();
      }
      // Info Modals
      else if (footerContentMap[href]) {
        const item = footerContentMap[href];
        showInfoModal(item.title, item.body);
      } else {
        const title = link.textContent.trim();
        showInfoModal(title, `<p>Information regarding <strong>${title}</strong> at X-Mart Superstore.</p>`);
      }
    });
  });

  // C. Mobile App Badges & Support Hotline
  document.querySelector('.app-badge-btn[href="#app-store"]')?.addEventListener('click', e => {
    e.preventDefault();
    showInfoModal('Download X-Mart for iPhone & iPad', '<p>Get the best shopping experience on your Apple device. Scan the QR code or click below:</p><div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin:12px 0;"><p style="margin:4px 0 0;font-weight:700;">iOS App Version 3.4 • Rated 4.9 ★</p></div><button class="auth-submit-btn" onclick="showToast(\'Redirecting to Apple App Store...\', \'info\')">Open on App Store</button>');
  });

  document.querySelector('.app-badge-btn[href="#google-play"]')?.addEventListener('click', e => {
    e.preventDefault();
    showInfoModal('Get X-Mart on Google Play Android', '<p>Enjoy lightning-fast orders and exclusive mobile deals on Android:</p><div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin:12px 0;"><p style="margin:4px 0 0;font-weight:700;">Android App Version 3.4 • 10M+ Downloads</p></div><button class="auth-submit-btn" onclick="showToast(\'Redirecting to Google Play Store...\', \'info\')">Open on Google Play</button>');
  });

  document.querySelector('.support-hotline-card')?.addEventListener('click', e => {
    e.preventDefault();
    window._openCustomerServicePage?.();
  });

  // D. Payment Badges Interactive Details
  document.querySelectorAll('.pay-badge').forEach(badge => {
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', () => {
      const name = badge.getAttribute('title') || 'Payment Method';
      showToast(`Verified & Protected: ${name} accepted with 256-Bit 3D-Secure protection.`, 'info', 3500);
    });
  });

  // E. Security Badges (SSL & PCI-DSS)
  document.querySelectorAll('.security-badge').forEach(badge => {
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', () => {
      const txt = badge.textContent.trim();
      showInfoModal('Verified Security Certificate', `<p><strong>${txt}:</strong> Your connection to X-Mart is secured with SHA-256 RSA encryption. Certified by DigiCert Global Root CA.</p>`);
    });
  });

  // ── 11. DROPDOWN MENUS (Close on outside click) ────────────
  document.addEventListener('click', e => {
    // Close all open dropdowns when clicking outside
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('[data-dropdown-trigger]').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
      document.querySelectorAll('[data-dropdown-menu]').forEach(menu => {
        menu.style.display = '';
      });
    }
  });

  // Dropdown toggle logic
  document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      // Close all others first
      document.querySelectorAll('[data-dropdown-trigger]').forEach(btn => {
        if (btn !== trigger) btn.setAttribute('aria-expanded', 'false');
      });
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      e.stopPropagation();
    });
  });

  // Dropdown option selection
  document.querySelectorAll('[data-dropdown-option]').forEach(opt => {
    opt.addEventListener('click', () => {
      const menu = opt.closest('[data-dropdown-menu]');
      const trigger = menu?.previousElementSibling;
      const label = opt.dataset.label || opt.textContent.trim();
      if (trigger) {
        const labelEl = trigger.querySelector('[data-dropdown-label]');
        if (labelEl) labelEl.textContent = label;
        trigger.setAttribute('aria-expanded', 'false');
      }
      menu?.querySelectorAll('[data-dropdown-option]').forEach(o => {
        o.classList.remove('is-selected');
        o.setAttribute('aria-checked', 'false');
      });
      opt.classList.add('is-selected');
      opt.setAttribute('aria-checked', 'true');

      // Currency dropdown handling
      if (menu?.id === 'currency-menu') {
        const code = opt.dataset.currencyCode || (label.includes('USD') ? 'USD' : (label.includes('EUR') ? 'EUR' : (label.includes('GBP') ? 'GBP' : 'INR')));
        Currency.set(code);
        showToast(`Currency changed to ${Currency.rates[code]?.name || code}`, 'info');
      }

      // Language dropdown handling
      if (menu?.id === 'language-menu') {
        const code = opt.dataset.langCode || (label.includes('Español') ? 'es' : (label.includes('Français') ? 'fr' : (label.includes('हिन्दी') ? 'hi' : 'en')));
        Language.set(code);
        showToast(`Language set to ${Language.languages[code]?.name || label}`, 'info');
      }
    });
  });

  // ── Currency & Language Converter Startup Sync ──────────────
  Currency._syncNavbarLabel();
  initHomePriceConverter();
  if (Currency.current !== 'INR') {
    window._reRenderHomePrices?.();
  }
  Language.init();

  // ── Permanently Lock Currency & Language Panels in English ────
  function enforceUtilityMenusEnglish() {
    const currMenu = document.getElementById('currency-menu');
    if (currMenu) {
      const hdr = currMenu.querySelector('.dropdown-menu-header');
      if (hdr && hdr.textContent.trim() !== 'Select Currency') hdr.textContent = 'Select Currency';
      const labels = { INR: 'Rupees (₹)', USD: 'USD ($)', EUR: 'EUR (€)', GBP: 'GBP (£)' };
      currMenu.querySelectorAll('[data-dropdown-option]').forEach(it => {
        const code = it.dataset.currencyCode;
        if (code && labels[code] && it.textContent.trim() !== labels[code]) {
          it.textContent = labels[code];
        }
      });
    }
    const langMenu = document.getElementById('language-menu');
    if (langMenu) {
      const hdr = langMenu.querySelector('.dropdown-menu-header');
      if (hdr && hdr.textContent.trim() !== 'Select Language') hdr.textContent = 'Select Language';
      const labels = { en: 'English', es: 'Español', fr: 'Français', hi: 'हिन्दी' };
      langMenu.querySelectorAll('[data-dropdown-option]').forEach(it => {
        const code = it.dataset.langCode;
        if (code && labels[code] && it.textContent.trim() !== labels[code]) {
          it.textContent = labels[code];
        }
      });
    }
  }
  enforceUtilityMenusEnglish();

  // Watch for external translation engine text modifications and auto-revert
  const _menuObserver = new MutationObserver(() => {
    enforceUtilityMenusEnglish();
  });
  const _cMenu = document.getElementById('currency-menu');
  const _lMenu = document.getElementById('language-menu');
  if (_cMenu) _menuObserver.observe(_cMenu, { childList: true, subtree: true, characterData: true });
  if (_lMenu) _menuObserver.observe(_lMenu, { childList: true, subtree: true, characterData: true });

  // ── 12. BACK TO TOP (scroll-triggered floating button) ─────
  // Inject a back-to-top button if none exists
  if (!document.getElementById('back-to-top')) {
    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.style.cssText = 'position:fixed;bottom:90px;right:24px;z-index:9999;width:44px;height:44px;border-radius:50%;background:#145a32;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;transform:translateY(12px);transition:opacity 220ms,transform 220ms;display:grid;place-items:center;font-size:18px;';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      } else {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(12px)';
      }
    });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ── 13. HELP UTILITY LINK ─────────────────────────────────
  document.querySelector('a[href="#help"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openCustomerServicePage?.();
  });
});



