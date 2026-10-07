# Data Model

## Existing persistent entities

- **Product**: id, sku, name, status (ACTIVE/INACTIVE), createdAt → `products.created_at` timestamptz. The Product timestamp is the filter target, never movement.createdAt.
- **InventoryBalance**: existing product relationship/on-hand quantity. Keep the left join and zero quantity for products without a balance.
- **Movement**: existing history, actor, quantity and idempotency behavior unchanged; no new fields or relationships.

No schema, migration, new index or persistent filter storage is introduced.

## Stock-list query

| Field | Meaning and validation |
| --- | --- |
| page | default1; existing positive safe pagination/offset checks |
| limit | stock default10; integer1–100; history default remains20 |
| q | optional scalar text; trim; blank omitted; max200 Unicode code points; literal case-insensitive name OR SKU substring |
| status | optional exact ACTIVE/INACTIVE; All is omitted |
| createdFrom | optional YYYY-MM-DD real date, years0001–9999; inclusive start day UTC+7 |
| createdTo | optional same validation; exclusive start next day UTC+7 |

A supplied empty/invalid date or reversed validated range is400 INVALID_INPUT. One-sided bounds are valid. All predicates combine with AND. Example From=To2026-10-07: `created_at >= 2026-10-06T17:00:00Z` and `< 2026-10-07T17:00:00Z`.

## Frontend transient state

- **Draft form**: q/status/From/To, owned by Ant Form. Editing has no network effect.
- **Applied filters**: normalized strings in existing inventory query state. Separate from draft, used by paging/retry/movement reload.
- **Catalog query**: actor + applied filters + page + size + reload version identify each request. Initial page1/size10/unfiltered. Submit→applied filters/page1/version increment; reset→clear draft/applied/page1/version increment, size retained; size change→page1; page change retains filters.
- **Read resource**: loading → ready or error for the active identity. Abort/identity guards prevent old rows, totals or errors being published. Pending data never borrows another identity's total.
- **Drawer/operation state**: remains independent. Filtering the selected product out does not discard its operation, alter key/payload or dispatch a POST.

No localStorage/URL/Redux filter persistence is added. A fresh page entry uses unfiltered defaults. Existing session and movement state transitions remain unchanged.
