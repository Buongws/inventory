# Tasks: Search and Responsive Inventory UI

**Đầu vào**: `specs/004-search-responsive-inventory/` — spec, plan, research, data-model, API/UI contracts và quickstart đã chốt; bản chuẩn [tasks.md](../tasks.md).

**Trạng thái**: Implement hoàn tất.23/23 tasks checked. Ngày2026-10-07 người dùng xác nhận đã tự kiểm chứng tất cả phần còn thiếu đạt; xem validation.vi.md để phân biệt nguồn bằng chứng và giới hạn.

**Tổ chức**: Ba story đều P1; code prerequisites US1→US2→US3 vì tái dùng filter UI/query state; verification là track riêng, thiếu bằng chứng không chặn code/gates độc lập. Backend/FE nằm trong story tương ứng; setup/foundation dùng infrastructure hiện có, không cài đặt/tạo môi trường.

**Giới hạn**: catalog1/10/history1/20/shared Axios-Redux; giữ auth/details/movement/idempotency. Không dependency/index/abstraction/test tự động/môi trường/proxy/fault matrix mới; không sửa dữ liệu dev. Verification là smoke thủ công/gates hiện có, không test mới.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with file paths`. `[P]` chỉ khác file/không phụ thuộc lẫn nhau sau prerequisite chung, không cấp quyền spawn agent. Path tương đối root; T001 mới tạo evidence files ở lượt implement.

## Giai đoạn 1: Setup

Baseline chỉ đọc và chuẩn bị bằng chứng.

- [X] T001 Đọc AGENTS.md, constitution/conventions; xác nhận source baseline và stack dev hiện có, không start process trùng. Tạo checklist bằng chứng ban đầu NOT RUN trong `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md` theo quickstart; ghi FE3002→Gateway3004→API3001, PostgreSQL55433/Redis6379, giới hạn dữ liệu sẵn và giữ bằng chứng003. Không fixture/sửa dữ liệu dev.


## Giai đoạn 2: Foundation

Phụ thuộc T001; cả hai chặn story implementation. T002/T003 độc lập.

- [X] T002 [P] Tách default catalog10/history20 tại `apps/web/components/inventory/constants/inventory.ts`, cập nhật consumer cần thiết ở `apps/web/components/inventory/hooks/use-inventory-data.ts`. Mở rộng params riêng stock tại `apps/web/components/inventory/api/api-types.ts` và `apps/web/components/inventory/api/inventory-api.ts` cho q/status/createdFrom/createdTo; giữ params history/shared Axios. Tiêu chí: stock đầu1/10, history1/20, size10/20/50/100.

- [X] T003 [P] Thêm InventoryListQueryDto riêng list tại `apps/api/src/inventory/inventory.dto.ts`, kế thừa page/safe-offset và override limit10/integer1–100. Giữ InventoryPageDto/history20. Tiêu chí: omitted pagination1/10 chỉ catalog, không đổi default endpoint khác.


## Giai đoạn 3: US1 — Tìm sản phẩm toàn catalog (P1, MVP)

Mục tiêu: server filter tên/SKU/status/Product.createdAt, UI chỉ tìm khi submit. Kiểm độc lập: match ngoài trang đầu/case-trim/combined/ngày một phía-cùng ngày/total đúng/query sai400/FE validation không dispatch. Bao phủ FR001–009/017–018, SC001–002 và phần submit SC003; phụ thuộc T002,T003.

- [X] T004 [US1] Mở rộng validation InventoryListQueryDto tại `apps/api/src/inventory/inventory.dto.ts`: scalar q trim/rỗng bỏ/max200 Unicode code points; ACTIVE/INACTIVE; YYYY-MM-DD Gregorian thật năm0001–9999; ngày một phía và range order. Từ chối date gửi rỗng/0000/ngày sai/leap sai/whitespace/timestamp/array/repeated/unknown bằng400 INVALID_INPUT; không normalize/swap. Phụ thuộc T003.

- [X] T005 [US1] Mở rộng listStock tại `apps/api/src/inventory/inventory.service.ts`: một bộ WHERE/parameter dùng chung items/count; ILIKE name OR SKU literal escape !/%/_, AND status/Product.created_at. Chuyển From midnight và To ngày kế tiếp UTC+7→UTC, xử lý năm1–99/bound năm10000. Giữ repeatable-read/read-only, UUID ASC, left join stock0/envelope; filter trước LIMIT/OFFSET; page ngoài phạm vi items rỗng/total sau lọc, không clamp. Phụ thuộc T004.

- [X] T006 [US1] Dùng InventoryListQueryDto chỉ GET /api/v1/inventory tại `apps/api/src/inventory/inventory.controller.ts`; cập nhật Swagger list/query ở controller/DTO. Giữ ADMIN guard/GET body restriction/error envelope/history/detail/POST. Phụ thuộc T005.

- [X] T007 [US1] Thêm một applied-filter object/submit action vào query state hiện có tại `apps/web/components/inventory/hooks/use-inventory-data.ts`; sửa `apps/web/components/inventory/types/hook-types.ts` nếu cần. Normalize/bỏ condition rỗng, page1/tăng catalogVersion mỗi submit hợp lệ kể cả filter không đổi; draft edit không fetch. Truyền applied filters vào listStock, giữ auth enable gates/movement-history độc lập. Phụ thuộc T002,T006.

- [X] T008 [US1] Thêm Ant Form local trên table tại `apps/web/components/inventory/inventory-management.tsx`: Input tên/SKU có label, Select All/ACTIVE/INACTIVE, hai DatePicker From/To clearable/inputReadOnly/ YYYY-MM-DD, Tìm kiếm submit kể cả Enter và nút Làm mới được nối ở T011. Form owns draft; picker ngăn nhập/chọn ngày sai, Form validate q sau trim/range đảo bằng lỗi field/không GET/không sửa ngày. Bằng chứng FE prevention/range riêng backend, không wrapper/fault framework kiểm chứng. Không duplicate draft state/hook/wrapper. Phụ thuộc T007.

- [X] T009 [US1] Smoke API ngắn chỉ đọc qua Gateway hiện có: defaults/name-SKU case-trim/punctuation literal/status/combined/date một phía-cùng ngày/query sai400/items-total/page ngoài phạm vi. Đối chiếu Product.createdAt/boundary sẵn; thiếu boundary/year-edge thì NOT RUN, không tạo fixture để PASS; ghi `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Phụ thuộc T006. Ghi backend ngày thật/range400 riêng, không coi là FE PASS.

- [X] T010 [US1] Smoke UI filter: GET đầu1/10; edit text/status/date không GET; tên/SKU ngoài trang đầu/case-trim/combined-date một phía/Enter; submit lặp tải page1; range đảo/q quá dài lỗi không dispatch. Quan sát/ghi picker ngăn nhập-chọn ngày sai và Form range đảo-không dispatch riêng backend400; không wrapper/fault framework. Ghi Network/UI đã che bí mật tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Phụ thuộc T008.


## Giai đoạn 4: US2 — Điều hướng và reset kết quả (P1)

Mục tiêu: applied-filter paging/reset/retry, state phân biệt/response cũ không ghi đè. Kiểm độc lập: page bỏ qua draft/size→1/reset clear-reload giữ size/empty-beyond-end-error khác nhau/rows-total query mới nhất/trang details-history giữ. Bao phủ FR010–014, SC003–004/007; phụ thuộc code US1 T008, không smoke T009/T010.

- [X] T011 [US2] Hoàn tất reset/page/size/retry ở `apps/web/components/inventory/hooks/use-inventory-data.ts`, nối Làm mới tại `apps/web/components/inventory/inventory-management.tsx`: clear Form/applied/page1/giữ size/reload kể cả đã clear; paging/retry dùng applied không draft; đổi size→page1. Reload catalog sau movement giữ applied; history20. Phụ thuộc T008.

- [X] T012 [US2] Identity catalog gồm actor/normalized filters/page/size/version tại `apps/web/components/inventory/hooks/use-inventory-data.ts`; tái dùng cancellation/visibility của `apps/web/components/inventory/hooks/use-inventory-resource.ts`, không abstraction mới. Chỉ publish ready rows/error/total đúng full identity, tránh response muộn ghi vào kết quả mới. Riêng loading, pagination có thể giữ count gần nhất cùng actor/applied filters làm placeholder navigation, không là response ready. Phụ thuộc T011.

- [X] T013 [US2] Hiển thị server pagination/total sau lọc, tách loading/error-retry/no-match và beyond-end tại `apps/web/components/inventory/inventory-table.tsx`; sửa `apps/web/components/inventory/types/component-types.ts` nếu cần. Không lọc client-page/stale total/tự clamp/coi lỗi stock0; giữ Inventory action. Phụ thuộc T012.

- [X] T014 [US2] Smoke UI chỉ đọc: page với draft chưa submit/các size/reset từ page sau/reset đã clear/no-match/loading/error-retry cơ bản nếu quan sát được. Có thể browser throttling hai request, không fixture fault; rows/total cuối đúng query mới nhất. Error/overlap/session không quan sát thì NOT RUN tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Phụ thuộc T013.

- [X] T015 [US2] Đối chiếu changed paths với `apps/web/components/inventory/inventory-details.tsx` và `apps/web/components/inventory/hooks/use-inventory-operation.ts`: filter không POST/đổi selection-key-payload-recovery; mở trang details chỉ đọc/xem history20. Ghi source review riêng UI tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`; giữ bằng chứng movement trước, không write dev/chạy lại auth-idempotency nâng cao. Phụ thuộc T013.


## Giai đoạn 5: US3 — UI desktop/tablet/mobile dễ dùng (P1)

Mục tiêu:10 dòng vừa desktop và control màn hẹp usable, giữ nội dung. Kiểm độc lập:1920×1080 thật không cuộn dọc ở default;768×1024/390×844 thao tác được/không overflow ngang document;20+/text dài đọc được. Bao phủ FR015–016, SC005–006; phụ thuộc code US2 T013, không verification T014/T015.

- [X] T016 [P] [US3] Chỉnh spacing/filter-action wrap-stack scoped Inventory tại `apps/web/app/globals.css`: font dễ đọc/min-width0/table horizontal scroll cục bộ/20+ cuộn dọc tự nhiên; không hide overflow/clipping; giữ style màn khác. Phụ thuộc T013; song song T017.

- [X] T017 [P] [US3] Tinh chỉnh Table density/pagination-size-total responsive/nội dung dễ đọc tại `apps/web/components/inventory/inventory-table.tsx`; giữ horizontal scroll cục bộ/nút Inventory dùng được. Không giảm font/cắt text quan trọng/fixed-height table cuộn dọc để ép10 dòng. Phụ thuộc T013; song song T016.

- [X] T018 [US3] Tinh chỉnh header/reminder/filter layout/Sider trigger hiện có tại `apps/web/components/inventory/inventory-management.tsx`; giữ ý nghĩa reminder/sidebar thu gọn mở lại được. Kiểm width viewport tại `apps/web/components/inventory/inventory-details.tsx`, chỉ sửa presentation nếu overflow, không đổi auth/operation. Phụ thuộc T016,T017.

- [X] T019 [US3] Kiểm viewport CSS thật1920×1080/100% zoom/sidebar mở/10 dòng thông thường/đang ở danh sách (không cuộn dọc document hoặc table-body),768×1024/390×844 (mở lại sidebar/submit-reset/table scroll cục bộ/actions/page-size/trang details/không overflow ngang document).20+/text dài vẫn cuộn/đọc được. Ghi screenshot/đo scroll/kết quả-giới hạn tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`, build không là UI PASS. Phụ thuộc T018.


## Giai đoạn 6: Hoàn thiện và bằng chứng bàn giao

Chỉ phụ thuộc code/doc prerequisites; gates/bàn giao tiếp tục được với gap verification. Bao phủ FR018/SC008 và tương thích feature.

- [X] T020 Chạy Node24 `npm run check`, `npm run build` trong `package.json`; chỉ sửa lỗi liên quan feature, ghi exit/kết quả vào `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`. Xem `apps/api/test/`, chạy test liên quan hiện có nếu có; hiện directory không tồn tại, không tạo suite/claim thiếu suite là PASS. Ghi rõ lỗi baseline ngoài scope. Phụ thuộc T018.

- [X] T021 Cập nhật ví dụ GET search/filter/pagination tại `apps/api/postman/inventory.postman_collection.json`: q tên/SKU/status/createdFrom-createdTo/combined/page-limit10/phân trang; mô tả stock10/history20. Giữ scripts/environment references hiện có, không thêm test script/test chạy collection/environment. Chỉ đổi tài liệu collection, task này không chạy request. Phụ thuộc T006.

- [X] T022 Đối chiếu behavior thực với `specs/004-search-responsive-inventory/contracts/inventory-api.md`, `contracts/ui-contract.md`, `quickstart.md` và bản `vi/`; sửa drift tài liệu, không âm thầm đổi clarify. Kiểm defaults10/20/endpoint-auth-movement giữ/no dependency-index-framework-config-migration mới. Ghi tương thích tại `specs/004-search-responsive-inventory/validation.md`. Phụ thuộc T018,T021.

- [X] T023 Hoàn tất kết quả/gap đồng bộ tại `specs/004-search-responsive-inventory/validation.md` và `specs/004-search-responsive-inventory/vi/validation.vi.md`; update checkbox tương ứng ở `specs/004-search-responsive-inventory/tasks.md` và `specs/004-search-responsive-inventory/vi/tasks.vi.md` chỉ khi đủ bằng chứng. Check bắt buộc chưa chạy giữ pending/ghi lý do; HTTP-build-source review không là UI PASS. Báo FE http://localhost:3002, dừng không tự converge. Phụ thuộc T022. Thu trạng thái T009/T010/T014/T019/T020 mà không yêu cầu checkbox hoàn tất; liệt kê mọi NOT RUN/pending/fail và lý do. Hoàn tất báo cáo không chứng nhận kiểm chứng feature.


## Dependency và thứ tự

```text
Code/documentation:
T001 → (T002 ∥ T003)
T003 → T004 → T005 → T006
(T002 + T006) → T007 → T008 → T011 → T012 → T013
T013 → (T016 ∥ T017) → T018
T006 → T021
(T018 + T021) → T022 → T023

Verification / quality gates (no outgoing code prerequisite):
T006 → T009
T008 → T010
T013 → T014
T013 → T015
T018 → T019
T018 → T020
```

Dependency implementation chỉ yêu cầu code sẵn, không phải smoke story hoàn tất. T009/T010/T014/T019 có thể pending với NOT RUN từng check mà không chặn T011–T018/T020. T021 cập nhật doc độc lập sau backend contract. T022 đối chiếu code/contracts; T023 ghi mọi trạng thái verification/gate kể cả fail/NOT RUN, không yêu cầu task đó checked complete. Hoàn tất báo cáo bàn giao không là hoàn tất kiểm chứng feature.

## Ví dụ song song

- Foundation: T002/T003 sau T001, khác file FE/API.
- US1: T009 API smoke hoặc T021 ví dụ Postman có thể cùng T007/T008 khi prerequisite sẵn; T010 chỉ chờ T008, không API smoke. Ghi evidence/browser control tuần tự.
- US2: code T011/T012/T013 tuần tự; T014/T015 không chặn code sau, evidence/browser chung xử lý tuần tự.
- US3: T016 CSS/T017 Table sau T013, T018 tích hợp. T019 viewport/T020 gates lập lịch độc lập sau T018; process/browser xung đột xử lý tuần tự.

## Chiến lược và hoàn tất

1. MVP code T001–T008; verification T009/T010 khi có thể, tách code xong và đã kiểm chứng. Reset/navigation/responsive ở increment sau, không claim hoàn tất cùng search ban đầu.
2. Tiếp code T011–T013 rồi T016–T018 dù smoke trước thiếu data; cùng file tuần tự.
3. T020 trên code cuối không chờ viewport/error/boundary; ghi fail thật, chỉ lặp khi đổi code/fail. Không test mới/matrix003 nâng cao/write movement dev.
4. Check bắt buộc chưa chạy giữ NOT RUN/checkbox verification pending, ghi subcheck đã quan sát riêng. Code/gates/report độc lập xong không biến gap thành PASS; T023 bàn giao liệt kê phần thiếu/lý do.
5. Nghiệm thu ngày FE tách picker prevention và Form range-không dispatch. Backend ngày thật/range400 ghi riêng, không là FE PASS.
6. Đồng bộ ID/status Anh–Việt. Sửa tài liệu không tự deploy/commit/rerun analyze/implement/converge.

## Thống kê

23 tasks: setup1/foundation2/US1 bảy/US2 năm/US3 bốn/final4. `[P]`: T002/T003, T016/T017. Thêm T021 ví dụ Postman; T021/T022 cũ thành T022/T023. Không task test tự động, 23 tasks checked; bốn task verification cuối được đóng theo xác nhận kiểm chứng thủ công của người dùng ghi tại validation.vi.md.

## Nghiệm thu route details được chấp thuận (T015/T019)

T015 bổ sung `/inventory/[productId]`: mở từ row, URL trực tiếp/reload, stock/history1/20, lỗi product sai/không tồn tại với submit disabled, quay về bằng control app/sidebar giữ draft/applied filters và catalog page/size. Review wiring departure sending/uncertain và abort trước discard, không movement write. T019 thêm history/form details tới được và cuộn ngang table cục bộ trên tablet/mobile. Bao phủ FR-019/SC-009; không test tự động/matrix fault nâng cao. Source review không hoàn thành task UI. Giữ dependency UI người dùng đã cài; không cài mới.

T015 hoàn tất trong lượt browser ổn định: details trực tiếp/reload/history1/20, giữ applied/draft/context danh sách, product không tồn tại404/submit disabled/retry GET, kiểm Method Network và review source departure/idempotency. Không chạy lại matrix fault/bfcache operation pending. Xem section validation mới nhất; còn bốn task verification pending.

Đóng implement2026-10-07: người dùng xác nhận mọi kiểm chứng còn thiếu đã tự test đạt và yêu cầu bước tiếp theo. Xác nhận này thay trạng thái pending trước đó; không chạy lại browser.
