# Kiểm chứng triển khai inventory

Ngôn ngữ: **Tiếng Việt** | [English](../validation.md)

Ngày: 2026-10-06. Đã triển khai; bằng chứng runtime/quality và giới hạn bên dưới. Chỉ các kết quả ghi bên dưới đã được kiểm chứng.

## Môi trường

- Node.js v24.21.0. Các bộ dependency độc lập ở root/API/Gateway/web được kiểm tra bằng `npm ls --depth=0` (đều exit 0).
- Container PostgreSQL 17 dùng thử riêng `inventory-002-verify-pg`, cổng localhost 55534, database `inventory_verify`; readiness thành công. Không thay đổi database hiện có.
- Container Redis 7.4 dùng thử riêng `inventory-002-verify-redis`, cổng localhost 56380; PING thành công.
- Đã đọc constitution và quy ước backend/database/Gateway. Không có extension hook hoặc feature checklist.
- Đã kiểm tra ignore của Git/ESLint/Docker; thêm Prettier ignore và bổ sung pattern secret/log cho Docker. Không xuất bản package.
- Cấu hình runtime dùng biến môi trường hoặc file tạm được ignore; tài liệu này không chứa secret.

## Trạng thái kiểm chứng ban đầu

Tại thời điểm khởi tạo T001, tất cả kịch bản runtime **chưa chạy**: US1 tồn/auth/phân trang; US2 nhập/replay/ghi đầu/in-progress; US3 xuất/từ chối; US4 lịch sử/catalog/append-only; scope/fingerprint/expiry của key; lỗi SQL/rollback/crash/COMMIT chưa rõ; concurrency hỗn hợp/ledger; cleanup giới hạn/lock/shutdown/phục hồi; migration mới/hiện có up/down/up; root check/build/test hiện có; Gateway forwarding/timeout/rate limit; Swagger/Postman/đồng bộ hai ngôn ngữ và logging outcome.

Không thêm file test tự động. Chỉ đánh dấu task hoàn thành khi có triển khai và bằng chứng kiểm chứng thực tế.

## Nền tảng và US1 — PASS

T002–T013: đã triển khai module/entities/migration mới/filter/DTOs/quyền admin và API đọc/Postman; API typecheck và build thành công. Toàn bộ chuỗi 5 migration đã commit trên database dùng thử mới.

T014: kiểm tra qua Gateway thành công: tồn zero cho sản phẩm có sẵn active/inactive, 3 sản phẩm từ seed thực tế và sản phẩm mới tạo bằng API; danh sách tăng theo ID và total=6, ranh giới trang/trang vượt phạm vi; sản phẩm không tồn tại 404; UUID/query/query lặp/offset không an toàn 400; customer 403; thiếu/token sai 401. SQL vẫn có 0 balance row sau toàn bộ lượt đọc. Chưa có route movement.

## US2 — PASS

T015–T021 đã triển khai: kiểm tra raw key/hash chuẩn; key/row lock cùng manager; nhập/result atomic; savepoint khi từ chối nghiệp vụ; replay 24h; outcome được làm sạch; cleanup/job UTC mỗi giờ có giới hạn. API build thành công.

T022 qua Gateway + PostgreSQL: nhập 10 rồi 5 cho tồn 15/hai movement; replay trả tồn gốc 10 sau lần ghi tiếp; 8 body sai và 3 key sai trả 400; nhập inactive 201; hai lượt nhập đầu đồng thời 10+5 đều 201, tồn 15. Fixture ceiling dùng thử khớp ledger từ chối nhập với 409 STOCK_LIMIT_EXCEEDED và replay đúng. Giữ balance lock cho duplicate 409/Retry-After 1 trong 25ms; request gốc sau đó commit và replay cùng giá trị JSON. Cuối cùng sản phẩm kiểm tra có tồn=16/movement=3. Một request lúc API đang khởi động trả Gateway 502, đã retry cùng key. So sánh replay theo giá trị, không theo thứ tự thuộc tính JSON.

## US3 — PASS

T023–T026: ISSUE dùng lại transaction/vòng đời key của nhập. Gateway + SQL: nhập 10, xuất 3, từ chối xuất 8 giữ tồn=7/movement=2 (SC-001); xuất 7 về zero. Lần xuất đầu bị từ chối không tạo balance row; sau nhập, key cũ replay lỗi thiếu tồn, key mới thành công. Xuất inactive thành công về zero. API build thành công.

## US4 — PASS

T027–T030: triển khai lịch sử read-only REPEATABLE READ + catalog hiện tại, bổ sung Swagger/Postman; API build/lint thành công. Gateway/SQL: 3 movement mới nhất trước với tồn sau [0,7,10]; trang 2 limit 1 khớp movement giữa; trang vượt phạm vi rỗng, total 3; chưa phát sinh total 0; sản phẩm không tồn tại 404. Sửa SKU/name/status sang INACTIVE chỉ đổi dữ liệu catalog hiển thị; mọi dữ kiện movement giữ nguyên. Route PATCH/DELETE movement trả 404, SQL vẫn có 3 movement.

## Runtime xuyên suốt — PASS (T034–T037)

- T034: hai admin cùng key tạo movement riêng; login/refresh thực tế của cùng admin replay result gốc. JSON tương đương/trim Unicode replay đúng; đổi product/type/quantity/reason gây conflict; key khác hoa/thường độc lập. TTL đúng 24h, replay không gia hạn. Cached 404 giữ nguyên sau khi tạo product; key mới thành công. Validation/auth không cache. Result hết hạn được thay thế dù chưa cleanup. Cached lỗi tồn có bằng chứng US2/US3.
- T035: CHECK tạm trên PostgreSQL từ chối movement INSERT và result INSERT service await; deferred constraint trigger từ chối COMMIT đang await. API trực tiếp trả 500 đã lọc; không có stock row, movement/result=0; gỡ fixture rồi retry cùng key qua Gateway cho stock=1/movement=1/result=1. Terminate backend trước COMMIT giữ tồn cũ, không có result; retry thành công. TCP proxy dùng thử bỏ xác nhận COMMIT từ server: API 500/outcome_uncertain, result 201 gốc đã lưu, retry cùng key replay đúng. HTTP proxy tạm giữ response 201 đã xác nhận và dừng API riêng; restart rồi retry cùng key trả result gốc. Fixture cuối mô phỏng mất phản hồi phía client, không dùng debugger pause trong source. Đã gỡ mọi fixture SQL tạm.
- T036: mười lượt xuất key riêng từ năm đơn vị cho năm 201/năm INSUFFICIENT_STOCK, tồn 0. Bốn mươi lượt nhập/xuất hỗn hợp thành công, tồn đúng. Đổi payload khi đang xử lý trả IN_PROGRESS trong 13ms, sau hoàn tất trả KEY_REUSED. Duplicate cùng payload có bằng chứng US2 (25ms). Đối soát PostgreSQL có 0 sai lệch và 0 tồn âm; không có lượt bị 429 làm sai kết quả.
- T037: 20.005 result hết hạn: lần đầu xóa 20.000 trong 20 batch (266ms), còn 5; hai instance đồng thời bỏ qua row đang lock đến khi release. Giữ nguyên 2.221 movement và 81 result còn hạn. Trigger DELETE gây lỗi giữ dữ liệu; sau khi gỡ fixture, kích hoạt callback cron kế tiếp thực tế phục hồi (không chờ một giờ). Cron mỗi giờ UTC. Chạy chồng chỉ gọi cleanup một lần. Shutdown chờ batch đang bị chặn, xóa 1.000/một batch rồi dừng, còn 1.000 và interrupted=true. Cleanup tiếp theo xóa hết. EXPLAIN dùng index lịch sử và scope result.

## Kiểm chứng vòng đời, quality và contract cuối — PASS

- T031–T033: tạo hướng dẫn inventory Anh–Việt và link index, cùng contract, ownership, retry/cleanup/logging/migration.
- T038: toàn bộ chuỗi migration trên PostgreSQL mới và DB có Product/User/AuthIdentity/RefreshToken; inventory up/down/up thành công, giữ dữ liệu cũ. Logical zero vẫn zero, không backfill. Catalog khớp đủ 13 CHECK, 5 FK RESTRICT, 3 PK, 2 unique constraint và 8 index; xác nhận history DESC, key COLLATE C và delta bigint. CLI `migration:revert`, `migration:run` đều exit 0 trên DB dùng thử mới. Chỉ down khi các bảng inventory rỗng. Rollback ứng dụng production giữ schema; không migration/deploy production.
- T039: root `npm run check`, `npm run build` exit 0 trên API/Gateway/web. API lint/format/typecheck/build cuối cũng exit 0 sau chỉnh controller/Swagger. `npm test` exit 1: **No tests found** (0 match); chưa có coverage suite tự động hiện có, không tính là test pass. Không thêm file test tự động.
- T040: raw header key lặp trả 400 INVALID_IDEMPOTENCY_KEY tại API và qua Gateway. Body GET và offset tính toán không an toàn trả 400. Mọi route inventory từ chối customer; auth/quyền chạy trước input/replay. Chấp nhận đúng 500 code point emoji và SQL char_length là 500. Gateway giữ giá trị replay, Retry-After 1, 429/RATE_LIMIT_EXCEEDED với Retry-After 60 và body 502 hai field hiện tại. Không lưu 429.
- Timeout lock API trực tiếp trả 503 INVENTORY_BUSY/Retry-After 1, không có result trước retry. Race năm giây tại Gateway làm mất response ở lượt cuối; phục hồi cùng key cho đúng một movement. Một lượt Gateway timeout trước đó đã commit khi thả balance lock: lỗi transport không chứng minh rollback, đối soát tìm thấy 201 đã lưu. API ngừng hoạt động cũng trả đúng body 502 hiện có. Không đổi timeout.
- Swagger `/docs`/`/docs-json` qua Gateway: 3 path/4 operation inventory, security/DTO/envelope, key bắt buộc và các status; shape Gateway 429/502 khớp hành vi hiện tại. Postman giữ Auth/Product, bổ sung tồn/nhập/replay/conflict/key lặp/thiếu/sai/xuất/lịch sử, placeholder token/key trống. Replay không tự thay key.
- Logging trên PostgreSQL thật với wrapper quan sát tạm (không test/hook tracked): 10 attempt đủ điều kiện phát đúng 10 event: completed=3 (gồm cached 404), replayed=2, conflict=1, in_progress=1, persistence_failure=1, transient_failure=1, outcome_uncertain=1. Event đã biết sau transaction; mọi event sau release/discard; completed sau xác nhận COMMIT; chưa rõ không phát completed. Replay không tính movement mới. Log không có secret/key/hash/reason/payload/cookie/SQL/connection. Kiểm tra riêng tổng kết count/duration/lỗi cleanup.
- Kiểm tra DB thật bổ sung: items/count của tồn và lịch sử giữ cùng snapshot read-only REPEATABLE READ dù connection khác commit giữa hai query. Fallback đồng hồ SQL tăng timestamp product đúng một microsecond, lịch sử trả movement mới trước. Cleanup xóa fixture đúng ranh giới expiry, giữ fixture hết hạn trong tương lai.
- Audit DB cuối: 0 fixture SQL tạm, 0 sai lệch ledger, 0 tồn âm; 2.236 movement và 98 result còn lưu trước shutdown cuối. Count gồm fixture ceiling/concurrency dùng thử, không phải tồn nghiệp vụ.

## Giới hạn và các lượt kiểm tra sơ bộ đã sửa

Repo chưa có Git HEAD nên không ghi được revision source. Dùng PostgreSQL 17.11 và Redis 7.4 local riêng, không kiểm chứng tải production. Kích hoạt callback cron thực tế để kiểm tra phục hồi lỗi, không chờ một giờ. Mất response dùng proxy mạng tạm; không failure switch lâu dài hoặc file test mới. Fixture đồng hồ lùi chỉ sửa timestamp trên dữ liệu dùng thử.

Đã sửa và chạy lại các kiểm tra sơ bộ của harness thủ công: so sánh thứ tự property JSON, số CHECK (13), Host trong HTTP raw, alias SQL dành riêng và giả định sai rằng mọi Gateway timeout đều rollback. Đây là vấn đề fixture kiểm chứng; các lượt cuối bên trên đã pass. Coverage Jest còn bỏ qua vì chưa có test hiện có. Không commit, publish, deploy hoặc chạy converge.

## Bằng chứng requirement và acceptance

| Requirement | Bằng chứng thực tế |
|---|---|
| FR-001 | US1 và kiểm tra auth/quyền trên mọi route cuối |
| FR-002 | US1 zero sản phẩm cũ/demo/mới; migration zero với dữ liệu có sẵn |
| FR-003 | US2 quantity sai/trần; US3/SC-002 xuất không âm |
| FR-004 | US2 reason; US4 dữ kiện server; SQL 500 code point |
| FR-005 | Rollback INSERT/COMMIT deferred đang await; đối soát COMMIT chưa rõ |
| FR-006 | Nhập lần đầu, mười lượt xuất và concurrency hỗn hợp |
| FR-007 | Không route sửa/xóa; ledger khớp; cleanup giữ movement |
| FR-008 | Phân trang tồn/lịch sử, snapshot đọc và thứ tự microsecond |
| FR-009 | Đọc tồn/lịch sử/nhập/xuất inactive |
| FR-010 | Từ chối field lạ/server-owned và body GET |
| FR-011 | Duplicate khi giữ request gốc: 409 trong 25ms; replay gốc |
| FR-012 | Sửa catalog SKU/name/status chỉ đổi hiển thị; facts giữ nguyên |
| SC-001 | Nhập 10, xuất 3, từ chối 8: tồn 7/hai movement |
| SC-002 | Mười lượt xuất từ năm: năm thành công/năm thiếu tồn/tồn zero |
| SC-003 | Lỗi movement INSERT service await: rollback toàn bộ |
| SC-004 | Từ chối customer/chưa auth/input sai, không ghi |
| SC-005 | Swagger/Postman và hướng dẫn/contract Anh–Việt đồng bộ |
| SC-006 | 409 đang xử lý/Retry-After 1, sau đó replay gốc/một movement |

Cả 12 acceptance scenario US1–US4 có bằng chứng story bên trên. T001–T041 hoàn tất; giữ phạm vi feature và quyết định đã chốt. Không extension hook; bỏ qua hook trước/sau implement. Bước workflow tiếp theo khi được yêu cầu: `$speckit-converge`.

Cleanup cuối: dừng API/Gateway riêng và proxy mạng dùng thử; dừng container PostgreSQL/Redis kiểm chứng, giữ lại để review. Không thay đổi container/dữ liệu dùng chung. Phiên bản Redis chính xác: 7.4.11.

## Implement sau convergence — T042 PASS (2026-10-06)

Đã sửa schema số Swagger Inventory sang `integer`: quantity/balance theo đơn vị nguyên, page/limit/total và statusCode của lỗi. Giữ nguyên validator runtime, bounds/defaults và quyết định nghiệp vụ.

Kiểm tra thủ công `/docs-json` qua Gateway cổng 3004 trả 200, xác nhận 16 thuộc tính integer của body/response và bốn query parameter page/limit. Đã xác nhận quantity 1–1.000.000, tồn kho 0–2.147.483.647, query minimum 1, mặc định page=1/limit=20 và limit maximum 100. Trên container PostgreSQL dùng thử đã lưu từ lượt trước, request RECEIPT qua Gateway có xác thực với quantity 1.5 trả 400 INVALID_INPUT. SQL trước/sau giống nhau: tồn sản phẩm được kiểm tra 2, một movement và tổng 98 result được lưu; không có ghi dữ liệu.

Lint, format check, typecheck và build API đều exit 0. Format check đầu tiên báo định dạng DTO vừa sửa; đã chạy Prettier và lượt kiểm tra cuối pass. Không thêm file test tự động, dependency/config hay migration; không chạy migration. Giới hạn không có test Jest hiện hữu vẫn còn; không chạy lại các ứng dụng không liên quan hoặc toàn bộ ma trận runtime cũ cho thay đổi chỉ ở Swagger. T001–T042 hoàn tất trong cả hai checklist. Không extensions.yml nên bỏ qua hook trước/sau implement. Đã dừng API/Gateway riêng và container PostgreSQL/Redis dùng thử, giữ container để review. Bước tiếp theo khi được yêu cầu: `$speckit-converge`.
