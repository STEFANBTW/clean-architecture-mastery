# Clean Architecture Mastery — Interactive Testing Platform

An interactive, minimalist **Material Design 3** online testing platform for Robert C. Martin's *Clean Architecture: A Craftsman's Guide to Software Structure and Design*.

- **Live GitHub Pages App:** https://stefanbtw.github.io/clean-architecture-mastery/
- **Daily Schedule:** Every morning at **7:00 a.m. WAT (`Africa/Lagos`)**, GitHub Actions reads the next 2 chapters from `/chapters`, generates two 30-question interactive assessments (60 questions/day), publishes them to GitHub Pages, and emails `sa.adeyemi788@gmail.com` ahead of the **9:00–11:00 a.m. WAT** daily Google Calendar study block.

---

## Features

1. **Two Assessment Modes**
   - **Study Mode:** Instant green/red visual feedback on every question, per-option explanations showing *why every right option is right* and *why every wrong option is wrong*, live sandboxed JavaScript execution, and instant **Gemini AI** grading of your own-words answers.
   - **Test Mode:** Choose any custom timer duration (20m, 30m, 45m, 60m, 90m, or custom minutes). Zero answers revealed mid-test, auto-submission when the timer reaches `00:00`, batch Gemini AI evaluation on submit, and a complete post-exam diagnostic review.
2. **11 Cognitive & Interactive Question Formats (All Code Syntax in JavaScript)**
   - `mcq_single` — Diagnostic MCQ (every option explained)
   - `mcq_multi` — Multi-Select Analysis (every option explained)
   - `spot_flaw` — Clickable bug/flaw hunt on JavaScript code or architectural case statements
   - `cloze_bank` — Interactive concept completion with word bank
   - `cloze_typed` — Precision fill-in-the-blank in your own words
   - `order_steps` — Drag-and-drop & keyboard causal sequence puzzle
   - `match_pairs` — Architectural mapping puzzle
   - `classify_buckets` — Multi-bucket triage sort
   - `claim_audit` — Audit a statement (`Architecturally Sound` / `Dangerous Fallacy` / `Context-Dependent Trap`) + own-words defense
   - `free_response` — Feynman synthesis & trade-off differentiation evaluated by Gemini AI
   - `js_code` — Live sandboxed ES2024 JavaScript coding lab with instant unit test assertions

---

## Required GitHub Repository Secrets (For Unattended 7:00 a.m. WAT Runs)

Go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret Name | Value |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API key (`AIzaSy...`) |
| `GMAIL_APP_PASSWORD` | Your 16-character Google App Password for `sa.adeyemi788@gmail.com` |
