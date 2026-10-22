import type { TodAction } from '@core/games/truth-or-dare/types';

const BUTTONS: { label: string; action: TodAction; className: string; icon: string }[] = [
  {
    label: 'Правда',
    action: { type: 'choose', kind: 'truth' },
    className: 'bg-crimson hover:bg-crimson/80',
    icon: '→',
  },
  {
    label: 'Дія',
    action: { type: 'choose', kind: 'dare' },
    className: 'border border-rose bg-oxblood hover:bg-oxblood/70',
    icon: '→',
  },
  {
    label: 'Випадково',
    action: { type: 'choose', kind: 'random' },
    className: 'border border-bone/60 hover:bg-bone/10',
    icon: '⟲',
  },
];

/** Екран гравця, чия черга: правда, дія чи випадково. */
export function ChooseKind({ onAction }: { onAction: (action: TodAction) => void }) {
  return (
    <div className="grid gap-3">
      {BUTTONS.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={() => onAction(button.action)}
          className={`flex items-center justify-between rounded-blade px-5 py-4 text-left font-label text-xl font-bold tracking-[0.16em] uppercase transition hover:translate-x-1 ${button.className}`}
        >
          {button.label}
          <span aria-hidden="true">{button.icon}</span>
        </button>
      ))}
    </div>
  );
}
