/*
README (GitHub Pages deploy):
1) Commit these files to a repository root (or /docs).
2) In GitHub repo settings, open Pages and set source to main branch /(root) (or /docs).
3) Wait for deployment URL, e.g. https://<user>.github.io/<repo>/.
4) Open the site in iOS Safari and use "Add to Home Screen" for app-like experience.
*/

const CONFIG = {
  levels: [
    { id: 1, name: "Tap-to-catch", token: "4" },
    { id: 2, name: "Memory match", token: "7" },
    { id: 3, name: "Potion order", token: "1" },
    { id: 4, name: "Wand trace", token: "9" },
    { id: 5, name: "Word scramble", token: "3" },
    { id: 6, name: "Food polaroids", token: "8" },
    { id: 7, name: "Final vault", token: "★" }
  ],
  loveNotes: {
    1: "Dear Esther, your smile is brighter than 100 glow-lanterns in class.",
    2: "You always remember little things, and that makes my heart feel at home.",
    3: "Our days mix together like a perfect potion: sweet, warm, and a little silly.",
    4: "Even on hard days, your voice feels like a gentle spell of courage.",
    5: "I love how you laugh before I finish my joke. That's true magic.",
    6: "Every meal with you is a memory card I'll keep forever.",
    bonus: "Secret unlocked: You found the hidden academy star. Proud of you!"
  },
  scramble: {
    phrase: "MY COZY SPELL",
    hint: "A phrase about warmth and magic."
  },
  potionOrder: ["Moonleaf", "Sunberry", "Stardust"],
  foods: [
    {
      id: "canai",
      title: "Canai Morning",
      caption: "Flaky comfort before any quest.",
      img: "assets/img/canai.svg"
    },
    {
      id: "pizza",
      title: "Pizza Pause",
      caption: "Cheesy circles of joy.",
      img: "assets/img/pizza.svg"
    },
    {
      id: "indomie",
      title: "Indomie Night",
      caption: "Late-night noodle power-up.",
      img: "assets/img/indomie.svg"
    },
    {
      id: "tiramisu",
      title: "Tiramisu Treat",
      caption: "Soft and sweet victory dessert.",
      img: "assets/img/tiramisu.svg"
    }
  ],
  vaultCode: "4719",
  useTokensFromLevels: [1, 2, 3, 4],
  sfx: {
    tap: "assets/sfx/tap.mp3",
    success: "assets/sfx/success.mp3",
    unlock: "assets/sfx/unlock.mp3",
    modal: "assets/sfx/modal.mp3"
  }
};

const STORAGE_KEY = "monsterAcademySaveV1";
const DEFAULT_SAVE = {
  unlockedLevel: 1,
  completed: {},
  notesUnlocked: {},
  settings: {
    soundOn: true,
    handedness: "right",
    reducedMotionOverride: false
  },
  secretTaps: 0,
  secretUnlocked: false,
  foodViewed: {},
  finalUnlocked: false,
  hasInteracted: false
};

const state = loadState();
const els = {
  app: document.getElementById("app"),
  screenRoot: document.getElementById("screenRoot"),
  toast: document.getElementById("toast"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalTitle: document.getElementById("modalTitle"),
  modalContent: document.getElementById("modalContent"),
  modalCloseBtn: document.getElementById("modalCloseBtn")
};

const audio = createAudioManager();
let activeScreen = "intro";
let activeLevel = null;
let memoryOpen = [];
let memoryMatches = 0;
let potionSlots = [];
let tracePoints = [];
let traceDrawing = false;
let scrambleAnswer = "";
let foodSeen = new Set(Object.keys(state.foodViewed || {}));

bootstrap();

function bootstrap() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || state.settings.reducedMotionOverride) {
    document.body.classList.add("reduced-motion");
  }
  applyHandedness();
  bindGlobalEvents();
  renderScreen("intro");
}

function bindGlobalEvents() {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      safeInteract();
      renderScreen(btn.dataset.nav);
    });
  });

  document.getElementById("menuBtn").addEventListener("click", () => {
    safeInteract();
    showToast("Tip: Complete levels to unlock notes ✨");
  });

  els.modalCloseBtn.addEventListener("click", closeModal);
  els.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });
}

function safeInteract() {
  if (!state.hasInteracted) {
    state.hasInteracted = true;
    audio.unlock();
    saveState();
  }
  audio.play("tap");
}

function renderScreen(name) {
  activeScreen = name;
  activeLevel = null;
  updateNavActive(name);

  if (name === "intro") return renderIntro();
  if (name === "levels") return renderLevelSelect();
  if (name === "notes") return renderNotes();
  if (name === "settings") return renderSettings();
  if (name === "final") return renderFinalReveal();
}

function updateNavActive(name) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === name);
  });
}

function renderIntro() {
  els.screenRoot.innerHTML = `
    <section class="card grid">
      <h2>Welcome, Esther 🌙</h2>
      <p>
        Baba prepared a tiny Monster Academy birthday quest for you. Each class you finish unlocks
        a Love Note. No timers. Infinite retries. Cozy only.
      </p>
      <div class="align-primary">
        <button id="startJourney" class="primary-btn">Start Journey</button>
      </div>
    </section>
  `;

  document.getElementById("startJourney").addEventListener("click", () => {
    safeInteract();
    renderScreen("levels");
  });
}

function renderLevelSelect() {
  const levelCards = CONFIG.levels
    .map((level) => {
      const locked = level.id > state.unlockedLevel;
      const done = !!state.completed[level.id];
      return `
        <button class="level-btn ${locked ? "locked" : ""}" data-level="${level.id}" ${
        locked ? "disabled" : ""
      }>
          <span>Level ${level.id}: ${level.name}</span>
          <span>${done ? "✓" : locked ? "🔒" : "▶"}</span>
        </button>
      `;
    })
    .join("");

  els.screenRoot.innerHTML = `
    <section class="card grid">
      <h2>Choose your class</h2>
      <div class="grid level-grid">${levelCards}</div>
      <div class="setting-row">
        <small>Secret star?</small>
        <button id="secretStar" class="secret-star" aria-label="Secret star">⭐</button>
      </div>
    </section>
  `;

  els.screenRoot.querySelectorAll("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      safeInteract();
      renderLevel(Number(btn.dataset.level));
    });
  });

  document.getElementById("secretStar").addEventListener("click", () => {
    safeInteract();
    state.secretTaps += 1;
    if (state.secretTaps >= 5 && !state.secretUnlocked) {
      state.secretUnlocked = true;
      showToast("Sparkle! A secret note was unlocked.");
      audio.play("unlock");
    }
    saveState();
  });
}

function renderNotes() {
  const notes = CONFIG.levels
    .filter((lvl) => lvl.id <= 6)
    .map((lvl) => {
      const unlocked = !!state.notesUnlocked[lvl.id];
      return `
      <article class="note-item ${unlocked ? "" : "locked"}">
        <h3>Love Note #${lvl.id}</h3>
        <p>${unlocked ? CONFIG.loveNotes[lvl.id] : "Locked note... complete this level first."}</p>
      </article>`;
    })
    .join("");

  const bonus = state.secretUnlocked
    ? `<article class="note-item"><h3>Secret Note ⭐</h3><p>${CONFIG.loveNotes.bonus}</p></article>`
    : "";

  els.screenRoot.innerHTML = `<section class="card grid"><h2>Love Notes</h2>${notes}${bonus}</section>`;
}

function renderSettings() {
  els.screenRoot.innerHTML = `
    <section class="card grid">
      <h2>Settings</h2>
      <div class="setting-row">
        <span>Sound</span>
        <button id="soundToggle" class="secondary-btn toggle">${state.settings.soundOn ? "On" : "Off"}</button>
      </div>
      <div class="setting-row">
        <span>Handedness</span>
        <button id="handToggle" class="secondary-btn toggle">${
          state.settings.handedness === "right" ? "Right-handed" : "Left-handed"
        }</button>
      </div>
      <button id="resetBtn" class="secondary-btn" style="background:${"var(--danger)"};color:white;">Reset Progress</button>
      <small>Audio plays only after first touch (iOS-safe).</small>
    </section>
  `;

  document.getElementById("soundToggle").addEventListener("click", () => {
    safeInteract();
    state.settings.soundOn = !state.settings.soundOn;
    saveState();
    renderSettings();
  });

  document.getElementById("handToggle").addEventListener("click", () => {
    safeInteract();
    state.settings.handedness = state.settings.handedness === "right" ? "left" : "right";
    applyHandedness();
    saveState();
    renderSettings();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    safeInteract();
    if (confirm("Reset all progress?")) {
      Object.assign(state, JSON.parse(JSON.stringify(DEFAULT_SAVE)));
      foodSeen = new Set();
      saveState();
      applyHandedness();
      renderScreen("intro");
    }
  });
}

function renderLevel(levelId) {
  activeLevel = levelId;
  if (levelId === 1) return renderLevel1();
  if (levelId === 2) return renderLevel2();
  if (levelId === 3) return renderLevel3();
  if (levelId === 4) return renderLevel4();
  if (levelId === 5) return renderLevel5();
  if (levelId === 6) return renderLevel6();
  if (levelId === 7) return renderLevel7();
}

function renderLevelShell(title, subtitle, body) {
  els.screenRoot.innerHTML = `
    <section class="card grid stage">
      <div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      ${body}
      <button id="backLevels" class="secondary-btn">← Back to Levels</button>
    </section>
  `;
  document.getElementById("backLevels").addEventListener("click", () => {
    safeInteract();
    renderScreen("levels");
  });
}

function completeLevel(levelId) {
  state.completed[levelId] = true;
  if (levelId <= 6) state.notesUnlocked[levelId] = true;
  state.unlockedLevel = Math.max(state.unlockedLevel, Math.min(levelId + 1, 7));
  if (levelId === 7) state.finalUnlocked = true;
  saveState();
  confettiBurst();
  audio.play("success");

  const tokenLevel = CONFIG.levels.find((lvl) => lvl.id === levelId);
  if (levelId <= 6) {
    showModal(
      `Level ${levelId} complete!`,
      `<p>${CONFIG.loveNotes[levelId]}</p><p><strong>Token earned:</strong> ${tokenLevel.token}</p>`
    );
  }

  if (levelId === 7) {
    renderScreen("final");
  } else {
    setTimeout(() => renderScreen("levels"), 500);
  }
}

function renderLevel1() {
  renderLevelShell(
    "Level 1 · Tap-to-catch",
    "Tap only the glowing Sun Sprout.",
    `<div id="catchField" class="catch-field" aria-label="Tap game area"></div>`
  );

  const field = document.getElementById("catchField");
  const items = [
    { id: 1, symbol: "🌱", correct: true },
    { id: 2, symbol: "🍄", correct: false },
    { id: 3, symbol: "🪨", correct: false },
    { id: 4, symbol: "🌀", correct: false }
  ];

  items.forEach((item, idx) => {
    const btn = document.createElement("button");
    btn.className = `orb ${item.correct ? "correct" : "wrong"}`;
    btn.textContent = item.symbol;
    btn.style.left = `${20 + idx * 70}px`;
    btn.style.top = `${60 + (idx % 2) * 90}px`;
    const move = () => {
      btn.style.left = `${Math.random() * (field.clientWidth - 60)}px`;
      btn.style.top = `${Math.random() * (field.clientHeight - 60)}px`;
    };
    const mover = setInterval(move, 1300 + idx * 100);
    btn.addEventListener("click", () => {
      safeInteract();
      if (item.correct) {
        clearInterval(mover);
        completeLevel(1);
      } else {
        showToast("Oops, wrong critter. Try again!");
      }
    });
    field.appendChild(btn);
  });
}

function renderLevel2() {
  const icons = ["🌟", "🧪", "📚", "🦉", "🌟", "🧪", "📚", "🦉", "🔮", "🍀", "🔮", "🍀"];
  const shuffled = icons.sort(() => Math.random() - 0.5);
  memoryOpen = [];
  memoryMatches = 0;

  renderLevelShell(
    "Level 2 · Memory match",
    "Find all matching pairs.",
    `<div id="memoryGrid" class="grid memory-grid"></div>`
  );

  const grid = document.getElementById("memoryGrid");
  shuffled.forEach((icon, i) => {
    const btn = document.createElement("button");
    btn.className = "mem-card";
    btn.dataset.icon = icon;
    btn.dataset.idx = String(i);
    btn.textContent = icon;
    btn.addEventListener("click", () => handleMemoryTap(btn));
    grid.appendChild(btn);
  });
}

function handleMemoryTap(btn) {
  if (btn.classList.contains("open") || btn.classList.contains("matched") || memoryOpen.length === 2) return;
  safeInteract();
  btn.classList.add("open");
  memoryOpen.push(btn);
  if (memoryOpen.length < 2) return;

  const [a, b] = memoryOpen;
  if (a.dataset.icon === b.dataset.icon) {
    a.classList.add("matched");
    b.classList.add("matched");
    memoryMatches += 1;
    memoryOpen = [];
    if (memoryMatches === 6) completeLevel(2);
  } else {
    setTimeout(() => {
      a.classList.remove("open");
      b.classList.remove("open");
      memoryOpen = [];
    }, 450);
  }
}

function renderLevel3() {
  potionSlots = [];
  renderLevelShell(
    "Level 3 · Potion order",
    "Drag ingredients into slot 1→2→3 in the right order.",
    `<div class="potion-layout">
      <div id="ingredients" class="ingredients"></div>
      <div id="dropSlots" class="drop-slots"></div>
      <button id="checkPotion" class="primary-btn">Brew</button>
    </div>`
  );

  const ingredients = [...CONFIG.potionOrder].sort(() => Math.random() - 0.5);
  const ingWrap = document.getElementById("ingredients");
  ingredients.forEach((name) => {
    const chip = document.createElement("div");
    chip.className = "drag-item";
    chip.draggable = true;
    chip.tabIndex = 0;
    chip.textContent = name;
    chip.dataset.name = name;
    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", name);
    });
    chip.addEventListener("click", () => {
      safeInteract();
      const next = document.querySelector('.drop-slot:not([data-filled="1"])');
      if (!next) return;
      next.dataset.value = name;
      next.dataset.filled = "1";
      next.textContent = `${next.dataset.slot}. ${name}`;
      next.classList.add("filled");
    });
    ingWrap.appendChild(chip);
  });

  const slotWrap = document.getElementById("dropSlots");
  for (let i = 1; i <= 3; i += 1) {
    const slot = document.createElement("div");
    slot.className = "drop-slot";
    slot.dataset.slot = String(i);
    slot.textContent = `${i}. Drop here`;
    slot.addEventListener("dragover", (e) => e.preventDefault());
    slot.addEventListener("drop", (e) => {
      safeInteract();
      e.preventDefault();
      const value = e.dataTransfer.getData("text/plain");
      slot.dataset.value = value;
      slot.dataset.filled = "1";
      slot.textContent = `${i}. ${value}`;
      slot.classList.add("filled");
    });
    slotWrap.appendChild(slot);
  }

  document.getElementById("checkPotion").addEventListener("click", () => {
    safeInteract();
    const values = [...document.querySelectorAll(".drop-slot")].map((s) => s.dataset.value || "");
    if (values.join("|") === CONFIG.potionOrder.join("|")) {
      completeLevel(3);
    } else {
      showToast("Potion fizzled. Retry the order!");
    }
  });
}

function renderLevel4() {
  tracePoints = [];
  renderLevelShell(
    "Level 4 · Wand trace",
    "Trace along the glowing path.",
    `<canvas id="traceBoard" class="trace-board" width="320" height="260" aria-label="Trace board"></canvas>
     <button id="traceCheck" class="primary-btn">Check Trace</button>`
  );

  const canvas = document.getElementById("traceBoard");
  const ctx = canvas.getContext("2d");
  drawTraceGuide(ctx);

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const start = (e) => {
    safeInteract();
    traceDrawing = true;
    const p = getPos(e);
    tracePoints.push(p);
  };
  const move = (e) => {
    if (!traceDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    tracePoints.push(p);
    ctx.fillStyle = "rgba(132,139,121,0.5)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  };
  const end = () => {
    traceDrawing = false;
  };

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end, { once: true });
  canvas.addEventListener("touchstart", start, { passive: true });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);

  document.getElementById("traceCheck").addEventListener("click", () => {
    safeInteract();
    const avgDist = averageDistanceFromCurve(tracePoints);
    if (tracePoints.length > 25 && avgDist < 38) {
      completeLevel(4);
    } else {
      showToast("Trace a bit closer to the path and try again.");
    }
  });
}

function drawTraceGuide(ctx) {
  ctx.clearRect(0, 0, 320, 260);
  ctx.strokeStyle = "#d8dfce";
  ctx.lineWidth = 24;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(40, 210);
  ctx.bezierCurveTo(80, 60, 230, 60, 280, 200);
  ctx.stroke();
  ctx.strokeStyle = "#848b79";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(40, 210);
  ctx.bezierCurveTo(80, 60, 230, 60, 280, 200);
  ctx.stroke();
}

function curvePoint(t) {
  const p0 = { x: 40, y: 210 };
  const p1 = { x: 80, y: 60 };
  const p2 = { x: 230, y: 60 };
  const p3 = { x: 280, y: 200 };
  const x =
    (1 - t) ** 3 * p0.x +
    3 * (1 - t) ** 2 * t * p1.x +
    3 * (1 - t) * t * t * p2.x +
    t ** 3 * p3.x;
  const y =
    (1 - t) ** 3 * p0.y +
    3 * (1 - t) ** 2 * t * p1.y +
    3 * (1 - t) * t * t * p2.y +
    t ** 3 * p3.y;
  return { x, y };
}

function averageDistanceFromCurve(points) {
  if (!points.length) return Infinity;
  let total = 0;
  points.forEach((pt) => {
    let min = Infinity;
    for (let i = 0; i <= 40; i += 1) {
      const c = curvePoint(i / 40);
      const d = Math.hypot(pt.x - c.x, pt.y - c.y);
      if (d < min) min = d;
    }
    total += min;
  });
  return total / points.length;
}

function renderLevel5() {
  const letters = CONFIG.scramble.phrase.split("").sort(() => Math.random() - 0.5);
  scrambleAnswer = "";
  renderLevelShell(
    "Level 5 · Word scramble",
    "Build the correct phrase.",
    `<div class="answer-box" id="answerBox" aria-live="polite"></div>
     <div class="scramble-letters" id="lettersWrap"></div>
     <div class="setting-row">
      <button id="hintBtn" class="secondary-btn">Hint</button>
      <button id="clearScramble" class="secondary-btn">Clear</button>
      <button id="submitScramble" class="primary-btn">Submit</button>
     </div>`
  );

  const wrap = document.getElementById("lettersWrap");
  letters.forEach((char, idx) => {
    const btn = document.createElement("button");
    btn.className = "letter-btn";
    btn.textContent = char === " " ? "␣" : char;
    btn.dataset.char = char;
    btn.dataset.index = String(idx);
    btn.addEventListener("click", () => {
      safeInteract();
      scrambleAnswer += char;
      btn.disabled = true;
      updateScrambleAnswer();
    });
    wrap.appendChild(btn);
  });

  document.getElementById("hintBtn").addEventListener("click", () => {
    safeInteract();
    showToast(CONFIG.scramble.hint);
  });
  document.getElementById("clearScramble").addEventListener("click", () => {
    safeInteract();
    scrambleAnswer = "";
    wrap.querySelectorAll("button").forEach((b) => (b.disabled = false));
    updateScrambleAnswer();
  });
  document.getElementById("submitScramble").addEventListener("click", () => {
    safeInteract();
    if (scrambleAnswer === CONFIG.scramble.phrase) completeLevel(5);
    else showToast("Not quite. Rearrange and try again.");
  });

  updateScrambleAnswer();
}

function updateScrambleAnswer() {
  const box = document.getElementById("answerBox");
  if (box) box.textContent = scrambleAnswer || "(your answer appears here)";
}

function renderLevel6() {
  renderLevelShell(
    "Level 6 · Food polaroid gallery",
    "Open all 4 food cards to continue.",
    `<div id="foodGrid" class="grid food-grid"></div>
     <button id="foodContinue" class="primary-btn hidden">Continue</button>`
  );

  const grid = document.getElementById("foodGrid");
  CONFIG.foods.forEach((food) => {
    const btn = document.createElement("button");
    btn.className = "food-btn";
    btn.textContent = food.title;
    btn.addEventListener("click", () => {
      safeInteract();
      openFoodModal(food);
      foodSeen.add(food.id);
      state.foodViewed[food.id] = true;
      saveState();
      if (foodSeen.size === 4) document.getElementById("foodContinue").classList.remove("hidden");
    });
    grid.appendChild(btn);
  });

  if (foodSeen.size === 4) document.getElementById("foodContinue").classList.remove("hidden");
  document.getElementById("foodContinue").addEventListener("click", () => {
    safeInteract();
    completeLevel(6);
  });
}

function openFoodModal(food) {
  audio.play("modal");
  showModal(
    food.title,
    `<figure>
      <img src="${food.img}" alt="${food.title} image" style="width:100%;border-radius:12px;aspect-ratio:4/3;object-fit:cover;background:#eff2ea;" />
      <figcaption>${food.caption}</figcaption>
    </figure>`
  );
}

function renderLevel7() {
  renderLevelShell(
    "Level 7 · Final vault",
    `Enter the 4-digit code from levels ${CONFIG.useTokensFromLevels.join(", " )}.`,
    `<input id="vaultInput" class="vault-input" inputmode="numeric" maxlength="4" placeholder="••••" />
     <button id="unlockVault" class="primary-btn">Unlock</button>`
  );

  document.getElementById("unlockVault").addEventListener("click", () => {
    safeInteract();
    const val = document.getElementById("vaultInput").value.replace(/\D/g, "");
    if (val === CONFIG.vaultCode) {
      completeLevel(7);
    } else {
      showToast("Code not right yet. Check your tokens.");
    }
  });
}

function renderFinalReveal() {
  els.screenRoot.innerHTML = `
    <section class="card grid">
      <h2>Final Reveal 🎉</h2>
      <div class="final-frame">
        <p>Happy birthday Esther, from Baba and Teteh. This is your long message placeholder: thank you for
        being brave, kind, and wonderfully weird in all the best ways. We are endlessly proud of you,
        and we hope this tiny academy journey reminds you that you are deeply loved today and always.
        Keep this frame and take a screenshot as a keepsake 💛</p>
      </div>
      <div class="grid">
        <button id="loadVideoBtn" class="secondary-btn">Load Video</button>
        <div id="videoArea" class="note-item">Video placeholder not loaded yet.</div>
      </div>
    </section>
  `;

  document.getElementById("loadVideoBtn").addEventListener("click", () => {
    safeInteract();
    const area = document.getElementById("videoArea");
    area.innerHTML = `<video controls playsinline preload="none" style="width:100%;border-radius:12px;">
      <source src="assets/img/placeholder-video.mp4" type="video/mp4" />
      Your browser does not support video.
    </video>`;
  });
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function showModal(title, html) {
  els.modalTitle.textContent = title;
  els.modalContent.innerHTML = html;
  els.modalBackdrop.classList.remove("hidden");
  els.modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeModal() {
  safeInteract();
  els.modalBackdrop.classList.add("hidden");
  els.modalBackdrop.setAttribute("aria-hidden", "true");
}

function confettiBurst() {
  if (document.body.classList.contains("reduced-motion")) return;
  const wrap = document.createElement("div");
  wrap.className = "confetti";
  for (let i = 0; i < 24; i += 1) {
    const bit = document.createElement("span");
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.top = "-12px";
    bit.style.background = ["#f2cf7b", "#848b79", "#c98d73", "#a6b6cf"][i % 4];
    bit.style.animationDelay = `${Math.random() * 200}ms`;
    wrap.appendChild(bit);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1000);
}

function applyHandedness() {
  els.app.classList.toggle("handed-left", state.settings.handedness === "left");
  els.app.classList.toggle("handed-right", state.settings.handedness !== "left");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    return deepMerge(JSON.parse(JSON.stringify(DEFAULT_SAVE)), JSON.parse(raw));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deepMerge(base, extra) {
  Object.keys(extra || {}).forEach((k) => {
    if (typeof extra[k] === "object" && extra[k] && !Array.isArray(extra[k])) {
      if (!base[k]) base[k] = {};
      deepMerge(base[k], extra[k]);
    } else {
      base[k] = extra[k];
    }
  });
  return base;
}

function createAudioManager() {
  const audioEls = {};
  let context = null;
  let unlocked = false;

  Object.entries(CONFIG.sfx).forEach(([key, src]) => {
    const a = new Audio(src);
    a.preload = "auto";
    a.addEventListener("error", () => {
      audioEls[key] = null;
    });
    audioEls[key] = a;
  });

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === "suspended") context.resume();
    } catch {
      context = null;
    }
  }

  function synthBeep(type = "tap") {
    if (!context) return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    const freq = { tap: 440, success: 660, unlock: 520, modal: 360 }[type] || 440;
    osc.frequency.value = freq;
    gain.gain.value = 0.001;
    osc.connect(gain).connect(context.destination);
    const now = context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  function play(name) {
    if (!state.settings.soundOn || !state.hasInteracted) return;
    const el = audioEls[name];
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => synthBeep(name));
    } else {
      synthBeep(name);
    }
  }

  return { unlock, play };
}
