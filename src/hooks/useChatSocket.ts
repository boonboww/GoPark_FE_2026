import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store'; // Giả định bạn có auth store

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
  pending?: boolean;
}

interface UseChatSocketOptions {
  conversationId?: string;
  onIncomingMessage?: (message: Message) => void;
}

// Ensure we connect to the Backend Domain instead of the Next.js frontend proxy
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:8000';

export function useChatSocket(options?: UseChatSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const user = useAuthStore((state) => state.user);
  const conversationIdRef = useRef<string | undefined>(options?.conversationId);
  const onIncomingMessageRef = useRef<((message: Message) => void) | undefined>(options?.onIncomingMessage);

  useEffect(() => {
    conversationIdRef.current = options?.conversationId;
  }, [options?.conversationId]);

  useEffect(() => {
    onIncomingMessageRef.current = options?.onIncomingMessage;
  }, [options?.onIncomingMessage]);

  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(SOCKET_URL, {
      query: { userId: user.id },
      transports: ['websocket', 'polling'], // Đảm bảo kết nối nhanh nhất
    });

    const handleReceiveMessage = (message: Message) => {
      const activeConversationId = conversationIdRef.current;
      const isCurrentUserMessage = message.senderId === user?.id;
      // Allow receiving even if conversationId isn't fully matched yet, or match precisely if given
      if (!activeConversationId || message.conversationId === activeConversationId || message.conversationId === 'new' || activeConversationId === 'temp' || isCurrentUserMessage) {
        setMessages((prev) => {
          // Loại bỏ tin nhắn Welcome ảo nếu server trả về Welcome Card thật
          const isWelcomeMessage = message.type === 'WELCOME_CARD' || message.content?.startsWith('[WELCOME_CARD]');
          const filtered = isWelcomeMessage ? prev.filter(m => m.id !== 'welcome-msg') : prev;
          // Tránh lặp tin nhắn nếu server trả về cùng ID
          if (filtered.some(m => m.id === message.id)) return filtered;

          // Nếu có optimistic message đang chờ thì thay thế bằng message thật từ server
          const optimisticIndex = filtered.findIndex(
            (m) =>
              m.pending &&
              m.senderId === message.senderId &&
              m.type === message.type &&
              m.content === message.content,
          );

          if (optimisticIndex >= 0) {
            const next = [...filtered];
            next[optimisticIndex] = message;
            return next;
          }

          return [...filtered, message];
        });
      }
      onIncomingMessageRef.current?.(message);
    };

    const handleMessagesRead = (data: { conversationId: string, readerId: string }) => {
      const activeConversationId = conversationIdRef.current;
      if (!activeConversationId || data.conversationId === activeConversationId) {
        setMessages((prev) => prev.map(m => (!m.isRead && m.senderId !== data.readerId ? { ...m, isRead: true } : m)));
      }
    };

    const handleTyping = (data: { conversationId?: string, senderId: string }) => {
      const activeConversationId = conversationIdRef.current;
      if (!activeConversationId || data.conversationId === activeConversationId || activeConversationId === 'temp') {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data: { conversationId?: string, senderId: string }) => {
      const activeConversationId = conversationIdRef.current;
      if (!activeConversationId || data.conversationId === activeConversationId || activeConversationId === 'temp') {
        setIsTyping(false);
      }
    };

    const handleMessageRecalled = (data: {
      id: string;
      conversationId: string;
      content: string;
      type: string;
      fileUrl?: string;
      fileName?: string;
    }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === data.id
            ? {
                ...message,
                content: data.content,
                type: data.type,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                pending: false,
              }
            : message,
        ),
      );
    };

    newSocket.on('receiveMessage', handleReceiveMessage);
    newSocket.on('messagesRead', handleMessagesRead);
    newSocket.on('typing', handleTyping);
    newSocket.on('stopTyping', handleStopTyping);
    newSocket.on('messageRecalled', handleMessageRecalled);

    setSocket(newSocket);

    return () => {
      newSocket.off('receiveMessage', handleReceiveMessage);
      newSocket.off('messagesRead', handleMessagesRead);
      newSocket.off('typing', handleTyping);
      newSocket.off('stopTyping', handleStopTyping);
      newSocket.off('messageRecalled', handleMessageRecalled);
      newSocket.disconnect();
    };
  }, [user?.id]);

  const sendMessage = useCallback(
    (receiverId: string, content: string, type = 'TEXT', fileUrl?: string, fileName?: string) => {
      const displayContent = (content && content.trim()) || fileUrl || '';

      if (user?.id && displayContent) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          conversationId: conversationIdRef.current || 'temp',
          senderId: user.id,
          content: displayContent,
          type,
          isRead: false,
          createdAt: new Date().toISOString(),
          pending: true,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
      }

      if (socket) {
        const activeConversationId = conversationIdRef.current;
        socket.emit('sendMessage', {
          conversationId:
            activeConversationId && activeConversationId !== 'temp'
              ? activeConversationId
              : undefined,
          receiverId,
          content: displayContent,
          type,
          fileUrl,
          fileName
        });
      }
    },
    [socket, user?.id]
  );
  
  const markAsRead = useCallback(
    (convId: string, partnerId: string) => {
      if (socket && convId && convId !== 'temp') {
        socket.emit('markRead', { conversationId: convId, partnerId });
        setMessages(prev => prev.map(m => (!m.isRead && m.senderId === partnerId ? { ...m, isRead: true } : m)));
      }
    },
    [socket]
  );

  const emitTyping = useCallback((receiverId: string, convId?: string) => {
    if (socket) socket.emit('typing', { receiverId, conversationId: convId });
  }, [socket]);

  const emitStopTyping = useCallback((receiverId: string, convId?: string) => {
    if (socket) socket.emit('stopTyping', { receiverId, conversationId: convId });
  }, [socket]);

  const recallMessage = useCallback(
    (messageId: string) => {
      if (socket && messageId) {
        socket.emit('recallMessage', { messageId });
      }
    },
    [socket],
  );

  return {
    socket,
    messages,
    setMessages,
    sendMessage,
    markAsRead,
    recallMessage,
    isTyping,
    emitTyping,
    emitStopTyping,
  };
}
