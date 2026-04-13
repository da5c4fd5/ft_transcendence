import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export interface SavedMemory {
  content: string;       // was: text
  media: string | null;  // was: image
}

// Souvenir passé surfacé depuis GET /memories/capsuls (premier résultat)
// date au format ISO — le label "One year ago today" est calculé côté frontend
export interface PastMemory {
  id: string;
  date: string;          // ISO "2025-04-09"
  content: string;       // was: text
  media: string | null;
  mood: Mood;
}
