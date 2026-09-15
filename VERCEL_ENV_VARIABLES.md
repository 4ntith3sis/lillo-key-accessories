# LILLO — Vercel Environment Variables Guide

Dokumen ini berisi daftar **lengkap dan akurat** semua Environment Variables
yang digunakan oleh project LILLO, berdasarkan audit source code aktual.

> **Catatan:** Tidak ada `APPWRITE_COLORS_TABLE_ID` atau `APPWRITE_PRODUCT_VARIANTS_TABLE_ID`
> karena project LILLO tidak menggunakan sistem Color/Variant/Size.

---

## A. Frontend Environment Variables

| Variable | Wajib di Prod? | Secret? | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ YES | No | URL backend Express API |
| `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` | ✅ YES | No | Nomor WA Business (format: `628xxx`) |

**Development default** (di `frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=628xxxxxxxxxx
```

---

## B. Backend Environment Variables

| Variable | Wajib di Prod? | Secret? | Keterangan |
|---|---|---|---|
| `PORT` | Platform | No | Vercel assign otomatis — tidak perlu diisi |
| `NODE_ENV` | ✅ YES | No | Set ke `production` |
| `FRONTEND_URL` | ✅ YES | No | URL frontend Vercel (untuk CORS) |
| `APPWRITE_ENDPOINT` | ✅ YES | No | `https://sgp.cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | ✅ YES | No | Project ID dari Appwrite Console |
| `APPWRITE_API_KEY` | ✅ YES | 🔴 **SECRET** | Server API key — jangan pernah expose ke frontend |
| `APPWRITE_DATABASE_ID` | ✅ YES | No | Database ID |
| `APPWRITE_PRODUCTS_TABLE_ID` | ✅ YES | No | Collection ID `products` |
| `APPWRITE_CATEGORIES_TABLE_ID` | ✅ YES | No | Collection ID `categories` |
| `APPWRITE_INVENTORY_TABLE_ID` | ✅ YES | No | Collection ID `inventory` |
| `APPWRITE_INVENTORY_TRANSACTIONS_TABLE_ID` | ✅ YES | No | Collection ID `inventory_transactions` |
| `APPWRITE_HOMEPAGE_CONTENT_TABLE_ID` | ✅ YES | No | Collection ID `homepage_content` |
| `APPWRITE_ABOUT_CONTENT_TABLE_ID` | ✅ YES | No | Collection ID `about_content` |
| `APPWRITE_PRODUCT_IMAGES_BUCKET_ID` | ✅ YES | No | Storage bucket untuk gambar produk |
| `APPWRITE_HOMEPAGE_ASSETS_BUCKET_ID` | ✅ YES | No | Storage bucket untuk aset homepage CMS |
| `ADMIN_EMAIL` | ✅ YES | No | Email admin Appwrite |
| `ADMIN_PASSWORD` | ❌ Dev only | No | Hanya dev fallback — tidak diperlukan di production |
| `COOKIE_SAMESITE` | Optional | No | Default: `none` di production |
| `COOKIE_SECURE` | Optional | No | Default: `true` di production |

---

## C. Variabel yang TIDAK digunakan di project ini

Project LILLO tidak menggunakan sistem Color/Variant/Size.
Variabel berikut **tidak ada di source code** dan tidak perlu diisi:

- ~~`APPWRITE_COLORS_TABLE_ID`~~
- ~~`APPWRITE_PRODUCT_VARIANTS_TABLE_ID`~~
- ~~`NEXT_PUBLIC_WHATSAPP_NUMBER`~~ (nama yang benar: `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER`)

---

## D. Vercel Dashboard Setup

### Arsitektur Services

```
Vercel Project: lillo-key-accessories
├── Service: frontend  (root: frontend/, framework: nextjs)
└── Service: backend   (root: backend/, framework: express)
```

---

### LANGKAH 1 — Frontend Service Variables

Buka:
```
Vercel Dashboard → Project → Settings → Environment Variables
→ (pilih Service: frontend)
```

Tambahkan variable berikut dengan **Environment: Production** ✅

| Variable | Contoh Nilai |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://lillo-key-accessories-backend.vercel.app` |
| `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` | `628xxxxxxxxxx` |

> **⚠️ Penting:** `NEXT_PUBLIC_API_URL` di production harus diisi dengan
> **URL backend service Vercel Anda** (bukan `localhost`).
> URL ini baru tersedia setelah backend service pertama kali di-deploy.

---

### LANGKAH 2 — Backend Service Variables

Buka:
```
Vercel Dashboard → Project → Settings → Environment Variables
→ (pilih Service: backend)
```

Tambahkan variable berikut dengan **Environment: Production** ✅

| Variable | Nilai |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://lillo-key-accessories.vercel.app` (URL frontend Anda) |
| `APPWRITE_ENDPOINT` | `https://sgp.cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | *(dari Appwrite Console)* |
| `APPWRITE_API_KEY` | *(dari Appwrite Console — centang "Secret")* |
| `APPWRITE_DATABASE_ID` | *(dari Appwrite Console)* |
| `APPWRITE_PRODUCTS_TABLE_ID` | *(Collection ID)* |
| `APPWRITE_CATEGORIES_TABLE_ID` | *(Collection ID)* |
| `APPWRITE_INVENTORY_TABLE_ID` | *(Collection ID)* |
| `APPWRITE_INVENTORY_TRANSACTIONS_TABLE_ID` | *(Collection ID)* |
| `APPWRITE_HOMEPAGE_CONTENT_TABLE_ID` | *(Collection ID)* |
| `APPWRITE_ABOUT_CONTENT_TABLE_ID` | *(Collection ID)* |
| `APPWRITE_PRODUCT_IMAGES_BUCKET_ID` | *(Bucket ID)* |
| `APPWRITE_HOMEPAGE_ASSETS_BUCKET_ID` | *(Bucket ID)* |
| `ADMIN_EMAIL` | Email admin Appwrite Anda |

> **🔴 `APPWRITE_API_KEY`** — wajib dicentang **"Secret"** di Vercel Dashboard
> agar nilainya tidak pernah tampil di logs atau UI.

---

### LANGKAH 3 — Urutan Deploy

Karena `NEXT_PUBLIC_API_URL` di frontend harus berisi URL backend:

1. **Deploy backend** terlebih dahulu (tanpa set `FRONTEND_URL` dulu jika belum tahu URL frontend)
2. Catat URL backend yang dihasilkan Vercel
3. Set `NEXT_PUBLIC_API_URL` di frontend = URL backend tersebut
4. Set `FRONTEND_URL` di backend = URL frontend Vercel
5. **Re-deploy** kedua service

---

### LANGKAH 4 — Verifikasi Setelah Deploy

Akses endpoint berikut untuk memverifikasi:

```
GET https://your-backend.vercel.app/api/health
→ { "success": true, "message": "LILLO API is running" }

GET https://your-frontend.vercel.app
→ Homepage LILLO tampil normal
```

---

## E. Security Checklist

| Item | Status |
|---|---|
| `APPWRITE_API_KEY` di frontend | ❌ Tidak ada |
| `NEXT_PUBLIC_APPWRITE_*` | ❌ Tidak ada |
| Hard-coded secret di source code | ❌ Tidak ada |
| Hard-coded production URL | ❌ Tidak ada |
| `.env` di git repository | ❌ Terlindungi oleh `.gitignore` |
| `.env.local` di git repository | ❌ Terlindungi oleh `.gitignore` |

---

## F. Development Setup (Lokal)

```bash
# 1. Backend
cd backend
cp .env.example .env
# Edit .env dan isi semua nilai Appwrite
npm install
npm run dev
# → http://localhost:4000

# 2. Frontend (terminal terpisah)
cd frontend
cp .env.example .env.local
# .env.local sudah berisi NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
# → http://localhost:3000
```
