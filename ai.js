// Simple chess bot logic for "Computer" mode

// Returns a random legal move for the current turn
function getRandomAIMove(boardState, turn) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardState[r][c];
      if (piece && piece[0] === turn) {
        const legalMoves = getLegalMoves(r, c);
        for (const [tr, tc] of legalMoves) {
          moves.push({ from: [r, c], to: [tr, tc] });
        }
      }
    }
  }
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

// Example: Call this after player's move if computer mode is active
function makeAIMoveIfNeeded() {
  if (window.gameMode !== "computer" || turn !== "b") return;
  setTimeout(() => {
    const move = getRandomAIMove(boardState, "b");
    if (move) {
      makeMove(move.from[0], move.from[1], move.to[0], move.to[1]);
      selected = null;
      renderBoard();
    }
  }, 500); // Delay for realism
}

// To use: 
// 1. Set window.gameMode = "computer" when Computer mode is selected.
// 2. After every player move, call makeAIMoveIfNeeded().
