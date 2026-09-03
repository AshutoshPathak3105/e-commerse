/**
 * X-Mart Superstore — Express REST API
 * Entry point: server.js
 */
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const { exec }     = require('child_process');
const os           = require('os');

const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const productRoutes    = require('./routes/products');
const cartRoutes       = require('./routes/cart');
const orderRoutes      = require('./routes/orders');
const wishlistRoutes   = require('./routes/wishlist');
const newsletterRoutes = require('./routes/newsletter');

// ── Connect to MongoDB Atlas ─────────────────────────────────
connectDB();

const app = express();

// ── Security middleware ──────────────────────────────────────
// NOTE: CSP is disabled so script.js can make API calls to localhost:8000
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allow script.js to fetch /api/* freely
  })
);

// ── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: true, // Echo origin or allow all for seamless dev across ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Global rate limiter ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please wait 15 minutes.' },
});

app.use(globalLimiter);

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP logger ─────────────────────────────────────────────
app.use(morgan('dev'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    env:    process.env.NODE_ENV || 'development',
    time:   new Date().toISOString(),
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/wishlist',   wishlistRoutes);
app.use('/api/newsletter', newsletterRoutes);

const path = require('path');

// ── Serve Frontend Static Files with Cache-Busting for Dev ──
const frontendPath = path.join(__dirname, '..');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
app.use(express.static(frontendPath));

// ── Root info / Frontend entry ───────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name:    'X-Mart Superstore API',
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

const server = app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n══════════════════════════════════════════════');
  console.log('  🚀  X-Mart API Server');
  console.log(`  📡  Running on: ${url}`);
  console.log(`  🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('══════════════════════════════════════════════\n');

  // ── Auto-open Chrome when server starts ──────────────────
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
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error(`❌  Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋  SIGTERM received. Closing server...');
  server.close(() => process.exit(0));
});
