# Đặc tả tính năng: CRUD sản phẩm

**Ngày tạo**: 2026-09-30  
**Trạng thái**: Đã triển khai và kiểm chứng

Ngôn ngữ: [English](spec.md) | **Tiếng Việt**

## Bắt đầu từ đây

Đây là đặc tả tính năng đang được sử dụng. Phần CRUD catalog sản phẩm đã hoàn thành. Database hiện có 200 sản phẩm mẫu đang hoạt động, với SKU từ `DEMO-0001` đến `DEMO-0200`.

Khởi động ba ứng dụng từ thư mục gốc của repository:

```sh
npm run dev
```

Các port local gồm API `3001`, frontend `3002` và Gateway `3004`. Gọi Product API qua `http://localhost:3004/api/v1/products`. Swagger được phục vụ trực tiếp từ API tại `http://localhost:3001/docs`.

Tạo lại hoặc bổ sung dữ liệu sản phẩm mẫu:

```sh
npm --prefix apps/api run seed:products
npm --prefix apps/api run seed:products -- --count=500
```

Tính năng nghiệp vụ tiếp theo nên là **tồn kho và lịch sử biến động kho**. Các product hiện tại chỉ là catalog, chưa đại diện cho số lượng tồn. Dự án chưa có số dư kho, phiếu nhập hoặc phiếu xuất.

## Phạm vi

Cung cấp catalog sản phẩm thông qua API có xác thực và Gateway hiện tại. Tính năng này tác động tới API, migration PostgreSQL, Swagger và Postman. Số dư kho, biến động kho, đơn hàng, Redis product cache, upload ảnh và giao diện quản lý sản phẩm chưa thuộc phạm vi này.

## Kịch bản người dùng và tiêu chí nghiệm thu

### P1 — Customer xem sản phẩm đang bán

Customer đã đăng nhập có thể xem danh sách và chi tiết sản phẩm `ACTIVE`. Sản phẩm `INACTIVE` không xuất hiện trong danh sách và trả `404` khi customer truy cập bằng ID. Phân trang, tìm kiếm và thứ tự kết quả phải ổn định.

### P1 — Admin quản lý catalog

Admin đã đăng nhập có thể tạo, xem, cập nhật, ngừng bán và kích hoạt lại sản phẩm. Ngừng bán không xóa record hoặc giải phóng SKU. Gọi ngừng bán nhiều lần vẫn thành công. Customer không được phép ghi dữ liệu.

### P2 — Dữ liệu sai hoặc xung đột bị từ chối

API từ chối SKU, giá, URL, phân trang không hợp lệ; PATCH rỗng; field không được hỗ trợ; và SKU trùng với status lỗi đã quy định. Hai request đồng thời sử dụng cùng SKU sau khi chuẩn hóa không thể cùng thành công.

## Yêu cầu chức năng

- **FR-001**: Mọi endpoint `/api/v1/products` yêu cầu Bearer token hợp lệ. Customer và admin được đọc; chỉ admin được ghi.
- **FR-002**: Product gồm `id`, `sku` duy nhất đã chuẩn hóa, `name`, `description` không bắt buộc, `priceVnd` dạng chuỗi số nguyên không âm, `status`, `imageUrl` không bắt buộc và timestamp UTC.
- **FR-003**: Danh sách hỗ trợ `page`, `limit`, `search` và bộ lọc `status` chỉ dành cho admin; response là `{ items, page, limit, total }`, sắp xếp theo `createdAt DESC, id DESC`.
- **FR-004**: Chi tiết, tạo và cập nhật trả `{ product }`. Tạo mới trả `201`; soft delete lặp lại trả `204`.
- **FR-005**: Customer không đọc được sản phẩm inactive. Admin có thể kích hoạt lại bằng cách cập nhật status.
- **FR-006**: Dữ liệu sai trả `400`, thiếu hoặc sai auth trả `401`, thiếu quyền trả `403`, sản phẩm không tồn tại hoặc bị ẩn trả `404`, SKU trùng trả `409`.
- **FR-007**: Search coi `%` và `_` là ký tự bình thường và không nội suy input người dùng trực tiếp vào SQL.

## Tiêu chí hoàn thành

- Admin thực hiện được luồng tạo → cập nhật → ngừng bán → kích hoạt lại qua API đã tài liệu hóa.
- Customer xem được sản phẩm active nhưng không đọc được sản phẩm inactive hoặc ghi dữ liệu.
- Hai request tạo đồng thời với SKU tương đương cho kết quả một thành công và một xung đột.
- `priceVnd` lớn nhưng hợp lệ được trả về chính xác dưới dạng chuỗi.
- Postman có các product request và Swagger mô tả đúng contract.

## Giả định

- Chưa cần giao diện sản phẩm; API được thử qua Postman và Swagger.
- Auth và Gateway hiện tại tiếp tục được sử dụng.
- Theo yêu cầu không thêm test mới, feature được kiểm chứng bằng API/DB thủ công, lint, typecheck và build.

## Các file đã triển khai

- `apps/api/src/products/`: entity, DTO, controller, service và module.
- `apps/api/src/database/migrations/1790730000000-CreateProducts.ts`: bảng product và các index.
- `apps/api/src/database/seeds/seed-products.ts`: lệnh seed sản phẩm mẫu có thể chạy lặp.
- `apps/api/postman/inventory.postman_collection.json`: các request sản phẩm có xác thực.

## Kết quả kiểm chứng

- Migration, repository checks và build của toàn bộ ứng dụng đã pass ngày 2026-09-30.
- Phân quyền admin/customer, soft delete, kích hoạt lại, validation, tìm kiếm ký tự đặc biệt, phân trang, giá VND lớn và SKU trùng khi request đồng thời đã được kiểm chứng qua Gateway.
- Lần chạy seed đầu tiên đã insert 200 rows; lần chạy thứ hai bỏ qua toàn bộ 200 rows đã tồn tại.
