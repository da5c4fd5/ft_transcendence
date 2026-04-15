import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export interface SavedMemory {
  content: string;
  media: string | null;
}

// Past memory surfaced from GET /memories/capsuls (first result)
// date is ISO format — the "One year ago today" label is computed client-side
export interface PastMemory {
  id: string;
  date: string;       // ISO "2025-04-09"
  content: string;
  media: string | null;
  mood: Mood;
}
