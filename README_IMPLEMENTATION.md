# Tài liệu triển khai Frontend Auth (Register & Login)

## 1. Tổng quan
Dựa trên yêu cầu, tôi đã triển khai lại giao diện và logic authentication cho dự án **GoPark_FE_2026**, sao chép lại chức năng từ **GoPark-FE** nhưng được viết lại gọn gàng và tích hợp với codebase hiện tại.

## 2. Các thay đổi đã thực hiện

### 2.1. Cài đặt Dependencies
Đã cài đặt các thư viện cần thiết để hỗ trợ UI và Animation:
- `lucide-react`: Icon set.
- `framer-motion`: Thư viện animation cho các hiệu ứng chuyển động mượt mà.
- `clsx` & `tailwind-merge`: Hỗ trợ xử lý conditional class names (hàm `cn`).
- `@radix-ui/react-slot`: Dependency cho component Button.

### 2.2. Xây dựng UI Components (Shadcn-like)
Tôi đã tái tạo các component UI cơ bản trong thư mục `src/components/ui/` để đảm bảo giao diện nhất quán và đẹp mắt:
- `button.tsx`: Component nút bấm với các state hover, disabled.
- `input.tsx`: Component nhập liệu text/password/email.
- `label.tsx`: Nhãn cho các input.
- `card.tsx`: Container chính cho form login/register.

### 2.3. Logic Ghi nhớ Đăng nhập (Remember Me)
Đã tạo Custom Hook `src/hooks/useRememberLogin.ts`:
- Sử dụng `localStorage` để lưu trữ thông tin đăng nhập (email/password) nếu người dùng chọn "Ghi nhớ".
- Tự động điền form khi người dùng quay lại trang Login.

### 2.4. Trang Đăng nhập (Login Page) - `src/app/auth/login/page.tsx`
- **Giao diện**: Sử dụng Card layout với shadow, animation frame-motion khi load trang.
- **Logic**:
  - Form validation cơ bản (email/pass).
  - Tích hợp `useRememberLogin` để load/save credentials.
  - Gọi API `/auth/login` thông qua `apiClient`.
  - Lưu token vào Global State (Zustand: `useAuthStore`).
  - Chuyển hướng về trang chủ (`/`) sau khi đăng nhập thành công.

### 2.5. Trang Đăng ký (Register Page) - `src/app/auth/register/page.tsx`
- **Giao diện**: Tương tự trang Login nhưng thêm các trường cần thiết (Username, Phone, Confirm Password, Avatar).
- **Logic**:
  - Validate khớp mật khẩu (`password` == `passwordConfirm`).
  - Upload ảnh avatar được xử lý chuyển thành chuỗi Base64 trước khi gửi (giống logic tham khảo).
  - Gọi API `/auth/register`.
  - Chuyển hướng về trang Login kèm query param `?success=1` để hiển thị thông báo thành công.

## 3. Cấu trúc đường dẫn
- **Login**: `http://localhost:3000/auth/login`
- **Register**: `http://localhost:3000/auth/register`

## 4. Lưu ý về Backend
Hiện tại, code logic Backend trong `GoPark_BE_2026` đang ở trạng thái sơ khai (scaffolding). Frontend đang giả định các API endpoint sau tồn tại và hoạt động theo chuẩn RESTful:
- `POST /api/v1/auth/login`: Trả về `{ accessToken, user }`.
- `POST /api/v1/auth/register`: Đăng ký người dùng mới.

Cần đảm bảo Backend được triển khai đầy đủ auth module để Frontend hoạt động chính xác.
