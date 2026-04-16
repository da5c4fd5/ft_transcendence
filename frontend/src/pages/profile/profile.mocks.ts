import type { User, Friend, Session } from './profile.types';

// TODO: remove when backend is ready

export const MOCK_USER: User = {
  id:        'u1',
  username:  'Louis delapierre',
  email:     'louis.delapierre@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  isAdmin:   true,
  hasMfa:    false,
};

export const MOCK_REGULAR_USER: User = {
  id:        'u2',
  username:  'Sam Pique',
  email:     'sam.pique@example.com',
  avatarUrl: null,
  isAdmin:   false,
};

export const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', username: 'Sam Pique',   avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', online: true  },
  { id: 'f2', username: 'Sasha Touille', avatarUrl: null, online: false },
];

export const MOCK_SESSIONS: Session[] = [
  { id: 's1', userAgent: 'Chrome 124 — macOS Sonoma',  connectedAt: '2026-04-14T09:22:00Z', isCurrent: true  },
  { id: 's2', userAgent: 'Firefox 125 — Windows 11',   connectedAt: '2026-04-12T17:05:00Z', isCurrent: false },
  { id: 's3', userAgent: 'Safari — iPhone iOS 17',     connectedAt: '2026-04-10T08:41:00Z', isCurrent: false },
];
