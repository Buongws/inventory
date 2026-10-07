# Contract API danh sách Inventory

## GET /api/v1/inventory

FE dùng shared Axios→Gateway3004→API3001. Giữ ADMIN/auth, GET body rejection/error envelope.

| Query | Default | Contract |
| --- | --- | --- |
| page | 1 | positive integer/safe offset hiện có |
| limit | 10 | integer1–100; FE10/20/50/100 |
| q | bỏ | scalar trim, max200 Unicode code points, substring literal name OR SKU không phân biệt hoa thường |
| status | bỏ | ACTIVE/INACTIVE |
| createdFrom | bỏ | YYYY-MM-DD ngày Gregorian thật năm0001–9999 |
| createdTo | bỏ | tương tự |

Unknown/repeated/array scalar/status sai/q dài/date sai/range đảo:400 INVALID_INPUT. q toàn whitespace không giới hạn; date gửi rỗng không hợp lệ. Không sửa/đảo range.

Các điều kiện AND. From `>=` đầu ngày UTC+7; To `<` đầu ngày kế tiếp UTC+7; thiếu bound không giới hạn. Backend chuyển UTC không phụ thuộc timezone máy.

Ví dụ `/api/v1/inventory?page=1&limit=10&q=Adapter&status=ACTIVE&createdFrom=2026-10-07&createdTo=2026-10-07`: Product.createdAt trong `[2026-10-06T17:00:00Z,2026-10-07T17:00:00Z)`.

Giữ envelope items/page/limit/total và stock item. total toàn catalog sau lọc trước pagination; items cùng predicate/snapshot. UUID ASC/stock0 giữ. Page ngoài phạm vi trả items rỗng và total sau lọc; không clamp. `%`, `_`, `!` literal.

## Tương thích

Chỉ omitted limit của endpoint này→10; movement history vẫn20, không nhận filter mới. Product defaults/detail/auth/refresh/POST/idempotency/Gateway giữ nguyên. Update Swagger DTO/list; không endpoint/schema mới.
