# Tasks: Tồn kho một kho

**Đầu vào**: Artifact thiết kế trong `specs/002-inventory-balances/`.
**Branch**: `002-inventory-balances` | **Ngày tạo**: 2026-10-06
**Trạng thái**: Đã hoàn tất implement; T001–T042 được kiểm chứng. Xem [validation.vi.md](validation.vi.md) về kết quả thực tế và phần bỏ qua.

Ngôn ngữ: [English](../tasks.md) | **Tiếng Việt**

**Điều kiện trước**: [plan.vi.md](plan.vi.md), [spec.vi.md](spec.vi.md), [research.vi.md](research.vi.md), [data-model.vi.md](data-model.vi.md), [API contract](../contracts/inventory-api.vi.md), [quickstart.vi.md](quickstart.vi.md), `.specify/memory/constitution.md`.

**Chính sách kiểm chứng**: Không thêm file test tự động. Vẫn cần bằng chứng API/DB thật và quality gate hiện có. Bằng chứng implement được ghi trong `../validation.md` / `validation.vi.md`, tạo trong implement, không phải lượt tasks. Mọi lần ghi giữ trong phạm vi feature. Không sửa source/migration/runtime khi tạo tasks.

## Format và đường dẫn

Mỗi item theo `- [ ] Tnnn [P?] [USn?] mô tả`, kèm file path chính xác tương đối root và phụ thuộc task rõ ràng. `[P]` chỉ cho chạy cùng task an toàn được chỉ ra sau khi xong điều kiện trước; không bỏ qua dependency hoặc cho sửa cùng file đồng thời. Chỉ phase story có nhãn US. `../tasks.md` là checklist thực thi; `tasks.vi.md` mirror ID/thứ tự/trạng thái, không phải backlog thứ hai. Khi implement phải đồng bộ checkbox.

Filename migration dự kiến chính xác `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`, lớn hơn migration hiện tại. T006 kiểm tra lại timestamp khi implement; nếu timestamp đã được dùng, chọn số hợp lệ tiếp theo rồi cập nhật cả hai tài liệu tasks. Không thêm dependency/env hoặc tích hợp seed Product.

## Phase 1: Setup (Hạ tầng chung)

Chuẩn bị công cụ/env hiện có và khung feature, không tạo ứng dụng mới.

- [X] T001 Kiểm tra Node.js 24, cài package độc lập, config ignored và PostgreSQL/Redis riêng; đọc conventions backend/database/Gateway, tạo bản ghi kiểm chứng đã lọc, mọi scenario runtime ghi chưa chạy. Files: `package.json`, `apps/api/package.json`, `apps/gateway/package.json`, `apps/web/package.json`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: không.
- [X] T002 Tạo khung module/controller/service Inventory theo cấu trúc API hiện tại; chưa mở route ghi cho tới khi hoàn tất story; dùng dependency/auth sẵn có. Files: `apps/api/src/inventory/inventory.module.ts`, `apps/api/src/inventory/inventory.controller.ts`, `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T001.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 1 trước phase tuần tự tiếp theo.

## Phase 2: Nền tảng (Điều kiện chặn)

Hoàn tất schema/entity/DTO/lỗi/auth/module trước endpoint story. T003–T008 có thể song song sau T002; T009 chờ tất cả.

- [X] T003 [P] Định nghĩa entity balance map snake_case, UUID product PK/FK, tồn integer có giới hạn, timestamp timestamptz; thiếu dòng nghĩa là zero logic. Files: `apps/api/src/inventory/inventory-balance.entity.ts`. Phụ thuộc: T002.
- [X] T004 [P] Định nghĩa entity movement với UUID/product/actor do server xác định, type/quantity/reason/before/after/time, quan hệ RESTRICT và index history/actor; không snapshot catalog hoặc sửa/xóa. Files: `apps/api/src/inventory/stock-movement.entity.ts`. Phụ thuộc: T002.
- [X] T005 [P] Định nghĩa entity result hoàn tất, unique actor/operation/key phân biệt hoa thường, hash/product UUID, status/body/movement và expiry 24 giờ; không FK product để replay lỗi product không tồn tại. Files: `apps/api/src/inventory/inventory-idempotency-result.entity.ts`. Phụ thuộc: T002.
- [X] T006 [P] Tạo migration mới theo đủ field/CHECK/FK/index data-model, gồm CHECK delta bigint và outcome/expiry; up tạo ba bảng không backfill, down xóa results/movements/balances. Kiểm tra timestamp duy nhất/thứ tự trước khi tạo filename dự kiến; không sửa migration đã áp dụng hoặc bật synchronize. Files: `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`. Phụ thuộc: T002.
- [X] T007 [P] Implement filter chỉ cho Inventory theo status/code/message, 500 đã lọc và 503 timeout kèm Retry-After; giữ lỗi Product/Auth, JSON sai trước controller và Gateway hiện tại. Files: `apps/api/src/inventory/inventory-http-exception.filter.ts`. Phụ thuộc: T002.
- [X] T008 [P] Định nghĩa DTO response tồn/history/movement và request/query strict: page/limit mặc định, offset an toàn, UUID, quantity JSON number nguyên 1–1.000.000, type chính xác, reason trim 1–500 code point, từ chối field lạ và DTO không query khi cần. Files: `apps/api/src/inventory/inventory.dto.ts`. Phụ thuộc: T002.
- [X] T009 Đăng ký entity/service/controller/filter trong InventoryModule, import AppModule; dùng AccessTokenGuard/requireRole admin cho mọi endpoint, auth trước validation/replay, giữ prefix /api/v1 và discovery hiện tại. Files: `apps/api/src/inventory/inventory.module.ts`, `apps/api/src/inventory/inventory.controller.ts`, `apps/api/src/app.module.ts`. Phụ thuộc: T003, T004, T005, T006, T007, T008.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 2 trước phase tuần tự tiếp theo.

## Phase 3: US1 — Xem tồn (P1, MVP chỉ đọc)

Nghiệm thu độc lập: đọc tồn zero cho product cũ/demo/mới chưa ghi, gồm active/inactive, đúng phân trang và phân biệt 400/401/403/404; không tạo balance. Không cần endpoint ghi, dữ liệu toàn zero đủ kiểm tra.

- [X] T010 [US1] Implement đọc tồn đơn bằng products LEFT JOIN balances, COALESCE zero; trả ProductSummary hiện tại cho active/inactive; product không tồn tại trả PRODUCT_NOT_FOUND, đọc không tạo dòng. Files: `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T009.
- [X] T011 [US1] Implement phân trang tồn theo product ID tăng dần, gồm zero/active/inactive; items/count dùng một snapshot read-only REPEATABLE READ, limit/offset đúng contract, page quá cuối trả rỗng. Files: `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T010.
- [X] T012 [US1] Mở GET /inventory và GET /inventory/:productId với validation UUID/query và envelope tồn; mô tả quyền/phân trang/zero/lỗi 400/401/403/404/500/503 trên Swagger. Files: `apps/api/src/inventory/inventory.controller.ts`. Phụ thuộc: T011.
- [X] T013 [P] [US1] Thêm request list/tồn đơn/zero/inactive/không tồn tại/input sai/auth vào collection Postman hiện tại; giữ auth/product, không lưu credential. Files: `apps/api/postman/inventory.postman_collection.json`. Phụ thuộc: T011.
- [X] T014 [US1] Kiểm chứng US1 qua Gateway với product cũ/demo/mới: zero, active/inactive, phân trang ổn định, 404, UUID/query sai 400, customer 403, không/token sai 401; lưu response đã lọc, xác nhận đọc không tạo balance. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T012, T013.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 3 trước phase tuần tự tiếp theo.

## Phase 4: US2 — Nhập hàng (P1)

Nghiệm thu độc lập: nhập 10 rồi 5 tồn 15/hai movement; input sai không mutation; trùng đang xử lý trả 409, retry hoàn tất trả result gốc duy nhất. Dùng đọc US1 và SQL trước US4.

- [X] T015 [US2] Bắt buộc đúng một raw header Idempotency-Key theo regex ASCII contract, không trim; tính SHA-256 payload chuẩn hóa và ID khóa signed 64-bit có namespace không mất chính xác Number, dùng actor xác thực và operation inventory.movement.v1. Files: `apps/api/src/inventory/inventory.controller.ts`, `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T014.
- [X] T016 [US2] Implement quyền key READ COMMITTED cùng manager bằng pg_try_advisory_xact_lock, trả ngay IN_PROGRESS/Retry-After, lookup result scope đầy đủ, so hash, replay status/body gốc, expiry 24 giờ cố định, thay result hết hạn trong transaction; không PROCESSING bền vững. Phát một event outcome sau transaction cho nhánh replayed/in_progress/conflict bằng logger hiện tại với status/loại lỗi đã lọc; không raw key/fingerprint/body hoặc hệ metrics mới. Files: `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T015.
- [X] T017 [US2] Implement transaction RECEIPT: tìm product kể cả inactive; savepoint trước upsert zero; khóa balance FOR UPDATE; kiểm tra trần trước ghi; tồn/timestamp microsecond tăng bằng SQL/movement/result 201 commit cùng nhau. Commit cache 404/STOCK_LIMIT_EXCEEDED không đổi tồn, rollback khởi tạo tới savepoint; không network/repository ngoài transaction. Rollback lỗi lưu trữ, map lỗi tạm thời, idle guard, xử lý COMMIT chưa rõ bằng cùng key; trả sau khi transaction kết thúc. Chỉ phát completed sau COMMIT result đã xác nhận; rollback chắc chắn là transient_failure/persistence_failure, mất acknowledgment là outcome_uncertain, không khẳng định tồn không đổi. Đúng một event mỗi lần thử đủ điều kiện, không payload nhạy cảm. Files: `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T016.
- [X] T018 [US2] Mở POST /inventory/:productId/movements cho receipt với kết quả đã commit/lỗi/replay và Retry-After; mô tả key/body/lỗi/field server/không tự retry. Chưa cho ISSUE chạy trước T023–T024, không xử lý nhầm thành receipt. Files: `apps/api/src/inventory/inventory.controller.ts`. Phụ thuộc: T017.
- [X] T019 [P] [US2] Thêm request nhập/replay/key-payload khác/header key lặp-thiếu-sai; thêm placeholder rỗng idempotencyKey/receiptKey/issueKey/retryKey, replay không tự sinh key mới. Files: `apps/api/postman/inventory.postman_collection.json`, `apps/api/postman/local.postman_environment.json`. Phụ thuộc: T018.
- [X] T020 [P] [US2] Implement cleanup result hết hạn bằng transaction ngắn, sort expiry/id với FOR UPDATE SKIP LOCKED, tối đa 1.000 dòng/batch và 20 batch/lần; không xóa movement/result còn hạn, dừng giữa batch khi shutdown, reuse key không phụ thuộc cleanup. Files: `apps/api/src/inventory/inventory-idempotency-cleanup.service.ts`. Phụ thuộc: T018.
- [X] T021 [US2] Đăng ký cleanup mỗi giờ 0 0 * * * * UTC bằng scheduler hiện có; chống overlap process, shutdown dừng/chờ batch hiện tại, lỗi retry giờ sau, summary count/duration đã lọc; hằng số cố định, không env mới. Files: `apps/api/src/inventory/inventory-idempotency-cleanup.job.ts`, `apps/api/src/inventory/inventory.module.ts`. Phụ thuộc: T020.
- [X] T022 [US2] Kiểm chứng US2 nhập 10 rồi 5: tồn 15, hai dòng movement bất biến; quantity/reason/body/key sai không đổi dữ liệu, inactive vẫn nhập, lỗi trần replay, thành công gốc replay sau tồn đổi, race nhập đầu tuần tự; dùng SQL trước khi có endpoint history; giữ request gốc để kiểm chứng trùng trả 409 ngay và replay cùng key sau hoàn tất. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T019, T021.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 4 trước phase tuần tự tiếp theo.

## Phase 5: US3 — Xuất hàng (P1)

Nghiệm thu độc lập: tồn 10 xuất 3 còn 7; xuất 8 trả 409 INSUFFICIENT_STOCK không movement mới; xuất 7 về zero. Chuẩn bị bằng US2, kiểm tra US1/SQL, không cần US4.

- [X] T023 [US3] Mở rộng transaction chung cho ISSUE dưới khóa balance: xuất quá tồn rollback khởi tạo savepoint, chỉ commit cache INSUFFICIENT_STOCK; xuất đúng tồn về zero, không âm; dùng lại key/expiry/result nguyên tử/timestamp. Files: `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T022.
- [X] T024 [US3] Bật ISSUE tại cùng endpoint POST, cập nhật Swagger ví dụ/lỗi hai type; controller trả lỗi/result đã commit theo key hiện có, không thêm route ghi thứ hai. Files: `apps/api/src/inventory/inventory.controller.ts`. Phụ thuộc: T023.
- [X] T025 [P] [US3] Thêm request xuất thành công/đúng tồn/thiếu tồn/inactive và lỗi cached sau nhập, dùng key độc lập/mới/replay tường minh trong collection hiện tại. Files: `apps/api/postman/inventory.postman_collection.json`. Phụ thuộc: T023.
- [X] T026 [US3] Kiểm chứng tồn 10 xuất 3 còn 7, xuất 8 trả 409 cached không movement, xuất 7 về zero, inactive vẫn xuất; xuất đầu bị từ chối không tạo balance, nhập thêm rồi key mới có thể thành công nhưng key lỗi cũ vẫn replay. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T024, T025.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 5 trước phase tuần tự tiếp theo.

## Phase 6: US4 — Xem lịch sử (P2)

Nghiệm thu độc lập: dữ kiện nhập/xuất thành công mới nhất trước, có phân trang, rỗng khi chưa ghi, giữ sau inactive; sửa catalog chỉ đổi field hiển thị hiện tại; request từ chối/sửa/xóa không đổi history.

- [X] T027 [US4] Implement items/count history trong cùng snapshot read-only REPEATABLE READ, kiểm tra product, history rỗng, sort index created_at DESC/id DESC; join tên/SKU/status hiện tại, sort giữ chính xác timestamp DB. Files: `apps/api/src/inventory/inventory.service.ts`. Phụ thuộc: T026.
- [X] T028 [US4] Mở GET /inventory/:productId/movements với pagination/UUID/auth chung, envelope HistoryItem và lỗi Swagger; không mở endpoint sửa/xóa movement. Files: `apps/api/src/inventory/inventory.controller.ts`. Phụ thuộc: T027.
- [X] T029 [P] [US4] Thêm request history sort/phân trang/rỗng/không tồn tại/inactive/catalog hiện tại và kiểm tra route sửa/xóa không được hỗ trợ vào collection hiện tại. Files: `apps/api/postman/inventory.postman_collection.json`. Phụ thuộc: T027.
- [X] T030 [US4] Kiểm chứng US4 đủ product/type/quantity/before/after/actor/reason/time UTC, mới nhất trước và page; đổi tên/SKU chỉ đổi product hiển thị, inactive giữ history, lệnh bị từ chối không thêm movement, request sửa/xóa không được hỗ trợ không đổi history. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T028, T029.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 6 trước phase tuần tự tiếp theo.

## Phase 7: Hoàn thiện và kiểm chứng xuyên story

Hoàn tất guide hai ngôn ngữ và bằng chứng quickstart đầy đủ; không test file mới hoặc hạ tầng ngoài phạm vi. Chỉ chạy phase này khi hoàn tất các story. T031/T032 song song; task ghi bằng chứng chạy tuần tự.

- [X] T031 [P] Viết guide Inventory tiếng Anh về DB/endpoint/inactive/scope key-expiry 24 giờ/cache lỗi/in-progress-retry/replay gốc và GET hiện tại/nguyên tử/giới hạn rollback migration; link artifact và kiểm chứng đã lọc. Files: `docs/en/inventory/INVENTORY_SPEC.md`. Phụ thuộc: T030.
- [X] T032 [P] Viết guide Inventory tiếng Việt khớp field/status/code/vòng đời key/transaction/migration; giữ mọi quyết định nghiệp vụ đã chốt. Files: `docs/vi/inventory/INVENTORY_SPEC.md`. Phụ thuộc: T030.
- [X] T033 Thêm link đúng tới guide Inventory Anh–Việt trong index tài liệu, không viết lại domain không liên quan. Files: `docs/README.md`, `docs/vi/README.md`. Phụ thuộc: T031, T032.
- [X] T034 Chạy ma trận scope/fingerprint/replay/retention: hai admin/token refresh cùng admin, conflict product/type/quantity/reason, JSON/trim tương đương, cache 404/lỗi tồn, không cache validation/auth, thay key hết hạn khi không scheduler, replay không gia hạn; ghi kết quả thật hai ngôn ngữ. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T030.
- [X] T035 Chạy rollback/gây lỗi/crash DB dùng thử sau update balance, insert movement, insert result trước commit; phân biệt crash trước commit, mất response sau commit và mất xác nhận COMMIT; cùng key đối chiếu đúng một kết quả, không cache lỗi tạm thời. Không thêm switch lỗi/file test lâu dài. Dùng constraint/trigger tạm trên PostgreSQL dùng thử làm INSERT movement, INSERT result và deferred COMMIT service thực sự await thất bại; ghi exception đi qua handler/rollback đã xác nhận trước gỡ từng fixture. Không dùng SQL console ngoài callback làm bằng chứng. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T034.
- [X] T036 Chạy SC-001/002/006 DB thật qua Gateway và race trộn/ghi đầu: mười key xuất từ tồn năm cho năm thành công/năm thiếu tồn; trùng khi gốc bị chặn trả IN_PROGRESS local <1 giây/Retry-After, rồi replay gốc; payload khác trong/sau commit, không tồn âm, đối chiếu ledger zero dòng. Run có 429 phải làm lại. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T035.
- [X] T037 Kiểm chứng cleanup giới hạn batch/expiry/backlog/dòng khóa/nhiều instance/overlap/shutdown/phục hồi lần sau; giữ movement/result chưa hết hạn, reuse key hết hạn không phụ thuộc cleanup; xem query plan đại diện, không coi sequential scan bảng nhỏ là lỗi. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T036.
- [X] T038 Kiểm chứng full-chain migration trên DB dùng thử mới/hiện có, product cũ/demo tồn zero, giữ dữ liệu Product/Auth; kiểm tra CHECK/FK/index rồi chỉ revert migration mới cuối và up lại trên dữ liệu dùng thử/rỗng; ghi giới hạn down phá hủy và rollback ứng dụng giữ schema. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`, `apps/api/src/database/migrations/1791158400000-CreateInventory.ts`. Phụ thuộc: T037.
- [X] T039 Sau implement chạy npm run check/build root và npm test API hiện có liên quan; sửa lỗi source bị ảnh hưởng, chạy lại check cần thiết, ghi output/giới hạn. No tests found là thiếu coverage, không phải pass; không thêm file test tự động. Files: `package.json`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T038.
- [X] T040 Kiểm tra Gateway chuyển header/body/status, từ chối key raw lặp, Retry-After/429/502 chưa rõ kết quả; đối chiếu Swagger/docs-json/Postman và Anh–Việt với contract, ưu tiên auth/quyền, log/artifact không lộ secret; giữ route/policy và lưu auth hiện tại. Kiểm tra API 503 trực tiếp port 3001 riêng với Gateway 502/503/mất response tại 3004 rồi đối chiếu cùng key. Xác minh đúng một event mỗi lần thử đủ điều kiện, sau transaction với kết quả đã biết hoặc sau discard/release connection với outcome_uncertain khi mất acknowledgment, count completed/replayed/in_progress/conflict và lỗi/chưa rõ, không completed trước COMMIT đã xác nhận, không tính replay là movement mới, không lộ secret. Files: `apps/gateway/src/main.ts`, `apps/api/postman/inventory.postman_collection.json`, `docs/en/inventory/INVENTORY_SPEC.md`, `docs/vi/inventory/INVENTORY_SPEC.md`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`. Phụ thuộc: T033, T039.
- [X] T041 Hoàn thiện bản ghi kiểm chứng đồng bộ, map FR-001–012 và SC-001–006 tới bằng chứng thật/ngày/phiên bản/status/count/timing/quality/migration; liệt kê check fail/bỏ qua, xác nhận không thêm frontend/order/distributed-lock/test mới. Chỉ đánh dấu task hoàn tất khi có bằng chứng. Files: `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`, `specs/002-inventory-balances/tasks.md`, `specs/002-inventory-balances/vi/tasks.vi.md`. Phụ thuộc: T040.

**Checkpoint**: Hoàn tất và kiểm chứng Phase 7 trước phase tuần tự tiếp theo.

## Phụ thuộc và thứ tự thực thi

### Đồ thị phase/story

```text
T001 → T002
          ├─ T003 balance entity ───────┐
          ├─ T004 movement entity ─────┤
          ├─ T005 result entity ───────┤
          ├─ T006 migration ───────────┤
          ├─ T007 exception filter ────┤
          └─ T008 DTOs ────────────────┘
                                      ↓
                                     T009
                                      ↓
                      US1 T010–T014 (read-only MVP)
                                      ↓
                      US2 T015–T022 (receipt + replay + cleanup)
                                      ↓
                      US3 T023–T026 (issue)
                                      ↓
                      US4 T027–T030 (history)
                                      ↓
                      Final T031–T041 (guides + evidence + gates)
```

Setup → nền tảng chặn mọi story. Chọn thứ tự US1 → US2 → US3 → US4 vì cùng mở rộng service/controller/Postman; không implement các file dùng chung đồng thời. US3 cần transaction chung và chuẩn bị tồn US2; nghiệm thu US4 dùng movement US2/US3. US1 không cần chức năng ghi. Mỗi phase kiểm chứng được mà chưa làm phase sau; không có nghĩa mọi story không cần prerequisite. Trước US4, dùng SQL xem dữ kiện movement của US2/US3.

Mỗi task ghi dependency cụ thể, không giả định cùng phase đều độc lập. Trước runtime validation đầu tiên, chạy migration mới chỉ trên DB riêng đã cấu hình theo quickstart.vi.md rồi start API/Gateway. T014 kiểm tra tồn khi chưa có route ghi. T038 kiểm chứng vòng đời migration cuối cùng trên DB mới/hiện có và up/down/up. File source tồn tại/build pass không chứng minh runtime.

### Ví dụ song song an toàn theo story

| Story / nhóm | Điều kiện đã xong | Công việc có thể cùng chạy | Chờ trước |
|---|---|---|---|
| Nền tảng | T002 | T003/T004/T005/T006/T007/T008 (sáu file khác nhau) | T009 |
| US1 | T011 | T012 controller + T013 Postman | T014 |
| US2 | T018 | T019 Postman/environment + T020 cleanup service; T021 sau T020 có thể cùng lúc T019 đang hoàn tất | T022 |
| US3 | T023 | T024 controller + T025 Postman | T026 |
| US4 | T027 | T028 controller + T029 Postman | T030 |
| Cuối | T030 | T031 guide Anh + T032 guide Việt; T034 có thể bắt đầu riêng nhưng task bằng chứng chạy tuần tự | T033/T040 |

Đây là cơ hội sắp lịch, không phải chỉ thị spawn agent. Không chạy đồng thời task ghi validation.md/validation.vi.md. Có 13 marker `[P]`; task endpoint không marker trong bảng chỉ là peer an toàn của cặp đã ghi, không cho tùy ý sửa controller song song.

## Truy vết yêu cầu

| Yêu cầu / quyết định | Task implement | Task kiểm chứng |
|---|---|---|
| FR-001 / SC-004 admin auth | T007–T009, T012/T018/T024/T028 | T014, T034, T040 |
| FR-002 zero/một kho | T003/T006, T010–T011, T017/T023 | T014/T022/T026/T038 |
| FR-003 quantity/trần tồn | T004/T006/T008, T017/T023 | T022/T026/T036 |
| FR-004 reason/field server | T004/T008, T015/T017 | T022/T026/T030/T040 |
| FR-005 nguyên tử / SC-003 | T006/T017/T023 | T035 |
| FR-006 concurrency / SC-002 | T016/T017/T023 | T022/T036 |
| FR-007 ledger/chỉ thêm | T004/T006/T017/T023/T027/T028 | T030/T035/T036/T037 |
| FR-008 phân trang/thứ tự | T006/T008/T011/T027 | T014/T030/T037 |
| FR-009 và quyết định inactive | T010–T012/T017/T023/T027 | T014/T022/T026/T030 |
| FR-010 field lạ/server-owned | T008/T015, task endpoint | T014/T022/T026/T040 |
| FR-011 / SC-006 in-flight 409 | T015/T016/T018 | T022/T036/T040 |
| FR-012 catalog hiện tại, không snapshot | T004/T010/T027 | T030 |
| Idempotency đã chốt và vòng đời | T005/T006/T015–T021 | T022/T026/T034–T037/T040 |
| SC-001 nhập→xuất→từ chối xuất | T017/T023 | T026/T036 |
| SC-005 Swagger/Postman + tài liệu hai ngôn ngữ | T012/T013/T018/T019/T024/T025/T028/T029/T031–T033 | T040/T041 |
| Logging outcome theo plan (logger hiện tại) | T016/T017/T021 | T040 |
| Ràng buộc migration/quality/kiểm chứng | T001/T006/T009 | T038–T041 |

Chỉ hoàn tất checkbox sau công việc và bằng chứng thật; truy vết không tự chứng minh triển khai.

## Chiến lược triển khai

1. Hoàn tất setup/nền tảng. Giữ Node.js 24, cài package độc lập, ranh giới auth/Gateway, snake_case và migration đã áp dụng bất biến.
2. **MVP chỉ đọc: US1**. Product hiện có không cần backfill tồn vật lý. Kiểm chứng zero/list/detail/auth qua Gateway trước bước tiếp. MVP này chưa hoàn tất milestone Inventory.
3. Thêm US2 thành một increment nhập đầy đủ, gồm idempotency/cleanup có giới hạn. Kiểm chứng replay gốc/trần/inactive/in-progress trả ngay; dùng SQL xem audit.
4. Thêm US3 dùng cùng route/transaction. Kiểm chứng nhập→xuất→từ chối và xuất đúng tồn. Không nhân đôi luồng ghi hoặc tạo route xuất riêng.
5. Thêm US4, kiểm chứng history/catalog hiện tại/chỉ thêm. Hoàn tất scenario quickstart xuyên story, migration/quality gate hiện có và đồng bộ Anh–Việt. Dùng lại bằng chứng story còn đúng; chỉ chạy lại khi thay đổi sau ảnh hưởng hoặc còn scenario chưa rõ.
6. Ghi kết quả/bỏ qua thật; không test file mới/frontend/order/worker/queue/lock service ngoài DB. Checklist có tasks không tự cho phép commit/publish/deploy.

## Kết quả tạo tasks

41 task: setup 2, nền tảng 7, US1 5, US2 8, US3 4, US4 4, cuối 11. Có 13 task `[P]`. Đã kiểm tra ID/thứ tự/dependency/nhãn story/path và trạng thái checkbox hai ngôn ngữ. Không extensions.yml nên bỏ qua hook trước/sau tasks. Lượt skill tạo tasks đã tạo tasks.md và vi/tasks.vi.md; Kết quả implement/migration/runtime/quality được ghi trong validation.vi.md.

Analyze và implement đã hoàn tất. Bước tiếp theo khi được yêu cầu: `$speckit-converge`.

## Phase 8: Convergence

- [X] T042 Sửa schema Swagger Inventory để quantity/balance theo đơn vị nguyên và các trường phân trang/count có kiểu `integer`, giữ bounds và validation runtime đã chốt, theo FR-002, FR-003, FR-008, SC-005 và plan: API DTO contract (partial; F1, LOW). Bằng chứng ban đầu: schema CreateMovementDto.quantity sinh ra là `number` với minimum/maximum nên cho phép số thập phân dù runtime có @IsInt(); schema tồn kho/phân trang cũng là `number`. Files: `apps/api/src/inventory/inventory.dto.ts`, `specs/002-inventory-balances/validation.md`, `specs/002-inventory-balances/vi/validation.vi.md`, `specs/002-inventory-balances/vi/tasks.vi.md`. Kiểm tra thủ công `/docs-json` qua Gateway về kiểu integer của request/query/response và bounds không đổi; xác nhận quantity thập phân vẫn trả 400, không ghi dữ liệu trên PostgreSQL dùng thử. Chạy quality/build API bị ảnh hưởng, ghi kết quả thực tế hai ngôn ngữ và đồng bộ ID/trạng thái task tiếng Việt khi implement. Không thêm test tự động; giữ mọi quyết định nghiệp vụ. Depends on: T041.
