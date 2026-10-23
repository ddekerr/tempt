import { useState } from 'react';
import type { AdvAction, AdvView } from '@core/games/adventures/types';
import type { Role } from '@core/roles';
import { useRoomStore } from '@/entities/room';
import { AdventuresNav, type AdventureTab } from './adventures-nav';
import { HeroTab } from './hero-tab';
import { SceneScreen } from './scene/scene-screen';
import { StoriesTab } from './stories-tab';
import { TreasuryTab } from './treasury-tab';

interface AdventuresScreenProps {
  view: AdvView;
  role: Role;
  send: (action: AdvAction) => void;
}

/** Екран «Пригод» без мережі: усе приходить через пропси, тому його можна показати й без кімнати (див. превʼю). */
export function AdventuresScreen({ view, role, send }: AdventuresScreenProps) {
  const [tab, setTab] = useState<AdventureTab>('stories');

  if (view.scene) return <SceneScreen view={view} scene={view.scene} role={role} send={send} />;

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <p className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">Пригоди</p>
        <AdventuresNav active={tab} onChange={setTab} />
      </header>

      {tab === 'stories' && (
        <StoriesTab
          stories={view.stories}
          onStart={(storyId, fromStart) => send({ type: 'start', storyId, fromStart })}
        />
      )}
      {tab === 'hero' && <HeroTab hero={view.hero} role={role} />}
      {tab === 'treasury' && <TreasuryTab items={view.treasury} />}
    </div>
  );
}

/** Підключений до кімнати екран: бере вигляд і роль зі стору, а дії шле на сервер. */
export function AdventuresGame() {
  const game = useRoomStore((state) => state.game);
  const role = useRoomStore((state) => state.role);
  const sendGameAction = useRoomStore((state) => state.sendGameAction);

  if (game?.gameId !== 'adventures' || !role) return <p className="text-bone/60">Завантажую…</p>;
  return <AdventuresScreen view={game.view as AdvView} role={role} send={(action) => sendGameAction(action)} />;
}
