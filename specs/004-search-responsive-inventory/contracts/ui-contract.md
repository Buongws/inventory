# Inventory UI Contract

## Controls and requests

Use the existing left sidebar/right content. Above the table, one Ant Form provides name/SKU Input, All/ACTIVE/INACTIVE Select, independent From and To DatePickers, Search and Reset. Calendar-only pickers are clearable and emit YYYY-MM-DD; they prevent invalid date input/selection and do not reorder dates or parse browser-local UTC timestamps.

- First authorized catalog request: page1, limit10, no filters. Existing bootstrap/role guards remain.
- Draft editing: zero catalog requests. Search validates calendar/range and q length, applies normalized values, resets page1 and requests even if values equal the previous submission.
- Reversed range: Form shows a field/range error and dispatches no GET; overlong q is also blocked. Picker prevention, Form/no-dispatch and backend real-date/range400 are separate evidence checks; HTTP400 is not FE PASS. Do not swap/correct dates or add wrappers/fault frameworks for verification.
- Reset: clear all draft and applied filters, page1, retain selected size and reload even if already clear.
- Pagination: retain applied filters, not unsaved drafts. Size10/20/50/100; changing size resets page1.
- Loading, ready/empty and error/retry belong to the current request identity including actor/filters/page/size/version. Old responses/errors/totals must not overwrite it. Retry uses applied filters.
- Empty results: clear filtered empty message, no misleading stale rows/total. Beyond-end empty page preserves server total and usable pagination; no new automatic clamping contract.

Inventory action, details page history and receipt/issue remain available. Filtering/reset never creates a movement or discards the current details page operation. Existing movement refresh reloads the catalog using its applied filters; history keeps its independent pagination/default20.

## Layout acceptance

At1920×1080, sidebar open, default10 ordinary product rows and catalog view: heading/reminder/filter/table/pagination fit without vertical document scrolling. Preserve readable existing fonts and essential text/actions; exceptionally long text may expand rows. At20+ rows document scrolling is allowed.

At768×1024 and390×844, reuse a visible/reopenable collapsed-sidebar trigger, wrap/stack filters and actions, constrain table horizontal scrolling to its container and keep pagination/size controls usable. Details page stays within viewport with usable content/actions. Do not hide document overflow or truncate important content to manufacture a fit.

## Product details route

Inventory navigates to `/inventory/[productId]`. The shared Inventory layout keeps list context during internal navigation; the details component shows stock, history and existing receipt/issue controls. Direct URL/reload uses the product ID in the URL and history1/20; no catalog fetch is needed while details is active. Returning through app controls retains draft/applied filters and catalog page/size. Invalid/missing-product reads show an error/retry and leave submission disabled.

Back-to-list, Inventory menu, Dashboard and logout use the existing departure confirmation for sending/uncertain operations. Confirming departure aborts the operation signal before discarding it; cancelling retains it. URL changes/unmount release reads and old operation state. Reload never restores or automatically POSTs an operation; browser-specific unload/back/bfcache guarantees remain outside this basic smoke. A frontend abort says nothing about backend commit/rollback.

During loading, pagination may retain the last count for the same actor and applied filters only as a navigation placeholder. Rows remain unavailable and the loading indicator is explicit. Ready results/count and errors use the current full query identity; another actor/filter never borrows this placeholder.
