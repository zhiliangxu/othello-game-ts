import { describe, it, expect } from 'vitest';
import { Game } from '../utils/game';
import { AStarAI } from '../utils/ai';

describe('AStarAI', () => {
  it('chooses a legal move on initial position', () => {
    const g = new Game();
    const ai = new AStarAI('medium');
    const move = ai.chooseMove(g);
    expect(move).not.toBeNull();
    if (move) {
      expect(g.isLegal(move.row, move.col)).toBe(true);
    }
  });
});
