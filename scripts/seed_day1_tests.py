#!/usr/bin/env python3
"""Builds Day 1 tests (Chapters 1 & 2, 30 deep-drilling questions each) and tests_manifest.json."""

import json
import os

DATA_DIR = "/home/antigravity/clean-architecture-mastery/data"
TESTS_DIR = os.path.join(DATA_DIR, "tests")
true = True
false = False


def build_chapter_01():
    questions = [
        # 1. mcq_single
        {
            "id": "ch1-q01",
            "type": "mcq_single",
            "bloom": "Conceptual Distinction",
            "prompt": "How does Robert C. Martin resolve the long-standing industry distinction between 'software architecture' and 'software design'?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "There is no difference between them at all; high-level structure and low-level details form a single continuous fabric of decisions.",
                    "explanation": "Correct! Martin asserts there is zero difference between architecture and design—just like a home's blueprints include both exterior elevations and the exact wiring of every light switch and sump pump."
                },
                {
                    "text": "Architecture defines the deployment and service boundaries, while design only begins inside individual classes and functions.",
                    "explanation": "Incorrect. Martin explicitly calls the separation of high-level structure from low-level code details 'nonsensical' because low-level decisions directly support and enable high-level structure."
                },
                {
                    "text": "Architecture consists of irreversible upfront decisions, whereas design consists of reversible daily refactoring decisions.",
                    "explanation": "Incorrect. While other authors use that heuristic, in Chapter 1 Martin explicitly rejects any dividing line between architecture and design, defining them as an unbroken continuum."
                },
                {
                    "text": "Design applies to user experience and API ergonomics, whereas architecture applies strictly to performance and scalability.",
                    "explanation": "Incorrect. Software architecture and design in this book refer to the internal structure of the software system from the highest component boundary down to the lowest lines of code."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Architecture and design are identical: low-level details and high-level decisions are inseparable parts of a single whole."
        },
        # 2. cloze_bank
        {
            "id": "ch1-q02",
            "type": "cloze_bank",
            "bloom": "Core Definition",
            "prompt": "Complete Robert C. Martin's foundational definition of the goal of software architecture:",
            "instruction": "Click a blank slot and choose the matching term from the word bank below.",
            "template": "The goal of software architecture is to {{1}} the {{2}} required to {{3}} and {{4}} the required system.",
            "blanks": [
                {"answer": "minimize"},
                {"answer": "human resources"},
                {"answer": "build"},
                {"answer": "maintain"}
            ],
            "word_bank": [
                "minimize",
                "maximize",
                "human resources",
                "cloud compute",
                "build",
                "maintain",
                "automate",
                "document"
            ],
            "overall_explanation": "Architecture is measured economically by human effort: minimizing the human resources required to build and maintain the system across its lifetime."
        },
        # 3. mcq_single
        {
            "id": "ch1-q03",
            "type": "mcq_single",
            "bloom": "Quantitative Evaluation",
            "prompt": "According to Chapter 1, what is the single objective measure of software design quality?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "The level of effort required to meet the needs of the customer across successive releases.",
                    "explanation": "Correct! If the effort stays low throughout the system's lifetime, the design is good; if the effort grows with each new release, the design is bad."
                },
                {
                    "text": "The percentage of classes that adhere to formal UML architectural diagrams and design patterns.",
                    "explanation": "Incorrect. Diagrams and patterns are tools, not the measure of quality. A pattern-heavy codebase that takes 10x more effort per release has a bad design."
                },
                {
                    "text": "The runtime throughput, memory footprint, and benchmark speed of the production executable.",
                    "explanation": "Incorrect. Machine efficiency is separate from architectural quality; a blazing-fast program that costs $20M a month to add a minor feature has a terrible architecture."
                },
                {
                    "text": "The total number of lines of code produced per developer per month.",
                    "explanation": "Incorrect. Lines of code alone can be inflated by duplication; the true measure is how little effort is required to satisfy customer needs over time."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Design quality is strictly inversely proportional to the ongoing human effort needed to fulfill customer requirements."
        },
        # 4. match_pairs
        {
            "id": "ch1-q04",
            "type": "match_pairs",
            "bloom": "Empirical Case Study Analysis",
            "prompt": "Match each empirical chart from the Chapter 1 anonymous corporate case study (Releases 1 through 8) to what its curve actually revealed:",
            "instruction": "Click an item on the left, then click its corresponding empirical trend on the right.",
            "pairs": [
                {
                    "left": "Figure 1.1: Engineering Staff Growth",
                    "right": "Surged exponentially from a small team to a huge headcount, creating a false impression of runaway success"
                },
                {
                    "left": "Figure 1.2: Total Lines of Code Over Time",
                    "right": "Flattened toward a horizontal asymptote despite more developers being thrown at every release"
                },
                {
                    "left": "Figure 1.3: Cost per Line of Code",
                    "right": "Exploded roughly 40x higher in Release 8 compared to Release 1"
                },
                {
                    "left": "Figure 1.4: Developer Productivity per Release",
                    "right": "Started near 100% in Release 1 and decayed asymptotically toward 0% by Release 4+"
                },
                {
                    "left": "Figure 1.5: Monthly Development Payroll",
                    "right": "Climbed from a few hundred thousand dollars in Release 1 to $20 million/month by Release 8 for almost zero new output"
                }
            ],
            "right_order": [2, 0, 4, 1, 3],
            "overall_explanation": "Together, Figures 1.1–1.5 reveal the 'Signature of a Mess': skyrocketing headcount and $20M monthly payroll yielding near-zero new functionality."
        },
        # 5. cloze_typed
        {
            "id": "ch1-q05",
            "type": "cloze_typed",
            "bloom": "Empirical Recall",
            "prompt": "Fill in the exact quantitative figures from the Chapter 1 corporate case study:",
            "instruction": "Type the number or phrase in each blank.",
            "template": "In the Chapter 1 case study, producing a line of code in Release 8 was {{1}} times more expensive than in Release 1, and by Release 8 the monthly development payroll had reached ${{2}} million.",
            "blanks": [
                {"answer": "40", "accepted": ["40", "forty", "40x"], "placeholder": "multiplier"},
                {"answer": "20", "accepted": ["20", "twenty", "20m"], "placeholder": "millions"}
            ],
            "overall_explanation": "By Release 8, cost per line of code had multiplied 40x and monthly development payroll hit $20 million while code growth plateaued."
        },
        # 6. order_steps
        {
            "id": "ch1-q06",
            "type": "order_steps",
            "bloom": "Causal Mechanism Tracing",
            "prompt": "Arrange the causal chain that produces 'The Signature of a Mess' in exact chronological order:",
            "instruction": "Drag rows or use the ↑ / ↓ buttons to order the steps from initial shortcut (1) to financial stall (5).",
            "items": [
                "Developers rush code to market with little thought for cleanliness, believing 'we can clean it up later'.",
                "Market success attracts a horde of competitors, forcing the team to run even faster on the next feature instead of switching modes to clean up.",
                "The accumulating mess diverts developer effort away from building features toward merely shifting the mess from one place to another.",
                "Executive leadership responds to slowing delivery by hiring dramatically more engineers, driving monthly payroll into the tens of millions.",
                "Per-developer productivity approaches a zero asymptote and cost per line of code explodes 40x, draining profit and threatening business collapse."
            ],
            "initial_order": [2, 0, 4, 1, 3],
            "correct_order": [0, 1, 2, 3, 4],
            "overall_explanation": "Market pressure never abates after launch; the team never gets a 'later' to clean up, so effort shifts from feature delivery to mess management."
        },
        # 7. claim_audit
        {
            "id": "ch1-q07",
            "type": "claim_audit",
            "bloom": "Critical Fallacy Audit",
            "prompt": "Audit this common engineering justification against the empirical findings in Chapter 1:",
            "instruction": "Select the verdict and defend your reasoning in your own words.",
            "claim": "Writing messy code helps us move faster in the short term to beat competitors to market; the only downside is that it slows us down in the long term.",
            "verdict_options": [
                "Architecturally Sound",
                "Dangerous Fallacy",
                "True Only for Prototypes Under 1 Week"
            ],
            "correct_verdict": "Dangerous Fallacy",
            "key_concepts": [
                "Making messes is always slower than staying clean on every time scale",
                "Jason Gorman's 6-day Roman numerals TDD experiment (<30 minutes per iteration)",
                "TDD days were ~10% faster and even the slowest TDD day beat the fastest non-TDD day"
            ],
            "model_answer": "Martin calls this the 'bigger lie'. It is an error of fact: making messes is always slower than staying clean on ANY time scale, even under 30 minutes. Jason Gorman's 6-day Roman numeral experiment proved that disciplined TDD iterations were ~10% faster than non-TDD iterations, and even the slowest TDD day was faster than the fastest non-TDD day.",
            "overall_explanation": "Making messes does not even buy short-term speed; even on sub-30-minute tasks, cleanliness disciplines (like TDD) finish faster."
        },
        # 8. mcq_single
        {
            "id": "ch1-q08",
            "type": "mcq_single",
            "bloom": "Experimental Evidence Analysis",
            "prompt": "What did Jason Gorman's 6-day Roman Numeral conversion experiment specifically demonstrate about cleanliness disciplines (TDD vs. non-TDD)?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Even on a task taking under 30 minutes, TDD days were ~10% faster on average, and the slowest TDD day was faster than the fastest non-TDD day.",
                    "explanation": "Correct! Even after accounting for the 6-day learning curve, TDD on days 1, 3, and 5 outperformed non-TDD on days 2, 4, and 6 across the board."
                },
                {
                    "text": "Non-TDD was faster on Day 1 and Day 2, but TDD overtook non-TDD by Day 5 once the codebase exceeded 5,000 lines.",
                    "explanation": "Incorrect. Each day was a fresh, independent sub-30-minute implementation of Roman numeral conversion, not a growing multi-day codebase—and TDD was faster right away."
                },
                {
                    "text": "TDD and non-TDD took the exact same completion time, but TDD produced 80% fewer production defects.",
                    "explanation": "Incorrect. In Gorman's experiment, completion was only recorded once all predefined acceptance tests passed, and TDD finished ~10% faster."
                },
                {
                    "text": "Developers without TDD wrote 40 times more lines of code to pass the same acceptance test suite.",
                    "explanation": "Incorrect. The 40x cost multiplier came from the 8-release corporate case study (Figure 1.3), not Jason Gorman's 6-day Roman numeral experiment."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Gorman's experiment falsifies the myth that 'dirty code is faster in the short term'—even on a 30-minute micro-task, clean discipline wins."
        },
        # 9. classify_buckets
        {
            "id": "ch1-q09",
            "type": "classify_buckets",
            "bloom": "Psychological Diagnosis",
            "prompt": "In Chapter 1's Aesop analogy, classify each behavior or belief into either 'The Overconfident Hare' or 'The Disciplined Tortoise':",
            "instruction": "Click an item card, then click the bucket it belongs in.",
            "buckets": [
                "The Overconfident Hare",
                "The Disciplined Tortoise"
            ],
            "items": [
                {
                    "text": "'We can clean up the architecture later; we just have to ship to market first!'",
                    "bucket": "The Overconfident Hare"
                },
                {
                    "text": "'The only way to go fast, is to go well.'",
                    "bucket": "The Disciplined Tortoise"
                },
                {
                    "text": "'This codebase is unsalvageable—let's scrap it and redesign the whole system from scratch!'",
                    "bucket": "The Overconfident Hare"
                },
                {
                    "text": "Applying test-driven cleanliness discipline even on a 25-minute coding task.",
                    "bucket": "The Disciplined Tortoise"
                },
                {
                    "text": "Working heroic overtime while letting the part of the brain that cares about clean structure sleep.",
                    "bucket": "The Overconfident Hare"
                },
                {
                    "text": "Taking direct responsibility for reversing the mess inside the existing system rather than blaming legacy code.",
                    "bucket": "The Disciplined Tortoise"
                }
            ],
            "overall_explanation": "Notice that demanding a 'greenfield rewrite from scratch' is ALSO the overconfident Hare talking—the same habits will drive the rewrite into the exact same mess."
        },
        # 10. spot_flaw
        {
            "id": "ch1-q10",
            "type": "spot_flaw",
            "bloom": "JavaScript Code Smell Diagnosis",
            "prose_mode": false,
            "prompt": "This JavaScript checkout service exhibits the 'low-level mess that paralyzes high-level feature delivery' described in Chapter 1. Click the TWO lines where low-level infrastructure details (SQL & HTTP) are welded directly into business pricing rules:",
            "instruction": "Click the 2 flawed lines in the snippet below, then click Check Answer.",
            "lines": [
                {
                    "text": "async function processOrder(cart, customerId) {",
                    "explanation": "Function signature is clean."
                },
                {
                    "text": "  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);",
                    "explanation": "Pure domain arithmetic—no coupling flaw here."
                },
                {
                    "text": "  const row = await global.pgPool.query(`SELECT tier FROM users WHERE id = '${customerId}'`);",
                    "explanation": "FLAW 1: Direct global PostgreSQL query and raw string interpolation embedded straight inside the order policy."
                },
                {
                    "text": "  const discount = row.rows[0]?.tier === 'VIP' ? subtotal * 0.15 : 0;",
                    "explanation": "Domain discount rule itself is fine once tier data is provided via an abstraction."
                },
                {
                    "text": "  await fetch('https://api.stripe.com/v1/charges', { method: 'POST', body: String(subtotal - discount) });",
                    "explanation": "FLAW 2: Hardcoded third-party payment HTTP call inside core calculation logic makes unit testing and modification expensive."
                },
                {
                    "text": "  return { total: subtotal - discount };",
                    "explanation": "Return statement is clean."
                },
                {
                    "text": "}",
                    "explanation": "Closing brace."
                }
            ],
            "flawed_indices": [2, 4],
            "overall_explanation": "Low-level details and high-level structure form one fabric. Welding raw SQL and direct Stripe HTTP calls into core pricing logic forces every future change to untangle infrastructure from policy."
        },
        # 11. mcq_multi
        {
            "id": "ch1-q11",
            "type": "mcq_multi",
            "bloom": "Multi-Factor Diagnosis",
            "prompt": "Why does the promise 'We'll clean up the code after we ship v1 to market' almost always fail in the real world? (Select ALL that apply)",
            "instruction": "Select all correct options, then click Check Answer.",
            "options": [
                {
                    "text": "Market pressures never abate; beating competitors to market just puts a horde of competitors on your tail demanding the next feature immediately.",
                    "explanation": "Correct! Once you launch, competitive pressure intensifies rather than disappearing."
                },
                {
                    "text": "Developers never actually switch modes because there is always another urgent feature queued after the current one.",
                    "explanation": "Correct! Without a continuous discipline of cleanliness, the team stays locked in 'feature rush' mode forever."
                },
                {
                    "text": "The creeping mess of code never sleeps or relents, actively compounding the friction of every subsequent change.",
                    "explanation": "Correct! Existing coupling multiplies the effort required for each new addition, eroding capacity to refactor."
                },
                {
                    "text": "Compilers and JavaScript engines automatically degrade the execution speed of older files after 6 months.",
                    "explanation": "Incorrect. The slowdown is in human developer productivity caused by tangled design structure, not V8 runtime aging."
                }
            ],
            "correct_indices": [0, 1, 2],
            "overall_explanation": "Market pressure is permanent, mode-switching is a myth, and structural rot compounds on every release."
        },
        # 12. free_response
        {
            "id": "ch1-q12",
            "type": "free_response",
            "bloom": "Feynman Synthesis",
            "prompt": "Using Robert C. Martin's 'Home Architect' analogy from Chapter 1, explain in your own words why separating 'high-level software architecture' from 'low-level code design' is a false dichotomy.",
            "instruction": "Write 3–5 sentences in your own words. Click Check Answer for AI evaluation.",
            "placeholder": "Compare a house architect's blueprints (elevations + outlets/switches/sump pump) to software...",
            "key_concepts": [
                "A real home architect produces both high-level shapes/elevations and immense low-level details (outlets, light switches, furnace, sump pump)",
                "Low-level details support high-level decisions and form a single continuous fabric",
                "No clear dividing line separates architecture from design; there is a continuum of decisions from highest to lowest"
            ],
            "model_answer": "When a real architect designs a home, they don't just draw the exterior shape and room layout; their blueprints also specify every outlet, which switch controls which light, and where the furnace and sump pump sit. Those low-level details directly support the high-level decisions and are part of one unified whole. Similarly, in software, high-level structure and low-level code details form a single continuous fabric with no dividing line—just a continuum of decisions.",
            "overall_explanation": "High-level decisions and low-level code details form a continuous fabric; corrupting the low-level details eventually collapses the high-level structure."
        },
        # 13. js_code
        {
            "id": "ch1-q13",
            "type": "js_code",
            "bloom": "Algorithmic Modeling in JavaScript",
            "prompt": "Implement `analyzeReleaseHealth(releases)` in JavaScript to detect Chapter 1's 'Signature of a Mess' from engineering release telemetry.",
            "instruction": "Given an array of release objects `{ release, staff, totalKloc, payroll }`, return `{ costPerKlocMultiplier, marginalOutputRatio, isSignatureOfMess }` where:\n- `costPerKlocMultiplier`: `(lastMarginalCostPerKloc / firstMarginalCostPerKloc)` rounded to 1 decimal place (marginal KLOC for release 0 is `releases[0].totalKloc`; for release `i` is `releases[i].totalKloc - releases[i-1].totalKloc`; marginal cost per KLOC is `payroll / marginalKloc`).\n- `marginalOutputRatio`: `Number((lastMarginalKloc / firstMarginalKloc).toFixed(2))`\n- `isSignatureOfMess`: `true` if `costPerKlocMultiplier >= 10` and `marginalOutputRatio <= 0.25`, else `false`.",
            "starter_code": "function analyzeReleaseHealth(releases) {\n  const first = releases[0];\n  const prev = releases[releases.length - 2];\n  const last = releases[releases.length - 1];\n\n  // Compute marginal KLOC and cost per KLOC for first vs. last release\n  \n}",
            "test_cases": [
                {
                    "label": "Chapter 1 Case Study (Release 1 vs Release 8: 40x cost explosion)",
                    "call": "analyzeReleaseHealth([{ release: 1, staff: 10, totalKloc: 50, payroll: 500000 }, { release: 7, staff: 180, totalKloc: 190, payroll: 16000000 }, { release: 8, staff: 200, totalKloc: 200, payroll: 20000000 }])",
                    "expected": {"costPerKlocMultiplier": 200, "marginalOutputRatio": 0.2, "isSignatureOfMess": true}
                },
                {
                    "label": "Clean Architecture Team (Steady linear output and stable cost)",
                    "call": "analyzeReleaseHealth([{ release: 1, staff: 12, totalKloc: 40, payroll: 400000 }, { release: 2, staff: 12, totalKloc: 80, payroll: 400000 }, { release: 3, staff: 12, totalKloc: 120, payroll: 440000 }])",
                    "expected": {"costPerKlocMultiplier": 1.1, "marginalOutputRatio": 1, "isSignatureOfMess": false}
                }
            ],
            "model_answer": "function analyzeReleaseHealth(releases) {\n  const first = releases[0];\n  const prev = releases[releases.length - 2];\n  const last = releases[releases.length - 1];\n  const firstMarginalKloc = first.totalKloc;\n  const lastMarginalKloc = last.totalKloc - prev.totalKloc;\n  const firstCostPerKloc = first.payroll / firstMarginalKloc;\n  const lastCostPerKloc = last.payroll / lastMarginalKloc;\n  const costPerKlocMultiplier = Number((lastCostPerKloc / firstCostPerKloc).toFixed(1));\n  const marginalOutputRatio = Number((lastMarginalKloc / firstMarginalKloc).toFixed(2));\n  return {\n    costPerKlocMultiplier,\n    marginalOutputRatio,\n    isSignatureOfMess: costPerKlocMultiplier >= 10 && marginalOutputRatio <= 0.25\n  };\n}",
            "overall_explanation": "When marginal KLOC shrinks while payroll balloons, the marginal cost per line of code explodes—the unmistakable quantitative signature of architectural decay."
        },
        # 14. mcq_single
        {
            "id": "ch1-q14",
            "type": "mcq_single",
            "bloom": "Failure Mode Prediction",
            "prompt": "Why does Robert C. Martin warn against scrapping a messy legacy system and redesigning it from scratch?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "The demand for a full rewrite is driven by the same Hare-like overconfidence that created the original mess, and will lead the new project into the exact same mess.",
                    "explanation": "Correct! Without changing the underlying engineering habits and overconfidence, the team simply repeats the race and recreates the mess."
                },
                {
                    "text": "Modern cloud compilers can automatically refactor legacy code faster than humans can rewrite it.",
                    "explanation": "Incorrect. No tool automatically fixes architectural tangles; humans must adopt clean architecture discipline."
                },
                {
                    "text": "Rewriting from scratch is legally prohibited by most enterprise SLA contracts.",
                    "explanation": "Incorrect. Martin's argument is behavioral and architectural, not legal."
                },
                {
                    "text": "A rewrite is always recommended once cost per line of code exceeds 5x Release 1.",
                    "explanation": "Incorrect. Martin explicitly states that in every case, the best option is for the organization to recognize its overconfidence and take architecture seriously rather than falling for the rewrite mirage."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Believing 'we'll build it right if we just start over from scratch' is the Hare talking again."
        },
        # 15. spot_flaw
        {
            "id": "ch1-q15",
            "type": "spot_flaw",
            "bloom": "Executive Diagnosis",
            "prose_mode": true,
            "prompt": "A VP of Engineering writes a 5-point post-mortem on why their Release 8 velocity collapsed. Click the ONE statement that contradicts Chapter 1's analysis:",
            "instruction": "Click the flawed statement below, then click Check Answer.",
            "lines": [
                {
                    "text": "1. Our monthly engineering payroll grew from a few hundred thousand dollars in Release 1 to $20M in Release 8, while new code output plateaued.",
                    "explanation": "Accurately reflects Figures 1.2 and 1.5."
                },
                {
                    "text": "2. The root cause of the Release 8 collapse is that our developers became lazy, stopped working overtime, and reduced their personal effort after Release 3.",
                    "explanation": "FLAW: Chapter 1 explicitly notes that developers are working their butts off with heroics, dedication, and overtime—their effort hasn't dropped, it's just consumed by moving the mess around."
                },
                {
                    "text": "3. Our developers fell for the overconfident belief that they could rush messy code out first and switch modes to clean it up later.",
                    "explanation": "Accurately captures the Aesop Hare analogy in Chapter 1."
                },
                {
                    "text": "4. Almost all engineering capacity is now spent shifting the existing mess from one place to the next just to squeeze in one meager feature.",
                    "explanation": "Accurately reflects the developer frustration described on Figure 1.4."
                }
            ],
            "flawed_indices": [1],
            "overall_explanation": "Developers in a decaying architecture are rarely lazy—they work exhausting hours, but their energy is swallowed by managing the mess."
        },
        # 16. mcq_single
        {
            "id": "ch1-q16",
            "type": "mcq_single",
            "bloom": "Scenario Application",
            "prompt": "A startup CTO tells the team: 'We only have 3 weeks to ship MVP. Skip unit tests and clean boundaries for now—messy code is faster over a 3-week sprint, and we will refactor in Month 2.' How does Chapter 1 refute this?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Even within a 30-minute window (let alone 3 weeks), skipping cleanliness disciplines slows you down; making messes is slower than staying clean on every time scale.",
                    "explanation": "Correct! Jason Gorman's experiment showed cleanliness discipline wins even under 30 minutes, so over 3 weeks a messy codebase is already dragging velocity down."
                },
                {
                    "text": "The CTO is right about Month 1 being faster, provided the team freezes all feature work for 30 days in Month 2.",
                    "explanation": "Incorrect. Martin calls the idea that messy code is faster in the short term 'a simple error of fact', and notes market pressures will never allow a Month 2 feature freeze."
                },
                {
                    "text": "Clean architecture only begins to pay off after Release 4 when headcount exceeds 50 engineers.",
                    "explanation": "Incorrect. By Release 4 in Figure 1.4, productivity had already collapsed toward zero because of the mess made in Releases 1–3."
                },
                {
                    "text": "Skipping boundaries is fine in JavaScript because dynamic typing prevents structural coupling.",
                    "explanation": "Incorrect. Dynamic languages suffer from tangled dependencies and mess just as severely as statically typed languages."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "There is no short-term speed boost from writing messy code—not over 3 weeks, and not even over 30 minutes."
        },
        # 17. cloze_bank
        {
            "id": "ch1-q17",
            "type": "cloze_bank",
            "bloom": "Conceptual Precision",
            "prompt": "Complete the passage describing what happens to developer effort inside a decaying codebase:",
            "instruction": "Click each blank and choose the right phrase from the word bank.",
            "template": "Despite all their heroics, overtime, and dedication, developers aren't getting much done anymore because all their effort has been diverted away from {{1}} and is now consumed with {{2}}—moving it from one place to the next just to add one {{3}}.",
            "blanks": [
                {"answer": "features"},
                {"answer": "managing the mess"},
                {"answer": "meager little feature"}
            ],
            "word_bank": [
                "features",
                "managing the mess",
                "meager little feature",
                "compiler upgrades",
                "cloud migrations",
                "major architectural rewrite"
            ],
            "overall_explanation": "As architecture decays, developer effort is hijacked from feature creation into endlessly rearranging the mess."
        },
        # 18. free_response
        {
            "id": "ch1-q18",
            "type": "free_response",
            "bloom": "Executive Communication",
            "prompt": "Imagine you are presenting Figures 1.2 (Lines of Code per Release) and 1.5 (Monthly Payroll per Release) to a CFO. Explain in your own words what the contrast between these two curves means for the business.",
            "instruction": "Write 3–4 sentences in your own words. Click Check Answer for AI evaluation.",
            "placeholder": "Compare what the initial few hundred thousand dollars bought versus what the final $20 million bought...",
            "key_concepts": [
                "Release 1 cost a few hundred thousand dollars/month and delivered substantial functionality",
                "By Release 8, monthly payroll reached $20 million but delivered almost zero new code/functionality",
                "The trend is unsustainable and will catastrophically drain profit and drive the company into a stall or collapse"
            ],
            "model_answer": "In Release 1, a monthly payroll of a few hundred thousand dollars bought a large surge of product functionality. By Release 8, monthly payroll had ballooned to $20 million per month, yet the lines-of-code curve flattened out, meaning $20 million bought almost nothing. No matter how profitable the business looks today, a 40x explosion in cost per line of code will catastrophically drain profits and stall or collapse the company.",
            "overall_explanation": "Comparing Figure 1.2 and Figure 1.5 exposes the existential financial threat of bad software architecture."
        },
        # 19. js_code
        {
            "id": "ch1-q19",
            "type": "js_code",
            "bloom": "Experimental Data Verification in JavaScript",
            "prompt": "Write a JavaScript function `verifyGormanExperiment(runs)` that analyzes Jason Gorman's 6-day Roman Numeral TDD experiment data.",
            "instruction": "Given `runs` — an array of `{ day, usedTdd, minutes }` — return an object `{ avgTddMinutes, avgNonTddMinutes, percentFaster, slowestTddBeatFastestNonTdd }` where:\n- `avgTddMinutes`: average minutes for `usedTdd === true` rounded to 1 decimal place\n- `avgNonTddMinutes`: average minutes for `usedTdd === false` rounded to 1 decimal place\n- `percentFaster`: `Math.round(((avgNonTddMinutes - avgTddMinutes) / avgNonTddMinutes) * 100)`\n- `slowestTddBeatFastestNonTdd`: boolean (`max(tdd.minutes) < min(nonTdd.minutes)`)",
            "starter_code": "function verifyGormanExperiment(runs) {\n  const tdd = runs.filter(r => r.usedTdd);\n  const nonTdd = runs.filter(r => !r.usedTdd);\n  // Compute averages, percentFaster, and slowestTddBeatFastestNonTdd\n  \n}",
            "test_cases": [
                {
                    "label": "Gorman 6-Day Roman Numeral Dataset (Days 1,3,5 TDD vs Days 2,4,6 non-TDD)",
                    "call": "verifyGormanExperiment([{ day: 1, usedTdd: true, minutes: 24.5 }, { day: 2, usedTdd: false, minutes: 28.0 }, { day: 3, usedTdd: true, minutes: 22.0 }, { day: 4, usedTdd: false, minutes: 25.5 }, { day: 5, usedTdd: true, minutes: 19.5 }, { day: 6, usedTdd: false, minutes: 25.1 }])",
                    "expected": {"avgTddMinutes": 22, "avgNonTddMinutes": 26.2, "percentFaster": 16, "slowestTddBeatFastestNonTdd": true}
                },
                {
                    "label": "Mixed Dataset where slowest TDD does not beat fastest non-TDD",
                    "call": "verifyGormanExperiment([{ day: 1, usedTdd: true, minutes: 26 }, { day: 2, usedTdd: false, minutes: 28 }, { day: 3, usedTdd: true, minutes: 20 }, { day: 4, usedTdd: false, minutes: 24 }])",
                    "expected": {"avgTddMinutes": 23, "avgNonTddMinutes": 26, "percentFaster": 12, "slowestTddBeatFastestNonTdd": false}
                }
            ],
            "model_answer": "function verifyGormanExperiment(runs) {\n  const tdd = runs.filter(r => r.usedTdd).map(r => r.minutes);\n  const nonTdd = runs.filter(r => !r.usedTdd).map(r => r.minutes);\n  const avgTddMinutes = Number((tdd.reduce((a, b) => a + b, 0) / tdd.length).toFixed(1));\n  const avgNonTddMinutes = Number((nonTdd.reduce((a, b) => a + b, 0) / nonTdd.length).toFixed(1));\n  const percentFaster = Math.round(((avgNonTddMinutes - avgTddMinutes) / avgNonTddMinutes) * 100);\n  const slowestTddBeatFastestNonTdd = Math.max(...tdd) < Math.min(...nonTdd);\n  return { avgTddMinutes, avgNonTddMinutes, percentFaster, slowestTddBeatFastestNonTdd };\n}",
            "overall_explanation": "Gorman's dataset showed not only an average speed advantage for TDD, but also that the single slowest TDD run still beat the single fastest non-TDD run."
        },
        # 20. mcq_single
        {
            "id": "ch1-q20",
            "type": "mcq_single",
            "bloom": "Analogical Reasoning",
            "prompt": "In Chapter 1's discussion of Aesop's Tortoise and the Hare, how do modern developers differ from the literal Hare in the fable while still sharing its fatal flaw?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Modern developers do not physically nap—they work their butts off—but the part of their brain that knows clean, well-designed code matters goes to sleep.",
                    "explanation": "Correct! Developers work intensely hard physically, yet put their architectural judgment to sleep out of overconfidence in their raw coding speed."
                },
                {
                    "text": "Modern developers take long vacations after Release 1, allowing competitors to overtake them.",
                    "explanation": "Incorrect. Martin stresses that developers do NOT rest or slack off—they work overtime while their codebase degrades."
                },
                {
                    "text": "Modern developers write too many unit tests early on, which causes them to nap during deployment.",
                    "explanation": "Incorrect. The flaw is neglecting cleanliness and testing discipline, not over-investing in it."
                },
                {
                    "text": "Modern developers lack intrinsic coding speed and therefore cannot compete without hiring 10x more staff.",
                    "explanation": "Incorrect. Like the Hare, developers have plenty of intrinsic speed initially (near 100% productivity in Release 1), which breeds their overconfidence."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "The developer's 'nap' is mental, not physical: putting architectural discipline to sleep while sprinting on raw feature code."
        },
        # 21. claim_audit
        {
            "id": "ch1-q21",
            "type": "claim_audit",
            "bloom": "Architectural Continuity Audit",
            "prompt": "Audit this statement made by a Principal Systems Architect during a design review:",
            "instruction": "Select the verdict and explain why in your own words.",
            "claim": "As the software architect, my job ends once I draw the top-level service boxes and message queues; how developers organize functions, variables, and modules inside each service is mere low-level design and cannot affect the architecture.",
            "verdict_options": [
                "Architecturally Sound",
                "Dangerous Fallacy",
                "True in Microservice Architectures"
            ],
            "correct_verdict": "Dangerous Fallacy",
            "key_concepts": [
                "Low-level details and high-level structure are part of the same continuous fabric",
                "You cannot have high-level architecture without supporting low-level details",
                "A mess inside low-level code will still drive developer productivity toward zero and skyrocket release costs"
            ],
            "model_answer": "This is a dangerous fallacy. Chapter 1 establishes that high-level decisions and low-level details form a single continuous fabric with no dividing line. Just as a house blueprint fails if the low-level wiring, plumbing, and foundation details are botched, high-level service boxes cannot save a system whose internal low-level code turns into a productivity-destroying mess.",
            "overall_explanation": "Low-level details support high-level decisions; there is no boundary where 'architecture' stops and 'mere design' begins."
        },
        # 22. order_steps
        {
            "id": "ch1-q22",
            "type": "order_steps",
            "bloom": "Continuum Hierarchy",
            "prompt": "Chapter 1 describes architecture/design as an unbroken continuum from highest-level system shape down to lowest-level details. Order these software decisions from HIGHEST level (1) to LOWEST level (4):",
            "instruction": "Drag or use ↑ / ↓ arrows to sort from macro structure (1) to micro detail (4).",
            "items": [
                "Separating core business rules from external delivery mechanisms (Web UI, CLI) and persistence (SQL/NoSQL).",
                "Defining component boundaries and dependency directions between the Ordering, Billing, and Inventory modules.",
                "Designing the interface contract and polymorphic dispatch for a `PaymentGateway` abstraction inside the Billing module.",
                "Choosing immutable local constants and pure helper expressions inside a single JavaScript `calculateLineTax()` function."
            ],
            "initial_order": [2, 0, 3, 1],
            "correct_order": [0, 1, 2, 3],
            "overall_explanation": "From system-wide boundary separation down to a single JavaScript function's internal structure, every level is part of the same architectural continuum."
        },
        # 23. mcq_multi
        {
            "id": "ch1-q23",
            "type": "mcq_multi",
            "bloom": "Symptom Recognition",
            "prompt": "Which of the following metrics from the Chapter 1 case study increased between Release 1 and Release 8? (Select ALL that apply)",
            "instruction": "Select all correct options, then click Check Answer.",
            "options": [
                {
                    "text": "Total number of engineering staff",
                    "explanation": "Correct! Figure 1.1 shows dramatic growth in the engineering staff across every release."
                },
                {
                    "text": "Cost per line of code",
                    "explanation": "Correct! Figure 1.3 shows cost per line of code grew 40x higher by Release 8."
                },
                {
                    "text": "Monthly development payroll",
                    "explanation": "Correct! Figure 1.5 shows monthly payroll climbed from a few hundred thousand dollars to $20 million."
                },
                {
                    "text": "Developer productivity per release",
                    "explanation": "Incorrect. Figure 1.4 shows developer productivity per release plummeted from near 100% toward 0%."
                },
                {
                    "text": "Net new lines of code added per dollar spent",
                    "explanation": "Incorrect. Net new lines of code per dollar collapsed by 97.5% (40x higher cost per line)."
                }
            ],
            "correct_indices": [0, 1, 2],
            "overall_explanation": "Staff count, cost per line of code, and monthly payroll all soared—while productivity and marginal code output per dollar collapsed."
        },
        # 24. cloze_typed
        {
            "id": "ch1-q24",
            "type": "cloze_typed",
            "bloom": "Aphorism Recall",
            "prompt": "Complete Robert C. Martin's famous six-word aphorism from Chapter 1 that summarizes the lesson of the Tortoise, the Hare, and Jason Gorman's TDD experiment:",
            "instruction": "Type the missing words.",
            "template": "The only way to go {{1}}, is to go {{2}}.",
            "blanks": [
                {"answer": "fast", "accepted": ["fast", "quickly"], "placeholder": "speed"},
                {"answer": "well", "accepted": ["well", "clean", "right"], "placeholder": "quality"}
            ],
            "overall_explanation": "'The only way to go fast, is to go well.' Speed is a byproduct of architectural and code cleanliness, never a trade-off against it."
        },
        # 25. match_pairs
        {
            "id": "ch1-q25",
            "type": "match_pairs",
            "bloom": "Cross-Domain Analogy Mapping",
            "prompt": "Map each element of Robert C. Martin's Home Architecture analogy to its corresponding software architecture counterpart:",
            "instruction": "Click a home blueprint element on the left, then click its software counterpart on the right.",
            "pairs": [
                {
                    "left": "Outward elevations, overall house shape, and room layout",
                    "right": "High-level system topology, service boundaries, and major use-case workflows"
                },
                {
                    "left": "Exact placement of every outlet, light switch, furnace, and sump pump",
                    "right": "Low-level module wiring, function signatures, dependency injection, and error handlers"
                },
                {
                    "left": "How the low-level electrical and foundation details support the room layout",
                    "right": "How clean low-level code details enable and sustain high-level architectural boundaries"
                },
                {
                    "left": "The complete set of blueprints produced by a single home architect",
                    "right": "The continuous fabric of software design and architecture with no dividing line between them"
                }
            ],
            "right_order": [2, 0, 3, 1],
            "overall_explanation": "In both physical buildings and software systems, high-level layout and low-level wiring are inseparable parts of one design."
        },
        # 26. mcq_single
        {
            "id": "ch1-q26",
            "type": "mcq_single",
            "bloom": "Graphical Interpretation",
            "prompt": "In Jason Gorman's 6-day experiment chart (Figure 1.6), why were Days 5 and 6 faster than Days 1 and 2, and how did that affect the TDD vs. non-TDD conclusion?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "There was a natural learning curve across the six iterations, yet even with Day 6 benefiting from maximum practice, every TDD day (1, 3, 5) still beat every non-TDD day (2, 4, 6).",
                    "explanation": "Correct! Even Day 1 (TDD, least practice) beat Day 6 (non-TDD, most practice), proving that cleanliness discipline outweighed even the 6-day repetition advantage."
                },
                {
                    "text": "Gorman upgraded his hardware and IDE between Day 2 and Day 5, invalidating the comparison.",
                    "explanation": "Incorrect. The speedup across iterations was the human learning curve of repeating the Roman numeral kata."
                },
                {
                    "text": "Days 5 and 6 reused copy-pasted code from Day 1 instead of starting fresh.",
                    "explanation": "Incorrect. Each day he completed the program from scratch until the predefined acceptance tests passed."
                },
                {
                    "text": "The learning curve showed that by Day 6, non-TDD became faster than TDD once the problem was memorized.",
                    "explanation": "Incorrect. Even on Day 6, non-TDD was slower than the slowest TDD day (Day 1)."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Because slowest-TDD (Day 1) beat fastest-non-TDD (Day 6), the cleanliness discipline advantage was stronger than 6 days of problem familiarity."
        },
        # 27. classify_buckets
        {
            "id": "ch1-q27",
            "type": "classify_buckets",
            "bloom": "Architectural Quality Triage",
            "prompt": "Triage each engineering scenario into 'Good Design (Effort Stays Low)' or 'Bad Design (Effort Grows per Release)' according to Chapter 1's definition:",
            "instruction": "Click an item card, then click the appropriate architectural bucket.",
            "buckets": [
                "Good Design (Effort Stays Low)",
                "Bad Design (Effort Grows per Release)"
            ],
            "items": [
                {
                    "text": "Adding a new payment method in Release 8 takes the same 2 developer-days it took in Release 1.",
                    "bucket": "Good Design (Effort Stays Low)"
                },
                {
                    "text": "Each new release requires modifying 35 unrelated files and running a 2-week manual regression cycle.",
                    "bucket": "Bad Design (Effort Grows per Release)"
                },
                {
                    "text": "Doubling the engineering headcount increases feature throughput by only 3%.",
                    "bucket": "Bad Design (Effort Grows per Release)"
                },
                {
                    "text": "Developers spend 85% of their sprint building customer-facing capabilities and 15% continuously keeping boundaries clean.",
                    "bucket": "Good Design (Effort Stays Low)"
                }
            ],
            "overall_explanation": "Martin's criterion is simple: if the effort to meet customer needs stays low across the system's lifetime, the design is good; if it grows with each release, the design is bad."
        },
        # 28. spot_flaw
        {
            "id": "ch1-q28",
            "type": "spot_flaw",
            "bloom": "Refactoring for Testability in JavaScript",
            "prose_mode": false,
            "prompt": "In Jason Gorman's Roman Numeral experiment, acceptance tests drove clean modular code. Click the ONE line in this JavaScript `toRoman(num)` implementation where a hidden global state mutation causes it to fail on the second test run:",
            "instruction": "Click the flawed line of JavaScript code, then click Check Answer.",
            "lines": [
                {
                    "text": "const NUMERALS = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];",
                    "explanation": "Lookup table constant is clean."
                },
                {
                    "text": "let cachedOutput = '';",
                    "explanation": "FLAW: Module-level mutable accumulator is never reset between calls, causing every subsequent call to append onto previous results!"
                },
                {
                    "text": "function toRoman(remaining) {",
                    "explanation": "Function declaration is fine."
                },
                {
                    "text": "  for (const [symbol, value] of NUMERALS) {",
                    "explanation": "Iterating through numeral pairs is clean."
                },
                {
                    "text": "    while (remaining >= value) { cachedOutput += symbol; remaining -= value; }",
                    "explanation": "Greedy subtraction loop works if output is a local variable."
                },
                {
                    "text": "  }",
                    "explanation": "End of loop."
                },
                {
                    "text": "  return cachedOutput;",
                    "explanation": "Returns the corrupted module-global string."
                },
                {
                    "text": "}",
                    "explanation": "End of function."
                }
            ],
            "flawed_indices": [1],
            "overall_explanation": "Shared mutable state across calls (`let cachedOutput = ''` outside `toRoman`) is a classic low-level defect that TDD immediately catches on the second assertion."
        },
        # 29. js_code
        {
            "id": "ch1-q29",
            "type": "js_code",
            "bloom": "Clean JavaScript Design Lab",
            "prompt": "Decouple a messy JavaScript order calculator so that adding a new release requirement takes minimal effort (Chapter 1's measure of good design).",
            "instruction": "Implement `createOrderPricer(taxPolicyFn, discountPolicyFn)` which returns a pure function `priceOrder(items)`. Each item in `items` has `{ price, qty }`. The returned function must:\n1. Compute `subtotal` = sum of `price * qty`\n2. Compute `discount` = `discountPolicyFn(subtotal, items)`\n3. Compute `taxable` = `Math.max(0, subtotal - discount)`\n4. Compute `tax` = `taxPolicyFn(taxable, items)`\n5. Return `{ subtotal, discount, tax, total: Number((taxable + tax).toFixed(2)) }`.",
            "starter_code": "function createOrderPricer(taxPolicyFn, discountPolicyFn) {\n  return function priceOrder(items) {\n    // Implement clean, decoupled calculation\n    \n  };\n}",
            "test_cases": [
                {
                    "label": "Standard 10% tax and $15 flat discount",
                    "call": "createOrderPricer(t => t * 0.1, s => s >= 100 ? 15 : 0)([{ price: 50, qty: 2 }, { price: 20, qty: 1 }])",
                    "expected": {"subtotal": 120, "discount": 15, "tax": 10.5, "total": 115.5}
                },
                {
                    "label": "Discount exceeding subtotal clamps taxable to 0",
                    "call": "createOrderPricer(t => t * 0.2, () => 50)([{ price: 15, qty: 2 }])",
                    "expected": {"subtotal": 30, "discount": 50, "tax": 0, "total": 0}
                }
            ],
            "model_answer": "function createOrderPricer(taxPolicyFn, discountPolicyFn) {\n  return function priceOrder(items) {\n    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);\n    const discount = discountPolicyFn(subtotal, items);\n    const taxable = Math.max(0, subtotal - discount);\n    const tax = taxPolicyFn(taxable, items);\n    return {\n      subtotal,\n      discount,\n      tax,\n      total: Number((taxable + tax).toFixed(2))\n    };\n  };\n}",
            "overall_explanation": "By injecting tax and discount policies rather than hardcoding them, new release requirements can swap policies with near-zero effort."
        },
        # 30. free_response
        {
            "id": "ch1-q30",
            "type": "free_response",
            "bloom": "Personal Synthesis & Action Plan",
            "prompt": "Synthesize Chapter 1's core thesis: What are the TWO lies developers tell themselves when under deadline pressure, and what is the only sustainable way to reverse declining productivity?",
            "instruction": "Write 4–6 sentences in your own words. Click Check Answer for AI evaluation.",
            "placeholder": "1. The first lie ('we can clean it up later')...\n2. The bigger lie ('messy code is faster in the short term')...\n3. How to reverse it...",
            "key_concepts": [
                "Lie 1: 'We can clean it up later; we just have to get to market first' (market pressure never abates, so cleanup never happens)",
                "Lie 2 (The Bigger Lie): 'Writing messy code makes us go fast in the short term and only slows us down long term' (making messes is always slower on every time scale)",
                "Bonus Lie: 'We should scrap the system and rewrite from scratch' (Hare's overconfidence repeats the mess)",
                "Resolution: Stop thinking like the overconfident Hare, take responsibility for the mess, and invest continuously in clean software architecture ('The only way to go fast, is to go well')"
            ],
            "model_answer": "The first lie developers buy into is 'We can clean it up later once we get to market,' which fails because market pressure and competitor chases never stop, so the team never switches modes. The second, bigger lie is that 'writing messy code makes us faster in the short term,' which Jason Gorman's TDD experiment disproved by showing that making messes is slower even on a sub-30-minute task. Even the urge to rewrite from scratch is the same Hare-like overconfidence. The only way to reverse declining productivity is to abandon overconfidence, take responsibility for the existing mess, and treat clean architecture as the prerequisite for speed.",
            "overall_explanation": "Mastering Chapter 1 means recognizing that architectural cleanliness is never a tax on speed—it is the sole engine of speed."
        }
    ]

    return {
        "chapter": 1,
        "part": "PART I · Introduction",
        "title": "What Is Design and Architecture?",
        "subtitle": "The continuous fabric of decisions, the 40x cost signature of a mess, and why going well is the only way to go fast.",
        "description": "30 deep-drilling interactive questions covering the unity of design and architecture, the economic goal of software structure, the Release 1–8 corporate case study, Aesop's Hare vs. Tortoise, and Jason Gorman's TDD speed experiment.",
        "released_on": "2026-11-26",
        "question_count": len(questions),
        "questions": questions
    }


def build_chapter_02():
    questions = [
        # 1. mcq_single
        {
            "id": "ch2-q01",
            "type": "mcq_single",
            "bloom": "Core Distinction",
            "prompt": "What are the two distinct values that every software system provides to its stakeholders, and which one does Robert C. Martin prove is the greater value?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Behavior (urgent functionality) and Architecture/Structure (ease of change); Architecture is the greater value because without it the system eventually becomes impossible to adapt and therefore useless.",
                    "explanation": "Correct! Behavior makes or saves money today, but Architecture keeps the software 'soft' so it can continue to be useful as requirements inevitably change."
                },
                {
                    "text": "Behavior and Architecture; Behavior is the greater value because a beautifully structured system that doesn't satisfy current requirements generates zero revenue.",
                    "explanation": "Incorrect. Martin specifically uses the logical tool of examining the extremes to prove that a broken system that is easy to change remains continually useful, whereas a working system that cannot be changed becomes useless as soon as requirements shift."
                },
                {
                    "text": "Performance and Security; Security is the greater value because data breaches destroy stakeholder trust.",
                    "explanation": "Incorrect. While important quality attributes, Chapter 2 specifically contrasts Behavior (function) and Architecture (structure/flexibility)."
                },
                {
                    "text": "Source Code and Documentation; Documentation is the greater value because developers rotate off projects.",
                    "explanation": "Incorrect. Chapter 2's 'Tale of Two Values' is strictly about Behavior vs. Architecture (Structure)."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Every software system provides two values: Behavior and Structure (Architecture). Structure is the greater value because it preserves the ability to change."
        },
        # 2. cloze_typed
        {
            "id": "ch2-q02",
            "type": "cloze_typed",
            "bloom": "Etymological Insight",
            "prompt": "Complete Robert C. Martin's etymological breakdown of the word 'software' from Chapter 2:",
            "instruction": "Type the missing words in the blanks.",
            "template": "The word 'software' is a compound word composed of '{{1}}' and 'ware' (meaning product). Software was invented to be easy to change; if we had wanted the behavior of machines to be hard to change, we would have called it {{2}}.",
            "blanks": [
                {"answer": "soft", "accepted": ["soft", "flexible"], "placeholder": "first half"},
                {"answer": "hardware", "accepted": ["hardware", "hard ware"], "placeholder": "opposite"}
            ],
            "overall_explanation": "Software exists specifically to make machine behavior 'soft' (easy to change). When architecture ossifies, software degenerates into hardware."
        },
        # 3. mcq_single
        {
            "id": "ch2-q03",
            "type": "mcq_single",
            "bloom": "Conceptual Precision",
            "prompt": "According to Chapter 2, in a well-architected system, what should the difficulty of making a stakeholder-requested change be proportional to?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Proportional only to the SCOPE of the change, and NOT to the SHAPE of the change.",
                    "explanation": "Correct! Stakeholders view changes as a stream of requests of similar scope; good architecture is shape-agnostic so cost scales with scope rather than clashing with system shape."
                },
                {
                    "text": "Proportional to the SHAPE of the change, and NOT to the SCOPE of the change.",
                    "explanation": "Incorrect. You reversed the two terms: when difficulty depends on the 'shape' of the change (jamming square pegs into round holes), development costs skyrocket out of proportion to scope."
                },
                {
                    "text": "Proportional to the total age of the codebase and the number of previous releases.",
                    "explanation": "Incorrect. When Year 2 is much more expensive than Year 1 and Year 3 is much more expensive than Year 2 for changes of similar scope, that is the symptom of a rigid, shape-constrained architecture."
                },
                {
                    "text": "Proportional to the seniority of the product manager requesting the feature.",
                    "explanation": "Incorrect. Effort should depend strictly on the functional scope of the change."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "The gap between 'scope' (stakeholder view) and 'shape' (developer jigsaw puzzle view) is what drives the exponential growth in software costs."
        },
        # 4. match_pairs
        {
            "id": "ch2-q04",
            "type": "match_pairs",
            "bloom": "Eisenhower Matrix Mapping",
            "prompt": "Map each quadrant of President Dwight D. Eisenhower's Importance vs. Urgency Matrix to its priority rank and software value in Chapter 2:",
            "instruction": "Click an Eisenhower quadrant on the left, then click its corresponding rank and software meaning on the right.",
            "pairs": [
                {
                    "left": "1st Priority: Urgent and Important",
                    "right": "Critical architecture AND business-critical behavior that must be delivered right now"
                },
                {
                    "left": "2nd Priority: Not Urgent and Important",
                    "right": "Software Architecture (structural cleanliness and flexibility—important, but never particularly urgent)"
                },
                {
                    "left": "3rd Priority: Urgent and Not Important",
                    "right": "Routine Software Behavior / minor feature requests that managers often mistakenly elevate to Priority #1"
                },
                {
                    "left": "4th Priority: Not Urgent and Not Important",
                    "right": "Trivial distractions and gold-plating that neither serve core requirements nor improve architecture"
                }
            ],
            "right_order": [2, 0, 3, 1],
            "overall_explanation": "Architecture occupies Priority #1 and #2 (Important), whereas Behavior occupies Priority #1 and #3 (Urgent). Elevating #3 above #2 destroys the system."
        },
        # 5. order_steps
        {
            "id": "ch2-q05",
            "type": "order_steps",
            "bloom": "Priority Ranking",
            "prompt": "Arrange the four couplets of Eisenhower's Matrix in the exact priority order (1 = Highest Priority to 4 = Lowest Priority) defined in Chapter 2:",
            "instruction": "Drag rows or use ↑ / ↓ buttons to put the four quadrants in order from 1 to 4.",
            "items": [
                "Urgent and Important",
                "Not Urgent and Important",
                "Urgent and Not Important",
                "Not Urgent and Not Important"
            ],
            "initial_order": [2, 0, 3, 1],
            "correct_order": [0, 1, 2, 3],
            "overall_explanation": "Important items always take the top two spots (1. Urgent & Important, 2. Not Urgent & Important), placing Architecture ahead of Urgent-but-Not-Important features (#3)."
        },
        # 6. claim_audit
        {
            "id": "ch2-q06",
            "type": "claim_audit",
            "bloom": "Proof by Extremes Audit",
            "prompt": "Audit this argument from a Product Director using Chapter 2's 'examining the extremes' logical proof:",
            "instruction": "Choose the verdict and explain the logical proof by extremes in your own words.",
            "claim": "A program that works 100% according to today's specification but cannot be changed is far more valuable to the business than a program that currently fails its specification but is easy to change.",
            "verdict_options": [
                "Architecturally Sound",
                "Dangerous Fallacy",
                "True for Regulated Enterprise Systems"
            ],
            "correct_verdict": "Dangerous Fallacy",
            "key_concepts": [
                "Proof by examining the extremes",
                "Extreme 1: Works perfectly today but impossible to change -> becomes useless as soon as requirements change",
                "Extreme 2: Does not work today but is easy to change -> you can make it work and keep it working as requirements change, so it remains continually useful"
            ],
            "model_answer": "This is a dangerous fallacy refuted by Martin's proof by extremes. If a program works perfectly today but is impossible to change, it will stop working the moment requirements change and you won't be able to fix it—making it permanently useless. Conversely, if a program does not work today but is easy to change, you can make it work and keep it working as requirements evolve—so it remains continually useful.",
            "overall_explanation": "Examining the extremes proves that ease of change (architecture) dominates current functionality (behavior) over any non-trivial lifetime."
        },
        # 7. classify_buckets
        {
            "id": "ch2-q07",
            "type": "classify_buckets",
            "bloom": "Value Triage",
            "prompt": "Classify each developer activity or concern into 'First Value: Behavior' or 'Second Value: Architecture (Structure)':",
            "instruction": "Click an activity card, then click the value bucket it primarily serves.",
            "buckets": [
                "First Value: Behavior",
                "Second Value: Architecture (Structure)"
            ],
            "items": [
                {
                    "text": "Translating a stakeholder functional specification into machine instructions that calculate quarterly payroll taxes.",
                    "bucket": "First Value: Behavior"
                },
                {
                    "text": "Opening a debugger when a machine violates a functional requirement and fixing the immediate bug.",
                    "bucket": "First Value: Behavior"
                },
                {
                    "text": "Keeping policy modules shape-agnostic so new feature requests don't feel like jamming square pegs into round holes.",
                    "bucket": "Second Value: Architecture (Structure)"
                },
                {
                    "text": "Ensuring the cost of a change remains proportional only to its functional scope rather than its structural shape.",
                    "bucket": "Second Value: Architecture (Structure)"
                },
                {
                    "text": "Pushing back against management's attempt to elevate urgent-but-unimportant features above system modularity.",
                    "bucket": "Second Value: Architecture (Structure)"
                }
            ],
            "overall_explanation": "Many programmers mistakenly believe their entire job is implementing requirements and fixing bugs (Behavior), ignoring their higher duty to keep the system easy to change (Architecture)."
        },
        # 8. mcq_single
        {
            "id": "ch2-q08",
            "type": "mcq_single",
            "bloom": "Economic Reality Check",
            "prompt": "When someone objects to the 'proof by extremes' by saying 'No program is literally impossible to change,' how does Robert C. Martin respond?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "There are many systems that are PRACTICALLY impossible to change because the estimated cost of the change exceeds the business benefit of the change.",
                    "explanation": "Correct! Once the cost of modifying a feature exceeds the profit or benefit that change would generate, the system is practically immutable in that area."
                },
                {
                    "text": "He argues that assembly-language and COBOL programs become physically read-only after 10 years.",
                    "explanation": "Incorrect. The impossibility is economic (cost > benefit), not physical read-only storage."
                },
                {
                    "text": "He concedes the point and admits that behavior and architecture are of strictly equal value.",
                    "explanation": "Incorrect. He stands firm that architecture is the greater value because economic immutability renders features dead."
                },
                {
                    "text": "He notes that hardware firmware cannot be patched once burned into ROM.",
                    "explanation": "Incorrect. He is talking about everyday enterprise software systems where certain features or configurations become cost-prohibitive to alter."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Economic impossibility is real: the moment `Cost(Change) > Benefit(Change)`, the software is effectively frozen."
        },
        # 9. spot_flaw
        {
            "id": "ch2-q09",
            "type": "spot_flaw",
            "bloom": "Shape vs. Scope in JavaScript",
            "prose_mode": false,
            "prompt": "Chapter 2 warns against architectures that 'prefer one shape over another,' turning simple scope changes into square-peg/round-hole nightmares. Click the ONE line in this JavaScript notification dispatcher that hardcodes a rigid shape assumption, forcing edits to core workflow code every time a new channel (like SMS or Push) is requested:",
            "instruction": "Click the flawed line of code below, then click Check Answer.",
            "lines": [
                {
                    "text": "class AlertWorkflow {",
                    "explanation": "Class declaration is fine."
                },
                {
                    "text": "  constructor(transport) { this.transport = transport; }",
                    "explanation": "Constructor injection is clean."
                },
                {
                    "text": "  notifyCustomer(user, message) {",
                    "explanation": "Method signature is clean."
                },
                {
                    "text": "    if (!user.emailAddress || !user.smtpPort) throw new Error('Must be an SMTP Email user');",
                    "explanation": "FLAW: Welds the high-level workflow to the specific 'shape' of an SMTP Email user (`emailAddress`, `smtpPort`), making SMS, Webhook, or Push notifications square pegs in a round hole!"
                },
                {
                    "text": "    return this.transport.send(user, message);",
                    "explanation": "Delegation to polymorphic transport is clean once the shape check above is removed."
                },
                {
                    "text": "  }",
                    "explanation": "End of method."
                },
                {
                    "text": "}",
                    "explanation": "End of class."
                }
            ],
            "flawed_indices": [3],
            "overall_explanation": "When core workflow logic demands `user.smtpPort`, the architecture prefers the 'SMTP email shape' over all other notification shapes."
        },
        # 10. cloze_bank
        {
            "id": "ch2-q10",
            "type": "cloze_bank",
            "bloom": "Stakeholder vs. Developer Perspective",
            "prompt": "Complete the contrast between how stakeholders perceive change requests versus how developers in a rigid architecture experience them:",
            "instruction": "Click each blank and pick the matching phrase from the word bank.",
            "template": "From the stakeholders' point of view, they are simply providing a stream of changes of roughly similar {{1}}. From the developers' point of view, the stakeholders are handing them a stream of {{2}} that they must fit into a puzzle of ever-increasing complexity because the {{3}} of the system does not match the request.",
            "blanks": [
                {"answer": "scope"},
                {"answer": "jigsaw puzzle pieces"},
                {"answer": "shape"}
            ],
            "word_bank": [
                "scope",
                "jigsaw puzzle pieces",
                "shape",
                "budget",
                "SQL migrations",
                "velocity"
            ],
            "overall_explanation": "Stakeholders think in scope ('just add one more notification channel'); developers suffer from shape mismatch ('our entire pipeline assumes SMTP email')."
        },
        # 11. mcq_single
        {
            "id": "ch2-q11",
            "type": "mcq_single",
            "bloom": "Organizational Dynamics",
            "prompt": "What is the fundamental dilemma regarding business managers and software architecture described in Chapter 2?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Business managers are not equipped to evaluate the importance of architecture—that is what software developers were hired to do, so developers must assert architecture's importance over the urgency of features.",
                    "explanation": "Correct! Managers naturally focus on today's urgent features because they cannot see or evaluate internal architectural decay; developers were hired specifically to safeguard that structure."
                },
                {
                    "text": "Business managers intentionally want the system to become unmaintainable after Year 2 so they can justify larger departmental budgets.",
                    "explanation": "Incorrect. Managers are furious when change estimates become unaffordably high—they want flexibility, they just aren't equipped to judge architectural trade-offs."
                },
                {
                    "text": "Business managers should be required to pass a JavaScript architecture exam before prioritizing the product backlog.",
                    "explanation": "Incorrect. Evaluating architecture is the software development team's professional responsibility, not the business manager's job."
                },
                {
                    "text": "Developers should obey business managers unquestioningly because developers are employees, not stakeholders.",
                    "explanation": "Incorrect. Martin explicitly states: 'Remember, as a software developer, you are a stakeholder. You have a stake in the software that you need to safeguard.'"
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Business managers cannot evaluate architectural health—that is the exact expertise developers and architects were hired to provide and defend."
        },
        # 12. free_response
        {
            "id": "ch2-q12",
            "type": "free_response",
            "bloom": "Contrast & Synthesis",
            "prompt": "Explain in your own words the paradox of how business managers react BEFORE vs. AFTER an architecture decays to the point where changes are unaffordable.",
            "instruction": "Write 3–5 sentences in your own words. Click Check Answer for AI evaluation.",
            "placeholder": "Before decay, if you ask managers whether current features or future flexibility matters more...\nLater, when you give them an unaffordable estimate for a change...",
            "key_concepts": [
                "When asked upfront, business managers say current functionality is more important than later flexibility",
                "Later, when they ask for a change and the estimated cost is unaffordably high, they are furious that developers allowed the system to reach a state where the change is impractical",
                "Developers cannot use 'management told us to prioritize features' as an excuse; developers are responsible for fighting for architecture"
            ],
            "model_answer": "When you ask business managers upfront whether they want flexibility, they say yes, but quickly qualify that current functionality is more important than future flexibility. However, if those same managers later ask for a change and your estimated cost is unaffordably high, they will be furious that you allowed the system to reach a point where the change became impractical. Because managers aren't equipped to evaluate architecture, developers must fight for architecture upfront rather than caving to short-term urgency.",
            "overall_explanation": "Managers will pressure you to skip architecture today and then blame you tomorrow when changes become unaffordable—which is why you must stand firm today."
        },
        # 13. js_code
        {
            "id": "ch2-q13",
            "type": "js_code",
            "bloom": "Quantitative Decision Modeling in JavaScript",
            "prompt": "Implement `prioritizeBacklog(items)` in JavaScript using Chapter 2's Eisenhower Matrix rules and Economic Impossibility threshold.",
            "instruction": "Given an array of backlog items `{ id, urgent, important, estimatedCost, expectedBenefit }`, return a new array of items that are economically viable (`estimatedCost <= expectedBenefit`), sorted by Chapter 2's 4-level Eisenhower priority:\n1. `urgent && important`\n2. `!urgent && important` (Architecture!)\n3. `urgent && !important`\n4. `!urgent && !important`\nIf two items share the same priority rank, preserve their original relative order. Each returned object should have `{ id, rank, viable: true }`.",
            "starter_code": "function prioritizeBacklog(items) {\n  // Filter out economically impossible items (cost > benefit)\n  // Assign Eisenhower rank (1..4) and sort by rank ascending\n  \n}",
            "test_cases": [
                {
                    "label": "Architecture (#2: Not Urgent, Important) ranks ahead of Urgent Minor Feature (#3) and filters out Cost > Benefit",
                    "call": "prioritizeBacklog([{ id: 'minor-btn', urgent: true, important: false, estimatedCost: 500, expectedBenefit: 2000 }, { id: 'decouple-db', urgent: false, important: true, estimatedCost: 3000, expectedBenefit: 25000 }, { id: 'frozen-legacy', urgent: true, important: true, estimatedCost: 50000, expectedBenefit: 10000 }, { id: 'prod-outage', urgent: true, important: true, estimatedCost: 1000, expectedBenefit: 80000 }])",
                    "expected": [
                        {"id": "prod-outage", "rank": 1, "viable": true},
                        {"id": "decouple-db", "rank": 2, "viable": true},
                        {"id": "minor-btn", "rank": 3, "viable": true}
                    ]
                },
                {
                    "label": "All 4 quadrants sorted properly",
                    "call": "prioritizeBacklog([{ id: 'q4', urgent: false, important: false, estimatedCost: 10, expectedBenefit: 20 }, { id: 'q3', urgent: true, important: false, estimatedCost: 10, expectedBenefit: 20 }, { id: 'q2', urgent: false, important: true, estimatedCost: 10, expectedBenefit: 20 }, { id: 'q1', urgent: true, important: true, estimatedCost: 10, expectedBenefit: 20 }])",
                    "expected": [
                        {"id": "q1", "rank": 1, "viable": true},
                        {"id": "q2", "rank": 2, "viable": true},
                        {"id": "q3", "rank": 3, "viable": true},
                        {"id": "q4", "rank": 4, "viable": true}
                    ]
                }
            ],
            "model_answer": "function prioritizeBacklog(items) {\n  const getRank = (item) => {\n    if (item.urgent && item.important) return 1;\n    if (!item.urgent && item.important) return 2;\n    if (item.urgent && !item.important) return 3;\n    return 4;\n  };\n  return items\n    .filter(item => item.estimatedCost <= item.expectedBenefit)\n    .map((item, idx) => ({ id: item.id, rank: getRank(item), viable: true, _idx: idx }))\n    .sort((a, b) => a.rank - b.rank || a._idx - b._idx)\n    .map(({ id, rank, viable }) => ({ id, rank, viable }));\n}",
            "overall_explanation": "Eisenhower's Matrix places Not-Urgent-but-Important work (Rank 2: Architecture) strictly above Urgent-but-Not-Important feature requests (Rank 3)."
        },
        # 14. mcq_multi
        {
            "id": "ch2-q14",
            "type": "mcq_multi",
            "bloom": "Eisenhower Matrix Analysis",
            "prompt": "Which statements accurately reflect how Behavior and Architecture map onto Eisenhower's Matrix in Chapter 2? (Select ALL that apply)",
            "instruction": "Select all correct options, then click Check Answer.",
            "options": [
                {
                    "text": "The first value of software—behavior—is urgent, but not always particularly important.",
                    "explanation": "Correct! Behavior occupies positions 1 (Urgent & Important) and 3 (Urgent & Not Important)."
                },
                {
                    "text": "The second value of software—architecture—is important, but never particularly urgent.",
                    "explanation": "Correct! Architecture occupies positions 1 and 2 (the top two positions on the priority list)."
                },
                {
                    "text": "The common failure of managers and developers is elevating Position 3 (Urgent and Not Important) to Position 1.",
                    "explanation": "Correct! Failing to separate urgent-but-unimportant features from truly urgent-and-important ones causes teams to neglect important architecture."
                },
                {
                    "text": "Architecture belongs in Position 4 (Not Urgent and Not Important) until the system reaches 100,000 daily active users.",
                    "explanation": "Incorrect. Architecture is ALWAYS important and sits in the top two priority positions from day one."
                }
            ],
            "correct_indices": [0, 1, 2],
            "overall_explanation": "Because architecture is important (#1/#2) and many urgent feature requests are not (#3), elevating #3 to #1 starves architecture."
        },
        # 15. spot_flaw
        {
            "id": "ch2-q15",
            "type": "spot_flaw",
            "bloom": "Professional Responsibility Audit",
            "prose_mode": true,
            "prompt": "Read these four statements from a Senior Software Engineer explaining why their team's codebase became unmaintainable. Click the ONE statement that violates Chapter 2's principle of developer stakeholder duty:",
            "instruction": "Click the flawed statement below, then click Check Answer.",
            "lines": [
                {
                    "text": "1. Sales, marketing, operations, and management all naturally fight for what they believe is best for the company.",
                    "explanation": "True—Chapter 2 explicitly notes that every department struggles for its priorities."
                },
                {
                    "text": "2. As software developers, we are NOT stakeholders; our duty is simply to code whatever features Product Management marks as urgent without arguing.",
                    "explanation": "FLAW: Martin explicitly writes: 'Remember, as a software developer, you are a stakeholder. You have a stake in the software that you need to safeguard. That's part of your role, and part of your duty.'"
                },
                {
                    "text": "3. If architecture comes last and change becomes practically impossible, it means our development team did not fight hard enough for what we knew was necessary.",
                    "explanation": "Direct truth from the closing paragraph of Chapter 2."
                },
                {
                    "text": "4. Software architects are, by virtue of their job description, focused on creating a structure that allows features to be easily developed, modified, and extended.",
                    "explanation": "Accurately summarizes the architect's role in Chapter 2."
                }
            ],
            "flawed_indices": [1],
            "overall_explanation": "Software developers ARE stakeholders who were hired specifically to safeguard the structural health of the software in equal struggle with other teams."
        },
        # 16. mcq_single
        {
            "id": "ch2-q16",
            "type": "mcq_single",
            "bloom": "Diagnostic Reasoning",
            "prompt": "Why is the first year of software development often much cheaper than the second year, and the second year much cheaper than the third, even when stakeholders request changes of similar scope each year?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Because the architecture prefers one shape over another, making each new feature request harder to fit into the existing jigsaw puzzle than the last.",
                    "explanation": "Correct! When difficulty scales with the 'shape' of the system rather than the 'scope' of the request, costs grow out of proportion to feature size year after year."
                },
                {
                    "text": "Because cloud hosting and third-party SaaS APIs increase their unit pricing by 100% every year.",
                    "explanation": "Incorrect. The escalating cost is engineering time and effort caused by architectural rigidity."
                },
                {
                    "text": "Because stakeholders intentionally ask for 10x larger scope in Year 3 while pretending the requests are small.",
                    "explanation": "Incorrect. Martin specifically notes that stakeholders are providing a stream of changes of roughly similar scope."
                },
                {
                    "text": "Because JavaScript garbage collection slows down linearly with the age of the Git repository.",
                    "explanation": "Incorrect. Runtime garbage collection has nothing to do with multi-year development cost growth."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Escalating year-over-year cost for same-sized features is the direct result of a shape-biased architecture."
        },
        # 17. js_code
        {
            "id": "ch2-q17",
            "type": "js_code",
            "bloom": "Shape-Agnostic Architecture in JavaScript",
            "prompt": "Refactor a shape-coupled report generator into a shape-agnostic JavaScript use case so that adding new output formats (JSON, CSV, HTML) has cost proportional only to scope.",
            "instruction": "Implement `generateSalesReport(records, formatter)` where:\n1. `records` is an array of `{ item, amount, refunded }`.\n2. Filter out any record where `refunded === true`.\n3. Compute `totalRevenue` (sum of `amount` of non-refunded records) and `validCount` (count of non-refunded records).\n4. Pass a shape-agnostic summary DTO `{ validCount, totalRevenue, items: validRecords.map(r => r.item) }` into `formatter(dto)` and return its result.",
            "starter_code": "function generateSalesReport(records, formatter) {\n  // Keep core business aggregation 100% shape-agnostic of the output format\n  \n}",
            "test_cases": [
                {
                    "label": "CSV Formatter Plug-in",
                    "call": "generateSalesReport([{ item: 'Book', amount: 40, refunded: false }, { item: 'Pen', amount: 10, refunded: true }, { item: 'Course', amount: 160, refunded: false }], dto => `${dto.validCount},${dto.totalRevenue},${dto.items.join('|')}`)",
                    "expected": "2,200,Book|Course"
                },
                {
                    "label": "JSON Summary Plug-in",
                    "call": "generateSalesReport([{ item: 'License', amount: 99, refunded: false }], dto => ({ summary: `${dto.validCount} sold ($${dto.totalRevenue})` }))",
                    "expected": {"summary": "1 sold ($99)"}
                }
            ],
            "model_answer": "function generateSalesReport(records, formatter) {\n  const valid = records.filter(r => !r.refunded);\n  const totalRevenue = valid.reduce((sum, r) => sum + r.amount, 0);\n  const dto = {\n    validCount: valid.length,\n    totalRevenue,\n    items: valid.map(r => r.item)\n  };\n  return formatter(dto);\n}",
            "overall_explanation": "Because `generateSalesReport` depends on a shape-agnostic `formatter(dto)` boundary, adding PDF, HTML, or CSV output requires zero modifications to the business rule."
        },
        # 18. claim_audit
        {
            "id": "ch2-q18",
            "type": "claim_audit",
            "bloom": "Eisenhower Quote Audit",
            "prompt": "Audit President Dwight D. Eisenhower's classical observation as applied to software engineering in Chapter 2:",
            "instruction": "Select the verdict and explain how it applies to Behavior vs. Architecture.",
            "claim": "I have two kinds of problems, the urgent and the important. The urgent are not important, and the important are never urgent.",
            "verdict_options": [
                "Architecturally Sound",
                "Dangerous Fallacy",
                "Only Applies to Military Logistics"
            ],
            "correct_verdict": "Architecturally Sound",
            "key_concepts": [
                "Urgent things are rarely of great importance, and important things are seldom of great urgency",
                "First value of software (Behavior) is urgent but not always particularly important",
                "Second value of software (Architecture) is important but never particularly urgent"
            ],
            "model_answer": "This is architecturally sound and forms the backbone of Chapter 2's prioritization framework. In software, Behavior (a stakeholder's immediate feature or bug fix) screams with urgency but is often not strategically important, whereas Architecture (keeping the system easy to change) is critically important for survival but never screams with immediate deadline urgency.",
            "overall_explanation": "Because architecture is never urgent, teams that prioritize by urgency alone will always starve architecture until the system collapses."
        },
        # 19. cloze_bank
        {
            "id": "ch2-q19",
            "type": "cloze_bank",
            "bloom": "Role of the Architect",
            "prompt": "Complete Chapter 2's description of the software architect's core focus and responsibility:",
            "instruction": "Click each blank slot and select the matching phrase from the word bank.",
            "template": "Software architects are, by virtue of their job description, more focused on the {{1}} of the system than on its {{2}}. Architects create an architecture that allows those features and functions to be easily {{3}}, easily {{4}}, and easily extended.",
            "blanks": [
                {"answer": "structure"},
                {"answer": "features and functions"},
                {"answer": "developed"},
                {"answer": "modified"}
            ],
            "word_bank": [
                "structure",
                "features and functions",
                "developed",
                "modified",
                "hardcoded",
                "outsourced"
            ],
            "overall_explanation": "An architect's deliverable is a structure that makes features easy to develop, easy to modify, and easy to extend."
        },
        # 20. mcq_single
        {
            "id": "ch2-q20",
            "type": "mcq_single",
            "bloom": "Metaphor Interpretation",
            "prompt": "What does Robert C. Martin mean when he says architectures should be as 'shape agnostic' as practical?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "The structure of the system should not favor one specific feature shape or delivery detail over another, so new requirements fit without forcing square pegs into round holes.",
                    "explanation": "Correct! The more an architecture prefers one specific shape, the harder future features will be to fit into that structure."
                },
                {
                    "text": "All JavaScript objects should be untyped `any` dictionaries with no schema validation.",
                    "explanation": "Incorrect. Shape-agnostic architecture means decoupling high-level policy from rigid structural assumptions, not abandoning domain data integrity."
                },
                {
                    "text": "UI components should only use circular Material Design buttons rather than rectangular cards.",
                    "explanation": "Incorrect. 'Shape' in Chapter 2 is a metaphor for structural coupling in software architecture, not visual CSS geometry."
                },
                {
                    "text": "Every database table should store all columns as a single raw text blob.",
                    "explanation": "Incorrect. Dumping everything into text blobs destroys structure rather than creating clean architectural boundaries."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "A shape-agnostic architecture decouples core policy from specific delivery/storage shapes so new requirements slot in smoothly."
        },
        # 21. match_pairs
        {
            "id": "ch2-q21",
            "type": "match_pairs",
            "bloom": "Departmental Struggle Mapping",
            "prompt": "Chapter 2 states that healthy companies involve an ongoing struggle among equal stakeholders. Match each stakeholder group to what they naturally fight for and how developers must engage:",
            "instruction": "Click a stakeholder group on the left, then click their primary focus on the right.",
            "pairs": [
                {
                    "left": "Business Managers & Sales Stakeholders",
                    "right": "Fight for urgent current features and immediate customer-visible behavior (Positions 1 & 3)"
                },
                {
                    "left": "Software Developers",
                    "right": "Are stakeholders too, hired with a duty to safeguard the long-term maintainability of the codebase"
                },
                {
                    "left": "Software Architects",
                    "right": "Doubly responsible for fighting for system structure over raw feature urgency (Positions 1 & 2)"
                },
                {
                    "left": "A Development Team That Never Pushes Back",
                    "right": "Allows architecture to come last until change becomes practically impossible—and then gets blamed by management anyway"
                }
            ],
            "right_order": [2, 0, 3, 1],
            "overall_explanation": "Every department struggles for what it sees as best for the company; when developers abdicate that struggle, the whole business loses its software asset."
        },
        # 22. classify_buckets
        {
            "id": "ch2-q22",
            "type": "classify_buckets",
            "bloom": "Eisenhower Quadrant Triage",
            "prompt": "Triage these four real-world engineering tasks into their proper Eisenhower Matrix position from Chapter 2:",
            "instruction": "Click each task card, then click the Eisenhower quadrant bucket it belongs to.",
            "buckets": [
                "1. Urgent and Important",
                "2. Not Urgent and Important",
                "3. Urgent and Not Important",
                "4. Not Urgent and Not Important"
            ],
            "items": [
                {
                    "text": "Fixing a broken checkout payment gateway that is currently blocking all live customer purchases.",
                    "bucket": "1. Urgent and Important"
                },
                {
                    "text": "Extracting direct SQL queries out of domain use cases behind a repository interface so next quarter's features stay easy to change.",
                    "bucket": "2. Not Urgent and Important"
                },
                {
                    "text": "Rushing a custom one-off banner animation requested by a manager for tomorrow's internal slide deck by hardcoding flags into the core router.",
                    "bucket": "3. Urgent and Not Important"
                },
                {
                    "text": "Debating for three hours whether to indent JSON config files with 2 spaces or 4 spaces when a formatter is already installed.",
                    "bucket": "4. Not Urgent and Not Important"
                }
            ],
            "overall_explanation": "Distinguishing Quadrant 2 (Important Architecture) from Quadrant 3 (Urgent-but-Unimportant requests) is the core survival skill of a software team."
        },
        # 23. mcq_single
        {
            "id": "ch2-q23",
            "type": "mcq_single",
            "bloom": "Misconception Detection",
            "prompt": "According to Chapter 2, what do many programmers mistakenly believe is the ENTIRETY of their job?",
            "instruction": "Select the single best answer.",
            "options": [
                {
                    "text": "Helping stakeholders turn requirements into code that makes the machine behave properly, and pulling out the debugger to fix bugs when it violates those requirements.",
                    "explanation": "Correct! Martin writes: 'Many programmers believe that is the entirety of their job... They are sadly mistaken.' That covers only the first value (Behavior) while ignoring the greater second value (Architecture)."
                },
                {
                    "text": "Drawing architectural boundary diagrams without ever writing production code.",
                    "explanation": "Incorrect. The common mistake among programmers is focusing exclusively on behavior/debugging to the exclusion of structure."
                },
                {
                    "text": "Fighting with product managers all day so that no features ever ship.",
                    "explanation": "Incorrect. Both values must remain high; the error is focusing only on behavior while letting structure rot."
                },
                {
                    "text": "Writing automated compilers and operating system kernels from scratch.",
                    "explanation": "Incorrect. Chapter 2 addresses everyday application and system developers working with stakeholder requirements."
                }
            ],
            "correct_index": 0,
            "overall_explanation": "Implementing requirements and fixing bugs is only half the job—and the lesser of the two values."
        },
        # 24. order_steps
        {
            "id": "ch2-q24",
            "type": "order_steps",
            "bloom": "Escalation Lifecycle",
            "prompt": "Order the sequence of events that occurs when a development team repeatedly elevates Eisenhower Position 3 (Urgent, Not Important) over Position 2 (Not Urgent, Important):",
            "instruction": "Drag rows or use ↑ / ↓ buttons to order the progression from initial concession (1) to final blame (4).",
            "items": [
                "Business managers press for an urgent but low-importance feature, and developers cave in, skipping architectural boundaries to ship it fast.",
                "The system's structure becomes increasingly locked into one rigid shape, turning subsequent requests of identical scope into complex jigsaw puzzles.",
                "Year-over-year development costs escalate until a newly requested business change costs more to implement than the benefit it could ever generate.",
                "Business managers become furious at the development team for allowing the software to reach a state where the change is practically impossible."
            ],
            "initial_order": [2, 0, 3, 1],
            "correct_order": [0, 1, 2, 3],
            "overall_explanation": "Caving to Position 3 today guarantees you will be blamed when the system hits economic immutability tomorrow."
        },
        # 25. spot_flaw
        {
            "id": "ch2-q25",
            "type": "spot_flaw",
            "bloom": "Cost Proportional to Shape vs. Scope in JavaScript",
            "prose_mode": false,
            "prompt": "A stakeholder asks for a small-scope change: 'Let users export their invoice in Markdown in addition to PlainText.' Click the ONE line in this JavaScript `InvoiceService` where a rigid shape dependency forces you to modify the core domain class every time a format is added:",
            "instruction": "Click the flawed line of code, then click Check Answer.",
            "lines": [
                {
                    "text": "class Invoice {",
                    "explanation": "Class header is fine."
                },
                {
                    "text": "  constructor(id, lineItems) { this.id = id; this.lineItems = lineItems; }",
                    "explanation": "Domain state initialization is clean."
                },
                {
                    "text": "  total() { return this.lineItems.reduce((s, i) => s + i.amount, 0); }",
                    "explanation": "Pure domain calculation is clean."
                },
                {
                    "text": "  export(type) { if (type === 'text') return `Invoice #${this.id}: $${this.total()}`; throw new Error('Unsupported format'); }",
                    "explanation": "FLAW: Hardcoding presentation format branches inside the core `Invoice` entity couples domain shape to every new export format."
                },
                {
                    "text": "}",
                    "explanation": "Closing brace."
                }
            ],
            "flawed_indices": [3],
            "overall_explanation": "Hardcoding `if (type === 'text')` inside the core entity means every small-scope export request forces intrusive edits to domain code."
        },
        # 26. cloze_typed
        {
            "id": "ch2-q26",
            "type": "cloze_typed",
            "bloom": "Exact Principle Recall",
            "prompt": "Fill in the key terms from Chapter 2's rule on change difficulty:",
            "instruction": "Type the missing words in the two blanks.",
            "template": "When stakeholders change their minds about a feature, the difficulty in making such a change should be proportional only to the {{1}} of the change, and not to the {{2}} of the change.",
            "blanks": [
                {"answer": "scope", "accepted": ["scope", "size"], "placeholder": "size/extent"},
                {"answer": "shape", "accepted": ["shape", "form", "structure"], "placeholder": "geometry"}
            ],
            "overall_explanation": "Scope vs. Shape: good architecture keeps change cost proportional only to scope, never to shape."
        },
        # 27. mcq_multi
        {
            "id": "ch2-q27",
            "type": "mcq_multi",
            "bloom": "Extreme Case Analysis",
            "prompt": "Which of the following conclusions follow directly from Chapter 2's 'examining the extremes' argument? (Select ALL that apply)",
            "instruction": "Select all correct options, then click Check Answer.",
            "options": [
                {
                    "text": "A program that works perfectly today but cannot be changed becomes useless as soon as requirements change.",
                    "explanation": "Correct! Since requirements always change, an unchangeable working program has a very short shelf life."
                },
                {
                    "text": "A program that does not currently work but is easy to change can be made to work and kept working as requirements evolve.",
                    "explanation": "Correct! Ease of change allows you to both fix current defects and adapt to future requirements."
                },
                {
                    "text": "A system becomes practically impossible to change whenever the cost of change exceeds the benefit of change.",
                    "explanation": "Correct! Even if code isn't theoretically immutable, exceeding the benefit threshold makes it economically unchangeable."
                },
                {
                    "text": "Developers should intentionally ship broken code to production to prove that their architecture is easy to change.",
                    "explanation": "Incorrect. The extreme is a logical thought experiment to compare the two values; developers are responsible for keeping BOTH values high."
                }
            ],
            "correct_indices": [0, 1, 2],
            "overall_explanation": "The thought experiment proves which value is more fundamental, while reminding developers that their duty is to keep both values high."
        },
        # 28. js_code
        {
            "id": "ch2-q28",
            "type": "js_code",
            "bloom": "Economic Viability & Shape Penalty Simulator in JavaScript",
            "prompt": "Write a JavaScript function `simulateMultiYearChanges(requests, shapePenaltyFactor)` that models Chapter 2's year-over-year cost growth when an architecture is not shape-agnostic.",
            "instruction": "Given `requests` (an array of `{ name, scopeCost, benefit }`) and `shapePenaltyFactor` (a number >= 1, where `1` is a clean shape-agnostic architecture and `>1` compounds the cost on each subsequent change `i` as `actualCost = Number((scopeCost * Math.pow(shapePenaltyFactor, i)).toFixed(2))`), return `{ completedCount, blockedByCost: [...names], totalSpent }`:\n- If `actualCost <= benefit`, the change is completed and `actualCost` is added to `totalSpent`.\n- If `actualCost > benefit`, the change is practically impossible (Chapter 2): do NOT add to `totalSpent`, and push `request.name` into `blockedByCost`.\n- Round `totalSpent` to 2 decimal places.",
            "starter_code": "function simulateMultiYearChanges(requests, shapePenaltyFactor) {\n  // Model how shape penalties eventually push cost of change above benefit of change\n  \n}",
            "test_cases": [
                {
                    "label": "Rigid Architecture (shapePenaltyFactor = 2.0 blocks later same-scope features)",
                    "call": "simulateMultiYearChanges([{ name: 'Year1-Feature', scopeCost: 1000, benefit: 5000 }, { name: 'Year2-Feature', scopeCost: 1000, benefit: 5000 }, { name: 'Year3-Feature', scopeCost: 1000, benefit: 5000 }, { name: 'Year4-Feature', scopeCost: 1000, benefit: 5000 }], 2)",
                    "expected": {"completedCount": 3, "blockedByCost": ["Year4-Feature"], "totalSpent": 7000}
                },
                {
                    "label": "Clean Shape-Agnostic Architecture (shapePenaltyFactor = 1.0 completes all 4 years at constant cost)",
                    "call": "simulateMultiYearChanges([{ name: 'Year1-Feature', scopeCost: 1000, benefit: 5000 }, { name: 'Year2-Feature', scopeCost: 1000, benefit: 5000 }, { name: 'Year3-Feature', scopeCost: 1000, benefit: 5000 }, { name: 'Year4-Feature', scopeCost: 1000, benefit: 5000 }], 1)",
                    "expected": {"completedCount": 4, "blockedByCost": [], "totalSpent": 4000}
                }
            ],
            "model_answer": "function simulateMultiYearChanges(requests, shapePenaltyFactor) {\n  let completedCount = 0;\n  const blockedByCost = [];\n  let totalSpent = 0;\n  requests.forEach((req, i) => {\n    const actualCost = Number((req.scopeCost * Math.pow(shapePenaltyFactor, i)).toFixed(2));\n    if (actualCost <= req.benefit) {\n      completedCount++;\n      totalSpent = Number((totalSpent + actualCost).toFixed(2));\n    } else {\n      blockedByCost.push(req.name);\n    }\n  });\n  return { completedCount, blockedByCost, totalSpent };\n}",
            "overall_explanation": "In a shape-agnostic architecture (`shapePenaltyFactor = 1`), four equal-scope changes cost $4,000 and all ship; with a 2x shape penalty, costs double each year until Year 4 ($8,000 cost > $5,000 benefit) becomes economically impossible."
        },
        # 29. free_response
        {
            "id": "ch2-q29",
            "type": "free_response",
            "bloom": "Real-World Stakeholder Negotiation",
            "prompt": "A Product Manager tells you: 'We don't have time to decouple the billing module right now—this new promotional badge is urgent for Friday's demo!' Using Chapter 2's Eisenhower Matrix and 'Fight for the Architecture', draft a concise, professional 3–4 sentence response.",
            "instruction": "Write your response in your own words. Click Check Answer for AI evaluation.",
            "placeholder": "Distinguish urgency (Position 3) from importance (Position 2) and explain how protecting the billing boundary keeps future changes affordable...",
            "key_concepts": [
                "Distinguish urgency (Position 3: urgent but less important) from importance (Position 2: architecture is important though never urgent)",
                "Explain that skipping the billing boundary today increases the 'shape' cost of every upcoming feature",
                "Assert your role as an engineering stakeholder safeguarding the system's ability to remain soft and easy to change"
            ],
            "model_answer": "I understand the promotional badge feels urgent for Friday's demo, but in Eisenhower's terms we need to be careful not to elevate an urgent-but-minor UI change (Position 3) above the important structural health of our billing module (Position 2). If we hardcode around the billing boundary today, we lock the system into a rigid shape that will make next month's pricing features exponentially slower and more expensive. As an engineering stakeholder, my job is to keep our software easy to change—so let's keep the clean boundary in place and scope Friday's demo badge so it fits cleanly.",
            "overall_explanation": "Effective developers unabashedly advocate as equal stakeholders, framing architecture in terms of future change cost and business agility."
        },
        # 30. free_response
        {
            "id": "ch2-q30",
            "type": "free_response",
            "bloom": "Mastery Synthesis (Chapters 1 & 2)",
            "prompt": "Connect Chapter 1 and Chapter 2: How does caving in on Chapter 2's 'Second Value' (Architecture) directly produce the empirical graphs in Chapter 1's case study (Figures 1.1–1.5)?",
            "instruction": "Write 4–6 sentences synthesizing both chapters in your own words. Click Check Answer for AI evaluation.",
            "placeholder": "When a team prioritizes urgent behavior (Position 3) over important architecture (Position 2), the system loses its 'softness'...",
            "key_concepts": [
                "Sacrificing the Second Value (Architecture / 'softness') for urgent Behavior makes difficulty proportional to system shape rather than request scope",
                "Each new release becomes a harder jigsaw puzzle, driving developer productivity toward zero (Figure 1.4)",
                "Management hires more staff (Figure 1.1) and swells monthly payroll to $20M (Figure 1.5), while code output flattens (Figure 1.2) and cost per line explodes 40x (Figure 1.3)",
                "Ultimately the cost of change exceeds the benefit of change, stalling or collapsing the business"
            ],
            "model_answer": "When a development team fails to fight for Chapter 2's Second Value (Architecture) and repeatedly elevates urgent-but-unimportant features (Eisenhower Position 3) over structural cleanliness (Position 2), the software loses its 'softness' and locks into a rigid shape. Once change difficulty depends on system shape rather than request scope, every new feature becomes a harder jigsaw puzzle—causing the developer productivity collapse toward zero seen in Chapter 1's Figure 1.4. Executives respond by multiplying headcount (Figure 1.1) and monthly payroll up to $20M (Figure 1.5), yet total output plateaus (Figure 1.2) and cost per line of code explodes 40x (Figure 1.3) until changes cost more than their business benefit.",
            "overall_explanation": "Chapter 2 explains the behavioral and organizational root cause of the economic catastrophe measured in Chapter 1."
        }
    ]

    return {
        "chapter": 2,
        "part": "PART I · Introduction",
        "title": "A Tale of Two Values",
        "subtitle": "Behavior vs. Architecture, proof by extremes, Scope vs. Shape, Eisenhower's Matrix, and fighting for architecture.",
        "description": "30 deep-drilling interactive questions exploring the two values of software, why structure outranks current function, the scope-vs-shape cost driver, Eisenhower's Urgency/Importance matrix, and the developer's duty as a stakeholder.",
        "released_on": "2026-11-26",
        "question_count": len(questions),
        "questions": questions
    }


def main():
    os.makedirs(TESTS_DIR, exist_ok=True)
    ch1 = build_chapter_01()
    ch2 = build_chapter_02()

    ch1_path = os.path.join(TESTS_DIR, "chapter-01.json")
    ch2_path = os.path.join(TESTS_DIR, "chapter-02.json")

    with open(ch1_path, "w", encoding="utf-8") as f:
        json.dump(ch1, f, indent=2, ensure_ascii=False)

    with open(ch2_path, "w", encoding="utf-8") as f:
        json.dump(ch2, f, indent=2, ensure_ascii=False)

    manifest = {
        "book_title": "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
        "author": "Robert C. Martin",
        "total_book_chapters": 34,
        "last_generated_chapter": 2,
        "updated_at": "2026-11-26T07:00:00+01:00",
        "available_tests": [
            {
                "chapter": 1,
                "part": ch1["part"],
                "title": ch1["title"],
                "subtitle": ch1["subtitle"],
                "file": "data/tests/chapter-01.json",
                "question_count": ch1["question_count"],
                "released_on": ch1["released_on"]
            },
            {
                "chapter": 2,
                "part": ch2["part"],
                "title": ch2["title"],
                "subtitle": ch2["subtitle"],
                "file": "data/tests/chapter-02.json",
                "question_count": ch2["question_count"],
                "released_on": ch2["released_on"]
            }
        ]
    }

    manifest_path = os.path.join(DATA_DIR, "tests_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"Generated Chapter 1 ({ch1['question_count']} Qs) & Chapter 2 ({ch2['question_count']} Qs)")


if __name__ == "__main__":
    main()
