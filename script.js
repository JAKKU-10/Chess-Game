      let boardState = [];
      let turn = "w";
      let selected = null;
      let captured = { w: [], b: [] };
      let history = [];
      let future = [];
      let lastMove = null;
      let enPassantTarget = null;

      // Track if king/rooks have moved
      let kingMoved = { w: false, b: false };
      let rookMoved = { w: { k: false, q: false }, b: { k: false, q: false } };

      const boardElem = document.getElementById("board");
      const capturedWhiteElem = document.getElementById("capturedWhite");
      const capturedBlackElem = document.getElementById("capturedBlack");
      const checkText = document.getElementById("checkText");
      const promotionOverlay = document.getElementById("promotionOverlay");
      const gameOverOverlay = document.getElementById("gameOverOverlay");
      const gameOverMessage = document.getElementById("gameOverMessage");
      const moveSound = document.getElementById("moveSound");
      const captureSound = document.getElementById("captureSound");
      const checkSound = document.getElementById("checkSound");
      const checkmateSound = document.getElementById("checkmateSound");
      const castleSound = document.getElementById("castleSound");

      const settingsBtn = document.getElementById("settingsBtn");
      const settingsOverlay = document.getElementById("settingsOverlay");
      const closeSettingsBtn = document.getElementById("closeSettingsBtn");
      const restartFromSettings = document.getElementById(
        "restartFromSettings"
      );
      const resumeBtn = document.getElementById("resumeBtn");

      // Add these lines after your other DOM queries
      const localBtn = document.getElementById("localBtn");
      const computerBtn = document.getElementById("computerBtn");

      // Example event handlers (customize as needed)
      computerBtn.onclick = () => {
        window.gameMode = "computer";
        settingsOverlay.style.display = "none";
        // If it's black's turn (bot), let the bot move immediately
        makeAIMoveIfNeeded();
      };
      localBtn.onclick = () => {
        window.gameMode = "local";
        settingsOverlay.style.display = "none";
      };

      // Show settings overlay
      settingsBtn.onclick = () => {
        settingsOverlay.style.display = "flex";
      };
      // Hide settings overlay
      closeSettingsBtn.onclick = () => {
        settingsOverlay.style.display = "none";
      };
      resumeBtn.onclick = () => {
        settingsOverlay.style.display = "none";
      };
      // Restart from settings
      restartFromSettings.onclick = () => {
        castleSound.currentTime = 0;
        castleSound.play();
        settingsOverlay.style.display = "none";
        initializeBoard();
      };

      function initializeBoard() {
        boardState = [
          ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
          ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
          ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
        ];
        turn = "w";
        selected = null;
        captured = { w: [], b: [] };
        history = [];
        future = [];
        kingMoved = { w: false, b: false };
        rookMoved = { w: { k: false, q: false }, b: { k: false, q: false } };
        enPassantTarget = null; // Reset en passant
        lastMove = null; // <-- Add this line to clear last move highlight
        renderBoard();
        renderCaptured();
        gameOverOverlay.style.display = "none";
        if (typeof makeAIMoveIfNeeded === "function") makeAIMoveIfNeeded();
      }

      function renderBoard() {
        boardElem.innerHTML = "";
        let possibleMoves = [];
        if (selected) {
          possibleMoves = getLegalMoves(selected.row, selected.col);
        }
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const sq = document.createElement("div");
            sq.classList.add("square");
            sq.classList.add((r + c) % 2 === 0 ? "light" : "dark");
            sq.dataset.row = r;
            sq.dataset.col = c;

            // Highlight last move
            if (
              lastMove &&
              ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                (lastMove.to[0] === r && lastMove.to[1] === c))
            ) {
              sq.classList.add("last-move");
            }

            const piece = boardState[r][c];
            if (piece) {
              const img = document.createElement("img");
              img.src = `images/${piece}.png`;
              img.alt = piece;
              img.draggable = false;
              img.style.userSelect = "none";
              img.style.width = "48px";
              img.style.height = "48px";
              // Only add hover effect if it's player's turn and not computer's turn
              if (
                !(window.gameMode === "computer" && turn === "b") &&
                piece[0] === turn
              ) {
                img.classList.add("player-turn-hover");
              }
              sq.appendChild(img);
            }

            if (selected && selected.row === r && selected.col === c) {
              sq.classList.add("highlight");
            }

            // Highlight possible moves
            if (selected) {
              for (const [mr, mc] of possibleMoves) {
                if (mr === r && mc === c) {
                  if (boardState[r][c] && boardState[r][c][0] !== turn) {
                    sq.classList.add("capture-highlight");
                  } else if (!boardState[r][c]) {
                    sq.classList.add("possible-move");
                  }
                }
              }
            }

            sq.addEventListener("click", () => onSquareClick(r, c));
            boardElem.appendChild(sq);
          }
        }
      }

      function renderCaptured() {
        capturedWhiteElem.innerHTML = "";
        capturedBlackElem.innerHTML = "";
        captured.w.forEach((p) => {
          const img = document.createElement("img");
          img.src = `images/${p}.png`;
          img.style.width = "32px";
          img.style.height = "32px";
          capturedWhiteElem.appendChild(img);
        });
        captured.b.forEach((p) => {
          const img = document.createElement("img");
          img.src = `images/${p}.png`;
          img.style.width = "32px";
          img.style.height = "32px";
          capturedBlackElem.appendChild(img);
        });
      }

      function onSquareClick(r, c) {
        if (gameOverOverlay.style.display === "flex") return;

        // Prevent any player move and hover effect during computer's turn in computer mode
        if (window.gameMode === "computer" && turn === "b") {
          return;
        }

        const piece = boardState[r][c];

        // Only block selection if the player tries to select a computer's piece as their own
        if (
          window.gameMode === "computer" &&
          turn === "w" &&
          !selected && // Only block if not already selecting your own piece
          piece &&
          piece[0] === "b"
        ) {
          return;
        }

        if (selected) {
          const moves = getLegalMoves(selected.row, selected.col);
          const canMove = moves.some((m) => m[0] === r && m[1] === c);
          if (canMove) {
            // Play capture or move sound
            if (boardState[r][c] && boardState[r][c][0] !== turn) {
              captureSound.currentTime = 0;
              captureSound.play();
            } else {
              moveSound.currentTime = 0;
              moveSound.play();
            }
            makeMove(selected.row, selected.col, r, c);
            selected = null;
            renderBoard();
          } else {
            if (selected.row === r && selected.col === c) {
              selected = null;
              renderBoard();
              return;
            }
            if (piece && piece[0] === turn) {
              // No sound on selection
              selected = { row: r, col: c };
              renderBoard();
            }
          }
        } else {
          if (piece && piece[0] === turn) {
            // No sound on selection
            selected = { row: r, col: c };
            renderBoard();
          }
        }
      }

      function makeMove(fr, fc, tr, tc, special) {
        // Save current state for undo
        history.push({
          board: JSON.parse(JSON.stringify(boardState)),
          turn,
          captured: JSON.parse(JSON.stringify(captured)),
          selected: selected ? { ...selected } : null,
          kingMoved: JSON.parse(JSON.stringify(kingMoved)),
          rookMoved: JSON.parse(JSON.stringify(rookMoved)),
          lastMove: lastMove ? { ...lastMove } : null,
          enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
        });
        future = []; // Clear redo stack on new move

        const movingPiece = boardState[fr][fc];
        const targetPiece = boardState[tr][tc];

        // --- En Passant capture ---
        if (
          movingPiece &&
          movingPiece[1] === "p" &&
          enPassantTarget &&
          tr === enPassantTarget.row &&
          tc === enPassantTarget.col
        ) {
          // Remove the captured pawn
          const capRow = turn === "w" ? tr + 1 : tr - 1;
          captured[turn].push(boardState[capRow][tc]);
          boardState[capRow][tc] = "";
        }

        // --- Castling move ---
        if (movingPiece && movingPiece[1] === "k" && Math.abs(tc - fc) === 2) {
          // King-side
          if (tc === 6) {
            boardState[tr][5] = boardState[tr][7];
            boardState[tr][7] = "";
            castleSound.currentTime = 0;
            castleSound.play();
          }
          // Queen-side
          if (tc === 2) {
            boardState[tr][3] = boardState[tr][0];
            boardState[tr][0] = "";
            castleSound.currentTime = 0;
            castleSound.play();
          }
          kingMoved[turn] = true;
          if (tc === 6) rookMoved[turn].k = true;
          if (tc === 2) rookMoved[turn].q = true;
        }

        // Update king/rook moved state
        if (movingPiece === turn + "k") kingMoved[turn] = true;
        if (
          movingPiece === turn + "r" &&
          fr === (turn === "w" ? 7 : 0) &&
          fc === 0
        )
          rookMoved[turn].q = true;
        if (
          movingPiece === turn + "r" &&
          fr === (turn === "w" ? 7 : 0) &&
          fc === 7
        )
          rookMoved[turn].k = true;

        if (targetPiece) {
          captured[turn].push(targetPiece);
        }
        boardState[tr][tc] = movingPiece;
        boardState[fr][fc] = "";

        lastMove = { from: [fr, fc], to: [tr, tc] };

        // --- En Passant target update ---
        if (movingPiece && movingPiece[1] === "p" && Math.abs(tr - fr) === 2) {
          // Set en passant target square
          enPassantTarget = {
            row: (fr + tr) / 2,
            col: fc,
            color: turn,
          };
        } else {
          enPassantTarget = null;
        }

        if (
          (movingPiece === "wp" && tr === 0) ||
          (movingPiece === "bp" && tr === 7)
        ) {
          showPromotionMenu(tr, tc, turn);
          return;
        }

        renderCaptured();
        renderBoard();

        const opponent = turn === "w" ? "b" : "w";

        if (isCheck(opponent)) {
          showCheckText();
          if (isCheckmate(opponent)) {
            checkmateSound.currentTime = 0;
            checkmateSound.play();
            showGameOver("win", turn, "Checkmate! Congratulations!");
            return;
          }
        }
        if (isKingCaptured(opponent)) {
          checkmateSound.currentTime = 0;
          checkmateSound.play();
          gameOverMessage.textContent =
            (turn === "w" ? "White" : "Black") + " wins! King captured.";
          gameOverOverlay.style.display = "flex";
          return;
        }

        // --- Stalemate check ---
        if (isStalemate(opponent)) {
          showGameOver("draw", null, "Draw by stalemate.");
          return;
        }

        // --- Insufficient material check ---
        if (isInsufficientMaterial()) {
          showGameOver("draw", null, "Draw by insufficient material.");
          return;
        }

        turn = opponent;
        if (typeof makeAIMoveIfNeeded === "function") makeAIMoveIfNeeded();
      }

      function showPromotionMenu(row, col, color) {
        // If it's the computer's turn, or you want auto-queen for both sides:
        if (
          (window.gameMode === "computer" && color === "b") ||
          window.autoQueenForAll
        ) {
          boardState[row][col] = color + "q";
          promotionOverlay.style.display = "none";
          renderCaptured();

          // --- FIX: update turn BEFORE rendering ---
          const opponent = color === "w" ? "b" : "w";
          turn = opponent;

          renderBoard();
          animatePromotion(row, col);

          if (isCheck(opponent)) {
            showCheckText();
            if (isCheckmate(opponent)) {
              showGameOver("win", color, "Checkmate! Congratulations!");
              return;
            }
          }

          // Let computer move after promotion if needed
          if (
            window.gameMode === "computer" &&
            turn === "b" &&
            typeof makeAIMoveIfNeeded === "function"
          ) {
            makeAIMoveIfNeeded();
          }
          return;
        }

        // Otherwise, show the promotion menu for the human player
        promotionOverlay.innerHTML = `
          <div class="promotion-box">
            <div class="promotion-title">Choose Promotion</div>
            <div class="promotion-choices">
              <div class="promotion-choice" tabindex="0" data-piece="q">
                <img src="images/${color}q.png" alt="Queen" />
                <div class="promotion-label">Queen</div>
              </div>
              <div class="promotion-choice" tabindex="0" data-piece="r">
                <img src="images/${color}r.png" alt="Rook" />
                <div class="promotion-label">Rook</div>
              </div>
              <div class="promotion-choice" tabindex="0" data-piece="b">
                <img src="images/${color}b.png" alt="Bishop" />
                <div class="promotion-label">Bishop</div>
              </div>
              <div class="promotion-choice" tabindex="0" data-piece="n">
                <img src="images/${color}n.png" alt="Knight" />
                <div class="promotion-label">Knight</div>
              </div>
            </div>
          </div>
        `;
        promotionOverlay.style.display = "flex";

        // Add click/keyboard event listeners for choices
        document.querySelectorAll(".promotion-choice").forEach((choice) => {
          choice.onclick = () => {
            const p = choice.getAttribute("data-piece");
            boardState[row][col] = color + p;
            promotionOverlay.style.display = "none";
            renderCaptured();

            // --- FIX: update turn BEFORE rendering ---
            const opponent = color === "w" ? "b" : "w";
            turn = opponent;

            renderBoard();
            animatePromotion(row, col);

            if (isCheck(opponent)) {
              showCheckText();
              if (isCheckmate(opponent)) {
                showGameOver("win", color, "Checkmate! Congratulations!");
                return;
              }
            }

            // Let computer move after promotion if needed
            if (
              window.gameMode === "computer" &&
              turn === "b" &&
              typeof makeAIMoveIfNeeded === "function"
            ) {
              makeAIMoveIfNeeded();
            }
          };
          // Keyboard accessibility
          choice.onkeydown = (e) => {
            if (e.key === "Enter" || e.key === " ") choice.click();
          };
        });
      }

      // Add this function to animate the promoted piece:
      function animatePromotion(row, col) {
        // Find the promoted square's DOM element
        const squares = document.querySelectorAll("#board .square");
        for (const sq of squares) {
          if (
            parseInt(sq.dataset.row) === row &&
            parseInt(sq.dataset.col) === col
          ) {
            const img = sq.querySelector("img");
            if (img) {
              img.style.transition =
                "transform 0.5s cubic-bezier(.68,-0.55,.27,1.55), box-shadow 0.5s";
              img.style.transform = "scale(1.4) rotate(-8deg)";
              img.style.boxShadow =
                "0 0 32px 8px #ffe066cc, 0 4px 24px #b5886333";
              setTimeout(() => {
                img.style.transform = "";
                img.style.boxShadow = "";
              }, 600);
            }
            break;
          }
        }
      }

   function showCheckText() {
  checkSound.currentTime = 0;
  checkSound.play();
  checkText.style.display = "block";
  checkText.classList.add("show");
  setTimeout(() => {
    checkText.classList.remove("show");
    checkText.style.display = "none";
  }, 2000);
}

      function isKingCaptured(color) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (boardState[r][c] === color + "k") return false;
          }
        }
        return true;
      }

      // Check if color is in check
      function isCheck(color) {
        const kingPos = findKing(color);
        if (!kingPos) return true; // King missing means checkmate or game over
        const opponent = color === "w" ? "b" : "w";
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (boardState[r][c].startsWith(opponent)) {
              const moves = getRawMoves(r, c, true);
              if (
                moves.some((m) => m[0] === kingPos.row && m[1] === kingPos.col)
              )
                return true;
            }
          }
        }
        return false;
      }

      // Check if checkmate (no legal moves to escape)
      function isCheckmate(color) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (boardState[r][c].startsWith(color)) {
              const moves = getLegalMoves(r, c);
              if (moves.length > 0) return false;
            }
          }
        }
        return true;
      }

      // Add this function below isCheckmate
      function isStalemate(color) {
        if (isCheck(color)) return false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (
              boardState[r][c].startsWith &&
              boardState[r][c].startsWith(color)
            ) {
              const moves = getLegalMoves(r, c);
              if (moves.length > 0) return false;
            }
          }
        }
        return true;
      }

      // Check for draw by insufficient material
      function isInsufficientMaterial() {
        // Gather all pieces on the board
        const pieces = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = boardState[r][c];
            if (p) pieces.push(p);
          }
        }
        // Only kings left
        if (pieces.length === 2) return true;
        // King + bishop/knight vs king
        if (pieces.length === 3) {
          const types = pieces.map((p) => p[1]);
          if (
            types.filter((t) => t === "k").length === 2 &&
            (types.includes("b") || types.includes("n"))
          ) {
            return true;
          }
        }
        // King + bishop vs king + bishop (both bishops on same color)
        if (pieces.length === 4) {
          const bishops = pieces.filter((p) => p[1] === "b");
          if (bishops.length === 2) {
            // Check if both bishops are on same color square
            const squares = [];
            for (let r = 0; r < 8; r++) {
              for (let c = 0; c < 8; c++) {
                if (boardState[r][c] && boardState[r][c][1] === "b") {
                  squares.push((r + c) % 2);
                }
              }
            }
            if (squares.length === 2 && squares[0] === squares[1]) {
              return true;
            }
          }
        }
        return false;
      }

      function findKing(color) {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (boardState[r][c] === color + "k") return { row: r, col: c };
          }
        }
        return null;
      }

      // Get legal moves filtered for checks
      function getLegalMoves(r, c) {
        const piece = boardState[r][c];
        if (!piece) return [];
        const color = piece[0];
        const rawMoves = getRawMoves(r, c, false);
        const legal = [];
        for (const [tr, tc] of rawMoves) {
          // simulate move
          const temp = boardState[tr][tc];
          boardState[tr][tc] = piece;
          boardState[r][c] = "";
          const inCheck = isCheck(color);
          boardState[r][c] = piece;
          boardState[tr][tc] = temp;
          if (!inCheck) legal.push([tr, tc]);
        }
        return legal;
      }

      // Get raw moves without checking for check, returns array of [r,c]
      function getRawMoves(r, c, ignorePins) {
        const moves = [];
        const piece = boardState[r][c];
        if (!piece) return moves;
        const color = piece[0];
        const type = piece[1];
        const enemy = color === "w" ? "b" : "w";

        const directions = {
          n: [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1],
          ],
          b: [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
          ],
          r: [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ],
          q: [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ],
          k: [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
          ],
        };

        function onBoard(x, y) {
          return x >= 0 && x < 8 && y >= 0 && y < 8;
        }

        if (type === "p") {
          let dir = color === "w" ? -1 : 1;
          // Move forward
          if (onBoard(r + dir, c) && !boardState[r + dir][c]) {
            moves.push([r + dir, c]);
            // First move double step
            if (
              ((color === "w" && r === 6) || (color === "b" && r === 1)) &&
              !boardState[r + 2 * dir][c]
            ) {
              moves.push([r + 2 * dir, c]);
            }
          }
          // Captures
          for (let dc of [-1, 1]) {
            let nr = r + dir,
              nc = c + dc;
            if (
              onBoard(nr, nc) &&
              boardState[nr][nc] &&
              boardState[nr][nc][0] === enemy
            ) {
              moves.push([nr, nc]);
            }
            // --- En Passant ---
            if (
              enPassantTarget &&
              enPassantTarget.row === nr &&
              enPassantTarget.col === nc &&
              boardState[r][nc] &&
              boardState[r][nc][0] === enemy &&
              boardState[r][nc][1] === "p"
            ) {
              moves.push([nr, nc]);
            }
          }
        } else if ("nbrkq".includes(type)) {
          if (type === "n") {
            for (let [dr, dc] of directions.n) {
              let nr = r + dr,
                nc = c + dc;
              if (
                onBoard(nr, nc) &&
                (!boardState[nr][nc] || boardState[nr][nc][0] === enemy)
              ) {
                moves.push([nr, nc]);
              }
            }
          } else if ("bqr".includes(type)) {
            const dirs = directions[type];
            for (let [dr, dc] of dirs) {
              let nr = r + dr,
                nc = c + dc;
              while (onBoard(nr, nc)) {
                if (!boardState[nr][nc]) {
                  moves.push([nr, nc]);
                } else {
                  if (boardState[nr][nc][0] === enemy) moves.push([nr, nc]);
                  break;
                }
                nr += dr;
                nc += dc;
              }
            }
          } else if (type === "k") {
            for (let [dr, dc] of directions.k) {
              let nr = r + dr,
                nc = c + dc;
              if (
                onBoard(nr, nc) &&
                (!boardState[nr][nc] || boardState[nr][nc][0] === enemy)
              ) {
                moves.push([nr, nc]);
              }
            }
            // --- Castling logic ---
            if (!ignorePins && !kingMoved[color] && !isCheck(color)) {
              // King-side
              if (
                !rookMoved[color].k &&
                !boardState[r][5] &&
                !boardState[r][6] &&
                !isSquareAttacked(r, 5, enemy) &&
                !isSquareAttacked(r, 6, enemy)
              ) {
                moves.push([r, 6, "castleK"]);
              }
              // Queen-side
              if (
                !rookMoved[color].q &&
                !boardState[r][1] &&
                !boardState[r][2] &&
                !boardState[r][3] &&
                !isSquareAttacked(r, 2, enemy) &&
                !isSquareAttacked(r, 3, enemy)
              ) {
                moves.push([r, 2, "castleQ"]);
              }
            }
          }
        }

        return moves;
      }

      // Helper for castling: is a square attacked by enemy?
      function isSquareAttacked(r, c, enemyColor) {
        for (let rr = 0; rr < 8; rr++) {
          for (let cc = 0; cc < 8; cc++) {
            if (boardState[rr][cc] && boardState[rr][cc][0] === enemyColor) {
              const moves = getRawMoves(rr, cc, true);
              if (moves.some((m) => m[0] === r && m[1] === c)) return true;
            }
          }
        }
        return false;
      }

      function undoMove() {
        if (history.length === 0) return;
        future.push({
          board: JSON.parse(JSON.stringify(boardState)),
          turn,
          captured: JSON.parse(JSON.stringify(captured)),
          selected: selected ? { ...selected } : null,
          kingMoved: JSON.parse(JSON.stringify(kingMoved)),
          rookMoved: JSON.parse(JSON.stringify(rookMoved)),
          lastMove: lastMove ? { ...lastMove } : null,
          enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
        });
        const prev = history.pop();
        boardState = JSON.parse(JSON.stringify(prev.board));
        turn = prev.turn;
        captured = JSON.parse(JSON.stringify(prev.captured));
        selected = prev.selected ? { ...prev.selected } : null;
        kingMoved = JSON.parse(JSON.stringify(prev.kingMoved));
        rookMoved = JSON.parse(JSON.stringify(prev.rookMoved));
        lastMove = prev.lastMove || null;
        enPassantTarget = prev.enPassantTarget || null;
        renderCaptured();
        renderBoard();
        gameOverOverlay.style.display = "none";
      }

      function redoMove() {
        if (future.length === 0) return;
        history.push({
          board: JSON.parse(JSON.stringify(boardState)),
          turn,
          captured: JSON.parse(JSON.stringify(captured)),
          selected: selected ? { ...selected } : null,
          kingMoved: JSON.parse(JSON.stringify(kingMoved)),
          rookMoved: JSON.parse(JSON.stringify(rookMoved)),
          lastMove: lastMove ? { ...lastMove } : null,
          enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
        });
        const next = future.pop();
        boardState = JSON.parse(JSON.stringify(next.board));
        turn = next.turn;
        captured = JSON.parse(JSON.stringify(next.captured));
        selected = next.selected ? { ...next.selected } : null;
        kingMoved = JSON.parse(JSON.stringify(next.kingMoved));
        rookMoved = JSON.parse(JSON.stringify(next.rookMoved));
        lastMove = next.lastMove || null;
        enPassantTarget = next.enPassantTarget || null;
        renderCaptured();
        renderBoard();
        gameOverOverlay.style.display = "none";
      }

      document.getElementById("undoBtn").onclick = () => {
        castleSound.currentTime = 0;
        castleSound.play();
        undoMove();
      };
      document.getElementById("redoBtn").onclick = () => {
        castleSound.currentTime = 0;
        castleSound.play();
        redoMove();
      };

      function showGameOver(type, winner = null, reason = "") {
        const overlay = document.getElementById("gameOverOverlay");
        const title = document.getElementById("gameOverTitle");
        const message = document.getElementById("gameOverMessage");
        if (type === "win") {
          title.textContent = winner === "w" ? "White Wins!" : "Black Wins!";
          message.textContent = reason || "Checkmate! Congratulations!";
        } else if (type === "draw") {
          title.textContent = "Draw!";
          message.textContent = reason || "The game ended in a draw.";
        }
        overlay.style.display = "flex";
      }

      document.getElementById("restartBtn2").onclick = () => {
        castleSound.currentTime = 0;
        castleSound.play();
        initializeBoard();
        document.getElementById("gameOverOverlay").style.display = "none";
      };

      initializeBoard();