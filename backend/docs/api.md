# LILLO Backend — REST API Documentation (Phase 4)

Base URL (local): `http://localhost:4000`

All responses are JSON with the envelope:

```json
{ "success": true, "data": {} }
```

Errors:

```json
{ "success": false, "message": "Error message" }
```

> Phase 4 public API is **read-only** (`GET`). Mutation routes
> (`POST/PUT/DELETE`) exist but require admin session cookie.

---

## Health

### GET /api/health

```json
{ "success": true, "message": "LILLO API is running" }
```

### GET /api/health/appwrite

Real connectivity ping against the configured Appwrite database.

Success (`200`):

```json
{ "success": true, "message": "Appwrite connection is healthy" }
```

Not configured / unreachable (`503`):

```json
{ "success": false, "message": "Appwrite connection failed" }
```

---

## Products

### GET /api/products

```json
{
  "success": true,
  "data": [
    {
      "$id": "prod_001",
      "name": "Drishti Bomma",
      "slug": "drishti-bomma",
      "description": "...",
      "price": 28,
      "categoryId": "luck",
      "images": ["/assets/drishti.webp"],
      "isFeatured": true,
      "inStock": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### GET /api/products/:id

Success (`200`): `{ "success": true, "data": { ...product } }`

Not found (`404`):

```json
{ "success": false, "message": "Product not found" }
```

---

## Categories

### GET /api/categories

```json
{
  "success": true,
  "data": [
    { "$id": "luck", "name": "Luck", "slug": "luck", "description": "..." }
  ]
}
```

### GET /api/categories/:id

Not found (`404`):

```json
{ "success": false, "message": "Category not found" }
```

---

## Colors

### GET /api/colors
### GET /api/colors/:id

```json
{ "success": true, "data": [{ "$id": "...", "name": "Coral", "hex": "#E06A58" }] }
```

Not found (`404`): `{ "success": false, "message": "Color not found" }`

---

## Product Variants

### GET /api/product-variants

### GET /api/product-variants?productId=PRODUCT_ID

Filter variants by parent product.

```json
{
  "success": true,
  "data": [
    {
      "$id": "...",
      "productId": "prod_001",
      "colorId": "...",
      "sku": "...",
      "stock": 12,
      "price": 28
    }
  ]
}
```

### GET /api/product-variants/:id

Not found (`404`):

```json
{ "success": false, "message": "Product variant not found" }
```

---

## Notes

- CORS allows `http://localhost:3000` (see `FRONTEND_URL` in `backend/.env`).
- No secret (API key, credentials, stack trace) is ever included in responses.
- Unknown routes return `404 { "success": false, "message": "Resource not found - ..." }`.
