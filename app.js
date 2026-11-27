/* ==========================================================================
   Clean Architecture Mastery — Interactive Testing Engine
   Modernized with Google Chrome Modern Web Guidance:
   - Surgical in-place DOM updates (zero full-card re-render glitching)
   - Directional View Transitions (document.startViewTransition with types)
   - Native <dialog closedby="any"> with top-layer exit animation & light-dismiss fallbacks
   - Identity-preserving moveBefore() reordering with view-transition-name: match-element
   - System-aware tri-state color-scheme <meta> toggle
   - Element.prototype.replaceChildren(), AbortSignal.timeout(), structuredClone(), .toSorted()
   ========================================================================== */

(() => {
  "use strict";

  const STORAGE_KEYS = {
    COLOR_SCHEME: "ca_mastery_color_scheme",
    GEMINI_KEY: "ca_mastery_gemini_key",
    GEMINI_MODEL: "ca_mastery_gemini_model",
    HISTORY: "ca_mastery_history_v1",
    SESSION_PREFIX: "ca_mastery_active_session_ch_",
  };

  const TYPE_LABELS = {
    mcq_single: "Diagnostic MCQ",
    mcq_multi: "Multi-Select Analysis",
    spot_flaw: "Spot the Flaw",
    cloze_bank: "Concept Completion",
    cloze_typed: "Precision Recall",
    order_steps: "Causal Sequence Puzzle",
    match_pairs: "Architectural Mapping",
    classify_buckets: "Triage Classification",
    claim_audit: "Claim Audit",
    free_response: "Own-Words Synthesis",
    js_code: "JavaScript Architecture Lab",
  };

  const state = {
    view: "home", // 'home' | 'setup' | 'quiz' | 'results'
    manifest: null,
    selectedChapterMeta: null,
    currentTest: null,
    setupConfig: {
      mode: "study", // 'study' | 'test'
      timerMinutes: 45,
      customMinutes: "",
    },
    session: null,
    timerInterval: null,
    activeClozeSlot: 0,
    activeMatchLeft: null,
    activeBucketItem: null,
    dragOrderNode: null,
    reviewFilter: "all", // 'all' | 'wrong' | 'ai' | 'flagged'
    isGradingBatch: false,
    navDrawerOpen: false,
  };

  /* ------------------------------------------------------------------------
     Initialization
     ------------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", async () => {
    initColorSchemeToggle();
    initApiDialog();
    initStickyHeaderFallback();
    initKeyboardShortcuts();
    initToggletipSystem();
    initOpticalMotion();

    document.getElementById("brand-home-btn").addEventListener("click", () => {
      if (state.view === "home") return;
      stopTimer();
      window.location.hash = "";
      navigateWithTransition(() => {
        state.view = "home";
        render();
      }, "backward");
    });

    await loadTestsManifest();
    await handleHashRoute();
    window.addEventListener("hashchange", handleHashRoute);
  });

  function initOpticalMotion() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const root = document.documentElement;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      root.style.setProperty("--mx", currentX.toFixed(4));
      root.style.setProperty("--my", currentY.toFixed(4));
      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    document.addEventListener(
      "pointermove",
      (e) => {
        targetX = (e.clientX / window.innerWidth) * 2 - 1;
        targetY = (e.clientY / window.innerHeight) * 2 - 1;
        if (!rafId) rafId = requestAnimationFrame(tick);

        const card = e.target.closest?.(".chapter-card, .hero-glass-stage, .setup-card, .mode-option");
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--spot-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
          card.style.setProperty("--spot-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
        }
      },
      { passive: true }
    );
  }

  function initStickyHeaderFallback() {
    if (window.CSS?.supports?.("container-type", "scroll-state")) return;
    const sticky = document.querySelector(".top-bar-container");
    if (!sticky) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        sticky.classList.toggle("is-stuck", entry.intersectionRatio < 1);
      },
      { threshold: [1], rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(sticky);
  }

  function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (state.view !== "quiz" || !state.session || state.isGradingBatch) return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.altKey && e.key === "ArrowRight") {
        document.getElementById("next-q-btn")?.click();
      } else if (e.altKey && e.key === "ArrowLeft") {
        document.getElementById("prev-q-btn")?.click();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Native Toggletip System (interestfor + popover="hint" + WCAG 1.4.13 Fallback)
     ------------------------------------------------------------------------ */

  const ownedToggletipTriggers = new WeakSet();

  function initToggletipSystem() {
    // Switch unsupported popover="hint" toggletips to "auto" in capturing beforetoggle
    const probe = document.createElement("div");
    probe.popover = "hint";
    if (probe.popover !== "hint") {
      document.addEventListener(
        "beforetoggle",
        ({ target, newState }) => {
          if (!(target instanceof HTMLElement)) return;
          const isToggletip =
            target.getAttribute("popover") === "hint" &&
            target.id &&
            document.querySelector(`[popovertarget="${CSS.escape(target.id)}"]`);
          if (newState === "open" && isToggletip) {
            target.popover = "auto";
          }
        },
        true
      );
    }

    // Sync aria-expanded from popover toggle events (capture phase since toggle does not bubble)
    document.addEventListener(
      "toggle",
      (event) => {
        const pop = event.target;
        if (!(pop instanceof HTMLElement) || !pop.id) return;
        const isOpen = event.newState === "open";
        document.querySelectorAll(`[interestfor="${CSS.escape(pop.id)}"]`).forEach((trigger) => {
          if (ownedToggletipTriggers.has(trigger)) {
            trigger.setAttribute("aria-expanded", String(isOpen));
          }
        });
      },
      true
    );

    wireToggletips(document);
  }

  function positionPopoverNearTrigger(trigger, pop) {
    if (window.CSS?.supports?.("position-area: block-end")) return;
    const rect = trigger.getBoundingClientRect();
    const popWidth = Math.min(360, window.innerWidth - 32);
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - popWidth - 16));
    const spaceBelow = window.innerHeight - rect.bottom;
    pop.style.position = "fixed";
    pop.style.margin = "0";
    pop.style.inset = "auto";
    pop.style.left = `${left}px`;
    if (spaceBelow >= 180 || spaceBelow >= rect.top) {
      pop.style.top = `${rect.bottom + 8}px`;
      pop.style.bottom = "auto";
    } else {
      pop.style.bottom = `${window.innerHeight - rect.top + 8}px`;
      pop.style.top = "auto";
    }
  }

  function wireToggletips(root = document) {
    const nativeInterest = "interestForElement" in HTMLButtonElement.prototype;
    root.querySelectorAll("[interestfor]").forEach((trigger) => {
      if (trigger.dataset.tipWired === "1") return;
      const targetId = trigger.getAttribute("interestfor");
      const pop = targetId ? document.getElementById(targetId) : null;
      if (!pop) return;
      trigger.dataset.tipWired = "1";

      // Explicit ARIA wiring for assistive tech
      if (!pop.hasAttribute("role")) {
        pop.setAttribute("role", "tooltip");
      }
      if (!trigger.hasAttribute("aria-expanded")) {
        trigger.setAttribute("aria-expanded", String(pop.matches(":popover-open")));
        ownedToggletipTriggers.add(trigger);
      }

      // Prevent chapter/mode card parent button click when tapping an embedded info icon
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        positionPopoverNearTrigger(trigger, pop);
      });

      if (!nativeInterest && typeof pop.showPopover === "function") {
        let hideTimer = null;
        const scheduleHide = () => {
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            if (pop.matches(":popover-open")) {
              try {
                pop.hidePopover();
              } catch {}
            }
          }, 150);
        };
        const openNow = () => {
          clearTimeout(hideTimer);
          positionPopoverNearTrigger(trigger, pop);
          if (!pop.matches(":popover-open")) {
            try {
              pop.showPopover();
            } catch {}
          }
        };

        trigger.addEventListener("pointerenter", (e) => {
          if (e.pointerType !== "touch") openNow();
        });
        trigger.addEventListener("pointerleave", (e) => {
          if (e.pointerType !== "touch") scheduleHide();
        });
        trigger.addEventListener("focus", openNow);
        trigger.addEventListener("blur", scheduleHide);
        pop.addEventListener("pointerenter", () => clearTimeout(hideTimer));
        pop.addEventListener("pointerleave", scheduleHide);
      }
    });
  }

  function renderInfoTip(id, ariaLabel, detailsText) {
    if (!detailsText || !String(detailsText).trim()) return "";
    return `
      <span class="inline-with-tip" style="gap:0;">
        <button
          type="button"
          class="info-tip-trigger"
          interestfor="${escapeHtml(id)}"
          popovertarget="${escapeHtml(id)}"
          popovertargetaction="show"
          aria-label="${escapeHtml(ariaLabel)}"
        >i</button>
        <div id="${escapeHtml(id)}" class="info-tip-popover" popover="hint">
          <div class="info-tip-inner">${escapeHtml(detailsText)}</div>
        </div>
      </span>
    `;
  }

  /* ------------------------------------------------------------------------
     View Transitions Helper (directional-navigation-transitions & same-document-transitions)
     ------------------------------------------------------------------------ */

  function navigateWithTransition(updateDOM, direction = "forward", focusTargetSelector = "#app-main") {
    const routeFocus = () => {
      const target = document.querySelector(focusTargetSelector) || document.getElementById("app-main");
      target?.focus({ preventScroll: true });
    };

    if (!document.startViewTransition) {
      updateDOM();
      routeFocus();
      return;
    }

    try {
      const transition = document.startViewTransition({
        update: updateDOM,
        types: [direction],
      });
      transition.finished.finally(routeFocus);
    } catch {
      const transition = document.startViewTransition(updateDOM);
      transition.finished.finally(routeFocus);
    }
  }

  function announceStatus(message) {
    const el = document.getElementById("sr-live-status");
    if (el) el.textContent = message;
  }

  /* ------------------------------------------------------------------------
     Color Scheme Toggle (dark-mode & dark-mode-toggle guides)
     ------------------------------------------------------------------------ */

  function getMetaColorScheme() {
    return document.querySelector('meta[name="color-scheme"]');
  }

  function getSystemScheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getStoredScheme() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME);
      return val === "light" || val === "dark" ? val : null;
    } catch {
      return null;
    }
  }

  function initColorSchemeToggle() {
    const meta = getMetaColorScheme();
    const stored = getStoredScheme();
    if (meta) {
      meta.content = stored ?? "light dark";
    }

    document.getElementById("theme-toggle-btn").addEventListener("click", () => {
      const systemScheme = getSystemScheme();
      const currentRendered = getStoredScheme() ?? systemScheme;
      const targetScheme = currentRendered === "dark" ? "light" : "dark";

      try {
        if (targetScheme === systemScheme) {
          localStorage.removeItem(STORAGE_KEYS.COLOR_SCHEME);
        } else {
          localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, targetScheme);
        }
      } catch {}

      if (meta) {
        meta.content = targetScheme === systemScheme ? "light dark" : targetScheme;
      }
      announceStatus(`Switched to ${targetScheme} color theme`);
    });

    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEYS.COLOR_SCHEME && meta) {
        meta.content = getStoredScheme() ?? "light dark";
      }
    });
  }

  /* ------------------------------------------------------------------------
     Native <dialog> Modal + Top-Layer Exit Animation Fallback
     (dialog, light-dismiss-a-dialog, animate-to-from-top-layer)
     ------------------------------------------------------------------------ */

  let supportsDisplayTransition;
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
      return false;
    }
    const probe = document.createElement("div");
    probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = "none";
    supportsDisplayTransition = getComputedStyle(probe).display === "block";
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return Boolean(window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay());
  }

  async function closeTopLayer(dialogEl) {
    if (!dialogEl.open) return;
    if (!supportsTopLayerExit()) {
      dialogEl.setAttribute("data-closing", "");
      const animations = dialogEl.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((r) => setTimeout(r, 400)),
        ]);
      }
      if (!dialogEl.hasAttribute("data-closing")) return;
      dialogEl.removeAttribute("data-closing");
    }
    dialogEl.close();
  }

  function getGeminiKey() {
    try {
      return (localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "").trim();
    } catch {
      return "";
    }
  }

  const VALID_GEMINI_MODELS = new Set([
    "gemini-4-neon",
    "gemini-4-argon",
    "gemini-4-hydrogen",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
  ]);

  function getGeminiModel() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL);
      if (saved && VALID_GEMINI_MODELS.has(saved)) return saved;
      return "gemini-4-neon";
    } catch {
      return "gemini-4-neon";
    }
  }

  function updateApiDot() {
    const dot = document.getElementById("api-status-dot");
    if (!dot) return;
    dot.classList.toggle("connected", Boolean(getGeminiKey()));
  }

  function initApiDialog() {
    updateApiDot();
    const dialog = document.getElementById("api-dialog");
    const openBtn = document.getElementById("open-api-modal-btn");
    const closeBtn = document.getElementById("close-api-modal-btn");
    const clearBtn = document.getElementById("clear-api-key-btn");
    const testBtn = document.getElementById("test-api-key-btn");
    const saveBtn = document.getElementById("save-api-key-btn");
    const input = document.getElementById("gemini-key-input");
    const modelSelect = document.getElementById("gemini-model-select");
    const feedback = document.getElementById("api-test-feedback");

    const populateDialogFields = () => {
      input.value = getGeminiKey();
      modelSelect.value = getGeminiModel();
      feedback.textContent = getGeminiKey()
        ? `✓ Key saved (${getGeminiModel()}). Click Test Key to verify.`
        : "No key saved yet. Built-in Rubric Analyzer will grade written answers until you add one.";
    };

    openBtn.addEventListener("click", () => {
      populateDialogFields();
      if (!dialog.open) {
        dialog.showModal();
      }
    });

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeTopLayer(dialog);
    });

    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeTopLayer(dialog);
    });

    dialog.addEventListener("close", () => {
      dialog.returnValue = "";
    });

    // Fallback for browsers without native <dialog closedby="any"> support
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const isOutside = (e, dlg) => {
        const r = dlg.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dialog.addEventListener("pointerdown", (e) => {
        pressedOutside = e.target === dialog && isOutside(e, dialog);
      });
      dialog.addEventListener("pointerup", (e) => {
        if (pressedOutside && e.target === dialog && isOutside(e, dialog)) {
          closeTopLayer(dialog);
        }
        pressedOutside = false;
      });
    }

    if (testBtn) {
      testBtn.addEventListener("click", async () => {
        const key = input.value.trim();
        const model = modelSelect.value;
        if (!key) {
          feedback.textContent = "✕ Enter a Gemini API key first.";
          return;
        }
        testBtn.disabled = true;
        feedback.textContent = `Testing ${model}…`;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(15_000),
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Reply with OK" }] }],
            }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = errData?.error?.message || `HTTP ${res.status}`;
            feedback.textContent = `✕ Failed (${model}): ${msg}`;
          } else {
            feedback.textContent = `✓ Working! Connected to ${model}.`;
          }
        } catch (err) {
          feedback.textContent = `✕ Network/Timeout error: ${err.message}`;
        } finally {
          testBtn.disabled = false;
        }
      });
    }

    clearBtn.addEventListener("click", () => {
      try {
        localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
      } catch {}
      input.value = "";
      updateApiDot();
      feedback.textContent = "API key cleared from this browser.";
      updateHomeApiStatInPlace();
    });

    saveBtn.addEventListener("click", () => {
      const val = input.value.trim();
      try {
        if (val) {
          localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, val);
        } else {
          localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
        }
        localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, modelSelect.value);
      } catch {}
      updateApiDot();
      updateHomeApiStatInPlace();
      closeTopLayer(dialog);
    });
  }

  function updateHomeApiStatInPlace() {
    const statEl = document.getElementById("home-api-stat-val");
    if (statEl) {
      statEl.textContent = getGeminiKey() ? "Connected" : "Optional";
    }
  }

  /* ------------------------------------------------------------------------
     Manifest & Routing
     ------------------------------------------------------------------------ */

  async function loadTestsManifest() {
    try {
      const res = await fetch(`data/tests_manifest.json?t=${Date.now()}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.manifest = await res.json();
    } catch (err) {
      console.error(err);
      state.manifest = { book_title: "Clean Architecture", available_tests: [] };
    }
  }

  async function handleHashRoute() {
    const rawHash = window.location.hash.slice(1);
    const params = new URLSearchParams(rawHash);
    const chapParam = params.get("chapter");
    if (chapParam && state.manifest) {
      const chapNum = parseInt(chapParam, 10);
      const meta = (state.manifest.available_tests || []).find((t) => t.chapter === chapNum);
      if (meta) {
        await openChapterSetup(meta);
        return;
      }
    }
    if (state.view === "home") {
      render();
    }
  }

  async function openChapterSetup(meta) {
    state.selectedChapterMeta = meta;
    try {
      const res = await fetch(`${meta.file}?t=${Date.now()}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.currentTest = await res.json();
      navigateWithTransition(() => {
        state.view = "setup";
        render();
      }, "forward");
    } catch (e) {
      announceStatus(`Could not load chapter test: ${e.message}`);
    }
  }

  /* ------------------------------------------------------------------------
     History & Session Persistence
     ------------------------------------------------------------------------ */

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "{}");
    } catch {
      return {};
    }
  }

  function saveChapterResult(chapterNum, resultObj) {
    try {
      const hist = getHistory();
      const prev = hist[chapterNum];
      const bestPct = prev ? Math.max(prev.bestPct || 0, resultObj.percentage) : resultObj.percentage;
      hist[chapterNum] = {
        ...resultObj,
        bestPct,
        attempts: (prev?.attempts || 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(hist));
    } catch {}
  }

  function getSavedSession(chapterNum) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + chapterNum);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function persistSession() {
    if (!state.session) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.SESSION_PREFIX + state.session.chapter,
        JSON.stringify(state.session)
      );
    } catch {}
  }

  function clearSavedSession(chapterNum) {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + chapterNum);
    } catch {}
  }

  /* ------------------------------------------------------------------------
     Quiz Session Lifecycle & Timer
     ------------------------------------------------------------------------ */

  function startNewSession(mode, timerMinutes) {
    const test = state.currentTest;
    const initialAnswers = {};
    test.questions.forEach((q, idx) => {
      if (q.type === "order_steps") {
        initialAnswers[idx] = [...q.initial_order];
      } else if (q.type === "js_code") {
        initialAnswers[idx] = q.starter_code || "";
      } else if (q.type === "cloze_bank" || q.type === "cloze_typed") {
        initialAnswers[idx] = new Array(q.blanks.length).fill("");
      } else if (q.type === "match_pairs") {
        initialAnswers[idx] = {};
      } else if (q.type === "classify_buckets") {
        initialAnswers[idx] = {};
      }
    });

    state.session = {
      chapter: test.chapter,
      mode,
      timerSecondsTotal: mode === "test" ? timerMinutes * 60 : 0,
      timerSecondsLeft: mode === "test" ? timerMinutes * 60 : 0,
      elapsedSeconds: 0,
      currentIndex: 0,
      answers: initialAnswers,
      evaluations: {},
      flagged: {},
      submitted: false,
      startedAt: new Date().toISOString(),
    };

    resetTransientPickers();
    persistSession();
    startTimerIfNeeded();
    navigateWithTransition(() => {
      state.view = "quiz";
      render();
    }, "forward");
  }

  function resumeSavedSession(saved) {
    state.session = structuredClone(saved);
    resetTransientPickers();
    if (!state.session.submitted) {
      startTimerIfNeeded();
    }
    navigateWithTransition(() => {
      state.view = state.session.submitted ? "results" : "quiz";
      render();
    }, "forward");
  }

  function startTimerIfNeeded() {
    stopTimer();
    if (!state.session || state.session.submitted) return;
    state.timerInterval = setInterval(() => {
      if (!state.session || state.session.submitted) {
        stopTimer();
        return;
      }
      state.session.elapsedSeconds = (state.session.elapsedSeconds || 0) + 1;
      if (state.session.mode === "test" && state.session.timerSecondsTotal > 0) {
        state.session.timerSecondsLeft = Math.max(0, state.session.timerSecondsLeft - 1);
        updateTopTimerDisplay();
        if (state.session.timerSecondsLeft <= 0) {
          stopTimer();
          finalizeAndSubmitQuiz(true);
        }
      } else {
        updateTopTimerDisplay();
      }
      if (state.session.elapsedSeconds % 5 === 0) {
        persistSession();
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.floor(sec));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }

  function updateTopTimerDisplay() {
    const el = document.getElementById("live-timer-pill");
    if (!el || !state.session) return;
    if (state.session.mode === "test" && state.session.timerSecondsTotal > 0) {
      const left = state.session.timerSecondsLeft;
      el.textContent = formatDuration(left);
      el.classList.remove("warning", "danger");
      if (left <= 60) el.classList.add("danger");
      else if (left <= 300) el.classList.add("warning");
    } else {
      el.textContent = formatDuration(state.session.elapsedSeconds || 0);
    }
  }

  /* ------------------------------------------------------------------------
     Evaluation Logic (Objective + Sandboxed JS + Gemini AI with AbortSignal.timeout)
     ------------------------------------------------------------------------ */

  function isAnswerProvided(q, ans) {
    if (ans === undefined || ans === null) return false;
    switch (q.type) {
      case "mcq_single":
        return typeof ans === "number";
      case "mcq_multi":
      case "spot_flaw":
        return Array.isArray(ans) && ans.length > 0;
      case "cloze_bank":
      case "cloze_typed":
        return Array.isArray(ans) && ans.every((v) => String(v || "").trim().length > 0);
      case "order_steps":
        return Array.isArray(ans) && ans.length === q.items.length;
      case "match_pairs":
        return typeof ans === "object" && Object.keys(ans).length === q.pairs.length;
      case "classify_buckets":
        return typeof ans === "object" && Object.keys(ans).length === q.items.length;
      case "claim_audit":
        return Boolean(ans && ans.verdict);
      case "free_response":
        return typeof ans === "string" && ans.trim().length >= 8;
      case "js_code":
        return typeof ans === "string" && ans.trim().length > 0;
      default:
        return false;
    }
  }

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9$]+/g, " ")
      .trim();
  }

  function evaluateObjectiveQuestion(q, ans) {
    switch (q.type) {
      case "mcq_single": {
        const isCorrect = ans === q.correct_index;
        return {
          status: isCorrect ? "correct" : "wrong",
          score: isCorrect ? 1 : 0,
          feedback: q.overall_explanation,
        };
      }

      case "mcq_multi": {
        const selected = new Set(Array.isArray(ans) ? ans : []);
        const expected = new Set(q.correct_indices);
        let matches = 0;
        let wrongPicks = 0;
        selected.forEach((idx) => {
          if (expected.has(idx)) matches++;
          else wrongPicks++;
        });
        const exact = matches === expected.size && wrongPicks === 0;
        const partial = !exact && matches > 0 && wrongPicks <= 1;
        const score = exact ? 1 : partial ? Math.max(0.25, (matches - wrongPicks * 0.5) / expected.size) : 0;
        return {
          status: exact ? "correct" : partial ? "partial" : "wrong",
          score: Number(score.toFixed(2)),
          feedback: q.overall_explanation,
        };
      }

      case "spot_flaw": {
        const selected = new Set(Array.isArray(ans) ? ans : []);
        const expected = new Set(q.flawed_indices || []);
        let hits = 0;
        let misses = 0;
        selected.forEach((i) => {
          if (expected.has(i)) hits++;
          else misses++;
        });
        const exact = hits === expected.size && misses === 0;
        return {
          status: exact ? "correct" : hits > 0 ? "partial" : "wrong",
          score: exact ? 1 : hits > 0 ? 0.5 : 0,
          feedback: q.overall_explanation,
        };
      }

      case "cloze_bank":
      case "cloze_typed": {
        const given = Array.isArray(ans) ? ans : [];
        const perBlank = q.blanks.map((b, i) => {
          const userVal = normalizeText(given[i]);
          const accepted = (b.accepted || [b.answer]).map(normalizeText);
          return accepted.includes(userVal);
        });
        const correctCount = perBlank.filter(Boolean).length;
        const total = q.blanks.length;
        const score = total > 0 ? correctCount / total : 0;
        return {
          status: correctCount === total ? "correct" : correctCount > 0 ? "partial" : "wrong",
          score: Number(score.toFixed(2)),
          perBlank,
          feedback: q.overall_explanation,
        };
      }

      case "order_steps": {
        const given = Array.isArray(ans) ? ans : [];
        const expected = q.correct_order;
        let exactPositions = 0;
        expected.forEach((val, idx) => {
          if (given[idx] === val) exactPositions++;
        });
        const exact = exactPositions === expected.length;
        return {
          status: exact ? "correct" : exactPositions >= Math.ceil(expected.length / 2) ? "partial" : "wrong",
          score: exact ? 1 : Number((exactPositions / expected.length).toFixed(2)),
          feedback: q.overall_explanation,
        };
      }

      case "match_pairs": {
        const mapping = ans || {};
        let correctPairs = 0;
        q.pairs.forEach((_, idx) => {
          if (mapping[idx] === idx) correctPairs++;
        });
        const total = q.pairs.length;
        const exact = correctPairs === total;
        return {
          status: exact ? "correct" : correctPairs > 0 ? "partial" : "wrong",
          score: Number((correctPairs / total).toFixed(2)),
          feedback: q.overall_explanation,
        };
      }

      case "classify_buckets": {
        const mapping = ans || {};
        let correctItems = 0;
        q.items.forEach((item, idx) => {
          if (mapping[idx] === item.bucket) correctItems++;
        });
        const total = q.items.length;
        const exact = correctItems === total;
        return {
          status: exact ? "correct" : correctItems > 0 ? "partial" : "wrong",
          score: Number((correctItems / total).toFixed(2)),
          feedback: q.overall_explanation,
        };
      }

      default:
        return null;
    }
  }

  function runSandboxedJsTests(q, userCode) {
    const results = [];
    let passCount = 0;
    for (const tc of q.test_cases || []) {
      try {
        const fn = new Function(`${userCode}\n; return (${tc.call});`);
        const actual = fn();
        const actualJson = JSON.stringify(actual);
        const expectedJson = JSON.stringify(tc.expected);
        const passed = actualJson === expectedJson;
        if (passed) passCount++;
        results.push({
          label: tc.label || tc.call,
          passed,
          expected: expectedJson,
          actual: actualJson,
        });
      } catch (err) {
        results.push({
          label: tc.label || tc.call,
          passed: false,
          expected: JSON.stringify(tc.expected),
          actual: `Error: ${err.message}`,
        });
      }
    }
    const total = (q.test_cases || []).length || 1;
    const score = Number((passCount / total).toFixed(2));
    return {
      status: passCount === total ? "correct" : passCount > 0 ? "partial" : "wrong",
      score,
      jsResults: results,
      feedback:
        passCount === total
          ? `All ${total} JavaScript architecture assertions passed! ${q.overall_explanation}`
          : `${passCount} of ${total} assertions passed. Review the failed test case output and architectural principle below.`,
    };
  }

  function evaluateHeuristicRubric(q, textAnswer, verdictCorrect = true) {
    const norm = normalizeText(textAnswer);
    const concepts = q.key_concepts || [];
    const hits = [];
    const missed = [];
    concepts.forEach((c) => {
      const tokens = normalizeText(c).split(" ").filter((t) => t.length > 3);
      const matched = tokens.some((tok) => norm.includes(tok));
      if (matched) hits.push(c);
      else missed.push(c);
    });

    const conceptRatio = concepts.length > 0 ? hits.length / concepts.length : 1;
    const lengthBonus = norm.split(" ").length >= 18 ? 0.25 : 0;
    let rawScore = Math.min(1, conceptRatio * 0.85 + lengthBonus);
    if (!verdictCorrect) rawScore = rawScore * 0.35;

    const status = rawScore >= 0.75 ? "correct" : rawScore >= 0.4 ? "partial" : "wrong";
    return {
      status,
      score: Number(rawScore.toFixed(2)),
      gradedBy: "Rubric Analyzer (Add Gemini API Key in top bar for live AI critique)",
      feedback:
        missed.length === 0
          ? `Strong coverage of the core concepts. ${q.model_answer}`
          : `You covered ${hits.length}/${concepts.length} core concepts. Make sure to also address: ${missed.join("; ")}.`,
      rubricHits: hits,
      rubricMissed: missed,
    };
  }

  async function evaluateWithGemini(q, userAnswer) {
    const apiKey = getGeminiKey();
    if (!apiKey) {
      if (q.type === "claim_audit") {
        const vMatch = userAnswer?.verdict === q.correct_verdict;
        if (!userAnswer?.reasoning || userAnswer.reasoning.trim().length < 6) {
          return {
            status: vMatch ? "correct" : "wrong",
            score: vMatch ? 1 : 0,
            gradedBy: "Verdict Check",
            feedback: q.overall_explanation || q.model_answer,
          };
        }
        return evaluateHeuristicRubric(q, userAnswer.reasoning, vMatch);
      }
      return evaluateHeuristicRubric(q, userAnswer, true);
    }

    const model = getGeminiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const studentText =
      q.type === "claim_audit"
        ? `Verdict chosen: ${userAnswer?.verdict} (Expected verdict: ${q.correct_verdict})\nStudent Justification: ${userAnswer?.reasoning || "(none)"}`
        : String(userAnswer || "");

    const prompt = `You are a rigorous software architecture professor grading a student's response on Robert C. Martin's "Clean Architecture".
Question Prompt: ${q.prompt}
${q.claim ? `Claim Being Audited: "${q.claim}"` : ""}
Expected Key Concepts / Rubric: ${JSON.stringify(q.key_concepts || [])}
Reference Model Answer: ${q.model_answer || q.overall_explanation}

Student Response:
"""
${studentText}
"""

Evaluate the student's understanding strictly but fairly. Return ONLY valid JSON with this exact schema:
{
  "score": <number between 0.0 and 1.0>,
  "status": "<'correct' if score >= 0.8, 'partial' if 0.4 <= score < 0.8, else 'wrong'>",
  "feedback": "<2-4 sentences addressing the student directly ('You...'): praise what they nailed, pinpoint any misconception or missing nuance, and connect back to the chapter principle>",
  "concepts_hit": ["<concept 1>", ...],
  "concepts_missed": ["<missing concept>", ...]
}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = JSON.parse(rawText);
      const score = Math.max(0, Math.min(1, Number(parsed.score ?? 0)));
      const status = score >= 0.8 ? "correct" : score >= 0.4 ? "partial" : "wrong";
      return {
        status,
        score: Number(score.toFixed(2)),
        gradedBy: `Gemini AI (${model})`,
        feedback: parsed.feedback || q.model_answer,
        rubricHits: parsed.concepts_hit || [],
        rubricMissed: parsed.concepts_missed || [],
      };
    } catch (err) {
      const reason =
        err instanceof DOMException && err.name === "TimeoutError"
          ? new Error("Gemini evaluation timed out after 25s", { cause: err })
          : new Error(`Gemini API fallback: ${err.message}`, { cause: err });
      console.warn(reason);
      const vMatch = q.type === "claim_audit" ? userAnswer?.verdict === q.correct_verdict : true;
      const text = q.type === "claim_audit" ? userAnswer?.reasoning || "" : userAnswer;
      return evaluateHeuristicRubric(q, text, vMatch);
    }
  }

  async function evaluateSingleQuestion(idx) {
    const q = state.currentTest.questions[idx];
    const ans = state.session.answers[idx];

    if (!isAnswerProvided(q, ans)) {
      state.session.evaluations[idx] = {
        status: "wrong",
        score: 0,
        feedback: "No answer was submitted for this question.",
      };
      return;
    }

    if (q.type === "js_code") {
      state.session.evaluations[idx] = runSandboxedJsTests(q, ans);
      return;
    }

    if (q.type === "free_response" || q.type === "claim_audit") {
      state.session.evaluations[idx] = await evaluateWithGemini(q, ans);
      return;
    }

    state.session.evaluations[idx] = evaluateObjectiveQuestion(q, ans);
  }

  async function finalizeAndSubmitQuiz(autoSubmittedByTimer = false) {
    if (!state.session || state.session.submitted) return;
    stopTimer();
    state.isGradingBatch = true;
    render();

    const questions = state.currentTest.questions;
    for (let i = 0; i < questions.length; i++) {
      if (!state.session.evaluations[i]) {
        await evaluateSingleQuestion(i);
      }
    }

    state.isGradingBatch = false;
    state.session.submitted = true;
    state.session.autoSubmittedByTimer = autoSubmittedByTimer;
    persistSession();

    const summary = computeSessionSummary();
    saveChapterResult(state.currentTest.chapter, summary);
    navigateWithTransition(() => {
      state.view = "results";
      render();
    }, "forward");
  }

  function computeSessionSummary() {
    const questions = state.currentTest.questions;
    let totalScore = 0;
    let correctCount = 0;
    let partialCount = 0;
    let wrongCount = 0;

    questions.forEach((_, idx) => {
      const ev = state.session.evaluations[idx];
      if (!ev) {
        wrongCount++;
        return;
      }
      totalScore += ev.score || 0;
      if (ev.status === "correct") correctCount++;
      else if (ev.status === "partial") partialCount++;
      else wrongCount++;
    });

    const percentage = Math.round((totalScore / questions.length) * 100);
    return {
      chapter: state.currentTest.chapter,
      mode: state.session.mode,
      percentage,
      totalScore: Number(totalScore.toFixed(1)),
      totalQuestions: questions.length,
      correctCount,
      partialCount,
      wrongCount,
      elapsedSeconds: state.session.elapsedSeconds || 0,
    };
  }

  /* ------------------------------------------------------------------------
     Top App Bar & View Dispatcher (Element.prototype.replaceChildren())
     ------------------------------------------------------------------------ */

  function render() {
    const main = document.getElementById("app-main");
    const topCenter = document.getElementById("top-bar-center");
    const progressFill = document.getElementById("top-progress-fill");

    document.body.dataset.view = state.view;
    topCenter.replaceChildren();
    progressFill.style.inlineSize = "0%";

    if (state.view === "home") {
      renderHomeView(main);
    } else if (state.view === "setup") {
      renderSetupView(main);
    } else if (state.view === "quiz") {
      renderQuizTopBar(topCenter, progressFill);
      renderQuizView(main);
    } else if (state.view === "results") {
      progressFill.style.inlineSize = "100%";
      renderResultsView(main);
    }

    wireToggletips(main);
  }

  function renderQuizTopBar(topCenter, progressFill) {
    const total = state.currentTest.questions.length;
    const answeredCount = state.currentTest.questions.filter((q, idx) =>
      isAnswerProvided(q, state.session.answers[idx])
    ).length;
    const pct = Math.round(((state.session.currentIndex + 1) / total) * 100);
    progressFill.style.inlineSize = `${pct}%`;

    const modeLabel = state.session.mode === "study" ? "Study" : "Test";
    const timeVal =
      state.session.mode === "test" && state.session.timerSecondsTotal > 0
        ? formatDuration(state.session.timerSecondsLeft)
        : formatDuration(state.session.elapsedSeconds || 0);

    topCenter.innerHTML = `
      <div class="quiz-header-pills">
        <span id="top-mode-count-pill" class="mode-pill">${modeLabel} · ${answeredCount}/${total}</span>
        <span id="live-timer-pill" class="timer-pill">${timeVal}</span>
      </div>
    `;
  }

  function updateTopBarCountInPlace() {
    const pill = document.getElementById("top-mode-count-pill");
    if (!pill || !state.currentTest || !state.session) return;
    const total = state.currentTest.questions.length;
    const answeredCount = state.currentTest.questions.filter((q, idx) =>
      isAnswerProvided(q, state.session.answers[idx])
    ).length;
    const modeLabel = state.session.mode === "study" ? "Study" : "Test";
    pill.textContent = `${modeLabel} · ${answeredCount}/${total}`;
  }

  /* ------------------------------------------------------------------------
     View 1: Home / Chapter Library (Ultra-Minimalist Copy + Info Toggletips)
     ------------------------------------------------------------------------ */

  function renderHomeView(container) {
    const tests = (state.manifest?.available_tests || []).toSorted((a, b) => a.chapter - b.chapter);
    const history = getHistory();
    const completedChapters = Object.values(history).filter((h) => h.percentage >= 75).length;
    const totalQuestionsAvailable = tests.reduce((acc, t) => acc + (t.question_count || 30), 0);

    const cardsHtml = tests
      .map((t, idx) => {
        const h = history[t.chapter];
        const savedSession = getSavedSession(t.chapter);
        const hasInProgress = savedSession && !savedSession.submitted;
        const isPassed = h && h.bestPct >= 75;

        let statusChip = `<span class="score-chip">30 Questions</span>`;
        if (hasInProgress) {
          statusChip = `<span class="score-chip in-progress">In Progress</span>`;
        } else if (h) {
          statusChip = `<span class="score-chip ${isPassed ? "passed" : ""}">${isPassed ? "✓ " : ""}Best: ${h.bestPct}%</span>`;
        }

        const chapTip = renderInfoTip(
          `tip-ch-${t.chapter}`,
          `Chapter ${t.chapter} topics`,
          t.subtitle || `30 interactive questions covering Chapter ${t.chapter}.`
        );

        return `
          <div class="chapter-card ${isPassed ? "completed" : ""}" style="--stagger-i:${idx};" role="button" tabindex="0" data-chapter="${t.chapter}" id="chapter-card-${t.chapter}">
            <div class="chapter-card-left">
              <div class="chapter-num">${String(t.chapter).padStart(2, "0")}</div>
              <div class="chapter-meta">
                <div class="chapter-part">${escapeHtml(t.part || "Clean Architecture")} · ${escapeHtml(t.released_on || "Today")}</div>
                <div class="inline-with-tip">
                  <h2 class="chapter-name">Chapter ${t.chapter}: ${escapeHtml(t.title)}</h2>
                  ${chapTip}
                </div>
              </div>
            </div>
            <div class="chapter-card-right">
              ${statusChip}
              <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        `;
      })
      .join("");

    const overviewTip = renderInfoTip(
      "tip-home-overview",
      "How the platform works",
      "Two chapters unlock per study block.\n\nEach test has 30 interactive questions across 11 formats (MCQs with per-option explanations, spot-the-flaw, sequence puzzles, matching, triage buckets, claim audits, live JavaScript labs, and Gemini AI own-words grading)."
    );

    container.innerHTML = `
      <section>
        <div class="home-header">
          <div class="hero-glass-stage">
            <div class="hero-artwork" aria-hidden="true">
              <img class="hero-art-img hero-art-light" src="assets/prism-hero-light.jpg" alt="" decoding="async" />
              <img class="hero-art-img hero-art-dark" src="assets/prism-hero-dark.jpg" alt="" decoding="async" />
              <div class="hero-scrim"></div>
            </div>

            <div class="hero-copy">
              <p class="home-eyebrow">
                <span class="eyebrow-dot" aria-hidden="true"></span>
                Clean Architecture · Robert C. Martin
              </p>
              <h1 class="home-title">Daily Mastery</h1>
              <div class="inline-with-tip">
                <p class="home-subtitle">30 interactive questions per chapter · JS &amp; AI graded</p>
                ${overviewTip}
              </div>
            </div>

            <div class="hero-layer-pills" aria-hidden="true">
              <span class="layer-pill">Entities</span>
              <span class="layer-pill">Use Cases</span>
              <span class="layer-pill">Adapters</span>
              <span class="layer-pill">Frameworks</span>
            </div>
          </div>

          <div class="home-stats-strip">
            <div class="stat-item">
              <span class="stat-value">${tests.length} / ${state.manifest?.total_book_chapters || 34}</span>
              <span class="stat-label">Unlocked</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${totalQuestionsAvailable}</span>
              <span class="stat-label">Questions</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${completedChapters}</span>
              <span class="stat-label">Mastered</span>
            </div>
            <div class="stat-item">
              <span id="home-api-stat-val" class="stat-value">${getGeminiKey() ? "Active" : "Optional"}</span>
              <span class="stat-label">AI Grader</span>
            </div>
          </div>
        </div>

        <p class="section-kicker">Available Chapters</p>
        <div class="chapter-list">
          ${cardsHtml}
        </div>
      </section>
    `;

    container.querySelectorAll(".chapter-card").forEach((card) => {
      const openCard = async () => {
        const chapNum = parseInt(card.getAttribute("data-chapter"), 10);
        const meta = tests.find((x) => x.chapter === chapNum);
        if (meta) await openChapterSetup(meta);
      };
      card.addEventListener("click", (e) => {
        if (e.target.closest(".info-tip-trigger, .info-tip-popover")) return;
        openCard();
      });
      card.addEventListener("keydown", (e) => {
        if (e.target.closest(".info-tip-trigger, .info-tip-popover")) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCard();
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     View 2: Mode Setup (Concise Cards + Hover Info Icons)
     ------------------------------------------------------------------------ */

  function renderSetupView(container) {
    const test = state.currentTest;
    const saved = getSavedSession(test.chapter);
    const mode = state.setupConfig.mode;
    const mins = state.setupConfig.timerMinutes;

    const resumeHtml =
      saved && !saved.submitted
        ? `
        <div id="resume-session-banner" class="resume-banner">
          <div>
            <strong>${saved.mode === "study" ? "Study" : "Test"} in progress</strong> · Q${saved.currentIndex + 1}/${test.questions.length}
          </div>
          <div style="display:flex;gap:8px;">
            <button id="discard-saved-btn" class="btn btn-text btn-sm" type="button">Discard</button>
            <button id="resume-saved-btn" class="btn btn-filled glimmer-btn btn-sm" type="button">Resume</button>
          </div>
        </div>
      `
        : "";

    const chapOverviewTip = renderInfoTip(
      "tip-setup-chapter",
      "Chapter overview",
      test.description || test.subtitle || ""
    );

    const studyTip = renderInfoTip(
      "tip-mode-study",
      "Study Mode details",
      "Instant green/red feedback after every answer. Reveals why every right and wrong MCQ choice is right or wrong, runs JS unit tests live, and gives instant Gemini AI critiques."
    );

    const testTip = renderInfoTip(
      "tip-mode-test",
      "Test Mode details",
      "Timed exam with your chosen duration. Answers and explanations stay hidden until submission or 00:00, followed by batch AI grading and a complete review."
    );

    container.innerHTML = `
      <section class="setup-shell">
        <button id="setup-back-btn" class="back-link" type="button">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Chapters
        </button>

        <div class="setup-card">
          ${resumeHtml}
          <div class="setup-chapter-tag">${escapeHtml(test.part)} · Chapter ${test.chapter}</div>
          <div class="title-with-tip" style="margin-block-end:26px;">
            <h1 class="setup-title" style="margin:0;">${escapeHtml(test.title)}</h1>
            ${chapOverviewTip}
          </div>

          <div class="mode-grid" role="radiogroup" aria-label="Quiz Mode">
            <div id="select-study-mode" class="mode-option ${mode === "study" ? "selected" : ""}" role="radio" tabindex="0" aria-checked="${mode === "study"}">
              <div class="mode-option-head">
                <span class="inline-with-tip">
                  <span class="mode-option-title">Study Mode</span>
                  ${studyTip}
                </span>
                <span class="radio-ring" aria-hidden="true"></span>
              </div>
              <p class="mode-option-desc">Instant feedback &amp; explanations</p>
            </div>

            <div id="select-test-mode" class="mode-option ${mode === "test" ? "selected" : ""}" role="radio" tabindex="0" aria-checked="${mode === "test"}">
              <div class="mode-option-head">
                <span class="inline-with-tip">
                  <span class="mode-option-title">Test Mode</span>
                  ${testTip}
                </span>
                <span class="radio-ring" aria-hidden="true"></span>
              </div>
              <p class="mode-option-desc">Timed exam · review at end</p>
            </div>
          </div>

          <div id="setup-timer-panel" class="timer-panel ${mode === "test" ? "" : "hidden"}">
            <span class="timer-panel-label">Duration</span>
            <div class="timer-chips">
              ${[20, 30, 45, 60, 90]
                .map(
                  (m) => `
                <button type="button" class="chip timer-preset-chip ${mins === m && !state.setupConfig.customMinutes ? "selected" : ""}" data-min="${m}">
                  ${m}m
                </button>
              `
                )
                .join("")}
              <input
                id="custom-timer-input"
                class="custom-min-input"
                type="number"
                min="1"
                max="240"
                placeholder="Custom"
                value="${escapeHtml(state.setupConfig.customMinutes)}"
                aria-label="Custom minutes"
              />
            </div>
          </div>

          <div class="setup-footer">
            <span style="font-size:13px;color:var(--md-on-surface-variant);">
              30 Questions · JavaScript
            </span>
            <button id="launch-quiz-btn" class="btn btn-filled glimmer-btn" type="button">
              ${mode === "study" ? "Start Study" : `Start Test (${mins}m)`}
            </button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("setup-back-btn").addEventListener("click", () => {
      window.location.hash = "";
      navigateWithTransition(() => {
        state.view = "home";
        render();
      }, "backward");
    });

    if (saved && !saved.submitted) {
      document.getElementById("resume-saved-btn").addEventListener("click", () => {
        resumeSavedSession(saved);
      });
      document.getElementById("discard-saved-btn").addEventListener("click", () => {
        clearSavedSession(test.chapter);
        document.getElementById("resume-session-banner")?.remove();
      });
    }

    const studyBtn = document.getElementById("select-study-mode");
    const testBtn = document.getElementById("select-test-mode");
    const timerPanel = document.getElementById("setup-timer-panel");
    const launchBtn = document.getElementById("launch-quiz-btn");

    const syncSetupUiInPlace = () => {
      const isStudy = state.setupConfig.mode === "study";
      studyBtn.classList.toggle("selected", isStudy);
      studyBtn.setAttribute("aria-checked", String(isStudy));
      testBtn.classList.toggle("selected", !isStudy);
      testBtn.setAttribute("aria-checked", String(!isStudy));
      timerPanel.classList.toggle("hidden", isStudy);
      launchBtn.textContent = isStudy
        ? "Start Study"
        : `Start Test (${state.setupConfig.timerMinutes}m)`;
    };

    const pickMode = (targetMode) => (e) => {
      if (e.target.closest(".info-tip-trigger, .info-tip-popover")) return;
      state.setupConfig.mode = targetMode;
      syncSetupUiInPlace();
    };

    studyBtn.addEventListener("click", pickMode("study"));
    studyBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pickMode("study")(e);
      }
    });

    testBtn.addEventListener("click", pickMode("test"));
    testBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pickMode("test")(e);
      }
    });

    container.querySelectorAll(".timer-preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.setupConfig.timerMinutes = parseInt(chip.getAttribute("data-min"), 10);
        state.setupConfig.customMinutes = "";
        const customInput = document.getElementById("custom-timer-input");
        if (customInput) customInput.value = "";
        container.querySelectorAll(".timer-preset-chip").forEach((c) => {
          c.classList.toggle("selected", c === chip);
        });
        syncSetupUiInPlace();
      });
    });

    const customInput = document.getElementById("custom-timer-input");
    if (customInput) {
      customInput.addEventListener("input", () => {
        const val = parseInt(customInput.value, 10);
        state.setupConfig.customMinutes = customInput.value;
        if (!isNaN(val) && val > 0) {
          state.setupConfig.timerMinutes = Math.min(240, val);
          container.querySelectorAll(".timer-preset-chip").forEach((c) => c.classList.remove("selected"));
          syncSetupUiInPlace();
        }
      });
    }

    launchBtn.addEventListener("click", () => {
      startNewSession(state.setupConfig.mode, state.setupConfig.timerMinutes);
    });
  }

  /* ------------------------------------------------------------------------
     View 3: One-Question-at-a-Time Focus Workspace
     (Minimalist Prompt + Hover/Click ⓘ Info Icon for Instructions & Context)
     ------------------------------------------------------------------------ */

  function buildQuestionInfoPopupText(q) {
    const parts = [];
    if (q.context) parts.push(q.context);
    if (q.instruction) parts.push(q.instruction);
    if (parts.length === 0) {
      const defaults = {
        mcq_single: "Choose the single best option.",
        mcq_multi: "Select all matching options, then check.",
        spot_flaw: "Click the flawed line(s), then check.",
        cloze_bank: "Click a blank, then pick a word from the bank.",
        cloze_typed: "Type the missing term into each blank.",
        order_steps: "Drag rows or use ↑ / ↓ arrows to reorder.",
        match_pairs: "Select an item on the left, then pair it on the right.",
        classify_buckets: "Click an item, then click its target bucket.",
        claim_audit: "Choose a verdict and defend it in your own words.",
        free_response: "Explain clearly in your own words.",
        js_code: "Write JavaScript and run assertions to verify.",
      };
      if (defaults[q.type]) parts.push(defaults[q.type]);
    }
    return parts.join("\n\n");
  }

  function renderQuizView(container) {
    if (state.isGradingBatch) {
      container.innerHTML = `
        <section class="setup-shell" style="text-align:center;padding-block-start:64px;">
          <div class="setup-card">
            <div class="spinner" style="width:32px;height:32px;margin-block-end:16px;color:var(--md-primary);"></div>
            <h1 class="setup-title">Grading Quiz…</h1>
            <p class="setup-summary" style="margin-block-end:0;">
              Running JavaScript tests and evaluating written responses.
            </p>
          </div>
        </section>
      `;
      return;
    }

    const test = state.currentTest;
    const sess = state.session;
    const idx = sess.currentIndex;
    const q = test.questions[idx];
    const ans = sess.answers[idx];
    const ev = sess.evaluations[idx];
    const isStudy = sess.mode === "study";
    const isRevealed = isStudy && Boolean(ev);
    const isFlagged = Boolean(sess.flagged[idx]);

    const infoText = buildQuestionInfoPopupText(q);
    const infoTipHtml = renderInfoTip(
      `tip-q-${idx}`,
      "Question instructions and details",
      infoText
    );

    // For coding labs, keep a short inline nudge so the user knows exact spec lives in ⓘ
    const compactCodeHint =
      q.type === "js_code" && q.instruction
        ? `<p class="q-hint" style="margin-block-end:16px;">Hover or click <strong>i</strong> above for full function specification &amp; return shape.</p>`
        : "";

    container.innerHTML = `
      <section class="question-stage">
        <div class="q-meta-row">
          <div class="q-badges">
            <span class="q-index-badge">Q${idx + 1} / ${test.questions.length}</span>
            <span class="q-type-badge">${escapeHtml(TYPE_LABELS[q.type] || q.type)}</span>
            ${q.bloom ? `<span class="q-bloom-badge">· ${escapeHtml(q.bloom)}</span>` : ""}
          </div>
          <button id="toggle-flag-btn" class="flag-btn ${isFlagged ? "flagged" : ""}" type="button" aria-pressed="${isFlagged}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFlagged ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            <span id="flag-btn-label">${isFlagged ? "Flagged" : "Flag"}</span>
          </button>
        </div>

        <article class="q-card">
          <div class="prompt-header-row">
            <h1 id="active-question-heading" class="q-prompt" tabindex="-1">${escapeHtml(q.prompt)}</h1>
            ${infoTipHtml}
          </div>
          ${compactCodeHint}
          ${q.code_snippet ? `<pre class="code-block"><code>${escapeHtml(q.code_snippet)}</code></pre>` : ""}

          <div id="q-interactive-mount">
            ${renderQuestionBody(q, idx, ans, ev, isRevealed)}
          </div>

          <div id="q-feedback-mount">
            ${isRevealed ? renderFeedbackPanel(q, ev) : ""}
          </div>

          <div id="q-footer-mount">
            ${renderQuestionFooter(q, idx, test.questions.length, isStudy, isRevealed)}
          </div>
        </article>

        <details id="nav-disclosure-details" class="nav-disclosure" ${state.navDrawerOpen ? "open" : ""}>
          <summary class="nav-disclosure-summary">
            <span>Questions (${idx + 1} / ${test.questions.length})</span>
            <span style="color:var(--md-primary);">Grid ▾</span>
          </summary>
          <div class="nav-dots" id="nav-dots-mount">
            ${renderNavDots(test.questions, sess, idx, isStudy)}
          </div>
          <div style="margin-block-start:12px;display:flex;justify-content:flex-end;">
            <button id="early-submit-btn" class="btn btn-text btn-sm" type="button">Submit Quiz</button>
          </div>
        </details>
      </section>
    `;

    bindStageShellEvents();
    bindInteractiveMountEvents(q, idx, isRevealed);
    bindFooterEvents(q, idx, isRevealed);
  }

  function renderQuestionFooter(q, idx, totalQuestions, isStudy, isRevealed) {
    return `
      <div class="q-footer">
        <div class="q-footer-left">
          <button id="prev-q-btn" class="btn btn-outlined glimmer-btn" type="button" ${idx === 0 ? "disabled" : ""}>
            ← Back
          </button>
        </div>

        <div class="q-footer-right">
          ${
            isStudy && !isRevealed && q.type !== "mcq_single"
              ? `<button id="check-answer-btn" class="btn btn-tonal glimmer-btn" type="button">
                  ${q.type === "js_code" ? "Run Tests" : "Check"}
                </button>`
              : ""
          }
          ${
            !isStudy && q.type === "js_code"
              ? `<button id="dry-run-js-btn" class="btn btn-tonal glimmer-btn" type="button">Run Tests</button>`
              : ""
          }
          ${
            idx < totalQuestions - 1
              ? `<button id="next-q-btn" class="btn btn-filled glimmer-btn" type="button">Next →</button>`
              : `<button id="submit-quiz-btn" class="btn btn-filled glimmer-btn" type="button">Submit</button>`
          }
        </div>
      </div>
    `;
  }

  function renderNavDots(questions, sess, currentIdx, isStudy) {
    return questions
      .map((item, i) => {
        const itemEv = sess.evaluations[i];
        const hasAns = isAnswerProvided(item, sess.answers[i]);
        let cls = "nav-dot";
        if (i === currentIdx) cls += " current";
        else if (isStudy && itemEv) cls += ` ${itemEv.status === "correct" ? "correct" : "wrong"}`;
        else if (hasAns) cls += " answered";
        if (sess.flagged[i]) cls += " flagged";
        return `<button type="button" class="${cls}" data-jump="${i}" aria-label="Go to question ${i + 1}">${i + 1}</button>`;
      })
      .join("");
  }

  /**
   * Surgical in-place update for within-question interactions.
   * Prevents recreating the question card or re-triggering page transitions.
   */
  function updateQuestionMountInPlace() {
    const test = state.currentTest;
    const sess = state.session;
    const idx = sess.currentIndex;
    const q = test.questions[idx];
    const ans = sess.answers[idx];
    const ev = sess.evaluations[idx];
    const isStudy = sess.mode === "study";
    const isRevealed = isStudy && Boolean(ev);

    const mount = document.getElementById("q-interactive-mount");
    const feedbackMount = document.getElementById("q-feedback-mount");
    const footerMount = document.getElementById("q-footer-mount");
    const navDotsMount = document.getElementById("nav-dots-mount");

    if (mount) {
      mount.innerHTML = renderQuestionBody(q, idx, ans, ev, isRevealed);
      bindInteractiveMountEvents(q, idx, isRevealed);
    }
    if (feedbackMount) {
      feedbackMount.innerHTML = isRevealed ? renderFeedbackPanel(q, ev) : "";
    }
    if (footerMount) {
      footerMount.innerHTML = renderQuestionFooter(q, idx, test.questions.length, isStudy, isRevealed);
      bindFooterEvents(q, idx, isRevealed);
    }
    if (navDotsMount) {
      navDotsMount.innerHTML = renderNavDots(test.questions, sess, idx, isStudy);
      bindNavDotsEvents();
    }
    updateTopBarCountInPlace();
  }

  /* ------------------------------------------------------------------------
     Renderers for All 11 Interactive Question Formats
     ------------------------------------------------------------------------ */

  function renderQuestionBody(q, idx, ans, ev, isRevealed) {
    switch (q.type) {
      case "mcq_single":
        return renderMcqSingle(q, ans, isRevealed);
      case "mcq_multi":
        return renderMcqMulti(q, ans, isRevealed);
      case "spot_flaw":
        return renderSpotFlaw(q, ans, isRevealed);
      case "cloze_bank":
        return renderClozeBank(q, ans, ev, isRevealed);
      case "cloze_typed":
        return renderClozeTyped(q, ans, ev, isRevealed);
      case "order_steps":
        return renderOrderSteps(q, ans, isRevealed);
      case "match_pairs":
        return renderMatchPairs(q, ans, isRevealed);
      case "classify_buckets":
        return renderClassifyBuckets(q, ans, isRevealed);
      case "claim_audit":
        return renderClaimAudit(q, ans, isRevealed);
      case "free_response":
        return renderFreeResponse(q, ans, isRevealed);
      case "js_code":
        return renderJsCode(q, ans, ev, isRevealed);
      default:
        return `<p>Unsupported question format: ${escapeHtml(q.type)}</p>`;
    }
  }

  function renderMcqSingle(q, ans, isRevealed) {
    const letters = ["A", "B", "C", "D", "E", "F"];
    return `
      <div class="mcq-list" role="radiogroup" aria-label="Multiple choice options">
        ${q.options
          .map((opt, i) => {
            const isSelected = ans === i;
            const isRight = i === q.correct_index;
            let cls = "mcq-option";
            let statusTag = "";

            if (isRevealed) {
              if (isRight) {
                cls += isSelected ? " correct" : " revealed-correct";
                statusTag = `<span class="mcq-status-tag is-correct">✓ ${isSelected ? "Correct Choice" : "Correct Answer"}</span>`;
              } else if (isSelected) {
                cls += " wrong";
                statusTag = `<span class="mcq-status-tag is-wrong">✕ Your Pick · Incorrect</span>`;
              }
            } else if (isSelected) {
              cls += " selected";
            }

            const expHtml = isRevealed
              ? `<div class="mcq-explanation">
                  <strong>${isRight ? "✓ Why this is right:" : "✕ Why this is wrong:"}</strong>
                  ${escapeHtml(opt.explanation)}
                </div>`
              : "";

            return `
              <button type="button" class="${cls}" data-mcq-idx="${i}" role="radio" aria-checked="${isSelected}">
                <div class="mcq-option-row">
                  <span class="mcq-key">${letters[i] || i + 1}</span>
                  <span class="mcq-label">${escapeHtml(opt.text)}</span>
                  ${statusTag}
                </div>
                ${expHtml}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderMcqMulti(q, ans, isRevealed) {
    const selected = new Set(Array.isArray(ans) ? ans : []);
    const expected = new Set(q.correct_indices);
    const letters = ["A", "B", "C", "D", "E", "F"];

    return `
      <div class="mcq-list" role="group" aria-label="Multi-select options">
        ${q.options
          .map((opt, i) => {
            const isSelected = selected.has(i);
            const isRight = expected.has(i);
            let cls = "mcq-option";
            let statusTag = "";

            if (isRevealed) {
              if (isRight && isSelected) {
                cls += " correct";
                statusTag = `<span class="mcq-status-tag is-correct">✓ Selected · Correct</span>`;
              } else if (isRight && !isSelected) {
                cls += " revealed-correct";
                statusTag = `<span class="mcq-status-tag is-correct">✓ Missed · Correct</span>`;
              } else if (!isRight && isSelected) {
                cls += " wrong";
                statusTag = `<span class="mcq-status-tag is-wrong">✕ Selected · Wrong</span>`;
              }
            } else if (isSelected) {
              cls += " selected";
            }

            const expHtml = isRevealed
              ? `<div class="mcq-explanation">
                  <strong>${isRight ? "✓ Why this is right:" : "✕ Why this is wrong:"}</strong>
                  ${escapeHtml(opt.explanation)}
                </div>`
              : "";

            return `
              <button type="button" class="${cls}" data-multi-idx="${i}" aria-pressed="${isSelected}" ${isRevealed ? "disabled" : ""}>
                <div class="mcq-option-row">
                  <span class="mcq-key">${letters[i] || i + 1}</span>
                  <span class="mcq-label">${escapeHtml(opt.text)}</span>
                  ${statusTag}
                </div>
                ${expHtml}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderSpotFlaw(q, ans, isRevealed) {
    const selected = new Set(Array.isArray(ans) ? ans : []);
    const expected = new Set(q.flawed_indices || []);
    const isProse = Boolean(q.prose_mode);

    return `
      <div class="flaw-lines ${isProse ? "prose-container" : ""}">
        ${q.lines
          .map((lineObj, i) => {
            const text = typeof lineObj === "string" ? lineObj : lineObj.text;
            const note = typeof lineObj === "object" ? lineObj.explanation : "";
            const isSelected = selected.has(i);
            const isFlaw = expected.has(i);

            let cls = `flaw-line ${isProse ? "prose-mode" : ""}`;
            if (isRevealed) {
              if (isFlaw) cls += " correct";
              else if (isSelected) cls += " wrong";
            } else if (isSelected) {
              cls += " selected";
            }

            const noteHtml =
              isRevealed && (isFlaw || isSelected) && note
                ? `<div class="flaw-line-note"><strong>${isFlaw ? "✓ Flaw Identified:" : "✕ Clean Line:"}</strong> ${escapeHtml(note)}</div>`
                : "";

            return `
              <button type="button" class="${cls}" data-flaw-idx="${i}" aria-pressed="${isSelected}" ${isRevealed ? "disabled" : ""}>
                <span class="flaw-line-num">${i + 1}</span>
                <div class="flaw-line-text">${escapeHtml(text)}${noteHtml}</div>
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderClozeBank(q, ans, ev, isRevealed) {
    const values = Array.isArray(ans) ? ans : new Array(q.blanks.length).fill("");
    let htmlPassage = escapeHtml(q.template);

    q.blanks.forEach((b, i) => {
      const val = values[i] || "";
      const isSlotActive = !isRevealed && state.activeClozeSlot === i;
      let cls = "cloze-slot";
      if (isRevealed) {
        const ok = ev?.perBlank?.[i];
        cls += ok ? " correct" : " wrong";
      } else {
        if (val) cls += " filled";
        if (isSlotActive) cls += " active";
      }
      const label =
        isRevealed && !ev?.perBlank?.[i]
          ? `✕ ${val || "___"} → ✓ ${b.answer}`
          : isRevealed
            ? `✓ ${val}`
            : val || `Blank #${i + 1}`;
      const buttonHtml = `<button type="button" class="${cls}" data-slot-idx="${i}" ${isRevealed ? "disabled" : ""}>${escapeHtml(label)}</button>`;
      htmlPassage = htmlPassage.replace(`{{${i + 1}}}`, buttonHtml);
    });

    return `
      <div class="cloze-passage">${htmlPassage}</div>
      <div class="word-bank">
        ${(q.word_bank || [])
          .map((word) => {
            const isUsed = values.includes(word);
            return `
              <button type="button" class="bank-chip ${isUsed ? "used" : ""}" data-bank-word="${escapeHtml(word)}" ${isRevealed ? "disabled" : ""}>
                ${escapeHtml(word)}
              </button>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderClozeTyped(q, ans, ev, isRevealed) {
    const values = Array.isArray(ans) ? ans : new Array(q.blanks.length).fill("");
    let htmlPassage = escapeHtml(q.template);

    q.blanks.forEach((b, i) => {
      const val = values[i] || "";
      let cls = "cloze-typed-input";
      if (isRevealed) {
        cls += ev?.perBlank?.[i] ? " correct" : " wrong";
      }
      const inputHtml = `<input type="text" class="${cls}" data-typed-blank="${i}" value="${escapeHtml(val)}" placeholder="${escapeHtml(b.placeholder || `blank #${i + 1}`)}" aria-label="Blank ${i + 1}" ${isRevealed ? "disabled" : ""} />`;
      const correction =
        isRevealed && !ev?.perBlank?.[i]
          ? `<span style="font-size:13px;font-weight:700;color:var(--md-success);margin-inline-start:4px;">(✓ ${escapeHtml(b.answer)})</span>`
          : "";
      htmlPassage = htmlPassage.replace(`{{${i + 1}}}`, inputHtml + correction);
    });

    return `<div class="cloze-passage">${htmlPassage}</div>`;
  }

  function renderOrderSteps(q, ans, isRevealed) {
    const currentOrder = Array.isArray(ans) ? ans : q.initial_order;
    return `
      <div class="order-list" id="order-list-container">
        ${currentOrder
          .map((itemIdx, pos) => {
            const text = q.items[itemIdx];
            const isRightPos = q.correct_order[pos] === itemIdx;
            let cls = "order-item";
            if (isRevealed) {
              cls += isRightPos ? " correct" : " wrong";
            }
            return `
              <div class="${cls}" draggable="${!isRevealed}" data-item-id="${itemIdx}">
                <span class="order-pos">${pos + 1}</span>
                <span class="order-text">${escapeHtml(text)}</span>
                ${
                  !isRevealed
                    ? `<div class="order-arrows">
                        <button type="button" class="order-arrow-btn" data-move-dir="-1" data-item-ref="${itemIdx}" ${pos === 0 ? "disabled" : ""} aria-label="Move item up">↑</button>
                        <button type="button" class="order-arrow-btn" data-move-dir="1" data-item-ref="${itemIdx}" ${pos === currentOrder.length - 1 ? "disabled" : ""} aria-label="Move item down">↓</button>
                      </div>`
                    : `<span style="font-size:12px;font-weight:700;">${isRightPos ? "✓ Correct Position" : `✕ Should be #${q.correct_order.indexOf(itemIdx) + 1}`}</span>`
                }
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderMatchPairs(q, ans, isRevealed) {
    const mapping = ans || {};
    const rightIndices = q.right_order || q.pairs.map((_, i) => i);

    return `
      <div class="match-grid">
        <div class="match-col">
          <span class="match-col-title">1. Select Item</span>
          ${q.pairs
            .map((p, leftIdx) => {
              const isPaired = mapping[leftIdx] !== undefined;
              const isActive = state.activeMatchLeft === leftIdx && !isRevealed;
              let cls = "match-card";
              if (isRevealed) {
                cls += mapping[leftIdx] === leftIdx ? " correct" : " wrong";
              } else {
                if (isActive) cls += " active";
                else if (isPaired) cls += " paired";
              }
              return `
                <button type="button" class="${cls}" data-match-left="${leftIdx}" aria-pressed="${isActive}" ${isRevealed ? "disabled" : ""}>
                  <span>${escapeHtml(p.left)}</span>
                  <span class="pair-tag">${leftIdx + 1}</span>
                </button>
              `;
            })
            .join("")}
        </div>

        <div class="match-col">
          <span class="match-col-title">2. Pair With Target</span>
          ${rightIndices
            .map((pairIdx) => {
              const p = q.pairs[pairIdx];
              const matchedLeftKey = Object.keys(mapping).find((k) => mapping[k] === pairIdx);
              const hasMatch = matchedLeftKey !== undefined;
              let cls = "match-card";
              if (isRevealed) {
                cls += Number(matchedLeftKey) === pairIdx ? " correct" : " wrong";
              } else if (hasMatch) {
                cls += " paired";
              }

              return `
                <button type="button" class="${cls}" data-match-right="${pairIdx}" ${isRevealed ? "disabled" : ""}>
                  <span>${escapeHtml(p.right)}</span>
                  ${
                    hasMatch
                      ? `<span class="pair-tag">#${Number(matchedLeftKey) + 1}${isRevealed && Number(matchedLeftKey) !== pairIdx ? ` (Should be #${pairIdx + 1})` : ""}</span>`
                      : ""
                  }
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderClassifyBuckets(q, ans, isRevealed) {
    const mapping = ans || {};
    const unassigned = q.items
      .map((item, i) => ({ ...item, idx: i }))
      .filter((item) => mapping[item.idx] === undefined);

    return `
      <div class="bucket-pool">
        ${
          unassigned.length === 0
            ? `<span style="font-size:13px;color:var(--md-on-surface-variant);">All items assigned to buckets. Click any item below to reassign it.</span>`
            : unassigned
                .map((item) => {
                  const isSel = state.activeBucketItem === item.idx && !isRevealed;
                  return `
                    <button type="button" class="bucket-card-item ${isSel ? "selected" : ""}" data-bucket-item="${item.idx}" aria-pressed="${isSel}" ${isRevealed ? "disabled" : ""}>
                      ${escapeHtml(item.text)}
                    </button>
                  `;
                })
                .join("")
        }
      </div>

      <div class="buckets-grid">
        ${q.buckets
          .map((bucketName) => {
            const assignedHere = q.items
              .map((item, i) => ({ ...item, idx: i }))
              .filter((item) => mapping[item.idx] === bucketName);

            return `
              <div class="bucket-zone ${state.activeBucketItem !== null && !isRevealed ? "ready" : ""}" data-bucket-target="${escapeHtml(bucketName)}">
                <div class="bucket-zone-title">
                  <span>${escapeHtml(bucketName)}</span>
                  <span>${assignedHere.length}</span>
                </div>
                <div class="bucket-items">
                  ${assignedHere
                    .map((item) => {
                      let cls = "bucket-card-item";
                      if (isRevealed) {
                        cls += item.bucket === bucketName ? " correct" : " wrong";
                      } else if (state.activeBucketItem === item.idx) {
                        cls += " selected";
                      }
                      return `
                        <button type="button" class="${cls}" data-bucket-item="${item.idx}" ${isRevealed ? "disabled" : ""}>
                          ${escapeHtml(item.text)}
                          ${
                            isRevealed && item.bucket !== bucketName
                              ? `<div style="font-size:11.5px;font-weight:700;margin-block-start:3px;">✕ Belongs in: ${escapeHtml(item.bucket)}</div>`
                              : ""
                          }
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderClaimAudit(q, ans, isRevealed) {
    const current = ans || { verdict: "", reasoning: "" };
    const verdicts = q.verdict_options || [
      "Architecturally Sound",
      "Dangerous Fallacy",
      "Context-Dependent Trap",
    ];

    return `
      <blockquote class="claim-quote">“${escapeHtml(q.claim)}”</blockquote>
      <div class="verdict-row" role="radiogroup" aria-label="Claim verdict">
        ${verdicts
          .map((v) => {
            const isSel = current.verdict === v;
            const isRight = q.correct_verdict === v;
            let cls = "verdict-btn";
            if (isRevealed) {
              if (isRight) cls += " correct";
              else if (isSel) cls += " wrong";
            } else if (isSel) {
              cls += " selected";
            }
            const prefix = isRevealed ? (isRight ? "✓ " : isSel ? "✕ " : "") : "";
            return `
              <button type="button" class="${cls}" data-verdict="${escapeHtml(v)}" role="radio" aria-checked="${isSel}" ${isRevealed ? "disabled" : ""}>
                ${prefix}${escapeHtml(v)}
              </button>
            `;
          })
          .join("")}
      </div>
      <label class="field-label" for="claim-reasoning-input">Defend your verdict in your own words (evaluated by Gemini AI):</label>
      <textarea
        id="claim-reasoning-input"
        class="text-response"
        placeholder="Explain why this statement holds or collapses under Clean Architecture principles..."
        ${isRevealed ? "disabled" : ""}
      >${escapeHtml(current.reasoning || "")}</textarea>
    `;
  }

  function renderFreeResponse(q, ans, isRevealed) {
    return `
      <label class="visually-hidden" for="free-response-input">Your written explanation</label>
      <textarea
        id="free-response-input"
        class="text-response"
        placeholder="${escapeHtml(q.placeholder || "Synthesize your explanation in your own words...")}"
        ${isRevealed ? "disabled" : ""}
      >${escapeHtml(ans || "")}</textarea>
    `;
  }

  function renderJsCode(q, ans, ev, isRevealed) {
    const testRows = (ev?.jsResults || [])
      .map(
        (r) => `
        <div class="js-test-row ${r.passed ? "pass" : "fail"}">
          <span>${r.passed ? "✓ PASS" : "✕ FAIL"} · ${escapeHtml(r.label)}</span>
          <span>Expected: ${escapeHtml(r.expected)} | Got: ${escapeHtml(r.actual)}</span>
        </div>
      `
      )
      .join("");

    return `
      <div class="code-editor-wrap">
        <div class="code-editor-bar">
          <span>JavaScript (ES2024 Sandbox)</span>
          <button id="reset-starter-code-btn" class="btn btn-text btn-sm" type="button" style="color:var(--code-fg);min-block-size:26px;padding-inline:8px;">Reset Starter Code</button>
        </div>
        <label class="visually-hidden" for="js-code-input">JavaScript solution editor</label>
        <textarea
          id="js-code-input"
          class="code-editor"
          spellcheck="false"
          ${isRevealed ? "disabled" : ""}
        >${escapeHtml(ans ?? q.starter_code ?? "")}</textarea>
      </div>
      <div id="js-dry-run-mount">${testRows ? `<div class="js-test-results">${testRows}</div>` : ""}</div>
    `;
  }

  function renderFeedbackPanel(q, ev) {
    if (!ev) return "";
    const titles = {
      correct: "✓ Mastery Confirmed",
      partial: "◐ Partially Correct — Nuance Needed",
      wrong: "✕ Misconception Detected",
    };

    const hitsHtml =
      ev.rubricHits?.length || ev.rubricMissed?.length
        ? `
        <ul class="rubric-list">
          ${(ev.rubricHits || []).map((c) => `<li><strong>✓ Addressed:</strong> ${escapeHtml(c)}</li>`).join("")}
          ${(ev.rubricMissed || []).map((c) => `<li><strong>○ Missing/Refine:</strong> ${escapeHtml(c)}</li>`).join("")}
        </ul>
      `
        : "";

    const modelAnsHtml =
      q.model_answer && (q.type === "free_response" || q.type === "claim_audit" || q.type === "js_code")
        ? `
        <div class="model-answer-toggle">
          <strong>Reference Authoritative Answer:</strong>
          <div style="margin-block-start:4px;white-space:pre-wrap;">${escapeHtml(q.model_answer)}</div>
        </div>
      `
        : "";

    return `
      <div class="feedback-box ${ev.status}">
        <div class="feedback-title">
          <span>${titles[ev.status] || "Evaluation"} (${Math.round((ev.score || 0) * 100)}%)</span>
          ${ev.gradedBy ? `<span style="font-size:12px;font-weight:500;opacity:0.88;">${escapeHtml(ev.gradedBy)}</span>` : ""}
        </div>
        <p class="feedback-body">${escapeHtml(ev.feedback || q.overall_explanation || "")}</p>
        ${hitsHtml}
        ${modelAnsHtml}
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     Event Bindings: Stage Shell, Footer, Navigator & Question Formats
     ------------------------------------------------------------------------ */

  function bindStageShellEvents() {
    const sess = state.session;
    const idx = sess.currentIndex;

    // Flag button updates in place without re-rendering the stage
    const flagBtn = document.getElementById("toggle-flag-btn");
    if (flagBtn) {
      flagBtn.addEventListener("click", () => {
        const nextFlag = !sess.flagged[idx];
        sess.flagged[idx] = nextFlag;
        persistSession();
        flagBtn.classList.toggle("flagged", nextFlag);
        flagBtn.setAttribute("aria-pressed", String(nextFlag));
        const lbl = document.getElementById("flag-btn-label");
        if (lbl) lbl.textContent = nextFlag ? "Flagged" : "Flag";
        const svgPath = flagBtn.querySelector("svg");
        if (svgPath) svgPath.setAttribute("fill", nextFlag ? "currentColor" : "none");
        const navDot = document.querySelector(`[data-jump="${idx}"]`);
        if (navDot) navDot.classList.toggle("flagged", nextFlag);
      });
    }

    const detailsEl = document.getElementById("nav-disclosure-details");
    if (detailsEl) {
      detailsEl.addEventListener("toggle", () => {
        state.navDrawerOpen = detailsEl.open;
      });
    }

    const earlySubmitBtn = document.getElementById("early-submit-btn");
    if (earlySubmitBtn) {
      earlySubmitBtn.addEventListener("click", () => finalizeAndSubmitQuiz(false));
    }

    bindNavDotsEvents();
  }

  function bindNavDotsEvents() {
    const sess = state.session;
    document.querySelectorAll("[data-jump]").forEach((dot) => {
      dot.addEventListener("click", () => {
        const targetIdx = parseInt(dot.getAttribute("data-jump"), 10);
        if (targetIdx === sess.currentIndex) return;
        const dir = targetIdx > sess.currentIndex ? "forward" : "backward";
        sess.currentIndex = targetIdx;
        resetTransientPickers();
        persistSession();
        navigateWithTransition(() => render(), dir, "#active-question-heading");
      });
    });
  }

  function bindFooterEvents(q, idx, isRevealed) {
    const sess = state.session;

    const prevBtn = document.getElementById("prev-q-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (sess.currentIndex > 0) {
          sess.currentIndex--;
          resetTransientPickers();
          persistSession();
          navigateWithTransition(() => render(), "backward", "#active-question-heading");
        }
      });
    }

    const nextBtn = document.getElementById("next-q-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (sess.currentIndex < state.currentTest.questions.length - 1) {
          sess.currentIndex++;
          resetTransientPickers();
          persistSession();
          navigateWithTransition(() => render(), "forward", "#active-question-heading");
        }
      });
    }

    const submitBtn = document.getElementById("submit-quiz-btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => finalizeAndSubmitQuiz(false));
    }

    const checkBtn = document.getElementById("check-answer-btn");
    if (checkBtn) {
      checkBtn.addEventListener("click", async () => {
        checkBtn.disabled = true;
        checkBtn.innerHTML = `<span class="spinner"></span> Evaluating...`;
        await evaluateSingleQuestion(idx);
        persistSession();
        updateQuestionMountInPlace();
        announceStatus(`Answer evaluated: ${state.session.evaluations[idx]?.status || "done"}`);
      });
    }

    const dryRunBtn = document.getElementById("dry-run-js-btn");
    if (dryRunBtn) {
      dryRunBtn.addEventListener("click", () => {
        const res = runSandboxedJsTests(q, sess.answers[idx] || "");
        const dryMount = document.getElementById("js-dry-run-mount");
        if (dryMount) {
          dryMount.innerHTML = `<div class="js-test-results">${res.jsResults
            .map(
              (r) => `
              <div class="js-test-row ${r.passed ? "pass" : "fail"}">
                <span>${r.passed ? "✓ PASS" : "✕ FAIL"} · ${escapeHtml(r.label)}</span>
                <span>Expected: ${escapeHtml(r.expected)} | Got: ${escapeHtml(r.actual)}</span>
              </div>
            `
            )
            .join("")}</div>`;
        }
      });
    }
  }

  /**
   * Identity-preserving DOM reorder using Element.prototype.moveBefore()
   * and scoped/document View Transitions (Modern Web Guidance `dynamic-sort`).
   */
  function applyDynamicOrderDomUpdate(listEl, newOrderArray) {
    const nodeByItemId = new Map();
    for (const child of listEl.children) {
      nodeByItemId.set(Number(child.getAttribute("data-item-id")), child);
    }
    const orderedNodes = newOrderArray.map((id) => nodeByItemId.get(id)).filter(Boolean);

    const move = Object.hasOwn(Element.prototype, "moveBefore")
      ? (node) => listEl.moveBefore(node, null)
      : (node) => listEl.append(node);

    const performReorder = () => {
      for (const node of orderedNodes) move(node);
      orderedNodes.forEach((node, pos) => {
        const posEl = node.querySelector(".order-pos");
        if (posEl) posEl.textContent = String(pos + 1);
        const upBtn = node.querySelector('[data-move-dir="-1"]');
        const downBtn = node.querySelector('[data-move-dir="1"]');
        if (upBtn) upBtn.disabled = pos === 0;
        if (downBtn) downBtn.disabled = pos === orderedNodes.length - 1;
      });
    };

    if (listEl.startViewTransition) {
      listEl.startViewTransition(performReorder);
    } else if (document.startViewTransition) {
      document.startViewTransition(performReorder);
    } else {
      performReorder();
    }

    announceStatus(`Sequence updated, ${orderedNodes.length} steps ordered.`);
  }

  function bindInteractiveMountEvents(q, idx, isRevealed) {
    const sess = state.session;
    const isStudy = sess.mode === "study";

    if (q.type === "mcq_single") {
      document.querySelectorAll("[data-mcq-idx]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (isRevealed) return;
          const choice = parseInt(btn.getAttribute("data-mcq-idx"), 10);
          sess.answers[idx] = choice;
          if (isStudy) {
            await evaluateSingleQuestion(idx);
          }
          persistSession();
          updateQuestionMountInPlace();
        });
      });
    }

    if (q.type === "mcq_multi") {
      document.querySelectorAll("[data-multi-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          const choice = parseInt(btn.getAttribute("data-multi-idx"), 10);
          const cur = new Set(Array.isArray(sess.answers[idx]) ? sess.answers[idx] : []);
          if (cur.has(choice)) cur.delete(choice);
          else cur.add(choice);
          sess.answers[idx] = Array.from(cur);
          btn.classList.toggle("selected", cur.has(choice));
          btn.setAttribute("aria-pressed", String(cur.has(choice)));
          persistSession();
          updateTopBarCountInPlace();
        });
      });
    }

    if (q.type === "spot_flaw") {
      document.querySelectorAll("[data-flaw-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          const lineIdx = parseInt(btn.getAttribute("data-flaw-idx"), 10);
          const cur = new Set(Array.isArray(sess.answers[idx]) ? sess.answers[idx] : []);
          if ((q.flawed_indices || []).length === 1) {
            sess.answers[idx] = [lineIdx];
            document.querySelectorAll("[data-flaw-idx]").forEach((el) => {
              const match = el === btn;
              el.classList.toggle("selected", match);
              el.setAttribute("aria-pressed", String(match));
            });
          } else {
            if (cur.has(lineIdx)) cur.delete(lineIdx);
            else cur.add(lineIdx);
            sess.answers[idx] = Array.from(cur);
            btn.classList.toggle("selected", cur.has(lineIdx));
            btn.setAttribute("aria-pressed", String(cur.has(lineIdx)));
          }
          persistSession();
          updateTopBarCountInPlace();
        });
      });
    }

    if (q.type === "cloze_bank") {
      document.querySelectorAll("[data-slot-idx]").forEach((slot) => {
        slot.addEventListener("click", () => {
          if (isRevealed) return;
          const sIdx = parseInt(slot.getAttribute("data-slot-idx"), 10);
          if (state.activeClozeSlot === sIdx && sess.answers[idx]?.[sIdx]) {
            sess.answers[idx][sIdx] = "";
          }
          state.activeClozeSlot = sIdx;
          persistSession();
          updateQuestionMountInPlace();
        });
      });

      document.querySelectorAll("[data-bank-word]").forEach((chip) => {
        chip.addEventListener("click", () => {
          if (isRevealed) return;
          const word = chip.getAttribute("data-bank-word");
          if (!Array.isArray(sess.answers[idx])) {
            sess.answers[idx] = new Array(q.blanks.length).fill("");
          }
          const arr = sess.answers[idx];
          const slot = Math.min(state.activeClozeSlot, q.blanks.length - 1);
          arr[slot] = word;
          const nextEmpty = arr.findIndex((v) => !v);
          if (nextEmpty !== -1) state.activeClozeSlot = nextEmpty;
          persistSession();
          updateQuestionMountInPlace();
        });
      });
    }

    if (q.type === "cloze_typed") {
      document.querySelectorAll("[data-typed-blank]").forEach((inp) => {
        inp.addEventListener("input", () => {
          const bIdx = parseInt(inp.getAttribute("data-typed-blank"), 10);
          if (!Array.isArray(sess.answers[idx])) {
            sess.answers[idx] = new Array(q.blanks.length).fill("");
          }
          sess.answers[idx][bIdx] = inp.value;
          persistSession();
          updateTopBarCountInPlace();
        });
      });
    }

    if (q.type === "order_steps") {
      const listEl = document.getElementById("order-list-container");
      if (!listEl) return;

      listEl.querySelectorAll("[data-move-dir]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          const itemId = parseInt(btn.getAttribute("data-item-ref"), 10);
          const dir = parseInt(btn.getAttribute("data-move-dir"), 10);
          const arr = [...(sess.answers[idx] || q.initial_order)];
          const pos = arr.indexOf(itemId);
          const target = pos + dir;
          if (pos !== -1 && target >= 0 && target < arr.length) {
            [arr[pos], arr[target]] = [arr[target], arr[pos]];
            sess.answers[idx] = arr;
            persistSession();
            applyDynamicOrderDomUpdate(listEl, arr);
          }
        });
      });

      listEl.querySelectorAll(".order-item").forEach((row) => {
        row.addEventListener("dragstart", () => {
          state.dragOrderNode = row;
          row.classList.add("dragging");
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
          state.dragOrderNode = null;
        });
        row.addEventListener("dragover", (e) => {
          e.preventDefault();
          row.classList.add("drag-over");
        });
        row.addEventListener("dragleave", () => {
          row.classList.remove("drag-over");
        });
        row.addEventListener("drop", (e) => {
          e.preventDefault();
          row.classList.remove("drag-over");
          if (!state.dragOrderNode || state.dragOrderNode === row) return;
          const fromId = parseInt(state.dragOrderNode.getAttribute("data-item-id"), 10);
          const toId = parseInt(row.getAttribute("data-item-id"), 10);
          const arr = [...(sess.answers[idx] || q.initial_order)];
          const fromPos = arr.indexOf(fromId);
          const toPos = arr.indexOf(toId);
          if (fromPos === -1 || toPos === -1) return;
          const [moved] = arr.splice(fromPos, 1);
          arr.splice(toPos, 0, moved);
          sess.answers[idx] = arr;
          persistSession();
          applyDynamicOrderDomUpdate(listEl, arr);
        });
      });
    }

    if (q.type === "match_pairs") {
      document.querySelectorAll("[data-match-left]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          state.activeMatchLeft = parseInt(btn.getAttribute("data-match-left"), 10);
          updateQuestionMountInPlace();
        });
      });

      document.querySelectorAll("[data-match-right]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          const rightIdx = parseInt(btn.getAttribute("data-match-right"), 10);
          const leftIdx =
            state.activeMatchLeft !== null
              ? state.activeMatchLeft
              : q.pairs.findIndex((_, i) => sess.answers[idx]?.[i] === undefined);
          if (leftIdx === -1 || leftIdx === null) return;
          const map = { ...(sess.answers[idx] || {}) };
          Object.keys(map).forEach((k) => {
            if (map[k] === rightIdx) delete map[k];
          });
          map[leftIdx] = rightIdx;
          sess.answers[idx] = map;
          const nextUnpaired = q.pairs.findIndex((_, i) => map[i] === undefined);
          state.activeMatchLeft = nextUnpaired !== -1 ? nextUnpaired : null;
          persistSession();
          updateQuestionMountInPlace();
        });
      });
    }

    if (q.type === "classify_buckets") {
      document.querySelectorAll("[data-bucket-item]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (isRevealed) return;
          const itemIdx = parseInt(btn.getAttribute("data-bucket-item"), 10);
          state.activeBucketItem = state.activeBucketItem === itemIdx ? null : itemIdx;
          updateQuestionMountInPlace();
        });
      });

      document.querySelectorAll("[data-bucket-target]").forEach((zone) => {
        zone.addEventListener("click", () => {
          if (isRevealed || state.activeBucketItem === null) return;
          const bucketName = zone.getAttribute("data-bucket-target");
          const map = { ...(sess.answers[idx] || {}) };
          map[state.activeBucketItem] = bucketName;
          sess.answers[idx] = map;
          const nextUnassigned = q.items.findIndex((_, i) => map[i] === undefined);
          state.activeBucketItem = nextUnassigned !== -1 ? nextUnassigned : null;
          persistSession();
          updateQuestionMountInPlace();
        });
      });
    }

    if (q.type === "claim_audit") {
      document.querySelectorAll("[data-verdict]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          const v = btn.getAttribute("data-verdict");
          const cur = sess.answers[idx] || { verdict: "", reasoning: "" };
          sess.answers[idx] = { ...cur, verdict: v };
          document.querySelectorAll("[data-verdict]").forEach((el) => {
            const match = el === btn;
            el.classList.toggle("selected", match);
            el.setAttribute("aria-checked", String(match));
          });
          persistSession();
          updateTopBarCountInPlace();
        });
      });
      const reasonInput = document.getElementById("claim-reasoning-input");
      if (reasonInput) {
        reasonInput.addEventListener("input", () => {
          const cur = sess.answers[idx] || { verdict: "", reasoning: "" };
          sess.answers[idx] = { ...cur, reasoning: reasonInput.value };
          persistSession();
          updateTopBarCountInPlace();
        });
      }
    }

    if (q.type === "free_response") {
      const freeInput = document.getElementById("free-response-input");
      if (freeInput) {
        freeInput.addEventListener("input", () => {
          sess.answers[idx] = freeInput.value;
          persistSession();
          updateTopBarCountInPlace();
        });
      }
    }

    if (q.type === "js_code") {
      const codeInput = document.getElementById("js-code-input");
      if (codeInput) {
        codeInput.addEventListener("input", () => {
          sess.answers[idx] = codeInput.value;
          persistSession();
          updateTopBarCountInPlace();
        });
      }
      const resetBtn = document.getElementById("reset-starter-code-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (isRevealed) return;
          sess.answers[idx] = q.starter_code || "";
          if (codeInput) codeInput.value = sess.answers[idx];
          persistSession();
        });
      }
    }
  }

  function resetTransientPickers() {
    state.activeClozeSlot = 0;
    state.activeMatchLeft = null;
    state.activeBucketItem = null;
  }

  /* ------------------------------------------------------------------------
     View 4: Results & Complete Question-by-Question Diagnostic Review
     ------------------------------------------------------------------------ */

  function renderResultsView(container) {
    const test = state.currentTest;
    const summary = computeSessionSummary();
    const isPassed = summary.percentage >= 75;
    const filter = state.reviewFilter;

    const filteredIndices = test.questions
      .map((q, i) => ({ q, i, ev: state.session.evaluations[i] }))
      .filter(({ q, i, ev }) => {
        if (filter === "wrong") return ev?.status !== "correct";
        if (filter === "ai") return q.type === "free_response" || q.type === "claim_audit" || q.type === "js_code";
        if (filter === "flagged") return Boolean(state.session.flagged[i]);
        return true;
      });

    container.innerHTML = `
      <section>
        <div class="results-hero">
          <div class="setup-chapter-tag">Chapter ${test.chapter} · ${summary.mode === "study" ? "Study" : "Test"}</div>
          <div class="progress-ring-wrapper">
            <progress
              id="results-progress-ring"
              class="progress-ring ${isPassed ? "passed" : ""}"
              value="0"
              max="100"
              aria-label="Quiz score"
              aria-valuetext="${summary.percentage}%"
            ></progress>
            <div class="progress-ring-content" aria-hidden="true">
              <span class="progress-ring-pct">${summary.percentage}%</span>
              <span class="progress-ring-sub">${summary.totalScore}/${summary.totalQuestions}</span>
            </div>
          </div>
          <h1 class="setup-title" style="margin-block-end:6px;">
            ${isPassed ? "Mastery Verified" : "Needs Review"}
          </h1>
          <p class="setup-summary" style="margin-block-end:0;">
            ${
              state.session.autoSubmittedByTimer
                ? "Time expired · auto-submitted"
                : `${summary.correctCount} right · ${summary.partialCount} partial · ${summary.wrongCount} missed`
            }
          </p>

          <div class="results-meta-row">
            <div class="stat-item">
              <span class="stat-value" style="color:var(--md-success);">✓ ${summary.correctCount}</span>
              <span class="stat-label">Correct</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color:var(--md-warning);">◐ ${summary.partialCount}</span>
              <span class="stat-label">Partial</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color:var(--md-error);">✕ ${summary.wrongCount}</span>
              <span class="stat-label">Missed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${formatDuration(summary.elapsedSeconds)}</span>
              <span class="stat-label">Time</span>
            </div>
          </div>

          <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:10px;">
            <button id="results-home-btn" class="btn btn-outlined glimmer-btn" type="button">Library</button>
            <button id="results-retake-btn" class="btn btn-filled glimmer-btn" type="button">Retake</button>
          </div>
        </div>

        <div class="review-filters" role="toolbar" aria-label="Filter reviewed questions">
          <button type="button" class="chip ${filter === "all" ? "selected" : ""}" data-filter="all">All (30)</button>
          <button type="button" class="chip ${filter === "wrong" ? "selected" : ""}" data-filter="wrong">Missed (${summary.wrongCount + summary.partialCount})</button>
          <button type="button" class="chip ${filter === "ai" ? "selected" : ""}" data-filter="ai">Written &amp; JS</button>
          <button type="button" class="chip ${filter === "flagged" ? "selected" : ""}" data-filter="flagged">Flagged</button>
        </div>

        <div id="review-list-mount">
          ${filteredIndices
            .map(({ q, i, ev }) => {
              const status = ev?.status || "wrong";
              const icon = status === "correct" ? "✓" : status === "partial" ? "◐" : "✕";
              return `
                <article class="review-item">
                  <div class="review-item-head">
                    <div class="q-badges">
                      <span class="q-index-badge">Q${i + 1}</span>
                      <span class="q-type-badge">${escapeHtml(TYPE_LABELS[q.type] || q.type)}</span>
                    </div>
                    <span class="review-badge ${status}">
                      ${icon} ${status === "correct" ? "Correct" : status === "partial" ? "Partial" : "Missed"} · ${Math.round((ev?.score || 0) * 100)}%
                    </span>
                  </div>
                  <h2 style="font-size:16.5px;font-weight:600;margin:0 0 12px;">${escapeHtml(q.prompt)}</h2>
                  ${q.code_snippet ? `<pre class="code-block"><code>${escapeHtml(q.code_snippet)}</code></pre>` : ""}
                  ${renderQuestionBody(q, i, state.session.answers[i], ev, true)}
                  ${renderFeedbackPanel(q, ev)}
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;

    // Sync <progress class="progress-ring"> value with fallback where attr(value type(<number>)) is unsupported
    const ring = document.getElementById("results-progress-ring");
    if (ring) {
      const supportsTypedAttr = window.CSS?.supports?.("width: attr(value type(<number>))");
      if (!supportsTypedAttr) {
        const obs = new MutationObserver(() => {
          ring.style.setProperty("--value", ring.getAttribute("value") || "0");
        });
        obs.observe(ring, { attributes: true, attributeFilter: ["value"] });
      }
      requestAnimationFrame(() => {
        ring.setAttribute("value", String(summary.percentage));
        if (!supportsTypedAttr) {
          ring.style.setProperty("--value", String(summary.percentage));
        }
      });
    }

    document.getElementById("results-home-btn").addEventListener("click", () => {
      clearSavedSession(test.chapter);
      window.location.hash = "";
      navigateWithTransition(() => {
        state.view = "home";
        render();
      }, "backward");
    });

    document.getElementById("results-retake-btn").addEventListener("click", () => {
      clearSavedSession(test.chapter);
      navigateWithTransition(() => {
        state.view = "setup";
        render();
      }, "backward");
    });

    container.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.reviewFilter = btn.getAttribute("data-filter");
        renderResultsView(container);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Utility Helpers
     ------------------------------------------------------------------------ */

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
