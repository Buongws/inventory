# Inventory implementation verification

Language: **English** | [Tiếng Việt](vi/validation.vi.md)

Date: 2026-10-06. Implementation complete; runtime/quality evidence and limitations below. Only outcomes recorded below are verified.

## Environment

- Node.js v24.21.0. Independent root/API/Gateway/web installs verified with `npm ls --depth=0` (all exit 0).
- Dedicated disposable PostgreSQL 17 container `inventory-002-verify-pg`, localhost port 55534, database `inventory_verify`; readiness passed. Existing databases are untouched.
- Dedicated disposable Redis 7.4 container `inventory-002-verify-redis`, localhost port 56380; PING passed.
- Constitution and backend/database/Gateway conventions read. No extension hooks or feature checklists exist.
- Git/ESLint/Docker ignores inspected; Prettier ignore added and Docker secret/log patterns completed. No package publication is planned.
- Runtime configuration uses process environment or ignored temporary files; no secrets in this record.

## Initial verification state

At T001 initialization all runtime scenarios were **not run**: US1 stock/auth/pagination; US2 receipt/replay/first-write/in-progress; US3 issue/rejection; US4 history/catalog/append-only; key scope/fingerprint/expiry; SQL fault/rollback/crash/uncertain COMMIT; mixed concurrency/ledger; cleanup caps/locking/shutdown/recovery; fresh/existing migration up/down/up; root check/build/existing tests; Gateway forwarding/timeouts/rate limit; Swagger/Postman/bilingual parity and outcome logging.

No new automated test files will be added. Completed task checkboxes require actual implementation and verification evidence.

## Foundation and US1 — PASS

T002–T013: module/entities/new migration/filter/DTOs/admin wiring and read endpoints/Postman implemented; API typecheck and build passed. Migration full chain (5 migrations) committed on the fresh disposable database.

T014: Gateway checks passed: existing active/inactive stock zero, 3 actual demo-seeded products zero, newly API-created product zero; list ID ascending and total=6, page boundaries/out-of-range; missing product 404; invalid UUID/query/duplicate query/unsafe offset 400; customer 403; missing/invalid token 401. SQL balance row count remained 0 after all reads. No movement route exists yet.

## US2 — PASS

T015–T021 implemented: exact raw key validation/canonical hashes; same-manager key/row locks; atomic receipt/result; savepoint business rejection; 24h replay; sanitized outcomes; bounded hourly UTC cleanup/job. API build passed.

T022 Gateway + PostgreSQL: receipt 10 then 5 gave stock 15/two movements; replay returned original balance 10 after later write; 8 invalid body cases and 3 invalid key cases returned 400; inactive receipt 201; concurrent first receipts 10+5 both 201 and balance 15. Ledger-consistent disposable ceiling fixture rejected receipt with 409 STOCK_LIMIT_EXCEEDED and replayed it. Held balance lock produced immediate duplicate 409/Retry-After 1 in 25ms; original then committed and replayed identical JSON values. Final tested product stock=16/movements=3. An early request during API startup returned Gateway 502 and was retried using the same key. JSON replay was compared by values, not property order.

## US3 — PASS

T023–T026: ISSUE reuses the receipt transaction/key lifecycle. Gateway + SQL: receipt 10, issue 3, rejected issue 8 left stock=7/movements=2 (SC-001); issue 7 reached zero. Rejected first issue created no balance row; after receipt old key replayed insufficient error, new key succeeded. Inactive issue succeeded to zero. API build passed.

## US4 — PASS

T027–T030: history read-only REPEATABLE READ + current catalog implemented, Swagger/Postman extended, API build/lint passed. Gateway/SQL: 3 facts newest-first with after balances [0,7,10]; page 2 limit 1 matched the middle fact; out-of-range empty with total 3; untouched total 0; missing product 404. SKU/name/status edit to INACTIVE changed only displayed catalog fields; every movement fact remained identical. PATCH/DELETE movement routes returned 404 and SQL count stayed 3.

## Cross-cutting runtime — PASS (T034–T037)

- T034: two admins using the same key produced separate movements; actual login/refresh of one admin replayed the original result. Equivalent JSON/Unicode trim replayed; product/type/quantity/reason changes conflicted; case-different keys were independent. TTL exactly 24h and replay did not extend it. Cached 404 remained after product creation; new key succeeded. Validation/auth were uncached. Expired result replaced without cleanup. Cached stock failure is covered by US2/US3.
- T035: temporary PostgreSQL CHECK constraints rejected the service-awaited movement INSERT and result INSERT; a deferred constraint trigger rejected awaited COMMIT. Each direct API response was sanitized 500; stock row absent, movement/result counts=0; removing fixture then same-key Gateway retry produced stock=1/movement=1/result=1. Backend termination before COMMIT preserved prior stock and no result; retry succeeded. A disposable TCP proxy dropped server COMMIT acknowledgment: API 500/outcome_uncertain, original 201 persisted, same-key replay preserved it. A temporary HTTP proxy withheld an acknowledged 201 response and stopped the isolated API; after restart same-key replay returned original result. This last fixture simulates client response loss, rather than a debugger pause in source. All temporary SQL fixtures were removed.
- T036: ten distinct-key issues from five units yielded five 201/five INSUFFICIENT_STOCK, balance 0. Forty mixed receipt/issues succeeded and preserved expected balance. Changed payload in-flight returned IN_PROGRESS in 13ms, then KEY_REUSED after completion. Duplicate same-payload case is US2 (25ms). PostgreSQL reconciliation returned 0 mismatches and 0 negative balances; no 429-contaminated run.
- T037: 20,005 expired results: first cleanup deleted 20,000 in 20 batches (266ms), leaving 5; concurrent instances skipped a locked row until release. All 2,221 movements and 81 unexpired results survived. Controlled DELETE-trigger failure left data intact; after fixture removal firing the actual next cron callback recovered (did not wait one hour). Cron is hourly UTC. Overlap invoked cleanup once. Shutdown waited for blocked current batch, deleted 1,000/one batch, stopped with 1,000 remaining and interrupted=true. Subsequent cleanup drained it. EXPLAIN used history and scoped-result indexes.

## Final lifecycle, quality and contract verification — PASS

- T031–T033: English/Vietnamese inventory guides and index links created with the same contract, ownership, retry/cleanup/logging/migration behavior.
- T038: full migration chain on fresh PostgreSQL and a database containing Product/User/AuthIdentity/RefreshToken data; inventory up/down/up passed and prior rows survived. Logical zero remained zero with no backfill. Catalog inspection matched all 13 CHECKs, 5 RESTRICT FKs, 3 PKs, 2 unique constraints and 8 indexes; history DESC order, C-collated key and bigint delta were confirmed. CLI `migration:revert` and `migration:run` also both exited 0 on the fresh disposable database. Down was exercised only with empty inventory tables. Production application rollback retains schema; no production migration/deployment was performed.
- T039: root `npm run check` and `npm run build` exited 0 across API/Gateway/web. Final API lint/format/typecheck/build also exited 0 after controller/Swagger refinements. `npm test` exited 1: **No tests found** (0 matches); existing automated-suite coverage is absent, not a passing suite. No new automated test files were added.
- T040: raw repeated key headers were rejected with 400 INVALID_IDEMPOTENCY_KEY directly and through Gateway. GET body fields and unsafe computed offsets returned 400. All inventory routes rejected customers; auth/role preceded input/replay. Exactly 500 emoji code points were accepted and SQL char_length was 500. Gateway forwarding preserved replay values, Retry-After 1, 429/RATE_LIMIT_EXCEEDED with Retry-After 60, and existing 502 two-field body. 429 was not stored.
- API lock timeout directly returned 503 INVENTORY_BUSY/Retry-After 1 with no result before retry. Gateway five-second race yielded no response in the final controlled run; same-key recovery created exactly one movement. An earlier Gateway timeout run had already committed when the balance lock was released: the transport observation did not prove rollback, and reconciliation found the retained 201. Explicit API unavailability also returned the existing 502 shape. Timeouts were not changed.
- Swagger `/docs`/`/docs-json` through Gateway: 3 inventory paths/4 operations, security/DTOs/envelopes, required key and all documented statuses; Gateway 429/502 shapes match current behavior. Postman retains Auth/Product requests and has stock/receipt/replay/conflict/duplicate/missing/invalid key/issue/history scenarios with empty token/key environment placeholders. No automatic key replacement on replay.
- Logging on real PostgreSQL with temporary observation wrappers (no tracked tests/hooks): 10 eligible attempts emitted exactly 10 events: completed=3 (including cached 404), replayed=2, conflict=1, in_progress=1, persistence_failure=1, transient_failure=1, outcome_uncertain=1. Known events followed transaction end; all followed connection release/discard; completed followed acknowledged COMMIT; uncertain never emitted completed. Replay was not a new movement. Recorded logs exclude secrets, keys, hashes, reasons, payloads, cookies and SQL/connection details. Cleanup count/duration/error summaries were checked separately.
- Additional real-DB checks: stock and history items/count remained in the same read-only REPEATABLE READ snapshot when another connection committed between the two queries. SQL clock fallback advanced a product timestamp by exactly one microsecond and history returned the new fact first. Cleanup removed the exact expiry-boundary fixture and preserved a future-expiry fixture.
- Final database audit: 0 temporary SQL fixtures, 0 ledger mismatches, 0 negative balances; 2,236 movements and 98 retained results before final shutdown. Counts include deliberate disposable ceiling/concurrency fixtures, not business stock.

## Limits and corrected preliminary checks

No Git HEAD exists, so a source revision cannot be recorded. Verification used isolated local PostgreSQL 17.11 and Redis 7.4, not production load. The actual cron callback was fired to verify failure recovery; an hour was not elapsed. Response loss used temporary network proxies; no permanent fault switches or new test files exist. The backward-clock fixture updated timestamps only on disposable data.

Preliminary manual harness checks were corrected and rerun: JSON property-order comparison, CHECK count (13), raw HTTP Host header, reserved SQL fixture alias, and an incorrect assumption that every Gateway timeout implies rollback. These were verification-fixture issues; final checks above passed. Automated Jest coverage remains omitted because there are no existing tests. No commit, publish, deployment or converge run was performed.

## Requirement and acceptance evidence

| Requirement | Actual evidence |
|---|---|
| FR-001 | US1 and final all-route auth/role precedence |
| FR-002 | US1 existing/demo/new zero; migration existing-data zero |
| FR-003 | US2 invalid quantity/ceiling; US3/SC-002 non-negative issues |
| FR-004 | US2 reason validation; US4 server facts; 500-code-point SQL check |
| FR-005 | Awaited INSERT/deferred COMMIT rollback; uncertain-COMMIT reconciliation |
| FR-006 | First-write receipts, ten issues and mixed concurrency |
| FR-007 | Unsupported edit/delete; zero ledger mismatches; cleanup preserves movements |
| FR-008 | Stock/history pagination, read snapshots and microsecond ordering |
| FR-009 | Inactive stock/history/receipt/issue |
| FR-010 | Unknown/server-owned input and GET body rejection |
| FR-011 | Held original duplicate 409 in 25ms; original replay |
| FR-012 | Catalog rename/SKU/status changed display only; facts identical |
| SC-001 | Receipt 10, issue 3, rejected 8: stock 7/two movements |
| SC-002 | Ten issues from five: five successes/five insufficient/zero stock |
| SC-003 | Service-awaited movement INSERT fault: all mutations rolled back |
| SC-004 | Customer/unauthenticated/invalid input denied without writes |
| SC-005 | Swagger/Postman and synchronized bilingual guides/contracts |
| SC-006 | In-progress 409/Retry-After 1, then original replay/one movement |

All 12 acceptance scenarios across US1–US4 have the story evidence above. T001–T041 completed; feature scope and confirmed decisions preserved. No extension hooks exist; before/after implement hooks skipped. Next workflow step only when requested: `$speckit-converge`.

Final cleanup: isolated API/Gateway and disposable network proxy stopped; PostgreSQL/Redis verification containers stopped and retained for review. Shared containers/data were untouched. Redis exact version: 7.4.11.

## Convergence implementation — T042 PASS (2026-10-06)

Corrected Inventory Swagger numeric schemas to `integer`: whole-unit quantities/balances, page/limit/total and error statusCode. Runtime validators, bounds/defaults and business decisions are unchanged.

Manual `/docs-json` inspection through Gateway port 3004 returned 200 and confirmed 16 body/response integer properties and four page/limit query parameters. Quantity bounds 1–1,000,000, stock bounds 0–2,147,483,647, query minimum 1, defaults page=1/limit=20 and limit maximum 100 were verified. On the retained disposable PostgreSQL container, an authenticated Gateway RECEIPT with quantity 1.5 returned 400 INVALID_INPUT. SQL before/after matched: tested product balance 2, movement count 1 and total retained results 98; no write occurred.

API lint, format check, typecheck and build all exited 0. The first format check reported the edited DTO formatting; Prettier corrected it and the final check passed. No new automated test files, dependency/config changes or migrations were added or run. Existing no-Jest-tests limitation remains; unrelated applications and earlier runtime matrices were not rerun for this Swagger-only change. T001–T042 are complete in both task lists. No extensions.yml exists; before/after implement hooks skipped. Isolated API/Gateway stopped and disposable PostgreSQL/Redis containers stopped and retained. Next workflow step when requested: `$speckit-converge`.
