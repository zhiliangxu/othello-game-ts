export type Player = 'black' | 'white';
export type Cell = Player | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Move { row: number; col: number; }
export interface Coord { row: number; col: number }

const DIRS = [
  [-1,-1],[-1,0],[-1,1],
  [0,-1],        [0,1],
  [1,-1],[1,0],[1,1]
] as const;

export class Game {
  board: Cell[][];
  currentPlayer: Player;
  size = 8;
  lastFlipped: Coord[] = [];

  constructor(board?: Cell[][], currentPlayer: Player = 'black') {
    this.board = board ? cloneBoard(board) : initialBoard();
    this.currentPlayer = currentPlayer;
  }

  clone() {
    const g = new Game(cloneBoard(this.board), this.currentPlayer);
    g.lastFlipped = this.lastFlipped.slice();
    return g;
  }

  inBounds(r: number, c: number) { return r>=0 && r<this.size && c>=0 && c<this.size; }

  isLegal(r: number, c: number): boolean {
    if (!this.inBounds(r,c) || this.board[r][c] !== null) return false;
    const opp: Player = this.currentPlayer === 'black' ? 'white' : 'black';
    for (const [dr, dc] of DIRS) {
      let i=r+dr, j=c+dc, seenOpp=false;
      while (this.inBounds(i,j) && this.board[i][j] === opp) {
        i+=dr; j+=dc; seenOpp = true;
      }
      if (seenOpp && this.inBounds(i,j) && this.board[i][j] === this.currentPlayer) return true;
    }
    return false;
  }

  legalMoves(): Move[] {
    const moves: Move[] = [];
    for (let r=0;r<this.size;r++)
      for (let c=0;c<this.size;c++)
        if (this.isLegal(r,c)) moves.push({row:r,col:c});
    return moves;
  }

  place(r: number, c: number): boolean {
    if (!this.isLegal(r,c)) return false;
    const opp: Player = this.currentPlayer === 'black' ? 'white' : 'black';
    const flipped: Coord[] = [{row:r,col:c}];
    this.board[r][c] = this.currentPlayer;
    for (const [dr, dc] of DIRS) {
      const toFlip: [number, number][] = [];
      let i=r+dr, j=c+dc;
      while (this.inBounds(i,j) && this.board[i][j] === opp) { toFlip.push([i,j]); i+=dr; j+=dc; }
      if (toFlip.length && this.inBounds(i,j) && this.board[i][j] === this.currentPlayer) {
        for (const [fr,fc] of toFlip) { this.board[fr][fc] = this.currentPlayer; flipped.push({row:fr,col:fc}); }
      }
    }
    this.lastFlipped = flipped;
    this.advanceTurn();
    return true;
  }

  advanceTurn() {
    const next: Player = this.currentPlayer === 'black' ? 'white' : 'black';
    const gNext = new Game(this.board, next);
    if (gNext.legalMoves().length === 0) {
      // Opponent passes; check if current also has no moves -> game over
      const gCurr = new Game(this.board, this.currentPlayer);
      if (gCurr.legalMoves().length === 0) {
        return; // game over condition handled by isOver
      }
      // keep turn with current player (pass)
      return;
    }
    this.currentPlayer = next;
  }

  isOver(): boolean {
    const g1 = new Game(this.board, this.currentPlayer);
    const g2 = new Game(this.board, this.currentPlayer === 'black' ? 'white' : 'black');
    return g1.legalMoves().length === 0 && g2.legalMoves().length === 0;
  }

  counts() {
    let black=0, white=0;
    for (const row of this.board) for (const cell of row) {
      if (cell==='black') black++; else if (cell==='white') white++;
    }
    return { black, white };
  }

  winner(): Player | null {
    const {black, white} = this.counts();
    if (black>white) return 'black';
    if (white>black) return 'white';
    return null;
  }
}

export function initialBoard(): Cell[][] {
  const b: Cell[][] = Array.from({length:8}, ()=>Array<Cell>(8).fill(null));
  b[3][3] = 'white';
  b[3][4] = 'black';
  b[4][3] = 'black';
  b[4][4] = 'white';
  return b;
}

export function cloneBoard(b: Cell[][]): Cell[][] {
  return b.map(row => row.slice());
}
