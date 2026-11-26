/* ==========================================================================
   Clean Architecture Mastery — Interactive Testing Engine (Pure Vanilla JS)
   Supports:
   - Study Mode (immediate green/red feedback + per-option explanations + live AI)
   - Test Mode (custom timer, locked answers until submission, batch AI grading)
   - 10 Deep-Learning Question Formats:
     1. mcq_single      (Diagnostic MCQ — every right & wrong option explained)
     2. mcq_multi       (Multi-Select MCQ — every option explained)
     3. spot_flaw       (Click the flawed line(s) in JS code or architectural spec)
     4. cloze_bank      (Interactive fill-in-the-blank with clickable word bank)
     5. cloze_typed     (Precision fill-in-the-blank in your own words)
     6. order_steps     (Drag-and-drop / arrow sequence & causal chain puzzle)
     7. match_pairs     (Connect concepts, symptoms, or metrics to consequences)
     8. classify_buckets(Triage sort items into architectural buckets)
     9. claim_audit     (Audit a statement: True / False / Trap + justification)
     10. free_response  (Feynman / Contrast / Counterfactual graded by Gemini AI)
     11. js_code        (Live sandboxed JavaScript execution + unit tests + AI)
   ========================================================================== */

(() => {
  "use strict";

  const STORAGE_KEYS = {
    THEME: "ca_mastery_theme",
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
    session: null, // active quiz state
    timerInterval: null,
    activeClozeSlot: 0,
    activeMatchLeft: null,
    activeBucketItem: null,
    dragOrderIdx: null,
    reviewFilter: "all", // 'all' | 'wrong' | 'ai' | 'flagged'
    isGradingBatch: false,
  };

  /* ------------------------------------------------------------------------
     Initialization & Theme
     ------------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initApiModal();
    document.getElementById("brand-home-btn").addEventListener("click", () => {
      stopTimer();
      state.view = "home";
      render();
    });

    await loadTestsManifest();
    handleHashRoute();
    window.addEventListener("hashchange", handleHashRoute);
  });

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    applyTheme(saved);
    document.getElementById("theme-toggle-btn").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "light" ? "dark" : "light");
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    const sun = document.getElementById("theme-icon-sun");
    const moon = document.getElementById("theme-icon-moon");
    if (theme === "dark") {
      sun.classList.remove("hidden");
      moon.classList.add("hidden");
    } else {
      sun.classList.add("hidden");
      moon.classList.remove("hidden");
    }
  }

  /* ------------------------------------------------------------------------
     Gemini API Key Settings
     ------------------------------------------------------------------------ */

  function getGeminiKey() {
    return (localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "").trim();
  }

  function getGeminiModel() {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL) || "gemini-2.5-flash";
  }

  function updateApiDot() {
    const dot = document.getElementById("api-status-dot");
    if (!dot) return;
    if (getGeminiKey()) {
      dot.classList.add("connected");
    } else {
      dot.classList.remove("connected");
    }
  }

  function initApiModal() {
    updateApiDot();
    const backdrop = document.getElementById("api-modal-backdrop");
    const input = document.getElementById("gemini-key-input");
    const modelSelect = document.getElementById("gemini-model-select");
    const feedback = document.getElementById("api-test-feedback");

    document.getElementById("open-api-modal-btn").addEventListener("click", () => {
      input.value = getGeminiKey();
      modelSelect.value = getGeminiModel();
      feedback.textContent = getGeminiKey()
        ? "API key is active in local storage."
        : "No API key saved yet. Heuristic rubric grading will be used as a fallback until you add one.";
      backdrop.classList.remove("hidden");
    });

    document.getElementById("close-api-modal-btn").addEventListener("click", () => {
      backdrop.classList.add("hidden");
    });

    document.getElementById("clear-api-key-btn").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
      input.value = "";
      updateApiDot();
      feedback.textContent = "API key cleared from this browser.";
    });

    document.getElementById("save-api-key-btn").addEventListener("click", () => {
      const val = input.value.trim();
      if (val) {
        localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, val);
      } else {
        localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
      }
      localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, modelSelect.value);
      updateApiDot();
      backdrop.classList.add("hidden");
      render();
    });
  }

  /* ------------------------------------------------------------------------
     Manifest & Deep-Link Routing
     ------------------------------------------------------------------------ */

  async function loadTestsManifest() {
    try {
      const res = await fetch(`data/tests_manifest.json?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load tests_manifest.json");
      state.manifest = await res.json();
    } catch (err) {
      console.error(err);
      state.manifest = { book_title: "Clean Architecture", available_tests: [] };
    }
  }

  async function handleHashRoute() {
    const hash = window.location.hash || "";
    const match = hash.match(/chapter=(\d+)/);
    if (match && state.manifest) {
      const chapNum = parseInt(match[1], 10);
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
      const res = await fetch(`${meta.file}?t=${Date.now()}`);
      state.currentTest = await res.json();
      state.view = "setup";
      render();
    } catch (e) {
      alert("Could not load chapter test JSON: " + e.message);
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
    localStorage.setItem(
      STORAGE_KEYS.SESSION_PREFIX + state.session.chapter,
      JSON.stringify(state.session)
    );
  }

  function clearSavedSession(chapterNum) {
    localStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + chapterNum);
  }

  /* ------------------------------------------------------------------------
     Quiz Session Lifecycle & Timer
     ------------------------------------------------------------------------ */

  function startNewSession(mode, timerMinutes) {
    const test = state.currentTest;
    const initialAnswers = {};
    test.questions.forEach((q, idx) => {
      if (q.type === "order_steps") {
        // Create a deterministic shuffled initial order if not already answers
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
      evaluations: {}, // idx -> { status: 'correct'|'partial'|'wrong', score: 0..1, feedback, rubricHits, jsResults }
      flagged: {},
      submitted: false,
      startedAt: new Date().toISOString(),
    };

    state.activeClozeSlot = 0;
    state.activeMatchLeft = null;
    state.activeBucketItem = null;
    persistSession();
    state.view = "quiz";
    startTimerIfNeeded();
    render();
  }

  function resumeSavedSession(saved) {
    state.session = saved;
    state.activeClozeSlot = 0;
    state.activeMatchLeft = null;
    state.activeBucketItem = null;
    state.view = saved.submitted ? "results" : "quiz";
    if (!saved.submitted) {
      startTimerIfNeeded();
    }
    render();
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
     Evaluation Logic (Objective + JS Runner + Gemini AI)
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
        const expected = new Set(q.flawed_Indices || q.flawed_indices);
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
        const fn = new Function(
          `${userCode}\n; return (${tc.call});`
        );
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
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
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
      console.warn("Gemini API fallback:", err);
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
    state.view = "results";
    render();
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
     Top App Bar & View Dispatcher
     ------------------------------------------------------------------------ */

  function render() {
    const main = document.getElementById("app-main");
    const topCenter = document.getElementById("top-bar-center");
    const progressFill = document.getElementById("top-progress-fill");

    topCenter.innerHTML = "";
    progressFill.style.width = "0%";

    if (state.view === "home") {
      renderHomeView(main);
    } else if (state.view === "setup") {
      renderSetupView(main);
    } else if (state.view === "quiz") {
      renderQuizTopBar(topCenter, progressFill);
      renderQuizView(main);
    } else if (state.view === "results") {
      progressFill.style.width = "100%";
      renderResultsView(main);
    }
  }

  function renderQuizTopBar(topCenter, progressFill) {
    const total = state.currentTest.questions.length;
    const answeredCount = state.currentTest.questions.filter((q, idx) =>
      isAnswerProvided(q, state.session.answers[idx])
    ).length;
    const pct = Math.round(((state.session.currentIndex + 1) / total) * 100);
    progressFill.style.width = `${pct}%`;

    const modeLabel = state.session.mode === "study" ? "Study Mode" : "Test Mode";
    const timeVal =
      state.session.mode === "test" && state.session.timerSecondsTotal > 0
        ? formatDuration(state.session.timerSecondsLeft)
        : formatDuration(state.session.elapsedSeconds || 0);

    topCenter.innerHTML = `
      <div class="quiz-header-pills">
        <span class="mode-pill">${modeLabel} · ${answeredCount}/${total}</span>
        <span id="live-timer-pill" class="timer-pill">${timeVal}</span>
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     View 1: Home / Chapter Library
     ------------------------------------------------------------------------ */

  function renderHomeView(container) {
    const tests = state.manifest?.available_tests || [];
    const history = getHistory();
    const completedChapters = Object.values(history).filter((h) => h.percentage >= 70).length;
    const totalQuestionsAvailable = tests.reduce((acc, t) => acc + (t.question_count || 30), 0);

    const cardsHtml = tests
      .map((t) => {
        const h = history[t.chapter];
        const savedSession = getSavedSession(t.chapter);
        const hasInProgress = savedSession && !savedSession.submitted;
        const isPassed = h && h.bestPct >= 75;

        let statusChip = `<span class="score-chip">30 Questions</span>`;
        if (hasInProgress) {
          statusChip = `<span class="score-chip" style="background:var(--md-primary-container);color:var(--md-on-primary-container);">In Progress</span>`;
        } else if (h) {
          statusChip = `<span class="score-chip ${isPassed ? "passed" : ""}">Best: ${h.bestPct}%</span>`;
        }

        return `
          <button class="chapter-card ${isPassed ? "completed" : ""}" type="button" data-chapter="${t.chapter}" id="chapter-card-${t.chapter}">
            <div class="chapter-card-left">
              <div class="chapter-num">${String(t.chapter).padStart(2, "0")}</div>
              <div class="chapter-meta">
                <div class="chapter-part">${escapeHtml(t.part || "Clean Architecture")} · Released ${escapeHtml(t.released_on || "Today")}</div>
                <h2 class="chapter-name">Chapter ${t.chapter}: ${escapeHtml(t.title)}</h2>
                <p class="chapter-desc">${escapeHtml(t.subtitle || "")}</p>
              </div>
            </div>
            <div class="chapter-card-right">
              ${statusChip}
              <svg class="chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </button>
        `;
      })
      .join("");

    container.innerHTML = `
      <section class="view-fade">
        <div class="home-header">
          <p class="home-eyebrow">Daily Architectural Mastery · Robert C. Martin</p>
          <h1 class="home-title">Clean Architecture Assessment Lab</h1>
          <p class="home-subtitle">
            Two chapters unlocked every morning at 7:00 a.m. WAT. Each chapter features 30 interactive questions across 10 cognitive formats—using JavaScript for all code syntax and Gemini AI for evaluating your explanations.
          </p>
          <div class="home-stats-strip">
            <div class="stat-item">
              <span class="stat-value">${tests.length} / ${state.manifest?.total_book_chapters || 34}</span>
              <span class="stat-label">Chapters Unlocked</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${totalQuestionsAvailable}</span>
              <span class="stat-label">Interactive Questions</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${completedChapters}</span>
              <span class="stat-label">Chapters Mastered (≥75%)</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${getGeminiKey() ? "Connected" : "Optional"}</span>
              <span class="stat-label">Gemini AI Evaluator</span>
            </div>
          </div>
        </div>

        <div class="chapter-list">
          ${cardsHtml}
        </div>
      </section>
    `;

    container.querySelectorAll(".chapter-card").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const chapNum = parseInt(btn.getAttribute("data-chapter"), 10);
        const meta = tests.find((x) => x.chapter === chapNum);
        if (meta) await openChapterSetup(meta);
      });
    });
  }

  /* ------------------------------------------------------------------------
     View 2: Mode Setup (Study Mode vs. Test Mode + Custom Timer)
     ------------------------------------------------------------------------ */

  function renderSetupView(container) {
    const test = state.currentTest;
    const saved = getSavedSession(test.chapter);
    const mode = state.setupConfig.mode;
    const mins = state.setupConfig.timerMinutes;

    const resumeHtml =
      saved && !saved.submitted
        ? `
        <div class="resume-banner">
          <div>
            <strong>Unfinished ${saved.mode === "study" ? "Study" : "Test"} Session Found</strong>
            <div>Question ${saved.currentIndex + 1} of ${test.questions.length}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="discard-saved-btn" class="btn btn-text btn-sm" type="button">Discard</button>
            <button id="resume-saved-btn" class="btn btn-filled btn-sm" type="button">Resume</button>
          </div>
        </div>
      `
        : "";

    container.innerHTML = `
      <section class="setup-shell view-fade">
        <button id="setup-back-btn" class="back-link" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          All Chapters
        </button>

        <div class="setup-card">
          ${resumeHtml}
          <div class="setup-chapter-tag">${escapeHtml(test.part)} · Chapter ${test.chapter}</div>
          <h1 class="setup-title">${escapeHtml(test.title)}</h1>
          <p class="setup-summary">${escapeHtml(test.description || "")}</p>

          <div class="mode-grid" role="radiogroup" aria-label="Quiz Mode">
            <button id="select-study-mode" class="mode-option ${mode === "study" ? "selected" : ""}" type="button">
              <div class="mode-option-head">
                <span class="mode-option-title">Study Mode</span>
                <span class="radio-ring"></span>
              </div>
              <p class="mode-option-desc">
                Immediate green/red feedback after every question. See why every right and wrong MCQ choice is right or wrong, run JS tests live, and get instant AI feedback.
              </p>
            </button>

            <button id="select-test-mode" class="mode-option ${mode === "test" ? "selected" : ""}" type="button">
              <div class="mode-option-head">
                <span class="mode-option-title">Test Mode</span>
                <span class="radio-ring"></span>
              </div>
              <p class="mode-option-desc">
                Timed examination with custom duration. Answers and explanations stay locked until you submit (or timer hits 00:00), followed by a complete diagnostic breakdown.
              </p>
            </button>
          </div>

          ${
            mode === "test"
              ? `
            <div class="timer-panel">
              <span class="timer-panel-label">Choose Exam Duration (Minutes)</span>
              <div class="timer-chips">
                ${[20, 30, 45, 60, 90]
                  .map(
                    (m) => `
                  <button type="button" class="chip timer-preset-chip ${mins === m && !state.setupConfig.customMinutes ? "selected" : ""}" data-min="${m}">
                    ${m} min
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
          `
              : ""
          }

          <div class="setup-footer">
            <span style="font-size:13px;color:var(--md-on-surface-variant);">
              30 Questions · 10 Interactive Formats · JavaScript Syntax
            </span>
            <button id="launch-quiz-btn" class="btn btn-filled" type="button">
              Start ${mode === "study" ? "Study Session" : `Timed Test (${mins}m)`}
            </button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("setup-back-btn").addEventListener("click", () => {
      window.location.hash = "";
      state.view = "home";
      render();
    });

    if (saved && !saved.submitted) {
      document.getElementById("resume-saved-btn").addEventListener("click", () => {
        resumeSavedSession(saved);
      });
      document.getElementById("discard-saved-btn").addEventListener("click", () => {
        clearSavedSession(test.chapter);
        render();
      });
    }

    document.getElementById("select-study-mode").addEventListener("click", () => {
      state.setupConfig.mode = "study";
      render();
    });

    document.getElementById("select-test-mode").addEventListener("click", () => {
      state.setupConfig.mode = "test";
      render();
    });

    container.querySelectorAll(".timer-preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.setupConfig.timerMinutes = parseInt(chip.getAttribute("data-min"), 10);
        state.setupConfig.customMinutes = "";
        render();
      });
    });

    const customInput = document.getElementById("custom-timer-input");
    if (customInput) {
      customInput.addEventListener("input", () => {
        const val = parseInt(customInput.value, 10);
        state.setupConfig.customMinutes = customInput.value;
        if (!isNaN(val) && val > 0) {
          state.setupConfig.timerMinutes = Math.min(240, val);
          const launchBtn = document.getElementById("launch-quiz-btn");
          if (launchBtn) {
            launchBtn.textContent = `Start Timed Test (${state.setupConfig.timerMinutes}m)`;
          }
        }
      });
    }

    document.getElementById("launch-quiz-btn").addEventListener("click", () => {
      startNewSession(state.setupConfig.mode, state.setupConfig.timerMinutes);
    });
  }

  /* ------------------------------------------------------------------------
     View 3: One-Question-at-a-Time Focus Workspace
     ------------------------------------------------------------------------ */

  function renderQuizView(container) {
    if (state.isGradingBatch) {
      container.innerHTML = `
        <section class="setup-shell view-fade" style="text-align:center;padding-top:64px;">
          <div class="setup-card">
            <div class="spinner" style="width:32px;height:32px;margin-bottom:16px;color:var(--md-primary);"></div>
            <h2 class="setup-title">Evaluating Your Architectural Reasoning...</h2>
            <p class="setup-summary" style="margin-bottom:0;">
              Grading all 30 questions, running JavaScript assertions, and generating feedback on your open-ended responses.
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

    container.innerHTML = `
      <section class="question-stage view-fade">
        <div class="q-meta-row">
          <div class="q-badges">
            <span class="q-index-badge">Question ${idx + 1} of ${test.questions.length}</span>
            <span class="q-type-badge">${escapeHtml(TYPE_LABELS[q.type] || q.type)}</span>
            ${q.bloom ? `<span class="q-bloom-badge">· ${escapeHtml(q.bloom)}</span>` : ""}
          </div>
          <button id="toggle-flag-btn" class="flag-btn ${isFlagged ? "flagged" : ""}" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFlagged ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            ${isFlagged ? "Flagged" : "Flag"}
          </button>
        </div>

        <article class="q-card">
          ${q.context ? `<div class="q-context">${escapeHtml(q.context)}</div>` : ""}
          <h1 class="q-prompt">${escapeHtml(q.prompt)}</h1>
          ${q.instruction ? `<p class="q-hint">${escapeHtml(q.instruction)}</p>` : `<div style="height:14px;"></div>`}
          ${q.code_snippet ? `<pre class="code-block"><code>${escapeHtml(q.code_snippet)}</code></pre>` : ""}

          <div id="q-interactive-mount">
            ${renderQuestionBody(q, idx, ans, ev, isRevealed)}
          </div>

          ${isRevealed ? renderFeedbackPanel(q, ev) : ""}

          <div class="q-footer">
            <div class="q-footer-left">
              <button id="prev-q-btn" class="btn btn-outlined" type="button" ${idx === 0 ? "disabled" : ""}>
                Previous
              </button>
            </div>

            <div class="q-footer-right">
              ${
                isStudy && !isRevealed && q.type !== "mcq_single"
                  ? `<button id="check-answer-btn" class="btn btn-tonal" type="button">
                      ${q.type === "js_code" ? "Run Tests & Evaluate" : "Check Answer"}
                    </button>`
                  : ""
              }
              ${
                !isStudy && q.type === "js_code"
                  ? `<button id="dry-run-js-btn" class="btn btn-tonal" type="button">Run Syntax Check</button>`
                  : ""
              }
              ${
                idx < test.questions.length - 1
                  ? `<button id="next-q-btn" class="btn btn-filled" type="button">Next Question</button>`
                  : `<button id="submit-quiz-btn" class="btn btn-filled" type="button">Finish &amp; Submit Quiz</button>`
              }
            </div>
          </div>
        </article>

        <div class="nav-strip-wrap">
          <div class="nav-strip-label">
            <span>Question Navigator</span>
            <button id="early-submit-btn" class="btn btn-text btn-sm" type="button">Submit Full Quiz</button>
          </div>
          <div class="nav-dots">
            ${test.questions
              .map((item, i) => {
                const itemEv = sess.evaluations[i];
                const hasAns = isAnswerProvided(item, sess.answers[i]);
                let cls = "nav-dot";
                if (i === idx) cls += " current";
                else if (isStudy && itemEv) cls += ` ${itemEv.status === "correct" ? "correct" : "wrong"}`;
                else if (hasAns) cls += " answered";
                if (sess.flagged[i]) cls += " flagged";
                return `<button type="button" class="${cls}" data-jump="${i}" aria-label="Go to question ${i + 1}">${i + 1}</button>`;
              })
              .join("")}
          </div>
        </div>
      </section>
    `;

    bindQuestionEvents(q, idx, isRevealed);
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
      <div class="mcq-list" role="radiogroup">
        ${q.options
          .map((opt, i) => {
            const isSelected = ans === i;
            const isRight = i === q.correct_index;
            let cls = "mcq-option";
            let statusTag = "";

            if (isRevealed) {
              if (isRight) {
                cls += isSelected ? " correct" : " revealed-correct";
                statusTag = `<span class="mcq-status-tag is-correct">${isSelected ? "Correct Choice" : "Correct Answer"}</span>`;
              } else if (isSelected) {
                cls += " wrong";
                statusTag = `<span class="mcq-status-tag is-wrong">Your Pick · Incorrect</span>`;
              }
            } else if (isSelected) {
              cls += " selected";
            }

            const expHtml = isRevealed
              ? `<div class="mcq-explanation">
                  <strong>${isRight ? "Why this is right:" : "Why this is wrong:"}</strong>
                  ${escapeHtml(opt.explanation)}
                </div>`
              : "";

            return `
              <button type="button" class="${cls}" data-mcq-idx="${i}">
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
      <div class="mcq-list">
        ${q.options
          .map((opt, i) => {
            const isSelected = selected.has(i);
            const isRight = expected.has(i);
            let cls = "mcq-option";
            let statusTag = "";

            if (isRevealed) {
              if (isRight && isSelected) {
                cls += " correct";
                statusTag = `<span class="mcq-status-tag is-correct">Selected · Correct</span>`;
              } else if (isRight && !isSelected) {
                cls += " revealed-correct";
                statusTag = `<span class="mcq-status-tag is-correct">Missed · Correct</span>`;
              } else if (!isRight && isSelected) {
                cls += " wrong";
                statusTag = `<span class="mcq-status-tag is-wrong">Selected · Wrong</span>`;
              }
            } else if (isSelected) {
              cls += " selected";
            }

            const expHtml = isRevealed
              ? `<div class="mcq-explanation">
                  <strong>${isRight ? "Why this is right:" : "Why this is wrong:"}</strong>
                  ${escapeHtml(opt.explanation)}
                </div>`
              : "";

            return `
              <button type="button" class="${cls}" data-multi-idx="${i}" ${isRevealed ? "disabled" : ""}>
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
                ? `<div class="flaw-line-note"><strong>${isFlaw ? "Flaw Analysis:" : "Clean Line:"}</strong> ${escapeHtml(note)}</div>`
                : "";

            return `
              <button type="button" class="${cls}" data-flaw-idx="${i}" ${isRevealed ? "disabled" : ""}>
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
      const label = isRevealed && !ev?.perBlank?.[i]
        ? `${val || "___"} → ${b.answer}`
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
      const inputHtml = `<input type="text" class="${cls}" data-typed-blank="${i}" value="${escapeHtml(val)}" placeholder="${escapeHtml(b.placeholder || `blank #${i + 1}`)}" ${isRevealed ? "disabled" : ""} />`;
      const correction =
        isRevealed && !ev?.perBlank?.[i]
          ? `<span style="font-size:13px;font-weight:700;color:var(--md-success);margin-left:4px;">(${escapeHtml(b.answer)})</span>`
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
              <div class="${cls}" draggable="${!isRevealed}" data-order-pos="${pos}">
                <span class="order-pos">${pos + 1}</span>
                <span class="order-text">${escapeHtml(text)}</span>
                ${
                  !isRevealed
                    ? `<div class="order-arrows">
                        <button type="button" class="order-arrow-btn" data-move-dir="-1" data-pos="${pos}" ${pos === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
                        <button type="button" class="order-arrow-btn" data-move-dir="1" data-pos="${pos}" ${pos === currentOrder.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
                      </div>`
                    : `<span style="font-size:12px;font-weight:700;">${isRightPos ? "✓" : `Should be #${q.correct_order.indexOf(itemIdx) + 1}`}</span>`
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
                <button type="button" class="${cls}" data-match-left="${leftIdx}" ${isRevealed ? "disabled" : ""}>
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
              const matchedLeftKey = Object.keys(mapping).find(
                (k) => mapping[k] === pairIdx
              );
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
                      ? `<span class="pair-tag">#${Number(matchedLeftKey) + 1}</span>`
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
                    <button type="button" class="bucket-card-item ${isSel ? "selected" : ""}" data-bucket-item="${item.idx}" ${isRevealed ? "disabled" : ""}>
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
                              ? `<div style="font-size:11.5px;font-weight:700;margin-top:3px;">→ Belongs in: ${escapeHtml(item.bucket)}</div>`
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
      <div class="verdict-row">
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
            return `
              <button type="button" class="${cls}" data-verdict="${escapeHtml(v)}" ${isRevealed ? "disabled" : ""}>
                ${escapeHtml(v)}
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
          <span>${r.passed ? "✓ PASS" : "✗ FAIL"} · ${escapeHtml(r.label)}</span>
          <span>Expected: ${escapeHtml(r.expected)} | Got: ${escapeHtml(r.actual)}</span>
        </div>
      `
      )
      .join("");

    return `
      <div class="code-editor-wrap">
        <div class="code-editor-bar">
          <span>JavaScript (ES2024 Sandbox)</span>
          <button id="reset-starter-code-btn" class="btn btn-text btn-sm" type="button" style="color:var(--code-fg);min-height:26px;padding:0 8px;">Reset Starter Code</button>
        </div>
        <textarea
          id="js-code-input"
          class="code-editor"
          spellcheck="false"
          ${isRevealed ? "disabled" : ""}
        >${escapeHtml(ans ?? q.starter_code ?? "")}</textarea>
      </div>
      ${testRows ? `<div class="js-test-results">${testRows}</div>` : ""}
    `;
  }

  function renderFeedbackPanel(q, ev) {
    if (!ev) return "";
    const titles = {
      correct: "Mastery Confirmed",
      partial: "Partially Correct — Nuance Needed",
      wrong: "Misconception Detected",
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
          <div style="margin-top:4px;white-space:pre-wrap;">${escapeHtml(q.model_answer)}</div>
        </div>
      `
        : "";

    return `
      <div class="feedback-box ${ev.status}">
        <div class="feedback-title">
          <span>${titles[ev.status] || "Evaluation"} (${Math.round((ev.score || 0) * 100)}%)</span>
          ${ev.gradedBy ? `<span style="font-size:12px;font-weight:500;opacity:0.85;">${escapeHtml(ev.gradedBy)}</span>` : ""}
        </div>
        <p class="feedback-body">${escapeHtml(ev.feedback || q.overall_explanation || "")}</p>
        ${hitsHtml}
        ${modelAnsHtml}
      </div>
    `;
  }

  /* ------------------------------------------------------------------------
     Interactive Event Bindings for the Current Question
     ------------------------------------------------------------------------ */

  function bindQuestionEvents(q, idx, isRevealed) {
    const sess = state.session;
    const isStudy = sess.mode === "study";

    // Flag toggle
    document.getElementById("toggle-flag-btn").addEventListener("click", () => {
      sess.flagged[idx] = !sess.flagged[idx];
      persistSession();
      render();
    });

    // Navigation buttons
    const prevBtn = document.getElementById("prev-q-btn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (sess.currentIndex > 0) {
          sess.currentIndex--;
          resetTransientPickers();
          persistSession();
          render();
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
          render();
        }
      });
    }

    const submitBtn = document.getElementById("submit-quiz-btn");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => finalizeAndSubmitQuiz(false));
    }

    const earlySubmitBtn = document.getElementById("early-submit-btn");
    if (earlySubmitBtn) {
      earlySubmitBtn.addEventListener("click", () => finalizeAndSubmitQuiz(false));
    }

    document.querySelectorAll("[data-jump]").forEach((dot) => {
      dot.addEventListener("click", () => {
        sess.currentIndex = parseInt(dot.getAttribute("data-jump"), 10);
        resetTransientPickers();
        persistSession();
        render();
      });
    });

    // Study mode "Check Answer" button
    const checkBtn = document.getElementById("check-answer-btn");
    if (checkBtn) {
      checkBtn.addEventListener("click", async () => {
        checkBtn.disabled = true;
        checkBtn.innerHTML = `<span class="spinner"></span> Evaluating...`;
        await evaluateSingleQuestion(idx);
        persistSession();
        render();
      });
    }

    // Test mode JS syntax dry-run
    const dryRunBtn = document.getElementById("dry-run-js-btn");
    if (dryRunBtn) {
      dryRunBtn.addEventListener("click", () => {
        const res = runSandboxedJsTests(q, sess.answers[idx] || "");
        const passed = res.jsResults.filter((r) => r.passed).length;
        alert(`JavaScript Test Runner: ${passed}/${res.jsResults.length} assertions passed.`);
      });
    }

    // Format-specific listeners
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
          render();
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
          persistSession();
          render();
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
          } else {
            if (cur.has(lineIdx)) cur.delete(lineIdx);
            else cur.add(lineIdx);
            sess.answers[idx] = Array.from(cur);
          }
          persistSession();
          render();
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
          render();
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
          render();
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
        });
      });
    }

    if (q.type === "order_steps") {
      document.querySelectorAll("[data-move-dir]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          const pos = parseInt(btn.getAttribute("data-pos"), 10);
          const dir = parseInt(btn.getAttribute("data-move-dir"), 10);
          const arr = [...(sess.answers[idx] || q.initial_order)];
          const target = pos + dir;
          if (target >= 0 && target < arr.length) {
            [arr[pos], arr[target]] = [arr[target], arr[pos]];
            sess.answers[idx] = arr;
            persistSession();
            render();
          }
        });
      });

      // HTML5 drag and drop reordering
      document.querySelectorAll("[data-order-pos]").forEach((row) => {
        row.addEventListener("dragstart", () => {
          state.dragOrderIdx = parseInt(row.getAttribute("data-order-pos"), 10);
          row.classList.add("dragging");
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
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
          const fromPos = state.dragOrderIdx;
          const toPos = parseInt(row.getAttribute("data-order-pos"), 10);
          if (fromPos === null || fromPos === toPos) return;
          const arr = [...(sess.answers[idx] || q.initial_order)];
          const [moved] = arr.splice(fromPos, 1);
          arr.splice(toPos, 0, moved);
          sess.answers[idx] = arr;
          state.dragOrderIdx = null;
          persistSession();
          render();
        });
      });
    }

    if (q.type === "match_pairs") {
      document.querySelectorAll("[data-match-left]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (isRevealed) return;
          state.activeMatchLeft = parseInt(btn.getAttribute("data-match-left"), 10);
          render();
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
          // Remove any previous left paired to this rightIdx
          Object.keys(map).forEach((k) => {
            if (map[k] === rightIdx) delete map[k];
          });
          map[leftIdx] = rightIdx;
          sess.answers[idx] = map;
          const nextUnpaired = q.pairs.findIndex((_, i) => map[i] === undefined);
          state.activeMatchLeft = nextUnpaired !== -1 ? nextUnpaired : null;
          persistSession();
          render();
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
          render();
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
          render();
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
          persistSession();
          render();
        });
      });
      const reasonInput = document.getElementById("claim-reasoning-input");
      if (reasonInput) {
        reasonInput.addEventListener("input", () => {
          const cur = sess.answers[idx] || { verdict: "", reasoning: "" };
          sess.answers[idx] = { ...cur, reasoning: reasonInput.value };
          persistSession();
        });
      }
    }

    if (q.type === "free_response") {
      const freeInput = document.getElementById("free-response-input");
      if (freeInput) {
        freeInput.addEventListener("input", () => {
          sess.answers[idx] = freeInput.value;
          persistSession();
        });
      }
    }

    if (q.type === "js_code") {
      const codeInput = document.getElementById("js-code-input");
      if (codeInput) {
        codeInput.addEventListener("input", () => {
          sess.answers[idx] = codeInput.value;
          persistSession();
        });
      }
      const resetBtn = document.getElementById("reset-starter-code-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (isRevealed) return;
          sess.answers[idx] = q.starter_code || "";
          persistSession();
          render();
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
      <section class="view-fade">
        <div class="results-hero">
          <div class="setup-chapter-tag">Chapter ${test.chapter} · ${summary.mode === "study" ? "Study Session" : "Timed Examination"} Complete</div>
          <div class="results-score-ring ${isPassed ? "passed" : ""}">${summary.percentage}%</div>
          <h1 class="setup-title" style="margin-bottom:6px;">
            ${isPassed ? "Architectural Mastery Verified" : "Review Required to Solidify Boundaries"}
          </h1>
          <p class="setup-summary" style="margin-bottom:0;">
            ${
              state.session.autoSubmittedByTimer
                ? "Time expired — your quiz was automatically submitted and graded."
                : `You earned ${summary.totalScore} out of ${summary.totalQuestions} points across 30 questions.`
            }
          </p>

          <div class="results-meta-row">
            <div class="stat-item">
              <span class="stat-value" style="color:var(--md-success);">${summary.correctCount}</span>
              <span class="stat-label">Mastered</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color:var(--md-warning);">${summary.partialCount}</span>
              <span class="stat-label">Partial Credit</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color:var(--md-error);">${summary.wrongCount}</span>
              <span class="stat-label">Needs Review</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${formatDuration(summary.elapsedSeconds)}</span>
              <span class="stat-label">Time Invested</span>
            </div>
          </div>

          <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:10px;">
            <button id="results-home-btn" class="btn btn-outlined" type="button">Back to Library</button>
            <button id="results-retake-btn" class="btn btn-filled" type="button">New Session</button>
          </div>
        </div>

        <div class="review-filters">
          <button type="button" class="chip ${filter === "all" ? "selected" : ""}" data-filter="all">All Questions (30)</button>
          <button type="button" class="chip ${filter === "wrong" ? "selected" : ""}" data-filter="wrong">Missed &amp; Partial (${summary.wrongCount + summary.partialCount})</button>
          <button type="button" class="chip ${filter === "ai" ? "selected" : ""}" data-filter="ai">Own-Words &amp; JS Code</button>
          <button type="button" class="chip ${filter === "flagged" ? "selected" : ""}" data-filter="flagged">Flagged</button>
        </div>

        <div>
          ${filteredIndices
            .map(({ q, i, ev }) => {
              const status = ev?.status || "wrong";
              return `
                <article class="review-item">
                  <div class="review-item-head">
                    <div class="q-badges">
                      <span class="q-index-badge">Q${i + 1}</span>
                      <span class="q-type-badge">${escapeHtml(TYPE_LABELS[q.type] || q.type)}</span>
                    </div>
                    <span class="review-badge ${status}">
                      ${status === "correct" ? "Correct" : status === "partial" ? "Partial" : "Incorrect"} · ${Math.round((ev?.score || 0) * 100)}%
                    </span>
                  </div>
                  <h3 style="font-size:16.5px;font-weight:600;margin:0 0 12px;">${escapeHtml(q.prompt)}</h3>
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

    document.getElementById("results-home-btn").addEventListener("click", () => {
      clearSavedSession(test.chapter);
      window.location.hash = "";
      state.view = "home";
      render();
    });

    document.getElementById("results-retake-btn").addEventListener("click", () => {
      clearSavedSession(test.chapter);
      state.view = "setup";
      render();
    });

    container.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.reviewFilter = btn.getAttribute("data-filter");
        render();
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
