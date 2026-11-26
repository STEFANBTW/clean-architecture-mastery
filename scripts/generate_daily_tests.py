#!/usr/bin/env python3
"""
Unattended Daily Clean Architecture Test Generator & Email Notifier.
Executed every morning at 07:00 WAT (06:00 UTC) by GitHub Actions while the user's laptop is off.

1. Reads `data/tests_manifest.json` and `chapters/manifest.json`.
2. Selects the next 2 unlocked chapters (e.g., Chapters 3 & 4, then 5 & 6, up to 34).
3. Calls Google Gemini API (`GEMINI_API_KEY`) to generate 30 deep-drilling interactive questions per chapter
   across all 11 cognitive formats (using JavaScript for all code syntax and explanations for every right & wrong MCQ option).
4. Saves `data/tests/chapter-XX.json` and updates `data/tests_manifest.json`.
5. Sends an HTML notification email via Gmail SMTP (`GMAIL_APP_PASSWORD`) to `sa.adeyemi788@gmail.com` with direct links.
"""

import datetime
import json
import os
import smtplib
import sys
import urllib.error
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAPTERS_MANIFEST_PATH = os.path.join(ROOT_DIR, "chapters", "manifest.json")
TESTS_MANIFEST_PATH = os.path.join(ROOT_DIR, "data", "tests_manifest.json")
TESTS_DIR = os.path.join(ROOT_DIR, "data", "tests")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()
GMAIL_USER = os.environ.get("GMAIL_USER", "sa.adeyemi788@gmail.com").strip()
GMAIL_TO = os.environ.get("GMAIL_TO", "sa.adeyemi788@gmail.com").strip()
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "").strip()
PAGES_BASE_URL = os.environ.get(
    "PAGES_BASE_URL", "https://stefanbtw.github.io/clean-architecture-mastery"
).rstrip("/")


SYSTEM_PROMPT = """You are a master software architecture professor creating a rigorous, deeply imaginative 30-question interactive test for one chapter of Robert C. Martin's "Clean Architecture".

MANDATORY RULES:
1. Generate EXACTLY 30 questions (`questions` array of length 30) that thoroughly drill the user's conceptual, quantitative, practical, and architectural understanding of this specific chapter.
2. ALL programming code snippets, spot-the-flaw lines, and interactive coding challenges MUST use modern JavaScript (ES2024) — even if the book uses Java, C, or C++. Translate every architectural concept (polymorphism, dependency inversion, encapsulation, functional immutability, component boundaries) into idiomatic JavaScript.
3. For every `mcq_single` and `mcq_multi` question, EVERY option (both right and wrong) MUST include a thorough `explanation` field stating specifically why that option is right or why it is wrong.
4. Use a rich, non-repetitive mix across these 11 interactive question types supported by our frontend:
   - `mcq_single`: { id, type: "mcq_single", bloom, prompt, instruction, code_snippet?, options: [{ text, explanation }], correct_index, overall_explanation }
   - `mcq_multi`: { id, type: "mcq_multi", bloom, prompt, instruction, code_snippet?, options: [{ text, explanation }], correct_indices: [int], overall_explanation }
   - `spot_flaw`: { id, type: "spot_flaw", bloom, prose_mode: bool, prompt, instruction, lines: [{ text, explanation }], flawed_indices: [int], overall_explanation }
   - `cloze_bank`: { id, type: "cloze_bank", bloom, prompt, instruction, template: "String with {{1}} and {{2}}...", blanks: [{ answer }], word_bank: [string], overall_explanation }
   - `cloze_typed`: { id, type: "cloze_typed", bloom, prompt, instruction, template: "String with {{1}}...", blanks: [{ answer, accepted: [string], placeholder }], overall_explanation }
   - `order_steps`: { id, type: "order_steps", bloom, prompt, instruction, items: [string], initial_order: [int], correct_order: [0,1,2,...], overall_explanation }
   - `match_pairs`: { id, type: "match_pairs", bloom, prompt, instruction, pairs: [{ left, right }], right_order: [int], overall_explanation }
   - `classify_buckets`: { id, type: "classify_buckets", bloom, prompt, instruction, buckets: [string], items: [{ text, bucket }], overall_explanation }
   - `claim_audit`: { id, type: "claim_audit", bloom, prompt, instruction, claim, verdict_options: ["Architecturally Sound", "Dangerous Fallacy", "Context-Dependent Trap"], correct_verdict, key_concepts: [string], model_answer, overall_explanation }
   - `free_response`: { id, type: "free_response", bloom, prompt, instruction, placeholder, key_concepts: [string], model_answer, overall_explanation }
   - `js_code`: { id, type: "js_code", bloom, prompt, instruction, starter_code, test_cases: [{ label, call, expected }], model_answer, overall_explanation }

Return ONLY a valid JSON object with this top-level structure:
{
  "chapter": <int>,
  "part": "<Part Name>",
  "title": "<Chapter Title>",
  "subtitle": "<1-sentence punchy summary of what this test drills>",
  "description": "<2-sentence overview of the 30-question assessment>",
  "released_on": "<YYYY-MM-DD>",
  "question_count": 30,
  "questions": [ ...30 question objects... ]
}
"""


def call_gemini_for_chapter(chapter_meta: dict, chapter_text: str, today_str: str) -> dict:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )

    user_prompt = (
        f"Generate the complete 30-question interactive test JSON for:\n"
        f"Chapter Number: {chapter_meta['chapter']}\n"
        f"Part: {chapter_meta['part']}\n"
        f"Title: {chapter_meta['title']}\n"
        f"Release Date: {today_str}\n\n"
        f"FULL CHAPTER TEXT:\n"
        f"\"\"\"\n{chapter_text}\n\"\"\""
    )

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=240) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    raw_json = body["candidates"][0]["content"]["parts"][0]["text"]
    test_data = json.loads(raw_json)
    test_data["chapter"] = chapter_meta["chapter"]
    test_data["part"] = chapter_meta["part"]
    test_data["title"] = chapter_meta["title"]
    test_data["released_on"] = today_str
    test_data["question_count"] = len(test_data.get("questions", []))
    return test_data


def send_notification_email(generated_chapters: list, today_str: str):
    if not GMAIL_APP_PASSWORD:
        print("GMAIL_APP_PASSWORD not set; skipping SMTP email send.")
        return

    chap_nums = " & ".join(str(c["chapter"]) for c in generated_chapters)
    subject = f"[Clean Architecture] Chapters {chap_nums} Tests Are Live (60 Questions Ready)"

    cards_html = ""
    for c in generated_chapters:
        deep_link = f"{PAGES_BASE_URL}/#chapter={c['chapter']}"
        cards_html += f"""
        <div style="padding:20px;border:1px solid #d5dcde;border-radius:16px;margin-bottom:14px;background:#ffffff;">
          <div style="font-size:12px;font-weight:700;color:#005c6e;text-transform:uppercase;letter-spacing:0.06em;">
            {c['part']} · Chapter {c['chapter']}
          </div>
          <h2 style="margin:6px 0 8px;font-size:19px;color:#191c1d;">
            Chapter {c['chapter']}: {c['title']}
          </h2>
          <p style="margin:0 0 16px;font-size:14px;color:#4f585b;line-height:1.5;">
            {c.get('subtitle', '30 interactive questions across 11 formats.')}
          </p>
          <a href="{deep_link}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#005c6e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
            Launch Chapter {c['chapter']} Test (30 Questions) →
          </a>
        </div>
        """

    html_body = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:28px 20px;background:#fbfbfa;color:#191c1d;">
      <p style="font-size:12px;font-weight:700;color:#005c6e;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">
        Daily Architectural Drill · {today_str}
      </p>
      <h1 style="font-size:24px;margin:0 0 12px;letter-spacing:-0.02em;">
        Good morning! Your 2 new Clean Architecture tests are live.
      </h1>
      <p style="font-size:15px;color:#4f585b;line-height:1.6;margin:0 0 22px;">
        Chapters {chap_nums} have been read, parsed into 60 interactive questions (Diagnostic MCQs with per-option explanations, JavaScript code labs, causal puzzles, and Gemini AI own-words prompts), and deployed to GitHub Pages ahead of your <strong>9:00 a.m. WAT</strong> study block.
      </p>
      {cards_html}
      <p style="font-size:13px;color:#70787b;margin-top:24px;">
        Platform Home: <a href="{PAGES_BASE_URL}" style="color:#005c6e;">{PAGES_BASE_URL}</a>
      </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Clean Architecture Coach <{GMAIL_USER}>"
    msg["To"] = GMAIL_TO
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, [GMAIL_TO], msg.as_string())

    print(f"Sent daily email notification for Chapters {chap_nums} to {GMAIL_TO}")


def main():
    with open(CHAPTERS_MANIFEST_PATH, "r", encoding="utf-8") as f:
        chapters_manifest = json.load(f)

    with open(TESTS_MANIFEST_PATH, "r", encoding="utf-8") as f:
        tests_manifest = json.load(f)

    existing_nums = {t["chapter"] for t in tests_manifest.get("available_tests", [])}

    # Optional CLI override: `--notify-only 1 2` to email already-generated chapters
    if len(sys.argv) >= 2 and sys.argv[1] == "--notify-only":
        target_nums = [int(x) for x in sys.argv[2:]] or [1, 2]
        selected = [
            t for t in tests_manifest.get("available_tests", []) if t["chapter"] in target_nums
        ]
        today_str = datetime.date.today().isoformat()
        send_notification_email(selected, today_str)
        return

    pending = [
        c for c in chapters_manifest["chapters"] if c["chapter"] not in existing_nums
    ]

    if not pending:
        print("All 34 chapters already have generated tests! Nothing left to generate.")
        return

    next_two = pending[:2]
    today_str = datetime.date.today().isoformat()
    newly_added = []

    os.makedirs(TESTS_DIR, exist_ok=True)

    for chap_meta in next_two:
        c_num = chap_meta["chapter"]
        md_path = os.path.join(ROOT_DIR, chap_meta["file"])
        with open(md_path, "r", encoding="utf-8") as f:
            chapter_text = f.read()

        print(f"Generating 30-question test for Chapter {c_num}: {chap_meta['title']}...")
        test_obj = call_gemini_for_chapter(chap_meta, chapter_text, today_str)

        out_rel = f"data/tests/chapter-{c_num:02d}.json"
        out_abs = os.path.join(ROOT_DIR, out_rel)
        with open(out_abs, "w", encoding="utf-8") as f:
            json.dump(test_obj, f, indent=2, ensure_ascii=False)

        meta_entry = {
            "chapter": c_num,
            "part": test_obj["part"],
            "title": test_obj["title"],
            "subtitle": test_obj.get("subtitle", ""),
            "file": out_rel,
            "question_count": test_obj["question_count"],
            "released_on": today_str,
        }
        tests_manifest["available_tests"].append(meta_entry)
        tests_manifest["last_generated_chapter"] = max(
            tests_manifest.get("last_generated_chapter", 0), c_num
        )
        newly_added.append(meta_entry)

    tests_manifest["available_tests"].sort(key=lambda x: x["chapter"])
    tests_manifest["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    with open(TESTS_MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(tests_manifest, f, indent=2, ensure_ascii=False)

    send_notification_email(newly_added, today_str)


if __name__ == "__main__":
    main()
