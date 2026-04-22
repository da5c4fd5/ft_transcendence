export type { Mood, FriendContribution, MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export interface DaySummary {
  date: string;
  mood: Mood;
}

export interface TimelineStats {
  totalCapsuls: number;
  shared: number;
  dayStreak: number;
}

export interface TimelineGameMemory {
  id: string;
  date: string;
  content: string;
  mediaUrl: string | null;
}

export interface TimelineGameRoundResult {
  guessedDate: string;
  actualDate: string;
  daysOff: number;
  score: number;
}
