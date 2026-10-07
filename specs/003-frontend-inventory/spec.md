# Feature Specification: Frontend Inventory Management

## Current learning scope — user amendment, 2026-10-07

The active goal is a basic frontend for learning: left sidebar, server-paginated stock table, product Inventory drawer, receipt/issue form and immutable history. Retain existing authentication/authorization, a frozen key/body for manual retry and duplicate-submit protection. Verify normal receipt/issue, input validation, admin/customer access, basic API/read errors and same-key retry without a second movement. Preserve evidence already obtained; do not repeat unchanged behavior.

Complex response/modal/session/latch races, native bfcache/browser lifecycle variants, clock/deadline/expiry verification and the authentication/refresh fault matrix are **DEFERRED** (D001–D004 in tasks). Existing implementations and bounded historical evidence remain; this amendment changes verification priorities, not the backend contract or a promise to remove guards. Deferred or unrun cases are not PASS and do not block this learning goal. No new helper/proxy fault or advanced verification; converge requires a separate user request. The detailed original scenarios below are historical/full-scope reference wherever they exceed this amendment.


**Feature Branch**: Not created (no branch hook configured)
**Feature Directory**: `specs/003-frontend-inventory`
**Created**: 2026-10-06
**Status**: Draft — specification validated; implementation not started
**Input**: Admin inventory table/drawer, paginated history, receipt/issue, safe retry and protected departure; no backend changes or automated tests.

Language: **English** | [Tiếng Việt](vi/spec.vi.md)

## Repository Scope

Proposed work affects the frontend only. The existing [Inventory API contract](../002-inventory-balances/contracts/inventory-api.md) governs fields, authorization, pagination, ordering, error semantics and 24-hour idempotency retention. Its backend evidence is in [validation](../002-inventory-balances/validation.md); this specification does not claim the proposed UI exists or has passed runtime checks.

Include a left admin sidebar/right content, stock table, per-product drawer, paginated history, movement form and safe recovery/departure. Exclude search (including loaded-page filtering), optional sorting, Product CRUD UI, Orders, history editing/deletion and backend/Gateway/database changes.

User-mandated delivery constraints: reuse Axios interceptor and Redux session through Gateway; prefer Ant Design Layout, Menu, Table, Form and Drawer. Use simple typed components, local UI state and nearby handlers; no unnecessary utils/hooks/wrappers, generic framework or speculative abstractions. These user constraints are not an implementation design. Search exclusion overrides the generic search preference in [AGENTS.md](../../AGENTS.md) and [frontend conventions](../../docs/en/conventions/frontend.md).

No new automated tests. Later implementation must record manual browser/Gateway verification against real disposable PostgreSQL, affected quality/build checks, screenshots and omitted coverage. No implementation, migration or runtime verification occurs during specify.

## Clarifications

### Session 2026-10-06

- Q: When session refresh fails while an operation is sending or unresolved, how should the UI respond? → A: A — retain recovery in mounted-page memory, hide protected data and lock actions; confirm recovery loss before sign-in navigation; allow same-operation retry only if the original admin restores the session in place.
- Q: When drawer stock or history reads fail, may the movement form remain usable? → A: A — require a successful current-stock read before new submission; history failure alone does not block receipt/issue and has its own read retry.
- Q: After a successful receipt/issue, should the drawer form retain or clear the submitted values? → A: A — keep the drawer open, clear quantity/reason and retain the last movement type; the next deliberate operation uses a new key.
- Q: While an operation is unresolved, may the admin abandon recovery and start a new operation in the same drawer? → A: A — no in-place abandon-recovery action; keep the new-operation form locked and allow same-key recovery or confirmed drawer close/departure.
- Q: After a definite insufficient-stock or stock-ceiling rejection, should the form retain submitted values or reset? → A: B — clear quantity/reason, retain type, show the error and reload current stock; the next deliberate submission uses a new key.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse authorized stock (Priority: P1)

An admin inspects the catalog's stock page by page, including inactive and untouched products.

**Why this priority**: Independently useful read-only management entry point.
**Independent Test**: Open Inventory with existing products under waiting, signed-out, customer and admin sessions; browse pages without recording movements.
**Acceptance Scenarios**:

1. **Given** session initialization is pending, **When** Inventory opens, **Then** show waiting without protected data or inventory requests; after resolution allow an admin, use existing sign-in for a signed-out user and show denied access to a customer.
2. **Given** an admin, **When** stock loads, **Then** the left sidebar identifies Inventory and the right table shows product name, SKU, ACTIVE/INACTIVE, current stock and an Inventory action; untouched products show zero.
3. **Given** multiple pages, **When** page or size changes, **Then** server rows/page/limit/total determine the display; size changes reset to page one, without search or optional sorting.
4. **Given** slow, empty or failed reads, **When** the page renders, **Then** loading, explicit empty or readable error/read-retry states appear; failure never implies zero stock or an empty catalog.

### User Story 2 - Inspect a product drawer (Priority: P1)

An admin sees current stock and immutable history without losing stock-table pagination.

**Why this priority**: Gives independently useful context before any write.
**Independent Test**: Open products with existing/empty history, paginate, close and reopen.
**Acceptance Scenarios**:

1. **Given** a row, **When** Inventory is selected, **Then** identify the product and fetch current stock/history; show movement type, quantity, before/after balance, actor identifier, reason and labelled time with no edit/delete actions.
2. **Given** multiple history pages, **When** history page/size changes, **Then** respect server page/limit/total and newest-first order independently of the stock table; size changes reset to page one.
3. **Given** empty history or failed stock/history reads, **When** the drawer opens, **Then** distinguish loading/empty/error per section with read retry; do not display a failed stock read as zero.
4. **Given** old selection/page responses arrive late, **When** selection changes, **Then** old results cannot overwrite current data; switching/reopening starts history at page one and preserves table page/size.

### User Story 3 - Record receipt or issue (Priority: P1)

An admin explains a stock change for an active or inactive product and sees refreshed data.

**Why this priority**: Core stock-management action with duplicate protection.
**Independent Test**: On disposable data with known stock, record receipts/issues and rejected attempts, then reconcile stock/history.
**Acceptance Scenarios**:

1. **Given** an active or inactive product and valid input, **When** submitting, **Then** one new logical operation uses a fresh UUID key; repeated clicks during sending create no parallel submission and its product/payload are frozen.
2. **Given** invalid quantity or trimmed reason, **When** submitting, **Then** show field errors and send no movement; stock-dependent server rejection remains authoritative despite the displayed stock.
3. **Given** confirmed success or successful replay, **When** it arrives, **Then** show success and reload current drawer stock, stock table and first history page; a later new operation uses a new key, and the original response balance is not treated as fresh current stock.
4. **Given** definite input/product/stock rejection, **When** it arrives, **Then** show its error without success; revised business attempts use new keys, and cached stock failure is not retried expecting changed business results.
5. **Given** success followed by refresh-read failure, **When** reads fail, **Then** keep the movement successful and retry only the reads, never the movement to fix them.

### User Story 4 - Recover the same operation (Priority: P1)

An admin resolves unavailable outcomes without accidentally changing stock twice.

**Why this priority**: Protects against response loss and duplicate movements.
**Independent Test**: Delay an original request and lose a committed response in disposable infrastructure; compare retry identity/payload and durable history.
**Acceptance Scenarios**:

1. **Given** sending, in-progress or uncertain result, **When** viewing the drawer, **Then** keep its frozen product/type/quantity/reason visible, disable editing/new submission and explain that stock may already have changed.
2. **Given** IDEMPOTENCY_IN_PROGRESS or a retryable response, **When** Retry is chosen after the permitted delay, **Then** one attempt uses the original key/payload; there is no parallel attempt, automatic polling or infinite automatic retry.
3. **Given** lost response/network error, unexpected 500 or Gateway 502, **When** handling it, **Then** classify uncertainty rather than cancellation or definite failure; distinguish confirmed API 503 from Gateway timeout and retain identity for recovery.
4. **Given** an original committed success, **When** retry succeeds, **Then** acknowledge the original movement and refresh data without a second movement; IDEMPOTENCY_KEY_REUSED instead stops submission and directs history reconciliation without silently replacing the key.
5. **Given** expired authentication, **When** existing session recovery fails, **Then** protected data/actions become unavailable, key/payload remain only in mounted-page memory and navigation to sign-in requires recovery-loss confirmation; in-place session restoration by the original admin permits same-operation retry, never under another admin's scope.

### User Story 5 - Leave safely and return informed (Priority: P1)

An admin decides explicitly to lose local recovery information without assuming backend cancellation.

**Why this priority**: Prevents silent operation loss and false cancellation claims.
**Independent Test**: During sending/uncertainty exercise drawer close, product switch, app navigation, reload/tab close and re-entry.
**Acceptance Scenarios**:

1. **Given** sending or unresolved state, **When** closing the drawer, switching products or using application-controlled navigation/sign-out, **Then** ask confirmation explaining recovery-information loss and possible backend completion; cancelling retains selection/key/payload.
2. **Given** that warning, **When** departure is confirmed, **Then** discard local operation information without persistence, restoration or automatic POST; do not claim the backend transaction was cancelled.
3. **Given** sending or unresolved state, **When** reload/tab close is attempted, **Then** request the standard browser beforeunload warning only while protection is active; do not promise custom wording or guaranteed display.
4. **Given** returning after departure/reload, **When** Inventory opens, **Then** load fresh data, send no restored movement and show a history-reconciliation reminder without recovering the previous key/payload.

### Edge Cases

- Drawer read failures: disable new movement submission until the selected product's current stock has loaded successfully. History loading/failure alone does not block receipt/issue; show its error and separate read retry. A failed later stock refresh blocks new submission until read recovery, without changing confirmed movement success. Same-operation recovery retry remains governed by the frozen operation and authorization, not by read availability.
- Session failure while sending/unresolved keeps key/payload only in mounted-page memory; protected data and actions are hidden/locked. Sign-in navigation requires confirmation of recovery loss. In-place session restoration by the original admin permits retry with the same operation; no operation is persisted across navigation.
- Default page/limit are 1/20, limit is at most 100, and invalid/unsafe page offsets are not sent. Out-of-range pages show empty items with the server total.
- Missing product, changed permissions or stale responses must not display another product's data or fake zero stock. Current catalog names/SKUs/status are not historical snapshots.
- Inactive status does not disable receipt/issue. Displayed stock is advisory because other admins can change it.
- Trim reason before freezing; validate 1–500 Unicode code points. Only type/quantity/reason are form fields, not actor/IDs/timestamps/calculated balances.
- Honour Retry-After as a minimum delay for in-progress/rate-limit/temporary failures, accepting valid seconds/date values. Without usable Retry-After, manual retry starts at one second and increases after repeated retryable failures up to 30 seconds, with jitter; there is no automatic resend.
- After 24 hours from first dispatch, disable retry advertised as a safe replay for an unresolved operation and require history reconciliation before a deliberate new attempt. Backend retention starts at completion; the earlier UI cutoff is conservative.
- Confirmed API 503 and rate-limit 429 are not success or cached business failure; preserve operation identity for retry. A later attempt-only rejection must not erase uncertainty from an earlier attempt. A recognized terminal response/replay for the original frozen operation, including a retained stock-error result, can establish the original outcome and end recovery.
- Unsent drafts and successful movements whose read refresh failed do not require unresolved-operation departure protection.
- Application-controlled departure is confirmed, including sign-out. Browser-controlled back/forward/unload protection is best-effort within browser capabilities; do not guarantee interception of every history transition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Wait for session initialization, permit only admins, reuse existing sign-in behavior for signed-out users and deny customers. Send no inventory request or protected data before access resolves; handle later 401/403.
- **FR-002**: Show left admin sidebar/right content and table with name, SKU, ACTIVE/INACTIVE, stock and Inventory action.
- **FR-003**: Use independent stock/history server pagination, defaults 1/20, limit≤100, reset on size change, server ordering and honest empty/out-of-range states; no search or optional sorting.
- **FR-004**: Open a product-specific drawer with current stock, paginated immutable history and form; preserve table pagination, reset history on product change and suppress stale read responses.
- **FR-005**: Distinguish loading/empty/error/success/unresolved states and allow read retry independently of movement retry; failed reads never imply zero or no history. New movement submission requires a successful current-stock read for the selected product; loading/failed stock reads disable submit. History failure alone does not disable movement submission.
- **FR-006**: Require RECEIPT/ISSUE, JSON numeric integer quantity 1–1,000,000 and trimmed reason of 1–500 Unicode code points; allow inactive products and submit only contract-owned input fields.
- **FR-007**: Create one fresh UUID key per deliberately new operation; freeze original admin/product/normalized payload before sending and prevent parallel/double submission or editing while sending/unresolved.
- **FR-008**: Every recovery attempt, including existing interceptor authentication replay, must preserve the original key/payload; never silently replace a key for uncertainty, temporary errors or key conflict.
- **FR-009**: Distinguish confirmed success/replay, definite validation/business rejection, transient errors and uncertain outcomes per contract. Lost response/Gateway timeout do not prove rollback; attempt-only rejected retries do not erase earlier uncertainty; a recognized terminal response/replay for the frozen operation settles it. For a definite INSUFFICIENT_STOCK or STOCK_LIMIT_EXCEEDED rejection with no earlier unresolved attempt, clear quantity/reason, retain type, display the error and reload current stock. The next deliberate submission uses a new key and remains disabled until stock reload succeeds. If an earlier attempt is still uncertain and the response only rejects the current attempt, preserve its frozen payload/key and unresolved protection instead of resetting. A recognized terminal stock-error replay settles that uncertainty and follows the same reset/reload rule.
- **FR-010**: Show IDEMPOTENCY_IN_PROGRESS distinctly, honour Retry-After, use bounded user-initiated retry with one attempt per eligible click, no automatic polling/infinite retry, stop on key conflict and prevent safe-replay claims beyond the conservative cutoff. No in-place abandon-recovery action is offered while unresolved; the new-operation form stays locked. Recovery uses the same key, or the user explicitly confirms drawer close/departure under FR-012.
- **FR-011**: On success/replay refresh drawer stock, table and first history page; no optimistic balance calculation or POST retry to fix read failures. Preserve movement success separately from refresh errors. After confirmed success or successful replay, keep the drawer open, clear quantity/reason and retain the submitted type; apply this reset even if subsequent read refresh fails.
- **FR-012**: Confirm drawer close, product switch and application-controlled navigation/sign-out while sending/unresolved; cancelling retains operation data, confirming explains recovery loss without backend cancellation.
- **FR-013**: Request default beforeunload warning only while sending/unresolved, remove after resolution/departure, and acknowledge browser limits without promised custom text or display.
- **FR-014**: Never persist/restore operation or automatically resend after departure/reload. Each Inventory entry fetches fresh data and reminds the user to reconcile history for possibly completed earlier work.
- **FR-015**: Reuse session/refresh and unchanged token storage/authorization authority; operation recovery requires original admin identity. Loss of access cannot expose protected data or silently imply transaction failure.
- **FR-016**: Respect frontend-only scope and simple local-state constraints; no backend extension, new operation persistence, search, Product CRUD, Orders or automated test files. Later record manual acceptance evidence and actual quality checks.

### Key Entities *(include if feature involves data)*

- **Stock row**: Product identity/current name/SKU/status and whole-unit balance in a server-paginated stock result.
- **History page**: Immutable movement facts/current product metadata, with independent page/limit/total.
- **Local operation**: Original admin/product, UUID retry identity, frozen type/quantity/trimmed reason, first-dispatch time and sending/recovery/terminal state; exists only in the mounted page, never persisted/restored.
- **Authorized session**: Existing identity, role and initialization state; permission remains server-authoritative.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all waiting/signed-out/customer/admin manual cases, only the authorized admin sees protected inventory or initiates movement.
- **SC-002**: With at least 45 products and 45 movements for one product, size 20 yields three correct pages and totals in both lists; changing one pagination does not change the other.
- **SC-003**: Receipt 10, issue 3, rejected issue 8 show stock 7 and exactly two movements; receipt/issue also work for inactive products.
- **SC-004**: Double clicks, in-progress recovery and lost-success response followed by retry each create at most one movement per logical operation with identical retry identity/payload.
- **SC-005**: Every manual pending-departure case retains operation on cancellation or explicitly discards local recovery on confirmation; return/reload sends zero restored movements and shows reconciliation reminder.
- **SC-006**: All required loading/empty/error/success/unresolved cases display distinct readable states; failed read refresh never reverses confirmed success or resubmits the movement.
- **SC-007**: Each eligible Retry click sends at most one attempt after the required delay; no unrequested automatic attempts occur apart from existing single authentication replay, and none claim safe replay after the cutoff.

## Assumptions

- Show the reconciliation reminder on every Inventory entry: without retaining an operation across departure, the UI cannot identify only users who previously left uncertainty.
- Recovery is manual; each click sends one attempt, while existing session recovery keeps its one-authentication-replay policy. No automatic recovery loop is required.
- First-dispatch cutoff is earlier than or equal to backend completion-based retention, never an extension of its guarantee.
- Existing navigation/session behavior is reused; route placement, composition and guard mechanics belong to plan. Browser departure interception cannot be universal.
- Existing API/Gateway and test users/products are dependencies for later manual disposable-environment verification, not availability verified during specify.
- Desktop admin layout is primary; labelled controls, keyboard access, visible focus and readable state messages are required. No separate mobile experience.
- This quality review validates the specification, not runtime behavior. Next requested step is `$speckit-clarify`; no plan/tasks/implementation is generated here.

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
