import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

// Réponse de GET /memories/capsuls — 3 souvenirs sélectionnés par le backend
export interface TimeCapsule {
  id: string;
  date: string;          // ISO "2025-04-09" — pour calculer le label côté frontend
  content: string;       // was: text
  media: string | null;  // was: image
  mood: Mood;
}

// Entrée légère pour la grille — le détail complet est chargé dans MemoryModal au clic
// relativeLabel et formattedDate sont calculés côté frontend à partir de date
export interface MemoryCard {
  id: string;
  date: string;          // ISO "2026-04-09"
  content: string;       // was: text
  media: string | null;  // was: image
  mood: Mood;
  isOpen: boolean;       // was: isShared — true = souvenir partagé
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

// Réponse de GET /memories/stats
export interface MemoryStats {
  totalCapsuls: number;
  shared: number;
  dayStreak: number;
  wordsWritten: number;
}
