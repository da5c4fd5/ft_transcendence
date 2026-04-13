export type Page = 'today' | 'timeline' | 'memories' | 'tree' | 'profile' | 'admin';

export interface NavUser {
  username: string;    // was: name
  avatarURL?: string;  // was: avatar
  isAdmin?: boolean;
}

export interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user?: NavUser;
}
