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

function makeAIMoveIfNeeded() {
        if (window.gameMode !== "computer") return;
        // Only move if it's black's turn (AI is black)
        if (turn === "b") {
          // Simple delay for realism
          setTimeout(() => {
            // Your AI logic here (example: random move)
            const moves = [];
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                if (boardState[r][c] && boardState[r][c][0] === "b") {
                  const legal = getLegalMoves(r, c);
                  for (const [tr, tc] of legal) {
                    moves.push({ fr: r, fc: c, tr, tc });
                  }
                }
              }
            }
            if (moves.length > 0) {
              const move = moves[Math.floor(Math.random() * moves.length)];
              // Play move or capture sound for AI
              if (boardState[move.tr][move.tc]) {
                captureSound.currentTime = 0;
                captureSound.play();
              } else {
                moveSound.currentTime = 0;
                moveSound.play();
              }
              makeMove(move.fr, move.fc, move.tr, move.tc);
            }
          }, 1000);
        }
      }


