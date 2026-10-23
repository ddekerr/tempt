import type { StorySummary } from '@core/games/adventures/types';
import { StoryCard } from './story-card';

export function StoriesTab({ stories }: { stories: StorySummary[] }) {
  return (
    <section className="grid gap-4">
      <h1 className="font-display text-4xl font-extrabold italic">Історії</h1>
      {stories.length === 0 ? (
        <p className="text-bone/60">Історій поки немає. Вони з'являться тут, щойно їх буде додано.</p>
      ) : (
        <ul className="grid gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </ul>
      )}
    </section>
  );
}
