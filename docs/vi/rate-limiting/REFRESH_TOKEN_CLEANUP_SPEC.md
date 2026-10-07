# Refresh token cleanup cronjob specification

Trạng thái: đã triển khai scheduler/service và migration index. Theo yêu cầu triển khai hiện tại, không thêm automated test; đã kiểm tra typecheck, build và chạy migration. Các test case bên dưới được giữ làm checklist cho lần bổ sung kiểm thử sau.

Chi tiết runtime: lịch dùng UTC; kết nối PostgreSQL riêng được đóng sau mỗi lần chạy để giải phóng session advisory lock. Mỗi batch là một statement tự commit, sử dụng `rowCount` để đếm record thay vì trả danh sách ID. Job không chạy bù lúc startup; shutdown chờ batch đang chạy hoàn tất và không bắt đầu batch mới.

## 1. Mục tiêu

Triển khai một scheduled job trong NestJS API để xóa các record refresh token đã hết hạn khỏi PostgreSQL. Job chạy ngoài HTTP request flow, không làm tăng latency của login hoặc refresh.

Thiết kế này phải bảo toàn cơ chế refresh-token rotation và replay detection:

- Mỗi lần refresh thành công, token hiện tại được revoke và một token mới cùng `family_id` được tạo.
- Token đã revoke nhưng chưa hết hạn vẫn được giữ để phát hiện việc token cũ bị dùng lại.
- Chỉ token đã qua `expires_at` mới đủ điều kiện cleanup.

## 2. Phạm vi

Bao gồm:

- Scheduler chạy trong NestJS API hiện tại.
- Cleanup bảng `refresh_tokens` theo batch.
- Index phục vụ truy vấn theo `expires_at`.
- PostgreSQL advisory lock để chỉ một API instance chạy job tại một thời điểm.
- Biến môi trường điều khiển lịch chạy và kích thước batch.
- Logging, kiểm thử và tiêu chí nghiệm thu.

Không bao gồm:

- Service worker riêng, Kafka hoặc Redis queue.
- Admin API thay đổi lịch chạy trong runtime.
- Lưu lịch cron trong database.
- Xóa token chưa hết hạn chỉ vì token đã bị revoke.
- Lưu raw refresh token; database tiếp tục chỉ lưu token hash.

## 3. Kiến trúc và vị trí

Cronjob chạy trong cùng process NestJS với HTTP server, nhưng không nằm trong request pipeline.

```text
HTTP flow:
Client → Gateway → Controller → AuthService → PostgreSQL

Cleanup flow:
NestJS Scheduler → RefreshTokenCleanupJob
                 → PostgreSQL advisory lock
                 → RefreshTokenCleanupService
                 → PostgreSQL refresh_tokens
```

Module dự kiến:

```text
AppModule
├── ScheduleModule.forRoot()
└── AuthModule
    ├── RefreshTokenCleanupJob
    └── RefreshTokenCleanupService
```

Job nhẹ nên chưa cần tách thành service riêng. Khi cleanup trở nên nặng hoặc hệ thống có nhiều background job, cùng service cleanup có thể được gọi từ worker hoặc Kubernetes CronJob.

## 4. Cấu hình

Thêm các biến môi trường:

```env
REFRESH_TOKEN_CLEANUP_ENABLED=true
REFRESH_TOKEN_CLEANUP_CRON=0 0 * * * *
REFRESH_TOKEN_CLEANUP_BATCH_SIZE=1000
REFRESH_TOKEN_CLEANUP_MAX_BATCHES=20
REFRESH_TOKEN_CLEANUP_RETENTION_DAYS=0
```

Ý nghĩa:

| Biến | Mặc định | Quy định |
|---|---:|---|
| `REFRESH_TOKEN_CLEANUP_ENABLED` | `true` | Bật hoặc tắt job trên instance hiện tại |
| `REFRESH_TOKEN_CLEANUP_CRON` | `0 0 * * * *` | Chạy vào đầu mỗi giờ; dùng cron expression sáu trường của NestJS |
| `REFRESH_TOKEN_CLEANUP_BATCH_SIZE` | `1000` | Số record tối đa trong một batch; từ 100 đến 10.000 |
| `REFRESH_TOKEN_CLEANUP_MAX_BATCHES` | `20` | Giới hạn số batch trong một lần chạy để job không chiếm database quá lâu |
| `REFRESH_TOKEN_CLEANUP_RETENTION_DAYS` | `0` | Số ngày giữ thêm sau `expires_at`; có thể tăng nếu cần điều tra/audit |

Config được validate khi API khởi động. Thay đổi config yêu cầu restart hoặc deployment lại API. Không reload config giữa runtime vì lịch cleanup hiếm khi thay đổi.

## 5. Database

Bảng hiện tại:

```text
refresh_tokens
├── id
├── user_id
├── token_hash
├── family_id
├── expires_at
├── revoked_at
└── created_at
```

Thêm index bằng migration:

```sql
CREATE INDEX "idx_refresh_tokens_expires_at"
ON "refresh_tokens" ("expires_at");
```

Không thêm cột trạng thái. Trạng thái được suy ra như sau:

| Điều kiện | Trạng thái | Cleanup |
|---|---|---|
| `revoked_at IS NULL` và `expires_at > now()` | Active | Không xóa |
| `revoked_at IS NOT NULL` và `expires_at > now()` | Revoked, còn thời gian replay detection | Không xóa |
| `expires_at <= cutoff` | Expired | Được xóa |

Trong đó:

```text
cutoff = now() - REFRESH_TOKEN_CLEANUP_RETENTION_DAYS
```

## 6. Flow khi API khởi động

```text
1. NestJS đọc và validate biến môi trường.
2. ScheduleModule khởi tạo scheduler.
3. RefreshTokenCleanupJob đăng ký cron expression.
4. HTTP server tiếp tục nhận request bình thường.
5. Job chờ đến thời điểm chạy tiếp theo; không query database liên tục.
```

Nếu `REFRESH_TOKEN_CLEANUP_ENABLED=false`, job bỏ qua cleanup nhưng API vẫn khởi động bình thường.

## 7. Flow mỗi lần cron chạy

```text
Đến lịch
  ↓
Kiểm tra CLEANUP_ENABLED
  ↓
Mở một QueryRunner/connection riêng
  ↓
Thử lấy PostgreSQL advisory lock
  ├── Không lấy được → instance khác đang chạy → log và kết thúc
  └── Lấy được
        ↓
      Xóa tối đa BATCH_SIZE token hết hạn
        ↓
      Batch đầy và chưa đạt MAX_BATCHES?
        ├── Có → chạy batch tiếp theo
        └── Không → ghi tổng kết
        ↓
      Nhả advisory lock
        ↓
      Release connection
```

Advisory lock phải được lấy và nhả trên cùng một database connection. Job sử dụng `try/finally` để nhả lock và release QueryRunner kể cả khi query lỗi.

Nếu API có nhiều instance, tất cả đều có thể thức dậy cùng thời điểm nhưng chỉ một instance lấy được lock. Các instance còn lại bỏ qua lần chạy đó.

## 8. Query cleanup theo batch

PostgreSQL không hỗ trợ `DELETE ... LIMIT` trực tiếp. Dùng CTE:

```sql
WITH expired_tokens AS (
  SELECT id
  FROM refresh_tokens
  WHERE expires_at <= $1
  ORDER BY expires_at ASC
  LIMIT $2
  FOR UPDATE SKIP LOCKED
)
DELETE FROM refresh_tokens
WHERE id IN (SELECT id FROM expired_tokens)
RETURNING id;
```

Tham số:

- `$1`: cutoff tính một lần ở đầu job để các batch dùng cùng một mốc thời gian.
- `$2`: `REFRESH_TOKEN_CLEANUP_BATCH_SIZE`.

Job dừng khi một trong các điều kiện xảy ra:

- Batch trả về ít hơn `BATCH_SIZE` record.
- Đã chạy đủ `MAX_BATCHES`.
- Database query lỗi.
- API nhận shutdown signal.

Không dùng một câu `DELETE` không giới hạn vì transaction lớn có thể tăng lock time, WAL, disk I/O và áp lực autovacuum.

## 9. Quan hệ với auth flow

### Login

Login không cleanup token hết hạn. Nó chỉ xác minh tài khoản và tạo refresh token mới. Nhờ đó latency login không phụ thuộc số token cũ.

### Refresh rotation

```text
Token A active
→ Client refresh bằng A
→ A.revoked_at được set
→ Token B cùng family_id được tạo
→ A được giữ đến expires_at
```

Nếu A bị dùng lại trước khi hết hạn, backend tìm thấy A đã revoke và revoke toàn bộ token active cùng family. Cron không được xóa A trước `expires_at`.

### Logout

Logout revoke token hiện tại và xóa refresh cookie. Record đã revoke được giữ đến khi hết hạn rồi cron mới xóa.

## 10. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Không lấy được advisory lock | Log debug/info và bỏ qua; không coi là lỗi |
| Một batch query lỗi | Log error, dừng lần chạy hiện tại, nhả lock |
| API restart giữa job | Connection đóng làm advisory lock tự được PostgreSQL giải phóng; lần cron sau chạy lại |
| Cron bị bỏ lỡ khi API downtime | Không chạy bù; lần kế tiếp xóa backlog theo batch |
| Backlog lớn hơn giới hạn mỗi lần chạy | Xóa tối đa `BATCH_SIZE × MAX_BATCHES`; phần còn lại để lần sau |
| Config không hợp lệ | API fail fast khi khởi động |

Cleanup là maintenance task. Job lỗi không được làm crash HTTP server và không ảnh hưởng tính hợp lệ của token; token hết hạn vẫn bị AuthService từ chối dù record chưa được xóa.

## 11. Logging và quan sát

Mỗi lần chạy thành công ghi một log tổng kết, không log token hash hoặc user ID:

```json
{
  "job": "refresh-token-cleanup",
  "deletedCount": 2427,
  "batchCount": 3,
  "durationMs": 184,
  "cutoff": "2026-09-25T08:00:00.000Z"
}
```

Theo dõi các metric khi hệ thống có monitoring:

- Số record đã xóa.
- Thời gian job chạy.
- Số batch.
- Số lần không lấy được lock.
- Số lần job lỗi.
- Số token hết hạn còn tồn đọng.

Không log `token_hash`, raw token hoặc cookie.

## 12. Kiểm thử

### Unit test

- Job disabled thì không lấy lock và không delete.
- Không lấy được advisory lock thì job bỏ qua.
- Batch chưa đầy thì job dừng.
- Batch đầy thì tiếp tục đến khi batch chưa đầy hoặc đạt `MAX_BATCHES`.
- Query lỗi vẫn nhả lock và connection.
- Cutoff được tính đúng theo retention days.

### Integration test PostgreSQL

- Token active không bị xóa.
- Token revoked nhưng chưa hết hạn không bị xóa.
- Token hết hạn bị xóa.
- Token hết hạn đúng cutoff bị xóa.
- Chỉ tối đa `BATCH_SIZE` record bị xóa trong một batch.
- Hai job đồng thời chỉ có một job lấy advisory lock.
- Foreign key và auth flow vẫn hoạt động sau cleanup.
- Index `idx_refresh_tokens_expires_at` tồn tại và query cleanup sử dụng index với tập dữ liệu đủ lớn.

## 13. Tiêu chí nghiệm thu

- Migration tạo index `expires_at` thành công và có thể rollback.
- API đọc đầy đủ config cleanup và fail fast với config sai.
- Cron chạy theo lịch mà không cần HTTP request kích hoạt.
- Chỉ một API instance cleanup tại một thời điểm.
- Token chưa hết hạn, kể cả token đã revoke, không bị xóa.
- Token hết hạn được xóa theo batch có giới hạn.
- Job lỗi không làm API dừng phục vụ request.
- Build, typecheck, unit test và integration test pass.
- README mô tả cách bật/tắt và thay đổi lịch job.

## 14. Quyết định thiết kế

Phiên bản đầu dùng cronjob nằm trong NestJS API vì cleanup nhẹ và project đang là monolith. PostgreSQL lưu dữ liệu và cung cấp distributed lock; Redis không tham gia cleanup. Login không làm lazy cleanup để giữ request path đơn giản và ổn định.

Nếu sau này job nặng, có thể chuyển `RefreshTokenCleanupService` sang worker hoặc Kubernetes CronJob. Query, index, batch policy và tiêu chí cleanup vẫn giữ nguyên.
