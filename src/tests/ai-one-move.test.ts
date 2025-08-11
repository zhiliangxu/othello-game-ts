import { describe, it, expect } from 'vitest';
import { Game, Cell } from '../utils/game';
import { AStarAI } from '../utils/ai';

describe('AStarAI - one legal move left', () => {
  it('returns the only legal move without stalling', () => {
    const empty: Cell[][] = Array.from({ length: 8 }, () => Array<Cell>(8).fill(null));
    const g = new Game(empty, 'white');
    // Construct a simple horizontal sandwich for WHITE at (3,4): W B B _
    g.board[3][1] = 'white';
    g.board[3][2] = 'black';
    g.board[3][3] = 'black';

    const moves = g.legalMoves();
    expect(moves).toEqual([{ row: 3, col: 4 }]);

    const ai = new AStarAI('hard');
    const m = ai.chooseMove(g);
    expect(m).toEqual({ row: 3, col: 4 });
  });
});
