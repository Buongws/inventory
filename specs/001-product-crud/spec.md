# Feature Specification: Product CRUD

**Created**: 2026-09-30  
**Status**: Implemented and verified

Language: **English** | [Tiếng Việt](spec.vi.md)

## Start Here

This is the only active feature specification. Product catalog CRUD is complete. The database currently contains 200 active demo products with SKUs `DEMO-0001` through `DEMO-0200`.

Start the three applications from the repository root:

```sh
npm run dev
```

Local ports are API `3001`, frontend `3002`, and Gateway `3004`. Call product APIs through `http://localhost:3004/api/v1/products`. Swagger is served by the API at `http://localhost:3001/docs`.

To recreate or extend the demo catalog:

```sh
npm --prefix apps/api run seed:products
npm --prefix apps/api run seed:products -- --count=500
```

The next business feature should be **inventory stock and stock movements**. Do not treat the current product rows as stock quantities: the project does not have warehouse balances, receipts, or issues yet.

## Repository Scope

Provide a product catalog through the existing authenticated API and Gateway. This feature affects the API, PostgreSQL migration, Swagger, and Postman. Inventory balances, stock movements, orders, Redis product caching, image upload, and a product UI are outside this feature.

## User Scenarios & Acceptance

### P1 — Customer browses active products

An authenticated customer can list and inspect active products. Inactive products never appear in customer results and return `404` by ID. List pagination, search, and ordering are predictable.

### P1 — Admin manages the catalog

An authenticated admin can create, view, update, deactivate, and reactivate products. Deactivation preserves the record and SKU. Repeated deactivation succeeds. Customers cannot write.

### P2 — Invalid and conflicting input is rejected

The API rejects invalid SKU, price, URL, pagination, empty PATCH, unknown fields, and duplicate SKU with the documented error status. Simultaneous creates with the same normalized SKU cannot both succeed.

## Functional Requirements

- **FR-001**: All `/api/v1/products` endpoints require a valid Bearer token. Reads allow customer/admin; writes allow admin only.
- **FR-002**: Products expose `id`, normalized unique `sku`, `name`, optional `description`, non-negative string `priceVnd`, `status`, optional `imageUrl`, and UTC timestamps as specified in the source document.
- **FR-003**: List supports `page`, `limit`, `search`, and admin-only `status`, returning `{ items, page, limit, total }` ordered by `createdAt DESC, id DESC`.
- **FR-004**: Detail/create/update return `{ product }`. Create returns `201`; repeated soft delete returns `204`.
- **FR-005**: Customer reads exclude inactive products. Admins can reactivate them by updating status.
- **FR-006**: Invalid input returns `400`, missing/invalid auth `401`, insufficient permission `403`, absent or hidden product `404`, and duplicate SKU `409`.
- **FR-007**: Search treats `%` and `_` as literal characters and does not interpolate user input into SQL.

## Success Criteria

- An admin can complete create → update → deactivate → reactivate through the documented API.
- A customer can browse active products but cannot read inactive products or perform writes.
- Two concurrent creates using equivalent SKUs yield one success and one conflict.
- A large valid `priceVnd` round-trips exactly as a string.
- The Postman collection contains each product request and Swagger describes its contract.

## Assumptions

- No product UI is required yet; the API is exercised through Postman and Swagger.
- Existing auth and Gateway behavior stay in place.
- Following the current no-new-tests instruction, verification uses manual API/DB checks, lint, typecheck, and build; no test files are added in this feature.

## Implemented Files

- `apps/api/src/products/`: entity, DTOs, controller, service, and module.
- `apps/api/src/database/migrations/1790730000000-CreateProducts.ts`: product table and indexes.
- `apps/api/src/database/seeds/seed-products.ts`: repeatable demo-product seed command.
- `apps/api/postman/inventory.postman_collection.json`: authenticated product requests.

## Verification Result

- Migration, repository checks, and all application builds passed on 2026-09-30.
- Admin/customer authorization, soft delete, reactivation, validation, literal search, pagination, large VND prices, and concurrent duplicate SKU behavior were verified through Gateway.
- The seed command inserted 200 rows on its first run and skipped all 200 on its second run.
