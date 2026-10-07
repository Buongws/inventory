# Feature Specification: Search and Responsive Inventory UI

**Feature Branch**: Not created (no branch hook configured)
**Feature Directory**: `specs/004-search-responsive-inventory`
**Created**: 2026-10-07
**Status**: Implementation code/documentation complete; quality gates passed; runtime verification pending (see validation.md).
**Input**: Search/filter the whole Inventory product catalog on submission, default10-product pagination, compact desktop and usable tablet/mobile layout; reuse existing flows and keep the solution simple.

Language: **English** | [Tiếng Việt](vi/spec.vi.md)

## Repository Scope

This feature covers Inventory product-list filtering in the API and Inventory frontend layout/interaction, plus the corresponding contract documentation. Gateway continues transparent forwarding with no new route/rate policy. Product creation timestamps already exist; changing stored product/movement data or the database schema is not a requirement. Any later measured schema need must be justified in plan and use a new migration, never edit an applied migration.

Reuse the [Inventory reference](../../docs/en/inventory/INVENTORY_SPEC.md), [implemented API contract](../002-inventory-balances/contracts/inventory-api.md), and [existing frontend specification](../003-frontend-inventory/spec.md) as baseline. This feature explicitly supersedes feature003's exclusion of search and its stock-list default20, only for the product catalog. Product-specific stock reads, movement-history pagination/default20, receipt/issue, authorization, authentication, retry identity and idempotency are unchanged. Earlier contracts remain baseline references, not proof of this proposed extension.

**Historical source review before feature004, not a new UI test**: `apps/api/src/inventory/inventory.dto.ts` and `inventory.service.ts` accept stock-list page/limit only, default1/20, reject unknown queries and order by product ID ascending. `apps/api/src/products/product.entity.ts` has Product.createdAt mapped to product creation time. `apps/web/components/inventory/` already separates management, table, drawer, hooks, types/constants and API calls; `hooks/use-inventory-data.ts` starts with20 and has no filter. The sidebar already collapses at a breakpoint, and the table already supports horizontal scrolling; the requested desktop fit and mobile usability are not verified by that configuration alone. Preserve these reusable parts. The current history response omits nested product.id; this feature does not redesign its shape.

User-prescribed implementation boundaries: prefer existing Ant Design Form/Input/Select/DatePicker/Table/Pagination, shared Axios and current state patterns. Keep state and handlers clear; create no utility/hook/wrapper or generic filter framework without concrete reuse or meaningful isolated logic. Do not add dependencies merely for search/layout. This records user constraints, not a design plan.

Excluded: auth/non-Inventory redesign, Product CRUD changes, history search, movement-date filtering, sorting controls, autocomplete/live per-keystroke search, fuzzy/relevance search, a new search service, changes to auth/idempotency/receipt/issue flow, automatic tests, new environment/proxy/fault setup and feature003's deferred advanced verification. Workflow history: specify and clarify completed first; plan and tasks subsequently completed. Analyze findings were resolved before implementation. Implementation code/docs and quality gates are complete; runtime gaps are recorded separately in validation.md.

**Proposed Inventory list contract delta** (requirements, not an implemented API):

| Area | Required observable extension |
|---|---|
| GET `/api/v1/inventory` | Accept optional name-or-SKU text, product status and product-created-date bounds alongside page/limit. Proposed query names: `q`, `status`, `createdFrom`, `createdTo`; dates use Asia/Ho_Chi_Minh (UTC+7), inclusive whole days, lower-bound >= From start and upper-bound < next-day start after To, converted to UTC; transport encoding is a plan detail. |
| Text | Trim; case-insensitive literal substring match of name OR SKU. Empty trimmed text means no text condition. |
| Combination | Text predicate AND selected status AND selected creation-date bounds; apply to all products before selecting a page. |
| Pagination | Stock list defaults1/10, supports10/20/50/100 from UI, keeps existing positive-safe page/offset and maximum100 validation. Total counts the same filtered set as items. |
| Response/order | Preserve `{ items, page, limit, total }`, existing stock fields/zero for untouched products and product-ID-ascending order. No new displayed creation-date column required. Beyond-end page returns empty items with unchanged filtered total. |
| Errors/access | Preserve admin-only policy and established400 INVALID_INPUT for invalid query values; unknown query fields remain rejected. Extend documented query validation without widening other endpoint contracts. |
| Other endpoints | No filter query added to single-stock, history or movement POST; existing semantics remain. |

No code, database/configuration change or runtime check occurs in specify/clarify. Acceptance later uses a short manual smoke on the existing stack, existing data and recorded known product timestamps. No write fixture is needed for read-only search; do not mutate development data or create a fault matrix to prove it. Record actual viewport/environment/results and omissions, then run affected lint/format/typecheck/build quality gates. If existing data cannot cover a case, record the coverage gap before deciding how to supply safe data later; do not mark it PASS.

## Clarifications

### Session 2026-10-07
- Q: Which timestamp and timezone govern the selected dates? → A: Product.createdAt; fixed Asia/Ho_Chi_Minh (UTC+7), not movement time or the browser timezone.
- Q: How are From/To day boundaries included? → A: Both selected days are included in full; use >= start of From and < start of the next calendar day after To, converted to UTC. Same-day ranges are valid.
- Q: Which partial/invalid ranges are accepted? → A: From-only, To-only and neither are allowed. Invalid dates or From > To are blocked in the frontend without a request and rejected by the backend with400; never auto-swap or repair dates.

## Pre-implementation review resolutions — 2026-10-07

Code dependencies are separate from smoke completion. Missing evidence remains NOT RUN and its verification task stays pending, without blocking independent responsive work or quality gates. Handoff must list these gaps and must not claim complete verification. Update existing Postman GET examples during implementation; add no test script or environment. The original specify/clarify session above remains historical.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find products across the catalog (Priority: P1)

An admin finds products by name/SKU, status and creation period without browsing every page.

**Why this priority**: Search must find products outside the current page and expose accurate filtered totals.
**Independent Test**: Search a known name/SKU absent from the first page; vary casing/outer whitespace, select each status, apply known product creation dates and combine conditions. Confirm results against the catalog, not one loaded page.

**Acceptance Scenarios**:

1. **Given** an authorized admin opens Inventory, **When** the first catalog request is sent, **Then** it requests page1/limit10 with no filters; the form shows one name-or-SKU input, All/ACTIVE/INACTIVE status, From/To creation dates and “Tìm kiếm”/“Làm mới”.
2. **Given** a product outside the displayed page, **When** its name fragment or SKU is submitted with varied casing and outer spaces, **Then** the matching product is found across the catalog with an accurate total.
3. **Given** a visible result set, **When** the admin types text or changes status/dates without submission, **Then** the edit alone sends no search request and does not replace the applied result set.
4. **Given** selected text/status/date conditions, **When** submitting, **Then** every result satisfies all selected conditions, with text matching either name or SKU; creation dates refer to Product, never movements.
5. **Given** the date controls, **When** entering/selecting dates, **Then** calendar-only pickers prevent invalid calendar input/selection. **Given** From > To, **When** submitting, **Then** Form shows a range error and sends no catalog request. Independently, invalid real-date/range direct queries return400 INVALID_INPUT from the backend. Record FE prevention/range behavior separately from BE400; neither layer swaps or repairs dates.

6. **Given** From=To=2026-10-07, **When** searching, **Then** include Product.createdAt >=2026-10-06T17:00:00Z and <2026-10-07T17:00:00Z; include the lower-bound instant and exclude the upper-bound instant.
7. **Given** only From, only To or no dates, **When** searching, **Then** use only the inclusive lower bound, only the exclusive next-day upper bound, or no creation-time restriction respectively.

### User Story 2 - Navigate and reset filtered results (Priority: P1)

An admin pages through a filtered catalog, changes page size and resets the form reliably.

**Why this priority**: Paging must preserve search intent and never imply that an empty page or failed request is an empty catalog.
**Independent Test**: Apply filters with multiple pages; change page and size; reset while on a later page; submit an unmatched term; check loading/read-error/retry behavior within the existing environment where observable.

**Acceptance Scenarios**:

1. **Given** applied filters, **When** changing page, **Then** keep those filters and page size, display the server page and filtered total, and ignore newer unsent form edits.
2. **Given** any applied set/page, **When** submitting filters or changing size to10/20/50/100, **Then** load page1; size changes preserve the applied filters.
3. **Given** edited/applied filters, **When** “Làm mới” is clicked, **Then** clear text/status/date edits and applied filters, return to page1 and fetch the unfiltered catalog; retain the selected page size.
4. **Given** an unmatched combination, **When** results arrive, **Then** show a distinct no-matching-products state and total0; a beyond-end page instead preserves the nonzero filtered total.
5. **Given** a result is loading or fails, **When** displayed, **Then** show loading/error distinctly and allow retry of the applied filters/page/size; a failure is not empty data or zero stock. An older response cannot replace the current query's rows, total or error state.
6. **Given** an existing Inventory details page, **When** catalog filters/page change or a movement completes, **Then** preserve the selected-product and movement/recovery rules; stock-list refresh uses the currently applied filters. No filter action dispatches a movement or silently abandons a pending operation.

### User Story 3 - Use Inventory comfortably on desktop and smaller screens (Priority: P1)

An admin can scan10 products on desktop and use filters, navigation and row actions on tablet/mobile.

**Why this priority**: Density and responsiveness must improve usability without hiding important content.
**Independent Test**: At desktop1920×1080, tablet768×1024 and mobile390×844 (CSS viewport pixels), inspect filters/table/pagination/sidebar, open a details page and access its form/history. Use100% browser zoom for the default desktop-fit check.

**Acceptance Scenarios**:

1. **Given** a1920×1080 desktop, open sidebar, default10-row catalog, normal representative product labels and catalog view, **When** the page is loaded, **Then** header/reminder/filter form/table's10 rows/pagination fit in the viewport without vertical document or table-body scrolling; retain readable fonts and important content.
2. **Given** page size20 or more, **When** rows load, **Then** vertical page scrolling is permitted, with reachable filter/actions/pagination.
3. **Given** tablet/mobile widths, **When** using Inventory, **Then** sidebar can collapse and reopen, filters wrap/stack with usable labels and buttons, and horizontal scrolling stays within the table region where needed. The document does not overflow horizontally.
4. **Given** a narrow screen, **When** paging, choosing a page size or opening Inventory for a row, **Then** controls remain operable; details page stock/history/receipt/issue actions remain reachable without clipping or changing their business behavior.
5. **Given** exceptionally long product names/SKUs or larger user text settings, **When** displayed, **Then** preserve access to full important content and permit necessary scrolling rather than reduce text size or conceal content to force the desktop fit target.

### Edge Cases

- Blank/whitespace-only text means no text filter. Ordinary punctuation, including `%` and `_`, is literal text, not a user-selected wildcard expression.
- Text alone matches name OR SKU; text, status and dates combine with AND. Empty All status means no status restriction, including both active and inactive products.
- Products at the From day start are included; products at the next-day start after To are excluded. Use Asia/Ho_Chi_Minh (UTC+7) day bounds converted to UTC and Product.createdAt, including products without movements.
- Calendar-only pickers prevent malformed/impossible date input/selection. Form reports reversed ranges and blocks dispatch. Backend independently rejects malformed/impossible dates and reversed direct-query ranges with400 INVALID_INPUT. FE and BE evidence are separate. From-only, To-only and neither are allowed; never swap or repair dates.
- Unsubmitted form edits must not change applied filters during pagination, read retry or movement-triggered catalog refresh.
- Re-submitting the same filters or resetting an already-clear form still reloads the requested page; reset is explicit retrieval, not only clearing local inputs.
- Total/items must use identical conditions; a filtered product with no stock record remains stock0. Do not change existing ordering or business stock interpretation.
- Pending requests may finish after a new submission/reset/page/size/session; their rows/total/error cannot publish into the newer result set.
- A selected product may disappear from a filtered list; catalog visibility is not deletion, permission loss or grounds to change/discard its movement operation.
- Loading/empty/error/read retry are distinct. Long server-returned text and narrower screens may require scrolling; browser chrome dimensions do not substitute for CSS viewport measurements.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Reuse Inventory's admin-only access, existing session/auth policy and sidebar/content layout; add no protected catalog request before authorization resolves.
- **FR-002**: Present a labelled name-or-SKU input, status All/ACTIVE/INACTIVE, From/To product-created-date fields and “Tìm kiếm”/“Làm mới” above the list.
- **FR-003**: Search only on deliberate form submission (including Enter); edit events alone must not fetch. Trim text and use case-insensitive literal substring matching of name OR SKU over the entire server catalog.
- **FR-004**: Apply text, status and product-creation-date conditions together; empty conditions impose no restriction. Filter Product.createdAt, never movement.createdAt.
- **FR-005**: Selected calendar dates MUST be interpreted in the fixed Asia/Ho_Chi_Minh timezone (UTC+7), regardless of browser/server timezone. Filter only Product.createdAt; convert the agreed local-day bounds to UTC instants for the backend query.
- **FR-006**: From and To include their entire selected calendar days. The backend MUST compare Product.createdAt >= the start of From and < the start of the calendar day following To in Asia/Ho_Chi_Minh, after converting both bounds to UTC. From=To is valid and includes exactly that local calendar day; an instant at the upper bound is excluded.
- **FR-007**: Allow From-only (>= its day start), To-only (< the following day start) and no dates (no time restriction). Calendar-only pickers MUST prevent invalid calendar input/selection. Form MUST detect From > To, show a field/range error and send no search request. The backend MUST independently validate real calendar dates and range order for direct queries and return400 INVALID_INPUT when invalid. Record picker prevention and Form/no-dispatch evidence separately from backend400; HTTP400 is not frontend PASS. Never swap or normalize invalid dates. Do not add wrappers or fault frameworks solely for verification.
- **FR-008**: Extend only the Inventory stock-list contract for the specified filters, preserving its response envelope, stock values, order and permission policy. Filtering precedes pagination; returned total counts the filtered catalog.
- **FR-009**: Default stock pagination to page1/limit10 on the first request and on a list call with omitted pagination. Provide sizes10/20/50/100; retain safe-page/offset validation and maximum100. Do not change history pagination defaults or limits.
- **FR-010**: Submit filters and page-size changes at page1. Page changes preserve applied filters/size; unsent edits do not become applied implicitly. A repeated submission reloads results.
- **FR-011**: “Làm mới” clears draft and applied filters, returns to page1 and reloads unfiltered data, even when already clear; retain the selected page size.
- **FR-012**: Display server rows/page/limit/filtered total without filtering only the loaded page. Distinguish total0/no match from beyond-end empty page/nonzero total.
- **FR-013**: Show distinct loading/empty/error states; read retry reuses applied filters/page/size. Prevent late responses/errors from superseded filter/page/size/session requests from replacing current data or totals.
- **FR-014**: Preserve Inventory row action, details page, independent history pagination, receipt/issue, frozen retry identity and auth/idempotency/operation protections. Catalog refresh after movement retains applied filters; filter/reset actions cause no movement POST.
- **FR-015**: At1920×1080 CSS viewport/100%zoom, open sidebar and default10 representative rows with catalog view, show header/reminder/filter/table/pagination without vertical scrolling. Improve spacing/density; do not shrink fonts or cut important content solely to meet fit.
- **FR-016**: Permit vertical scrolling for20+ rows and exceptional text/accessibility settings. At tablet/mobile, provide collapsible/reopenable sidebar, wrapping/stacked filters, table-local horizontal scrolling when needed, and usable row actions/pagination/details page controls; no page-level horizontal overflow.
- **FR-017**: Keep the solution simple and feature-scoped, reuse existing library behavior/Axios/state, and introduce no speculative helpers or generic filter framework. Do not redesign auth/other pages or change movement flows.
- **FR-018**: Add no automated tests or new environment/proxy/fault matrix. Later record short manual filter/reset/pagination/empty/validation smoke, desktop/tablet/mobile observations and affected quality gates; label omissions honestly and do not re-run advanced verification from feature003.

### Key Entities

- **Product**: Existing catalog record with identity, name, SKU, ACTIVE/INACTIVE status and creation timestamp; creation date differs from movement time.
- **Filter draft**: Editable text/status/date values before submission; does not govern displayed results yet.
- **Applied filter set**: Last submitted normalized conditions that govern page changes, read retry, totals and catalog refresh until replaced/reset.
- **Filtered stock page**: Server-selected products/current stock plus page, limit and filtered total; stock and movement facts remain unchanged by filtering.
- **Creation-day bounds**: Optional calendar dates in Asia/Ho_Chi_Minh (UTC+7), converted to UTC inclusive lower/exclusive next-day upper instants. Either or both bounds may be omitted; invalid/reversed dates are rejected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The first authorized catalog load shows up to10 products on page1; manual name/SKU searches locate known matches outside that initial page, with equivalent results across casing/outer-space variants and correct totals.
- **SC-002**: Manual status, creation-period and combined-filter cases show only qualifying products; boundary/same-day cases include the From day start and exclude the next-day start after To in Asia/Ho_Chi_Minh (UTC+7); one-sided/no-date ranges follow FR-007, and picker prevention and Form reversed-range/no-fetch behavior are evidenced separately from backend real-date/range400 on direct queries. Use known product creation timestamps rather than movement times.
- **SC-003**: Editing filters causes zero search fetches; each deliberate submit/reset loads page1. Page changes keep applied filters, size changes reset page1, and reset visibly clears all conditions with accurate unfiltered total.
- **SC-004**: No-match and beyond-end cases are distinguishable; failures remain errors rather than empty/zero stock. A superseded result cannot replace the active query's rows or total.
- **SC-005**: At1920×1080/100%zoom with sidebar open, default10 representative rows and catalog view, all primary list controls and rows are visible without vertical scrolling, reduced fonts or concealed important content. For20+ rows, vertical scrolling remains usable.
- **SC-006**: At768×1024 and390×844, an admin can submit/reset filters, access sidebar navigation, page/change size, open Inventory and reach stock/history/form controls; no document horizontal overflow or clipped control blocks these tasks.
- **SC-007**: Filter/reset actions create zero movements and do not alter an existing operation's identity/payload. Existing details/history/receipt/issue remain available on the filtered catalog; evidence states which basic paths were observed after implementation.
- **SC-008**: The later evidence record names each environment/viewport, observed smoke result, affected quality-gate outcome and omitted check; unrun/new-feature checks are never presented as PASS and no advanced prior-feature matrix is required.

## Assumptions

- Admin is the existing audience; no customer access extension. Interface labels remain Vietnamese, canonical artifact English with a Vietnamese mirror.
- Search means literal substring, not exact-only, fuzzy, accent-insensitive or ranked matching. Case-insensitive matching does not promise accent folding. Status values retain their existing spelling.
- Proposed query names are `q`, `status`, `createdFrom`, `createdTo`; omit unselected conditions. Bound text to200 Unicode code points after trimming as a documented draft default, reject longer direct values clearly; review this limit if needed. Query encoding and date wire format belong to the contract/plan; the fixed timezone and whole-day inclusion are already confirmed.
- Keep current ascending product-ID order. No URL/local-storage persistence of filters is required; a fresh page entry starts unfiltered with10 products per page.
- Reset retains currently selected size; “default10” applies to a fresh entry/omitted stock-list pagination. History's20 default is separate.
- Tablet768×1024/mobile390×844 are representative manual viewport baselines, not a guarantee for every device. Desktop fit covers ordinary data/default text settings; long text/accessibility settings retain readability and may scroll.
- Date filtering always uses Product.createdAt and the user-confirmed Asia/Ho_Chi_Minh (UTC+7) whole-day rules in FR-005–FR-007. No timezone is inferred from the machine or repository location.
- Reuse existing stack/data for read-only smoke. Existing feature003 evidence is historical baseline; it does not prove the new filters or layouts. No new runtime verification or build has been performed in these specify/clarify steps.

## Approved details-page update — 2026-10-07

The user replaced the Inventory drawer with `/inventory/[productId]` and authorized continuing implementation against this revision. This supersedes drawer presentation references in feature003 for the Inventory action; it does not recertify historical movement evidence. The shared `/inventory` layout owns filters, pagination and the existing operation hooks across internal routes.

- **FR-019**: Inventory opens the product-specific route; direct entry/reload fetches stock and history for that URL with admin/bootstrap gating, history starts at1/20, and read failures cannot enable a movement submit. Returning using the app's back-to-list/sidebar controls preserves applied filters, draft filters and catalog page/size within the shared layout. A full reload starts fresh in-memory state and never restores/replays an operation.
- **SC-009**: Read-only smoke covers row navigation, direct entry/reload, back-to-list with retained context, and an invalid/missing product error. Existing sending/uncertain departure confirmation and abort-before-discard protections apply to the app's navigation controls; inspect their changed wiring without dev writes or reinstating deferred advanced fault/bfcache/auth matrices. Abort/reload is not backend rollback. Covered by T015 and responsive T019.

Existing Tailwind, Day.js and toast dependencies added by the user are reused as the current baseline; this continuation installs none. Product filter dates remain fixed UTC+7 regardless of history timestamp presentation.
