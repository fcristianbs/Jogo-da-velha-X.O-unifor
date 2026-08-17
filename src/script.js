/**
 * Jogo da Velha Web - UNIFOR
 * Universidade de Fortaleza
 * 
 * Lógica do Jogo, Controle de Turnos, IA, Séries MD3,
 * Modo Noturno (Dark Mode), Efeitos Visuais e Síntese de Áudio (Web Audio API).
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. Dicionário de Dados & Estado do Jogo (CDU - Seção 18)
     ========================================================================== */
  const gameState = {
    options: ['', '', '', '', '', '', '', '', ''], // Estado das 9 células
    currentPlayer: 'X',                            // 'X' ou 'O'
    running: true,                                 // Flag de jogo ativo
    winsX: 0,                                      // Vitórias Jogador X
    winsO: 0,                                      // Vitórias Jogador O / CPU
    currentRound: 1,                               // Rodada atual
    mode: 'pvp',                                   // 'pvp' ou 'cpu'
    format: 'single',                              // 'single' ou 'bo3'
    isProcessingCPU: false                         // Bloqueio de cliques durante vez da CPU
  };

  /* Padrões de Vitória (Linhas, Colunas e Diagonais) */
  const WIN_PATTERNS = [
    [0, 1, 2], // Linha 1
    [3, 4, 5], // Linha 2
    [6, 7, 8], // Linha 3
    [0, 3, 6], // Coluna 1
    [1, 4, 7], // Coluna 2
    [2, 5, 8], // Coluna 3
    [0, 4, 8], // Diagonal Principal
    [2, 4, 6]  // Diagonal Secundária
  ];

  /* ==========================================================================
     2. Mapeamento de Elementos do DOM (UI-01 a UI-11 + Tema)
     ========================================================================== */
  const elements = {
    modeSelect: document.getElementById('mode-select'),
    formatSelect: document.getElementById('format-select'),
    scoreX: document.getElementById('score-x'),
    scoreO: document.getElementById('score-o'),
    roundDisplay: document.getElementById('round-display'),
    playerOLabel: document.getElementById('player-o-label'),
    cardPlayerX: document.getElementById('card-player-x'),
    cardPlayerO: document.getElementById('card-player-o'),
    statusMessage: document.getElementById('status-message'),
    statusDot: document.getElementById('status-dot'),
    boardGrid: document.getElementById('board-grid'),
    winningLine: document.getElementById('winning-line'),
    restartBtn: document.getElementById('restart-btn'),
    cells: Array.from(document.querySelectorAll('.cell')),
    confettiCanvas: document.getElementById('confetti-canvas'),
    themeToggleBtn: document.getElementById('theme-toggle-btn')
  };

  /* ==========================================================================
     3. Módulo de Áudio Sintetizado (Web Audio API - Zero Dependências)
     ========================================================================== */
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Toca uma frequência com decaimento suave
   */
  function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Web Audio API não inicializada:', e);
    }
  }

  const soundEffects = {
    moveX: () => playTone(520, 'sine', 0.12, 0.12),
    moveO: () => playTone(380, 'sine', 0.12, 0.12),
    themeToggle: () => playTone(620, 'sine', 0.08, 0.06),
    tie: () => {
      // Tom descendente
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {}
    },
    win: () => {
      // Acorde triunfal em arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((note, index) => {
        setTimeout(() => {
          playTone(note, 'triangle', 0.3, 0.12);
        }, index * 90);
      });
    }
  };

  /* ==========================================================================
     4. Módulo de Efeitos Visuais (Confetes & Linha de Vitória)
     ========================================================================== */
  let confettiParticles = [];
  let confettiAnimationId = null;

  function triggerConfetti() {
    const canvas = elements.confettiCanvas;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    confettiParticles = [];
    const colors = ['#003366', '#0056b3', '#38bdf8', '#d97706', '#f59e0b', '#fbbf24', '#10b981'];

    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 120,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 5,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        drag: 0.98,
        opacity: 1
      });
    }

    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.009;

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        confettiAnimationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiAnimationId = null;
      }
    }

    render();
  }

  /**
   * Traça a linha visual contínua sobre as 3 células vitoriosas (UI-10)
   */
  function drawWinningLine(pattern) {
    const firstCell = elements.cells[pattern[0]];
    const lastCell = elements.cells[pattern[2]];
    const gridRect = elements.boardGrid.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();

    // Centro da primeira e última célula relativo ao grid
    const x1 = (firstRect.left + firstRect.width / 2) - gridRect.left;
    const y1 = (firstRect.top + firstRect.height / 2) - gridRect.top;
    const x2 = (lastRect.left + lastRect.width / 2) - gridRect.left;
    const y2 = (lastRect.top + lastRect.height / 2) - gridRect.top;

    const length = Math.hypot(x2 - x1, y2 - y1) + 24; // Leve extensão para visual elegante
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    // Ajuste de início recuado
    const offset = 12;
    const rad = (angle * Math.PI) / 180;
    const startX = x1 - Math.cos(rad) * offset;
    const startY = y1 - Math.sin(rad) * offset;

    const line = elements.winningLine;
    line.style.width = `${length}px`;
    line.style.height = '6px';
    line.style.left = `${startX}px`;
    line.style.top = `${startY}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.classList.add('active');
  }

  function hideWinningLine() {
    elements.winningLine.classList.remove('active');
    elements.winningLine.style.width = '0px';
  }

  /* ==========================================================================
     5. Lógica de Turnos, Verificação de Vitória e CPU
     ========================================================================== */

  function updateStatusUI(message, dotColor = null) {
    elements.statusMessage.textContent = message;
    if (dotColor) {
      elements.statusDot.style.background = dotColor;
    } else {
      elements.statusDot.style.background = gameState.currentPlayer === 'X' 
        ? 'var(--unifor-primary-light)' 
        : 'var(--unifor-accent)';
    }

    // Atualiza destaque no card do jogador da vez
    if (gameState.running) {
      if (gameState.currentPlayer === 'X') {
        elements.cardPlayerX.classList.add('active-turn');
        elements.cardPlayerO.classList.remove('active-turn');
      } else {
        elements.cardPlayerO.classList.add('active-turn');
        elements.cardPlayerX.classList.remove('active-turn');
      }
    } else {
      elements.cardPlayerX.classList.remove('active-turn');
      elements.cardPlayerO.classList.remove('active-turn');
    }
  }

  function checkWinner() {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (
        gameState.options[a] &&
        gameState.options[a] === gameState.options[b] &&
        gameState.options[a] === gameState.options[c]
      ) {
        return { winner: gameState.options[a], pattern };
      }
    }

    if (!gameState.options.includes('')) {
      return { winner: 'tie', pattern: null };
    }

    return null;
  }

  function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'), 10);

    if (!gameState.running || gameState.options[index] !== '' || gameState.isProcessingCPU) {
      return;
    }

    executeMove(index);
  }

  function executeMove(index) {
    // Registra no estado lógico
    gameState.options[index] = gameState.currentPlayer;

    // Atualiza visual da célula
    const cell = elements.cells[index];
    cell.textContent = gameState.currentPlayer;
    cell.classList.add('filled', gameState.currentPlayer === 'X' ? 'cell-x' : 'cell-o');
    cell.disabled = true;

    // Toca som do movimento
    if (gameState.currentPlayer === 'X') {
      soundEffects.moveX();
    } else {
      soundEffects.moveO();
    }

    // Avalia resultado
    const result = checkWinner();

    if (result) {
      handleRoundEnd(result);
    } else {
      // Alterna turno
      gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
      const playerLabel = gameState.currentPlayer === 'X' 
        ? 'Jogador X' 
        : (gameState.mode === 'cpu' ? 'Computador' : 'Jogador O');
      
      updateStatusUI(`Vez do ${playerLabel}`);

      // Se for vez da CPU no modo contra robô
      if (gameState.mode === 'cpu' && gameState.currentPlayer === 'O' && gameState.running) {
        handleCPUTurn();
      }
    }
  }

  function handleCPUTurn() {
    gameState.isProcessingCPU = true;
    updateStatusUI('Computador pensando...', 'var(--unifor-accent)');

    // Intervalo de reflexão de 400ms conforme especificado no CDU A2.3
    setTimeout(() => {
      if (!gameState.running) {
        gameState.isProcessingCPU = false;
        return;
      }

      // Escolhe movimento
      const availableIndices = gameState.options
        .map((val, idx) => (val === '' ? idx : null))
        .filter(val => val !== null);

      if (availableIndices.length > 0) {
        // IA Simples / Estratégica
        const chosenIndex = chooseCPUMove(availableIndices);
        gameState.isProcessingCPU = false;
        executeMove(chosenIndex);
      } else {
        gameState.isProcessingCPU = false;
      }
    }, 400);
  }

  /**
   * Escolha inteligente da CPU:
   * 1. Ganhar se houver chance imediata
   * 2. Bloquear o Jogador X se estiver prestes a vencer
   * 3. Pegar o centro (célula 4) se disponível
   * 4. Movimento aleatório entre as opções restantes
   */
  function chooseCPUMove(available) {
    // 1. Tentar vencer
    for (const idx of available) {
      gameState.options[idx] = 'O';
      if (checkWinner()?.winner === 'O') {
        gameState.options[idx] = '';
        return idx;
      }
      gameState.options[idx] = '';
    }

    // 2. Bloquear X
    for (const idx of available) {
      gameState.options[idx] = 'X';
      if (checkWinner()?.winner === 'X') {
        gameState.options[idx] = '';
        return idx;
      }
      gameState.options[idx] = '';
    }

    // 3. Pegar Centro
    if (available.includes(4)) return 4;

    // 4. Aleatório
    const randomIdx = Math.floor(Math.random() * available.length);
    return available[randomIdx];
  }

  function handleRoundEnd(result) {
    gameState.running = false;

    if (result.winner === 'tie') {
      soundEffects.tie();
      updateStatusUI('Rodada Empatada!', 'var(--tie-color)');

      // Trata MD3 em caso de empate (CDU E1.4)
      if (gameState.format === 'bo3' && gameState.currentRound <= 3) {
        setTimeout(() => {
          resetBoardForNextRound(false); // Não incrementa rodada em empate
        }, 2000);
      }
      return;
    }

    // Vitória de X ou O
    const winnerSymbol = result.winner;
    drawWinningLine(result.pattern);
    triggerConfetti();
    soundEffects.win();

    if (winnerSymbol === 'X') {
      gameState.winsX++;
      elements.scoreX.textContent = gameState.winsX;
    } else {
      gameState.winsO++;
      elements.scoreO.textContent = gameState.winsO;
    }

    const winnerName = winnerSymbol === 'X' 
      ? 'Jogador X' 
      : (gameState.mode === 'cpu' ? 'Computador' : 'Jogador O');

    // Regra do Formato MD3 (CDU A1.7)
    if (gameState.format === 'bo3') {
      if (gameState.winsX === 2 || gameState.winsO === 2) {
        updateStatusUI(`🏆 ${winnerName} é o Campeão da Partida!`, 'var(--success-color)');
      } else if (gameState.currentRound < 3) {
        updateStatusUI(`Vitória de ${winnerName}! Próxima rodada em 2s...`, 'var(--success-color)');
        setTimeout(() => {
          gameState.currentRound++;
          updateRoundDisplay();
          resetBoardForNextRound(true);
        }, 2000);
      } else {
        // Fim da 3ª rodada
        if (gameState.winsX > gameState.winsO) {
          updateStatusUI(`🏆 Jogador X é o Campeão!`, 'var(--success-color)');
        } else if (gameState.winsO > gameState.winsX) {
          const name = gameState.mode === 'cpu' ? 'Computador' : 'Jogador O';
          updateStatusUI(`🏆 ${name} é o Campeão!`, 'var(--success-color)');
        } else {
          updateStatusUI(`Série MD3 terminou empatada!`, 'var(--tie-color)');
        }
      }
    } else {
      // Partida Única (CDU A1.8)
      updateStatusUI(`🎉 Vitória de ${winnerName}!`, 'var(--success-color)');
    }
  }

  function resetBoardForNextRound(advanceRound = true) {
    gameState.options = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.running = true;
    gameState.isProcessingCPU = false;

    hideWinningLine();

    elements.cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.disabled = false;
    });

    updateStatusUI('Vez do Jogador X');
  }

  function resetFullGame() {
    gameState.options = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.running = true;
    gameState.winsX = 0;
    gameState.winsO = 0;
    gameState.currentRound = 1;
    gameState.isProcessingCPU = false;

    elements.scoreX.textContent = '0';
    elements.scoreO.textContent = '0';
    updateRoundDisplay();
    hideWinningLine();

    elements.cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.disabled = false;
    });

    updateStatusUI('Vez do Jogador X');
  }

  function updateRoundDisplay() {
    if (gameState.format === 'bo3') {
      elements.roundDisplay.textContent = `${gameState.currentRound}/3`;
    } else {
      elements.roundDisplay.textContent = '1/1';
    }
  }

  /* ==========================================================================
     6. Modo Noturno / Gerenciamento de Tema
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('unifor_ttt_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('unifor_ttt_theme', isDark ? 'dark' : 'light');
    soundEffects.themeToggle();
  }

  /* ==========================================================================
     7. Eventos e Inicialização
     ========================================================================== */

  // Seletor de Modo (PVP vs CPU)
  elements.modeSelect.addEventListener('change', (e) => {
    gameState.mode = e.target.value;
    elements.playerOLabel.textContent = gameState.mode === 'cpu' ? 'COMPUTADOR' : 'JOGADOR O';
    resetFullGame();
  });

  // Seletor de Formato (Única vs MD3)
  elements.formatSelect.addEventListener('change', (e) => {
    gameState.format = e.target.value;
    resetFullGame();
  });

  // Cliques no Tabuleiro
  elements.cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  // Botão Reiniciar
  elements.restartBtn.addEventListener('click', () => {
    resetFullGame();
  });

  // Botão de Tema (Modo Noturno)
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Redimensionamento de janela (recálculo de linha e canvas de confetes)
  window.addEventListener('resize', () => {
    if (elements.confettiCanvas) {
      elements.confettiCanvas.width = window.innerWidth;
      elements.confettiCanvas.height = window.innerHeight;
    }
  });

  // Inicialização
  initTheme();
  updateRoundDisplay();
  updateStatusUI('Vez do Jogador X');

})();
