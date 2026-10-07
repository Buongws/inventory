# Implementation Plan: Search and Responsive Inventory UI

**Branch / feature context**: `004-search-responsive-inventory` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: `specs/004-search-responsive-inventory/spec.md`; clarified decisions are unchanged. This document describes intended changes, not implemented or runtime-verified behavior.

## Summary

Extend the Inventory stock-list GET with server-side Product filters and scoped default pagination. Reuse the existing read-only transaction, Axios, Redux session, resource cancellation and Ant Design controls. Form draft values become applied filters only on submit. Compact the current management layout without changing authorization, drawer operations or movement idempotency.

## Technical Context

- **Language/Version**: Node.js 24; strict TypeScript.
- **Primary Dependencies**: existing NestJS, TypeORM, pg and class-validator; Next.js 16, React 19, Ant Design 6, Axios and Redux Toolkit. No dependency additions.
- **Storage**: existing PostgreSQL products and inventory balances; Redis remains Gateway infrastructure. No schema, migration, index or configuration changes.
- **Testing**: manual read-only smoke on the existing dev stack; root quality gates and relevant existing tests, if present. No new automated tests, environment or fault fixtures.
- **Target Platform**: existing browser frontend → Gateway 3004 → API 3001; frontend 3002. Desktop 1920×1080, tablet 768×1024 and mobile 390×844 validation baselines.
- **Project Type**: three independently installed applications; changes limited to API Inventory reads and frontend Inventory presentation.
- **Performance Goals**: one list request per submit/reset/page/size action, none per keystroke; consistent filtered rows/count; default ten ordinary rows fit desktop viewport with sidebar open and drawer closed. No unmeasured latency promise.
- **Constraints**: preserve Product CRUD/history endpoint defaults, authentication and movement behavior; use parameterized SQL; no speculative abstractions or index.
- **Scale/Scope**: whole catalog server filtering, existing stock response and zero-stock products; pagination backend limits remain 1–100, UI choices 10/20/50/100.

## Constitution Check

| Gate | Before research | After design |
| --- | --- | --- |
| Observable scope covers API and FE; unrelated screens excluded | PASS | PASS |
| API rules, transparent Gateway, shared Axios/Redux boundaries preserved | PASS | PASS |
| Parameterized SQL and explicit existing created_at mapping; no schema/config change | PASS | PASS |
| Existing modules and libraries; no generic framework or new dependency | PASS | PASS |
| Quality gates and honest manual verification planned; no new tests per user | PASS | PASS |

These are design compliance checks, not runtime acceptance results. No constitutional deviation requires justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-search-responsive-inventory/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── inventory-api.md
│   └── ui-contract.md
└── vi/
    ├── spec.vi.md
    ├── plan.vi.md
    ├── research.vi.md
    ├── data-model.vi.md
    ├── quickstart.vi.md
    └── contracts/
        ├── inventory-api.vi.md
        └── ui-contract.vi.md
```

Tasks are deliberately not generated at this step.

### Source Code (repository root)

```text
apps/api/src/inventory/
├── inventory.dto.ts
├── inventory.controller.ts
└── inventory.service.ts
apps/web/
├── app/globals.css
└── components/inventory/
    ├── inventory-management.tsx
    ├── inventory-table.tsx
    ├── constants/inventory.ts
    ├── api/api-types.ts
    ├── api/inventory-api.ts
    └── hooks/use-inventory-data.ts
```

**Structure Decision**: extend existing feature files. Keep the small filter Form local to InventoryManagement; no new hook, wrapper, generic utility or filter framework. Existing `use-inventory-resource.ts`, drawer and operation hooks are reused. Drawer styling changes only if viewport validation identifies overflow; its flow is unchanged.

## Design and Dependency Order

1. Finalize the stock-list query DTO and API description: a list-specific default limit10, optional normalized q/status/date strings, strict validation and unchanged response.
2. Extend listStock with one fixed-predicate/parameter collection reused by items and count inside its existing repeatable-read, read-only transaction. Preserve UUID order and balance left join.
3. Extend existing FE request types/query state with applied filters; split catalog default10 from history default20. Include actor, filters, pagination and reload version in catalog request identity. Rows, errors and total must belong to that identity; remove actor-only total matching.
4. Add local Ant Form with text, status, independent From/To DatePickers and Search/Reset. Use Form-owned draft state and calendar-only date entry. Submit/reset increment catalog reload version even when normalized filters are unchanged. Paging uses applied filters; movement-triggered reload retains them.
5. Adjust Inventory-scoped spacing and responsive CSS; keep readable fonts, essential content and usable actions. Use library table density/pagination and sidebar trigger, local horizontal table scrolling and normal document scrolling for20+ rows. Do not force fit through clipping or fixed heights.
6. Run the short validation guide and applicable gates during implementation; record actual outcomes and limitations. No tasks or implementation are executed by this plan.

## Compatibility and Delivery

Only GET `/api/v1/inventory` omission of limit changes from20 to10. History remains20; Product endpoints, auth, error envelope, stock item shape, POST payload/key and transaction rules remain unchanged. New filters are optional. Invalid/unknown query fields return400 through current validation/error handling. No deployment configuration, data mutation, migration or rollback script is required; rollback is reverting these source changes.

## Verification Strategy

See [quickstart.md](quickstart.md). Existing dev data is read only; insufficient date/status examples are recorded as unverified rather than created. Quality gates: `npm run check`, `npm run build`, and relevant existing API tests when present. This planning run inspected source and documentation only; no runtime smoke, test or build PASS is claimed.
