import { clsx as cn } from 'clsx';
import { isAudioMediaUrl } from '../../lib/api';

type MediaPreviewProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function MediaPreview({ src, alt = '', className }: MediaPreviewProps) {
  if (isAudioMediaUrl(src)) {
    return (
      <audio
        controls
        preload="metadata"
        src={src}
        className={cn('w-full', className)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
}
