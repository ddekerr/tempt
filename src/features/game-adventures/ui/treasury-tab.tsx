import type { TreasureItem, TreasureKind } from '@core/games/adventures/types';

const KIND_LABEL: Record<TreasureKind, string> = { item: 'Предмети', wish: 'Бажання' };

function Item({ item }: { item: TreasureItem }) {
  return (
    <li className="grid justify-items-center gap-1.5 border-l-4 border-crimson bg-wine p-3 text-center">
      <span aria-hidden="true" className="text-3xl">
        {item.icon}
      </span>
      <span className="text-sm leading-snug">{item.name}</span>
      {item.effect && <span className="text-xs text-brass">Одноразовий</span>}
    </li>
  );
}

/** Бажання розгортається: його читають, коли настає час. */
function Wish({ item }: { item: TreasureItem }) {
  return (
    <li className="border-l-4 border-rose bg-wine">
      <details className="group p-4">
        <summary className="flex cursor-pointer items-center gap-3 marker:content-none">
          <span aria-hidden="true" className="text-2xl">
            {item.icon}
          </span>
          <span className="grid flex-1 gap-0.5">
            <span className="font-display text-lg font-extrabold italic">{item.name}</span>
            <span className="text-xs text-bone/60">Чекає свого часу</span>
          </span>
          <span aria-hidden="true" className="text-brass transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <p className="mt-3 border-t border-oxblood pt-3 whitespace-pre-line">{item.description}</p>
      </details>
    </li>
  );
}

export function TreasuryTab({ items }: { items: TreasureItem[] }) {
  const kinds = (Object.keys(KIND_LABEL) as TreasureKind[]).filter((kind) => items.some((item) => item.kind === kind));

  return (
    <section className="grid gap-4">
      <h1 className="font-display text-4xl font-extrabold italic">Скарбниця</h1>

      {items.length === 0 ? (
        <p className="text-bone/60">Скарбниця порожня. Предмети й бажання з'являтимуться тут під час пригод.</p>
      ) : (
        kinds.map((kind) => {
          const ofKind = items.filter((item) => item.kind === kind);
          return (
            <div key={kind} className="grid gap-3">
              <h2 className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">
                {KIND_LABEL[kind]} · {ofKind.length}
              </h2>
              {kind === 'wish' ? (
                <ul className="grid gap-3">
                  {ofKind.map((item) => (
                    <Wish key={item.id} item={item} />
                  ))}
                </ul>
              ) : (
                <ul className="grid grid-cols-3 gap-3">
                  {ofKind.map((item) => (
                    <Item key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
