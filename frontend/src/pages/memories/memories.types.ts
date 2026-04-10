import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export interface TimeCapsule {
  id: string;
  label: string; // computed by backend: "1 month ago", "3 years ago", etc.
  text: string;
  image: string | null;
}

// Entrée légère pour la grille — le détail complet est chargé dans MemoryModal au clic
export interface MemoryCard {
  id: string;
  date: string;          // ISO date string, e.g. "2026-04-02" — pour le tri et le MemoryModal
  relativeLabel: string; // computed by backend: "Yesterday", "3 years ago"
  formattedDate: string; // e.g. "THU, APR 2, 2026"
  text: string;
  image: string | null;
  mood: Mood;
  isShared: boolean;
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
