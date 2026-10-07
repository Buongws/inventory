# Gateway Convention

- Gateway chạy port 3004, proxy tới API 3001; frontend chạy 3002. Local chưa có load balancer.
- Gateway chứa routing, rate limiting và kiểm tra JWT phục vụ chọn quota; business logic và authorization ở API.
- Policy PostgreSQL nạp khi Gateway startup; thay đổi policy cần restart/deploy. Redis giữ counters có TTL, Lua bảo đảm thao tác atomic.
- Không tin X-Forwarded-For tùy ý; khi bổ sung load balancer phải cấu hình trusted proxy và giới hạn đường truy cập trực tiếp API.
- Không log JWT, cookie hoặc secret. Proxy cần giữ request body, Authorization, Set-Cookie và error contract.
- Redis fallback hiện dùng counter memory với quota chặt hơn; đây là quota từng instance, không bảo đảm quota chung khi Redis lỗi.
- Khi thay đổi policy/proxy, ghi rõ hành vi Redis outage, 429/Retry-After, CORS, health và preflight trong spec.
- Dùng bộ lệnh lint/format/typecheck/build thống nhất ở package hoặc root.
