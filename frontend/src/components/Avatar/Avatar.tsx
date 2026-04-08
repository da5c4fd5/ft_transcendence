import type { AvatarProps, AvatarSize } from './Avatar.types';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden shrink-0 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-yellow flex items-center justify-center font-bold text-darkgrey">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
