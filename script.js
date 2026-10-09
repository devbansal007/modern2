/**
 * ============================================================================
 * TIC TAC TOE - MODERN FUTURISTIC JAVASCRIPT GAME LOGIC
 * ============================================================================
 * Features:
 *  - High-response mobile touch and desktop click handling
 *  - 2-Player Local Pass & Play and Single-Player vs Computer (Smart & Casual)
 *  - Full 8-combination win detection & winning line cell highlights
 *  - Persistent score tracking across rounds with dedicated score reset
 *  - Synthesized Web Audio API sound effects with resilient mobile touch resume
 *  - Full keyboard accessibility and responsive interaction
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // GAME STATE
  // --------------------------------------------------------------------------
  const state = {
    board: Array(9).fill(null), // 9 board cells: null | 'X' | 'O'
    currentPlayer: 'X',         // 'X' starts each new game
    isGameActive: true,         // false when round is won or drawn
    gameMode: 'pvp',            // 'pvp' (Pass & Play) or 'cpu' (vs Computer)
    cpuDifficulty: 'smart',     // 'smart' (Minimax) or 'casual'
    isCpuTurn: false,           // true while CPU is thinking
    scores: {
      X: 0,
      O: 0,
      ties: 0
    },
    soundEnabled: true
  };

  // Winning combinations matrix (Rows, Columns, Diagonals)
  const WINNING_COMBINATIONS = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Column 1
    [1, 4, 7], // Column 2
    [2, 5, 8], // Column 3
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
  ];

  // SVG Markup Templates for High-Fidelity Icons
  const SVG_X = `
    <div class="mark mark-x" aria-hidden="true" style="pointer-events: none;">
      <svg viewBox="0 0 100 100" style="pointer-events: none;">
        <path d="M 22 22 L 78 78" />
        <path d="M 78 22 L 22 78" />
      </svg>
    </div>
  `;

  const SVG_O = `
    <div class="mark mark-o" aria-hidden="true" style="pointer-events: none;">
      <svg viewBox="0 0 100 100" style="pointer-events: none;">
        <circle cx="50" cy="50" r="32" />
      </svg>
    </div>
  `;

  // --------------------------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // --------------------------------------------------------------------------
  const cells = document.querySelectorAll('.cell');
  const boardEl = document.getElementById('gameBoard');
  const statusMessageEl = document.getElementById('statusMessage');
  const badgeX = document.getElementById('badgeX');
  const badgeO = document.getElementById('badgeO');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreTiesEl = document.getElementById('scoreTies');
  const labelOEl = document.getElementById('labelO');
  const btnRestart = document.getElementById('btnRestart');
  const btnResetScores = document.getElementById('btnResetScores');
  const modePvpBtn = document.getElementById('modePvp');
  const modeCpuBtn = document.getElementById('modeCpu');
  const cpuOptionsContainer = document.getElementById('cpuOptions');
  const diffSmartBtn = document.getElementById('diffSmart');
  const diffCasualBtn = document.getElementById('diffCasual');
  const soundToggleBtn = document.getElementById('soundToggle');
  const soundIconEl = document.getElementById('soundIcon');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalBtnPlayAgain = document.getElementById('modalBtnPlayAgain');
  const modalBtnClose = document.getElementById('modalBtnClose');

  // --------------------------------------------------------------------------
  // SYNTHESIZED SOUND EFFECTS (Web Audio API)
  // --------------------------------------------------------------------------
  let audioCtx = null;

  function initAudio() {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch {
      // Audio fallback
    }
  }

  function playTone(freq, duration = 0.08, type = 'sine', gainVal = 0.15) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio playback fails silently if blocked or unsupported
    }
  }

  function playSoundMove(player) {
    if (player === 'X') {
      playTone(520, 0.09, 'sine', 0.18);
    } else {
      playTone(440, 0.09, 'triangle', 0.18);
    }
  }

  function playSoundWin() {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        setTimeout(() => {
          playTone(freq, 0.18, 'triangle', 0.2);
        }, index * 110);
      });
    } catch {}
  }

  function playSoundDraw() {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      playTone(330, 0.15, 'sawtooth', 0.1);
      setTimeout(() => playTone(293.66, 0.25, 'sawtooth', 0.1), 120);
    } catch {}
  }

  function playSoundClick() {
    playTone(800, 0.04, 'sine', 0.08);
  }

  // --------------------------------------------------------------------------
  // GAME CORE FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Primary touch/click move handler on a board cell
   */
  function handleCellInteraction(e) {
    // Find closest cell container
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const index = parseInt(cell.getAttribute('data-index'), 10);

    // Guard conditions: cell already occupied, game over, or CPU calculating
    if (isNaN(index) || state.board[index] !== null || !state.isGameActive || state.isCpuTurn) {
      return;
    }

    makeMove(index, state.currentPlayer);

    // If vs CPU mode is active and game continues, trigger CPU move
    if (state.isGameActive && state.gameMode === 'cpu' && state.currentPlayer === 'O') {
      triggerCpuTurn();
    }
  }

  /**
   * Places a player's symbol in the given cell index
   */
  function makeMove(index, player) {
    state.board[index] = player;
    const cell = cells[index];
    
    // Insert SVG mark
    cell.innerHTML = player === 'X' ? SVG_X : SVG_O;
    cell.classList.add('occupied');
    cell.setAttribute('aria-label', `Cell ${index + 1}, occupied by Player ${player}`);

    playSoundMove(player);

    // Check for win or draw
    const winResult = checkWin(state.board, player);
    if (winResult) {
      handleGameEnd('win', player, winResult.combination);
      return;
    }

    if (checkDraw(state.board)) {
      handleGameEnd('draw');
      return;
    }

    // Switch turns
    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
  }

  function checkWin(board, player) {
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
      const [a, b, c] = WINNING_COMBINATIONS[i];
      if (board[a] === player && board[b] === player && board[c] === player) {
        return { combination: [a, b, c] };
      }
    }
    return null;
  }

  function checkDraw(board) {
    return board.every(cell => cell !== null);
  }

  function handleGameEnd(result, winner = null, winningLine = []) {
    state.isGameActive = false;

    if (result === 'win') {
      state.scores[winner] += 1;
      updateScoreboard();

      winningLine.forEach(index => {
        cells[index].classList.add('winning-cell');
      });

      const winnerName = state.gameMode === 'cpu' && winner === 'O' ? 'Computer (O)' : `Player ${winner}`;
      statusMessageEl.innerHTML = `<span class="status-highlight">${winnerName}</span> wins the round!`;
      
      playSoundWin();
      showEndModal('win', winner, winnerName);
    } else {
      state.scores.ties += 1;
      updateScoreboard();

      statusMessageEl.innerHTML = `Round ended in a <span class="status-highlight">Draw</span>!`;
      playSoundDraw();
      showEndModal('draw');
    }
  }

  function updateTurnIndicator() {
    if (!state.isGameActive) return;

    if (state.currentPlayer === 'X') {
      badgeX.classList.add('active');
      badgeO.classList.remove('active');
      statusMessageEl.textContent = "Player X's Turn";
    } else {
      badgeO.classList.add('active');
      badgeX.classList.remove('active');
      if (state.gameMode === 'cpu') {
        statusMessageEl.textContent = "Computer is thinking...";
      } else {
        statusMessageEl.textContent = "Player O's Turn";
      }
    }
  }

  function updateScoreboard() {
    scoreXEl.textContent = state.scores.X;
    scoreOEl.textContent = state.scores.O;
    scoreTiesEl.textContent = state.scores.ties;
  }

  // --------------------------------------------------------------------------
  // COMPUTER OPPONENT (AI LOGIC)
  // --------------------------------------------------------------------------

  function triggerCpuTurn() {
    state.isCpuTurn = true;
    updateTurnIndicator();

    setTimeout(() => {
      if (!state.isGameActive) {
        state.isCpuTurn = false;
        return;
      }

      let moveIndex;
      if (state.cpuDifficulty === 'smart') {
        moveIndex = getBestMove(state.board, 'O');
      } else {
        if (Math.random() < 0.65) {
          moveIndex = getBestMove(state.board, 'O');
        } else {
          moveIndex = getRandomMove(state.board);
        }
      }

      state.isCpuTurn = false;
      if (moveIndex !== null && moveIndex !== undefined) {
        makeMove(moveIndex, 'O');
      }
    }, 380);
  }

  function getRandomMove(board) {
    const emptyIndices = [];
    board.forEach((val, i) => {
      if (val === null) emptyIndices.push(i);
    });
    if (emptyIndices.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * emptyIndices.length);
    return emptyIndices[randomIndex];
  }

  function getBestMove(board, aiPlayer) {
    const humanPlayer = aiPlayer === 'O' ? 'X' : 'O';

    // 1. Immediate Win Check
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        if (checkWin(board, aiPlayer)) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }

    // 2. Immediate Block Check
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanPlayer;
        if (checkWin(board, humanPlayer)) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }

    // 3. Take Center if available
    if (board[4] === null && Math.random() < 0.85) {
      return 4;
    }

    // 4. Minimax Algorithm
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const score = minimax(board, 0, false, aiPlayer, humanPlayer);
        board[i] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove !== null ? bestMove : getRandomMove(board);
  }

  function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer) {
    if (checkWin(board, aiPlayer)) return 10 - depth;
    if (checkWin(board, humanPlayer)) return depth - 10;
    if (checkDraw(board)) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = aiPlayer;
          const score = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
          board[i] = null;
          maxScore = Math.max(score, maxScore);
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = humanPlayer;
          const score = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
          board[i] = null;
          minScore = Math.min(score, minScore);
        }
      }
      return minScore;
    }
  }

  // --------------------------------------------------------------------------
  // MODAL CELEBRATION / OVERLAY
  // --------------------------------------------------------------------------
  function showEndModal(type, winner, winnerName) {
    modalIcon.className = 'modal-icon';

    if (type === 'win') {
      if (winner === 'X') {
        modalIcon.classList.add('winner-x');
        modalIcon.innerHTML = `
          <svg viewBox="0 0 100 100" fill="none">
            <path d="M26 26 L74 74 M74 26 L26 74" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
          </svg>`;
      } else {
        modalIcon.classList.add('winner-o');
        modalIcon.innerHTML = `
          <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
          </svg>`;
      }
      modalTitle.textContent = `${winnerName} Won!`;
      modalDesc.textContent = 'Strategic dominance achieved. Ready for the next round?';
    } else {
      modalIcon.classList.add('winner-draw');
      modalIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="9" x2="19" y2="9"></line>
          <line x1="5" y1="15" x2="19" y2="15"></line>
        </svg>`;
      modalTitle.textContent = "It's a Stalemate!";
      modalDesc.textContent = 'A balanced tactical showdown. Neither side surrendered ground.';
    }

    setTimeout(() => {
      modalOverlay.classList.add('open');
    }, 450);
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
  }

  // --------------------------------------------------------------------------
  // RESET & RESTART HANDLERS
  // --------------------------------------------------------------------------

  function restartRound() {
    playSoundClick();
    closeModal();

    state.board.fill(null);
    state.currentPlayer = 'X';
    state.isGameActive = true;
    state.isCpuTurn = false;

    cells.forEach((cell, index) => {
      cell.innerHTML = '';
      cell.className = 'cell';
      cell.setAttribute('aria-label', `Cell ${index + 1}, empty`);
    });

    updateTurnIndicator();
  }

  function resetScores() {
    playSoundClick();
    state.scores.X = 0;
    state.scores.O = 0;
    state.scores.ties = 0;
    updateScoreboard();
    restartRound();
  }

  // --------------------------------------------------------------------------
  // EVENT LISTENERS & INITIALIZATION
  // --------------------------------------------------------------------------

  // Board Cell Interaction: Supports fast tap and click without delay
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellInteraction);

    // Keyboard support
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCellInteraction(e);
      }
    });
  });

  // Action Buttons
  btnRestart.addEventListener('click', restartRound);
  btnResetScores.addEventListener('click', resetScores);
  modalBtnPlayAgain.addEventListener('click', restartRound);
  modalBtnClose.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  modePvpBtn.addEventListener('click', () => {
    if (state.gameMode === 'pvp') return;
    playSoundClick();
    state.gameMode = 'pvp';
    modePvpBtn.classList.add('active');
    modeCpuBtn.classList.remove('active');
    cpuOptionsContainer.style.display = 'none';
    labelOEl.textContent = 'Player O';
    restartRound();
  });

  modeCpuBtn.addEventListener('click', () => {
    if (state.gameMode === 'cpu') return;
    playSoundClick();
    state.gameMode = 'cpu';
    modeCpuBtn.classList.add('active');
    modePvpBtn.classList.remove('active');
    cpuOptionsContainer.style.display = 'flex';
    labelOEl.textContent = 'Computer (O)';
    restartRound();
  });

  diffSmartBtn.addEventListener('click', () => {
    playSoundClick();
    state.cpuDifficulty = 'smart';
    diffSmartBtn.classList.add('active');
    diffCasualBtn.classList.remove('active');
  });

  diffCasualBtn.addEventListener('click', () => {
    playSoundClick();
    state.cpuDifficulty = 'casual';
    diffCasualBtn.classList.add('active');
    diffSmartBtn.classList.remove('active');
  });

  soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggleBtn.setAttribute('aria-label', state.soundEnabled ? 'Mute sound effects' : 'Unmute sound effects');
    soundToggleBtn.setAttribute('title', state.soundEnabled ? 'Mute Sound' : 'Unmute Sound');

    if (state.soundEnabled) {
      initAudio();
      playSoundClick();
      soundIconEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    } else {
      soundIconEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    }
  });

  // Keyboard navigation across grid
  boardEl.addEventListener('keydown', e => {
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.classList.contains('cell')) return;

    const currentIndex = parseInt(activeEl.getAttribute('data-index'), 10);
    let nextIndex = null;

    if (e.key === 'ArrowRight') {
      nextIndex = currentIndex % 3 < 2 ? currentIndex + 1 : currentIndex - 2;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = currentIndex % 3 > 0 ? currentIndex - 1 : currentIndex + 2;
    } else if (e.key === 'ArrowDown') {
      nextIndex = currentIndex + 3 <= 8 ? currentIndex + 3 : currentIndex - 6;
    } else if (e.key === 'ArrowUp') {
      nextIndex = currentIndex - 3 >= 0 ? currentIndex - 3 : currentIndex + 6;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      cells[nextIndex].focus();
    }
  });

  // Initial State Setup
  updateTurnIndicator();
  updateScoreboard();

})();
