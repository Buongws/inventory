# Tasks: Search and Responsive Inventory UI

**Đầu vào**: `specs/004-search-responsive-inventory/` — spec, plan, research, data-model, API/UI contracts và quickstart đã chốt; bản chuẩn [tasks.md](../tasks.md).

**Trạng thái**: Tạo 2026-10-07, tất cả pending. Tạo tasks không phải analyze/implement; không claim runtime/gates PASS.

**Tổ chức**: Ba story đều P1; US1→US2→US3 vì tái dùng filter UI/query state. Backend/FE nằm trong story tương ứng; setup/foundation dùng infrastructure hiện có, không cài đặt/tạo môi trường.

**Giới hạn**: catalog1/10/history1/20/shared Axios-Redux; giữ auth/drawer/movement/idempotency. Không dependency/index/abstraction/test tự động/môi trường/proxy/fault matrix mới; không sửa dữ liệu dev. Verification là smoke thủ công/gates hiện có, không test mới.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with file paths`. `[P]` chỉ khác file/không phụ thuộc lẫn nhau sau prerequisite chung, không cấp quyền spawn agent. Path tương đối root; T001 mới tạo evidence files ở lượt implement.

## Giai đoạn 1: Setup

Baseline chỉ đọc và chuẩn bị bằng chứng.

- [ ] T001 Đọc AGENTS.md, constitution/conventions; xác nhận source baseline và stack dev hiện có, không start process trùng. Tạo checklist bằng chứng ban đầu NOT RUN trong `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md` theo quickstart; ghi FE3002→Gateway3004→API3001, PostgreSQL55433/Redis6379, giới hạn dữ liệu sẵn và giữ bằng chứng003. Không fixture/sửa dữ liệu dev.


## Giai đoạn 2: Foundation

Phụ thuộc T001; cả hai chặn story implementation. T002/T003 độc lập.

- [ ] T002 [P] Tách default catalog10/history20 tại `apps/web/components/inventory/constants/inventory.ts`, cập nhật consumer cần thiết ở `apps/web/components/inventory/hooks/use-inventory-data.ts`. Mở rộng params riêng stock tại `apps/web/components/inventory/api/api-types.ts` và `apps/web/components/inventory/api/inventory-api.ts` cho q/status/createdFrom/createdTo; giữ params history/shared Axios. Tiêu chí: stock đầu1/10, history1/20, size10/20/50/100.

- [ ] T003 [P] Thêm InventoryListQueryDto riêng list tại `apps/api/src/inventory/inventory.dto.ts`, kế thừa page/safe-offset và override limit10/integer1–100. Giữ InventoryPageDto/history20. Tiêu chí: omitted pagination1/10 chỉ catalog, không đổi default endpoint khác.


## Giai đoạn 3: US1 — Tìm sản phẩm toàn catalog (P1, MVP)

Mục tiêu: server filter tên/SKU/status/Product.createdAt, UI chỉ tìm khi submit. Kiểm độc lập: match ngoài trang đầu/case-trim/combined/ngày một phía-cùng ngày/total đúng/query sai400/FE validation không dispatch. Bao phủ FR001–009/017–018, SC001–002 và phần submit SC003; phụ thuộc T002,T003.

- [ ] T004 [US1] Mở rộng validation InventoryListQueryDto tại `apps/api/src/inventory/inventory.dto.ts`: scalar q trim/rỗng bỏ/max200 Unicode code points; ACTIVE/INACTIVE; YYYY-MM-DD Gregorian thật năm0001–9999; ngày một phía và range order. Từ chối date gửi rỗng/0000/ngày sai/leap sai/whitespace/timestamp/array/repeated/unknown bằng400 INVALID_INPUT; không normalize/swap. Phụ thuộc T003.

- [ ] T005 [US1] Mở rộng listStock tại `apps/api/src/inventory/inventory.service.ts`: một bộ WHERE/parameter dùng chung items/count; ILIKE name OR SKU literal escape !/%/_, AND status/Product.created_at. Chuyển From midnight và To ngày kế tiếp UTC+7→UTC, xử lý năm1–99/bound năm10000. Giữ repeatable-read/read-only, UUID ASC, left join stock0/envelope; filter trước LIMIT/OFFSET; page ngoài phạm vi items rỗng/total sau lọc, không clamp. Phụ thuộc T004.

- [ ] T006 [US1] Dùng InventoryListQueryDto chỉ GET /api/v1/inventory tại `apps/api/src/inventory/inventory.controller.ts`; cập nhật Swagger list/query ở controller/DTO. Giữ ADMIN guard/GET body restriction/error envelope/history/detail/POST. Phụ thuộc T005.

- [ ] T007 [US1] Thêm một applied-filter object/submit action vào query state hiện có tại `apps/web/components/inventory/hooks/use-inventory-data.ts`; sửa `apps/web/components/inventory/types/hook-types.ts` nếu cần. Normalize/bỏ condition rỗng, page1/tăng catalogVersion mỗi submit hợp lệ kể cả filter không đổi; draft edit không fetch. Truyền applied filters vào listStock, giữ auth enable gates/movement-history độc lập. Phụ thuộc T002,T006.

- [ ] T008 [US1] Thêm Ant Form local trên table tại `apps/web/components/inventory/inventory-management.tsx`: Input tên/SKU có label, Select All/ACTIVE/INACTIVE, hai DatePicker From/To clearable/inputReadOnly/ YYYY-MM-DD, Tìm kiếm submit kể cả Enter và nút Làm mới được nối ở T011. Form owns draft; validate q sau trim/calendar/range bằng lỗi field/không GET/không sửa ngày. Không duplicate draft state/hook/wrapper. Phụ thuộc T007.

- [ ] T009 [US1] Smoke API ngắn chỉ đọc qua Gateway hiện có: defaults/name-SKU case-trim/punctuation literal/status/combined/date một phía-cùng ngày/query sai400/items-total/page ngoài phạm vi. Đối chiếu Product.createdAt/boundary sẵn; thiếu boundary/year-edge thì NOT RUN, không tạo fixture để PASS; ghi `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Phụ thuộc T006.

- [ ] T010 [US1] Smoke UI filter: GET đầu1/10; edit text/status/date không GET; tên/SKU ngoài trang đầu/case-trim/combined-date một phía/Enter; submit lặp tải page1; range đảo/q quá dài lỗi không dispatch. Picker chỉ chọn lịch không chứng minh nhập tay ngày sai. Ghi Network/UI đã che bí mật tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Phụ thuộc T008,T009.


## Giai đoạn 4: US2 — Điều hướng và reset kết quả (P1)

Mục tiêu: applied-filter paging/reset/retry, state phân biệt/response cũ không ghi đè. Kiểm độc lập: page bỏ qua draft/size→1/reset clear-reload giữ size/empty-beyond-end-error khác nhau/rows-total query mới nhất/drawer-history giữ. Bao phủ FR010–014, SC003–004/007; phụ thuộc US1.

- [ ] T011 [US2] Hoàn tất reset/page/size/retry ở `apps/web/components/inventory/hooks/use-inventory-data.ts`, nối Làm mới tại `apps/web/components/inventory/inventory-management.tsx`: clear Form/applied/page1/giữ size/reload kể cả đã clear; paging/retry dùng applied không draft; đổi size→page1. Reload catalog sau movement giữ applied; history20. Phụ thuộc T010.

- [ ] T012 [US2] Identity catalog gồm actor/normalized filters/page/size/version tại `apps/web/components/inventory/hooks/use-inventory-data.ts`; tái dùng cancellation/visibility của `apps/web/components/inventory/hooks/use-inventory-resource.ts`, không abstraction mới. Thay total theo actor-prefix bằng ready data đúng identity, tránh rows/error/total muộn ghi vào filter/page/size/session mới. Phụ thuộc T011.

- [ ] T013 [US2] Hiển thị server pagination/total sau lọc, tách loading/error-retry/no-match và beyond-end tại `apps/web/components/inventory/inventory-table.tsx`; sửa `apps/web/components/inventory/types/component-types.ts` nếu cần. Không lọc client-page/stale total/tự clamp/coi lỗi stock0; giữ Inventory action. Phụ thuộc T012.

- [ ] T014 [US2] Smoke UI chỉ đọc: page với draft chưa submit/các size/reset từ page sau/reset đã clear/no-match/loading/error-retry cơ bản nếu quan sát được. Có thể browser throttling hai request, không fixture fault; rows/total cuối đúng query mới nhất. Error/overlap/session không quan sát thì NOT RUN tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Phụ thuộc T013.

- [ ] T015 [US2] Đối chiếu changed paths với `apps/web/components/inventory/inventory-drawer.tsx` và `apps/web/components/inventory/hooks/use-inventory-operation.ts`: filter không POST/đổi selection-key-payload-recovery; mở drawer chỉ đọc/xem history20. Ghi source review riêng UI tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`; giữ bằng chứng movement trước, không write dev/chạy lại auth-idempotency nâng cao. Phụ thuộc T014.


## Giai đoạn 5: US3 — UI desktop/tablet/mobile dễ dùng (P1)

Mục tiêu:10 dòng vừa desktop và control màn hẹp usable, giữ nội dung. Kiểm độc lập:1920×1080 thật không cuộn dọc ở default;768×1024/390×844 thao tác được/không overflow ngang document;20+/text dài đọc được. Bao phủ FR015–016, SC005–006; phụ thuộc US2.

- [ ] T016 [P] [US3] Chỉnh spacing/filter-action wrap-stack scoped Inventory tại `apps/web/app/globals.css`: font dễ đọc/min-width0/table horizontal scroll cục bộ/20+ cuộn dọc tự nhiên; không hide overflow/clipping; giữ style màn khác. Phụ thuộc T015; song song T017.

- [ ] T017 [P] [US3] Tinh chỉnh Table density/pagination-size-total responsive/nội dung dễ đọc tại `apps/web/components/inventory/inventory-table.tsx`; giữ horizontal scroll cục bộ/nút Inventory dùng được. Không giảm font/cắt text quan trọng/fixed-height table cuộn dọc để ép10 dòng. Phụ thuộc T015; song song T016.

- [ ] T018 [US3] Tinh chỉnh header/reminder/filter layout/Sider trigger hiện có tại `apps/web/components/inventory/inventory-management.tsx`; giữ ý nghĩa reminder/sidebar thu gọn mở lại được. Kiểm width viewport tại `apps/web/components/inventory/inventory-drawer.tsx`, chỉ sửa presentation nếu overflow, không đổi auth/operation. Phụ thuộc T016,T017.

- [ ] T019 [US3] Kiểm viewport CSS thật1920×1080/100% zoom/sidebar mở/10 dòng thông thường/drawer đóng (không cuộn dọc document hoặc table-body),768×1024/390×844 (mở lại sidebar/submit-reset/table scroll cục bộ/actions/page-size/drawer/không overflow ngang document).20+/text dài vẫn cuộn/đọc được. Ghi screenshot/đo scroll/kết quả-giới hạn tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`, build không là UI PASS. Phụ thuộc T018.


## Giai đoạn 6: Hoàn thiện và bằng chứng bàn giao

Phụ thuộc mọi story phase; bao phủ FR018/SC008 và tương thích feature.

- [ ] T020 Chạy Node24 `npm run check`, `npm run build` trong `package.json`; chỉ sửa lỗi liên quan feature, ghi exit/kết quả vào `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Xem `apps/api/test/`, chạy test liên quan hiện có nếu có; hiện directory không tồn tại, không tạo suite/claim thiếu suite là PASS. Ghi rõ lỗi baseline ngoài scope. Phụ thuộc T019.

- [ ] T021 Đối chiếu behavior thực với `specs/004-search-responsive-inventory/contracts/inventory-api.md`, `contracts/ui-contract.md`, `quickstart.md` và bản `vi/`; sửa drift tài liệu, không âm thầm đổi clarify. Kiểm defaults10/20/endpoint-auth-movement giữ/no dependency-index-framework-config-migration mới. Ghi tương thích tại `specs/004-search-responsive-inventory/validation.md`. Phụ thuộc T020.

- [ ] T022 Hoàn tất kết quả/gap đồng bộ tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`; update checkbox tương ứng ở `specs/004-search-responsive-inventory/tasks.md` và `specs/004-search-responsive-inventory/vi/tasks.vi.md` chỉ khi đủ bằng chứng. Check bắt buộc chưa chạy giữ pending/ghi lý do; HTTP-build-source review không là UI PASS. Báo FE http://localhost:3002, dừng không tự converge. Phụ thuộc T021.


## Dependency và thứ tự

```text
T001 → (T002 ∥ T003)
T003 → T004 → T005 → T006 → T009
(T002 + T006) → T007 → T008
(T008 + T009) → T010
T010 → T011 → T012 → T013 → T014 → T015
T015 → (T016 ∥ T017) → T018 → T019 → T020 → T021 → T022
```

Foundation→US1→US2→US3→bàn giao. Verification yêu cầu UI không được hoàn tất chỉ bằng code/HTTP. Thiếu dữ liệu/error/overlap bắt buộc: NOT RUN/task kiểm chứng pending, không mở scope để tạo coverage.

## Ví dụ song song

- Foundation: T002 FE params/defaults và T003 API DTO cùng chạy sau T001.
- US1: sau T006/T002, T009 API smoke có thể cùng T007/T008 FE; T010 chờ cả hai. Chỉ đọc/ownership khác; ghi evidence tuần tự, không cùng điều khiển browser.
- US2: T011–T015 tuần tự vì cùng hook hoặc kiểm state tích hợp, không implementation pair độc lập an toàn.
- US3: T016 CSS/T017 Table cùng sau T015; T018 tích hợp/T019 kiểm. Đây là story implementation tasks có `[P]`.

## Chiến lược và hoàn tất

1. MVP foundation+US1 T001–T010: server search thật/Form submit-only; chưa hoàn tất reset/navigation/responsive, không bàn giao control chưa xong như đã hoàn tất.
2. Tiếp US2/kiểm paging-reset-identity, rồi US3/viewport thật; same-file tuần tự.
3. Gates trên code cuối, chỉ lặp khi đổi code/fail; test hiện có là điều kiện, không task tạo test mới. Không kiểm lại003 nâng cao hoặc write movement dev.
4. Evidence PASS/FAIL/NOT RUN từng check/môi trường/thao tác/Network đã che/viewport UI thật. Tách code completion với verification còn thiếu; hai tasks đồng bộ ID/status.
5. Tạo tasks không tự deploy/commit/analyze/implement/converge; bước sau theo yêu cầu người dùng.

## Thống kê

22 tasks: setup1/foundation2/US1 bảy/US2 năm/US3 bốn/final3. `[P]`: T002/T003, T016/T017. Không tạo task test tự động; mọi checkbox chưa đánh dấu.
