# Tasks: Single-Warehouse Inventory

**Input**: Design artifacts in `specs/002-inventory-balances/`.
**Branch**: `002-inventory-balances` | **Generated**: 2026-10-06
**Status**: Implementation complete; T001–T042 verified. See [validation.md](validation.md) for actual outcomes and omissions.

Language: **English** | [Tiếng Việt](vi/tasks.vi.md)

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [API contract](contracts/inventory-api.md), [quickstart.md](quickstart.md), and `.specify/memory/constitution.md`.

**Verification policy**: No new automated test files. Manual API/real-database evidence and existing quality gates remain required. Implementation evidence is recorded in `validation.md` / `vi/validation.vi.md`; these were created during implement, not task generation. All writes stay within the feature scope. No source, migration or runtime changes during task generation.

## Format and path conventions

Every item uses `- [ ] Tnnn [P?] [USn?] description` followed by exact repository-relative file paths and explicit task prerequisites. `[P]` means it can run alongside the named safe peer tasks after its prerequisites finish; it never overrides dependencies or permits concurrent edits to the same file. Story labels appear only in story phases. `tasks.md` is the execution checklist; `vi/tasks.vi.md` mirrors IDs/order/status, not a second backlog. Keep checkbox states synchronized during implement.

The migration filename is concretely planned as `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`, greater than current migrations. T006 rechecks uniqueness/order at implementation time; if another migration now occupies that timestamp, choose the next valid one and update both task documents consistently. No new dependencies/environment variables or Product seed integration are planned.

## Phase 1: Setup (Shared Infrastructure)

Prepare existing tools/environment and the feature skeleton without building a new application.

- [X] T001 Verify Node.js 24, independent package installs, ignored environment configuration and isolated PostgreSQL/Redis prerequisites; read backend/database/Gateway conventions and initialize a sanitized verification record with every runtime scenario marked not run. Files: `package.json`, `apps/api/package.json`, `apps/gateway/package.json`, `apps/web/package.json`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: none.
- [X] T002 Create the inventory module/controller/service skeleton under the existing API layout, with no public movement routes until their story is complete; reuse existing dependencies and auth infrastructure. Files: `apps/api/src/inventory/inventory.module.ts`, `apps/api/src/inventory/inventory.controller.ts`, `apps/api/src/inventory/inventory.service.ts`. Depends on: T001.

**Checkpoint**: Complete and verify Phase 1 before the next serial phase.

## Phase 2: Foundational (Blocking Prerequisites)

Finish schema/entities/DTOs/error/auth/module wiring before any story endpoint. T003–T008 are safe parallel work after T002; T009 joins them.

- [X] T003 [P] Define balance entity with explicit snake_case mappings, UUID product PK/FK, bounded integer stock and timestamptz update time; missing row represents logical zero. Files: `apps/api/src/inventory/inventory-balance.entity.ts`. Depends on: T002.
- [X] T004 [P] Define movement entity with server UUID/product/actor, type/quantity/reason/before/after/time, RESTRICT relationships and history/actor indexes; no catalog snapshots or update/delete behavior. Files: `apps/api/src/inventory/stock-movement.entity.ts`. Depends on: T002.
- [X] T005 [P] Define completed-result entity, exact actor/operation/case-sensitive-key uniqueness, request hash/product UUID, status/body/movement reference and 24-hour expiry; deliberately omit product FK for replayable nonexistent-product errors. Files: `apps/api/src/inventory/inventory-idempotency-result.entity.ts`. Depends on: T002.
- [X] T006 [P] Create a new transactional migration matching every field/check/FK/index in data-model.md, including movement delta bigint checks and result outcome/expiry checks; up creates three tables without backfill, down drops results/movements/balances. Recheck timestamp uniqueness/order before creating this planned filename; never edit applied migrations or enable synchronize. Files: `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`. Depends on: T002.
- [X] T007 [P] Implement an Inventory-scoped exception filter for the documented status/code/message envelope, sanitized 500 and timeout 503 with Retry-After; preserve existing Product/Auth, pre-controller malformed JSON and Gateway error contracts. Files: `apps/api/src/inventory/inventory-http-exception.filter.ts`. Depends on: T002.
- [X] T008 [P] Define shared stock/history/movement response DTOs and strict request/query DTOs: page/limit defaults, safe offset, UUIDs, JSON-number integer quantity 1–1,000,000, exact type, trimmed reason 1–500 Unicode code points, unknown-field rejection and no-query DTO where required. Files: `apps/api/src/inventory/inventory.dto.ts`. Depends on: T002.
- [X] T009 Register entities/service/controller/filter in InventoryModule and import it into AppModule; apply existing AccessTokenGuard and admin requireRole to every inventory endpoint, enforce auth-before-validation/replay, preserve /api/v1 prefix and existing entity/migration discovery. Files: `apps/api/src/inventory/inventory.module.ts`, `apps/api/src/inventory/inventory.controller.ts`, `apps/api/src/app.module.ts`. Depends on: T003, T004, T005, T006, T007, T008.

**Checkpoint**: Complete and verify Phase 2 before the next serial phase.

## Phase 3: US1 — View stock (P1, read-only MVP)

Independent acceptance: stock reads return zero for existing/demo/new untouched products, include active/inactive products, obey pagination and distinguish 400/401/403/404; no balance row is created. No movement endpoint is needed; all-zero data is sufficient.

- [X] T010 [US1] Implement single-product stock using products LEFT JOIN balances and COALESCE zero, returning current ProductSummary for active/inactive products; valid nonexistent product returns PRODUCT_NOT_FOUND and reads never initialize rows. Files: `apps/api/src/inventory/inventory.service.ts`. Depends on: T009.
- [X] T011 [US1] Implement product-ID-ascending stock pagination including all zero/active/inactive products; items/count use one read-only REPEATABLE READ snapshot, limits/offset follow contract and out-of-range page returns empty items. Files: `apps/api/src/inventory/inventory.service.ts`. Depends on: T010.
- [X] T012 [US1] Expose GET /inventory and GET /inventory/:productId with UUID/query validation and stock envelopes; document authorization, pagination, zero-stock and 400/401/403/404/500/503 responses in Swagger. Files: `apps/api/src/inventory/inventory.controller.ts`. Depends on: T011.
- [X] T013 [P] [US1] Add stock-list/detail/zero/inactive/missing/invalid/auth requests to the existing Postman collection without changing auth/product requests or storing credentials. Files: `apps/api/postman/inventory.postman_collection.json`. Depends on: T011.
- [X] T014 [US1] Verify US1 through Gateway on existing/demo/new products: zero, active/inactive inclusion, stable pagination, 404, malformed UUID/query 400, customer 403 and no/invalid token 401; retain sanitized responses and confirm reads create no balance rows. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T012, T013.

**Checkpoint**: Complete and verify Phase 3 before the next serial phase.

## Phase 4: US2 — Receive stock (P1)

Independent acceptance: receipt 10 then 5 gives stock 15 and two movements; invalid input does not mutate; in-flight duplicate returns 409 and completed retry returns one original result. Use US1 reads plus SQL to inspect movements before US4.

- [X] T015 [US2] Enforce exactly one raw Idempotency-Key header with the contract ASCII regex and no trimming; compute canonical normalized payload SHA-256 and namespaced signed 64-bit lock ID without JavaScript Number loss, using authenticated actor and operation inventory.movement.v1. Files: `apps/api/src/inventory/inventory.controller.ts`, `apps/api/src/inventory/inventory.service.ts`. Depends on: T014.
- [X] T016 [US2] Implement same-manager READ COMMITTED key ownership with pg_try_advisory_xact_lock, immediate IN_PROGRESS/Retry-After, exact-scope result lookup, canonical conflict detection, original status/body replay, fixed 24-hour expiry and transactional expired-result replacement; retain no durable PROCESSING state. Emit one post-transaction outcome event for replayed/in_progress/conflict branches through the existing logger, with sanitized status/error category; no raw key/fingerprint/body or new metrics stack. Files: `apps/api/src/inventory/inventory.service.ts`. Depends on: T015.
- [X] T017 [US2] Implement RECEIPT transaction: product lookup including inactive; savepoint before zero-row upsert; balance FOR UPDATE; pre-write ceiling check; stock update, monotonic SQL microsecond timestamp, movement and serialized 201 result commit together. Commit cached 404/STOCK_LIMIT_EXCEEDED without stock mutation (rollback initialization to savepoint); no network/global repository inside transaction. Roll back storage errors, map transient failures, guard idle transactions and handle uncertain COMMIT using same-key reconciliation; respond only after transaction end. Emit completed only after confirmed terminal-result COMMIT; classify confirmed rollback as transient_failure/persistence_failure and lost acknowledgment as outcome_uncertain without asserting unchanged stock. Include exactly one outcome event per eligible attempt and no sensitive payload. Files: `apps/api/src/inventory/inventory.service.ts`. Depends on: T016.
- [X] T018 [US2] Expose POST /inventory/:productId/movements receipt handling with committed success/error/replay outcomes and Retry-After headers; document required key, exact body, errors, actor/server fields and no automatic service retries. Keep ISSUE unavailable until T023–T024 complete rather than silently treating it as receipt. Files: `apps/api/src/inventory/inventory.controller.ts`. Depends on: T017.
- [X] T019 [P] [US2] Add receipt, same-key replay, changed-key-payload conflict and duplicate/missing/invalid-key requests; add empty reusable idempotencyKey/receiptKey/issueKey/retryKey environment placeholders and prevent replay requests from generating a fresh key. Files: `apps/api/postman/inventory.postman_collection.json`, `apps/api/postman/local.postman_environment.json`. Depends on: T018.
- [X] T020 [P] [US2] Implement expired-result cleanup in short transactions, expiry/id order with FOR UPDATE SKIP LOCKED, ≤1,000 rows/batch and ≤20 batches/run; never delete movements or unexpired results, stop between batches on shutdown and keep key reuse independent of cleanup. Files: `apps/api/src/inventory/inventory-idempotency-cleanup.service.ts`. Depends on: T018.
- [X] T021 [US2] Register hourly 0 0 * * * * UTC cleanup using existing scheduler; add process overlap guard, graceful stop/await current batch, next-hour retry after failure and sanitized count/duration summaries, with fixed constants and no new environment variables. Files: `apps/api/src/inventory/inventory-idempotency-cleanup.job.ts`, `apps/api/src/inventory/inventory.module.ts`. Depends on: T020.
- [X] T022 [US2] Verify US2 receipts 10 then 5 produce balance 15 and two immutable movement rows; invalid quantity/reason/body/key changes nothing, inactive receipts work, ceiling failure replays, original success replays after later stock changes, and receipt first-write races serialize. Capture SQL evidence before history endpoint exists; also hold an original request to verify immediate in-progress 409 and same-key replay after it completes. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T019, T021.

**Checkpoint**: Complete and verify Phase 4 before the next serial phase.

## Phase 5: US3 — Issue stock (P1)

Independent acceptance: with stock 10, issue 3 leaves 7; issue 8 returns 409 INSUFFICIENT_STOCK without new movement; issue 7 succeeds to zero. Seed stock via US2 and inspect via US1/SQL, not US4.

- [X] T023 [US3] Extend the shared movement transaction with ISSUE handling under the balance lock: quantity above stock rolls back savepoint initialization and commits cached INSUFFICIENT_STOCK only; exact-stock issue succeeds to zero, never negative; reuse existing key/expiry/atomic result/timestamp logic. Files: `apps/api/src/inventory/inventory.service.ts`. Depends on: T022.
- [X] T024 [US3] Enable ISSUE in the same POST endpoint, update Swagger examples/errors for both types and ensure controller returns committed error/result with existing key semantics, without adding a second write route. Files: `apps/api/src/inventory/inventory.controller.ts`. Depends on: T023.
- [X] T025 [P] [US3] Add successful/exact-stock/insufficient/inactive issue and cached-failure-after-receipt requests using explicit independent/new/replayed keys in the existing Postman collection. Files: `apps/api/postman/inventory.postman_collection.json`. Depends on: T023.
- [X] T026 [US3] Verify issue 3 from 10 yields 7, issue 8 returns cached 409 without movement, issue 7 reaches zero and inactive issues work; rejected first issues create no balance row, new key after replenishment can succeed while the old error key still replays. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T024, T025.

**Checkpoint**: Complete and verify Phase 5 before the next serial phase.

## Phase 6: US4 — Review history (P2)

Independent acceptance: successful receipt/issue facts are returned newest-first, paginated, empty for untouched products and retained after deactivation; catalog edits change only current display fields; rejected/edit/delete requests do not mutate history.

- [X] T027 [US4] Implement history items/count in one read-only REPEATABLE READ snapshot, product existence checks, empty-history behavior and created_at DESC/id DESC indexed ordering; join current name/SKU/status and preserve full database timestamp precision during sorting. Files: `apps/api/src/inventory/inventory.service.ts`. Depends on: T026.
- [X] T028 [US4] Expose GET /inventory/:productId/movements with shared pagination/UUID/auth rules, HistoryItem envelopes and Swagger errors; expose no movement update/delete endpoints. Files: `apps/api/src/inventory/inventory.controller.ts`. Depends on: T027.
- [X] T029 [P] [US4] Add history ordering/pagination/empty/missing/inactive/current-catalog requests and append-only negative-route checks to the existing Postman collection. Files: `apps/api/postman/inventory.postman_collection.json`. Depends on: T027.
- [X] T030 [US4] Verify US4 movement product/type/quantity/before/after/actor/reason/UTC time, newest-first order and page boundaries; catalog rename/SKU changes only displayed product data, deactivation preserves history, rejected actions add no movement and unsupported edit/delete requests leave history unchanged. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T028, T029.

**Checkpoint**: Complete and verify Phase 6 before the next serial phase.

## Phase 7: Polish & Cross-Cutting Concerns

Complete bilingual guides and full quickstart evidence; no new test files or unrelated infrastructure. Tasks here run only after all stories are complete. T031/T032 can run in parallel; evidence-writing tasks run serially.

- [X] T031 [P] Write the English inventory guide covering database ownership, endpoints, inactive policy, key scope/24-hour expiry, cached business errors, in-progress/retry, original replay versus current GET, atomicity and migration rollback limits; link feature artifacts and sanitized verification. Files: `docs/en/inventory/INVENTORY_SPEC.md`. Depends on: T030.
- [X] T032 [P] Write the matching Vietnamese inventory guide with identical fields/statuses/codes/key lifecycle/transaction/migration behavior; preserve all confirmed business decisions. Files: `docs/vi/inventory/INVENTORY_SPEC.md`. Depends on: T030.
- [X] T033 Add correct links to the new English/Vietnamese inventory guides in documentation indexes, without rewriting unrelated existing domains. Files: `docs/README.md`, `docs/vi/README.md`. Depends on: T031, T032.
- [X] T034 Execute the full scope/fingerprint/replay/retention matrix: two admins and refreshed same-admin token, cross-product/type/quantity/reason conflicts, equivalent JSON/trim, cached 404/stock errors, uncached validation/auth, expiry replacement without scheduler and no replay TTL extension; record actual outcomes in both languages. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T030.
- [X] T035 Run disposable-DB rollback/fault/crash scenarios after balance update, after movement insert and after result insert before commit; distinguish crash before commit, after committed lost response and lost COMMIT acknowledgment, confirm same-key reconciliation produces exactly one outcome and transient errors are not cached. Add no permanent fault switches/test files. Use temporary disposable-PostgreSQL constraints/triggers to reject movement INSERT, result INSERT and deferred COMMIT actually awaited by the service; observe exception propagation and confirmed rollback before removing each fixture. Do not use console SQL outside the callback as evidence. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T034.
- [X] T036 Run real-DB/Gateway SC-001/SC-002/SC-006 and mixed/first-write races: ten distinct-key issues from five units yield five successes/five insufficient errors, duplicate blocked original returns IN_PROGRESS within controlled local <1s with Retry-After, then original replay; repeat changed payload in-flight/after commit, verify no negative balance and zero ledger-reconciliation rows. A 429-contaminated run must be repeated. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T035.
- [X] T037 Verify cleanup batch caps/expiry boundary/backlog/locked rows/multiple instances/process overlap/shutdown/next-run failure recovery; prove movements and unexpired results survive and expired key reuse succeeds independently of cleanup; inspect representative query plans without assuming small-table sequential scans are failures. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T036.
- [X] T038 Verify full-chain migration on fresh and existing disposable databases, zero for existing/demo products and preserved Product/Auth data; inspect every check/FK/index, then revert only the new last migration and reapply on disposable/empty data; record destructive-down limits and application rollback retaining schema. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`, `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`. Depends on: T037.
- [X] T039 Run root npm run check and npm run build plus relevant existing API npm test after implementation; fix affected-source failures, rerun only necessary checks and record outputs/limitations. No tests found is omitted coverage, not a passing suite; do not add automated test files. Files: `package.json`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T038.
- [X] T040 Validate final Gateway header/body/status forwarding including raw duplicate-key rejection, Retry-After, 429 and uncertain 502 behavior; audit Swagger/docs-json/Postman and English/Vietnamese parity against the contract, auth/role precedence and secret-safe logs/artifacts; preserve existing routes/policies and auth storage. Verify API 503 directly on port 3001 separately from Gateway 502/503/no-response at 3004, then same-key reconciliation. Verify exactly one outcome event per eligible attempt after transaction end for known results, or after connection discard/release with outcome_uncertain for lost acknowledgment, counts for completed/replayed/in_progress/conflict and error/uncertain cases, no completed before confirmed COMMIT, no replay counted as a new movement and no secret leakage. Files: `apps/gateway/src/main.ts`, `apps/api/postman/inventory.postman_collection.json`, `docs/en/inventory/INVENTORY_SPEC.md`, `docs/vi/inventory/INVENTORY_SPEC.md`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Depends on: T033, T039.
- [X] T041 Finalize synchronized verification records mapping FR-001–FR-012 and SC-001–SC-006 to real evidence, dates/versions/statuses/counts/timing and quality/migration outcomes; explicitly list failed/omitted checks and confirm no frontend/order/distributed-lock/new-test scope was added. Mark tasks complete only when their evidence exists. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`, `specs/002-inventory-balances/tasks.md`, `specs/002-inventory-balances/vi/tasks.vi.md`. Depends on: T040.

**Checkpoint**: Complete and verify Phase 7 before the next serial phase.

## Dependencies & Execution Order

### Phase and story graph

```text
T001 → T002
          ├─ T003 balance entity ───────┐
          ├─ T004 movement entity ─────┤
          ├─ T005 result entity ───────┤
          ├─ T006 migration ───────────┤
          ├─ T007 exception filter ────┤
          └─ T008 DTOs ────────────────┘
                                      ↓
                                     T009
                                      ↓
                      US1 T010–T014 (read-only MVP)
                                      ↓
                      US2 T015–T022 (receipt + replay + cleanup)
                                      ↓
                      US3 T023–T026 (issue)
                                      ↓
                      US4 T027–T030 (history)
                                      ↓
                      Final T031–T041 (guides + evidence + gates)
```

Setup → foundation blocks every story. The selected execution order is US1 → US2 → US3 → US4 because the stories extend the same service/controller/Postman files; do not implement those shared files concurrently. US3 depends on US2's shared transaction and stock preparation; US4 acceptance uses US2/US3 movements. US1 has no functional dependency on movement stories. Each phase can be validated without implementing later phases; this does not mean every story has zero prerequisites. Validate US2/US3 movement facts via SQL before US4 exists.

Every task lists explicit prerequisites. Follow those rather than assuming all same-phase tasks are independent. Before the first runtime validation, apply the new migration only to the configured isolated database using quickstart.md, then start the API/Gateway. For T014, stock reads can be verified before movement routes exist. T038 repeats fresh/existing/up/down/up migration validation as the final lifecycle check. Do not treat a source file's existence or a successful build as runtime evidence.

### Safe parallel examples per story

| Story / group | Completed prerequisites | Safe concurrent work | Join before |
|---|---|---|---|
| Foundation | T002 | T003/T004/T005/T006/T007/T008 (six distinct files) | T009 |
| US1 | T011 | T012 controller + T013 Postman | T014 |
| US2 | T018 | T019 Postman/environment + T020 cleanup service; T021 can follow T020 while T019 finishes | T022 |
| US3 | T023 | T024 controller + T025 Postman | T026 |
| US4 | T027 | T028 controller + T029 Postman | T030 |
| Final | T030 | T031 English guide + T032 Vietnamese guide; T034 may start separately but evidence tasks remain serial | T033/T040 |

These are scheduling opportunities, not instructions to spawn agents. Never run tasks writing validation.md/vi/validation.vi.md simultaneously. The 13 `[P]` markers identify safe participants; unlabeled endpoint tasks above are safe peers in the specifically listed pair, not a license to parallelize arbitrary controller edits.

## Requirement traceability

| Requirements / decisions | Implementation tasks | Verification tasks |
|---|---|---|
| FR-001 / SC-004 admin auth | T007–T009, T012/T018/T024/T028 | T014, T034, T040 |
| FR-002 zero/single warehouse | T003/T006, T010–T011, T017/T023 | T014/T022/T026/T038 |
| FR-003 quantity/ceiling | T004/T006/T008, T017/T023 | T022/T026/T036 |
| FR-004 reason/server fields | T004/T008, T015/T017 | T022/T026/T030/T040 |
| FR-005 atomicity / SC-003 | T006/T017/T023 | T035 |
| FR-006 concurrency / SC-002 | T016/T017/T023 | T022/T036 |
| FR-007 ledger/append-only | T004/T006/T017/T023/T027/T028 | T030/T035/T036/T037 |
| FR-008 pagination/order | T006/T008/T011/T027 | T014/T030/T037 |
| FR-009 and confirmed inactive decision | T010–T012/T017/T023/T027 | T014/T022/T026/T030 |
| FR-010 unknown/server-owned fields | T008/T015, endpoint tasks | T014/T022/T026/T040 |
| FR-011 / SC-006 in-flight 409 | T015/T016/T018 | T022/T036/T040 |
| FR-012 current catalog; no snapshot | T004/T010/T027 | T030 |
| Confirmed idempotency + lifecycle | T005/T006/T015–T021 | T022/T026/T034–T037/T040 |
| SC-001 receipt→issue→rejected issue | T017/T023 | T026/T036 |
| SC-005 Swagger/Postman + bilingual docs | T012/T013/T018/T019/T024/T025/T028/T029/T031–T033 | T040/T041 |
| Plan outcome logging (existing logger) | T016/T017/T021 | T040 |
| Migration/quality/verification constraints | T001/T006/T009 | T038–T041 |

Checkboxes below were completed only after actual implementation and evidence; traceability alone was not treated as proof.

## Implementation Strategy

1. Complete setup and foundation. Preserve Node.js 24, independent package installation, existing auth/Gateway boundaries, snake_case and immutable applied migrations.
2. Deliver **read-only MVP: US1**. Existing products need no physical stock backfill. Validate zero/list/detail/auth via Gateway before proceeding. This MVP is not the complete inventory milestone.
3. Add US2 as a complete receipt increment, including idempotency and bounded cleanup before considering it ready. Validate original replay, ceiling, inactive behavior and immediate in-progress response; use SQL for audit facts.
4. Add US3 using the same write route/transaction. Validate receipt→issue→rejection and exact-stock issue. Do not duplicate write orchestration or open a second issue route.
5. Add US4 and validate history/current-catalog/append-only behavior. Complete cross-cutting quickstart scenarios, migration checks, existing quality gates and English/Vietnamese parity. Reuse valid story evidence; rerun only if later changes affect it or a scenario remains unresolved.
6. Record every actual outcome and omission; no new automated test files, frontend, orders, worker/queue or external lock service. Do not commit, publish or deploy merely because a task checklist exists.

## Generation outcome

41 tasks: setup 2, foundation 7, US1 5, US2 8, US3 4, US4 4, final 11. Thirteen tasks have `[P]`. IDs/order/dependencies/story labels/file paths and bilingual checkbox parity are validated. No extensions.yml is present; before/after tasks hooks are skipped. Only tasks.md and vi/tasks.vi.md were generated in this skill run; Implementation, migration, runtime and quality outcomes are now recorded in validation.md.

Analyze and implement completed. Next workflow step when requested: `$speckit-converge`.

## Phase 8: Convergence

- [X] T042 Correct Inventory Swagger schemas to declare whole-unit quantity/balance and integer pagination/count fields as `integer`, retaining the agreed bounds and runtime validation, per FR-002, FR-003, FR-008, SC-005 and plan: API DTO contract (partial; F1, LOW). Evidence: the current generated CreateMovementDto.quantity schema is `number` with minimum/maximum, permitting fractional values despite @IsInt(); stock and pagination response schemas also use `number`. Files: `apps/api/src/inventory/inventory.dto.ts`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`, `specs/002-inventory-balances/vi/tasks.vi.md`. Manually inspect `/docs-json` through Gateway to verify request/query/response integer types and unchanged bounds; confirm a fractional movement quantity still returns 400 without writes on disposable PostgreSQL. Run affected API quality/build checks, record actual outcomes in both languages, and mirror this task ID/status in the Vietnamese checklist during implement. Add no automated test files and preserve all business decisions. Depends on: T041.
