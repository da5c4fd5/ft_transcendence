export interface User {
  id: string;
  username: string;
  email: string;
  avatarURL: string | null;
  isAdmin: boolean;
}

export interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onNavigateToAdmin: () => void;
  onUserUpdate?: (user: User) => void;
}

export interface Friend {
  id: string;
  username: string;
  avatarURL: string | null;
  online: boolean;
}

export interface Session {
  id: string;
  userAgent: string;
  connectedAt: string;
  isCurrent: boolean;
}
