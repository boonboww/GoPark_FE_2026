"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { IconSend, IconCornerDownRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const mockMessages = [
  {
    id: 1,
    sender: "admin",
    text: "Chào bạn! Tôi là hỗ trợ viên GoPark. Tôi có thể giúp gì cho bạn hôm nay?",
    time: "09:00",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 2,
    sender: "user",
    text: "Chào admin, tôi muốn hỏi về cách tích hợp thanh toán VNPAY cho bãi đỗ xe của mình.",
    time: "09:05",
  },
  {
    id: 3,
    sender: "admin",
    text: "Chào bạn, tích hợp VNPAY rất đơn giản. Bạn chỉ cần cung cấp thông tin mã Merchant trong phần cài đặt doanh nghiệp.",
    time: "09:06",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 4,
    sender: "admin",
    text: "Tôi có thể gửi cho bạn tài liệu hướng dẫn chi tiết ngay bây giờ.",
    time: "09:07",
    avatar: "https://github.com/shadcn.png",
  },
];

export function ChatBox() {
  return (
    <div className="flex flex-col md:flex-row h-[600px] border rounded-3xl overflow-hidden bg-card shadow-sm">
      {/* LEFT: Message List */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <div className="px-6 py-4 border-b bg-muted/30">
          <h3 className="font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Hỗ trợ trực tuyến 
          </h3>
          <p className="text-xs text-muted-foreground font-medium">Chúng tôi thường phản hồi trong vài phút</p>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {mockMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {msg.sender === "admin" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className={cn(
                    "text-[10px] text-muted-foreground font-medium",
                    msg.sender === "user" ? "text-right" : "text-left"
                  )}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT: Input Area */}
      <div className="w-full md:w-[320px] bg-muted/10 p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-bold flex items-center gap-1.5 pt-2">
            <IconCornerDownRight size={16} className="text-primary" />
            Nhắn tin nhanh
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nhập thắc mắc của bạn bên dưới, hệ thống sẽ kết nối bạn với chuyên viên phù hợp.
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-3 justify-end pb-2">
          <Textarea 
            placeholder="Viết tin nhắn..." 
            className="flex-1 md:flex-none md:h-[180px] rounded-2xl p-3 resize-none border-border shadow-inner"
          />
          <Button className="w-full h-11 rounded-xl font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all">
            <IconSend size={18} />
            Gửi tin nhắn
          </Button>
        </div>
        
        <div className="p-3 bg-card border rounded-xl">
          <p className="text-[10px] text-muted-foreground text-center font-medium">
            Thời gian làm việc: 8:00 - 22:00 <br/> (Thứ 2 - Chủ Nhật)
          </p>
        </div>
      </div>
    </div>
  );
}
