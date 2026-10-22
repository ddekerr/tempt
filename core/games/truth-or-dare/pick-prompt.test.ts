import { describe, expect, it } from 'vitest';
import { pickPrompt } from './pick-prompt';

describe('pickPrompt', () => {
  const pool = [1, 2, 3, 4];

  it('вибирає лише серед дозволених', () => {
    expect(
      pickPrompt(
        pool,
        (n) => n > 2,
        () => 0,
      ),
    ).toBe(3);
    expect(
      pickPrompt(
        pool,
        (n) => n > 2,
        () => 0.99,
      ),
    ).toBe(4);
  });

  it('повертає undefined, коли дозволених немає', () => {
    expect(
      pickPrompt(
        pool,
        () => false,
        () => 0.5,
      ),
    ).toBeUndefined();
  });

  it('не виходить за межі, навіть якщо random поверне 1', () => {
    expect(
      pickPrompt(
        pool,
        () => true,
        () => 1,
      ),
    ).toBe(4);
  });
});
