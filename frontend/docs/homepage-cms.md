# LILLO — Phase 12: Homepage CMS Documentation

## Overview
Phase 12 introduces a dynamic **Homepage Content Management System (CMS)** for LILLO. Admin users can edit all 6 primary sections of the public homepage directly from the Admin Dashboard (`/admin/homepage`), complete with image asset uploads powered by Appwrite Storage.

---

## Key Architecture & Data Flow

```text
[ Admin Dashboard (/admin/homepage) ]
                │
                ▼ (PATCH /api/homepage & POST /api/homepage/assets)
      [ Express REST API ]
                │
                ▼ (Appwrite SDK)
     [ Appwrite Services ]
      ├── Database (homepage_content collection / homepage_main doc)
      └── Storage (homepageAssets / productImages bucket)
                │
                ▼ (GET /api/homepage)
     [ Next.js Public Homepage ]
```

---

## Database & Fallback Strategy

1. **Static Fallback Guarantee (`DEFAULT_HOMEPAGE_CONTENT`)**:
   - If Appwrite Database is unpopulated, offline, or experiencing network errors, both the backend Express API and the Next.js frontend automatically fall back to `DEFAULT_HOMEPAGE_CONTENT`.
   - The public website **never renders blank** or broken UI.

2. **Appwrite Collection Config**:
   - Database ID: `lillo_db`
   - Collection ID: `homepage_content`
   - Document ID: `homepage_main`
   - Storage Bucket ID: `homepageAssets` (or `productImages`)

---

## API Reference

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/homepage` | `GET` | **Public** | Fetches active homepage content JSON object. Returns static fallback if empty. |
| `/api/homepage` | `PATCH` | **Admin Protected** | Updates homepage content JSON document in Appwrite Database. |
| `/api/homepage/assets` | `POST` | **Admin Protected** | Uploads section image asset to Appwrite Storage bucket and returns public URL `{ assetUrl }`. |

---

## Managed Sections

1. **Hero Section**: Badge text, Title Line 1, Title Highlight, Title Line 2, Subtitle, CTA primary & secondary button texts.
2. **Brand Statement**: Tagline, Main brand title, Description copy.
3. **Category Header**: Category section title & subtitle.
4. **Craftsmanship**: Section tagline, title, description, image asset upload, and list of bullet point highlights.
5. **Journal / Stories**: Section header copy and array of articles (title, date, read time, excerpt, link, image).
6. **CTA Banner**: Headline, subtitle, button text & target link.

---

## Security

- All write operations (`PATCH /api/homepage`, `POST /api/homepage/assets`) require valid Admin cookie sessions verified by Express authentication middleware (`authMiddleware`).
- Public users can only read content via `GET /api/homepage`.
