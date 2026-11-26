#!/usr/bin/env python3
"""Schedules 14 daily 9:00–11:00 a.m. WAT (Africa/Lagos) Google Calendar study blocks."""

import datetime
import json
import subprocess

MANIFEST_PATH = "/home/antigravity/clean-architecture-mastery/chapters/manifest.json"


def main():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    ch_map = {c["chapter"]: c["title"] for c in manifest["chapters"]}
    start_date = datetime.date(2026, 11, 26)

    for day_idx in range(14):
        d = start_date + datetime.timedelta(days=day_idx)
        c1 = day_idx * 2 + 1
        c2 = day_idx * 2 + 2
        t1 = ch_map.get(c1, "")
        t2 = ch_map.get(c2, "")
        summary = f"Clean Architecture Mastery: Chapters {c1} & {c2} (60-Question Drill)"
        desc = (
            f"Daily 2-Chapter Clean Architecture Assessment (30 questions per chapter, 60 total).\n\n"
            f"• Chapter {c1}: {t1}\n"
            f"  Direct Link: https://stefanbtw.github.io/clean-architecture-mastery/#chapter={c1}\n\n"
            f"• Chapter {c2}: {t2}\n"
            f"  Direct Link: https://stefanbtw.github.io/clean-architecture-mastery/#chapter={c2}\n\n"
            f"Modes: Study Mode (instant feedback + explanations + live Gemini AI grading) or Test Mode (timed exam)."
        )
        start_iso = f"{d.isoformat()}T09:00:00+01:00"
        end_iso = f"{d.isoformat()}T11:00:00+01:00"
        cmd = [
            "gcalendar",
            "mutate",
            "create",
            "--summary",
            summary,
            "--description",
            desc,
            "--start",
            start_iso,
            "--end",
            end_iso,
            "--timezone",
            "Africa/Lagos",
            "--json",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        event_id = data.get("id", "OK")
        print(f"Day {day_idx+1:02d} ({d.isoformat()} 09:00-11:00 WAT): Ch {c1:02d} & {c2:02d} -> {event_id}")


if __name__ == "__main__":
    main()
