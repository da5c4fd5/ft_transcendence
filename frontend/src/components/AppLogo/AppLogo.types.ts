export interface AppLogoProps {
  size?: 'sm' | 'lg';
  iconColor?: string;
  textColor?: string;
  subtitle?: string;
}

export const SIZE_CONFIG = {
  sm: { box: 'w-16 h-16', sprout: 24, title: 'text-3xl' },
  lg: { box: 'w-20 h-20', sprout: 36, title: 'text-5xl' },
} as const;