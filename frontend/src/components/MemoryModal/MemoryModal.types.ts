export type Mood = 'Joyful' | 'Excited' | 'Peaceful' | 'Nostalgic' | 'Sad' | 'Anxious';

export interface FriendContribution {
  id: string;
  guestName: string;
  avatarURL: string | null;
  contributorId?: string | null;
  date: string;
  content: string;
  media: string | null;
}

export interface MemoryDetails {
  id: string;
  date: string;
  mood: Mood;
  content: string;
  media: string | null;
  isOpen: boolean;
  shareUrl: string | null;
  friendContributions: FriendContribution[];
}

export interface MemoryModalProps {
  entry: MemoryDetails;
  onClose: () => void;
  onDelete: () => void;
}
