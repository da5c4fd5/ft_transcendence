import type { DayEntry } from '../../pages/timeline/timeline.types';

export interface MemoryModalProps {
  entry: DayEntry;
  onClose: () => void;
  onDelete: () => void;
  onPreviewGuest?: () => void; // TODO: supprimer quand le routing invité sera réel
}
