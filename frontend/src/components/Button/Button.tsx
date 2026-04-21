import { clsx as cn } from 'clsx';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-yellow text-darkgrey font-bold hover:opacity-90 active:scale-95',
  secondary: 'bg-white border-2 border-darkgrey/20 text-darkgrey hover:border-darkgrey/50',
  danger:    'bg-lightpink text-pink font-semibold hover:opacity-90',
  ghost:     'text-mediumgrey hover:text-darkgrey',
  white:     'bg-white text-darkgrey font-bold shadow-sm hover:opacity-90 active:scale-95',
  outline:   'bg-transparent border-2 border-current font-bold hover:bg-white/10 active:scale-95',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const base = 'rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        base,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        className,
      )}
    >
      {children}
    </button>
  );
}
