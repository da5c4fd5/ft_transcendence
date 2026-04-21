export interface AdminUser {
  id: string;
  username: string;
  email: string;
  avatarURL: string | null;
  isAdmin: boolean;
  joinedDate: string;
  lastActive: string;
  memoriesCount: number;
  friendsCount: number;
}

export interface AdminStats {
  totalUsers: number;
  totalMemories: number;
  totalAdmins: number;
}

export interface AdminPageProps {
  currentUserId: string;
}
