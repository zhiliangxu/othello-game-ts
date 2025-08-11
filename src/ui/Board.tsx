import React from 'react';
import { Game } from '../utils/game';

interface Props {
  game: Game;
  onPlace: (row: number, col: number) => void;
  disabled?: boolean;
}

export default function Board({ game, onPlace, disabled }: Props) {
  const size = 8;
  const grid = game.board;
  const flippedKey = new Set(game.lastFlipped.map(c=>`${c.row}-${c.col}`));
  return (
    <div
      className="board"
      style={{
        width: 480,
        height: 480,
        background: '#2e8b57',
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gridTemplateRows: `repeat(${size}, 1fr)`,
        gap: 0,
        border: '4px solid black',
      }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const legal = game.isLegal(r, c);
          const key = `${r}-${c}`;
          const animate = flippedKey.has(key);
          return (
            <div
              key={key}
              onClick={() => !disabled && legal && onPlace(r, c)}
              className="board-cell"
              style={{
                border: '1px solid black',
                position: 'relative',
                cursor: !disabled && legal ? 'pointer' : 'default',
              }}
            >
              {cell !== null && (
                <div
                  className={`disc ${cell} ${animate ? 'animate' : ''}`}
                />
              )}
              {cell === null && legal && (
                <div className={`hint ${game.currentPlayer}`} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
