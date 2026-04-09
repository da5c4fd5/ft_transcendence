export type Mood = 'Joyful' | 'Excited' | 'Peaceful' | 'Nostalgic' | 'Sad' | 'Anxious';

export const MOOD_CONFIG: Record<Mood, { cellColor: string; label: string; emoji: string }> = {
  Joyful:    { cellColor: 'bg-yellow',  label: 'Joyful',    emoji: '😊' },
  Excited:   { cellColor: 'bg-pink',    label: 'Excited',   emoji: '🎉' },
  Peaceful:  { cellColor: 'bg-blue',    label: 'Peaceful',  emoji: '😌' },
  Nostalgic: { cellColor: 'bg-purple',  label: 'Nostalgic', emoji: '🥹' },
  Sad:       { cellColor: 'bg-moodsad', label: 'Sad',       emoji: '😢' },
  Anxious:   { cellColor: 'bg-orange',  label: 'Anxious',   emoji: '😰' },
};

export interface FriendContribution {
  id: string;
  name: string;
  avatar: string | null;
  date: string;
  text: string;
  image: string | null;
}

export interface DayEntry {
  date: string; // "YYYY-MM-DD"
  mood: Mood;
  text: string;
  image: string | null;
  isShared: boolean;
  shareUrl: string | null; // UUID-based URL fournie par le backend
  friendContributions: FriendContribution[];
}

export interface TimelineStats {
  capsuls: number;
  completePercent: number;
  shared: number;
  streak: number;
}
