import { Difficulty, Game, Move, Player } from './game';

// Heuristic: weighted sum of mobility, corner control, disc diff
function evaluate(game: Game, player: Player): number {
  const opp: Player = player === 'black' ? 'white' : 'black';
  const myMoves = game.legalMoves().length;
  const oppMoves = new Game(game.board, opp).legalMoves().length;
  const mobility = myMoves - oppMoves;
  const { black, white } = game.counts();
  const discDiff = (player === 'black' ? black - white : white - black);
  const corners = [
    game.board[0][0], game.board[0][7], game.board[7][0], game.board[7][7]
  ];
  let myCorners=0, oppCorners=0;
  for (const c of corners) {
    if (c === player) myCorners++; else if (c === opp) oppCorners++;
  }
  const cornerScore = 25*(myCorners - oppCorners);
  return 3*mobility + discDiff + cornerScore;
}

export class AStarAI {
  depth: number;
  maxNodes: number;
  maxMs: number;
  constructor(difficulty: Difficulty) {
    this.depth = difficulty==='easy' ? 2 : difficulty==='medium' ? 4 : 6;
    this.maxNodes = difficulty==='easy' ? 2000 : difficulty==='medium' ? 8000 : 30000;
    this.maxMs = difficulty==='easy' ? 60 : difficulty==='medium' ? 120 : 250;
  }

  chooseMove(game: Game): Move | null {
    // Best-first A* style search: expand nodes in order of f = g - h (we minimize cost)
    const player = game.currentPlayer;
    const rootMoves = game.legalMoves();
    if (rootMoves.length === 0) return null;
  if (rootMoves.length === 1) return rootMoves[0];

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
      const h = -evaluate(g1, player); // cost form (lower better)
      push({ game: g1, depth: 1, toMove: g1.currentPlayer, rootMove: m, g: -h, h, f: 0 + h });
    }

    let bestMove = rootMoves[0];
    let bestScore = -Infinity;

    let expanded = 0;
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    while (pq.length) {
      const node = pop()!;
      expanded++;
      if (expanded >= this.maxNodes) break;
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (now - start > this.maxMs) break;
      // convert back to utility for the original player
      const utility = evaluate(node.game, player);
      if (utility > bestScore) { bestScore = utility; bestMove = node.rootMove; }

      if (node.depth >= this.depth || node.game.isOver()) continue;
      const moves = node.game.legalMoves();
      if (moves.length === 0) {
        // pass turn
        const passGame = node.game.clone();
        passGame.currentPlayer = this.opponent(node.toMove);
        const h = -evaluate(passGame, player);
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
        const h = -evaluate(g2, player);
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
