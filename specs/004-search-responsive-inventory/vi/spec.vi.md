# Đặc tả feature: Search and Responsive Inventory UI

**Feature Branch**: Chưa tạo (không cấu hình branch hook)
**Feature Directory**: `specs/004-search-responsive-inventory`
**Ngày tạo**: 2026-10-07
**Trạng thái**: Draft — hoàn tất specify và clarify; sẵn sàng bước plan khi được yêu cầu
**Đầu vào**: Tìm/lọc toàn catalog Inventory khi submit, mặc định10 sản phẩm/trang, giao diện desktop gọn và tablet/mobile dùng được; tái sử dụng flow hiện có, giữ giải pháp đơn giản.

Ngôn ngữ: **Tiếng Việt** | [English](../spec.md)

## Phạm vi repository

Feature bao gồm lọc danh sách sản phẩm Inventory phía API và bố cục/tương tác frontend Inventory, cùng tài liệu contract tương ứng. Gateway tiếp tục forwarding, không thêm route/rate policy. Product đã có ngày tạo; thay đổi dữ liệu product/movement hoặc schema database không phải yêu cầu. Nếu plan sau này xác định cần schema từ nhu cầu đã đo, phải giải thích và tạo migration mới, không sửa migration đã áp dụng.

Dùng [Inventory reference](../../../docs/vi/inventory/INVENTORY_SPEC.md), [contract API hiện có](../../002-inventory-balances/contracts/inventory-api.vi.md) và [spec frontend hiện có](../../003-frontend-inventory/vi/spec.vi.md) làm baseline. Feature này thay yêu cầu loại trừ search và mặc định20 của feature003, chỉ ở catalog sản phẩm. GET tồn một sản phẩm, pagination/default20 của lịch sử, nhập/xuất, quyền, auth, retry identity và idempotency giữ nguyên. Contract cũ là tham chiếu baseline, không chứng minh extension mới đã có.

**Review source, không phải UI test mới**: `apps/api/src/inventory/inventory.dto.ts` và `inventory.service.ts` chỉ nhận page/limit cho list, default1/20, từ chối query không biết, order product ID tăng dần. `apps/api/src/products/product.entity.ts` có Product.createdAt ánh xạ ngày tạo sản phẩm. `apps/web/components/inventory/` đã tách management/table/drawer/hooks/types/constants/API; `hooks/use-inventory-data.ts` mặc định20, chưa filter. Sidebar đã có breakpoint thu gọn, table đã cuộn ngang; cấu hình này chưa chứng minh desktop fit hay mobile dùng được. Tái sử dụng các phần này. History response hiện bỏ product.id lồng; không redesign shape đó.

Ràng buộc implementation do người dùng nêu: ưu tiên Ant Design Form/Input/Select/DatePicker/Table/Pagination hiện có, shared Axios và pattern state hiện tại. State/handler rõ ràng; chỉ tạo utility/hook/wrapper nếu có tái sử dụng thực tế hoặc logic độc lập đáng kể. Không generic filter framework, không thêm dependency chỉ để search/layout. Đây là ràng buộc người dùng, chưa phải plan thiết kế.

Ngoài phạm vi: redesign auth/màn khác, Product CRUD, search history/lọc ngày movement, sorter, autocomplete/search theo từng ký tự, fuzzy/relevance search, search service mới, thay flow auth/idempotency/nhập-xuất, test tự động, môi trường/proxy/fault mới và kiểm chứng nâng cao deferred của003. Đã chạy specify và clarify; chưa chạy plan/tasks/implement.

**Delta contract Inventory list đề xuất** (yêu cầu, chưa phải API đã triển khai):

| Phần | Hành vi extension cần có |
|---|---|
| GET `/api/v1/inventory` | Nhận text tên-hoặc-SKU, status và biên ngày tạo sản phẩm tùy chọn cùng page/limit. Tên query đề xuất: `q`, `status`, `createdFrom`, `createdTo`; timezone Asia/Ho_Chi_Minh (UTC+7), gồm toàn ngày, >= đầu ngày From và < đầu ngày kế tiếp To, chuyển UTC; encoding truyền query là chi tiết plan. |
| Text | Trim; substring literal không phân biệt hoa thường trên name OR SKU. Text rỗng sau trim là không lọc text. |
| Kết hợp | Text AND status AND biên ngày tạo đã chọn; áp dụng trên toàn sản phẩm trước khi lấy trang. |
| Pagination | List tồn default1/10, UI chọn10/20/50/100; giữ validation page/offset nguyên dương an toàn và max100. Total đếm đúng cùng tập đã lọc với items. |
| Response/order | Giữ `{ items, page, limit, total }`, field tồn/stock0 cho sản phẩm chưa có balance và order product ID tăng dần. Không yêu cầu thêm cột ngày tạo. Trang ngoài phạm vi trả items rỗng nhưng giữ filtered total. |
| Lỗi/quyền | Giữ admin-only và400 INVALID_INPUT cho query sai; query không biết vẫn bị từ chối. Chỉ mở validation list, không nới contract endpoint khác. |
| Endpoint khác | Không thêm filter query cho tồn một sản phẩm, history hoặc movement POST; giữ semantics cũ. |

Specify/clarify không sửa code/database/config hoặc kiểm chứng runtime. Acceptance sau này dùng smoke thủ công ngắn trên stack/data hiện có và timestamp Product đã biết. Không cần fixture ghi cho search chỉ đọc; không đổi dữ liệu dev hoặc dựng fault matrix. Ghi môi trường/viewport/kết quả/omission thật, chạy lint/format/typecheck/build của phần đổi. Nếu data không đủ phủ case, ghi thiếu coverage trước khi quyết định cách cung cấp data an toàn sau này; không ghi PASS.

## Clarifications

### Session 2026-10-07
- Q: Ngày chọn lọc timestamp nào và theo timezone nào? → A: Product.createdAt, timezone cố định Asia/Ho_Chi_Minh (UTC+7), không dùng ngày movement hoặc timezone browser.
- Q: Biên From/To bao gồm thế nào? → A: Gồm toàn bộ hai ngày chọn; dùng >= đầu ngày From và < đầu ngày kế tiếp To, chuyển sang UTC. Range cùng ngày hợp lệ.
- Q: Range một phía/ngày sai xử lý thế nào? → A: Cho phép chỉ From, chỉ To hoặc không chọn ngày. Ngày sai/From > To bị FE chặn không gửi request, backend trả400; không tự đảo hoặc sửa ngày.

## User Scenarios & Testing

### User Story 1 - Tìm sản phẩm trên toàn catalog (Priority: P1)

Admin tìm theo tên/SKU, status và khoảng ngày tạo mà không phải duyệt mọi trang.

**Giá trị**: Phải tìm được sản phẩm ngoài trang hiện tại và tổng sau lọc chính xác.
**Kiểm chứng độc lập**: Tìm tên/SKU đã biết không nằm trang đầu; đổi hoa/thường/khoảng trắng, từng status, ngày tạo Product đã biết và kết hợp điều kiện. Đối chiếu catalog, không chỉ trang đang tải.

**Acceptance Scenarios**:

1. **Given** admin được phép mở Inventory, **When** request catalog đầu tiên gửi, **Then** page1/limit10 không filter; form có input tên/SKU, All/ACTIVE/INACTIVE, From/To ngày tạo và “Tìm kiếm”/“Làm mới”.
2. **Given** sản phẩm ngoài trang hiển thị, **When** submit mảnh tên/SKU với hoa-thường/khoảng trắng ngoài, **Then** tìm được trên toàn catalog và total đúng.
3. **Given** result đang hiển thị, **When** gõ text hoặc đổi status/ngày chưa submit, **Then** edit không gửi search request và không thay tập filter đang áp dụng.
4. **Given** chọn text/status/ngày, **When** submit, **Then** mỗi result thỏa mọi điều kiện, text khớp name hoặc SKU; ngày là ngày Product, không phải movement.
5. **Given** ngày/range không hợp lệ, **When** submit, **Then** hiện validation rõ và không gửi catalog search đến khi sửa; backend validate query trực tiếp độc lập và trả400 INVALID_INPUT; cả hai phía không đảo hoặc tự sửa ngày.

6. **Given** From=To=2026-10-07, **When** search, **Then** gồm Product.createdAt >=2026-10-06T17:00:00Z và <2026-10-07T17:00:00Z; gồm đúng timestamp biên dưới và loại đúng timestamp biên trên.
7. **Given** chỉ From/chỉ To/không ngày, **When** search, **Then** dùng riêng biên dưới inclusive/riêng biên trên exclusive đầu ngày kế tiếp/không giới hạn ngày tạo tương ứng.

### User Story 2 - Phân trang và reset kết quả lọc (Priority: P1)

Admin duyệt tập đã lọc, đổi size và reset form đúng.

**Giá trị**: Pagination giữ ý định search; trang rỗng/lỗi không bị coi là catalog rỗng.
**Kiểm chứng độc lập**: Filter nhiều trang, đổi page/size, reset từ trang sau, tìm term không khớp; quan sát loading/read-error/retry nếu có trên môi trường hiện tại.

**Acceptance Scenarios**:

1. **Given** filter đã áp dụng, **When** đổi page, **Then** giữ filter/size, hiển thị page/filtered total từ server, không lấy edit chưa submit.
2. **Given** tập/page bất kỳ, **When** submit filter hoặc đổi size10/20/50/100, **Then** về page1; đổi size giữ applied filter.
3. **Given** filter draft/applied, **When** “Làm mới”, **Then** xóa text/status/ngày draft và applied, về page1, tải catalog không lọc; giữ size đã chọn.
4. **Given** tổ hợp không khớp, **When** response về, **Then** hiện no-match riêng/total0; page ngoài phạm vi giữ filtered total khác0.
5. **Given** request loading/lỗi, **When** hiển thị, **Then** tách loading/error và cho retry applied filter/page/size; lỗi không là empty hoặc stock0. Response cũ không thay rows/total/error của query mới.
6. **Given** drawer đang có, **When** đổi filter/page hoặc movement hoàn tất, **Then** giữ quy tắc selection/movement/recovery; refresh catalog dùng applied filter hiện tại. Filter không gửi movement hoặc âm thầm bỏ operation pending.

### User Story 3 - Dùng Inventory gọn trên desktop và màn nhỏ (Priority: P1)

Admin nhìn được10 sản phẩm desktop và dùng filter/navigation/action trên tablet/mobile.

**Giá trị**: Tăng mật độ/responsive nhưng không giấu nội dung quan trọng.
**Kiểm chứng độc lập**: Viewport desktop1920×1080, tablet768×1024, mobile390×844 (CSS pixel): xem filter/table/pagination/sidebar, mở drawer/form/history. Desktop fit ở zoom100%.

**Acceptance Scenarios**:

1. **Given** desktop1920×1080/sidebar mở/10 dòng mặc định/nhãn sản phẩm thông thường/drawer đóng, **When** tải xong, **Then** header/reminder/form/10rows/pagination nằm trong viewport, không cuộn dọc document hoặc table-body; giữ font đọc được và nội dung quan trọng.
2. **Given** size20 trở lên, **When** rows tải, **Then** cho phép cuộn dọc, filter/action/pagination vẫn tới được.
3. **Given** tablet/mobile, **When** dùng Inventory, **Then** sidebar thu gọn/mở lại, filter wrap/stack với label/button dùng được; cuộn ngang nằm trong table nếu cần. Document không tràn ngang.
4. **Given** màn hẹp, **When** phân trang/đổi size/mở Inventory của dòng, **Then** control dùng được; tồn/history/nhập-xuất trong drawer tới được, không clip hoặc đổi nghiệp vụ.
5. **Given** tên/SKU quá dài hoặc cài đặt chữ lớn, **When** hiển thị, **Then** vẫn truy cập đầy đủ nội dung quan trọng và cho cuộn khi cần; không giảm font/giấu nội dung để ép fit.

### Edge Cases

- Text rỗng/toàn whitespace không lọc text. Dấu thường như `%`, `_` là literal, không phải biểu thức wildcard do người dùng chọn.
- Text là name OR SKU; text/status/ngày kết hợp AND. All/rỗng không hạn chế status, gồm ACTIVE/INACTIVE.
- Sản phẩm đúng đầu ngày From được gồm, đúng đầu ngày kế tiếp To bị loại. Dùng biên ngày Asia/Ho_Chi_Minh (UTC+7) chuyển UTC và Product.createdAt, gồm sản phẩm chưa có movements.
- Ngày sai format/không tồn tại hoặc From > To: FE validation/không request, backend400 INVALID_INPUT nếu gọi trực tiếp. Chỉ From/chỉ To hợp lệ, bỏ cả hai không giới hạn thời gian. Không tự đảo/sửa ngày.
- Edit chưa submit không đổi applied filters khi page/retry/refresh catalog sau movement.
- Submit cùng filter/reset form đã rỗng vẫn tải lại; reset không chỉ xóa input local.
- Total/items cùng điều kiện; sản phẩm chưa có balance vẫn stock0; giữ ordering/ý nghĩa stock.
- Request cũ về sau submit/reset/page/size/session mới không publish rows/total/error vào kết quả mới.
- Product chọn trong drawer có thể biến mất khỏi list lọc; đó không phải bị xóa/mất quyền/lý do đổi hoặc discard operation.
- Loading/empty/error/read retry khác nhau. Text dài/màn hẹp có thể cuộn; kích thước browser chrome không thay cho CSS viewport.

## Requirements

### Functional Requirements

- **FR-001**: Giữ admin-only/auth/session/sidebar-content; không gọi protected catalog trước khi quyền resolve.
- **FR-002**: Đặt input tên/SKU, status All/ACTIVE/INACTIVE, ngày From/To của Product, “Tìm kiếm”/“Làm mới” có label trên list.
- **FR-003**: Search khi submit chủ động (gồm Enter), không fetch do edit. Trim, substring literal không phân biệt hoa thường trên name OR SKU của toàn server catalog.
- **FR-004**: Kết hợp text/status/ngày tạo; điều kiện trống không hạn chế. Lọc Product.createdAt, không movement.createdAt.
- **FR-005**: Ngày lịch được hiểu theo timezone cố định Asia/Ho_Chi_Minh (UTC+7), không phụ thuộc browser/server. Chỉ lọc Product.createdAt; backend chuyển biên ngày local đã chốt sang UTC để query.
- **FR-006**: From/To bao gồm toàn bộ ngày được chọn. Backend so sánh Product.createdAt >= đầu ngày From và < đầu ngày lịch kế tiếp To theo Asia/Ho_Chi_Minh, sau khi chuyển hai biên sang UTC. From=To hợp lệ và gồm đúng ngày local đó; timestamp tại biên trên bị loại.
- **FR-007**: Cho phép chỉ From (>= đầu ngày), chỉ To (< đầu ngày kế tiếp) và không chọn ngày (không giới hạn thời gian). Ngày sai, gồm ngày lịch không tồn tại, hoặc From > To phải hiện lỗi field/range FE và không gửi search request; backend validate độc lập query trực tiếp và trả400 INVALID_INPUT. Không swap, normalize ngày lịch sai thành ngày khác hoặc tự sửa ngày người dùng.
- **FR-008**: Chỉ mở contract stock-list cho filter đã nêu; giữ envelope/tồn/order/quyền. Lọc trước pagination; total là tổng catalog đã lọc.
- **FR-009**: Default stock page1/limit10 ngay request đầu và khi list bỏ pagination. UI10/20/50/100; giữ safe page/offset/max100. Không đổi default/limit history.
- **FR-010**: Submit/đổi size về page1; đổi page giữ applied filters/size, không tự áp edit chưa submit. Submit lặp tải lại.
- **FR-011**: “Làm mới” xóa draft/applied filters, page1, tải không lọc kể cả form đã trống; giữ size hiện chọn.
- **FR-012**: Hiển thị rows/page/limit/filtered total từ server, không filter một trang đã tải. Phân biệt no-match/total0 với ngoài phạm vi/total khác0.
- **FR-013**: Loading/empty/error riêng, retry dùng applied filter/page/size. Response/error cũ của filter/page/size/session bị thay không ghi đè data/total mới.
- **FR-014**: Giữ row Inventory/drawer/history pagination độc lập/nhập-xuất/key retry/auth/idempotency/operation protections. Refresh catalog sau movement giữ applied filter; filter/reset không gửi movement POST.
- **FR-015**: Viewport1920×1080 CSS pixel/zoom100%, sidebar mở/10 dòng đại diện/drawer đóng: header/reminder/form/table/pagination không cần cuộn dọc. Tối ưu spacing/density, không giảm font/cắt nội dung quan trọng chỉ để fit.
- **FR-016**: Cho cuộn dọc20+ rows/text dài/cài đặt accessibility. Tablet/mobile có sidebar thu/mở, filter wrap/stack, table-local cuộn ngang, action/pagination/drawer dùng được; không tràn ngang trang.
- **FR-017**: Đơn giản, feature-scoped, dùng library/Axios/state hiện có, không helper suy đoán/generic framework. Không redesign auth/màn khác hoặc đổi movement flows.
- **FR-018**: Không thêm test tự động/môi trường/proxy/fault matrix. Sau này ghi smoke filter/reset/page/empty/validation ngắn, viewport desktop/tablet/mobile và quality gates phần đổi; ghi omission thật, không chạy lại advanced003.

### Key Entities

- **Product**: Record catalog hiện có, identity/name/SKU/status/ngày tạo; khác thời gian movement.
- **Filter draft**: Text/status/ngày đang sửa chưa submit, chưa điều khiển list.
- **Applied filter set**: Điều kiện đã submit/normalize cuối cùng, điều khiển page/retry/total/refresh đến khi submit/reset.
- **Filtered stock page**: Sản phẩm/tồn hiện tại do server chọn, page/limit/filtered total; filter không đổi stock/movement.
- **Creation-day bounds**: Ngày tùy chọn theo Asia/Ho_Chi_Minh (UTC+7), đổi thành biên UTC dưới inclusive/trên exclusive đầu ngày kế tiếp. Có thể bỏ một/hai biên, từ chối ngày sai/range đảo.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Load catalog đầu có tối đa10 sản phẩm/page1; smoke name/SKU tìm được match ngoài trang đầu, hoa-thường/space tương đương, total đúng.
- **SC-002**: Smoke status/khoảng ngày/kết hợp chỉ ra sản phẩm đủ điều kiện; biên/cùng ngày gồm đầu ngày From và loại đầu ngày kế tiếp To theo Asia/Ho_Chi_Minh (UTC+7); một phía/không ngày theo FR-007; ngày sai/range đảo không fetch và query trực tiếp trả400. Dùng ngày tạo Product thật thay vì movement.
- **SC-003**: Edit0 search fetches; submit/reset load page1; page giữ filter, size về1; reset xóa mọi điều kiện, unfiltered total đúng.
- **SC-004**: No-match/ngoài phạm vi phân biệt được; lỗi vẫn là lỗi, không empty/stock0; response bị thay không ghi đè rows/total hiện hành.
- **SC-005**: Desktop1920×1080/zoom100%/sidebar mở/10 dòng đại diện/drawer đóng thấy controls/list không cuộn dọc, không giảm font/giấu nội dung quan trọng;20+ rows cuộn được.
- **SC-006**: Tablet768×1024/mobile390×844 submit/reset, sidebar, page/size, mở Inventory/tồn/history/form dùng được; không tràn ngang document/clip controls chặn thao tác.
- **SC-007**: Filter/reset tạo0 movements, không đổi identity/payload operation hiện có; drawer/history/nhập-xuất vẫn dùng trên catalog lọc; evidence nói rõ basic paths thực sự quan sát sau implement.
- **SC-008**: Evidence sau này ghi mỗi environment/viewport/smoke/quality gate/omission; case chưa chạy không PASS, không bắt buộc matrix advanced cũ.

## Assumptions

- Đối tượng admin hiện có, không mở quyền customer. UI label tiếng Việt, artifact chuẩn English/mirror Việt.
- Search là substring literal, không exact-only/fuzzy/không dấu/relevance. Case-insensitive không hứa accent folding. Giữ cách viết status cũ.
- Query names đề xuất `q`, `status`, `createdFrom`, `createdTo`; bỏ điều kiện chưa chọn. Draft default text tối đa200 Unicode code points sau trim, query dài hơn bị từ chối rõ; review limit nếu cần. Encoding/date wire format thuộc contract/plan; timezone cố định và gồm toàn ngày đã chốt.
- Giữ product ID tăng dần, không cần persist filter URL/localStorage; vào trang mới không filter/size10.
- Reset giữ size hiện chọn; default10 là fresh entry/stock-list bỏ pagination. Default20 history là riêng.
- Tablet/mobile trên là baseline thủ công đại diện, không bảo đảm mọi device. Desktop fit dữ liệu/chữ mặc định thông thường; text dài/accessibility giữ đọc được và cho cuộn.
- Date filter luôn dùng Product.createdAt và quy tắc toàn ngày Asia/Ho_Chi_Minh (UTC+7) đã chốt trong FR-005–FR-007; không suy từ máy hoặc vị trí repo.
- Dùng stack/data sẵn cho smoke read-only. Evidence003 là baseline lịch sử, không chứng minh filter/layout mới. Các bước specify/clarify này không chạy runtime/build.
