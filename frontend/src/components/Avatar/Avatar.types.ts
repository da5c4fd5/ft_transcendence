export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}
