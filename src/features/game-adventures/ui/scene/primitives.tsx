import type { ReactNode } from 'react';

const BASE = 'rounded-blade px-5 py-3 font-label text-lg font-bold tracking-[0.16em] uppercase transition';

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} bg-crimson hover:bg-crimson/80 disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${BASE} border border-bone/60 text-base hover:bg-bone/10`}>
      {children}
    </button>
  );
}

/** Підказка для того, хто зараз не діє. */
export function Waiting({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="border-l-4 border-oxblood bg-ink px-4 py-3 text-bone/70">
      {children}
    </p>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">{children}</p>;
}
