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
  guestName: string;        // was: name
  avatarURL: string | null; // was: avatar
  date: string;
  content: string;          // was: text
  media: string | null;     // was: image
}

export interface MemoryDetails {
  date: string;
  mood: Mood;
  content: string;          // was: text
  media: string | null;     // was: image
  isOpen: boolean;          // was: isShared — true = souvenir partagé
  shareUrl: string | null;
  friendContributions: FriendContribution[];
}

export interface MemoryModalProps {
  entry: MemoryDetails;
  onClose: () => void;
  onDelete: () => void;
  onPreviewGuest?: () => void; // TODO: supprimer quand le routing invité sera réel
}
