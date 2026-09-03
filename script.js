/* Dynamic API Base: works whether opened via localhost:8000, 127.0.0.1:5500, or file protocol */
const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.port === '8000'
  ? '/api'
  : 'http://localhost:8000/api';

/* ── Safe API Request Helper ──────────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error('Cannot connect to backend server at http://localhost:8000. Please start your server with "npm start".');
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

/* ── Toast Notifications ──────────────────────────────────── */
function showToast(msg, type = 'success', dur = 3200) {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(c);
  }
  const col = { success: '#16a34a', error: '#dc2626', info: '#0284c7', warn: '#d97706' };
  const t = document.createElement('div');
  t.style.cssText = `background:${col[type] || col.success};color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:700;box-shadow:0 10px 25px rgba(0,0,0,.25);max-width:360px;opacity:0;transform:translateY(16px);transition:all 220ms ease;pointer-events:auto;font-family:inherit;line-height:1.4;`;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(16px)';
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
  },
  logout() {
    localStorage.removeItem('xmart_token');
    localStorage.removeItem('xmart_user');
    this.syncUI();
    showToast('Signed out successfully', 'info');
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
    
    if (user) {
      const firstName = user.name ? user.name.split(' ')[0] : 'User';
      acctSmall.forEach(el => el.textContent = `Hello, ${firstName}`);
      acctStrong.forEach(el => el.textContent = 'Account & Orders');
    } else {
      acctSmall.forEach(el => el.textContent = 'Hello, Sign In');
      acctStrong.forEach(el => el.textContent = 'Account & Lists');
    }
  }
};

/* ── Local & Live State Management ────────────────────────── */
const Store = {
  cart: JSON.parse(localStorage.getItem('xmart_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('xmart_wishlist') || '[]'),
  allProducts: [],

  cartCount() { return this.cart.reduce((s, i) => s + (i.qty || 1), 0); },
  cartTotal() { return this.cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0); },

  addToCart(item) {
    const existing = this.cart.find(c => c.id === item.id || (item._id && c.id === item._id));
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.cart.push({
        id: item.id || item._id || ('prod-' + Date.now()),
        name: item.name,
        price: item.finalPrice || item.price,
        originalPrice: item.originalPrice || item.price,
        img: item.img || (item.images && item.images[0]) || '',
        category: item.category || 'General',
        qty: 1
      });
    }
    this.save();
    this.syncUI();
    renderCartPanel();
    showToast(`"${item.name}" added to cart!`, 'success');
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
    const count = this.cartCount();
    document.querySelectorAll('.cart-count').forEach(e => e.textContent = count);
    document.querySelectorAll('.wishlist-count').forEach(e => e.textContent = this.wishlist.length);
    const cl = document.querySelector('.cart-action');
    if (cl) cl.setAttribute('aria-label', `Cart, ${count} items`);
  }
};

/* ── Initial Products Catalog & Synonyms ─────────────────── */
const SMART_SYNONYMS = {
  'mobile': ['phone', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', '5g', 'redmi', 'realme', 'mobile', 'cellular'],
  'phone': ['mobile', 'smartphone', 'oneplus', 'samsung', 'iphone', 'nord', 'galaxy', 'cellular'],
  'smartphone': ['mobile', 'phone', 'oneplus', 'samsung', 'iphone', 'nord'],
  'laptop': ['computer', 'macbook', 'notebook', 'pc', 'asus', 'dell', 'hp', 'lenovo'],
  'computer': ['laptop', 'pc', 'macbook', 'desktop', 'monitor'],
  'headphone': ['earbuds', 'audio', 'earphone', 'headset', 'airpods', 'sony', 'bose', 'sound'],
  'earphone': ['earbuds', 'headphone', 'audio', 'airpods', 'sound'],
  'earbuds': ['airpods', 'earphones', 'headphones', 'audio', 'buds'],
  'shoe': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma'],
  'shoes': ['sneaker', 'footwear', 'running', 'boots', 'shoes', 'nike', 'adidas', 'puma', 'woodland'],
  'cloth': ['shirt', 't-shirt', 'dress', 'top', 'fashion', 'jeans', 'pant', 'suit', 'jacket', 'saree'],
  'clothes': ['shirt', 't-shirt', 'dress', 'top', 'fashion', 'jeans', 'pant', 'suit', 'jacket', 'saree'],
  'dress': ['saree', 'kurta', 'maxi', 'top', 'women', 'suit', 'fashion'],
  'watch': ['smartwatch', 'fossil', 'apple watch', 'galaxy watch', 'clock'],
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
    const res = await fetch(`${API_BASE}/products?limit=100`);
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
    document.body.style.overflow = '';
  };

  windowEl.querySelector('.xmodal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay._open = () => {
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  };
  overlay._close = close;

  return overlay;
}

/* ── 2. Auth Modal (Sign In / Register / My Account) ──────── */
function buildAuthModal() {
  const modal = createModal('auth-interactive-modal', {
    title: '👤 Account & Sign In',
    bodyHtml: `
      <div id="auth-unlogged-view">
        <div class="auth-tabs">
          <button class="auth-tab-btn is-active" data-tab="signin">Sign In</button>
          <button class="auth-tab-btn" data-tab="signup">Create Account</button>
        </div>

        <form id="signin-form">
          <div class="auth-input-group">
            <label>Email Address</label>
            <input type="email" id="auth-login-email" required placeholder="admin@xmart.com or your email">
          </div>
          <div class="auth-input-group">
            <label>Password</label>
            <input type="password" id="auth-login-password" required placeholder="••••••••">
          </div>
          <button type="submit" class="auth-submit-btn" id="signin-btn">Sign In to X-Mart</button>
        </form>

        <form id="signup-form" style="display:none;">
          <div class="auth-input-group">
            <label>Full Name</label>
            <input type="text" id="auth-reg-name" required placeholder="John Doe">
          </div>
          <div class="auth-input-group">
            <label>Email Address</label>
            <input type="email" id="auth-reg-email" required placeholder="john@example.com">
          </div>
          <div class="auth-input-group">
            <label>Mobile Number (Optional)</label>
            <input type="tel" id="auth-reg-phone" placeholder="+91 9876543210">
          </div>
          <div class="auth-input-group">
            <label>Password (min 6 chars)</label>
            <input type="password" id="auth-reg-password" minlength="6" required placeholder="••••••••">
          </div>
          <button type="submit" class="auth-submit-btn" id="signup-btn">Create Your X-Mart Account</button>
        </form>
      </div>

      <div id="auth-logged-view" style="display:none;text-align:center;padding:10px 0;">
        <div style="width:72px;height:72px;border-radius:50%;background:#ff9700;color:#000;font-size:28px;font-weight:900;display:grid;place-items:center;margin:0 auto 16px;">
          <span id="user-avatar-initials">U</span>
        </div>
        <h2 id="logged-user-name" style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">User Name</h2>
        <p id="logged-user-email" style="margin:0 0 20px;font-size:14px;color:#64748b;">user@example.com</p>
        
        <div style="display:flex;flex-direction:column;gap:10px;max-width:320px;margin:0 auto;">
          <button id="view-my-orders-btn" style="padding:12px;background:#19324c;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;">📦 View My Orders</button>
          <button id="view-my-wishlist-btn" style="padding:12px;background:#f1f5f9;color:#1e293b;border-radius:8px;font-weight:700;cursor:pointer;">❤️ My Wishlist</button>
          <button id="auth-logout-btn" style="padding:12px;background:#fee2e2;color:#dc2626;border-radius:8px;font-weight:700;cursor:pointer;">Sign Out</button>
        </div>
      </div>
    `
  });

  const body = modal.querySelector('.xmodal-body');
  const tabs = body.querySelectorAll('.auth-tab-btn');
  const signinForm = body.querySelector('#signin-form');
  const signupForm = body.querySelector('#signup-form');
  const unloggedView = body.querySelector('#auth-unlogged-view');
  const loggedView = body.querySelector('#auth-logged-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      if (tab.dataset.tab === 'signin') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
      } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
      }
    });
  });

  // Login Submit
  signinForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('signin-btn');
    const email = document.getElementById('auth-login-email').value.trim();
    const password = document.getElementById('auth-login-password').value;

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      Auth.setSession(data.data, data.data.token);
      showToast(`Welcome back, ${data.data.name}!`, 'success');
      modal._close();
    } catch (err) {
      if (err.message.includes('Invalid email or password')) {
        showToast('Invalid email or password. New user? Click "Create Account" to register!', 'error', 4500);
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In to X-Mart';
    }
  });

  // Register Submit
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('signup-btn');
    const name = document.getElementById('auth-reg-name').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const phone = document.getElementById('auth-reg-phone').value.trim();
    const password = document.getElementById('auth-reg-password').value;

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });

      Auth.setSession(data.data, data.data.token);
      showToast(`Account created! Welcome, ${data.data.name}`, 'success');
      modal._close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Your X-Mart Account';
    }
  });

  // Logged in actions
  body.querySelector('#auth-logout-btn').addEventListener('click', () => {
    Auth.logout();
    modal._close();
  });
  body.querySelector('#view-my-orders-btn').addEventListener('click', () => {
    modal._close();
    window._openOrders?.();
  });
  body.querySelector('#view-my-wishlist-btn').addEventListener('click', () => {
    modal._close();
    window._openWishlist?.();
  });

  window._openAuth = (tabName = 'signin') => {
    const user = Auth.getUser();
    if (user && Auth.isLoggedIn()) {
      unloggedView.style.display = 'none';
      loggedView.style.display = 'block';
      document.getElementById('logged-user-name').textContent = user.name || 'User';
      document.getElementById('logged-user-email').textContent = user.email || '';
      document.getElementById('user-avatar-initials').textContent = (user.name || 'U').charAt(0).toUpperCase();
    } else {
      unloggedView.style.display = 'block';
      loggedView.style.display = 'none';
      const targetTab = body.querySelector(`.auth-tab-btn[data-tab="${tabName}"]`);
      targetTab?.click();
    }
    modal._open();
  };
}

/* ── 3. Orders History Modal ──────────────────────────────── */
function buildOrdersModal() {
  const modal = createModal('orders-interactive-modal', {
    title: '📦 Returns & Order History',
    large: true,
    bodyHtml: `<div id="orders-content-container" style="min-height:240px;display:flex;align-items:center;justify-content:center;">Loading orders...</div>`
  });

  async function loadOrders() {
    const container = modal.querySelector('#orders-content-container');
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#64748b;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><p style="margin-top:10px;">Fetching your orders from MongoDB...</p></div>`;

    if (!Auth.isLoggedIn()) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:44px;margin-bottom:12px;">🔒</div>
          <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;">Please Sign In</h3>
          <p style="color:#64748b;margin:0 0 20px;font-size:14px;">Sign in to your X-Mart account to view your live orders and tracking details.</p>
          <button id="orders-signin-prompt-btn" class="auth-submit-btn" style="max-width:240px;margin:0 auto;">Sign In / Register</button>
        </div>
      `;
      container.querySelector('#orders-signin-prompt-btn')?.addEventListener('click', () => {
        modal._close();
        window._openAuth?.();
      });
      return;
    }

    try {
      const data = await apiFetch('/orders', { headers: Auth.getHeaders() });
      const orders = data.data || [];
      if (orders.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:48px 20px;">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <h3 style="margin:16px 0 6px;font-size:18px;font-weight:800;color:#1e293b;">No orders placed yet</h3>
            <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Explore our catalog and place your first order!</p>
            <button id="orders-explore-btn" class="auth-submit-btn" style="max-width:220px;margin:0 auto;">Explore Products</button>
          </div>
        `;
        container.querySelector('#orders-explore-btn')?.addEventListener('click', () => {
          modal._close();
          window._openCatalog?.();
        });
        return;
      }

      container.innerHTML = orders.map(order => {
        const orderId = order.orderId || `XM-${order._id.slice(-8).toUpperCase()}`;
        const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        const statusClass = `order-status--${order.status.toLowerCase()}`;

        return `
          <div class="order-history-card">
            <div class="order-header-row">
              <div>
                <span style="font-size:12px;font-weight:700;color:#64748b;">ORDER PLACED</span>
                <p style="margin:2px 0 0;font-weight:800;font-size:14px;color:#0f172a;">${dateStr}</p>
              </div>
              <div>
                <span style="font-size:12px;font-weight:700;color:#64748b;">TOTAL AMOUNT</span>
                <p style="margin:2px 0 0;font-weight:800;font-size:14px;color:#0f172a;">₹${order.totalPrice.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span style="font-size:12px;font-weight:700;color:#64748b;">ORDER #</span>
                <p style="margin:2px 0 0;font-weight:800;font-size:14px;color:#0878f9;">${orderId}</p>
              </div>
              <div>
                <span class="order-status-badge ${statusClass}">${order.status}</span>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px;margin:14px 0;">
              ${order.orderItems.map(item => `
                <div style="display:flex;align-items:center;gap:14px;">
                  <img src="${item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.name}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;background:#f1f5f9;">
                  <div style="flex:1;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a;">${item.name}</p>
                    <p style="margin:0;font-size:13px;color:#64748b;">Qty: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f1f5f9;padding-top:12px;">
              <span style="font-size:13px;color:#475569;">Payment: <strong>${order.paymentMethod}</strong></span>
              ${['Pending', 'Confirmed'].includes(order.status) ? `
                <button class="cancel-order-btn" data-id="${order._id}" style="padding:8px 14px;background:#fee2e2;color:#dc2626;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;">Cancel Order</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Wire cancel buttons
      container.querySelectorAll('.cancel-order-btn').forEach(btn => {
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
            loadOrders();
          } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Cancel Order';
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<div style="text-align:center;padding:30px;color:#dc2626;"><p>${err.message}</p></div>`;
    }
  }

  window._openOrders = () => {
    modal._open();
    loadOrders();
  };
}

/* ── 4. Wishlist Drawer ───────────────────────────────────── */
function buildWishlistDrawer() {
  const modal = createModal('wishlist-interactive-drawer', {
    title: '❤️ My Saved Wishlist',
    side: true,
    bodyHtml: `<div id="wishlist-items-body" style="padding:10px 0;"></div>`,
    footerHtml: `<button id="wishlist-close-btn" style="width:100%;padding:12px;background:#19324c;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;">Continue Shopping</button>`
  });

  function renderWishlist() {
    const body = modal.querySelector('#wishlist-items-body');
    if (Store.wishlist.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:48px 16px;color:#64748b;">
          <div style="font-size:48px;margin-bottom:12px;">🤍</div>
          <h3 style="margin:0 0 6px;font-size:17px;font-weight:800;color:#1e293b;">Your Wishlist is Empty</h3>
          <p style="font-size:13px;margin:0 0 20px;">Save items you love by clicking the heart icon on any product.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = Store.wishlist.map(item => `
      <div style="display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <img src="${item.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.name}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;background:#f8fafc;">
        <div style="flex:1;min-width:0;">
          <h4 style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</h4>
          <p style="margin:0 0 8px;font-size:14px;font-weight:800;color:#ff9700;">₹${(item.price || 0).toLocaleString('en-IN')}</p>
          <div style="display:flex;gap:8px;">
            <button class="wl-add-cart-btn" data-id="${item.id}" style="padding:6px 12px;background:#ff9700;color:#000;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;">+ Add to Cart</button>
            <button class="wl-remove-btn" data-id="${item.id}" style="padding:6px 10px;background:#f1f5f9;color:#64748b;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    body.querySelectorAll('.wl-add-cart-btn').forEach(b => {
      b.addEventListener('click', () => {
        const item = Store.wishlist.find(w => w.id === b.dataset.id);
        if (item) {
          Store.addToCart(item);
          Store.toggleWishlist(item);
          renderWishlist();
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

  modal.querySelector('#wishlist-close-btn').addEventListener('click', () => modal._close());

  window._openWishlist = () => {
    renderWishlist();
    modal._open();
  };
}

/* ── 5. Multi-Step Checkout & Payment Modal ───────────────── */
function buildCheckoutModal() {
  const modal = createModal('checkout-interactive-modal', {
    title: '🛍️ Secure Fast Checkout',
    large: true,
    bodyHtml: `
      <form id="checkout-form">
        <div class="checkout-grid">
          <!-- Left: Address & Payment -->
          <div>
            <h4 class="checkout-section-title">📍 1. Delivery Shipping Address</h4>
            <div class="auth-input-group">
              <label>Full Recipient Name</label>
              <input type="text" id="chk-name" required placeholder="Ashutosh Pathak">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="auth-input-group">
                <label>Mobile Number</label>
                <input type="tel" id="chk-phone" required placeholder="+91 9876543210">
              </div>
              <div class="auth-input-group">
                <label>Pincode</label>
                <input type="text" id="chk-pin" maxlength="6" required placeholder="495001">
              </div>
            </div>
            <div class="auth-input-group">
              <label>Street Address / Flat / Landmark</label>
              <input type="text" id="chk-street" required placeholder="Building 4, Sector 7, Main Road">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="auth-input-group">
                <label>City</label>
                <input type="text" id="chk-city" required placeholder="Bilaspur">
              </div>
              <div class="auth-input-group">
                <label>State</label>
                <input type="text" id="chk-state" required placeholder="Chhattisgarh">
              </div>
            </div>

            <h4 class="checkout-section-title" style="margin-top:20px;">💳 2. Select Payment Method</h4>
            <label class="payment-method-card is-selected">
              <input type="radio" name="paymentMethod" value="COD" checked>
              <div>
                <strong>Cash on Delivery (COD)</strong>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Pay in cash or UPI when your order arrives</p>
              </div>
            </label>
            <label class="payment-method-card">
              <input type="radio" name="paymentMethod" value="UPI">
              <div>
                <strong>Instant UPI / Google Pay / PhonePe / Paytm</strong>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Instant zero-fee payment confirmation</p>
              </div>
            </label>
            <label class="payment-method-card">
              <input type="radio" name="paymentMethod" value="Card">
              <div>
                <strong>Credit / Debit Card (Visa, MasterCard, RuPay)</strong>
                <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Secure 256-bit encrypted checkout</p>
              </div>
            </label>
          </div>

          <!-- Right: Summary -->
          <div>
            <h4 class="checkout-section-title">🧾 3. Order Summary</h4>
            <div class="order-summary-box">
              <div id="checkout-items-preview" style="max-height:160px;overflow-y:auto;margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:10px;"></div>
              <div class="order-summary-row">
                <span>Items Subtotal (<span id="chk-item-count">0</span>):</span>
                <strong id="chk-subtotal">₹0</strong>
              </div>
              <div class="order-summary-row">
                <span>GST Tax (18%):</span>
                <strong id="chk-tax">₹0</strong>
              </div>
              <div class="order-summary-row">
                <span>Estimated Delivery:</span>
                <span id="chk-shipping" style="color:#16a34a;font-weight:700;">FREE</span>
              </div>
              <div class="order-summary-row is-total">
                <span>Grand Total:</span>
                <span id="chk-grand-total" style="color:#ff9700;">₹0</span>
              </div>
            </div>

            <button type="submit" id="place-order-submit-btn" class="auth-submit-btn" style="margin-top:20px;font-size:16px;padding:14px;">
              🚀 Place Order Now
            </button>
            <p style="text-align:center;font-size:12px;color:#64748b;margin-top:10px;">🔒 Guaranteed Safe & Encrypted Checkout</p>
          </div>
        </div>
      </form>
    `
  });

  const form = modal.querySelector('#checkout-form');

  // Radio button highlight toggles
  modal.querySelectorAll('input[name="paymentMethod"]').forEach(r => {
    r.addEventListener('change', () => {
      modal.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('is-selected'));
      r.closest('.payment-method-card')?.classList.add('is-selected');
    });
  });

  function updateSummary() {
    const subtotal = Store.cartTotal();
    const count = Store.cartCount();
    const tax = Math.round(subtotal * 0.18);
    const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;
    const grandTotal = subtotal + tax + shipping;

    modal.querySelector('#chk-item-count').textContent = count;
    modal.querySelector('#chk-subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    modal.querySelector('#chk-tax').textContent = `₹${tax.toLocaleString('en-IN')}`;
    modal.querySelector('#chk-shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    modal.querySelector('#chk-grand-total').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

    const itemsPreview = modal.querySelector('#checkout-items-preview');
    itemsPreview.innerHTML = Store.cart.map(i => `
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${i.qty}× ${i.name}</span>
        <strong>₹${(i.price * i.qty).toLocaleString('en-IN')}</strong>
      </div>
    `).join('');

    // Pre-fill user details if logged in
    const user = Auth.getUser();
    if (user) {
      if (user.name) modal.querySelector('#chk-name').value = user.name;
      if (user.phone) modal.querySelector('#chk-phone').value = user.phone;
    }
  }

  // Handle Order Placement
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (Store.cart.length === 0) {
      showToast('Your cart is empty!', 'warn');
      return;
    }

    const btn = modal.querySelector('#place-order-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Processing Order...';

    const shippingAddress = {
      name: modal.querySelector('#chk-name').value.trim(),
      phone: modal.querySelector('#chk-phone').value.trim(),
      street: modal.querySelector('#chk-street').value.trim(),
      city: modal.querySelector('#chk-city').value.trim(),
      state: modal.querySelector('#chk-state').value.trim(),
      pincode: modal.querySelector('#chk-pin').value.trim(),
      country: 'India'
    };

    const paymentMethod = modal.querySelector('input[name="paymentMethod"]:checked').value;

    // Check if user is logged in for full MongoDB Order creation
    if (!Auth.isLoggedIn()) {
      btn.disabled = false;
      btn.textContent = '🚀 Place Order Now';
      showToast('Please Sign In or Register to confirm your order', 'warn');
      modal._close();
      window._openAuth?.('signup');
      return;
    }

    try {
      const orderData = await apiFetch('/orders', {
        method: 'POST',
        headers: Auth.getHeaders(),
        body: JSON.stringify({ shippingAddress, paymentMethod, items: Store.cart })
      });

      const newOrder = orderData.data;
      Store.clearCart();
      modal._close();

      showToast(`🎉 Order Placed Successfully! Ref: ${newOrder?.orderId || 'XM-DONE'}`, 'success', 5000);
      window._openOrders?.();

    } catch (err) {
      showToast(`Order Notice: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🚀 Place Order Now';
    }
  });

  window._openCheckout = () => {
    if (Store.cart.length === 0) {
      showToast('Please add items to your cart first!', 'warn');
      return;
    }
    updateSummary();
    modal._open();
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

  // Return to home storefront
  window._showHomeView = () => {
    pageContainer.style.display = 'none';
    mainContent.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState(null, '', window.location.pathname);
  };

  document.querySelectorAll('.brand, a[href="#top"]').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      window._showHomeView();
    });
  });

  // ── 1. COMMERCIAL CATEGORY & DEALS STORE WINDOW ────────────
  window._openDedicatedPage = async (category = '', type = '', search = '') => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const isDeals = type === 'deal' || (!category && !search && type === 'deals');
    const isBestseller = type === 'bestseller';

    let pageTitle = category 
      ? `${category} Superstore` 
      : (isDeals ? "Today's Lightning Deals & Mega Discounts" : (isBestseller ? "X-Mart Certified Bestsellers & Top Rated" : (search ? `Search Results for "${search}"` : "All Department Superstore")));
    
    let bannerDesc = category 
      ? `Discover over 30+ authentic ${category} verified by X-Mart Quality Assurance. Get manufacturer warranty, no-cost EMI, and free express delivery.`
      : (isDeals ? "Grab limited-time flash deals with discounts up to 70% off. Refreshed hourly with exclusive bank cashbacks." : "Explore the highest-rated customer favorites backed by over 250,000+ verified buyer reviews.");

    let bannerTag = category ? `⚡ ${category.toUpperCase()} HUB` : (isDeals ? "🔥 LIGHTNING DEALS • ENDS TONIGHT" : "⭐ BESTSELLERS LEADERBOARD");

    // Commercial Window Layout with Sidebar Filter & Product Grid
    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Top Nav & Breadcrumbs -->
        <div class="com-top-nav">
          <button id="com-back-home" class="com-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>← Back to Home Store</span>
          </button>
          <div class="com-breadcrumb">
            <a href="#home" class="com-bc-link" id="com-bc-home">Home</a>
            <span class="com-bc-sep">›</span>
            <span>Departments</span>
            <span class="com-bc-sep">›</span>
            <strong class="com-bc-active">${category || (isDeals ? 'Deals' : (isBestseller ? 'Bestsellers' : 'All Products'))}</strong>
          </div>
        </div>

        <!-- Commercial Category Header Banner -->
        <div class="com-hero-banner ${isDeals ? 'com-hero-banner--deals' : ''}">
          <div class="com-hero-left">
            <span class="com-hero-badge">${bannerTag}</span>
            <h1 class="com-hero-title">${pageTitle}</h1>
            <p class="com-hero-desc">${bannerDesc}</p>
            ${isDeals ? `
              <div class="deals-countdown-box">
                <span class="clock-icon">⏰</span>
                <span>Offer expires in: </span>
                <strong id="deal-timer" class="deal-timer-digits">05h 42m 19s</strong>
              </div>
            ` : `
              <div class="com-hero-perks">
                <div class="perk-pill">🚚 <span>Free Express Delivery ₹499+</span></div>
                <div class="perk-pill">🛡️ <span>100% Genuine Guarantee</span></div>
                <div class="perk-pill">🔄 <span>30-Day Easy Returns</span></div>
                <div class="perk-pill">💳 <span>No Cost EMI Available</span></div>
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
                <li><button class="cat-filter-btn ${category === 'Electronics' ? 'is-active' : ''}" data-cat="Electronics">⚡ Electronics (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Fashion' ? 'is-active' : ''}" data-cat="Fashion">👗 Fashion (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Home & Kitchen' ? 'is-active' : ''}" data-cat="Home & Kitchen">🏡 Home & Kitchen (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Beauty & Health' ? 'is-active' : ''}" data-cat="Beauty & Health">✨ Beauty & Health (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Sports' ? 'is-active' : ''}" data-cat="Sports">🏅 Sports & Fitness (30)</button></li>
                <li><button class="cat-filter-btn ${category === 'Grocery' ? 'is-active' : ''}" data-cat="Grocery">🛒 Gourmet Grocery (30)</button></li>
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

    // Wire Navigation
    pageContainer.querySelector('#com-back-home')?.addEventListener('click', window._showHomeView);
    pageContainer.querySelector('#com-bc-home')?.addEventListener('click', e => {
      e.preventDefault();
      window._showHomeView();
    });

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
            <div style="font-size:48px;margin-bottom:12px;">🔍</div>
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
                <span class="prime-delivery-pill">⚡ Prime</span>
              </div>

              <div class="com-pricing-row">
                <span class="com-final-price">₹${finalPrice.toLocaleString('en-IN')}</span>
                <span class="com-orig-price">₹${origPrice.toLocaleString('en-IN')}</span>
                <span class="com-save-text">Save ₹${(origPrice - finalPrice).toLocaleString('en-IN')}</span>
              </div>

              <p class="com-delivery-note">FREE Delivery <strong>Tomorrow by 2 PM</strong></p>

              <!-- Actions -->
              <div class="com-actions-row">
                <button class="com-btn-quickview" data-id="${prod._id || prod.id}">Quick View</button>
                <button class="com-btn-addcart" data-id="${prod._id || prod.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>
                  <span>+ Cart</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Wire Actions
      grid.querySelectorAll('.com-btn-addcart').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const prod = products.find(p => (p._id || p.id) === btn.dataset.id);
          if (prod) Store.addToCart(prod);
        });
      });

      grid.querySelectorAll('.com-btn-quickview').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const prod = products.find(p => (p._id || p.id) === btn.dataset.id);
          if (prod) window._openProductDetail?.(prod);
        });
      });

      grid.querySelectorAll('.com-wishlist-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const prod = products.find(p => (p._id || p.id) === btn.dataset.id);
          if (prod) {
            Store.toggleWishlist(prod);
            const isW = Store.wishlist.some(w => w.id === (prod._id || prod.id));
            btn.classList.toggle('is-active', isW);
            btn.querySelector('svg').setAttribute('fill', isW ? '#ef4444' : 'none');
            btn.querySelector('svg').setAttribute('stroke', isW ? '#ef4444' : '#64748b');
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

  // ── 3. COMMERCIAL SELLER CENTRAL & MERCHANT PORTAL WINDOW ──
  window._openSellerPortal = () => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Retrieve active seller profile from storage
    let currentSeller = null;
    try {
      currentSeller = JSON.parse(localStorage.getItem('xmart_seller_profile') || 'null');
    } catch { currentSeller = null; }

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Top Nav & Breadcrumb -->
        <div class="com-top-nav">
          <button id="seller-back-home" class="com-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>← Back to Home Store</span>
          </button>
          <div class="com-breadcrumb">
            <a href="#home" class="com-bc-link" id="seller-bc-home">Home</a>
            <span class="com-bc-sep">›</span>
            <span>Seller Central</span>
            <span class="com-bc-sep">›</span>
            <strong class="com-bc-active">Merchant Portal & Product Listing Studio</strong>
          </div>
        </div>

        <!-- Seller Hero Header -->
        <div class="com-hero-banner" style="background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);">
          <div class="com-hero-left">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span class="com-hero-badge" style="background:#34d399;color:#064e3b;">🏪 X-MART SELLER CENTRAL</span>
              ${currentSeller ? `
                <span class="seller-status-badge">🟢 Active Seller: <strong>${currentSeller.storeName}</strong> (GST: ${currentSeller.gstin})</span>
              ` : `
                <span class="seller-status-badge" style="background:rgba(255,255,255,0.2);color:#fff;">🔑 Guest Merchant</span>
              `}
            </div>
            <h1 class="com-hero-title">Sell Your Products on X-Mart Superstore</h1>
            <p class="com-hero-desc">Reach 50M+ active buyers nationwide. Benefit from lowest 3% commission rates, automated next-day payouts, and Fulfillment by X-Mart (FBX) express shipping.</p>
            <div class="com-hero-perks">
              <div class="perk-pill" style="border-color:#34d399;">💰 <span>0% Onboarding Fee</span></div>
              <div class="perk-pill" style="border-color:#34d399;">⚡ <span>Instant Product Listing</span></div>
              <div class="perk-pill" style="border-color:#34d399;">🏦 <span>7-Day Direct Bank Payouts</span></div>
              <div class="perk-pill" style="border-color:#34d399;">🚚 <span>Pan-India 19,000+ PIN Codes</span></div>
            </div>
          </div>
        </div>

        <!-- Seller Portal Navigation Tabs -->
        <div class="seller-tabs-bar">
          <button class="seller-tab-btn is-active" id="tab-btn-list" data-tab="list">
            <span>🚀 List a New Product</span>
          </button>
          <button class="seller-tab-btn" id="tab-btn-account" data-tab="account">
            <span>📝 ${currentSeller ? 'Merchant Profile & Bank' : 'Create Seller Account'}</span>
          </button>
          <button class="seller-tab-btn" id="tab-btn-inventory" data-tab="inventory">
            <span>📦 My Listed Inventory (<span id="seller-inv-count">0</span>)</span>
          </button>
        </div>

        <!-- TAB 1: PRODUCT LISTING STUDIO -->
        <div id="seller-tab-list" class="seller-tab-content is-active">
          <div class="seller-form-card">
            <div class="seller-card-header">
              <div class="seller-card-title-group">
                <h2>🚀 Add a New Product to Live Catalog</h2>
                <p>Fill in product specifications below. Your product will immediately be published to MongoDB Atlas and visible on the live storefront.</p>
              </div>
            </div>

            <form id="seller-product-form" class="seller-grid-form" novalidate>
              <!-- 1. Product Name -->
              <div class="form-group span-2">
                <label for="prod-name">Product Title / Name *</label>
                <input type="text" id="prod-name" class="seller-input" placeholder="e.g. Sony WH-1000XM5 Wireless Noise Canceling Headphones" required>
                <small class="form-hint">Include Brand, Model, Key Feature, and Color/Size for maximum search discovery.</small>
              </div>

              <!-- 2. Category & Brand -->
              <div class="form-group">
                <label for="prod-cat">Store Category *</label>
                <select id="prod-cat" class="seller-input" required>
                  <option value="Electronics">⚡ Electronics & Smart Tech</option>
                  <option value="Fashion">👗 Fashion & Apparel</option>
                  <option value="Home & Kitchen">🏡 Home & Kitchen</option>
                  <option value="Beauty & Health">✨ Beauty, Health & Grooming</option>
                  <option value="Sports">🏅 Sports & Fitness Equipment</option>
                  <option value="Grocery">🛒 Gourmet Grocery & Daily Staples</option>
                </select>
              </div>

              <div class="form-group">
                <label for="prod-brand">Brand / Manufacturer *</label>
                <input type="text" id="prod-brand" class="seller-input" placeholder="e.g. Sony, Apple, Nike or Your Store Brand" value="${currentSeller?.storeName || 'X-Mart Verified'}" required>
              </div>

              <!-- 3. Pricing & Discounts -->
              <div class="form-group">
                <label for="prod-price">Selling Price (₹) *</label>
                <input type="number" id="prod-price" class="seller-input" placeholder="e.g. 24999" min="1" step="1" required>
                <small class="form-hint">The discounted price the customer will pay.</small>
              </div>

              <div class="form-group">
                <label for="prod-mrp">MRP / Original Price (₹) *</label>
                <input type="number" id="prod-mrp" class="seller-input" placeholder="e.g. 34990" min="1" step="1" required>
                <div id="prod-calc-discount" class="discount-calc-pill">Discount: 0% OFF</div>
              </div>

              <!-- 4. Stock & Warranty -->
              <div class="form-group">
                <label for="prod-stock">Available Inventory Stock *</label>
                <input type="number" id="prod-stock" class="seller-input" placeholder="e.g. 50" min="1" value="25" required>
              </div>

              <div class="form-group">
                <label for="prod-warranty">Warranty Terms</label>
                <input type="text" id="prod-warranty" class="seller-input" placeholder="e.g. 1 Year Official Brand Warranty" value="1 Year Manufacturer Warranty">
              </div>

              <!-- 5. Product Image & Quick Presets -->
              <div class="form-group span-2">
                <label for="prod-img">High-Resolution Image URL *</label>
                <div class="image-input-wrap">
                  <input type="url" id="prod-img" class="seller-input" placeholder="Paste Unsplash / CDN image URL (e.g. https://images.unsplash.com/...)" value="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700" required>
                  <button type="button" id="btn-preview-img" class="seller-btn-secondary">Preview</button>
                </div>
                <!-- Image Preset Quick Picks -->
                <div class="seller-img-presets">
                  <span class="preset-label">Quick Pick Presets:</span>
                  <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700">🎧 Headphones</button>
                  <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700">⌚ Smartwatch</button>
                  <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700">👟 Running Shoes</button>
                  <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=700">📱 Smartphone</button>
                  <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700">☕ Coffee Maker</button>
                  <button type="button" class="img-chip-btn" data-url="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=700">💄 Skincare</button>
                </div>
              </div>

              <!-- 6. Detailed Description -->
              <div class="form-group span-2">
                <label for="prod-desc">Product Description & Key Specifications *</label>
                <textarea id="prod-desc" class="seller-textarea" rows="4" placeholder="Highlight key benefits, materials, features, package contents, and why customers love this product..." required>Premium grade authentic product with industry-leading performance, durable build quality, and verified manufacturer certification.</textarea>
              </div>

              <!-- Submit Button -->
              <div class="form-group span-2" style="margin-top:10px;">
                <button type="submit" id="seller-publish-btn" class="seller-submit-btn">
                  <span>🚀 Publish Product to Live Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- TAB 2: SELLER REGISTRATION & PROFILE -->
        <div id="seller-tab-account" class="seller-tab-content">
          <div class="seller-form-card">
            <div class="seller-card-header">
              <div class="seller-card-title-group">
                <h2>📝 Merchant Account Registration & Bank Settlement</h2>
                <p>Register your legal business entity and bank account for direct 7-day automatic payment disbursements.</p>
              </div>
            </div>

            <form id="seller-register-form" class="seller-grid-form" novalidate>
              <div class="form-group">
                <label for="seller-biz-name">Legal Business / Company Name *</label>
                <input type="text" id="seller-biz-name" class="seller-input" placeholder="e.g. Apex Retail Private Limited" value="${currentSeller?.bizName || ''}" required>
              </div>

              <div class="form-group">
                <label for="seller-store-name">Store Display Name *</label>
                <input type="text" id="seller-store-name" class="seller-input" placeholder="e.g. Apex Electronics Store" value="${currentSeller?.storeName || ''}" required>
              </div>

              <div class="form-group">
                <label for="seller-email">Business Email Address *</label>
                <input type="email" id="seller-email" class="seller-input" placeholder="e.g. seller@apexretail.com" value="${currentSeller?.email || ''}" required>
              </div>

              <div class="form-group">
                <label for="seller-phone">Contact Phone Number *</label>
                <input type="tel" id="seller-phone" class="seller-input" placeholder="e.g. +91 98765 43210" value="${currentSeller?.phone || ''}" required>
              </div>

              <div class="form-group">
                <label for="seller-gstin">GSTIN / Tax Registration ID *</label>
                <input type="text" id="seller-gstin" class="seller-input" placeholder="e.g. 27AABCU9603R1ZM" value="${currentSeller?.gstin || ''}" required>
              </div>

              <div class="form-group">
                <label for="seller-pincode">Warehouse Pickup PIN Code *</label>
                <input type="text" id="seller-pincode" class="seller-input" placeholder="e.g. 400001 (Mumbai)" value="${currentSeller?.pincode || '400001'}" required>
              </div>

              <div class="form-group">
                <label for="seller-bank-acc">Bank Account Number (For Payouts) *</label>
                <input type="text" id="seller-bank-acc" class="seller-input" placeholder="e.g. 98765432100123" value="${currentSeller?.bankAcc || '98765432100123'}" required>
              </div>

              <div class="form-group">
                <label for="seller-bank-ifsc">Bank IFSC Code *</label>
                <input type="text" id="seller-bank-ifsc" class="seller-input" placeholder="e.g. HDFC0001234" value="${currentSeller?.bankIfsc || 'HDFC0001234'}" required>
              </div>

              <div class="form-group span-2" style="margin-top:10px;">
                <button type="submit" class="seller-submit-btn" style="background:#047857;">
                  <span>💾 Save & Verify Merchant Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- TAB 3: SELLER INVENTORY TABLE -->
        <div id="seller-tab-inventory" class="seller-tab-content">
          <div class="seller-form-card">
            <div class="seller-card-header" style="justify-content:space-between;display:flex;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <h2>📦 My Listed Products & Inventory</h2>
                <p>Manage and monitor real-time stock levels and catalog items published by your store.</p>
              </div>
              <button class="com-btn-primary" onclick="document.getElementById('tab-btn-list').click()">+ List New Item</button>
            </div>

            <div class="seller-table-wrap">
              <table class="seller-inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
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
      </div>
    `;

    // ── Wire Top Navigation ──
    pageContainer.querySelector('#seller-back-home')?.addEventListener('click', window._showHomeView);
    pageContainer.querySelector('#seller-bc-home')?.addEventListener('click', e => {
      e.preventDefault();
      window._showHomeView();
    });

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

    // ── Wire Live Discount Calculator ──
    const priceInput = pageContainer.querySelector('#prod-price');
    const mrpInput = pageContainer.querySelector('#prod-mrp');
    const discBadge = pageContainer.querySelector('#prod-calc-discount');

    const updateCalcDiscount = () => {
      const p = parseFloat(priceInput.value) || 0;
      const m = parseFloat(mrpInput.value) || 0;
      if (m > 0 && p > 0 && m >= p) {
        const d = Math.round(((m - p) / m) * 100);
        discBadge.textContent = `Discount: ${d}% OFF (Save ₹${(m - p).toLocaleString('en-IN')})`;
        discBadge.style.color = '#047857';
      } else {
        discBadge.textContent = 'Discount: 0% OFF';
        discBadge.style.color = '#64748b';
      }
    };

    priceInput?.addEventListener('input', updateCalcDiscount);
    mrpInput?.addEventListener('input', updateCalcDiscount);

    // ── Wire Preset Image Quick Picks ──
    const imgInput = pageContainer.querySelector('#prod-img');
    pageContainer.querySelectorAll('.img-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (imgInput) imgInput.value = btn.dataset.url;
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
      showInfoModal('🖼️', 'Product Image Preview', `<div style="text-align:center;"><img src="${url}" alt="Preview" style="max-width:100%;max-height:360px;border-radius:10px;object-fit:contain;"></div>`);
    });

    // ── Wire Product Submission Form ──
    const productForm = pageContainer.querySelector('#seller-product-form');
    productForm?.addEventListener('submit', async e => {
      e.preventDefault();
      const submitBtn = pageContainer.querySelector('#seller-publish-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Publishing to MongoDB Atlas...</span>';
      }

      const name = pageContainer.querySelector('#prod-name')?.value.trim();
      const category = pageContainer.querySelector('#prod-cat')?.value;
      const brand = pageContainer.querySelector('#prod-brand')?.value.trim() || 'X-Mart Verified';
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
          showToast(`🎉 "${name}" published successfully!`, 'success', 5000);
          
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
          updateCalcDiscount();

          // Switch to inventory tab to view the item
          document.getElementById('tab-btn-inventory')?.click();
        } else {
          showToast(data.message || 'Error publishing product', 'error');
        }
      } catch (err) {
        showToast(`Listing failed: ${err.message}`, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🚀 Publish Product to Live Store</span>';
        }
      }
    });

    // ── Wire Seller Account Registration Form ──
    const registerForm = pageContainer.querySelector('#seller-register-form');
    registerForm?.addEventListener('submit', e => {
      e.preventDefault();
      const profile = {
        bizName: pageContainer.querySelector('#seller-biz-name')?.value.trim(),
        storeName: pageContainer.querySelector('#seller-store-name')?.value.trim(),
        email: pageContainer.querySelector('#seller-email')?.value.trim(),
        phone: pageContainer.querySelector('#seller-phone')?.value.trim(),
        gstin: pageContainer.querySelector('#seller-gstin')?.value.trim(),
        pincode: pageContainer.querySelector('#seller-pincode')?.value.trim(),
        bankAcc: pageContainer.querySelector('#seller-bank-acc')?.value.trim(),
        bankIfsc: pageContainer.querySelector('#seller-bank-ifsc')?.value.trim(),
        verifiedAt: new Date().toISOString()
      };

      localStorage.setItem('xmart_seller_profile', JSON.stringify(profile));
      showToast(`✓ Merchant account "${profile.storeName}" verified & active!`, 'success', 4000);

      // Re-render to show active seller badge
      window._openSellerPortal();
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
                      ${isDeal ? '<span class="deal-tag-pill">🔥 Today\'s Deal</span>' : ''}
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
                    <strong>₹${p.toLocaleString('en-IN')}</strong>
                    <span class="seller-orig-striked">₹${orig.toLocaleString('en-IN')}</span>
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
                <div class="stock-adjust-wrap">
                  <button class="btn-stock-adj minus" data-id="${id}" data-delta="-5">-5</button>
                  <button class="btn-stock-adj minus" data-id="${id}" data-delta="-1">-1</button>
                  <span class="stock-num-val" id="stock-val-${id}">${stock}</span>
                  <button class="btn-stock-adj plus" data-id="${id}" data-delta="1">+1</button>
                  <button class="btn-stock-adj plus" data-id="${id}" data-delta="10">+10</button>
                </div>
              </td>

              <!-- Deal / Promotion Status -->
              <td>
                <button class="btn-toggle-deal ${isDeal ? 'is-active-deal' : ''}" data-id="${id}" title="Click to toggle Today's Deal promotion">
                  ${isDeal ? '🔥 Deal Active' : '+ Add to Deals'}
                </button>
              </td>

              <!-- Action Buttons -->
              <td>
                <div class="seller-row-actions">
                  <button class="seller-action-btn edit-btn" data-id="${id}" title="Edit Product Details">
                    ✏️ Edit
                  </button>
                  <button class="seller-action-btn delete-btn" data-id="${id}" title="Delete Product">
                    🗑️
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
                showToast(`✓ Discount updated to ${newDisc}% OFF (New Price: ₹${newPrice.toLocaleString('en-IN')})`, 'success', 3000);
                loadSellerInventory();
              }
            } catch (err) {
              showToast(`Update error: ${err.message}`, 'error');
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
                const span = tbody.querySelector(`#stock-val-${id}`);
                if (span) span.textContent = newStock;
                showToast(`✓ Stock updated to ${newStock} units`, 'info', 2000);
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
                    ? `🔥 "${prod.name}" added to Today's Lightning Deals with ${updatedDiscount}% OFF!` 
                    : `✓ Removed "${prod.name}" from Today's Deals`, 
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
                showToast(`🗑️ "${prod.name}" removed from live store`, 'info', 3000);
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
          title: '✏️ Edit Product & Pricing',
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
              <option value="Electronics" ${prod.category === 'Electronics' ? 'selected' : ''}>⚡ Electronics</option>
              <option value="Fashion" ${prod.category === 'Fashion' ? 'selected' : ''}>👗 Fashion</option>
              <option value="Home & Kitchen" ${prod.category === 'Home & Kitchen' ? 'selected' : ''}>🏡 Home & Kitchen</option>
              <option value="Beauty & Health" ${prod.category === 'Beauty & Health' ? 'selected' : ''}>✨ Beauty & Health</option>
              <option value="Sports" ${prod.category === 'Sports' ? 'selected' : ''}>🏅 Sports & Fitness</option>
              <option value="Grocery" ${prod.category === 'Grocery' ? 'selected' : ''}>🛒 Grocery</option>
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
          </div>

          <div style="grid-column:1/-1;">
            <label style="display:flex;align-items:center;gap:10px;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;cursor:pointer;">
              <input type="checkbox" id="edit-deal-check" ${isDeal ? 'checked' : ''} style="width:18px;height:18px;accent-color:#ef4444;">
              <strong style="color:#991b1b;font-size:13.5px;">🔥 Feature this product in "Today's Lightning Deals" Section</strong>
            </label>
          </div>

          <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px;margin-top:12px;">
            <button type="button" class="seller-btn-secondary" onclick="document.getElementById('${modalId}')._close()">Cancel</button>
            <button type="submit" class="com-btn-primary">💾 Save Changes</button>
          </div>
        </form>
      `;

      // Live calculate price when discount changes
      const editPrice = bodyEl.querySelector('#edit-price');
      const editMRP = bodyEl.querySelector('#edit-mrp');
      const editDisc = bodyEl.querySelector('#edit-discount');

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
              Store.allProducts[pIdx] = { ...Store.allProducts[pIdx], ...(d.data || {}) };
            }
            showToast(`✓ "${updatedName}" updated successfully in live store!`, 'success', 4000);
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
      if (countEl) countEl.textContent = myItems.length || 0;
    } catch {}
  };

  // ── 4. COMMERCIAL 24/7 CUSTOMER CARE & HELP HUB WINDOW ─────
  window._openCustomerServicePage = () => {
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <div class="com-top-nav">
          <button id="cs-back-home" class="com-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>← Back to Home Store</span>
          </button>
          <div class="com-breadcrumb">
            <a href="#home" class="com-bc-link" id="cs-bc-home">Home</a>
            <span class="com-bc-sep">›</span>
            <strong class="com-bc-active">Customer Service & Help Hub</strong>
          </div>
        </div>

        <div class="com-hero-banner" style="background: linear-gradient(135deg, #091e3a 0%, #1e3a8a 100%);">
          <div class="com-hero-left">
            <span class="com-hero-badge">🛡️ 24/7 SUPPORT CENTER</span>
            <h1 class="com-hero-title">How Can We Help You Today?</h1>
            <p class="com-hero-desc">Instant self-service tools, live parcel tracking, hassle-free returns, and dedicated concierge agents available 24/7.</p>
            <div class="com-hero-perks">
              <div class="perk-pill">📞 <span>1800-555-0199 (Toll Free)</span></div>
              <div class="perk-pill">💬 <span>Live Chat Response &lt; 60s</span></div>
              <div class="perk-pill">✉️ <span>support@xmart.com</span></div>
            </div>
          </div>
        </div>

        <!-- Quick Action Cards -->
        <div class="cs-quick-grid">
          <div class="cs-action-card" onclick="window._openOrders?.()">
            <div class="cs-icon-circle">📦</div>
            <h3>Track Your Package</h3>
            <p>Live GPS status and real-time delivery updates for your orders.</p>
            <button class="cs-btn-action">Track Orders →</button>
          </div>

          <div class="cs-action-card" onclick="showToast('Free 30-Day Returns: Doorstep pickup arranged with zero questions asked!', 'success', 4000)">
            <div class="cs-icon-circle">🔄</div>
            <h3>Returns & Refunds</h3>
            <p>Initiate easy item exchange or instant bank refund in 2 hours.</p>
            <button class="cs-btn-action">Start Return →</button>
          </div>

          <div class="cs-action-card" onclick="window._openLocation?.()">
            <div class="cs-icon-circle">📍</div>
            <h3>Delivery Addresses</h3>
            <p>Change your delivery PIN code or manage saved shipping locations.</p>
            <button class="cs-btn-action">Manage Addresses →</button>
          </div>

          <div class="cs-action-card" onclick="window._openAuth?.()">
            <div class="cs-icon-circle">👤</div>
            <h3>Account & Security</h3>
            <p>Manage password, login credentials, and saved payment cards.</p>
            <button class="cs-btn-action">Account Settings →</button>
          </div>
        </div>

        <!-- Interactive AI Support Chat & Ticket Window -->
        <div class="cs-chat-section">
          <div class="cs-chat-header">
            <h3>💬 Instant Concierge Live Chat</h3>
            <span class="live-status-pill">● Agent Online</span>
          </div>
          <div id="cs-chat-messages" class="cs-chat-messages">
            <div class="chat-msg bot">
              <div class="chat-avatar">🤖</div>
              <div class="chat-bubble">Hello! I am X-Mart AI Concierge. How can I assist you with your orders, returns, or product inquiries today?</div>
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
            <h4>🚚 How fast is standard delivery?</h4>
            <p>Orders are dispatched within 24 hours. Metro cities receive next-day delivery, while all other locations are delivered in 2 to 4 business days.</p>
          </div>
          <div class="faq-accordion-item">
            <h4>💳 What payment methods are supported?</h4>
            <p>We support Credit/Debit cards (Visa, Mastercard, Amex), UPI (Google Pay, PhonePe, Paytm), Net Banking, EMI, and Cash on Delivery (COD).</p>
          </div>
          <div class="faq-accordion-item">
            <h4>🛡️ What is the brand warranty coverage?</h4>
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
          <div class="chat-avatar">👤</div>
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
            <div class="chat-avatar">🤖</div>
            <div class="chat-bubble">${reply}</div>
          </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 600);
    });
  };

  // ── COMMERCIAL DEDICATED PRODUCT SPECIFICATIONS PAGE WINDOW ──
  window._openProductDetail = (prod) => {
    if (!prod) return;
    mainContent.style.display = 'none';
    pageContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const img = (prod.images && prod.images[0]) || prod.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
    const finalPrice = prod.finalPrice || prod.price || 0;
    const origPrice = prod.originalPrice || Math.round(finalPrice * 1.4);
    const discount = prod.discount || (origPrice > finalPrice ? Math.round(((origPrice - finalPrice) / origPrice) * 100) : 0);
    const isWishlisted = Store.wishlist.some(w => w.id === (prod._id || prod.id));

    // Build 6-angle view image set (Front, Back, Left, Right, Top, 360°)
    const baseImg = img;
    // Use Unsplash source variation trick to get slightly different shots of the same topic
    const rawImages = (prod.images && prod.images.length > 1) ? prod.images : [];
    const fallbackBase = baseImg.split('?')[0];
    const angleViews = [
      { label: 'Front',  icon: '⬆', img: rawImages[0] || baseImg },
      { label: 'Back',   icon: '⬇', img: rawImages[1] || (fallbackBase + '?w=700&fit=crop&auto=format&q=80&brightness=-10') },
      { label: 'Left',   icon: '◀', img: rawImages[2] || (fallbackBase + '?w=700&fit=crop&auto=format&q=80&sat=-20') },
      { label: 'Right',  icon: '▶', img: rawImages[3] || (fallbackBase + '?w=700&fit=crop&auto=format&q=80&con=10') },
      { label: 'Top',    icon: '🔝', img: rawImages[4] || (fallbackBase + '?w=700&fit=crop&auto=format&q=80&hue=30') },
      { label: '360°',   icon: '🔄', img: rawImages[5] || (fallbackBase + '?w=700&fit=crop&auto=format&q=80&flip=h') },
    ];

    pageContainer.innerHTML = `
      <div class="commercial-window-wrap">
        <!-- Top Nav & Breadcrumbs -->
        <div class="com-top-nav">
          <button id="prod-page-back-btn" class="com-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span>← Back to Store</span>
          </button>
          <div class="com-breadcrumb">
            <a href="#home" class="com-bc-link" id="prod-bc-home">Home</a>
            <span class="com-bc-sep">›</span>
            <a href="#dept" class="com-bc-link" id="prod-bc-cat">${prod.category || 'Products'}</a>
            <span class="com-bc-sep">›</span>
            <strong class="com-bc-active">${prod.name}</strong>
          </div>
        </div>

        <div class="prod-detail-wrapper" style="margin-top: 18px;">
          <!-- 1. FIRST CONTAINER (Top Horizontal Format) -->
          <div class="prod-detail-card prod-detail-card--horizontal">
            <div class="prod-gallery-horizontal-left">

              <!-- Angle View Tabs -->
              <div class="prod-angle-tabs" id="prod-angle-tabs">
                ${angleViews.map((v, i) => `
                  <div class="prod-angle-tab ${i === 0 ? 'is-active' : ''}" data-index="${i}">
                    <span class="tab-icon">${v.icon}</span>
                    <span>${v.label}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Main Image Slider -->
              <div class="prod-main-slider-wrap" id="prod-main-slider-wrap">
                ${discount > 0 ? `<span class="prod-discount-badge">Save ${discount}%</span>` : ''}

                <!-- Slide Track -->
                <div class="prod-slider-track" id="prod-slider-track">
                  ${angleViews.map(v => `
                    <div class="prod-slide">
                      <img src="${v.img}" alt="${v.label} view of ${prod.name}" loading="lazy">
                      <div class="prod-slide-view-label">${v.label} View</div>
                    </div>
                  `).join('')}
                </div>

                <!-- Prev / Next Arrows -->
                <button class="prod-slider-btn prod-slider-btn--prev" id="prod-slider-prev" aria-label="Previous view">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button class="prod-slider-btn prod-slider-btn--next" id="prod-slider-next" aria-label="Next view">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>

                <!-- Dot Indicators -->
                <div class="prod-slider-dots" id="prod-slider-dots">
                  ${angleViews.map((_, i) => `<div class="prod-slider-dot ${i === 0 ? 'is-active' : ''}" data-index="${i}"></div>`).join('')}
                </div>

                <!-- Auto-play progress bar -->
                <div class="prod-slider-progress" id="prod-slider-progress"></div>
              </div>

              <!-- Thumbnail Strip -->
              <div class="prod-thumb-strip" id="prod-thumb-strip">
                ${angleViews.map((v, i) => `
                  <div class="prod-thumb-item ${i === 0 ? 'is-active' : ''}" data-index="${i}">
                    <img src="${v.img}" alt="${v.label}">
                    <div class="prod-thumb-view-label">${v.label}</div>
                  </div>
                `).join('')}
              </div>

            </div>

            <div class="prod-gallery-horizontal-right">
              <div class="prod-hero-summary">
                <span class="prod-brand-pill">⚡ ${prod.brand || 'X-Mart'} • ${prod.category || 'General'}</span>
                <h2 class="prod-main-title">${prod.name}</h2>
                <div class="prod-rating-row">
                  <span class="prod-rating-badge">★ ${prod.rating || '4.7'}</span>
                  <span class="prod-reviews-count">(${prod.numReviews || '60'} ratings & reviews)</span>
                  <span class="prod-verified-tag">✓ Verified Authentic</span>
                </div>
              </div>

              <!-- Trust & Assurance Horizontal Grid -->
              <div class="prod-trust-grid">
                <div class="prod-trust-item">
                  <span class="prod-trust-icon">🚚</span>
                  <div>
                    <strong>Fast Delivery</strong>
                    <small>Prime Express in 2 Days</small>
                  </div>
                </div>
                <div class="prod-trust-item">
                  <span class="prod-trust-icon">🛡️</span>
                  <div>
                    <strong>Official Warranty</strong>
                    <small>1-2 Years Coverage</small>
                  </div>
                </div>
                <div class="prod-trust-item">
                  <span class="prod-trust-icon">🔄</span>
                  <div>
                    <strong>7 Days Return</strong>
                    <small>Hassle-Free Replacement</small>
                  </div>
                </div>
                <div class="prod-trust-item">
                  <span class="prod-trust-icon">🔒</span>
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
                    <span class="prod-price-main">₹${finalPrice.toLocaleString('en-IN')}</span>
                    ${origPrice > finalPrice ? `<span class="prod-price-orig">M.R.P.: ₹${origPrice.toLocaleString('en-IN')}</span>` : ''}
                    ${discount > 0 ? `<span class="prod-save-pill">Save ₹${(origPrice - finalPrice).toLocaleString('en-IN')} (${discount}%)</span>` : ''}
                  </div>
                  <p class="prod-tax-note">Inclusive of all applicable taxes • No hidden charges</p>
                </div>

                <!-- Available Special Offers Box -->
                <div class="prod-offers-box">
                  <div class="prod-offers-title">🎉 Available Special Offers & Discounts</div>
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
                      <tr><td class="spec-label">Stock Availability</td><td class="spec-val"><span style="color:#16a34a;font-weight:700;">● In Stock • Ready to Dispatch</span></td></tr>
                    </tbody>
                  </table>
                </div>

                <!-- Description -->
                <div class="prod-about-section">
                  <h4 class="prod-section-heading">About This Item</h4>
                  <p class="prod-desc-text">${prod.description || `Experience exceptional quality with the ${prod.name} by ${prod.brand || 'X-Mart'}. Packed with advanced features, long-lasting durability, authentic manufacturer guarantee, and premium materials designed for everyday convenience.`}</p>
                </div>
              </div>
            </div>

            <!-- 3. THIRD CONTAINER (Vertical Format, ~38% Width, Same Height) -->
            <div class="prod-detail-card prod-detail-card--buybox">
              <div class="buybox-inner-top">
                <div class="buybox-price-header">
                  <span class="buybox-price">₹${finalPrice.toLocaleString('en-IN')}</span>
                  <span class="buybox-stock-status">● In Stock — Ready to Ship</span>
                </div>

                <div class="buybox-qty-row">
                  <label for="detail-qty-select">Quantity:</label>
                  <select id="detail-qty-select" class="buybox-qty-select">
                    <option value="1">1 unit</option>
                    <option value="2">2 units</option>
                    <option value="3">3 units</option>
                    <option value="4">4 units</option>
                    <option value="5">5 units</option>
                  </select>
                </div>

                <!-- Delivery Pincode Checker -->
                <div class="buybox-pincode-box">
                  <label for="detail-pincode-input">Deliver to:</label>
                  <div class="buybox-pincode-input-group">
                    <input type="text" id="detail-pincode-input" placeholder="Enter Pincode" value="${localStorage.getItem('xmart_pincode') || '495001'}" maxlength="6">
                    <button type="button" id="detail-pincode-btn">Check</button>
                  </div>
                  <p class="buybox-delivery-promise">🚚 <strong>Free Delivery</strong> Guaranteed by Tomorrow</p>
                </div>

                <!-- Action Buttons -->
                <div class="buybox-actions">
                  <button id="detail-add-cart" class="buybox-btn buybox-btn--cart">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>
                    + Add to Cart
                  </button>
                  <button id="detail-buy-now" class="buybox-btn buybox-btn--buy">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    ⚡ Buy Now
                  </button>
                  <button id="detail-add-wishlist" class="buybox-btn buybox-btn--wishlist ${isWishlisted ? 'is-active' : ''}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? '#ef4444' : 'none'}" stroke="${isWishlisted ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    ${isWishlisted ? '✓ In Your Wishlist' : '♡ Add to Wishlist'}
                  </button>
                </div>
              </div>

              <!-- Seller & Protection Assurance Footer -->
              <div class="buybox-footer-assurance">
                <div class="assurance-row"><small>Ships from:</small> <strong>X-Mart Superstore Hub</strong></div>
                <div class="assurance-row"><small>Sold by:</small> <strong>${prod.brand || 'X-Mart'} Direct</strong></div>
                <div class="assurance-badge">
                  <span>🛡️ 100% Buyer Protection Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Navigation back handlers
    pageContainer.querySelector('#prod-page-back-btn')?.addEventListener('click', window._showHomeView);
    pageContainer.querySelector('#prod-bc-home')?.addEventListener('click', e => {
      e.preventDefault();
      window._showHomeView();
    });
    pageContainer.querySelector('#prod-bc-cat')?.addEventListener('click', e => {
      e.preventDefault();
      window._openDedicatedPage(prod.category || '');
    });

    // Thumbnail switching
    const mainImgEl = pageContainer.querySelector('#prod-detail-main-img');
    pageContainer.querySelectorAll('.prod-thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        pageContainer.querySelectorAll('.prod-thumb-item').forEach(t => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
        if (mainImgEl && thumb.dataset.src) mainImgEl.src = thumb.dataset.src;
      });
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

    // Add to cart with quantity
    pageContainer.querySelector('#detail-add-cart')?.addEventListener('click', () => {
      const qty = parseInt(pageContainer.querySelector('#detail-qty-select')?.value || '1');
      for (let i = 0; i < qty; i++) {
        Store.addToCart(prod);
      }
      showToast(`Added ${qty} × ${prod.name} to Cart!`, 'success');
    });

    // Buy now
    pageContainer.querySelector('#detail-buy-now')?.addEventListener('click', () => {
      Store.addToCart(prod);
      window._openCheckout?.();
    });

    // Wishlist toggle
    const wishBtn = pageContainer.querySelector('#detail-add-wishlist');
    wishBtn?.addEventListener('click', () => {
      Store.toggleWishlist(prod);
      const isW = Store.wishlist.some(w => w.id === (prod._id || prod.id));
      wishBtn.classList.toggle('is-active', isW);
      wishBtn.querySelector('svg').setAttribute('fill', isW ? '#ef4444' : 'none');
      wishBtn.querySelector('svg').setAttribute('stroke', isW ? '#ef4444' : 'currentColor');
      wishBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isW ? '#ef4444' : 'none'}" stroke="${isW ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        ${isW ? '✓ In Your Wishlist' : '♡ Add to Wishlist'}
      `;
    });
  };

  // Backward-compatibility wrapper
  window._openCatalog = (category = '', type = '', search = '') => {
    window._openDedicatedPage(category, type, search);
  };
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
    { icon: '📱', label: 'Smartphones & Mobiles', category: 'Electronics' },
    { icon: '👗', label: "Women's Fashion Tops", category: 'Fashion' },
    { icon: '🎧', label: 'Wireless Earbuds', category: 'Electronics' },
    { icon: '👟', label: 'Running Shoes Men', category: 'Fashion' },
    { icon: '🏠', label: 'Home Decor Items', category: 'Home' },
    { icon: '💄', label: 'Skincare & Beauty', category: 'Beauty' },
    { icon: '⌚', label: 'Smart Watches', category: 'Electronics' },
    { icon: '🛒', label: "Today's Deals", category: 'All' },
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        Trending Searches
      </div>
      ${TRENDING.map(t => `
        <div class="search-trending-row" data-query="${t.label}">
          <span class="search-trending-icon">${t.icon}</span>
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
              <span style="font-size:28px;">🔍</span>
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
              🔍 Results${catLabel} for "<strong>${q}</strong>"
            </div>
            ${results.map(item => `
              <div class="search-result-row" data-id="${item._id || item.id}">
                <img src="${(item.images && item.images[0]) || item.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}" alt="${item.name}" loading="lazy">
                <div style="flex:1;min-width:0;">
                  <p class="search-result-name">${highlight(item.name, q)}</p>
                  <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                    <span class="search-result-price">₹${(item.finalPrice || item.price || 0).toLocaleString('en-IN')}</span>
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
            window._openCatalog?.('', q);
          });
        }
        dropdown.classList.add('is-active');
      } catch (err) {
        console.error('Search error:', err);
        dropdown.classList.remove('is-active');
      }
    }, 200);
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
    if (q) window._openCatalog?.('', q);
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
      <h2 style="margin:0;font-size:18px;font-weight:800;color:#fff;display:flex;align-items:center;gap:8px;">🛒 Your Cart</h2>
      <button id="cart-panel-close" aria-label="Close cart" style="background:rgba(255,255,255,0.1);border:none;cursor:pointer;color:#fff;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;">
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
    footer.innerHTML = `<button id="cart-start-shopping-btn" style="width:100%;padding:12px;background:#19324c;color:#fff;border-radius:8px;font-weight:800;cursor:pointer;">Explore Products</button>`;
    footer.querySelector('#cart-start-shopping-btn')?.addEventListener('click', () => {
      document.getElementById('cart-panel-close')?.click();
      window._openCatalog?.();
    });
    return;
  }

  body.innerHTML = Store.cart.map(item => `
    <div class="cart-panel-item" data-id="${item.id}" style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <div style="width:60px;height:60px;flex:0 0 60px;border-radius:8px;overflow:hidden;background:#f8fafc;border:1px solid #e2e8f0;">
        <img src="${item.img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">
      </div>
      <div style="flex:1;min-width:0;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#ff9700;font-weight:800;">₹${(item.price * (item.qty || 1)).toLocaleString('en-IN')}</p>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="qty-btn" data-id="${item.id}" data-action="dec" style="width:24px;height:24px;border-radius:50%;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:14px;font-weight:700;display:grid;place-items:center;">−</button>
          <span style="font-size:14px;font-weight:700;min-width:16px;text-align:center;">${item.qty || 1}</span>
          <button class="qty-btn" data-id="${item.id}" data-action="inc" style="width:24px;height:24px;border-radius:50%;border:1px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:14px;font-weight:700;display:grid;place-items:center;">+</button>
          <button class="remove-btn" data-id="${item.id}" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#ef4444;font-size:12px;font-weight:700;">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

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
      <strong style="color:#0f172a;font-size:17px;font-weight:900;">₹${total.toLocaleString('en-IN')}</strong>
    </div>
    <button id="cart-proceed-checkout-btn" style="width:100%;padding:14px;border:none;border-radius:8px;background:#ff9700;color:#000;font-size:15px;font-weight:900;cursor:pointer;transition:transform 120ms ease;">
      Proceed to Checkout →
    </button>
  `;

  footer.querySelector('#cart-proceed-checkout-btn')?.addEventListener('click', () => {
    document.getElementById('cart-panel-close')?.click();
    window._openCheckout?.();
  });
}

/* ── 10. Location Modal ───────────────────────────────────── */
function buildLocationModal() {
  const modal = createModal('location-interactive-modal', {
    title: '📍 Choose Delivery Location',
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:13px;color:#64748b;">Select or enter your delivery pincode to check local stock & delivery speeds.</p>
      <div style="display:flex;gap:8px;">
        <input id="pincode-input" type="text" placeholder="Enter 6-digit pincode" maxlength="6" style="flex:1;padding:11px 14px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;background:#fff;color:#0f172a;">
        <button id="pincode-apply" class="auth-submit-btn" style="width:auto;padding:11px 20px;">Apply</button>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="pin-chip" data-pin="495001" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:20px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer;">495001 - Bilaspur</button>
        <button class="pin-chip" data-pin="110001" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:20px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer;">110001 - New Delhi</button>
        <button class="pin-chip" data-pin="400001" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:20px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer;">400001 - Mumbai</button>
        <button class="pin-chip" data-pin="560001" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:20px;background:#f8fafc;font-size:12px;font-weight:700;cursor:pointer;">560001 - Bengaluru</button>
      </div>
    `
  });

  const apply = () => {
    const pin = modal.querySelector('#pincode-input').value.trim();
    if (!/^\d{6}$/.test(pin)) {
      showToast('Please enter a valid 6-digit pincode', 'error');
      return;
    }
    document.querySelectorAll('.location-control strong').forEach(el => el.textContent = pin);
    localStorage.setItem('xmart_pincode', pin);
    showToast(`Delivery location set to ${pin}!`, 'success');
    modal._close();
  };

  modal.querySelector('#pincode-apply').addEventListener('click', apply);
  modal.querySelector('#pincode-input').addEventListener('keydown', e => { if (e.key === 'Enter') apply(); });
  modal.querySelectorAll('.pin-chip').forEach(c => c.addEventListener('click', () => {
    modal.querySelector('#pincode-input').value = c.dataset.pin;
    apply();
  }));

  window._openLocation = () => modal._open();
}

/* ============================================================
   MAIN INITIALIZATION & EVENT LISTENERS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize UI, Modals & Full Page Router
  Auth.syncUI();
  Store.syncUI();
  initPageRouter();
  buildCartPanel();
  buildAuthModal();
  buildOrdersModal();
  buildWishlistDrawer();
  buildCheckoutModal();
  buildProductDetailModal();
  buildLocationModal();
  initLiveSearch();
  loadProductsFromBackend();

  // Saved pincode restore
  const savedPin = localStorage.getItem('xmart_pincode');
  if (savedPin) {
    document.querySelectorAll('.location-control strong').forEach(el => el.textContent = savedPin);
  }

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

  // Account button — intercept the dropdown and open our auth modal instead
  document.querySelector('.account-action')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    window._openAuth?.();
  });

  // "Sign in or Create account" link inside account dropdown
  document.querySelector('a[href="#sign-in"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openAuth?.('signin');
  });

  // My Account link inside dropdown
  document.querySelector('a[href="#account"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openAuth?.();
  });

  // Your Orders inside dropdown
  document.querySelector('a[href="#orders"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openOrders?.();
  });

  // Your Wishlist inside dropdown
  document.querySelector('a[href="#wishlist"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openWishlist?.();
  });

  // Location / Delivery button
  document.querySelector('.location-control')?.addEventListener('click', e => {
    e.preventDefault();
    window._openLocation?.();
  });

  // ── 3. CATEGORY / DEPARTMENT NAVIGATION ───────────────────

  // "All Departments" hamburger button — Keep department drawer / menu open
  document.querySelector('.departments-button')?.addEventListener('click', e => {
    e.preventDefault();
    const dropdown = document.querySelector('.department-menu');
    if (dropdown) {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
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
    });
    document.querySelectorAll('.hero-slider-dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === currentSlide);
    });
  }

  function startSlideShow() {
    stopSlideShow();
    slideTimer = setInterval(() => showSlide(currentSlide + 1), 5000);
  }

  function stopSlideShow() {
    if (slideTimer) clearInterval(slideTimer);
  }

  prevBtn?.addEventListener('click', () => { showSlide(currentSlide - 1); startSlideShow(); });
  nextBtn?.addEventListener('click', () => { showSlide(currentSlide + 1); startSlideShow(); });

  indicators?.addEventListener('click', e => {
    const dot = e.target.closest('.hero-slider-dot');
    if (dot) { showSlide(parseInt(dot.dataset.slide)); startSlideShow(); }
  });

  const heroBanner = document.querySelector('.hero-slider-section');
  heroBanner?.addEventListener('mouseenter', stopSlideShow);
  heroBanner?.addEventListener('mouseleave', startSlideShow);

  // Show first slide and start
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

  // Hero banner cards (the big clickable cards below slider)
  document.querySelectorAll('.hero-banner-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const href = card.getAttribute('href') || '';
      if (href.includes('fashion')) window._openCatalog?.('Fashion');
      else if (href.includes('phone') || href.includes('electronic')) window._openCatalog?.('Electronics');
      else if (href.includes('beauty') || href.includes('jewellery')) window._openCatalog?.('Beauty & Health');
      else window._openCatalog?.();
    });
  });

  // ── 6. PRODUCT GRID — QUAD ITEMS (.quad-item) ──────────────
  let pIndex = 1;
  document.querySelectorAll('.quad-item').forEach(item => {
    const imgEl = item.querySelector('.quad-item-img');
    const labelEl = item.querySelector('.quad-item-label');
    const badgeEl = item.querySelector('.deal-red-tag');

    const name = imgEl?.alt || labelEl?.textContent?.trim() || 'Product';
    const badgeText = badgeEl?.textContent || '';
    const priceMatch = (labelEl?.textContent || badgeText).match(/[\d,]+/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : (299 + pIndex * 97);
    const id = `quad-${pIndex++}`;
    const productObj = { id, name, price, img: imgEl?.src || '' };

    // Only enhance items that are anchor links (clickable)
    item.style.cursor = 'pointer';

    const btnWrap = document.createElement('div');
    btnWrap.className = 'quad-hover-actions';
    btnWrap.style.cssText = 'position:absolute;bottom:6px;left:0;right:0;display:flex;justify-content:center;gap:6px;opacity:0;transition:opacity 180ms ease;pointer-events:none;z-index:2;';
    btnWrap.innerHTML = `
      <button class="q-add-btn" style="background:#ff9700;color:#000;border:none;border-radius:4px;padding:5px 9px;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);">+ Cart</button>
      <button class="q-view-btn" style="background:#19324c;color:#fff;border:none;border-radius:4px;padding:5px 9px;font-size:11px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);">View</button>
    `;

    // Make item position relative to allow absolute children
    const computed = window.getComputedStyle(item);
    if (computed.position === 'static') item.style.position = 'relative';

    item.appendChild(btnWrap);

    btnWrap.querySelector('.q-add-btn').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      Store.addToCart(productObj);
    });

    btnWrap.querySelector('.q-view-btn').addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      window._openProductDetail?.(productObj);
    });

    item.addEventListener('click', e => {
      e.preventDefault();
      window._openProductDetail?.(productObj);
    });

    item.addEventListener('mouseenter', () => {
      btnWrap.style.opacity = '1';
      btnWrap.style.pointerEvents = 'auto';
    });
    item.addEventListener('mouseleave', () => {
      btnWrap.style.opacity = '0';
      btnWrap.style.pointerEvents = 'none';
    });
  });

  // ── 7. QUAD CARD TITLES & FOOTER LINKS ───────────────────
  document.querySelectorAll('.quad-card-title, .quad-card-footer-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const txt = link.textContent.trim().toLowerCase();
      if (txt.includes('cookware') || txt.includes('kitchen') || txt.includes('bath') || txt.includes('home')) {
        window._openDedicatedPage?.('Home & Kitchen');
      } else if (txt.includes('electronics') || txt.includes('smartphone') || txt.includes('tech') || txt.includes('laptop')) {
        window._openDedicatedPage?.('Electronics');
      } else if (txt.includes('fashion') || txt.includes('apparel') || txt.includes('style')) {
        window._openDedicatedPage?.('Fashion');
      } else if (txt.includes('beauty') || txt.includes('health') || txt.includes('wellness')) {
        window._openDedicatedPage?.('Beauty & Health');
      } else {
        window._openDedicatedPage?.('', 'deal');
      }
    });
  });

  // ── 8. QUICK BROWSE ITEMS ──────────────────────────────────
  document.querySelectorAll('.quick-browse-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      window._openDedicatedPage?.();
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
          nfb.textContent = data.message || '🎉 Subscribed successfully!';
          nfb.className = 'newsletter-feedback is-success';
          nfb.style.cssText = 'color:#16a34a;font-weight:700;font-size:13px;margin-top:8px;';
        }
        const promo = data.data?.promoCode || 'XMART10';
        showToast(`🎉 Subscribed! Use code ${promo} for 10% off!`, 'success', 5000);
        ne.value = '';
      } catch {
        if (nfb) {
          nfb.textContent = '✓ Subscribed! Welcome to X-Mart VIP club.';
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
      icon: '🚚',
      title: 'Free Express Shipping Across India',
      body: '<p>Enjoy guaranteed <strong>Free Delivery on all orders above ₹499</strong>. Orders are dispatched within 24 hours from our nearest fulfillment center with end-to-end SMS & WhatsApp live tracking across 19,000+ PIN codes.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li>Standard Delivery: 2-4 business days</li><li>Prime Express Delivery: Next day delivery available in metro cities</li><li>Zero hidden shipping fees at checkout</li></ul>'
    },
    '100% Secure Checkout': {
      icon: '🔒',
      title: 'Bank-Grade 256-Bit SSL Secure Checkout',
      body: '<p>Your payment security is our top priority. We use <strong>industry-standard 256-bit AES SSL encryption</strong> and are fully <strong>PCI-DSS Level 1 certified</strong>.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li>2-Factor OTP Authentication on all card transactions</li><li>We never store your complete CVV or card PINs</li><li>Full buyer fraud protection guarantee on every purchase</li></ul>'
    },
    '30-Day Free Returns': {
      icon: '🔄',
      title: '30-Day Hassle-Free Money Back Guarantee',
      body: '<p>Shop with 100% confidence. If you are not completely satisfied with your purchase, return it within <strong>30 days of delivery</strong> for a replacement or full refund.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;font-size:13.5px;color:#334155;"><li>Free doorstep pickup from your address</li><li>No questions asked instant return processing</li><li>Refunds credited back in 2 to 4 hours via UPI / original mode</li></ul>'
    },
    'X-Mart Prime Perks': {
      icon: '⭐',
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
        showInfoModal(d.icon, d.title, d.body);
      } else {
        showInfoModal('✨', text, `<p>Experience premium service with ${text}. Backed by 100% genuine quality assurance.</p>`);
      }
    });
  });

  // Generic Information Modal Builder
  function showInfoModal(icon, title, bodyHtml) {
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
    if (titleEl) titleEl.innerHTML = `${icon} ${title}`;

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
      icon: '🏢', title: 'About X-Mart Superstore',
      body: '<p>Founded in 2024, <strong>X-Mart Superstore</strong> has revolutionized modern e-commerce across India by connecting millions of shoppers with over 100,000+ authentic products across Electronics, Fashion, Home, Beauty, Sports and Gourmet Groceries.</p><p style="margin-top:10px;">Our mission is to provide lightning-fast deliveries, transparent everyday low pricing, and world-class customer happiness.</p>'
    },
    '#careers': {
      icon: '💼', title: "Careers & Culture at X-Mart — We're Hiring!",
      body: '<p>Join our dynamic team building the next generation of global retail technology.</p><div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;"><div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;"><strong>Senior Full-Stack Engineer (Node.js/React)</strong><br><small style="color:#64748b;">Bengaluru, India • Full-Time • Competitive Package</small></div><div style="padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;"><strong>Product Lead — Supply Chain & Logistics</strong><br><small style="color:#64748b;">Mumbai, India • Full-Time • ESOPs</small></div></div><p style="margin-top:14px;">Send your CV to <strong style="color:#0878f9;">careers@xmart.com</strong></p>'
    },
    '#newsroom': {
      icon: '📰', title: 'Newsroom & Media Releases',
      body: '<p>Stay updated with our latest press releases, corporate announcements, and quarterly achievements.</p><ul style="padding-left:20px;margin-top:10px;line-height:1.6;"><li><strong>August 2026:</strong> X-Mart expands next-day delivery network to 50+ new tier-2 cities.</li><li><strong>July 2026:</strong> Over 10 million orders fulfilled with 99.8% on-time delivery rate.</li></ul>'
    },
    '#sustainability': {
      icon: '🌱', title: 'Sustainability & Green Impact',
      body: '<p>We are dedicated to building a greener future with <strong>100% plastic-free recycled packaging</strong> and electric vehicle (EV) delivery fleets in 25 major cities.</p>'
    },
    '#investors': {
      icon: '📈', title: 'Investor Relations & Governance',
      body: '<p>X-Mart Superstore, Inc. financial disclosures, annual reports, shareholder meetings, and ESG sustainability milestones.</p><p style="margin-top:8px;">Contact: <strong style="color:#0878f9;">ir@xmart.com</strong></p>'
    },
    '#leadership': {
      icon: '👥', title: 'Executive Leadership & Governance',
      body: '<p>Guided by visionary leaders with decades of experience across global technology, retail, and supply chain logistics.</p>'
    },
    '#shipping-rates': {
      icon: '🚚', title: 'Shipping Rates & Delivery Times',
      body: '<p>• <strong>Orders ₹499 & above:</strong> FREE Express Delivery<br>• <strong>Orders under ₹499:</strong> Flat ₹49 delivery charge<br>• <strong>Metro Cities:</strong> 24-48 Hours<br>• <strong>Rest of India:</strong> 2-4 Business Days</p>'
    },
    '#returns': {
      icon: '📦', title: 'Returns & Replacement Policy',
      body: '<p>Initiate a return within 30 days from your <a href="#orders" style="color:#0878f9;font-weight:700;">Orders Dashboard</a>. A courier executive will pick up the item from your doorstep for instant replacement or refund.</p>'
    },
    '#refund-policy': {
      icon: '💳', title: 'Instant Refund Policy',
      body: '<p>Refunds are initiated immediately upon pickup verification:</p><ul style="padding-left:20px;margin-top:8px;line-height:1.6;"><li><strong>UPI / Wallets:</strong> 2 to 4 Hours</li><li><strong>Credit / Debit Cards:</strong> 2 to 4 Business Days</li><li><strong>Cash on Delivery (COD):</strong> Instant NEFT / UPI Transfer</li></ul>'
    },
    '#warranty': {
      icon: '🛡️', title: 'X-Mart Care & Brand Warranty',
      body: '<p>All electronics and appliances sold on X-Mart come with <strong>Official 1 to 2 Years Manufacturer Warranty</strong>. Present your digital invoice at any authorized service center nationwide.</p>'
    },
    '#gift-cards': {
      icon: '🎁', title: 'X-Mart Digital Gift Cards',
      body: '<p>Gift your friends and family the joy of unlimited shopping!</p><div style="display:flex;gap:10px;margin:16px 0;"><button class="page-chip is-active" style="flex:1;">₹500</button><button class="page-chip" style="flex:1;">₹1,000</button><button class="page-chip" style="flex:1;">₹2,500</button><button class="page-chip" style="flex:1;">₹5,000</button></div><button class="auth-submit-btn" onclick="showToast(\'Gift voucher generated! Code sent to your email.\', \'success\')">Purchase Instant E-Gift Voucher</button>'
    },
    '#sell': {
      icon: '🏪', title: 'Sell Products on X-Mart Marketplace',
      body: '<p>Reach over 50 million customers across India. Zero setup fees, lowest commission rates, and access to Fulfillment by X-Mart (FBX).</p><p style="margin-top:10px;">Register your business with GSTIN at <strong style="color:#0878f9;">seller.xmart.com</strong></p>'
    },
    '#affiliate': {
      icon: '🤝', title: 'X-Mart Influencer & Affiliate Program',
      body: '<p>Earn up to <strong>10% referral commission</strong> on every qualifying sale. Access real-time link tracking, banners, and monthly direct bank payouts.</p>'
    },
    '#advertise': {
      icon: '📢', title: 'Advertise Your Brand on X-Mart',
      body: '<p>Boost your product visibility with Sponsored Search Ads, Category Banners, and Targeted Customer Campaigns reaching high-intent shoppers.</p>'
    },
    '#fulfillment': {
      icon: '📦', title: 'Fulfillment by X-Mart (FBX)',
      body: '<p>Store your inventory in our state-of-the-art warehouses. We pick, pack, ship, and manage customer service for your products with Prime 1-day delivery.</p>'
    },
    '#wholesale': {
      icon: '💼', title: 'X-Mart Business & Wholesale (B2B)',
      body: '<p>Buy in bulk for your office or enterprise with GST Input Tax Credit (up to 28% savings), quantity discounts, and flexible 30-day credit lines.</p>'
    },
    '#developer-api': {
      icon: '💻', title: 'X-Mart Developer Hub & REST APIs',
      body: '<p>Integrate your apps and ERP systems directly with our robust REST endpoints:</p><pre style="background:#0f172a;color:#38bdf8;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;">GET  /api/products\nPOST /api/orders\nGET  /api/cart\nPOST /api/auth/login</pre>'
    },
    '#supplier-hub': {
      icon: '📜', title: 'Supplier Code of Conduct',
      body: '<p>We uphold the highest ethical standards across our global supply chain, strictly enforcing fair wages, safe working environments, and environmental compliance.</p>'
    },
    '#privacy': {
      icon: '🔒', title: 'X-Mart Privacy Policy',
      body: '<p>We respect your personal privacy. We never sell your personal data to third parties. All personal details are encrypted and used solely for fulfilling orders and enhancing your personalized shopping experience.</p>'
    },
    '#terms': {
      icon: '📜', title: 'Terms of Service & Conditions',
      body: '<p>By accessing and using X-Mart Superstore, you agree to our standard consumer terms, authentic product warranties, secure payment compliance, and fair usage guidelines.</p>'
    },
    '#cookies': {
      icon: '🍪', title: 'Cookie & Tracking Preferences',
      body: '<p>We use essential cookies to maintain your shopping cart and secure sessions, and analytical cookies to improve performance.</p><div style="margin-top:14px;display:flex;gap:10px;"><button class="page-chip is-active">Accept All Cookies</button><button class="page-chip">Essential Only</button></div>'
    },
    '#accessibility': {
      icon: '♿', title: 'Accessibility Commitment',
      body: '<p>X-Mart is committed to digital accessibility for all users, adhering to <strong>WCAG 2.1 Level AA standards</strong> with screen reader optimization, high-contrast typography, and full keyboard navigation.</p>'
    },
    '#ca-privacy': {
      icon: '🛡️', title: 'Your Privacy Choices & Data Rights',
      body: '<p>You have full control over your data. Request a copy of your personal shopping history or delete your account anytime from Account Settings.</p>'
    },
    '#security': {
      icon: '🛡️', title: 'Security & Responsible Bug Bounty Program',
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
        window._openOrders?.();
      } else if (href === '#store-locations') {
        window._openLocation?.();
      }
      // Info Modals
      else if (footerContentMap[href]) {
        const item = footerContentMap[href];
        showInfoModal(item.icon, item.title, item.body);
      } else {
        const title = link.textContent.trim();
        showInfoModal('ℹ️', title, `<p>Information regarding <strong>${title}</strong> at X-Mart Superstore.</p>`);
      }
    });
  });

  // C. Mobile App Badges & Support Hotline
  document.querySelector('.app-badge-btn[href="#app-store"]')?.addEventListener('click', e => {
    e.preventDefault();
    showInfoModal('🍎', 'Download X-Mart for iPhone & iPad', '<p>Get the best shopping experience on your Apple device. Scan the QR code or click below:</p><div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin:12px 0;"><div style="font-size:48px;">📲</div><p style="margin:4px 0 0;font-weight:700;">iOS App Version 3.4 • Rated 4.9 ★</p></div><button class="auth-submit-btn" onclick="showToast(\'Redirecting to Apple App Store...\', \'info\')">Open on App Store</button>');
  });

  document.querySelector('.app-badge-btn[href="#google-play"]')?.addEventListener('click', e => {
    e.preventDefault();
    showInfoModal('🤖', 'Get X-Mart on Google Play Android', '<p>Enjoy lightning-fast orders and exclusive mobile deals on Android:</p><div style="text-align:center;padding:16px;background:#f8fafc;border-radius:12px;margin:12px 0;"><div style="font-size:48px;">📱</div><p style="margin:4px 0 0;font-weight:700;">Android App Version 3.4 • 10M+ Downloads</p></div><button class="auth-submit-btn" onclick="showToast(\'Redirecting to Google Play Store...\', \'info\')">Open on Google Play</button>');
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
      showToast(`✓ Verified & Protected: ${name} accepted with 256-Bit 3D-Secure protection.`, 'info', 3500);
    });
  });

  // E. Security Badges (SSL & PCI-DSS)
  document.querySelectorAll('.security-badge').forEach(badge => {
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', () => {
      const txt = badge.textContent.trim();
      showInfoModal('🔒', 'Verified Security Certificate', `<p><strong>${txt}:</strong> Your connection to X-Mart is secured with SHA-256 RSA encryption. Certified by DigiCert Global Root CA.</p>`);
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
      const trigger = opt.closest('[data-dropdown-menu]')?.previousElementSibling;
      const label = opt.dataset.label || opt.textContent.trim();
      if (trigger) {
        const labelEl = trigger.querySelector('[data-dropdown-label]');
        if (labelEl) labelEl.textContent = label;
        trigger.setAttribute('aria-expanded', 'false');
      }
      opt.closest('[data-dropdown-menu]')?.querySelectorAll('[data-dropdown-option]').forEach(o => {
        o.classList.remove('is-selected');
        o.setAttribute('aria-checked', 'false');
      });
      opt.classList.add('is-selected');
      opt.setAttribute('aria-checked', 'true');
    });
  });

  // ── 12. BACK TO TOP (scroll-triggered floating button) ─────
  // Inject a back-to-top button if none exists
  if (!document.getElementById('back-to-top')) {
    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.style.cssText = 'position:fixed;bottom:90px;right:24px;z-index:9999;width:44px;height:44px;border-radius:50%;background:#19324c;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;transform:translateY(12px);transition:opacity 220ms,transform 220ms;display:grid;place-items:center;font-size:18px;';
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

  // ── 13. STORE LOCATOR UTILITY LINK ────────────────────────
  document.querySelector('a[href="#store-locator"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openLocation?.();
  });

  // ── 14. HELP UTILITY LINK ─────────────────────────────────
  document.querySelector('a[href="#help"]')?.addEventListener('click', e => {
    e.preventDefault();
    window._openCustomerServicePage?.();
  });
});



