import { useState } from 'react';
import { safetyRulesFor } from '@core/games/role-play/safety';
import type { RpAction, RpView } from '@core/games/role-play/types';
import { ROLE_LABEL, ROLE_TEXT_CLASS } from '@/shared/config/roles';
import { INTENSITY_CLASS, INTENSITY_LABEL } from '@/shared/config/intensity';
import type { Role } from '@core/roles';

type PlayingView = Extract<RpView, { mode: 'playing' }>;

interface RoleRevealProps {
  view: PlayingView;
  role: Role;
  onAction: (action: RpAction) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-1.5">
      <h3 className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">{title}</h3>
      {children}
    </section>
  );
}

/** Роль видно лише тому, кому вона дісталась. Спершу закрита, щоб поруч ніхто не підглянув. */
export function RoleReveal({ view, role, onAction }: RoleRevealProps) {
  const [opened, setOpened] = useState(false);
  const { role: card } = view;

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <span
          className={`w-fit rounded-blade border px-3 py-1 font-label text-xs font-semibold tracking-[0.14em] uppercase ${INTENSITY_CLASS[view.intensity]}`}
        >
          {INTENSITY_LABEL[view.intensity]}
        </span>
        <h1 className="font-display text-4xl leading-tight font-extrabold italic">{view.title}</h1>
        <p className="text-bone/60">Читай лише свою частину. Чужа не для твоїх очей.</p>
      </header>

      <div className="grid gap-4 border-t-4 border-crimson bg-wine p-5">
        <div className="grid gap-1">
          <p className={`font-label text-xs font-bold tracking-[0.22em] uppercase ${ROLE_TEXT_CLASS[role]}`}>
            {ROLE_LABEL[role]}
          </p>
          <p className="font-display text-3xl font-extrabold italic">{card.roleName}</p>
          <p className="text-sm text-bone/60">У партнера: {view.partnerRoleName}</p>
        </div>

        {!opened ? (
          <button
            type="button"
            onClick={() => setOpened(true)}
            className="rounded-blade bg-crimson px-5 py-3 font-label text-lg font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80"
          >
            Відкрити роль
          </button>
        ) : (
          <div className="grid gap-5">
            <Section title="Опис">
              <p className="whitespace-pre-line">{card.description}</p>
            </Section>

            {card.howToStart && (
              <Section title="Як почати">
                <p className="whitespace-pre-line">{card.howToStart}</p>
              </Section>
            )}

            {card.phrases.length > 0 && (
              <Section title="Приклади фраз">
                <ul className="grid list-disc gap-1 pl-5">
                  {card.phrases.map((phrase) => (
                    <li key={phrase}>{phrase}</li>
                  ))}
                </ul>
              </Section>
            )}

            {card.outfit && (
              <Section title="Екіпірування (за бажанням)">
                <p className="whitespace-pre-line">{card.outfit}</p>
              </Section>
            )}

            {card.guide && (
              <Section title="Твоя роль">
                <p className="whitespace-pre-line">{card.guide}</p>
              </Section>
            )}

            <aside className="grid gap-2 border-l-4 border-brass bg-ink p-4" aria-label="Правила безпеки">
              <h3 className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">
                Важливі правила безпеки
              </h3>
              <ul className="grid list-disc gap-1 pl-5 text-sm">
                {safetyRulesFor(view.intensity).map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </aside>

            <button
              type="button"
              onClick={() => setOpened(false)}
              className="rounded-blade border border-bone/60 px-5 py-2.5 font-label text-sm font-bold tracking-[0.16em] uppercase transition hover:bg-bone/10"
            >
              Сховати роль
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onAction({ type: 'back' })}
        className="w-fit font-label text-sm tracking-[0.16em] text-bone/70 uppercase hover:text-bone"
      >
        Інший сценарій
      </button>
    </div>
  );
}
