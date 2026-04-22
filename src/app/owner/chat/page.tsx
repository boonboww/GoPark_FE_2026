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

export default function OwnerChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Lắng nghe socket để realtime cập nhật danh sách chat
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

  // Khi có tin nhắn mới tới, load lại danh sách để đẩy lên trên cùng
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      loadConversations();
    };

    const handleMessageRecalled = () => {
      loadConversations();
    };

    socket.on("receiveMessage", handleNewMessage);
    socket.on("messageRecalled", handleMessageRecalled);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.off("messageRecalled", handleMessageRecalled);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(() => {
      loadConversations();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user?.id]);

  const requestDeleteConversation = (
    e: React.MouseEvent<HTMLButtonElement>,
    conversationId: string,
    title: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeletingConversation) {
      return;
    }

    setPendingDeleteConversation({ id: conversationId, title });
  };

  const handleConfirmDeleteConversation = async () => {
    if (!pendingDeleteConversation?.id || isDeletingConversation) {
      return;
    }

    setIsDeletingConversation(true);

    try {
      await chatService.deleteConversation(pendingDeleteConversation.id);
      setConversations((prev) =>
        prev.filter((item) => item.id !== pendingDeleteConversation.id),
      );
      toast.success("Đã xóa đoạn hội thoại");
      setPendingDeleteConversation(null);
    } catch (error) {
      console.error("Xóa hội thoại thất bại", error);
      toast.error("Không thể xóa hội thoại. Vui lòng thử lại.");
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const parseReplyContent = (content: string) => {
    const match = content.match(/^\[REPLY:([^\]]+)\]/);
    if (!match) {
      return { isReply: false, body: content };
    }

    return {
      isReply: true,
      body: content.replace(/^\[REPLY:[^\]]+\]/, "").trim(),
    };
  };

  const renderLastMessage = (message: Message | null) => {
    if (!message) return "Chưa có nội dung";
    if (message.content === "[RECALLED]") return "Đã thu hồi một tin nhắn";
    if (message.content?.startsWith("[WELCOME_CARD]")) {
      return "Khách hàng đang quan tâm bãi đỗ của bạn";
    }
    if (message.type === "FILE") return "Đã gửi tệp đính kèm";
    if (message.type === "IMAGE") return "Đã gửi hình ảnh";
    if (message.type === "VIDEO") return "Đã gửi video";

    const parsed = parseReplyContent(message.content || "");
    if (parsed.isReply) {
      return `Đang trả lời: ${parsed.body || "[Tệp đính kèm]"}`;
    }

    return message.content || "Tin nhắn";
  };

  const getMessagePreviewIcon = (message: Message | null) => {
    if (!message) return null;
    if (message.content === "[RECALLED]")
      return <Undo2 size={14} className="text-amber-600" />;
    if (message.type === "FILE")
      return <Paperclip size={14} className="text-gray-500" />;
    if (message.type === "IMAGE")
      return <ImageIcon size={14} className="text-blue-500" />;
    if (message.type === "VIDEO")
      return <Video size={14} className="text-violet-500" />;
    if ((message.content || "").startsWith("[REPLY:"))
      return <Reply size={14} className="text-green-600" />;
    return null;
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="max-w-[1400px] mx-auto p-6 flex-1 w-full flex flex-col h-[calc(100vh-var(--header-height))]">
          <div className="rounded-2xl border border-border overflow-hidden flex flex-col flex-1 bg-card shadow-sm">
            <div className="p-5 border-b border-border bg-muted/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageCircle className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Tin nhắn của khách hàng
                </h2>
                <p className="text-xs text-muted-foreground">
                  Hiển thị trạng thái ghim, trả lời, thu hồi rõ ràng
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {conversations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <MessageCircle size={48} className="text-gray-300" />
                  <p>Bạn chưa có cuộc trò chuyện nào với khách hàng.</p>
                </div>
              ) : (
                <ul className="p-3 space-y-2">
                  {conversations.map((conv) => {
                    const partner =
                      conv.user1Id === user?.id ? conv.user2Id : conv.user1Id;
                    const unreadCount = conv.unreadCount || 0;
                    const hasUnread = unreadCount > 0;
                    const hasPinned = Boolean(conv.pinnedMessageId);
                    const lastMessage =
                      conv.messages && conv.messages.length > 0
                        ? conv.messages[conv.messages.length - 1]
                        : null;

                    return (
                      <li
                        key={conv.id}
                        className={`group relative rounded-xl border transition-all duration-200 ${
                          hasUnread
                            ? "bg-primary/5 border-primary/20"
                            : "bg-card border-border hover:bg-muted/50"
                        }`}
                      >
                        <button
                          type="button"
                          className="absolute right-3 top-3 z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-destructive/20 bg-background text-destructive shadow-sm transition hover:bg-destructive/10 hover:text-destructive group-hover:inline-flex"
                          onClick={(e) =>
                            requestDeleteConversation(
                              e,
                              conv.id,
                              `Khách hàng #${partner?.slice(-5)}`,
                            )
                          }
                          title="Xóa đoạn hội thoại"
                        >
                          <Trash2 size={14} />
                        </button>
                        <Link
                          href={`/owner/chat/${partner}`}
                          className="flex items-center gap-4 p-4 pr-12 hover:-translate-y-px"
                        >
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center shrink-0 border border-border">
                            <User className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4
                                className={`text-sm truncate ${hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
                              >
                                Khách hàng #{partner?.slice(-5)}
                              </h4>
                              <div className="flex items-center gap-2">
                                {lastMessage && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {new Date(
                                      lastMessage.createdAt,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                                {hasUnread && (
                                  <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {getMessagePreviewIcon(lastMessage)}
                              <p
                                className={`text-sm truncate ${hasUnread ? "font-medium text-foreground" : "text-muted-foreground"}`}
                              >
                                {renderLastMessage(lastMessage)}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {hasPinned && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-[11px] font-medium">
                                  <Pin size={12} /> Đã ghim
                                </span>
                              )}
                              {(lastMessage?.content || "").startsWith(
                                "[REPLY:",
                              ) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                                  <Reply size={12} /> Đã trả lời
                                </span>
                              )}
                              {lastMessage?.content === "[RECALLED]" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium">
                                  <Undo2 size={12} /> Đã thu hồi
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <Dialog
            open={Boolean(pendingDeleteConversation)}
            onOpenChange={(open) => {
              if (!open && !isDeletingConversation) {
                setPendingDeleteConversation(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Xóa đoạn hội thoại?</DialogTitle>
                <DialogDescription>
                  Bạn sắp xóa cuộc trò chuyện với{" "}
                  <span className="font-semibold text-foreground">
                    {pendingDeleteConversation?.title || "khách hàng"}
                  </span>
                  . Hội thoại sẽ chỉ bị ẩn ở phía bạn, dữ liệu của đối phương
                  vẫn giữ nguyên.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingDeleteConversation(null)}
                  disabled={isDeletingConversation}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDeleteConversation}
                  disabled={isDeletingConversation}
                >
                  {isDeletingConversation ? "Đang xóa..." : "Xóa hội thoại"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
