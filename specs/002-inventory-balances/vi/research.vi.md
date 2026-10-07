# Nghiên cứu: Tồn kho một kho

**Ngày**: 2026-10-05 | **Trạng thái**: Hoàn tất nghiên cứu thiết kế (bản ghi thời điểm thiết kế); bằng chứng implement nằm trong [validation.vi.md](validation.vi.md)

Ngôn ngữ: [English](../research.md) | **Tiếng Việt**

## Bằng chứng từ repository

Đã đọc `spec.md`, constitution, `docs/en/conventions/{backend,database,gateway}.md`, entity/DTO/service/options/migration API, proxy Gateway, cleanup job và package scripts. Conventions nằm trong `docs/en/` và `docs/vi/`, không phải `docs/conventions/`.

Repo dùng PostgreSQL 17 (`apps/api/compose.yaml`), NestJS 11, TypeORM 0.3, TypeScript strict và Node.js 24. Product/user dùng UUID; xóa product là ngừng bán. API từ chối field lạ. Gateway proxy `/api/*`, timeout upstream 5 giây. DB đã có statement timeout 5 giây và connection timeout 3 giây. Chưa có module Inventory. Đây là quan sát source, không phải kết quả chạy thực tế.

## R1 — Ghi nguyên tử và phát hiện request trùng ngay

- **Quyết định:** Một transaction `READ COMMITTED`, dùng `pg_try_advisory_xact_lock` cho key idempotency có scope, rồi khóa dòng balance. Chỉ lưu kết quả idempotency đã hoàn tất.
- **Lý do:** Hàm try không chờ khóa key, nên trả ngay `409 IDEMPOTENCY_IN_PROGRESS`. Khóa được giải phóng khi transaction kết thúc; tồn, movement và kết quả replay commit cùng nhau. Đây là kiểm soát đồng thời bên trong transaction PostgreSQL, không phải hệ thống distributed lock bên ngoài; không thêm Redis lock, queue, lease hoặc session lock. Giữ nguyên việc loại trừ hạ tầng distributed lock.
- **Phương án khác:** Unique insert có thể chờ insert chưa commit. Lock timeout rất ngắn có thể nhầm tranh chấp khóa khác thành request trùng. Lưu riêng `PROCESSING` cần phục hồi crash và ngăn owner cũ ghi tiếp. Những cách này phức tạp hơn hoặc làm yếu hành vi đã chốt.
- **Đánh đổi:** ID khóa là số signed 64-bit lấy từ SHA-256 của tuple key có namespace. Va chạm hash có thể trả tạm thời in-progress cho key khác; không thể replay sai kết quả hoặc gộp movement. Unique tuple đầy đủ và so sánh fingerprint mới là căn cứ xác định danh tính request.

Tham khảo [hàm advisory lock PostgreSQL](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS), [khóa transaction/dòng](https://www.postgresql.org/docs/17/explicit-locking.html), và yêu cầu dùng cùng transaction manager trong [TypeORM transactions](https://typeorm.io/docs/advanced-topics/transactions/).

## R2 — Vòng đời key và replay

- **Quyết định:** Scope `(actor_id, operation, key)`, operation `inventory.movement.v1`. Product ID thuộc fingerprint chuẩn hóa, không thuộc scope key. Lưu status/body của `201`, `404 PRODUCT_NOT_FOUND` và `409` xung đột tồn trong 24 giờ kể từ hoàn tất. Replay không gia hạn. Không cache auth/validation, in-progress/key-reuse hoặc lỗi hạ tầng tạm thời.
- **Lý do:** Một admin không vô tình tái sử dụng key cho product khác. Mất response thành công vẫn replay an toàn dù đã có movement mới. Lỗi nghiệp vụ ổn định; muốn thử xuất lại sau khi nhập thêm phải dùng key mới. Mọi replay đều qua auth và kiểm tra quyền hiện tại.
- **Phương án khác:** Scope theo product có thể chấp nhận nhầm key giữa các product; lưu vô hạn tăng dữ liệu; cache `500` cản phục hồi. Tính lại tồn khi replay trái quyết định trả kết quả gốc.

## R3 — Tồn zero và lịch sử

- **Quyết định:** Không có dòng balance nghĩa là tồn 0. Đọc từ products, left join balances. Movement thành công đầu tiên tạo dòng zero trong transaction rồi khóa. Lần xuất đầu thất bại rollback phần khởi tạo bằng savepoint nhưng vẫn commit kết quả lỗi để replay. Không lưu snapshot tên/SKU.
- **Lý do:** Product cũ, mới và demo đều đọc được tồn 0 mà không sửa luồng tạo/seed Product. Lịch sử giữ dữ kiện movement bất biến, join catalog hiện tại.
- **Phương án khác:** Backfill và tích hợp tạo Product tăng phụ thuộc vòng đời; tính tồn từ toàn bộ ledger mỗi lần đọc gây công việc không cần thiết. Snapshot catalog trái clarify.

## R4 — Thứ tự, giới hạn và đọc

- **Quyết định:** Danh sách product theo UUID tăng dần; lịch sử theo `created_at DESC, id DESC`. Gán timestamp sau khi lấy khóa balance bằng thời gian thực DB; nếu đồng hồ trùng hoặc lùi, đảm bảo timestamp lớn hơn movement cuối của product ít nhất một microsecond. Tra movement cuối bằng index lịch sử dưới khóa balance. DB giữ microsecond khi sort; JSON dùng ISO UTC millisecond. Item/count phân trang dùng chung snapshot read-only `REPEATABLE READ`.
- **Lý do:** Timestamp bắt đầu transaction có thể đảo thứ tự request chờ khóa. Timestamp tăng theo product giữ đúng thứ tự ghi nhận; UUID vẫn là khóa sort phụ. Kiểm tra giới hạn trước khi ghi; tổng ledger dùng bigint.
- **Phương án khác:** `now()` là thời điểm bắt đầu transaction; UUID ngẫu nhiên không thể hiện thứ tự ghi nhận. Không cần thêm field sequence.

Tham khảo [hàm thời gian PostgreSQL](https://www.postgresql.org/docs/17/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT).

## R5 — Cleanup, migration và kiểm chứng

- **Quyết định:** Một migration schema mới có down, không backfill hoặc sửa migration cũ. Scheduler API cleanup mỗi giờ UTC, tối đa 20 batch × 1.000 dòng dùng `SKIP LOCKED`; dừng giữa batch khi shutdown. Hết hạn/tái dùng key không phụ thuộc cleanup. Dùng hằng số được ghi rõ, không thêm biến môi trường.
- **Lý do:** Cleanup có giới hạn phục vụ vòng đời retention và dùng hạ tầng sẵn có. Không TTL-delete lịch sử movement. Phải kiểm chứng API và concurrency/rollback trên DB thật; không thêm file test tự động.
- **Phương án khác:** Worker/queue ngoài phạm vi; chỉ hết hạn qua cleanup khiến hệ thống phụ thuộc scheduler; rollback phá hủy history đã có dữ liệu không phù hợp phục hồi production.

## R6 — Sửa sau rà soát: kết quả và kiểm chứng

- **Quyết định:** Phân biệt từ chối chắc chắn/rollback đã xác nhận với mất response/xác nhận COMMIT; kết quả chưa rõ đối chiếu cùng key, giữ atomicity và result gốc nếu đã commit. Kiểm tra map 503 trực tiếp tại API; Gateway có thể trả 502 trước, không đổi timeout.
- **Lý do:** Lỗi transport không chứng minh rollback. Fault injection phải làm SQL service await thất bại trên PostgreSQL dùng thử bằng constraint/trigger tạm; SQL ngoài callback từ console debugger không phải bằng chứng nghiệm thu. Kiểm tra riêng lỗi INSERT movement, INSERT result và lỗi deferred tại COMMIT được await, tách khỏi mất kết nối/xác nhận.
- **Phương án khác:** Giả định mọi 500/502 giữ tồn, bắt Gateway trả 503 trong cuộc đua timeout hoặc gây lỗi debugger service không nhận có thể tạo bằng chứng sai. Không thêm file test tự động hoặc failure switch production lâu dài.
- **Observability:** T016–T017 phát event kết quả đã biết sau transaction, hoặc outcome_uncertain sau discard/release connection không suy đoán kết quả server, bằng logger hiện tại; T040 kiểm chứng count/thời điểm sau commit/phân loại chưa rõ và không lộ secret. Bản Việt nằm trong `vi/`; contract vẫn trong `contracts/`. Đây là sửa tài liệu được cho phép sau analyze, không phải skill run mới hoặc kiểm chứng runtime.

## Các điểm kỹ thuật đã giải quyết

Đã quyết định scope, retention, replay lỗi, processing/retry, schema, khởi tạo zero, khóa, nguyên tử khi lỗi, thứ tự, migration và kiểm chứng. Không đặt cam kết throughput/availability mới: milestone học tập chưa có SLO production hoặc quy mô tải đã thỏa thuận. Đo lường trước khi mở rộng.
