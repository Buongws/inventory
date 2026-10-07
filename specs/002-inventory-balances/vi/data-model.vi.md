# Mô hình dữ liệu: Tồn kho một kho

[Trạng thái triển khai](validation.vi.md): đã triển khai và kiểm chứng trên PostgreSQL dùng thử; nội dung thiết kế/lượt plan gốc được giữ làm lịch sử.

Ngôn ngữ: [English](../data-model.md) | **Tiếng Việt**

Schema đã triển khai, áp dụng và kiểm chứng trên database dùng thử; xem [validation.vi.md](validation.vi.md). Property TypeScript phải map tường minh tới column snake_case. Timestamp mới dùng `timestamptz`; ID mới dùng `gen_random_uuid()`.

## Balance — `inventory_balances`

| Column / property | Kiểu | Quy tắc |
|---|---|---|
| `product_id` / productId | uuid | PK; FK products.id, ON DELETE RESTRICT |
| `on_hand_qty` / onHandQty | integer | NOT NULL DEFAULT 0; CHECK 0–2.147.483.647 |
| `updated_at` / updatedAt | timestamptz | NOT NULL; thời gian thực do server lấy từ DB |

Product có zero hoặc một dòng balance vật lý, tương ứng một balance logic. Không có dòng nghĩa là tồn 0. Đọc products LEFT JOIN balances, COALESCE về 0; đọc không tạo dòng. PK phục vụ join và khóa theo product, không cần index phụ.

## Movement — `stock_movements`

| Column / property | Kiểu | Quy tắc |
|---|---|---|
| `id` / id | uuid | PK, server sinh |
| `product_id` / productId | uuid | NOT NULL; FK products.id, ON DELETE RESTRICT |
| `type` / type | varchar(7) | NOT NULL; CHECK RECEIPT hoặc ISSUE |
| `quantity` / quantity | integer | NOT NULL; CHECK 1–1.000.000 |
| `balance_before` / balanceBefore | integer | NOT NULL; CHECK không âm |
| `balance_after` / balanceAfter | integer | NOT NULL; CHECK không âm |
| `actor_id` / actorId | uuid | NOT NULL; FK users.id, ON DELETE RESTRICT |
| `reason` / reason | varchar(500) | NOT NULL; API trim, dài 1–500 Unicode code point |
| `created_at` / createdAt | timestamptz | NOT NULL; gán sau khi khóa balance |

CHECK có tên cho type, quantity, balance không âm, `char_length(reason) BETWEEN 1 AND 500`, `reason = btrim(reason)` và btrim không rỗng. API dùng JavaScript trim để xử lý whitespace Unicode trước validation. CHECK delta dùng bigint casts: RECEIPT → after = before + quantity; ISSUE → after = before − quantity. Kiểu integer cũng giới hạn trần tồn. Tên dự kiến: `ck_stock_movements_type`, `ck_stock_movements_quantity`, `ck_stock_movements_balances`, `ck_stock_movements_reason`, `ck_stock_movements_delta`.

Index `idx_stock_movements_product_created_id (product_id, created_at DESC, id DESC)` cho lịch sử/timestamp cuối; `idx_stock_movements_actor (actor_id)` cho FK. Không có snapshot tên/SKU hoặc tên actor. Không có API sửa/xóa movement; CHECK không ngăn SQL trực tiếp của người có quyền. Không tuyên bố audit bất biến ở mọi đường ghi DB.

Đẳng thức ledger giữa nhiều dòng là invariant của transaction ứng dụng, không phải CHECK một dòng: `COALESCE(balance,0) = SUM(nhập − xuất)` dùng bigint. Không thêm trigger hoặc counter Redis.

## Kết quả request — `inventory_idempotency_results`

| Column / property | Kiểu | Quy tắc |
|---|---|---|
| `id` / id | uuid | PK, server sinh |
| `actor_id` / actorId | uuid | NOT NULL; FK users.id, ON DELETE RESTRICT |
| `operation` / operation | varchar(32) | NOT NULL; CHECK inventory.movement.v1 |
| `key` / key | varchar(128), COLLATE C | NOT NULL; ASCII phân biệt hoa/thường |
| `request_product_id` / requestProductId | uuid | NOT NULL; không FK product để lưu/replay 404 product không tồn tại |
| `request_hash` / requestHash | char(64) | NOT NULL; CHECK SHA-256 hex chữ thường |
| `http_status` / httpStatus | smallint | NOT NULL; CHECK 201, 404 hoặc 409 |
| `response_body` / responseBody | jsonb | NOT NULL; CHECK object JSON, không token/cookie |
| `movement_id` / movementId | uuid, nullable | FK stock_movements.id, ON DELETE RESTRICT; unique nếu khác null |
| `completed_at` / completedAt | timestamptz | NOT NULL; thời gian thực DB khi chuẩn bị kết quả |
| `expires_at` / expiresAt | timestamptz | NOT NULL; CHECK completed_at + interval '24 hours' |

Unique `uq_inventory_idempotency_scope (actor_id, operation, key)` xác định key đầy đủ. Unique `uq_inventory_idempotency_movement (movement_id)` ngăn nhiều kết quả đang lưu trỏ cùng movement. Index `idx_inventory_idempotency_expiry (expires_at, id)` phục vụ cleanup. CHECK key `^[A-Za-z0-9._:-]{1,128}$`, hash `^[0-9a-f]{64}$`, movement_id khác null khi và chỉ khi status 201. Ứng dụng kiểm tra mã lỗi 404/409 cho phép và tính nhất quán response trước insert; SQL không kiểm tra toàn bộ JSON contract.

Xóa result hết hạn không xóa movement. Retention result không làm giảm retention ledger. Không có PROCESSING bền vững: chưa có → transaction giữ quyền xử lý → có result khi commit; rollback trở lại chưa có, hoặc khôi phục result hết hạn bị xóa trong transaction.

## Transaction và concurrency

1. Auth/quyền và validation key/UUID/body trước transaction. Fingerprint là SHA-256 UTF-8 của JSON array cố định `["inventory.movement.v1", lowerCaseProductUuid, type, quantity, trimmedReason]`. Không trim/lowercase key.
2. Mở `READ COMMITTED` trên cùng transaction manager TypeORM. ID khóa lấy tám byte đầu SHA-256 của JSON array `["inventory-idempotency-lock-v1", actorUuid, "inventory.movement.v1", key]`, đọc signed big-endian 64-bit và bind chuỗi thập phân; không chuyển thành JavaScript Number.
3. Gọi `pg_try_advisory_xact_lock` một lần. False → rollback, trả ngay `409 IDEMPOTENCY_IN_PROGRESS`, `Retry-After: 1`. Đây là khóa transaction PostgreSQL, không phải dịch vụ distributed lock ngoài DB. Unique key đầy đủ vẫn quyết định danh tính kể cả khi hash khóa va chạm.
4. Dưới khóa key, đọc result đúng scope và so expiry với thời gian thực DB lúc lookup. Chưa hết hạn + hash khớp → kết thúc transaction rồi trả status/body cũ. Hash khác → rollback, `409 IDEMPOTENCY_KEY_REUSED`. Hết hạn → xóa trong transaction, coi là lệnh mới kể cả khi payload khác.
5. Đọc product bất kể status. Không tồn tại → chuẩn bị `404 PRODUCT_NOT_FOUND` có replay, commit chỉ result rồi trả lỗi.
6. Tạo savepoint trước khởi tạo balance. Insert zero `ON CONFLICT DO NOTHING`, rồi SELECT balance FOR UPDATE. Các lần ghi đầu đồng thời được tuần tự hóa bởi PK; key khác cùng product có thể chờ khóa balance. Đọc thường không chờ nhờ MVCC.
7. Tính before/after bằng số nguyên an toàn. Xuất quá tồn hoặc nhập quá trần → rollback tới savepoint, gồm dòng zero mới; lưu result 409 và commit. Không throw HTTP exception bên trong callback transaction.
8. Thành công: update balance, insert movement, serialize body cuối, insert result 201, commit. Timestamp movement là giá trị lớn hơn giữa `clock_timestamp()` và timestamp movement cuối của product + một microsecond, dưới khóa balance. Tính toàn bộ biểu thức timestamp trong SQL để chuyển đổi JavaScript Date không làm mất microsecond. Dùng index lịch sử; chưa có movement thì dùng thời gian thực. Có thể dùng cùng timestamp cho balance; completed_at lấy sau đó.
9. Chỉ trả sau khi xác nhận commit. Lỗi DB ở bất kỳ lần ghi rollback cả balance/movement/result và việc xóa result hết hạn. QueryRunner nếu dùng phải release trong finally. Không dùng repository ngoài transaction, Redis hoặc network trong transaction.

Thứ tự khóa cố định: key → result → product → khởi tạo/khóa balance → movement/result. Không trả HTTP khi transaction còn mở. PostgreSQL giải phóng khóa khi transaction/session kết thúc, gồm phục hồi crash; trước khi DB phát hiện connection chết, retry vẫn có thể gặp in-progress. Đặt transaction-local `idle_in_transaction_session_timeout = '5s'`, giữ statement timeout hiện tại và tránh pause/network trong transaction thường. Deadlock/lock/statement timeout (`40P01`, `55P03`, `57014`) rollback, trả `503 INVENTORY_BUSY`, `Retry-After: 1`; lỗi lưu trữ bất ngờ trả 500 đã lọc thông tin. Không tự retry trong service; caller retry cùng key.



Phân biệt từ chối chắc chắn/rollback đã xác nhận với mất xác nhận COMMIT. Khi chưa rõ kết quả, cả ba lần ghi có thể đã commit; giữ result gốc và đối chiếu cùng key, không khẳng định tồn không đổi. Lỗi transport không phải result mới để lưu. Kiểm tra map timeout trực tiếp port API 3001; Gateway 3004 có thể trả 502 trước khi nhận 503 API. Fault injection hoặc lỗi Gateway không thay thế bằng chứng DB về rollback/commit.

## Đọc và vòng đời

Đọc một tồn dùng một câu product LEFT JOIN balance. Phân trang tồn/lịch sử dùng snapshot read-only `REPEATABLE READ` chung cho items/count, không giữ snapshot giữa các HTTP page. Product sort id ASC; lịch sử created_at DESC, id DESC. Product chưa có history trả items rỗng, total 0; không tồn tại trả 404. Tên/SKU/status trong history lấy catalog hiện tại. Sort giữ microsecond DB dù JSON chỉ hiển thị millisecond.

Inactive/active lại và sửa catalog giữ balance/history. Hiện không có xóa cứng product. FK chặn xóa cứng product/user có tham chiếu trong tương lai; không thiết kế xóa tài khoản/product ở feature này. Tạo hoặc seed product không cần ghi inventory.

## Migration, rollout và rollback

Tạo migration mới `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`, timestamp lớn hơn migration hiện tại. Up tạo balances → movements → results, CHECK/FK/index trong transaction migration. Không backfill, tạo movement hoặc chuyển đổi timestamp cũ. Product cũ có tồn logic 0; synchronize vẫn false.

Chạy migration trước deploy module. Discovery DB đã tìm `*.entity`/migration; implement sẽ đăng ký module trong AppModule. API cũ có thể dùng cùng schema có bảng mới chưa sử dụng. Kiểm chứng DB mới và DB hiện có đã migrate. Down xóa results → movements → balances cùng index/constraint. Down phá hủy dữ liệu inventory, chỉ dùng DB dùng thử hoặc bảng rỗng; production rollback ứng dụng giữ schema, hoặc migration forward được review sau backup. Không tùy tiện down khi đã có movement thật. Chưa chạy migration trong plan.
