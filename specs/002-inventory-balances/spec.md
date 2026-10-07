# Feature Specification: Single-Warehouse Inventory

**Created**: 2026-10-05  
**Status**: Implemented and verified on disposable PostgreSQL — see [validation](validation.md)

Language: **English** | [Tiếng Việt](vi/spec.vi.md)

## Goal and Scope

Complete the inventory portion of milestone M2. Product CRUD already describes what the business sells. This feature records how many units exist in one warehouse and why that quantity changes.

Affected layers: backend API, database, Swagger and Postman. Requests use the existing Gateway and authentication. Inventory is implemented; actual verification is recorded in [validation.md](validation.md). No frontend work is included.

Excluded: orders, reserve/commit/release, payments, multiple warehouses, transfers, supplier purchase orders, stocktake corrections, Redis stock counters, distributed locks and queues. Order reservations belong to M3.

## Clarifications

### Session 2026-10-05

- Q: How should a second request with the same Idempotency-Key and payload behave while the first request is still processing? → A: Return immediately with `409` and a distinct in-progress error code; allow retry with the same key later.
- Q: After a product name or SKU changes, should movement history use current product information or information from the time of the movement? → A: Use current product information linked by immutable productId; do not store name/SKU snapshots in movements.

## User Scenarios and Acceptance

### US1 — View stock (P1)

An admin can view stock for one product and a paginated stock list, including products with zero stock.

- Given an existing product with no movements, viewing stock returns zero.
- Given a nonexistent product, viewing stock returns `404`.
- Given a customer or an unauthenticated caller, access returns `403` or `401` respectively.

### US2 — Receive stock (P1)

An admin records physically received units and a reason.

- Given stock of zero, receiving 10 creates one receipt movement and leaves stock at 10.
- Given stock of 10, receiving 5 leaves stock at 15 and preserves both movements.
- Given an invalid quantity, nothing changes and the request returns `400`.

### US3 — Issue stock (P1)

An admin records units leaving the warehouse and a reason.

- Given stock of 10, issuing 3 creates one issue movement and leaves stock at 7.
- Given stock of 7, issuing 8 returns `409` with `INSUFFICIENT_STOCK`; neither stock nor movement history changes.
- Given stock of 7, issuing 7 succeeds and leaves zero.

### US4 — Review history (P2)

An admin can inspect a product's movement history in descending recording order.

- Each successful movement records its product, type, positive quantity, before/after balance, actor, reason and UTC timestamp.
- Definitely rejected actions and transactions with confirmed rollback do not create successful movements. A missing response or lost COMMIT acknowledgment is an uncertain outcome, not proof that the action failed; reconcile with the same idempotency key.
- History cannot be edited or deleted through this feature.

## Functional Requirements

- **FR-001**: Only authenticated admins can access inventory endpoints.
- **FR-002**: One logical warehouse is supported. Each product has one non-negative whole-unit balance, initially zero. Existing demo products also start at zero; product seeding does not imply physical stock.
- **FR-003**: Movement type is `RECEIPT` or `ISSUE`; quantity is an integer from 1 to 1,000,000. Resulting stock must not exceed 2,147,483,647 units. Invalid quantities return `400`; exceeding the balance ceiling returns `409` with `STOCK_LIMIT_EXCEEDED`.
- **FR-004**: Each movement requires a trimmed reason of 1–500 characters. Product, actor, before/after values and timestamps are determined by the server.
- **FR-005**: Balance updates and movement creation succeed or fail together. Storage failure must never leave only one of them persisted.
- **FR-006**: Concurrent receipts/issues preserve an accurate balance. Issues cannot make stock negative.
- **FR-007**: Movement history is append-only through the API. Starting from zero, receipts minus issues must equal the current balance.
- **FR-008**: Stock lists and history use `page=1`, `limit=20`, maximum limit 100, and return `{ items, page, limit, total }`. Stock lists use stable product-ID order; history uses `createdAt DESC, id DESC`.
- **FR-009**: Lists include active and inactive products with their status. Stock reads and history remain accessible after product deactivation.
- **FR-010**: Unknown input fields are rejected. ID, actor, timestamps and calculated balances cannot be supplied by clients.
- **FR-011**: A duplicate request with the same `Idempotency-Key` and payload while the original is still processing returns immediately with `409` and a distinct in-progress error code, without creating another movement. The caller may retry with the same key later; after completion, the existing replay policy applies. The exact error code is defined during plan.
- **FR-012**: Movements reference the product by immutable `productId` and do not store product name/SKU snapshots. Any product name/SKU shown in history reflects the current catalog values. Changing these values does not alter recorded movement facts or balances.

## API contract Contract

Prefix: `/api/v1/inventory`. Final technical contracts will be detailed during plan.

| Method/path | Purpose | Success |
|---|---|---|
| `GET /` | Paginated product stock list | `200` |
| `GET /:productId` | Current stock for one product | `200` |
| `POST /:productId/movements` | Record receipt or issue | `201` |
| `GET /:productId/movements` | Paginated movement history | `200` |

Example movement request:

```json
{ "type": "RECEIPT", "quantity": 10, "reason": "Opening stock received" }
```

Example successful response:

```json
{
  "movement": {
    "id": "movement-uuid",
    "productId": "product-uuid",
    "type": "RECEIPT",
    "quantity": 10,
    "balanceBefore": 0,
    "balanceAfter": 10,
    "actorId": "admin-uuid",
    "reason": "Opening stock received",
    "createdAt": "2026-10-05T08:00:00Z"
  },
  "inventory": { "productId": "product-uuid", "onHandQty": 10 }
}
```

Errors: `400` invalid input; `401` missing/invalid authentication; `403` insufficient role; `404` nonexistent product; `409` stock conflict. Unexpected persistence failure returns sanitized `500`; API lock/statement timeout after confirmed rollback returns `503 INVENTORY_BUSY`. A definite validation/business rejection or confirmed rollback leaves stock unchanged and adds no movement. If the response or COMMIT acknowledgment is lost, the entire transaction may have committed or rolled back; an error response alone does not establish which. Stock, movement and completed idempotency result must still persist together or not at all. Retry the same key/payload within retention to reconcile; do not switch keys or classify an uncertain outcome as a definite rejection. A Gateway timeout may surface as `502 UPSTREAM_UNAVAILABLE` and likewise does not establish the transaction outcome.

## Key Business Entities

- **Inventory balance**: Current physical whole-unit quantity for a product in the single warehouse.
- **Stock movement**: An immutable receipt/issue record explaining a balance change and who recorded it, linked to the product by immutable `productId`. Product name/SKU are not historical snapshots.

Table names, initialization strategy, SQL, transaction isolation and locking are plan decisions, not settled by this specification.

## Confirmed Business Decisions

- **Q1 — Inactive products:** Receipts and issues are allowed for inactive products. Deactivation controls catalog visibility, not physical stock management.
- **Q2 — Duplicate submission:** Writes require an `Idempotency-Key`. Repeating the same key/payload returns the original result without another movement; changed payload returns `409`. This protects against retries after a lost response. Key scope, retention and error replay policy will be specified in plan.

## Success Criteria and Verification

- **SC-001**: Receipt 10 → issue 3 → rejected issue 8 leaves balance 7 and exactly two successful movements.
- **SC-002**: With five units and ten concurrent requests each issuing one unit, exactly five succeed, five fail with insufficient stock, balance is zero, and exactly five issue movements exist.
- **SC-003**: A forced failure at movement INSERT awaited by the service, after balance modification on disposable PostgreSQL, leaves neither mutation committed. Capture confirmed rollback evidence separately from uncertain COMMIT outcomes.
- **SC-004**: Customers cannot read or modify inventory; invalid input cannot change stock.
- **SC-005**: API documentation and Postman cover successful and error flows. Historical feature checks are not evidence for this new feature.
- **SC-006**: While a movement request is still processing, a concurrent duplicate with the same key/payload returns an in-progress `409` without another movement. After the original succeeds, retrying the same key/payload returns the original result; exactly one movement exists.

Current instruction: no new automated test files. Actual manual API/PostgreSQL evidence, quality gates and automated-suite omission are recorded in [validation.md](validation.md).

## Next Spec Kit Step

Implementation complete. Next workflow step when requested: `$speckit-converge`.
