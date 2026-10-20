import { useEffect } from 'react';
import { useParams } from 'react-router';
import { RoleSchema } from '@core/roles';
import { useRoomStore } from '@/entities/room';
import { JoinForm } from '@/features/join-room';
import { GameBoard } from '@/widgets/game-board';
import { GameLobby } from '@/widgets/game-lobby';
import { GameMenu } from '@/widgets/game-menu';

export function PlayPage() {
  const parsed = RoleSchema.safeParse(useParams().role);
  const role = parsed.success ? parsed.data : null;

  const open = useRoomStore((state) => state.open);
  const close = useRoomStore((state) => state.close);
  const joined = useRoomStore((state) => state.joined);
  const view = useRoomStore((state) => state.view);

  useEffect(() => {
    if (!role) return;
    open(role);
    return close;
  }, [role, open, close]);

  let content;
  if (!role) content = <p className="text-rose">Невідома адреса. Скануй QR-код на комп'ютері.</p>;
  else if (!joined) content = <JoinForm role={role} />;
  else if (!view) content = <p className="text-bone/60">Завантажую…</p>;
  else if (!view.you.inGame) content = <GameMenu />;
  else if (view.playing) content = <GameBoard />;
  else content = <GameLobby />;

  return <main className="flex min-h-svh items-center justify-center px-4 py-10">{content}</main>;
}
