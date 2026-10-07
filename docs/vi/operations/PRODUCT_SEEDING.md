# Tạo dữ liệu sản phẩm mẫu

Lệnh seed local tạo dữ liệu catalog cố định để thực hành API, pagination, execution plan và PostgreSQL. Lệnh này chưa tạo số lượng tồn kho hay lịch sử nhập/xuất.

Chạy từ thư mục gốc:

```sh
npm --prefix apps/api run migration:run
npm --prefix apps/api run seed:products
```

Mặc định lệnh tạo 200 sản phẩm. Có thể đổi số lượng bằng `npm --prefix apps/api run seed:products -- --count=500`, trong khoảng 1 đến 10.000. Script insert theo batch 100 và bỏ qua SKU đã tồn tại, nên chạy lại không tạo trùng và không ghi đè dữ liệu đã sửa.

Các SKU mẫu dùng prefix `DEMO-`. Muốn xóa riêng dữ liệu seed trong môi trường local:

```sql
DELETE FROM products WHERE sku LIKE 'DEMO-%';
```
