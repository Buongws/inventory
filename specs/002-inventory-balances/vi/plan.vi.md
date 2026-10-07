# Kế hoạch triển khai: Tồn kho một kho

[Trạng thái triển khai](validation.vi.md): đã triển khai và kiểm chứng trên PostgreSQL dùng thử; nội dung thiết kế/lượt plan gốc được giữ làm lịch sử.

**Branch**: `002-inventory-balances` | **Ngày**: 2026-10-05 | **Spec**: [spec.vi.md](spec.vi.md)

Ngôn ngữ: [English](../plan.md) | **Tiếng Việt**

**Đầu vào**: `specs/002-inventory-balances/spec.md`, gồm các câu trả lời clarify đã chấp nhận.
**Trạng thái**: Hoàn tất nghiên cứu Phase 0 và thiết kế Phase 1. Giữ thiết kế đã chốt; đã triển khai và kiểm chứng trên DB dùng thử, xem [validation.vi.md](validation.vi.md).

## Tóm tắt

Thêm đọc tồn và lịch sử nhập/xuất chỉ dành cho admin, một kho. PostgreSQL lưu balance, movement và kết quả idempotency 24 giờ. Một transaction thử khóa key không chờ, tuần tự hóa balance của từng product, commit tồn/movement/result cùng nhau. Replay giữ response gốc; request trùng đang xử lý trả ngay 409 đã chốt. Lịch sử join catalog hiện tại, không snapshot.

Giữ mọi quyết định: product inactive vẫn nhập/xuất; ghi bắt buộc key; request trùng đang xử lý trả ngay 409 cho phép retry; history liên kết productId bất biến và tên/SKU hiện tại; giới hạn quantity/balance/phân trang/thứ tự/auth theo spec; không frontend, orders, distributed lock ngoài DB, queue hoặc file test tự động mới.

## Bối cảnh kỹ thuật

**Ngôn ngữ/phiên bản**: Node.js 24, TypeScript strict (repo khai báo ^5.7).
**Dependency chính**: NestJS 11, TypeORM 0.3, pg, class-validator/class-transformer, Swagger, Nest scheduler/cron hiện có; Node crypto SHA-256. Không thêm package.
**Lưu trữ**: PostgreSQL 17 theo Compose; Redis hiện tại chỉ phục vụ Gateway/auth, không giữ tính đúng của tồn.
**Kiểm chứng**: Không thêm file test tự động. Kiểm tra API qua Gateway và concurrency/rollback/crash/migration trên DB thật; chạy Jest API hiện có nếu có, ghi rõ nếu thiếu.
**Nền tảng**: Các service Node/PostgreSQL hiện tại; API 3001, Gateway 3004, web 3002.
**Loại dự án**: Backend service, DB và tài liệu Swagger/Postman.
**Mục tiêu hiệu năng**: Request trùng đang xử lý không chờ khóa key gốc; kiểm chứng có kiểm soát yêu cầu response trong một giây khi request gốc vẫn bị chặn. Đây là kiểm tra local, không phải SLO production. Limit list≤100, lookup product/history/result có index.
**Ràng buộc**: DB statement timeout 5 giây, connection timeout 3 giây, Gateway timeout 5 giây; idle timeout riêng transaction 5 giây. Trả lỗi tạm thời đã lọc, giữ key khi kết quả chưa rõ. Transaction ngắn, chỉ DB; không tăng timeout global hoặc thêm lock service.
**Quy mô/phạm vi**: Một kho logic, mọi product active/inactive cũ/mới; quantity nguyên dương≤1.000.000, balance≤2.147.483.647. Chưa có cam kết throughput/uptime/quy mô dữ liệu production; đo trước khi mở rộng.

Quan sát repository được ghi ở [research.vi.md](research.vi.md), không coi là kiểm chứng runtime.

## Kiểm tra constitution

*Gate trước nghiên cứu: PASS. Gate sau thiết kế: PASS. Không cần ngoại lệ.*

| Nguyên tắc / gate | Bằng chứng thiết kế |
|---|---|
| Hành vi trước code | Giữ FR-001–012, SC-001–006 và clarify; contract request/response/lỗi/retry rõ |
| Ranh giới service | API quản lý auth/nghiệp vụ/DB; giữ proxy/limiter Gateway; không UI |
| Toàn vẹn dữ liệu | Snake_case, FK/CHECK/unique/index; cùng transaction manager; migration mới; synchronize false |
| Code/config dễ hiểu | Controller mỏng, service/filter/entity theo feature, scheduler hiện tại cleanup có giới hạn; không env mới |
| Kiểm chứng trung thực | Root check/build, test hiện có liên quan và bằng chứng DB/API; chưa tuyên bố runtime pass; không file test mới |
| Migration an toàn | Không sửa migration/backfill/chuyển dữ liệu cũ; down phá dữ liệu chỉ dùng DB rỗng/dùng thử; production giữ schema hoặc sửa forward |

Advisory lock transaction PostgreSQL là kiểm soát đồng thời trong DB. Spec loại trừ hạ tầng distributed lock ngoài DB; không thêm Redis/session/distributed lock service. Unique key đầy đủ là căn cứ; đánh đổi va chạm hash khóa có trong research/data-model.

## Cấu trúc dự án

### Tài liệu feature

```text
specs/002-inventory-balances/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/
│   ├── inventory-api.md
│   └── inventory-api.vi.md
└── vi/
    ├── spec.vi.md
    ├── plan.vi.md
    ├── research.vi.md
    ├── data-model.vi.md
    ├── quickstart.vi.md
    └── tasks.vi.md
```

`tasks.md` và `vi/tasks.vi.md` đã được tạo ở lượt `$speckit-tasks` sau plan. Bằng chứng implement được ghi tại `validation.md` và `vi/validation.vi.md` tính từ thư mục feature.

### Source/tài liệu triển khai

```text
apps/api/src/
├── app.module.ts                        # đăng ký InventoryModule
├── inventory/
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts             # transaction/idempotency theo feature
│   ├── inventory.dto.ts
│   ├── inventory-http-exception.filter.ts
│   ├── inventory-balance.entity.ts
│   ├── stock-movement.entity.ts
│   ├── inventory-idempotency-result.entity.ts
│   ├── inventory-idempotency-cleanup.service.ts
│   └── inventory-idempotency-cleanup.job.ts
└── database/migrations/<new-timestamp>-CreateInventory.ts
apps/api/postman/
├── inventory.postman_collection.json
└── local.postman_environment.json
docs/en/inventory/INVENTORY_SPEC.md
docs/vi/inventory/INVENTORY_SPEC.md
```

**Quyết định cấu trúc**: Thêm một module Inventory trong API. DB đã discovery entity/migration bằng glob. Tái dùng AccessTokenGuard/requireRole, không tạo lớp auth mới. Gateway hiện chuyển route/header cần kiểm chứng, chưa có lý do sửa source. Giữ frontend và luồng tạo/seed Product. Cập nhật index tài liệu hai ngôn ngữ khi thêm guide Inventory. Chưa sửa migration/source/Postman trong plan.

## Phase 0 — Kết quả nghiên cứu

[research.vi.md](research.vi.md) giải quyết scope/retention/fingerprint/replay lỗi, khởi tạo zero, khóa key/balance, timestamp, snapshot đọc, cleanup và migration. Nghiên cứu dùng đọc repo, research agent được dispatch và tài liệu PostgreSQL/TypeORM chính thức. Không còn NEEDS CLARIFICATION.

## Phase 1 — Thiết kế DB, API và transaction

[data-model.vi.md](data-model.vi.md) ghi column/constraint/index/quan hệ và thứ tự transaction; [contracts/inventory-api.vi.md](../contracts/inventory-api.vi.md) ghi envelope/lỗi/vòng đời key; [quickstart.vi.md](quickstart.vi.md) hướng dẫn kiểm chứng sau này.

- Ba bảng: inventory_balances (thiếu dòng = tồn logic 0), stock_movements (dữ kiện bất biến qua API), inventory_idempotency_results (chỉ kết quả hoàn tất). Không bảng warehouse, snapshot catalog hoặc lease processing.
- Scope `(actor_id, inventory.movement.v1, key)`; SHA-256 chuẩn hóa gồm product/type/quantity/reason trim. Lưu 201 và lỗi product/tồn xác định trong 24 giờ; replay không gia hạn. Key hết hạn là lệnh mới dù cleanup chậm.
- pg_try_advisory_xact_lock không chờ, không lấy được thì trả IDEMPOTENCY_IN_PROGRESS ngay. READ COMMITTED + balance FOR UPDATE tuần tự hóa lệnh khác key trên cùng product. Một connection/manager sở hữu mọi lần ghi. Savepoint trước balance loại bỏ khởi tạo khi lệnh bị từ chối nhưng cho phép commit result lỗi.
- Thành công ghi tồn/movement/response gốc nguyên tử. Chỉ trả lỗi nghiệp vụ sau commit result lỗi. SQL được service await lỗi trước commit và rollback đã xác nhận không để lại mutation; mất response/xác nhận COMMIT là kết quả chưa rõ, đối chiếu bằng cùng key, không khẳng định tồn không đổi. Kiểm tra 503 timeout API trực tiếp port 3001; Gateway có thể trả 502 trước với timeout 5 giây hiện tại. Không vòng tự retry nội bộ.
- Read-only REPEATABLE READ giữ items/count nhất quán theo request. Product ID tăng dần; lịch sử createdAt/id giảm dần, timestamp tăng theo product và gán sau khóa. Join catalog hiện tại lúc đọc.
- Cleanup cố định `0 0 * * * *` mỗi giờ UTC, 1.000 dòng/batch, tối đa 20 batch/lần. Mỗi batch chọn result hết hạn theo expires_at/id FOR UPDATE SKIP LOCKED rồi xóa các ID trong một transaction ngắn. Không quét/xóa movement. Chặn overlap trong process; skip locked an toàn nhiều instance; shutdown dừng giữa batch và chờ batch hiện tại; lỗi retry giờ tiếp theo. Chỉ log count/duration/loại lỗi, không key/body/reason/credential. Backlog có thể còn; hết hạn logic không phụ thuộc xóa vật lý. Không env mới, không cần đổi env example.
- Observability: dùng logger hiện tại phát một event outcome có cấu trúc cho mỗi lần thử movement đã validation và tới bước quyền key. Kết quả đã biết phát sau khi transaction kết thúc; mất acknowledgment phát outcome_uncertain sau discard/release connection, không khẳng định server đã commit hoặc rollback. Outcome gồm `completed` (chỉ sau commit result đã xác nhận, kể cả từ chối nghiệp vụ đã cache), `replayed`, `in_progress`, `conflict`, `transient_failure`, `persistence_failure` (rollback đã xác nhận), `outcome_uncertain` (mất xác nhận COMMIT). Ghi outcome, HTTP status/loại lỗi đã lọc, tùy chọn request/movement ID do server sinh; đếm event cho số completed/replayed/in-progress/conflict, không thêm hệ metrics/tracing. Không ghi completed khi commit chưa rõ hoặc đếm replay là movement mới. Giữ summary count/duration cleanup có giới hạn. Không log raw key/fingerprint/reason/payload/token/cookie/credential/SQL/connection. T016–T017 làm logging outcome, T021 summary cleanup, T040 kiểm chứng cả hai.

## Migration và kiểm chứng

Một migration mới tạo ba bảng cùng constraint/index, không conversion/backfill. Migrate trước deploy API rồi kiểm tra Gateway, Swagger/Postman. Down mất history/result, chỉ dùng môi trường dùng thử/rỗng; rollback ứng dụng production thông thường giữ schema.

Bằng chứng manual gồm SC-001–006 và race lần ghi đầu, overflow, inactive, catalog hiện tại, scope/fingerprint/replay lỗi, expiry/reuse không phụ thuộc cleanup, retry lỗi tạm thời, crash trước/sau commit, cleanup an toàn. Sau implement cần root `npm run check`, `npm run build`, test hiện có liên quan và migration up/down/up trên DB dùng thử. Quickstart có lệnh và kết quả kỳ vọng; chưa chạy runtime check nào trong plan.

## Theo dõi độ phức tạp

Không vi phạm constitution. Savepoint, khóa key DB và scheduler cleanup có giới hạn phục vụ trực tiếp nguyên tử dữ liệu, 409 ngay và retention. Không worker/queue/hạ tầng distributed lock/framework idempotency tổng quát/dependency mới.

## Kết quả workflow

Setup script xác định branch/spec và copy template chính thức. Hoàn tất Phase 0/1, kiểm tra đồng bộ artifact hai ngôn ngữ. Không có extensions.yml nên bỏ qua hook trước/sau plan. Các lượt tasks/analyze/implement tiếp theo đã hoàn tất; bằng chứng triển khai được link bên dưới.

Đã triển khai sau analyze. Xem [validation.vi.md](validation.vi.md); bước tiếp theo khi được yêu cầu: `$speckit-converge`.
