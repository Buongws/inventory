# Kế hoạch triển khai: Search and Responsive Inventory UI

**Branch / ngữ cảnh feature**: `004-search-responsive-inventory` | **Ngày**: 2026-10-07 | **Spec**: [spec.vi.md](spec.vi.md)

**Đầu vào**: spec004 và các quyết định clarify được giữ nguyên. Đây là thiết kế dự kiến, chưa triển khai hoặc kiểm chứng runtime.

## Tóm tắt

Mở rộng GET danh sách tồn với bộ lọc Product phía server và mặc định pagination riêng. Tái sử dụng transaction chỉ đọc, Axios, Redux session, cơ chế hủy request và Ant Design hiện có. Draft của Form chỉ trở thành bộ lọc áp dụng khi submit. Tinh chỉnh layout, giữ auth, drawer, nhập/xuất và idempotency.

## Bối cảnh kỹ thuật

- **Ngôn ngữ/Phiên bản**: Node.js24; TypeScript strict.
- **Dependency chính**: NestJS, TypeORM, pg, class-validator; Next.js16, React19, Ant Design6, Axios, Redux Toolkit hiện có. Không thêm dependency.
- **Lưu trữ**: PostgreSQL products/balances; Redis vẫn thuộc Gateway. Không đổi schema, migration, index hoặc config.
- **Kiểm chứng**: smoke thủ công chỉ đọc trên dev hiện có; quality gates và test hiện có liên quan nếu có. Không thêm test tự động, môi trường hoặc fault fixture.
- **Nền tảng**: FE3002 → Gateway3004 → API3001; desktop1920×1080, tablet768×1024, mobile390×844.
- **Loại dự án**: ba ứng dụng cài độc lập; chỉ sửa Inventory read của API và UI Inventory.
- **Mục tiêu**: một request mỗi submit/reset/page/size, không request mỗi ký tự; rows/count đồng nhất;10 dòng thông thường vừa desktop khi sidebar mở/drawer đóng. Không cam kết latency chưa đo.
- **Giới hạn**: giữ default Product/history, auth/movement; SQL tham số; không abstraction/index suy đoán.
- **Phạm vi**: lọc toàn catalog, response và stock0 giữ nguyên; API limit1–100, FE10/20/50/100.

## Kiểm tra constitution

| Điều kiện | Trước nghiên cứu | Sau thiết kế |
| --- | --- | --- |
| Phạm vi hành vi bao phủ API/FE, loại trừ màn không liên quan | PASS | PASS |
| Giữ phân chia API/Gateway/Axios/Redux | PASS | PASS |
| SQL tham số, mapping created_at hiện có, không đổi schema/config | PASS | PASS |
| Module/thư viện hiện có, không framework/dependency mới | PASS | PASS |
| Có kế hoạch quality gates và bằng chứng trung thực; không thêm test | PASS | PASS |

Đây là kiểm tra tuân thủ thiết kế, không phải PASS runtime. Không có ngoại lệ constitution cần giải trình.

## Cấu trúc dự án

### Tài liệu feature

Bản chuẩn: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/inventory-api.md`, `contracts/ui-contract.md`. Bản dịch tương ứng trong `vi/` với hậu tố `.vi.md`; contracts trong `vi/contracts/`. Không tạo tasks ở bước này.

### Source dự kiến thay đổi

- `apps/api/src/inventory/inventory.dto.ts`, `inventory.controller.ts`, `inventory.service.ts`.
- `apps/web/app/globals.css`.
- `apps/web/components/inventory/inventory-management.tsx`, `inventory-table.tsx`, `constants/inventory.ts`, `api/api-types.ts`, `api/inventory-api.ts`, `hooks/use-inventory-data.ts`.

**Quyết định cấu trúc**: Form nhỏ đặt tại InventoryManagement; không tạo hook/wrapper/utils/framework filter mới. Tái sử dụng use-inventory-resource và hooks drawer/operation. Chỉ chỉnh style drawer nếu kiểm chứng phát hiện vượt viewport, không đổi flow.

## Thiết kế và thứ tự dependency

1. DTO riêng cho list: limit10, q/status/ngày tùy chọn, validate nghiêm và giữ response.
2. listStock xây một bộ predicate/parameter dùng chung items/count trong transaction repeatable-read chỉ đọc; giữ UUID order/left join.
3. Mở rộng params/query state với applied filters; tách default catalog10/history20. Identity gồm actor/filter/page/size/version; rows/error/total chỉ thuộc identity hiện tại, bỏ đối chiếu total chỉ theo actor.
4. Ant Form sở hữu draft; Input/Select/hai DatePicker độc lập chỉ chọn lịch. Submit/reset tăng catalogVersion kể cả giá trị không đổi; page và reload sau movement giữ applied filters.
5. CSS scoped Inventory, spacing/density/pagination/thư viện/sidebar trigger; giữ font/nội dung quan trọng, horizontal scroll cục bộ,20+ dòng cuộn document. Không ép fit bằng clipping/fixed height.
6. Ở implement mới chạy quickstart/gates và ghi kết quả. Lượt plan không tạo tasks hoặc code.

## Tương thích và bàn giao

Chỉ GET `/api/v1/inventory` đổi omitted limit20→10. History20, Product endpoints, auth/error/stock shape, POST key/payload và transaction giữ nguyên. Filter tùy chọn; query sai/unknown400. Không config/migration/dữ liệu/rollback script; rollback bằng revert source liên quan.

## Chiến lược kiểm chứng

Theo [quickstart.vi.md](quickstart.vi.md): dev chỉ đọc; thiếu dữ liệu phân biệt ngày/status thì ghi chưa kiểm chứng. `npm run check`, `npm run build`, test API liên quan hiện có nếu có. Lượt plan chỉ đọc source/tài liệu, không claim smoke/test/build PASS.
