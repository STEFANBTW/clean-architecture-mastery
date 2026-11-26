#!/usr/bin/env python3
"""One-time PDF parser for Clean Architecture into per-chapter Markdown files."""

import json
import os
import re
import pymupdf

PDF_PATH = "/home/antigravity/clean-architecture-mastery/source/clean_architecture.pdf"
OUT_DIR = "/home/antigravity/clean-architecture-mastery/chapters"


def clean_page_text(text: str) -> str:
    # Normalize line endings and ligatures
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\ufb01", "fi").replace("\ufb02", "fl")
    text = re.sub(r"[ \t]+\n", "\n", text)
    # Remove isolated page numbers on their own lines at top/bottom
    lines = text.split("\n")
    cleaned = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped in ("WOW! eBook", "www.wowebook.org"):
            continue
        if (i < 2 or i >= len(lines) - 2) and re.fullmatch(r"\d{1,3}", stripped):
            continue
        cleaned.append(line)
    text = "\n".join(cleaned)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return s[:60]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    doc = pymupdf.open(PDF_PATH)
    toc = doc.get_toc()

    # Track parts and chapter boundaries
    boundaries = []
    current_part = ""
    for lvl, title, page in toc:
        if lvl == 1:
            if title.startswith("PART "):
                current_part = title.strip()
            boundaries.append({"level": 1, "title": title.strip(), "page": page, "part": current_part})
        elif lvl == 2:
            boundaries.append({"level": 2, "title": title.strip(), "page": page, "part": current_part})

    manifest = {
        "book_title": "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
        "author": "Robert C. Martin",
        "total_chapters": 0,
        "chapters": [],
    }

    for idx, entry in enumerate(boundaries):
        m = re.match(r"^Chapter\s+(\d+)\s+(.+)$", entry["title"])
        if not m:
            continue
        chap_num = int(m.group(1))
        chap_title = m.group(2).strip()
        start_page = entry["page"]  # 1-indexed
        if idx + 1 < len(boundaries):
            end_page = boundaries[idx + 1]["page"] - 1
        else:
            end_page = len(doc)

        # Extract text across [start_page, end_page]
        pages_md = []
        for p in range(start_page - 1, min(end_page, len(doc))):
            raw = doc[p].get_text("text")
            cleaned = clean_page_text(raw)
            if cleaned:
                pages_md.append(cleaned)

        full_text = f"# Chapter {chap_num}: {chap_title}\n\n"
        full_text += f"*{entry['part']}*\n\n---\n\n"
        full_text += "\n\n".join(pages_md) + "\n"

        filename = f"chapter-{chap_num:02d}.md"
        filepath = os.path.join(OUT_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(full_text)

        word_count = len(full_text.split())
        manifest["chapters"].append({
            "chapter": chap_num,
            "part": entry["part"],
            "title": chap_title,
            "slug": f"chapter-{chap_num:02d}-{slugify(chap_title)}",
            "file": f"chapters/{filename}",
            "start_page": start_page,
            "end_page": end_page,
            "word_count": word_count,
        })

    manifest["total_chapters"] = len(manifest["chapters"])
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Extracted {manifest['total_chapters']} chapters to {OUT_DIR}")
    for c in manifest["chapters"][:6]:
        print(f"  Ch {c['chapter']:02d} (pp. {c['start_page']}-{c['end_page']}, {c['word_count']} words): {c['title']}")
    print("  ...")
    for c in manifest["chapters"][-3:]:
        print(f"  Ch {c['chapter']:02d} (pp. {c['start_page']}-{c['end_page']}, {c['word_count']} words): {c['title']}")


if __name__ == "__main__":
    main()
