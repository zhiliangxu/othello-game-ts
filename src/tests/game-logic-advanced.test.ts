import { describe, it, expect } from 'vitest';
import { Game } from '../utils/game';

describe('Game logic - flips and counts', () => {
  it('black move at (2,3) flips (3,3)', () => {
    const g = new Game();
    // (row=2, col=3) is a standard legal move from the initial position
    expect(g.isLegal(2,3)).toBe(true);
    g.place(2,3);
    const counts = g.counts();
    expect(counts.black).toBe(4);
    expect(counts.white).toBe(1);
  });
});
