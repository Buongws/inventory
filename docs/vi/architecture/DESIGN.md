# Thiết kế nghiệp vụ dự kiến

Đây là thiết kế để triển khai dần, chưa phải schema/API đang có trong repo.

## Quyết định nền tảng

Một modular monolith NestJS, REST, PostgreSQL là nguồn dữ liệu chuẩn. TypeORM hỗ trợ DI/entity và vẫn cho viết SQL để luyện locking/query plan. Redis chỉ tăng tốc đọc catalog. Tiền VND dùng số nguyên (DB bigint, serialize thành string nếu vượt giới hạn số an toàn JS); không tính tiền bằng float. Thời gian dùng timestamptz/UTC.

Role: customer đặt/xem/hủy đơn của mình; admin quản lý catalog và điều chỉnh kho. Register luôn tạo customer, không cho client truyền role. Tạo admin bằng seed chủ động ở M1.

## Bảng theo milestone

| Bảng | Cột/chỉ mục chính |
|---|---|
| users | UUID PK, normalized email UNIQUE, password_hash, role, created_at |
| refresh_tokens | user_id FK, token_hash UNIQUE, family_id, expires_at, revoked_at |
| products | UUID PK, sku UNIQUE, name, price_vnd CHECK >= 0, is_active |
| inventory | product_id PK/FK, on_hand, reserved; CHECK on_hand >= reserved AND reserved >= 0 |
| inventory_movements | product_id FK, order_id nullable FK, delta_on_hand, delta_reserved, reason, actor_id, created_at |
| orders | UUID PK, user_id FK, status, total_vnd, expires_at, created_at; index (user_id, created_at) |
| order_items | order_id FK, product_id FK, sku/name/price snapshot, quantity CHECK > 0; UNIQUE(order_id, product_id) |
| idempotency_keys | user_id, key, request_hash, order_id; UNIQUE(user_id, key), tạo trong transaction đặt đơn |
| payment_events | provider, event_id, order_id FK, payload_hash, processed_at; UNIQUE(provider, event_id) |

Không xóa cứng sản phẩm đã có đơn; dùng is_active. Movement là nhật ký audit, không cập nhật lại các dòng cũ.

## Tồn kho và transaction

`available = on_hand - reserved`.

Tạo đơn PENDING: gộp các dòng trùng product_id, giới hạn số dòng, khóa sản phẩm và inventory theo product_id tăng dần để giảm deadlock. Kiểm tra active/giá/available trong transaction, tăng reserved, tạo order/items/movements/idempotency record, rồi commit. Có thể dùng UPDATE có điều kiện `on_hand - reserved >= quantity` và kiểm tra affected rows; phải giữ tất cả dòng trong cùng transaction. Snapshot giá phải được lấy nhất quán với quy tắc thay đổi giá.

Thanh toán: khóa order; chỉ PENDING mới chuyển PAID, giảm on_hand và reserved cùng lượng. Hủy hoặc hết hạn: chỉ PENDING chuyển CANCELLED/EXPIRED, giảm reserved. Khóa inventory cùng thứ tự trên mọi luồng. Admin giảm on_hand không được thấp hơn reserved. Khi deadlock/serialization failure, retry có giới hạn cho toàn transaction; không retry mù mọi lỗi.

Không gọi dịch vụ ngoài hoặc gửi email trong transaction. TTL Redis không phải nguồn quyết định hết hạn đơn: dùng expires_at trong PostgreSQL, job chạy lại an toàn và dùng lock/transition có điều kiện.

## Idempotency và webhook

POST /orders nhận Idempotency-Key theo user; fingerprint bao gồm payload canonical. Unique constraint xử lý request đồng thời; sau conflict rollback, đọc kết quả đã commit bằng transaction mới. Cùng key khác payload trả 409.

Webhook cần chữ ký HMAC trên raw body, kiểm tra timestamp theo hợp đồng provider; không tin orderId/amount từ client nếu chưa verify. Trong một transaction: ghi event unique, khóa order, so khớp amount/currency và payment reference, transition và cập nhật tồn. Ghi processed chỉ khi toàn bộ thành công. Event trùng đã xử lý trả 2xx; lỗi tạm thời trả 5xx để retry. Event khác ID nhưng cùng đơn PAID cũng không trừ tồn lần nữa. Thanh toán đến sau CANCELLED/EXPIRED được ghi nhận để xử lý hoàn tiền giả lập, không tự mở lại đơn.

## Auth và API

Argon2id hash password; access JWT ngắn hạn, verify signature/algorithm/issuer/audience/exp. Refresh token ngẫu nhiên chỉ lưu hash, rotate trong transaction; logout revoke refresh, access JWT cũ còn hiệu lực đến khi hết hạn trừ khi bổ sung denylist. Không trả password_hash/token_hash trong response. Guard xác thực và kiểm tra role; service kiểm tra ownership.

DTO/Pipe cho dữ liệu đầu vào; Guard cho auth; Interceptor cho timing/response concern; Middleware cho request ID. Filter chỉ thêm khi cần chuẩn hóa error, không tạo abstraction trước nhu cầu.

Dự kiến status: 201 tạo mới, 200 đọc/cập nhật, 204 logout, 400 validation, 401 chưa xác thực, 403 thiếu quyền, 404 không tồn tại, 409 trùng SKU/email hoặc xung đột tồn/trạng thái, 429 rate limit. Pagination mặc định 20, tối đa 100, sort ổn định bằng created_at + id.

## Cache và SQL

Cache-aside key `products:v1:<id>`, TTL 60s; invalidation sau DB commit. Race giữa reader ghi cache cũ và writer invalidate có thể gây stale tối đa TTL; chấp nhận ở catalog MVP, ghi rõ tradeoff. Giá khi checkout và tồn luôn đọc DB. Redis lỗi phải có timeout và fallback, tránh log dữ liệu nhạy cảm.

Tạo index theo query thực tế; đo bằng EXPLAIN (ANALYZE, BUFFERS) với dữ liệu seed đủ lớn. ANALYZE thực thi query, cẩn thận với lệnh ghi. Tránh N+1, SELECT *, pagination OFFSET rất sâu và đặt index cho mọi cột vô điều kiện.
