import type { TreasureItem, TreasureKind } from '@core/games/adventures/types';

const KIND_LABEL: Record<TreasureKind, string> = { item: 'Предмети' };

export function TreasuryTab({ items }: { items: TreasureItem[] }) {
  const kinds = (Object.keys(KIND_LABEL) as TreasureKind[]).filter((kind) => items.some((item) => item.kind === kind));

  return (
    <section className="grid gap-4">
      <h1 className="font-display text-4xl font-extrabold italic">Скарбниця</h1>

      {items.length === 0 ? (
        <p className="text-bone/60">Скарбниця порожня. Предмети з'являтимуться тут під час пригод.</p>
      ) : (
        kinds.map((kind) => (
          <div key={kind} className="grid gap-3">
            <h2 className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">
              {KIND_LABEL[kind]}
            </h2>
            <ul className="grid grid-cols-3 gap-3">
              {items
                .filter((item) => item.kind === kind)
                .map((item) => (
                  <li
                    key={item.id}
                    className="grid justify-items-center gap-2 border-l-4 border-crimson bg-wine p-3 text-center"
                  >
                    <span aria-hidden="true" className="text-3xl">
                      {item.icon}
                    </span>
                    <span className="text-sm leading-snug">{item.name}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
