export type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';
import type { FriendContribution } from '../../components/MemoryModal/MemoryModal.types';

// Shape pour l'affichage de la page guest (assemblé depuis GET /memories/:id + GET /memories/:id/contributions)
export interface SharedMemory {
  date: string;
  content: string;          // was: text
  media: string | null;     // was: image
  ownerName: string;
  friendContributions: FriendContribution[];
}

export interface GuestPageProps {
  memory: SharedMemory;
  onBack: () => void;
  onNavigateToWelcome?: () => void;
  currentUser?: { username: string; avatarURL: string | null }; // was: name/avatar
}
