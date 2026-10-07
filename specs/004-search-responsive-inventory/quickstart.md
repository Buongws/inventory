# Quickstart and Planned Validation

**Status**: guide only; no scenario or quality gate was executed during plan. Record future results individually as PASS/FAIL/NOT RUN with viewport/environment and limitations.

## Prerequisites and execution

Use only existing dev stack: FE `http://localhost:3002`, Gateway3004, API3001, local PostgreSQL55433 and Redis6379. Confirm existing configuration locally without printing credentials. Do not start disposable stacks, generate fixtures, modify dev records or install dependencies for this feature.

From repository root, use Node24. If the existing stack is stopped, `npm run dev` starts the three apps once PostgreSQL/Redis are available; do not start duplicates if already running. After implementation, run `npm run check` and `npm run build`. Inspect existing API tests and run the relevant suite if present; report absent tests honestly and add none. Never use a missing suite as PASS.

Log in through existing admin flow and use existing products/statuses/timestamps. For boundary checks, inspect known Product.createdAt read-only; if data cannot distinguish a boundary, mark that check NOT RUN. Use browser Network for query/dispatch/response evidence; redact authentication headers/cookies. No fault setup or advanced feature003 re-verification.

## Short smoke

1. Open Inventory: first GET page1/limit10; current auth guard/details page available. Capture initial query and row/count response.
2. Edit name/SKU without submit: no GET. Submit mixed-case padded name and then SKU; verify literal matching and trimmed q across whole catalog. Inspect Network; `%`/`_` must remain literal when checked.
3. Submit ACTIVE, INACTIVE and All; combine text/status/date and compare items/total to available known products.
4. Select From only, To only, both same day and no dates. Expect UTC+7 boundaries per [API contract](contracts/inventory-api.md). Record three separate checks: FE picker prevents invalid date input/selection; FE Form reports reversed range with no GET; BE authenticated direct read-only invalid queries return400 (e.g.2026-02-30, timestamp, reversed range). HTTP400 is not FE PASS. Do not add wrappers or fault frameworks to expose artificial invalid-input paths.
5. Change page with unsaved draft edits: request retains applied filters. Change size20/50/100: page1. Reset: clears all filters/page1, retains size and reloads. Check a no-match query and a direct beyond-end page: empty items, correct filtered total, no clamping.
6. Observe loading and ordinary API error/retry only if encountered without faults. If controllable browser network throttling is used, submit two distinct filters/pages and verify final rows/total reflect latest identity; record observed requests, not a claim of exhaustive race coverage. Unobserved error/overlap cases remain NOT RUN.
7. Open existing Inventory details page: stock/history readable, action controls intact; avoid movement writes in dev. Confirm history request remains default20. This does not re-certify auth/idempotency or advanced operation flows.
8. At1920×1080/sidebar open/default10/catalog view, record screenshot and document scroll height; do not infer fit from a build. At768×1024 and390×844 check sidebar reopening, wrapping, local table scroll, action/pagination and details page usability.20+ rows may scroll vertically.

## Evidence format and limits

For each check record date, existing-dev URL, viewport, action, sanitized request/response and actual UI result. Record gates separately. Read-only source review supports design only; HTTP alone is not UI PASS. Existing data may leave date boundaries/status examples unverified. No new automated tests, proxy/fault matrix or environment; no mutation/replay testing and no claims about backend transaction rollback from browser abort.

Smoke checks lacking evidence remain NOT RUN and their verification tasks remain pending. They do not block independent responsive implementation or quality gates. Handoff lists each missing check and its reason; finishing the report is not complete verification.
