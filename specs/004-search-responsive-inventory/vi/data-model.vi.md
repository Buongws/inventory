# Mô hình dữ liệu

## Entity hiện có

- Product: id/sku/name/status ACTIVE hoặc INACTIVE; createdAt mapping `products.created_at` timestamptz. Lọc timestamp Product, không movement.
- InventoryBalance: quan hệ Product/on-hand; giữ left join và stock0 khi chưa có balance.
- Movement: lịch sử/actor/quantity/idempotency giữ nguyên.

Không đổi schema/migration/index hoặc lưu filter lâu dài.

## Query danh sách

| Field | Ý nghĩa/validation |
| --- | --- |
| page | default1; positive/safe offset hiện có |
| limit | catalog10; integer1–100; history20 |
| q | scalar tùy chọn; trim/rỗng bỏ; max200 Unicode code points; substring literal name OR SKU, không phân biệt hoa thường |
| status | ACTIVE/INACTIVE; All bỏ field |
| createdFrom | YYYY-MM-DD ngày thật năm0001–9999; bao đầu ngày UTC+7 |
| createdTo | tương tự; không bao đầu ngày kế tiếp UTC+7 |

Date được gửi nhưng rỗng/sai hoặc range đảo:400 INVALID_INPUT. Một phía hợp lệ; các predicate AND. From=To2026-10-07: `>=2026-10-06T17:00:00Z` và `<2026-10-07T17:00:00Z`.

## State FE tạm thời

- Draft: Ant Form quản lý q/status/From/To, edit không request. Picker chỉ chọn lịch ngăn nhập/chọn ngày sai; Form chặn range đảo không dispatch. Kiểm FE riêng backend validate ngày thật/range.
- Applied filters: normalized strings trong query state hiện có; paging/retry/reload movement dùng bộ này.
- Identity: actor/filter/page/size/version. Khởi tạo1/10/không filter. Submit áp dụng/page1/tăng version; reset xóa draft/applied/page1/tăng version, giữ size; đổi size→page1; đổi page giữ filter.
- Resource: loading→ready/error cho identity hiện tại; abort/identity guard bảo vệ rows/total/error. Ready rows/count và error yêu cầu full identity hiện tại. Riêng loading được giữ total gần nhất cùng actor/applied filters làm placeholder navigation; không hiện rows cũ hoặc mượn count actor/filter khác.
- Details-route/operation độc lập; filter làm mất row được chọn không discard operation/đổi key/payload/gửi POST.

Không persistence localStorage/URL/Redux cho filter. Entry mới về unfiltered defaults. Session/movement transitions giữ nguyên.

Layout chung `/inventory` giữ context danh sách tạm qua catalog và `/inventory/[productId]`. Quay lại nội bộ giữ draft/applied filters/page-size; reload toàn trang tạo defaults mới. Product ID trong route scope read detail/history và selection operation.
