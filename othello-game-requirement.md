# Requirements of Othello Game

## What is Othello game?

Othello (also known as Reversi) is a two‑player strategy board game played on an 8×8 grid.

Pieces: Discs are black on one side and white on the other; each player controls one color.
Setup: Four discs in the center in a square—black at d5/e4, white at d4/e5 (or equivalent).
Turns: Players alternate placing a disc of their color so it flanks one or more opponent discs in a straight line (horizontal, vertical, or diagonal). All flanked discs flip to the current player’s color.
Legal moves: You must flip at least one opponent disc; if no legal move exists, you pass.
End: Game ends when neither player can move (usually when the board is full). The player with more discs showing their color wins.
Basic strategy: secure corners, control edges, maximize mobility, and aim for stable discs that can’t be flipped.

## Feature requirements

* Write a web-based Othello game.
* Supports both human vs. human and human vs. computer modes.
* For human vs. computer modes, provide three difficulty levels, easy, medium and hard.
* The game board is green. It has 8 by 8 grids. Lines are in black.
* Use animation to show how discs are flipped to opponent's color.
* Use sound when a disc is placed.
* Show the current numbers of discs in each color.
* Display which side wins at the end, and allow user to start a new game.

## Technical requirements

* Write a single page application with no backend service.
* Written in TypeScript, HTML and CSS.
* For frontend framework, use React.
* Use Bootstrap for UI styles.
* Use NPM packages where necessary.
* Use A-star algorithm for computer mode. Harder levels means searching more depth levels in A-star algorithm.
* Do not use existing NPM packages for the core logics, such as A-star algorithm and the game logic. Implement from scratch.
* Code should be modular, for example, implement A-star algorithm in a separate TypeScript file, implement rule of the game in a separate TypeScript file too. Group similar files in folders.
* Add test cases for TypeScript modules. Extensive test cases are needed for critical modules such as A-star algorithm and the game logic. Make sure all test cases pass.
* At the end, compile TypeScript code to minimal JavaScript so that it can run in a web browser.