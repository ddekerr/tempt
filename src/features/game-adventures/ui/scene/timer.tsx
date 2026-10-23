import { useEffect, useState } from 'react';

const format = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Таймер для завдання. Це лише підказка: ніщо не блокується, коли час вийшов. */
export function Timer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setLeft(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <div className="flex items-center justify-between gap-4 border border-oxblood bg-ink px-4 py-3">
      <span aria-live="off" className="font-label text-3xl font-bold tracking-[0.12em] tabular-nums">
        {format(left)}
      </span>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          className="font-label text-sm font-semibold tracking-[0.16em] text-brass uppercase hover:text-rose"
        >
          {running ? 'Пауза' : left === seconds ? 'Старт' : 'Далі'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setLeft(seconds);
          }}
          className="font-label text-sm font-semibold tracking-[0.16em] text-bone/60 uppercase hover:text-bone"
        >
          Скинути
        </button>
      </div>
    </div>
  );
}
