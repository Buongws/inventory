# Lộ trình xây dựng feature

Mỗi buổi 60–90 phút: đọc khái niệm → tự code một luồng → thử trường hợp lỗi → giải thích lại quyết định. Ước lượng 20–28 buổi, điều chỉnh theo mức quen NestJS. Nếu phỏng vấn gần: ưu tiên M1, M2, M3 và phần chống webhook duplicate của M5.

| Mốc | Phạm vi / API dự kiến | Điều kiện hoàn thành | Buổi |
|---|---|---|---|
| M0 — nền tảng | Repo, Compose, health, Swagger, Postman | Build/test pass; khi Docker chạy, readiness 200 | Đã cấu hình |
| M1 — auth | POST /auth/register, /login, /refresh, /logout; GET /auth/me | Hash mật khẩu; email unique; JWT hết hạn bị từ chối; refresh rotation; customer không gọi API admin | 4–5 |
| M2 — catalog & kho | GET /products, /products/:id; POST/PATCH /products; POST /inventory/:productId/adjustments; GET /inventory/:productId/movements | SKU unique; pagination có giới hạn; admin mới sửa; tồn không âm; mọi điều chỉnh có lịch sử | 4–5 |
| M3 — đơn hàng | POST /orders; GET /orders, /orders/:id; POST /orders/:id/cancel | Giá lấy từ DB; lưu snapshot; giữ tồn nguyên tử; rollback đủ; chỉ chủ đơn/admin được xem; retry không tạo hai đơn | 5–6 |
| M4 — cache | Cache GET /products/:id bằng Redis, TTL 60s | Cache hit/miss đo được; sửa sản phẩm thì invalidation sau commit; Redis hỏng đọc DB được; không dùng cache quyết định tồn | 2–3 |
| M5 — thanh toán giả lập | POST /webhooks/payments; job hết hạn đơn | Verify chữ ký; duplicate event chỉ tác động một lần; sai amount bị từ chối; cancel/payment đồng thời không trừ/hoàn tồn hai lần | 3–4 |
| M6 — SQL & hoàn thiện | Index, EXPLAIN ANALYZE, log request, giới hạn login | Có trước/sau query plan; test tích hợp PostgreSQL; Postman happy/error flows; CI; README demo | 2–3 |

## Checklist từng milestone

- [ ] Liệt kê business rules và status code trước khi viết controller.
- [ ] DTO validate input; service xử lý nghiệp vụ; không nhét transaction vào controller.
- [ ] Migration có constraint và index phù hợp; không dùng synchronize.
- [ ] Test happy path + lỗi quyền + lỗi dữ liệu + xung đột nếu có.
- [ ] Swagger và Postman khớp API thực tế, không lưu mật khẩu/token thật vào Git.
- [ ] Ghi một đoạn “tại sao chọn cách này, tradeoff là gì”.

## Bài test nghiệp vụ quan trọng

1. Kho có 5 sản phẩm, 10 request cùng đặt 1: đúng 5 request thành công, available cuối bằng 0.
2. Đơn có 2 sản phẩm, sản phẩm thứ hai hết hàng: sản phẩm thứ nhất không bị giữ tồn sau rollback.
3. Gửi cùng idempotency key và payload hai lần: cùng một đơn; khác payload: 409.
4. Gửi cùng webhook hai lần và hai event thanh toán cho cùng đơn: chỉ trừ tồn một lần.
5. Thanh toán cùng lúc hủy/hết hạn: chỉ một transition thắng, số tồn vẫn đúng.
6. Customer A truy cập đơn B: từ chối, dù đoán đúng UUID.
7. Refresh token đã rotate được dùng lại: từ chối và thu hồi token family theo chính sách.
8. Redis ngừng hoạt động: đọc catalog vẫn được từ DB; readiness hiện tại trả 503 theo chính sách yêu cầu cả hai dependency.

Các bài concurrency cần integration test với PostgreSQL thật; mock repository không chứng minh được tính đúng của lock/transaction. Khi thêm cache fail-open ở M4, cân nhắc đổi readiness để Redis chỉ là degraded dependency.

## Mở rộng sau MVP

Purchase orders cho nhà cung cấp, nhận hàng từng phần, nhiều kho, chuyển kho, outbox và queue. Chỉ thêm khi luồng một kho đã đúng và giải thích được.
