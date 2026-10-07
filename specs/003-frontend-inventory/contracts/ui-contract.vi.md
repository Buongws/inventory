# Inventory UI và Integration Contract

## Phạm vi học FE hiện tại — điều chỉnh của người dùng, 2026-10-07

Mục tiêu đang áp dụng: sidebar trái, table tồn kho/pagination server, Inventory drawer từng sản phẩm, form nhập/xuất và lịch sử bất biến. Giữ auth/phân quyền hiện có, key/payload cố định khi retry thủ công và chống submit trùng. Kiểm chứng luồng nhập/xuất thường, validation, quyền admin/customer, lỗi API/read cơ bản và retry không tạo movement thứ hai. Giữ bằng chứng đã đạt, không chạy lại hành vi code không đổi.

Race response/modal/session/latch phức tạp, bfcache/lifecycle trình duyệt, clock/deadline/expiry và auth/refresh fault matrix chuyển **DEFERRED** (D001–D004 trong tasks). Giữ implementation và bằng chứng lịch sử có giới hạn; đổi ưu tiên kiểm chứng, không đổi backend contract hoặc yêu cầu bỏ guard. Deferred/chưa chạy không là PASS, không chặn mục tiêu học FE. Không thêm helper/proxy fault hay kiểm chứng nâng cao; converge chỉ khi người dùng yêu cầu riêng. Các scenario chi tiết cũ bên dưới là tham chiếu phạm vi đầy đủ/lịch sử khi vượt điều chỉnh này.


Ngôn ngữ: [English](ui-contract.md) | **Tiếng Việt**

[Backend chuẩn](../../002-inventory-balances/contracts/inventory-api.md), không đổi endpoint/header/error.

| Action | Shared Axios |
|---|---|
| Tablepage | GET /inventory params page/limit |
| Drawerstock | GET /inventory/:productId khôngquery/body |
| Historypage | GET /inventory/:productId/movements params page/limit |
| Submit/retry | POST /inventory/:productId/movements type/quantity/trimreason, đúngmột Idempotency-Key |

api relativebase /api/v1 sameorigin, Next externalrewrite tới validatedserver-only GATEWAY_ORIGIN(default http://localhost:3004), vẫn Gateway/Bearer/credentials/refresh. Không browserdirectAPI/serveraction/instanceAxiosinventory riêng. crypto.randomUUID securecontext(localhost được). Movementtimeout15s, GETcanceltheoquery; exactkey/body qua replay, không generate trong interceptor.

InventoryPOST config optional inventoryActorId/inventoryRetryUntil trong typedconfig cũ, cộng standard Axios signal thuộc operation, giữ trên replay. Requestinterceptor checkadmin gốc/deadline trước và sau awaitrefresh, ngaytrước Authorization/dispatch. Responseinterceptor check saurefresh trước existingonceapi(request), requestcheck chạy lại. Sessioneffective phải khớp tokenthực chọn, không mixRedux/localStorage cũ. Rejectlocal có categoryactor/access/deadline phân biệt, khôngPOST nếu sai/nonadmin/hếthạn; requestkhác khôngmetadata giữbehavior. Page phân biệt blockedlocal và serverrejection, giữunknown trước. Không token/key/body trong log/message.

RetryAfter: seconds≥0 hoặc HTTPdatefuture, nexttimestamp; disableđến hạn. Fallbackexponential1..30s+jitter0–250ms,total≤30; RetryAfterkhôngshorten/cap. KhôngPOST từtimer/mount/GETretry. Chỉ automaticexception existingoneauthreplay cóactor/deadlineguard. Clickcheckdeadline dùtimerlag. Sameadmin reauth chỉ resume mounted; không thêm loginsubsystem/crosstabsync.

API503known khi exact INVENTORY_BUSY envelope; Gateway502/timeout/noresponseunknown, bodykhông nhận biết safegenericmessage. Matchingstock404/409savedresponse settle, KEY_REUSEDkhôngsettleoriginal. 400 edit chỉ khi khôngunknown. Khôngsilentkeyrotation; terminal khôngngụýreadsuccess.

CopyViệt, giữtype/status/errorcode, labelUTC/product/recovery. AntAppcontext modal/message; uncertain/inprogress Alertbền khôngchỉtoast. Mấtquyềnhidepayload/reason/catalog/history, chỉ non-sensitivewarning. Cancelconfirmgiữmọithứ; confirmcoverclose/mask/Escape/switch/menu/dashboard/logout/login; logoutchỉsauconfirm. Callbackmodal recheckoperationidentity trướcdiscard vì response cóthểresolve khi modalopen, khôngdeleteoperationmới.

beforeunloaddefault chỉnonterminal, khônghistorymanipulation; nativeback/forwardbest-effort. pagehide discard/generation; persistedpageshow clearoperation/draft/reads/refetch sauauth, khôngbfcacherestore. Mỗi entryGETfresh/reminder, không biếtoperationcũ vì khôngpersist.

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
