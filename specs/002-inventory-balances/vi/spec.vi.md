# Đặc tả: Tồn kho một kho

**Ngày tạo**: 2026-10-05  
**Trạng thái**: Đã triển khai và kiểm chứng trên PostgreSQL dùng thử — xem [kiểm chứng](validation.vi.md)

Ngôn ngữ: [English](../spec.md) | **Tiếng Việt**

## Mục tiêu và phạm vi

Hoàn thành phần Inventory của M2. Product CRUD cho biết bán mặt hàng gì; feature này cho biết mỗi mặt hàng có bao nhiêu đơn vị trong một kho và vì sao số lượng thay đổi.

Tác động tới API backend, database, Swagger và Postman; sử dụng Gateway và auth hiện tại. Inventory đã triển khai; kết quả thực tế ghi trong [validation.vi.md](validation.vi.md). Chưa làm giao diện.

Ngoài phạm vi: Orders, reserve/commit/release, thanh toán, nhiều kho, chuyển kho, đơn nhập nhà cung cấp, điều chỉnh kiểm kê, Redis giữ tồn, distributed lock và queue. Reservation thuộc M3.

## Clarifications

### Session 2026-10-05

- Q: Khi hai request nhập/xuất có cùng Idempotency-Key và payload đến đồng thời, request thứ hai cần nhận kết quả như thế nào? → A: Trả ngay `409` với mã lỗi riêng báo đang xử lý; cho phép retry cùng key sau đó.
- Q: Khi sản phẩm đổi tên hoặc SKU, lịch sử nhập/xuất cần hiển thị thông tin sản phẩm hiện tại hay thông tin tại thời điểm giao dịch? → A: Dùng thông tin hiện tại, liên kết bằng productId bất biến; movement không lưu bản sao tên/SKU.

## Kịch bản và nghiệm thu

### US1 — Xem tồn (P1)

Admin xem tồn của một sản phẩm hoặc danh sách có phân trang, gồm cả sản phẩm tồn bằng zero.

- Product đã tồn tại nhưng chưa nhập/xuất: trả tồn 0.
- Product không tồn tại: `404`.
- Customer: `403`; chưa đăng nhập: `401`.

### US2 — Nhập hàng (P1)

Admin ghi nhận hàng thực tế được nhận vào kho cùng lý do.

- Tồn 0, nhập 10: tồn 10 và có một lịch sử nhập.
- Tồn 10, nhập thêm 5: tồn 15, giữ cả hai lịch sử.
- Số lượng không hợp lệ: `400`, dữ liệu không đổi.

### US3 — Xuất hàng (P1)

Admin ghi nhận hàng rời kho cùng lý do.

- Tồn 10, xuất 3: tồn 7 và có một lịch sử xuất.
- Tồn 7, xuất 8: `409`, code `INSUFFICIENT_STOCK`; tồn và lịch sử không đổi.
- Tồn 7, xuất 7: thành công, tồn 0.

### US4 — Xem lịch sử (P2)

Admin xem lịch sử theo thứ tự ghi nhận mới nhất trước.

- Mỗi lần thành công lưu sản phẩm, loại, số lượng dương, tồn trước/sau, người thực hiện, lý do và thời gian UTC.
- Thao tác bị từ chối chắc chắn hoặc transaction đã xác nhận rollback không tạo lịch sử thành công. Mất response hoặc xác nhận COMMIT là kết quả chưa rõ, không chứng minh lệnh thất bại; đối chiếu bằng cùng key idempotency.
- Feature này không cung cấp API sửa/xóa lịch sử.

## Yêu cầu chức năng

- **FR-001**: Chỉ admin đã xác thực được truy cập Inventory.
- **FR-002**: Một kho logic, mỗi product có một số tồn nguyên không âm, ban đầu là 0. Các product demo cũng bắt đầu bằng 0; seed catalog không đồng nghĩa nhập hàng.
- **FR-003**: Loại giao dịch `RECEIPT` hoặc `ISSUE`; số lượng nguyên từ 1 đến 1.000.000. Tồn sau giao dịch không vượt 2.147.483.647. Số lượng sai trả `400`; vượt giới hạn tồn trả `409`, code `STOCK_LIMIT_EXCEEDED`.
- **FR-004**: Bắt buộc lý do dài 1–500 ký tự sau trim. Server xác định product, người thực hiện, tồn trước/sau và timestamp.
- **FR-005**: Cập nhật tồn và tạo lịch sử cùng thành công hoặc cùng thất bại. Không được lưu chỉ một phần.
- **FR-006**: Nhập/xuất đồng thời vẫn giữ số tồn chính xác, không âm.
- **FR-007**: Lịch sử chỉ được thêm qua API. Tổng nhập trừ tổng xuất từ mốc zero phải bằng tồn hiện tại.
- **FR-008**: Danh sách và lịch sử dùng `page=1`, `limit=20`, tối đa 100; trả `{ items, page, limit, total }`. Danh sách sắp theo product ID ổn định; lịch sử theo `createdAt DESC, id DESC`.
- **FR-009**: Danh sách gồm product active/inactive và status. Ngừng bán product không làm mất khả năng xem tồn/lịch sử.
- **FR-010**: Từ chối field lạ. Client không được gửi ID giao dịch, actor, timestamp hay số tồn tính toán.
- **FR-011**: Request trùng cùng `Idempotency-Key` và payload khi request gốc còn đang xử lý trả ngay `409` với mã lỗi riêng báo đang xử lý, không tạo thêm movement. Cho phép retry cùng key sau đó; khi xử lý hoàn tất, áp dụng chính sách replay đã chốt. Mã lỗi cụ thể sẽ được định nghĩa trong plan.
- **FR-012**: Movement liên kết product bằng `productId` bất biến, không lưu bản sao tên/SKU. Tên/SKU nếu hiển thị trong lịch sử là giá trị catalog hiện tại. Thay đổi tên/SKU không làm thay đổi dữ kiện đã ghi của movement hoặc số tồn.

## Contract API

Prefix `/api/v1/inventory`. Contract kỹ thuật chi tiết sẽ được viết ở bước plan.

| Method/path | Mục đích | Thành công |
|---|---|---|
| `GET /` | Danh sách tồn theo product | `200` |
| `GET /:productId` | Xem tồn một product | `200` |
| `POST /:productId/movements` | Ghi nhận nhập/xuất | `201` |
| `GET /:productId/movements` | Lịch sử có phân trang | `200` |

Ví dụ request:

```json
{ "type": "RECEIPT", "quantity": 10, "reason": "Nhận hàng đầu kỳ" }
```

Ví dụ response:

```json
{
  "movement": {
    "id": "movement-uuid",
    "productId": "product-uuid",
    "type": "RECEIPT",
    "quantity": 10,
    "balanceBefore": 0,
    "balanceAfter": 10,
    "actorId": "admin-uuid",
    "reason": "Nhận hàng đầu kỳ",
    "createdAt": "2026-10-05T08:00:00Z"
  },
  "inventory": { "productId": "product-uuid", "onHandQty": 10 }
}
```

Lỗi: `400` input sai; `401` auth thiếu/sai; `403` sai quyền; `404` product không tồn tại; `409` xung đột tồn. Lỗi lưu trữ bất ngờ trả `500` đã lọc thông tin; timeout khóa/statement tại API sau rollback đã xác nhận trả `503 INVENTORY_BUSY`. Từ chối validation/nghiệp vụ chắc chắn hoặc rollback đã xác nhận giữ nguyên tồn, không thêm movement. Nếu mất response hoặc xác nhận COMMIT, toàn bộ transaction có thể đã commit hoặc rollback; chỉ response lỗi không xác định được kết quả. Tồn, movement và result idempotency hoàn tất vẫn phải cùng lưu hoặc cùng không lưu. Retry cùng key/payload trong thời hạn retention để đối chiếu; không đổi key hoặc coi kết quả chưa rõ là từ chối chắc chắn. Timeout Gateway có thể trả `502 UPSTREAM_UNAVAILABLE`, cũng không xác định kết quả transaction.

## Dữ liệu nghiệp vụ

- **Inventory balance**: Số lượng hàng vật lý hiện tại của một product trong kho duy nhất.
- **Stock movement**: Lịch sử nhập/xuất bất biến, giải thích thay đổi số lượng và người ghi nhận, liên kết product bằng `productId` bất biến. Không lưu bản sao tên/SKU tại thời điểm giao dịch.

Tên bảng, cách khởi tạo balance, SQL, isolation và lock sẽ được quyết định trong plan.

## Quyết định nghiệp vụ đã chốt

- **Q1 — Product inactive:** Vẫn cho phép nhập và xuất product ngừng bán. Status chỉ kiểm soát catalog, không ngăn quản lý hàng vật lý.
- **Q2 — Request trùng:** Bắt buộc header `Idempotency-Key`: cùng key/payload trả kết quả cũ, không thêm giao dịch; cùng key nhưng payload khác trả `409`. Điều này tránh nhập/xuất hai lần khi retry sau khi mất response. Phạm vi key, thời gian lưu và cách xử lý replay lỗi sẽ chốt trong plan.

## Tiêu chí hoàn thành và kiểm chứng

- **SC-001**: Nhập 10 → xuất 3 → từ chối xuất 8: tồn 7, đúng hai lịch sử thành công.
- **SC-002**: Tồn 5, mười request đồng thời xuất một: đúng năm thành công, năm lỗi thiếu tồn, tồn cuối 0, đúng năm lịch sử xuất.
- **SC-003**: Cố ý làm INSERT movement được service await lỗi sau cập nhật tồn trên PostgreSQL dùng thử: cả hai thay đổi đều không commit. Ghi bằng chứng rollback đã xác nhận, tách khỏi COMMIT chưa rõ kết quả.
- **SC-004**: Customer không đọc/ghi được Inventory; input sai không thay đổi tồn.
- **SC-005**: Swagger/Postman có luồng thành công và lỗi. Kiểm chứng Product trước đây không chứng minh feature mới này đúng.
- **SC-006**: Khi request nhập/xuất còn đang xử lý, request trùng đồng thời cùng key/payload trả `409` báo đang xử lý và không tạo thêm movement. Sau khi request gốc thành công, retry cùng key/payload trả kết quả gốc; chỉ có đúng một movement.

Theo yêu cầu hiện tại, không thêm file test tự động. Khi implement cần ghi kết quả kiểm tra API, concurrency/rollback trên DB thật và quality gate. Kết quả thực tế và phần test tự động chưa có được ghi trong [validation.vi.md](validation.vi.md).

## Bước tiếp theo

Đã hoàn tất triển khai. Bước workflow tiếp theo khi được yêu cầu: `$speckit-converge`.
