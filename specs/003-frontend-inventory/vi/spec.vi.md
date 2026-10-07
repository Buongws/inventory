# Đặc tả feature: Frontend Inventory Management

## Phạm vi học FE hiện tại — điều chỉnh của người dùng, 2026-10-07

Mục tiêu đang áp dụng: sidebar trái, table tồn kho/pagination server, Inventory drawer từng sản phẩm, form nhập/xuất và lịch sử bất biến. Giữ auth/phân quyền hiện có, key/payload cố định khi retry thủ công và chống submit trùng. Kiểm chứng luồng nhập/xuất thường, validation, quyền admin/customer, lỗi API/read cơ bản và retry không tạo movement thứ hai. Giữ bằng chứng đã đạt, không chạy lại hành vi code không đổi.

Race response/modal/session/latch phức tạp, bfcache/lifecycle trình duyệt, clock/deadline/expiry và auth/refresh fault matrix chuyển **DEFERRED** (D001–D004 trong tasks). Giữ implementation và bằng chứng lịch sử có giới hạn; đổi ưu tiên kiểm chứng, không đổi backend contract hoặc yêu cầu bỏ guard. Deferred/chưa chạy không là PASS, không chặn mục tiêu học FE. Không thêm helper/proxy fault hay kiểm chứng nâng cao; converge chỉ khi người dùng yêu cầu riêng. Các scenario chi tiết cũ bên dưới là tham chiếu phạm vi đầy đủ/lịch sử khi vượt điều chỉnh này.


**Feature Branch**: Không tạo (không cấu hình branch hook)
**Feature Directory**: `specs/003-frontend-inventory`
**Ngày tạo**: 2026-10-06
**Trạng thái**: Draft — đã kiểm tra chất lượng spec; chưa implement
**Đầu vào**: Bảng/drawer inventory cho admin, lịch sử phân trang, nhập/xuất, retry an toàn và bảo vệ rời trang; không thay đổi backend hoặc thêm test tự động.

Ngôn ngữ: [English](../spec.md) | **Tiếng Việt**

## Phạm vi repository

Chỉ đề xuất frontend. [Inventory API contract](../../002-inventory-balances/contracts/inventory-api.md) quyết định fields, quyền, phân trang, thứ tự, lỗi và retention idempotency 24 giờ. Bằng chứng backend nằm trong [validation](../../002-inventory-balances/validation.md); spec không khẳng định UI đã tồn tại hoặc được kiểm chứng runtime.

Bao gồm sidebar admin trái/content phải, bảng tồn, drawer từng sản phẩm, lịch sử phân trang, form movement và bảo vệ recovery/rời trang. Không search (kể cả lọc trang đã tải), sorting tùy chọn, Product CRUD UI, Orders, sửa/xóa lịch sử hoặc đổi backend/Gateway/database.

Ràng buộc người dùng: reuse Axios interceptor và Redux session qua Gateway; ưu tiên Ant Design Layout, Menu, Table, Form, Drawer. Component typed đơn giản, UI state cục bộ, handler gần nơi dùng; không utils/hooks/wrappers thừa, framework generic hay abstraction suy đoán. Đây là ràng buộc đã yêu cầu, không phải thiết kế implementation. Việc loại search ưu tiên hơn convention search chung trong [AGENTS.md](../../../AGENTS.md) và [frontend conventions](../../../docs/en/conventions/frontend.md).

Không thêm test tự động. Khi implement cần ghi kiểm chứng browser/Gateway thủ công trên PostgreSQL dùng thử thật, quality/build bị ảnh hưởng, screenshots và coverage bỏ qua. Không implement, migration hoặc kiểm chứng runtime trong specify.

## Clarifications

### Session 2026-10-06

- Q: Khi refresh session thất bại trong lúc thao tác sending/unresolved, UI xử lý thế nào? → A: A — giữ recovery trong bộ nhớ trang còn mounted, ẩn dữ liệu bảo vệ và khóa actions; xác nhận mất recovery trước khi điều hướng đăng nhập; chỉ retry cùng thao tác nếu admin gốc khôi phục session tại chỗ.
- Q: Khi tồn hoặc lịch sử trong drawer tải lỗi, form nhập/xuất có được tiếp tục sử dụng không? → A: A — cần đọc tồn hiện tại thành công trước submit mới; chỉ lịch sử lỗi không chặn nhập/xuất và có retry đọc riêng.
- Q: Sau khi nhập/xuất thành công, form trong drawer nên giữ hay xóa dữ liệu vừa gửi? → A: A — giữ drawer mở, xóa quantity/reason và giữ type vừa gửi; thao tác mới có chủ đích dùng key mới.
- Q: Khi thao tác chưa rõ kết quả, admin có được bỏ recovery để bắt đầu thao tác mới ngay trong cùng drawer không? → A: A — không có nút bỏ recovery tại chỗ; giữ form mới khóa, cho recovery cùng key hoặc đóng drawer/rời trang có xác nhận.
- Q: Khi server từ chối chắc chắn vì thiếu tồn hoặc vượt trần tồn, form nên giữ dữ liệu để sửa hay reset? → A: B — xóa quantity/reason, giữ type, hiện lỗi và tải lại tồn; lần submit mới có chủ đích dùng key mới.

## User Scenarios & Testing

### User Story 1 - Xem tồn có phân quyền (Priority: P1)

Admin xem tồn catalog từng trang, gồm inactive và sản phẩm chưa có movement.

**Lý do ưu tiên**: Trang quản trị chỉ đọc có giá trị độc lập.
**Kiểm chứng độc lập**: Mở Inventory với dữ liệu hiện hữu, session đang chờ/chưa đăng nhập/customer/admin; chuyển trang không cần ghi movement.
**Acceptance Scenarios**:

1. **Given** session chưa khởi tạo xong, **When** mở Inventory, **Then** hiển thị chờ, không dữ liệu bảo vệ/request inventory; sau đó cho admin vào, dùng sign-in hiện tại nếu chưa đăng nhập và từ chối customer.
2. **Given** admin, **When** tải tồn, **Then** sidebar trái chọn Inventory; bảng phải có tên, SKU, ACTIVE/INACTIVE, tồn và nút Inventory; sản phẩm chưa có movement hiện 0.
3. **Given** nhiều trang, **When** đổi page/size, **Then** dùng rows/page/limit/total từ server; đổi size về trang một, không search hoặc sorting tùy chọn.
4. **Given** đọc chậm/rỗng/lỗi, **When** render, **Then** hiện loading/empty rõ ràng hoặc lỗi dễ đọc và retry đọc; lỗi không ngụ ý tồn 0/catalog rỗng.

### User Story 2 - Xem drawer sản phẩm (Priority: P1)

Admin xem tồn mới và lịch sử bất biến, giữ phân trang bảng tồn.

**Lý do ưu tiên**: Có giá trị độc lập trước khi ghi.
**Kiểm chứng độc lập**: Mở sản phẩm có lịch sử/rỗng, phân trang, đóng/mở lại.
**Acceptance Scenarios**:

1. **Given** một dòng, **When** chọn Inventory, **Then** xác định sản phẩm, lấy tồn/lịch sử; hiển thị type, quantity, before/after, actor identifier, reason, thời gian có nhãn; không sửa/xóa.
2. **Given** lịch sử nhiều trang, **When** đổi page/size, **Then** theo page/limit/total server và mới nhất trước, độc lập bảng tồn; đổi size về trang một.
3. **Given** lịch sử rỗng hoặc lỗi đọc tồn/lịch sử, **When** mở drawer, **Then** phân biệt loading/empty/error từng phần, có retry đọc; lỗi tồn không hiện 0.
4. **Given** response sản phẩm/trang cũ đến muộn, **When** đổi lựa chọn, **Then** không ghi đè dữ liệu mới; đổi/mở lại sản phẩm bắt đầu lịch sử trang một, giữ page/size bảng.

### User Story 3 - Ghi nhập hoặc xuất (Priority: P1)

Admin giải thích thay đổi tồn cho active/inactive và thấy dữ liệu được refresh.

**Lý do ưu tiên**: Nghiệp vụ quản lý tồn chính, có chống duplicate.
**Kiểm chứng độc lập**: Dữ liệu dùng thử với tồn biết trước; nhập/xuất/từ chối rồi đối chiếu tồn/lịch sử.
**Acceptance Scenarios**:

1. **Given** active/inactive và input hợp lệ, **When** submit, **Then** thao tác mới có UUID key mới; click lặp không gửi song song, khóa sản phẩm/payload.
2. **Given** quantity/reason sau trim không hợp lệ, **When** submit, **Then** lỗi field và không gửi movement; server vẫn quyết định lỗi phụ thuộc tồn dù UI đang hiển thị tồn khác.
3. **Given** success hoặc replay thành công đã xác nhận, **When** nhận response, **Then** báo success, reload tồn drawer/bảng và lịch sử trang một; thao tác mới sau đó dùng key mới, balance response gốc không được coi là tồn hiện tại mới.
4. **Given** từ chối input/product/stock chắc chắn, **When** nhận lỗi, **Then** hiện lỗi không báo success; business attempt sửa lại dùng key mới, không kỳ vọng retry cached stock failure cùng key đổi kết quả.
5. **Given** success rồi refresh đọc lỗi, **When** đọc thất bại, **Then** giữ movement success, chỉ retry đọc, không POST lại để sửa lỗi đọc.

### User Story 4 - Khôi phục cùng thao tác (Priority: P1)

Admin giải quyết kết quả chưa nhận được mà không đổi tồn hai lần.

**Lý do ưu tiên**: Bảo vệ mất response và duplicate.
**Kiểm chứng độc lập**: Giữ request đang xử lý, làm mất response đã commit trên hạ tầng dùng thử; đối chiếu identity/payload retry và lịch sử bền vững.
**Acceptance Scenarios**:

1. **Given** sending/in-progress/uncertain, **When** xem drawer, **Then** giữ sản phẩm/type/quantity/reason đã khóa, vô hiệu chỉnh sửa/submit mới và giải thích tồn có thể đã đổi.
2. **Given** IDEMPOTENCY_IN_PROGRESS hoặc lỗi retryable, **When** chọn Retry sau thời gian cho phép, **Then** một attempt giữ key/payload cũ; không song song, polling hoặc retry tự động vô hạn.
3. **Given** mất response/network error, 500 bất ngờ hoặc Gateway 502, **When** xử lý, **Then** coi uncertain, không hủy/từ chối chắc chắn; phân biệt API 503 đã xác nhận với Gateway timeout và giữ identity để recovery.
4. **Given** success gốc đã commit, **When** retry thành công, **Then** xác nhận movement gốc, refresh không tạo movement thứ hai; IDEMPOTENCY_KEY_REUSED dừng submit, hướng đối chiếu lịch sử, không âm thầm đổi key.
5. **Given** auth hết hạn, **When** recovery session hiện tại thất bại, **Then** không cho dữ liệu/action bảo vệ, giữ key/payload chỉ trong bộ nhớ trang mounted và xác nhận mất recovery trước điều hướng đăng nhập; admin gốc khôi phục session tại chỗ được retry cùng thao tác, không chuyển scope sang admin khác.

### User Story 5 - Rời an toàn, quay lại có thông tin (Priority: P1)

Admin quyết định rõ việc mất thông tin recovery, không ngụ ý backend bị hủy.

**Lý do ưu tiên**: Không âm thầm bỏ thao tác hoặc báo hủy sai.
**Kiểm chứng độc lập**: Trong sending/uncertain thử đóng drawer, đổi sản phẩm, điều hướng app, reload/đóng tab và quay lại.
**Acceptance Scenarios**:

1. **Given** sending/unresolved, **When** đóng drawer/đổi sản phẩm/điều hướng do app quản lý hoặc sign-out, **Then** xác nhận nêu mất thông tin recovery và backend có thể hoàn tất; hủy xác nhận giữ selection/key/payload.
2. **Given** cảnh báo đó, **When** xác nhận rời, **Then** bỏ thông tin local, không persist/restore/POST tự động; không nói transaction backend bị hủy.
3. **Given** sending/unresolved, **When** reload/đóng tab, **Then** yêu cầu beforeunload mặc định chỉ khi protection đang active; không hứa wording tùy chỉnh hoặc luôn xuất hiện.
4. **Given** quay lại sau rời/reload, **When** mở Inventory, **Then** tải mới, không gửi movement được khôi phục, hiện nhắc đối chiếu lịch sử; không lấy lại key/payload cũ.

### Edge Cases

- Lỗi đọc drawer: khóa submit movement mới đến khi tồn hiện tại của sản phẩm đã chọn tải thành công. Lịch sử loading/lỗi riêng không chặn nhập/xuất; hiện lỗi và retry đọc riêng. Refresh tồn sau đó lỗi thì khóa submit mới đến khi đọc phục hồi, không đổi success movement đã xác nhận. Retry recovery cùng thao tác theo operation đã khóa và quyền, không phụ thuộc đọc dữ liệu.
- Session thất bại khi sending/unresolved vẫn giữ key/payload chỉ trong bộ nhớ trang mounted; ẩn dữ liệu bảo vệ và khóa actions. Điều hướng đăng nhập phải xác nhận mất recovery. Admin gốc khôi phục session tại chỗ thì được retry cùng thao tác; không persist operation qua điều hướng.
- Page/limit mặc định 1/20, limit≤100; không gửi offset/page không hợp lệ hoặc không an toàn. Trang vượt cuối hiện items rỗng với total server.
- Product không còn, đổi quyền hoặc response cũ không được hiện dữ liệu sản phẩm khác/tồn 0 giả. Tên/SKU/status là catalog hiện tại, không snapshot lịch sử.
- Inactive không vô hiệu nhập/xuất. Tồn hiển thị chỉ tham khảo vì admin khác có thể thay đổi.
- Trim reason trước khi khóa; kiểm tra 1–500 Unicode code points. Form chỉ có type/quantity/reason, không actor/IDs/timestamps/balance tính toán.
- Retry-After là delay tối thiểu cho in-progress/rate-limit/lỗi tạm, hỗ trợ seconds/date hợp lệ. Nếu thiếu/không dùng được, delay retry thủ công bắt đầu một giây, tăng khi lỗi retryable lặp tới tối đa 30 giây, có jitter; không tự resend.
- Sau 24 giờ từ lần gửi đầu, vô hiệu retry được giới thiệu là replay an toàn cho thao tác unresolved; cần đối chiếu lịch sử trước thao tác mới có chủ đích. Backend tính từ completion nên cutoff UI sớm hơn là bảo thủ.
- API 503 đã xác nhận và 429 không phải success/cached business failure; giữ identity để retry. Lỗi chỉ từ chối attempt hiện tại (attempt-only rejection) ở lần sau không xóa uncertainty của lần trước. Recognized terminal response/replay của operation gốc đã khóa, kể cả kết quả lỗi stock đã lưu, có thể xác định kết quả gốc và kết thúc recovery.
- Draft chưa gửi và movement success nhưng refresh đọc lỗi không cần protection cho thao tác unresolved.
- Điều hướng app quản lý phải xác nhận, gồm sign-out. Browser back/forward/unload chỉ bảo vệ best-effort theo khả năng browser, không cam kết chặn mọi history transition.

## Requirements

### Functional Requirements

- **FR-001**: Chờ session initialization; chỉ admin, reuse sign-in nếu chưa đăng nhập, từ chối customer. Không request/dữ liệu inventory trước khi xác định quyền; xử lý 401/403 sau đó.
- **FR-002**: Sidebar admin trái/content phải; bảng tên, SKU, ACTIVE/INACTIVE, tồn, action Inventory.
- **FR-003**: Phân trang server độc lập tồn/lịch sử, mặc định 1/20, limit≤100, reset khi đổi size, theo thứ tự server và empty/out-of-range trung thực; không search/sorting tùy chọn.
- **FR-004**: Drawer đúng sản phẩm có tồn/lịch sử bất biến phân trang/form; giữ pagination bảng, reset history khi đổi product và bỏ response đọc cũ.
- **FR-005**: Phân biệt loading/empty/error/success/unresolved; retry đọc độc lập retry movement; lỗi đọc không ngụ ý 0 hoặc không lịch sử. Submit movement mới yêu cầu đọc tồn hiện tại thành công cho sản phẩm đã chọn; tồn loading/lỗi thì khóa submit. Chỉ lịch sử lỗi không khóa submit movement.
- **FR-006**: RECEIPT/ISSUE, quantity JSON number nguyên 1–1.000.000 và reason trim 1–500 Unicode code points; cho inactive, chỉ gửi input contract cho phép.
- **FR-007**: Mỗi thao tác mới có chủ đích tạo UUID mới; khóa admin/product/payload chuẩn hóa trước gửi; chặn double/parallel submit và sửa khi sending/unresolved.
- **FR-008**: Mọi recovery, gồm interceptor replay auth, giữ key/payload gốc; không âm thầm đổi key cho uncertainty/lỗi tạm/key conflict.
- **FR-009**: Phân biệt success/replay xác nhận, validation/business rejection chắc chắn, transient và uncertain theo contract; mất response/Gateway timeout không chứng minh rollback, retry bị từ chối sau không xóa uncertainty cũ. Với INSUFFICIENT_STOCK hoặc STOCK_LIMIT_EXCEEDED chắc chắn và không có attempt trước còn unresolved, xóa quantity/reason, giữ type, hiện lỗi và tải lại tồn. Lần submit mới có chủ đích dùng key mới, vẫn khóa đến khi đọc tồn lại thành công. Nếu attempt trước còn uncertain và lỗi chỉ từ chối attempt hiện tại, giữ payload/key đã khóa và protection unresolved. Terminal stock-error replay xác định được kết quả thì kết thúc uncertainty và reset/reload theo cùng quy tắc.
- **FR-010**: Hiện IDEMPOTENCY_IN_PROGRESS riêng, tôn trọng Retry-After, retry hữu hạn do người dùng chủ động một attempt mỗi click hợp lệ; không polling/retry tự động vô hạn, dừng khi key conflict, không hứa safe replay ngoài cutoff. Không có action bỏ recovery tại chỗ khi unresolved; form thao tác mới vẫn khóa. Recovery dùng cùng key, hoặc người dùng xác nhận đóng drawer/rời trang theo FR-012.
- **FR-011**: Success/replay refresh tồn drawer/bảng và history trang một; không tính balance optimistic/POST lại để sửa lỗi đọc. Giữ success movement riêng refresh error. Sau success hoặc replay thành công đã xác nhận, giữ drawer mở, xóa quantity/reason và giữ type vừa gửi; vẫn reset như vậy nếu refresh đọc sau đó lỗi.
- **FR-012**: Xác nhận đóng drawer/đổi product/điều hướng app/sign-out khi sending/unresolved; hủy giữ dữ liệu, xác nhận nêu mất recovery không hủy backend.
- **FR-013**: Yêu cầu beforeunload mặc định chỉ khi sending/unresolved, bỏ sau resolve/departure; nói rõ giới hạn browser, không hứa custom text hoặc display.
- **FR-014**: Không persist/restore hoặc tự resend sau rời/reload. Mỗi lần mở Inventory tải mới và nhắc đối chiếu lịch sử cho thao tác trước có thể đã hoàn tất.
- **FR-015**: Reuse session/refresh, không đổi token storage/quyền server; recovery yêu cầu admin gốc. Mất quyền không lộ dữ liệu hoặc âm thầm kết luận transaction thất bại.
- **FR-016**: Frontend-only, local state đơn giản; không mở rộng backend/persist operation/search/Product CRUD/Orders/test tự động. Khi implement ghi manual acceptance và quality thực tế.

### Key Entities

- **Stock row**: Identity/tên/SKU/status hiện tại và tồn nguyên trong kết quả server phân trang.
- **History page**: Facts movement bất biến/catalog hiện tại, page/limit/total độc lập.
- **Local operation**: Admin/product gốc, UUID retry, type/quantity/reason trim đã khóa, thời gian gửi đầu và trạng thái sending/recovery/terminal; chỉ tồn tại trong trang mounted, không persist/restore.
- **Authorized session**: Identity/role/initialization hiện tại; quyền vẫn do server quyết định.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Trong mọi manual case waiting/signed-out/customer/admin, chỉ admin có quyền thấy dữ liệu bảo vệ hoặc tạo movement.
- **SC-002**: Ít nhất 45 products và 45 movements của một product, size 20 có ba trang đúng/total đúng ở cả hai danh sách; đổi pagination này không đổi cái kia.
- **SC-003**: Nhập 10, xuất 3, xuất 8 bị từ chối: tồn 7 và đúng hai movements; nhập/xuất cũng dùng được cho inactive.
- **SC-004**: Double click, recovery in-progress, mất success response rồi retry: mỗi logical operation có tối đa một movement và identity/payload retry giống nhau.
- **SC-005**: Mọi manual case rời khi pending giữ operation nếu hủy hoặc bỏ recovery rõ ràng nếu xác nhận; quay lại/reload gửi 0 movement khôi phục và có nhắc đối chiếu.
- **SC-006**: Mọi loading/empty/error/success/unresolved cần thiết có trạng thái riêng dễ đọc; refresh lỗi không đảo success đã xác nhận hoặc resend movement.
- **SC-007**: Mỗi click Retry hợp lệ gửi tối đa một attempt sau delay; không automatic attempt ngoài single auth replay hiện có, không claim safe replay sau cutoff.

## Assumptions

- Nhắc đối chiếu mỗi lần mở Inventory: không lưu operation qua rời trang nên không nhận diện riêng người từng rời lúc uncertain.
- Recovery thủ công, một attempt mỗi click; session giữ policy một auth replay hiện có, không cần loop recovery tự động.
- Cutoff từ first dispatch sớm hơn hoặc bằng retention tính từ completion backend; không mở rộng guarantee.
- Reuse navigation/session; route/component/guard mechanics thuộc plan, không thể chặn departure browser toàn diện.
- API/Gateway và test users/products là dependency cho kiểm chứng manual dùng thử sau này, chưa xác nhận sẵn sàng trong specify.
- Chủ yếu desktop admin; controls có label, keyboard access, focus rõ và thông báo dễ đọc. Không thêm trải nghiệm mobile riêng.
- Quality review chỉ kiểm tra spec, không runtime. Bước tiếp theo khi được yêu cầu `$speckit-clarify`; chưa tạo plan/tasks/implementation.

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
