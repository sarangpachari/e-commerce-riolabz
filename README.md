# E-commerce REST API

REST API for a basic e-commerce application, built with Node.js, Express, MongoDB/Mongoose, and JWT authentication.

## Setup

1. Install Node.js 18+ and start MongoDB locally (or use MongoDB Atlas).
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a strong `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm run dev`.

The API is available at `http://localhost:5000/api/v1`. Check it with `GET /health`.

### Docker

With `.env` configured, run `docker compose up --build`. The API is exposed at `http://localhost:5000`.

### Demo data

Run `npm run seed` to create the multi-level Electronics hierarchy, five products, a delivered sample order, and these demo accounts:

- Admin: `admin@ecommerce.test` / `Admin@123`
- Customer: `customer@ecommerce.test` / `Customer@123`

## Initial admin user

Registrations always create a `customer`, which prevents public privilege escalation. After registering your own account, promote it once in MongoDB Compass or mongosh:

```js
use ecommerce_api
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

Log in again after promoting it so the new JWT carries the `admin` role.

## API overview

Send JWTs as `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users (admin) | `GET /users`, `PATCH /users/:id/status` |
| Categories | `GET /categories`, `GET /categories/tree`; admin: `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` |
| Products | `GET /products`; admin: `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` |
| Orders | authenticated: `POST /orders`, `GET /orders`; admin: `PATCH /orders/:id/status` |

The OpenAPI specification is available at [`docs/openapi.yaml`](docs/openapi.yaml). The ready-to-import [Postman collection](docs/E-Commerce-Riolabz.postman_collection.json) covers every endpoint.

### Product listing parameters

`search`, `category`, `minPrice`, `maxPrice`, `sort` (`newest`, `price_asc`, `price_desc`, `name`), `page`, and `limit` are supported. A category filter includes every descendant category at any depth.

### Sample payloads

Register:

```json
{ "name": "Asha", "email": "asha@example.com", "password": "secret123" }
```

Create category (admin):

```json
{ "name": "Android Phones", "parent": "<parent-category-id>" }
```

Create product (admin):

```json
{ "name": "Phone", "sku": "PHONE-001", "description": "Example", "price": 30000, "salePrice": 28000, "stock": 10, "category": "<category-id>", "status": "active" }
```

Place order:

```json
{ "items": [{ "product": "<product-id>", "quantity": 2 }] }
```

Order transitions are enforced: `pending → confirmed → processing → shipped → delivered`; an order may be cancelled before shipment and stock is restored on cancellation.

## Design notes

- Category documents use a self-referencing `parent` field. The tree endpoint builds a nested response; updates reject self-parenting and circular ancestry.
- Product list and category relation fields are indexed; SKU and sibling category names are unique.
- Passwords are hashed with bcrypt. Public registration cannot choose an account role.
- Order prices are snapshotted server-side and client-provided prices are ignored. Conditional stock decrements prevent overselling during concurrent checkouts; decrements are compensated if order creation fails.
- Error responses use appropriate 4xx/5xx codes and are handled centrally.
- API requests are rate limited globally and authentication endpoints have a stricter limit.
