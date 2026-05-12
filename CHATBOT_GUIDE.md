# GoPark Chatbot – Hướng dẫn sử dụng

## Tổng quan

GoPark tích hợp 2 chatbot AI riêng biệt theo role:

| Role | Chatbot | Màu sắc | Chức năng chính |
|------|---------|---------|-----------------|
| USER | GoPark Assistant | Xanh lá | Tìm bãi, đặt chỗ, ví, xe, lịch sử |
| OWNER | GoPark Analytics | Vàng cam | Phân tích doanh thu, gợi ý tăng trưởng |

---

## Kết quả test API (12/05/2026)

| # | Câu hỏi | Intent | Kết quả |
|---|---------|--------|---------|
| 1 | "tìm bãi gần tôi" | FIND_NEARBY | ✅ Trả về danh sách bãi |
| 2 | "bãi rẻ nhất" | FIND_BEST | ✅ Trả về danh sách bãi |
| 3 | "số dư ví" | CHECK_WALLET | ✅ Trả đúng số dư thực |
| 4 | "xe của tôi" | CHECK_VEHICLES | ✅ Trả danh sách xe |
| 5 | "lịch sử đặt" | CHECK_BOOKING | ✅ Trả lịch sử booking |
| 6 | "hướng dẫn thanh toán" | FREE_FORM → Groq | ✅ AI trả lời |
| 7 | "GoPark mở cửa mấy giờ" | FREE_FORM → Groq | ✅ AI trả lời |
| 8 | "doanh thu tuần này" (OWNER) | FREE_FORM → Groq | ✅ AI phân tích |

---

## Chức năng Voice AI

### Bật/tắt
Mở chatbot → toggle **"Chế độ giọng nói AI"** ở header.

### Luồng hoạt động
```
Bật toggle
    ↓
Chatbot lắng nghe liên tục
    ↓
Nói "Hey GoPark"
    ↓
AI hỏi: "Bạn muốn hỏi gì?"
    ↓
Nói câu hỏi của bạn
    ↓
AI trả lời bằng text + đọc to bằng giọng Google tiếng Việt
    ↓
Tự động quay lại chờ "Hey GoPark"
```

### Trạng thái hiển thị
| Trạng thái | Ý nghĩa |
|-----------|---------|
| 🎙️ Đang chờ "Hey GoPark"... | Đang lắng nghe wake word |
| 🤖 Bạn muốn hỏi gì? | Đã nhận wake word, chờ câu hỏi |
| 👂 Đang nghe câu hỏi... | Đang ghi âm câu hỏi |
| 🔊 Đang trả lời... | AI đang đọc câu trả lời |

### Lưu ý
- Cần cấp quyền microphone cho trình duyệt
- Hỗ trợ Chrome, Edge (Web Speech API)
- Firefox chưa hỗ trợ đầy đủ SpeechRecognition
- Giọng đọc ưu tiên **Google tiếng Việt (vi-VN)**

---

## Các câu hỏi chatbot hỗ trợ

### USER – GoPark Assistant

#### Tìm bãi đỗ xe
```
"Tìm bãi gần tôi"
"Bãi rẻ nhất"
"Bãi phù hợp nhất"
"Tìm bãi ở Quận 1"
"Bãi đỗ xe gần đây"
```

#### Đặt chỗ
```
"Đặt bãi"
"Tôi muốn đặt chỗ"
"Đặt bãi [tên bãi]"
```

#### Tài khoản cá nhân (cần đăng nhập)
```
"Số dư ví"
"Xe của tôi"
"Lịch sử đặt của tôi"
"Xem booking"
```

#### Hỗ trợ
```
"Hướng dẫn thanh toán"
"GoPark mở cửa mấy giờ"
"Liên hệ hỗ trợ"
"Khuyến mãi"
```

### OWNER – GoPark Analytics

```
"Doanh thu tuần này"
"So sánh tháng này vs tháng trước"
"Bãi doanh thu cao nhất"
"Gợi ý tăng doanh thu"
"Bãi hoạt động kém"
"Báo cáo tổng quan"
```

---

## Cấu hình môi trường

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_CHATBOT_API=http://localhost:8000/api/v1/chatbot/chat
NEXT_PUBLIC_CHATBOT_STATUS=http://localhost:8000/api/v1/chatbot/status
NEXT_PUBLIC_OWNER_CHATBOT_API=http://localhost:8000/api/v1/chatbot/owner/chat
```

### Backend (.env)
```env
GORQ_API_KEY=<your_groq_api_key>
GOOGLE_API_KEY=<your_gemini_api_key>   # optional
```

---

## Đánh giá chất lượng chatbot

### Điểm mạnh ✅
- Intent classification chính xác cho các câu hỏi phổ biến
- Hỗ trợ cả tiếng Việt có dấu và không dấu
- Dữ liệu thực từ DB (ví, xe, booking, bãi đỗ)
- Groq LLM xử lý câu hỏi tự do (free-form) tốt
- Voice AI hoạt động mượt với wake word

### Hạn chế / Cần cải thiện ⚠️
- Tìm bãi "gần tôi" chưa dùng GPS thực, sắp xếp theo available_slots
- Đặt bãi qua chat cần nhiều bước hỏi đáp
- Owner chatbot chưa có dữ liệu chart thực từ DB
- Voice chỉ hoạt động trên Chrome/Edge

---

## API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/v1/chatbot/status` | Không | Kiểm tra kết nối AI |
| POST | `/api/v1/chatbot/chat` | Optional | Chat USER |
| POST | `/api/v1/chatbot/owner/chat` | Required (OWNER) | Chat OWNER |
| GET | `/api/v1/chatbot/suggestions` | Không | Gợi ý câu hỏi |

### Request body
```json
{
  "messages": [
    { "role": "user", "content": "tìm bãi gần tôi" }
  ]
}
```

### Response
```json
{
  "statusCode": 201,
  "data": {
    "text": "Đây là các bãi gần bạn...",
    "action": "list_parking",
    "data": {
      "lots": [ ... ]
    }
  }
}
```
