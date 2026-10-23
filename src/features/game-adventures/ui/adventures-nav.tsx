import type { ReactNode } from 'react';
import { HeroIcon, StoriesIcon, TreasuryIcon } from './icons';

export type AdventureTab = 'stories' | 'hero' | 'treasury';

const TABS: { id: AdventureTab; label: string; icon: ReactNode }[] = [
  { id: 'stories', label: 'Історії', icon: <StoriesIcon /> },
  { id: 'hero', label: 'Герої', icon: <HeroIcon /> },
  { id: 'treasury', label: 'Скарбниця', icon: <TreasuryIcon /> },
];

interface AdventuresNavProps {
  active: AdventureTab;
  onChange: (tab: AdventureTab) => void;
}

/** Меню гри завжди на екрані: тут збирається все спільне для всіх історій. */
export function AdventuresNav({ active, onChange }: AdventuresNavProps) {
  return (
    <nav role="tablist" aria-label="Пригоди" className="grid grid-cols-3 gap-1 border-b border-oxblood">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className="-mb-px grid justify-items-center gap-1 border-b-2 border-transparent px-2 py-3 font-label text-xs font-semibold tracking-[0.16em] text-bone/50 uppercase transition hover:text-bone aria-selected:border-crimson aria-selected:text-bone"
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
