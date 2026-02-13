/*

DEPLOY (GitHub Pages)
- Repo Settings -> Pages -> Deploy from branch -> main / root
- Ensure index.html is in repo root.

ASSETS
- Put your photos in /assets/img/ (optional).
- For Level 6 polaroids, replace image paths in CONFIG.foodGallery.
- For SFX, optionally add:
  /assets/sfx/tap.mp3
  /assets/sfx/success.mp3
  /assets/sfx/open.mp3
  /assets/sfx/unlock.mp3
If missing, app still works (silent).

*/

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const STORAGE_KEY = "bdayQuest_v2";

  const CONFIG = {
    primary: "#848b79",
    gfName: "Esther",
    youName: "Baba",
    callYou: "Baba",
    callHer: "Teteh",

    // Level variants: 2–3 per level, re-randomize every time a level is opened
    tapCatch: [
      { target: "✦", decoys: ["✿", "✧", "❋"], goal: 5, hint: "Tap the star ✦ five times." },
      { target: "🍀", decoys: ["🌿", "🌱", "🍃"], goal: 5, hint: "Collect the lucky 🍀." },
      { target: "🫧", decoys: ["💧", "❄️", "🟦"], goal: 5, hint: "Pop the bubbles 🫧." },
    ],

    memoryMatchSets: [
      // inline SVG strings; replace these later with Piplup etc.
  [
    svgIcon("spark", CONFIG.primary),
    svgIcon("leaf", CONFIG.primary),
    svgIcon("moon", CONFIG.primary),
    svgIcon("puff", CONFIG.primary),
    svgIcon("wand", CONFIG.primary),
    svgIcon("heart", CONFIG.primary),
    svgIcon("star", CONFIG.primary),
    svgIcon("potion", CONFIG.primary),
  ],
  [
    svgIcon("gem", CONFIG.primary),
    svgIcon("book", CONFIG.primary),
    svgIcon("cloud", CONFIG.primary),
    svgIcon("feather", CONFIG.primary),
    svgIcon("bell", CONFIG.primary),
    svgIcon("sun", CONFIG.primary),
    svgIcon("orb", CONFIG.primary),
    svgIcon("shield", CONFIG.primary),
  ],
  [
    svgIcon("fish", CONFIG.primary),
    svgIcon("cup", CONFIG.primary),
    svgIcon("spark", CONFIG.primary),
    svgIcon("leaf", CONFIG.primary),
    svgIcon("moon", CONFIG.primary),
    svgIcon("puff", CONFIG.primary),
    svgIcon("wand", CONFIG.primary),
    svgIcon("heart", CONFIG.primary),
  ],
],

    potionOrders: [
      {
        hint: "Warmth first, then sweetness, then a little sparkle.",
        items: ["Warmth", "Sweet", "Sparkle"],
      },
      {
        hint: "Start soft, then brave, then kind.",
        items: ["Soft", "Brave", "Kind"],
      },
      {
        hint: "The Huffle recipe: loyalty → patience → joy.",
        items: ["Loyalty", "Patience", "Joy"],
      },
    ],

    tracePaths: [
      { hint: "Trace the curve slowly.", path: "M 20 160 C 80 40, 160 40, 220 160 C 280 280, 360 280, 420 160" },
      { hint: "Trace the wave.", path: "M 20 160 C 80 80, 140 240, 200 160 C 260 80, 320 240, 380 160 C 410 130, 440 120, 460 160" },
      { hint: "Trace the loop.", path: "M 80 160 C 80 60, 260 60, 260 160 C 260 260, 80 260, 80 160 Z" },
    ],

    // General word scramble (not couple-specific)
    scrambles: [
      { answer: "COZY MAGIC", hint: "A phrase about warmth and wonder." },
      { answer: "KIND HEART", hint: "A phrase about being gentle." },
      { answer: "SOFT JOY", hint: "A phrase about quiet happiness." },
      { answer: "BRIGHT DAY", hint: "A phrase about good vibes." },
      { answer: "HAPPY MOMENT", hint: "A phrase about memories." },
    ],

    foodGallery: [
      {
        key: "canai",
        label: "Canai",
        title: "Canai Moment",
        caption: "Replace this caption 🧡",
        img: "./assets/img/canai.jpg",
      },
      {
        key: "pizza",
        label: "Pizza",
        title: "Pizza Date",
        caption: "Replace this caption 🧡",
        img: "./assets/img/pizza.jpg",
      },
      {
        key: "indomie",
        label: "Indomie",
        title: "Indomie Core",
        caption: "Replace this caption 🧡",
        img: "./assets/img/indomie.jpg",
      },
      {
        key: "tiramisu",
        label: "Tiramisu",
        title: "Tiramisu Sweet",
        caption: "Replace this caption 🧡",
        img: "./assets/img/tiramisu.jpg",
      },
    ],

    // Love notes (collected after each level completion)
    loveNotes: [
      `Teteh ${"Esther"}, you make ordinary days feel safe.`,
      `Huffle energy: loyal, warm, quietly unstoppable. That’s you.`,
      `If I could “save” one thing forever, it’s your laugh.`,
      `Even when life is messy, you keep choosing kindness. I notice.`,
      `You make “cozy” feel like a real place. I like living there with you.`,
      `Food tastes better when it becomes a memory with you.`,
      `Okay… final door time. Baba is proud of you, Teteh.`,
    ],

    finalLetter: `
Hi Esther (Teteh),

This little site is my way of saying:
I love you in the calm days, in the chaotic days, and in the in-between days.

Thank you for being you.
Thank you for choosing me.
Happy birthday, Teteh.

— Baba
`.trim(),

    // Vault: code is generated per session (playthrough) and stored for consistency
    vaultDigitsCount: 4,

    // Secret
    secretTapsNeeded: 5,
  };

  function CONFIG_PRIMARY() {
    return getState().settings.primary || CONFIG.primary;
  }

  const DEFAULT_STATE = {
    route: "home",
    settings: {
      soundEnabled: true,
      primary: CONFIG.primary,
      handedness: "right", // right | left
    },
    progress: {
      completed: {}, // levelId => true
      notesUnlocked: 0,
      secretUnlocked: false,
      secretTapCount: 0,
      vaultCode: null, // string
      digitsEarned: {}, // levelId => digit
    },
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return deepMerge(structuredClone(DEFAULT_STATE), parsed);
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getState() {
    return state;
  }

  function deepMerge(base, patch) {
    if (typeof patch !== "object" || patch == null) return base;
    for (const k of Object.keys(patch)) {
      if (Array.isArray(patch[k])) base[k] = patch[k].slice();
      else if (typeof patch[k] === "object" && patch[k] != null) {
        base[k] = deepMerge(base[k] ?? {}, patch[k]);
      } else base[k] = patch[k];
    }
    return base;
  }

  let state = loadState();

  // ===== Toast system (auto dismiss 3s) =====
  const toastRoot = $("#toasts");
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastRoot.appendChild(el);

    // auto-dismiss (requirement #2)
    window.setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
      el.style.transition = "opacity 200ms ease, transform 200ms ease";
      window.setTimeout(() => el.remove(), 220);
    }, 3000);
  }

  // ===== Sound =====
  let audioUnlocked = false;
  const sfx = {
    tap: new Audio("./assets/sfx/tap.mp3"),
    success: new Audio("./assets/sfx/success.mp3"),
    open: new Audio("./assets/sfx/open.mp3"),
    unlock: new Audio("./assets/sfx/unlock.mp3"),
  };
  Object.values(sfx).forEach((a) => {
    a.preload = "none";
    a.volume = 0.6;
  });

  function playSfx(name) {
    const st = getState();
    if (!st.settings.soundEnabled) return;
    if (!audioUnlocked) return;
    const a = sfx[name];
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  }

  function unlockAudioOnce() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    // Prime (iOS Safari)
    try {
      sfx.tap.play().then(() => {
        sfx.tap.pause();
        sfx.tap.currentTime = 0;
      }).catch(() => {});
    } catch {}
  }

  // ===== Navbar routing =====
  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      playSfx("tap");
      unlockAudioOnce();
      navigate(btn.dataset.nav);
    });
  });

  function setActiveNav(route) {
    $$(".nav-btn").forEach((b) => b.removeAttribute("aria-current"));
    const current = $(`.nav-btn[data-nav="${route}"]`);
    if (current) current.setAttribute("aria-current", "page");
  }

  function navigate(route) {
    state.route = route;
    saveState();
    render();
  }

  // ===== Topbar sound button =====
  const soundBtn = $("#soundBtn");
  soundBtn.addEventListener("click", () => {
    unlockAudioOnce();
    state.settings.soundEnabled = !state.settings.soundEnabled;
    saveState();
    renderTopBar();
    toast(state.settings.soundEnabled ? "Sound on" : "Sound off");
    playSfx("tap");
  });

  function renderTopBar() {
    soundBtn.textContent = state.settings.soundEnabled ? "🔈 Sound: On" : "🔇 Sound: Off";
    document.documentElement.style.setProperty("--primary", state.settings.primary);
  }

  // ===== Levels definition =====
  const LEVELS = [
    { id: "L1", title: "Tap Catch", subtitle: "Quick reflex, cozy vibe." },
    { id: "L2", title: "Memory Match", subtitle: "Match the icons." },
    { id: "L3", title: "Sliding Puzzle", subtitle: "Solve the 5×5." }, // requirement #3
    { id: "L4", title: "Trace Spell", subtitle: "Follow the line." },
    { id: "L5", title: "Word Scramble", subtitle: "General phrases." }, // requirement #4
    { id: "L6", title: "Food Polaroids", subtitle: "Tap food, open memories." },
    { id: "L7", title: "Final Vault", subtitle: "Enter the code." },
    { id: "L8", title: "Bonus • Spot The Difference", subtitle: "Look closely." },
  ];

  function isUnlockedLevel(levelId) {
    // unlock sequentially; L1 always unlocked; L7 requires digits ready
    const idx = LEVELS.findIndex((l) => l.id === levelId);
    if (idx <= 0) return true;
    // unlocked if previous completed
    const prev = LEVELS[idx - 1]?.id;
    return !!state.progress.completed[prev];
  }

  function ensureVaultCode() {
    if (state.progress.vaultCode) return;
    // generate stable vault code for this playthrough
    const code = String(randInt(1000, 9999));
    state.progress.vaultCode = code;
    saveState();
  }

  function awardDigit(levelId) {
    ensureVaultCode();
    const idx = Object.keys(state.progress.digitsEarned).length;
    if (idx >= CONFIG.vaultDigitsCount) return;

    // digits come from vaultCode in order: L1..L4 (simple)
    const digit = state.progress.vaultCode[idx];
    state.progress.digitsEarned[levelId] = digit;
    saveState();
  }

  function awardNote(levelIndex0) {
    const next = Math.max(state.progress.notesUnlocked, levelIndex0 + 1);
    state.progress.notesUnlocked = Math.min(next, CONFIG.loveNotes.length);
    saveState();
  }

  function completeLevel(levelId) {
    state.progress.completed[levelId] = true;
    saveState();
  }

  // ===== Secret taps (requirement #8 add secret) =====
  function handleSecretTap() {
    state.progress.secretTapCount = (state.progress.secretTapCount || 0) + 1;
    if (state.progress.secretTapCount >= CONFIG.secretTapsNeeded && !state.progress.secretUnlocked) {
      state.progress.secretUnlocked = true;
      saveState();
      playSfx("unlock");
      toast("Secret unlocked ✦ Check Notes 💌");
      // grant bonus note
      state.progress.notesUnlocked = Math.max(state.progress.notesUnlocked, 1);
    } else {
      saveState();
      toast(`✦ ${CONFIG.secretTapsNeeded - state.progress.secretTapCount} more…`);
    }
  }

  // ===== Render =====
  const app = $("#app");

  function render() {
    renderTopBar();
    setActiveNav(state.route);

    if (state.route === "home") renderHome();
    else if (state.route === "levels") renderLevels();
    else if (state.route === "notes") renderNotes();
    else if (state.route === "settings") renderSettings();
    else renderHome();
  }

  function renderHome() {
    app.innerHTML = `
      <section class="card">
        <div class="h1">Hi ${escapeHtml(CONFIG.gfName)} ✦</div>
        <p class="p">
          This is a tiny quest made by ${escapeHtml(CONFIG.youName)}.
          No timers. Unlimited retries. Just cozy little wins and love notes.
        </p>
        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="startBtn" type="button">Start Adventure</button>
          <button class="btn ghost" id="levelsBtn" type="button">Pick a Level</button>
        </div>
        <div class="spacer"></div>
        <button class="btn full" id="secretStar" type="button" aria-label="Secret star">
          ✦ Tap this star… maybe.
        </button>
      </section>

      <div class="spacer"></div>

      <section class="card">
        <div class="game-top">
          <div class="kpi"><span>Progress</span><strong>${progressText()}</strong></div>
          <div class="kpi"><span>Notes</span><strong>${state.progress.notesUnlocked}/${CONFIG.loveNotes.length}</strong></div>
        </div>
        <div class="spacer"></div>
        <p class="p">Tip: You can replay any level and it will randomize so it stays fun.</p>
      </section>
    `;

    $("#startBtn").addEventListener("click", () => {
      unlockAudioOnce();
      playSfx("tap");
      navigate("levels");
    });
    $("#levelsBtn").addEventListener("click", () => {
      unlockAudioOnce();
      playSfx("tap");
      navigate("levels");
    });
    $("#secretStar").addEventListener("click", () => {
      unlockAudioOnce();
      playSfx("tap");
      handleSecretTap();
    });
  }

  function renderLevels() {
    const tiles = LEVELS.map((lv, idx) => {
      const unlocked = isUnlockedLevel(lv.id);
      const done = !!state.progress.completed[lv.id];
      const badge = done ? "Done ✓" : unlocked ? "Play" : "Locked";
      return `
        <button class="level-tile" data-level="${lv.id}" type="button" ${unlocked ? "" : "disabled"} aria-disabled="${!unlocked}">
          <div class="badge">${badge}</div>
          <div class="level-title">${idx + 1}. ${escapeHtml(lv.title)}</div>
          <div class="level-sub">${escapeHtml(lv.subtitle)}</div>
        </button>
      `;
    }).join("");

    app.innerHTML = `
      <section class="card">
        <div class="h1">Levels</div>
        <p class="p">Replay levels anytime—each run randomizes.</p>
        <div class="spacer"></div>
        <div class="grid levels">${tiles}</div>
      </section>
    `;

    $$(".level-tile").forEach((btn) => {
      btn.addEventListener("click", () => {
        unlockAudioOnce();
        playSfx("tap");
        const id = btn.dataset.level;
        openLevel(id);
      });
    });
  }

  function renderNotes() {
    const n = state.progress.notesUnlocked;
    const secret = state.progress.secretUnlocked;

    const items = CONFIG.loveNotes.map((txt, i) => {
      const unlocked = i < n;
      const body = unlocked ? escapeHtml(txt) : "Locked…";
      return `
        <div class="card" style="margin-bottom:12px; ${unlocked ? "" : "opacity:0.65"}">
          <div class="game-top">
            <div class="kpi"><span>Love Note</span><strong>#${i + 1}</strong></div>
            <div class="kpi"><span>Status</span><strong>${unlocked ? "Unlocked" : "Locked"}</strong></div>
          </div>
          <div class="spacer"></div>
          <p class="p" style="${unlocked ? "color: rgba(27,31,29,0.85)" : ""}">${body}</p>
        </div>
      `;
    }).join("");

    const secretCard = `
      <div class="card" style="margin-bottom:12px; ${secret ? "" : "opacity:0.65"}">
        <div class="game-top">
          <div class="kpi"><span>Secret</span><strong>✦</strong></div>
          <div class="kpi"><span>Status</span><strong>${secret ? "Unlocked" : "Locked"}</strong></div>
        </div>
        <div class="spacer"></div>
        <p class="p" style="${secret ? "color: rgba(27,31,29,0.85)" : ""}">
          ${secret ? escapeHtml("You found it. Teteh, you’re my favorite kind of magic.") : "Try tapping the star on Home…"}
        </p>
      </div>
    `;

    app.innerHTML = `
      <section>
        <div class="h1" style="margin:0 0 10px 0;">Love Notes</div>
        <p class="p">Collected as you complete levels.</p>
        <div class="spacer"></div>
        ${secretCard}
        ${items}
      </section>
    `;
  }

  function renderSettings() {
    app.innerHTML = `
      <section class="card">
        <div class="h1">Settings</div>
        <p class="p">Everything is stored locally on this device.</p>
        <div class="spacer"></div>

        <div class="row">
          <button class="btn" id="toggleHand" type="button">Handedness: ${escapeHtml(state.settings.handedness)}</button>
          <button class="btn" id="toggleSound" type="button">Sound: ${state.settings.soundEnabled ? "On" : "Off"}</button>
        </div>

        <div class="spacer"></div>

        <button class="btn full" id="resetBtn" type="button">Reset Progress</button>
      </section>
    `;

    $("#toggleHand").addEventListener("click", () => {
      playSfx("tap");
      state.settings.handedness = state.settings.handedness === "right" ? "left" : "right";
      saveState();
      toast(`Handedness: ${state.settings.handedness}`);
      render();
    });

    $("#toggleSound").addEventListener("click", () => {
      unlockAudioOnce();
      playSfx("tap");
      state.settings.soundEnabled = !state.settings.soundEnabled;
      saveState();
      render();
      toast(state.settings.soundEnabled ? "Sound on" : "Sound off");
    });

    $("#resetBtn").addEventListener("click", () => {
      playSfx("tap");
      state = structuredClone(DEFAULT_STATE);
      saveState();
      toast("Progress reset");
      render();
    });
  }

  function progressText() {
    const done = Object.keys(state.progress.completed).length;
    return `${done}/${LEVELS.length} done`;
  }

  // ===== Open a Level (randomized each time) =====
  function openLevel(levelId) {
    // Each open: random variant chosen + reset per-run local variables
    const idx = LEVELS.findIndex((l) => l.id === levelId);
    if (idx < 0) return;

    // L7 is always unlocked only when L6 done (sequential), plus digits exist
    if (!isUnlockedLevel(levelId)) {
      toast("That level is locked.");
      return;
    }

    if (levelId === "L1") return renderL1(idx);
    if (levelId === "L2") return renderL2(idx);
    if (levelId === "L3") return renderL3(idx);
    if (levelId === "L4") return renderL4(idx);
    if (levelId === "L5") return renderL5(idx);
    if (levelId === "L6") return renderL6(idx);
    if (levelId === "L7") return renderL7(idx);
    if (levelId === "L8") return renderL8(idx);

  }

  function backToLevelsBtn() {
    return `<button class="btn full" id="backLevels" type="button">← Back to Levels</button>`;
  }

  function wireBackToLevels() {
    $("#backLevels")?.addEventListener("click", () => {
      playSfx("tap");
      navigate("levels");
    });
  }

  // ===== Level 1: Tap Catch =====
  function renderL1(levelIndex0) {
    const variant = pick(CONFIG.tapCatch);

    let score = 0;
    const goal = variant.goal;

    app.innerHTML = `
      <section class="card">
        <div class="game-top">
          <div>
            <div class="h1" style="margin:0;">Level 1 • Tap Catch</div>
            <p class="p">${escapeHtml(variant.hint)}</p>
          </div>
          <div class="kpi"><span>Score</span><strong id="score">${score}/${goal}</strong></div>
        </div>

        <div class="spacer"></div>
        <div class="tap-area" id="tapArea" aria-label="Tap area"></div>

        <div class="spacer"></div>
        ${backToLevelsBtn()}
      </section>
    `;

    const area = $("#tapArea");
    const icons = shuffle([variant.target, ...variant.decoys]);

    // create multiple floaters
    const floaters = [];
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "floater";
      el.textContent = icons[i % icons.length];
      el.style.left = randInt(10, area.clientWidth - 66) + "px";
      el.style.top = randInt(10, area.clientHeight - 66) + "px";
      el.dataset.vx = String(randInt(-12, 12) / 10);
      el.dataset.vy = String(randInt(-12, 12) / 10);

      el.addEventListener("click", () => {
        unlockAudioOnce();
        playSfx("tap");
        if (el.textContent === variant.target) {
          score += 1;
          $("#score").textContent = `${score}/${goal}`;
          if (score >= goal) {
            playSfx("success");
            toast("Nice ✦ Love note unlocked!");
            // award digit for L1 if needed
            awardDigit("L1");
            awardNote(levelIndex0);
            completeLevel("L1");
            saveState();
            // show digit reveal if digit awarded
            const digit = state.progress.digitsEarned["L1"];
            if (digit) toast(`You got a digit: ${digit}`);
          }
        } else {
          toast("Not that one. Try again.");
        }
      });

      area.appendChild(el);
      floaters.push(el);
    }

    let raf = 0;
    function tick() {
      const w = area.clientWidth;
      const h = area.clientHeight;

      for (const el of floaters) {
        const r = el.getBoundingClientRect();
        const ar = area.getBoundingClientRect();
        let x = parseFloat(el.style.left);
        let y = parseFloat(el.style.top);
        let vx = parseFloat(el.dataset.vx);
        let vy = parseFloat(el.dataset.vy);

        x += vx;
        y += vy;

        if (x <= 0 || x >= w - 56) vx *= -1;
        if (y <= 0 || y >= h - 56) vy *= -1;

        el.dataset.vx = String(vx);
        el.dataset.vy = String(vy);

        el.style.left = clamp(x, 0, w - 56) + "px";
        el.style.top = clamp(y, 0, h - 56) + "px";
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    wireBackToLevels();
  }

  // ===== Level 2: Memory Match (SVG icons) =====
  function renderL2(levelIndex0) {
    const set = pick(CONFIG.memoryMatchSets);
    // 8 pairs => 16 cards (4x4)
    const pairs = set.slice(0, 8);
    const deck = shuffle([...pairs, ...pairs]).map((svg, i) => ({
      id: i,
      key: hash(svg),
      svg,
      state: "hidden", // hidden | shown | matched
    }));

    let first = null;
    let lock = false;
    let matched = 0;

    app.innerHTML = `
      <section class="card">
        <div class="game-top">
          <div>
            <div class="h1" style="margin:0;">Level 2 • Memory Match</div>
            <p class="p">Match all pairs. (SVG-based, easy to swap later)</p>
          </div>
          <div class="kpi"><span>Matched</span><strong id="mmKpi">${matched}/8</strong></div>
        </div>

        <div class="spacer"></div>
        <div class="grid mm-grid" id="mmGrid"></div>

        <div class="spacer"></div>
        ${backToLevelsBtn()}
      </section>
    `;

    const grid = $("#mmGrid");

    function renderDeck() {
      grid.innerHTML = "";
      for (const c of deck) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mm-card";
        if (c.state !== "hidden") btn.classList.add("revealed");
        if (c.state === "matched") btn.classList.add("matched");

        btn.innerHTML = c.state === "hidden" ? "" : c.svg;

        btn.addEventListener("click", () => {
          unlockAudioOnce();
          if (lock || c.state !== "hidden") return;
          playSfx("tap");

          c.state = "shown";
          renderDeck();

          if (!first) {
            first = c;
            return;
          }

          if (first.key === c.key) {
            first.state = "matched";
            c.state = "matched";
            first = null;
            matched += 1;
            $("#mmKpi").textContent = `${matched}/8`;
            playSfx("success");
            toast("Matched ✓");

            if (matched === 8) {
              toast("Level complete ✦ Love note unlocked!");
              awardDigit("L2");
              awardNote(levelIndex0);
              completeLevel("L2");
              saveState();
              const digit = state.progress.digitsEarned["L2"];
              if (digit) toast(`You got a digit: ${digit}`);
            }
          } else {
            lock = true;
            window.setTimeout(() => {
              first.state = "hidden";
              c.state = "hidden";
              first = null;
              lock = false;
              renderDeck();
            }, 650);
          }
        });

        grid.appendChild(btn);
      }
    }

    renderDeck();
    wireBackToLevels();
  }

  // ===== Level 3: Sliding Puzzle (5x5) =====
function renderL3(levelIndex0) {
  const SIZE = 5;
  const TOTAL = SIZE * SIZE;

  const goal = Array.from({ length: TOTAL - 1 }, (_, i) => i + 1).concat(0);
  let board = goal.slice();

  board = shuffleByMoves5x5(board, SIZE, 120);

  app.innerHTML = `
    <section class="card">
      <div class="game-top">
        <div>
          <div class="h1" style="margin:0;">Level 3 • 5×5 Sliding Puzzle</div>
          <p class="p">Arrange tiles 1–24 in order. This one is harder.</p>
        </div>
        <div class="kpi"><span>Status</span><strong id="pzStatus">Unsolved</strong></div>
      </div>

      <div class="spacer"></div>
      <div class="puzzle-grid" id="pzGrid" style="grid-template-columns:repeat(5,1fr);"></div>

      <div class="spacer"></div>
      <div class="row">
        <button class="btn" id="pzShuffle" type="button">Shuffle</button>
        <button class="btn ghost" id="pzHint" type="button">Hint</button>
      </div>

      <div class="spacer"></div>
      ${backToLevelsBtn()}
    </section>
  `;

  const grid = $("#pzGrid");

  function renderBoard() {
    grid.innerHTML = "";
    board.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "puzzle-tile" + (v === 0 ? " empty" : "");
      btn.textContent = v === 0 ? "" : String(v);

      btn.addEventListener("click", () => {
        unlockAudioOnce();
        playSfx("tap");

        if (v === 0) return;

        const zi = board.indexOf(0);
        if (!isNeighbor5x5(i, zi, SIZE)) return;

        [board[i], board[zi]] = [board[zi], board[i]];
        renderBoard();

        if (isSolved(board, goal)) {
          $("#pzStatus").textContent = "Solved ✓";
          playSfx("success");
          toast("5×5 puzzle solved ✦ Love note unlocked!");
          awardDigit("L3");
          awardNote(levelIndex0);
          completeLevel("L3");
          saveState();
        }
      });

      grid.appendChild(btn);
    });
  }

  $("#pzShuffle").addEventListener("click", () => {
    playSfx("tap");
    board = shuffleByMoves5x5(goal.slice(), SIZE, 120);
    $("#pzStatus").textContent = "Unsolved";
    renderBoard();
  });

  $("#pzHint").addEventListener("click", () => {
    playSfx("tap");
    toast("Tip: Solve row by row. Start from top-left.");
  });

  renderBoard();
  wireBackToLevels();
}

function isNeighbor5x5(i, j, size) {
  const r1 = Math.floor(i / size), c1 = i % size;
  const r2 = Math.floor(j / size), c2 = j % size;
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function shuffleByMoves5x5(board, size, moves) {
  for (let m = 0; m < moves; m++) {
    const zi = board.indexOf(0);
    const neighbors = [];
    for (let i = 0; i < board.length; i++) {
      if (isNeighbor5x5(i, zi, size)) neighbors.push(i);
    }
    const pickI = neighbors[Math.floor(Math.random() * neighbors.length)];
    [board[pickI], board[zi]] = [board[zi], board[pickI]];
  }
  return board;
}


  // ===== Level 4: Trace Spell =====
  function renderL4(levelIndex0) {
    const variant = pick(CONFIG.tracePaths);

    app.innerHTML = `
      <section class="card">
        <div class="game-top">
          <div>
            <div class="h1" style="margin:0;">Level 4 • Trace Spell</div>
            <p class="p">${escapeHtml(variant.hint)} (Stay close to the line)</p>
          </div>
          <div class="kpi"><span>Accuracy</span><strong id="acc">0%</strong></div>
        </div>

        <div class="spacer"></div>

        <div class="tap-area" id="traceArea" style="height:320px; display:grid; place-items:center;">
          <svg id="traceSvg" viewBox="0 0 480 320" width="100%" height="100%" style="overflow:visible;">
            <path id="guide" d="${variant.path}" fill="none" stroke="rgba(132,139,121,0.55)" stroke-width="10" stroke-linecap="round"/>
            <path id="drawn" d="" fill="none" stroke="rgba(27,31,29,0.85)" stroke-width="8" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn" id="traceClear" type="button">Clear</button>
          <button class="btn primary" id="traceSubmit" type="button">Submit</button>
        </div>

        <div class="spacer"></div>
        ${backToLevelsBtn()}
      </section>
    `;

    const area = $("#traceArea");
    const drawn = $("#drawn");
    const guide = $("#guide");
    const accEl = $("#acc");

    let drawing = false;
    let points = [];

    const guideLen = guide.getTotalLength();

    function toLocalPoint(e) {
      const rect = area.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 480;
      const y = ((e.clientY - rect.top) / rect.height) * 320;
      return { x, y };
    }

    function onDown(e) {
      unlockAudioOnce();
      playSfx("tap");
      drawing = true;
      points = [];
      const p = toLocalPoint(e);
      points.push(p);
      drawn.setAttribute("d", `M ${p.x} ${p.y}`);
    }

    function onMove(e) {
      if (!drawing) return;
      const p = toLocalPoint(e);
      points.push(p);
      const d = points.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(" ");
      drawn.setAttribute("d", d);
      accEl.textContent = `${estimateAccuracy(points, guide)}%`;
    }

    function onUp() {
      drawing = false;
    }

    // Pointer events
    area.addEventListener("pointerdown", (e) => {
      area.setPointerCapture(e.pointerId);
      onDown(e);
    });
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerup", onUp);
    area.addEventListener("pointercancel", onUp);

    $("#traceClear").addEventListener("click", () => {
      playSfx("tap");
      points = [];
      drawn.setAttribute("d", "");
      accEl.textContent = "0%";
    });

    $("#traceSubmit").addEventListener("click", () => {
      playSfx("tap");
      const acc = estimateAccuracy(points, guide);
      if (acc >= 78) {
        playSfx("success");
        toast("Spell traced ✦ Love note unlocked!");
        awardDigit("L4");
        awardNote(levelIndex0);
        completeLevel("L4");
        saveState();
        const digit = state.progress.digitsEarned["L4"];
        if (digit) toast(`You got a digit: ${digit}`);
      } else {
        toast("Close—try staying nearer to the line.");
      }
    });

    wireBackToLevels();

    function estimateAccuracy(pts, guidePath) {
      if (!pts || pts.length < 10) return 0;
      // Sample guide points along its length and compute average distance from drawn points
      // Simple + cheap (good enough for iOS)
      const samples = 60;
      const guidePts = [];
      for (let i = 0; i <= samples; i++) {
        const p = guidePath.getPointAtLength((i / samples) * guideLen);
        guidePts.push({ x: p.x, y: p.y });
      }

      let sum = 0;
      let count = 0;
      for (const g of guidePts) {
        // find nearest drawn point (downsample drawn for speed)
        let best = 9999;
        for (let i = 0; i < pts.length; i += 3) {
          const dx = pts[i].x - g.x;
          const dy = pts[i].y - g.y;
          const d = Math.hypot(dx, dy);
          if (d < best) best = d;
        }
        sum += best;
        count++;
      }
      const avg = sum / Math.max(1, count);
      // Convert distance to percent (tweak thresholds)
      const pct = clamp(Math.round(100 - avg * 2.0), 0, 100);
      return pct;
    }
  }

  // ===== Level 5: Word Scramble (General + randomized) =====
  function renderL5(levelIndex0) {
    // requirement #4 + #5
    const variant = pick(CONFIG.scrambles);
    const answer = variant.answer.toUpperCase().trim();

    // create tiles: letters + spaces
    const chars = answer.split("").map((c) => (c === " " ? "_" : c));
    const bank = shuffle(chars.slice());

    let built = [];

    app.innerHTML = `
      <section class="card">
        <div class="h1" style="margin:0;">Level 5 • Word Scramble</div>
        <p class="p">${escapeHtml(variant.hint)}</p>

        <div class="spacer"></div>
        <div class="answer-box" id="ansBox">(your answer appears here)</div>

        <div class="spacer"></div>
        <div class="scramble-bank" id="bank"></div>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn" id="hintBtn" type="button">Hint</button>
          <button class="btn" id="clearBtn" type="button">Clear</button>
          <button class="btn primary" id="submitBtn" type="button">Submit</button>
        </div>

        <div class="spacer"></div>
        ${backToLevelsBtn()}
      </section>
    `;

    const bankEl = $("#bank");
    const ansBox = $("#ansBox");

    function renderBank() {
      bankEl.innerHTML = "";
      bank.forEach((c, i) => {
        if (c == null) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tile";
        b.textContent = c;
        b.addEventListener("click", () => {
          playSfx("tap");
          built.push(c);
          bank[i] = null;
          renderBank();
          renderAnswer();
        });
        bankEl.appendChild(b);
      });
    }

    function renderAnswer() {
      const shown = built.map((c) => (c === "_" ? " " : c)).join("");
      ansBox.textContent = shown.length ? shown : "(your answer appears here)";
    }

    $("#hintBtn").addEventListener("click", () => {
      playSfx("tap");
      toast(variant.hint);
    });

    $("#clearBtn").addEventListener("click", () => {
      playSfx("tap");
      // restore
      built = [];
      for (let i = 0; i < chars.length; i++) bank[i] = chars[i];
      shuffleInPlace(bank);
      renderBank();
      renderAnswer();
    });

    $("#submitBtn").addEventListener("click", () => {
      playSfx("tap");
      const attempt = built.map((c) => (c === "_" ? " " : c)).join("").trim();
      if (attempt === answer) {
        playSfx("success");
        toast("Correct ✦ Love note unlocked!");
        awardDigit("L5"); // not used by vault digits (we only need 4), but fine to store
        awardNote(levelIndex0);
        completeLevel("L5");
        saveState();
      } else {
        toast("Not quite—try again.");
      }
    });

    renderBank();
    renderAnswer();
    wireBackToLevels();
  }

  // ===== Level 6: Food Polaroids =====
  function renderL6(levelIndex0) {
    const foods = CONFIG.foodGallery.map((f) => ({ ...f }));
    // randomize positions each open
    shuffleInPlace(foods);

    const opened = new Set();

    app.innerHTML = `
      <section class="card">
        <div class="h1" style="margin:0;">Level 6 • Food Polaroids</div>
        <p class="p">Tap each food to open a polaroid. Open all 4 to finish.</p>

        <div class="spacer"></div>
        <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px;" id="foodGrid"></div>

        <div class="spacer"></div>
        <div class="game-top">
          <div class="kpi"><span>Opened</span><strong id="openedKpi">0/4</strong></div>
          <button class="btn primary" id="foodDone" type="button" disabled>Continue</button>
        </div>

        <div class="spacer"></div>
        ${backToLevelsBtn()}
      </section>
    `;

    const grid = $("#foodGrid");

    foods.forEach((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "level-tile";
      b.style.minHeight = "110px";
      b.innerHTML = `
        <div class="level-title">${escapeHtml(f.label)}</div>
        <div class="level-sub">Tap to open</div>
      `;
      b.addEventListener("click", () => {
        unlockAudioOnce();
        playSfx("open");
        openPolaroid(f, () => {
          opened.add(f.key);
          $("#openedKpi").textContent = `${opened.size}/4`;
          if (opened.size === 4) {
            $("#foodDone").disabled = false;
            toast("All opened ✓");
          }
        });
      });
      grid.appendChild(b);
    });

    $("#foodDone").addEventListener("click", () => {
      playSfx("success");
      toast("Level complete ✦ Love note unlocked!");
      awardDigit("L6");
      awardNote(levelIndex0);
      completeLevel("L6");
      saveState();
      navigate("levels");
    });

    wireBackToLevels();
  }

  function openPolaroid(food, onClose) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Polaroid">
        <div class="polaroid">
          <div class="shot">
            <img src="${escapeAttr(food.img)}" alt="" onerror="this.remove(); this.parentElement.textContent='(add your photo in assets/img)';" />
          </div>
          <div class="cap">${escapeHtml(food.title)}</div>
          <div class="subcap">${escapeHtml(food.caption)}</div>
        </div>
        <div class="spacer"></div>
        <button class="btn primary full" id="closePolaroid" type="button">Close</button>
      </div>
    `;
    document.body.appendChild(backdrop);

    $("#closePolaroid", backdrop).addEventListener("click", () => {
      playSfx("tap");
      backdrop.remove();
      onClose?.();
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        onClose?.();
      }
    });
  }

  // ===== Level 7: Vault + Final Reveal =====
  function renderL7(levelIndex0) {
    ensureVaultCode();

    // Ensure digits exist for L1-L4. If not, still let user play, but show missing.
    const need = ["L1", "L2", "L3", "L4"];
    const haveDigits = need.map((id) => state.progress.digitsEarned[id]).filter(Boolean);

    app.innerHTML = `
      <section class="card">
        <div class="h1" style="margin:0;">Level 7 • Final Vault</div>
        <p class="p">Enter the 4 digits you collected from earlier levels.</p>

        <div class="spacer"></div>
        <div class="card" style="box-shadow:none; background:rgba(132,139,121,0.10);">
          <div class="game-top">
            <div class="kpi"><span>Digits found</span><strong>${haveDigits.length}/4</strong></div>
            <div class="kpi"><span>Hint</span><strong>Levels 1–4</strong></div>
          </div>
        </div>

        <div class="spacer"></div>
        <input id="vaultInput" inputmode="numeric" maxlength="4"
          style="width:100%; font-size:22px; font-weight:900; padding:14px 14px; border-radius:16px; border:1px solid rgba(0,0,0,0.12);"
          placeholder="4-digit code"
        />

        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="vaultSubmit" type="button">Unlock</button>
          <button class="btn" id="vaultHint" type="button">Show digits</button>
        </div>

        <div class="spacer"></div>
        ${backToLevelsBtn()}
      </section>
    `;

    $("#vaultHint").addEventListener("click", () => {
      playSfx("tap");
      const list = need
        .map((id) => `${id}: ${state.progress.digitsEarned[id] ?? "—"}`)
        .join("  •  ");
      toast(list);
    });

    $("#vaultSubmit").addEventListener("click", () => {
      unlockAudioOnce();
      playSfx("tap");
      const v = ($("#vaultInput").value || "").trim();
      if (v === state.progress.vaultCode) {
        playSfx("unlock");
        toast("Unlocked ✦");
        awardNote(levelIndex0);
        completeLevel("L7");
        saveState();
        renderFinal();
      } else {
        toast("Wrong code. Try again.");
      }
    });

    wireBackToLevels();
  }

  function renderFinal() {
    app.innerHTML = `
      <section class="card">
        <div class="h1" style="margin:0;">Happy Birthday, ${escapeHtml(CONFIG.gfName)} ✦</div>
        <p class="p">You finished the quest. Now take this.</p>

        <div class="spacer"></div>
        <div class="booth" aria-label="Photobooth frame">
          <div class="frame" aria-hidden="true"></div>
          <div class="hint">
            Photobooth frame ✦<br/>
            Put your photo/video here later, then take a screenshot 📸
          </div>
        </div>

        <div class="spacer"></div>
        <div class="card" style="box-shadow:none; background:rgba(255,255,255,0.85); border:1px solid rgba(0,0,0,0.08);">
          <pre style="margin:0; white-space:pre-wrap; font-family:inherit; color:rgba(27,31,29,0.85); font-weight:650; line-height:1.55;">${escapeHtml(CONFIG.finalLetter)}</pre>
        </div>

        <div class="spacer"></div>
        <div class="row">
          <button class="btn primary" id="replayBtn" type="button">Replay Levels</button>
          <button class="btn" id="resetBtn2" type="button">Reset</button>
        </div>
      </section>
    `;

    $("#replayBtn").addEventListener("click", () => {
      playSfx("tap");
      navigate("levels");
    });

    $("#resetBtn2").addEventListener("click", () => {
      playSfx("tap");
      state = structuredClone(DEFAULT_STATE);
      saveState();
      toast("Progress reset");
      render();
    });
  }

  // ===== Utils =====
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function shuffle(arr) {
    const a = arr.slice();
    shuffleInPlace(a);
    return a;
  }
  function shuffleInPlace(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  // ===== SVG icon factory (Requirement #6) =====
  function svgIcon(kind, color) {
    const c = color || "#848b79";
    // keep them simple: 34x34, stroke-friendly
    const base = (inner) => `
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${inner}
      </svg>
    `;
    switch (kind) {
      case "spark":
        return base(`<path d="M24 6l3.5 12.5L40 22l-12.5 3.5L24 38l-3.5-12.5L8 22l12.5-3.5L24 6z" fill="${c}" opacity="0.9"/>`);
      case "leaf":
        return base(`<path d="M38 10C26 10 14 18 10 30c10 0 20-6 24-16 1 5-2 12-8 18 8-2 14-10 12-22z" fill="${c}" opacity="0.9"/>`);
      case "moon":
        return base(`<path d="M30 10a14 14 0 1 0 8 26A12 12 0 1 1 30 10z" fill="${c}" opacity="0.9"/>`);
      case "puff":
        return base(`<path d="M16 28c-3 0-6-2-6-6s3-6 6-6c1 0 2 0 3 .5C20 13 23 11 26 11c5 0 9 4 9 9v1c3 1 5 4 5 7 0 4-3 7-7 7H16z" fill="${c}" opacity="0.9"/>`);
      case "wand":
        return base(`<path d="M12 36l22-22" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M33 13l4-4" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="10" r="2.5" fill="${c}"/>`);
      case "heart":
        return base(`<path d="M24 40s-14-8-14-18c0-5 4-9 9-9 3 0 5 1 7 3 2-2 4-3 7-3 5 0 9 4 9 9 0 10-18 18-18 18z" fill="${c}" opacity="0.9"/>`);
      case "star":
        return base(`<path d="M24 6l6 14h14l-11 9 4 15-13-9-13 9 4-15-11-9h14l6-14z" fill="${c}" opacity="0.9"/>`);
      case "potion":
        return base(`<path d="M18 6h12v4l-3 4v6l7 10c2 3 0 6-3 6H17c-3 0-5-3-3-6l7-10v-6l-3-4V6z" fill="${c}" opacity="0.9"/>`);
      case "gem":
        return base(`<path d="M16 14l8-8 8 8-8 26-8-26z" fill="${c}" opacity="0.9"/>`);
      case "book":
        return base(`<path d="M12 10c7 0 10 2 12 4v26c-2-2-5-4-12-4V10z" fill="${c}" opacity="0.9"/><path d="M36 10c-7 0-10 2-12 4v26c2-2 5-4 12-4V10z" fill="${c}" opacity="0.55"/>`);
      case "cloud":
        return base(`<path d="M16 30c-4 0-7-3-7-7 0-4 3-7 7-7 1 0 2 0 3 .5C20 13 23 11 27 11c6 0 10 4 10 10 3 1 5 4 5 7 0 4-3 7-7 7H16z" fill="${c}" opacity="0.9"/>`);
      case "feather":
        return base(`<path d="M36 12c-10 0-18 10-18 22 8-2 14-8 16-16-4 6-10 10-16 12 2-10 8-18 18-18z" fill="${c}" opacity="0.9"/>`);
      case "bell":
        return base(`<path d="M24 42c3 0 5-2 5-5H19c0 3 2 5 5 5z" fill="${c}" opacity="0.9"/><path d="M12 34h24c-2-3-4-6-4-14 0-6-4-10-8-10s-8 4-8 10c0 8-2 11-4 14z" fill="${c}" opacity="0.55"/>`);
      case "sun":
        return base(`<circle cx="24" cy="24" r="8" fill="${c}" opacity="0.9"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`);
      case "orb":
        return base(`<circle cx="24" cy="24" r="14" fill="${c}" opacity="0.25"/><circle cx="24" cy="24" r="9" fill="${c}" opacity="0.9"/>`);
      case "shield":
        return base(`<path d="M24 6l14 6v12c0 10-6 16-14 18-8-2-14-8-14-18V12l14-6z" fill="${c}" opacity="0.9"/>`);
      case "fish":
        return base(`<path d="M10 24c6-8 16-10 26-6l6-6v24l-6-6c-10 4-20 2-26-6z" fill="${c}" opacity="0.9"/><circle cx="30" cy="22" r="2" fill="#fff"/>`);
      case "cup":
        return base(`<path d="M16 12h16v10c0 6-4 10-8 10s-8-4-8-10V12z" fill="${c}" opacity="0.9"/><path d="M32 14h4c2 0 4 2 4 4s-2 4-4 4h-4v-8z" fill="${c}" opacity="0.55"/>`);
      default:
        return base(`<circle cx="24" cy="24" r="14" fill="${c}" opacity="0.9"/>`);
    }
  }

  // ===== Boot: ensure vault exists once L1 opened later =====
  function init() {
    renderTopBar();
    render();

    // If user completed up to L4 but no vault yet, create it
    const doneL4 = !!state.progress.completed["L4"];
    if (doneL4 && !state.progress.vaultCode) {
      ensureVaultCode();
      saveState();
    }

    // unlock audio on first touch anywhere
    window.addEventListener(
      "pointerdown",
      () => {
        unlockAudioOnce();
      },
      { once: true }
    );
  }

  init();
})();

// ===== Level 8: Spot the Difference =====
function renderL8(levelIndex0) {

  const differences = [
    { x: 20, y: 30 },
    { x: 70, y: 55 },
    { x: 40, y: 75 }
  ];

  const found = new Set();

  app.innerHTML = `
    <section class="card">
      <div class="h1" style="margin:0;">Bonus • Spot The Difference</div>
      <p class="p">Tap the 3 hidden differences.</p>

      <div class="spacer"></div>

      <div style="position:relative; width:100%; height:300px; background:rgba(132,139,121,0.15); border-radius:18px;" id="diffArea">
        ${differences.map((d,i)=>`
          <div data-i="${i}" 
               style="position:absolute; left:${d.x}%; top:${d.y}%; width:40px; height:40px; transform:translate(-50%,-50%);"
               class="diff-zone">
          </div>
        `).join("")}
      </div>

      <div class="spacer"></div>
      <div class="kpi"><span>Found</span><strong id="diffKpi">0/3</strong></div>

      <div class="spacer"></div>
      ${backToLevelsBtn()}
    </section>
  `;

  $$(".diff-zone").forEach((zone)=>{
    zone.addEventListener("click", ()=>{
      unlockAudioOnce();
      const i = zone.dataset.i;
      if(found.has(i)) return;

      found.add(i);
      playSfx("success");
      zone.style.background = "rgba(132,139,121,0.5)";
      zone.style.borderRadius = "50%";

      $("#diffKpi").textContent = `${found.size}/3`;

      if(found.size === differences.length){
        toast("Bonus complete ✦ Extra love note unlocked!");
        awardNote(levelIndex0);
        completeLevel("L8");
        saveState();
      }
    });
  });

  wireBackToLevels();
}

