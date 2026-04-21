const pingSoundModules = import.meta.glob('../assets/pings/*.{mp3,wav,ogg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const pingSoundUrls = Object.values(pingSoundModules) as string[];

export async function playRandomPingSound() {
  if (!pingSoundUrls.length) return false;

  const soundUrl = pingSoundUrls[Math.floor(Math.random() * pingSoundUrls.length)];
  if (!soundUrl) return false;

  try {
    const audio = new Audio(soundUrl);
    audio.preload = 'auto';
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
