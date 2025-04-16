export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
  }