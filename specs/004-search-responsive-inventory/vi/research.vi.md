# Nghiên cứu: Search and Responsive Inventory UI

**Ngày**: 2026-10-07. Nghiên cứu API/FE chỉ đọc; chưa kiểm chứng runtime.

## Query và default pagination

- **Quyết định**: InventoryListQueryDto riêng GET /api/v1/inventory, kế thừa pagination và override limit10; history giữ20. q/status/createdFrom/createdTo là scalar tùy chọn; từ chối unknown/non-scalar.
- **Lý do**: DTO hiện dùng chung stock/history; global validation đã transform/forbid unknown.
- **Phương án khác**: đổi default toàn cục hoặc generic filter DTO mở rộng phạm vi không cần thiết. [NestJS validation](https://docs.nestjs.com/techniques/validation).

## Tìm literal và count

- **Quyết định**: trim q, rỗng không giới hạn, tối đa200 Unicode code points. ILIKE name OR SKU với escape `!`; escape `!`, `%`, `_` trước khi bao `%`. AND status/ngày. Một bộ predicate/parameter dùng chung items/count.
- **Lý do**: text không thành SQL/wildcard; transaction repeatable-read chỉ đọc hiện có cho snapshot chung; count chỉ products p.
- **Phương án khác**: lọc FE, wildcard từ người dùng, hai bộ filter và index mới bị loại. Giữ order/stock0; chưa có đo đạc chứng minh cần index. [PostgreSQL pattern matching](https://www.postgresql.org/docs/current/functions-matching.html).

## Ngày và UTC

- **Quyết định**: YYYY-MM-DD, ngày Gregorian thật năm0001–9999. Từ chối0000/ngày sai/timestamp/date rỗng/whitespace. So sánh range sau validate; midnight UTC+7→UTC, To dùng ngày lịch kế tiếp.
- **Lý do**: giữ clarify, không phụ thuộc timezone host. Validate thành phần trước dựng Date; tránh Date.UTC đổi năm0–99 thành1900–1999. To9999-12-31 hợp lệ phải hỗ trợ bound nội bộ năm10000.
- **Phương án khác**: parse Date dễ dãi, UTC midnight,23:59:59.999 và thêm thư viện bị loại. Chỉ dùng routine ngắn cục bộ nếu cần, không framework ngày generic. [ECMAScript Date.UTC](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date.utc).

## Form và async

- **Quyết định**: Form owns draft; query state hiện có owns applied filters. Identity thêm filter, total chỉ identity hiện tại thay prefix actor. Hai DatePicker độc lập inputReadOnly/format YYYY-MM-DD.
- **Lý do**: total hiện có thể giữ query cũ; chọn lịch tránh sửa ngầm ngày nhập sai, hai picker không tự đảo range. Cho clear, validate range/calendar tại FE; backend validate query trực tiếp độc lập.
- **Phương án khác**: draft state trùng, data hook mới, RangePicker tự order, wrapper raw-date bị loại; không có yêu cầu gõ ngày. [Ant Design DatePicker](https://ant.design/components/date-picker/).

## Responsive

- **Quyết định**: dùng Sider breakpoint/trigger, Table pagination/scroll; CSS scoped spacing/grid/wrapping, density dễ đọc. Không fixed height/font shrink/clipping.
- **Lý do**: thư viện có sẵn; budget10 dòng chỉ dự kiến, phải đo viewport thật; nội dung dài có thể cuộn.
- **Phương án khác**: pagination/sidebar tự viết, redesign, hide overflow bị loại. [Layout](https://ant.design/components/layout/), [Table](https://ant.design/components/table/), [Pagination](https://ant.design/components/pagination/).

## Phạm vi đã chốt

Không còn quyết định plan chưa rõ. Không thêm dependency/schema/index/config/test/proxy/môi trường. Bằng chứng thủ công chỉ thu ở implement.
