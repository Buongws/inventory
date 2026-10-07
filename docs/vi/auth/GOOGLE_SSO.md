# Google SSO: flow và cấu hình

Google trong project này là OpenID Connect để xác thực người dùng, không phải quyền truy cập Gmail, Drive hay API Google khác. Scope chỉ gồm `openid email profile`.

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as Inventory API
  participant G as Google
  B->>A: GET /auth/google/start
  A->>A: Tạo state, nonce, PKCE verifier; lưu Redis 10 phút
  A->>G: Redirect authorization request
  G->>B: Consent / account selection
  B->>A: GET callback?code&state
  A->>A: So khớp cookie state; lấy và xóa Redis state
  A->>G: Đổi code + PKCE verifier
  G-->>A: Google ID token
  A->>A: Verify issuer, audience, signature, exp, nonce, email_verified
  A-->>B: Refresh cookie HttpOnly; redirect session demo
  B->>A: POST /auth/refresh
  A-->>B: Access token của Inventory API
```

## Tạo Google OAuth client cho local

1. Vào [Google Cloud Console](https://console.cloud.google.com/), tạo project riêng cho development.
2. Vào **Google Auth Platform → Branding**, chọn audience **External**, điền app name, support email và developer contact. Ở chế độ Testing, thêm email Google của bạn vào Test users.
3. Vào **Google Auth Platform → Data Access**, chỉ thêm `openid`, `email`, `profile`.
4. Vào **Google Auth Platform → Clients**, tạo client loại **Web application**.
5. Trong Authorized redirect URIs, thêm chính xác `http://localhost:3004/api/v1/auth/google/callback`. Scheme, port và dấu `/` cuối phải trùng tuyệt đối với `GOOGLE_REDIRECT_URI`. Gateway tại port 3004 proxy callback vào API tại port 3001.
6. Copy Client ID và Client secret vào `.env`, không đưa vào Git:

```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3004/api/v1/auth/google/callback
```

Restart API, Gateway và frontend, mở `http://localhost:3002/login`, rồi chọn test user. Callback chuyển tới `/auth/callback` của frontend; trang này gọi refresh để lấy access token cho tab hiện tại.

## Bảo mật và liên kết tài khoản

Backend đổi authorization code bằng client secret cùng PKCE. `state` chặn CSRF callback; nonce được đối chiếu với ID token; Redis xóa state sau lần dùng đầu tiên. Refresh token là chuỗi ngẫu nhiên, chỉ tồn tại trong cookie `HttpOnly` ở browser và hash trong PostgreSQL. Access token của Inventory API sống 15 phút và không bao giờ được đặt vào URL.

Google `sub` là định danh liên kết duy nhất vì email Google có thể thay đổi. Nếu email Google trùng tài khoản email/mật khẩu, sign-in Google trả 409. Người dùng phải đăng nhập tài khoản cũ, gọi `POST /api/v1/auth/google/link/start` với Bearer token, mở `authorizationUrl`, rồi hoàn tất callback để liên kết rõ ràng.

## Lỗi hay gặp

| Hiện tượng | Nguyên nhân và cách xử lý |
|---|---|
| `redirect_uri_mismatch` | So sánh chính xác URL trong Google Cloud với `GOOGLE_REDIRECT_URI`; restart API sau khi sửa `.env`. |
| `access_denied` / app chưa được phép | Thêm tài khoản vào Test users hoặc publish consent screen khi đã sẵn sàng. |
| `Google sign-in is not configured` | Thiếu Client ID hoặc Client secret trong `.env`. |
| `state is invalid or expired` | Luồng mất quá 10 phút, callback mở bằng browser khác, hoặc callback bị gọi lại. Bắt đầu lại từ `/auth/google/start`. |
| Email conflict | Đăng nhập bằng password và dùng API link Google; hệ thống không tự gộp account. |

Google yêu cầu consent screen/authorized domains phù hợp khi triển khai public. Chỉ dùng credentials development cho local; tạo OAuth client riêng cho staging và production.

Nguồn tham khảo: [Google OAuth web server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Google ID token claims](https://developers.google.com/identity/openid-connect/reference), [OAuth guidance from OWASP](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html).
