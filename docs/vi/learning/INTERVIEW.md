# 15 câu ôn gắn với repo

Bài thực hành SQL, transaction và isolation: [Thực hành database với dự án Inventory](DATABASE_PRACTICE.md).

Danh sách ban đầu có 14 câu. Câu 15 bổ sung Redis cache/invalidation, đúng stack dự án.

| # | Câu hỏi | Bài thực hành / điểm cần giải thích |
|---|---|---|
| 1 | Node.js Event Loop? | I/O bất đồng bộ khác CPU blocking; thử CPU loop rồi đo health latency; timer không cam kết chạy đúng thời điểm |
| 2 | async/await? | Promise, await nhường execution của hàm; try/catch xử lý rejection; không biến CPU work thành nonblocking |
| 3 | Promise.all dùng khi nào? | I/O độc lập chạy đồng thời; reject sớm không cancel tác vụ khác; readiness dùng allSettled để thu đủ trạng thái |
| 4 | Controller/Service/Module? | Controller nhận HTTP; service giữ nghiệp vụ; module khai báo và export dependency |
| 5 | DI là gì? | Nest cấp DataSource/RedisService qua constructor; thay provider khi test |
| 6 | Middleware/Guard/Interceptor/Pipe? | Request ID / quyền / timing / validation; trình bày lifecycle request và response |
| 7 | REST design? | Resource, HTTP method/status, pagination, DTO, version; POST không tự có idempotency |
| 8 | Authentication/Authorization? | Xác định ai gọi khác với họ được làm gì; ownership ngoài role |
| 9 | JWT? | Header/payload/signature; ký không phải mã hóa; verify và rotation/revocation tradeoff |
| 10 | Index? | B-tree, composite order, selectivity; tăng tốc đọc đổi lấy chi phí ghi và dung lượng |
| 11 | Slow SQL? | Đo query plan/buffers, row estimates, N+1, index, pagination trước khi thêm cache |
| 12 | Transaction/ACID? | Demo rollback đơn nhiều item; atomicity/consistency/isolation/durability; isolation không tự giải mọi race |
| 13 | Race update? | 10 người mua 5 sản phẩm; row lock hoặc conditional UPDATE, constraint, deadlock retry |
| 14 | Duplicate webhook? | Unique event + transaction + order state guard; phân biệt retry cùng event và event khác cho cùng payment |
| 15 | Redis cache/invalidation? | Cache-aside, TTL, invalidation sau commit, stale race, fallback và stampede |

Mỗi câu luyện trả lời 60–90 giây theo: định nghĩa → ví dụ trong repo → lỗi thường gặp → bằng chứng test/đo đạc. Học theo thứ tự 4–9 → 12–14 → 10–11/15 → 1–3 nếu cần hoàn thành demo sớm.
