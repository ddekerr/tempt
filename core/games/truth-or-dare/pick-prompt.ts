/** Випадковий запис із пулу серед тих, що пройшли фільтр. `random` повертає число з [0, 1). */
export function pickPrompt<T>(pool: T[], allowed: (item: T) => boolean, random: () => number): T | undefined {
  const candidates = pool.filter(allowed);
  if (candidates.length === 0) return undefined;
  return candidates[Math.min(Math.floor(random() * candidates.length), candidates.length - 1)];
}
