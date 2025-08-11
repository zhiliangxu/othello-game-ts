import React, { useEffect, useMemo, useState } from 'react';
import { Game, Difficulty } from '../utils/game';
import Board from './Board';
import { AStarAI } from '../utils/ai';

export default function App() {
  const [game, setGame] = useState(() => new Game());
  const [mode, setMode] = useState<'pvp' | 'pve'>('pve');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aiThinking, setAiThinking] = useState(false);

  const ai = useMemo(() => new AStarAI(difficulty), [difficulty]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 660;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.start();
      o.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const onPlace = async (row: number, col: number) => {
    if (aiThinking) return;
    if (game.place(row, col)) {
      playBeep();
      setGame(game.clone());
      if (mode === 'pve') await maybeAITurn();
    }
  };

  const maybeAITurn = async () => {
    if (game.currentPlayer === 'white' && mode === 'pve' && !game.isOver()) {
      setAiThinking(true);
      await new Promise((r) => setTimeout(r, 200));
      const move = ai.chooseMove(game);
      if (move) {
        game.place(move.row, move.col);
        playBeep();
        setGame(game.clone());
      } else {
        // Fallbacks: try to compute legal moves to avoid an edge-case stall
        const legal = new Game(game.board, 'white').legalMoves();
        if (legal.length > 0) {
          const m = legal[0];
          game.currentPlayer = 'white';
          game.place(m.row, m.col);
          playBeep();
          setGame(game.clone());
        } else {
          // AI must pass; if opponent has moves, switch turn
          const oppGame = new Game(game.board, 'black');
          if (oppGame.legalMoves().length > 0) {
            game.currentPlayer = 'black';
            setGame(game.clone());
          }
        }
      }
      setAiThinking(false);
    }
  };

  const reset = () => setGame(new Game());

  // If it's AI's turn right after a pass or reset, let it move automatically
  useEffect(() => {
    if (mode === 'pve' && game.currentPlayer === 'white' && !game.isOver()) {
      // schedule async to avoid blocking render
      (async () => {
        await maybeAITurn();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentPlayer, mode, difficulty]);

  // Global auto-pass if a player has no legal moves
  useEffect(() => {
    if (game.isOver()) return;
    const moves = game.legalMoves();
    if (moves.length === 0) {
      const opp: 'black' | 'white' = game.currentPlayer === 'black' ? 'white' : 'black';
      const oppGame = new Game(game.board, opp);
      if (oppGame.legalMoves().length > 0) {
        game.currentPlayer = opp;
        setGame(game.clone());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const status = game.isOver()
    ? `${game.winner() === 'black' ? 'Black' : game.winner() === 'white' ? 'White' : 'No one'} wins!`
    : `${game.currentPlayer === 'black' ? 'Black' : 'White'} to move`;

  const counts = game.counts();

  return (
    <div className="container py-4">
      <h1 className="mb-3">Othello (Reversi)</h1>

      <div className="row g-3 mb-3 align-items-end">
        <div className="col-auto">
          <label className="form-label">Mode</label>
          <select
            className="form-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="pve">Human vs Computer</option>
            <option value="pvp">Human vs Human</option>
          </select>
        </div>
        {mode === 'pve' && (
          <div className="col-auto">
            <label className="form-label">Difficulty</label>
            <select
              className="form-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}
        <div className="col-auto">
          <button className="btn btn-primary" onClick={reset}>
            New Game
          </button>
        </div>
      </div>

      <div className="mb-2">
        <strong>Status:</strong> {status}
      </div>

      <div className="mb-3">
        <span className="badge bg-dark me-2">Black: {counts.black}</span>
        <span className="badge bg-light text-dark">White: {counts.white}</span>
      </div>

  <Board game={game} onPlace={onPlace} disabled={aiThinking || game.isOver() || (mode==='pve' && game.currentPlayer==='white')} />
    </div>
  );
}
