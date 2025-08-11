import { Difficulty, Game, Move, Player } from './game';

// Positional table (piece-square) – corners strong, X-squares weak, edges moderate
const PSQ: number[][] = [
  [100,-20, 10,  5,  5, 10,-20,100],
  [-20,-50, -2, -2, -2, -2,-50,-20],
  [ 10, -2,  0,  0,  0,  0, -2, 10],
  [  5, -2,  0,  0,  0,  0, -2,  5],
  [  5, -2,  0,  0,  0,  0, -2,  5],
  [ 10, -2,  0,  0,  0,  0, -2, 10],
  [-20,-50, -2, -2, -2, -2,-50,-20],
  [100,-20, 10,  5,  5, 10,-20,100],
];

type AIConfig = {
  depth: number;
  maxNodes: number;
  maxMs: number;
  mobilityW: number;
  discW: number;
  cornerW: number;
  positionW: number; // multiplier for PSQ/10
  frontierW: number; // opponent frontier - my frontier (higher better)
  stableW: number;   // stability estimate from corners
  endgameN: number;  // when empties <= N, switch to exact endgame search
  noise?: number; // randomization range for easy
};

function evaluateWith(game: Game, player: Player, cfg: AIConfig): number {
  const opp: Player = player === 'black' ? 'white' : 'black';
  const myMoves = game.legalMoves().length;
  const oppMoves = new Game(game.board, opp).legalMoves().length;
  const mobility = myMoves - oppMoves;
  const { black, white } = game.counts();
  const discDiff = (player === 'black' ? black - white : white - black);
  const corners = [game.board[0][0], game.board[0][7], game.board[7][0], game.board[7][7]];
  let myCorners=0, oppCorners=0;
  for (const c of corners) { if (c === player) myCorners++; else if (c === opp) oppCorners++; }
  const cornerDiff = myCorners - oppCorners;
  // PSQ
  let psq = 0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const cell = game.board[r][c];
    if (cell === player) psq += PSQ[r][c]; else if (cell === opp) psq -= PSQ[r][c];
  }
  // Frontier (fewer frontier discs is better)
  const frontierDiffVal = frontierDiff(game, player);
  // Stability (approximate from corners along edges)
  const stableDiffVal = cornerStabilityApprox(game, player);

  return cfg.mobilityW*mobility
       + cfg.discW*discDiff
       + cfg.cornerW*cornerDiff
       + cfg.positionW*(psq/10)
       + cfg.frontierW*frontierDiffVal
       + cfg.stableW*stableDiffVal;
}

function frontierDiff(game: Game, player: Player): number {
  const opp: Player = player === 'black' ? 'white' : 'black';
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] as const;
  let myF=0, oppF=0;
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const cell = game.board[r][c];
    if (cell === null) continue;
    let isFrontier = false;
    for (const [dr,dc] of dirs) {
      const nr=r+dr, nc=c+dc;
      if (nr>=0 && nr<8 && nc>=0 && nc<8 && game.board[nr][nc]===null) { isFrontier=true; break; }
    }
    if (isFrontier) {
      if (cell===player) myF++; else if (cell===opp) oppF++;
    }
  }
  return oppF - myF;
}

function cornerStabilityApprox(game: Game, player: Player): number {
  const opp: Player = player === 'black' ? 'white' : 'black';
  let diff = 0;
  // For each corner owned, count contiguous same-color discs along adjacent row/col
  const scan = (sr: number, sc: number, dr: number, dc: number, color: Player) => {
    let n=0; let r=sr+dr, c=sc+dc;
    while (r>=0 && r<8 && c>=0 && c<8 && game.board[r][c]===color) { n++; r+=dr; c+=dc; }
    return n;
  };
  const corners: Array<[number,number]> = [[0,0],[0,7],[7,0],[7,7]];
  for (const [r,c] of corners) {
    const owner = game.board[r][c];
    if (owner===player) {
      diff += scan(r,c, 0,1, player) + scan(r,c, 1,0, player);
    } else if (owner===opp) {
      diff -= scan(r,c, 0,1, opp) + scan(r,c, 1,0, opp);
    }
  }
  return diff/4; // scale down a bit
}

export class AStarAI {
  private cfg: AIConfig;
  constructor(difficulty: Difficulty) {
    this.cfg = ((): AIConfig => {
      switch (difficulty) {
        case 'easy':
          return { depth: 2, maxNodes: 2000, maxMs: 60, mobilityW: 2, discW: 1, cornerW: 15, positionW: 0.5, frontierW: 0.5, stableW: 0.5, endgameN: 0, noise: 0.6 };
        case 'medium':
          return { depth: 5, maxNodes: 20000, maxMs: 220, mobilityW: 3, discW: 1, cornerW: 25, positionW: 2, frontierW: 1.5, stableW: 1.5, endgameN: 8 };
        case 'hard':
        default:
          return { depth: 8, maxNodes: 200000, maxMs: 900, mobilityW: 4, discW: 1, cornerW: 45, positionW: 7, frontierW: 3, stableW: 4, endgameN: 12 };
      }
    })();
  }

  chooseMove(game: Game): Move | null {
    // Best-first A* style search: expand nodes in order of f = g - h (we minimize cost)
    const player = game.currentPlayer;
    const rootMoves = game.legalMoves();
    if (rootMoves.length === 0) return null;
  if (rootMoves.length === 1) return rootMoves[0];

    // Endgame exact solver when few empties remain
    const empties = countEmpty(game);
    if (empties <= this.cfg.endgameN) {
      let best: {move: Move; score: number} | null = null;
      const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      for (const m of rootMoves) {
        const g1 = game.clone();
        g1.place(m.row, m.col);
        const s = -negamaxEndgame(g1, this.opponent(player), player, -Infinity, Infinity, start, this.cfg.maxMs);
        if (!best || s > best.score) best = { move: m, score: s };
      }
      return best ? best.move : rootMoves[0];
    }

    type Node = {
      game: Game;
      depth: number;
      toMove: Player;
      rootMove: Move; // which move from the root led here
      g: number; // path cost from root, negative for maximizing player advantage
      h: number; // heuristic estimate to go (negated for cost form)
      f: number; // total cost = g + h (lower is better)
    };

  const pq: Node[] = [];
    const push = (n: Node) => { pq.push(n); pq.sort((a,b)=>a.f-b.f); };
    const pop = (): Node | undefined => pq.shift();

    // seed frontier with one-ply children
    for (const m of rootMoves) {
      const g1 = game.clone();
      g1.place(m.row, m.col);
      let h = -evaluateWith(g1, player, this.cfg); // cost form (lower better)
      if (this.cfg.noise) {
        const jitter = (Math.random()*2 - 1) * this.cfg.noise; // [-noise, +noise]
        h -= jitter;
      }
      push({ game: g1, depth: 1, toMove: g1.currentPlayer, rootMove: m, g: -h, h, f: 0 + h });
    }

    let bestMove = rootMoves[0];
    let bestScore = -Infinity;

    let expanded = 0;
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    while (pq.length) {
      const node = pop()!;
      expanded++;
      if (expanded >= this.cfg.maxNodes) break;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (now - start > this.cfg.maxMs) break;
      // convert back to utility for the original player
      const utility = evaluateWith(node.game, player, this.cfg);
      if (utility > bestScore) { bestScore = utility; bestMove = node.rootMove; }

      if (node.depth >= this.cfg.depth || node.game.isOver()) continue;
      const moves = node.game.legalMoves();
      if (moves.length === 0) {
        // pass turn
        const passGame = node.game.clone();
        passGame.currentPlayer = this.opponent(node.toMove);
        const h = -evaluateWith(passGame, player, this.cfg);
        push({
          game: passGame,
          depth: node.depth + 1,
          toMove: passGame.currentPlayer,
          rootMove: node.rootMove,
          g: node.g - h,
          h,
          f: node.g + h
        });
        continue;
      }
      for (const m of moves) {
        const g2 = node.game.clone();
        g2.place(m.row, m.col);
        const h = -evaluateWith(g2, player, this.cfg);
        // Favor exploring promising branches first (lower f)
        push({
          game: g2,
          depth: node.depth + 1,
          toMove: g2.currentPlayer,
          rootMove: node.rootMove,
          g: node.g - h,
          h,
          f: node.g + h
        });
      }
    }
    return bestMove;
  }

  private opponent(p: Player): Player { return p === 'black' ? 'white' : 'black'; }
}

function countEmpty(game: Game): number {
  let n=0; for (const row of game.board) for (const cell of row) if (cell===null) n++; return n;
}

function negamaxEndgame(game: Game, toMove: Player, rootPlayer: Player, alpha: number, beta: number, start: number, maxMs: number): number {
  // Time guard
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (now - start > maxMs) {
    // fallback to simple evaluation to keep things responsive
    return evaluateWith(game, rootPlayer, {
      depth:0,maxNodes:0,maxMs:0,mobilityW:3,discW:1,cornerW:25,positionW:2,frontierW:1,stableW:1,endgameN:0
    });
  }
  if (game.isOver()) {
    const { black, white } = game.counts();
    const diff = (rootPlayer==='black' ? black - white : white - black);
    return diff;
  }
  const moves = game.legalMoves();
  if (moves.length === 0) {
    const pass = game.clone();
    pass.currentPlayer = rootPlayer === 'black' ? 'white' : 'black';
    return -negamaxEndgame(pass, pass.currentPlayer, rootPlayer, -beta, -alpha, start, maxMs);
  }
  let best = -Infinity;
  for (const m of moves) {
    const g1 = game.clone();
    g1.place(m.row, m.col);
    const val = -negamaxEndgame(g1, g1.currentPlayer, rootPlayer, -beta, -alpha, start, maxMs);
    if (val > best) best = val;
    if (val > alpha) alpha = val;
    if (alpha >= beta) break;
  }
  return best;
}
