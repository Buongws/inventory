# Hướng dẫn kiểm chứng: Tồn kho một kho

[Trạng thái triển khai](validation.vi.md): đã triển khai và kiểm chứng trên PostgreSQL dùng thử; nội dung thiết kế/lượt plan gốc được giữ làm lịch sử.

Ngôn ngữ: [English](../quickstart.md) | **Tiếng Việt**

**Hướng dẫn kiểm chứng.** Inventory đã triển khai; kết quả thực tế nằm trong [validation.vi.md](validation.vi.md). Không chạy mutation schema, gây lỗi hoặc rollback phá hủy trên dữ liệu nghiệp vụ thật. Không thêm file test tự động. Lưu bằng chứng status/response/SQL đã lọc ngoài file tracked.

## Chuẩn bị

Node.js 24, Docker PostgreSQL 17/Redis, .env API/Gateway/web ignored, tài khoản admin/customer hiện có. Port DB theo env/Compose override (docs ghi 55433; Compose mặc định 5432); không ghi đè DB đang dùng. Root chỉ chạy lệnh, không phải workspace npm.

Sau implement, chạy từ root:

```sh
node --version
npm ci
npm --prefix apps/api ci
npm --prefix apps/gateway ci
npm --prefix apps/web ci
npm --prefix apps/api run infra:up
npm --prefix apps/api run migration:run
npm run dev
```

Dev chạy terminal riêng. Health qua Gateway `/api/v1/health/live`, `/api/v1/health/ready`; Swagger `http://localhost:3004/docs`, JSON `/docs-json`. Import collection/environment Postman hiện có, login theo request auth sẵn có. Token chỉ trong biến session local; không đưa token/cookie/credential vào bằng chứng chia sẻ. Chuẩn bị hai session admin và một customer để kiểm tra scope/auth. Mỗi scenario độc lập dùng product mới; không chỉnh tồn trực tiếp cho kiểm tra thường.

Ví dụ shell giả định `ACCESS_TOKEN` đã được cung cấp riêng và `PRODUCT_ID` là UUID product mới; không ghi giá trị vào file tracked:

```sh
INVENTORY_BASE=http://localhost:3004/api/v1/inventory
INVENTORY_RUN=$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')
curl -sS -i "$INVENTORY_BASE/$PRODUCT_ID" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -sS -i "$INVENTORY_BASE/$PRODUCT_ID/movements" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $INVENTORY_RUN-receipt" \
  --data '{"type":"RECEIPT","quantity":10,"reason":"Opening stock received"}'
```

Kỳ vọng đọc tồn 0, rồi 201 before 0/after 10. Chi tiết contract và ưu tiên lỗi: [contracts/inventory-api.vi.md](../contracts/inventory-api.vi.md).

## Ma trận nghiệm thu

| Scenario | Cách làm | Bằng chứng kỳ vọng |
|---|---|---|
| SC-001 | Product mới; nhập 10, xuất 3, xuất 8; key riêng | 201/201/409 INSUFFICIENT_STOCK; tồn 7, hai movement; lệnh thất bại chỉ có result replay |
| SC-002 | Nhập 5; mười ISSUE 1 đồng thời, key riêng | Đúng năm 201/năm 409 INSUFFICIENT_STOCK; tồn 0, năm movement xuất |
| SC-003 | Constraint tạm làm INSERT movement service await lỗi sau update balance trên PostgreSQL dùng thử | API trực tiếp 500; rollback đã xác nhận, không đổi balance/movement/result; gỡ fixture, retry cùng key thành công một lần |
| SC-004 | Customer/không token/token hết hạn; UUID/type/quantity/reason/field lạ sai | 403/401/400; không result lệnh hoặc thay đổi tồn |
| SC-005 | Swagger/Postman qua Gateway | Envelope/key/lỗi/retry khớp thực tế; giữ request auth/product cũ |
| SC-006 | Giữ request gốc sau khi có khóa key; gửi trùng | Trả ngay 409 IN_PROGRESS, Retry-After: 1; gốc thành công rồi replay 201, đúng một movement |
| Zero/vòng đời | Product cũ/demo/mới chưa movement; inactive/active lại | Tồn 0, history rỗng; list gồm active/inactive; inactive vẫn nhập/xuất |
| Catalog/history | Tạo movement rồi đổi tên/SKU | History dùng catalog hiện tại; ID/quantity/reason/balance/actor/time giữ nguyên |
| Phân trang/thứ tự | Nhiều product/movement, page rỗng/quá cuối, ghi đồng thời | Default/limit/order đúng; items/total cùng snapshot; query lạ/sai bị từ chối |
| Giới hạn | Quantity 0/−1/lẻ/string/null/1.000.001; trim và reason 500/501 code point | Sai trả 400 không mutation; 1 và 1.000.000 hợp lệ khi tồn cho phép |
| Trần tồn | Fixture ledger hợp lệ ở trần; nhập 1 | 409 STOCK_LIMIT_EXCEEDED, ledger/balance giữ nguyên; replay cùng lỗi |
| Scope/fingerprint | Cùng admin/key khác product/type/qty/reason; đổi thứ tự JSON/space ngoài reason; admin thứ hai cùng key | Payload chuẩn hóa khác → 409 KEY_REUSED; tương đương → result gốc; admin khác là lệnh độc lập |
| Replay lỗi | Cache lỗi thiếu tồn, nhập bằng key mới rồi replay key lỗi | Giữ lỗi cũ; thử nghiệp vụ mới bằng key mới thành công nếu đủ tồn |
| Validation không cache | Request/key sai rồi sửa hợp lệ | Input bị từ chối không có result; lệnh sửa có thể thành công |
| Mất response/replay | Commit nhập, bỏ response; replay sau movement khác | Giữ movement ID/time/balance/status gốc, không movement mới; GET tồn hiện tại |
| Retention | Chờ 24h hoặc dịch completed_at/expires_at cùng nhau trên fixture dùng thử, giữ CHECK; tắt scheduler | Cùng key là lệnh mới dù chưa cleanup; replay không gia hạn |
| Cleanup | Fixture result hết/chưa hết hạn; chạy tick; nhiều instance/dòng khóa | ≤20×1.000/lần, chỉ xóa result hết hạn không khóa; giữ movement/result còn hạn; ghi backlog/retry/shutdown |
| Lỗi tạm thời | DB lock/statement timeout trực tiếp API 3001; thử riêng timeout/mất response Gateway 3004; phục hồi, retry cùng key | API trực tiếp 503 và rollback đã xác nhận; Gateway có thể trả 503/502 riêng hoặc mất response; lỗi transport đơn thuần là chưa rõ, không cache lỗi transport, đúng một kết quả bền vững sau đối chiếu |
| Crash | Dừng backend/API riêng trước commit, rồi riêng sau commit trước response | Trước commit không mutation/result, key dùng lại được; sau commit replay movement gốc duy nhất |
| Race ghi đầu | Hai nhập trên product chưa có balance; hai xuất tương tự, key riêng | Tổng nhập đúng tuần tự; xuất bị từ chối không tạo balance/movement; không lộ unique error |

Fixture trần: DB dùng thử tạo 2.147 RECEIPT hợp lệ, mỗi lần 1.000.000, rồi một lần 483.647; before/after nối tiếp, balance cuối 2.147.483.647 trong một transaction. Dùng product/actor hợp lệ và timestamp tăng. Không dùng fixture chỉ sửa balance làm sai ledger; ghi cách sinh fixture và loại bỏ bằng tạo lại DB dùng thử. Đây là dữ liệu kiểm chứng, không phải seed product.

## Concurrency HTTP thật

Product mới đã nhập 5 bằng key riêng. Gửi mười request, lưu từng body/status trong thư mục tạm:

```sh
INVENTORY_EVIDENCE=$(mktemp -d /private/tmp/inventory-evidence.XXXXXX)
for request_index in {1..10}; do
  curl -sS "$INVENTORY_BASE/$PRODUCT_ID/movements" \
    -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
    -H "Idempotency-Key: $INVENTORY_RUN-issue-$request_index" \
    --data '{"type":"ISSUE","quantity":1,"reason":"Concurrent issue verification"}' \
    -o "$INVENTORY_EVIDENCE/$request_index.json" -w '%{http_code}\n' \
    > "$INVENTORY_EVIDENCE/$request_index.status" &
done
wait
cat "$INVENTORY_EVIDENCE/"*.status
```

Đếm năm 201/năm 409, kiểm tra code từng lỗi, tồn/history/SQL cuối. Nếu Gateway trả 429 thì chưa chứng minh SC-002: chờ cửa sổ rate limit và chạy lại trên product mới. Runner Postman tuần tự không chứng minh concurrency. Bảo vệ artifact local nếu có actor ID/reason.

## Chứng minh in-progress trả ngay

Product mới đã nhập thành công và có balance. Terminal A nối DB dùng thử và giữ khóa:

```sql
BEGIN;
SELECT product_id FROM inventory_balances WHERE product_id = :'product_id' FOR UPDATE;
```

Đặt biến product_id trong psql trước. Terminal B gửi movement key mới, lấy quyền key rồi chờ khóa balance ở A. Trong timeout statement 5 giây, terminal C gửi cùng key/payload bằng curl `-w '%{http_code} %{time_total}\n'`. Kỳ vọng 409 IDEMPOTENCY_IN_PROGRESS ngay (<1 giây trong local kiểm soát), Retry-After: 1, B vẫn pending. COMMIT A sớm để B thành công. Retry cùng key/payload trả 201 gốc và đúng một movement mới. Để kiểm tra map timeout DB tại API, lặp trực tiếp port 3001, xác minh `503 INVENTORY_BUSY` và rollback đã xác nhận. Qua Gateway, B có thể trả 503 API hoặc `502 UPSTREAM_UNAVAILABLE` Gateway trước, hoặc mất response; không suy ra rollback từ 502 Gateway. Sau giải phóng A, retry qua Gateway cùng key/payload để có đúng một kết quả bền vững. Thử payload khác trong/sau processing để phân biệt IN_PROGRESS và KEY_REUSED.

## Rollback, crash và COMMIT chưa rõ

Chỉ dùng PostgreSQL riêng và chính SQL service implement đang await. Gửi request gây lỗi xác định trực tiếp port API 3001 để kiểm tra 500/handler riêng khỏi cuộc đua timeout Gateway; gỡ fixture rồi retry cùng key/payload qua Gateway để kiểm tra tích hợp. Không gây lỗi bằng SQL console ngoài callback transaction, không nuốt SQL rejection hoặc thêm failure switch/file test lâu dài. Trước mỗi case ghi tồn/count movement/count result đúng scope; dùng key/product mới và fixture kiểm soát. SQL PostgreSQL bị từ chối chắc chắn phải được service nhận qua await và truyền tới handler lỗi transaction/rollback đã xác nhận, không báo commit thành công.

1. **Lỗi tại INSERT movement được await (SC-003):** Trên DB dùng thử thêm constraint tạm dưới đây. Gửi RECEIPT hợp lệ có reason `verify-fault-movement`. UPDATE balance chạy, rồi chính INSERT stock_movements được service await lỗi. Xác minh API 500 đã lọc, rollback đã xác nhận và tồn/count history/result không đổi. Xóa constraint, retry cùng key/payload để có đúng một movement/result thành công.

```sql
ALTER TABLE stock_movements ADD CONSTRAINT verify_fault_movement
  CHECK (reason <> 'verify-fault-movement') NOT VALID;
-- Send the controlled HTTP request and record its rollback evidence before dropping.
ALTER TABLE stock_movements DROP CONSTRAINT verify_fault_movement;
```

2. **Lỗi tại INSERT result được await:** Trên cùng DB riêng thêm constraint tạm dưới đây. Gửi receipt hợp lệ bằng key/product mới. INSERT result status 201 được service await lỗi sau ghi balance/movement. Xác minh 500, cả ba rollback; xóa constraint trước khi retry lệnh giống hệt. Constraint chặn mọi result 201 mới nên không dùng trên DB chung/production.

```sql
ALTER TABLE inventory_idempotency_results ADD CONSTRAINT verify_fault_result
  CHECK (http_status <> 201) NOT VALID;
-- Send the controlled HTTP request and record its rollback evidence before dropping.
ALTER TABLE inventory_idempotency_results DROP CONSTRAINT verify_fault_result;
```

ALTER chỉ chuẩn bị/gỡ fixture thủ công, không phải lỗi SQL ứng dụng hoặc migration feature. Giữ record hiện có; khôi phục schema dùng thử trước scenario tiếp theo. Nếu bị gián đoạn, gỡ constraint tạm trước request thường.

3. **Lỗi tại COMMIT được await sau INSERT result:** Chỉ trong PostgreSQL dùng thử, tạo constraint trigger tạm `DEFERRABLE INITIALLY DEFERRED` trên inventory_idempotency_results, raise exception kiểm soát cho product fixture mới đã chọn. Service phải await COMMIT, nhận rejection DB và xác nhận rollback balance/movement/result; kỳ vọng API 500 đã lọc. Gỡ trigger/function tạm trước retry cùng key. Ghi stage SQL được await/rejection DB/count cuối; pause debugger hoặc lỗi ngoài callback được await không đủ bằng chứng.

4. **Crash/mất xác nhận, tách khỏi lỗi SQL xác định:** Chỉ terminate backend transaction riêng trước COMMIT, xác nhận rollback trước retry cùng key. Thử riêng pause sau COMMIT đã xác nhận nhưng trước response HTTP, dừng API riêng, restart rồi replay result gốc đã commit. Với mất xác nhận COMMIT, ngắt connection riêng khi COMMIT đang await response; phân loại chưa rõ, không giả định rollback hoặc đổi key. Retry cùng key xác định result gốc có commit hay không. Ghi riêng rollback đã xác nhận, commit đã xác nhận nhưng mất response và acknowledgment chưa rõ. Không khẳng định mọi 500/502 giữ tồn; atomicity phải đúng mọi trường hợp. Không dừng PostgreSQL chung hoặc thêm file fault injection/test tracked.

## Kiểm tra DB

Nối DB riêng đã cấu hình; hạ tầng có Docker psql sau `npm --prefix apps/api run infra:up`. Trong psql xem `\d inventory_balances`, `\d stock_movements`, `\d inventory_idempotency_results`, so với [data-model.vi.md](data-model.vi.md). Không có balance âm, key scoped retained trùng, result thành công thiếu movement hoặc movement cho request thất bại.

Đối chiếu ledger phải trả zero dòng:

```sql
SELECT p.id, COALESCE(b.on_hand_qty, 0) AS balance,
       COALESCE(SUM(CASE WHEN m.type = 'RECEIPT'
                        THEN m.quantity::bigint ELSE -m.quantity::bigint END), 0) AS ledger
FROM products p
LEFT JOIN inventory_balances b ON b.product_id = p.id
LEFT JOIN stock_movements m ON m.product_id = p.id
GROUP BY p.id, b.on_hand_qty
HAVING COALESCE(b.on_hand_qty, 0) <> COALESCE(SUM(
  CASE WHEN m.type = 'RECEIPT' THEN m.quantity::bigint ELSE -m.quantity::bigint END), 0);
```

Ledger đúng chưa chứng minh replay/concurrency: cần status/ID/count SQL của request. Xem EXPLAIN với fixture đại diện cho history/result/join product; bảng rất nhỏ dùng sequential scan không tự động là lỗi.

## Migration và quality gate

Trỏ DATABASE_URL API tới DB dùng thử bằng config ignored. Chạy toàn bộ migration, kiểm tra product tồn 0/schema và dữ liệu Product/Auth cũ. Sau kiểm tra inventory, tạo lại dữ liệu dùng thử để kiểm tra down phá hủy. Chỉ revert migration mới cuối cùng, xác nhận ba bảng inventory mất nhưng bảng cũ giữ nguyên, rồi up lại:

```sh
npm --prefix apps/api run migration:run
npm --prefix apps/api run migration:revert
npm --prefix apps/api run migration:run
npm run check
npm run build
npm test
```

Không revert dữ liệu nghiệp vụ; rollback ứng dụng giữ schema. Nếu chưa có test API, ghi `No tests found` là thiếu suite tự động, không phải pass. Không thêm file test để che khoảng trống.

## Kiểm chứng logging outcome

Chỉ lấy log API riêng đã lọc. Chạy một receipt hoàn tất, replay, request trùng đang xử lý, conflict payload khác; thêm rollback đã xác nhận, timeout API trực tiếp và mất xác nhận COMMIT. Mỗi lần thử đã validation và tới quyền key có đúng một event outcome sau transaction với kết quả đã biết, hoặc sau discard/release connection và ghi rõ kết quả server chưa rõ khi mất acknowledgment: `completed`, `replayed`, `in_progress`, `conflict`, `transient_failure`, `persistence_failure` hoặc `outcome_uncertain` tương ứng. Từ chối nghiệp vụ đã commit tính completed với status 404/409, không phải movement thành công. Mất acknowledgment chưa rõ không phát completed cho lần thử đó; replay sau là lần thử riêng, không movement mới. So completed-success với ID movement/result bền vững và count DB; tách replay/conflict/in-progress. Không completed trước xác nhận COMMIT, không event kết quả chắc chắn khi biết transaction còn mở, không raw key/hash/reason/payload/token/cookie/credential/SQL/connection. Kiểm tra summary count/duration cleanup riêng. Lưu count outcome và bằng chứng timing/SQL đã lọc ở validation.md và vi/validation.vi.md tính từ thư mục feature; không thêm file test tự động hoặc hạ tầng metrics.

## Ghi bằng chứng

Ghi ngày/phiên bản Node+PostgreSQL, DB/environment riêng, revision source nếu có, alias request/key đã lọc, status/code, balance/count movement/result, timing concurrency, rollback/crash, migration, quality gate và giới hạn. Không đưa auth header/cookie/credential thật. Tài liệu Anh–Việt, Swagger/Postman phải cùng contract. **Kết quả thực tế:** xem [validation.vi.md](validation.vi.md), gồm phương pháp kiểm chứng và phần chưa có.
