# Frontend Data và State Model

Ngôn ngữ: [English](../data-model.md) | **Tiếng Việt**

Không DB entity/migration/storage operation. Shapes theo [backend contract](../../002-inventory-balances/contracts/inventory-api.md).

| State | Fields/owner |
|---|---|
| ProductSummary | id,sku,name,ACTIVE/INACTIVE |
| StockItem | productId,onHandQty,product |
| Movement | id,productId,RECEIPT/ISSUE,quantity,before/after,actorId,reason,createdAt |
| Page<T> | items,page,limit,total; stock/history riêng |
| ReadResource<T> | loading/ready/error discriminated và queryidentity; không zero giả |
| Selection | productId/cataloglabel,historypage/limit; tablequery riêng |
| Draft | AntForm type,quantity number optional,reason; defaults RECEIPT/empty/empty |
| Operation | actorId,productId,key,readonly normalizedpayload,firstDispatchedAt,retryUntil,status,priorUncertain,retryableFailureCount,nextRetryAt,sanitizedmessage, operationAbortController/signal, discardedflag, activeattemptID, dispatchprovenance, hiddenterminaloutcome |

sending→retryable(temporary biết),in_progress,uncertain,blocked(conflict/deadline/authmismatch),terminal rồi retire. Protection derive operation nonterminal, không pendingboolean duplicate. Ref in-flight đồng bộ chặn parallel. Không log/store key/reason/secrets trong URL/local/sessionStorage/cookies/IndexedDB/Redux; auth storage cũ.

Validate integer1..1e6, không coerce string/null, trimreason1..500 Array.from codepoints, enumexact; page/offsetsafe,size≤100. Freeze một lần, retry không lấy Formmutable.

| Event | Transition |
|---|---|
| Newvalidsubmit | Sync latch; UUID/freeze/clock; sending |
| Eligiblemanualretry | Samekey/body; sending; không timerPOST |
| 201 original/replay | Terminalsuccess retire/resetqty/reason keeptype; refreshstock/table/history1 độc lập |
| Matchingcached404/stock409 | Terminalbusinessreject kể cả sauunknown vì replay settle; retire; stock409 reset/reloadstock |
| Initial400 khôngunknown | Definitevalidation, retire/draftedit/keymới |
| ActualPOST401/403 khôngrefreshfailure/priorunknown | Definiteaccess sau interceptorpath kết thúc, retire/hideprotected |
| Preflightrefreshfail/refreshfail sauPOST401 | Q1auth-blockedmounted/releaselatch, currentattempt chưa gửi/bị từ chối tương ứng; giữunknowncũ |
| 400/401/403 sauunknown | Giữuncertainty/identity, không newform; gate có thể hidden |
| IN_PROGRESS | Giữpayload,nextRetryAt,in_progress |
| 429/API503INVENTORY_BUSY | Temporary attempt biết; giữidentity và uncertainty cũ |
| Noresponse/500/502/transport503unknown | Uncertain,guardfrozenoperation,possiblecommit |
| KEY_REUSED/deadline | Blockrecovery,guardunresolved; reads/reconcile/confirmeddeparture |
| Authfail/differentactor | Hideprotected,keepmounted,disableactions;guardlogin |
| Confirmdeparture | Clearoperation/generation trước action;khôngpersist/resend;ignorelate |

Timers chỉ availability/cutoff, clear khi retire/unmount. Refresherror không đổi success. Submitnew cần readystock đúngproduct; recovery không cần GETready. Close/reopen clearunsentdraft, defaultRECEIPT/history1; tablepage/sizegiữ. Historysize giữ trong drawer, product/reopenlimit20. Không optimistic balance/historymerge.

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
