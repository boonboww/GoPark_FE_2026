"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { chatService } from "@/services/chat.service";
import { useAuthStore } from "@/stores/auth.store";
import { Conversation, Message } from "@/types/chat";
import { User, MessageCircle, Pin, Reply, Undo2, Paperclip, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { useChatSocket } from "@/hooks/useChatSocket";
import Header from "@/components/layout/Header";
import { getOwnerParkingLots } from "@/services/ownerService";
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

type PartnerMeta = {
  title: string;
  avatar?: string;
  parkingId?: string;
  parkingName?: string;
  parkingAddress?: string;
  parkingImage?: string;
};

const DEFAULT_PARKING_IMAGE =
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?q=80&w=800&auto=format&fit=crop";

export default function ChatList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [partnerMeta, setPartnerMeta] = useState<Record<string, PartnerMeta>>({});
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const user = useAuthStore((state) => state.user);
  
  // Realtime hook
  const { socket } = useChatSocket();

  const loadConversations = () => {
    if (user?.id) {
      chatService.getConversations().then(data => {
        setConversations(data);
      });
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  useEffect(() => {
    async function hydratePartnerMeta() {
      const partnerIds = Array.from(
        new Set(
          conversations.map((conv) =>
            conv.user1Id === user?.id ? conv.user2Id : conv.user1Id,
          ),
        ),
      ).filter(Boolean);

      if (!partnerIds.length) {
        setPartnerMeta({});
        return;
      }

      const entries = await Promise.all(
        partnerIds.map(async (partnerId) => {
          try {
            const res = await getOwnerParkingLots(partnerId);
            const raw = (res as any)?.data ?? res;
            const lots = Array.isArray(raw) ? raw : [];
            const firstLot = lots[0];

            if (!firstLot) {
              return [
                partnerId,
                {
                  title: `Chủ bãi #${partnerId?.slice(-5)}`,
                },
              ] as const;
            }

            const image =
              firstLot?.image?.thumbnail ||
              firstLot?.image?.url ||
              firstLot?.image ||
              DEFAULT_PARKING_IMAGE;

            return [
              partnerId,
              {
                title: `Bãi đỗ ${firstLot.name}`,
                avatar: image,
                parkingId: String(firstLot.id),
                parkingName: firstLot.name,
                parkingAddress: firstLot.address || "",
                parkingImage: image,
              },
            ] as const;
          } catch {
            return [
              partnerId,
              {
                title: `Chủ bãi #${partnerId?.slice(-5)}`,
              },
            ] as const;
          }
        }),
      );

      setPartnerMeta(Object.fromEntries(entries));
    }

    hydratePartnerMeta();
  }, [conversations, user?.id]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: Message) => {
      loadConversations();
    };

    const handleMessageRecalled = () => {
      loadConversations();
    };

    socket.on('receiveMessage', handleNewMessage);
    socket.on('messageRecalled', handleMessageRecalled);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('messageRecalled', handleMessageRecalled);
    };
  }, [socket, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(() => {
      loadConversations();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user?.id]);

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
    if (!message) return "Bắt đầu trò chuyện mới";
    if (message.content === "[RECALLED]") return "Đã thu hồi một tin nhắn";
    if (message.content?.startsWith("[WELCOME_CARD]")) {
      return "Đang quan tâm bãi đỗ của bạn";
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
    if (message.content === "[RECALLED]") return <Undo2 size={14} className="text-amber-600" />;
    if (message.type === "FILE") return <Paperclip size={14} className="text-gray-500" />;
    if (message.type === "IMAGE") return <ImageIcon size={14} className="text-blue-500" />;
    if (message.type === "VIDEO") return <Video size={14} className="text-violet-500" />;
    if ((message.content || "").startsWith("[REPLY:")) return <Reply size={14} className="text-green-600" />;
    return null;
  };

  const renderUnreadBadgeText = (count: number) => `${count}+`;

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
      console.error('Xóa hội thoại thất bại', error);
      toast.error("Không thể xóa hội thoại. Vui lòng thử lại.");
    } finally {
      setIsDeletingConversation(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container max-w-5xl mx-auto py-8 px-4 h-[calc(100vh-100px)]">
      <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900 overflow-hidden flex flex-col h-full bg-linear-to-b from-emerald-50/60 via-white to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 shadow-[0_12px_40px_rgba(16,185,129,0.12)]">
        <div className="p-5 border-b border-emerald-100 dark:border-emerald-900/70 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <MessageCircle className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">Tin nhắn của bạn</h2>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">Hiển thị trạng thái ghim, trả lời, thu hồi theo thời gian thực</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0">
          {conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
              <MessageCircle size={48} className="text-gray-300" />
              <p>Bạn chưa có cuộc trò chuyện nào.</p>
            </div>
          ) : (
            <ul className="p-3 space-y-2">
              {conversations.map((conv) => {
                const partner = conv.user1Id === user?.id ? conv.user2Id : conv.user1Id;
                const meta = partnerMeta[partner];
                const unreadCount = conv.unreadCount || 0;
                const hasUnread = unreadCount > 0;
                const hasPinned = Boolean(conv.pinnedMessageId);
                const lastMessage = conv.messages && conv.messages.length > 0
                  ? conv.messages[conv.messages.length - 1]
                  : null;

                const query = new URLSearchParams({
                  parkingId: meta?.parkingId || "",
                  parkingName: meta?.parkingName || "",
                  parkingAddress: meta?.parkingAddress || "",
                  parkingImage: meta?.parkingImage || "",
                }).toString();

                const chatHref = query.includes("=")
                  ? `/users/chat/${partner}?${query}`
                  : `/users/chat/${partner}`;

                return (
                  <li
                    key={conv.id}
                    className={`group relative rounded-xl border transition-all duration-200 ${
                      hasUnread
                        ? "bg-rose-50/70 dark:bg-rose-950/10 border-rose-200/70 dark:border-rose-900/40"
                        : "bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-20 hidden h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 group-hover:inline-flex"
                      onClick={(e) =>
                        requestDeleteConversation(
                          e,
                          conv.id,
                          meta?.title || `Chủ bãi #${partner?.slice(-5)}`,
                        )
                      }
                      title="Xóa đoạn hội thoại"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={chatHref}
                      className="flex items-center gap-4 p-4 pr-12 hover:-translate-y-px"
                    >
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-white/70 dark:border-slate-700">
                        {meta?.avatar ? (
                          <img
                            src={meta.avatar}
                            alt={meta.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4
                            className={`text-sm truncate ${
                              hasUnread
                                ? "font-bold text-slate-900 dark:text-white"
                                : "font-semibold text-slate-900 dark:text-white"
                            }`}
                          >
                            {meta?.title || `Chủ bãi #${partner?.slice(-5)}`}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            {lastMessage && (
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                            {hasUnread && (
                              <span className="inline-flex min-w-6 h-6 px-2 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
                                {renderUnreadBadgeText(unreadCount)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getMessagePreviewIcon(lastMessage)}
                          <p
                            className={`text-sm truncate ${
                              hasUnread
                                ? "font-bold text-slate-800 dark:text-slate-100"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {renderLastMessage(lastMessage)}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {hasPinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 text-[11px] font-semibold">
                              <Pin size={12} /> Đã ghim
                            </span>
                          )}
                          {(lastMessage?.content || "").startsWith("[REPLY:") && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-semibold">
                              <Reply size={12} /> Đã trả lời
                            </span>
                          )}
                          {lastMessage?.content === "[RECALLED]" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2 py-0.5 text-[11px] font-semibold">
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
              Bạn sắp xóa cuộc trò chuyện với
              {" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteConversation?.title || "đối tác"}
              </span>
              . Hội thoại sẽ chỉ bị ẩn ở phía bạn, dữ liệu của đối phương vẫn giữ nguyên.
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
    </>
  );
}
