# Rate limit gateway specification

## Mục đích và vị trí

Rate limiting là một service Gateway riêng, đứng trước Inventory API. Ở môi trường hiện tại chưa có load balancer hay microservice, luồng chạy local là:

```text
Client → Inventory Gateway :3004 → Inventory API :3001
```

Khi triển khai nhiều service, Gateway nằm sau load balancer:

```text
Client → Load balancer → Rate-limit Gateway → Web/API services
```

Chặn request ở Gateway giúp giảm traffic spam/DOS trước khi nó chiếm connection, CPU và connection pool của các service phía sau. Gateway chỉ kiểm tra quota, trả `429` khi vượt quota, rồi proxy request còn lại vào API. Xác thực và phân quyền nghiệp vụ vẫn do API xử lý.

## Các policy hiện có

Mỗi request API chịu quota global theo IP. Một số endpoint chịu thêm quota riêng. Policy được lưu trong bảng `rate_limit_policies`.

| Key | Subject | Limit mặc định | Route |
|---|---|---:|---|
| `global-ip` | IP | 120 / 60 giây | mọi API route |
| `auth-login-ip` | IP | 10 / 60 giây | `POST /auth/login` |
| `auth-register-ip` | IP | 5 / 60 giây | `POST /auth/register` |
| `auth-refresh-ip` | IP | 30 / 60 giây | `POST /auth/refresh` |
| `google-oauth-ip` | IP | 20 / 60 giây | các route Google OAuth |
| `product-write-user` | JWT `sub` | 30 / 60 giây | POST/PATCH/DELETE products |

Với policy theo user, Gateway xác minh access JWT và dùng `sub` làm key. Nếu JWT không hợp lệ, API phía sau vẫn trả `401`; Gateway không dùng IP để thay thế quota user.

`OPTIONS`, Swagger/OpenAPI, health endpoint của API và `GET /gateway/health` không bị giới hạn.

## Nguồn cấu hình và deployment

`rate_limit_policies` là nguồn cấu hình bền vững. Gateway đọc các policy enabled khi khởi động. Vì quota công ty hiếm khi đổi, quy trình thay đổi ở bản đầu là:

1. Admin cập nhật hàng tương ứng trong PostgreSQL, ghi `updated_by_user_id` khi đã có màn quản trị.
2. Review thay đổi và deploy/restart Gateway.
3. Instance Gateway mới nạp toàn bộ policy mới trước khi nhận traffic.

Không có cron polling, Kafka consumer hoặc config cache trong bản đầu. Cách này đơn giản và deterministic; đổi lại không phù hợp nếu cần thay quota ngay tức thì. Khi tần suất thay đổi tăng, có thể bổ sung event Kafka hoặc Redis config cache mà không đổi bảng policy hay thuật toán counter.

## Redis counter

PostgreSQL không dùng để đếm request vì update mỗi request làm tăng latency và lock contention. Redis giữ counter có TTL, còn PostgreSQL chỉ giữ policy.

Key có dạng:

```text
rate-limit:<NODE_ENV>:<policy-key>:<ip|user>:<subject>
```

Gateway chạy Lua script atomically: key mới được set counter `1` và TTL; key đang tồn tại chỉ tăng khi chưa chạm limit; request bị chặn không tăng counter và không kéo dài TTL. Window cố định bắt đầu ở request đầu tiên, nên có thể burst tại ranh giới giữa hai window. Đây là trade-off chấp nhận được cho bản đầu, ưu tiên tốc độ và throughput.

Gateway lấy IP từ socket remote address. Nó không tin `X-Forwarded-For` khi local. Production chỉ bật `trust proxy` với CIDR/IP của load balancer đã biết, rồi mới dùng client IP mà proxy cung cấp.

## Khi Redis bị lỗi

Redis counter được chia sẻ giữa nhiều Gateway. Nếu Redis không phản hồi trong 500 ms, Gateway chuyển sang emergency limiter trong memory của chính instance, với quota chặt hơn (một phần tư quota chuẩn, tối thiểu 1 request/window). Response có header `X-Rate-Limit-Mode: emergency` để quan sát.

Emergency limiter giữ hệ thống tiếp tục phục vụ request bình thường thay vì fail-open. Nó không chia sẻ quota giữa các instance, vì vậy tổng quota có thể cao hơn khi có nhiều Gateway; đây là giới hạn tạm thời đến khi Redis hồi phục. Nếu Gateway process chết, counter fallback mất theo process, điều chấp nhận được cho cơ chế khẩn cấp.

## Response khi vượt quota

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json
```

```json
{
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retryAfterSeconds": 42
}
```

Client cần tôn trọng `Retry-After`; không retry vô hạn.

## Non-functional requirements

- Một Redis Lua call trên đường request; không query PostgreSQL cho mỗi request.
- Timeout Redis tối đa 500 ms và không retry Redis trong cùng request.
- Counter Redis được chia sẻ giữa Gateway instances, nên throughput có thể scale ngang.
- Gateway không chứa business logic, database transaction hoặc authorization decision của API.
- Redis production cần resource/eviction policy phù hợp; tách Redis counter với cache thường khi traffic đủ lớn để cache eviction không làm mất quota.

## Kiểm thử chấp nhận

- [ ] Request thứ N được phép, N+1 nhận 429 và `Retry-After` đúng.
- [ ] TTL hết hạn thì quota được mở lại; request bị chặn không gia hạn TTL.
- [ ] Hai Gateway cùng Redis cùng dùng một quota.
- [ ] JWT hợp lệ dùng user ID ở product-write; không lấy identity từ token chưa verify.
- [ ] Header `X-Forwarded-For` giả không né được quota local.
- [ ] Redis tắt thì Gateway dùng emergency limiter, thêm header mode và không proxy request vượt quota.
- [ ] `OPTIONS`, health, docs không bị rate limit.
