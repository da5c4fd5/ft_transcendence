import type { Mood } from '../../components/MemoryModal/MemoryModal.types';

export interface SavedMemory {
  id: string;
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
