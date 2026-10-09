# TIC TAC TOE — Modern Strategic Board Game

A sleek, modern Tic Tac Toe web game crafted with a futuristic developer-themed aesthetic. Built entirely using semantic **HTML5**, modern **CSS3**, and modular **Vanilla JavaScript** without external libraries or frameworks.

![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-00f0ff?style=flat-square)
![Design](https://img.shields.io/badge/Aesthetic-Futuristic%20Cyber%20Dark-a855f7?style=flat-square)
![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%20AA%20Compliant-10b981?style=flat-square)

---

## 🎮 Features

### 1. Game Modes
* **Pass & Play (2 Players)**: Local two-player head-to-head match on the same device.
* **vs Computer (AI Opponent)**:
  * **Smart (Minimax Algorithm)**: Computes mathematically optimal defensive and offensive moves, ensuring an unbeatable strategic opponent.
  * **Casual**: Blends smart moves with randomized play for balanced, accessible gameplay.

### 2. Core Game Logic
* **Full Combination Detection**: Instantly checks all 8 win states (3 rows, 3 columns, 2 diagonals).
* **Winning Line Highlight**: Animated neon emerald pulse along the three victorious cells.
* **Draw / Stalemate Detection**: Flags draws when all 9 cells are occupied without a victor.
* **State Locking**: Automatically prevents extra moves once a round finishes.
* **Seamless Round Cycling**: Start subsequent rounds instantly without refreshing the page.

### 3. Scoreboard & State Persistence
* Live scoreboard tracking **Player X**, **Player O** (or **Computer**), and **Draws**.
* Scores persist across multiple rounds.
* Dedicated **"Reset Scores"** action to zero all counters on demand.

### 4. Audio Feedback (Web Audio API)
* Integrated browser synthesizer creating crisp cybernetic audio cues:
  * Move placement blips (tuned frequencies for X and O).
  * 3-note ascending victory fanfare.
  * Low dual-tone stalemate chord.
  * UI click feedback.
* **Audio Mute/Unmute toggle** in the top header (no external audio files required).

### 5. Accessibility & Keyboard Navigation
* Full keyboard navigation across the 3×3 grid using `Arrow keys` and `Enter` / `Space`.
* ARIA grid roles (`role="grid"`, `role="gridcell"`) and dynamic labels.
* `aria-live="polite"` status region announcing turns and match conclusions for screen readers.
* `prefers-reduced-motion` responsive overrides.

---

## 🎨 Design & UI Philosophy

* **Obsidian Canvas**: Deep dark-mode base (`#07090e`) with layered glassmorphism cards (`backdrop-filter: blur(20px)`).
* **High-Contrast Neon Accents**:
  * **Player X**: Electric Cyan (`#00f0ff`) with radiant outer glow.
  * **Player O**: Vibrant Purple (`#a855f7`) with concentric ring styling.
  * **Victory State**: Neon Emerald (`#10b981`) celebration highlights.
* **Ambient Background**: Pure CSS GPU-accelerated floating glow orbs and subtle cyber grid matrix with zero CPU overhead.
* **Responsive Layout**: Fluid CSS Grid architecture that scales seamlessly across smartphones, tablets, laptops, and ultra-wide displays.

---

## 📁 File Structure

```text
├── index.html     # Semantic structure, SVG icons, modal dialogs, and SEO tags
├── style.css      # CSS variables, cyber grid, glassmorphism, animations, media queries
├── script.js      # Game state machine, Minimax AI, Web Audio API synthesis, event bus
└── README.md      # Project documentation and setup guide
```

---

## 🚀 Getting Started

No package manager or build step is required to run the game.

### Method 1: Direct Browser Launch
1. Clone or download the repository to your computer.
2. Double-click `index.html` to open it in any modern browser (Chrome, Safari, Edge, Firefox).

### Method 2: Visual Studio Code with Live Server
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by *Ritwick Dey*) from the Extensions marketplace (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Right-click `index.html` in the file explorer and select **"Open with Live Server"**.
4. The game will automatically launch at `http://127.0.0.1:5500`.

### Method 3: Using Vite (Optional Dev Server)
If you have Node.js installed in this repository:
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

---

## 🧠 How the Smart AI Works

The single-player **Smart AI** uses the classical **Minimax Algorithm**:
1. Evaluates all possible future board states recursively.
2. Assigns a score heuristic: `+10 - depth` for AI wins, `depth - 10` for human wins, and `0` for draws.
3. Maximizes the AI's payoff while minimizing the player's potential advantage.
4. Shortcuts immediate offensive wins and immediate defensive blocks for lightning-fast responsiveness ($\le 380\text{ms}$).

---

## 📄 License

Open-source under the [Apache 2.0 License](LICENSE). Designed for strategic minds.
