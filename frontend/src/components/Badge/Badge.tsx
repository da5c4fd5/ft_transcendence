import { clsx as cn } from 'clsx';
import type { BadgeProps, BadgeVariant } from './Badge.types';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  admin: 'bg-lightblue text-blue border border-blue/30',
  user:  'bg-lightgrey text-mediumgrey border border-mediumgrey/20',
  mood:  'bg-lightyellow text-darkgrey border border-yellow/40',
};

const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';

export function Badge({ children, variant = 'user', className = '' }: BadgeProps) {
  return (
    <span className={cn(base, VARIANT_CLASSES[variant], className)}>
      {children}
    </span>
  );
}
