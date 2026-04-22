"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuthStore } from "@/stores/auth.store";
import { chatService } from "@/services/chat.service";
import { ArrowLeft, Send, User as UserIcon, Image as ImageIcon, Paperclip, Video } from "lucide-react";
import { Reply, Pin, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function OwnerChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const receiverId = resolvedParams.id;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string>("temp");
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [activeActionMessageId, setActiveActionMessageId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const actionHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { messages, setMessages, sendMessage, markAsRead, recallMessage, isTyping, emitTyping, emitStopTyping } = useChatSocket({
    conversationId: currentConvId,
    onIncomingMessage: (message) => {
      if (message.conversationId && message.conversationId !== 'temp') {
        setCurrentConvId((prev) => (prev === 'temp' ? message.conversationId : prev));
      }
    },
  });
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let typingTimeout: NodeJS.Timeout;

  const mergeServerMessages = useCallback((serverMessages: typeof messages) => {
    setMessages((prev) => {
      const pendingMessages = prev.filter((msg) => msg.pending);
      const merged = [...serverMessages];

      for (const pending of pendingMessages) {
        const exists = merged.some(
          (msg) =>
            msg.id === pending.id ||
            (msg.senderId === pending.senderId &&
              msg.type === pending.type &&
              msg.content === pending.content),
        );

        if (!exists) {
          merged.push(pending);
        }
      }

      return merged;
    });
  }, [setMessages]);
  
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length > 0 && currentConvId !== 'temp') {
      const unreadCount = messages.filter(m => m.senderId === receiverId && !m.isRead).length;
      if (unreadCount > 0) markAsRead(currentConvId, receiverId);
    }
  }, [messages, currentConvId, receiverId, markAsRead]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const conv = await chatService.initConversation(receiverId);
        setCurrentConvId(conv.id);
        setPinnedMessageId(conv.pinnedMessageId || null);
        const m = await chatService.getMessages(conv.id);
        mergeServerMessages(m);
      } catch (err) {
        console.error("Lỗi tải tin nhắn", err);
      }
    }
    
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id, receiverId, mergeServerMessages]);

  const handleTyping = (val: string) => {
    setText(val);
    emitTyping(receiverId, currentConvId);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      emitStopTyping(receiverId, currentConvId);
    }, 1500);
  }

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
    if (!currentConvId || currentConvId === 'temp') {
      setPinnedMessageId(messageId);
      return;
    }

    try {
      await chatService.pinMessage(currentConvId, messageId);
      setPinnedMessageId(messageId);
    } catch (error) {
      console.error("Lỗi ghim tin nhắn", error);
    }
  };

  const pinnedMessage = messages.find((message) => message.id === pinnedMessageId);
  const replyToMessage = messages.find((message) => message.id === replyToMessageId);

  useEffect(() => {
    if (!pinnedMessageId) {
      return;
    }

    const isPinnedMessageStillExists = messages.some(
      (message) => message.id === pinnedMessageId,
    );
    if (!isPinnedMessageStillExists) {
      setPinnedMessageId(null);
    }
  }, [messages, pinnedMessageId]);

  const parseReply = (content: string) => {
    const match = content.match(/^\[REPLY:([^\]]+)\]/);
    if (!match) {
      return { replyToId: null as string | null, body: content };
    }
    return {
      replyToId: match[1],
      body: content.replace(/^\[REPLY:[^\]]+\]/, '').trim(),
    };
  };

  const startLongPress = (messageId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setActiveActionMessageId(messageId);
    }, 2000);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openActionMenu = (messageId: string) => {
    if (actionHideTimerRef.current) {
      clearTimeout(actionHideTimerRef.current);
      actionHideTimerRef.current = null;
    }
    setActiveActionMessageId(messageId);
  };

  const scheduleCloseActionMenu = (messageId: string) => {
    if (actionHideTimerRef.current) {
      clearTimeout(actionHideTimerRef.current);
    }
    actionHideTimerRef.current = setTimeout(() => {
      setActiveActionMessageId((prev) => (prev === messageId ? null : prev));
    }, 180);
  };

  const cancelCloseActionMenu = () => {
    if (actionHideTimerRef.current) {
      clearTimeout(actionHideTimerRef.current);
      actionHideTimerRef.current = null;
    }
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
      console.error("Lỗi upload file chat", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadAndSend(file);
    }
    e.target.value = "";
  };

  const handleVideoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadAndSend(file);
    }
    e.target.value = "";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadAndSend(file);
    }
    e.target.value = "";
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
        <SiteHeader />
        <div className="max-w-[1400px] mx-auto p-6 flex-1 w-full flex flex-col h-[calc(100vh-var(--header-height))]">
          <div className="flex flex-col flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Header chat */}
            <div className="bg-muted/30 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  onClick={() => router.push('/owner/chat')}
                  title="Quay lại danh sách chat"
                >
                  <ArrowLeft size={18} className="text-muted-foreground" />
                </button>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                     <UserIcon className="text-primary" />
                </div>
                <div>
                   <h3 className="font-semibold text-foreground">Khách hàng #{receiverId?.slice(-5)}</h3>
                   {isTyping && <span className="text-xs text-primary italic animate-pulse">Đang phản hồi...</span>}
                </div>
              </div>
            </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        onClick={() => {
          setActiveActionMessageId(null);
          cancelCloseActionMenu();
        }}
      >
        {pinnedMessage && (
          <div className="sticky top-0 z-10 bg-accent/50 border border-border rounded-lg p-3 flex items-start justify-between gap-2 shadow-sm backdrop-blur-md">
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Pin size={12}/> Tin nhắn đã ghim</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {pinnedMessage.content === '[RECALLED]'
                  ? 'Tin nhắn đã được thu hồi'
                  : parseReply(pinnedMessage.content).body || '[Tệp đính kèm]'}
              </p>
            </div>
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={async (e) => {
                e.stopPropagation();
                await handlePinMessage(null);
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">Chưa có tin nhắn nào hợp lệ.</div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.senderId === user?.id;
            const isLastInGroup = i === messages.length - 1 || messages[i + 1]?.senderId !== m.senderId;
            const parsed = parseReply(m.content || '');
            const repliedMessage = parsed.replyToId
              ? messages.find((msg) => msg.id === parsed.replyToId)
              : null;
            const messageBody = m.content === '[RECALLED]' ? m.content : parsed.body;

            // Xử lý card welcome nếu có
            if (m.type === 'WELCOME_CARD' || (m.type === 'TEXT' && m.content?.startsWith('[WELCOME_CARD]'))) {
              let payload = { name: '', address: '', image: '', id: '' };
              try { 
                payload = JSON.parse(m.content.replace('[WELCOME_CARD]', '')); 
              } catch (e) {}

              return (
                <div key={i} className="flex justify-start">
                  <div className="w-full max-w-sm rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
                    <div className="h-32 w-full bg-muted relative">
                       <img src={payload.image || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop"} alt={payload.name} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                       <p className="absolute bottom-2 left-3 right-3 text-white font-bold truncate">Chào mừng đến với {payload.name}</p>
                    </div>
                    <div className="p-3 bg-muted/30">
                      <p className="text-sm font-medium text-foreground">Khách hàng đang quan tâm tới bãi đỗ {payload.name}</p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`relative group flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
                onMouseEnter={() => openActionMenu(m.id)}
                onMouseLeave={() => scheduleCloseActionMenu(m.id)}
                onTouchStart={() => startLongPress(m.id)}
                onTouchEnd={clearLongPress}
                onTouchMove={clearLongPress}
              >
                <div
                  className={`${
                    activeActionMessageId === m.id
                      ? 'flex'
                      : 'hidden'
                  } absolute top-full mt-1 z-20 items-center gap-2 rounded-lg border border-border bg-popover shadow-md px-2 py-1 ${
                    isMe ? 'right-0' : 'left-0'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => {
                    cancelCloseActionMenu();
                    openActionMenu(m.id);
                  }}
                  onMouseLeave={() => scheduleCloseActionMenu(m.id)}
                >
                  <button
                    className="text-xs flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyToMessageId(m.id);
                      setActiveActionMessageId(null);
                    }}
                  >
                    <Reply size={12} /> Trả lời
                  </button>
                  <button
                    className="text-xs flex items-center gap-1 text-foreground hover:text-primary transition-colors"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handlePinMessage(m.id);
                      setActiveActionMessageId(null);
                    }}
                  >
                    <Pin size={12} /> Ghim
                  </button>
                  {isMe && m.content !== '[RECALLED]' && (
                    <button
                      className="text-xs flex items-center gap-1 text-foreground hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        recallMessage(m.id);
                        setActiveActionMessageId(null);
                      }}
                    >
                      <Undo2 size={12} /> Thu hồi
                    </button>
                  )}
                </div>

                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`max-w-[70%] p-3 rounded-2xl ${
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground border border-border rounded-tl-none"
                  }`}
                >
                  {repliedMessage && (
                    <div className={`mb-2 p-2 rounded-lg text-xs ${isMe ? 'bg-primary-foreground/20' : 'bg-background border border-border text-muted-foreground'}`}>
                      <p className="font-semibold">Trả lời</p>
                      <p className="line-clamp-1">
                        {repliedMessage.content === '[RECALLED]'
                          ? 'Tin nhắn đã được thu hồi'
                          : parseReply(repliedMessage.content || '').body || '[Tệp đính kèm]'}
                      </p>
                    </div>
                  )}

                  {m.type === 'IMAGE' ? (
                     <img src={m.content} alt="Sent file" className="max-w-full rounded-lg mt-1 mb-1 object-contain" />
                  ) : m.type === 'VIDEO' ? (
                    <video src={m.content} controls className="max-w-full rounded-lg mt-1 mb-1" />
                  ) : m.type === 'FILE' ? (
                     <a href={m.content} target="_blank" className={`underline font-medium break-all ${isMe ? 'text-primary-foreground' : 'text-primary'}`}>Tệp đính kèm</a>
                  ) : (
                     <p className={`whitespace-pre-wrap wrap-break-word ${m.content === '[RECALLED]' ? 'italic opacity-80' : ''}`}>
                       {messageBody === '[RECALLED]' ? 'Tin nhắn đã được thu hồi' : messageBody}
                     </p>
                  )}
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground'}`}>
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                {/* Trạng thái đã xem */}
                {isMe && isLastInGroup && m.isRead && (
                  <div className="mt-1 mr-1 flex items-center justify-end">
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                      <UserIcon className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  </div>
                )}
                {isMe && isLastInGroup && !m.isRead && (
                  <span className="text-[10px] text-muted-foreground mt-1 mr-1">Đã gửi</span>
                )}
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-10 border border-border">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border rounded-b-xl">
        {replyToMessage && (
          <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-accent border border-border text-xs flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">Đang trả lời</p>
              <p className="text-muted-foreground line-clamp-1 mt-0.5">
                {replyToMessage.content === '[RECALLED]'
                  ? 'Tin nhắn đã được thu hồi'
                  : parseReply(replyToMessage.content || '').body || '[Tệp đính kèm]'}
              </p>
            </div>
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setReplyToMessageId(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="p-3 flex gap-2 items-center focus-within:ring-1 focus-within:ring-primary rounded-b-xl">

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoSelect}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        <button
          className="text-muted-foreground hover:text-primary transition-colors p-2 shrink-0"
          title="Gửi ảnh"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
        >
           <ImageIcon size={20} />
        </button>
        <button
          className="text-muted-foreground hover:text-primary transition-colors p-2 shrink-0"
          title="Gửi video"
          onClick={() => videoInputRef.current?.click()}
          disabled={isUploading}
        >
          <Video size={20} />
        </button>
        <button
          className="text-muted-foreground hover:text-primary transition-colors p-2 shrink-0 mr-1"
          title="Đính kèm tệp"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
           <Paperclip size={20} />
        </button>
        <input 
          className="flex-1 border border-border bg-muted/30 rounded-full px-4 py-2.5 outline-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background transition-colors"
          placeholder={isUploading ? "Đang tải tệp lên..." : "Nhập phản hồi..."}
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={isUploading}
        />
        <button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 h-11 w-11 flex items-center justify-center transition-colors shrink-0"
          onClick={handleSend}
          disabled={isUploading}
        >
          <Send size={18} className="translate-x-0.5" />
        </button>
        </div>
      </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
