export interface Conversation {
    id: string;
    participants: string[];
    createdAt: Date;
    lastMessage?: string;
    lastMessageSender?: string;
    lastMessageTimestamp?: Date;
  }