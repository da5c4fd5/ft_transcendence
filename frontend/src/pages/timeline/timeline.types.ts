export type { Mood, FriendContribution, MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export const MOOD_CONFIG: Record<Mood, { cellColor: string }> = {
  Joyful:    { cellColor: 'bg-yellow'  },
  Excited:   { cellColor: 'bg-pink'    },
  Peaceful:  { cellColor: 'bg-blue'    },
  Nostalgic: { cellColor: 'bg-purple'  },
  Sad:       { cellColor: 'bg-moodsad' },
  Anxious:   { cellColor: 'bg-orange'  },
};

export interface DaySummary {
  date: string;
  mood: Mood;
}

// Champs issus de GET /memories/stats
export interface TimelineStats {
  totalCapsuls: number;  // was: capsuls
  shared: number;
  dayStreak: number;     // was: streak
}
