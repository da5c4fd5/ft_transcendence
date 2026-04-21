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
  icon?: ComponentChildren;
  className?: string;
}
