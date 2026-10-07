# Inventory Stock-List API Contract

## GET /api/v1/inventory

Frontend calls existing Gateway3004 with shared Axios; Gateway forwards to API3001. Existing authenticated ADMIN requirement, GET body rejection and error envelope remain.

| Query | Default | Contract |
| --- | --- | --- |
| page | 1 | existing positive integer/safe-offset validation |
| limit | 10 | integer1–100; FE offers10/20/50/100 |
| q | omitted | trimmed scalar; max200 Unicode code points; case-insensitive literal substring of name OR SKU |
| status | omitted | ACTIVE or INACTIVE |
| createdFrom | omitted | strict YYYY-MM-DD real Gregorian date, year0001–9999 |
| createdTo | omitted | same format/validation |

Unknown parameters, repeated/array scalar values, invalid status, overlong q, invalid dates and reversed ranges return400 INVALID_INPUT through existing validation. Whitespace-only q is unrestricted; supplied empty date is invalid. No automatic range correction.

All supplied conditions combine with AND. From maps to `>=` beginning of selected day at UTC+7; To maps to `<` beginning of its next day at UTC+7. Missing bounds are unrestricted. Conversion is backend-owned and independent of host timezone.

Example: `/api/v1/inventory?page=1&limit=10&q=Adapter&status=ACTIVE&createdFrom=2026-10-07&createdTo=2026-10-07` filters Product.createdAt to `[2026-10-06T17:00:00Z, 2026-10-07T17:00:00Z)`.

Response keeps existing `items`, `page`, `limit`, `total` envelope and stock item shape. total counts the filtered whole catalog before pagination; items use the identical predicates/snapshot. Existing ascending Product UUID order and zero-stock products remain. Beyond-end pages return empty items with the filtered total; never silently clamp the page. Literal `%`, `_` and `!` do not become wildcards.

## Compatibility

Only this endpoint's omitted limit changes to10. GET movement history remains default20 and receives no new filter fields. Product CRUD defaults, stock detail, auth/refresh, movement POST/idempotency and Gateway behavior are unchanged. Update existing Swagger DTO/list documentation; no new endpoint or schema migration.


Backend real-date/range400 is backend evidence only, never frontend PASS. Update existing Postman GET search/filter/pagination examples during implementation without adding test scripts or environments.
