import type { StoryStatus, StorySummary } from '@core/games/adventures/types';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const roman = (n: number) => ROMAN[n - 1] ?? String(n);

const STATUS_LABEL: Record<StoryStatus, string> = {
  locked: 'Закрито',
  new: 'Нова',
  started: 'Почато',
  done: 'Пройдено',
};

const STATUS_CLASS: Record<StoryStatus, string> = {
  locked: 'border-oxblood text-bone/50',
  new: 'border-brass text-brass',
  started: 'border-crimson bg-crimson/25 text-bone',
  done: 'border-rose text-rose',
};

interface StoryCardProps {
  story: StorySummary;
  onStart: (storyId: string, fromStart: boolean) => void;
}

const BUTTON = 'rounded-blade px-5 py-2.5 font-label text-base font-bold tracking-[0.16em] uppercase transition';

export function StoryCard({ story, onStart }: StoryCardProps) {
  const locked = story.status === 'locked';
  const progress = story.status === 'done' ? 100 : Math.round((story.chapter / story.chapters) * 100);

  return (
    <li className={`grid gap-3 border-l-4 bg-wine p-5 ${locked ? 'border-oxblood opacity-60' : 'border-crimson'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-label text-xs font-semibold tracking-[0.22em] text-brass uppercase">
          Пригода {roman(story.order)}
        </p>
        <span
          className={`rounded-blade border px-2.5 py-1 font-label text-xs font-semibold tracking-[0.14em] uppercase ${STATUS_CLASS[story.status]}`}
        >
          {STATUS_LABEL[story.status]}
        </span>
      </div>

      <h2 className="font-display text-2xl leading-snug font-extrabold italic">{story.title}</h2>
      <p className="text-bone/70">{story.description}</p>

      {(story.status === 'started' || story.status === 'done') && (
        <div className="grid gap-1.5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={story.chapters}
            aria-valuenow={story.status === 'done' ? story.chapters : story.chapter}
            className="h-1.5 bg-ink"
          >
            <div className="h-full bg-brass" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-bone/60">
            Глава {story.chapter} з {story.chapters}
          </p>
        </div>
      )}

      {locked && <p className="text-sm text-bone/60">Спершу пройдіть попередню.</p>}

      {!locked && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => onStart(story.id, false)}
            className={`${BUTTON} bg-crimson hover:bg-crimson/80`}
          >
            {story.status === 'new' ? 'Почати' : story.status === 'started' ? 'Продовжити історію' : 'Пройти ще раз'}
          </button>
          {story.status === 'started' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Почати історію з першої глави? Герої отримають повні життя й одяг.')) {
                  onStart(story.id, true);
                }
              }}
              className="font-label text-sm font-semibold tracking-[0.16em] text-bone/60 uppercase hover:text-bone"
            >
              Почати заново
            </button>
          )}
        </div>
      )}
    </li>
  );
}
