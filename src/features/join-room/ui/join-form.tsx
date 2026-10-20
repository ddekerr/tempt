import { useState, type FormEvent } from 'react';
import type { Role } from '@core/roles';
import { loadSession, useRoomStore } from '@/entities/room';
import { ROLE_BORDER_CLASS, ROLE_LABEL, ROLE_TEXT_CLASS } from '@/shared/config/roles';

/** Вхід у свій слот: роль уже відома з адреси, лишається ввести ім'я. */
export function JoinForm({ role }: { role: Role }) {
  const join = useRoomStore((state) => state.join);
  const error = useRoomStore((state) => state.error);
  const connection = useRoomStore((state) => state.connection);

  const [name, setName] = useState(() => loadSession(role).name ?? '');
  const canJoin = name.trim().length > 0 && connection === 'open';

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canJoin) join(name.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm gap-6">
      <div className="grid gap-2">
        <p className={`font-label text-sm tracking-[0.22em] uppercase ${ROLE_TEXT_CLASS[role]}`}>{ROLE_LABEL[role]}</p>
        <h1 className="font-display text-5xl font-extrabold italic">Як тебе звати?</h1>
      </div>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={32}
        autoComplete="given-name"
        aria-label="Ім'я"
        placeholder="Твоє ім'я"
        className={`w-full rounded-blade border bg-wine px-4 py-3 text-lg text-bone placeholder:text-bone/40 focus:outline-none ${ROLE_BORDER_CLASS[role]}`}
      />

      <button
        type="submit"
        disabled={!canJoin}
        className="rounded-blade bg-crimson px-6 py-3 font-label text-lg font-bold tracking-[0.16em] uppercase transition hover:bg-crimson/80 disabled:opacity-40"
      >
        {connection === 'open' ? 'Увійти' : 'Підключаюсь…'}
      </button>

      {error && (
        <p role="alert" className="text-rose">
          {error}
        </p>
      )}
    </form>
  );
}
