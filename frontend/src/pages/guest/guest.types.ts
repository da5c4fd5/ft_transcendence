export type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';
import type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';

export interface SharedMemory {
  date: string;
  text: string;
  image: string | null;
  ownerName: string;
  friendContributions: FriendContribution[];
}

export interface GuestPageProps {
  memory: SharedMemory;
  onBack: () => void;
  onNavigateToWelcome?: () => void;
  currentUser?: { name: string; avatar: string | null };
}
