export type Page = 'today' | 'timeline' | 'memories' | 'tree' | 'profile' | 'admin';

export interface NavUser {
  username: string;
  avatarURL?: string;
  isAdmin?: boolean;
}

export interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user?: NavUser;
}
