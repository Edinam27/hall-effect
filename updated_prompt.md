# GameZone Pro — Updated Application Prompt (Functions, Tools, Schemas)

## Overview
- Build a premium gaming controller e‑commerce store with advanced SEO optimization.
- Deliver a visually stunning, conversion‑optimized experience with modern UI/UX.
- Support Paystack payments with a clear buyer redirect to the Paystack authorization page.
- Include AI‑enhanced copywriting, tasteful animations (Lottie/WebGL optional), and upselling mechanisms.
- Provide a robust, testable Node.js/Express backend and static frontend.

## Non‑Goals
- Do not implement cryptocurrency payments.
- Do not store credit card data directly (use Paystack exclusively).
- Avoid server‑side rendering unless explicitly requested; static frontend with API backend is sufficient.

---

## Architecture
- Frontend: Static HTML/CSS/JS files:
  - `index.html`, `controllers.html`, `checkout.html`, `payment-success.html`, `admin.html`, `admin-login.html`, `mobile.html`, etc.
  - Core scripts: `script.js` (storefront logic), `js/checkout.js`, `js/payment.js`, `js/admin.js`, `js/auth.js`.
- Backend: Node.js + Express
  - Routes: `routes/*` for payments, orders, admin, auth, inventory.
  - Services: `services/*` encapsulate domain logic (orders, inventory, email, auth, user profile).
  - Config: `config/database.js` to initialize and interact with DB or a mock fallback.
- Database: Local SQLite or mock/in‑memory store based on environment.
  - Production uses a real DB; development may skip initialization via `SKIP_DB_INIT=true`.
- Payments: Paystack REST APIs through `api/paystack-api.js` with secure server‑side initialization and verification.
- Email: Transactional emails using HTML templates (`templates/emails/*`).
- SEO: `sitemap.xml`, `robots.txt`, structured data on key pages.

---

## Frontend UX
- Storefront Pages:
  - `index.html`: Hero, featured controllers, value props, trust badges, CTA.
  - `controllers.html`: Product catalog, filters (platform, price, brand), quick view.
  - `checkout.html`: Simplified checkout form, cart summary, shipping and tax calculation, payment initiation.
  - `payment-success.html`: Confirmation summary, order number, email confirmation note, next steps.
  - `admin.html`: Admin dashboard (orders, customers, metrics), role‑gated.
  - `admin-login.html`: Admin sign‑in.
- Design principles:
  - Fast, mobile‑first, accessible (WCAG AA), clear hierarchy, high‑contrast.
  - Tasteful 3D/Lottie animations for product highlights only if budget allows.
  - Conversion patterns: clear CTAs, social proof, scarcity cues, bundles, cross‑sells.
- Upselling:
  - Bundled offers (controller + accessories), recommended add‑ons, limited‑time banners.
- AI copywriting:
  - Dynamic taglines and benefit statements; ensure human‑reviewed content for brand tone.

---

## Payment Flow (Paystack)
- Goal: Redirect the buyer to Paystack authorization page immediately after successful initialization.
- Public key fetch:
  - `GET /api/paystack/config` → `{ publicKey: string }` for frontend Paystack script setup.
- Order creation:
  - Frontend assembles order payload and POSTs to Orders API; receives `order.id`.
- Payment initialization:
  - `POST /api/payment/initialize/:orderId`
  - Server creates a Paystack transaction and returns the authorization URL.
  - Response contract:
    ```json
    {
      "paymentUrl": "https://paystack.com/pay/abc...",  // Preferred
      "authorization_url": "https://paystack.com/pay/abc...",  // Alternative
      "reference": "PS_ref_12345",
      "orderId": "ORD_123",
      "amount": 4999,   // Minor units (e.g., kobo)
      "currency": "NGN"
    }
    ```
- Client redirect logic:
  - Frontend checks `paymentUrl`, then `data.authorization_url`, then `authorization_url`.
  - On success, set `window.location.href` to the authorization URL.
- Payment verification:
  - `POST /api/paystack/verify/:reference` → verifies payment and updates order status.
  - On `success`, clear cart, store last order metadata, and route to `payment-success.html`.
- Demo mode:
  - Frontend only uses demo mode when `isStaticServer=true` (e.g., `file:`, `*.github.io`, `*.netlify.app`, `*.vercel.app`). Localhost should use APIs.

---

## API Endpoints

### Health
- `GET /health`
  - Response: `{ status: "ok", uptime: number, env: string }`

### Paystack
- `GET /api/paystack/config`
  - Response: `{ publicKey: string }`
- `POST /api/paystack/initialize`
  - Admin/utility: initialize generic payment (used in admin flows).
  - Body: `{ email: string, amount: number, currency?: string }`
  - Response: `{ authorization_url: string, reference: string, ... }`
- `POST /api/payment/initialize/:orderId`
  - Body: `{ email: string, customerId?: string }`
  - Response: `{ paymentUrl?: string, authorization_url?: string, reference: string, orderId: string, amount: number, currency: string }`
- `POST /api/paystack/verify/:reference`
  - Body: `{ orderId?: string, customerId?: string }`
  - Response: `{ success: boolean, orderId: string, orderNumber: string, status: string, message?: string }`
- `POST /webhooks/paystack`
  - Paystack webhook receiver; validates signature and updates orders.

### Orders
- `GET /api/orders`
  - Query: optional filters (`status`, `customerEmail`).
  - Response: `{ orders: Order[] }`
- `POST /api/orders`
  - Body: `OrderCreateRequest`
  - Response: `Order`
- `GET /api/orders/:id`
  - Response: `Order`
- `PUT /api/orders/:id/status`
  - Body: `{ status: OrderStatus }`
  - Response: `{ success: boolean }`

### Inventory
- `GET /api/inventory`
  - Response: `{ items: Product[] }`
- `GET /api/inventory/:id`
  - Response: `Product`

### Admin
- `GET /api/admin/dashboard`
  - Metrics: total orders, revenue, recent orders, top customers.
- `GET /api/admin/orders`
  - Response: `{ orders: Order[] }`
- `POST /api/admin/payments/initialize`
  - Response: `{ success: boolean, data: { authorization_url: string, reference: string } }`
- `GET /api/admin/customers`
  - Response: `{ customers: CustomerSummary[] }`

### Auth (optional)
- `POST /api/auth/login` (local admin login)
- `GET /api/auth/google/callback` (if Google OAuth configured)
- User entity may include `google_id` if Google auth enabled.

---

## Data Schemas

### Product
```json
{
  "id": "string",
  "name": "string",
  "brand": "string",
  "platforms": ["PC", "Xbox", "PlayStation", "Switch"],
  "price": 99.99,
  "currency": "USD",
  "images": ["/images/..."],
  "sku": "string",
  "description": "string",
  "attributes": { "color": "black", "wireless": true },
  "stock": 100
}
```

### Order
```json
{
  "id": "string",
  "orderNumber": "string",
  "customer": {
    "email": "string",
    "fullName": "string",
    "phone": "string",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string"
    }
  },
  "items": [{
    "id": "string",
    "name": "string",
    "sku": "string",
    "quantity": 1,
    "unitPrice": 99.99,
    "currency": "USD",
    "aliExpressProductId": "string",
    "aliExpressVariantId": "string"
  }],
  "subtotal": 199.98,
  "shipping": 9.99,
  "tax": 0,
  "total": 209.97,
  "currency": "USD",
  "status": "pending",  // pending | processing | completed | canceled
  "paystack": {
    "reference": "string",
    "authorization_url": "string"
  },
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Payment Initialization Response
```json
{
  "paymentUrl": "string",
  "authorization_url": "string",
  "reference": "string",
  "orderId": "string",
  "amount": 4999,
  "currency": "NGN"
}
```

### CustomerSummary (Admin)
```json
{
  "email": "string",
  "fullName": "string",
  "phone": "string",
  "totalOrders": 12,
  "totalSpent": 1249.50,
  "lastOrderDate": "ISO-8601",
  "orders": [{ "id": "string", "orderNumber": "string", "status": "string", "total": 209.97, "createdAt": "ISO-8601" }]
}
```

---

## Integrations & Tools
- Paystack:
  - Secret server‑side calls for transaction initialization and verification.
  - Webhook handler: `POST /webhooks/paystack` validates signature and updates order status.
- Email service:
  - Confirmation, shipping, delivery emails using templates in `templates/emails/*`.
- Geolocation & Currency:
  - `script.js` uses `ipapi.co` to infer user currency with fallback to USD.
- Optional: Google Maps MCP for location data; Google OAuth for admin sign‑in.
- Analytics (optional): lightweight pageview and checkout funnel tracking.

---

## Environment Variables
- `PAYSTACK_PUBLIC_KEY`: Public key for frontend config.
- `PAYSTACK_SECRET_KEY`: Secret key for server Paystack API calls.
- `DATABASE_URL`: Connection string (optional; defaults to local SQLite or mock).
- `NODE_ENV`: `development` | `production` | `test`.
- `PORT`: Server port (e.g., 8000, 8080, 5500).
- `SKIP_DB_INIT`: `true` to bypass DB initialization locally.
- `ADMIN_EMAILS`: Comma‑separated admin emails (optional).

Example `.env`:
```
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
NODE_ENV=development
PORT=8000
SKIP_DB_INIT=false
```

---

## Error Handling & Logging
- Standard error envelope:
  ```json
  { "status": "error", "message": "Human readable message" }
  ```
- Log server errors with stack traces in development; suppress internals in production.
- Validate inputs on server routes; return 4xx for client errors, 5xx for server errors.

---

## Security
- Never expose `PAYSTACK_SECRET_KEY` to the frontend.
- Input validation and sanitization across all endpoints.
- Rate limiting for sensitive routes (auth, payment initialize).
- CORS configured for site origin only.

---

## SEO Strategy
- Technical:
  - `sitemap.xml`, `robots.txt`, clean URLs, fast TTI.
  - Meta tags for titles, descriptions, Open Graph, Twitter Cards.
  - JSON‑LD Product structured data on product and catalog pages.
- Content:
  - Benefit‑led copy, unique product descriptions, FAQs.
- Performance:
  - Image optimization (WebP), lazy loading, preconnect to critical origins.

---

## Deployment
- Server binds to `0.0.0.0` on `PORT`.
- Health check: `GET /health`.
- Render/Heroku compatible; ensure environment variables provided.

---

## Testing
- Scripts:
  - `scripts/test-payment-init.js`: Calls `POST /api/payment/initialize/:orderId` and asserts `authorization_url/paymentUrl` presence.
  - `scripts/test-paystack-merchant.js`: Validates merchant profile fetch.
  - `scripts/test-paystack-direct.js`: Direct initialize test with sample payload.
  - `scripts/test-paystack-currencies.js`: Currency support checks.
  - `test-all-apis.js`: Broad sanity checks on health, orders, admin, and payments.
- Approach:
  - Start local server with valid Paystack keys or use demo mode for non‑payment flows.
  - Verify redirect logic in `js/payment.js` respects the `authorization_url` precedence.

---

## Success Criteria
- Buyers are redirected to Paystack authorization URL after `POST /api/payment/initialize/:orderId`.
- Orders persist and transition from `pending` → `completed` after verification.
- Admin dashboard shows live metrics and order/customer lists.
- SEO assets present and validated (sitemap, robots, structured data).
- App starts locally with `SKIP_DB_INIT=true` when needed; production uses full DB.

---

## Implementation Notes
- Frontend `js/payment.js` must:
  - Detect static hosting accurately; do not treat localhost as static.
  - Always attempt server payment initialization; on success, redirect using returned URL.
  - Fail fast if no authorization URL is present.
- Backend routes must:
  - Normalize Paystack init responses to include `paymentUrl` for consistency.
  - Provide detailed error messages to aid debugging without leaking secrets.
- Database:
  - Initialize required tables for `orders`, `users` (if auth), and indices.
  - In tests or when `SKIP_DB_INIT=true`, use mock or in‑memory structures safely.

---

## Glossary
- Authorization URL: Paystack URL that the buyer is redirected to for payment.
- Reference: Unique Paystack transaction identifier used for verification.
- Minor units: Currency denominations like kobo for NGN.

---

## Command Cheatsheet
- Start locally:
  - Windows PowerShell: ``$env:SKIP_DB_INIT="true"; $env:PORT="5500"; npm start``
- Run tests:
  - ``node scripts/test-payment-init.js``
  - ``node test-all-apis.js``