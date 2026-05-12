# GoPark Chatbot – Hướng dẫn sử dụng & Triển khai

## Tổng quan

GoPark tích hợp 2 chatbot AI riêng biệt theo role:

| Role | Chatbot | Màu sắc | Chức năng chính |
|------|---------|---------|-----------------|
| USER | GoPark Assistant | Xanh lá | Tìm bãi, đặt chỗ, ví, xe, lịch sử |
| OWNER | GoPark Analytics | Vàng cam | Phân tích doanh thu, gợi ý tăng trưởng |

---

## Cấu trúc component

```
src/components/chatbot/
├── Chatbot.tsx              # Wrapper – kiểm tra role, render đúng chatbot
├── user/
│   └── UserChatbot.tsx      # UI cho USER (draggable, resizable, voice AI)
└── owner/
    └── OwnerChatbot.tsx     # UI cho OWNER
```

### Logic Wrapper (`Chatbot.tsx`)
- Chưa đăng nhập → không hiện chatbot
- Role USER → `<UserChatbot />`
- Role OWNER → `<OwnerChatbot />`
- Role ADMIN → không hiện chatbot

---

## Triển khai (Setup)

### 1. Cài đặt

```bash
cd GoPark_FE_2026
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_CHATBOT_API=http://localhost:8000/api/v1/chatbot/chat
NEXT_PUBLIC_CHATBOT_STATUS=http://localhost:8000/api/v1/chatbot/status
NEXT_PUBLIC_OWNER_CHATBOT_API=http://localhost:8000/api/v1/chatbot/owner/chat
```

### 3. Chạy dev

```bash
npm run dev
# App chạy tại http://localhost:3000
```

### 4. Đảm bảo Backend đang chạy

```bash
cd GoPark_BE_2026
npm run start:dev
# BE chạy tại http://localhost:8000
```

### 5. Kiểm tra kết nối

Mở trình duyệt → đăng nhập → chatbot xuất hiện góc phải màn hình.
Kiểm tra trạng thái: badge "Đã kết nối" màu xanh = Groq AI hoạt động.

---

## Tính năng chatbot

### Tìm bãi đỗ xe – 3 chế độ khác nhau

| Câu hỏi | Tiêu chí | Kết quả hiển thị |
|---------|---------|-----------------|
| "Tìm bãi gần tôi" | Khoảng cách GPS (Haversine) | Bảng 5 bãi + cột km |
| "Bãi giá rẻ nhất" | Giá/giờ tăng dần, ưu tiên còn chỗ | Bảng 5 bãi + cột giá |
| "Bãi phù hợp nhất" | Điểm tổng hợp (rating 40% + chỗ 30% + giá 30%) | 1 card duy nhất + giải thích |

> **Lưu ý**: "Gần tôi" cần cấp quyền vị trí cho trình duyệt. Nếu từ chối, sẽ fallback theo số chỗ trống.

### Tài khoản cá nhân (cần đăng nhập)

```
"Số dư ví"          → Trả số dư thực từ DB
"Xe của tôi"        → Danh sách xe đã đăng ký
"Lịch sử đặt"       → 5 booking gần nhất
```

### Hỗ trợ (Groq AI)

```
"Hướng dẫn thanh toán"
"GoPark mở cửa mấy giờ"
"Liên hệ hỗ trợ"
"Khuyến mãi"
```

---

## Chức năng Voice AI

### Bật/tắt
Mở chatbot → toggle **"Chế độ giọng nói AI"** ở header.

### Luồng hoạt động

```
Bật toggle
    ↓
Chatbot lắng nghe liên tục (sóng âm nhấp nháy)
    ↓
Nói "Hey GoPark"  ← wake word
    ↓
AI hỏi: "Bạn muốn hỏi gì?" (đọc to)
    ↓
Nói câu hỏi của bạn
    ↓
AI trả lời bằng text + đọc to bằng giọng Google tiếng Việt
    ↓
Tự động quay lại chờ "Hey GoPark"
```

### Wake word được nhận diện

| Nói | Nhận diện |
|-----|-----------|
| "Hey GoPark" | ✅ |
| "Hey Go Park" | ✅ |
| "Hê GoPark" | ✅ |
| "Hei GoPark" | ✅ |
| "Này GoPark" | ✅ |
| "Ê GoPark" | ✅ |

### Trạng thái hiển thị

| Trạng thái | Ý nghĩa |
|-----------|---------|
| 🎙️ Đang chờ "Hey GoPark"... | Đang lắng nghe wake word (sóng âm xanh) |
| 🤖 Bạn muốn hỏi gì? | Đã nhận wake word, chờ câu hỏi |
| 👂 Đang nghe câu hỏi... | Đang ghi âm câu hỏi |
| 🔊 Đang trả lời... | AI đang đọc câu trả lời |

### Mic button (khi tắt voice mode)
- Nhấn icon 🎙️ trong ô nhập liệu để nói → tự động chuyển thành văn bản
- Icon đổi màu đỏ + nhấp nháy khi đang ghi âm
- Nhấn lại để dừng

### Yêu cầu trình duyệt
- Chrome / Edge: ✅ Hỗ trợ đầy đủ
- Firefox: ⚠️ Chưa hỗ trợ SpeechRecognition
- Safari: ⚠️ Hỗ trợ hạn chế
- Cần cấp quyền **microphone** khi trình duyệt hỏi

---

## Kéo thả & Thay đổi kích thước

### Kéo di chuyển
- Giữ chuột vào **phần header** (tên chatbot) và kéo
- Panel di chuyển tự do trên màn hình

### Thay đổi kích thước
- Kéo **góc trên trái** (có icon ⠿) để resize
- Kích thước tối thiểu: 320×400px
- Kích thước tối đa: 700×900px

---

## OWNER Chatbot

Dành cho tài khoản có role OWNER. Màu vàng cam.

```
"Doanh thu tuần này"
"So sánh tháng này vs tháng trước"
"Bãi doanh thu cao nhất"
"Gợi ý tăng doanh thu"
"Bãi hoạt động kém"
"Báo cáo tổng quan"
```

---

## Kết quả test API (12/05/2026)

| # | Câu hỏi | Intent | Kết quả |
|---|---------|--------|---------|
| 1 | "tìm bãi gần tôi" | FIND_NEARBY | ✅ 5 bãi + distance_km |
| 2 | "bãi rẻ nhất" | FIND_BEST (price) | ✅ 5 bãi sort theo giá |
| 3 | "bãi phù hợp nhất" | FIND_BEST | ✅ 1 card + giải thích tiêu chí |
| 4 | "số dư ví" | CHECK_WALLET | ✅ Số dư thực: 2,174,302đ |
| 5 | "xe của tôi" | CHECK_VEHICLES | ✅ Danh sách xe |
| 6 | "lịch sử đặt" | CHECK_BOOKING | ✅ 5 booking gần nhất |
| 7 | "hướng dẫn thanh toán" | FREE_FORM | ✅ Groq AI trả lời |
| 8 | "doanh thu tuần này" (OWNER) | FREE_FORM | ✅ Groq phân tích |

---

## Hạn chế hiện tại

| Vấn đề | Trạng thái |
|--------|-----------|
| GPS "gần tôi" cần quyền location | ⚠️ Fallback theo available_slots nếu từ chối |
| Voice chỉ hoạt động Chrome/Edge | ⚠️ Firefox chưa hỗ trợ |
| Owner chatbot chưa có chart thực | 🔄 Đang phát triển |
| Đặt bãi qua chat cần nhiều bước | 🔄 Đang cải thiện UX |
