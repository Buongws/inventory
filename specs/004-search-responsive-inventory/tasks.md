# Tasks: Search and Responsive Inventory UI

**Input**: `specs/004-search-responsive-inventory/` — [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [API contract](contracts/inventory-api.md), [UI contract](contracts/ui-contract.md), [quickstart.md](quickstart.md).

**Status**: Implementation complete.23/23 tasks checked. On2026-10-07 the user confirmed all remaining checks passed manually; see validation.md for attribution and evidence limits.

**Organization**: Three spec user stories, all P1, code prerequisites ordered US1→US2→US3 because later stories reuse filter UI/query state. Verification runs on a separate track and never blocks independent code or quality gates merely because evidence is missing. Backend and frontend work are kept within the relevant story. Setup/foundation reuse existing infrastructure; no installation or environment setup is required.

**Constraints**: catalog1/10; history1/20; shared Axios/Redux; preserve auth/details/movement/idempotency. No new dependency/index/abstraction, automatic tests, environment, proxy or fault matrix. Dev data stays unchanged. Verification tasks are manual smoke or existing quality gates, not new automated tests.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with file paths`. `[P]` means different files with no mutual dependency once their common prerequisites are complete; it does not authorize launching agents. Paths are repository-relative. Evidence files are created later by T001, not by this tasks run.

## Phase 1: Setup

Read-only baseline and evidence preparation.

- [X] T001 Read AGENTS.md, constitution and layer conventions; confirm the current source baseline and existing dev stack without starting duplicate processes. Create an initially NOT RUN evidence checklist in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md` from quickstart.md; record FE3002→Gateway3004→API3001, PostgreSQL55433 and Redis6379, existing-data limitations and unchanged feature003 evidence. Do not create fixtures or modify dev data.


## Phase 2: Foundational prerequisites

Depends T001; both tasks block story implementation. T002/T003 are independent.

- [X] T002 [P] Split catalog default10 from history default20 in `apps/web/components/inventory/constants/inventory.ts`; adjust default consumers in `apps/web/components/inventory/hooks/use-inventory-data.ts` only as necessary. Extend stock-only query types in `apps/web/components/inventory/api/api-types.ts` and forwarding in `apps/web/components/inventory/api/inventory-api.ts` for q/status/createdFrom/createdTo; keep history params unchanged and shared Axios. Acceptance: first stock request1/10, history1/20, UI sizes10/20/50/100.

- [X] T003 [P] Introduce list-specific InventoryListQueryDto in `apps/api/src/inventory/inventory.dto.ts`, inheriting existing page/safe-offset validation and overriding limit default10 with integer1–100. Leave InventoryPageDto/history default20 intact. Acceptance: omitted pagination1/10 only on catalog; no other endpoint default changes.


## Phase 3: US1 — Find products across the catalog (P1, MVP)

Goal: server-side name/SKU/status/Product.createdAt filtering and submit-only UI. Independent acceptance: known match outside initial page, case/trim, combined and one-sided/same-day dates, accurate total, invalid query400 and FE no-dispatch validation. Covers FR001–009/017–018, SC001–002 and submit part of SC003. Depends T002,T003.

- [X] T004 [US1] Extend InventoryListQueryDto validation in `apps/api/src/inventory/inventory.dto.ts`: scalar q trimmed/blank unrestricted/max200 Unicode code points, exact optional ACTIVE/INACTIVE, strict real Gregorian YYYY-MM-DD years0001–9999, independently optional dates and range order. Reject empty supplied dates, year0000, impossible/leap dates, whitespace/timestamps, arrays/repeated scalars and unknown fields with existing400 INVALID_INPUT; never normalize/swap. Depends T003.

- [X] T005 [US1] Extend listStock in `apps/api/src/inventory/inventory.service.ts` with one fixed WHERE/parameter collection shared by items/count. Parameterize literal name OR SKU ILIKE (escape !/%/_), AND status and Product.created_at bounds; convert fixed UTC+7 From midnight and next-day To midnight to UTC, including years1–99 and derived year10000 upper bound. Preserve repeatable-read/read-only snapshot, UUID ASC, stock0 left join and unchanged envelope. Filter before LIMIT/OFFSET; beyond-end returns empty items with filtered total, no clamp. Depends T004.

- [X] T006 [US1] Use InventoryListQueryDto only for GET /api/v1/inventory in `apps/api/src/inventory/inventory.controller.ts`; update existing Swagger list/query documentation in controller/DTO. Preserve ADMIN guard, GET body restriction, error envelope and all history/detail/POST contracts. Depends T005.

- [X] T007 [US1] Add one applied-filter object and submit action to existing query state in `apps/web/components/inventory/hooks/use-inventory-data.ts`; update `apps/web/components/inventory/types/hook-types.ts` only if needed. Normalize/omit empty conditions, set page1 and increment catalogVersion on every valid submit, including unchanged filters; editing draft must not fetch. Pass applied filters to listStock; preserve auth enable gates and keep movement/history state independent. Depends T002,T006.

- [X] T008 [US1] Add local Ant Form above the table in `apps/web/components/inventory/inventory-management.tsx`: labelled name/SKU Input, All/ACTIVE/INACTIVE Select, independent clearable inputReadOnly From/To DatePickers (YYYY-MM-DD), Search submit including Enter, and Reset control wired by T011. Form owns drafts; pickers prevent invalid date input/selection, Form validates trimmed q length and reversed range with field errors/no GET/no date repair. Record FE prevention and range checks separately from backend validation; no verification wrapper/fault framework. Do not add local duplicate draft state, hooks or wrappers. Depends T007.

- [X] T009 [US1] Run short read-only API smoke via existing Gateway for defaults, mixed-case trimmed name/SKU, literal punctuation, statuses, combined/one-sided/same-day dates, invalid direct query400 and filtered items/total/beyond-end pagination. Compare known Product.createdAt and available boundary records; record absent boundary/year-edge data as NOT RUN, not fixture-created PASS, in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`. Depends T006. Record backend real-date/range400 separately; never count it as FE PASS.

- [X] T010 [US1] Run UI filter smoke: first GET1/10; edit text/status/date emits no GET; name/SKU outside first page, casing/trim, combined/partial dates and Enter submit work; repeated submit reloads page1; reversed range/overlong q show errors without dispatch. Observe and record picker prevention of invalid date input/selection and Form reversed-range/no-dispatch separately from backend400; no wrapper/fault framework. Capture sanitized Network/UI evidence in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`. Depends T008.


## Phase 4: US2 — Navigate and reset filtered results (P1)

Goal: applied-filter paging/reset/retry, distinct resource states and stale-response protection. Independent acceptance: page ignores draft, size→page1, reset clears/reloads retaining size, empty vs beyond-end/error distinct, newest request owns rows/total, details/history compatibility. Covers FR010–014, SC003–004/007. Depends US1 code T008; not T009/T010 smoke completion.

- [X] T011 [US2] Complete reset/page/size/retry behavior in `apps/web/components/inventory/hooks/use-inventory-data.ts` and wire Reset in `apps/web/components/inventory/inventory-management.tsx`: clear Form and applied filters, page1, keep selected size, reload even already clear; paging/retry use applied filters not draft; size change→page1. Existing movement catalog refresh retains applied filters, history remains default20. Depends T008.

- [X] T012 [US2] Include actor, normalized filters, page, size and reload version in catalog identity in `apps/web/components/inventory/hooks/use-inventory-data.ts`; reuse cancellation/identity visibility in `apps/web/components/inventory/hooks/use-inventory-resource.ts` without a new hook/controller abstraction. Publish ready rows/errors/totals only for the current full identity so late responses cannot overwrite newer results. Loading-only pagination may retain the last same-actor/applied-filter count as a navigation placeholder, never as a ready response. Depends T011.

- [X] T013 [US2] Display current server pagination/filtered total and distinct loading/error-retry/no-match vs beyond-end states in `apps/web/components/inventory/inventory-table.tsx`; adjust `apps/web/components/inventory/types/component-types.ts` only if required. No client-page filtering, stale total, automatic page clamping or failure-as-zero-stock. Keep Inventory action. Depends T012.

- [X] T014 [US2] Run read-only UI smoke for page with unsent draft, all size choices, reset from later page and already-clear reset, no-match, loading and observed basic error/retry; use optional browser throttling for two requests only, no fault fixture. Verify final rows/total belong to newest query and record unobserved error/overlap/session cases as NOT RUN in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`. Depends T013.

- [X] T015 [US2] Inspect changed paths plus `apps/web/components/inventory/inventory-details.tsx` and `apps/web/components/inventory/hooks/use-inventory-operation.ts` to confirm filter actions dispatch no movement POST and do not alter selection/key/payload/recovery; open details page read-only and observe history default20. Record source-review vs UI evidence separately in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`; preserve earlier movement evidence, do not perform dev writes or rerun advanced auth/idempotency matrix. Depends T013.


## Phase 5: US3 — Comfortable desktop/tablet/mobile UI (P1)

Goal: ten-row desktop fit and usable narrow-screen controls with preserved content. Independent acceptance: actual1920×1080 no vertical scroll under default conditions, tablet768×1024/mobile390×844 interaction, no document horizontal overflow,20+ rows and long text readable. Covers FR015–016, SC005–006. Depends US2 code T013; not T014/T015 verification completion.

- [X] T016 [P] [US3] Adjust only Inventory-scoped spacing and wrapping/stacked filter/action styles in `apps/web/app/globals.css`: readable fonts, min-width0, local horizontal table scroll, normal vertical scrolling20+ and no overflow hiding/content clipping. Preserve unrelated page styles. Depends T013; may run alongside T017.

- [X] T017 [P] [US3] Tune library table density, responsive pagination/size/total controls and readable product text in `apps/web/components/inventory/inventory-table.tsx`; keep table-local horizontal scroll and Inventory button usable. Do not shrink fonts, truncate important text or introduce fixed-height vertical table scrolling to fit ten rows. Depends T013; may run alongside T016.

- [X] T018 [US3] Tune header/reminder/filter layout and existing Sider trigger in `apps/web/components/inventory/inventory-management.tsx`; retain reminder meaning and ensure collapsed sidebar reopens. Check existing `apps/web/components/inventory/inventory-details.tsx` viewport width; make presentation-only correction if it overflows, without changing auth or operation flows. Depends T016,T017.

- [X] T019 [US3] Validate actual CSS viewports1920×1080/100% zoom/sidebar open/ten representative rows/catalog view (no vertical document or table-body scroll),768×1024 and390×844 (sidebar reopen/filter submit-reset/table-local scroll/actions/page-size/details page controls/no document horizontal overflow). Confirm20+ rows/long text remain scrollable/readable. Record screenshots, scroll measurements and real outcomes/limitations in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`; build is not UI PASS. Depends T018.


## Phase 6: Polish and cross-cutting delivery evidence

Code/doc prerequisites only; quality gates and handoff can proceed with verification gaps. Covers FR018/SC008 and compatibility across the feature.

- [X] T020 Run Node24 `npm run check` and `npm run build` defined in `package.json`; correct only feature-related issues and record exit results in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`. Inspect `apps/api/test/` and run relevant existing tests if available; the directory is currently absent, so no new suite or missing-suite PASS. Report unrelated baseline failures explicitly. Depends T018.

- [X] T021 Update GET search/filter/pagination examples in `apps/api/postman/inventory.postman_collection.json`: q name/SKU, status, createdFrom/createdTo, combined filters, page/limit10 and paging examples; describe stock default10 vs history20. Preserve existing scripts and environment references; add no test script, collection-run test or environment. Documentation-only collection changes, no requests executed by this task. Depends T006.

- [X] T022 Reconcile actual implemented query/UI behavior with `specs/004-search-responsive-inventory/contracts/inventory-api.md`, `contracts/ui-contract.md`, `quickstart.md` and their `vi/` mirrors; correct documentary drift without silently changing clarified requirements. Check defaults10/20, no unrelated endpoint/auth/movement change, no dependency/index/framework/config/migration additions. Record compatibility findings in `specs/004-search-responsive-inventory/validation.md`. Depends T018,T021.

- [X] T023 Finalize synchronized outcomes and remaining gaps in `specs/004-search-responsive-inventory/validation.md` and `specs/004-search-responsive-inventory/vi/validation.vi.md`; update matching task checkboxes in `specs/004-search-responsive-inventory/tasks.md` and `specs/004-search-responsive-inventory/vi/tasks.vi.md` only where completion has sufficient evidence. Keep unrun required verification pending with exact reason; never infer HTTP/build/source review as UI PASS. Report FE URL http://localhost:3002 and stop without automatic converge. Depends T022. Collect T009/T010/T014/T019/T020 statuses without requiring their checkboxes to be complete; list every NOT RUN/pending/failure and reason. Report completion does not certify feature verification.


## Dependencies and execution order

```text
Code/documentation:
T001 → (T002 ∥ T003)
T003 → T004 → T005 → T006
(T002 + T006) → T007 → T008 → T011 → T012 → T013
T013 → (T016 ∥ T017) → T018
T006 → T021
(T018 + T021) → T022 → T023

Verification / quality gates (no outgoing code prerequisite):
T006 → T009
T008 → T010
T013 → T014
T013 → T015
T018 → T019
T018 → T020
```

Implementation dependencies refer to code readiness, not complete story smoke. T009/T010/T014/T019 can remain pending with per-check NOT RUN without blocking T011–T018 or T020. T021 is an independent documentation update after the backend contract is wired. T022 reconciles implemented code/contracts; T023 records all verification/gate statuses, including failures or NOT RUN, without requiring those tasks to be checked complete. A completed handoff report is not completed feature verification.

## Parallel execution examples

- Foundation: T002/T003 after T001; different FE/API files.
- US1: T009 API smoke or T021 Postman examples may run alongside T007/T008 after their prerequisites; T010 waits only for T008, not API smoke. Serialize evidence writes/browser control.
- US2: T011/T012/T013 code is sequential. T014/T015 checks do not gate later code; serialize shared evidence/browser access.
- US3: T016 CSS/T017 Table after T013; T018 integrates. T019 viewport smoke and T020 quality gates are independently schedulable after T018; serialize conflicting process/browser work.

## Implementation strategy and completion rules

1. MVP code: T001–T008. Verify through T009/T010 when possible; code completion is distinct from verified completion. Reset/navigation/responsive are later increments, not part of the initial complete search claim.
2. Continue T011–T013 then T016–T018 based on code readiness, even if earlier smoke lacks data. Same-file code work stays sequential.
3. Run T020 on final code without waiting for viewport/error/boundary evidence; record failures honestly. Repeat only when changes/failures justify it. No new tests or advanced feature003 matrix/dev movement writes.
4. Keep every unrun required check NOT RUN and its verification checkbox pending; record observed subchecks individually. Gaps do not become PASS because independent code/gates/reporting finishes. T023 handoff must list missing evidence and reasons.
5. FE date acceptance has separate picker-prevention and Form-range/no-dispatch evidence. BE real-date/range400 is separately recorded and never proves FE PASS.
6. Keep English/Vietnamese task ID/status labels synchronized. No deploy, commit, analyze rerun, implement or converge is triggered by documentary remediation itself.

## Task summary

23 tasks: setup1, foundation2, US1 seven, US2 five, US3 four, final4. Parallel-marked pairs: T002/T003 and T016/T017. Added T021 Postman examples; former T021/T022 are now T022/T023. No automated test task created; 23 tasks checked; the final four verification tasks were closed using the user’s manual confirmation recorded in validation.md.

## Approved details-route acceptance (T015/T019)

T015 additionally covers `/inventory/[productId]` row navigation, direct entry/reload, stock/history1/20, invalid/missing-product read error with disabled submit, and app back-to-list/sidebar return retaining draft/applied filters and catalog page/size. Inspect changed departure wiring for sending/uncertain confirmation and abort-before-discard without movement writes. T019 includes reachable details history/form and table-local horizontal scrolling at tablet/mobile sizes. These additions cover FR-019/SC-009; no new automatic test or advanced fault matrix. Source review alone does not complete the UI task. Existing user-installed UI dependencies are retained; install none.

T015 completed in the stable-browser continuation: actual details entry/reload/history1/20, retained applied/draft/list context, missing-product404/disabled submit/read retry, Network GET method checks and source departure/idempotency review. Pending-operation fault/bfcache matrices were not rerun. See the latest validation section; four verification tasks remain pending.

Implementation closeout2026-10-07: the user confirmed all remaining checks passed manually and requested the next workflow step. This supersedes earlier pending-status notes; no browser checks were repeated.
