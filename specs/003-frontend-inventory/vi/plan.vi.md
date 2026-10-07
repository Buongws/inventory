# Implementation Plan: Frontend Inventory Management

## Phạm vi học FE hiện tại — điều chỉnh của người dùng, 2026-10-07

Mục tiêu đang áp dụng: sidebar trái, table tồn kho/pagination server, Inventory drawer từng sản phẩm, form nhập/xuất và lịch sử bất biến. Giữ auth/phân quyền hiện có, key/payload cố định khi retry thủ công và chống submit trùng. Kiểm chứng luồng nhập/xuất thường, validation, quyền admin/customer, lỗi API/read cơ bản và retry không tạo movement thứ hai. Giữ bằng chứng đã đạt, không chạy lại hành vi code không đổi.

Race response/modal/session/latch phức tạp, bfcache/lifecycle trình duyệt, clock/deadline/expiry và auth/refresh fault matrix chuyển **DEFERRED** (D001–D004 trong tasks). Giữ implementation và bằng chứng lịch sử có giới hạn; đổi ưu tiên kiểm chứng, không đổi backend contract hoặc yêu cầu bỏ guard. Deferred/chưa chạy không là PASS, không chặn mục tiêu học FE. Không thêm helper/proxy fault hay kiểm chứng nâng cao; converge chỉ khi người dùng yêu cầu riêng. Các scenario chi tiết cũ bên dưới là tham chiếu phạm vi đầy đủ/lịch sử khi vượt điều chỉnh này.


**Branch/context**: `003-frontend-inventory` (feature context, không tạo Git branch) | **Ngày**: 2026-10-06 | **Spec**: [spec.vi.md](spec.vi.md)

Ngôn ngữ: [English](../plan.md) | **Tiếng Việt**

## Summary

Route `/inventory` do client quản lý, shared session/Axios, bảng tồn/lịch sử Ant Design và form drawer. Giữ năm quyết định clarify: mất auth giữ recovery trong trang; submit mới cần đọc tồn thành công nhưng không cần history; success xóa quantity/reason giữ type; không bỏ recovery tại chỗ; stock rejection chắc chắn reset tương tự và reload tồn. Không search/đổi backend contract.

## Technical Context

Node24, strict TypeScript; installed Next16.3.6, React/React DOM19.3.0, Axios1.20.0; Redux/useAuth hiện hữu. Khi implement chỉ thêm dependency trực tiếp antd6.6.5 và @ant-design/nextjs-registry1.3.0 vào manifest/lockfile web; kiểm tra peer cssinjs thực tế, không thêm cssinjs/icons/query/form/navigation library trực tiếp nếu chưa cần. Không cài trong plan.

Inventory chỉ lưu component memory; auth localStorage/cookie giữ nguyên. Không DB/migration; đổi config transport frontend. Desktop browser, keyboard/label/focus/scroll ngang trên màn hẹp; không hứa production latency/volume, page≤100. Không test tự động mới; manual browser/Gateway/PostgreSQL dùng thử thật, root check/build và tests hiện hữu, ghi thiếu suite trung thực. Docs/metadata hỗ trợ compatibility, chưa chứng minh runtime/hydration.

## Constitution Check

Gate trước research và sau design PASS. I: spec/clarify rõ behavior. II: API rules/auth, Gateway giữ proxy, frontend shared Axios/session. III: không schema/migration, tồn server quyết định. IV: hai component nghiệp vụ và type file, state local, provider cũ, không framework generic. V: manual integration/root gates về sau, không test mới/claim runtime giả.

## Project Structure

Artifacts: plan/research/data-model/quickstart, contracts/ui-contract và các bản vi tương ứng. Spec/checklist là inputs; tasks chỉ tạo khi được yêu cầu.

Touchpoints dự kiến:

- `apps/web/app/inventory/page.tsx`: route mỏng render InventoryManagement, không fetch auth server/redirect.
- `apps/web/components/inventory-management.tsx`: client owner session gate, Layout/Sider/Menu, bảng, selection/reads/operation/confirmation/beforeunload và mọi POST.
- `apps/web/components/inventory-drawer.tsx`: UI có ý nghĩa với typed props/callbacks, Form/tồn/history/error/recovery; không sở hữu lifecycle key riêng hay gọi API riêng.
- `apps/web/lib/inventory-types.ts`: types backend, không wrappers/helpers.
- `apps/web/app/layout.tsx`: AntdRegistry quanh AppProvider.
- `apps/web/components/app-provider.tsx`: giữ Redux/bootstrap, thêm ConfigProvider locale Việt và AntD App modal/message context.
- `apps/web/components/protected-dashboard.tsx`: link Inventory chỉ admin, giữ customer dashboard.
- `apps/web/lib/api.ts`: inventory actor/deadline checks và relative baseURL, không đổi token storage/backend.
- `apps/web/app/globals.css`: scope CSS form/label/input/button cũ vào auth/dashboard; spacing/scroll inventory tối thiểu, không global reset làm đổi trang khác.
- `apps/web/next.config.ts`, `apps/web/.env.local.example`: rewrite same-origin/config Gateway.
- `apps/web/package.json`, `apps/web/package-lock.json`: hai dependency khi implement.

## Phase 0 — Research

[research.vi.md](research.vi.md) chốt SSR/library/state/auth race/navigation/transport theo nguồn chính thức; agent research chỉ đọc. Không unknown còn lại, không edit source/install.

## Phase 1 — UI, state và contracts

Shared baseURL `/api/v1`; Next rewrite `/api/v1/:path*` tới GATEWAY_ORIGIN server-only, default http://localhost:3004, validate origin http(s) trong next.config. Env example NEXT_PUBLIC_API_URL=/api/v1; Inventory deployment hỗ trợ same-origin, không override cross-origin cũ. Forward cookie/header/status/Retry-After, kiểm chứng auth/Google regression, không custom proxy. API CORS không expose Retry-After, Gateway429/502 thiếu CORS nên gọi browser cross-origin không đủ contract.

Route `/inventory`; Menu Inventory/dashboard, sign-out action riêng. Mọi control rời trang qua local confirmation, không context/router patch toàn cục. Dashboard link chỉ admin. Signed-out không operation về /login sau init; customer Result denied. Pending auth fail giữ mounted cảnh báo mất recovery không nhạy cảm và nút login được guard; ẩn catalog/history/reason. Same-admin restore tại chỗ unlock recovery, admin khác không gửi được.

Stock Table rowKey productId, controlled page/pageSize/total, sizes10/20/50/100, showSizeChanger; không sorter/search. Drawer tên/SKU/status/tồn, history rowKey movementID, limit20; reset page khi product/size/success. Hiện UTC có nhãn, actorUUID, type/qty/before/after/reason, không lookup actor API. Form Select mặc định RECEIPT, InputNumber trống integer/min/max; TextArea trim/codepoints, không maxlength UTF16 làm reject500emoji. Submit mới cần ready stock; history lỗi riêng không chặn.

Parent useState resources/pagination/selection/operation; ref operation/send latch đồng bộ chặn doubleclick trước render. Form giữ draft, không duplicate Redux. Freeze normalized body/actor/product/UUID trước network. GET effects shared api + AbortController và checks generation/product/page/actor; cancel GET không error. Mất session abort/invalidate reads, hide data, giữ mounted operation. POST callback hoàn tất attempt khớp còn live và release latch bất kể quyền; chỉ publish/refresh cần originaladmin có quyền và identity/generation hiện tại; confirmed departure clear ref/generation, late callback không mở drawer/reset form mới.

POST không nằm trong effects. Dùng api.get<T>/post<T> trực tiếp, không service wrapper. Movement timeout15s chỉ request, không đổi Gateway/backend; timeout/abort không hủy transaction. Success/replay retire operation, resetqty/reason keeptype, refresh ba resources riêng history1. Recognized terminal stock rejection/replay kể cả settle uncertainty trước retire/reset/reloadstock; validation giữ draft lỗifield, submit sau keymới. [States](data-model.vi.md), [contract](../contracts/ui-contract.vi.md).

Ant App Modal xác nhận close/mask/Escape/switch/menu/dashboard/signout/login và link/router action tương lai. Cancel giữ tất cả; confirm discard/invalidate trước action. Không persist/history sentinel/monkeypatch/guard dependency, không guarantee browserBack/Forward. beforeunload conditional, preventDefault/returnValue default. Unmount discard, không resend. pagehide discard; pageshow persisted=true clearoperation/draft/resources, authorized freshGET/reminder, không bfcache restore/POST. Draft và success refresherror không warning unresolved.

## Verification và handoff

[quickstart.vi.md](quickstart.vi.md) phủ stories/FR/SC, SSR/hydration/style cũ/auth actor/deadline/lostresponse. Không migration/runtime/build đã chạy trong plan. Bước tiếp theo khi yêu cầu `$speckit-tasks`.

## Complexity Tracking

Không deviation. Registry phục vụ SSR; hai component tách orchestration và drawer rendering thực chất. Hai Axios metadata inventory-only giải quyết race auth/retention mà callback page không quản lý được. Auth requests khác giữ behavior.

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
