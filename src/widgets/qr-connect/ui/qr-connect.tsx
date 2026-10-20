import { useEffect, useState } from 'react';
import type { HostQr, HostStatus } from '@core/host';
import { ROLES, type Role } from '@core/roles';
import type { SlotStatus } from '@core/room';
import { errorMessage, http } from '@/shared/api';
import { ROLE_BORDER_CLASS, ROLE_LABEL, ROLE_TEXT_CLASS } from '@/shared/config/roles';

const POLL_MS = 1500;

function describe(slot: SlotStatus): string {
  if (!slot) return 'Чекаємо';
  if (!slot.connected) return `Відключено: ${slot.name}`;
  return slot.inGame ? `У грі: ${slot.name}` : `Підключено: ${slot.name}`;
}

/** Два QR-коди для телефонів зі статусом кожного слота й кнопкою «Скинути». */
export function QrConnect() {
  const [qr, setQr] = useState<HostQr | null>(null);
  const [status, setStatus] = useState<HostStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    http<HostQr>('/api/host/qr')
      .then(setQr)
      .catch((loadError: unknown) => setError(errorMessage(loadError)));
  }, []);

  useEffect(() => {
    let active = true;
    const poll = () =>
      http<HostStatus>('/api/host/status')
        .then((next) => {
          if (active) setStatus(next);
        })
        .catch(() => undefined);

    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function reset(role: Role) {
    try {
      await http<void>(`/api/host/reset/${role}`, { method: 'POST' });
    } catch (resetError) {
      setError(errorMessage(resetError));
    }
  }

  if (error)
    return (
      <p role="alert" className="text-rose">
        {error}
      </p>
    );
  if (!qr) return <p className="text-bone/60">Готую коди…</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {ROLES.map((role) => {
        const slot = status?.[role] ?? null;
        return (
          <section key={role} className={`grid gap-4 border-t-4 bg-wine p-5 ${ROLE_BORDER_CLASS[role]}`}>
            <h2 className={`font-label text-2xl font-bold tracking-[0.1em] uppercase ${ROLE_TEXT_CLASS[role]}`}>
              {ROLE_LABEL[role]}
            </h2>
            <img src={qr[role].qr} alt={`QR-код: ${ROLE_LABEL[role].toLowerCase()}`} className="w-full max-w-xs" />
            <p className="font-mono text-sm break-all text-bone/70">{qr[role].url}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={slot?.connected ? 'text-bone' : 'text-bone/60'}>{describe(slot)}</span>
              {slot && (
                <button
                  type="button"
                  onClick={() => void reset(role)}
                  className="font-label text-xs font-semibold tracking-[0.16em] text-bone/70 uppercase hover:text-bone"
                >
                  Скинути
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
