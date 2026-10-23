import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { adventuresModule } from '@core/games/adventures/module';
import { makeCtx } from '@core/games/adventures/memory-ctx';
import type { AdvAction, AdvState } from '@core/games/adventures/types';
import { isGameError } from '@core/game';
import type { Role } from '@core/roles';
import { AdventuresScreen } from '@/features/game-adventures';

const PLAYERS = { male: { name: 'Дмитро' }, female: { name: 'Катя' } };

type Dice = 'random' | 'low' | 'high';

const DICE_LABEL: Record<Dice, string> = {
  random: 'Випадково',
  low: 'Завжди найменше (провал)',
  high: 'Завжди найбільше (успіх)',
};

function createSession(dice: { current: Dice }) {
  const ctx = makeCtx({
    random: () => (dice.current === 'low' ? 0 : dice.current === 'high' ? 0.999 : Math.random()),
  });
  return { ctx, state: adventuresModule.init(PLAYERS, ctx) };
}

/**
 * Превʼю «Пригод» на комп'ютері: два «телефони» поруч, без сервера й QR-кодів.
 * Усе живе в пам'яті сторінки: прогрес не зберігається, після перезавантаження починається заново.
 */
export function PreviewPage() {
  const dice = useRef<Dice>('random');
  const [diceMode, setDiceMode] = useState<Dice>('random');
  const [session, setSession] = useState(() => createSession(dice));
  const [error, setError] = useState<string | null>(null);

  const send = (role: Role, action: AdvAction) => {
    const next = adventuresModule.reduce(session.state, action, role, session.ctx);
    if (isGameError(next)) {
      setError(next.error);
      return;
    }
    setError(null);
    setSession((current) => ({ ...current, state: next as AdvState }));
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="font-label text-sm tracking-[0.22em] text-brass uppercase hover:text-rose">
        ← Tempt
      </Link>
      <h1 className="mt-4 font-display text-4xl font-extrabold italic">Превʼю · Пригоди</h1>
      <p className="mt-1 text-bone/60">Два телефони на одному екрані. Нічого не зберігається у базу.</p>

      <div className="mt-5 flex flex-wrap items-end gap-4 border border-oxblood bg-wine p-4">
        <label className="grid gap-1">
          <span className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">Кубики</span>
          <select
            value={diceMode}
            onChange={(event) => {
              const value = event.target.value as Dice;
              dice.current = value;
              setDiceMode(value);
            }}
            className="rounded-blade border border-oxblood bg-ink px-3 py-2"
          >
            {(Object.keys(DICE_LABEL) as Dice[]).map((mode) => (
              <option key={mode} value={mode}>
                {DICE_LABEL[mode]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setSession(createSession(dice));
          }}
          className="rounded-blade border border-bone/60 px-4 py-2 font-label text-sm font-bold tracking-[0.16em] uppercase hover:bg-bone/10"
        >
          Почати з нуля
        </button>
        {error && (
          <p role="alert" className="text-rose">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {(['male', 'female'] as const).map((role) => (
          <section key={role} className="grid gap-2">
            <h2
              className={`font-label text-sm font-semibold tracking-[0.22em] uppercase ${role === 'male' ? 'text-brass' : 'text-rose'}`}
            >
              {role === 'male' ? 'Він' : 'Вона'} · {PLAYERS[role].name}
            </h2>
            <div className="mx-auto h-[780px] w-full max-w-[390px] overflow-y-auto rounded-[2rem] border-4 border-oxblood bg-ink p-4">
              <AdventuresScreen
                view={adventuresModule.viewFor(session.state, role)}
                role={role}
                send={(action) => send(role, action)}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
