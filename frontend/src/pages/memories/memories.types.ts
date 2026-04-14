import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

// TODO: Réponse de GET /memories/capsuls -> 3 souvenirs sélectionnés par le backend
export interface TimeCapsule {
  id: string;
  date: string;          // ISO "2025-04-09" -> pour calculer le label côté front
  content: string;
  media: string | null;
  mood: Mood;
}

export interface MemoryCard {
  id: string;
  date: string;
  content: string;
  media: string | null;
  mood: Mood;
  isOpen: boolean;
}

export type MoodFilter = Mood | 'all';
export type PeriodFilter = 'all' | 'week' | 'month' | 'year' | 'custom';

export interface CollectionFilters {
  search: string;
  mood: MoodFilter;
  period: PeriodFilter;
  dateFrom: string;
  dateTo: string;
  sharedOnly: boolean;
}

export interface MemoryStats {
  totalCapsuls: number;
  shared: number;
  dayStreak: number;
  wordsWritten: number;
}
