export type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';
import type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';

export interface SharedMemory {
  id?: string;
  date: string;
  content: string;
  media: string | null;
  ownerName: string;
  friendContributions: FriendContribution[];
}

export interface GuestUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface GuestPageProps {
  memory: SharedMemory;
  onBack: () => void;
  onNavigateToWelcome?: () => void;
  currentUser?: GuestUser;
}
