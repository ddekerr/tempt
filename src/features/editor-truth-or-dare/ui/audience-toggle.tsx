import type { ReactNode } from 'react';
import { AUDIENCE_LABEL } from '../model/labels';
import type { AudienceChoice } from '../model/audience';

const SVG_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'size-6',
} as const;

function MaleIcon() {
  return (
    <svg {...SVG_PROPS}>
      <circle cx="10" cy="14" r="5" />
      <path d="M14 10l6-6M15 4h5v5" />
    </svg>
  );
}

function FemaleIcon() {
  return (
    <svg {...SVG_PROPS}>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v8M9 18h6" />
    </svg>
  );
}

const OPTIONS: { value: 'male' | 'female'; icon: ReactNode; activeClass: string }[] = [
  {
    value: 'male',
    icon: <MaleIcon />,
    activeClass: 'aria-pressed:border-brass aria-pressed:bg-brass/15 aria-pressed:text-brass',
  },
  {
    value: 'female',
    icon: <FemaleIcon />,
    activeClass: 'aria-pressed:border-rose aria-pressed:bg-rose/15 aria-pressed:text-rose',
  },
];

interface AudienceToggleProps {
  value: AudienceChoice;
  onChange: (value: AudienceChoice) => void;
}

/** Дві іконки: хлопець і дівчина. Повторне натискання знімає вибір, без вибору запис іде «для обох». */
export function AudienceToggle({ value, onChange }: AudienceToggleProps) {
  return (
    <div role="group" aria-label="Для кого" className="flex gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          aria-label={AUDIENCE_LABEL[option.value]}
          title={AUDIENCE_LABEL[option.value]}
          onClick={() => onChange(value === option.value ? null : option.value)}
          className={`grid size-11 place-items-center rounded-blade border border-oxblood text-bone/50 transition hover:text-bone focus-visible:outline-2 focus-visible:outline-rose ${option.activeClass}`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
