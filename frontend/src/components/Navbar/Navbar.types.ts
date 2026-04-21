export interface NavUser {
  username: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

export interface NavbarProps {
  user?: NavUser;
}
