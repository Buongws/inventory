# Kiểm chứng triển khai: Frontend Inventory

## Kết quả FE cơ bản hiện tại — 2026-10-07

Người dùng dừng kiểm chứng nâng cao. Bảng này thay thế bảng seed NOT RUN và ghi chú tiến độ lịch sử bên dưới. “Giữ đã kiểm chứng” chỉ bằng chứng thực tế trước đó, không phải chạy mới.

| Phần cơ bản | Kết quả hiện tại / nguồn |
|---|---|
| Sidebar, quyền admin/customer, table/pagination | Đã làm; giữ bằng chứng T012, tách rõ dùng thử45 và DEV200. |
| Inventory drawer, tồn hiện tại, lịch sử/UTC/phân trang riêng | Đã làm; giữ T015. |
| Nhập/xuất, validation, chống submit trùng, inactive | Đã làm; giữ T020: nhập10/xuất3/từ chối8 → tồn7/hai facts, field/Unicode và double click chỉ một POST. |
| Lỗi cơ bản/read retry và retry cùng operation | Đã làm; giữ T020/T025: key/body cố định, replay response đã commit thật chỉ một movement; lỗi tổng hợp chỉ chứng minh FE. |
| Auth hiện có/login thường | Giữ policy; đã quan sát login thật admin dùng thử/dashboard lượt này; customer gate giữ T012. |
| Keyboard/label/UTC/style và chất lượng | T028, sửa CSS tương phản logout riêng. Root check/build exit0; Jest No tests found exit1 là thiếu coverage, không PASS. Ảnh sau sửa cuối bị Chrome quit; giữ screenshot sạch đã có. |
| Smoke cơ bản T030 | Hoàn tất 2026-10-07: giữ bằng chứng admin/table/pagination/drawer/validation, bổ sung nhập/xuất thật và customer bị chặn; xem mục T030 cuối. |
| Race/bfcache/clock/deadline/auth fault matrix nâng cao | DEFERRED D001–D004; giữ bằng chứng lịch sử có giới hạn, không chạy tiếp. |

URL lịch sử (đã được mục dọn dẹp T030 cuối thay thế): http://localhost:3102/inventory (login admin dùng thử hiện có tại http://localhost:3102/login). Giữ fixture45, PG55534/Redis56380; frontend3102 → proxy3105 normal → Gateway3104/API3101. Read-only readiness200 sau cleanup. DEV http://localhost:3002/inventory cũng hoạt động; dùng3102 để tập ghi. Không thêm fixture/helper/fault. Đã xóa module/session secret/backups T027 và runtime production tạm; browser helper undefined trước Chrome quit, sau đó Chrome không chạy. Restart runtime dùng thử gốc normal và để sẵn cho người dùng; chủ động thay yêu cầu cũ T031 dừng toàn bộ stack.

Đối chiếu cuối chỉ HTTP/SQL, không UI PASS mới: pages20/20/5,total45; SQL products45; VERIFY balance10/facts15/ledger10, DEMO-0009 balance5/facts4/ledger5. File work/inventory-003/t030-read-only.json. Config dùng thử thiếu Google client/secret, OAuth Google thật unavailable/chưa chạy và không bắt buộc milestone học FE. Browser inspection cookie/header/error/Retry-After cuối chưa hoàn tất sau Chrome quit; giữ nguồn bằng chứng cũ của luồng code không đổi.

Checklist thủ công tùy chọn, không fault mới: login admin → table/page/drawer/history; nhập1 rồi xuất1 có lý do, đối chiếu tồn/history; thử0/số lẻ/lý do trống (field error/không POST); xuất vượt tồn (lỗi API/không fact mới); customer hiện có bị chặn. Nếu operation uncertain do lỗi xảy ra tự nhiên, chỉ dùng “Thử lại cùng thao tác” rồi kiểm tra lịch sử đúng một fact; không chủ động fault dev hoặc gọi submit mới là retry. Chỉ ghi PASS khi thực sự quan sát. Không converge.

Chỉ xác nhận URL sẵn sàng: probe /inventory đầu cold compile vượt timeout5s; sau compile, /inventory và /login HTTP200. Không coi đây là UI test.

## Seed bằng chứng ban đầu và diễn biến lịch sử


Ngôn ngữ: **Tiếng Việt** | [English](../validation.md)

2026-10-06. Node 24.21.0. Đang triển khai. Không thêm test tự động hoặc migration.

Môi trường dùng thử: inventory-002-verify-pg (55534), inventory_verify; inventory-002-verify-redis (56380). Không sử dụng database dùng chung.

| Scenario | Trạng thái | Bằng chứng |
|---|---|---|
| US1/AC1 | NOT RUN | — |
| US1/AC2 | NOT RUN | — |
| US1/AC3 | NOT RUN | — |
| US1/AC4 | NOT RUN | — |
| US2/AC1 | NOT RUN | — |
| US2/AC2 | NOT RUN | — |
| US2/AC3 | NOT RUN | — |
| US2/AC4 | NOT RUN | — |
| US3/AC1 | NOT RUN | — |
| US3/AC2 | NOT RUN | — |
| US3/AC3 | NOT RUN | — |
| US3/AC4 | NOT RUN | — |
| US3/AC5 | NOT RUN | — |
| US4/AC1 | NOT RUN | — |
| US4/AC2 | NOT RUN | — |
| US4/AC3 | NOT RUN | — |
| US4/AC4 | NOT RUN | — |
| US4/AC5 | NOT RUN | — |
| US5/AC1 | NOT RUN | — |
| US5/AC2 | NOT RUN | — |
| US5/AC3 | NOT RUN | — |
| US5/AC4 | NOT RUN | — |
| FR001 | NOT RUN | — |
| FR002 | NOT RUN | — |
| FR003 | NOT RUN | — |
| FR004 | NOT RUN | — |
| FR005 | NOT RUN | — |
| FR006 | NOT RUN | — |
| FR007 | NOT RUN | — |
| FR008 | NOT RUN | — |
| FR009 | NOT RUN | — |
| FR010 | NOT RUN | — |
| FR011 | NOT RUN | — |
| FR012 | NOT RUN | — |
| FR013 | NOT RUN | — |
| FR014 | NOT RUN | — |
| FR015 | NOT RUN | — |
| FR016 | NOT RUN | — |
| SC001 | NOT RUN | — |
| SC002 | NOT RUN | — |
| SC003 | NOT RUN | — |
| SC004 | NOT RUN | — |
| SC005 | NOT RUN | — |
| SC006 | NOT RUN | — |
| SC007 | NOT RUN | — |

Lint/format/typecheck/build, ảnh UI, auth/transport, fault/lifecycle: NOT RUN. Google credentials: NOT CHECKED. Chỉ đánh dấu task theo kết quả thực tế.

## Bằng chứng setup (T001)

Node v24.21.0. npm ci riêng tại root/API/Gateway/web đều exit 0. Audit hiện tại: root0, API35 (6 moderate/29 high), Gateway3 high, web6 high; không cập nhật dependency ngoài phạm vi. Đã đọc constitution, AGENTS và docs/en/conventions/frontend.md; không search. Đã kiểm tra ignore Git/Prettier/ESLint/Docker; package private không publish. Không có extension hook.

PostgreSQL dùng thử: pg_isready thành công; Redis PONG. Bảng migrations có đủ năm migration hiện tại gồm CreateInventory1791158400000; không chạy migration hoặc đổi schema. Chỉ dùng container kiểm chứng. Tất cả acceptance runtime vẫn NOT RUN.

## Triển khai nền tảng (T002–T007)

- Chỉ thêm trực tiếp antd6.6.5 và @ant-design/nextjs-registry1.3.0 vào web. npm ls exit0: cssinjs2.1.2, React/DOM19.3.0, Next16.3.6 được dedupe; không dependency trực tiếp khác hoặc patchv5.
- AntdRegistry bọc Redux provider/bootstrap hiện tại (vẫn một instance); ConfigProvider vi_VN và Ant App cung cấp context. HTTP production /login, /register, /dashboard đều200, có markup ant-app, lang=vi và style tag antd-cssinjs. Đây chỉ là bằng chứng HTML được phát ra; chưa chứng minh hydration, không nháy style hoặc UI thực tế.
- Selector form/label/input/button/dl cũ được giới hạn trong auth/dashboard, giữ các declaration; thêm spacing/focus Inventory tối thiểu. So sánh UI vẫn NOT RUN ở T008.
- Có type thuần theo backend và payload/identity readonly; chưa thêm service wrapper, hook, Redux slice, persistence hoặc route UI.
- Rewrite Next mặc định đến Gateway3004. Nạp cấu hình chấp nhận mặc định và HTTPS origin hợp lệ; từ chối path, credentials, protocol khác HTTP(S), origin sai và client base khác origin. Lỗi không in origin được cung cấp. Example dùng /api/v1 và GATEWAY_ORIGIN server-only. Không sửa .env web bị ignore hiện tại; file này vẫn chứa cấu hình cross-origin cũ, cần NEXT_PUBLIC_API_URL=/api/v1 khi chạy phần nền tảng này.
- Shared Axios kiểm tra actor/deadline/signal dành riêng cho Inventory trước/sau refresh và tại adapter dispatch, kể cả replay401. Auth request khác giữ policy hiện tại. InventoryRequestError phân biệt actor/access/deadline/abort cục bộ và nguồn refresh failure. Callback tùy chọn inventoryOnDispatch chỉ là metadata tại transport để ghi nhận dispatch thực tế, tránh Axios clone object operation; không đưa vào header/body/storage. Chưa triển khai owner/latch/publish outcome (T018–T024).

Driver thủ công tạm trong work/ bị ignore, dùng transport Axios giả lập (không phải browser hoặc ghi PostgreSQL): request hợp lệ1POST; abort trước refresh0POST/0refresh; abort trong preflight0POST/1refresh; abort trong refresh sau401 có1POST bị từ chối/0replay; refresh thất bại trướcPOST có0POST và nguồn before-dispatch; refresh thất bại sau401 có1POST và nguồn after-post-401; một refresh/replay401 có tổng2POST giữ cùng key/body serialize; các request độc lập cùng chờ chỉ1refresh; refresh trả admin khác chặn POST đầu/replay; clock vượt cutoff trong lúc chờ refresh chặn POST đầu/replay; cutoff trước dispatch0POST. Kết quả quan sát đúng kỳ vọng. Đây chỉ là bài kiểm chứng dispatch thủ công tạm, không thêm suite tự động được track hoặc thay thế acceptance. Chưa ghi movement thực tế.

## Kết quả chất lượng

Root npm run check và npm run build: exit0 với NEXT_PUBLIC_API_URL=/api/v1. Sau thay đổi cuối để sanitize lỗi cấu hình, đã chạy lại web lint/format/typecheck/build liên quan (kết quả cuối bên dưới). Web typecheck/build đầu tiên không override: exit1 vì .env bị ignore hiện tại dùng URL cross-origin không hỗ trợ; ghi nhận là từ chối cấu hình, không phải PASS. npm test: exit1, No tests found (0 file API khớp); thiếu coverage tự động, không phải PASS. Không thêm test tự động.

## Tình trạng checkpoint trước và tiến độ hiện tại

Lượt implement ban đầu tạm dừng ở T008 vì browser bị từ chối. Sau đó người dùng xác nhận T8-1 đến T8-10 đều PASS; đã đánh dấu T008 ở cả hai task list và ghi nhận đây là kiểm chứng thủ công do người dùng báo. Không có screenshot hoặc Network export gửi cho agent.

Một process Gateway khác đã giữ port3004 trong lần thử trước nên không dừng process đó. Sau đó GET health chỉ đọc qua rewrite frontend trả200, PostgreSQL/Redis ready. Runtime API/web và container dùng thử do lượt trước khởi động đã được dừng; không đổi dữ liệu chung. Không migration, schema hoặc source backend.

T009–T011 hiện đã triển khai và đánh dấu xong. Task phụ thuộc kế tiếp T012 chờ kiểm chứng US1 thủ công. Các acceptance khác, movement, fault/ledger và lifecycle vẫn NOT RUN. Không gọi converge.

Web lint/format/typecheck/build gần nhất PASS với NEXT_PUBLIC_API_URL=/api/v1; npm test báo No tests found, không tính PASS. Không thêm test tự động.

## Checklist browser T008 để người dùng kiểm chứng

Ngày 2026-10-06 đã thử lại browser được phép. Truy cập Google Chrome trả đúng lý do “Computer Use was not approved to use Google Chrome”; `createBrowserTab("iab", "http://localhost:3002/login")` trả “Browser is not available: iab”. Không thử điều khiển bằng browser/cách khác.

Một phép GET độc lập không qua browser (không phải browser PASS) xác nhận `http://localhost:3002/login` và `/register` trả HTML200, còn `http://localhost:3002/api/v1/health/ready` trả200, PostgreSQL/Redis sẵn sàng. Điều này chỉ xác nhận Next đang phục vụ frontend và rewrite `/api/v1` đi tới Gateway/API; chưa xác minh style, hydration, cookie browser hoặc header qua browser.

Vui lòng chạy checklist tại origin frontend, không dùng port Gateway3004:

| ID | URL và thao tác | Kết quả/bằng chứng mong đợi |
|---|---|---|
| T8-1 | Mở `http://localhost:3002/login` trong tab mới, mở DevTools Console và Network rồi hard reload. Tải trực tiếp `/register`, sau đó `/dashboard`. | Trang hiển thị, Ant style có ngay ở màn đầu; không lỗi hydration hoặc exception trong console. Login/register/dashboard giữ giao diện. Lưu screenshot đã lọc dữ liệu. `/dashboard` có thể chuyển về `/login` nếu chưa đăng nhập. |
| T8-2 | Từ tab frontend, mở `http://localhost:3002/api/v1/health/ready`. | Rewrite cùng origin Next tới Gateway/API và trả JSON200, PostgreSQL/Redis ready. Origin request vẫn là `localhost:3002`; frontend không phải `3004/login`. |
| T8-3 | Đăng ký tài khoản dùng thử tại `/register`, rồi đăng nhập ở `/login`. Trong Network kiểm tra `/api/v1/auth/register`, `/api/v1/auth/login`; trong Cookies kiểm tra cookie phản hồi `inventory_refresh`. | Đăng ký thành công và quay về login; login chuyển đến dashboard. Phản hồi login đặt `inventory_refresh` có HttpOnly, SameSite=Lax, Path `/api/v1/auth`; access token/user được lưu theo session auth hiện có. Không đưa thông tin đăng nhập, giá trị cookie hoặc token vào bằng chứng. |
| T8-4 | Khi đã đăng nhập, chạy trong DevTools Console: `fetch('/api/v1/auth/me',{headers:{Authorization:'Bearer '+JSON.parse(localStorage.getItem('inventory.auth.session')).accessToken}}).then(r=>console.log('me status',r.status))`. Xem request tương ứng trong Network. | `/api/v1/auth/me` trả200; request cùng origin gửi Bearer token và cookie áp dụng. Chỉ chia sẻ status/việc có header, tuyệt đối không chia sẻ token. |
| T8-5 | Kiểm tra refresh trên session dùng thử: trong Console chỉ thay access token đã lưu bằng giá trị có vẻ hết hạn (`const k='inventory.auth.session',s=JSON.parse(localStorage.getItem(k));s.accessToken='e30.eyJleHAiOjF9.x';localStorage.setItem(k,JSON.stringify(s));location.reload()`). Xem `/api/v1/auth/refresh`, sau đó mở Dashboard. | HttpOnly refresh cookie được gửi qua Next/Gateway; refresh trả200, cập nhật session và user vẫn đăng nhập. Giá trị này chỉ khiến frontend xem access token là hết hạn; không gửi request Inventory được bảo vệ. |
| T8-6 | Đăng xuất trên dashboard; kiểm tra Network và Cookies. | `/api/v1/auth/logout` hoàn tất, refresh cookie được xóa và app về login. |
| T8-7 | Nếu đã cấu hình Google OAuth, chọn “Tiếp tục với Google” tại `/login` và hoàn tất luồng đăng nhập/callback. Nếu thiếu, chỉ xác nhận có cấu hình cần thiết hay không; không ghi giá trị. | Luồng đã cấu hình quay lại `/api/v1/auth/google/callback`, chuyển tới `http://localhost:3002/auth/callback`, refresh session và tới dashboard. Nếu chưa cấu hình, ghi Google “unavailable: credentials not configured” theo cho phép của T008. |
| T8-8 | Trong môi trường local dùng thử, gửi 11 lần login sai trong một phút từ frontend (policy cho phép10 lần/phút). Kiểm tra response lần11 trong Network. | Gateway trả429 `RATE_LIMIT_EXCEEDED`, `Retry-After` đọc được tại frontend origin và body đọc được. Chờ cửa sổ giới hạn ngắn hết trước các bước login tiếp. |
| T8-9 | Nếu có môi trường API/Gateway fault dùng thử riêng, gọi `/api/v1/auth/me` qua `localhost:3002` với Bearer hợp lệ trong lúc API upstream không chạy; bật API lại ngay sau đó. | Status/body Gateway502 `UPSTREAM_UNAVAILABLE` và Retry-After nếu có đọc được qua rewrite cùng origin. Không dừng API dùng chung; nếu không có môi trường riêng thì ghi BLOCKED và lý do. |
| T8-10 | Nếu có PostgreSQL fault injection dùng thử, giữ row lock tồn kho tới statement timeout API và gửi thủ công một request Inventory trực tiếp tới API port3001. Xem response trong DevTools Network; sau đó nhả lock và đối chiếu không có movement commit. | API trực tiếp trả503 `INVENTORY_BUSY` kèm `Retry-After: 1` đọc được; release/rollback không để movement. Qua Gateway port3004, proxy timeout 5 giây có thể trả502 `UPSTREAM_UNAVAILABLE`; ghi đúng nguồn/status quan sát được, không gọi đó là API503. Nếu không có môi trường fault dùng thử an toàn, ghi unavailable, không dùng dữ liệu chung. |

Gửi kết quả dạng `T8-1 PASS`, `T8-2 PASS`, v.v.; trường hợp không hỗ trợ ghi `BLOCKED` và lý do ngắn. Với screenshot/Network, xóa email, cookie, Authorization value, token và tham số Google callback. Sau đó người dùng xác nhận tất cả mục checklist đều PASS; kết quả được ghi ở mục T008 phía trên.

## Kết quả kiểm chứng thủ công T008 (2026-10-06)

Người dùng xác nhận tất cả mục checklist browser áp dụng T8-1 đến T8-10 đều PASS. Đây là kết quả kiểm chứng thủ công do người dùng báo; không có screenshot hoặc Network export được gửi cho agent. Đã đánh dấu hoàn tất T008 ở cả hai bản ngôn ngữ dựa trên xác nhận đó. Không ghi credentials, token, cookie hoặc callback value.

## Triển khai US1 (T009–T011)

Đã thêm route `/inventory` và trang có sidebar trái/content phải, chỉ admin được vào. Trang chờ Redux khởi tạo session, chuyển signed-out tới `/login`, từ chối customer mà không gọi dữ liệu Inventory được bảo vệ, hiển thị lời nhắc đối chiếu khi vào, có điều hướng Dashboard/đăng xuất. Dashboard chỉ thêm nút Inventory cho admin; customer không thấy mục này. Table có tên/SKU/trạng thái/tồn/nút Inventory mở drawer, pagination page/limit/total phía server với size10/20/50/100, đổi size về trang1, loading/empty/error/retry, abort request và chặn ghi đè response stale theo query identity. Không search hoặc sorter. Nút dòng hiện mở drawer nhận diện sản phẩm và số tồn trong danh sách; GET tồn mới nhất/lịch sử độc lập và drawer hoàn chỉnh thuộc T013–T014.

Web lint, format check, typecheck exit0 sau phần code này. Đánh dấu T009–T011 xong ở cả hai task list. Agent chưa kiểm chứng browser bằng session user hoặc pagination 45 sản phẩm. T012 chờ kiểm chứng US1 thủ công.

### Yêu cầu kiểm chứng thủ công T012

### Agent kiểm tra lại browser (2026-10-06)

Chrome qua Computer Use native hiện truy cập được. Lần đầu frontend trả ERR_CONNECTION_REFUSED; đã khởi động web với NEXT_PUBLIC_API_URL=/api/v1, API/Gateway và container dùng thử inventory-002-verify-pg/redis hiện có. Không ghi database, seed, migration hoặc POST movement.

T12-1 PARTIAL / BLOCKED: mở trực tiếp /inventory khi chưa đăng nhập hiển thị trạng thái chuyển hướng rồi về /login. DevTools Network bật Keep log và lọc /api/v1/inventory ghi 0 / 35 requests. Chưa kiểm chứng customer và bootstrap có session: chưa có session browser admin/customer dùng thử hoặc mật khẩu đăng nhập fixture đã biết.

T12-2 đến T12-7 BLOCKED: cần session admin dùng thử để kiểm chứng. SQL chỉ đọc xác nhận database dùng thử có 18 sản phẩm, chưa đủ 45 để kiểm tra 20/20/5. Không chụp screenshot; không ghi giá trị credentials/token/cookie. Giữ T012 chưa đánh dấu; chưa bắt đầu T013.

Dùng database dùng thử có ít nhất45 sản phẩm; không seed database chung. Tại `http://localhost:3002/inventory`, đăng xuất rồi mở trực tiếp; tiếp theo đăng nhập customer và mở trực tiếp; cuối cùng đăng nhập admin. Kỳ vọng: trang chờ/chuyển hướng và từ chối customer không gọi GET Inventory được bảo vệ; admin thấy sidebar trái/content phải, lời nhắc đối chiếu và GET page/limit/total qua origin frontend. Lưu screenshot và Network request đã lọc dữ liệu.

Với45 sản phẩm, kiểm tra mặc định20 cho các trang20/20/5, tổng45. Thử size10/20/50/100, xác nhận đổi size về trang1, tổng lấy từ server, sản phẩm chưa nhập hiển thị0, sản phẩm inactive vẫn xuất hiện, trang ngoài phạm vi vẫn rỗng nhưng không đổi total. Mở nút Inventory của một dòng và kiểm tra đúng tên/SKU/status/số tồn đã chọn. Bật DevTools Slow 3G rồi đổi trang nhanh; response trang cũ không được ghi đè trang đang chọn. Bật DevTools Offline trong lúc đọc: phải hiện lỗi, không suy diễn thành catalog rỗng/tồn0; retry sau khi bật Online phải tải lại được. Xác nhận không có search/sort và Network không có POST movement. Gửi kết quả `T12-1 PASS` đến `T12-7 PASS`, kèm lỗi và bằng chứng đã lọc; chờ kết quả rồi mới đánh dấu T012.

## Chuẩn bị fixture và thử browser T012 (2026-10-06)

Tiếp tục speckit-implement từ T012, giữ T001–T011. Prerequisite xác nhận đúng feature; checklist requirements16/16 PASS; không có extensions.yml hoặc hook trước/sau. Đã đọc plan/data-model/contracts/research/quickstart/constitution/convention frontend và kiểm tra ignore hiện có. Không thêm test tự động, search, migration, thay đổi backend hoặc converge.

Xác nhận cách ly trước khi ghi: frontend Next3002 dùng rewrite /api/v1 đến Gateway3004; process cha Gateway chạy work/inventory-002/runtime.cjs, upstream API3001. Process cha API dùng cùng cấu hình kiểm chứng; socket API thực tế kết nối PG127.0.0.1:55534 và Redis127.0.0.1:56380. Container inventory-002-verify-pg/redis dùng các port loopback này, database inventory_verify. /api/v1/health/ready qua frontend trả200, cả hai dependency true. Không sửa database dùng chung ở55433/55432.

Chuẩn bị fixture được cho phép: lệnh admin:create hiện có tạo admin dùng thử mới; /auth/register qua frontend tạo customer dùng thử mới. seed:products --count=30 hiện có thêm27 sản phẩm DEMO còn thiếu, tổng18→45. Cuối cùng43 ACTIVE,2 INACTIVE; giữ sản phẩm inactive hiện có. Credentials được sinh riêng, chỉ lưu ở file fixture bị ignore với mode0600; không sao chép credentials/token vào tài liệu được track. Không POST movement hoặc ghi ledger.

Bằng chứng HTTP thực tế bổ sung qua frontend (không phải browser acceptance): admin login thành công; GET inventory trang1/2/3 limit20 trả200 với20/20/5 dòng,tổng45. Trang999 limit20 trả0 dòng,tổng45. Trang1 size10/50/100 trả10/45/45 dòng,tổng45. Size50/100 có cả hai inactive và35 sản phẩm tồn0. Chưa chứng minh UI reset size, race, drawer hoặc session gate trong browser.

Chrome Computer Use nhiều lần ngắt thao tác với thông báo “The user changed '/Applications/Google Chrome.app'. Re-query the latest state with get_app_state before sending more actions.” Quan sát mới cho thấy chuyển giữa Inventory và cửa sổ Chrome khác/Picture in Picture. Chọn lại cửa sổ Inventory và làm mới state vẫn chưa hoàn tất đăng nhập fixture. Không dùng cơ chế điều khiển browser khác; chưa chụp screenshot vì chưa đến UI acceptance. Đã gửi câu hỏi bất đồng bộ đề nghị giữ tab Inventory ổn định; chưa nhận trả lời trong lần kiểm chứng này.

T12-1 vẫn PARTIAL/BLOCKED (đã quan sát signed-out chuyển login/0 request Inventory ở lượt trước; chưa kiểm chứng customer/bootstrap đang chờ). T12-2–T12-7 vẫn BLOCKED ở bước Chrome, dù fixture và HTTP đã sẵn sàng. Late403, Slow3G/response stale, Offline/retry, drawer, không search/sort và không movement qua browser vẫn chưa kiểm chứng. Giữ T012 chưa đánh dấu ở cả hai task list; chưa bắt đầu T013 vì phụ thuộc T012. Runtime dùng thử vẫn sẵn sàng để tiếp tục.

## Tiếp tục UI T012 bị gián đoạn (2026-10-06)

Người dùng yêu cầu giữ fixture45 sản phẩm/kết quả HTTP, chỉ dùng frontend3002 và dừng ngay nếu browser lại gián đoạn. Prerequisite xác nhận /Users/asim/Desktop/inventory-api/specs/003-frontend-inventory; requirements16/16 PASS; không có extensions.yml (bỏ qua hook trước/sau). Giữ context plan/task và kiểm tra ignore của lượt implement trước. Process lắng nghe API3001/frontend3002/Gateway3004 không đổi. Không tạo lại fixture hoặc ghi database.

Chrome ban đầu chọn Picture in Picture. Chọn Inventory Auth qua menu Window; quan sát frontend http://localhost:3002/dashboard có session customer, không có mục Inventory admin. Network có /api/v1/auth/login200 trước đó; đây là session có sẵn được quan sát, không phải đăng nhập fixture do agent hoàn tất trong lượt này. Bắt đầu xóa/lọc Network và điều hướng cùng tab trực tiếp /inventory, công cụ trả “The user changed '/Applications/Google Chrome.app'. Re-query the latest state with get_app_state before sending more actions.” Dừng mọi thao tác browser ngay theo yêu cầu rõ ràng của người dùng, không retry/lấy lại state sau gián đoạn. Thông báo chưa xác định nguyên nhân là thao tác người dùng hay cơ chế theo dõi cửa sổ.

Không có mục T12 mới PASS. Chưa kiểm chứng customer mở trực tiếp bị từ chối/0 GET, login fixture admin/customer, session đang chờ, late403, layout/table admin, UI20/20/5,tổng45,size10/20/50/100/reset,out-of-range/zero/inactive, drawer đúng sản phẩm, Slow3G/response stale, Offline/error/retry, không search/sort/không movement trong Network ở lượt này. Giữ kết quả signed-out một phần và HTTP trước đó; không đổi HTTP thành UI PASS. Không chụp screenshot. Giữ T012 chưa đánh dấu ở cả hai task list; chưa bắt đầu T013; không thêm test/search/converge.

## Browser không khả dụng khi tiếp tục T012 (2026-10-06)

Đã chạy prerequisite của speckit-implement và đọc context triển khai. Checklist requirements:16 mục,16 hoàn tất,0 chưa hoàn tất (PASS). Không có extensions.yml; bỏ qua hook trước/sau. Giữ nguyên fixture và bằng chứng HTTP, không truy cập database, tạo lại fixture hoặc đổi runtime.

Inventory Computer Use báo Google Chrome isRunning=false và browsers=[]. Thử mở một tab frontend bằng createBrowserTab("chrome", "http://localhost:3002", {sessionName:"🔎 T012 UI"}); công cụ trả đúng “Browser is not available: chrome”. Dừng thao tác browser ngay theo yêu cầu dừng khi gián đoạn; không dùng cách điều khiển khác hoặc thử khởi động lại browser. Đây là lỗi browser không khả dụng, không phải bằng chứng người dùng thao tác hay frontend lỗi.

Lượt này chưa hoàn tất login hoặc kiểm tra UI; không có screenshot/bằng chứng Network mới. Vẫn chưa kiểm chứng: login admin/customer, customer bị từ chối qua route trực tiếp/0 GET được bảo vệ, session đang chờ, late403, layout/table admin,20/20/5 tổng45, size/reset/out-of-range/zero/inactive, drawer đúng sản phẩm, đọc chậm/response stale, lỗi/retry và không có search/sort/request movement. Giữ nguyên signed-out một phần và HTTP trước đó, không coi là UI PASS. T012 chưa đánh dấu ở cả hai ngôn ngữ; chưa bắt đầu T013 và các task phụ thuộc. Không converge.

## Thử lại T012: element browser hết hiệu lực (2026-10-06)

Người dùng cho phép thử lại. Computer Use báo Chrome đang chạy; kết nối Chrome native thấy một New Tab. Điều hướng cùng tab đến http://localhost:3002/inventory, quan sát ERR_CONNECTION_REFUSED. Đã chạy lệnh khởi động API/Gateway dùng thử hiện có và frontend production với NEXT_PUBLIC_API_URL=/api/v1; không seed, migration, sửa fixture hay database. Thử Reload bằng element107 đã quan sát; công cụ trả “Computer Use server error -10005: The element ID is no longer valid. Try to get the on-screen content again and see if that resolves the issue.” Dừng browser, không lấy lại state/thử tiếp theo điều kiện dừng khi gián đoạn. Đã thử khởi động runtime, chưa xác nhận healthy ở lượt này.

Không có UI PASS, screenshot hoặc bằng chứng Network mới. Các tiêu chí T012 còn thiếu đã liệt kê phía trên vẫn chưa kiểm chứng; giữ fixture45 sản phẩm và kết quả HTTP trước đó, không đổi thành UI PASS. T012 chưa đánh dấu; chưa bắt đầu T013; không converge. Không có extension hook.

## Thử lại T012 một lần bị gián đoạn (2026-10-06)

Người dùng cho phép thử lại một lần. AX Chrome mới cho thấy cùng một tab frontend tại localhost:3002/inventory, hiển thị “Không có quyền truy cập Chỉ quản trị viên được xem tồn kho.” Chỉ xác nhận màn hình từ chối đang hiển thị; chưa xác nhận danh tính/role session hoặc 0 GET được bảo vệ. Đọc credentials fixture bị ignore hiện có để chuẩn bị login; không tạo lại fixture hoặc ghi dữ liệu. Thử điều hướng cùng tab đến /dashboard để đổi session; công cụ trả “The user changed '/Applications/Google Chrome.app'. Re-query the latest state with `get_app_state` before sending more actions.” Dừng ngay, không thao tác browser tiếp. Không chụp screenshot/Network; chưa hoàn tất login fixture hoặc có acceptance PASS đầy đủ mới. Các phần T012 còn thiếu giữ nguyên; HTTP vẫn chỉ là HTTP, giữ fixture45. T012 chưa đánh dấu; chưa bắt đầu T013; không converge. Không có extension hook.

## Thử lại T012: runtime khác fixture đã giữ (2026-10-06)

Quan sát Chrome mới thấy cùng tab frontend /inventory có layout admin, lời nhắc, các cột bảng tồn kho và20 dòng/20 mỗi trang. Tổng hiển thị200, không phải fixture45 đã giữ; chưa ghi pagination acceptance PASS. lsof chỉ đọc: API35249 ở3001 kết nối Redis [::1]:6379, cwd apps/api; Gateway35232 ở3004 cwd apps/gateway; frontend35207 ở3002. Redis dùng thử dự kiến ở56380. Chưa xác nhận danh tính database hiện tại. Không ghi dữ liệu/tạo lại fixture. Đã hỏi quyền thay stack dev hiện tại bằng runtime dùng thử hiện có; đang chờ trả lời. T012 chưa đánh dấu; chưa bắt đầu T013; không converge.

## Bằng chứng UI T012 trên catalog200 được người dùng cho phép (2026-10-06)

Người dùng yêu cầu giữ catalog200 hiện tại để kiểm chứng UI; không đổi stack, seed hoặc ghi dữ liệu. Yêu cầu xin đổi runtime trước đó không còn áp dụng. Giữ fixture45 và bằng chứng HTTP cũ; UI200 không chứng minh UI45 với20/20/5.

Quan sát Chrome native trên cùng tab frontend localhost:3002: sidebar/content admin, lời nhắc, cột tên/SKU/status/tồn/thao tác; trang1/2/10 mỗi trang20 dòng,tổng200; nút Next trang cuối bị vô hiệu hóa. Đổi size20 ở trang10 sang10: về trang1 với10 dòng, sản phẩm đầu DEMO-0134; size50 và100 hiển thị50 và100 dòng dữ liệu. Có lựa chọn10/20/50/100. Nhiều dòng hiển thị tồn0; không thấy search/sort. Chỉ xác nhận các trang lấy mẫu, chưa đối chiếu đủ10 trang hoặc dòng trùng/thiếu.

Đăng xuất về /login. Sau khi người dùng nói continue, submit form login đã điền sẵn; quan sát /dashboard với role admin, trạng thái đã xác thực và nút Inventory. Không ghi credentials. Theo nút Inventory: trang1/20,tổng200. Mở drawer dòng đầu: Travel Ethernet Adapter / DEMO-0134 / ACTIVE / tồn10 khớp bảng. Screenshot xuất trong hội thoại có drawer/layout admin, không có credentials/token; chưa lưu file ảnh.

Đã hỏi bất đồng bộ thông tin login customer có sẵn trên stack hiện tại; chưa nhận trước gián đoạn. Chuẩn bị kiểm tra Network, lấy AX mới rồi thử đóng drawer; công cụ trả “Computer Use server error -10005: 637 is an invalid element ID”. Dừng browser theo điều kiện của người dùng. Chưa có Network capture mới.

T012 vẫn PARTIAL/chưa đánh dấu. Còn thiếu login customer/từ chối/0 GET được bảo vệ, Network khi session đang chờ, late403, inactive, UI ngoài phạm vi/rỗng, đọc chậm/response stale, lỗi/retry, bằng chứng Network transport/page-limit-total/không movement và thời gian SC001. Login/layout admin, pagination lấy mẫu/reset size, tồn0 và drawer đúng sản phẩm có quan sát UI trực tiếp; không đổi HTTP thành UI PASS. Chưa bắt đầu T013; không converge. Không có extension hook.

## Tiếp tục T012 có mục tiêu: môi trường và bằng chứng (2026-10-06)

Prerequisite speckit-implement đúng feature; requirements16/16 PASS. Giữ context/constitution/conventions/ignore đã đọc; xác nhận git/private packages. Không có extensions.yml, bỏ qua hook trước/sau. Không sửa source, thêm test, seed, migration hoặc converge. Giữ bằng chứng login admin/pagination/drawer DEV200, không chạy lại acceptance đó.

Môi trường:
- DEV: localhost:3002, API3001/Gateway3004, catalog200. Chỉ navigation/đọc Network bình thường, không fault hoặc sửa dữ liệu.
- DÙNG THỬ: bản sao source web không đổi /private/tmp/inventory-t012-web (owner inventory khớp từng byte), frontend3102 → proxy tạm3105 → Gateway thật3104 → API3101 → PG inventory_verify55534/Redis56380 hiện có. Tái dùng fixture45/tài khoản cũ. Driver bị ignore work/inventory-003/ui-runtime.cjs và mode ui-fault-mode.json. Proxy chỉ tác động GET Inventory;403/502 là fixture giả lập UI/transport, không phải thu hồi quyền/lỗi upstream thật. Delay giữ response Gateway thật. Không POST Inventory/tạo dữ liệu. Bind ban đầu bị sandbox EPERM; chạy lại được phê duyệt và stack đã khởi động.

| Tiêu chí | Kết quả/môi trường/bằng chứng |
|---|---|
| Network stock | DEV: GET http://localhost:3002/api/v1/inventory?page=2&limit=20, cùng origin/remote3002, có Bearer (không ghi giá trị), initiator api.ts chung.304 Not Modified và cached Preview items/page2/limit20/total200. Đây là kiểm tra Network riêng, không chạy lại acceptance pagination. |
| Customer/gate | DÙNG THỬ: login customer fixture hiện có về dashboard role customer/đã xác thực, không có mục Inventory. Xóa Network/lọc /api/v1/inventory rồi mở trực tiếp /inventory: từ chối quyền;0/10 requests. Screenshot trong hội thoại có màn hình từ chối/Network rỗng. PASS trường hợp customer dùng thử. |
| GET403 muộn | DÙNG THỬ proxy403 sau khi catalog admin đã đọc thành công: GET mới page2/limit20 trả403 Forbidden; UI bỏ bảng, hiện lỗi/Thử lại. Không publish dữ liệu bảng từ request bị từ chối. Proxy normal + Retry: GET cùng page2/limit20 trả200, bảng tổng45 phục hồi. PASS xử lý response403 giả lập; chưa kiểm tra thu hồi role thật/mất quyền khi drawer mở. Login admin dùng thử chỉ để thiết lập session fault. |
| Lỗi/retry | DÙNG THỬ proxy502: GET page3/limit20 trả502; UI lỗi/Thử lại, không suy diễn catalog rỗng/tồn0. Proxy normal + Retry GET cùng page3/limit20 trả200/phục hồi bảng. PASS UI502 giả lập, không phải API outage thật. |
| Inactive/zero | DÙNG THỬ: quan sát Renamed current product /VERIFY-ISSUE-RENAMED /INACTIVE /0; sau đó VERIFY-INACTIVE /INACTIVE /0. Dữ liệu fixture thật hiện có, không chỉnh sửa. |
| Chậm/stale | DÙNG THỬ: giữ response trang2 thật15s; quan sát pending và304 sau15.03s. Các lần đổi trang trong lúc pending chưa chứng minh GET trang mới chồng lấp/request cũ canceled. Đã đọc AX lại/dùng ID mới, cả sau báo window-change; không lặp ID đã biết sai. Stale CHƯA KIỂM CHỨNG; đã thấy request chậm, phần UI loading chưa đủ. |

Khôi phục browser window-change bằng state mới/chọn tab Inventory; không thao tác tab không liên quan. Lần state cuối không có nội dung dùng được; không suy ra PASS. Screenshot là artifact hội thoại, chưa lưu file. Không ghi credentials/header values vào bằng chứng track. Proxy đã về normal; để stack dùng thử chạy cho kiểm chứng thủ công. Runtime DEV không đổi. Không chạy quality test mới vì source không đổi.

T012 chưa đánh dấu ở cả hai task list. Còn thiếu Network khi bootstrap đang chờ, UI loading chậm/response stale chồng lấp, UI thực sự ngoài phạm vi và catalog rỗng. Giữ pagination DEV200 lấy mẫu được người dùng chấp nhận; không đổi HTTP45 thành UI PASS. Chưa bắt đầu T013.

### Cách kiểm chứng thủ công phần T012 còn thiếu

Dùng http://localhost:3102, không fault DEV3002. Network bật ghi/Disable cache/Keep log, lọc /api/v1/inventory. Che Authorization/cookie/login payload trước khi chia sẻ. Credentials dùng thử hiện có ở file bị ignore mode0600 work/inventory-003/browser-fixture.json, không đưa vào bằng chứng.

1. Bootstrap: xóa Network/đăng xuất, mở trực tiếp /inventory: chuyển login/0 Inventory GET. Với session customer dùng thử, bật Slow3G/reload; khi role chưa xác định phải0GET/không bảng bảo vệ. Lưu timeline/screenshot; quá nhanh không thấy thì ghi chưa kiểm chứng, không PASS. Customer denial0GET đã đạt ở trên.
2. Chậm/stale: ở trang1 bình thường, đổi work/inventory-003/ui-fault-mode.json thành {"mode":"stale"}; chọn trang2 (giữ15s), rồi trang1/3 khi Network còn pending. Kỳ vọng loading; request2 canceled hoặc completion bị bỏ qua, GET/trang mới giữ nguyên sau15s. Ghi timing của hai request, trang/SKU đầu trước/sau. Nếu overlay loading chặn đổi trang, ghi giới hạn/lỗi, không PASS. Đổi lại {"mode":"normal"}.
3. Rỗng: mode {"mode":"empty"} trả items[]/total0 giả lập, không sửa database. Tạo read mới: UI thông báo rỗng/tổng0, không lỗi đọc hoặc tạo dòng tồn giả. Ghi display-only fixture; trả normal rồi đọc lại.
4. Ngoài phạm vi thật: UI không có control trang999; không xóa DEV. Dùng response override/proxy dùng thử làm trang đang chọn lớn hơn ceil(total/limit), kiểm tra UI rỗng nhưng giữ total server. Ghi page/limit/total/items[]. Không coi HTTP trang999 cũ là UI. Mode out-of-range hiện có chỉ trảitems[]/total45, chưa đủ chứng minh trang chọn ngoài phạm vi.

Không cần chạy lại customer/Network/403/502 retry đã đạt nếu source không đổi. Không tự converge.

## Hoàn tất T012: bốn tiêu chí còn thiếu (2026-10-06)

Đã kiểm tra prerequisite/context/ignore; requirements16/16 PASS; không có hook. Cùng stack dùng thử3102→3105→3104→3101, PG55534 inventory_verify/Redis56380; tái dùng fixture45. Không tác động DEV3002/catalog200; giữ bằng chứng UI200 đã đạt. T012 không sửa frontend source, thêm test/search/converge. Chỉ mở rộng proxy bị ignore trong work/: giữ refresh/read, log thời gian start/close đã lọc, empty total0/out-of-range total1. Screenshot xuất trong hội thoại, không ghi credentials vào evidence.

- Bootstrap PASS: chỉ thay access token lưu trong browser dùng thử bằng fixture hết hạn rồi reload /inventory; giữ response refresh thật. Spinner/AX “Đang kiểm tra phiên đăng nhập”, Network lọc0/10 requests/không catalog. Log refresh start1791277919951,close1791277948746 (28.795s); Inventory GET1791277948890, sau refresh144ms. Proxy normal; có screenshot chờ/0GET.
- Loading/race page PASS: giữ response thật page2/limit20; thấy spinner overlay/không dòng cũ/Network pending. Overlay Ant Spin che click chuột; dùng ShiftTab chọn page3/Enter. GET cũ canceled sau21.326s,completed:false; GET page3 hoàn tất35ms. Screenshot canceled/page3 được chọn/5 dòng/SKU đầu DEMO-0012/tổng45. Trả normal, dữ liệu page3 giữ nguyên.
- Race size PASS: page2/20 pending, Tab đến size/chọn50. Request cũ canceled sau5.424s; GET mới page1/limit50 hoàn tất35ms,45 dòng/tổng45/size50. Trả normal, response cũ không ghi đè. Một setup chậm trước đó vượt timeout rewrite Next30s/trả500; ghi setup chưa đạt, không tính stale proof. Lượt chồng lấp sau là bằng chứng PASS.
- Race session PASS: admin page2 pending, đăng xuất/request cũ canceled. Thiết lập session customer dùng thử hiện có; quay lại /inventory sau trả normal: denied/không catalog. Response admin cũ không publish lại. Login chỉ để setup race, không chạy lại acceptance admin login.
- Catalog rỗng PASS (proxy display-only):200 {items:[],page:2,limit:20,total:0}, xác nhận Preview. UI “Không có sản phẩm trong trang này”,không lỗi/không dòng tồn. Ant Table ẩn pagination khi total0 (không nhãn total hiển thị), không tạo tổng giả. Có screenshot.
- Ngoài phạm vi PASS (proxy display-only): chọn page3 từ tổng45 thật; proxy200 {items:[],page:3,limit:20,total:1},page3>ceil(1/20). UI empty/0 dòng/“Tổng1 sản phẩm”; owner không tự fetch thay thế. Pagination Ant hiển thị page1 bị clamp và prev/next disabled, request vẫn page3; giữ total server1. Có Preview/screenshot. Đã trả proxy normal.

Kết hợp bằng chứng signed-out/customer/admin/late403/lỗi-retry/Network/inactive/zero trước đó và pagination DEV200 được người dùng cho phép, US1/AC1–4/SC001 hoàn tất trong T012. HTTP45 vẫn chỉ HTTP; không nói đã chạy lại UI45 với20/20/5. Đánh dấu[X] T012 ở hai task list, tiếp tục T013. Feature tổng thể chưa hoàn tất.

## T013–T015: drawer và kiểm chứng (2026-10-06)

T013/T014: Ant Drawer có stock GET `{inventory:StockItem}` và history GET phân trang riêng; loading/lỗi/retry độc lập. Query theo actor/sản phẩm/attempt/page/size; cleanup hủy request cũ. Đóng/mở reset history1/20, giữ trang/size bảng sản phẩm. Hiển thị loại, số lượng, tồn trước/sau, actorUUID, lý do, ISO UTC; chưa có form/POST/edit/delete. Web lint/typecheck đạt sau sửa envelope stock.

Môi trường T015: frontend dùng thử3102→proxy3105→Gateway3104→API3101→PG55534 inventory_verify/Redis56380; không sửa dev. Giữ45 sản phẩm. Fixture cần thiết: VERIFY-MIXED đang42 facts thêm3 receipt1 qua API dùng thử thành45, SQL ledger24=balance24; không tạo lại catalog.

- Mixed thật: history20/20/5 tại page1/2/3,total45,GET200,stock24. Bảng sản phẩm size50/history20 độc lập; history size50 hiển thị45 dòng. Từ bảng page2/size20 đóng/mở Mixed: bảng giữ2/20, history về1/20. Có ảnh/AX/Network trong hội thoại.
- DEMO-0003 thật: stock0, “Chưa có lịch sử tồn kho trong trang này”, không lỗi. VERIFY-ISSUE-RENAMED thật: INACTIVE,tên hiện tại Renamed current product,stock0,3 facts; UTC2026-10-06T03:53:04.715Z,actorUUID/lý do/tồn trước-sau hiển thị.
- Proxy502 chỉ history: stock24 vẫn sẵn sàng, history lỗi/retry; normal+retry trả45. Proxy502 chỉ stock: history45 vẫn hiện, stock lỗi; normal+retry trả24. Retry GET riêng từng phần, không phải outage thật.
- Proxy404 chỉ đọc sản phẩm: stock/history lỗi riêng với retry, không giả lập tồn0 hoặc history rỗng. Đây là fixture hiển thị, không xóa sản phẩm.
- Giữ response stock/history thật của DEMO-0003, thấy loading; đóng khi pending hủy cả hai(completed:false),stock11.661s/history5.678s. Normal rồi mở Renamed:stock0/history3/identity đúng và giữ nguyên ở trạng thái/ảnh sau; response cũ không ghi đè. Log start1791279288265/1791279294248,cancel1791279299926; GET selection mới1791279314128/129 hoàn tất43/50ms.

Proxy normal sau mỗi fault và hiện vẫn normal. Khi AX còn animation đóng, đọc full state và dùng locator mới. Không thêm test/search/converge. US2/AC1–4,SC002 history45 đã đạt; T015 đánh dấu ở hai bản tasks, tiếp theo T016. Ảnh nằm trong hội thoại, chưa lưu file riêng.

## T016–T019 triển khai; T020 bị gián đoạn (2026-10-06)

T016: Ant Form mặc địnhRECEIPT, quantity/reason trống; enum chính xác, số nguyên1..1.000.000, reason trim rồi đếm1..500 Unicode codepoints, không maxlength UTF16. Nonterminal khóaform; submit cần stockready nhưng không cần historyready; INACTIVE được phép.
T017: Ant App confirm close/mask/Escape/chuyển sản phẩm/dashboard/logout/login. Cancel giữ nguyên; confirm kiểm tra lại identity, abort signal rồi đánh dấu discarded trước xóa ref/hành động. beforeunload mặc định chỉ khi nonterminal; không hứa rollback/cancel backend.
T018: ref latch đồng bộ, actor/product/body/key khóa, một UUID cho thao tác mới; dispatch thật đầu tiên đặt hạn24h, timeout15s, shared Axios metadata actor/deadline/signal. Theo dõi attempt/dispatch; callback cũ/discarded bỏ qua, finally giải phóng sending đúngattempt kể cả mất quyền. Không POST trong effect/timer.
T019: kiểm tra201 khớp thao tác trước terminal; thành công resetquantity/reason giữtype, refresh bảng/stock/historypage1 độc lập. Stock409 nhận biết resetdraft/reloadstock;400 INVALID_INPUT khi chưa uncertainty giữdraft/field errors; PRODUCT_NOT_FOUND404 terminal. Lỗi chưa rõ giữkhóa/key. Kết quả riêng trong bộ nhớ, chỉ reset/GET khi admin gốc và selection đúng. Recovery/auth restore US4 chưa triển khai.

Web lint/typecheck exit0 sau sửa cuối. Typecheck T019 lần đầu lỗi inference name Form.setFields; sửa tuple literal typed, chạy lại typecheck/lint đạt. Không thêm test. T016–T019 đánh dấu hai bản tasks là task triển khai; acceptance UI T020 vẫn CHƯA KIỂM CHỨNG. Không coi build/typecheck là UI PASS.

T020: lần đọc form trả cửa sổ Outlook thay vì Inventory; đã dừng UI theo yêu cầu, không thao tác mail/không gửi movement qua form. Proxy xác nhậnnormal; stack dùng thử còn chạy, dev không sửa, bằng chứng cũ giữ nguyên. T020 để trống; T021 trở đi chưa bắt đầu vì checkpoint tuần tự.

Còn thiếu T020; kiểm chứng thủ công tại3102/PG55534/Redis56380:
1. DEMO-0003 dùng thử tồn0: receipt10→issue3→issue8 bị từ chối; kỳ vọng10→7→reject8, chỉ2facts mới/ledger7, đối chiếuSQL. Sau đó exact-stock issue7; thử receipt/issue sản phẩm INACTIVE dùng thử.
2. Form trống/0/âm/thập phân/chuỗi/1/1e6/1e6+1; reason trim,500codepoints cóemoji đạt,501 bị chặn. Ghi validation/sốPOST, không lấytypecheck làm bằng chứng.
3. Doubleclick chỉ1POST/key; thao tác mới UUIDkhác. Che key/token và nội dung nhạy cảm khi lưu.
4. Proxy chỉhistory502 stocknormal vẫn cho submit; chỉstock502 phải chặn submit mới; trảnormal sau từng lần.
5. Movement thành công rồi refreshGETlỗi: terminal vẫn giữ, retry chỉGET. Giữ responsewrite để thử cancel/confirm close/mask/Escape/switch/menu/dashboard/logout/login khi sending/uncertain. Chỉ fault môi trường dùng thử và trảnormal.

Đây là hướng dẫn chưa thực hiện, không phải PASS. Không search/test/converge; không có extensionhooks.

## T020 tiếp tục: bằng chứng UI một phần, browser gián đoạn (2026-10-06)

Prerequisite feature003/checklist16/16 PASS; đã đọc context/constitution/conventions/ignore, không hook. Frontend source không đổi; không chạy lại T001–T019/quality. Stack dùng thử3102→3105→3104→3101/PG55534 inventory_verify/Redis56380,catalog45 giữ nguyên; dev không tác động. Không fixture/product mới/test/search/converge.

Đã xác nhận tab localhost:3102/inventory và DEMO-0003 tồn0. Một thông báo Chrome thay đổi được phục hồi bằng state mới/locator mới. setValue InputNumber không nhập10; form chặn quantitytrống, dùng bàn phím nhập10 đúng rồi gửi.

Bằng chứng đã đạt:
- Doubleclick receipt10 chỉ1POST(time1791279879860),stock10,quantity/reason reset, reasontrim hiển thị “T020 receipt ten”. Issue3(time1791279898541)→stock7;issue8(time1791279908791) trả409 INSUFFICIENT_STOCK thật (Network Response/ảnh),stock7 không đổi, resetqty/reason giữISSUE. SQL ngay sau:2facts/ledger7/balance7. Ảnh trong hội thoại.
- Exact-stock issue7→stock0. Trốngquantity/reason,quantity0,-1,1.5,1.000.001,reason501emoji bị validation; khôngPOST từ exact-stock tới lần maxhợp lệ. Nhập “abc” InputNumber trả về giá trị cũ1.000.001 vẫninvalid, không gửi stringpayload.
- Receipt1.000.000 với đúng500emoji được API thật chấp nhận→stock1.000.000; không chặn/truncate UTF16. Trước đó501emoji bị chặn khiquantity1.
- Proxy chỉGETmovements502: stockready1.000.000/historylỗi;receipt1 vẫn thành công→1.000.001, successgiữ/historylỗi. Trảnormal/retryhistory chỉGET trả5facts.
- Proxy tất cảInventoryGET502, POST đi API bình thường: receipt1 thành công, successgiữ dùstock/historyrefreshlỗi; submitdisabled vìstocklỗi. Normal/retrystock/history chỉGET trả1.000.002/6facts. SQLcuối:6facts/ledger1.000.002/balance1.000.002. Đây là faultproxy hiển thị, không outageAPIthật.

Loglọc có8POSTstart trong lượt này; maxsubmit có2start sát nhau1791280050117/1791280050359 nhưng SQLchỉ1maxfact. Có thể là authreplay nhưng chưa quan sát provenance/keyequality nên KHÔNG tuyên bố đã kiểm chứng. Doubleclick receiptđầu vẫn đúng1POST trong cửa sổ riêng. Timekhác:exact1791279955979,historyerror1791280082535,refresherror1791280113107.

Sau restart proxy dùng thử để thêm slow-write/loghashkey cần thiết, state vẫn tabInventory. BrowserFind INACTIVE trả `Computer Use server error -10005: cgWindowNotFound`. Đã dừng UI; chưa gửi slow-write/chưa ghi INACTIVE. Proxy xác nhậnnormal; stack còn chạy. Chỉ sửa manualdriver bịignore, không sourceapp.

T020 còn trống hai bản; T021 chưa bắt đầu. Còn thiếu: INACTIVE receipt/issue thật; UUIDkhác cho thao tác mới/đúngmột header/provenance hai requestmax; guard khi sending/uncertain cancel/confirm. Cách thủ công: tại3102 dùng VERIFY-ISSUE-RENAMED(INACTIVE0),receipt1/issue1 rồiSQL; modeslow-write giữ responsePOST đãcommit, thửclose/cancel rồiconfirm và đốichiếuhistory thật, không coiabort làrollback. Chụp Network đãche hoặc metadatahash của2thao tác mới; trảnormal sau từngfault. Matrixguardđầy đủ thuộcT027. Giữ bằng chứng partial trên, không chạy lại nếucodekhông đổi.

## T025 tiếp tục: bằng chứng recovery US4 một phần (2026-10-06)

Môi trường: frontend dùng thử3102 → proxy3105 → Gateway3104 → API3101 → PostgreSQL `inventory_verify`/Redis56380; dùng lại fixture45 sản phẩm hiện có. Không đụng DEV3002/API/Gateway/catalog. Chuyển fault-mode proxy bị ignore sang `429` tổng hợp cho một POST; đây là fixture chỉ để hiển thị, không phải rate limit từ Gateway/API thật. Chrome Network ghi POST `/api/v1/inventory/{id}/movements` →429. UI giữ nguyên RECEIPT quantity1/reason `T025 429 retry`, hiện trạng thái retryable và nút thử lại cùng thao tác. Không quan sát thấy POST tự động. Đặt proxy về `normal` trước khi bấm nút retry cùng thao tác. Network sau đó ghi201 Created; drawer báo thành công và tổng history tăng6→7. Fact mới có before1/after2 và hiển thị trong history. SQL chỉ đọc sau retry xác nhận SKU `VERIFY-ISSUE-RENAMED` trạng thái INACTIVE có7 facts, balance2=ledger2. Kết quả này chưa đủ PASS toàn bộ T025.

Bằng chứng lost-response trước đó vẫn được giữ: proxy dùng thử giữ response của POST đã commit cho tới khi client timeout; retry thủ công dùng cùng SHA-256 key hash đã khử nhạy cảm và API trả cùng movement ID dạng replay, đúng một fact mới. T025 vẫn để unchecked. Phần chưa kiểm chứng: UI fixture tổng hợp503/500/502 và `IN_PROGRESS`/`KEY_REUSED`; prior-unknown và replay lỗi tồn kho terminal; thời gian Retry-After và chứng minh không lặp ngoài lần quan sát manual retry; race deadline/401 tự động về identity/body; admin khác không phát sinh POST và bốn trường hợp provenance auth; POST hoàn tất muộn khi mất quyền và khôi phục mà không publish dữ liệu bảo vệ; từ chối của attempt hiện tại khi attempt cũ vẫn uncertain. Sau lượt này proxy đã về `normal`. Không thêm automated test/search/converge.

Đã dừng lượt tiếp tục tại ranh giới browser: state Chrome mới cho thấy tab LoHi không liên quan đang active và tab Inventory Auth có sẵn đang inactive. Lệnh chọn tab trả diagnostic CUA “user changed Chrome”; state/DOM mới xác nhận trang active không liên quan. Theo chỉ dẫn của người dùng khi browser gián đoạn, không gửi thêm thao tác Chrome. Proxy vẫn `normal`; không gửi POST trong lúc gián đoạn. Chỉ tiếp tục T025 khi UI Inventory có lại trong tab ổn định được phép dùng.

Sau lệnh `continue` tiếp theo của người dùng, state mới cho thấy tab Inventory Auth hoạt động lại. Form hiển thị quantity1 và reason `T025 synthetic 503`. Sau khi đặt proxy bị ignore sang stub503, click submit trả cùng diagnostic browser-change từ CUA trước khi log proxy đã khử nhạy cảm ghi POST. Đã dừng UI ngay, trả proxy về `normal`; không có POST Inventory nào được ghi sau lần retry thành công trước đó. Vì vậy UI state503 vẫn chưa kiểm chứng; click này không chứng minh request đã được gửi hay dữ liệu thay đổi.

### Cập nhật kiểm chứng T025 tiếp tục (2026-10-06)

Đã xác nhận lại môi trường dùng thử: Chrome `Inventory Auth` tại `localhost:3102/inventory`, UI proxy3105, Gateway3104, API3101, PostgreSQL `inventory_verify`/Redis56380 cô lập. Giữ nguyên catalog45 sản phẩm và fixture `VERIFY-ISSUE-RENAMED`. Proxy lần lượt dùng phản hồi tổng hợp503,500,502,`in-progress`,`key-reused`, rồi trả về `normal`. Network ghi POST với phản hồi503/500/502/409/409. Log proxy đã khử nhạy cảm ghi start/close từng POST trong mode tổng hợp, thời gian gần0ms; các mode này kết thúc tại proxy và không forward POST tới API. Cùng key hash và payload RECEIPT quantity1/reason được giữ. UI hiện uncertain cho chuỗi chưa xác định rồi blocked với thông báo KEY_REUSED cụ thể; không có đường tạo key mới. IN_PROGRESS có cảnh báo riêng. Recovery status vẫn `uncertain`, phù hợp với việc giữ uncertainty trước đó; chưa kiểm tra IN_PROGRESS độc lập khi chưa có prior-unknown. Bằng chứng429 + retry/replay201 nêu trên được giữ nguyên, không chạy lại.

Thao tác tổng hợp bị block đã được rời qua xác nhận UI. Vì POST tổng hợp không tới API nên tồn kho không đổi. UI mới xác nhận fixture45 sản phẩm, tồn2/history7. Nhóm2 chưa hoàn tất: cần kiểm tra prior-unknown cùng terminal stock-error replay, gồm UI reset/reload và SQL. Nhóm3,4 cũng còn thiếu: deadline và bốn nhánh provenance authentication; đổi actor/mất quyền, hoàn tất muộn, latch và phục hồi. Proxy hiện `normal`; không đổi source, không thêm automated test/search/converge. T025 vẫn unchecked; chưa bắt đầu T026.

### T025 tiếp tục: replay lỗi tồn kho sau prior-unknown (2026-10-06)

Môi trường: Chrome `Inventory Auth` dùng thử tại `localhost:3102/inventory` → proxy3105 → Gateway3104 → API3101 → PostgreSQL cô lập `inventory_verify`/Redis56380. Giữ fixture45 sản phẩm hiện có; `VERIFY-ISSUE-RENAMED` bắt đầu ở tồn3/history8. Không dùng endpoint hay catalog dev.

Chọn ISSUE, số lượng4 (lớn hơn tồn3), lý do `T025 terminal stock-error prior-unknown replay`. UI ban đầu hiện `sending`, thời điểm dispatch đầu “Chưa gửi đến API”, payload cố định; Network ghi POST pending. Proxy `slow-write` forward POST qua Gateway/API và chỉ giữ response thật. Sau timeout15giây của client, UI hiện `uncertain`, giữ ISSUE/4/lý do và nút “Thử lại cùng thao tác”; không thấy retry tự động. Metadata proxy đã khử nhạy cảm ghi key hash `08e3108eeafa6ae7`, key count1, ISSUE/4, lý do đã trim dài46. Log proxy cho thấy request đã forward và đóng sau timeout response.

Đưa proxy về `normal` trước khi Retry. POST thứ hai giữ nguyên key hash/payload, tới API và trả409 `INSUFFICIENT_STOCK` (Network409; proxy normal đóng sau29ms). UI kết thúc ở `terminal`, hiện thông báo lỗi tồn, reset draft nhập được về quantity0/lý do trống nhưng giữ ISSUE, và hiển thị tồn3. Mở lại drawer fixture gửi GET stock/history (cả hai304 Not Modified); UI cho thấy tồn3, history8 dòng, không thêm movement.

SQL chỉ đọc trong DB cô lập khớp key hash `08e3108eeafa6ae7` với một row idempotency: `http_status=409`, `response_body.code=INSUFFICIENT_STOCK`, `movement_id=NULL`. Đối chiếu cho balance3, facts8, ledger3. Backend giữ và replay lỗi stock terminal, không tạo movement. Tóm tắt proxy chỉ dùng xác nhận forward/response transport; SQL là bằng chứng transaction. Proxy trả `normal` sau nhóm.

Bằng chứng `IN_PROGRESS` độc lập trước đó vẫn là phản hồi tổng hợp proxy: POST đầu dừng tại proxy, không tới API; retry cùng key sau đó tới API trả201 và tạo một movement. Nó chỉ chứng minh UI stub, chưa chứng minh `IN_PROGRESS` do PG lock hoặc Retry-After thật. T025 còn thiếu: IN_PROGRESS thật khi thao tác chưa có prior-unknown và thời gian Retry-After; deadline cutoff; bốn nhánh provenance authentication và identity/body của automatic401 replay; đổi actor/mất quyền, hoàn tất muộn và không publish dữ liệu bị bảo vệ, giải phóng latch, phục hồi cùng admin. Giữ nguyên bằng chứng tổng hợp503/500/502/KEY_REUSED và replay committed-response thật trước đó. Proxy đang `normal`; T025 vẫn unchecked ở hai task lists, chưa bắt đầu T026. Không converge, automated test/search hay sửa source.


### T025: cơ chế tạm, IN_PROGRESS thật, deadline và auth/session (2026-10-06/07)

Môi trường vẫn là tab Chrome `Inventory Auth` tại3102 → proxy3105 → Gateway3104 → API3101 → PG55534 `inventory_verify`/Redis56380. Catalog45 giữ nguyên, không sửa dữ liệu/config dev. Helper chỉ ở `/private/tmp/inventory-t025`, frontend copy `/private/tmp/inventory-t012-web` và driver bị ignore `work/inventory-003`; không thêm automated test/fault switch vào production. API dùng thử được restart riêng và ghi application log `work/inventory-003/t025-api-application.log`; log outcome không chứa key/token. T001–T024 và bằng chứng cũ giữ nguyên. Các kết quả dưới đây là partial; T025 chưa đánh dấu.

- IN_PROGRESS backend thật: helper thủ công giữ balance FOR UPDATE của `VERIFY-ISSUE-RENAMED`, quan sát advisory lock của original, duplicate cùng actor/key/payload qua3105 trả409 `IDEMPOTENCY_IN_PROGRESS`, Retry-After1,20ms. Hash key `1dfe9678a85736f0`. Giải phóng khóa: original201/replay201 cùng movement `d54ebf4b-f097-4bb9-a8cf-92fac47dc0ce`; SQL facts8→9/balance3→4/ledger4, một result row. API application log `in_progress`, `completed`, `replayed` khớp. Đây là helper HTTP/SQL, không gán UI PASS từ helper.
- IN_PROGRESS UI thật bổ sung: fixture trong Console giữ header/body trong bộ nhớ, khởi tạo probe original bằng fetch; XHR của UI là duplicate sau150ms, cùng key hash `98099f7f0377daf1`. Balance bị helper khóa. UI nhận409 thật, chuyển `in_progress`, form khóa, Retry ban đầu disabled rồi enabled; không tự retry. Probe gốc bị giữ quá5s: API log transient_failure503 INVENTORY_BUSY, proxy gặp upstream error và trả502 cho probe (không phải201). Sau giải phóng khóa, retry UI cùng key/body hash `70d7bfaafc562cd2` trả201, chỉ một fact mới/tồn7→8/history12→13. Không gán probe là POST tự động của FE. Countdown ban đầu dùng clock state cũ nên nhãn99s đến tick đầu; đã sửa setRetryClock khi bắt đầu attempt, còn cần kiểm chứng nhãn sau sửa.
- Deadline FE: thao tác hash `012738df0e546a3e`, đã dispatch401 thật. Giữ refresh fixture10.088s; Date.now của riêng tab +25h rồi trả proxy normal. Refresh hoàn tất nhưng adapter guard không replay, UI `blocked`, thông báo hết thời hạn, Retry disabled. Log chỉ có POST401 tại1791305620618 và refresh1791305620632→1791305630720; không có POST replay. Clock được reset trước confirmed discard. Đây là clock fixture FE, không sửa expiry DB để suy luận FE.
- Expiry backend: helper riêng hash `84d29faaa95b943a`, DEMO-0009 bắt đầu0. API201 receipt1; replay trước expiry cùng movement `bb72f516-54c1-47f1-a5c3-1f27e93bbded`. SQL retention đúng86400.000000s. Làm cũ đồng thời completed_at/expires_at25h của riêng result fixture, giữ invariant24h; expired=true. Cùng key/payload đổi quantity2 được API201 movement mới `d976cd87-3a54-46dc-9231-dbf504d9aa3a`. SQL2facts/ledger3/balance3, một result row mới; API completed/replayed/completed. Giới hạn: đây là seeded-expiry branch và arithmetic, không chứng minh24h thực sự đã trôi hay clock PostgreSQL được tăng tốc.
- Auth trước dispatch (không prior-unknown): fixture token hết hạn trong session cùng admin, proxy refresh401 tổng hợp. UI signed-out/ẩn catalog/drawer; proxy chỉ refresh1791305453499,0POST Inventory. Restore original admin bằng helper Redux cùng mounted page giữ RECEIPT1/reason25, blocked/firstDispatch null/Retry enabled: latch đã giải phóng. Retry hash `d071bbaa10aeb4de` nhận401 API thật (proxy thay bearer của attempt đầu bằng token không hợp lệ), refresh fixture200, đúng một replay201. Log4011791305475740→refresh→2011791305475853; metadata key/payload cùng nhau. SQL một result201/movement `6d3a0faf-2b94-4944-8144-6cbfd94d039d`, tồn4→5/history9→10. Chưa có body-byte hash capture cho cặp automatic replay này; metadata/UI chỉ chứng minh key/type/qty/trim/length, cần bổ sung byte equality/actor tại wire.
- Actual API403 không prior-unknown: proxy forward bằng customer bearer dùng thử, guard API403 thật, không transaction. Lượt đầu phát hiện UI vẫn hiện data; sửa owner để chỉ xóa session khi401/403 từ token đã dispatch vẫn là token của admin gốc, không xóa session actor/token mới khi response cũ về. Lượt sau sửa1791305553752 xác nhận UI signed-out/không catalog/history. Form editable lại sau restore, operation terminal. Không gán API service movement log cho guard rejection: guard chưa gọi InventoryService.
- Refresh failure sau POST401 không prior-unknown: hash `012738df0e546a3e`, API401 thật rồi proxy refresh401,0replay. UI signed-out; restore giữ operation blocked/key/payload/firstDispatch không-null/Retry enabled. Phát hiện message sai “chưa gửi”; đã sửa giữ `authSource=after-post-401` trong attempt và message phân biệt401/replay chưa dispatch; message mới cần recheck riêng.
- Late success với admin khác: hash `a1b175040f4245fc`, receipt1 được API201 movement `d58a36c9-e368-432d-a650-9656b211c271` khi proxy giữ response. Đổi Redux session sang admin khác trong mounted page → denied/ẩn payload/catalog/history. Thả response, không publish/không GET bảo vệ. Restore admin gốc → terminal/reset/GET stock/history/catalog, tồn5→6/history10→11; không POST mới. SQL một fact/result201. Không đổi role DB.
- Prior-unknown/lost role: hash `5596916af5998bd7`, receipt1 commit201 movement `f0d5a735-8575-498e-a960-5e6b69a1db0b`, response giữ; đổi session customer → denied. Client timeout/cancel14.978s, không protected publication/GET. Normal rồi restore original admin → uncertain/Retry enabled/payload giữ, tồn7/history12 do GET đối chiếu, không tự settle từ history. Retry tokenexpired→refresh fixture fail0POST vẫn uncertain; restore→POST403 API thật vẫn uncertain; restore→POST401 API thật + refresh fail0replay vẫn uncertain. Cuối normal/manualretry201 API replay cùng movement; UI terminal/reset/reload, SQL vẫn đúng một fact/result cho key. Mỗi fault trả normal trước restore.
- Late terminal stock-error khi mất role: hash `2b07c283e7485b86`, ISSUE9 trên tồn8, API409 INSUFFICIENT_STOCK thật có result409/movementNULL. Proxy giữ response, session customer denied. Thả response: vẫn denied, không protected GET; restore original admin → terminal/reload stock8, không POST mới/history13/facts13/ledger8. Phát hiện Form remount mặc địnhRECEIPT dù operationISSUE; sửa bằng effect khôi phục operation type; initialValues vẫn RECEIPT để drawer mới không kế thừa ISSUE. Remount admin gốc đã hiện ISSUE đúng, drawer mới sau restart hiện RECEIPT.

SQL reconciliation lưu ignored `t025-sql-reconciliation.json`; API log và proxy `ui-events.jsonl` là raw evidence đã lọc. Chưa đánh dấu T025/T026: còn byte equality của automatic401 replay, deadline guard trước initial dispatch và UI cutoff click; auth message/no-prior401 final rejection; race refresh đổi actor/mất quyền0POST/0replay; current-attempt400/429/503/cancel sau unknown; countdown sau sửa và các giới hạn replay/latch chưa có bằng chứng. Cleanup helper/proxy sẽ ghi riêng sau kiểm chứng.

### T025: chốt các bằng chứng bổ sung và cleanup (2026-10-07)

Cùng môi trường dùng thử3102/3105/3104/3101/PG55534, không thay dev. Bằng chứng trên và các lượt trước giữ nguyên; danh sách thiếu lịch sử ở các đoạn trước được thay bằng kết quả dưới đây.

- Automatic401 giữ wire identity: hash key `2b9c38f46d97ad82`, hash body serialize `30f2784153c82065`, actor `f4550cc2-6a81-442a-9428-dbf8efe271ae` ở cả hai POST. Capture XHR Console tạm ghi401 tại1791306401686 rồi409 tại1791306401797, đúng một refresh fixture200 ở giữa. API trả INSUFFICIENT_STOCK terminal cho ISSUE9/tồn8; SQL result409/movementNULL, không fact mới. Không có replay lần ba.
- Final401 không prior-unknown: key `46453d7c0caf69bd`, body `5997e91df63cc064`, hai POST thật bị API guard401 tại1791306342871/1791306343015 với một refresh fixture200. UI ẩn protected data, restore original admin → terminal UNAUTHORIZED/form editable, không tự POST. Guard rejection không ghi idempotency result hoặc InventoryService outcome.
- Deadline trước initial dispatch: tokenexpired → refresh fixture giữ từ1791306422039, Date.now riêng tab +25h rồi thả normal. UI blocked/deadline/Retry disabled, firstDispatch null; không POST Inventory. Cùng với deadline sau401 đã ghi trên, chứng minh guard sau await refresh ở cả hai đường, không suy luận từ expiry SQL. Disabled Retry là bằng chứng cutoff UI; clock reset trước confirmed discard. Không tăng tốc clock hệ điều hành hay production.
- Refresh đổi actor trước dispatch: operation ISSUE9/reason `T025 actor refresh race`, tokenexpired, refresh trả admin khác bằng fixture. UI denied, không POST/protected GET; restore original admin → blocked, frozen payload, firstDispatch null, Retry enabled. Sau đó retry cùng operation key `c765b9e8f16f910d` thực dispatch401 API1791306751359; refresh giữ6274ms trả customer → denied và không replay. Restore original giữ operation/firstDispatch1791306751315 và giải phóng latch; message sau401 phân biệt lần gửi bị reject và chưa replay đã hiển thị. Normal/manualretry → API409 terminal stock, SQL result409/movementNULL; không fact. Session fixtures chỉ thay Redux/token của frontend copy, không sửa role DB.
- Prior-unknown attempt matrix mới: RECEIPT1/reason `T025 prior unknown attempt matrix`, key `1b3abbfcfa6c391e`. Proxy lần lượt500→400→429→503: UI luôn uncertain, payload khóa, key count1/type/quantity/trim/reasonCodepoints33 giữ nguyên, không automatic POST. Các response này chặn tại proxy, không có backend transaction. Countdown sau sửa hiển thị2–3s ở đầu attempt rồi enabled đúng thời gian; fallback backoff tăng khi attempt thất bại.
- Với prior-unknown trên, actual API401→fixture refresh200→actual API401 tại1791306886869/1791306886975: đúng hai POST, không loop; UI signed-out. Proxy normal rồi restore original → vẫn uncertain/Retry enabled, không tự POST. Cộng với preflight refresh failure0POST, actual403 và after401 refresh failure0replay trên key `5596916af5998bd7`, đủ bốn hàng authentication có/không prior-unknown.
- Cancel current attempt: same key `1b3abbfcfa6c391e` normal forwarding qua slow-write, actual API201 tại1791306915065 rồi fixture Console abort XHR; proxy close completed=false sau6124ms. UI uncertain/payload giữ/backoff16s+lượng jitter, không settle từ abort. Đưa normal, retry thủ công trả201 replay; UI terminal/reset quantity/reason/reload stock/history. API application log completed/replayed cùng movement `7c948095-3f4d-4457-9edf-77fc2f25fa9b`; SQL đúng một result201/fact, balance8→9/history13→14/ledger9. Không coi abort là rollback.

Đối chiếu cuối: ignored `t025-sql-reconciliation.json` chứa VERIFY stock9/facts14/ledger9, DEMO-0009 stock3/facts2/ledger3; mỗi result retention86400s. Proxy `ui-events.jsonl` chứa start/close/upstream status/metadata hash; application log `t025-api-application.log` chứa outcome real backend. Guard401/403 chưa vào InventoryService nên không có movement outcome, không giả log guard. Các response refresh tổng hợp chỉ chứng minh FE.

Cleanup: xóa toàn bộ `/private/tmp/inventory-t025` (helper, secrets/session fixture, backups), gỡ module tạm khỏi frontend copy và trả page/driver dùng thử về bản gốc, mode normal. PG balance lock đã rollback. Reload tab sau cleanup loại bỏ Date.now/XHR wrappers; frontend vẫn dùng session admin gốc và normal GET. Chỉ giữ sanitized evidence/log dưới ignored work/. Không thêm production clock/fault, automated test/search/converge. Source fixes thực: cập nhật clock khi bắt đầu attempt; phân biệt provenance after401; ẩn data khi session hiện tại thật sự bị API401/403 từ chối nhưng không xóa session thay thế; khôi phục form type đúng khi remount. ESLint/typecheck frontend đạt. T025 đủ bằng chứng với giới hạn seeded-expiry backend đã ghi rõ, đánh dấu ở cả hai task lists; T026 tiếp theo theo dependency.

### T026 implementation và kiểm chứng giới hạn (2026-10-07)

Sau T025 đủ bằng chứng, hoàn thiện lifecycle ở inventory-management.tsx: pagehide/unmount abort operation signal trước discarded/clear refs; abort reads và kiểm tra signal ở callbacks để không publish sau clear; giải phóng timer và modal. Pagehide khóa read effects; persisted pageshow xóa operation/draft/selection/resources cũ, mở lại read effects đã kiểm tra auth, tăng read generation; reminder sẵn có, không tự POST/storage/router sentinel. Confirm modal vẫn recheck operation identity trước abort/discard/action; cancel giữ operation.

Kiểm chứng thủ công riêng trong frontend dùng thử3102/proxy normal: drawer VERIFY stock9/history14, nhập unsent reason rồi dispatch PageTransitionEvent pagehide persisted=true từ Console tạm (không submit). Drawer/catalog bị clear; pageshow persisted=true → drawer đóng, catalog45/reminder trở lại. Proxy log chỉ GET catalog1791307269628→1791307269659, không POST. Đây là synthetic lifecycle-event evidence, không phải browser bfcache thật hoặc ma trận departure T027. Không ghi SQL/fault hoặc giữ helper. ESLint/typecheck/Prettier đạt sau bản cuối. T026 đánh dấu cả hai bản; T027 còn unchecked và cần ma trận sending/uncertain/blocked, modal/refresh race và native browser-return như task.

### T027 tiếp tục: partial, dừng tại thay đổi browser ngoài lượt điều khiển (2026-10-07)

Skill implement prerequisites đúng003; requirements16/16, không extension hook. T025 hoàn tất và code T026 giữ nguyên. Môi trường xác nhận Chrome Inventory Auth tại3102/inventory, catalog45 → proxy3105 → Gateway3104 → API3101 → PG55534 inventory_verify/Redis56380. Chỉ fixture ở /private/tmp/inventory-t027, frontend copy và ignored driver; session admin gốc ký từ database dùng thử, không in token/credential, không sửa user/role/config dev. API outcome log mới ở ignored t027-api.log; proxy ui-events.jsonl. Instrumentation request-interceptor ghi config/signal trong bộ nhớ, không coi config row là POST dispatch; API/proxy log xác nhận dispatch.

Bằng chứng mới đủ cho các lượt riêng dưới đây:

1. Preflight sending/cancel: RECEIPT1/reason `T027 preflight cancel and close`, refresh fixture hold, firstDispatch null. Close mở modal “Rời thao tác tồn kho đang chờ?”, cảnh báo có thể đã ghi nhận và mất khả năng retry. “Ở lại” giữ drawer/frozen payload/sending. Rewrite tự timeout refresh sau30002ms (1791307863263→1791307893265), trả500; UI mất session rồi restore original → blocked, firstDispatch null. Không POST Inventory. Không dùng timeout này làm bằng chứng confirm-refresh completion.
2. Blocked close/cancel/confirm: sau restore, close/Ở lại giữ operation blocked/reason. Close/“Rời và đối chiếu sau” đóng drawer. Capture an toàn Console: config key hashc12fd3942c5f7414/bodyhashe75a83ea75df1a5a, signal aborted=true; abort timestamp1791307974516 khi UI vẫn hiện “Trạng thái phục hồi\nblocked”. Source T026 thứ tự controller.abort → discarded → clear refs/action được đối chiếu, không sửa source. Capture không truy cập discarded flag riêng nên không gán runtime proof cho flag nội bộ.
3. Preflight confirmed departure dưới30s: operation mới RECEIPT1/reason `T027 preflight confirmed zero POST`; sending/firstDispatch null, close/Ở lại giữ operation; close/confirm đóng drawer. Proxy refresh1791307997976→1791308007351, completed=true sau9375ms khi đưa mode normal. Trong lượt này không có POST Inventory cho product56564e2c-6de3-4eb6-8d83-ff5e9382e936 sau completion; đây là dispatch log thực, không chỉ click. Không tạo movement cho hai preflight fixtures. Không suy luận cancellation/departure làm backend rollback.

Boundary dừng: sau các lượt trên, trước khi gửi UI action tiếp theo, log tự xuất hiện GET page1/limit10 tại1791308076455, sau đó page3/limit10; state mới đổi sang product96ae6eeb-9767-4ff1-8b66-60ed705f0ce3/VERIFY-MIXED, terminal reason `1`, history46. Proxy ghi POST keyhash9e014d4b638517c4 RECEIPT1/reasonCodepoints1 tại1791308120251, API2011791308120447. Đây không phải payload/product của lượt điều khiển T027 đã gửi; không xác định nguyên nhân hoặc quy cho FE tự POST. API log completed movementddc68f6c-3aa4-4961-b867-e215befa0268; SQL chỉ đọc xác nhận VERIFY-MIXED24→25/1movement. Không xóa fact này, không dùng làm acceptance T027. Dừng thao tác Chrome ngay sau khi nhận ra state thay đổi ngoài lượt điều khiển; chưa thể tiếp tục ma trận một cách có provenance đáng tin.

Cleanup filesystem/runtime: khôi phục owner copy byte-identical với source T026, page và driver gốc; xóa module/helper/session secret/backups /private/tmp/inventory-t027, proxy normal, restart riêng stack dùng thử. Không thao tác Chrome thêm sau boundary. HMR có thể reload cleanup nhưng không kiểm chứng lại memory hook trên tab; cần reload tab trước lượt kế tiếp để bảo đảm request instrumentation/window.t027 cũ mất. Đây là giới hạn cleanup trong browser memory, không tuyên bố đã quan sát nó được gỡ. T025 giữ [X], T026 giữ [X], T027 [ ] ở cả hai tasks; T028–T031 chưa bắt đầu do dependency. Không thêm test tự động/search/converge.

Checklist thủ công còn thiếu (dùng3102/PG55534, đối chiếu log, proxy normal sau mỗi nhóm):
- Sending/uncertain/blocked: close/mask/Escape/switch/menu/dashboard/logout/login, cancel giữ key/payload/selection, confirm cảnh báo mất recovery và abort trước action. Đã có close sending/blocked ở trên; chưa coi các control khác hoặc uncertain PASS.
- Giữ refresh sau actual movement401, confirm departure rồi thả refresh dưới30s: có1POST401 nhưng0replay; cancel confirmation rồi thả: cùng operation vẫn eligible. Ghi proxy/API thực, không chỉ UI click.
- Modal đang mở khi response resolve; confirm không xóa operation mới; callback/latch cũ không đổi form/selection/operation mới. Mọi late response sau confirmed switch/departure bị bỏ qua.
- Native reload khi sending/uncertain: default beforeunload nếu browser cho phép; cancel giữ operation, confirm reload có freshGET/reminder, không restore key/payload/POST; stock/history reconcile fact đã dispatch, không gọi reload/abort là rollback. Unsent draft và success/read-refresh failure không cảnh báo.
- Native Back/Forward/bfcache: ghi persisted thực và giới hạn browser; fresh authorized reads/reminder/0restoredPOST/no recovery storage. Synthetic lifecycle event T026 cũ vẫn giữ, không thay native evidence.


### T027 hoàn tất tiếp tục — 2026-10-07 Asia/Bangkok

Môi trường dùng thử: frontend3102 → proxy3105 → Gateway3104/API3101 → PostgreSQL55534 `inventory_verify`/Redis56380. Code T026 giữ nguyên, catalog45, admin gốc được khôi phục; không đổi dữ liệu/config dev, không thêm search/test tự động. Fixture tạm chỉ nằm trong frontend copy `/private/tmp` và proxy dùng thử: gọi callback owner hiện có, ghi hash config Axios/signal abort và sự kiện native. Config Axios không chứng minh dispatch; đối chiếu proxy/API/SQL như dưới đây.

POST ngoài lượt cũ1791308120251: Network Initiator native DevTools là api.defaults.adapter → sendMovement → submitMovement → onFinish của drawer, status201/208ms; timestamp proxy/API và movementddc68f6c-3aa4-4961-b867-e215befa0268 khớp SQL24→25 đã ghi. Không xác định được thao tác người/automation khởi phát: **UNKNOWN**, loại khỏi PASS/FAIL. Trước fixture mới đã reload native và xác nhận t027/t025 undefined, Date.now native.

Ma trận rời trang: giữ bằng chứng Close sending/blocked cancel/confirm và preflight-confirm không initialPOST trước đó. Lượt này quan sát Stay với Escape/mask/switch/menu Dashboard/logout/login ở uncertain và blocked; Escape/mask ở sending trong refresh sau401, switch/logout/login Stay trong refresh đang giữ. Cancel giữ payload/key/selection/signal chưa abort; session được khôi phục đúng admin. Close uncertain Stay cũng đã quan sát. Confirm đủ phần còn thiếu: uncertain Close/mask/Escape/switch/Dashboard/logout/login; blocked mask/Escape/switch/Dashboard/logout/login; sending mask/Escape/switch/Dashboard/logout/login. Menu Inventory là route hiện tại, không phải departure; menu Dashboard chính là control Dashboard.

Close/Escape/mask và nút modal được thao tác native. Mask drawer khiến sidebar/logout/row khác không nhận pointer bình thường; các handler thật này được gọi DOM .click() trong Console fixture sau đọc DOM, nên chỉ chứng minh handler/modal, không khẳng định control sau mask có thể click bằng pointer. Login dùng fixture clear session rồi click native. Owner.submit tạm chuẩn bị trạng thái/race. Response500/KEY_REUSED tổng hợp dừng ởproxy chỉ chứng minh FE. Snapshot abort đồng bộ còn operationPresent=true/discarded=false, sau đó operation=null và action đúng: blocked mask1791309429250/Escape1791309436523/switch1791309445486; sending mask1791309612568/Escape1791309622131/logout1791309637736/login1791309658187. Các confirm sending này POST thật tới API409 nhưng response bị giữ; discard không phát sinh POST mới/replay.

Refresh sau401 + departure: keyhash67df6c141102d766/bodyhasheb46ef8b338a6043, POST1791308787661 → API4011791308787682, refresh1791308787835. Escape/mask Stay giữ sending. Confirm Dashboard abort1791308795551 lúc sending=true/discarded=false, operation=null. Refresh hoàn tất1791308805414 (17579ms), không replay. Nhánh cancel đầu vượt timeout rewrite30s và refresh500: giới hạn timing fixture, không coi là replay thành công. Recovery cùng operation keyhash922732a9ea3e820e/bodyhash6946b606d70d181a sau đó: POST1791309048042 →401 thật; refresh chờ + Escape/Stay; vềnormal, refresh7137ms, replay cùngkey1791309055288 →409 INSUFFICIENT_STOCK thật. UI terminal, lúc đó stock9/history14; SQL cache409/nullmovement. Không tự tạo POST/key mới.

Race modal: RECEIPT1 thật `T027 modal old terminal`, keyhash401f30d2c5a40d53/bodyhashdafc4758dd235d71, POST1791309168506 →API201 khi modal Close vẫn mở. Thả proxy →terminal/read mới(stock10/history15). Fixture owner tạo ISSUE20 mới `T027 modal newer operation`, keyhashbf75ab7fdf41f613/bodyhashfc351f4180eb1a60,500 tổng hợp ởproxy. Leave modal cũ mở lại confirm cho identity mới; Stay giữ operation uncertain mới/key/body/signal chưa abort. Confirm hiện tại sau đó chỉ discard operation mới.

Response cũ/selection mới: ISSUE20 thật keyhash3e7a197c334f25c1, POST1791309217394 →API4091791309217433 bị giữ. Confirm switch abort/discard rồi mở DEMO-0009; operation mới keyhash2a8b58711068a03b uncertain giữ stock3/history2/payload đúng. Transport cũ bị hủy không publish response sản phẩm cũ. Overlap callback/finally mạnh hơn: POST401 cũ keyhashc28de5e26313b868 chờ refresh; switch confirm abort1791309269808. Trước thả refresh cũ, operation mới keyhash9d95163abf1614da/bodyhashb451257646174448 đã dispatch và terminal409 thật ở DEMO-0009. Thả refresh cũ không replay POST cũ, không đổi operation terminal mới hoặc khóa form; latch cho operation mới vẫn sử dụng được khi promise cũ chưa kết thúc. SQL409/nullmovement cho lỗi stock thật, không dùng response tổng hợp chứng minh backend.

Cảnh báo native thực sự quan sát: Chrome **“Reload site? Changes you made may not be saved.”** ở uncertain, sending và blocked. Cancel giữ operation; confirm reload uncertain/sending mở catalog45/reminder/drawer đóng, GET mới, không restorePOST. Chỉ localStorage inventory.auth.session, sessionStorage rỗng, không lưu operation/key/body. Lượt sending reload keyhash210f2ff7f4acb9aa đã commit201/movement56709879-f123-468e-8eb5-611c65295c88 stock3→4; reload/abort HTTP không là DB rollback. Draft lý do chưa gửi reload không warning. Success thật `T027 success refresh fail`, keyhashb169a0febdb78ed7 commit201 rồi GET catalog/stock/history502 tổng hợp; UI giữ “Giao dịch đã được ghi nhận.”/terminal và lỗi read riêng. Vềnormal rồi native reload không warning/POST.

bfcache thật: navigation toàn document sang Dashboard và Back native: pagehide.persisted=true1791309386473/pageshow.persisted=true1791309388277. Lượt thứ hai từ blocked, Chrome thật hiện **“Leave site? Changes you made may not be saved.”**; Leave →pagehide.persisted=true1791309713645, abort1791309713646 còn discarded=false; Back →pageshow.persisted=true1791309715535. Operation/draft/drawer cũ hết, reminder và GET catalog authorized mới, không POST tiếp theo. HMR WebSocket dev báo đóng vì bfcache rồi reconnect, không phải hydration lỗi ứng dụng. Chỉ chứng minh traversal Chrome này; browser quyết định beforeunload/dialog/cache, không bảo đảm khi crash/mobile/browser khác.

Đối chiếu backend: `work/inventory-003/t027b-sql.json`, proxy ui-events.jsonl, application log t027b-api.log. Ba fact thành công mới trong lượt điều khiển: 8cc8bcf7-d257-4b8f-a881-74238ef46981 VERIFY9→10; 56709879-f123-468e-8eb5-611c65295c88 DEMO3→4; 97735ba5-2fde-4b50-a838-c1cb41f6ef53 DEMO4→5. Cuối VERIFY balance10/facts15/ledger10; DEMO balance5/facts4/ledger5. Các stock-error thật giữ response đều cache409/nullmovement. Auth401 không tạo kết quả idempotency/movement.

Cleanup: dispose gỡ interceptor/listeners/window.t027; khôi phục page/owner copy và runtime ignored gốc, xóa module/session secret/backups/thư mục helper tạm. Owner copy giống từng byte source T026. Proxy normal, chỉ restart stack dùng thử. Reload native xác nhận t027/t025 undefined, Date.now native, không operation storage, catalog45. Không sửa production source. Đánh dấu T027 ở hai bản tasks sau đủ bằng chứng; tiếp tục T028.


### T028 audit production — 2026-10-07

Stack dùng thử3102/3105/3104/3101, fixture45, Next16.3.6 production/Turbopack thật, không helper. Build copy đầu lỗi symlink node_modules ra ngoài tracing root; đã ghi lỗi, thay riêng symlink dùng thử bằng dependency copy vật lý và build production thành công. Không sửa config dev. Root build cuối cũng thành công với NEXT_PUBLIC_API_URL=/api/v1/GATEWAY_ORIGIN=http://127.0.0.1:3105; chạy output production đó trong copy dùng thử.

Reload coldload và Dashboard→Inventory native: màn hình đầu quan sát có style, không thấy flash không style; Console production No errors/No warnings, không hydration message. Có tag SSR antd-cssinjs, label/reminder/pagination tiếng Việt, giữ registry/provider. Đây là quan sát browser + SSR, không bảo đảm mọi frame trên mọi thiết bị. Enter từ focus row Inventory mở drawer; Escape đóng/trả focus; Tab đi qua Close, pagination/size lịch sử, type/quantity/reason/submit. Label Loại giao dịch/Số lượng/Lý do liên kết control type/quantity/reason tồn tại. Focus lý do native có border/shadow xanh; screenshot outline row khi Tab. Header UTC và ISO Z đọc được, ví dụ2026-10-06T17:52:48.556Z. Cuộn dọc drawer native thành công. History overflow912/1100px; gọi wheel ngang native không đổi scrollLeft, nên quan sát render ngang bằng Console scrollLeft=scrollWidth thủ công (188.25px), không tuyên bố wheel native PASS. Cột UTC đọc trọn, không thêm helper source.

Phát hiện chữ logout đen trên sidebar tối; chỉ sửa color/hover CSS scoped .inventory-layout .inventory-logout.ant-btn trong globals.css. Không đổi owner/drawer/lib/auth/handler; giữ bằng chứng hành vi T025/T027. Rebuild production; session hết hạn trong khoảng dừng được login thật admin dùng thử khôi phục, rồi navigation Dashboard/Inventory native. Console cuối No errors/No warnings; màu logout rgba(255,255,255,0.85) trên nền rgb(0,21,41), SSR tag true/t027 undefined. Không lưu password.

Screenshot đã lưu trong work/inventory-003/ ignored: t028-production-catalog-focus.png (focus row/logout trước sửa), t028-production-drawer-focus.png (focus lý do), t028-production-drawer-utc.png (cuộn ngang thủ công). Chưa lưu được ảnh catalog sau sửa: tool báo App quit, đọc inventory mới xác nhận Chrome isRunning=false. Dừng browser, không relaunch. Giữ ảnh hiện có và kết quả DOM màu/Console sau sửa với giới hạn này. Đánh dấu T028 hai bản; kiểm tra browser transport/auth cuối thuộc T030, không suy luận từ build.


### T029 quality — 2026-10-07

Node24.21.0. Root npm run check với NEXT_PUBLIC_API_URL=/api/v1 exit0: lint/Prettier/typecheck strict API/Gateway/web. Root npm run build sau sửa CSS logout cuối exit0 cả ba app; env override same-origin/Gateway dùng thử, không sửa .env. npm test exit1/Jest No tests found/0 matches; không có apps/api/test. Đây là thiếu coverage tự động, không là test PASS. Không thêm test hoặc dùng passWithNoTests giấu kết quả. Log work/inventory-003/t029-check.log/t029-tests.log; output build trong tool result. Lỗi Turbopack symlink copy trước đó vẫn ghi T028. Đánh dấu T029 hai bản với omission coverage rõ.


## T030 hoàn tất — 2026-10-07 02:01–02:02 UTC

Chỉ kiểm chứng phần smoke cơ bản còn thiếu; không thêm test tự động/helper/fault mode. Giữ bằng chứng login admin/sidebar/table/pagination/drawer/validation đã đạt. Lượt T030 trước bị dừng đã quan sát page2, drawer tồn5/history4, lỗi quantity0/lý do trống và không POST; chưa ghi movement. Lỗi API cơ bản/retry cùng key giữ bằng chứng T020/T025, không chạy lại. D001–D004 vẫn deferred.

Môi trường: container dùng thử inventory-002-verify-pg (55534, inventory_verify), inventory-002-verify-redis (56380); FE3102 → proxy3105 normal → Gateway3104 → API3101. Khởi động runtime hiện có, giữ45 sản phẩm, không seed. API build hiện tại có thay đổi response history nhỏ; đồng bộ inventory-types.ts hiện tại sang frontend copy dùng thử. Không đổi cấu hình hoặc ghi dữ liệu DEV3001/3002/3004, PG55433, Redis6379.

SQL ban đầu DEMO-0009 / 04c874d8-7728-4b2f-9470-75bf5a29f0d3: balance5/facts4/ledger5. Browser khôi phục session admin có sẵn tới dashboard, không tuyên bố login admin mới PASS. Drawer tồn5/history4. Nhập1, lý do “T030 normal receipt one”: UI thành công/tồn6/history5, xóa quantity/reason. Xuất1, lý do “T030 normal issue one”: thành công/tồn5/history6, xóa quantity/reason. Network đúng một POST201 mỗi thao tác rồi GET tồn/catalog/history.

Bằng chứng dispatch: proxy normal POST start1791338494735/keyHash13f2dfffe504a05a (RECEIPT), start1791338508933/keyHash5c2ccf60a1c8fac0 (ISSUE), mỗi request một Idempotency-Key, quantity1/lý do đã trim. Hai thao tác mới có key khác nhau; không retry lượt này, giữ bằng chứng bảo toàn key/body T025. API application log inventory.movement.outcome completed201 khớp movement85d33551-58cc-4dc5-8496-b4d9231c720b (5→6) và6bb63313-155a-4163-ae16-a18c53607296 (6→5). SQL xác nhận đúng hai facts mới và hai idempotency results201 với movement_id tương ứng; cuối balance5/facts6/ledger5. Request đã tới API và commit thật, không lấy response tổng hợp làm bằng chứng transaction.

History GET200 có productId và product {sku,name,status}, không còn product.id; bảng history vẫn hiển thị đúng. Shape product của table/stock không đổi.

Customer: logout UI/login customer hiện có → dashboard role customer, không có mục Inventory. Mở trực tiếp3102/inventory: đầu tiên chờ session rồi “Không có quyền truy cập / Chỉ quản trị viên được xem tồn kho.” Network sau navigation có0 request /api/v1/inventory; proxy không có Inventory start trong cửa sổ customer02:02:14–02:02:22UTC. Không dispatch protected read/POST.

Giới hạn: runtime development có warning AntD Alert message deprecated/useForm chưa nối Form và favicon404 đã có; không tuyên bố production console sạch. Không chạy fault nâng cao/deadline/bfcache/GoogleOAuth. Giữ quality gates cũ; thay đổi DTO/type nhỏ mới đã check/build root đạt riêng. T030 không sửa source. Đánh dấu T030 hai bản từ bằng chứng giữ lại và mới có nhãn môi trường, không PASS các mục chưa chạy.

Dọn dẹp: proxy luôn normal, không tạo helper. Dừng runtime/container dùng thử sau kiểm chứng, giữ container/volume/data. Chỉ stack DEV gốc còn chạy. Đóng page browser kiểm chứng; không inject helper product/session. URL DEV trực tiếp http://localhost:3002/inventory; dùng thử3102 đã dừng. Không converge.


## Refactor React trực tiếp — 2026-10-07 02:13–02:16 UTC

Người dùng yêu cầu refactor cấu trúc sau converge. Áp dụng reactjs/react-code-review-senior/vercel-react-best-practices; không chạy thêm bước Spec Kit/converge, không thêm dependency/test tự động. Owner901 dòng chuyển thành components/inventory/inventory-management.tsx197 dòng, arrow functions, một state local selected-product. Folder inventory chứa table/drawer, hooks đọc dữ liệu/resource, command/error/operation và departure: tách UI, GET, dispatch/retry và lifecycle browser. Gom pagination/refresh và draft reset/errors theo vòng đời. lib/abort-scope.ts dùng chung cho read và operation; abort vẫn trước discard. Giữ Axios/auth, key/body cố định, latch đồng bộ và kiểm tra publication. Effect chỉ đồng bộ request/listener/timer/session; visibility tính từ dữ liệu. Form effects chỉ chạy khi mở và Form đã render, loại warning useForm đã quan sát; Alert chuyển sang title.

Bằng chứng mới trên stack dùng thử inventory_verify PG55534/Redis56380, FE3102 → proxy3105 normal → Gateway3104 → API3101, giữ45 sản phẩm, không ghi dev/bật fault. Customer mở Inventory bị chặn/0 request Inventory. Login admin thật, page2 có20 dòng/tổng45. Drawer DEMO-0009 ban đầu balance5/facts6/ledger5. Quantity0/lý do trống có field errors/0POST. Double-click nhập1 đúng mộtPOST201/keyHash2be62615761f6529/movementce6f5d58-9fa2-46be-9718-3674d4eb5b80; UI tồn6/history7/xóa quantity-reason. Xuất1 đúng mộtPOST201/keyHash9965d625a632d5e8/movement89f414e4-1463-4844-8a2c-7da88935616e; UI tồn5/history8. Xuất6 trả409 INSUFFICIENT_STOCK/keyHash5495d53dbe556342; reset quantity-reason/giữISSUE/tải lại tồn5. SQL cuối balance5/facts8/ledger5, result409/movementNULL cho rejection. API completed201/201/409 khớp request. Đóng/mở lại xóa terminal/draft; reload thật chỉ GET mới/0POST khôi phục. Sau sửa Form effects cuối, cold reload/open vẫn tồn5/history8/draft trống, Console0errors/0warnings trong cửa sổ navigation này (development, không phải production audit).

Root check/build exit0; sau chỉnh drawer cuối web lint/format/typecheck/build exit0. API không có suite; không thêm test hoặc nhận Jest PASS. Không chạy lại fault/replay cùng key hay matrix auth/race/deadline/bfcache sau refactor: bằng chứng cũ là lịch sử, không phải kiểm chứng mới cho code đã đổi; D001–D004 vẫn deferred. Không tuyên bố converge/full acceptance cho bản refactor.

Dọn dẹp: proxy luôn normal, không thêm helper browser/runtime fault. Dừng runtime/container dùng thử, giữ volume/database/facts, đóng page kiểm chứng. DEV còn3001/3002/3004/PG55433/Redis6379; URL http://localhost:3002/inventory. Logs chất lượng/runtime ignored trong work/inventory-refactor/.

Lúc cập nhật source trực tiếp, Fast Refresh báo thay đổi kích thước dependency array do chữ ký hook đã đổi; reload thật sau đó không còn warning này. Không tuyên bố toàn bộ session development sạch warning.
