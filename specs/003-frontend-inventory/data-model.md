# Frontend Data and State Model

Language: **English** | [Tiếng Việt](vi/data-model.vi.md)

No database entity, migration or durable operation storage. Backend shapes follow the [existing contract](../002-inventory-balances/contracts/inventory-api.md).

| State | Fields / ownership |
|---|---|
| ProductSummary | id, sku, name, ACTIVE/INACTIVE |
| StockItem | productId, onHandQty, product |
| Movement | id, productId, RECEIPT/ISSUE, quantity, before/after, actorId, reason, createdAt |
| Page<T> | items, page, limit, total; stock/history independent |
| ReadResource<T> | discriminated loading/ready/error, current query identity; no synthetic zero |
| Selection | productId/catalog label, history page/limit; table query remains separate |
| Draft | Ant Form type, optional numeric quantity, reason; defaults RECEIPT/empty/empty |
| Operation | actorId, productId, key, readonly normalized payload, firstDispatchedAt, retryUntil, status, priorUncertain, retryableFailureCount, nextRetryAt, sanitized message, operation AbortController/signal, discarded lifetime flag, active attempt ID, dispatch provenance, hidden terminal outcome |

Operation status sending → retryable (known temporary), in_progress, uncertain, blocked (key conflict/deadline/auth mismatch), or terminal then retired. Protection derives from operation existence in any nonterminal state; no independent duplicate pending boolean. Per-attempt synchronous in-flight ref prevents parallel requests. Do not store secrets or key/reason in logs, URL, local/sessionStorage, cookies, IndexedDB or Redux. Auth storage remains existing.

Validate integer1..1e6, numeric not coerced strings/null, trimmed reason1..500 Array.from code points, exact enum. Safe page/offset and size≤100. Freeze payload once; recovery never reads mutable Form values.

| Event | Transition |
|---|---|
| Valid new submit | Acquire send latch synchronously; UUID/freeze/clock; sending |
| Manual Retry eligible | Same object key/body; sending; no automatic timer POST |
| 201 original/replay | Terminal success; retire identity, reset qty/reason keep type, independent refresh table/stock/history1 |
| Matching cached404/stock409 | Terminal business rejection, even after unknown earlier attempt because scoped replay settles it; retire identity; stock409 reset qty/reason and reload stock |
| Initial400 before any unknown | Definite validation rejection; retire command, editable draft, future submit new key |
| Actual POST401/403 with no refresh failure or prior unknown | Definite access rejection after interceptor processing ends; retire, hide protected data |
| Preflight refresh failure / refresh failure after POST401 | Auth-blocked mounted recovery per Q1, release latch; known current attempt not dispatched/rejected respectively, preserve earlier uncertainty |
| 400/401/403 after unknown | Preserve uncertainty/identity; do not reopen new form; access gate may hide data |
| 409 IN_PROGRESS | Retain payload, nextRetryAt, in_progress; no new operation |
| 429 / API503 INVENTORY_BUSY | Known current-attempt temporary failure, retain identity; preserve earlier uncertainty |
| no response /500 /502 /unrecognized transport503 | Uncertain, protect frozen operation; explain possible commit |
| KEY_REUSED / deadline | Block recovery submission, retain unresolved protection; reconcile reads/confirmed departure |
| Auth failure/different actor | Hide protected data; keep operation mounted, disable actions; guarded login/departure |
| Confirm departure | Clear operation and generation before navigation/selection; no persist/resend; late results ignored |

Timers only update visible retry availability/cutoff; clear on unmount/retirement. Refresh failure cannot turn terminal success into movement failure. New submit requires ready stock for selected product; recovery does not require GET readiness. Drawer close/reopen clears unsent draft; reopen defaults RECEIPT and history1. Existing table page/size remain. History size retained within drawer; new product/reopen uses limit20. No optimistic balance or cached history merge.

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
