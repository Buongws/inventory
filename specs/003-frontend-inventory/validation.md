# Implementation validation: Frontend Inventory

## Current basic learning result — 2026-10-07

User stopped advanced verification. This table supersedes the initial NOT RUN seed table and historical progress notes below. “Retained verified” means actual earlier evidence, not a new run.

| Basic area | Current result / provenance |
|---|---|
| Sidebar, admin/customer access, stock table/pagination | Implemented; retained verified T012 (disposable45 and separate DEV200 evidence remain environment-labelled). |
| Inventory drawer, current stock, independent history/UTC | Implemented; retained verified T015. |
| Receipt/issue, validation, duplicate submit, inactive products | Implemented; retained verified T020: receipt10/issue3/reject8 → stock7/two facts, field/Unicode checks and one POST on double click. |
| Basic errors/read retry and same-operation movement retry | Implemented; retained T020/T025: frozen key/body, actual committed-response replay yields one movement; synthetic errors are labelled FE-only. |
| Existing auth and normal login | Retained existing policy; real disposable-admin login/dashboard observed this run; customer gate retained T012. |
| Keyboard/labels/UTC/style and quality | T028; final logout contrast corrected with scoped CSS. Root check/build exit0; Jest No tests found exit1 is absent coverage, not PASS. Final post-fix screenshot interrupted by Chrome quit; previous sanitized screenshots retained. |
| Basic smoke T030 | Completed 2026-10-07: retained admin/table/pagination/drawer/validation evidence plus new real receipt/issue and customer denial; see final T030 record. |
| Advanced race/bfcache/clock/deadline/auth fault matrix | DEFERRED D001–D004; historical bounded evidence below retained, no further execution. |

Historical availability (superseded by T030 cleanup below): http://localhost:3102/inventory (sign in using the existing disposable admin; http://localhost:3102/login). Existing45-product fixture retained, PG55534/Redis56380; frontend3102 → normal proxy3105 → Gateway3104/API3101. Read-only readiness200 verified after cleanup. DEV http://localhost:3002/inventory also serves; use3102 for practice writes. No new fixture/helper/fault. Temporary T027 modules/session secrets/backups and production runtime helper removed; browser helper absent before Chrome quit (Chrome subsequently not running). Original disposable runtime restarted in normal mode and left available; this intentionally supersedes the old T031 requirement to stop isolated processes.

Final read-only comparison (HTTP/SQL, not a new UI PASS): pages20/20/5,total45; SQL products45, VERIFY balance10/facts15/ledger10 and DEMO-0009 balance5/facts4/ledger5. `work/inventory-003/t030-read-only.json`. Google client/secret absent in disposable configuration; live Google OAuth is unavailable/not run and is not required for this basic learning milestone. Full final browser cookie/header/error/Retry-After inspection was not completed after Chrome quit; unchanged earlier evidence retained with its original provenance.

Optional manual checklist (no new fault fixture): admin login → table/page/drawer/history; receipt1 then issue1 with a reason and compare displayed stock/history; try quantity0/fraction or blank reason (field error/no POST); try issue above stock (API stock error/no new fact); sign in as existing customer and check denial. For an operation already uncertain after a naturally occurring error, use only “Thử lại cùng thao tác” and reconcile history to confirm one fact; do not intentionally fault dev or treat a fresh submission as retry. Do not call cases PASS without observing them. No converge.

Availability only: initial /inventory cold compile exceeded the5s probe timeout; warmed /inventory and /login returned HTTP200. This is URL readiness, not a UI test.

## Historical initial evidence seed and chronological record


Language: **English** | [Tiếng Việt](vi/validation.vi.md)

2026-10-06. Node 24.21.0. Implementation in progress. No new automated tests or migration.

Disposable environment: inventory-002-verify-pg (55534), inventory_verify; inventory-002-verify-redis (56380). Shared databases are excluded.

| Scenario | Status | Evidence |
|---|---|---|
| US1/AC1 | NOT RUN | — |
| US1/AC2 | NOT RUN | — |
| US1/AC3 | NOT RUN | — |
| US1/AC4 | NOT RUN | — |
| US2/AC1 | NOT RUN | — |
| US2/AC2 | NOT RUN | — |
| US2/AC3 | NOT RUN | — |
| US2/AC4 | NOT RUN | — |
| US3/AC1 | NOT RUN | — |
| US3/AC2 | NOT RUN | — |
| US3/AC3 | NOT RUN | — |
| US3/AC4 | NOT RUN | — |
| US3/AC5 | NOT RUN | — |
| US4/AC1 | NOT RUN | — |
| US4/AC2 | NOT RUN | — |
| US4/AC3 | NOT RUN | — |
| US4/AC4 | NOT RUN | — |
| US4/AC5 | NOT RUN | — |
| US5/AC1 | NOT RUN | — |
| US5/AC2 | NOT RUN | — |
| US5/AC3 | NOT RUN | — |
| US5/AC4 | NOT RUN | — |
| FR001 | NOT RUN | — |
| FR002 | NOT RUN | — |
| FR003 | NOT RUN | — |
| FR004 | NOT RUN | — |
| FR005 | NOT RUN | — |
| FR006 | NOT RUN | — |
| FR007 | NOT RUN | — |
| FR008 | NOT RUN | — |
| FR009 | NOT RUN | — |
| FR010 | NOT RUN | — |
| FR011 | NOT RUN | — |
| FR012 | NOT RUN | — |
| FR013 | NOT RUN | — |
| FR014 | NOT RUN | — |
| FR015 | NOT RUN | — |
| FR016 | NOT RUN | — |
| SC001 | NOT RUN | — |
| SC002 | NOT RUN | — |
| SC003 | NOT RUN | — |
| SC004 | NOT RUN | — |
| SC005 | NOT RUN | — |
| SC006 | NOT RUN | — |
| SC007 | NOT RUN | — |

Quality gates, screenshots, auth/transport, fault/lifecycle checks: NOT RUN. Google credentials availability: NOT CHECKED. Task completion will reflect actual results.

## Setup evidence (T001)

Node v24.21.0. Independent npm ci completed with exit 0 in root/API/Gateway/web. Existing audit reports: root0, API35 (6 moderate/29 high), Gateway3 high, web6 high; no unrelated dependency updates made. Constitution, AGENTS and docs/en/conventions/frontend.md read; no search. Git/Prettier/ESLint/Docker ignores verified; private packages are not published. No extension hooks configured.

Disposable PostgreSQL responds to pg_isready; Redis PONG. Migration table contains all five existing migrations including CreateInventory1791158400000; no migration run or schema change. Containers reused only for verification. All runtime acceptance remains NOT RUN.

## Foundation implementation (T002–T007)

- Exact direct web additions: antd 6.6.5 and @ant-design/nextjs-registry 1.3.0. npm ls exit0: one deduplicated cssinjs 2.1.2, React/DOM19.3.0, Next16.3.6. No extra direct dependencies/v5 patch.
- Root AntdRegistry wraps the existing single Redux provider/bootstrap; ConfigProvider vi_VN and Ant App provide context. Production HTTP GET /login, /register, /dashboard each returned200 with ant-app markup, lang=vi and the antd-cssinjs SSR style tag. This proves emitted HTML only, not hydration/no flash/visual behavior.
- Legacy form/label/input/button/dl selectors are scoped to auth/dashboard; declarations preserved. Minimal inventory spacing/focus classes added. Visual comparisons remain NOT RUN under T008.
- Plain backend-shaped types and readonly payload/operation identity defined; no service wrapper, hook, Redux slice, persistence or UI route added yet.
- Next external rewrite defaults to Gateway3004. Configuration loading accepted default and valid HTTPS origin; rejected path, credentials, non-HTTP(S), malformed origin and cross-origin client base. Errors do not print the supplied origin. Example uses /api/v1 and server-only GATEWAY_ORIGIN. Existing ignored web .env retained; it still has legacy cross-origin configuration and requires NEXT_PUBLIC_API_URL=/api/v1 when running this foundation.
- Shared Axios inventory-only actor/deadline/signal checks run before/after refresh and at the transport adapter, including401 replay. Non-inventory authentication retains its existing policy. InventoryRequestError distinguishes local actor/access/deadline/abort and refresh failure provenance. Optional inventoryOnDispatch callback is transport-local metadata to record actual attempt dispatch without Axios cloning a mutable operation object; it never goes into headers/body or storage. The inventory page/attempt latch/outcome publication are NOT IMPLEMENTED yet (T018–T024).

Temporary ignored manual driver, synthetic Axios transport (not a browser test or PG write): valid request1POST; aborted before refresh0POST/0refresh; abort during preflight0POST/1refresh; abort during post401 refresh1rejectedPOST/0replay; failed preflight refresh0POST with before-dispatch provenance; failed post401 refresh1POST with after-post-401 provenance; one401 refresh/replay2POSTs total with identical key/serialized body; concurrent distinct requests share1refresh; refresh to another admin blocks initialPOST/replay; clock past cutoff while refresh waits blocks initialPOST/replay; cutoff before dispatch0POST. All observed expected outcomes. The driver is only an ad hoc manual dispatch exercise in ignored work/, not a new tracked automated suite or acceptance substitute. No actual inventory movement was written.

## Quality results

Root npm run check and npm run build: exit0 with NEXT_PUBLIC_API_URL=/api/v1. After the final sanitized configuration-error change, affected web lint/format/typecheck/build were rerun (see final result below). Initial web typecheck/build without override: exit1 because existing ignored .env contains unsupported cross-origin URL; recorded as configuration rejection, not a passing check. npm test: exit1, No tests found (0 matching API files); absent automated coverage, not PASS. No automated tests added.

## Previous checkpoint pause and current progress

The initial implementation turn paused at T008 after browser access was denied. The user then confirmed T8-1 through T8-10 all PASS; T008 is now checked off in both task lists and recorded as user-reported manual verification. No screenshots or Network exports were supplied.

A separate Gateway process already owned port3004 during the earlier attempt, so that process was not stopped. A later read-only health GET through the frontend rewrite returned200 with PostgreSQL/Redis ready. API/web runtime processes and the disposable containers started by the earlier turn were stopped; shared data was not changed. No migration, schema change or backend source edit.

T009–T011 are now implemented and checked off. The next dependent task is T012 manual US1 acceptance. All other acceptance, movement, fault/ledger and lifecycle checks remain NOT RUN. No converge was invoked.

Web lint/format/typecheck/build last passed with NEXT_PUBLIC_API_URL=/api/v1; npm test reports No tests found and is not counted as PASS. No automated tests were added.

## T008 browser checklist for user verification

The allowed browser tools were retried on 2026-10-06. Google Chrome access returned exactly “Computer Use was not approved to use Google Chrome”; `createBrowserTab("iab", "http://localhost:3002/login")` returned “Browser is not available: iab”. No attempt was made to use a different browser/control path.

An independent non-browser GET probe (not a browser PASS) confirmed `http://localhost:3002/login` and `/register` return HTML200, and `http://localhost:3002/api/v1/health/ready` returns200 with PostgreSQL/Redis ready. This confirms Next currently serves the frontend and its `/api/v1` rewrite reaches Gateway/API. It does not verify styling, hydration, browser cookies, or headers in the browser.

Please run this checklist at the frontend origin, not Gateway port3004:

| ID | URL and action | Expected result / evidence |
|---|---|---|
| T8-1 | Open `http://localhost:3002/login` in a fresh tab with DevTools Console and Network open; hard reload. Repeat direct load at `/register`, then `/dashboard`. | All pages render without blank/missing first-screen Ant styles, hydration errors or console exceptions. Login/register/dashboard presentation remains intact. Save sanitized screenshots and console outcome. `/dashboard` may redirect to `/login` when signed out. |
| T8-2 | From the frontend tab, open `http://localhost:3002/api/v1/health/ready`. | Same-origin Next rewrite reaches Gateway/API and returns JSON200 with PostgreSQL and Redis ready. Network request origin stays `localhost:3002`; do not use `3004/login` as the frontend URL. |
| T8-3 | Register a disposable account from `/register`, then sign in at `/login`. Inspect Network for `/api/v1/auth/register` and `/api/v1/auth/login`; inspect Cookies for login's `inventory_refresh` response cookie. | Register returns success and routes to login; login routes to dashboard. Login response sets `inventory_refresh` as HttpOnly, SameSite=Lax, Path `/api/v1/auth`; access token and user are saved by the existing auth session. Do not include credentials, cookie values, or tokens in evidence. |
| T8-4 | While signed in, in DevTools Console run `fetch('/api/v1/auth/me',{headers:{Authorization:'Bearer '+JSON.parse(localStorage.getItem('inventory.auth.session')).accessToken}}).then(r=>console.log('me status',r.status))`. Inspect the resulting Network request. | `/api/v1/auth/me` returns200; the same-origin request carries the Bearer token and browser sends applicable cookies. Share only status/header-presence, never the token. |
| T8-5 | Verify refresh on a disposable signed-in session: in Console replace only the stored access token with an expired-shaped value (`const k='inventory.auth.session',s=JSON.parse(localStorage.getItem(k));s.accessToken='e30.eyJleHAiOjF9.x';localStorage.setItem(k,JSON.stringify(s));location.reload()`). Inspect `/api/v1/auth/refresh`; after it completes, navigate to Dashboard. | Existing HttpOnly refresh cookie is forwarded through Next/Gateway; refresh returns200, updates stored session and leaves the user signed in. This fixture makes the frontend treat access as expired; it sends no protected inventory request. |
| T8-6 | Sign out from the dashboard. Inspect Network and Cookies. | `/api/v1/auth/logout` completes; refresh cookie is cleared and the app returns to login. |
| T8-7 | If Google OAuth credentials are configured, select “Tiếp tục với Google” at `/login` and complete the normal sign-in/callback. If they are absent, check only whether required credentials are configured; do not record their values. | Configured flow returns through `/api/v1/auth/google/callback` to `http://localhost:3002/auth/callback`, refreshes the session, and reaches dashboard. If unconfigured, record Google flow “unavailable: credentials not configured” as permitted by T008. |
| T8-8 | In the disposable local environment, submit 11 invalid login attempts within one minute from the frontend (the configured login policy allows10/minute). Inspect the 11th response in Network. | Gateway returns429 `RATE_LIMIT_EXCEEDED`, `Retry-After` is readable at the frontend origin, and the response body is readable. Wait for the short policy window to reset before further login checks. |
| T8-9 | If a separate disposable API/Gateway fault environment is available, request `/api/v1/auth/me` through `localhost:3002` with a valid bearer while the upstream API is unavailable; restore API immediately. | Gateway's502 `UPSTREAM_UNAVAILABLE` status/body and any Retry-After header are visible through the same-origin rewrite. Do not stop a shared API process; otherwise mark this case blocked with the environment reason. |
| T8-10 | If disposable PostgreSQL fault injection is available, hold the inventory balance row lock until the API statement timeout and submit one manual inventory request directly to API port3001. Inspect the response in DevTools Network; then release the lock and reconcile that no movement committed. | Direct API returns503 `INVENTORY_BUSY` with readable `Retry-After: 1`; release/rollback leaves no movement. Through Gateway port3004, its five-second proxy timeout may instead return502 `UPSTREAM_UNAVAILABLE`; record the observed source/status, do not call it API503. If no safe disposable fault setup is available, mark unavailable and do not use shared data. |

Return the results as `T8-1 PASS`, `T8-2 PASS`, etc., and mark any unsupported item `BLOCKED` with a short reason. For screenshots or Network details, redact email, cookies, Authorization values, tokens and Google callback parameters. The user subsequently reported all checklist rows PASS; the result is recorded in the T008 section above.

## T008 manual result (2026-10-06)

The user reports that all applicable browser checklist items T8-1 through T8-10 passed. This is a user-reported manual result; no screenshot or Network export was supplied to the agent. T008 marked complete in both task languages on that report. No credentials, tokens, cookies or callback values recorded.

## US1 implementation (T009–T011)

Added `/inventory` route and admin-gated left-sidebar/right-content page. It waits for Redux session initialization, redirects a signed-out session to `/login`, denies customer role without protected inventory calls, shows the reconciliation reminder on entry, and provides dashboard/sign-out navigation. Added an admin-only Inventory button to Dashboard; customer dashboard remains without that entry. Added stock Table columns name/SKU/status/current stock/Inventory drawer action, server page/limit/total pagination with 10/20/50/100 sizes, size reset to page one, read loading/empty/error/retry, abort plus query-identity stale-response suppression. No search or sorter. Row action currently shows product identity/current listed balance in the drawer; independent latest stock/history reads and the final drawer UI are T013–T014.

Web lint, format check and typecheck exit0 after this code. T009–T011 marked complete in both task lists. No user-session browser rendering or 45-product pagination was performed by the agent. T012 remains pending manual US1 acceptance.

### T012 manual acceptance requested

### Agent browser recheck (2026-10-06)

Chrome native Computer Use is now accessible. Initial frontend navigation returned ERR_CONNECTION_REFUSED; restarted web with NEXT_PUBLIC_API_URL=/api/v1, and restored API/Gateway plus the existing disposable inventory-002-verify-pg/redis containers. No database writes, seeds, migrations or movement POSTs were performed.

T12-1 PARTIAL / BLOCKED: signed-out direct navigation to /inventory visibly displayed the redirect state then /login. DevTools Network with Keep log and filter /api/v1/inventory showed 0 / 35 requests. Customer denial and the authenticated bootstrap case remain unverified: no usable disposable customer/admin browser session or known fixture login password was available.

T12-2 through T12-7 BLOCKED: authenticated admin checks require a disposable admin session. Read-only SQL confirmed the disposable database contains 18 products, not the required 45, so 20/20/5 pagination cannot be verified. No screenshot captured; no credentials/token/cookie values recorded. T012 remains unchecked; T013 was not started.

Use a disposable database with at least45 catalog products; do not seed shared data. At `http://localhost:3002/inventory`, sign out first and load directly, then sign in as a customer and load directly, then sign in as an admin. Expected: wait/redirect and customer denial send no protected inventory GET; admin sees left sidebar/right content, reconciliation reminder and the page/limit/total GET through the frontend origin. Capture a sanitized screenshot and Network request.

With 45 products, verify default20 gives20/20/5 and total45. Try size10/20/50/100 and confirm size change resets page1, total comes from server, untouched rows show0, inactive rows remain visible, and out-of-range stays empty without changing the total. Open a row's Inventory action and verify the selected name/SKU/status/balance. Rapidly change pages under DevTools Slow 3G and confirm an older response never replaces the selected page. Toggle DevTools Offline during a read: failed load must show an error, no empty-catalog/zero inference, and its retry should recover after going Online. Confirm no search/sort controls and no movement POST in Network. Return results as `T12-1 PASS` through `T12-7 PASS`, with failures and sanitized evidence; do not mark T012 until results arrive.

## T012 fixture preparation and browser attempt (2026-10-06)

Continued speckit-implement from T012; preserved T001–T011. Prerequisites resolve this feature; requirements checklist 16/16 PASS; no extensions.yml or before/after hooks. Reviewed plan/data-model/contracts/research/quickstart/constitution/frontend conventions and existing ignore rules. No new automated tests, search, migrations, backend changes or converge.

Isolation confirmed before writes: Next frontend3002 uses /api/v1 rewrite to Gateway3004; Gateway runtime parent uses work/inventory-002/runtime.cjs with upstream API3001. API runtime parent uses the same isolated config; live API sockets connect to PG127.0.0.1:55534 and Redis127.0.0.1:56380. Named containers inventory-002-verify-pg/redis use those loopback ports; database inventory_verify. Frontend /api/v1/health/ready returned200 with both dependencies true. Shared databases on55433/55432 were not modified.

Authorized fixture preparation: existing admin:create command created a new disposable admin; /auth/register through frontend created a new disposable customer. Existing seed:products --count=30 inserted27 previously missing DEMO products, taking total18→45. Final catalog:43 ACTIVE,2 INACTIVE (existing inactive products retained). Credentials are generated privately and retained only in an ignored mode0600 fixture file; no credentials/tokens copied into tracked evidence. No movement POST or ledger writes performed.

Supplemental real HTTP checks through frontend (not browser acceptance): admin login succeeded; GET inventory pages1/2/3 limit20 returned200 with20/20/5 rows,total45. Page999 limit20 returned0 rows,total45. Page1 limits10/50/100 returned10/45/45 rows,total45. Limit50/100 included both inactive products and35 zero-stock rows. These checks do not prove UI size-reset, race handling, drawer identity or browser session gating.

Chrome Computer Use repeatedly interrupted actions with “The user changed '/Applications/Google Chrome.app'. Re-query the latest state with get_app_state before sending more actions.” Fresh observations showed switching among Inventory and another Chrome window/Picture in Picture. Selecting the Inventory window and refreshing state did not yield a completed fixture login. No alternate browser-control mechanism used; no screenshot captured because acceptance UI was not reached. Requested an uninterrupted Inventory tab via an asynchronous user question; no answer received during this attempt.

T12-1 remains PARTIAL/BLOCKED (earlier signed-out redirect/zero inventory request observed; customer/pending bootstrap not verified). T12-2–T12-7 remain BLOCKED for Chrome completion, despite fixture availability and supplemental HTTP results. Late403, Slow3G/stale response, Offline/retry, drawer, no-search/sort and no-movement browser evidence remain unverified. T012 remains unchecked in both task lists; T013 not started because it depends on T012. Isolated runtime remains available for continued verification.

## T012 UI continuation interrupted (2026-10-06)

User requested reuse of the existing45-product fixture/HTTP results, frontend3002 only, and immediate stop if browser interaction is interrupted again. Prerequisites resolve /Users/asim/Desktop/inventory-api/specs/003-frontend-inventory; requirements16/16 PASS; no extensions.yml (before/after hooks skipped). Existing plan/task/context and ignore verification from the preceding implementation run retained. API3001/frontend3002/Gateway3004 listener processes unchanged. No fixture recreation or database writes.

Chrome initially selected Picture in Picture. Window menu selected Inventory Auth; observation showed frontend http://localhost:3002/dashboard and a signed-in customer, no admin Inventory entry. Network showed an existing frontend /api/v1/auth/login200; this was observed pre-existing session state, not a fixture login completed in this run. Attempted to clear/filter Network and navigate the same tab directly to /inventory. The tool returned “The user changed '/Applications/Google Chrome.app'. Re-query the latest state with get_app_state before sending more actions.” Stopped all browser interactions immediately per the user's explicit instruction; did not retry/re-query after interruption. The diagnostic does not establish whether a human interaction or window-state tracking caused it.

No new T12 item PASS. Customer direct-route denial/no protected GET, explicit admin/customer fixture login, pending-session gating, later403, admin layout/table, UI20/20/5,total45,size10/20/50/100/reset,out-of-range/zero/inactive, drawer identity, Slow3G/stale-response, Offline/error/readretry, no search/sort/no movement Network remain unverified in this continuation. Existing signed-out partial and HTTP-only evidence remain unchanged; HTTP not promoted to UI PASS. No screenshot captured. T012 remains unchecked in both task lists; T013 not started; no automated tests/search/converge.

## T012 browser unavailable on continuation (2026-10-06)

Ran the requested speckit-implement prerequisites and reviewed implementation context. Requirements checklist:16 total,16 complete,0 incomplete (PASS). No extensions.yml; pre/post hooks skipped. Existing fixture and HTTP evidence preserved without database access, fixture recreation or runtime changes.

Computer Use inventory reported Google Chrome isRunning=false and browsers=[]. Attempted one frontend tab with createBrowserTab("chrome", "http://localhost:3002", {sessionName:"🔎 T012 UI"}); returned exactly “Browser is not available: chrome”. Stopped browser actions immediately under the user's stop-on-interruption instruction; no alternate control path or browser restart attempted. This is browser availability failure, not evidence of user interference or frontend failure.

No login or UI check completed in this run; no screenshot/network evidence captured. Still unverified: explicit admin/customer login, customer direct-route denial/zero protected GET, pending-session gating, late403, admin layout/table,20/20/5 total45, size/reset/out-of-range/zero/inactive, drawer identity, slow/stale reads, error/retry, and absence of search/sort/movement requests. Existing signed-out partial and HTTP-only results are unchanged and are not UI PASS. T012 remains unchecked in both languages; dependent T013 and later tasks not started. No converge.

## T012 retry requested: stale browser element (2026-10-06)

User authorized retry. Computer Use now reported Chrome running; native Chrome binding showed one New Tab. Navigated that same tab to http://localhost:3002/inventory; visibly returned ERR_CONNECTION_REFUSED. Started existing isolated API/Gateway runtime commands and frontend production start with NEXT_PUBLIC_API_URL=/api/v1; no seed, migration, fixture or database change. Attempted Reload using the observed element107; tool returned “Computer Use server error -10005: The element ID is no longer valid. Try to get the on-screen content again and see if that resolves the issue.” Stopped browser actions without re-query/retry under the user's interruption rule. Runtime startup was attempted, not verified healthy in this run.

No new UI PASS, screenshot or Network evidence. All outstanding T012 criteria listed above remain unverified; preserved45-product fixture and historical HTTP results, without promoting HTTP to UI PASS. T012 remains unchecked; T013 not started; no converge. No extension hooks configured.

## T012 single retry interrupted (2026-10-06)

User authorized one more retry. Fresh Chrome AX observation showed the same single frontend tab at localhost:3002/inventory with “Không có quyền truy cập Chỉ quản trị viên được xem tồn kho.” This verifies the visible denied view only; session identity/role and zero protected GET were not verified. Read existing ignored fixture credentials for the intended login; no fixture recreation or writes. Attempted same-tab navigation to /dashboard to switch session; tool returned “The user changed '/Applications/Google Chrome.app'. Re-query the latest state with `get_app_state` before sending more actions.” Stopped immediately without further browser actions. No screenshot/Network capture; no completed fixture login or new full acceptance PASS. Remaining T012 checks unchanged; historical HTTP remains HTTP-only, fixture45 preserved. T012 unchecked; T013 not started; no converge. No extension hooks configured.

## T012 retry: runtime differs from preserved fixture (2026-10-06)

Fresh Chrome observation showed the same frontend /inventory tab with admin layout, reminder, stock table columns and20 visible rows/20 per page. Visible total is200, not the preserved45-product fixture; no pagination acceptance PASS claimed. Read-only lsof: API35249 on3001 has Redis connection [::1]:6379 and cwd apps/api; Gateway35232 on3004 cwd apps/gateway; frontend35207 on3002. Expected disposable Redis is56380. Current database identity not confirmed. No data writes or fixture recreation. Asked permission to replace current dev stack with existing isolated verification runtime; awaiting response. T012 remains unchecked; T013 not started; no converge.

## T012 UI evidence on user-authorized200-product catalog (2026-10-06)

User explicitly directed keeping the current200-product catalog for UI verification; no stack switch, seed or data write. The earlier request to replace runtime is superseded. Preserved45-product fixture and historical HTTP evidence unchanged;200-product UI results do not assert45-product UI20/20/5.

Observed via native Chrome on the same localhost:3002 frontend tab: admin sidebar/content, reminder, columns name/SKU/status/stock/action; page1/page2/page10 each20 rows,total200; last-page Next disabled. Changed size from20 on page10 to10: returned page1 with10 rows and first product DEMO-0134; sizes50 and100 displayed50 and100 data rows respectively. Options10/20/50/100 visible. Zero stock shown on multiple rows; no search/sort control observed. This verifies sampled pages, not all10 pages or duplicate/missing-row reconciliation.

Signed out to /login. After user said continue, submitted the existing filled login form; visibly reached /dashboard with role admin, authenticated state and Inventory button. No credential values recorded. Followed Inventory entry: fresh default page1/20,total200. Opened first row drawer: Travel Ethernet Adapter / DEMO-0134 / ACTIVE / stock10 matches table. Screenshot emitted in conversation shows drawer/admin layout without credentials/tokens; no screenshot file saved.

Requested existing customer login information for the current stack via asynchronous question; not received before interruption. While preparing Network checks, refreshed AX state then attempted drawer close; tool returned “Computer Use server error -10005: 637 is an invalid element ID”. Stopped browser actions under user's interruption rule. No new Network capture.

T012 remains PARTIAL/unchecked. Still missing customer login/denial/no protected GET, waiting-session Network gating, late403, inactive visibility, out-of-range/empty UI, slow/stale page responses, error/readretry, Network transport/page-limit-total/no movement evidence and SC001 timing. Admin login/layout, sampled pagination/size-reset, zero-stock display and drawer identity have direct UI observations; HTTP not promoted to UI PASS. T013 not started; no converge. No extension hooks.

## T012 targeted continuation: environments and evidence (2026-10-06)

Requested speckit-implement prerequisites resolve this feature; requirements16/16 PASS. Previously reviewed context/constitution/conventions and ignore rules retained; git repo/private packages confirmed. No extensions.yml: pre/post hooks skipped. No product/source change, new tests, seeds, migrations or converge. Prior dev200 admin login/pagination/drawer evidence retained without rerunning those acceptance checks.

Environments:
- DEV: frontend localhost:3002, existing API3001/Gateway3004, catalog200. Only normal read/navigation for Network evidence; no dev fault or data mutation.
- DISPOSABLE: copied unchanged web source in /private/tmp/inventory-t012-web (inventory owner byte-identical), frontend localhost:3102 → temporary proxy3105 → real Gateway3104 → API3101 → existing inventory_verify PG55534/Redis56380. Reused existing45-product fixture/accounts. Ignored manual driver work/inventory-003/ui-runtime.cjs and mode file ui-fault-mode.json. Proxy affects GET Inventory only; 403/502 are synthetic display/transport fixtures, not real backend authorization revocation or upstream outage. Delay holds the actual Gateway response after receipt. No inventory POST/data preparation. Sandbox initially denied port bind EPERM; approved rerun started the isolated stack. No frontend implementation changed.

| Criterion | Result / environment / evidence |
|---|---|
| Network stock transport | DEV: observed GET http://localhost:3002/api/v1/inventory?page=2&limit=20, same-origin remote3002, Bearer present (value omitted), shared api.ts initiator.304 Not Modified with cached Preview items/page2/limit20/total200. This was a targeted Network read, not rerunning pagination acceptance. |
| Customer login/gate | DISPOSABLE: existing customer fixture login reached dashboard with customer role/authenticated state and no Inventory entry. Cleared Network, filtered /api/v1/inventory, direct navigation to /inventory showed denied Result; Network0/10 requests. Screenshot emitted in conversation shows denial and empty filtered Network. PASS for this disposable customer case. |
| Later GET403 | DISPOSABLE proxy403 after successful admin catalog read: new GET page2/limit20 returned403 Forbidden, table removed and generic error/Thử lại shown. No table data published by rejected read. Proxy normal + Retry produced GET same page2/limit20,200 and restored total45. PASS for synthetic late403 response handling; real role revocation and open-drawer access loss not tested. Admin login here only established the disposable fault session. |
| Read error/retry | DISPOSABLE proxy502: GET page3/limit20 returned502 Bad Gateway; UI error/Thử lại, no empty-catalog or fabricated zero. Proxy normal + Retry produced GET same page3/limit20,200 and restored catalog. PASS for synthetic502 UI handling. Not a real API outage. |
| Inactive/zero | DISPOSABLE: observed Renamed current product / VERIFY-ISSUE-RENAMED / INACTIVE /0; later VERIFY-INACTIVE /INACTIVE /0. Existing real fixture rows, no edit. |
| Slow/stale | DISPOSABLE: actual page2 response held15s; observed Network pending and eventual304 at15.03s. Attempts to move to another page while pending did not provide a confirmed overlapping new GET/canceled old request. Re-read AX and used fresh IDs, including after window-change diagnostic; never reused a known invalid ID. Stale-response acceptance NOT VERIFIED. Slow request witnessed, loading visual acceptance incomplete. |

Browser window-change diagnostics were recovered by fresh state and selecting Inventory tab. No unrelated tab action. Last state call returned no usable content; no extra PASS inferred. Screenshots are conversation artifacts, not saved local files. Credentials/header values omitted from tracked evidence. Proxy restored to normal at end; isolated stack left running for manual verification. Dev runtime unchanged. No new quality tests needed because source code unchanged.

T012 remains unchecked in both task lists. Still missing complete waiting/bootstrap Network gating, slow loading presentation and overlapping stale response proof, actual out-of-range UI and empty-catalog UI. DEV200 sampled pagination evidence remains accepted per user instruction; historical45 HTTP evidence is not promoted to UI acceptance. T013 remains blocked by T012.

### Manual verification of remaining T012 criteria

Use the disposable frontend http://localhost:3102 in the same tab; do not fault dev3002. Keep Network recording with Disable cache, Keep log and filter /api/v1/inventory; redact Authorization/cookies/login payloads before sharing. Existing disposable credentials are in ignored mode0600 work/inventory-003/browser-fixture.json; do not include them in evidence.

1. Waiting bootstrap: clear Network, sign out; directly load /inventory. Expect login redirect with0 Inventory GET. For pending initialization use Slow3G while reloading an existing disposable customer session; until role resolves,0 Inventory GET and no protected table. Customer denial0GET already verified above. Capture timeline/screenshot; if initialization is too fast to observe, mark pending case unavailable instead of PASS.
2. Slow/stale: while normal mode on page1, set work/inventory-003/ui-fault-mode.json to {"mode":"stale"}. Click page2 (proxy holds15s), then click page1 or3 while Network still pending. Expect loading UI; request2 canceled or its completion ignored, new selected-page GET/result retained after15s. Record both request timings and selected page/first SKU before/after. If loading overlay prevents page change, record that limitation/failure; do not claim stale PASS. Reset file to {"mode":"normal"}.
3. Empty: mode {"mode":"empty"} returns synthetic items[]/total0 without changing database. Trigger a new read; expect explicit empty message/total0, no read-error or invented stock row. Label screenshot display-only fixture; restore normal and Retry/navigation fresh read.
4. Actual out-of-range: current UI has no page999 control; no dev deletion allowed. Use a disposable response override/proxy where selected page becomes greater than ceil(total/limit), then inspect empty UI with server total preserved. Record selected page/limit/total and empty items; do not count historical page999 HTTP as UI evidence. Current ignored proxy out-of-range mode alone returns empty items/total45 and is insufficient to prove selected page is out of range.

Network/403/502 retry/customer criteria above do not need rerunning unless source changes. No automatic converge.

## T012 completion: remaining four criteria (2026-10-06)

Preconditions/context/ignores checked; requirements16/16 PASS; no extension hooks. Same disposable stack3102→3105→3104→3101, PG55534 inventory_verify/Redis56380; reused45 fixture. DEV3002/catalog200 untouched and its earlier accepted UI evidence retained. No frontend source change during T012; no new tests/search/converge. Proxy driver enhanced only in ignored work/: held refresh/read responses, sanitized start/close timing log, empty total0/out-of-range total1. Screenshots emitted in conversation, no credentials in tracked evidence.

- Bootstrap PASS: manually replaced only disposable browser stored access token with expired-shaped fixture then reloaded /inventory; held real refresh response. Waiting spinner/AX “Đang kiểm tra phiên đăng nhập”, filtered Network0/10 requests, no catalog. Proxy log refresh start1791277919951, close1791277948746 (28.795s); Inventory GET only at1791277948890,144ms after refresh completion. Restored proxy normal. Screenshot captures waiting/0GET.
- Loading/page race PASS: held actual page2/limit20 response; visible spinner overlay/no previous rows, Network pending. Mouse pagination covered by Ant Spin overlay; used keyboard ShiftTab to focus page3 then Enter. Old GET canceled after21.326s (completed:false), page3 GET followed and completed35ms. Screenshot shows old canceled/new page3 selected/five rows/first SKU DEMO-0012,total45. Restored normal; page3 data remained.
- Size race PASS: while page2/20 pending, keyboard Tab to size selector then choose50. Network canceled old request at5.424s; new GET page1/limit50 completed35ms,45 rows,total45,size50. Restored normal; old response never overwrote new size/query. One earlier slow setup exceeded Next rewrite30s and returned500; recorded as failed setup, not stale proof. Subsequent overlapping run above is the passing evidence.
- Session race PASS: while admin page2 read pending, signed out; old GET canceled. Established existing disposable customer session, returned /inventory after normal release: customer denial/no catalog. Old admin result did not republish protected data. Session login was setup for race, not rerunning prior admin login acceptance.
- Empty PASS (display-only proxy): response200 {items:[],page:2,limit:20,total:0}, Preview confirmed. UI explicit “Không có sản phẩm trong trang này”,no error/no stock rows. Ant Table hides pagination entirely at total0 (no visible total label); no invented totals. Screenshot captured.
- Out-of-range PASS (display-only proxy): selected page3 from real total45, then proxy returned200 {items:[],page:3,limit:20,total:1}; page3>ceil(1/20). UI explicit empty/table0rows, “Tổng1 sản phẩm”; no replacement fetch/page clamp performed by owner. Ant pagination visually clamps displayed page to1 with prev/next disabled while requested page remains3; preserved server total1. Preview/screenshot captured. Normal mode restored after verification.

Together with prior signed-out/customer/admin/late403/error-retry/Network/inactive/zero and user-authorized DEV200 pagination evidence, US1/AC1–4 and SC001 are complete within T012. Prior45 HTTP results remain HTTP-only; no claim45 UI20/20/5 was rerun. T012 marked[X] in both task languages; next T013. Broader feature acceptance remains incomplete.

## T013–T015 drawer implementation and verification (2026-10-06)

T013/T014: typed Ant Drawer separates stock GET envelope `{inventory:StockItem}` from paginated movement GET. Both have independent loading/error/retry; query identity includes actor/product/attempt and history page/size. Cleanup aborts old reads; close/reopen resets history1/20 and retains stock table page/size. Fields include type, quantity, before/after, actor UUID, reason and ISO UTC; no edit/delete/forms/POST. Web lint/typecheck passed after envelope correction.

T015 environment: disposable frontend3102 → proxy3105 → Gateway3104 → API3101 → inventory_verify PG55534/Redis56380. DEV data unchanged. Reused45 products. Necessary history fixture only: existing VERIFY-MIXED42 facts extended with3 receipt1 facts through disposable API, yielding45 facts, SQL ledger24=balance24. Ignored fixture runner/evidence contains sanitized counts; no product recreation.

- Real Mixed history page1/2/3:20/20/5 rows, total45, GET200; stock24. Stock table size50 while history20 demonstrated independent pagination. History size50 displayed45 rows. From stock table page2/size20, closed/reopened Mixed: table retained2/20, history reset1/20. Screenshots/AX/Network emitted in conversation.
- Real DEMO-0003: stock0 and explicit “Chưa có lịch sử tồn kho trong trang này”, no read error. Real VERIFY-ISSUE-RENAMED: INACTIVE, current name Renamed current product, stock0,3 history facts; UTC timestamps include2026-10-06T03:53:04.715Z, actorUUID/reason/balances displayed.
- Display-only proxy502 targeted movements: stock24 remained ready, history error and its retry. Normal + history retry restored45; stock request not repeated by retry. Targeted stock502: history45 remained available, stock error/stock retry; normal retry restored24. No backend outage implied.
- Display-only proxy404 for product reads: separate stock/history error states and retry controls; no fabricated zero/empty state. No product deleted; fixture product remains real.
- Held actual stock/history responses for DEMO-0003, observed stock loading and history loading. Closed drawer while pending: both requests canceled (completed:false), stock11.661s/history5.678s. Released normal, opened Renamed: stock0/history3/current identity retained in later state and screenshot; canceled old empty response did not overwrite new history. Proxy timing log start1791279288265/1791279294248, cancel1791279299926; new selection GETs1791279314128/129 completed43/50ms.

Proxy restored normal after every fault and remains normal. Native AX often reflects closing animation; fresh full state supplied new locators before retry. No new tests/search/converge. US2/AC1–4 and SC002 history45 acceptance complete; T015 marked in both task lists. Next T016. Screenshots are conversation artifacts rather than saved local files.

## T016–T019 implementation; T020 interrupted (2026-10-06)

T016: local Ant Form defaultRECEIPT, quantity/reason initially empty. Exact enum; numeric integer1..1,000,000; trim reason and count Unicode codepoints1..500, no UTF16 maxlength. Form locks for nonterminal operation; stock readiness gates submit independently of history and INACTIVE remains allowed.
T017: Ant App confirmation for drawer close/mask/Escape, product switch, dashboard, logout/login. Cancel leaves operation intact. Confirm rechecks identity, aborts lifetime signal and marks discarded before clearing references/action. Conditional native beforeunload for nonterminal operation. No cancellation/rollback promise.
T018: synchronous operation ref latch, frozen actor/product/body/key, one UUID per new operation; first actual dispatch establishes24h deadline, timeout15s, shared Axios actor/deadline/signal metadata. Actual dispatch and attempt IDs tracked; late discarded/mismatched callbacks ignored. Matching live attempt releases sending in finally regardless of current access. No POST from effect/timer.
T019: validates matching201 result before terminal success. Success resetsquantity/reason, keeps type, independently refreshes table/stock/historypage1. Recognized stock409 resetsdraft/reloadsstock;400 INVALID_INPUT without earlier uncertainty retainsdraft/field errors. Recognized product404 terminal; unknown/transient stayslocked, no newkey. Terminal result stored privately; reads/reset apply only when original admin/current selection is authorized. US4 recovery/auth restoration remains pending tasks, no claim implemented.

Web lint/typecheck exit0 after final correction. Initial T019 typecheck failed on Form.setFields name inference; changed names to typed literal tuple and reran typecheck/lint successfully. No automated tests added. T016–T019 marked in both task lists as implementation tasks; their manual acceptance is T020 and remains UNVERIFIED. No broader build/runtime PASS inferred. Current source copied to disposable web only for forthcoming verification.

T020 interruption: first form observation returned Chrome Outlook window instead of Inventory. Stopped UI actions as requested; did not interact with mail or perform a movement UI write. Proxy mode file confirmed normal. Existing disposable stack remains running; dev data unchanged, earlier evidence retained. T020 stays unchecked; T021 onward not started because sequential checkpoint.

Remaining T020 manual verification (use3102 only, PG55534/Redis56380; no dev faults):
1. Existing zero-stock disposable DEMO-0003: receipt10 then issue3 then issue8. Expect balances10→7→reject8, exactly2 new facts/ledger7; verify SQL. Then exact-stock issue7 succeeds; inspect INACTIVE receipt/issue on existing disposable inactive product.
2. Form: empty,0,negative,fraction,string,1,1e6,1e6+1 and trimmed reason;500 Unicode codepoints including emoji accepted,501 rejected. Capture validation and outgoing POST count (invalid0), not merely typecheck.
3. Double click valid submit: exactlyone POST/key; next distinct operation has a different UUID. Redact key/token/body sensitive contents from saved evidence.
4. With targeted proxy history502/stock normal, valid submit allowed; targeted stock502 must block new submit. Restore normal each time.
5. Successful movement followed by failed refresh GET: success remains terminal/form unlocked; read retries GET-only with no new movement. Test delayed write plus close/mask/Escape/switch/menu/dashboard/logout/login cancellation/confirmation; guard must be active during sending/uncertain. Use disposable transport fixture only; restore proxy normal.

These manual steps are instructions, not performed/PASS evidence. No search/tests/converge. No extension hooks configured.

## T020 resumed: partial UI evidence, browser interruption (2026-10-06)

Prerequisites feature003/requirements16of16 PASS; context, constitution, frontend conventions and ignore configuration retained/reviewed. No extension hooks. Frontend source unchanged; did not rerun T001–T019 acceptance or quality checks. Existing disposable stack3102→3105→3104→3101/PG55534 inventory_verify/Redis56380, catalog45 retained; DEV untouched. No new fixtures/products or automated tests/search/converge.

Confirmed native Chrome Inventory tab URLlocalhost:3102/inventory and real DEMO-0003 zero-stock form. One “user changed Chrome” diagnostic recovered through fresh state/new locator; no stale click repeated. InputNumber native setValue did not set10; validation correctly blocked initial empty quantity, then keyboard entry set10.

Verified evidence:
- Double-click receipt10: exactlyone POST at1791279879860, stock10, quantity/reason cleared, trimmed reason displayed “T020 receipt ten”. Issue3 POST1791279898541 resultedstock7. Issue8 POST1791279908791 returned real409 INSUFFICIENT_STOCK (Network Response/screenshot), stockremained7, resetqty/reason and retainedISSUE. Read-only SQL immediately after: facts2/ledger7/balance7. Screenshot emitted in conversation.
- Exact-stock issue7 succeeded →stock0. Empty quantity/reason,quantity0,-1,1.5,1,000,001 and501emoji all produced form validation; no movement POST between exact-stock success and subsequent validmax submit. Typing “abc” into InputNumber reverted to previous invalid1,000,001; safe rejection observed, not a string payload dispatch.
- Real receipt1,000,000 with500emoji succeeded, stock1,000,000; no UTF16 truncation/rejection. Reason501emoji previously rejected at quantity1. Native AX observed validmax quantity before submit.
- Display-only proxy502 GET movements: stock1,000,000 ready/historyerror; receipt1 succeeded →stock1,000,001, historyerror persisted while successshown. Normal+historyretry restored5facts; log GET-only for retry.
- Display-only proxy502 all InventoryGET, POST forwarded normally: receipt1 succeeded, successmessage remained, stock/historyrefresh errors; submitdisabled while stockerror. Normal+stock/historyretry restoredstock1,000,002/history6facts, no new POST. Final read-onlySQL facts6/ledger1,000,002/balance1,000,002. Fault is UI transport fixture, not real API outage.

Sanitized proxy log has8 POST starts in this verification window, including two starts near max submit1791280050117/1791280050359; SQL confirms onlyone max fact. Automatic auth replay is possible but provenance/key equality for these two requests was not observed and is NOT claimed. Initial receipt doubleclick remains exactlyone POST in its own window. Other starttimes: exact1791279955979,history-error1791280082535,refresh-error1791280113107.

Browser interruption: after restarting isolated proxy to add necessary slow-write mode/sanitized key-hash metadata, first state showed Inventory table. Browser Find for INACTIVE then returned `Computer Use server error -10005: cgWindowNotFound`. Stopped UI input; no slow-write request sent, no INACTIVE write. Proxy confirmednormal; isolated stack remains running. No source changes from proxy work; only ignored manualdriver.

T020 stays unchecked in both lists. Remaining criteria: real INACTIVE receipt/issue; outgoing new-operation UUIDdifference/exactone header and extra max-request provenance; guard active during sending/uncertain (cancel/confirm). Use3102, existing VERIFY-ISSUE-RENAMED(INACTIVE0), receipt1/issue1 then SQL; proxy slow-write holds actual committed POST response, use close/cancel then confirm and reconcile real history, never claim abort=rollback. Capture masked Network or sanitized metadata hashes for two new operations. Restoremode normal after each. Complete guard lifecycle matrix later at T027; do not advanceT021 before T020. Prior partial evidence above is retained without rerun if code unchanged.

## T025 resumed: partial US4 recovery evidence (2026-10-06)

Environment: disposable frontend3102 → proxy3105 → Gateway3104 → API3101 → PostgreSQL `inventory_verify`/Redis56380; reused existing45-product fixture. DEV3002/API/Gateway and its catalog were untouched. The ignored proxy fault-mode was set to synthetic `429` for one POST; this was a display-only fixture, not a Gateway/API rate limit. Chrome Network showed POST `/api/v1/inventory/{id}/movements` →429. UI retained frozen RECEIPT quantity1/reason `T025 429 retry`, displayed retryable state and a same-operation retry action. No automatic POST was observed. Proxy was returned to `normal` before using the same-operation retry button. Network then showed 201 Created; the drawer showed success and total history6→7. The new fact had before1/after2 and was visible in history. Read-only SQL after retry confirmed INACTIVE SKU `VERIFY-ISSUE-RENAMED` has7 facts and balance2=ledger2. This UI result is not a complete T025 PASS.

The earlier lost-response test remains: the disposable proxy held the actual committed response until the client timed out; a manual retry used the same sanitized SHA-256 key hash and API returned the same movement ID as a replay, with exactly one new fact. T025 remains unchecked. Still unverified here: synthetic503/500/502 and `IN_PROGRESS`/`KEY_REUSED` UI stubs; prior-unknown and terminal stock-error replay paths; Retry-After timing and no-loop proof beyond observed manual retry; deadline/automatic401 identity/body races; different-admin zero-POST and the four auth-provenance rows; late POST completion while access is lost and restoration without protected publication; current-attempt rejection while an older attempt is uncertain. Proxy mode was reset to `normal` after this attempt. No automated tests/search/converge were added.

Continuation stopped at the browser boundary: the next fresh Chrome state showed an unrelated LoHi tab selected and the existing Inventory Auth tab inactive. A tab-selection action returned the CUA “user changed Chrome” interruption diagnostic; a fresh state/DOM confirmed the active page was unrelated. Per the user’s interruption instruction, no further Chrome action was taken. The proxy remains `normal`; no POST was sent during this interruption. Resume remaining T025 only when the Inventory UI is again available in the authorized stable tab.

On the next user-authorized `continue`, fresh state showed the Inventory Auth tab active again. Quantity1 and reason `T025 synthetic 503` were visible in the form. After setting the ignored proxy mode to synthetic503, the submit click returned the same CUA browser-change interruption before any POST event appeared in the sanitized proxy log. UI work stopped immediately, the proxy was reset to `normal`, and no Inventory POST is logged after the prior successful retry. The 503 UI state therefore remains unverified; the click did not establish a request or data change.

### T025 resumed verification update (2026-10-06)

Disposable environment was re-confirmed: Chrome `Inventory Auth` at `localhost:3102/inventory`, UI proxy3105, Gateway3104, API3101, isolated PostgreSQL `inventory_verify`/Redis56380. The 45-product catalog and existing `VERIFY-ISSUE-RENAMED` fixture were retained. Proxy was temporarily switched through synthetic503,500,502,`in-progress`,`key-reused`, then returned to `normal`. Network showed POST responses 503/500/502/409/409. Sanitized proxy log records each POST start and close in its synthetic mode, with near-zero duration; these modes terminate at the proxy and do not forward the POST to API. Same key hash and frozen RECEIPT quantity1/reason were retained. UI showed uncertain for the unresolved sequence and then blocked with the specific KEY_REUSED message; no new-key path was offered. IN_PROGRESS displayed its specific warning. Its recovery status stayed `uncertain`, consistent with preserving earlier uncertainty; no standalone/no-prior-unknown IN_PROGRESS status was exercised. 429 + same-operation 201/replay evidence above was preserved and not repeated.

The blocked synthetic operation was explicitly left through the UI confirmation. Because the synthetic POSTs never reached API, this did not change inventory. Fresh UI showed the existing 45 products and fixture balance2/history7. Group2 has not been completed: prior-unknown plus terminal stock-error replay, including UI reset/reload and SQL check, still needs verification. Groups3 and4 also remain unverified: deadline and four authentication provenance paths; actor/access change, late completion, latch and restoration. Proxy currently reads `normal`; no code changed and no automated tests/search/converge were run. T025 remains unchecked; T026 was not started.

### T025 continuation: prior-unknown stock-error replay (2026-10-06)

Environment: disposable Chrome `Inventory Auth` at `localhost:3102/inventory` → proxy3105 → Gateway3104 → API3101 → isolated PostgreSQL `inventory_verify`/Redis56380. Existing45-product fixture retained; `VERIFY-ISSUE-RENAMED` began at balance3/history8. No dev endpoint or catalog was used.

Selected ISSUE, quantity4 (greater than balance3), reason `T025 terminal stock-error prior-unknown replay`. Initial UI showed `sending`, first-dispatch timestamp “Chưa gửi đến API”, and frozen payload; Network showed POST pending. Proxy `slow-write` forwarded POST through Gateway/API and held only the real response. After the client’s15-second timeout, UI showed `uncertain`, retained ISSUE/4/reason, and offered “Thử lại cùng thao tác”; no automatic retry was seen. Sanitized proxy metadata recorded key hash `08e3108eeafa6ae7`, key count1, ISSUE/4, trimmed reason length46. Proxy log showed the forwarded request closed after the response timeout.

Proxy returned to `normal` before Retry. The second POST used the same key hash and payload, reached API, and returned409 `INSUFFICIENT_STOCK` (Network409; normal proxy close29ms). UI ended `terminal`, displayed the stock-error message, reset editable draft quantity to0 and reason to blank while retaining ISSUE, and showed stock3. Reopening the fixture drawer sent stock and history GETs (both304 Not Modified); UI showed balance3 and8 history rows, with no new movement.

Read-only SQL in the isolated DB matched key hash `08e3108eeafa6ae7` to one idempotency row: `http_status=409`, `response_body.code=INSUFFICIENT_STOCK`, `movement_id=NULL`. Reconciliation showed balance3, facts8, ledger3. The backend retained and replayed the terminal stock error with no stock movement. Proxy summaries establish forwarding/response transport only; SQL is transaction evidence. Proxy returned to `normal` after the group.

The earlier standalone `IN_PROGRESS` observation is still proxy-synthetic: its first POST stopped at proxy and did not reach API; same-key retry later reached API and returned201 with one movement. It proves the UI stub only, not database-held `IN_PROGRESS` or real Retry-After. Still missing for T025: real PG-held IN_PROGRESS for an operation without prior uncertainty and Retry-After timing; deadline cutoff; four authentication provenance cases and automatic401 replay identity/body; actor/access loss, late completion and protected-publication checks, latch release, and same-admin restoration. Existing synthetic503/500/502/KEY_REUSED evidence and prior real committed-response replay are retained. Proxy is `normal`; T025 remains unchecked in both task lists and T026 has not started. No converge, automated tests, search, or source changes.


### T025: temporary mechanisms and partial new evidence (2026-10-06/07)

Disposable environment: Chrome Inventory Auth3102 → proxy3105 → Gateway3104 → API3101 → PostgreSQL55534 inventory_verify/Redis56380. Existing45-product catalog retained; no dev data/config changes. Temporary helpers reside outside committed source under /private/tmp/inventory-t025 and /private/tmp/inventory-t012-web; driver is ignored work/inventory-003. No new automated tests or production fault/clock switch. Disposable API application outcomes now captured in ignored t025-api-application.log. T025 remains unchecked; T026 has not started.

Real backend concurrency: balance FOR UPDATE plus observed original advisory lock, key hash1dfe9678a85736f0. Duplicate409 IDEMPOTENCY_IN_PROGRESS/Retry-After1,20ms; release→original201/replay201 same movement d54ebf4b-f097-4bb9-a8cf-92fac47dc0ce. One result/fact; stock3→4, facts8→9, ledger4. API in_progress/completed/replayed corroborates. HTTP helper evidence is distinct from UI.

Actual UI409: Console-only fixture sends an original probe and the UI XHR duplicate150ms later with identical key/body. Key98099f7f0377daf1/body hash70d7bfaafc562cd2. UI in_progress/locked form/initial disabled Retry then enabled, no automatic retry. Probe held beyond5s: API transient_failure503 INVENTORY_BUSY, proxy upstream error502; do not claim original201. Manual UI same-key retry after unlock201, one fact/stock7→8/history12→13. Initial stale countdown99s fixed by updating retry clock on attempt start; post-fix countdown verification remains.

FE deadline: key012738df0e546a3e, real POST401 at1791305620618; held fixture refresh1791305620632→1791305630720. Advance tab-only Date.now25h then release: blocked/deadline message/Retry disabled, zero replay POST. Reset clock before confirmed discard. Backend expiry separately seeded: key84d29faaa95b943a, DEMO-0009 original receipt1/replay share movementbb72f516-54c1-47f1-a5c3-1f27e93bbded; SQL expiry-completion=86400s. Age both timestamps25h preserving invariant; expired branch accepts changed qty2 same key, new movementd976cd87-3a54-46dc-9231-dbf504d9aa3a. Two facts/stock=ledger3/new result row. This proves seeded-expiry handling/arithmetic, not real24h elapsed or FE deadline.

Auth preflight failure without uncertainty: only fixture refresh401, zero movement POST; signed-out hides data. In-place original-admin restore retains frozen payload/first-dispatch null/blocked and released latch. Retry keyd071bbaa10aeb4de gets actual API401 via temporary bearer override, one fixture refresh200 and one API201 replay; metadata key/type/qty/reason trim/length match. SQL single result/fact movement6d3a0faf-2b94-4944-8144-6cbfd94d039d, stock4→5/history9→10. Full serialized-body equality capture for that automatic replay remains missing.

Actual403 without prior unknown exposed protected-data visibility bug. Owner now clears only the rejected original actor's still-current dispatched token; late rejection cannot clear a replacement session. Targeted UI recheck1791305553752 hides all protected data and retires rejection. API guards reject before InventoryService, so no invented movement outcome log. Post401 refresh fixture failure has zero replay and keeps mounted blocked operation; original admin restore releases latch. Incorrect 'not sent' message found and corrected to preserve after-post-401 provenance; targeted message recheck remains.

Late success under another admin: keya1b175040f4245fc/API201 movementd58a36c9-e368-432d-a650-9656b211c271 held at proxy. Change Redux session in same page→hidden protected data. Release under other admin→no publication/protected GET. Original-admin restoration applies terminal/reset/read refresh without POST, stock5→6/history10→11, one fact/result.

Prior unknown under customer: key5596916af5998bd7/API201 movementf0d5a735-8575-498e-a960-5e6b69a1db0b held. Customer denied; client timeout14.978s. Restore→uncertain/retry enabled/frozen payload; preflight refresh failure0POST, API403 rejection, API401+failed refresh0replay each preserves uncertainty. Normal manual retry201 replays same fact, terminal/reset/refresh; stock7/history12 unchanged. Proxy normal between faults/restores.

Late stock409 under customer: key2b07c283e7485b86/ISSUE9/stock8, actual INSUFFICIENT_STOCK result409/movementNULL. Release held response under customer→no protected publication/GET; restore original admin→terminal/stock8/no new POST/history13/facts13/ledger8. Form remount lost ISSUE; initialValues now use retained operation type, targeted remount verification continuing.

Durable filtered evidence: ignored t025-real-in-progress.json, t025-backend-expiry.json, t025-sql-reconciliation.json, ui-events.jsonl, t025-api-application.log. Remaining: automatic401 wire body/actor equality; initial-dispatch deadline race and UI cutoff click; corrected auth message/no-prior401 final rejection; actor/access refresh races0POST/0replay; prior-unknown400/429/503/cancel; corrected countdown and any uncovered latch/restoration cases. Cleanup status will be recorded after verification. Preserve previous sufficient evidence; no convergence.

### T025 final additional evidence and cleanup (2026-10-07)

Environment remains disposable FE3102 → proxy3105 → Gateway3104 → API3101 → PG55534 inventory_verify/Redis56380. Existing evidence is preserved. The detailed matching Vietnamese ledger above supersedes historical pending lists; production/dev configuration and data were untouched.

Automatic401 pair: key hash2b9c38f46d97ad82, serialized-body hash30f2784153c82065, original admin actor on both captured XHRs;401 at1791306401686, one fixture refresh200, terminal stock409 at1791306401797. SQL cache409/movementNULL/no fact. No-prior final401 pair46453d7c0caf69bd/body5997e91df63cc064: exactly two real API guard401s, one fixture refresh; protected UI hidden, original restoration terminal/editable, no automatic POST.

Initial-dispatch deadline: expired token/held refresh1791306422039, tab-only Date.now+25h, normal release → blocked deadline/disabled Retry/firstDispatch null/zero POST. Together with the previously recorded post401 refresh deadline, covers both awaited-refresh dispatch guards. Backend seeded expiry preserves exact86400s retention; it is expiry-branch/arithmetic evidence, not24h elapsed-time proof or FE deadline proof.

Actor preflight refresh returned another admin → denied/zero POST or protected GET; restoration released latch while preserving ISSUE9/reason/firstDispatch null. Same operation keyc765b9e8f16f910d then real API4011791306751359/held refresh6274ms returned customer → denied/zero replay; restore original kept payload and enabled manual retry. Normal retry gave terminal stock409/cache409/movementNULL/no fact. New after401 message and remounted ISSUE type observed; a fresh drawer defaulted to RECEIPT after restart. No database role changes.

Prior-unknown new operation key1b3abbfcfa6c391e RECEIPT1/reason33: synthetic proxy500/400/429/503 all preserved uncertain/frozen payload/same key/no automatic POST. Display-only fixtures stopped before backend. Countdown immediately2–3s after fix. Real401→fixture refresh200→real4011791306886869/1791306886975 retained prior uncertainty after restoring original; no loop. Along with the prior recorded preflight refresh failure, actual403, and after401 refresh failure on5596916af5998bd7, both prior/no-prior variants of all four authentication rows have evidence.

Same1b3abbfcfa6c391e real API2011791306915065 was held by proxy; temporary Console XHR.abort closed at6124ms without settling recovery. Normal/manual replay201 resolved terminal/reset/reloaded stock/history. API completed/replayed movement7c948095-3f4d-4457-9edf-77fc2f25fa9b; SQL one result/fact, stock8→9/history13→14/ledger9. Abort is not rollback proof. Final sanitized SQL snapshot is work/inventory-003/t025-sql-reconciliation.json; proxy ui-events.jsonl and t025-api-application.log contain matching real outcomes. Auth guards do not call InventoryService and therefore have no movement outcome log; fixture refresh does not prove backend auth transactions.

Cleanup removed /private/tmp/inventory-t025 including helpers/session secrets, removed temporary frontend module, restored original disposable page/runtime driver and normal mode; balance locks rolled back. Reload removes all tab clock/XHR overrides. Only sanitized ignored evidence remains. Targeted frontend ESLint/typecheck passed. Legitimate UI fixes: fresh attempt clock, after401 provenance/message, clearing only the currently rejected original session, restoring operation type on remount while preserving RECEIPT for new drawers. No product clock/fault feature, new automated tests, search or converge. T025 can be checked in both task lists with the explicitly bounded seeded-expiry evidence; T026 follows its dependency.

### T026 implementation and bounded runtime check (2026-10-07)

Added pagehide/unmount lifetime abort before discard/reference clearing, cancellation and signal guards for reads, timer/modal release, suspended read effects while hidden, and persisted pageshow clearing old operation/draft/selection/resources before authorized fresh reads. Existing identity recheck and cancel semantics remain; no recovery storage or history/router patch.

Disposable3102/proxy normal: unsent drawer reason then manual Console PageTransitionEvent(pagehide,persisted=true) cleared drawer/catalog; matching pageshow event restored catalog45/reminder with GET1791307269628→1791307269659 and zero POST. This is synthetic lifecycle-event evidence, not genuine bfcache or the full T027 acceptance matrix. Final ESLint/typecheck/Prettier passed. T026 checked in both lists; T027 remains unchecked for departure, modal/refresh races and native browser-return verification.

### T027 continuation: partial, stopped at browser state changes outside this controlled run (2026-10-07)

Prerequisites003/requirements16/16/no extension hooks. T025 and source T026 unchanged. Disposable Chrome3102/inventory/catalog45 → proxy3105 → Gateway3104 → API3101 → PG55534 inventory_verify/Redis56380. Helpers only under /private/tmp/inventory-t027, copied FE and ignored driver. No dev/user-role/config mutation, credentials printed, new automated tests, search or converge. New sanitized evidence: ui-events.jsonl, t027-api.log; request-config instrumentation is not outgoing POST evidence.

Observed: preflight RECEIPT1 `T027 preflight cancel and close`, firstDispatch null/sending; Close warned of possible completion and loss of recovery, Stay retained payload/operation. Rewrite timeout30002ms1791307863263→1791307893265 ended refresh500, zero movement POST. Original-admin restoration produced blocked. Close/Stay retained blocked; Close/Leave closed drawer. Console capture keyhashc12fd3942c5f7414/bodyhashe75a83ea75df1a5a/signal.aborted=true, abort1791307974516 while UI still showed blocked. Source order abort→discard→clear/action inspected; private discarded flag itself was not runtime-instrumented.

New preflight scenario `T027 preflight confirmed zero POST`: Close/Stay retained sending; Close/Leave discarded local drawer. Normal release completed held refresh1791307997976→1791308007351 at9375ms, and proxy recorded zero Inventory POST for product56564e2c-6de3-4eb6-8d83-ff5e9382e936 following completion. No movement created by these preflight scenarios. No rollback claim.

Stop boundary: while no corresponding UI action was sent by this run, logs switched to page1/limit10 at1791308076455 then page3/limit10; fresh state showed VERIFY-MIXED/product96ae6eeb-9767-4ff1-8b66-60ed705f0ce3, terminal reason1/history46. Proxy POST1791308120251/keyhash9e014d4b638517c4/RECEIPT1/reasonLength1 reached API2011791308120447. Source/provenance of these changes is undetermined; do not attribute them to automatic FE dispatch or use them as acceptance evidence. API completed movementddc68f6c-3aa4-4961-b867-e215befa0268; read-only SQL confirmed VERIFY-MIXED24→25, saved as ignored t027-interruption-sql.json. No fact was deleted.

Stopped Chrome interactions on detecting this change. Cleanup restored copied owner byte-identical to source T026, original page/runtime driver, removed temporary module/helper/session secrets/backups, restored normal proxy and restarted only disposable stack. Browser-memory cleanup was not re-observed after stopping; reload before the next run to remove any surviving window.t027/interceptor. T027 remains unchecked in both task lists; T028–T031 not started because of dependency.

Remaining manual checklist: sending/uncertain/blocked cancel/confirm for mask/Escape/switch/menu/dashboard/logout/login (only Close sending/blocked observed); post401 pending refresh confirm→one rejected POST/zero replay and cancel→same operation eligible; pending-modal terminal/new-operation identity race and old callback/latch isolation; native beforeunload/reload cancel/confirm, freshGET/reminder/zero restoredPOST/no operation storage; no warning for unsent draft or success/read-refresh failure; genuine Back/Forward/bfcache persisted observation and limits. Previous synthetic lifecycle-event evidence is preserved but does not substitute for native browser evidence. All write/fault verification must remain disposable, logs determine dispatch, normal proxy afterward, no abort/reload rollback inference.


### T027 completed continuation — 2026-10-07 Asia/Bangkok

Environment: disposable frontend3102 → proxy3105 → Gateway3104/API3101 → PostgreSQL55534 `inventory_verify`/Redis56380. Source T026 unchanged. Original admin restored after session fixtures. Catalog remains45. No dev data/config changed and no automated tests/search added. Preserve all previous accepted evidence. Temporary fixture exposed the existing owner callbacks and recorded Axios config hashes, synchronous signal-abort state, and native pagehide/pageshow. It lived only in the copied frontend under `/private/tmp`, with a session response fixture only in the disposable proxy. Config interception is not proof of dispatch; proxy start/upstream-response, API application outcome log and SQL establish the boundaries below.

Prior uncontrolled POST1791308120251: native DevTools Network Initiator showed `api.defaults.adapter` → `sendMovement` → `submitMovement` → drawer `onFinish`, status201/208ms. Proxy/API timestamps and movementddc68f6c-3aa4-4961-b867-e215befa0268 agree with earlier SQL24→25. The originating human/automation action cannot be established: **UNKNOWN**, excluded from PASS/FAIL. Before installing this run's helper, native reload verified t027/t025 undefined and native Date.now.

Departure matrix: Close sending/blocked cancel/confirm and preflight-confirm zero initialPOST retain previous evidence. This run observed Escape/mask/switch/Dashboard menu/logout/login Stay while uncertain and blocked; sending Escape/mask Stay during post401 pending refresh, plus switch/logout/login Stay during a held refresh. Cancel retained frozen payload/key/selection and un-aborted signal; session loss was restored to the same original admin. Close uncertain Stay was also observed. Confirm was observed for all remaining control/state combinations: uncertain Close/mask/Escape/switch/Dashboard/logout/login, blocked mask/Escape/switch/Dashboard/logout/login, sending mask/Escape/switch/Dashboard/logout/login. Inventory menu on its own is the current route, not a departure. Dashboard menu is the Dashboard control.

Native Close/Escape/mask and modal buttons were exercised directly. Drawer mask makes sidebar/logout/other product rows inert to ordinary pointer input; their real handlers were invoked through DOM `.click()` in the disposable Console fixture after inspecting DOM labels. Login required the temporary session-clear fixture and was then clicked natively. This is handler/modal evidence, not a claim that masked controls are pointer-accessible. Fixture owner.submit prepared operation/race states without adding product functionality. Synthetic500 and KEY_REUSED responses stopped at proxy: FE-only evidence, no backend-transaction claim. Native snapshots show abort synchronously with operationPresent=true/discarded=false, then operation=null and the requested selection/navigation; e.g. blocked mask1791309429250/Escape1791309436523/switch1791309445486, sending mask1791309612568/Escape1791309622131/logout1791309637736/login1791309658187. Sending confirmations used actualAPI409 held at proxy; no new or replayPOST after discard.

Post401 departure: keyhash67df6c141102d766/bodyhasheb46ef8b338a6043, POST1791308787661 → actualAPI4011791308787682, refresh1791308787835. Stay for Escape/mask retained sending. Confirm Dashboard aborted at1791308795551 while sending=true/discarded=false and cleared operation. Refresh completed1791308805414 (17579ms); zero replay. Cancel branch initially exceeded the rewrite's30s hold and ended refresh500, recorded as fixture timing limitation, not successful replay. Recovery of that same operation then used keyhash922732a9ea3e820e/bodyhash6946b606d70d181a: POST1791309048042 → actual401, pending refresh + Escape/Stay, normal release at7137ms, one same-key replay1791309055288 → actual409 INSUFFICIENT_STOCK. UI terminal, stock9/history14 unchanged at that point; SQL cache409/nullmovement. No auto new-keyPOST.

Modal identity race: actual RECEIPT1 `T027 modal old terminal`, keyhash401f30d2c5a40d53/bodyhashdafc4758dd235d71, POST1791309168506 → API201 while Close modal remained open. Releasing proxy allowed terminal success and fresh reads(stock10/history15). Owner fixture submitted new ISSUE20 `T027 modal newer operation`, keyhashbf75ab7fdf41f613/bodyhashfc351f4180eb1a60, synthetic500 stopped atproxy. Clicking the old modal's Leave re-opened confirmation for the new identity; Stay retained the new uncertain operation, un-aborted signal and payload. A subsequent current confirmation discarded only the new operation.

Late response/new selection: actual old ISSUE20 keyhash3e7a197c334f25c1, POST1791309217394 → API4091791309217433 held atproxy; confirm switch aborted/discarded before selection DEMO-0009. New uncertain operation keyhash2a8b58711068a03b retained stock3/history2/payload; old canceled transport could not publish the old product's response. Stronger pending-finally overlap: old POST401 keyhashc28de5e26313b868 waited in refresh; confirm switch aborted at1791309269808. Before old refresh was released, a new operation keyhash9d95163abf1614da/bodyhashb451257646174448 dispatched and reached real terminal409 for DEMO-0009. Releasing old refresh did not replay oldPOST, change the newer terminal operation or lock its form; new-operation sending latch was available while the old promise was pending. SQL shows409/nullmovement for real stock errors, not synthetic cases.

Browser observations: native Chrome actually displayed **“Reload site? Changes you made may not be saved.”** for uncertain, sending and blocked. Cancel retained operation; confirmed uncertain/sending reload returned catalog45/reminder with a closed drawer, fresh GET and zero restoredPOST. Only inventory.auth.session was stored; sessionStorage empty, no operation/key/body persistence. Real sending-reload keyhash210f2ff7f4acb9aa committed201/movement56709879-f123-468e-8eb5-611c65295c88, stock3→4 before reload; aborted HTTP/reload is not rollback. Unsent reason draft reloaded directly with no native warning. Real success `T027 success refresh fail`, keyhashb169a0febdb78ed7, committed201 then synthetic GET502 for catalog/stock/history; UI kept “Giao dịch đã được ghi nhận.”/terminal and separate read errors. Native reload after normal restoration showed no warning or POST.

Actual full-document Dashboard navigation and native Back yielded pagehide.persisted=true1791309386473/pageshow.persisted=true1791309388277 (not synthetic). A second native traversal started blocked; Chrome actually displayed **“Leave site? Changes you made may not be saved.”**. Leave → pagehide.persisted=true1791309713645, abort1791309713646 with discarded=false; Back → pageshow.persisted=true1791309715535. Operation absent, drawer/draft cleared, reminder and fresh authorized catalogGET, no subsequent movementPOST. Dev HMR WebSocket logged a bfcache close/reconnect; this is not an application hydration failure. Evidence applies to this Chrome traversal; beforeunload delivery/dialogs and cache eligibility are browser-controlled and not guaranteed on crash/mobile/other browsers.

Backend reconciliation: sanitized `work/inventory-003/t027b-sql.json`, proxy `ui-events.jsonl`, application log `t027b-api.log`. Exactly three new successful facts for this controlled run: 8cc8bcf7-d257-4b8f-a881-74238ef46981 VERIFY9→10; 56709879-f123-468e-8eb5-611c65295c88 DEMO3→4; 97735ba5-2fde-4b50-a838-c1cb41f6ef53 DEMO4→5. Final VERIFY balance10=facts15 ledger10; DEMO balance5=facts4 ledger5. All held stock-error requests cached409 without movement. Auth401 did not create idempotency result/movement.

Cleanup verified: fixture dispose ejected interceptor and removed listeners/window.t027; restored copied page/owner and original ignored runtime, removed fixture module/session secret/backups/temp directory. Copied owner byte-identical to source T026. Proxy normal; restarted only disposable runtime. Native reload showed window.t027/window.t025 undefined, Date.now native, no operation storage, catalog45. No production source changes. T027 checked in both task lists after this evidence; T028 is next.


### T028 production audit — 2026-10-07

Disposable3102/3105/3104/3101, same45 fixture; actual Next16.3.6 production build (Turbopack), no helper. Initial copied build failed because node_modules symlink escaped tracing root; recorded failure, replaced only disposable symlink with physically copied dependencies and production build succeeded. Source/runtime dev configuration unchanged. Root final build also succeeded with NEXT_PUBLIC_API_URL=/api/v1 and GATEWAY_ORIGIN=http://127.0.0.1:3105; its production output was served in the disposable copy.

Observed native coldreload and Dashboard→Inventory navigation: first observed screens styled, no unstyled flash observed; production Console explicitly No errors/No warnings, no hydration messages. SSR antd-cssinjs tag present, Vietnamese labels/reminder/pagination, existing Ant registry/provider retained. This is observed browser behavior plus SSR evidence, not a guarantee of every paint on every device. Actual keyboard Enter opened drawer from restored Inventory-row focus, Escape closed/returned focus; Tab visited Close, history pagination/size, type, quantity, reason and submit. Labels Loại giao dịch/Số lượng/Lý do point to existing type/quantity/reason controls. Native reason focus had visible blue border/shadow; row Tab focus outline captured. UTC header and ISO Z values visible (e.g.2026-10-06T17:52:48.556Z). Drawer vertical scrolling worked natively. History overflow912px/1100px; native horizontal wheel calls did not change scrollLeft, so final horizontal rendering was inspected with a manual Console scrollLeft=scrollWidth (188.25px), not claimed as native wheel evidence. UTC became fully visible; no source helper added.

Found logout black on dark sidebar; fixed only scoped .inventory-layout .inventory-logout.ant-btn color/hover in globals.css. Existing owner/drawer/lib/auth and handlers unchanged, so T025/T027 behavior evidence retained. Rebuilt production; after session expiry during the pause, real disposable-admin login restored dashboard, then native Dashboard/Inventory navigation. Final Console No errors/No warnings; computed logout rgba(255,255,255,0.85) on sidebar rgb(0,21,41), SSR tag true/window.t027 undefined. No password saved.

Sanitized screenshots in ignored work/inventory-003/: t028-production-catalog-focus.png (row focus/pre-fix logout), t028-production-drawer-focus.png (reason focus), t028-production-drawer-utc.png (manual horizontal inspection). Final post-fix catalog screenshot could not be saved: browser tool returned App quit; fresh inventory confirmed Chrome isRunning=false. No further browser action/relaunch. Existing screenshots and final DOM color/Console outcomes retained with this limit. T028 checked in both lists; remaining final browser transport/auth inspection belongs to T030, not inferred from builds.


### T029 quality — 2026-10-07

Node24.21.0. Root npm run check with NEXT_PUBLIC_API_URL=/api/v1: exit0 (API/Gateway/web lint, Prettier and strict typecheck). Root npm run build after the final logout CSS fix: exit0, all three apps; same-origin/disposable Gateway env override, no .env edit. npm test: exit1, Jest No tests found/0 matches; apps/api/test absent. This is missing automated coverage, not test PASS. No tests added or failure hidden with passWithNoTests. Retained logs work/inventory-003/t029-check.log/t029-tests.log; production build output recorded in tool result. Earlier copied Turbopack symlink failure remains recorded under T028. T029 checked in both lists with the explicit coverage omission.


## T030 completed — 2026-10-07 02:01–02:02 UTC

Scope: only missing basic smoke; no new automated tests, fault helpers or fault modes. Earlier admin login/sidebar/table/pagination/drawer and field-validation evidence is retained, not rerun as acceptance. The interrupted earlier T030 browser attempt observed page2, drawer stock5/history4 and quantity0/blank-reason errors with no movement POST; it was stopped before writes. Basic API error and same-key replay evidence remains T020/T025, not a new execution. D001–D004 stay deferred.

Environment: existing disposable containers inventory-002-verify-pg (55534, inventory_verify) and inventory-002-verify-redis (56380), FE3102 → proxy3105 (normal) → Gateway3104 → API3101. Existing45 products retained. Restarted existing runtime without seeding; current built API includes the small history-response change; copied current inventory-types.ts to the existing disposable frontend. DEV3001/3002/3004, PostgreSQL55433 and Redis6379 were not reconfigured or used for writes.

Initial real SQL for DEMO-0009 / 04c874d8-7728-4b2f-9470-75bf5a29f0d3: balance5, facts4, signed ledger5. Existing browser admin session restored to dashboard; no new admin-login PASS claimed. Drawer showed stock5/history4. UI RECEIPT1, reason “T030 normal receipt one”: success message, stock6/history5, quantity/reason cleared. UI ISSUE1, reason “T030 normal issue one”: success message, stock5/history6, cleared quantity/reason. Network recorded exactly one POST201 for each submission followed by stock/catalog/history GETs.

Dispatch proof: normal proxy POST start1791338494735 / keyHash13f2dfffe504a05a (RECEIPT) and start1791338508933 / keyHash5c2ccf60a1c8fac0 (ISSUE); each one Idempotency-Key header, quantity1, trimmed reason. Different keys for distinct operations; no retry occurred in this run, so key preservation on retry is retained T025 evidence only. API application log inventory.movement.outcome completed201 matched movements 85d33551-58cc-4dc5-8496-b4d9231c720b (5→6) and 6bb63313-155a-4163-ae16-a18c53607296 (6→5). SQL confirmed these two immutable facts and two idempotency results201 with matching movement_id; final balance5/facts6/signed ledger5. These requests reached the API and committed; no synthetic response is used as transaction evidence.

History GET response200 contains productId and product {sku,name,status}, with no nested product.id. Updated history still rendered correctly. Existing table/stock product shape remains unchanged.

Customer: UI logout, existing customer login → dashboard role customer/no Inventory entry. Direct navigation to3102/inventory first showed session check then “Không có quyền truy cập / Chỉ quản trị viên được xem tồn kho.” Browser Network after navigation had zero /api/v1/inventory requests; proxy log had no Inventory starts during customer navigation02:02:14–02:02:22UTC. No customer POST or protected read dispatch.

Limits: development runtime emitted existing AntD Alert message-deprecation and useForm-not-connected warnings plus favicon404; this is not a clean production-console claim. No fresh advanced faults, expiry, bfcache or Google OAuth verification. Earlier quality gates retained; latest small DTO/type change separately passed root check/build. No source changes in T030. Both task lists mark T030 complete using the labelled retained/new evidence, not unrun cases.

Cleanup: proxy remained normal throughout; no helper created. Disposable runtime and its containers stopped after verification, containers/volumes/data preserved. Only the original DEV stack remains active. Browser test page closed; no product/session helper injected. Direct DEV URL http://localhost:3002/inventory; disposable3102 is stopped. No converge.


## Direct React refactor — 2026-10-07 02:13–02:16 UTC

User requested a direct structural refactor after convergence. Applied reactjs, react-code-review-senior and vercel-react-best-practices; no new Spec Kit stage/converge run, dependencies or automated tests. Original901-line owner replaced by components/inventory/inventory-management.tsx (197 lines), arrow functions, one local selected-product state. Feature-local table/drawer, data/resource hooks, movement command/error/operation and departure hook separate rendering, GETs, dispatch/retry and browser lifecycle. Pagination/refresh query state and draft reset/errors are grouped. lib/abort-scope.ts is reused by reads and operation lifetime; lifetime abort still precedes discard. Shared Axios/auth, frozen key/body, synchronous duplicate latch and operation publication checks remain. Effects synchronize requests/event listeners/timer/session return; derived visibility remains computed. Form effects now run only while open with a rendered Form, removing the observed useForm warning; Alert uses title.

Runtime proof on existing disposable inventory_verify PG55534/Redis56380, FE3102 → proxy3105 normal → Gateway3104 → API3101,45 products retained; no dev writes or fault modes. Customer direct Inventory denied/0 Inventory network requests. Real admin login; table page2 has20 rows/total45; drawer DEMO-0009 initialbalance5/facts6/ledger5. Quantity0/blank reason showed field errors/0 movement POST. Double-click receipt1 produced exactly one POST201/keyHash2be62615761f6529/movementce6f5d58-9fa2-46be-9718-3674d4eb5b80; UIbalance6/history7, clearedquantity/reason. Issue1 one POST201/keyHash9965d625a632d5e8/movement89f414e4-1463-4844-8a2c-7da88935616e; UIbalance5/history8. Issue6 rejected409 INSUFFICIENT_STOCK/keyHash5495d53dbe556342; UI resetsquantity/reason, retainsISSUE, reloadsstock5. Real SQL finalbalance5/facts8/signedledger5, rejection result409/movementNULL. API completed201/201 and completed409 logs match requests. Close/reopen clears terminal display/draft; real reload issues fresh GETs/zero restoredPOST. After final form-effects fix, cold reload/open drawer stillstock5/history8/emptydraft and Console0errors/0warnings in that navigation window (development runtime, not a production audit).

Root check/build exit0; after final drawer-only change web lint/format/typecheck/build exit0. Existing API suite absent; no new test files or claimed Jest PASS. No post-refactor same-key fault/replay, advanced auth/race/deadline/bfcache matrix run: old evidence remains historical, not fresh proof for changed code; D001–D004 remain deferred. No broad acceptance/converge claim for the refactor.

Cleanup: existing proxy stayed normal; no browser/runtime fault helper introduced. Stopped disposable runtime/containers, retained volumes/database/facts and closed test browser page. DEV remains3001/3002/3004/PG55433/Redis6379; URL http://localhost:3002/inventory. Quality/runtime logs retained ignored under work/inventory-refactor/.

During the live source update, Fast Refresh emitted dependency-array-size warnings because the hook signatures changed; after an actual reload these warnings were absent. This does not claim the whole development session was warning-free.
