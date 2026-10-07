# Tasks: Frontend Inventory Management

## Current learning scope — user amendment, 2026-10-07

The active goal is a basic frontend for learning: left sidebar, server-paginated stock table, product Inventory drawer, receipt/issue form and immutable history. Retain existing authentication/authorization, a frozen key/body for manual retry and duplicate-submit protection. Verify normal receipt/issue, input validation, admin/customer access, basic API/read errors and same-key retry without a second movement. Preserve evidence already obtained; do not repeat unchanged behavior.

Complex response/modal/session/latch races, native bfcache/browser lifecycle variants, clock/deadline/expiry verification and the authentication/refresh fault matrix are **DEFERRED** (D001–D004 in tasks). Existing implementations and bounded historical evidence remain; this amendment changes verification priorities, not the backend contract or a promise to remove guards. Deferred or unrun cases are not PASS and do not block this learning goal. No new helper/proxy fault or advanced verification; converge requires a separate user request. The detailed original scenarios below are historical/full-scope reference wherever they exceed this amendment.


**Input**: `specs/003-frontend-inventory/` | **Generated**: 2026-10-06 | **Status / Trạng thái**: T001–T029 retained/completed; basic learning UI implemented. T030 basic smoke completed with retained and new evidence; T031 scope/documentation complete. D001–D004 deferred. T030 cleanup: disposable stack stopped with data retained; direct DEV URL http://localhost:3002/inventory.

Language: **English** | [Tiếng Việt](vi/tasks.vi.md)

**Prerequisites**: [plan](plan.md), [spec](spec.md), [research](research.md), [states](data-model.md), [UI contract](contracts/ui-contract.md), [quickstart](quickstart.md), constitution.

No new automated test files. Verification tasks mean manual browser/Gateway/real PostgreSQL evidence or existing quality gates. No backend/migration/search work. Only these two task documents are generated now.

Each task includes ID, exact paths, dependencies and acceptance in its description. [P] only after prerequisites and for disjoint files; never parallelize evidence writers. English tasks.md is canonical; Vietnamese mirrors IDs/order/status.

## Phase 1: Setup

- [X] T001 Verify Node24/independent installs, conventions and isolated migrated PostgreSQL/Redis; initialize bilingual evidence with every scenario NOT RUN; do not mutate shared data. Files: `package.json`, `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: none.
- [X] T002 Install only antd6.6.5 and nextjs-registry1.3.0 in web; inspect npm ls peer/cssinjs/React graph, avoid v5 patch and unnecessary dependencies; record actual resolved versions. Files: `apps/web/package.json`, `apps/web/package-lock.json`. Depends on: T001.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 2: Foundational — blocks all stories

- [X] T003 [P] Add AntdRegistry around existing provider and ConfigProvider Vietnamese locale/AntD App inside existing Redux/bootstrap; keep compound Ant components client-side. Verify no second Redux store/bootstrap. Files: `apps/web/app/layout.tsx`, `apps/web/components/app-provider.tsx`. Depends on: T002.
- [X] T004 [P] Scope legacy form/label/input/button CSS to auth/dashboard; add minimal inventory spacing/overflow/focus without global reset. Acceptance: Ant tables/forms/modal unaffected by legacy selectors and auth styles preserved. Files: `apps/web/app/globals.css`. Depends on: T002.
- [X] T005 [P] Define plain typed ProductSummary/StockItem/Movement/Page/read-resource/frozen-operation shapes and statuses per data-model; no API wrapper, helper/hook framework, new Redux slice or persistence. Files: `apps/web/lib/inventory-types.ts`. Depends on: T002.
- [X] T006 [P] Configure Next external /api/v1/:path* rewrite to server-only GATEWAY_ORIGIN(default localhost3004); validate HTTP(S) origin, document same-origin NEXT_PUBLIC_API_URL=/api/v1 and reject invalid deployment configuration. Files: `apps/web/next.config.ts`, `apps/web/.env.local.example`. Depends on: T002.
- [X] T007 Use shared relative Axios base /api/v1 and add inventory-only actor/deadline metadata checks before/after refresh and immediately before dispatch/401 replay; preserve exact key/body, effective token/session identity, one-flight refresh and single replay. Distinguishable local block reasons; non-inventory auth behavior unchanged. Check operation-owned signal cancellation before refresh, after awaited refresh and immediately before initial dispatch/replay; preserve signal on replay, never cancel shared refresh. Files: `apps/web/lib/api.ts`. Depends on: T003, T004, T005, T006.
- [X] T008 Verify foundation manually: production cold-load registry/styles and login/register/dashboard; rewrite cookie/Bearer forwarding, readable Retry-After/Gateway429/502/API503; login/refresh/logout and Google start/callback(fully run or document unavailable credentials). Record no runtime claim from peer metadata alone. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T007.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 3: US1 — Authorized stock (P1, read-only MVP)

Independent acceptance: US1/AC1–4: waiting/login/customer/admin and 45-product pagination; no movements needed.

- [X] T009 [US1] Create /inventory route and client management owner; reuse useAuth initialized/admin gate, waiting/no inventory requests, signed-out login and customer denied; sidebar Inventory/dashboard/sign-out, entry reconciliation reminder. No POST control yet. Files: `apps/web/app/inventory/page.tsx`, `apps/web/components/inventory-management.tsx`. Depends on: T008.
- [X] T010 [P] [US1] Add Inventory entry only for admin on existing dashboard, preserve customer view and existing login destination; no Product CRUD/search navigation. Files: `apps/web/components/protected-dashboard.tsx`. Depends on: T009.
- [X] T011 [US1] Implement stock GET/Table with productId rowKey/name/SKU/status/stock/action, local controlled page/limit/total default1/20 sizes10/20/50/100 resetpage1; safe offsets, out-of-range/empty/loading/error/read retry, AbortController+generation/actor checks; no fakezero/search/sorter. Files: `apps/web/components/inventory-management.tsx`. Depends on: T009.
- [X] T012 [US1] Verify US1/AC1–4 and SC001: all session roles/late403, 45 products→20/20/5 total45, size/reset/out-of-range/zero/inactive, slow/error/readretry and stale page responses; no movement required. Capture sanitized screenshots/network evidence. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T010, T011.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 4: US2 — Product drawer/history (P1)

Independent acceptance: US2/AC1–4: existing/empty history and independent 45-fact pagination, no UI writes needed.

- [X] T013 [US2] Build typed drawer UI identity/status/stock and history Table fields actorUUID/reason/UTC/type/quantity/before/after, no edit/delete; independent loading/empty/error/read retries. No form submit until US3. Files: `apps/web/components/inventory-drawer.tsx`. Depends on: T012.
- [X] T014 [US2] Wire selected-product stock/history GETs, separate pagination/default20/resetproduct,size,reopen; preserve table page/size. Invalidate/cancel stale product/page/actor reads, clear unsent draft on close/reopen; no history merge/cache. Files: `apps/web/components/inventory-management.tsx`. Depends on: T013.
- [X] T015 [US2] Verify US2/AC1–4/SC002: 45 history facts→20/20/5 independently of stock; empty/missing/inactive/currentcatalog/UTC, section errors and rapid switch/delayed responses; retain table page on close/reopen. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T014.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 5: US3 — Receipt/issue (P1)

Independent acceptance: US3/AC1–5: 10→3→rejected8 leaves7/two facts; inactive and reset/refresh rules.

- [X] T016 [US3] Implement AntForm Select defaultRECEIPT, empty InputNumber/TextArea, exactenum/numericinteger1..1e6/trimreason1..500codepoints; allow INACTIVE. New submit requires ready selected stock, not history; disable edit/submit for nonterminal operation. No maxlength UTF16 rejection of500emoji. Files: `apps/web/components/inventory-drawer.tsx`. Depends on: T015.
- [X] T017 [US3] Before enabling writes implement local departure confirmation/invalidation for close/mask/Escape/switch/menu/dashboard/logout/login and conditional default beforeunload for nonterminal operation; cancel retains all, confirm discard before action, no backend cancellation claim/persistence. US5 expands lifecycle coverage. Mark discarded and abort operation signal before clearing references/actions; prevent delayed refresh dispatch. Files: `apps/web/components/inventory-management.tsx`. Depends on: T016.
- [X] T018 [US3] Implement submit handler sync-ref latch, frozen actor/product/normalizedpayload, UUID once/new operation, firstDispatch+24h; direct shared Axios POST exactlyone key, inventory actor/deadline metadata, timeout15s. Late callbacks check generation/identity/actor; POST never from effect. Track operation lifetime/signal, attempt ID and actual dispatch provenance; always finish matching live attempt/latch independent of UI authorization, privately retaining result. Files: `apps/web/components/inventory-management.tsx`. Depends on: T017.
- [X] T019 [US3] Implement success/replay and definite rejection transitions: drawer open resetqty/reason keeptype, success independently refreshes table/stock/history1; stock409 reset/reloadstock and blocknew untilready;400 field errors keep draft. Uncertain/transient fallback retains frozen operation/guard until US4, never silently unlock/newkey. Recognized terminal stock-error replay settles earlier uncertainty and follows reset/reload; attempt-only rejection does not. Files: `apps/web/components/inventory-management.tsx`, `apps/web/components/inventory-drawer.tsx`. Depends on: T018.
- [X] T020 [US3] Verify US3/AC1–5/SC003/006 on real disposable PG:receipt10/issue3/reject8→7/two facts, exact-stock/INACTIVE, integer/max/Unicode500/501, doubleclickonePOST/newoperationnewkey, historyerrorallowed/stockerrorblocked, refreshfail GETonly, guard active during write. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T019.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 6: US4 — Same-operation recovery (P1)

Independent acceptance: US4/AC1–5: held/lostresponse same-key recovery one fact; auth/delay/cutoff correctness.

- [X] T021 [US4] Implement recovery state classification:IN_PROGRESS distinct;500/502/noresponse/unknown503 uncertain;known429/API503 preserve identity and prioruncertainty;later400/401/403 never erase priorunknown;matching terminal201/404/stock409 settles scoped operation;KEY_REUSED blocked not newkey. No in-place abandon action. Apply the four authentication provenance rows and Q1 precedence from UI contract, not a combined 401/403 branch. Files: `apps/web/components/inventory-management.tsx`. Depends on: T020.
- [X] T022 [US4] Implement manual one-attempt Retry using frozen body/key/latch; honor Retry-After seconds/date without shortening, fallback1/2/4/8/16/30s+jitter0–250ms capped30s; timer only display, clear on retire/unmount, no automaticPOST. Check24hdeadline click and dispatch; blocked cutoff requires reconciliation/confirmeddeparture. Files: `apps/web/components/inventory-management.tsx`. Depends on: T021.
- [X] T023 [US4] Handle session failure/different admin without auto-redirect while operation exists: hide protected catalog/history/payload, keep mounted recovery, guardedlogin; same-admin in-place restore allowsretry. Recheck dispatch guard failures distinctly and do not publish late protected results after access loss. Release matching live attempt latch even after access loss; keep hidden terminal result/recovery, original-admin restoration applies terminal result once without POST or offers same-key retry for unknown. Files: `apps/web/components/inventory-management.tsx`. Depends on: T022.
- [X] T024 [US4] Render persistent sanitized recovery Alert/frozen values for authorized original admin, retry countdown/disabled reasons and conflict/cutoff reconciliation; keep form locked for allnonterminal states and read retries usable independently. Hidden-access view must omit sensitive payload. Files: `apps/web/components/inventory-drawer.tsx`. Depends on: T023.
- [X] T025 [US4] Verify US4/AC1–5/SC004/007:realPG held original→IN_PROGRESS/RetryAfter/samekey; temporary proxy loses committed response→replayonefact/ledgerexact. Label display-only stubs; check429/503/500/502/priorunknown/conflict/delay/cutoff and automatic401 identity/body/deadline races, sameadminrestore/differentadmin0POST, no auto-loop/key persistence. Verify terminal stock-error replay after lost response resolves recovery; current-attempt rejections preserve unknown. Exercise all four auth cases with/without prior uncertainty and POST results during access loss/actor change, latch released/no protected publication/restore behavior. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T024.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 7: US5 — Protected departure/return (P1)

Independent acceptance: US5/AC1–4: cancel preserves, confirm discards; reload/bfcache sends0 restoredPOST.

- [X] T026 [US5] Complete departure lifecycle:recheck operation identity when modal resolves, discard/invalidate before confirmedaction;pagehide/unmount must abort the operation signal before discard/clearing refs, timers and reads to prevent subsequent dispatch/replay; abort does not prove database rollback or backend cancellation; persistedpageshow clear oldoperation/draft/resources then authorizedfreshGET/reminder, no historysentinel/routerpatch. Abort operation signal before discard and navigation, including pagehide/unmount; an already-dispatched backend transaction remains possibly committed. Files: `apps/web/components/inventory-management.tsx`. Depends on: T025.
- [X] T027 [US5] Verify US5/AC1–4/SC005 every close/mask/Escape/switch/menu/dashboard/logout/login cancel/confirm while sending/uncertain/blocked; pending-modal response race and late response after newselection ignored. Check default beforeunload where browser permits, no protection unsentdraft/successrefreshfail, reload/bfcachereturnfreshreads/reminder0POST/no recovery storage; document nativeBackForward limits. Delay preflight refresh then confirm departure: zero initial POST after completion. Delay refresh after POST401 then depart: zero replay; cancelling confirmation keeps same operation. Verify no callback/latch from old operation changes a newer one. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T026.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Phase 8: Polish & cross-cutting verification

- [X] T028 Audit keyboard/focus/labels/UTC/Vietnamese states/scrolling and noSSRstyleflash/hydration warnings in production coldload and navigation; correct scoped CSS/provider regressions; capture sanitized UI screenshots and rerun affected checks only. Files: `apps/web/components/inventory-management.tsx`, `apps/web/components/inventory-drawer.tsx`, `apps/web/app/globals.css`, `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T027.
- [X] T029 Run root npm run check(lint/format/typecheck all apps), npm run build and relevant existing tests; fix affected failures and record exit/status/omissions. NoTestsFound is absentcoverage notPASS; add no tests to hide it. Files: `package.json`, `apps/web/package.json`, `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T028.
- [X] T030 Optional current-session basic smoke by the user at http://localhost:3102/inventory: normal admin login, sidebar/table/drawer/history, receipt/issue and field validation; customer denied. Existing unchanged-flow evidence is retained; do not label this new smoke run PASS until observed. No advanced faults or mandatory Google flow. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T029. Non-blocking for learning.
- [X] T031 Record the user-amended basic learning scope and bilingual implemented/verified/deferred/not-run summary; retain historical evidence, clean temporary helpers and leave the existing disposable stack normal for direct use. No full advanced acceptance claim or converge. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`, both task lists. Depends on: T029; independent of optional T030.

Checkpoint: finish and verify before the next phase; do not enable POST before T017 departure protection.

## Dependencies & Execution Order

```text
T001 → T002 → [T003 || T004 || T005 || T006] → T007 → T008
→ T009 → [T010 || T011] → T012
→ T013 → T014 → T015
→ T016 → T017 → T018 → T019 → T020
→ T021 → T022 → T023 → T024 → T025
→ T026 → T027 → T028 → T029 → [T030 optional | T031 documentation]
```

US1 is independent of movements; US2 can use existing history without UI writes. US1→US2→US3→US4→US5 is the chosen incremental order because owner/drawer are shared, not permission to edit them concurrently. Each phase has independent manual acceptance. T017 introduces required protection before writes; T026 completes lifecycle/races/browser return rather than delaying basic safety until US5.

### Parallel opportunities per story

| Group | Prerequisites | Safe peers | Join |
|---|---|---|---|
| Foundation | T002 | T003 provider/layout, T004 CSS, T005 types, T006 config/env | T007 |
| US1 | T009 | T010 dashboard, T011 stock owner | T012 |
| US2 | T012 | none: drawer then owner integration | T015 |
| US3 | T015 | none: form/owner/guards mutually sequenced | T020 |
| US4 | T020 | none: recovery/auth owner then drawer | T025 |
| US5 | T025 | none: lifecycle then evidence | T027 |

Five [P] markers (T003–T006,T010). T011 is the explicitly safe peer of T010; do not parallelize evidence writers or two owner/drawer edits. These opportunities are not instructions to spawn agents.

## Requirement and acceptance traceability

| Source | Implementation | Verification |
|---|---|---|
| US1/AC1, FR001, SC001 | T009/T011/T023 | T012/T025 |
| US1/AC2, FR002 | T003/T004/T009/T010/T011 | T008/T012/T028 |
| US1/AC3, FR003, SC002 | T011 | T012 |
| US1/AC4, FR005, SC006 | T011 | T012 |
| US2/AC1, FR004 | T013/T014 | T015 |
| US2/AC2, FR003, SC002 | T013/T014 | T015 |
| US2/AC3, FR005 | T013/T014/T016 | T015/T020 |
| US2/AC4, FR004 | T014 | T015 |
| US3/AC1, FR006/007, SC004 | T016/T018 | T020 |
| US3/AC2, FR006, SC003 | T016/T019 | T020 |
| US3/AC3, FR011 | T019 | T020/T030 |
| US3/AC4, FR009, clarifyQ5 | T019/T021 | T020/T025 |
| US3/AC5, FR005/011, SC006 | T019 | T020 |
| US4/AC1, FR007/010 | T021/T024 | T025 |
| US4/AC2, FR008/010, SC007 | T007/T022/T024 | T025 |
| US4/AC3, FR009 | T021/T024 | T025 |
| US4/AC4, FR008/009 | T019/T021 | T025/T030 |
| US4/AC5, FR015, clarifyQ1 | T007/T023/T024 | T025 |
| US5/AC1, FR012, SC005 | T017/T026 | T020/T027 |
| US5/AC2, FR012/014 | T017/T026 | T027 |
| US5/AC3, FR013 | T017/T026 | T027 |
| US5/AC4, FR014 | T009/T026 | T027 |
| clarifyQ2 stock ready/history error | T014/T016/T019 | T020 |
| clarifyQ3 success reset | T019 | T020 |
| clarifyQ4 no in-place abandon | T021/T024 | T025/T027 |
| FR016, constitution, no tests/scope | T001/T002/T005 | T029/T030/T031 |
| plan registry/styles/accessibility | T002/T003/T004 | T008/T028/T029 |
| plan rewrite/cookies/Retry-After | T006/T007 | T008/T025/T030 |
| plan actor/deadline/interceptor races | T007/T018/T022/T023 | T025 |
| plan late callbacks/modal/bfcache | T014/T018/T026 | T015/T027 |

## Implementation Strategy

1. Complete setup/foundation then US1 read-only MVP; verify authorization/pagination before drawer/writes.
2. Add US2 drawer/history and independently validate with existing facts.
3. Add US3 form/pre-POST guards/normal outcomes; unknown failures stay locked until US4 recovery. US3 is not the complete feature milestone.
4. Prove US4 same-key/manual retry/auth/deadline and US5 departure/races/bfcache.
5. Finish quality/full regression/evidence map; mark completion only with implementation and actual evidence. A tasks file does not authorize commit/deploy/migration.

## Generation outcome

31 tasks: setup2, foundation6, US1=4, US2=3, US3=5, US4=5, US5=2, polish4. Five [P]. All checkboxes unexecuted; paths/dependencies/labels/traceability/parity validated at generation, not runtime success. No extensions.yml: before/after tasks hooks skipped. Only tasks.md and vi/tasks.vi.md created. Next requested step: `$speckit-analyze`.

## Deferred verification — no automatic execution

These unchecked entries mean deferred, not PASS or a requirement to rerun historical evidence. Resume only on explicit user request; prepare no new helpers/faults now.

- [ ] D001 DEFERRED: complex overlapping/stale responses, modal/new-operation races, actor publication and older callback/latch isolation. Historical T012/T015/T025/T027 evidence retained with its limits.
- [ ] D002 DEFERRED: bfcache, native beforeunload/BackForward/reload variants and cross-browser delivery guarantees. Actual Chrome observations in T027 remain historical evidence, not universal PASS.
- [ ] D003 DEFERRED: FE clock/deadline and backend idempotency expiry verification. Seeded expiry/temporary clock evidence retains its stated boundaries; no claim of a full real24h deadline run.
- [ ] D004 DEFERRED: four authentication/refresh fault branches, actor/permission change and late-completion/session-restoration matrix. Normal existing auth/admin/customer access remains in basic scope.
