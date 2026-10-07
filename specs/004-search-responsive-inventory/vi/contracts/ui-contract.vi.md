# Contract UI Inventory

## Control và request

Giữ sidebar trái/content phải. Ant Form trên table gồm Input name/SKU, Select All/ACTIVE/INACTIVE, hai DatePicker From/To độc lập, Tìm kiếm/Làm mới. Chọn lịch clearable/YYYY-MM-DD, ngăn nhập/chọn ngày không hợp lệ; không tự order hoặc serialize timestamp timezone trình duyệt.

- GET đầu sau auth: page1/limit10/no filters; guard bootstrap/role giữ nguyên.
- Edit draft không GET. Submit validate calendar/range/q, apply normalized/page1/request kể cả giống lần trước.
- Range đảo: Form báo lỗi field/range, không GET; q quá dài cũng bị chặn. Picker prevention/Form-không dispatch/backend ngày thật-range400 là bằng chứng riêng; HTTP400 không là FE PASS. Không swap/correct hoặc wrapper/fault framework chỉ để kiểm chứng.
- Làm mới: xóa draft/applied, page1, giữ size/reload kể cả đã rỗng.
- Pagination giữ applied, không dùng draft chưa submit; size10/20/50/100, đổi size→page1.
- Loading/ready/empty/error/retry thuộc identity actor/filter/page/size/version; response/error/total cũ không ghi đè; retry dùng applied.
- Empty rõ ràng, không stale rows/total. Page ngoài phạm vi giữ total/pagination, không tự clamp mới.

Giữ Inventory action/details/history/nhập/xuất. Filter/reset không tạo movement/discard operation. Refresh sau movement giữ applied filters; history pagination riêng/default20.

## Layout

Desktop1920×1080/sidebar mở/default10 dòng thông thường/đang ở danh sách: header/reminder/filter/table/pagination không cần cuộn dọc. Giữ font/nội dung/actions; nội dung đặc biệt dài được tăng row/có thể cuộn.20+ dòng được cuộn document.

Tablet768×1024/mobile390×844: trigger sidebar luôn dùng được/mở lại được; filter/actions wrap/stack; table horizontal scroll cục bộ, pagination/size usable; trang details trong viewport/actions usable. Không hide overflow/truncate nội dung quan trọng để ép fit.

## Route chi tiết sản phẩm

Inventory điều hướng `/inventory/[productId]`. Layout Inventory chung giữ context danh sách khi chuyển nội bộ; component details hiển thị tồn/history và control nhập/xuất hiện có. URL trực tiếp/reload dùng product ID trong URL, history1/20; không cần fetch catalog khi đang ở details. Quay lại bằng control app giữ draft/applied filters và catalog page/size. Product sai/không tồn tại hiển thị lỗi/retry, submit vẫn disabled.

Quay lại danh sách, menu Inventory, Dashboard và logout dùng confirmation departure hiện có khi sending/uncertain. Xác nhận abort signal operation trước discard; hủy giữ operation. Đổi URL/unmount giải phóng read và state operation cũ. Reload không khôi phục/tự POST operation; bảo đảm riêng unload/back/bfcache của browser nằm ngoài smoke cơ bản. Abort FE không cho biết backend commit/rollback.

Khi loading, pagination có thể giữ count gần nhất cùng actor và applied filters chỉ làm placeholder navigation; chưa có rows và loading hiển thị rõ. Ready rows/count và lỗi chỉ thuộc full query identity hiện tại; không mượn placeholder của actor/filter khác.
