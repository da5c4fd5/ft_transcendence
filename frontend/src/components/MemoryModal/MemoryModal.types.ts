export type Mood = 'Joyful' | 'Excited' | 'Peaceful' | 'Nostalgic' | 'Sad' | 'Anxious';

export const MOOD_EMOJI: Record<Mood, string> = {
  Joyful:    '😊',
  Excited:   '🎉',
  Peaceful:  '😌',
  Nostalgic: '🥹',
  Sad:       '😢',
  Anxious:   '😰',
};

export interface FriendContribution {
  id: string;
  name: string;
  avatar: string | null;
  date: string;
  text: string;
  image: string | null;
}

export interface MemoryDetails {
  date: string;
  mood: Mood;
  text: string;
  image: string | null;
  isShared: boolean;
  shareUrl: string | null;
  friendContributions: FriendContribution[];
}

export interface MemoryModalProps {
  entry: MemoryDetails;
  onClose: () => void;
  onDelete: () => void;
  onPreviewGuest?: () => void; // TODO: supprimer quand le routing invité sera réel
}
