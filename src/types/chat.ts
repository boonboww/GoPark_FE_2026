import { User } from './common'; // Assume User exists or adapt

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  pinnedMessageId?: string | null;
  user1: any; // Use appropriate User type if available
  user2: any;
  messages: Message[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
}
