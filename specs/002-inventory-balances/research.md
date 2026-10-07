# Research: Single-Warehouse Inventory

**Date**: 2026-10-05 | **Status**: Design research complete (design-time record); implementation evidence is in [validation.md](validation.md)

Language: **English** | [Tiếng Việt](vi/research.vi.md)

## Repository evidence

Read `spec.md`, the constitution, `docs/en/conventions/{backend,database,gateway}.md`, API entities/DTOs/services/database options/migrations, Gateway proxy, cleanup job and package scripts. The conventions are under `docs/en/` and `docs/vi/`, not `docs/conventions/`.

The repository uses PostgreSQL 17 (`apps/api/compose.yaml`), NestJS 11, TypeORM 0.3, strict TypeScript and Node.js 24. Products and users have UUID IDs. Product deletion means deactivation. API validation rejects unknown fields. Gateway forwards `/api/*` and has a five-second upstream timeout. Database options already set five-second statement timeout and three-second connection timeout. There is no inventory module. These are source observations, not claims of runtime success.

## R1 — Atomic writes and immediate duplicate detection

- **Decision:** One `READ COMMITTED` transaction uses `pg_try_advisory_xact_lock` for the scoped idempotency key, then a product balance row lock. Only completed idempotency outcomes are persisted.
- **Rationale:** The try function does not wait for the key lock, allowing immediate `409 IDEMPOTENCY_IN_PROGRESS`. Transaction locks release at transaction end; stock, movement and replay result commit together. This is PostgreSQL transaction concurrency control, not an external distributed-lock system; no Redis lock, queue, lease or session lock is introduced. It preserves the exclusion of distributed lock infrastructure.
- **Alternatives considered:** A unique insert alone may wait for a concurrent uncommitted insert. A tiny lock timeout also mistakes unrelated lock contention for duplicate processing. A separately committed `PROCESSING` row requires crash recovery and fencing. All add complexity or weaken the agreed behavior.
- **Tradeoff:** The signed 64-bit lock identifier is derived from SHA-256 over a namespaced exact key tuple. A hash collision can cause a conservative temporary in-progress response for unrelated keys; it cannot replay the wrong result or merge movements. Exact tuple uniqueness and fingerprint comparison remain authoritative.

The nonblocking and transaction-lifetime behavior is documented in [PostgreSQL advisory lock functions](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS). Row locks serialize writers until transaction end: [PostgreSQL explicit locking](https://www.postgresql.org/docs/17/explicit-locking.html). All queries must use the same transaction manager: [TypeORM transactions](https://typeorm.io/docs/advanced-topics/transactions/).

## R2 — Key lifecycle and replay

- **Decision:** Scope by `(actor_id, operation, key)` with operation `inventory.movement.v1`. Product ID belongs to the canonical fingerprint, not the key scope. Retain terminal `201`, `404 PRODUCT_NOT_FOUND`, and stock-conflict `409` status/body for 24 hours from completion. Replays do not extend expiry. Auth/validation failures, in-progress/key-reuse conflicts and transient infrastructure failures are not cached.
- **Rationale:** An admin cannot accidentally reuse a key for another product. A lost success response safely replays even after later movements. Business failures remain stable; retrying an insufficient-stock command after a receipt requires a new key. Every replay passes current authentication/authorization first.
- **Alternatives considered:** Product-scoped keys silently accept cross-product reuse; indefinite retention grows without bound; caching `500` prevents recovery. Returning a newly computed balance on replay violates the original-result decision.

## R3 — Zero balances and history

- **Decision:** A missing balance row means zero. Reads start from products and left join balances. First successful movement creates a zero balance row inside its transaction, then locks it. Failed first issues roll back that initialization using a savepoint while committing only their replayable error. No name/SKU snapshots are stored.
- **Rationale:** Existing, newly created and demo products all read as zero without changing Product creation or seeding. History keeps immutable movement facts and joins current catalog values.
- **Alternatives considered:** Eager backfill plus Product-create integration adds lifecycle coupling; deriving stock on every read from the entire ledger adds unnecessary work. Historical catalog snapshots contradict clarify.

## R4 — Ordering, bounds and reads

- **Decision:** Product lists order by product UUID ascending. History orders `created_at DESC, id DESC`. Assign `created_at` after acquiring the balance lock, using database wall-clock time, and ensure it is strictly later than that product's latest movement by at least one microsecond if the clock ties or moves backwards. Use the history index to find that latest timestamp under the balance lock. Preserve database microseconds in sorting; JSON timestamps use ISO UTC milliseconds. Pagination item/count queries share a read-only `REPEATABLE READ` snapshot.
- **Rationale:** Transaction-start time can misorder commands waiting for a balance lock. Monotonic per-product assignment preserves recording order; UUID remains the required secondary sort. Integer bounds are checked before arithmetic writes; ledger sums use bigint.
- **Alternatives considered:** `now()` records transaction start; random UUID ordering alone cannot represent recording order. No new sequence field is needed.

PostgreSQL distinguishes transaction time and wall-clock time in [date/time functions](https://www.postgresql.org/docs/17/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT).

## R5 — Cleanup, migration and validation

- **Decision:** Add one new reversible schema migration, no backfill and no edits to existing migrations. Reuse the API scheduler for hourly UTC cleanup of expired results, up to 20 batches of 1,000 with `SKIP LOCKED`; stop between batches on shutdown. Key expiry/reuse works without cleanup. Use fixed documented constants, no new environment variables.
- **Rationale:** Bounded cleanup is required by the retention lifecycle and uses existing infrastructure. Movement audit records are never TTL-deleted. Manual API/real-database concurrency and rollback evidence is required; no new automated test files.
- **Alternatives considered:** A worker/queue is out of scope; cleanup-only expiry would make availability depend on the scheduler; destructive rollback with populated history is unsuitable for production recovery.

## R6 — Review corrections: outcomes and verification

- **Decision:** Distinguish definite rejection/confirmed rollback from lost COMMIT acknowledgment or response; uncertain outcome reconciles by the same key while preserving atomicity and any original committed result. Test API 503 mapping directly; Gateway may produce its own 502 first with unchanged timeouts.
- **Rationale:** A transport failure does not prove rollback. Fault injection must reject SQL awaited by the service on disposable PostgreSQL, using temporary constraints/triggers; debugger-console SQL outside the callback is not acceptance evidence. Test movement INSERT failure, result INSERT failure and deferred failure at awaited COMMIT separately from connection/acknowledgment loss.
- **Alternatives considered:** Assuming every 500/502 leaves stock unchanged, requiring Gateway 503 in a timeout race, or injecting an unobserved debugger error can produce misleading evidence. No new automated test files or permanent production failure switches are introduced.
- **Observability:** T016–T017 emit known-result events after transaction end, or outcome_uncertain after connection discard/release without assuming the server result, using the existing logger; T040 verifies counts, post-commit timing, uncertain-outcome classification and secret-free output. Bilingual documents live in `vi/`; contracts remain in `contracts/`. These are documentation corrections authorized after analysis, not a new skill run or runtime validation.

## Resolved unknowns

Key scope, retention, error replay, processing/retry behavior, schema, zero initialization, locks, failure atomicity, ordering, migration and validation are resolved in this design. Numeric throughput/availability promises are not introduced: this learning milestone has no agreed production SLO or load envelope. Future measurements must precede scaling work.
