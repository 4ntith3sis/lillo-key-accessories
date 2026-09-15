# LILLO — Key Accessories

**LILLO** adalah aplikasi katalog dan e-commerce aksesori gantungan kunci berbasis web, dibangun dengan arsitektur fullstack modern menggunakan Next.js, Express.js, dan Appwrite.

![LILLO](https://img.shields.io/badge/LILLO-Key%20Accessories-black?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
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
| Next.js (App Router) | 15 |
| React | 19 |
| TypeScript | 5 |
| Vanilla CSS | — |

### Backend
| Teknologi | Versi |
|-----------|-------|
| Node.js | 20+ |
| Express.js | 4 |
| TypeScript | 5 |
| Appwrite Node.js SDK | latest |

### Platform / Storage
| Layanan | Fungsi |
|---------|--------|
| Appwrite Cloud | Database, Storage, Authentication |

---

## Arsitektur

```
Next.js Frontend (Port 3000)
        ↓
Express REST API (Port 4000)
        ↓
Appwrite Cloud
   ├── Database (products, categories, orders, homepage_content, stock_history)
   └── Storage (lillo_media_bucket, homepageAssets)
```

> **Aturan penting**: Frontend **tidak boleh** mengakses Appwrite secara langsung. Semua request harus melalui Express backend.

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
├── backend/                     # Express.js TypeScript API (Port 4000)
│   ├── src/
│   │   ├── config/              # CORS & Appwrite SDK init
│   │   ├── controllers/         # Route handlers (products, categories, homepage, auth, inventory)
│   │   ├── middleware/          # Auth middleware, rate limiter, CORS
│   │   ├── routes/              # Express route definitions
│   │   ├── services/            # Appwrite service wrappers
│   │   └── server.ts            # Entry point
│   ├── .env.example             # Template env backend
│   └── package.json
│
├── docs/                        # Dokumentasi teknis
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
# Edit .env dan isi semua nilai Appwrite
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
APPWRITE_DATABASE_ID=lillo_main_db
APPWRITE_STORAGE_BUCKET_ID=lillo_media_bucket

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

**Variabel env frontend (`frontend/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
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
| GET | `/api/health` | Health check |
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
| POST | `/api/products` | Tambah produk |
| PUT | `/api/products/:id` | Update produk |
| DELETE | `/api/products/:id` | Hapus produk |
| POST | `/api/products/upload` | Upload gambar |
| POST | `/api/inventory/stock-in` | Stock In |
| POST | `/api/inventory/stock-out` | Stock Out |
| GET | `/api/inventory/:productId/history` | Riwayat stok |
| PATCH | `/api/homepage` | Update homepage CMS |
| PATCH | `/api/about` | Update about CMS |

---

## Keamanan

- **Autentikasi**: Appwrite Authentication (`createEmailPasswordSession`)
- **Session Cookie**: `HttpOnly`, `SameSite=None; Secure` di production
- **Rate Limiting**: Max 5 login gagal per 15 menit per IP
- **CORS**: Hanya origin yang diizinkan di `FRONTEND_URL`
- **Admin Authorization**: Endpoint admin verifikasi label `admin` di Appwrite

---

## Deployment

### Frontend → Vercel
- Set `NEXT_PUBLIC_API_URL` ke URL backend publik
- Tidak ada secret Appwrite di env frontend

### Backend → Node Host (Railway / Render / VPS)
- Set semua variabel env backend
- `NODE_ENV=production` untuk mengaktifkan cookie `SameSite=None; Secure`
- `FRONTEND_URL` harus berisi URL Vercel yang tepat (untuk CORS)

---

## Lisensi

© 2024 LILLO. All rights reserved.
