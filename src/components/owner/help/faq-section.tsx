"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "Làm thế nào để thêm một bãi đỗ xe mới?",
    answer: "Bạn có thể thêm bãi đỗ xe mới bằng cách truy cập vào mục 'Quản lý bãi đỗ' và nhấn nút 'Thêm bãi đỗ'. Tại đây, bạn cần nhập thông tin về địa chỉ, số lượng chỗ và các thông tin liên quan khác.",
  },
  {
    question: "Làm thế nào để cập nhật bảng giá?",
    answer: "Trong chi tiết của từng bãi đỗ xe, bạn sẽ thấy mục 'Cấu hình giá'. Bạn có thể thiết lập giá theo giờ, theo ngày hoặc các gói đăng ký linh hoạt cho khách hàng.",
  },
  {
    question: "Tại sao tôi không thể xem được các giao dịch gần đây?",
    answer: "Nếu giao dịch không hiển thị, vui lòng kiểm tra lại bộ lọc thời gian ở phía trên trang Báo cáo. Nếu vẫn gặp vấn đề, hãy đảm bảo hệ thống thanh toán của bãi đỗ đang ở trạng thái hoạt động.",
  },
  {
    question: "Làm thế nào để biết khi nào bãi đỗ đã đầy?",
    answer: "Dashboard chính cung cấp biểu đồ lấp đầy theo thời gian thực. Ngoài ra, hệ thống sẽ gửi thông báo đẩy và hiển thị cảnh báo đỏ khi tỷ lệ lấp đầy vượt quá 95%.",
  },
  {
    question: "Làm cách nào để xem các báo cáo phân tích?",
    answer: "Bạn có thể vào mục 'Báo cáo & Thống kê' trong thanh điều hướng bên trái. Chúng tôi cung cấp báo cáo về doanh thu, lượt truy cập, hiệu suất theo khung giờ và nhiều chỉ số quan trọng khác.",
  },
];

export function FAQSection() {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-xl font-bold">Câu hỏi thường gặp</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-xl px-4 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <AccordionTrigger className="hover:no-underline font-semibold py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
