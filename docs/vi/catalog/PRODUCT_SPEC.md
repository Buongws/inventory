# Product catalog specification

## Mục tiêu

Module Product quản lý catalog cơ bản. Tồn kho, ngày nhập/xuất hàng, lịch sử điều chỉnh, danh mục và upload ảnh nằm ngoài phạm vi này.

Mọi endpoint nằm dưới `/api/v1/products` và yêu cầu Bearer access token. Customer chỉ đọc được sản phẩm đang bán; admin có toàn quyền quản lý.

## Data model

| Field | Kiểu API | Quy tắc |
|---|---|---|
| `id` | UUID | Server tạo. |
| `sku` | string | Bắt buộc, 1–64 ký tự. Trim, chuyển uppercase, chỉ chấp nhận `A-Z`, `0-9`, `-`, `_`. Unique kể cả khi ngừng bán. |
| `name` | string | Bắt buộc, trim, 1–200 ký tự. |
| `description` | string/null | Không bắt buộc, tối đa 5.000 ký tự. |
| `priceVnd` | string | Số nguyên không âm. Database lưu `bigint`; API nhận/trả chuỗi chữ số để không mất độ chính xác JavaScript. |
| `status` | `ACTIVE`/`INACTIVE` | Mặc định `ACTIVE`. |
| `imageUrl` | string/null | Không bắt buộc, URL HTTP/HTTPS, tối đa 2.048 ký tự. Chỉ lưu URL. |
| `createdAt`, `updatedAt` | ISO 8601 UTC | Server quản lý; database dùng `timestamptz`. |

Migration tạo bảng `products`, constraint unique cho `sku`, index `(status, created_at DESC, id DESC)` phục vụ danh sách customer. Không tạo cache Redis ở milestone này.

## API

### `POST /api/v1/products` — admin

Request:

```json
{
  "sku": "usb-c-cable-1m",
  "name": "USB-C cable 1m",
  "description": "Braided cable",
  "priceVnd": "129000",
  "imageUrl": "https://images.example.com/cable.jpg"
}
```

Response `201`:

```json
{
  "product": {
    "id": "a12a8d86-5f6f-4cb3-b264-4103ea2b8218",
    "sku": "USB-C-CABLE-1M",
    "name": "USB-C cable 1m",
    "description": "Braided cable",
    "priceVnd": "129000",
    "status": "ACTIVE",
    "imageUrl": "https://images.example.com/cable.jpg",
    "createdAt": "2026-09-25T03:00:00.000Z",
    "updatedAt": "2026-09-25T03:00:00.000Z"
  }
}
```

### `GET /api/v1/products` — customer, admin

Query parameters:

| Name | Default | Quy tắc |
|---|---|---|
| `page` | `1` | Integer, tối thiểu 1. |
| `limit` | `20` | Integer từ 1 đến 100. |
| `search` | — | Tối đa 100 ký tự; tìm theo SKU hoặc tên, không phân biệt hoa thường. |
| `status` | — | Chỉ admin được dùng. `ACTIVE` hoặc `INACTIVE`. |

Customer luôn chỉ thấy `ACTIVE`; admin không truyền `status` thì xem tất cả. Sắp xếp cố định `createdAt DESC, id DESC`.

Response `200`:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

### `GET /api/v1/products/:id` — customer, admin

Trả `{ "product": { ... } }`. Customer nhận `404` với sản phẩm `INACTIVE`; admin đọc được cả hai trạng thái.

### `PATCH /api/v1/products/:id` — admin

Chỉ cập nhật trường gửi lên. Payload rỗng trả `400`. `null` chỉ hợp lệ để xóa `description` và `imageUrl`; không cho client sửa ID hoặc timestamp. Admin có thể đổi `status` giữa `ACTIVE` và `INACTIVE`.

### `DELETE /api/v1/products/:id` — admin

Soft delete bằng cách đặt `status = INACTIVE`, trả `204`. Gọi lại với sản phẩm đã inactive vẫn trả `204`.

## Error contract

| Status | Khi nào |
|---|---|
| `400` | DTO/query không hợp lệ, SKU sai định dạng, giá không phải chuỗi số nguyên, PATCH rỗng. |
| `401` | Thiếu hoặc access token không hợp lệ. |
| `403` | Customer cố tạo, sửa hoặc xóa; customer dùng filter `status`. |
| `404` | UUID không tồn tại, hoặc customer đọc sản phẩm inactive. |
| `409` | SKU trùng, không phân biệt hoa thường. |

Search phải dùng query có tham số. `%` và `_` từ input được escape để chúng được xem là ký tự bình thường, không phải wildcard SQL.

## Kiểm thử và Postman

- [ ] Admin tạo, sửa, inactive và active lại sản phẩm.
- [ ] Customer đọc danh sách/chi tiết active; không nhìn thấy inactive và không ghi được.
- [ ] SKU khác hoa thường tạo song song chỉ có một request thành công.
- [ ] Kiểm tra price VND rất lớn vẫn trả đúng dạng string.
- [ ] Kiểm tra phân trang, search, URL ảnh, null description/image URL và PATCH rỗng.
- [ ] Postman có request cho mỗi endpoint, token admin/customer, happy path và các lỗi 400/403/404/409.
