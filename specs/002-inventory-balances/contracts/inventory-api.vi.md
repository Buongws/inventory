# Contract API Inventory

Ngôn ngữ: [English](inventory-api.md) | **Tiếng Việt**

Contract v1 đã triển khai; [kiểm chứng](../vi/validation.vi.md). Nghiệp vụ: `../vi/spec.vi.md`; schema/transaction: `../vi/data-model.vi.md`.

## Quy tắc chung

Base qua Gateway: `http://localhost:3004/api/v1/inventory`; port API 3001 chỉ dùng chẩn đoán. Mọi endpoint, kể cả replay, phải kiểm tra Bearer JWT và quyền admin tại API. Customer không được truy cập. Giữ contract auth/lưu token hiện tại. Gateway chuyển nguyên `Idempotency-Key`, `Retry-After`, status/body; không cần routing hoặc rate policy mới.

Path phải là UUID: sai định dạng → 400, UUID hợp lệ không tồn tại → 404. Fingerprint dùng UUID product chữ thường. GET list chỉ nhận page/limit; GET tồn đơn không query. POST không query. Field query/body lạ → 400. Mặc định page=1, limit=20; số nguyên an toàn dương, limit≤100 và offset `(page−1)*limit` phải là số nguyên an toàn. Không tự clamp. Page quá cuối trả items rỗng, total giữ nguyên. Snapshot nhất quán trong một request, không giữa nhiều request.

### Cấu trúc

`ProductSummary = { id: UUID, sku: string, name: string, status: "ACTIVE" | "INACTIVE" }`.

`StockItem = { productId: UUID, onHandQty: number, product: ProductSummary }`.

`Movement = { id: UUID, productId: UUID, type: "RECEIPT" | "ISSUE", quantity: number, balanceBefore: number, balanceAfter: number, actorId: UUID, reason: string, createdAt: ISO-8601 UTC string }`.

`HistoryItem = Movement & { product: ProductSummary }`. Product lấy catalog hiện tại; dữ kiện movement không đổi. Timestamp JSON theo `YYYY-MM-DDTHH:mm:ss.sssZ`; sort DB giữ đủ microsecond.

## Endpoint

| Endpoint | Request | Response |
|---|---|---|
| GET `/` | page/limit tùy chọn | 200 `{ items: StockItem[], page, limit, total }`, product id ASC |
| GET `/:productId` | UUID, không query/body | 200 `{ inventory: StockItem }` |
| GET `/:productId/movements` | UUID, page/limit tùy chọn | 200 `{ items: HistoryItem[], page, limit, total }`, createdAt DESC, id DESC |
| POST `/:productId/movements` | UUID, header key, JSON bên dưới | 201 `{ movement: Movement, inventory: { productId, onHandQty } }` |

Danh sách gồm mọi product active/inactive, thiếu dòng balance thì tồn 0. Product chưa có history trả rỗng. Ba path theo product đều trả 404 nếu product không tồn tại.

```json
{ "type": "RECEIPT", "quantity": 10, "reason": "Opening stock received" }
```

Body POST chỉ có ba field bắt buộc. Type phân biệt hoa/thường. Quantity là JSON number nguyên 1–1.000.000; không ép string/boolean/null thành số. Reason là string, JavaScript trim rồi kiểm tra 1–500 Unicode code point; chỉ whitespace/null là sai. Từ chối actor/timestamp/ID/balance do client gửi.

```json
{
  "movement": {
    "id": "04bca4f8-e75d-48d4-958b-bf7bf9662ee2",
    "productId": "b38582da-860b-409b-87d8-523458354573",
    "type": "RECEIPT",
    "quantity": 10,
    "balanceBefore": 0,
    "balanceAfter": 10,
    "actorId": "1df47894-69ad-443f-a0cc-089d810e0872",
    "reason": "Opening stock received",
    "createdAt": "2026-10-05T08:00:00.000Z"
  },
  "inventory": { "productId": "b38582da-860b-409b-87d8-523458354573", "onHandQty": 10 }
}
```

## Idempotency

- POST bắt buộc đúng một header `Idempotency-Key`, regex `^[A-Za-z0-9._:-]{1,128}$`. Thiếu, lặp, gộp dấu phẩy, whitespace hoặc quá dài → `400 INVALID_IDEMPOTENCY_KEY`. Kiểm tra số lần header xuất hiện từ raw HTTP headers trước xử lý header chuẩn hóa. Key phân biệt hoa/thường; nên dùng UUID. Endpoint khác không sử dụng key.
- Scope chính xác `(JWT subject UUID, "inventory.movement.v1", key)`. Admin khác dùng cùng key là hai scope độc lập, có thể tạo hai movement. Refresh token access của cùng admin không đổi scope. Luôn kiểm tra quyền trước lookup.
- Fingerprint gồm productId path chuẩn hóa, type, quantity number, reason đã trim, thứ tự JSON cố định theo [data-model.vi.md](../vi/data-model.vi.md). Thứ tự property JSON/whitespace ngoài reason không đổi danh tính. Sửa catalog không đổi fingerprint. Cùng key cho product khác là payload khác.
- Lưu status/body hoàn tất 24 giờ từ completed_at, expiry không gia hạn khi replay. Key hết hạn được coi là lệnh mới dù cleanup chưa chạy. Retry sau cửa sổ này có thể tạo movement mới; client giữ key, retry trong cửa sổ và đối chiếu history nếu đã hết thời hạn.
- Result chưa hết hạn và hash khớp trả status cùng các giá trị JSON gốc, gồm tồn/timestamp gốc; không đảm bảo thứ tự property JSON. POST không snapshot tên/SKU. GET trả tồn/catalog mới nhất. Commit thành công nhưng mất response vẫn replay an toàn.
- Khi đang giữ quyền xử lý key, request trùng trả ngay `409 IDEMPOTENCY_IN_PROGRESS`, `Retry-After: 1`, không chờ transaction gốc. Retry cùng key/payload sau đó. Payload khác khi key đang xử lý cũng trả code tạm thời này; sau hoàn tất trả `IDEMPOTENCY_KEY_REUSED`. Không ghi đè result gốc.
- Replay lỗi nghiệp vụ: `404 PRODUCT_NOT_FOUND`, `409 INSUFFICIENT_STOCK`, `409 STOCK_LIMIT_EXCEEDED`. Tồn thay đổi sau đó không đổi lỗi cached còn hạn. Muốn thực hiện lần thử nghiệp vụ mới/chỉnh sửa phải dùng key mới.
- Không lưu 400/401/403, xung đột key, 429, 500, 502 hoặc 503. Transaction đã xác nhận rollback không commit result. Mất xác nhận COMMIT vẫn có thể để lại result nghiệp vụ gốc đã commit; không lưu chính response lỗi transport 500/502/503 làm result replay. Retry 409-in-progress/429/502/503 hoặc 500/mất response chưa rõ kết quả bằng cùng key/payload, tôn trọng Retry-After, backoff có jitter; sau đăng nhập lại vẫn giữ key. Không tự đổi key cho lệnh chưa rõ kết quả.
- Không endpoint tra processing, response 202, distributed lock ngoài DB, cập nhật balance từ client hoặc vòng tự retry trong service API.

## Lỗi và thứ tự ưu tiên

Lỗi do Inventory quản lý: `{ statusCode: number, code: string, message: string }`. Ví dụ `{ "statusCode": 409, "code": "INSUFFICIENT_STOCK", "message": "Insufficient stock" }`. Không lộ SQL, tên constraint, stack trace hoặc connection. Implement exception filter chỉ cho Inventory, không đổi global lỗi Product/Auth. Có thể ghép mảng thông báo validation thành string đã lọc. JSON lỗi cú pháp trước controller giữ dạng 400 framework hiện tại; lỗi Gateway giữ dạng hiện tại.

| HTTP | Code | Ý nghĩa / lưu trữ |
|---|---|---|
| 400 | INVALID_INPUT | UUID/body/query sai; không lưu |
| 400 | INVALID_IDEMPOTENCY_KEY | Key thiếu/sai/lặp; không lưu |
| 401 | UNAUTHORIZED | JWT thiếu/hết hạn/sai; không lưu |
| 403 | FORBIDDEN | Không phải admin; không lưu |
| 404 | PRODUCT_NOT_FOUND | UUID hợp lệ không tồn tại; chỉ lưu POST đã validation |
| 409 | INSUFFICIENT_STOCK | Xuất quá tồn; lưu |
| 409 | STOCK_LIMIT_EXCEEDED | Nhập vượt trần; lưu |
| 409 | IDEMPOTENCY_KEY_REUSED | Key còn hạn đã hoàn tất, hash khác; không lưu |
| 409 | IDEMPOTENCY_IN_PROGRESS | Không lấy được khóa key không chờ; Retry-After: 1; không lưu |
| 429 | RATE_LIMIT_EXCEEDED | Gateway limiter hiện tại; Retry-After hiện tại; không lưu |
| 500 | INVENTORY_PERSISTENCE_FAILED | Lỗi persistence/commit bất ngờ đã lọc; không lưu |
| 502 | UPSTREAM_UNAVAILABLE | Gateway lỗi hiện tại, kết quả có thể chưa rõ; API không lưu |
| 503 | INVENTORY_BUSY | DB lock/deadlock/statement timeout tại API sau rollback đã xác nhận; Retry-After: 1; không lưu |

Gateway limiter chạy trước. Với request đã tới controller API: auth → quyền → validation UUID/key/query/body → thử khóa key không chờ → replay/hash conflict → product tồn tại → giới hạn tồn. Replay hợp lệ trả kết quả cũ trước kiểm tra product/tồn hiện tại; key không bỏ qua auth/input sai. Lỗi khi lưu result nghiệp vụ thay lỗi dự kiến bằng 500 và rollback. Nếu mất xác nhận COMMIT, không khẳng định đã rollback: trả lỗi đã lọc nếu còn có thể, ghi nhận kết quả chưa rõ nội bộ, release/discard connection và đối chiếu bằng retry cùng key.



Timeout API và Gateway là hai quan sát khác nhau: kiểm tra trực tiếp port 3001 để xác minh API trả `503 INVENTORY_BUSY` khi DB timeout. Qua Gateway port 3004, proxy timeout 5 giây có thể xảy ra trước statement timeout DB 5 giây, nên nhận `502 UPSTREAM_UNAVAILABLE` (hoặc không có response nếu mất kết nối client) thay vì 503 API. Không cam kết Gateway luôn trả 503 hoặc đổi timeout global cho feature. API 503 với rollback đã xác nhận là kết quả chắc chắn; chỉ Gateway 502 là chưa rõ. Khi phục hồi, retry qua Gateway cùng key/payload để xác định kết quả bền vững.

Từ chối chắc chắn gồm validation/auth/nghiệp vụ và lỗi lưu trữ với rollback đã xác nhận, không gồm mất response/xác nhận COMMIT. Khi chưa rõ kết quả, giữ result gốc nếu đã commit, không cache lỗi transport và không khẳng định tồn chắc chắn không đổi. Atomicity giữ nguyên.

## Tài liệu cần làm khi implement

Swagger `/docs`, `/docs-json` mô tả DTO/envelope/quyền/header key/lỗi/retention/retry. Mở rộng `apps/api/postman/inventory.postman_collection.json`, giữ request auth/product. Environment thêm `idempotencyKey` rỗng và key nhập/xuất/retry riêng; replay dùng lại key lưu sẵn, không tự sinh key mới mỗi lần send. Không lưu token/credential thật trong artifact tracked. Viết tài liệu Inventory đồng bộ ở `docs/en/` và `docs/vi/`.
