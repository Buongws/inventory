# Research: Search and Responsive Inventory UI

**Date**: 2026-10-07. Read-only API and FE research resolved the design questions below. No runtime verification was performed.

## Query and pagination scope

- **Decision**: add InventoryListQueryDto for GET /api/v1/inventory, inherit existing pagination rules and override limit to10. Keep the history DTO/default20. Accept scalar q, status, createdFrom and createdTo; reject unknown fields and non-scalar values.
- **Rationale**: the current pagination DTO is shared by stock and history; changing its default would widen scope. Existing global validation already transforms and forbids unknown fields.
- **Alternatives considered**: global default change and a generic filter DTO were rejected as unnecessary cross-endpoint changes. [NestJS validation](https://docs.nestjs.com/techniques/validation).

## Literal search and matching count

- **Decision**: trim q; blank means unrestricted; max200 Unicode code points after trim. Use parameterized name/SKU ILIKE with explicit escape `!`, escaping `!`, `%` and `_` before surrounding with wildcard `%`. AND this OR predicate with status/date predicates. Build predicates and bound filter values once for both item and count queries.
- **Rationale**: user text remains literal and cannot become SQL syntax. The existing repeatable-read read-only transaction preserves rows/count consistency; count uses products alias p without a balance join.
- **Alternatives considered**: frontend-only filtering, wildcard input, separate filter implementations and a new search index were rejected. Existing ordering and zero-stock join remain. No measured index need exists. [PostgreSQL pattern matching](https://www.postgresql.org/docs/current/functions-matching.html).

## Calendar dates and UTC bounds

- **Decision**: wire format YYYY-MM-DD, real Gregorian dates in years0001–9999. Reject year0000, impossible dates, timestamps, empty supplied dates and surrounding whitespace. Compare validated dates for reversed ranges. Convert calendar midnight to UTC using fixed UTC+7; derive To's next calendar day before conversion.
- **Rationale**: this implements the clarify decisions without browser/server-local timezone dependence. Validate calendar components before constructing dates; account for JavaScript's year0–99 remapping. A valid To=9999-12-31 must support its derived year10000 exclusive bound internally.
- **Alternatives considered**: permissive Date parsing, UTC-midnight date strings, inclusive23:59:59.999 and an added date library were rejected. Two short feature-local validation/conversion routines are justified only where necessary, not a generic date framework. [ECMAScript Date.UTC](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date.utc).

## Form and asynchronous state

- **Decision**: Ant Form owns drafts; existing query state owns applied filters. Reuse abort scope/resource identity, with filters included in catalog identity. Display total only for the active identity, rather than current actor prefix. Two independent DatePickers use inputReadOnly and format YYYY-MM-DD.
- **Rationale**: current total logic can retain an old query's total; filters make that visible. Calendar selection avoids automatic correction of invalid typed dates and independent pickers avoid automatic range ordering. Clearing dates remains supported. Form validates range and accepted calendar values; backend independently validates direct query strings.
- **Alternatives considered**: duplicate draft state, a new data hook, RangePicker's automatic ordering and editable raw-date wrappers were rejected. No requirement demands typing dates. [Ant Design DatePicker](https://ant.design/components/date-picker/).

## Responsive presentation

- **Decision**: reuse current Sider breakpoint/zero-width trigger, Table pagination and horizontal scroll; adjust scoped spacing/filter grid, readable row density and mobile wrapping. No fixed table height, font shrink or content clipping.
- **Rationale**: existing libraries cover the interactions. A ten-row height budget is an estimate until measured in a real1920×1080 viewport; long content may require scrolling without truncation.
- **Alternatives considered**: custom pagination/sidebar, a design-system rewrite and viewport overflow hiding were rejected. [Layout](https://ant.design/components/layout/), [Table](https://ant.design/components/table/), [Pagination](https://ant.design/components/pagination/).

## Resolved scope

No unresolved planning clarification remains. No new dependency, schema/index/config change, automated test, proxy helper or environment is required. Manual evidence will be collected only during the later implementation step.
