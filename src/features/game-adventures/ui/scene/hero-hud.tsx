import { HERO_CLOTHING_MAX, HERO_HP_MAX, type HeroView } from '@core/games/adventures/types';
import type { Role } from '@core/roles';
import { ROLE_BORDER_CLASS, ROLE_TEXT_CLASS } from '@/shared/config/roles';
import { HeartIcon } from '../icons';

function HeroCard({ hero, role, you }: { hero: HeroView; role: Role; you: boolean }) {
  return (
    <div className={`grid min-w-0 gap-2 border-t-2 bg-wine px-3 py-2.5 ${ROLE_BORDER_CLASS[role]}`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`truncate font-display text-lg font-extrabold italic ${ROLE_TEXT_CLASS[role]}`}>
          {hero.name}
          {you && <span className="sr-only"> (ти)</span>}
        </p>
        <span className="font-label text-xs font-semibold tracking-[0.14em] text-brass uppercase">
          Рів. {hero.level}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <span className="sr-only">
          Життя {hero.hp} з {HERO_HP_MAX}
        </span>
        {Array.from({ length: HERO_HP_MAX }, (_, index) => (
          <HeartIcon key={index} filled={index < hero.hp} size={16} />
        ))}
      </div>
      <div className="flex gap-1">
        <span className="sr-only">
          Одяг {hero.clothing} з {HERO_CLOTHING_MAX}
        </span>
        {Array.from({ length: HERO_CLOTHING_MAX }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`h-1.5 flex-1 ${index < hero.clothing ? 'bg-brass' : 'bg-oxblood'}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Обидва герої завжди на екрані: його ліворуч, її праворуч, незалежно від телефона. */
export function HeroHud({ hero, partner, role }: { hero: HeroView; partner: HeroView; role: Role }) {
  const male = role === 'male' ? hero : partner;
  const female = role === 'male' ? partner : hero;
  return (
    <div className="grid grid-cols-2 gap-2">
      <HeroCard hero={male} role="male" you={role === 'male'} />
      <HeroCard hero={female} role="female" you={role === 'female'} />
    </div>
  );
}
