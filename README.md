# LILLO Key Accessories

A modern ecommerce website for discovering and purchasing collectible key accessories and charms — with a visual storefront, shopping cart, WhatsApp-based checkout, and an authenticated admin dashboard with CMS.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-black?style=flat-square&logo=react)
![Express](https://img.shields.io/badge/Express.js-4-black?style=flat-square&logo=express)
![Appwrite](https://img.shields.io/badge/Appwrite-Cloud-FD366E?style=flat-square&logo=appwrite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

## Contents

- [Live Website](#live-website)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Admin Dashboard](#admin-dashboard)
- [Deployment](#deployment)
- [Security](#security)
- [License](#license)

---

## Live Website

[https://lillo-key-accessories.vercel.app](https://lillo-key-accessories.vercel.app)

---

## Overview

LILLO Key Accessories is a responsive ecommerce platform focused on collectible key accessories and charms. The website provides a visual storefront with an animated hero and an interactive charm wall, product discovery with category filtering, product detail pages with live stock availability, a persistent shopping cart, and WhatsApp-based checkout — supported by an authenticated admin dashboard and CMS for managing products, categories, inventory, and homepage/about content.

---

## Features

### Storefront

- Animated hero section with pointer-reactive motion
- Interactive canvas-based charm wall with pointer interaction
- CMS-driven homepage content (with built-in fallback content)
- Product collection page with category filtering (`/collection?category=...`)
- Product detail pages with live stock display and stock badges
- Product images served from Appwrite Storage
- About and contact pages

### Shopping

- Shopping cart with `localStorage` persistence across visits
- Live stock validation before checkout (prices and stock are re-verified server-side)
- WhatsApp-based checkout — the order (customer details, items, totals) is composed into a `wa.me` order link using the configured business number
- Stock availability indicators (`IN STOCK` / `OUT OF STOCK`) on product and cart views

### Admin & CMS (authenticated)

- Admin authentication: email/password login verified against Appwrite identity, admin role via Appwrite user labels, session cookie issued by the backend
- Admin dashboard with store statistics
- Product management (create, update, delete, image uploads)
- Category management (create, update, delete)
- Inventory management with Stock In / Stock Out transactions and full transaction history
- Homepage CMS editor (sections + asset uploads)
- About page CMS editor (sections + asset uploads)

### Platform

- Responsive layouts for mobile, tablet, and desktop
- Reduced-motion support across animated components and global styles
- Centralized API client with a single API base-URL source of truth

---

## Tech Stack

### Frontend

| Technology | Notes |
|------------|-------|
| Next.js 16 (App Router) | `frontend/` workspace |
| React 19 | — |
| TypeScript 5 | Strict types in `frontend/types/` |
| Vanilla CSS | Single global stylesheet, no CSS framework |
| ESLint | Dev-time linting (`next lint` config) |

### Backend

| Technology | Notes |
|------------|-------|
| Node.js | Express runtime |
| Express 4 | REST API (`backend/src/`) |
| TypeScript 5 | Compiled to `backend/dist/` |
| node-appwrite SDK | Database + Storage access (backend-only) |
| cookie-parser / cors / dotenv | Session cookies, CORS allow-list, env config |

### Database & Storage

| Service | Usage |
|---------|-------|
| Appwrite Database | `products`, `categories`, `inventory`, `inventory_transactions`, `homepage_content`, `about_content`, `admin_sessions` collections |
| Appwrite Storage | `product-images` and `homepage-assets` buckets |

### Deployment

| Service | Usage |
|---------|-------|
| Vercel | Single project hosting the Next.js frontend and the Express API (serverless function) |

---

## Architecture

```text
Browser
   │
   ▼
Next.js Frontend
   │
   ▼
Vercel /api
   │
   ▼
Express Backend
   │
   ▼
Appwrite
 ┌─┴───────────────┐
 │                 │
Database         Storage
```

How it works:

- The browser talks only to the Next.js frontend and the `/api/*` endpoints — the frontend **never** accesses Appwrite directly (no Appwrite credentials or SDK in the frontend).
- In production, `/api/*` is served same-origin: `vercel.json` rewrites `/api/:path*` to the `/api/index` serverless function, which mounts the Express app (`backend/src/app.ts`), and Express routes requests internally.
- The Express backend holds all privileged credentials and talks to Appwrite Database + Storage via the Node SDK.
- For local development, the frontend targets the production Vercel API by default, so no local backend is required (point `NEXT_PUBLIC_API_URL` at `http://localhost:4000` to use a local backend instead).

---

## Project Structure

```text
lillo-key-accessories/
├── api/
│   └── index.ts               # Vercel serverless entry — mounts the Express app
├── backend/                   # Express.js + TypeScript API
│   ├── src/
│   │   ├── app.ts             # Express app, CORS allow-list, route mounting
│   │   ├── server.ts          # Local dev entry point (app.listen)
│   │   ├── config/            # env validation, Appwrite SDK setup
│   │   ├── controllers/       # products, categories, inventory, auth, homepage,
│   │   │                      # about, CMS, images, admin, health
│   │   ├── middleware/        # session auth, admin guard, 404, error handler
│   │   ├── routes/            # /api/* route definitions
│   │   └── services/          # Appwrite service wrappers, auth/session logic
│   ├── .env.example           # Backend env template (names only, no secrets)
│   └── package.json
├── frontend/                  # Next.js (App Router) + TypeScript
│   ├── app/                   # /, /collection, /products/[id], /cart,
│   │                          # /checkout, /about, /contact, /admin/*
│   ├── components/            # Navbar, Hero, CharmWall, ProductCard, Footer, ...
│   ├── context/               # CartContext (localStorage), ActiveProductContext
│   ├── hooks/                 # Custom React hooks (e.g. scroll reveal)
│   ├── lib/                   # API client, API base URL, auth, WhatsApp checkout
│   ├── types/                 # Product, category, cart, inventory, CMS types
│   ├── public/                # Static assets
│   ├── .env.example           # Frontend env template
│   └── package.json
├── vercel.json                # Rewrites /api/:path* → /api/index
├── package.json               # npm workspaces (frontend + backend)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20 or later and npm
- An [Appwrite Cloud](https://appwrite.io) project with the required collections and buckets (see [Environment Variables](#environment-variables))

### 1. Clone and install

```bash
git clone https://github.com/4ntith3sis/lillo-key-accessories.git
cd lillo-key-accessories
npm install
```

### 2. Backend setup (optional for local frontend work)

```bash
cd backend
cp .env.example .env
# Fill in backend/.env (see table below — secrets stay backend-only)
npm install
npm run dev        # tsx watch — serves http://localhost:4000
```

> The frontend talks to the production Vercel API by default, so a local backend is **not** required to run the storefront locally. Start it only if you want to develop the API itself.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
# Fill in frontend/.env.local (see table below)
npm install
npm run dev        # serves http://localhost:3000
```

### 4. Open the app

- Storefront: [http://localhost:3000](http://localhost:3000)
- API health (production): [https://lillo-key-accessories.vercel.app/api/health](https://lillo-key-accessories.vercel.app/api/health)
- Local backend (only if running): [http://localhost:4000](http://localhost:4000)

### 5. Admin access

Admin login is at `/admin/login`. Production admin rights come from the **`admin` label** on the corresponding Appwrite user; `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` are a development fallback only.

---

## Environment Variables

> Only variable **names** are documented here. Never commit `.env` / `.env.local` files (they are git-ignored).

### Backend (`backend/.env`)

| Variable | Notes |
|----------|-------|
| `PORT` | Local dev port (default `4000`) |
| `NODE_ENV` | `development` locally |
| `FRONTEND_URL` | Allowed frontend origin for CORS |
| `APPWRITE_ENDPOINT` | Appwrite Cloud endpoint |
| `APPWRITE_PROJECT_ID` | Appwrite project ID |
| `APPWRITE_API_KEY` | **Backend-only secret — leave empty until you fill in your own key** |
| `APPWRITE_DATABASE_ID` | Appwrite database ID |
| `APPWRITE_PRODUCTS_TABLE_ID` | Products collection |
| `APPWRITE_CATEGORIES_TABLE_ID` | Categories collection |
| `APPWRITE_INVENTORY_TABLE_ID` | Inventory collection |
| `APPWRITE_INVENTORY_TRANSACTIONS_TABLE_ID` | Stock transaction history collection |
| `APPWRITE_HOMEPAGE_CONTENT_TABLE_ID` | Homepage CMS collection |
| `APPWRITE_ABOUT_CONTENT_TABLE_ID` | About CMS collection |
| `APPWRITE_ADMIN_SESSIONS_TABLE_ID` | Admin session records collection |
| `APPWRITE_PRODUCT_IMAGES_BUCKET_ID` | Product images bucket |
| `APPWRITE_HOMEPAGE_ASSETS_BUCKET_ID` | Homepage/CMS assets bucket |
| `SESSION_SECRET` | **Backend-only secret** used to sign admin session tokens — generate your own (e.g. `openssl rand -hex 32`) |
| `ADMIN_EMAIL` | Dev fallback admin email (production uses the Appwrite `admin` user label) |
| `ADMIN_PASSWORD` | **Dev fallback only — never use a real/shared password, and never commit it** |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | Optional session-cookie overrides (secure defaults apply) |

### Frontend (`frontend/.env.local`)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | API origin. Local dev defaults to the production Vercel API; set to `http://localhost:4000` for a local backend, or `/api` for same-origin production. |
| `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` | WhatsApp business number in international format (digits only, no `+` or spaces). Required for checkout. |

---

## API Reference

Base path: `/api`. Admin-protected routes require a valid admin session (session cookie, sent with `credentials: 'include'`).

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Express health check |
| GET | `/api/health/appwrite` | Appwrite connectivity check |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Product detail |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id` | Category detail |
| GET | `/api/homepage` | Homepage CMS content |
| GET | `/api/about` | About page CMS content |
| GET | `/api/cms/homepage` | Homepage CMS content (CMS API) |
| GET | `/api/cms/about` | About CMS content (CMS API) |
| GET | `/api/inventory` | Inventory levels |
| GET | `/api/inventory/transactions` | Stock transaction history (alias: `/history`) |
| GET | `/api/inventory/:productId` | Inventory for one product |

### Admin protected

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login (email + password) |
| POST | `/api/auth/logout` | Admin logout (revokes session) |
| GET | `/api/auth/me` | Current admin session status |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
| POST | `/api/product-images` | Upload product image to Appwrite Storage |
| DELETE | `/api/product-images/:fileId` | Delete product image |
| POST | `/api/inventory/transactions` | Record Stock In / Stock Out (alias: `/transaction`) |
| PUT | `/api/inventory/:productId` | Update inventory level |
| GET | `/api/admin/dashboard` | Dashboard statistics |
| PATCH | `/api/homepage` | Update homepage content |
| POST | `/api/homepage/assets` | Upload homepage asset |
| PATCH | `/api/about` | Update about content |
| POST | `/api/about/assets` | Upload about asset |
| PUT | `/api/cms/homepage` | Update homepage CMS document |
| PUT | `/api/cms/homepage/:section` | Update one homepage section |
| PUT | `/api/cms/about` | Update about CMS document |
| PUT | `/api/cms/about/:section` | Update one about section |
| POST | `/api/cms/images` | Upload CMS image |
| DELETE | `/api/cms/images/:fileId` | Delete CMS image |

---

## Admin Dashboard

All admin pages live under `/admin` and require an authenticated admin session:

| Route | Manages |
|-------|---------|
| `/admin/login` | Admin sign-in |
| `/admin` | Dashboard statistics |
| `/admin/products` | Product catalog |
| `/admin/categories` | Categories |
| `/admin/inventory` | Stock levels, Stock In/Out, transaction history |
| `/admin/homepage` | Homepage CMS |
| `/admin/about` | About page CMS |
| `/admin/cms` | CMS overview |

---

## Deployment

The project deploys as a **single Vercel project**:

1. Import the repository into Vercel.
2. Set the frontend variables (`NEXT_PUBLIC_API_URL=/api`, `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER`) and all backend variables from the [table above](#backend-backendenv) in the Vercel dashboard — no secret values belong in the repository.
3. Deploy. Vercel builds the Next.js frontend and serves the Express API from the `/api/index` serverless function (`vercel.json` rewrite).

Build commands (also available at the repo root via npm workspaces):

```bash
npm run build    # builds frontend (next build) and backend (tsc)
npm run dev      # runs the frontend dev server
```

---

## Security

- The frontend never communicates with Appwrite directly — all data access goes through the Express `/api`.
- `APPWRITE_API_KEY`, `SESSION_SECRET`, and `ADMIN_PASSWORD` live only in backend runtime environment variables and are never exposed to the browser or committed to the repo.
- Admin sessions are backend-issued signed tokens stored in an HTTP session cookie; logout revokes the session persistently in the `admin_sessions` collection.
- CORS uses an explicit allow-list (configured frontend origin, local dev origins, and Vercel domains) — never a wildcard — since the API relies on credentialed requests.
- `.env`, `.env.local`, and related secret files are git-ignored at every level of the repo.

---

## License

© LILLO. All rights reserved.
