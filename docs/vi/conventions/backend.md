# Backend Convention

- Node.js 24, NestJS, TypeScript strict; giữ module theo feature trong `apps/api/src/`.
- Controller nhận DTO và điều phối HTTP; service chứa business rule; không tạo base service/repository nếu chưa có nhu cầu tái sử dụng cụ thể.
- API prefix `/api/v1`; mô tả DTO, quyền, success/error response trong spec và Swagger. Cập nhật Postman cùng thay đổi contract.
- Guard xác thực và kiểm tra quyền tại API dù Gateway đã verify JWT để rate limit.
- Dùng transaction cho thay đổi phải atomic; nhớ rằng throw trong callback transaction sẽ rollback cả các update trước đó. Không báo revoke thành công nếu transaction bị rollback.
- Config phải validate khi startup; env example không chứa secret. Không đọc DB config trên mỗi HTTP request nếu đã chốt load lúc startup.
- Job nền phải có batch/timeout hữu hạn, chống chạy chồng và shutdown cleanup. Log tổng kết, không log token/hash/cookie.
- `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build` chạy trong thư mục API hoặc chạy bộ lệnh root.
- Yêu cầu không thêm test cho một feature không trở thành lệnh cấm test toàn repository; ghi rõ kiểm chứng đã làm và chưa làm.
