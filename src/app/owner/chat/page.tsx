"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { chatService } from "@/services/chat.service";
import { useAuthStore } from "@/stores/auth.store";
import { Conversation, Message } from "@/types/chat";
import {
  User,
  MessageCircle,
  Pin,
  Reply,
  Undo2,
  Paperclip,
  Image as ImageIcon,
  Video,
  Trash2,
  Search,
} from "lucide-react";
import { useChatSocket } from "@/hooks/useChatSocket";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function OwnerChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const user = useAuthStore((state) => state.user);

  const { socket } = useChatSocket();

  const loadConversations = () => {
    if (user?.id) {
      chatService.getConversations().then((data) => {
        setConversations(data);
      });
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = () => loadConversations();
    socket.on("receiveMessage", handleNewMessage);
    socket.on("messageRecalled", handleNewMessage);
    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("messageRecalled", handleNewMessage);
    };
  }, [socket, user?.id]);

  const requestDeleteConversation = (
    e: React.MouseEvent<HTMLButtonElement>,
    conversationId: string,
    title: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingDeleteConversation({ id: conversationId, title });
  };

  const handleConfirmDeleteConversation = async () => {
    if (!pendingDeleteConversation?.id) return;
    setIsDeletingConversation(true);
    try {
      await chatService.deleteConversation(pendingDeleteConversation.id);
      setConversations((prev) =>
        prev.filter((item) => item.id !== pendingDeleteConversation.id),
      );
      toast.success("Đã xóa đoạn hội thoại");
      setPendingDeleteConversation(null);
    } catch (error) {
      toast.error("Không thể xóa hội thoại.");
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const renderLastMessage = (message: Message | null) => {
    if (!message) return "Chưa có nội dung";
    if (message.content === "[RECALLED]") return "Tin nhắn đã thu hồi";
    if (message.type === "FILE") return "Đã gửi một tệp";
    if (message.type === "IMAGE") return "Đã gửi một ảnh";
    if (message.type === "VIDEO") return "Đã gửi một video";
    return message.content || "...";
  };

  const filteredConversations = conversations.filter((conv) => {
    const partner = conv.user1Id === user?.id ? conv.user2 : conv.user1;
    const partnerName =
      partner?.fullName || partner?.username || partner?.id || "";
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
                Trung tâm tin nhắn
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Hỗ trợ khách hàng trực tuyến qua kênh Chat
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: List */}
              <Card className="lg:col-span-12 overflow-hidden flex flex-col h-[750px] shadow-2xl border-slate-200 rounded-[2.5rem]">
                <CardHeader className="px-8 py-6 border-b bg-white space-y-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-900">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      Danh sách khách hàng
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0.5 bg-slate-900 text-white font-black ml-2"
                      >
                        {conversations.length}
                      </Badge>
                    </CardTitle>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <Input
                      placeholder="Tìm kiếm theo tên hoặc ID khách hàng..."
                      className="pl-12 h-12 bg-slate-50 border-slate-100 rounded-2xl focus-visible:ring-slate-900 font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    {filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[500px] text-center p-12 opacity-20">
                        <MessageCircle size={100} className="text-slate-300" />
                        <h3 className="font-black text-slate-900 uppercase tracking-widest mt-6">
                          Không tìm thấy hội thoại
                        </h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter mt-2">
                          {searchQuery
                            ? "Thử tìm kiếm với từ khóa khác."
                            : "Bắt đầu phản hồi khách hàng để thấy hội thoại tại đây."}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50 px-4">
                        {filteredConversations.map((conv) => {
                          const partner =
                            conv.user1Id === user?.id ? conv.user2 : conv.user1;
                          const partnerName =
                            partner?.profile?.name ||
                            partner?.name ||
                            partner?.fullName ||
                            partner?.username ||
                            `Khách hàng #${partner?.id?.slice(-5)}`;
                          const unreadCount = conv.unreadCount || 0;
                          const hasUnread = unreadCount > 0;
                          const lastMessage =
                            conv.messages?.[conv.messages.length - 1];

                          return (
                            <Link
                              key={conv.id}
                              href={`/owner/chat/${partner?.id}`}
                              className={cn(
                                "flex items-center gap-6 p-6 transition-all hover:bg-slate-50/80 rounded-2xl my-2 group relative",
                                hasUnread && "bg-blue-50/50 shadow-sm",
                              )}
                            >
                              <div className="relative">
                                <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                  <AvatarImage src={partner?.avatar} />
                                  <AvatarFallback className="bg-slate-900 text-white font-black text-lg">
                                    {partnerName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {hasUnread && (
                                  <span className="absolute -top-1 -right-1 h-6 w-6 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white font-black shadow-lg">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4
                                    className={cn(
                                      "text-base truncate",
                                      hasUnread
                                        ? "font-black text-slate-900"
                                        : "font-bold text-slate-700",
                                    )}
                                  >
                                    {partnerName}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    {lastMessage
                                      ? new Date(
                                          lastMessage.createdAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p
                                    className={cn(
                                      "text-sm truncate font-medium",
                                      hasUnread
                                        ? "text-slate-900 font-bold"
                                        : "text-slate-500",
                                    )}
                                  >
                                    {renderLastMessage(lastMessage)}
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-12 w-12 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                                onClick={(e) =>
                                  requestDeleteConversation(
                                    e,
                                    conv.id,
                                    partnerName,
                                  )
                                }
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Dialog
          open={Boolean(pendingDeleteConversation)}
          onOpenChange={(open) =>
            !open &&
            !isDeletingConversation &&
            setPendingDeleteConversation(null)
          }
        >
          <DialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                Xóa hội thoại?
              </DialogTitle>
              <DialogDescription className="text-base font-bold text-slate-500 leading-relaxed">
                Toàn bộ lịch sử trò chuyện với{" "}
                <span className="text-slate-900 underline underline-offset-4 decoration-primary/30">
                  {pendingDeleteConversation?.title}
                </span>{" "}
                sẽ bị xóa vĩnh viễn. Bạn không thể hoàn tác hành động này.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 sm:gap-2 mt-8">
              <Button
                variant="outline"
                className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs px-8"
                onClick={() => setPendingDeleteConversation(null)}
                disabled={isDeletingConversation}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs px-8 bg-red-600 shadow-xl shadow-red-100"
                onClick={handleConfirmDeleteConversation}
                disabled={isDeletingConversation}
              >
                {isDeletingConversation ? "Đang xóa..." : "Xác nhận xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
