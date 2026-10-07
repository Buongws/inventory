# Frontend Convention

- Next.js App Router, React, TypeScript; component PascalCase, file kebab-case. Giữ client boundary ở phần cần hook/browser API.
- UI state cục bộ nằm trong component; Redux giữ session dùng chung. Không thêm state/cache library chỉ để thay thế pattern hiện tại.
- API requests qua Axios client trong `lib/api.ts`, base URL Gateway `http://localhost:3004/api/v1`.
- Access token/user hiện persist vào localStorage rồi hydrate Redux. Refresh token chỉ trong cookie HttpOnly. Không đọc localStorage khi server render.
- Phân biệt endpoint auth public với endpoint auth cần Bearer (`me`, Google link); không suy luận mọi `/auth/*` đều public.
- Refresh requests dùng chung promise trong tab, retry request tối đa một lần; không refresh chỉ vì chuyển route. Google callback lấy session bằng refresh cookie là trường hợp riêng.
- Không coi role trong Redux/localStorage là authorization đáng tin; API kiểm tra quyền.
- Mỗi flow có trạng thái loading/error/empty thích hợp. Tránh abstraction, hook hay memoization không phục vụ nhu cầu rõ ràng.
- ESLint dùng `eslint-config-next` cùng phiên bản Next.js; Prettier theo config root. Chạy `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`.

## Giao diện quản lý và code dễ bảo trì

- Sidebar bên trái, content bên phải; form tìm sản phẩm nằm trên bảng sản phẩm.
- Ưu tiên Ant Design Table, Form, modal/drawer cho admin UI. Mỗi dòng có nút Inventory để mở tồn, lịch sử và thao tác nhập/xuất.
- Pagination theo server: page, page size và total; đổi search thì về trang một. Inventory API hiện chỉ có page/limit; mở rộng search phía server phải được đặc tả trước khi implement. Không lọc riêng trang đang tải rồi coi là tìm toàn catalog.
- Handler dùng một nơi và state form giữ gần component. Chỉ tách utils/hooks khi có tái sử dụng thực tế hoặc logic độc lập đáng kể; tránh wrapper nhỏ vô ích và abstraction dự phòng.
- Tối ưu theo vấn đề thực tế; không thêm memoization hay state trùng mặc định. Tận dụng Axios, Redux và component thư viện hiện có.
- Label, spacing, loading/empty/error phải rõ. Đây là preference áp dụng lâu dài, không cho phép tự implement/cài dependency hoặc bỏ qua bước Spec Kit hiện tại.
