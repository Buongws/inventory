# Database Convention

- PostgreSQL là nguồn dữ liệu bền vững, TypeORM `synchronize: false`.
- Table và column dùng snake_case (`refresh_tokens`, `created_at`); property TypeScript dùng camelCase (`createdAt`). Khai báo `name` tường minh khi khác tên cột, kể cả CreateDateColumn/UpdateDateColumn và JoinColumn.
- Constraint/index đặt tên theo mục đích: `uq_users_email`, `fk_refresh_token_user`, `idx_refresh_tokens_expires_at`.
- Bảng mới dùng UUID cho ID và `timestamptz` cho thời điểm; API trả ISO 8601 UTC. Tiền VND theo product spec lưu bigint, truyền chuỗi chữ số và validate trong phạm vi bigint.
- Thực thi invariant bằng unique/check/foreign key ở DB, không chỉ kiểm tra trong service. Index phải gắn với truy vấn thực tế.
- Query nhận input phải parameterized; search literal cần escape `%` và `_` nếu contract không cho wildcard.
- Không sửa migration đã chạy. Mỗi thay đổi schema dùng migration mới, có rollback hoặc tài liệu giải thích giới hạn rollback/data loss.
- Transaction atomic phải dùng cùng transaction manager/connection; advisory session lock phải lấy/nhả trên cùng connection.

## Baseline đã kiểm tra 2026-09-25

Entity metadata của `users`, `auth_identities`, `refresh_tokens` đã đối chiếu `information_schema.columns`: không có tên cột bị thiếu hoặc khác mapping. `createdAt`/`updatedAt` đều đã map sang snake_case; không cần migration rename.

Một số timestamp cũ vẫn là `timestamp without time zone`. Không đổi kiểu tự động: phải xác định timezone của dữ liệu cũ, viết migration riêng và xác minh conversion. Convention timestamptz áp dụng bảng/cột mới trước.
