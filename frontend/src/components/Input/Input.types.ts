import type { ComponentChildren } from 'preact';

export type InputType = 'text' | 'email' | 'password' | 'number';

export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: InputType;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  // Accepte maintenant un composant Lucide ou n'importe quel JSX (pas juste une string)
  icon?: ComponentChildren;
  className?: string;
}
