# Single-Warehouse Inventory

Language: **English** | [Tiếng Việt](../../vi/inventory/INVENTORY_SPEC.md)

Implementation reference. [Business spec](../../../specs/002-inventory-balances/spec.md), [design](../../../specs/002-inventory-balances/plan.md), [verification](../../../specs/002-inventory-balances/validation.md). Runtime verification is recorded per scenario; this guide alone is not evidence.

## Common rules

Base through Gateway: `http://localhost:3004/api/v1/inventory`. API direct port 3001 is used only for diagnosis. Every endpoint uses Bearer JWT verification and admin role checks in the API, including replays. No customer access. Existing authentication/storage contracts remain unchanged. Gateway transparently forwards `Idempotency-Key`, `Retry-After`, status and body; no new routing or rate policy is required.

UUID path parameters are required; malformed UUID → 400, syntactically valid missing UUID → 404. Normalize product UUID to lowercase for fingerprinting. GET accepts only page/limit for lists, no query parameters for single stock. POST accepts no query parameters. Unknown query/body fields → 400. Defaults page=1, limit=20; positive safe integers, limit≤100, and offset `(page−1)*limit` must be a safe integer. Invalid values are rejected, not clamped. Page beyond end returns empty items and unchanged total. Pagination snapshots are consistent within one request, not across requests.

### Shapes

`ProductSummary = { id: UUID, sku: string, name: string, status: "ACTIVE" | "INACTIVE" }`.

`StockItem = { productId: UUID, onHandQty: number, product: ProductSummary }`.

`Movement = { id: UUID, productId: UUID, type: "RECEIPT" | "ISSUE", quantity: number, balanceBefore: number, balanceAfter: number, actorId: UUID, reason: string, createdAt: ISO-8601 UTC string }`.

`HistoryItem = Movement & { product: ProductSummary }`. Product fields come from the current catalog; movement facts do not change. Timestamp serialization uses `YYYY-MM-DDTHH:mm:ss.sssZ`; database ordering preserves full microseconds.

## Endpoints

| Endpoint | Request | Response |
|---|---|---|
| GET `/` | optional page/limit | 200 `{ items: StockItem[], page, limit, total }`, product id ASC |
| GET `/:productId` | UUID, no query/body | 200 `{ inventory: StockItem }` |
| GET `/:productId/movements` | UUID, optional page/limit | 200 `{ items: HistoryItem[], page, limit, total }`, createdAt DESC, id DESC |
| POST `/:productId/movements` | UUID, key header, JSON below | 201 `{ movement: Movement, inventory: { productId, onHandQty } }` |

Stock lists include every active/inactive product, including missing balance rows as zero. History of an existing untouched product is empty. All three product-specific paths return 404 for nonexistent products.

```json
{ "type": "RECEIPT", "quantity": 10, "reason": "Opening stock received" }
```

POST body contains exactly the three required fields. Type is case-sensitive. Quantity must be a JSON number, integer 1–1,000,000; do not coerce strings, booleans or null. Reason is a string trimmed using JavaScript trim, then 1–500 Unicode code points; whitespace-only/null are invalid. Client-supplied actor/timestamps/IDs/calculated balances are rejected.

```json
{
  "movement": {
    "id": "04bca4f8-e75d-48d4-958b-bf7bf9662ee2",
    "productId": "b38582da-860b-409b-87d8-523458354573",
    "type": "RECEIPT",
    "quantity": 10,
    "balanceBefore": 0,
    "balanceAfter": 10,
    "actorId": "1df47894-69ad-443f-a0cc-089d810e0872",
    "reason": "Opening stock received",
    "createdAt": "2026-10-05T08:00:00.000Z"
  },
  "inventory": { "productId": "b38582da-860b-409b-87d8-523458354573", "onHandQty": 10 }
}
```

## Idempotency contract

- POST requires exactly one `Idempotency-Key` header, regex `^[A-Za-z0-9._:-]{1,128}$`; missing, duplicate, comma-joined, whitespace-containing or oversized values → `400 INVALID_IDEMPOTENCY_KEY`. Reject duplicate headers using raw HTTP header occurrence information before normalized-header handling. Keys are case-sensitive; UUID keys are recommended. Other endpoints do not consume the header.
- Exact scope `(JWT subject UUID, "inventory.movement.v1", key)`. Different admins have independent scopes and can each create a movement using the same literal key. Refreshing the same admin's token does not change scope. API role checks always precede lookup.
- Fingerprint includes normalized path productId, type, numeric quantity and trimmed reason, with fixed canonical JSON ordering defined in [data-model.md](../../../specs/002-inventory-balances/data-model.md). JSON property order and outer reason whitespace do not change identity. Product catalog changes do not change the fingerprint. Same key on another product is changed payload.
- Terminal status/body remain replayable for 24 hours from completed_at; expiry is stored and does not slide on replay. Expired key is accepted as a new command, whether or not cleanup ran. Retrying after this window may create a new movement; clients retain keys, retry within the window and reconcile history when the window has elapsed.
- Matching unexpired result replays the original status and JSON values, including original balances and timestamps; JSON object property order is not guaranteed. POST does not include name/SKU snapshots. GET gives the latest balance/catalog. A lost response after commit safely replays.
- While key ownership is held, a duplicate returns immediately `409 IDEMPOTENCY_IN_PROGRESS`, `Retry-After: 1`, without waiting for the original transaction. After completion, retry the same key/payload. Changed payload while ownership is held also receives this temporary code; after completion it receives `IDEMPOTENCY_KEY_REUSED`. Neither conflict overwrites the original result.
- Replay terminal business failures: `404 PRODUCT_NOT_FOUND`, `409 INSUFFICIENT_STOCK`, `409 STOCK_LIMIT_EXCEEDED`. A later stock change does not change an unexpired cached failure. A deliberately revised/new business attempt requires a new key.
- Do not retain 400/401/403, key conflicts, 429, 500, 502 or 503. A transaction with confirmed rollback commits no result. Loss of COMMIT acknowledgment may instead leave a committed original terminal result; the 500/502/503 transport response is never itself stored as a replay result. Retry transient 409-in-progress/429/502/503 or uncertain 500/lost response with the same key and payload, honoring Retry-After and using backoff with jitter; after reauthentication keep the key. Never silently choose a new key for an uncertain command.
- No processing-status endpoint, 202 response, external distributed lock, client balance update or automatic retry loop in API service.

## Error contract and precedence

Inventory-owned errors use `{ statusCode: number, code: string, message: string }`. Example: `{ "statusCode": 409, "code": "INSUFFICIENT_STOCK", "message": "Insufficient stock" }`. Do not return internal SQL, constraint names, stack traces or connection details. An Inventory-scoped exception filter normalizes errors; do not globally change existing Product/Auth errors. Framework validation message arrays can be joined into one sanitized string. Malformed JSON errors raised before controller dispatch retain the existing framework 400 shape; Gateway errors retain existing shapes.

| HTTP | Code | Meaning / persistence |
|---|---|---|
| 400 | INVALID_INPUT | UUID/body/query validation; not retained |
| 400 | INVALID_IDEMPOTENCY_KEY | Missing/invalid/repeated key; not retained |
| 401 | UNAUTHORIZED | Missing/expired/invalid JWT; not retained |
| 403 | FORBIDDEN | Authenticated non-admin; not retained |
| 404 | PRODUCT_NOT_FOUND | Valid UUID absent; retained only for validated POST |
| 409 | INSUFFICIENT_STOCK | ISSUE quantity above stock; retained |
| 409 | STOCK_LIMIT_EXCEEDED | RECEIPT would exceed ceiling; retained |
| 409 | IDEMPOTENCY_KEY_REUSED | Unexpired completed key with different fingerprint; not retained |
| 409 | IDEMPOTENCY_IN_PROGRESS | Nonblocking key lock unavailable; Retry-After: 1; not retained |
| 429 | RATE_LIMIT_EXCEEDED | Existing Gateway limiter; existing Retry-After; not retained |
| 500 | INVENTORY_PERSISTENCE_FAILED | Unexpected persistence/commit failure, sanitized; not retained |
| 502 | UPSTREAM_UNAVAILABLE | Existing Gateway failure; outcome may be unknown; not retained by API |
| 503 | INVENTORY_BUSY | API DB lock/deadlock/statement timeout after confirmed rollback; Retry-After: 1; not retained |

Gateway limiting occurs first. Within controller-dispatched API requests: authentication → authorization → UUID/key/query/body validation → nonblocking key ownership → unexpired replay/fingerprint conflict → product existence → stock bounds. Therefore a valid replay returns its original result before current product/stock checks; invalid auth or input is never bypassed by a key. Error storage failure replaces the intended replayable business error with 500 and rollback. If COMMIT acknowledgment is lost, do not assert rollback occurred: return a sanitized error if possible, mark outcome uncertain internally, release/discard the connection and reconcile by same-key retry.



API and Gateway timeouts are different observations: verify API `503 INVENTORY_BUSY` directly on port 3001 when testing DB timeout mapping. Through Gateway port 3004, the existing five-second proxy timeout can win the race against the five-second DB statement timeout, yielding `502 UPSTREAM_UNAVAILABLE` (or no response if the client connection is lost) instead of the API 503. Do not promise a Gateway 503 in that case or change global timeouts for this feature. API 503 with confirmed rollback is definite; Gateway 502 alone is uncertain. Retry through Gateway with the same key/payload after recovery to determine the durable outcome.

Definite rejection includes validation/auth/business rejection and a storage failure with confirmed rollback, not a lost response or lost COMMIT acknowledgment. For uncertain outcomes, retain any successfully committed original result, never cache the transport error and never tell the caller that stock is definitely unchanged. Atomicity is unchanged.


## Database ownership and lifecycle

PostgreSQL owns `inventory_balances`, `stock_movements`, and `inventory_idempotency_results`. No warehouse table or Product-create/seed hook is required: a missing balance means zero. Product deactivation permits reads and both movement types. Movement/product/user FKs use RESTRICT; result request product has no FK so missing-product 404 can replay. No catalog snapshots or durable PROCESSING records exist.

One READ COMMITTED transaction owns the scoped nonblocking advisory key lock, result lookup, product lookup, savepoint, lazy balance initialization and FOR UPDATE balance lock. Stock, movement and original result commit together. Business stock rejection rolls back initialization to the savepoint, then commits only its cached error. Every write uses the same manager. SQL assigns per-product monotonic microsecond timestamps under the balance lock; JSON exposes milliseconds. List items/count share one read-only REPEATABLE READ snapshot.

Hourly cleanup at `0 0 * * * *` UTC deletes expired results only, at most 20 batches of 1,000 using FOR UPDATE SKIP LOCKED and short transactions. Key expiry works independently of cleanup. The job prevents overlap, stops between batches during shutdown, waits for the current batch, and retries failures at the next scheduled run. Movements are never TTL-deleted.

The existing logger records exactly one structured movement outcome per eligible attempt after transaction end or connection discard/release for uncertainty. Outcomes: completed, replayed, in_progress, conflict, transient_failure, persistence_failure, outcome_uncertain. Completed business errors are distinguished by status/category; replay is not a new movement. Keys, hashes, reasons, payloads, tokens, cookies, credentials, SQL and connection details are excluded. Cleanup logs bounded count/duration summaries.

## Migration and verification

New migration: `1791158400000-CreateInventory.ts`. Apply the migration before deploying the API. Synchronization remains disabled; old migrations are unchanged and no backfill occurs. Down drops results, movements, balances and destroys inventory data; use only disposable/empty environments. Production application rollback retains the schema, or uses a reviewed forward migration after backup.

[Quickstart](../../../specs/002-inventory-balances/quickstart.md) describes manual API/Gateway/PostgreSQL concurrency, fault injection at SQL actually awaited by the service, rollback, uncertain COMMIT, cleanup and migration verification. No new automated test files. Existing quality gates/tests and omissions belong in the linked verification record. Swagger `/docs` and `/docs-json` and the existing Postman collection expose these contracts; local key/token placeholders stay empty in tracked files.
