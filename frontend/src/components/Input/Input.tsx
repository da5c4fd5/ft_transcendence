import { useState } from 'preact/hooks';
import { Eye, EyeOff } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import type { InputProps } from './Input.types';

const containerBase = 'flex items-center gap-2 px-4 py-3 rounded-2xl bg-verylightorange border-2 transition-colors duration-200';

export function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  disabled = false,
  icon,
  className = '',
}: InputProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const resolvedType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>

      {label && (
        <label className="text-sm font-semibold text-darkgrey">
          {label}
        </label>
      )}

      <div className={cn(
        containerBase,
        error ? 'border-pink' : 'border-transparent focus-within:border-yellow',
        disabled && 'opacity-50',
      )}>

        {icon && (
          <span className="text-mediumgrey shrink-0">{icon}</span>
        )}

        <input
          type={resolvedType}
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-darkgrey placeholder:text-mediumgrey text-sm"
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-mediumgrey hover:text-darkgrey transition-colors shrink-0"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-pink">{error}</p>
      )}
    </div>
  );
}
