import { Sprout } from 'lucide-preact';

interface AppLogoProps {
  size?: 'sm' | 'lg';
  iconColor?: string;
  textColor?: string;
  subtitle?: string;
}

const SIZE_CONFIG = {
  sm: { box: 'w-16 h-16', sprout: 24, title: 'text-3xl' },
  lg: { box: 'w-20 h-20', sprout: 36, title: 'text-5xl' },
} as const;

export function AppLogo({
  size = 'sm',
  iconColor = 'text-pink',
  textColor = 'text-white',
  subtitle,
}: AppLogoProps) {

  const config = SIZE_CONFIG[size];

  return (
    <div className="flex flex-col items-center gap-3 text-center">

      <div className={`${config.box} bg-white rounded-3xl flex items-center justify-center shadow-md`}>
        <Sprout size={config.sprout} className={iconColor} />
      </div>

      <h1 className={`${config.title} ${textColor} font-black tracking-tight`}>
        CAPSUL
      </h1>

      {subtitle && (
        <p className={`${textColor} font-semibold text-md`}>{subtitle}</p>
      )}
    </div>
  );
}
