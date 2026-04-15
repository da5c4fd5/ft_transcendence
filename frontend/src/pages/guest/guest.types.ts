export type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';
import type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';

export interface SharedMemory {
  date: string;
  content: string;
  media: string | null;
  ownerName: string;
  friendContributions: FriendContribution[];
}

export interface GuestUser {
  username: string;
  avatarURL: string | null;
}

export interface GuestPageProps {
  memory: SharedMemory;
  onBack: () => void;
  onNavigateToWelcome?: () => void;
  currentUser?: GuestUser;
}
