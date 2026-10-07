# Product Catalog Specification

## Scope

The product module manages catalog data only. Inventory, warehouse movements, categories, and image uploads are separate features.

## Product data

| Field | Rules |
|---|---|
| `id` | Server-generated UUID. |
| `sku` | Required, trimmed, uppercase, 1–64 characters, `[A-Z0-9_-]`, unique even when inactive. |
| `name` | Required, trimmed, 1–200 characters. |
| `description` | Optional, up to 5,000 characters; `null` clears it. |
| `priceVnd` | Non-negative integer; PostgreSQL `bigint`, API string of digits. |
| `status` | `ACTIVE` or `INACTIVE`; defaults to `ACTIVE`. |
| `imageUrl` | Optional HTTP/HTTPS URL, up to 2,048 characters; `null` clears it. |
| timestamps | Server-managed UTC ISO 8601 values stored as `timestamptz`. |

## API

All routes use `/api/v1/products` and require a Bearer token. Customers can read active products. Admins can read all products and perform writes.

- `GET /`: paginated list (`page=1`, `limit=20`, maximum 100), optional case-insensitive search over name/SKU, and admin-only `status` filter.
- `GET /:id`: details; inactive products return `404` to customers.
- `POST /`: admin creates a product and receives `201` with `{ product }`.
- `PATCH /:id`: admin updates supplied fields; an empty payload is invalid and ID/timestamps cannot change.
- `DELETE /:id`: admin soft-deletes by setting `INACTIVE`; repeated deletes return `204`.

List ordering is fixed: `createdAt DESC, id DESC`. SKU conflicts return `409`; validation, auth, permission, and missing records return `400`, `401`, `403`, and `404` respectively. Search parameters must escape `%` and `_`.
