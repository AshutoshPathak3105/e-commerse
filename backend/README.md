# X-Mart Backend — Node.js + MongoDB REST API

## 🚀 Quick Start

### 1. Set up your environment

```bash
cd backend
copy .env.example .env
```

Edit `.env` and paste your **MongoDB Atlas connection string**:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/xmart?retryWrites=true&w=majority
JWT_SECRET=pick_any_long_random_string
PORT=8000
```

### 2. Install dependencies

```bash
npm install
```

### 3. Seed the database (optional but recommended)

```bash
npm run seed
```

This creates **12 sample products** and an **admin account**:
- Email: `admin@xmart.com`
- Password: `Admin@12345`

### 4. Start the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:8000**

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login → returns JWT |
| GET | `/api/auth/me` | ✅ | Get profile |
| PUT | `/api/auth/me` | ✅ | Update profile |
| PUT | `/api/auth/password` | ✅ | Change password |
| POST | `/api/auth/address` | ✅ | Add address |
| DELETE | `/api/auth/address/:id` | ✅ | Remove address |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | List (filter/sort/paginate) |
| GET | `/api/products/:id` | — | Product detail |
| POST | `/api/products` | 🔐 Admin | Create product |
| PUT | `/api/products/:id` | 🔐 Admin | Update product |
| DELETE | `/api/products/:id` | 🔐 Admin | Soft delete |
| POST | `/api/products/:id/reviews` | ✅ | Add review |

### Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | ✅ | Get cart |
| POST | `/api/cart` | ✅ | Add item |
| PUT | `/api/cart/:itemId` | ✅ | Update quantity |
| DELETE | `/api/cart/:itemId` | ✅ | Remove item |
| DELETE | `/api/cart` | ✅ | Clear cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ✅ | Place order |
| GET | `/api/orders` | ✅ | My orders |
| GET | `/api/orders/:id` | ✅ | Order detail |
| PUT | `/api/orders/:id/cancel` | ✅ | Cancel order |
| PUT | `/api/orders/:id/status` | 🔐 Admin | Update status |
| GET | `/api/orders/admin/all` | 🔐 Admin | All orders |

### Wishlist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wishlist` | ✅ | Get wishlist |
| POST | `/api/wishlist` | ✅ | Add product |
| DELETE | `/api/wishlist/:productId` | ✅ | Remove |

### Newsletter
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/newsletter/subscribe` | — | Subscribe |
| DELETE | `/api/newsletter/unsubscribe` | — | Unsubscribe |

---

## 🔑 Authentication

Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your_token_here>
```

## 📦 Product Query Params

```
GET /api/products?page=1&limit=12&category=Electronics&search=samsung&sort=price-asc&minPrice=1000&maxPrice=50000&featured=true
```

**Sort options:** `price-asc` | `price-desc` | `newest` | `rating` | `popular`

## 💡 Notes
- Free shipping on orders ≥ ₹499
- 18% GST is applied to all orders
- Order cancellation allowed only in `Pending` or `Confirmed` state
- Products are soft-deleted (not removed from DB)
