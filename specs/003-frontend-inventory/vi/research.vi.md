# Research: Frontend Inventory Management

Ngôn ngữ: [English](../research.md) | **Tiếng Việt**

Ngày 2026-10-06; repo/docs/registry inspection, không runtime.

## R1 — Next và Ant Design

Decision: antd6.6.5 + nextjs-registry1.3.0, root registry và provider cũ thêm ConfigProvider/App. Rationale: installed Next16.3.6/React19.3.0 thỏa peers; v6 không cần React19-v5 patch. Alternatives: v5+patch, handmade/custom CSS extraction thêm việc. npm view: antd React/DOM≥18; registry Next≥14/antd≥5/cssinjs≥1. Recheck graph khi install, metadata không chứng minh hydration. [Next integration](https://ant.design/docs/react/use-with-next/), [v6](https://ant.design/docs/react/migration-v6/). Không Pages Router _document; compound Ant components chỉ client. CSS global button/input/form cần scope tránh override library.

## R2 — Read state

Decision: local useState/effect cancellation/generation, direct Axios, Ant Form draft. Rationale: một screen/ba reads, không cachelibrary hiện hữu. Alternatives: RTKQuery/SWR/Redux slice/generic hook không cần. [Axios cancellation](https://axios-http.com/docs/cancellation) hỗ trợ signal nhưng vẫn cần stale/auth checks.

## R3 — Ownership và auth race

Decision: operation frozen tại page/ref, Axios inventory-only expectedactor/deadline kiểm tra ngay trước dispatch và sau refresh trước replay. Rationale: interceptor giữ config nhưng refresh có thể đổi identity; page check không phủ async refresh/401 replay. Alternatives: bypass interceptor trái yêu cầu; thay mọi auth behavior rộng scope. Giữ singleflight/one replay, exactbody/header, reject local khi sai actor/nonadmin/hếtdeadline; không storage/auth API mới.

## R4 — Navigation

Decision: local confirmation cho mọi page-owned action và conditional beforeunload. [App useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router) không Pages beforePopState; [Link onNavigate](https://nextjs.org/docs/app/api-reference/components/link) có preventDefault. Alternatives: monkeypatch/historysentinel/guard dependency phức tạp, hứa quá mức. NativeBack/Forward/unload best-effort theo spec. [beforeunload](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event) generic text, có thể không fire.

## R5 — Recovery hữu hạn

Decision: manual oneattempt Retry, RetryAfter; fallback1/2/4/8/16/30s + additive jitter0–250ms, totalfallback≤30s; không capRetryAfter. Checkfirstdispatch+24h khi click và interceptor. Rationale: không loop/earlyretry. Alternatives: polling/newkeys nguy cơ duplicate. Unknown giữ sau400/401/403/429/503; matching scoped201/404/stock409 replay settle operation. Conflict/deadline giữ unresolvedguard, chỉ reads/reconciliation/confirmeddeparture. Mọi unknown đã resolve; giữ backend và năm clarify.

## R6 — Transport browser

Decision: Next same-origin rewrite /api/v1/:path*→Gateway, sharedrelative /api/v1; validated server-only GATEWAY_ORIGIN defaultlocalhost3004, webenvexample cập nhật. Rationale: CORS không exposeRetryAfter, Gateway429/502 thiếuCORS. [Rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) hỗ trợ proxy ngoài. Alternatives: đổi backendCORS ngoài scope, customproxy không cần. Verifycookie/Bearer/RetryAfter/status/Google flow. [pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event): pagehide discard, persistedreturn clear/refetch, không restore/resend operation.

## Nguồn kết quả, vòng đời operation và ưu tiên authentication

Quy tắc này xử lý I1/U1/U2/I2, không đổi backend hoặc năm quyết định clarify.

- Response hợp lệ của đúng product/key/payload đã khóa có 201, PRODUCT_NOT_FOUND 404, INSUFFICIENT_STOCK 409 hoặc STOCK_LIMIT_EXCEEDED 409 là kết quả terminal theo backend contract, kể cả replay, nên xác định được kết quả và kết thúc uncertainty trước. Không cần/tạo replay marker/header mới. Body404/409 không nhận biết không chứng minh terminal. Terminal stock rejection reset quantity/reason, giữ type, reload tồn theo Q5; success theo Q3. Lỗi chỉ từ chối attempt retry hiện tại (validation/auth/rate-limit/timeout/local guard) không xác định kết quả gốc còn uncertain. Terminal replay không thuộc nhóm lỗi attempt-only đó.
- Mỗi operation local sở hữu AbortController/lifetime signal; mọi initialPOST và automatic/manual replay dùng cùng signal, cùng actor/deadline metadata. Check cancellation trước refresh, sau mỗi awaitrefresh, ngay trước dispatch đầu và ngay trước replay. Confirm close/departure, pagehide/unmount đánh dấu discarded và abort signal trước clearref/navigation. Không hủy sharedrefreshpromise của request khác; refresh hoàn tất không được dispatch operation đã discard. Không framework cancellation generic mới. Cancellation chỉ ngăn frontend dispatch tiếp/dừng chờ, POST đã dispatch có thể commit; không chứng minh rollback.
- Tách attempt completion khỏi publish UI. AttemptID khớp và operation còn tồn tại luôn giải phóng sending/latch trong finally bất kể quyền hiện tại; không giải phóng latch của attempt mới hơn. Ghi terminalresult hoặc recovery/authstate kín trong bộ nhớ trang mounted dù chưa được hiển thị. Chỉ publish payload/catalog/history/result và refreshGET cho originaladmin có quyền với selection/generation hiện tại. Khi mất quyền giữ thông tin kín theo Q1, không kẹt sending; unknown vẫn recovery. Terminal đã biết kín kết thúc recovery nhưng không hiển thị; originaladmin restore thì áp reset/refresh đúng một lần không POST thêm. Operation đã discard không nhận update, không ảnh hưởng operation mới.

Ưu tiên authentication theo nguồn lỗi, không chỉ status:

| Tình huống | Kết quả bắt buộc |
|---|---|
| Refresh thất bại trước bất kỳ movementPOST dispatch | Attempt này chắc chắn chưa gửi. Release latch, giữ mounted operation/key/payload auth-blocked theo Q1, hideprotected/guardlogin; originaladmin restore được retry. Không tạo uncertainty nếu trước chưa có. |
| MovementPOST thật trả server401/403 | Attempt bị từ chối, không terminalinventory. Nếu không refreshfailure/uncertainty trước thì retire definiteaccessrejection, không dữ liệu bảo vệ khi mất quyền. Có uncertainty trước thì giữ recovery. 401 có thể đi vào existingone-refresh/one-replay, không finalize trước path kết thúc. |
| Refresh thất bại sau movementPOST trả401 | Giữ provenance server401: attempt bị từ chối nhưng Q1 ưu tiên genericinitial401retire. Release latch, giữ sameoperation mounted auth-blocked/guardlogin; giữ uncertainty cũ nếu có, không replay sau refreshfail. |
| Retry đã có uncertainty trước | Preflightfail/400/401/403/refreshfail/429/503/cancellation attempt hiện tại không chứng minh thao tác gốc thất bại. Giữ uncertainty/key/payload đến recognizedterminal hoặc explicitconfirmeddiscard. |

Manual scenarios: delaypreflightrefresh, confirmclose/departure rồi refreshfinish → 0movementdispatch; delaypost401refresh, confirmdeparture rồi finish → 0replay (POSTđầu bị reject có thể đã gửi). Cancelconfirmation → giữ sameoperationeligible. POSTsuccess/error tới khi mất quyền/actor khác → releaselatch, không protectedpublish/GET; originaladminrestore → knownterminalapplykhôngPOST, unknownsamekeyretry. Test đủ bốn hàng auth có/không prioruncertainty. Quan sát request thật, phân biệt displayfixtures và backend thật; không test tự động.
