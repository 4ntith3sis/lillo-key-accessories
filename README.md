# LILLO — Key Accessories

**LILLO** adalah aplikasi katalog dan e-commerce aksesori gantungan kunci berbasis web, dibangun dengan arsitektur fullstack modern menggunakan Next.js, Express.js, dan Appwrite yang berjalan dalam **satu project Vercel**.

![LILLO](https://img.shields.io/badge/LILLO-Key%20Accessories-black?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Express](https://img.shields.io/badge/Express.js-4-black?style=flat-square&logo=express)
![Appwrite](https://img.shields.io/badge/Appwrite-Cloud-FD366E?style=flat-square&logo=appwrite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

---

## Fitur Utama

- 🛍️ **Katalog Produk** — Browsing produk dengan filter kategori dan tampilan charm wall interaktif
- 🛒 **Keranjang Belanja** — Tambah, hapus, dan kelola item di keranjang
- 💬 **Checkout via WhatsApp** — Pemesanan langsung via WhatsApp Business
- 🖼️ **Homepage CMS** — Edit konten homepage (Hero, Brand Statement, CTA, dll.) langsung dari Admin Dashboard
- 📦 **Manajemen Inventori** — Stock In / Stock Out dengan riwayat perubahan stok
- 🔐 **Admin Dashboard** — Autentikasi via Appwrite, manajemen produk, kategori, dan CMS
- 🌐 **Fully Localized** — Seluruh antarmuka dalam Bahasa Indonesia

---

## Tech Stack

### Frontend
| Teknologi | Versi |
|-----------|-------|
| Next.js (App Router) | 16 |
| React | 19 |
| TypeScript | 5 |
| Vanilla CSS | — |

### Backend
| Teknologi | Versi |
|-----------|-------|
| Node.js | 20+ |
| Express.js (Vercel Serverless Function / Local Express) | 4 |
| TypeScript | 5 |
| Appwrite Node.js SDK | latest |

### Platform / Storage
| Layanan | Fungsi |
|---------|--------|
| Appwrite Cloud | Database, Storage, Authentication |
| Vercel | Full-Stack Single Deployment (Next.js + Express Serverless API) |

---

## Arsitektur

### Development Lokal:
```
Next.js Frontend (http://localhost:3000)
        ↓
Express REST API (http://localhost:4000)
        ↓
Appwrite Cloud
   ├── Database (products, categories, inventory, inventory_transactions, homepage_content, about_content)
   └── Storage (product-images)
```

### Production Deployment (Single Vercel Project):
```
Vercel (https://lillo-key-accessories.vercel.app)
├── Next.js Frontend (/*)
└── Express Serverless API (/api/*)
        ↓
Appwrite Cloud
   ├── Database
   └── Storage
```

> **Aturan penting**: Frontend **tidak boleh** mengakses Appwrite secara langsung. Semua request melalui `/api/*` Express backend. Tidak ada credentials Appwrite yang terekspos ke browser.

---

## Struktur Project

```
lillo-key-accessories/
│
├── frontend/                    # Next.js App Router (Port 3000)
│   ├── app/                     # Halaman: /, /collection, /products/[id], /cart, /checkout, /about, /admin
│   ├── components/              # Reusable components (Navbar, Hero, CharmWall, ProductCard, dll.)
│   ├── context/                 # CartContext, ActiveProductContext
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # API client helpers
│   ├── types/                   # TypeScript type definitions
│   ├── public/assets/           # Static assets (fonts, icons, background)
│   ├── .env.example             # Template env frontend
│   └── package.json
│
├── backend/                     # Express.js TypeScript API (Port 4000 / Vercel Handler)
│   ├── api/
│   │   └── index.ts             # Vercel Serverless Function entry point
│   ├── src/
│   │   ├── app.ts               # Express app initialization & route registration
│   │   ├── config/              # CORS & Appwrite SDK env validation
│   │   ├── controllers/         # Route handlers (products, categories, homepage, auth, inventory)
│   │   ├── middleware/          # Auth middleware, rate limiter, CORS
│   │   ├── routes/              # Express route definitions
│   │   ├── services/            # Appwrite service wrappers
│   │   └── server.ts            # Entry point untuk local dev (app.listen)
│   ├── .env.example             # Template env backend
│   └── package.json
│
├── vercel.json                  # Single-project Vercel configuration
├── .gitignore
└── README.md
```

---

## Setup Lokal

### Prasyarat
- Node.js 20+
- Akun [Appwrite Cloud](https://appwrite.io) dengan project yang sudah dikonfigurasi

### 1. Clone Repository

```bash
git clone https://github.com/4ntith3sis/lillo-key-accessories.git
cd lillo-key-accessories
```

### 2. Konfigurasi Backend

```bash
cd backend
cp .env.example .env
# Edit .env dan isi nilai Appwrite credentials
npm install
npm run dev
```

**Variabel env backend (`backend/.env`):**

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_PRODUCTS_TABLE_ID=products
APPWRITE_CATEGORIES_TABLE_ID=categories
APPWRITE_INVENTORY_TABLE_ID=inventory
APPWRITE_INVENTORY_TRANSACTIONS_TABLE_ID=inventory_transactions
APPWRITE_HOMEPAGE_CONTENT_TABLE_ID=homepage_content
APPWRITE_ABOUT_CONTENT_TABLE_ID=about_content
APPWRITE_PRODUCT_IMAGES_BUCKET_ID=product-images

# Admin
ADMIN_EMAIL=admin@example.com
```

### 3. Konfigurasi Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local
npm install
npm run dev
```

**Variabel env frontend:**

Development (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=6281234567890
```

Production (Vercel Environment Variables):
```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=6281234567890
```

> Tidak ada Appwrite key di frontend. Semua secret hanya di backend.

### 4. Buka di browser

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## API Endpoints

### Public (tanpa autentikasi)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Health check Express |
| GET | `/api/health/appwrite` | Health check Appwrite connection |
| GET | `/api/products` | Daftar produk |
| GET | `/api/products/:id` | Detail produk |
| GET | `/api/categories` | Daftar kategori |
| GET | `/api/homepage` | Konten homepage |
| GET | `/api/about` | Konten about page |

### Admin Protected (butuh session)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login admin |
| POST | `/api/auth/logout` | Logout admin |
| GET | `/api/auth/me` | Status sesi admin |
| POST | `/api/products` | Tambah produk |
| PUT | `/api/products/:id` | Update produk |
| DELETE | `/api/products/:id` | Hapus produk |
| POST | `/api/product-images` | Upload gambar produk ke Appwrite Storage |
| GET | `/api/inventory` | Data stok inventori |
| POST | `/api/inventory/transactions` | Catat transaksi stok (Stock In/Out) |
| GET | `/api/admin/dashboard` | Statistik dashboard admin |
| PUT | `/api/cms/homepage/:section` | Update bagian homepage CMS |
| PUT | `/api/cms/about/:section` | Update bagian about CMS |

---

## Single Vercel Deployment

Project ini menggunakan Vercel Serverless Function untuk menjalankan Express API bersama Next.js frontend dalam 1 project Vercel.

### Set Environment Variables di Vercel Dashboard:

**Frontend Environment Variables:**
- `NEXT_PUBLIC_API_URL` = `/api`
- `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` = `6281234567890`

**Backend Environment Variables:**
- `APPWRITE_ENDPOINT` = `https://cloud.appwrite.io/v1`
- `APPWRITE_PROJECT_ID` = `your_project_id`
- `APPWRITE_API_KEY` = `your_api_key`
- `APPWRITE_DATABASE_ID` = `lillo_main_db`
- `APPWRITE_PRODUCTS_TABLE_ID` = `products`
- `APPWRITE_CATEGORIES_TABLE_ID` = `categories`
- `APPWRITE_INVENTORY_TABLE_ID` = `inventory`
- `APPWRITE_INVENTORY_TRANSACTIONS_TABLE_ID` = `inventory_transactions`
- `APPWRITE_HOMEPAGE_CONTENT_TABLE_ID` = `homepage_content`
- `APPWRITE_ABOUT_CONTENT_TABLE_ID` = `about_content`
- `APPWRITE_PRODUCT_IMAGES_BUCKET_ID` = `product-images`
- `ADMIN_EMAIL` = `admin@example.com`

---

## Lisensi

© 2024 LILLO. All rights reserved.
