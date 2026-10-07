# Thực hành database với dự án Inventory

Tài liệu này gắn các câu hỏi phỏng vấn với NestJS và PostgreSQL của dự án. Hiện DB mới có `users`, `auth_identities`, `refresh_tokens` và `rate_limit_policies`. Bảng sản phẩm, tồn kho và đơn hàng **chưa triển khai**. Hãy chạy bài tập ghi dữ liệu trên DB local trong schema `learning`, không chạy trên DB dùng chung.

## Học theo thứ tự nào?

1. **Dữ liệu auth đã có:** primary key, foreign key, unique constraint, chuẩn hóa, index, transaction và replay của refresh token.
2. **Feature tiếp theo — sản phẩm:** SKU unique, tìm kiếm, phân trang và đọc execution plan.
3. **Tồn kho và đơn hàng:** nhiều người mua cùng lúc, khóa dòng, isolation, giữ chỗ hàng và idempotency.
4. **Sau cùng:** nhập hàng loạt, outbox/message queue, partition, replica và sharding nếu có bài toán quy mô thực tế.

Khi luyện phỏng vấn, mỗi câu nên trả lời theo bốn ý: **khái niệm → chỗ áp dụng trong repo → lỗi có thể xảy ra → cách đo hoặc kiểm chứng**. Phân biệt rõ phần đã code với phần mới có spec.

## Bài 1: nhìn schema và đo câu SQL đang có

Kết nối DBeaver tới PostgreSQL local theo `apps/api/.env` (port local đang tài liệu hóa là `55433`). Mở các bảng `users`, `auth_identities`, `refresh_tokens`; tìm primary key, foreign key và các index/unique constraint. Google identity dùng cặp `provider + subject`, không dùng email làm khóa định danh.

Chạy các câu **chỉ đọc**:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'auth_identities', 'refresh_tokens')
ORDER BY tablename, indexname;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM refresh_tokens
WHERE expires_at <= now()
ORDER BY expires_at
LIMIT 1000;
```

Nhìn `actual rows`, `loops`, `Execution Time`, `Buffers: shared hit/read`. So với query xóa token trong `apps/api/src/auth/refresh-token-cleanup.service.ts`. Nếu bảng chỉ vài dòng mà PostgreSQL chọn `Seq Scan`, điều đó chưa chứng minh query chậm: đọc cả bảng nhỏ có thể rẻ hơn đi qua index. `EXPLAIN ANALYZE` **thực sự chạy** lệnh; nếu thử với `UPDATE/DELETE`, dùng `BEGIN` rồi `ROLLBACK`. Đọc thêm [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html).

## Bài 2: hai người cùng mua hàng cuối

Tạo bảng học riêng ở DB local:

```sql
CREATE SCHEMA IF NOT EXISTS learning;
CREATE TABLE IF NOT EXISTS learning.inventory_balance (
  product_id integer PRIMARY KEY,
  available integer NOT NULL CHECK (available >= 0)
);
INSERT INTO learning.inventory_balance (product_id, available)
VALUES (1, 5)
ON CONFLICT (product_id) DO UPDATE SET available = 5;
```

Mở **hai kết nối DBeaver riêng**. Ở cửa sổ A, chạy `BEGIN;` rồi chạy:

```sql
UPDATE learning.inventory_balance
SET available = available - 4
WHERE product_id = 1 AND available >= 4
RETURNING available;
```

Đừng commit A ngay. Ở cửa sổ B, chạy `BEGIN;` rồi chạy cùng câu `UPDATE`: B sẽ chờ khóa dòng của A. Sau khi A `COMMIT;`, B tiếp tục và trả **0 dòng**, vì còn 1 sản phẩm, không đủ bán 4. Commit B; `available` vẫn là `1`, không âm. Muốn lặp lại, reset `available = 5`. Học xong xóa dữ liệu thử bằng `DROP SCHEMA learning CASCADE;`.

Đây là khác biệt cần nói rõ:

- **Transaction/Atomicity:** một nhóm thay đổi cùng commit hoặc cùng rollback. Ví dụ đặt hàng phải tạo đơn và trừ/giữ tồn kho cùng transaction; không được chỉ thành công một nửa.
- **Isolation:** quyết định các transaction đang chạy đồng thời nhìn thấy gì. PostgreSQL mặc định dùng `Read Committed`; mỗi câu SQL thấy dữ liệu đã commit trước khi câu đó bắt đầu. `Repeatable Read` giữ snapshot ổn định hơn; `Serializable` có thể từ chối một transaction xung đột và ứng dụng cần retry. PostgreSQL xử lý `Read Uncommitted` như `Read Committed`. [Tài liệu PostgreSQL](https://www.postgresql.org/docs/17/transaction-iso.html).
- **Locking:** `UPDATE` trên cùng dòng khiến request thứ hai phải chờ. `SELECT ... FOR UPDATE` chủ động khóa dòng trước khi quyết định. Isolation cao hơn không thay thế điều kiện `available >= quantity` và ràng buộc `CHECK`. [Tài liệu row lock](https://www.postgresql.org/docs/17/explicit-locking.html).

Liên hệ code thật: `AuthService.rotate()` khóa dòng refresh token và dùng advisory lock theo `family_id` để hai request cùng family không xử lý chồng nhau. Khi phát hiện token cũ bị dùng lại, service cập nhật cả family **trong transaction**, để transaction commit xong **mới** trả HTTP `401`. Nếu ném exception trong callback transaction, cập nhật thu hồi sẽ rollback. Cron dọn token dùng `FOR UPDATE SKIP LOCKED` để các lần xử lý batch không giẫm lên nhau; mục đích khác với khóa khi refresh.

## Các câu phỏng vấn bạn đã sưu tầm

| Câu hỏi | Cách hiểu và bài thực hành với dự án |
|---|---|
| Tối ưu SQL thế nào? Biết query nào chậm? | Đo latency endpoint và số query; chạy `EXPLAIN (ANALYZE, BUFFERS)`, so estimated/actual rows, scan, sort, buffers. Tìm N+1, thiếu filter/pagination trước khi thêm index. Sau này có thể bật `pg_stat_statements` để xem query tốn tổng thời gian nhiều. |
| JOIN có luôn nhanh hơn subquery? | **Không.** `EXISTS` phù hợp khi chỉ hỏi “có bản ghi không” và không nhân dòng `users`. JOIN cần khi lấy cột từ hai bảng. PostgreSQL có thể biến đổi subquery khi lập plan; so kết quả và plan thực tế. |
| Clustered index nhanh hơn non-clustered? | Câu này phụ thuộc DBMS. PostgreSQL thường lưu row trong heap; primary key có index nhưng không làm bảng luôn sắp vật lý theo PK. `CLUSTER` sắp lại bảng tại một thời điểm, các lần ghi sau không tự giữ thứ tự đó. |
| Composite index và quy tắc bên trái? | Với danh sách sản phẩm tương lai, thử index khớp `status` và thứ tự `created_at DESC, id DESC`, rồi đo. SKU unique có index riêng. Index có chi phí ghi và dung lượng, không tạo theo cảm giác. |
| Stored procedure và function? | PostgreSQL function gọi qua `SELECT` và trả giá trị; procedure gọi bằng `CALL`, có khả năng quản lý transaction trong một số điều kiện gọi. Với project này, NestJS service đang điều phối nghiệp vụ và transaction; chưa cần chuyển sang procedure. |
| Quản lý transaction? | Nói về `AuthService.rotate()` hiện có, sau đó thiết kế reservation tồn kho: conditional update + ghi order/order item trong **cùng** transaction manager. Không gọi HTTP/Google/MQ bên trong transaction DB. |
| Insert hàng triệu dòng, vì sao `insertAll` chậm? | Thử bảng movement giả: `COPY` cho dữ liệu bulk lớn; nếu không dùng được, insert nhiều dòng theo batch có giới hạn rồi benchmark. Chậm có thể do round trip, ORM xử lý từng row, index/constraint, WAL, transaction quá lớn. |
| MQ và consistency? | Sau khi có orders, ghi order + outbox event cùng transaction. Worker gửi event bất đồng bộ; consumer dùng event ID unique/idempotency, retry và quan sát lỗi. **Trừ/giữ hàng phải đúng ngay trong PostgreSQL**, không chờ queue đồng bộ tồn kho. |
| DI có lợi ích gì? | `AuthService` nhận repository, `DataSource`, `ConfigService` qua constructor. Nest tạo và cấp dependency, giúp tách khởi tạo khỏi nghiệp vụ và thay provider khi cần; DI không trực tiếp tối ưu SQL. |

Các chủ đề trong ảnh còn lại: học **1NF–3NF, ACID, isolation, join, index và locking trước**. CTE, `LIKE`/full-text search học khi làm Product search. Partition, replica, sharding, CAP/BASE và MongoDB học sau khi đã giải thích được vì sao PostgreSQL hiện đủ cho bài toán; không cần đưa tất cả vào project chỉ để có từ khóa phỏng vấn.

Nguồn đọc chính: [EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html), [indexes](https://www.postgresql.org/docs/17/indexes.html), [subquery/EXISTS](https://www.postgresql.org/docs/17/functions-subquery.html), [CLUSTER](https://www.postgresql.org/docs/17/sql-cluster.html), [bulk load/COPY](https://www.postgresql.org/docs/17/populate.html), [function](https://www.postgresql.org/docs/17/sql-createfunction.html) và [procedure](https://www.postgresql.org/docs/17/sql-createprocedure.html).

## Mẫu trả lời phỏng vấn ngắn

> “Em đo endpoint trước rồi xem SQL và `EXPLAIN (ANALYZE, BUFFERS)` để tìm điểm chậm. Với tồn kho, em dùng transaction PostgreSQL và câu update có điều kiện `available >= quantity`, nên hai người mua cùng lúc không bán vượt tồn. Ở refresh token, em từng gặp lỗi rollback thao tác thu hồi family khi ném `401` trong transaction; em sửa bằng cách commit thay đổi bảo mật trước rồi mới trả lỗi. Em chọn index hoặc message queue khi đã rõ workload và yêu cầu consistency.”
