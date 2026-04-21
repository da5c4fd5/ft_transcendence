import { Sprout } from 'lucide-preact';
import { SIZE_CONFIG } from './AppLogo.types';
import type { AppLogoProps } from './AppLogo.types';

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
