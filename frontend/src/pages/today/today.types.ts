import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export interface SavedMemory {
  content: string;
  media: string | null;
}

export interface PastMemory {
  id: string;
  date: string;
  content: string;
  media: string | null;
  mood: Mood;
}
