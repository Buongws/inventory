# Implementation Plan: Frontend Inventory Management

## Current learning scope — user amendment, 2026-10-07

The active goal is a basic frontend for learning: left sidebar, server-paginated stock table, product Inventory drawer, receipt/issue form and immutable history. Retain existing authentication/authorization, a frozen key/body for manual retry and duplicate-submit protection. Verify normal receipt/issue, input validation, admin/customer access, basic API/read errors and same-key retry without a second movement. Preserve evidence already obtained; do not repeat unchanged behavior.

Complex response/modal/session/latch races, native bfcache/browser lifecycle variants, clock/deadline/expiry verification and the authentication/refresh fault matrix are **DEFERRED** (D001–D004 in tasks). Existing implementations and bounded historical evidence remain; this amendment changes verification priorities, not the backend contract or a promise to remove guards. Deferred or unrun cases are not PASS and do not block this learning goal. No new helper/proxy fault or advanced verification; converge requires a separate user request. The detailed original scenarios below are historical/full-scope reference wherever they exceed this amendment.


**Branch/context**: `003-frontend-inventory` (feature context, no Git branch created) | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

Language: **English** | [Tiếng Việt](vi/plan.vi.md)

## Summary

Deliver `/inventory` as a client-owned admin management page using shared session/Axios, Ant Design stock/history tables and a drawer form. Keep the five clarify decisions: retain mounted recovery after auth failure; require successful stock read for new submission but not history; success clears quantity/reason and retains type; no in-place abandon recovery; definite stock rejection clears quantity/reason and reloads stock. No search/backend contract change.

## Technical Context

- Node 24, strict TypeScript, installed Next 16.3.6 / React and React DOM 19.3.0 / Axios 1.20.0; existing Redux and `useAuth`.
- Add only direct dependencies `antd@6.6.5` and `@ant-design/nextjs-registry@1.3.0` during implement; update only web manifest/lockfile. Registry/cssinjs peer resolution must be checked; no direct cssinjs, icons, query library, form library or navigation-blocking package planned.
- Storage: component memory only for inventory, existing auth localStorage/cookie contract unchanged. No database/migration change; frontend transport config changes below.
- Target desktop browser; keyboard access, visible focus, labelled controls and horizontal table scrolling on narrow screens. No production latency/volume promise. Server pages bounded at 100.
- Testing: no new automated test files. Manual browser/Gateway + disposable PostgreSQL reconciliation; root check/build and relevant existing tests, recording missing suites honestly.
- Integration compatibility is supported by metadata/docs, not a passing installed integration or hydration check. No dependencies installed in plan.

## Constitution Check

Pre-research and post-design gates: PASS. I: spec/clarify define scope and observables. II: API retains rules/auth; Gateway proxy unchanged; frontend shared Axios/session. III: no schema or migration changes; server stock is authoritative. IV: two functional components plus one type file, local state, existing providers, no generic framework. V: manual integration and root quality gates required later, no new tests or fabricated runtime claims.

## Project Structure

Documentation: `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/ui-contract.md`; matching `vi/*.vi.md` and `contracts/ui-contract.vi.md`. Existing spec/checklist remain inputs. Tasks are generated only by a requested tasks run.

Planned source touchpoints:

- `apps/web/app/inventory/page.tsx`: thin route rendering InventoryManagement; no auth-sensitive server fetch or redirect.
- `apps/web/components/inventory-management.tsx`: client owner of session gate, Layout/Sider/Menu, table, selected product, reads, local operation, confirmation and beforeunload; owns all movement sends.
- `apps/web/components/inventory-drawer.tsx`: meaningful UI component with typed data/callback props, Ant Form, stock/history/error/recovery views; no independent pending key lifecycle or API orchestration.
- `apps/web/lib/inventory-types.ts`: plain backend-aligned types only, no wrappers/helpers.
- `apps/web/app/layout.tsx`: AntdRegistry around existing AppProvider.
- `apps/web/components/app-provider.tsx`: existing Redux/bootstrap retained; add ConfigProvider Vietnamese locale and AntD App for context-aware modal/message.
- `apps/web/components/protected-dashboard.tsx`: admin-only Inventory navigation entry, existing customer dashboard preserved.
- `apps/web/lib/api.ts`: narrowly scoped inventory actor/deadline dispatch checks described in contract; no token-storage or backend changes.
- `apps/web/app/globals.css`: scope legacy form/label/input/button rules to auth/dashboard containers; minimal inventory spacing/scroll rules, no global reset import that changes unrelated pages.
- `apps/web/next.config.ts`, `apps/web/.env.local.example`: same-origin rewrite and documented Gateway origin; no backend env change.
- `apps/web/package.json`, `apps/web/package-lock.json`: two dependencies during implement only.

## Phase 0 — Research

[research.md](research.md) resolves SSR/library compatibility, local state, auth replay race and navigation protection with official references. No unresolved design unknowns. Research agent inspected frontend/session and official docs; no source edits or installations.

## Phase 1 — UI, state and contracts

Transport: shared baseURL `/api/v1` via Next external rewrite `/api/v1/:path*` to Gateway origin (`GATEWAY_ORIGIN`, server-only http(s) origin, default http://localhost:3004; validate in next.config). Update NEXT_PUBLIC_API_URL example to `/api/v1`; supported Inventory deployment requires same-origin base, not old cross-origin override. Forward cookies/headers/status/Retry-After and verify existing auth/Google redirect behavior; no custom proxy implementation. Current API CORS does not expose Retry-After; Gateway local429/502 has no CORS, so direct cross-origin browser calls cannot meet the UI contract.

Route `/inventory`; Sidebar Menu contains Inventory and dashboard return; sign-out is an explicit action. All leave-capable controls on the page route through one local confirmation handler, not a global router patch/context framework. Dashboard links to inventory only for admins. Signed-out without operation navigates to `/login` after initialization; customer shows denied Result. Pending auth failure stays mounted with non-sensitive recovery-loss warning and guarded sign-in button; hide catalog/history/reason. In-place same-admin restoration can unlock recovery; different admin cannot send it.

Stock Table uses productId rowKey, controlled page/pageSize/total and `showSizeChanger` with 10/20/50/100; no sorter/search. Drawer shows name/SKU/status, stock and history Table (movement ID rowKey); default history limit20, resets page on product/size/success. Display UTC labelled times via built-in formatting, actor UUID, type, qty, before/after, reason; no actor lookup API. Ant Form Select defaults RECEIPT, InputNumber empty with integer/min/max validation, TextArea trimmed Unicode-code-point validation; default library UTF-16 maxlength must not reject 500 emoji. New submission disabled until current stock read succeeds; history error alone permits it.

Parent uses local useState read resources, page selections and operation; synchronous ref holds the active operation/send latch to prevent double-click before React render. Ant Form owns editable draft; no duplicated draft in Redux. At submission freeze normalized payload + actor/product + crypto.randomUUID; before network set ref latch and state. Effects perform GET via shared `api`, use AbortController and generation/product/page/actor checks; Axios cancellation of GET is not a read error. Session loss aborts/invalidate reads and hides data; mounted operation remains. Late POST callbacks finish the matching live attempt internally and release its latch regardless of authorization; only publication/refresh requires original-admin authorization and current identity/generation; confirmed departure clears ref/generation so late callbacks cannot reset a new form or reopen drawer.

No new POST from effects. Shared Axios `api.get<T>`/`api.post<T>` directly, no inventory service wrapper. Timeout for movement attempt 15 seconds (request-local, no Gateway/backend change) ensures network hangs enter uncertain state; aborting client waiting does not cancel transaction. Success/replay retires operation, clears qty/reason keeping type, refreshes three resources independently with history page1. Recognized terminal stock rejection/replay, including one settling prior uncertainty, retires operation, same reset and stock reload; validation failures retain editable draft/field error, next submission fresh key. Recovery and transitions: [data-model.md](data-model.md). Dispatch/error details: [UI contract](contracts/ui-contract.md).

Navigation: context-aware Modal confirmation covers close icon, mask, Escape, different-product action, menu/dashboard/sign-out/login and any future in-page link/router push. Cancel leaves selection/operation untouched. Confirm marks local operation discarded and invalidates callbacks before executing action; operation-signal abort is mandatory to prevent delayed dispatch/replay, and does not imply backend rollback. No persistence, history-stack sentinel, monkey-patching router/history, or guarantee for browser Back/Forward. beforeunload listener exists only while sending/unresolved; preventDefault/returnValue default warning. Native history transitions are best-effort; on unmount discard and never auto-resend. Reminder on every entry compensates for no persisted operation record. Read refresh and draft do not activate warning. On pagehide discard local recovery and invalidate callbacks; on pageshow with persisted=true clear operation/draft/resources and load fresh authorized data/reminder, preventing bfcache from restoring an old operation. No POST on return.

## Verification and handoff

[quickstart.md](quickstart.md) maps all stories and FR/SC to browser/runtime cases including no SSR style flash/hydration errors, legacy auth styling, 401 replay actor/deadline and transport loss. No backend migration. No runtime/build/manual checks have run during this plan. Next requested step `$speckit-tasks`.

## Complexity Tracking

No constitution deviation. Registry is required SSR style integration; two inventory components separate substantial page orchestration from drawer rendering, not trivial wrappers. Two inventory-only Axios metadata fields address authenticated replay and retention races unavailable to page callbacks. All other auth requests retain existing behavior.

## Outcome provenance, operation lifetime and authentication precedence

These rules resolve I1/U1/U2/I2 without changing backend behavior or the five clarify decisions.

- A validated response to the original frozen product/key/payload with status 201, PRODUCT_NOT_FOUND 404, INSUFFICIENT_STOCK 409 or STOCK_LIMIT_EXCEEDED 409 is a terminal operation result under the backend contract, including replay. It settles earlier uncertainty. No replay marker/header is required or invented. An unrecognized 404/409 body is not proof of a terminal result. A terminal stock rejection resets quantity/reason, retains type and reloads stock per Q5; a terminal success follows Q3. Errors that only reject the current retry attempt (validation/authentication, rate limit, timeout or local dispatch guard) cannot settle an earlier uncertain operation. A terminal replay is not such an attempt-only rejection.
- Each local operation owns an AbortController/lifetime signal; every initial POST and automatic/manual replay uses that same signal, with actor/deadline metadata. Check cancellation before starting refresh, after every awaited refresh, immediately before initial dispatch and immediately before replay. Confirmed close/departure, pagehide or unmount marks the operation discarded and aborts its signal before clearing references or executing navigation. Do not cancel the shared refresh promise needed by other requests; its completion must not dispatch a discarded operation. No new generic cancellation framework. Cancellation only stops future frontend dispatch/client waiting; a POST already dispatched may have committed and cancellation does not prove rollback.
- Separate attempt completion from UI publication. A matching attempt ID and live operation always releases its sending/latch in finally, regardless of current authorization. Do not release a newer attempt's latch. Record terminal result or recovery/auth state privately in mounted-page memory even when data cannot be shown. Publish payload/catalog/history/result and run refresh reads only for the authorized original admin and current selection/generation. If access is absent, retain hidden operation information per Q1, with no stuck sending; an unknown result remains recoverable. A privately known terminal result settles recovery, but remains hidden; after original-admin restoration apply its reset/refresh once without another POST. An operation discarded in the meantime receives no update and cannot affect a new operation.

Authentication decision precedence (evaluate provenance, not HTTP status alone):

| Situation | Required result |
|---|---|
| Refresh fails before any movement POST dispatch | Known not dispatched for this attempt. Release latch, retain same mounted operation/key/payload in auth-blocked state under Q1, hide protected data, guarded sign-in; original-admin restoration may retry. Do not introduce uncertainty unless an earlier attempt was uncertain. |
| Actual movement POST returns server 401/403 | This attempt was rejected, not a terminal inventory result. If no refresh failure and no earlier uncertainty, retire as a definite access rejection; show no protected data while access is denied. If earlier uncertainty exists, retain recovery and that uncertainty. A 401 may enter the existing one-refresh/one-replay path; do not finalize before that path finishes. |
| Refresh fails after movement POST returned 401 | Preserve the server-401 provenance: this attempt was rejected, but Q1 takes priority over the generic initial-401 retirement rule. Release latch, keep same mounted operation in auth-blocked state and guarded login. Preserve earlier uncertainty if present; no replay after failed refresh. |
| Retry starts with previous uncertainty | Current-attempt preflight failure, 400/401/403, refresh failure, 429/503 or cancellation cannot prove original failure. Keep uncertainty/key/payload until a recognized terminal result, or explicit confirmed discard. |

Manual scenarios: delay preflight refresh, confirm close/departure then finish refresh → zero movement dispatch; delay post-401 refresh, confirm departure then finish refresh → zero replay (the first rejected POST may exist). Repeat cancel-confirmation → same operation remains eligible. Complete POST success/error while access is lost or another actor is present → latch released, no protected publication or reads; restore original admin → known terminal result applied without POST, unknown result offers same-key retry. Exercise all four authentication rows with and without prior uncertainty. Observe real outgoing requests and distinguish temporary display fixtures from real backend outcomes; add no automated tests.
