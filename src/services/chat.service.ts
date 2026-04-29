import { apiClient, del, get, post, put } from '@/lib/api';
import { Conversation, Message } from '@/types/chat';

export const chatService = {
  uploadAttachment: async (
    file: File,
  ): Promise<{ fileUrl: string; fileName: string; mimeType: string; messageType: 'IMAGE' | 'VIDEO' | 'FILE' }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient<any>('/chat/upload', {
      method: 'POST',
      body: formData,
    });

    return res.data || res;
  },

  initConversation: async (receiverId: string): Promise<Conversation> => {
    const res = await post<any>('/chat/conversations/init', { receiverId });
    return res.data || res;
  },

  getConversations: async (): Promise<Conversation[]> => {
    const res = await get<any>('/chat/conversations');
    return res.data || res;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await get<any>(`/chat/messages/${conversationId}`);
    return res.data || res;
  },

  markAsRead: async (conversationId: string) => {
    const res = await put<any>(`/chat/mark-read/${conversationId}`);
    return res.data || res;
  },

  pinMessage: async (conversationId: string, messageId: string | null) => {
    const res = await put<any>(`/chat/pin/${conversationId}`, { messageId });
    return res.data || res;
  },

  deleteConversation: async (conversationId: string) => {
    const res = await del<any>(`/chat/conversations/${conversationId}`);
    return res.data || res;
  },

  getUserProfile: async (id: string) => {
    const res = await get<any>(`/users/${id}`);
    return res.data || res;
  },
};
