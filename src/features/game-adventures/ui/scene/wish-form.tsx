import { useState } from 'react';
import { WISH_MAX_LENGTH } from '@core/games/adventures/types';
import { PrimaryButton } from './primitives';

/** Те, що переможець загадує. Бажання потрапляє у скарбницю й чекає свого часу. */
export function WishForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  const trimmed = text.trim();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <label className="grid gap-1.5">
        <span className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">Твоє бажання</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={WISH_MAX_LENGTH}
          rows={4}
          placeholder="Чого ти хочеш від партнера? Воно збережеться у скарбниці."
          className="rounded-blade border border-oxblood bg-ink p-3 text-bone placeholder:text-bone/40 focus:border-crimson focus:outline-none"
        />
      </label>
      <PrimaryButton onClick={() => trimmed && onSubmit(trimmed)} disabled={!trimmed}>
        Загадати
      </PrimaryButton>
    </form>
  );
}
