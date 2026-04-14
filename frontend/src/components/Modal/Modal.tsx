import { useEffect } from 'preact/hooks';
import { clsx as cn } from 'clsx';
import type { ModalProps } from './Modal.types';

const overlayBase = 'fixed inset-0 z-50 flex items-center justify-center p-4';
const panelBase   = 'relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl';

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={overlayBase} onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={panelBase} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-xl font-bold text-darkgrey">{title}</h2>
            <button
              onClick={onClose}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-full text-lg',
                'text-mediumgrey hover:text-darkgrey hover:bg-lightgrey transition-all',
              )}
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
