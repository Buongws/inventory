# Contract UI Inventory

## Control và request

Giữ sidebar trái/content phải. Ant Form trên table gồm Input name/SKU, Select All/ACTIVE/INACTIVE, hai DatePicker From/To độc lập, Tìm kiếm/Làm mới. Chọn lịch clearable/YYYY-MM-DD; không tự order hoặc serialize timestamp timezone trình duyệt.

- GET đầu sau auth: page1/limit10/no filters; guard bootstrap/role giữ nguyên.
- Edit draft không GET. Submit validate calendar/range/q, apply normalized/page1/request kể cả giống lần trước.
- Range/value sai: lỗi field, không GET, không swap/correct.
- Làm mới: xóa draft/applied, page1, giữ size/reload kể cả đã rỗng.
- Pagination giữ applied, không dùng draft chưa submit; size10/20/50/100, đổi size→page1.
- Loading/ready/empty/error/retry thuộc identity actor/filter/page/size/version; response/error/total cũ không ghi đè; retry dùng applied.
- Empty rõ ràng, không stale rows/total. Page ngoài phạm vi giữ total/pagination, không tự clamp mới.

Giữ Inventory action/drawer/history/nhập/xuất. Filter/reset không tạo movement/discard operation. Refresh sau movement giữ applied filters; history pagination riêng/default20.

## Layout

Desktop1920×1080/sidebar mở/default10 dòng thông thường/drawer đóng: header/reminder/filter/table/pagination không cần cuộn dọc. Giữ font/nội dung/actions; nội dung đặc biệt dài được tăng row/có thể cuộn.20+ dòng được cuộn document.

Tablet768×1024/mobile390×844: trigger sidebar luôn dùng được/mở lại được; filter/actions wrap/stack; table horizontal scroll cục bộ, pagination/size usable; drawer trong viewport/actions usable. Không hide overflow/truncate nội dung quan trọng để ép fit.
