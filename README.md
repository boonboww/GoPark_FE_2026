# GoPark

> 🚗 Nền tảng tìm kiếm và đặt chỗ đỗ xe thông minh

## Giới thiệu

**GoPark** là ứng dụng web giúp người dùng dễ dàng tìm kiếm, đặt trước và quản lý chỗ đỗ xe tại các bãi đỗ trong thành phố. Dự án hướng đến việc giải quyết vấn đề thiếu hụt chỗ đỗ xe và tiết kiệm thời gian cho người lái xe.

## Tính năng chính

- 🔍 Tìm kiếm bãi đỗ xe theo vị trí
- 📅 Đặt chỗ đỗ xe trước
- 💳 Thanh toán trực tuyến
- 📊 Quản lý lịch sử đỗ xe
- 📍 Điều hướng đến bãi đỗ

## Tech Stack

| Frontend    | Backend  | Database   |
| ----------- | -------- | ---------- |
| Next.js 15  | NestJS   | PostgreSQL |
| TailwindCSS | JWT Auth | Redis      |

## Cấu hình môi trường

Tạo file `.env.local` trong thư mục frontend:

```env
# URL Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Supabase (nếu dùng)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Production**: Set `NEXT_PUBLIC_API_URL` trỏ đến BE server thật trên hosting (Render, Railway, VPS...).

## Cấu hình Supabase Storage (ảnh đại diện)

Tạo file `.env.local` trong thư mục frontend và thêm:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_BUCKET=img_GoPark2026
NEXT_PUBLIC_SUPABASE_AVATAR_FOLDER=avatars
```

Luồng hiện tại:
- Khi đổi ảnh đại diện ở trang profile, ảnh sẽ upload lên Supabase Storage vào đường dẫn `avatars/<userId>/...`.
- FE chỉ lưu URL ảnh về backend qua API `PATCH /users/me/profile` (field `image`).

## Cấu trúc thư mục

```
src/
├── app/          # App Router (Next.js 15)
├── components/   # React components
├── hooks/        # Custom hooks
├── services/     # API services
├── types/        # TypeScript types
└── utils/        # Utility functions
```

## License

MIT © 2026 GoPark Team
