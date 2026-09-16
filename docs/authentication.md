# LILLO Admin Authentication & Security Documentation

This document explains the architecture, setup instructions, security controls, and API permission matrix for **LILLO Admin Authentication**.

---

## 1. Overview & Architecture

LILLO uses **Appwrite Authentication** as its primary identity provider. Admin authentication is strictly decoupled from public customer browsing:

```
Next.js Frontend (/admin/*)
        │
        ▼ (POST /api/auth/login with credentials: 'include')
Express Backend REST API
        │
        ▼ (Appwrite Account & Users SDK)
Appwrite Authentication Provider
        │
        ▼ (Verify user.labels includes 'admin')
Return HttpOnly Cookie (lillo_session)
```

- **Sessions**: Stored in an `HttpOnly`, `SameSite=Lax` cookie (`lillo_session`). Passwords are **never** stored in local databases or source code.
- **Admin Role Enforcement**: Express backend verifies that the authenticated user possesses the `admin` label in Appwrite before granting access to mutation routes.
- **Public Website Integrity**: All public product, category, cart, and checkout features operate without requiring authentication.

---

## 2. Appwrite Admin User Setup Guide

To create an Admin user in Appwrite for production or staging environments:

1. Log into your **Appwrite Console** (`https://cloud.appwrite.io` or self-hosted instance).
2. Select your project (**LILLO Main**).
3. In the left navigation, navigate to **Auth** -> **Users**.
4. Click **Create User**.
5. Enter the Admin credentials:
   - **Name**: `LILLO Administrator`
   - **Email**: `admin@lillo.com` (or your designated admin email)
   - **Password**: Set a strong password (minimum 8 characters).
6. Click on the newly created user to view user details.
7. Scroll down to **Labels** and add the label: `admin`.
8. Save changes.

---

## 3. Environment Variables

### Backend (`backend/.env`)

```env
PORT=4000
FRONTEND_URL=http://localhost:3000

# Appwrite Integration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_server_api_key
APPWRITE_DATABASE_ID=lillo_main_db

# Admin Fallback Configuration (Dev Mode)
ADMIN_EMAIL=admin@lillo.com
ADMIN_PASSWORD=<your-strong-password>
```

> **Security Note**: Never expose `APPWRITE_API_KEY` or `ADMIN_PASSWORD` to the frontend or commit `.env` files.

---

## 4. API Endpoints & Protection Matrix

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate admin & receive `HttpOnly` session cookie |
| `POST` | `/api/auth/logout` | Public / Auth | Revoke session & clear `lillo_session` cookie |
| `GET` | `/api/auth/me` | Public | Check current authentication status (`authenticated: true/false`) |
| `GET` | `/api/products` | **Public** | List catalog products |
| `GET` | `/api/products/:id` | **Public** | Fetch single product detail |
| `POST` | `/api/products` | **Admin Only** | Create product (Requires `authMiddleware` + `adminMiddleware`) |
| `PUT` | `/api/products/:id` | **Admin Only** | Update product (Requires `authMiddleware` + `adminMiddleware`) |
| `DELETE` | `/api/products/:id` | **Admin Only** | Delete product (Requires `authMiddleware` + `adminMiddleware`) |
| `POST` | `/api/products/upload` | **Admin Only** | Upload image to Appwrite Storage (Requires `authMiddleware` + `adminMiddleware`) |
| `GET` | `/api/categories` | **Public** | List categories |
| `GET` | `/api/categories/:id` | **Public** | Fetch single category |
| `POST` | `/api/categories` | **Admin Only** | Create category (Requires `authMiddleware` + `adminMiddleware`) |
| `PUT` | `/api/categories/:id` | **Admin Only** | Update category (Requires `authMiddleware` + `adminMiddleware`) |
| `DELETE` | `/api/categories/:id` | **Admin Only** | Delete category (Requires `authMiddleware` + `adminMiddleware`) |

---

## 5. Security Controls & Protections

1. **Brute-Force Rate Limiting**: The `POST /api/auth/login` endpoint limits failed login attempts to a maximum of 5 per 15-minute window per IP address. Exceeding limits returns HTTP `429 Too Many Requests`.
2. **Error Sanitization**: Authentication failures return clean, uniform error messages (`Email atau password salah.`) to prevent account enumeration and obscure internal stack traces.
3. **Cookie Security**: Cookies are flagged `HttpOnly`, `SameSite=Lax`, and `Secure` in production environments to mitigate XSS and CSRF vectors.
4. **Token Revocation**: Calling `POST /api/auth/logout` explicitly revokes the session on both server and client side. Re-using old session tokens returns HTTP `401 Unauthorized`.
