import type { AdminUser, AdminStats } from './admin.types';

// TODO: remove when backend is ready

export const MOCK_STATS: AdminStats = {
  totalUsers: 5,
  totalMemories: 452,
  totalAdmins: 1,
};

export const MOCK_USERS: AdminUser[] = [
  { id: 'u1', username: 'Alex Explorer', email: 'alex.explorer@example.com', avatarURL: null, isAdmin: true,  joinedDate: 'Jan 15, 2024', lastActive: 'Apr 7, 2024',  memoriesCount: 145, friendsCount: 12 },
  { id: 'u2', username: 'Sam Sparks',    email: 'sam.sparks@example.com',    avatarURL: null, isAdmin: false, joinedDate: 'Feb 20, 2024', lastActive: 'Apr 6, 2024',  memoriesCount: 89,  friendsCount: 8  },
  { id: 'u3', username: 'Jordan River',  email: 'jordan.river@example.com',  avatarURL: null, isAdmin: false, joinedDate: 'Mar 10, 2024', lastActive: 'Apr 5, 2024',  memoriesCount: 56,  friendsCount: 15 },
  { id: 'u4', username: 'Riley Moon',    email: 'riley.moon@example.com',    avatarURL: null, isAdmin: false, joinedDate: 'Mar 25, 2024', lastActive: 'Apr 7, 2024',  memoriesCount: 34,  friendsCount: 6  },
  { id: 'u5', username: 'Casey Blue',    email: 'casey.blue@example.com',    avatarURL: null, isAdmin: false, joinedDate: 'Jan 30, 2024', lastActive: 'Mar 20, 2024', memoriesCount: 128, friendsCount: 20 },
];
