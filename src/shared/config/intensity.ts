import type { Intensity } from '@core/games/role-play/content.schema';

export const INTENSITY_LABEL: Record<Intensity, string> = {
  gentle: 'Ніжно',
  medium: 'Середньо',
  intense: 'Інтенсивно',
  bdsm: 'BDSM',
};

/** Мітка рівня: від м'якого рожевого до щільного бонового для BDSM. */
export const INTENSITY_CLASS: Record<Intensity, string> = {
  gentle: 'border-rose text-rose',
  medium: 'border-brass text-brass',
  intense: 'border-crimson bg-crimson/25 text-bone',
  bdsm: 'border-bone bg-bone text-ink',
};
