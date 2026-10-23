import { HERO_CLOTHING_MAX, HERO_HP_MAX, type HeroView } from '@core/games/adventures/types';
import type { Role } from '@core/roles';
import { ROLE_BORDER_CLASS, ROLE_TEXT_CLASS } from '@/shared/config/roles';
import { HeartIcon } from './icons';

interface HeroTabProps {
  hero: HeroView;
  role: Role;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-bone/70">{label}</dt>
      <dd className="flex items-center gap-1">{children}</dd>
    </div>
  );
}

/** Герой цього телефона. Показники змінюються під час історій і зберігаються між іграми. */
export function HeroTab({ hero, role }: HeroTabProps) {
  return (
    <section className="grid gap-4">
      <h1 className="font-display text-4xl font-extrabold italic">Твій герой</h1>

      <div className="grid gap-5 border-t-4 border-crimson bg-wine p-5">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className={`grid size-14 shrink-0 place-items-center rounded-full border-2 bg-ink font-display text-2xl font-extrabold italic ${ROLE_BORDER_CLASS[role]} ${ROLE_TEXT_CLASS[role]}`}
          >
            {hero.name.charAt(0).toUpperCase()}
          </div>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="truncate font-display text-2xl font-extrabold italic">{hero.name}</p>
            <p className="text-sm text-bone/60">{hero.title}</p>
          </div>
          <span className="rounded-blade border border-brass px-2.5 py-1 font-label text-xs font-semibold tracking-[0.14em] text-brass uppercase">
            Рів. {hero.level}
          </span>
        </div>

        <dl className="grid gap-3">
          <Stat label="Життя">
            <span className="sr-only">
              {hero.hp} з {HERO_HP_MAX}
            </span>
            {Array.from({ length: HERO_HP_MAX }, (_, index) => (
              <HeartIcon key={index} filled={index < hero.hp} />
            ))}
          </Stat>
          <Stat label="Одяг">
            <span className="sr-only">
              {hero.clothing} з {HERO_CLOTHING_MAX}
            </span>
            {Array.from({ length: HERO_CLOTHING_MAX }, (_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`h-1.5 w-5 ${index < hero.clothing ? 'bg-brass' : 'bg-oxblood'}`}
              />
            ))}
          </Stat>
        </dl>
      </div>

      <p className="text-sm text-bone/60">Це твій герой, партнер бачить лише свого.</p>
    </section>
  );
}
