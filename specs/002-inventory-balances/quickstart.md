# Quickstart Validation: Single-Warehouse Inventory

Language: **English** | [Tiếng Việt](vi/quickstart.vi.md)

**Verification run guide.** Inventory is implemented; recorded outcomes are in [validation.md](validation.md). Do not run schema mutations, fault injection or destructive rollback on real business data. No new automated test files are required. Save sanitized response/status/SQL evidence outside tracked files.

## Prerequisites and setup

Use Node.js 24, Docker PostgreSQL 17/Redis, ignored API/Gateway/web .env files, existing admin and customer accounts. Database port comes from the local environment/Compose override (docs mention 55433; Compose defaults 5432); do not overwrite an existing database. Root is a command runner, not an npm workspace.

After implementation, from repository root:

```sh
node --version
npm ci
npm --prefix apps/api ci
npm --prefix apps/gateway ci
npm --prefix apps/web ci
npm --prefix apps/api run infra:up
npm --prefix apps/api run migration:run
npm run dev
```

Run long-lived dev in a separate terminal. Health: Gateway `/api/v1/health/live`, `/api/v1/health/ready`; Swagger `http://localhost:3004/docs`, JSON `/docs-json`. Import existing Postman collection/environment. Login using existing auth requests and keep access tokens in local session variables; never include tokens/cookies/credentials in shared evidence. Obtain two admin sessions and a customer session for scope/auth checks. Use a fresh product for each isolated scenario; do not edit stock directly for routine checks.

Shell examples assume `ACCESS_TOKEN` is privately supplied and `PRODUCT_ID` is the fresh product UUID; neither value is written to tracked files:

```sh
INVENTORY_BASE=http://localhost:3004/api/v1/inventory
INVENTORY_RUN=$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')
curl -sS -i "$INVENTORY_BASE/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -sS -i "$INVENTORY_BASE/$PRODUCT_ID/movements" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $INVENTORY_RUN-receipt" \
  --data '{"type":"RECEIPT","quantity":10,"reason":"Opening stock received"}'
```

Expected zero read, then 201 with before 0, after 10. Contract details and error precedence: [contracts/inventory-api.md](contracts/inventory-api.md).

## Acceptance matrix

| Scenario | Procedure | Expected evidence |
|---|---|---|
| SC-001 | Fresh product; receipt 10, issue 3, issue 8, distinct keys | 201/201/409 INSUFFICIENT_STOCK; stock 7; two movements; failed command replay result only |
| SC-002 | Fresh product receipt 5; ten simultaneous ISSUE 1, distinct keys | Exactly five 201 and five 409 INSUFFICIENT_STOCK; stock 0; five issue movements |
| SC-003 | Temporary constraint rejects movement INSERT awaited by the service after balance update on disposable PostgreSQL | Direct API 500; confirmed rollback, no balance/movement/result mutation; after fixture removal same-key retry succeeds once |
| SC-004 | Customer/no token/expired token; invalid UUID/type/quantity/reason/extra fields | 403/401/400; no command result or stock change |
| SC-005 | Swagger/Postman through Gateway | Envelopes, key/error/retry docs match responses; existing auth/product requests retained |
| SC-006 | Hold original under key ownership; send same-key/payload concurrently | Immediate 409 IN_PROGRESS and Retry-After: 1; after original success same-key replay 201, exactly one movement |
| Zero/lifecycle | Old/demo/new product without movements; deactivate/reactivate | Zero and empty history; active/inactive included; receipts/issues allowed while inactive |
| Catalog/history | Record movement then change product name/SKU | History shows current catalog values; IDs, quantity, reason, balances/actor/time unchanged |
| Pagination/order | Multiple products/movements, empty and out-of-range pages; concurrent write | Defaults/limits and stable required order; items/total share snapshot; unknown/invalid query rejected |
| Bounds | Quantity 0/−1/fraction/string/null/1,000,001; trim and 500/501 Unicode code points | Invalid 400 without mutations; quantity 1 and 1,000,000 accepted when balance permits |
| Ceiling | Isolated ledger-valid ceiling fixture; receipt 1 | 409 STOCK_LIMIT_EXCEEDED, unchanged ledger/balance; replay same error |
| Scope/fingerprint | Same admin key on different product or changed type/qty/reason; reordered JSON/outer reason spaces; second admin same key | Changed canonical payload 409 KEY_REUSED; equivalent payload original result; second admin independent command |
| Error replay | Insufficient issue cached, receive later with new key, replay failed key | Same original error; new business attempt with fresh key succeeds if stock permits |
| Validation not cached | Bad request/key then corrected valid request | No result from rejected input; corrected command can succeed |
| Lost response/replay | Commit receipt, discard response; replay after another movement | Original movement ID/time/balances/status; no new movement; GET shows latest stock |
| Retention | Wait 24h, or shift completed_at/expires_at together on disposable fixture so CHECK holds; scheduler stopped | Same key executes anew even without cleanup; replay does not extend expiry |
| Cleanup | Seed expired/unexpired results; run cleanup tick; multiple instances/locked result | ≤20×1,000 per run, only expired unlocked results removed; all movements and unexpired results remain; backlog/retry/shutdown behavior recorded |
| Temporary failure | DB lock/statement timeout directly at API 3001; separately Gateway timeout/response loss at 3004; recover and retry same key | Direct API 503 + confirmed rollback; Gateway may return 503, its own 502 or no response; transport failure alone is uncertain, no cached transport error, exactly one durable outcome after reconciliation |
| Crash | Kill isolated backend/API before commit, then separately after commit before response | Before commit no mutation/result, key recoverable; after commit same-key replay returns one original movement |
| First-write races | Two receipts on untouched product; two issues on untouched product, distinct keys | Correct serialized receipt total; issues rejected with no new balance/movements; no unique-error leak |

Ceiling fixture: in a disposable DB, generate 2,147 valid RECEIPT records of 1,000,000 units and one of 483,647, with matching sequential before/after values and final balance 2,147,483,647 in one transaction. Use a valid actor/product and increasing timestamps. This avoids invalid direct balance-only setup; document fixture generation and remove by recreating the disposable DB. It is validation data, not product seed behavior.

## Real HTTP concurrency

Prepare a fresh product with receipt 5 using a separate key. Run ten requests, retaining each response and status independently in a temporary directory:

```sh
INVENTORY_EVIDENCE=$(mktemp -d /private/tmp/inventory-evidence.XXXXXX)
for request_index in {1..10}; do
  curl -sS "$INVENTORY_BASE/$PRODUCT_ID/movements" \
    -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
    -H "Idempotency-Key: $INVENTORY_RUN-issue-$request_index" \
    --data '{"type":"ISSUE","quantity":1,"reason":"Concurrent issue verification"}' \
    -o "$INVENTORY_EVIDENCE/$request_index.json" -w '%{http_code}\n' \
    > "$INVENTORY_EVIDENCE/$request_index.status" &
done
wait
cat "$INVENTORY_EVIDENCE/"*.status
```

Count five 201 and five 409 and inspect every error code; verify final stock/history/SQL. If Gateway throttles with 429, the run does not prove SC-002: wait for its documented window and repeat with a fresh product. Postman's sequential runner alone does not prove concurrency. Protect local artifacts if they contain actor IDs or reasons.

## Prove immediate in-progress behavior

On a fresh product with a successful receipt/balance row, terminal A connects to the disposable DB and holds a balance lock:

```sql
BEGIN;
SELECT product_id FROM inventory_balances WHERE product_id = :'product_id' FOR UPDATE;
```

Define psql variable product_id first. In terminal B send a movement with a new key; it acquires key ownership then blocks on terminal A's balance lock. Within the five-second statement timeout, terminal C sends identical key/payload with curl `-w '%{http_code} %{time_total}\n'`. Expected immediate 409 IDEMPOTENCY_IN_PROGRESS (controlled local check <1s), Retry-After: 1, while B is still pending. Quickly COMMIT A; B succeeds. Repeat key/payload, verify original 201 and exactly one new movement. For API DB-timeout mapping, repeat this check directly at port 3001 and verify `503 INVENTORY_BUSY` with confirmed rollback. Through Gateway, B can return the API 503 or Gateway `502 UPSTREAM_UNAVAILABLE` first (or lose its response); do not infer rollback from Gateway 502. After A releases, retry through Gateway with the same key/payload and confirm exactly one durable outcome. Repeat with changed payload during/after processing to distinguish IN_PROGRESS from KEY_REUSED.

## Rollback, crash and commit uncertainty

Use only isolated PostgreSQL and the implemented service's normal awaited SQL. Send deterministic fault requests directly to API port 3001 to verify its 500/error handler independently of the Gateway timeout race; after fixture removal, retry the identical key/payload through Gateway to verify integration. Do not inject console SQL outside the transaction callback, swallow a SQL rejection or add a permanent fault switch/test file. Before each case capture stock, movement count and exact scoped-result count; use a fresh key, fresh product and controlled fixture. A known PostgreSQL statement rejection observed by the service must propagate to its transaction error handler and confirmed rollback, not be reported as a successful commit.

1. **Failure at awaited movement INSERT (SC-003):** On the disposable DB add the temporary constraint below. Send a valid RECEIPT with reason `verify-fault-movement`. The balance UPDATE runs, then the service's own awaited INSERT into stock_movements fails. Verify sanitized API 500, confirmed rollback and unchanged balance/history/result counts. Drop the constraint, retry identical key/payload and verify exactly one successful movement/result.

```sql
ALTER TABLE stock_movements ADD CONSTRAINT verify_fault_movement
  CHECK (reason <> 'verify-fault-movement') NOT VALID;
-- Send the controlled HTTP request and record its rollback evidence before dropping.
ALTER TABLE stock_movements DROP CONSTRAINT verify_fault_movement;
```

2. **Failure at awaited result INSERT:** On the same isolated DB, add the temporary constraint below. Send a valid receipt with a fresh key/product. The service's awaited result INSERT for status 201 fails after balance and movement writes. Verify 500 and rollback of all three; drop the constraint before retrying the identical command. This constraint blocks every new 201 result, so never use it on a shared/production DB.

```sql
ALTER TABLE inventory_idempotency_results ADD CONSTRAINT verify_fault_result
  CHECK (http_status <> 201) NOT VALID;
-- Send the controlled HTTP request and record its rollback evidence before dropping.
ALTER TABLE inventory_idempotency_results DROP CONSTRAINT verify_fault_result;
```

The ALTER commands are manual fixture setup/removal, not application SQL failures or feature migrations. Keep existing records untouched; restore the disposable schema before the next scenario. If a case is interrupted, remove its temporary constraints before retrying ordinary requests.

3. **Failure at awaited COMMIT after result INSERT:** In disposable PostgreSQL only, install a temporary `DEFERRABLE INITIALLY DEFERRED` constraint trigger on inventory_idempotency_results that raises a controlled exception for the selected fresh fixture product. The service must await COMMIT, observe the database rejection and confirm rollback of balance/movement/result; expect sanitized API 500. Remove the trigger and its temporary function before identical-key retry. Record the awaited SQL stage, observed database rejection and final database counts; debugger pausing or an error outside the awaited callback is not sufficient evidence.

4. **Crash and lost acknowledgment, separate from deterministic SQL failure:** Terminate only the isolated transaction's backend before COMMIT and verify rollback before same-key retry. Separately pause after acknowledged COMMIT before HTTP response, stop only the isolated API, restart and replay the original committed result. For loss of COMMIT acknowledgment, interrupt the isolated connection while COMMIT is awaiting its response; classify outcome as uncertain rather than assuming rollback or creating a new key. Same-key retry determines whether the original terminal result committed. Record confirmed rollback, confirmed commit with lost response, and uncertain acknowledgment as distinct cases. No claim that every 500/502 leaves stock unchanged; atomicity must hold in every case. Do not stop shared PostgreSQL or add tracked fault-injection/test files.

## Database verification

Connect using the configured isolated database (Docker psql is available via `npm --prefix apps/api run infra:up` infrastructure). In psql inspect `\d inventory_balances`, `\d stock_movements`, `\d inventory_idempotency_results`; compare constraints/indexes to [data-model.md](data-model.md). Verify no negative balances, duplicate retained scoped keys, missing movement-linked successes or movement rows for failed requests.

Ledger reconciliation must return zero rows:

```sql
SELECT p.id, COALESCE(b.on_hand_qty, 0) AS balance,
       COALESCE(SUM(CASE WHEN m.type = 'RECEIPT'
                        THEN m.quantity::bigint ELSE -m.quantity::bigint END), 0) AS ledger
FROM products p
LEFT JOIN inventory_balances b ON b.product_id = p.id
LEFT JOIN stock_movements m ON m.product_id = p.id
GROUP BY p.id, b.on_hand_qty
HAVING COALESCE(b.on_hand_qty, 0) <> COALESCE(SUM(
  CASE WHEN m.type = 'RECEIPT' THEN m.quantity::bigint ELSE -m.quantity::bigint END), 0);
```

Reconciliation alone does not prove replay/concurrency: retain request statuses, IDs and SQL counts too. Inspect EXPLAIN for history/result/product joins on representative fixtures; a tiny table's sequential scan is not by itself a failure.

## Migration and quality gates

Point API DATABASE_URL at a disposable database via ignored config; apply full migration chain, verify products read zero, schema constraints/indexes and existing Product/Auth data. After inventory checks, recreate disposable data for destructive down verification. Revert only the new last migration, verify the three inventory tables disappear while earlier tables remain, then apply again:

```sh
npm --prefix apps/api run migration:run
npm --prefix apps/api run migration:revert
npm --prefix apps/api run migration:run
npm run check
npm run build
npm test
```

Never revert on business data; retain schema during application rollback. If there are no existing API tests, report `No tests found` as an omitted automated suite, not a passing test. Do not add test files to hide that gap.

## Outcome logging verification

Capture only sanitized logs from the isolated API. Exercise one completed receipt, its replay, an in-progress duplicate and a changed-payload conflict; also exercise a confirmed rollback, direct-API timeout and lost COMMIT acknowledgment. For each validated attempt reaching key ownership, count exactly one structured outcome event after transaction end for known results, or after connection discard/release with the server outcome explicitly unknown for lost acknowledgment: `completed`, `replayed`, `in_progress`, `conflict`, `transient_failure`, `persistence_failure` or `outcome_uncertain` as applicable. A committed business rejection counts as completed with its 404/409 status, not a movement success. An uncertain acknowledgment must not emit completed for that attempt; its later replay is a separate attempt, not a new movement. Compare completed-success events with durable movement/result IDs and database counts, keeping replay/conflict/in-progress separate. Verify no completed event is emitted before COMMIT acknowledgment, no known-result event while the transaction is known to be open, and no raw key/hash/reason/payload/token/cookie/credential/SQL/connection detail appears. Check cleanup count/duration summaries separately. Save the sanitized outcome counts and timing/SQL evidence in validation.md and vi/validation.vi.md; no new automated test file or metrics infrastructure.

## Evidence record

Record date/Node+PostgreSQL versions, isolated DB/environment, source revision if available, each scenario's sanitized request/key alias, statuses/codes, balances/movement/result counts, concurrency timing, rollback/crash observations, migration outcomes, checks and limitations. Never include auth headers, cookies or real credentials. English/Vietnamese docs and Swagger/Postman must describe the same contract. **Actual outcomes:** see [validation.md](validation.md), including verification methods and omissions.
