import type { ComponentChildren } from 'preact';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ComponentChildren;
  title?: string;
}
