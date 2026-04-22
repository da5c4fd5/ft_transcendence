export interface ChatFriend {
  id: string;
  username: string;
  avatarUrl: string | null;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}
