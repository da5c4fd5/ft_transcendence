export type Page = 'today' | 'timeline' | 'memories' | 'tree' | 'profile' | 'admin';

export interface NavUser {
  name: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user?: NavUser;
}
