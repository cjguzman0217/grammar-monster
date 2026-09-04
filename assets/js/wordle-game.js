(() => {
  "use strict";

  const board = document.querySelector("[data-wordle-board]");
  const keyboard = document.querySelector("[data-wordle-keyboard]");
  if (!board || !keyboard || typeof ansOptions === "undefined") return;

  const statusEl = document.querySelector("[data-wordle-status]");
  const dateEl = document.querySelector("[data-game-date]");
  const gameLabel = document.querySelector("[data-game-label]");
  const shareResult = document.querySelector("[data-share-result]");
  const toast = document.querySelector("[data-wordle-toast]");
  const modeButtons = [...document.querySelectorAll("[data-wordle-mode]")];
  const modeCaptions = [...document.querySelectorAll("[data-mode-caption]")];

  const rows = 6;
  const cols = 5;
  const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const rank = { absent: 1, present: 2, correct: 3 };

  let mode = localStorage.getItem("gm-wordle-mode") === "learner" ? "learner" : "advanced";
  let gameType = "daily";
  let solution = "";
  let guesses = [];
  let currentGuess = "";
  let gameOver = false;
  let isRevealing = false;
  let lastResult = [];

  const validWords = new Set([...guessOptions, ...ansOptions].map((word) => word.toLowerCase()));

  function dayOfYear(date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function dailySolution() {
    const day = dayOfYear();
    if (mode === "learner") return learnersList[day % learnersList.length];
    return ansOptions[day % ansOptions.length];
  }

  function randomSolution() {
    const pool = mode === "learner" ? learnersList : ansOptions;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function storageKey() {
    const now = new Date();
    return `gm-wordle:${now.getFullYear()}:${dayOfYear(now)}:${mode}`;
  }

  function formatDate() {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(new Date());
  }

  function announce(message, temporary = false) {
    if (statusEl) statusEl.textContent = message;
    if (temporary) {
      window.setTimeout(() => {
        if (!gameOver && statusEl) {
          statusEl.textContent = gameType === "daily"
            ? `Find the secret word for ${formatDate()}.`
            : "Find the secret word.";
        }
      }, 1800);
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => { toast.hidden = true; }, 180);
    }, 1800);
  }

  function renderBoard() {
    board.innerHTML = "";
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = document.createElement("div");
        tile.className = "wordle-tile";
        tile.dataset.row = String(row);
        tile.dataset.col = String(col);
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);
        tile.innerHTML = '<span class="wordle-tile__front"></span><span class="wordle-tile__back"></span>';
        board.appendChild(tile);
      }
    }
  }

  function renderKeyboard() {
    keyboard.innerHTML = "";

    keyboardRows.forEach((letters, rowIndex) => {
      const row = document.createElement("div");
      row.className = "wordle-keyboard__row";

      if (rowIndex === 2) {
        row.appendChild(makeKey("ENTER", "enter", true));
      }

      [...letters].forEach((letter) => {
        row.appendChild(makeKey(letter, letter));
      });

      if (rowIndex === 2) {
        row.appendChild(makeKey("DEL", "delete", true));
      }

      keyboard.appendChild(row);
    });
  }

  function makeKey(label, value, wide = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `wordle-key${wide ? " wordle-key--wide" : ""}`;
    button.dataset.key = value;
    button.textContent = label;
    button.setAttribute("aria-label", value === "delete" ? "Delete letter" : value === "enter" ? "Submit guess" : `Letter ${label}`);
    button.addEventListener("click", () => handleKey(value));
    return button;
  }

  function tileAt(row, col) {
    return board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  function updateCurrentGuess() {
    const row = guesses.length;
    for (let col = 0; col < cols; col++) {
      const tile = tileAt(row, col);
      if (!tile) continue;
      const front = tile.querySelector(".wordle-tile__front");
      const back = tile.querySelector(".wordle-tile__back");
      const letter = currentGuess[col]?.toUpperCase() || "";
      front.textContent = letter;
      back.textContent = letter;
      tile.classList.toggle("has-letter", Boolean(letter));
    }
  }

  function evaluate(guess) {
    const result = Array(cols).fill("absent");
    const remaining = {};

    for (let i = 0; i < cols; i++) {
      if (guess[i] === solution[i]) {
        result[i] = "correct";
      } else {
        remaining[solution[i]] = (remaining[solution[i]] || 0) + 1;
      }
    }

    for (let i = 0; i < cols; i++) {
      if (result[i] === "correct") continue;
      const letter = guess[i];
      if (remaining[letter] > 0) {
        result[i] = "present";
        remaining[letter]--;
      }
    }

    return result;
  }

  function paintGuess(row, guess, result, animate = true) {
    guess.split("").forEach((letter, col) => {
      const tile = tileAt(row, col);
      if (!tile) return;

      const front = tile.querySelector(".wordle-tile__front");
      const back = tile.querySelector(".wordle-tile__back");
      front.textContent = letter.toUpperCase();
      back.textContent = letter.toUpperCase();
      tile.classList.add("has-letter");

      const apply = () => {
        tile.dataset.state = result[col];
        tile.classList.add("is-revealed");
        updateKeyboard(letter, result[col]);
      };

      if (animate) {
        window.setTimeout(apply, col * 170);
      } else {
        apply();
      }
    });
  }

  function updateKeyboard(letter, state) {
    const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
    if (!key) return;
    const current = key.dataset.state;
    if (!current || rank[state] > rank[current]) key.dataset.state = state;
  }

  function saveDaily() {
    if (gameType !== "daily") return;
    localStorage.setItem(storageKey(), JSON.stringify({
      guesses,
      gameOver
    }));
  }

  function restoreDaily() {
    if (gameType !== "daily") return false;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey()) || "null");
      if (!saved || !Array.isArray(saved.guesses)) return false;

      guesses = saved.guesses.filter((guess) => typeof guess === "string" && guess.length === 5).slice(0, rows);
      guesses.forEach((guess, row) => {
        paintGuess(row, guess, evaluate(guess), false);
      });

      gameOver = Boolean(saved.gameOver);
      if (gameOver && guesses.length) {
        const won = guesses.at(-1) === solution;
        finishGame(won, true);
      }
      return true;
    } catch {
      return false;
    }
  }

  function finishGame(won, restored = false) {
    gameOver = true;
    lastResult = guesses.map((guess) => evaluate(guess));
    shareResult.hidden = false;

    if (won) {
      announce(`Cracked it! ${guesses.length === 1 ? "First try." : `${guesses.length} tries.`}`);
      if (!restored) showToast("Cracked it! 🎉");
    } else {
      announce(`It was ${solution.toUpperCase()}.`);
      if (!restored) showToast(`It was ${solution.toUpperCase()}.`);
    }
    saveDaily();
  }

  function submitGuess() {
    if (currentGuess.length !== cols) {
      announce("Not enough letters.", true);
      shakeCurrentRow();
      return;
    }

    const guess = currentGuess.toLowerCase();
    if (!validWords.has(guess)) {
      announce("Not in the word list.", true);
      shakeCurrentRow();
      return;
    }

    isRevealing = true;
    const row = guesses.length;
    const result = evaluate(guess);
    guesses.push(guess);
    currentGuess = "";
    paintGuess(row, guess, result, true);

    const won = guess === solution;
    const lost = !won && guesses.length === rows;

    window.setTimeout(() => {
      isRevealing = false;
      if (won || lost) {
        finishGame(won);
      } else {
        announce(gameType === "daily"
          ? `Find the secret word for ${formatDate()}.`
          : "Find the secret word."
        );
        saveDaily();
      }
    }, 880);
  }

  function shakeCurrentRow() {
    const row = guesses.length;
    const tiles = [...board.querySelectorAll(`[data-row="${row}"]`)];
    tiles.forEach((tile) => {
      tile.classList.remove("is-shaking");
      void tile.offsetWidth;
      tile.classList.add("is-shaking");
    });
  }

  function handleKey(key) {
    if (gameOver || isRevealing) return;

    if (key === "enter") {
      submitGuess();
      return;
    }

    if (key === "delete") {
      currentGuess = currentGuess.slice(0, -1);
      updateCurrentGuess();
      return;
    }

    if (/^[A-Z]$/.test(key) && currentGuess.length < cols) {
      currentGuess += key.toLowerCase();
      updateCurrentGuess();

      const tile = tileAt(guesses.length, currentGuess.length - 1);
      tile?.classList.add("is-popping");
      window.setTimeout(() => tile?.classList.remove("is-popping"), 120);
    }
  }

  function updateModeUI() {
    modeButtons.forEach((button) => {
      const active = button.dataset.wordleMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    modeCaptions.forEach((caption) => {
      caption.textContent = mode === "learner" ? "Learner mode" : "Advanced mode";
    });
  }

  function resetVisuals() {
    guesses = [];
    currentGuess = "";
    gameOver = false;
    isRevealing = false;
    lastResult = [];
    shareResult.hidden = true;
    renderBoard();
    renderKeyboard();
  }

  function startGame(type = "daily", { forceRestart = false } = {}) {
    gameType = type;
    resetVisuals();
    solution = type === "daily" ? dailySolution() : randomSolution();

    if (gameLabel) gameLabel.textContent = type === "daily" ? "DAILY GAME" : "RANDOM GAME";
    if (dateEl) dateEl.textContent = type === "daily" ? formatDate() : "Fresh word every time";

    announce(type === "daily"
      ? `Find the secret word for ${formatDate()}.`
      : "Find the secret word."
    );

    if (type === "daily" && forceRestart) localStorage.removeItem(storageKey());
    if (type === "daily" && !forceRestart) restoreDaily();
  }

  function shareText() {
    const won = guesses.at(-1) === solution;
    const heading = `Grammar Monster Wordle ${won ? `${guesses.length}/6` : "X/6"}${mode === "learner" ? " · Learner" : ""}`;
    const grid = lastResult.map((result) =>
      result.map((state) => state === "correct" ? "🟩" : state === "present" ? "🟧" : "⬛").join("")
    ).join("\n");
    return `${heading}\n\n${grid}\n\n${window.location.href}`;
  }

  async function shareGame() {
    const text = shareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Grammar Monster Wordle", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("Result copied.");
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Couldn't share the result.");
    }
  }

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

    if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
    if (event.key === "Enter") handleKey("enter");
    if (event.key === "Backspace") handleKey("delete");
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.wordleMode;
      if (!nextMode || nextMode === mode) return;
      mode = nextMode;
      localStorage.setItem("gm-wordle-mode", mode);
      updateModeUI();
      startGame(gameType);
    });
  });

  document.querySelector("[data-restart-daily]")?.addEventListener("click", () => {
    startGame("daily", { forceRestart: true });
    document.querySelector("#play")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-random-game]")?.addEventListener("click", () => {
    startGame("random");
    document.querySelector("#play")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  shareResult?.addEventListener("click", shareGame);

  const instructionsDialog = document.querySelector("[data-instructions-dialog]");
  document.querySelectorAll("[data-open-instructions]").forEach((button) => {
    button.addEventListener("click", () => instructionsDialog?.showModal());
  });
  document.querySelectorAll("[data-close-instructions]").forEach((button) => {
    button.addEventListener("click", () => instructionsDialog?.close());
  });

  const commonDialog = document.querySelector("[data-common-dialog]");
  const commonList = document.querySelector("[data-common-list]");
  document.querySelector("[data-show-common]")?.addEventListener("click", () => {
    if (commonList && !commonList.children.length) {
      learnersList.forEach((word) => {
        const span = document.createElement("span");
        span.textContent = word;
        commonList.appendChild(span);
      });
    }
    commonDialog?.showModal();
  });
  document.querySelectorAll("[data-close-common]").forEach((button) => {
    button.addEventListener("click", () => commonDialog?.close());
  });

  [instructionsDialog, commonDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  // Existing Grammar Monster VI/VLI slots.
  const adSlots = ["vi_342100586", "vi_342112530", "vi_342112533", "vi_342112534"];
  if (window.vitag) {
    (window.vitag.Init = window.vitag.Init || []).push(() => {
      adSlots.forEach((slot) => {
        try { window.viAPItag?.display(slot); } catch (_) {}
      });
    });
  }

  document.querySelectorAll("[data-wordle-ad-shell]").forEach((shell) => {
    const ad = shell.querySelector(".adsbyvli");
    const placeholder = shell.querySelector(".wordle-ad-placeholder");
    if (!ad || !placeholder) return;

    const update = () => {
      const live = Boolean(ad.querySelector("iframe") || ad.children.length);
      placeholder.hidden = live;
      shell.classList.toggle("has-live-ad", live);
    };

    new MutationObserver(update).observe(ad, { childList: true, subtree: true });
    window.setTimeout(update, 1800);
    window.setTimeout(update, 4200);
  });

  updateModeUI();
  startGame("daily");
})();