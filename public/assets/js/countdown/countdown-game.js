(() => {
  "use strict";

  const words = window.gmCountdownWords || [];
  const lettersArea = document.querySelector("[data-countdown-letters]");
  const builtWordArea = document.querySelector("[data-built-word]");
  const statusEl = document.querySelector("[data-countdown-status]");
  const dictionaryStatus = document.querySelector("[data-dictionary-status]");
  const wordLength = document.querySelector("[data-word-length]");
  const clearButton = document.querySelector("[data-clear]");
  const bankButton = document.querySelector("[data-bank]");
  const startButton = document.querySelector("[data-start]");
  const clock = document.querySelector("[data-clock]");
  const clockHand = document.querySelector("[data-clock-hand]");
  const clockValue = document.querySelector("[data-clock-value]");
  const clockCaption = document.querySelector("[data-clock-caption]");
  const phaseLabel = document.querySelector("[data-phase-label]");
  const gameLabel = document.querySelector("[data-game-label]");
  const gameDate = document.querySelector("[data-game-date]");
  const bestWrap = document.querySelector("[data-best-wrap]");
  const bestWordEl = document.querySelector("[data-best-word]");
  const audio = document.getElementById("countdown-audio");
  const toast = document.querySelector("[data-countdown-toast]");

  if (!words.length || !lettersArea || !builtWordArea) return;

  const scoreLabels = [
    [9, "Super Star!"],
    [8, "Brilliant"],
    [7, "Very Good"],
    [6, "Good"],
    [5, "Fair"],
    [4, "Not Bad"],
    [0, "Meh"]
  ];

  let spellchecker = null;
  let gameType = "daily";
  let challengeWord = "";
  let shuffledLetters = [];
  let selectedIndexes = [];
  let currentWord = "";
  let bestWord = "";
  let running = false;
  let totalRemaining = 45;
  let timer = null;

  function formatDate() {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(new Date());
  }

  function dailyIndex() {
    const now = new Date();
    return (now.getMonth() * 31 + now.getDate()) % words.length;
  }

  function chooseChallenge(type) {
    return type === "daily"
      ? words[dailyIndex()]
      : words[Math.floor(Math.random() * words.length)];
  }

  function shuffled(word) {
    const array = [...word];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => { toast.hidden = true; }, 180);
    }, 1500);
  }

  function setStatus(message, tone = "") {
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  }

  function updateBuiltWord() {
    if (currentWord) {
      builtWordArea.innerHTML = "";
      [...currentWord].forEach((letter) => {
        const span = document.createElement("span");
        span.textContent = letter;
        builtWordArea.appendChild(span);
      });
    } else {
      builtWordArea.innerHTML = "<span>Choose letters to begin</span>";
    }

    wordLength.textContent = `${currentWord.length} ${currentWord.length === 1 ? "letter" : "letters"}`;
    clearButton.disabled = !running || currentWord.length === 0;
    bankButton.disabled = !running || currentWord.length < 3 || !spellchecker;
  }

  function renderLetters() {
    lettersArea.innerHTML = "";
    shuffledLetters.forEach((letter, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "countdown-letter";
      button.textContent = letter;
      button.dataset.index = String(index);
      button.disabled = !running || selectedIndexes.includes(index);
      button.addEventListener("click", () => chooseLetter(index));
      lettersArea.appendChild(button);
    });
  }

  function chooseLetter(index) {
    if (!running || selectedIndexes.includes(index)) return;
    selectedIndexes.push(index);
    currentWord += shuffledLetters[index];
    renderLetters();
    updateBuiltWord();
  }

  function clearWord() {
    currentWord = "";
    selectedIndexes = [];
    renderLetters();
    updateBuiltWord();
    setStatus(totalRemaining > 15 ? "Keep building." : "Final 15 seconds — finish your word.");
  }

  function bankWord() {
    if (!spellchecker || currentWord.length < 3) return;

    const checkWord = currentWord.toLowerCase();
    const valid = spellchecker.check(checkWord);

    if (!valid) {
      setStatus("Not in the dictionary.", "bad");
      builtWordArea.classList.remove("is-invalid");
      void builtWordArea.offsetWidth;
      builtWordArea.classList.add("is-invalid");
      return;
    }

    if (currentWord.length >= bestWord.length) {
      bestWord = currentWord;
      bestWrap.hidden = false;
      bestWordEl.textContent = `${bestWord} · ${bestWord.length} letters`;
    }

    const message =
      currentWord.length === 9 ? `${currentWord} — brilliant!`
      : currentWord.length > 6 ? `${currentWord} — ${currentWord.length} letters!`
      : `${currentWord} banked.`;

    setStatus(message, "good");
    showToast(message);
    clearWord();
  }

  function updateClock() {
    const elapsed = 45 - totalRemaining;
    const rotation = elapsed / 45 * 270;
    clock.style.setProperty("--progress", `${elapsed / 45 * 100}%`);
    clockHand.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

    const display = Math.max(0, Math.ceil(totalRemaining));
    clockValue.textContent = display;

    if (totalRemaining > 15) {
      phaseLabel.textContent = "MUSIC PLAYING";
      clockCaption.textContent = "SECONDS";
      clock.dataset.phase = "main";
    } else {
      phaseLabel.textContent = "FINAL 15";
      clockCaption.textContent = "SECONDS LEFT";
      clock.dataset.phase = totalRemaining <= 5 ? "danger" : "finish";
    }
  }

  function tick() {
    totalRemaining -= 0.1;
    updateClock();

    if (totalRemaining <= 15 && totalRemaining > 14.9) {
      setStatus("Music's finished — you have 15 seconds to finish.", "warning");
    }

    if (totalRemaining <= 0) {
      endGame();
    }
  }

  function startGame() {
    if (running || !spellchecker) return;

    running = true;
    totalRemaining = 45;
    bestWord = "";
    bestWrap.hidden = true;
    currentWord = "";
    selectedIndexes = [];
    shuffledLetters = shuffled(challengeWord);

    renderLetters();
    updateBuiltWord();
    startButton.disabled = true;
    startButton.classList.add("is-running");
    document.querySelectorAll("[data-restart-daily],[data-random-game]").forEach((button) => button.disabled = true);

    setStatus("Go! Find the longest word you can.", "good");
    updateClock();

    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (_) {}

    timer = window.setInterval(tick, 100);
  }

  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (_) {}
  }

  function gradeFor(length) {
    return scoreLabels.find(([minimum]) => length >= minimum) || scoreLabels.at(-1);
  }

  function endGame() {
    if (!running) return;
    running = false;
    stopTimer();
    totalRemaining = 0;
    updateClock();

    renderLetters();
    updateBuiltWord();
    startButton.disabled = false;
    startButton.classList.remove("is-running");
    document.querySelectorAll("[data-restart-daily],[data-random-game]").forEach((button) => button.disabled = false);

    setStatus("Time's up.");

    const resultDialog = document.querySelector("[data-result-dialog]");
    const resultHeading = document.querySelector("[data-result-heading]");
    const resultCopy = document.querySelector("[data-result-copy]");
    const resultGrade = document.querySelector("[data-result-grade]");
    const bestLength = bestWord.length;
    const [, grade] = gradeFor(bestLength);

    resultHeading.textContent = bestWord ? `${grade}` : "Time's up.";
    resultCopy.innerHTML = bestWord
      ? `Your best word was <strong>${bestWord}</strong> — ${bestLength} letters.`
      : "You didn't bank a word this time.";

    resultGrade.innerHTML = scoreLabels.map(([minimum, label]) => {
      const display = minimum === 0 ? "3 or less" : String(minimum);
      const active =
        minimum === 0 ? bestLength <= 3
        : bestLength === minimum;
      return `<div class="${active ? "is-active" : ""}"><strong>${display}</strong><span>${label}</span></div>`;
    }).join("");

    resultDialog?.showModal();
  }

  function resetGame(type = "daily") {
    stopTimer();
    running = false;
    gameType = type;
    challengeWord = chooseChallenge(type);
    shuffledLetters = [..."COUNTDOWN"];
    selectedIndexes = [];
    currentWord = "";
    bestWord = "";
    totalRemaining = 45;

    if (gameLabel) gameLabel.textContent = type === "daily" ? "DAILY CHALLENGE" : "RANDOM CHALLENGE";
    if (gameDate) gameDate.textContent = type === "daily" ? formatDate() : "Fresh word every time";

    bestWrap.hidden = true;
    startButton.disabled = !spellchecker;
    startButton.classList.remove("is-running");
    document.querySelectorAll("[data-restart-daily],[data-random-game]").forEach((button) => button.disabled = false);

    setStatus(type === "daily" ? "Ready for today's nine-letter challenge?" : "Ready for a fresh nine-letter challenge?");
    renderLetters();
    updateBuiltWord();
    updateClock();
  }

  clearButton.addEventListener("click", clearWord);
  bankButton.addEventListener("click", bankWord);
  startButton.addEventListener("click", startGame);

  document.querySelector("[data-restart-daily]")?.addEventListener("click", () => {
    resetGame("daily");
    document.querySelector("#play")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-random-game]")?.addEventListener("click", () => {
    resetGame("random");
    document.querySelector("#play")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const instructionsDialog = document.querySelector("[data-instructions-dialog]");
  document.querySelectorAll("[data-open-instructions]").forEach((button) => {
    button.addEventListener("click", () => instructionsDialog?.showModal());
  });
  document.querySelectorAll("[data-close-instructions]").forEach((button) => {
    button.addEventListener("click", () => instructionsDialog?.close());
  });

  const resultDialog = document.querySelector("[data-result-dialog]");
  document.querySelectorAll("[data-close-result]").forEach((button) => {
    button.addEventListener("click", () => resultDialog?.close());
  });

  [instructionsDialog, resultDialog].forEach((dialog) => {
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  // Load Craig's Hunspell-based UK dictionary implementation.
  if (typeof Spellchecker !== "undefined") {
    Spellchecker.createWithDict(
      {
        aff: "/assets/dict/countdown/en_GB.aff",
        dic: "/assets/dict/countdown/en_GB.dic"
      },
      (error, instance) => {
        if (error) {
          dictionaryStatus.textContent = "Dictionary unavailable";
          dictionaryStatus.dataset.tone = "bad";
          setStatus("The dictionary failed to load. Please refresh the page.", "bad");
          return;
        }

        spellchecker = instance;
        dictionaryStatus.textContent = "Dictionary ready";
        dictionaryStatus.dataset.tone = "good";
        startButton.disabled = false;
        updateBuiltWord();
      }
    );
  }

  // Existing Grammar Monster VI/VLI ad slots.
  const adSlots = ["vi_342100586", "vi_342112530", "vi_342112533", "vi_342112534"];
  if (window.vitag) {
    (window.vitag.Init = window.vitag.Init || []).push(() => {
      adSlots.forEach((slot) => {
        try { window.viAPItag?.display(slot); } catch (_) {}
      });
    });
  }

  document.querySelectorAll("[data-countdown-ad-shell]").forEach((shell) => {
    const ad = shell.querySelector(".adsbyvli");
    const placeholder = shell.querySelector(".countdown-ad-placeholder");
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

  resetGame("daily");
})();
