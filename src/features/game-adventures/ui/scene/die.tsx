import { useEffect, useState, type ReactNode } from 'react';

/** Скільки крутиться кубик. Те саме число в `.die-rolling` у стилях. */
const ROLL_MS = 1400;
const TICK_MS = 85;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * Результат на сервері вже відомий обом телефонам, а анімація лише показує його поступово.
 * Поки кубик крутиться, повертається число, що «миготить», а `rolling` каже, що висновки показувати ще рано.
 * Якщо кубик уже був кинутий, коли екран відкрився (оновили сторінку), анімації немає.
 */
export function useRollReveal(value: number | null, sides: number) {
  const [settled, setSettled] = useState(value);
  const [flicker, setFlicker] = useState(value ?? 1);
  const reduce = prefersReducedMotion();

  useEffect(() => {
    if (value === null || reduce) {
      setSettled(value);
      return;
    }
    if (value === settled) return;

    const tick = window.setInterval(() => setFlicker(1 + Math.floor(Math.random() * sides)), TICK_MS);
    const done = window.setTimeout(() => setSettled(value), ROLL_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [value, settled, sides, reduce]);

  const rolling = value !== null && !reduce && settled !== value;
  return { shown: rolling ? flicker : value, rolling };
}

type Tone = 'good' | 'bad';

const TONE_CLASS: Record<Tone | 'none', string> = {
  good: 'text-brass',
  bad: 'text-rose',
  none: 'text-bone/70',
};

function D20Shape() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="var(--color-ink)" />
      <polygon points="50,24 78,72 22,72" opacity="0.55" />
      <path
        d="M50 24 50 4M50 24 10 27M50 24 90 27M78 72 90 27M78 72 90 73M78 72 50 96M22 72 10 27M22 72 10 73M22 72 50 96"
        opacity="0.55"
      />
    </g>
  );
}

function D6Shape() {
  return (
    <rect x="8" y="8" width="84" height="84" rx="14" fill="var(--color-ink)" stroke="currentColor" strokeWidth="2.6" />
  );
}

interface DieProps {
  sides: 6 | 20;
  value: number | null;
  /** Колір результату, лише коли кубик зупинився. */
  tone?: Tone;
  rolling: boolean;
}

function Die({ sides, value, tone, rolling }: DieProps) {
  const color = TONE_CLASS[rolling || !tone ? 'none' : tone];
  return (
    <div className="grid place-items-center py-2">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={value === null ? `Кубик d${sides}` : rolling ? 'Кубик крутиться' : `Випало ${value}`}
        className={`size-28 ${color} ${rolling ? 'die-rolling' : value !== null ? 'die-landed' : ''}`}
      >
        {sides === 20 ? <D20Shape /> : <D6Shape />}
        <text
          x="50"
          y={value === null ? 57 : 62}
          textAnchor="middle"
          fill="currentColor"
          className="font-display font-extrabold italic"
          fontSize={value === null ? 22 : 36}
        >
          {value ?? `d${sides}`}
        </text>
      </svg>
    </div>
  );
}

interface RollingDieProps {
  sides: 6 | 20;
  value: number | null;
  success?: boolean;
  /** Те, що показується, коли кубик зупинився: результат і кнопка далі. */
  children?: ReactNode;
}

/** Кубик з анімацією. Діти з'являються лише після зупинки, щоб результат не видавав себе завчасно. */
export function RollingDie({ sides, value, success, children }: RollingDieProps) {
  const { shown, rolling } = useRollReveal(value, sides);
  const tone = success === undefined ? undefined : success ? 'good' : 'bad';

  return (
    <>
      <Die sides={sides} value={shown} tone={tone} rolling={rolling} />
      {value !== null && !rolling && children}
    </>
  );
}
