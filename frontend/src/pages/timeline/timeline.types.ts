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

export interface TimelineStats {
  capsuls: number;
  shared: number;
  streak: number;
}
