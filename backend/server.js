/**
 * X-Mart Superstore — Express REST API
 * Entry point: server.js
 * Reload routes configuration
 */
const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { exec, execSync } = require('child_process');
const os = require('os');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');
const newsletterRoutes = require('./routes/newsletter');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');

const app = express();

// ── Security Hardening ───────────────────────────────────────
// Hide tech stack from attackers
app.disable('x-powered-by');

// Security Headers (Clickjacking, MIME-sniffing, XSS, HSTS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allows storefront API calls
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  })
);

// ── Strict CORS Whitelist ────────────────────────────────────
const trustedOrigins = [
  'http://localhost:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://e-commerse-4xlp.onrender.com',
  'https://beautiful-druid-f9f6aa.netlify.app',
  'https://phenomenal-zuccutto-36b29b.netlify.app',
];

if (process.env.CLIENT_URL) {
  const cleanClient = process.env.CLIENT_URL.replace(/\/+$/, '');
  if (!trustedOrigins.includes(cleanClient)) trustedOrigins.push(cleanClient);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin static assets)
      if (!origin) return callback(null, true);

      // In development, allow local development; in production, enforce strict whitelist
      if (process.env.NODE_ENV !== 'production' || trustedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[Security Alert] Blocked unauthorized CORS request from origin: ${origin}`);
      return callback(new Error('Access blocked by CORS policy: Unauthorized domain.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── NoSQL Injection Sanitizer Middleware ────────────────────
// Recursively strips any keys containing MongoDB operators ($ or .)
const sanitizeInput = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizeInput);
  const clean = {};
  for (const key of Object.keys(payload)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitizeInput(payload[key]);
  }
  return clean;
};

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);
  next();
});

// ── Global rate limiter ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  skip: (req) => !req.path.startsWith('/api') || req.ip === '127.0.0.1' || req.ip === '::1',
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please wait 15 minutes.' },
});

app.use('/api', globalLimiter);

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── HTTP logger ─────────────────────────────────────────────
app.use(morgan('dev'));

// ── Database readiness check for API routes ──────────────────
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const state = mongoose.connection.readyState;
  if (state === 1) return next();

  // If MongoDB is still connecting, wait up to 3.5s for it to finish
  if (state === 2) {
    const start = Date.now();
    const timer = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(timer);
        return next();
      }
      if (Date.now() - start > 3500) {
        clearInterval(timer);
        return res.status(503).json({
          success: false,
          message: 'Database is still connecting. Please retry in a moment.',
        });
      }
    }, 100);
    return;
  }

  // 0 = disconnected, 3 = disconnecting
  return res.status(503).json({
    success: false,
    message: 'Database connection is temporarily unavailable. Please retry in a moment.',
  });
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ── Public Storefront CMS & Vouchers Endpoint ─────────────────
const CmsConfig = require('./models/CmsConfig');
app.get('/api/cms', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const config = await CmsConfig.getOrCreate();
    const now = new Date();
    const activeAnnouncements = (config.announcements || []).filter(a => {
      if (!a.active) return false;
      if (a.validUntil && new Date(a.validUntil) < now) return false;
      if (a.validFrom && new Date(a.validFrom) > now) return false;
      return true;
    }).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const activePromos = (config.promotions || []).filter(p => {
      if (!p.active) return false;
      if (p.validUntil && new Date(p.validUntil) < now) return false;
      if (p.validFrom && new Date(p.validFrom) > now) return false;
      return true;
    });

    const cleanImg = (img) => {
      if (!img) return '';
      let s = String(img).trim().replace(/^["']+|["']+$/g, '');
      if (/^https?:\/\/data:/i.test(s)) s = s.replace(/^https?:\/\//i, '');
      else if (/^https?:?\/?\/?data:/i.test(s)) s = s.replace(/^https?:?\/?\/?/i, '');
      else if (/^htt+data:/i.test(s)) s = s.replace(/^htt+/i, '');
      else if (/^ht+ps?:?\/?\/?data:/i.test(s)) s = s.replace(/^ht+ps?:?\/?\/?/i, '');
      return s;
    };

    const primaryAnnouncementText = (activeAnnouncements.length > 0 && activeAnnouncements[0].text) 
      ? activeAnnouncements[0].text 
      : (config.announcementActive ? config.announcementText : '');

    res.json({
      success: true,
      data: {
        announcementText: primaryAnnouncementText,
        announcementActive: config.announcementActive,
        announcements: config.announcements || [],
        activeAnnouncements: activeAnnouncements,
        heroBanners: (config.heroBanners || [])
          .filter(b => b.active !== false)
          .map(b => {
            const raw = b.toObject ? b.toObject() : { ...b };
            raw.image = cleanImg(raw.image);
            return raw;
          })
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
        promotions: activePromos,
        quadCards: (config.quadCards || [])
          .filter(q => q.active !== false)
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
        heroPromoCards: (config.heroPromoCards || [])
          .filter(h => h.active !== false)
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
        quickBrowseItems: (config.quickBrowseItems || [])
          .filter(q => q.active !== false)
          .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Public Storefront Platform & Commerce Settings Endpoint ─
const PlatformSetting = require('./models/PlatformSetting');
app.get('/api/settings', async (req, res) => {
  try {
    const s = await PlatformSetting.getOrCreate();
    const data = s.toObject ? s.toObject() : { ...s };
    data.businessAddress = data.businessAddress || 'Tower B, DLF Cyber City, Phase II, Gurugram, Haryana - 122002';
    data.corporateAddress = data.businessAddress;
    data.maxOrderQtyPerItem = data.maxOrderQtyPerItem !== undefined ? data.maxOrderQtyPerItem : 10;
    data.maxOrderQty = data.maxOrderQtyPerItem;
    data.inactivityTimeoutMinutes = data.inactivityTimeoutMinutes !== undefined ? data.inactivityTimeoutMinutes : 30;
    data.inactivityTimeoutMins = data.inactivityTimeoutMinutes;
    data.fraudDetectionMode = data.fraudDetectionMode || 'standard';
    data.fraudVelocityShield = data.fraudDetectionMode;
    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Security Guard: Block public access to backend, secrets, and git files ──
app.use((req, res, next) => {
  const normalized = req.path.toLowerCase();
  if (
    normalized.startsWith('/backend') ||
    normalized.startsWith('/scratch') ||
    normalized.startsWith('/.git') ||
    normalized.includes('.env') ||
    normalized.includes('package')
  ) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
});

// ── Serve Frontend Static Files with Cache-Busting for Dev ──
const frontendPath = path.join(__dirname, '..');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(express.static(frontendPath, { dotfiles: 'ignore' }));

// ── Root info / Frontend entry ───────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'X-Mart Superstore API',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/products',
      'GET  /api/products/:id',
      'GET  /api/cart',
      'POST /api/cart',
      'GET  /api/orders',
      'POST /api/orders',
      'GET  /api/wishlist',
      'POST /api/newsletter/subscribe',
    ],
  });
});

// ── Tracking & Order Direct Link Redirect to Frontend ────────
app.get(['/track/:orderId', '/order/:orderId', '/tracking/:orderId'], (req, res) => {
  const frontend = process.env.FRONTEND_URL || (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('onrender.com') ? process.env.CLIENT_URL : 'https://beautiful-druid-f9f6aa.netlify.app');
  const cleanFrontend = frontend.replace(/\/+$/, '');
  const prefix = req.path.startsWith('/track') || req.path.startsWith('/tracking') ? '#track/' : '#order/';
  res.redirect(`${cleanFrontend}/${prefix}${encodeURIComponent(req.params.orderId)}`);
});

// ── 404 handler for API routes or fallback to index.html ─────
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global error handler ─────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const startServer = async () => {
  // Connect to MongoDB Atlas first so all queries succeed immediately
  await connectDB();

  const server = app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log('\n══════════════════════════════════════════════');
    console.log('  🚀  X-Mart API Server');
    console.log(`  📡  Running on: ${url}`);
    console.log(`  🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('══════════════════════════════════════════════\n');

    // ── Auto-open Chrome when server starts (local development only) ──────
    if (process.env.NODE_ENV !== 'production' && !process.env.RENDER) {
      const platform = os.platform();
      let openCmd;
      if (platform === 'win32') {
        openCmd = `start chrome "${url}"`;
      } else if (platform === 'darwin') {
        openCmd = `open -a "Google Chrome" "${url}"`;
      } else {
        openCmd = `xdg-open "${url}"`;
      }
      exec(openCmd, (err) => {
        if (err) {
          // Chrome not found — try default browser
          const fallback = platform === 'win32' ? `start "" "${url}"` : `xdg-open "${url}"`;
          exec(fallback);
        }
      });
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌  Port ${PORT} is already in use.`);
      console.error(`👉  Stop the existing process on port ${PORT} and restart the server.\n`);
      console.error(`    Run:  npx kill-port ${PORT}   or close the other terminal.\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  // Graceful shutdown
  process.on('unhandledRejection', (err) => {
    console.error(`❌  Unhandled Rejection: ${err?.message || err}`);
  });

  process.on('SIGTERM', () => {
    console.log('👋  SIGTERM received. Closing server...');
    server.close(() => process.exit(0));
  });
};

startServer();
