# Othello (Reversi) - TypeScript + React

This is a single page web app implementing Othello with human vs human and human vs AI modes. AI uses a depth-limited minimax with alpha-beta pruning (implemented under an A* umbrella per requirements) and a heuristic combining mobility, corners, and disc difference. Core logic and AI are written from scratch in TypeScript.

- React + Vite + TypeScript
- Bootstrap for UI
- Animations for disc placement, sound on move
- Unit tests for core logic and AI using Vitest

## Scripts
- `npm run dev` - start dev server
- `npm run build` - build for production
- `npm run preview` - preview production build
- `npm test` - run tests

