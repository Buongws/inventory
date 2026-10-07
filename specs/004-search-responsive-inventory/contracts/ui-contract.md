# Inventory UI Contract

## Controls and requests

Use the existing left sidebar/right content. Above the table, one Ant Form provides name/SKU Input, All/ACTIVE/INACTIVE Select, independent From and To DatePickers, Search and Reset. Calendar-only pickers are clearable and emit YYYY-MM-DD; they do not reorder dates or parse browser-local UTC timestamps.

- First authorized catalog request: page1, limit10, no filters. Existing bootstrap/role guards remain.
- Draft editing: zero catalog requests. Search validates calendar/range and q length, applies normalized values, resets page1 and requests even if values equal the previous submission.
- Invalid range/value: show field error and dispatch no GET; do not swap/correct.
- Reset: clear all draft and applied filters, page1, retain selected size and reload even if already clear.
- Pagination: retain applied filters, not unsaved drafts. Size10/20/50/100; changing size resets page1.
- Loading, ready/empty and error/retry belong to the current request identity including actor/filters/page/size/version. Old responses/errors/totals must not overwrite it. Retry uses applied filters.
- Empty results: clear filtered empty message, no misleading stale rows/total. Beyond-end empty page preserves server total and usable pagination; no new automatic clamping contract.

Inventory action, drawer history and receipt/issue remain available. Filtering/reset never creates a movement or discards the current drawer operation. Existing movement refresh reloads the catalog using its applied filters; history keeps its independent pagination/default20.

## Layout acceptance

At1920×1080, sidebar open, default10 ordinary product rows and closed drawer: heading/reminder/filter/table/pagination fit without vertical document scrolling. Preserve readable existing fonts and essential text/actions; exceptionally long text may expand rows. At20+ rows document scrolling is allowed.

At768×1024 and390×844, reuse a visible/reopenable collapsed-sidebar trigger, wrap/stack filters and actions, constrain table horizontal scrolling to its container and keep pagination/size controls usable. Drawer stays within viewport with usable content/actions. Do not hide document overflow or truncate important content to manufacture a fit.
