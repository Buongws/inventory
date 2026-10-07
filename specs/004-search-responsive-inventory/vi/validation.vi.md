# Kiểm chứng: Search and Responsive Inventory UI

**Ngày**: 2026-10-07. **Bàn giao**: Đóng implement,23/23 tasks xong. Chấp nhận xác nhận kiểm chứng thủ công của người dùng ngày2026-10-07; giữ các quan sát và giới hạn trước đó bên dưới.

## Môi trường và dữ liệu

Chỉ dev hiện có: FE http://localhost:3002/inventory → Gateway3004 → API3001; PostgreSQL container inventory-learning-postgres-1/database inventory/host55433; Redis native6379. Node24.21.0. Dùng process đang chạy, API watch reload source đổi. Không môi trường/proxy/fault fixture/dependency/migration/index/config mới. Không write dữ liệu nghiệp vụ/movement POST/tạo fixture. Không in credentials/token/cookie. Giữ bằng chứng003, không chạy lại matrix nâng cao.

SQL chỉ đọc:200 Product đều ACTIVE; created_at min2026-09-30T08:21:25.012969Z/max2026-09-30T08:21:25.037322Z (ngày local UTC+7 là2026-09-30). Không có INACTIVE hoặc timestamp đúng midnight để kiểm biên. Đây là bằng chứng dữ liệu sẵn, không phải API/UI filter PASS.

## Code và source review

T001–T008,T011–T013,T016–T018,T021 xong phần implementation/doc. DTO list riêng kế thừa pagination/default10, history20 giữ. Validate ngày lịch thật/ngày một phía/range/Unicode200. listStock SQL tham số, ILIKE literal name/SKU AND status/ngày, cùng WHERE/params items/count, transaction repeatable-read/read-only; giữ UUID/left join stock0. Biên UTC+7 From inclusive/To ngày kế tiếp exclusive, xử lý năm remapping/bound trên dẫn xuất.

Ant Form sở hữu draft; submit/reset applied/page1/tăng version tải lại. Size10/20/50/100; reset giữ size. Tái dùng abort/identity guard; identity catalog actor/filter/page/size/version, total chỉ ready data đúng query. Không hooks/wrappers/framework mới. CSS scoped/Table middle density/layout/filter wrap/scroll ngang cục bộ/pagination/sidebar trigger; không giảm font/ẩn nội dung quan trọng. Drawer library max-width100vw; source/flow drawer giữ.

Diff review: auth/shared Axios/session/storage/abort helper/Gateway/Product CRUD/migration/drawer/hooks operation-departure và movement mutation method không đổi. Reload sau movement giữ filter trong query. Source review không là bằng chứng runtime idempotency/no-POST. Thêm sáu ví dụ GET Postman, giữ request/scripts/environment references cũ; không test script/environment mới.

## Quan sát thật và gates

| Check | Kết quả | Bằng chứng / giới hạn |
| --- | --- | --- |
| Checklist requirements | Complete | Anh–Việt16/16; readiness không là runtime |
| npm run check | PASS | Exit0 cuối: lint/format/typecheck API/Gateway/web |
| npm run build | PASS | Exit0 cuối: Nest API/Gateway, Next production |
| Test API hiện có | NOT RUN / không có | apps/api/test không tồn tại; không thêm suite/coi thiếu suite là PASS |
| git diff --check | PASS | Không whitespace error |
| Swagger đang chạy | PASS riêng tài liệu contract | GET http://localhost:3001/docs-json: list page1/limit10/q/status/createdFrom-createdTo format date; history20 |
| Tìm phiên browser | Quan sát, không smoke PASS | Playwright redirect /login chưa session admin. Chrome native đang có Inventory auth; AX có filter controls/10 rows/total200/size10 |
| Điều khiển Chrome | INTERRUPTED | Tool báo user changed Google Chrome, đã đọc lại state. DevTools mở/zoom67%, chưa xác nhận1920×1080/zoom100 hoặc cặp thao tác-request do agent kiểm soát. Không lặp click locator cũ/không suy dispatch |

Build ban đầu fail vì DatePicker value union có array, đã narrow single-date type. Format đầu fail globals.css, đã format theo working directory web. Gates cuối đạt sau sửa. Không suy HTTP400/UI PASS từ source/build/Swagger.

## Verification pending và gap bàn giao

| Task/check | Trạng thái | Bằng chứng thiếu |
| --- | --- | --- |
| T009 API filter/date/page/validation | NOT RUN / pending | GET có auth qua Gateway filter thật/date-range sai400/items-total/beyond-end. Swagger/SQL dữ liệu không thay request. Thiếu data exact boundary/INACTIVE/year-edge |
| T010 FE filter/ngày | NOT RUN / pending | Edit không GET/tên-SKU ngoài trang đầu/case-trim/combinations/Enter/submit lặp; picker ngăn ngày sai; Form range lỗi/zero dispatch. Bằng chứng FE riêng BE400 |
| T014 reset/page/size/states/retry/stale | NOT RUN / pending | Thao tác-request-UI kiểm soát cho applied-vs-draft/reset/các size/no-match/beyond-end; thứ tự response chồng lấp thật/rows-total mới nhất/error-retry-session nếu quan sát không fault |
| T015 compatibility UI | Source review một phần; pending | Drawer stock/history20/filter-reset no-POST quan sát có kiểm soát; key-payload-selection chỉ review source, không movement write dev |
| T019 viewport | NOT RUN / pending | CSS1920×1080/zoom100/sidebar mở/10 dòng thông thường/drawer đóng + screenshot/đo scroll;768×1024/390×844 sidebar-controls-pagination-table-local scroll-drawer;20+/text dài |

Code/responsive/gates độc lập đã tiếp tục. Check bắt buộc chưa chạy giữ NOT RUN/task unchecked ở hai bản. T022 đối chiếu contract/T023 báo cáo xong không là hoàn tất runtime verification.

## Tiếp tục thủ công

Dùng tab admin đã auth ổn định tại http://localhost:3002/inventory. Theo quickstart.vi.md với Network: edit không GET, submit/reset/page/size đúng query-response-total; FE picker/range ghi riêng backend400 có auth trực tiếp. Dùng Product2026-09-30 để kiểm khoảng ngày, không tạo bằng chứng midnight/INACTIVE giả hoặc sửa dev data. Ghi CSS viewport/screenshot/scroll; error/overlap chỉ quan sát không helper fault mới, nếu thiếu giữ NOT RUN. Không proxy/helper mới còn hoạt động.

## Thay đổi workspace song song

Sau gates đạt lần đầu, có chỉnh sửa đồng thời thêm Tailwind4/PostCSS vào apps/web/package.json/package-lock.json, tạo apps/web/postcss.config.mjs, đổi apps/web/README.md/globals.css và thêm p-5 vào Form filter. Đây không phải thay đổi do lượt implementation này tạo; đã giữ nguyên. Chúng nằm ngoài plan Inventory không dependency mới. Đã chạy lại npm run check/npm run build trên workspace sau thay đổi, cả hai exit0. Responsive acceptance vẫn NOT RUN; gates không chứng minh layout sau chỉnh sửa fit.

## Chỉnh UI và loading theo yêu cầu (2026-10-07)

Dùng Tailwind đã cài để tạo khung filter có padding, grid responsive và cùng một card trắng cho form/bảng. Chuyển padding khỏi AntD Form để tránh reset của thư viện; bỏ margin mặc định của pagination trong card. Loading có spinner kèm nhãn, vùng bảng giữ chiều cao và nút submit có loading; pagination chỉ giữ total cũ khi cùng actor và bộ lọc đang áp dụng. Lịch sử cũng có spinner kèm nhãn. Không thêm delay giả, dependency, helper, proxy hoặc ghi dữ liệu.

Quan sát frontend dev đã đăng nhập tại http://localhost:3002/inventory: padding form hiển thị, thấy cùng lúc10 dòng và pagination; click trang kế có kiểm soát đã đổi sản phẩm, total vẫn200. Screenshot native1920×976 gồm cả chrome trình duyệt, không chứng nhận CSS viewport1920×1080 hoặc tablet/mobile. Chưa thu cặp request/response; chưa chụp được overlay loading vì request xong trước quan sát kế tiếp. Khi mở Network, browser guard báo user changed; không lặp thao tác. Bằng chứng runtime loading/overlap vẫn pending.

Sau sửa source, web lint, format:check, typecheck và production build đều exit0. Các task verification của feature vẫn chưa được đánh dấu hoàn thành.

Theo yêu cầu tiếp theo, sidebar chuyển sang AntD light theme, chữ menu chưa chọn đậm hơn, header gọn và Đăng xuất ở chân sidebar. Padding cell bảng căn theo form. Bản này đạt web lint/format/typecheck/build; hình ảnh browser cuối vẫn NOT RUN vì Chrome đã chuyển sang trang khác. Screenshot trước thuộc bản sidebar trước chỉnh sửa này.

## Tiếp tục implement: route details (2026-10-07)

### Baseline và tài liệu hiện tại

Người dùng cho phép implement theo `/inventory/[productId]` vừa sửa. Đồng bộ spec/plan/UI contract/data-model/quickstart/tasks Anh–Việt, thay presentation drawer hiện tại bằng details; giữ nguyên bằng chứng lịch sử bên trên. FR-019/SC-009 được bao phủ bởi T015/T019 hiện có, không thêm suite/matrix fault. Giữ Tailwind/Day.js/react-toastify người dùng đã cài. Không thêm abstraction/dependency/helper/fixture/môi trường hoặc ghi dữ liệu nghiệp vụ dev.

Review source: layout Inventory chung giữ InventoryManagement mounted; route params quản lý product. Catalog disabled khi ở details, stock/history scope theo product; giữ bootstrap/admin/operation-owner gates. Control Inventory/quay về/Dashboard/logout qua requestDeparture. Discard gọi scope.abortAll trước đánh dấu discarded/giải phóng ref; cleanup route xóa draft/read state, reset history1/20/tăng query version, giữ filter/page/size catalog. Hook resource hủy read cũ/chỉ expose queryId phù hợp. Submit vẫn yêu cầu stock READY và latch; services key/payload/retry và transaction không đổi. Đây là source evidence, không PASS UI operation pending hoặc bằng chứng rollback backend. Native Back/bfcache/matrix fault vẫn deferred.

### Smoke chỉ đọc đã chạy

Môi trường dev hiện có; browser `http://localhost:3002/inventory`. Network thực tế dùng same-origin `http://localhost:3002/api/v1/...`; Next rewrite hiện có đi Gateway3004 → API3001. PostgreSQL container `inventory-learning-postgres-1`, database `inventory`, host55433; Redis6379. Chưa đo viewport/zoom trong lượt này.

| Check | Kết quả | Bằng chứng quan sát |
| --- | --- | --- |
| GET catalog đầu sau reload | PASS riêng subcheck | Network `/api/v1/inventory?page=1&limit=10`, UI total200 |
| Draft text không GET | PASS riêng subcheck | Nhập `  dEmO-0035  `, Network Inventory vẫn một request trước submit |
| Enter/trim/SKU khác hoa thường | PASS riêng subcheck | Enter gửi `/api/v1/inventory?q=dEmO-0035&page=1&limit=10`, Network200 OK; response page1/limit10/total1, SKU DEMO-0035 / Compact Portable Charger / stock0; UI cùng sản phẩm/total1 |
| Search toàn catalog ngoài trang đầu | PASS riêng subcheck | SQL read-only theo UUID đặt DEMO-0035 ở ordinal21, server search phía trên vẫn trả về |
| Coverage dữ liệu | Chỉ quan sát | SQL vẫn200 ACTIVE, created_at2026-09-30T08:21:25.012969Z đến .037322Z; không INACTIVE/midnight |
| Inventory mở route product | Một phần, không PASS T015 | Click Inventory row đã đổi URL `/inventory/187eceec-86eb-47ae-8931-82ddc28de771`; snapshot còn list chuyển tiếp. Quan sát kế tiếp sang cửa sổ Chrome khác, chưa xác nhận render/stock/history request details |
| Browser continuity | INTERRUPTED | AX kế tiếp là cửa sổ không phải frontend; dừng input, không retry locator cũ hoặc suy request details đã xong |
| Root gates | PASS | `npm run check` và `npm run build` exit0 trên code details hiện tại; build có dynamic `/inventory/[productId]`. Log `/tmp/inventory004-details-check.log`, `/tmp/inventory004-details-build.log` |
| Suite API hiện có | NOT RUN / không có | Không có `apps/api/test`; không thêm test |

Không chủ đích POST. Network trên chỉ chứng minh các GET đã ghi, không là khẳng định toàn bộ thao tác zero-POST. Không kết luận transaction backend.

### Verification còn thiếu

T009 pending: tên/punctuation/status/ngày kết hợp-một phía-cùng ngày/direct400/count-page-size/beyond-end; thiếu data INACTIVE/biên/year-edge không là PASS. T010 pending: status/date/name combinations/submit lặp/picker prevention/range đảo và q quá dài không dispatch. T014 pending: page dùng applied thay draft/reset/tất cả size/empty/loading/error-retry/overlap; giữ bằng chứng next-page cũ nhưng chưa hoàn thành task. T015 pending: details render stock/history1/20, URL trực tiếp/reload/quay về giữ context/lỗi product disabled submit/navigation protections hiện tại. T019 pending: CSS viewport thật1920×1080/768×1024/390×844 và details hiện tại dùng được. Giữ cả năm unchecked,18/23 tasks hoàn thành; không converge.

Tiếp tục thủ công: giữ tab admin ổn định với Network; (1) submit tên/status/ngày/range sai, (2) page/size/reset/empty/response mới nhất, (3) details/reload/quay về/history1/20/context danh sách, (4) URL product không tồn tại chỉ đọc và submit disabled, (5) đo ba viewport/sidebar/table/form. Không submit movement hoặc thêm helper fault trên dev.

## Lượt tab ổn định và sửa UI — 2026-10-07

Chỉ dùng stack dev hiện có; người dùng giữ tab frontend trong lượt này. Không movement POST/fixture/helper fault/proxy/môi trường/test tự động mới. GET thủ công qua Console dùng session hiện có hoàn toàn trong browser, không output credentials; hàm tạm không cài hook hoặc đổi state trang/app.

### Bằng chứng API (T009 một phần)

Request dùng same-origin `/api/v1/inventory` rewrite Gateway3004/API3001. Response200 đã quan sát: bỏ params→page1/limit10/items10/total200; charger khác hoa thường có khoảng trắng→items8/total8; literal `%`/`_`→items0/total0 (SQL read-only độc lập có8 charger và0 literal punctuation); INACTIVE→0/0 đúng dataset200 ACTIVE; From2026-09-30→200, From2026-10-01→0; To2026-09-29→0, To2026-09-30→200; charger+ACTIVE+From=To2026-09-30→8/8; page2/limit20→20/200; page999/limit10→0/200 và giữ page999, không clamp; leap day hợp lệ2024-02-29→200/total0. Giữ bằng chứng SKU trước.

Response400 cho2026-02-30,2025-02-29, range đảo, năm0000, timestamp, status sai, limit0, repeated createdFrom, createdFrom rỗng, q201 ký tự. Đọc riêng envelope ngày sai: `statusCode:400`, `code:INVALID_INPUT`, message calendar date. Đây là BE, không là FE PASS. T009 vẫn pending coverage exact midnight UTC+7/INACTIVE có kết quả dương/year-edge do thiếu data; không tạo record giả.

### FE filter và pagination (T010/T014 một phần)

- Tên `  cHaRgEr  ` submit q=cHaRgEr, UI8 charger. Draft ACTIVE và From/To2026-09-30 chưa submit không GET; query kết hợp đủ bốn điều kiện, UI8 sản phẩm.
- Paste2026-02-30 vào From không đổi2026-09-30 đang có. Picker chọn From2026-10-07 với To2026-09-30 hiện field error; submit Network Inventory count giữ10/46 total requests. Không tự đảo ngày.
- Reset xóa text/status/ngày, về page1/total200. Size20/50/100 đều request page1/limit tương ứng; default10 đã quan sát.
- Size20/draft `unsent-draft`, next-page gửi page2/limit20 không q. Details rồi quay lại giữ page2/size20/draft.
- Reset từ page2 gửi page1/limit20, xóa draft; reset đã clear vẫn thêm GET (22→23 Inventory requests).
- Query `no-match-inventory004` page1/limit20 có empty message. Submit lặp thêm GET (24→25). q201 ký tự hiện lỗi, không GET mới. Có quan sát nút submit loading thoáng qua; chưa chụp table overlay hoặc thứ tự response chồng lấp thực tế.

T010 pending UI INACTIVE/All/From-only/To-only; lượt Select cuối chưa mở thành công trước khi tool mất kết nối. T014 pending table loading/overlap và catalog error/recovery; không lấy details404 thay lỗi catalog.

### Details compatibility (T015 hoàn tất)

Đã xác nhận stock0 / Compact Portable Charger / DEMO-0035 / ACTIVE, history page1/limit20. Quay về app giữ padded SKU draft/applied filter và total1. Navigation lần hai từ catalog page2/size20/draft chưa submit giữ nguyên page/size/draft khi quay lại. URL trực tiếp và hard reload đều đúng product; Network có GET stock/history1/20 sau cả hai, không catalog cho các lượt vào trực tiếp đó.

UUID không tồn tại00000000-0000-4000-8000-000000000000 trả stock/history404, UI lỗi/retry và submit movement disabled. Bấm retry stock thêm GET, vẫn lỗi và disabled submit. Bật cột Method Network: Inventory reads quan sát đều GET, gồm history; không movement POST trong các scenario kiểm soát này. Review source lượt trước vẫn áp dụng requestDeparture/abort trước discard/key-payload/retry. Không tạo sending operation, không chứng nhận lại transaction/bfcache/auth nâng cao. Đánh dấu T015 ở cả hai tasks.

### Đo CSS viewport thực tế (T019 một phần)

Chrome Responsive emulation, browser zoom reset100%; preview device50% chỉ để hiển thị màn emulation lớn, font CSS14px. Toolbar1920×1080 ban đầu nhưng DOM1920×1254: không tính PASS. Đã áp dụng height bằng numeric step event thật và đo lại DOM frontend:

| CSS viewport | Width/height document | UI/số đo thực tế |
| --- | --- | --- |
|1920×1080|scrollWidth1920/scrollHeight1080|10 rows, sidebar mở200px, đáy table/pagination851px, font14px, không overflow document; đã xem screenshot trong lượt |
|768×1024|scrollWidth768/scrollHeight1024|Filter hai cột330.5px, sidebar thu còn border1px, table client717/scroll720. Trigger mở sidebar200px, vẫn scrollWidth768; đã xem screenshot |
|390×844|scrollWidth390/scrollHeight1178|Filter một cột323px, table client355/scroll720, pagination355px, cuộn dọc hợp lệ. Trigger mở sidebar200px không overflow ngang document; đã xem screenshot |

Screenshot mobile cho thấy trigger top64px sát nhãn filter đầu. Đã sửa CSS scoped Inventory: trigger top20px, heading padding-left28px ở width≤991 để trigger cùng hàng tiêu đề. Chỉ sửa presentation, root gates cuối đạt. Chưa có đầy đủ thao tác/screenshot mobile sau sửa; T019 pending filter/reset/page-size/local-scroll/details tablet-mobile, đo scroll20+/text dài và kiểm lại trigger/heading bị ảnh hưởng. CSS không đổi bằng chứng filter/backend trước.

### Gián đoạn tool, cleanup và gates cuối

Click nhãn Select báo element-invalid; đã đọc state ngay, tool trả `cgWindowNotFound`. Lấy lại binding Chrome cũng cùng lỗi, dừng toàn bộ input; đây là lỗi tool/window-binding, không là bằng chứng user đổi tab hoặc UI FAIL. Không lặp click element cũ. State emulation cuối xác nhận mobile390×844/preview50%, No throttling; không thể đưa view browser về normal vì tool lỗi. Có thể bấm Cmd+Shift+M khi focus DevTools để tắt device toolbar, rồi đóng DevTools. Không proxy/delay/fault config cần phục hồi, không file/hook helper còn lại.

Sau sửa CSS: root `npm run check` và `npm run build` exit0 cả ba app; log `/tmp/inventory004-final-check.log`, `/tmp/inventory004-final-build.log`; `git diff --check` đạt. Không có thư mục test API hiện có/không thêm suite.19/23 checked, T009/T010/T014/T019 pending. Không converge.


## Thử khôi phục browser binding — 2026-10-07

Scope chỉ các gap T009/T010/T014/T019; giữ toàn bộ bằng chứng API/details/desktop đã đạt. Không sửa source, tạo fixture/helper/môi trường, ghi dữ liệu hoặc submit movement. Môi trường dự kiến vẫn dev hiện có: FE3002 qua rewrite cùng origin /api/v1 → Gateway3004 → API3001, PostgreSQL55433, Redis6379. Không chạy lại gates vì code không đổi.

Đọc inventory cửa sổ hiện tại: Chrome đang chạy, không có tab từ browser provider. Bind lại Chrome native thành công ban đầu: cửa sổ “Inventory Auth”, URL localhost:3002/inventory, total200, size10, status Tất cả, DevTools Console đang mở. Quan sát này chỉ xác nhận tab ban đầu, không là smoke PASS mới. Click đầu tiên vào text Tất cả từ state mới bị công cụ từ chối: “The user changed '/Applications/Google Chrome.app'”. Đọc lại AX ngay trước khi gửi thêm input: chỉ thấy cửa sổ “Picture in Picture”, không còn DOM frontend. Dừng UI, không click thêm hoặc lặp rebind. Thông báo công cụ không xác định ai đổi cửa sổ. Click bị từ chối có dispatch request hay không là UNKNOWN; không có cặp Network để xác nhận và không dùng làm bằng chứng PASS/FAIL.

| Tiêu chí còn thiếu | Trạng thái lượt này | Lý do |
| --- | --- | --- |
| T009 biên midnight UTC+7, dữ liệu INACTIVE dương tính, biên năm | NOT RUN / pending | Catalog đã quan sát thiếu record phù hợp; không tạo fixture dev hoặc chạy lại core smoke |
| T010 UI INACTIVE/Tất cả và chỉ From/chỉ To | NOT RUN / pending | Binding gián đoạn trước submit filter có kiểm soát |
| T014 table loading, request chồng lấp/rows-total hiện hành và catalog error/recovery/session | NOT RUN / pending | Không có cặp request/response có kiểm soát; details404 vẫn là bằng chứng riêng |
| T019 trigger/heading sau CSS, thao tác tablet/mobile/scroll cục bộ/details; đo20+ dòng và text dài | NOT RUN / pending | Mất DOM frontend trước thao tác viewport; giữ đo desktop đã đạt |

Checklist thủ công tại http://localhost:3002/inventory, dùng session admin hiện có và chỉ thao tác đọc:

1. Đặt CSS768×1024 và390×844: kiểm tra trigger sidebar nằm cạnh heading; mở/đóng sidebar, submit/reset filter, đổi trang/size, cuộn ngang cục bộ bảng và mở details. Kiểm tra control lịch sử/form sử dụng được, không submit movement; ghi screenshot và kích thước scroll document/bảng. Kiểm tra20+ dòng và text dài sẵn có; thiếu ví dụ text dài vẫn NOT RUN.
2. Submit INACTIVE (catalog hiện có dự kiến rỗng), rồi Tất cả (total200). Xóa ngày phía đối diện, submit chỉ From2026-09-30 rồi chỉ To2026-09-30; mỗi lần dự kiến khớp200 sản phẩm hiện có. Ghi query/response thật và UI riêng.
3. Mở Network, có thể throttle chỉ hai request đọc; submit nhanh hai query khác nhau, ghi loading, timing/status thực tế và rows/total cuối. Request đầu bị abort không chứng minh response thành công cũ về muộn. Trả No throttling. Chỉ ghi catalog error/retry nếu xảy ra tự nhiên; nếu không, giữ NOT RUN và không thêm fault helper.
4. Biên midnight/INACTIVE dương tính/biên năm cần dữ liệu sẵn phù hợp. Giữ NOT RUN khi thiếu; không sửa dữ liệu dev để tạo bằng chứng.

Lượt này không đổi proxy/throttle và không cài helper. Sau gián đoạn không xác nhận/khôi phục được viewport browser. Hai bản tasks giữ19/23; T009/T010/T014/T019 chưa đánh dấu. Không chạy converge.


## Đóng implement theo xác nhận người dùng — 2026-10-07

Người dùng xác nhận đã tự test mọi phần thành công và yêu cầu chuyển bước tiếp theo. T009/T010/T014/T019 ghi PASS — người dùng xác nhận kiểm chứng thủ công, và đánh dấu tại cả hai bản tasks. Đây không phải kết quả browser/Network/SQL mới do agent quan sát. Xác nhận chưa kèm timestamp từng scenario, query, screenshot, chi tiết môi trường hoặc ID record biên ngày; không tự bổ sung những thông tin này. Các ghi nhận thiếu dữ liệu/gián đoạn browser trước đó giữ như giới hạn bằng chứng lịch sử, gồm biên midnight/năm/INACTIVE dương tính. Giữ bằng chứng details/desktop/API và quality gates đã đạt. Khi đóng implement không chạy lại browser, ghi dữ liệu, tạo helper/proxy/môi trường hoặc sửa source.
