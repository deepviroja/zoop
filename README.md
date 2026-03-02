# Zoop Marketplace: Full System Documentation

---

## 1. Overview

Zoop is a hyper-local multi-panel e-commerce platform with:

- **Customer panel** (`/`) — Browse, search, cart, checkout, track orders, wishlist, profile
- **Seller panel** (`/seller/*`) — Onboarding, dashboard, product management, orders, ads, payouts
- **Admin panel** (`/admin/*`) — Analytics, seller approval, product curation, ads management, user management, site branding

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend: React + Vite (Firebase Hosting)                   │
│  zoop-88df6.web.app                                          │
│  ─────────────────────────────────────────────────────────── │
│  Talks to ↓                                                  │
├──────────────────────────────────────────────────────────────┤
│  Backend: Node.js + Express + TypeScript (Render)            │
│  apps/server/ → deployed via Render                          │
│  REST API on /api/*                                          │
│  ─────────────────────────────────────────────────────────── │
│  Connects to ↓                                               │
├──────────────────────────────────────────────────────────────┤
│  Firebase Firestore (Database)                               │
│  Firebase Auth (Authentication)                              │
│  Cloudinary (Image/Video Storage & Optimization)             │
│  SendGrid (Transactional Email)                              │
│  Razorpay (Payments)                                         │
│  OpenStreetMap / Nominatim (Location / Geocoding)            │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Repository File Structure

```
zoop/                            ← monorepo root
├── src/                         ← Frontend (Vite React app)
│   ├── App.jsx                  ← Route definitions (lazy-loaded pages)
│   ├── main.jsx                 ← React DOM entry point
│   ├── index.css                ← Global styles (Tailwind base)
│   ├── App.css                  ← App-level styles
│   ├── firebase.js              ← Firebase client SDK initialization
│   ├── api/
│   │   └── client.ts            ← Low-level fetch wrapper (GET/POST/PUT/DELETE)
│   ├── config/
│   │   └── apiBase.ts           ← API base URL (env-aware: dev vs prod)
│   ├── services/
│   │   └── api.ts               ← High-level API service objects (authApi, productsApi, etc.)
│   ├── context/
│   │   ├── UserContext.jsx       ← Auth state, user role, logout
│   │   ├── CartContext.jsx       ← Cart state management
│   │   └── ...                  ← Other contexts (8 total)
│   ├── layouts/
│   │   ├── CustomerLayout.jsx   ← Header, footer, sub-nav, notifications
│   │   ├── SellerLayout.jsx     ← Seller sidebar + top bar
│   │   ├── AdminLayout.jsx      ← Admin sidebar + top bar
│   │   └── MobileSidebar.jsx    ← Mobile slide-out drawer
│   ├── pages/
│   │   ├── customer/            ← Home, Search, Products, CategoryPage, ProductDetail, Cart, Checkout, etc.
│   │   ├── seller/              ← SellerDashboard, SellerAddProduct, SellerOrders, SellerAds, etc.
│   │   ├── admin/               ← AdminStats, VerifySellers, AdminAdsManagement, etc.
│   │   ├── auth/                ← Login, Signup, SellerSignup, AuthLayout
│   │   ├── static/              ← About, Contact, Terms, Help
│   │   └── shared/              ← NotFound
│   ├── components/
│   │   ├── shared/              ← AdBanner, ProductCard, Skeletons, BottomNav, NetworkStatusToast, etc.
│   │   ├── auth/                ← ProtectedRoute
│   │   ├── products/            ← ProductFilterSidebar
│   │   ├── common/              ← Shared UI elements
│   │   └── ui/                  ← Loader, buttons
│   ├── hooks/                   ← Custom React hooks (4 files)
│   ├── utils/
│   │   ├── cloudinary.ts        ← Cloudinary URL optimizer (q_auto,f_auto)
│   │   └── ...                  ← Other utils (9 total)
│   ├── assets/
│   │   ├── icons/               ← Custom SVG icon components
│   │   └── images/              ← Static category images (men_cat, women_cat, etc.)
│   └── data/                    ← Static data files
├── apps/
│   └── server/                  ← Main backend (TypeScript/Node.js)
│       ├── src/
│       │   ├── index.ts         ← Express app entry, CORS, routes, PORT
│       │   ├── config/
│       │   │   └── firebase.ts  ← Firebase Admin SDK init
│       │   ├── middleware/
│       │   │   └── auth.ts      ← authenticate + authorize middleware
│       │   ├── routes/
│       │   │   ├── authRoutes.ts
│       │   │   ├── productRoutes.ts
│       │   │   ├── commerceRoutes.ts
│       │   │   ├── uploadRoutes.ts
│       │   │   └── contentRoutes.ts
│       │   ├── controllers/
│       │   │   ├── authController.ts
│       │   │   ├── productController.ts
│       │   │   ├── commerceController.ts
│       │   │   ├── uploadController.ts
│       │   │   └── contentController.ts
│       │   ├── schemas/         ← Zod validation schemas
│       │   ├── services/        ← Business logic services
│       │   └── scripts/         ← Utility/seeding scripts
│       ├── package.json
│       ├── tsconfig.json
│       └── .env                 ← Backend environment variables
├── backend/                     ← Legacy/simple Node.js backend (secondary)
│   ├── server.js                ← Express entry (PORT, CORS, MongoDB routes)
│   ├── config/db.js             ← MongoDB connection via mongoose
│   ├── models/                  ← Mongoose models
│   ├── controllers/
│   ├── routes/
│   │   └── userRoutes.js
│   └── .env
├── shared/                      ← Shared TypeScript types
├── public/                      ← Static public assets
├── dist/                        ← Frontend production build (Vite output → Firebase)
├── index.html                   ← Vite HTML entry
├── vite.config.js               ← Vite config (Tailwind, Babel compiler, proxy)
├── firebase.json                ← Firebase Hosting config (SPA rewrites)
├── .firebaserc                  ← Firebase project association
├── package.json                 ← Frontend dependencies
├── tsconfig.json
└── .env                         ← Frontend env vars (VITE_*)
```

---

## 4. Environment Variables

### Frontend (`.env` in root)

| Variable                            | Value                            | Purpose                                    |
| ----------------------------------- | -------------------------------- | ------------------------------------------ |
| `VITE_API_URL`                      | `http://localhost:5000/api`      | Backend API base URL (overridden for prod) |
| `VITE_FIREBASE_API_KEY`             | `AIzaSy...`                      | Firebase Web API key                       |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `zoop-88df6.firebaseapp.com`     | Firebase Auth domain                       |
| `VITE_FIREBASE_PROJECT_ID`          | `zoop-88df6`                     | Firebase project ID                        |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `zoop-88df6.firebasestorage.app` | Firebase storage bucket                    |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `225057326778`                   | Firebase sender ID                         |
| `VITE_FIREBASE_APP_ID`              | `1:225057326778:web:...`         | Firebase App ID                            |
| `VITE_RAZORPAY_KEY_ID`              | `rzp_test_...`                   | Razorpay publishable key                   |

### Backend (`apps/server/.env`)

| Variable                         | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `PORT`                           | Server port (default 5000, Render sets auto) |
| `FIREBASE_PROJECT_ID`            | Firebase Admin connection                    |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service-account.json                 |
| `CLOUDINARY_CLOUD_NAME`          | Cloudinary cloud name                        |
| `CLOUDINARY_API_KEY`             | Cloudinary API key                           |
| `CLOUDINARY_API_SECRET`          | Cloudinary API secret                        |
| `SENDGRID_API_KEY`               | SendGrid key for email delivery              |
| `SENDGRID_FROM_EMAIL`            | Sender email for transactional mails         |
| `SENDGRID_FROM_NAME`             | Sender name                                  |
| `JWT_SECRET`                     | JWT signing secret                           |
| `JWT_EXPIRY`                     | JWT token expiry (default 7d)                |
| `OTP_EXPIRY_MINUTES`             | OTP expiry window                            |
| `OTP_RESEND_COOLDOWN_SECONDS`    | OTP resend cooldown                          |
| `FRONTEND_URL`                   | Allowed CORS origin for local dev            |
| `RAZORPAY_KEY_ID`                | Razorpay key for payment orders              |
| `RAZORPAY_KEY_SECRET`            | Razorpay secret for verification             |
| `ALLOWED_ORIGINS`                | Comma-separated extra CORS origins           |

---

## 5. External Services & Integrations

### 5.1 Firebase (Google)

- **Firebase Auth** — User signup, login (email/OTP/Google), token issuance
- **Firebase Firestore** — NoSQL database (all collections)
- **Firebase Hosting** — Frontend SPA hosting (zoop-88df6.web.app)
- **Frontend SDK**: `firebase` npm package (v12.x)
- **Backend SDK**: `firebase-admin` npm package (v11.x on server, v13.x on backend/)
- **Config file**: `src/firebase.js` (client), `apps/server/src/config/firebase.ts` (admin)
- **Service account**: `apps/server/service-account.json`

### 5.2 Cloudinary

- **Purpose**: Image and video upload, CDN delivery, auto-optimization
- **Frontend**: URL optimization via `src/utils/cloudinary.ts`
  - Injects `q_auto,f_auto` (quality auto + format auto) into Cloudinary URLs
  - Optionally adds `w_<width>` for responsive sizing
  - Example: `/upload/` → `/upload/q_auto,f_auto,w_800/`
- **Backend**: `cloudinary` npm package (v2.x), `multer-storage-cloudinary` for file uploads
- **Upload endpoint**: `POST /api/upload/image` (and `/video`)
- **Env vars**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 5.3 SendGrid

- **Purpose**: Transactional emails (OTP codes, order confirmations)
- **Backend package**: `@sendgrid/mail` (v8.x)
- **Env vars**: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`

### 5.4 Razorpay

- **Purpose**: Payment gateway (test mode)
- **Frontend**: Razorpay JS SDK loaded dynamically in `Checkout.jsx`
- **Backend**: Order creation + signature verification endpoints
- **Env vars**: `RAZORPAY_KEY_ID` (both frontend `VITE_` + backend), `RAZORPAY_KEY_SECRET`
- **Endpoints**: `POST /api/commerce/payments/razorpay/order`, `POST /api/commerce/payments/razorpay/verify`

### 5.5 OpenStreetMap (Nominatim)

- **Purpose**: Location/city autocomplete and geocoding (free, no key needed)
- **Frontend proxy**: `/mapapi` proxied to `https://nominatim.openstreetmap.org` via Vite dev proxy
- **Headers sent**: `User-Agent: YourAppName/1.0`, `Accept-Language: en`
- **Note**: Only active in dev. Production frontend calls should go directly or via backend.

---

## 6. Deployment

### Frontend — Firebase Hosting

- **Build command**: `npm run build` → outputs to `dist/`
- **Deploy**: `firebase deploy --only hosting`
- **Config file**: `firebase.json`
  - `"public": "dist"` — serves built assets
  - `"rewrites": [{ "source": "**", "destination": "/index.html" }]` — SPA fallback for client-side routing
- **Live URL**: `https://zoop-88df6.web.app`

### Backend — Render

- **Entry**: `apps/server/dist/index.js` (compiled TypeScript)
- **Build command on Render**: `npm run build` (runs `tsc`)
- **Start command on Render**: `npm start` (runs `node dist/index.js`)
- **PORT**: `process.env.PORT` (Render injects automatically)
- **CORS**: Pre-configured for `https://zoop-88df6.web.app` + `FRONTEND_URL`

### API URL in Frontend (`src/config/apiBase.ts`)

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://YOUR_RENDER_BACKEND_URL.onrender.com/api"
    : "http://localhost:5000/api");
```

> **Action required**: Replace `YOUR_RENDER_BACKEND_URL` with actual Render URL, and set `VITE_API_URL` in Firebase Hosting env or in `.env.production`.

---

## 7. Frontend npm Packages

### Runtime (`dependencies`)

| Package                     | Version | Purpose                                  |
| --------------------------- | ------- | ---------------------------------------- |
| `react`                     | ^19     | UI library                               |
| `react-dom`                 | ^19     | DOM rendering                            |
| `react-router-dom`          | ^7      | Client-side routing                      |
| `firebase`                  | ^12     | Firebase client SDK (Auth + Firestore)   |
| `axios`                     | ^1      | HTTP client (used in some service calls) |
| `motion`                    | ^12     | Animation library (Framer Motion v12)    |
| `canvas-confetti`           | ^1      | Confetti effects (checkout success)      |
| `country-state-city`        | ^3      | Country/State/City dropdown data         |
| `react-country-phone-input` | ^1      | Phone number input with country code     |
| `@tailwindcss/vite`         | ^4      | Tailwind CSS v4 Vite plugin              |
| `tailwindcss`               | ^4      | CSS utility framework                    |
| `tsc`                       | ^2      | TypeScript compiler (CLI)                |

### Dev Dependencies

| Package                               | Purpose                        |
| ------------------------------------- | ------------------------------ |
| `vite`                                | Build tool and dev server      |
| `@vitejs/plugin-react`                | React Fast Refresh for Vite    |
| `babel-plugin-react-compiler`         | React 19 compiler optimization |
| `@types/react`, `@types/react-dom`    | TypeScript types               |
| `eslint`, `eslint-plugin-react-hooks` | Linting                        |
| `autoprefixer`, `postcss`             | CSS processing                 |

---

## 8. Backend npm Packages (apps/server)

| Package                     | Version | Purpose                               |
| --------------------------- | ------- | ------------------------------------- |
| `express`                   | ^4.18   | Web framework                         |
| `cors`                      | ^2.8    | Cross-origin request handling         |
| `helmet`                    | ^7      | HTTP security headers                 |
| `morgan`                    | ^1.10   | HTTP request logger                   |
| `dotenv`                    | ^16     | Environment variable loader           |
| `firebase-admin`            | ^11     | Firebase Admin SDK (Firestore + Auth) |
| `cloudinary`                | ^2      | Cloudinary media upload SDK           |
| `multer`                    | ^2      | Multipart form-data parsing           |
| `multer-storage-cloudinary` | ^4      | Cloudinary storage engine for multer  |
| `@sendgrid/mail`            | ^8      | Transactional email sending           |
| `zod`                       | ^3      | Request schema validation             |
| `bcrypt`                    | ^6      | Password hashing (if used)            |

### Dev Dependencies

| Package                               | Purpose                      |
| ------------------------------------- | ---------------------------- | ------------------- |
| `typescript`                          | ^5                           | TypeScript compiler |
| `ts-node-dev`                         | Hot-reload TypeScript in dev |
| `@types/express`, `@types/cors`, etc. | TypeScript types             |

---

## 9. Authentication & Authorization

### Flow

1. User signs up/logs in via Firebase Auth (email OTP or Google Sign-In)
2. Firebase issues a JWT (ID token)
3. Frontend stores token in `localStorage` as `authToken`
4. All API requests include `Authorization: Bearer <token>`
5. Backend middleware `authenticate` verifies token via Firebase Admin SDK
6. Middleware `authorize(['role'])` checks role claim

### Roles

| Role       | Access                                   |
| ---------- | ---------------------------------------- |
| `customer` | Public pages + protected customer routes |
| `seller`   | Seller panel (requires admin approval)   |
| `admin`    | Admin panel (full access)                |

### Super-Admin

- Email: `admin@zoop.com` (hardcoded lock)
- Can create/remove admins, run destructive resets

---

## 10. Database (Firestore Collections)

| Collection          | Purpose                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| `users`             | All user profiles: role, verificationStatus, isDeleted, disabled                   |
| `products`          | Product catalog: title, price, stock, categoryId, sellerId, moderationStatus       |
| `orders`            | Order records with line items, status, payment info                                |
| `ads`               | Ad creatives: mediaUrl, slotId, status (PENDING_REVIEW/PUBLISHED/REJECTED), active |
| `adSlots`           | Ad placement configuration: slotId, price, active                                  |
| `supportTickets`    | Customer support workflow                                                          |
| `notifications`     | Per-user in-app notifications                                                      |
| `reviews`           | Product reviews with ratings                                                       |
| `wishlists`         | Customer product wishlists                                                         |
| `config`            | Site config (brandName, announcementBanner, subNavCategories, etc.)                |
| `payouts`           | Seller payout lifecycle records                                                    |
| `subscriptionPlans` | Seller subscription plan definitions                                               |
| `stockAlerts`       | Out-of-stock notification subscriptions                                            |
| `heroSlides`        | Homepage hero slider content (image, title, city, desc)                            |
| `categories`        | Product categories (id, name, image, desc, icon)                                   |
| `brands`            | Brand showcase (name, logo)                                                        |
| `collections`       | Featured collections on homepage                                                   |

---

## 11. Key API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint                           | Description                     |
| ------ | ---------------------------------- | ------------------------------- |
| POST   | `/auth/signup`                     | Email/OTP signup                |
| POST   | `/auth/verify-otp`                 | Verify signup OTP               |
| POST   | `/auth/resend-otp`                 | Resend OTP                      |
| POST   | `/auth/login/request-otp`          | Request login OTP               |
| POST   | `/auth/login/verify-otp`           | Verify login OTP                |
| POST   | `/auth/sync`                       | Sync Firebase user to Firestore |
| GET    | `/auth/profile`                    | Get current user profile        |
| PUT    | `/auth/profile`                    | Update user profile             |
| POST   | `/auth/register-seller`            | Submit seller registration      |
| POST   | `/auth/admin-create-user`          | Admin: create a new user        |
| POST   | `/auth/delete-account/request-otp` | Request account deletion OTP    |
| POST   | `/auth/delete-account/confirm`     | Confirm account deletion        |

### Products (`/api/products`)

| Method | Endpoint                | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/products`             | List all public products (with filters) |
| GET    | `/products/:id`         | Get product detail                      |
| GET    | `/products/:id/reviews` | Get product reviews                     |
| POST   | `/products`             | Create product (seller)                 |
| PUT    | `/products/:id`         | Update product (seller)                 |
| DELETE | `/products/:id`         | Delete product (seller/admin)           |

### Commerce (`/api/commerce`)

| Method | Endpoint                             | Description                |
| ------ | ------------------------------------ | -------------------------- |
| GET    | `/commerce/cart`                     | Get cart                   |
| POST   | `/commerce/cart`                     | Add to cart                |
| DELETE | `/commerce/cart/:productId`          | Remove from cart           |
| DELETE | `/commerce/cart/clear`               | Clear cart                 |
| POST   | `/commerce/orders`                   | Place order                |
| GET    | `/commerce/orders/my`                | Get my orders              |
| GET    | `/commerce/orders/:id`               | Get order by ID            |
| PUT    | `/commerce/orders/:id/cancel`        | Cancel order               |
| POST   | `/commerce/orders/:id/reviews`       | Add order review           |
| POST   | `/commerce/orders/:id/returns`       | Request return             |
| POST   | `/commerce/payments/razorpay/order`  | Create Razorpay order      |
| POST   | `/commerce/payments/razorpay/verify` | Verify Razorpay payment    |
| POST   | `/commerce/checkout/reserve`         | Reserve stock for checkout |
| DELETE | `/commerce/checkout/reserve`         | Release stock reservation  |

### Upload (`/api/upload`)

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| POST   | `/upload/image` | Upload image to Cloudinary |
| POST   | `/upload/video` | Upload video to Cloudinary |

### Content — Public (`/api/content`)

| Method | Endpoint                          | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/content/site-config`            | Get site branding config      |
| GET    | `/content/hero-slides`            | Get hero slider content       |
| GET    | `/content/categories`             | Get categories                |
| GET    | `/content/brands`                 | Get brands                    |
| GET    | `/content/collections`            | Get featured collections      |
| GET    | `/content/cities`                 | Get supported cities          |
| GET    | `/content/ads/public?slotId=X`    | Get active ads for a slot     |
| GET    | `/content/notifications/my`       | Get my notifications          |
| PUT    | `/content/notifications/:id/read` | Mark notification read        |
| GET    | `/content/wishlist`               | Get my wishlist               |
| POST   | `/content/wishlist`               | Add to wishlist               |
| DELETE | `/content/wishlist/:productId`    | Remove from wishlist          |
| POST   | `/content/support-tickets`        | Create support ticket         |
| GET    | `/content/support-tickets/my`     | Get my tickets                |
| GET    | `/content/reviews/my`             | Get my reviews                |
| POST   | `/content/stock-alerts`           | Subscribe to stock alert      |
| GET    | `/content/subscription-plans`     | Get seller subscription plans |

### Content — Seller (`/api/content/seller`)

| Method | Endpoint                                               | Description              |
| ------ | ------------------------------------------------------ | ------------------------ |
| GET    | `/content/seller/dashboard`                            | Seller dashboard data    |
| GET    | `/content/seller/orders`                               | Seller orders            |
| PUT    | `/content/seller/orders/:id/status`                    | Update order status      |
| PUT    | `/content/seller/orders/:id/returns/:productId/status` | Handle return            |
| GET    | `/content/seller/ads`                                  | Seller's ads             |
| GET    | `/content/seller/ad-slots`                             | Available ad slots       |
| POST   | `/content/seller/ads`                                  | Create ad                |
| GET    | `/content/seller/payouts`                              | Seller payouts           |
| POST   | `/content/seller/subscription/select`                  | Choose subscription plan |

### Content — Admin (`/api/content/admin`)

| Method | Endpoint                                           | Description                    |
| ------ | -------------------------------------------------- | ------------------------------ |
| GET    | `/content/admin/analytics?range=week\|month\|year` | Dashboard analytics            |
| GET    | `/content/admin/users`                             | All users (filterable by role) |
| PUT    | `/content/admin/users/:uid/role`                   | Change user role               |
| PUT    | `/content/admin/users/:uid/ban`                    | Ban/unban user                 |
| DELETE | `/content/admin/users/:uid/remove-admin`           | Remove admin role              |
| GET    | `/content/admin/sellers/pending`                   | Pending seller verifications   |
| GET    | `/content/admin/sellers`                           | All sellers                    |
| PUT    | `/content/admin/sellers/:uid/approve`              | Approve seller                 |
| PUT    | `/content/admin/sellers/:uid/reject`               | Reject seller                  |
| GET    | `/content/admin/orders`                            | All orders                     |
| PUT    | `/content/admin/orders/:id/status`                 | Update order status            |
| GET    | `/content/admin/products/curation`                 | Products for moderation        |
| PUT    | `/content/admin/products/:id/moderation`           | Approve/reject product         |
| GET    | `/content/admin/ads`                               | All ads                        |
| PUT    | `/content/admin/ads/:id`                           | Update/approve/activate ad     |
| POST   | `/content/admin/ads`                               | Create ad (admin)              |
| GET    | `/content/admin/ad-slots`                          | All ad slots                   |
| PUT    | `/content/admin/ad-slots/:id`                      | Update ad slot config          |
| GET    | `/content/admin/support-tickets`                   | All support tickets            |
| PUT    | `/content/admin/support-tickets/:id/status`        | Update ticket status           |
| GET    | `/content/admin/monetization`                      | Monetization overview          |
| GET    | `/content/admin/commission-structure`              | Commission structure           |
| PUT    | `/content/admin/commission-structure`              | Update commission              |
| POST   | `/content/admin/payouts/:id/release`               | Release payout                 |
| GET    | `/content/admin/subscription-plans`                | All subscription plans         |
| POST   | `/content/admin/subscription-plans`                | Create plan                    |
| PUT    | `/content/admin/subscription-plans/:id`            | Update plan                    |
| PUT    | `/content/site-config`                             | Update site config             |
| POST   | `/content/hero-slides`                             | Create hero slide              |
| PUT    | `/content/hero-slides/:id`                         | Update hero slide              |
| DELETE | `/content/hero-slides/:id`                         | Delete hero slide              |
| PUT    | `/content/cities/:id`                              | Update city                    |

### Super Admin Resets (`/api/content/admin/reset`)

| Method | Endpoint                                   | Description              |
| ------ | ------------------------------------------ | ------------------------ |
| POST   | `/content/admin/reset/activities`          | Clear admin activity log |
| POST   | `/content/admin/reset/delete-all-products` | Delete all products      |
| POST   | `/content/admin/reset/delete-users`        | Delete users by role     |
| POST   | `/content/admin/reset/web`                 | Full web data reset      |

---

## 12. Frontend Routing (`src/App.jsx`)

All pages use `React.lazy()` + `<Suspense>` for route-based code splitting.

| Path                                    | Component                     | Access                      |
| --------------------------------------- | ----------------------------- | --------------------------- |
| `/`                                     | `Home`                        | Public                      |
| `/search`                               | `Search`                      | Public                      |
| `/mobile-search`                        | `MobileSearch`                | Public                      |
| `/products`                             | `Products`                    | Public                      |
| `/category/:categoryName`               | `CategoryPage`                | Public                      |
| `/product/:id`                          | `ProductDetail`               | Public                      |
| `/cart`                                 | `Cart`                        | Public                      |
| `/checkout`                             | `Checkout`                    | Protected (logged in)       |
| `/history`                              | `OrderHistory`                | Protected                   |
| `/track`                                | `Track`                       | Public                      |
| `/wishlist`                             | `Wishlist`                    | Protected                   |
| `/profile`                              | `Profile`                     | Protected                   |
| `/login`                                | `Login`                       | Auth layout                 |
| `/signup`                               | `Signup`                      | Auth layout                 |
| `/seller/signup`                        | `SellerSignup`                | Auth layout                 |
| `/seller/onboarding`                    | `SellerOnboarding`            | Protected (customer/seller) |
| `/seller/waiting`                       | `SellerApprovalWaiting`       | Protected                   |
| `/seller`                               | `SellerDashboard`             | Seller only                 |
| `/seller/add-product`                   | `SellerAddProduct`            | Seller only                 |
| `/seller/edit-product/:id`              | `SellerAddProduct`            | Seller only                 |
| `/seller/products`                      | `SellerProductList`           | Seller only                 |
| `/seller/orders`                        | `SellerOrders`                | Seller only                 |
| `/seller/ads`                           | `SellerAds`                   | Seller only                 |
| `/seller/payouts`                       | `Payouts`                     | Seller only                 |
| `/seller/subscription`                  | `SellerSubscription`          | Seller only                 |
| `/seller/instructions`                  | `SellerInstructions`          | Seller only                 |
| `/seller/settings`                      | `StoreSettings`               | Seller only                 |
| `/seller/profile`                       | `SellerProfile`               | Seller only                 |
| `/admin`                                | `AdminStats`                  | Admin only                  |
| `/admin/verify`                         | `VerifySellers`               | Admin only                  |
| `/admin/ads`                            | `AdminAdsManagement`          | Admin only                  |
| `/admin/website-control`                | `AdminWebsiteControl`         | Admin only                  |
| `/admin/guide`                          | `AdminGuide`                  | Admin only                  |
| `/admin/users`                          | `UserManagement`              | Admin only                  |
| `/admin/sellers`                        | `SellerManagement`            | Admin only                  |
| `/admin/subscriptions`                  | `AdminSubscriptionManagement` | Admin only                  |
| `/about`, `/contact`, `/terms`, `/help` | Static pages                  | Public                      |

---

## 13. Ads System

### Slot IDs

| Slot ID          | Location                          |
| ---------------- | --------------------------------- |
| `home_top`       | Home page, after Same-Day section |
| `home_mid`       | Home page, after Trending         |
| `home_bottom`    | Home page, after New Arrivals     |
| `search_sidebar` | Search / Products filter sidebar  |
| `product_detail` | Product detail page               |

### Ad Lifecycle

1. Admin creates ad slots in `AdminAdsManagement`
2. Seller submits ad → `status: PENDING_REVIEW`, `active: false`
3. Admin reviews: Approve (`status: PUBLISHED`, `active: true`) or Reject
4. `AdBanner` component fetches active ad for slot via `/content/ads/public?slotId=...`
5. **If no active ad → component renders nothing** (no placeholder shown to users)

---

## 14. Image Optimization (Cloudinary)

Function: `optimizeCloudinaryUrl(url, { width? })` in `src/utils/cloudinary.ts`

- Injects `q_auto,f_auto` into Cloudinary delivery URLs
- Optionally adds `w_<width>` for responsive sizing
- Format: `https://res.cloudinary.com/.../upload/q_auto,f_auto,w_800/image.jpg`
- Already applied everywhere: hero images, product thumbnails, brand logos, ad banners, category images

---

## 15. Dynamic Homepage Categories

The `Home.jsx` "Explore Our Collections" section uses a priority cascade:

1. **API categories** from `contentApi.getCategories()` (admin-configured in Firestore)
2. **Derived from products** — unique `categoryId` values from loaded products
3. **Static fallback** — hardcoded: Artisans, Home, Kids, Men, Women

Category images use:

1. Best-performing product thumbnail for that category (by rating/order count)
2. Static local image (`men_cat.png`, `women_cat.png`, etc.) if available
3. Emoji icon fallback

---

## 16. Site Branding (Dynamic)

Configurable via Admin → Website Control:

| Field                | Applied In                                 |
| -------------------- | ------------------------------------------ |
| `brandName`          | Header logo text, footer logo text         |
| `brandLogoUrl`       | Header logo image, footer logo image       |
| `brandTextColor`     | Logo text color                            |
| `brandFontFamily`    | Logo font family                           |
| `brandFontWeight`    | Logo font weight                           |
| `announcementBanner` | Top green announcement bar                 |
| `subNavCategories`   | Sub-navigation category links below header |

---

## 17. Performance Optimizations

| Optimization                 | Implementation                                         |
| ---------------------------- | ------------------------------------------------------ |
| Route-based code splitting   | `React.lazy()` + `<Suspense>` on every route           |
| Cloudinary image auto-format | `q_auto,f_auto` in every image URL                     |
| Responsive image sizing      | `w_<width>` per usage context                          |
| Lazy loading images          | `loading="lazy"` on ad banners                         |
| API env variables            | `VITE_API_URL` / `import.meta.env` — no hardcoded URLs |
| SPA 404 fix                  | `firebase.json` rewrites all routes to `index.html`    |
| Network status toast         | `NetworkStatusToast` detects offline state             |
| Request deduplication        | `cancelled` flags in `useEffect` cleanups              |

---

## 18. Security

- All protected endpoints require `Authorization: Bearer <firebase_token>`
- CORS restricted to known origins (`zoop-88df6.web.app` + `FRONTEND_URL` + `ALLOWED_ORIGINS`)
- Helmet.js sets secure HTTP headers
- Super-admin actions locked to `admin@zoop.com` email
- Role-based authorization via `authorize()` middleware
- Seller-uploaded products go through admin moderation before public listing

---

## 19. QA Checklist

- [ ] Login and role redirects (customer/seller/admin)
- [ ] Ad slots show nothing when no active ads (no "Ad Space" placeholder)
- [ ] Footer "Seller Guidelines" links to `/seller/instructions`
- [ ] Homepage categories show real data from API/products (not hardcoded)
- [ ] Cloudinary images use `q_auto,f_auto` transformation
- [ ] API URL uses `VITE_API_URL` env var — no hardcoded `localhost:5000`
- [ ] Backend uses `process.env.PORT` (verified in `apps/server/src/index.ts`)
- [ ] CORS allows `https://zoop-88df6.web.app` (verified in both server files)
- [ ] `firebase.json` has SPA rewrites for page-refresh routing
- [ ] Admin ad review (approve/reject/activate/deactivate)
- [ ] Seller guide route: `/seller/instructions`
- [ ] Admin guide route: `/admin/guide`
- [ ] Chart rendering for week/month/year (admin and seller)
- [ ] Brand config reflected in header/footer and sidebars
- [ ] Replace `YOUR_RENDER_BACKEND_URL` in `src/config/apiBase.ts` before deploy

---

## 20. Known Issues / Action Items

1. **Render backend URL**: Replace placeholder in `src/config/apiBase.ts` with actual Render deployment URL
2. **OpenStreetMap proxy**: The `/mapapi` Vite proxy only works in dev — production must call Nominatim directly or via backend
3. **Legacy `backend/` directory**: The `backend/` with MongoDB exists alongside `apps/server/` (Firestore). Clarify which one is production.
4. **`VITE_API_URL` for production**: Set this in Firebase Hosting environment or in `.env.production` file pointing to Render URL
5. **`babel-plugin-react-compiler`**: React Compiler lint rules flag some `setState` in effects — these are pre-existing patterns, not new regressions
