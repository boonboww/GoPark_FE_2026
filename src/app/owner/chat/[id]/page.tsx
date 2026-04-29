"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuthStore } from "@/stores/auth.store";
import { chatService } from "@/services/chat.service";
import { Conversation } from "@/types/chat";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Paperclip,
  Video,
  MoreVertical,
} from "lucide-react";
import { Reply, Pin, Undo2, X, MessageSquare, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function OwnerChatRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const receiverId = resolvedParams.id;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string>("temp");
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const {
    messages,
    setMessages,
    sendMessage,
    markAsRead,
    recallMessage,
    isTyping,
    emitTyping,
    emitStopTyping,
  } = useChatSocket({
    conversationId: currentConvId,
    onIncomingMessage: (message) => {
      if (message.conversationId && message.conversationId !== "temp") {
        setCurrentConvId((prev) =>
          prev === "temp" ? message.conversationId : prev,
        );
      }
    },
  });

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let typingTimeout: NodeJS.Timeout;

  const mergeServerMessages = useCallback(
    (serverMessages: typeof messages) => {
      setMessages((prev) => {
        const pendingMessages = prev.filter((msg) => msg.pending);
        const merged = [...serverMessages];
        for (const pending of pendingMessages) {
          const exists = merged.some(
            (m) =>
              m.id === pending.id ||
              (m.senderId === pending.senderId &&
                m.type === pending.type &&
                m.content === pending.content),
          );
          if (!exists) merged.push(pending);
        }
        return merged;
      });
    },
    [setMessages],
  );

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length > 0 && currentConvId !== "temp") {
      const unreadCount = messages.filter(
        (m) => m.senderId === receiverId && !m.isRead,
      ).length;
      if (unreadCount > 0) markAsRead(currentConvId, receiverId);
    }
  }, [messages, currentConvId, receiverId, markAsRead]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const conv = await chatService.initConversation(receiverId);
        setConversation(conv);
        setCurrentConvId(conv.id);
        setPinnedMessageId(conv.pinnedMessageId || null);
        const m = await chatService.getMessages(conv.id);
        mergeServerMessages(m);
      } catch (err) {
        console.error("Lỗi tải tin nhắn", err);
      }
    }
    if (user?.id) loadHistory();
  }, [user?.id, receiverId, mergeServerMessages]);

  const handleTyping = (val: string) => {
    setText(val);
    emitTyping(receiverId, currentConvId);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(
      () => emitStopTyping(receiverId, currentConvId),
      1500,
    );
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const payload = replyToMessageId
      ? `[REPLY:${replyToMessageId}]${text}`
      : text;
    sendMessage(receiverId, payload, "TEXT");
    setText("");
    setReplyToMessageId(null);
    emitStopTyping(receiverId, currentConvId);
  };

  const handlePinMessage = async (messageId: string | null) => {
    if (!currentConvId || currentConvId === "temp") {
      setPinnedMessageId(messageId);
      return;
    }
    try {
      await chatService.pinMessage(currentConvId, messageId);
      setPinnedMessageId(messageId);
      toast.success(messageId ? "Đã ghim tin nhắn" : "Đã gỡ ghim tin nhắn");
    } catch (error) {
      console.error("Lỗi ghim tin nhắn", error);
    }
  };

  const pinnedMessage = messages.find((m) => m.id === pinnedMessageId);
  const replyToMessage = messages.find((m) => m.id === replyToMessageId);

  const [partnerProfile, setPartnerProfile] = useState<any>(null);

  useEffect(() => {
    if (receiverId && receiverId !== "temp") {
      chatService
        .getUserProfile(receiverId)
        .then((data) => {
          if (data?.profile) setPartnerProfile(data.profile);
        })
        .catch((err) => console.error("Error fetching partner profile:", err));
    }
  }, [receiverId]);

  const partner =
    conversation?.user1Id === user?.id
      ? conversation?.user2
      : conversation?.user1;

  const partnerName =
    partnerProfile?.name ||
    partner?.profile?.name ||
    partner?.name ||
    partner?.fullName ||
    partner?.username ||
    `Khách hàng #${receiverId?.slice(-5)}`;

  const partnerPhone =
    partnerProfile?.phone ||
    partner?.profile?.phone ||
    partner?.phone ||
    partner?.phoneNumber ||
    "Chưa cập nhật";

  const partnerAvatar =
    partnerProfile?.image || partner?.profile?.image || partner?.avatar;

  const parseReply = (content: string) => {
    const match = content.match(/^\[REPLY:([^\]]+)\]/);
    if (!match) return { replyToId: null as string | null, body: content };
    return {
      replyToId: match[1],
      body: content.replace(/^\[REPLY:[^\]]+\]/, "").trim(),
    };
  };

  const handleUploadAndSend = async (file: File) => {
    if (!file || isUploading) return;
    try {
      setIsUploading(true);
      const uploaded = await chatService.uploadAttachment(file);
      sendMessage(
        receiverId,
        uploaded.fileUrl,
        uploaded.messageType,
        uploaded.fileUrl,
        uploaded.fileName,
      );
    } catch (error) {
      toast.error("Tải tệp lên thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <main className="flex-1 flex flex-col p-4 md:p-6 bg-slate-50/50">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/owner/chat")}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarImage src={partnerAvatar} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">
                      {partnerName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-sm font-bold leading-none text-slate-900">
                      {partnerName}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isTyping
                            ? "bg-blue-500 animate-pulse"
                            : "bg-emerald-500",
                        )}
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isTyping ? "Đang soạn tin..." : "Trực tuyến"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pinnedMessage && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-100 gap-1.5 hidden md:flex rounded-full px-3 py-1 font-bold text-[10px] uppercase"
                  >
                    <Pin className="h-3 w-3 fill-amber-500" /> Đã ghim nội dung
                    quan trọng
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setPinnedMessageId(null)}>
                      Gỡ ghim tất cả
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Xóa cuộc hội thoại
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              <Card className="flex-1 flex flex-col h-[750px] shadow-xl border-slate-200 overflow-hidden rounded-[2.5rem]">
                <CardContent className="p-0 flex-1 overflow-hidden relative bg-white">
                  {pinnedMessage && (
                    <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between animate-in slide-in-from-top">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                          <Pin className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                            Tin nhắn được ghim
                          </p>
                          <p className="text-sm truncate text-slate-700 font-medium">
                            {parseReply(pinnedMessage.content).body ||
                              "[Tệp đính kèm]"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:bg-slate-50"
                        onClick={() => handlePinMessage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <ScrollArea className="h-full">
                    <div className="p-8 space-y-8">
                      {messages.length === 0 ? (
                        <div className="h-[400px] flex flex-col items-center justify-center opacity-10">
                          <MessageSquare size={100} />
                          <p className="text-sm font-black mt-4 uppercase tracking-widest">
                            Chưa có nội dung hội thoại
                          </p>
                        </div>
                      ) : (
                        messages.map((m, i) => {
                          const isMe = m.senderId === user?.id;
                          const parsed = parseReply(m.content || "");
                          const partnerName =
                            partner?.profile?.name ||
                            partner?.name ||
                            partner?.fullName ||
                            partner?.username ||
                            `Khách hàng #${partner?.id?.slice(-5)}`;
                          const messageBody =
                            m.content === "[RECALLED]"
                              ? m.content
                              : parsed.body;
                          const repliedMessage = parsed.replyToId
                            ? messages.find(
                                (msg) => msg.id === parsed.replyToId,
                              )
                            : null;

                          return (
                            <div
                              key={m.id || i}
                              className={cn(
                                "flex gap-4 max-w-[85%] group",
                                isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                              )}
                            >
                              {!isMe && (
                                <Avatar className="h-10 w-10 shrink-0 mt-1 border border-slate-100 shadow-sm">
                                  <AvatarImage src={partnerAvatar} />
                                  <AvatarFallback className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                                    KH
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex flex-col gap-2 relative">
                                {repliedMessage && (
                                  <div
                                    className={cn(
                                      "px-4 py-2 rounded-t-2xl text-[11px] font-bold border-l-4 mb-[-12px] opacity-60 transition-all",
                                      isMe
                                        ? "bg-slate-100 border-primary/30 mr-4"
                                        : "bg-slate-50 border-slate-300 ml-4",
                                    )}
                                  >
                                    <p className="text-[9px] font-black uppercase tracking-tighter opacity-50 mb-0.5">
                                      Phản hồi
                                    </p>
                                    <p className="line-clamp-1 italic">
                                      {parseReply(repliedMessage.content || "")
                                        .body || "[Tệp]"}
                                    </p>
                                  </div>
                                )}
                                <div
                                  className={cn(
                                    "px-6 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm transition-all group-hover:shadow-md",
                                    isMe
                                      ? "bg-slate-900 text-white rounded-tr-none"
                                      : "bg-slate-50 border border-slate-100 rounded-tl-none text-slate-800",
                                  )}
                                >
                                  {m.type === "IMAGE" ? (
                                    <img
                                      src={m.content}
                                      alt="img"
                                      className="max-w-md rounded-2xl shadow-sm"
                                    />
                                  ) : m.type === "VIDEO" ? (
                                    <video
                                      src={m.content}
                                      controls
                                      className="max-w-md rounded-2xl shadow-sm"
                                    />
                                  ) : m.type === "FILE" ? (
                                    <a
                                      href={m.content}
                                      target="_blank"
                                      className="underline text-xs flex items-center gap-3 font-bold"
                                    >
                                      <Paperclip size={16} /> Tệp đính kèm:{" "}
                                      {m.fileName || "Tài liệu"}
                                    </a>
                                  ) : (
                                    <p
                                      className={cn(
                                        m.content === "[RECALLED]" &&
                                          "italic opacity-50 font-medium",
                                      )}
                                    >
                                      {messageBody === "[RECALLED]"
                                        ? "Tin nhắn đã được thu hồi"
                                        : messageBody}
                                    </p>
                                  )}
                                </div>
                                <div
                                  className={cn(
                                    "flex items-center gap-2 px-2 mt-0.5",
                                    isMe ? "justify-end" : "justify-start",
                                  )}
                                >
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                    {m.createdAt
                                      ? new Date(
                                          m.createdAt,
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Vừa xong"}
                                  </span>
                                  {isMe && m.isRead && (
                                    <div className="flex items-center gap-1">
                                      <div className="h-1 w-1 bg-blue-500 rounded-full" />
                                      <span className="text-[8px] text-blue-500 font-black uppercase">
                                        Đã xem
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div
                                  className={cn(
                                    "absolute bottom-full mb-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white border border-slate-200 shadow-xl rounded-full p-1.5 z-20",
                                    isMe ? "right-0" : "left-0",
                                  )}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-slate-50"
                                    onClick={() => setReplyToMessageId(m.id)}
                                  >
                                    <Reply size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-slate-50"
                                    onClick={() => handlePinMessage(m.id)}
                                  >
                                    <Pin size={16} />
                                  </Button>
                                  {isMe && m.content !== "[RECALLED]" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-red-50 text-red-500"
                                      onClick={() => recallMessage(m.id)}
                                    >
                                      <Undo2 size={16} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={endOfMessagesRef} className="h-4" />
                    </div>
                  </ScrollArea>
                </CardContent>

                <Separator className="bg-slate-100" />

                <CardFooter className="p-4 flex flex-col gap-4 bg-slate-50/30">
                  {replyToMessage && (
                    <div className="w-full p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Reply size={12} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Đang trả lời
                          </p>
                          <p className="text-xs truncate text-slate-700 font-bold italic">
                            {parseReply(replyToMessage.content || "").body ||
                              "[Tệp đính kèm]"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-slate-100"
                        onClick={() => setReplyToMessageId(null)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  )}
                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <ImageIcon size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Video size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Paperclip size={14} />
                      </Button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleUploadAndSend(e.target.files[0])
                        }
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleUploadAndSend(e.target.files[0])
                        }
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleUploadAndSend(e.target.files[0])
                        }
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder="Nhập nội dung tin nhắn..."
                        className="min-h-[52px] max-h-[200px] rounded-2xl p-4 resize-none bg-white border-slate-200 shadow-inner text-sm font-medium focus-visible:ring-slate-900"
                        value={text}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                      />
                      <Button
                        className="h-[52px] w-[52px] rounded-2xl bg-slate-900 hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-[0.95] shrink-0"
                        onClick={handleSend}
                        disabled={!text.trim() || isUploading}
                      >
                        <Send size={18} className="transform -rotate-12" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* Right: Small Info Column */}
              <div className="w-full lg:w-[320px] space-y-6 shrink-0">
                <Card className="shadow-xl border-slate-200 rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Info className="h-4 w-4" /> Chi tiết khách hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col items-center py-8 gap-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-2xl">
                          <AvatarImage src={partnerAvatar} />
                          <AvatarFallback className="text-2xl font-black bg-slate-900 text-white uppercase">
                            {partnerName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white" />
                      </div>
                      <div className="text-center px-6">
                        <h3 className="font-black text-lg text-slate-900 leading-tight">
                          {partnerName}
                        </h3>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1 tracking-widest">
                          Đang trực tuyến
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-slate-50" />

                    <div className="p-6 space-y-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Số điện thoại
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {partnerPhone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
