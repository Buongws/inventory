# Data Model: Single-Warehouse Inventory

Language: **English** | [Tiếng Việt](vi/data-model.vi.md)

Status: implemented schema, applied and verified on disposable databases; see [validation](validation.md). All TypeScript properties explicitly map to the snake_case columns below. New timestamps are `timestamptz`; new IDs use `gen_random_uuid()`.

## Inventory balance — `inventory_balances`

| Column / property | Type | Rules |
|---|---|---|
| `product_id` / productId | uuid | Primary key; FK `products.id`, ON DELETE RESTRICT |
| `on_hand_qty` / onHandQty | integer | NOT NULL DEFAULT 0; check 0–2,147,483,647 |
| `updated_at` / updatedAt | timestamptz | NOT NULL; server wall-clock time |

One product has zero or one physical balance row, representing exactly one logical balance. Missing row means zero. Reads use products LEFT JOIN balances and COALESCE to zero; they never initialize rows. The primary key supports joins and per-product locking; no secondary index is required.

## Stock movement — `stock_movements`

| Column / property | Type | Rules |
|---|---|---|
| `id` / id | uuid | Primary key, generated server-side |
| `product_id` / productId | uuid | NOT NULL; FK `products.id`, ON DELETE RESTRICT |
| `type` / type | varchar(7) | NOT NULL; check RECEIPT or ISSUE |
| `quantity` / quantity | integer | NOT NULL; check 1–1,000,000 |
| `balance_before` / balanceBefore | integer | NOT NULL; check non-negative |
| `balance_after` / balanceAfter | integer | NOT NULL; check non-negative |
| `actor_id` / actorId | uuid | NOT NULL; FK `users.id`, ON DELETE RESTRICT |
| `reason` / reason | varchar(500) | NOT NULL; trimmed API string, 1–500 Unicode code points |
| `created_at` / createdAt | timestamptz | NOT NULL; assigned after balance lock |

Named checks enforce type, quantity, non-negative balances, `char_length(reason) BETWEEN 1 AND 500`, `reason = btrim(reason)`, and nonempty `btrim(reason)`. API JavaScript trim handles Unicode whitespace before validation. Movement equation, evaluated with bigint casts: RECEIPT → after = before + quantity; ISSUE → after = before − quantity. The integer type also enforces the stock ceiling. Suggested names: `ck_stock_movements_type`, `ck_stock_movements_quantity`, `ck_stock_movements_balances`, `ck_stock_movements_reason`, `ck_stock_movements_delta`.

Indexes: `idx_stock_movements_product_created_id (product_id, created_at DESC, id DESC)` for history/latest timestamp; `idx_stock_movements_actor (actor_id)` for FK maintenance. No name/SKU or actor-name snapshot fields. Movement facts have no update/delete endpoints; constraints alone do not prohibit privileged direct SQL updates. Do not claim database-wide immutable auditing.

The ledger equality across rows is an application transaction invariant, not a per-row CHECK: `COALESCE(balance,0) = SUM(receipts − issues)` using bigint. No trigger or derived Redis counter is introduced.

## Completed request outcome — `inventory_idempotency_results`

| Column / property | Type | Rules |
|---|---|---|
| `id` / id | uuid | Primary key, generated server-side |
| `actor_id` / actorId | uuid | NOT NULL; FK `users.id`, ON DELETE RESTRICT |
| `operation` / operation | varchar(32) | NOT NULL; check `inventory.movement.v1` |
| `key` / key | varchar(128), COLLATE C | NOT NULL; case-sensitive ASCII key |
| `request_product_id` / requestProductId | uuid | NOT NULL; intentionally no product FK so nonexistent-product 404 can replay |
| `request_hash` / requestHash | char(64) | NOT NULL; lowercase SHA-256 hex check |
| `http_status` / httpStatus | smallint | NOT NULL; check 201, 404 or 409 |
| `response_body` / responseBody | jsonb | NOT NULL; check JSON object; contains no token/cookie |
| `movement_id` / movementId | uuid, nullable | FK `stock_movements.id`, ON DELETE RESTRICT; unique when non-null |
| `completed_at` / completedAt | timestamptz | NOT NULL; DB wall-clock time when outcome is prepared |
| `expires_at` / expiresAt | timestamptz | NOT NULL; check completed_at + interval '24 hours' |

`uq_inventory_idempotency_scope (actor_id, operation, key)` is the authoritative exact-key uniqueness constraint. `uq_inventory_idempotency_movement (movement_id)` prevents attaching multiple retained results to one movement. `idx_inventory_idempotency_expiry (expires_at, id)` supports cleanup. Checks enforce key regex `^[A-Za-z0-9._:-]{1,128}$`, hash regex `^[0-9a-f]{64}$`, and movement_id non-null exactly for status 201. Application verifies allowed 404/409 codes and response consistency before insertion; these JSON contracts are not all enforced by SQL CHECKs.

Deleting an expired result does not delete its movement. Result retention does not weaken ledger retention. No durable PROCESSING state exists: absence → transaction-owned processing → completed row on commit; rollback returns to absence (or restores a previously expired row that was deleted in the same transaction).

## Transaction and concurrency protocol

1. Authenticate/authorize, validate key/UUID/body, normalize payload and compute fingerprint outside transaction. Use fixed canonical JSON array `["inventory.movement.v1", lowerCaseProductUuid, type, quantity, trimmedReason]`, UTF-8 SHA-256. Key is not trimmed or lowercased.
2. Start `READ COMMITTED` on one TypeORM transaction manager. Lock identity is the first eight bytes of SHA-256 of canonical array `["inventory-idempotency-lock-v1", actorUuid, "inventory.movement.v1", key]`, interpreted as signed big-endian 64-bit and bound as a decimal string. No JavaScript Number conversion.
3. Call `pg_try_advisory_xact_lock` once. False → rollback, return immediate `409 IDEMPOTENCY_IN_PROGRESS` with `Retry-After: 1`. This PostgreSQL transaction lock is not an external distributed-lock service. Exact-key records remain authoritative even if lock hashes collide.
4. Under the key lock, select the exact scoped result. Compare expiry against DB wall-clock time at lookup. Unexpired + matching hash → return stored status/body after ending the transaction. Unexpired + changed hash → rollback and `409 IDEMPOTENCY_KEY_REUSED`. If expired, delete it in this transaction; it is now a new command, even if payload differs.
5. Read the product, regardless of status. Missing product → prepare a replayable `404 PRODUCT_NOT_FOUND` result, commit only that result, then return the error.
6. Set savepoint before balance initialization. Insert zero balance with `ON CONFLICT DO NOTHING`, then SELECT balance FOR UPDATE. Concurrent first writes serialize via the primary key; distinct keys for the same product may wait here. Reads remain nonblocking under MVCC.
7. Compute before/after in safe integer arithmetic. ISSUE above stock or RECEIPT above ceiling → rollback to savepoint (including a newly inserted zero row), prepare corresponding replayable 409, insert result and commit. Do not throw the HTTP exception inside the transaction callback.
8. Successful command: update balance, insert movement, serialize the final success body, insert 201 result, then commit. Assign movement timestamp as the greater of `clock_timestamp()` and latest product movement timestamp + one microsecond, while holding balance lock. Evaluate this timestamp expression entirely in SQL so JavaScript Date conversion cannot discard microseconds. Use the history index; with no previous movement use clock time. The same timestamp can update the balance; completed_at is sampled afterwards.
9. Respond only after confirmed commit. DB failure at any write rolls back balance/movement/result and expired-row deletion together. Always release QueryRunner in finally if one is used. No service-global repositories, Redis calls or network work inside the transaction.

Key lock → result lookup → product lookup → balance initialization/row lock → movement/result is the fixed order. No HTTP outcome is returned while its transaction remains open. PostgreSQL releases locks when its session/transaction ends, including crash recovery; while a dead connection has not yet been detected, retries may still receive in-progress. Use a transaction-local `idle_in_transaction_session_timeout = '5s'` as a guard, retain the existing statement timeout, and avoid pauses/network work inside ordinary transactions. Deadlock/lock/statement timeout (`40P01`, `55P03`, `57014`) rolls back and maps to `503 INVENTORY_BUSY`, `Retry-After: 1`; unexpected storage failure maps to sanitized 500. No automatic service retry loop; caller retries the same key.



Classify definite rejection/confirmed rollback separately from lost COMMIT acknowledgment. In an uncertain outcome, all three writes may already be committed; preserve the original result and reconcile by the same key instead of claiming stock is unchanged. The transport error is not a new retained result. Verify timeout mapping directly at API port 3001; Gateway port 3004 may report its own 502 before the API 503 arrives. Neither fault injection nor a Gateway error replaces database evidence of rollback/commit.

## Reads and lifecycle

Stock single: one product LEFT JOIN balance statement. Paginated stock/history: read-only `REPEATABLE READ` item/count snapshot, not a snapshot held across HTTP pages. Products order id ASC; history orders created_at DESC, id DESC. Existing product without history returns empty items, total 0; nonexistent product returns 404. Product names/SKUs/status in history are current values. Sort retains DB microseconds although JSON timestamps expose milliseconds.

Soft deactivation/reactivation and catalog edits preserve balances/history. Existing product lifecycle has no hard deletion. FKs restrict future hard deletion of referenced products/users; inventing account/product erasure is outside this feature. Newly created or seeded products need no inventory write.

## Migration, rollout and rollback

Create `apps/api/src/database/migrations/1791158400000-CreateInventory.ts` with a timestamp greater than existing migrations. Up creates balances, movements, results, checks/FKs and indexes in dependency order inside the migration transaction. No data backfill, stock movements or legacy timestamp conversion. Existing products logically start at zero; TypeORM synchronize remains false.

Apply migration before deploying the module. Database discovery already loads `*.entity`/migrations; wire the inventory module into AppModule during implement. A previous API version can coexist with new unused tables. Verify schema on a migrated existing database and a fresh database. Down drops results → movements → balances, including their indexes/constraints. Down destroys inventory data and is limited to disposable environments or empty tables; production recovery uses application rollback while retaining schema, or a reviewed forward migration after backup. Never run down casually after real movements. No migration executed during plan.
