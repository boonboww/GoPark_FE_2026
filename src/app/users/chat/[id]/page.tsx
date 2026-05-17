"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { chatService } from "@/services/chat.service";
import { getOwnerProfile } from "@/services/ownerService";
import {
  ArrowLeft,
  Reply,
  Send,
  User as UserIcon,
  Image as ImageIcon,
  Paperclip,
  MapPin,
  Pin,
  Undo2,
  Video,
  X,
} from "lucide-react";

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const receiverId = resolvedParams.id;
  const searchParams = useSearchParams();
  const parkingName = searchParams.get("parkingName");
  const parkingAddress = searchParams.get("parkingAddress");
  const parkingImage = searchParams.get("parkingImage");
  const parkingId = searchParams.get("parkingId");
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string>("temp");
  const [ownerAccount, setOwnerAccount] = useState<{ name: string; phone: string | null } | null>(null);
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
  
  // Scroll to bottom when messages update
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
    let isActive = true;

    async function loadOwnerProfile() {
      try {
        const profile = await getOwnerProfile(receiverId);
        if (isActive) {
          setOwnerAccount({
            name: profile?.name || "Chủ bãi đỗ",
            phone: profile?.phone || null,
          });
        }
      } catch {
        if (isActive) {
          setOwnerAccount(null);
        }
      }
    }

    if (receiverId && receiverId !== "undefined") {
      loadOwnerProfile();
    }

    return () => {
      isActive = false;
    };
  }, [receiverId]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const conv = await chatService.initConversation(receiverId);
        setCurrentConvId(conv.id);
        setPinnedMessageId(conv.pinnedMessageId || null);

        const m = await chatService.getMessages(conv.id);
        if (m.length === 0 && parkingName && parkingId) {
          setMessages((prev) => {
            const pendingMessages = prev.filter((msg) => msg.pending);
            return [{
              id: 'welcome-msg',
              conversationId: conv.id,
              senderId: receiverId,
              content: JSON.stringify({ name: parkingName, address: parkingAddress, image: parkingImage, id: parkingId }),
              type: 'WELCOME_CARD',
              isRead: true,
              createdAt: new Date().toISOString()
            }, ...pendingMessages];
          });
        } else {
          mergeServerMessages(m);
        }
      } catch (err) {
        console.error("Lỗi tải tin nhắn", err);
      }
    }
    
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id, receiverId, parkingName, parkingAddress, parkingImage, parkingId, setMessages, mergeServerMessages]);

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

  const hasConversationInfo = Boolean(parkingName || parkingAddress || parkingImage);
  const hasParkingDetailLink = Boolean(parkingId);
  const conversationImage =
    parkingImage ||
    "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop";
  const ownerName = ownerAccount?.name || "Chủ bãi đỗ";
  const ownerPhone = ownerAccount?.phone || "Chưa cập nhật";

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-900 border rounded-xl overflow-hidden shadow-sm m-4">
      {/* Header chat */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => router.back()}
            title="Quay lại"
          >
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]">
               {parkingImage ? <img src={parkingImage} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="text-gray-500" />}
          </div>
          <div>
             <h3 className="font-semibold text-green-700 dark:text-green-400 capitalize">Chủ bãi: {ownerName}</h3>
             {isTyping && <span className="text-xs text-green-500 italic animate-pulse">Đang soạn tin...</span>}
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
          <div className="sticky top-0 z-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Tin nhắn đã ghim</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                {pinnedMessage.content === '[RECALLED]'
                  ? 'Tin nhắn đã được thu hồi'
                  : parseReply(pinnedMessage.content).body || '[Tệp đính kèm]'}
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
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
          <div className="text-center text-gray-500 mt-10">Bắt đầu cuộc trò chuyện.</div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.senderId === user?.id;
            const isLastInGroup = i === messages.length - 1 || messages[i + 1]?.senderId !== m.senderId;
            const isLatestMessage = i === messages.length - 1;
            const parsed = parseReply(m.content || '');
            const repliedMessage = parsed.replyToId
              ? messages.find((msg) => msg.id === parsed.replyToId)
              : null;
            const messageBody = m.content === '[RECALLED]' ? m.content : parsed.body;
            
            // Xử lý card chào sân
            if (m.type === 'WELCOME_CARD' || (m.type === 'TEXT' && m.content?.startsWith('[WELCOME_CARD]'))) {
              let payload = { name: '', address: '', image: '', id: '' };
              try { 
                payload = JSON.parse(m.content.replace('[WELCOME_CARD]', '')); 
              } catch (e) {}

              return (
                <React.Fragment key={`welcome-${i}`}>
                  {hasConversationInfo && isLatestMessage && (
                    <div className="py-2 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Thông tin cuộc trò chuyện</span>
                        <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                      </div>

                      <div
                        className={`mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900 overflow-hidden shadow-sm ${
                          hasParkingDetailLink
                            ? "cursor-pointer hover:shadow-md transition-shadow"
                            : ""
                        }`}
                        onClick={() => {
                          if (hasParkingDetailLink) {
                            router.push(`/users/detailParking/${parkingId}`);
                          }
                        }}
                      >
                        <div className="h-32 w-full bg-gray-200">
                          <img src={conversationImage} alt={parkingName || 'Bãi đỗ'} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 space-y-1.5">
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Chủ bãi đỗ</p>
                          <p className="font-semibold text-green-700 dark:text-green-400">{ownerName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">SĐT: {ownerPhone}</p>
                          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 pt-1">Bãi đỗ xe</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{parkingName || 'Bãi đỗ của đối tác'}</p>
                          <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                            <span className="line-clamp-2">{parkingAddress || 'Địa chỉ đang được cập nhật'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-start">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-green-100 dark:border-green-900 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" 
                        onClick={() => router.push(`/users/detailParking/${payload.id}`)}>
                      <div className="h-32 w-full bg-gray-200 relative">
                        <img src={payload.image || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop"} alt={payload.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                        <p className="absolute bottom-2 left-3 right-3 text-white font-bold truncate">Chào mừng đến với {payload.name}</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-gray-800">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Bạn muốn hỏi gì về bãi đỗ xe này? Có thể giúp gì cho bạn hôm nay?</p>
                        <div className="flex items-start gap-1 mt-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                          <span className="line-clamp-2">{payload.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={`${m.id}-${i}`}>
                {hasConversationInfo && isLatestMessage && (
                  <div className="py-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Thông tin cuộc trò chuyện</span>
                      <div className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <div
                      className={`mx-auto w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-green-100 dark:border-green-900 overflow-hidden shadow-sm ${
                        hasParkingDetailLink
                          ? "cursor-pointer hover:shadow-md transition-shadow"
                          : ""
                      }`}
                      onClick={() => {
                        if (hasParkingDetailLink) {
                          router.push(`/users/detailParking/${parkingId}`);
                        }
                      }}
                    >
                      <div className="h-32 w-full bg-gray-200">
                        <img src={conversationImage} alt={parkingName || 'Bãi đỗ'} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Chủ bãi đỗ</p>
                        <p className="font-semibold text-green-700 dark:text-green-400">{ownerName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">SĐT: {ownerPhone}</p>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 pt-1">Bãi đỗ xe</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{parkingName || 'Bãi đỗ của đối tác'}</p>
                        <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                          <span className="line-clamp-2">{parkingAddress || 'Địa chỉ đang được cập nhật'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div
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
                        ? "flex"
                        : "hidden"
                    } absolute top-full mt-1 z-20 items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-md px-2 py-1 ${
                      isMe ? "right-0" : "left-0"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                      cancelCloseActionMenu();
                      openActionMenu(m.id);
                    }}
                    onMouseLeave={() => scheduleCloseActionMenu(m.id)}
                  >
                    <button
                      className="text-xs flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-green-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyToMessageId(m.id);
                        setActiveActionMessageId(null);
                      }}
                    >
                      <Reply size={12} /> Trả lời
                    </button>
                    <button
                      className="text-xs flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-green-600"
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
                        className="text-xs flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-red-600"
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
                        ? "bg-green-600 text-white rounded-tr-none" 
                        : "bg-white dark:bg-gray-800 border-gray-200 border dark:border-gray-700 rounded-tl-none dark:text-gray-200"
                    }`}
                  >
                    {repliedMessage && (
                      <div className={`mb-2 p-2 rounded-lg text-xs ${isMe ? 'bg-green-700/80' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
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
                      <a href={m.content} target="_blank" className="underline font-medium break-all text-green-100">Tệp đính kèm</a>
                    ) : (
                      <p className={`whitespace-pre-wrap break-words ${m.content === '[RECALLED]' ? 'italic opacity-80' : ''}`}>
                        {messageBody === '[RECALLED]' ? 'Tin nhắn đã được thu hồi' : messageBody}
                      </p>
                    )}
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-green-100 text-right' : 'text-gray-400'}`}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {/* Trạng thái đã xem */}
                  {isMe && isLastInGroup && m.isRead && (
                    <div className="mt-1 mr-1 flex items-center justify-end">
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {parkingImage ? (
                          <img src={parkingImage} alt="Seen avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-2.5 h-2.5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  )}
                  {isMe && isLastInGroup && !m.isRead && (
                    <span className="text-[10px] text-gray-400 mt-1 mr-1">Đã gửi</span>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-10">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t rounded-b-xl">
        {replyToMessage && (
          <div className="mx-3 mt-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-200">Đang trả lời</p>
              <p className="text-gray-600 dark:text-gray-300 line-clamp-1">
                {replyToMessage.content === '[RECALLED]'
                  ? 'Tin nhắn đã được thu hồi'
                  : parseReply(replyToMessage.content || '').body || '[Tệp đính kèm]'}
              </p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setReplyToMessageId(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="p-3 flex gap-2 items-center focus-within:ring-1 focus-within:ring-green-500 rounded-b-xl">

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
          className="text-gray-400 hover:text-green-600 transition-colors p-2 shrink-0"
          title="Gửi ảnh"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
        >
           <ImageIcon size={20} />
        </button>
        <button
          className="text-gray-400 hover:text-green-600 transition-colors p-2 shrink-0"
          title="Gửi video"
          onClick={() => videoInputRef.current?.click()}
          disabled={isUploading}
        >
           <Video size={20} />
        </button>
        <button
          className="text-gray-400 hover:text-green-600 transition-colors p-2 shrink-0 mr-1"
          title="Đính kèm tệp"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
           <Paperclip size={20} />
        </button>

        <input 
          className="flex-1 border-none bg-gray-50 dark:bg-gray-900 rounded-full px-4 py-2.5 outline-none dark:text-white"
          placeholder={isUploading ? "Đang tải tệp lên..." : "Nhập tin nhắn..."}
          value={text}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={isUploading}
        />
        <button 
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 h-11 w-11 flex items-center justify-center transition-colors shrink-0"
          onClick={handleSend}
          disabled={isUploading}
        >
          <Send size={18} className="translate-x-0.5" />
        </button>
        </div>
      </div>
    </div>
  );
}
