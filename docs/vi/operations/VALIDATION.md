# Kết quả kiểm tra nền tảng

Cập nhật 2026-09-25:

- Node mặc định qua nvm: 24.21.0, npm 11.19.0; xác nhận trong shell login/interactive mới.
- Docker engine: 29.0.1; PostgreSQL 17 container riêng dùng localhost:55433.
- Redis local: 8.10.0, localhost:6379; PING trả PONG.
- NestJS chạy thực tế trên Node 24, port 3001; watch compile không lỗi.
- HTTP smoke: health/live và health/ready trả 200; readiness xác nhận PostgreSQL và Redis đều true.
- Swagger /docs và /docs-json trả HTTP 200.
- Postman environment đã cập nhật baseUrl port 3001; kiểm tra HTTP trực tiếp, chưa chạy bằng Postman GUI/runner.

Ở lần scaffold trước: build/typecheck/format và 4 unit test đã pass. Khi kiểm tra lại lần này, thư mục test không còn trong workspace, vì vậy npm test báo No tests found; chưa thể coi bộ unit test hiện tại là pass. Không tự khôi phục file đã bị xóa ngoài lượt này.

Chưa build/chạy API Docker image trong lượt này; API đang chạy local với PostgreSQL Docker và Redis local. Chưa có migration nghiệp vụ để kiểm tra.

Process/terminal đã mở từ trước vẫn có thể giữ Node 20; terminal mới dùng Node 24. Trong terminal cũ chạy `nvm use default` để chuyển phiên bản. Các process đang chạy cần khởi động lại khi bạn muốn chuyển runtime của chúng.
