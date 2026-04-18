"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconSend } from "@tabler/icons-react";

export function ContactForm() {
  return (
    <Card className="max-w-2xl mx-auto border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold">Gửi yêu cầu hỗ trợ</CardTitle>
        <CardDescription>
          Nếu bạn không tìm thấy câu trả lời trong FAQ, vui lòng gửi tin nhắn cho chúng tôi. 
          Đội ngũ hỗ trợ sẽ phản hồi bạn trong vòng 24 giờ làm việc.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-4">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input id="name" placeholder="Vd: Nguyễn Văn A" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input id="email" type="email" placeholder="vd: example@gmail.com" className="h-11 rounded-xl" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Nội dung cần hỗ trợ</Label>
            <Textarea 
              id="message" 
              placeholder="Vui lòng mô tả chi tiết vấn đề của bạn..." 
              className="min-h-[150px] rounded-xl resize-none"
            />
          </div>

          <Button className="w-full md:w-auto px-8 h-11 rounded-xl font-bold gap-2">
            <IconSend size={18} />
            Gửi yêu cầu
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
