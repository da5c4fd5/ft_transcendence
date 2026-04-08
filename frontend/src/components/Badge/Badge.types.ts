import type { ComponentChildren } from 'preact';

export type BadgeVariant = 'admin' | 'user' | 'mood';

export interface BadgeProps {
  children: ComponentChildren;
  variant?: BadgeVariant;
  className?: string;
}
