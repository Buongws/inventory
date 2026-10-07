# Quickstart và kiểm chứng dự kiến

**Trạng thái**: chỉ hướng dẫn; chưa chạy scenario/gates trong plan. Ghi từng kết quả PASS/FAIL/NOT RUN với môi trường/viewport/giới hạn.

## Điều kiện và lệnh

Chỉ dev hiện có: FE `http://localhost:3002`, Gateway3004, API3001, PostgreSQL local55433, Redis6379. Xác nhận config cục bộ không in credentials. Không khởi tạo stack dùng thử/fixture, sửa record dev hoặc cài dependency cho feature.

Tại root dùng Node24. Stack dừng thì `npm run dev` sau khi PG/Redis sẵn; không start trùng. Sau implement chạy `npm run check`, `npm run build`; xem test API liên quan hiện có và chạy nếu có, không thêm mới hoặc coi thiếu suite là PASS.

Login admin hiện có, dùng Product/status/timestamp sẵn. Kiểm tra biên ngày dựa Product.createdAt đọc thật; thiếu dữ liệu phân biệt thì NOT RUN. Network ghi query/dispatch/response đã che auth headers/cookies. Không fault setup hoặc chạy lại kiểm chứng nâng cao003.

## Smoke ngắn

1. Mở Inventory: GET đầu1/10, guard/drawer hiện có. Ghi query/rows/count.
2. Edit name/SKU chưa submit không GET; submit mixed-case/whitespace name rồi SKU, đối chiếu trim/search toàn catalog. `%`/`_` literal khi kiểm tra.
3. ACTIVE/INACTIVE/All và kết hợp text/status/date; đối chiếu products/total có sẵn.
4. From-only/To-only/cùng ngày/no date theo UTC+7 [contract](contracts/inventory-api.vi.md). Range đảo báo FE error/không GET. Picker chỉ chọn lịch nên không nhập ngày vô thực; độc lập gửi GET read-only sai qua client đã auth để xác nhận backend400, ví dụ2026-02-30/timestamp/range đảo. Không coi đó là chứng minh UI nhập ngày sai.
5. Đổi page khi draft chưa submit: giữ applied; size20/50/100→page1; reset xóa filter/page1/giữ size/reload. No-match và GET page ngoài phạm vi: items rỗng/total đúng/không clamp.
6. Quan sát loading/error cơ bản/retry nếu gặp tự nhiên, không fault. Có thể browser network throttling rồi submit hai filter/page, kiểm tra kết quả cuối đúng identity; ghi request đã quan sát, không claim race đầy đủ. Không quan sát được thì NOT RUN.
7. Drawer stock/history/actions dùng được; tránh movement write dev. History vẫn default20. Không tái chứng nhận auth/idempotency/flow nâng cao.
8.1920×1080/sidebar mở/10/drawer đóng: screenshot/document scroll height thật.768×1024/390×844: sidebar reopening/filter wrap/table scroll/actions/pagination/drawer.20+ được cuộn dọc.

## Bằng chứng và giới hạn

Mỗi check ghi ngày/URL dev/viewport/thao tác/request-response đã che bí mật/UI thật. Gates riêng. Source review chỉ hỗ trợ thiết kế; HTTP không là UI PASS. Dữ liệu sẵn có thể chưa đủ kiểm biên ngày/status. Không test mới/proxy/fault matrix/môi trường; không mutation/replay và không suy luận browser abort là backend rollback.
