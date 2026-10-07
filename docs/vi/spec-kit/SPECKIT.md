# Spec Kit trong Inventory Learning

## Setup

Repository đã khởi tạo bằng Specify CLI **0.14.3**, Codex skills integration, Bash scripts. Chạy Codex từ root `inventory-api` để nhận `.agents/skills/`. Không khởi tạo thêm Spec Kit riêng trong apps/api/apps/gateway/frontend.

CLI đã có trên máy. Khi tái lập ở máy mới dùng `uv tool install specify-cli==0.14.3`, sau đó `specify version`. Khi clone repository này, các template/skills đã nằm trong source; không cần chạy init lần nữa. `specify init --here --force` có thể ghi đè file được quản lý, nên chỉ dùng khi đã review và backup phần tùy chỉnh.

## Workflow

Gọi trong cuộc trò chuyện Codex, không phải shell:

```text
$speckit-specify <mô tả nghiệp vụ và tiêu chí nghiệm thu>
$speckit-clarify
$speckit-plan <thiết kế BE/FE/DB/Gateway trong phạm vi feature>
$speckit-tasks
$speckit-analyze
$speckit-implement
$speckit-converge
```

Constitution hiện nằm ở `.specify/memory/constitution.md`; khi thay đổi nguyên tắc chung dùng `$speckit-constitution`. Không tự chạy implementation chỉ vì đã hoàn tất plan khi người dùng mới yêu cầu lên kế hoạch.

## Quyền sở hữu tài liệu

- `docs/`: conventions, hướng dẫn vận hành và spec cũ hiện có.
- `specs/<number>-<feature>/`: spec/plan/tasks/contracts của feature mới, bao phủ mọi layer bị ảnh hưởng.
- Spec mô tả hành vi; plan mô tả cách triển khai; tasks nêu file, dependency và cách kiểm chứng.
- Khi behavior thay đổi, cập nhật spec và các artifact liên quan trong cùng thay đổi. Không để hai bản contract cạnh tranh.
- Không đánh dấu tất cả feature cũ đã hoàn thành: baseline code còn có các điểm cần đối chiếu như replay revoke trong transaction và Bearer của auth endpoints phía FE.

## Quality gates

```sh
npm run check
npm run build
npm test
```

Test mới phụ thuộc phạm vi đã chốt; không tự tạo test khi người dùng yêu cầu không thêm. Ghi rõ gap, không gọi build là integration verification. Root package điều phối các package độc lập; giữ lockfile của từng package.

## Bước tiếp theo

Dùng Product CRUD làm feature đầu tiên, tham chiếu `docs/vi/catalog/PRODUCT_SPEC.md`. Chốt rõ có làm UI quản lý sản phẩm hay chỉ backend trước khi tạo tasks. Không sinh sẵn plan/tasks giả hoặc triển khai sản phẩm trong lần setup convention.

Nguồn: [Installation](https://github.github.io/spec-kit/installation.html), [Existing project](https://github.github.io/spec-kit/guides/existing-projects.html), [Codex integration](https://github.github.io/spec-kit/reference/integrations.html).
