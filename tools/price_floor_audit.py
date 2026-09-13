#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★12,800 を 全部 数える ── ★1件ずつ、★何を 指すかを 見る
#
#   ★出どころ Opus の 裁定（その20・2026-09-13）
#     ★★学校の 月額の 下限を 12,800円 → 9,800円 に する。
#     ★★けれど 12,800円 には **2つの 意味**が あります ──
#       ★① 学校の 月額の 下限　　　　　　　★← ★直す もの
#       ★② 個人の「一年の よそおい」（年額）★← ★**触らない**
#
#   ★★だから、★数える だけ では 足りません。
#     ★★1件ずつ、★前後の 字を 見て、★どちらかを 見分けます。
#     ★★見分けが つかない ものは「★分かりません」と 出します。★決めません。
#
#   ★★ここでは 1文字も 直しません。★見るだけ です。
#
#   使い方  python3 tools/price_floor_audit.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")

SKIP_DIRS = {".git", "node_modules", ".next", "デスクトップ"}

# ★★自分の 書き出した 紙を、★自分で 数えません。
#   ★★2026-09-13、★数えて いて、★131件 が 257件 に 増えました。
SELF = "2026-09-13-school-price-floor.md"

# ★★外から 来た 下書き。★この家の もの では ありません。
#   ★★0件に する 相手では ないので、★分けて 出します。
OUTSIDE = ("月曜日sonnetに渡すもの/",)
NEEDLE = re.compile(r"12,?800")

# ★★前後の 字に これが あれば「学校の 月額の 下限」と 見ます。
SCHOOL = ["下限", "月額", "最低", "minimum", "floor", "学校", "教室",
          "案A", "案B", "生徒数", "人数"]
# ★★これが あれば「個人の 一年の よそおい（年額）」と 見ます。
PERSON = ["一年の よそおい", "一年のよそおい", "よそおい", "年額", "年間",
          "個人", "annual", "1年"]


def walk():
  for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
    for fn in files:
      if fn.endswith((".png", ".jpg", ".jpeg", ".zip", ".pdf", ".ico", ".woff",
                      ".woff2", ".ttf", ".mp4", ".webp", ".gif")):
        continue
      if fn == SELF:
        continue
      yield os.path.join(base, fn)


def judge(window):
  s = sum(1 for k in SCHOOL if k in window)
  p = sum(1 for k in PERSON if k in window)
  if p > s:
    return "個人・一年の よそおい", "★★触らない"
  if s > p:
    return "学校の 月額の 下限", "★直す もの"
  return "★分かりません", "★★人が 見る"


def main():
  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★12,800 の 全件 ── ★1件ずつ 何を 指すか")
  say()
  say("★この 紙は tools/price_floor_audit.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★1文字も 直して いません。★見ただけ です。")
  say()
  say("## ★見分け方")
  say()
  say("★★前後 200字を 読み、★どちらの 言葉が 多いかで 見ます。")
  say()
  say("- **学校の 月額の 下限** … `%s`" % "` `".join(SCHOOL))
  say("- **個人・一年の よそおい** … `%s`" % "` `".join(PERSON))
  say()
  say("★★同じ 数なら「★分かりません」と 出します。★私が 決めません。")
  say()

  hits = []
  for path in walk():
    try:
      with open(path, encoding="utf-8") as f:
        src = f.read()
    except Exception:                                           # noqa: BLE001
      continue
    if not NEEDLE.search(src):
      continue
    rows = src.split("\n")
    for i, line in enumerate(rows):
      if not NEEDLE.search(line):
        continue
      win = "\n".join(rows[max(0, i - 3):i + 4])
      kind, what = judge(win)
      rel = os.path.relpath(path, ROOT)
      if any(rel.startswith(o) for o in OUTSIDE):
        kind = "★外から 来た 下書き"
        what = "★この家の もの では ない"
      hits.append({
        "path": os.path.relpath(path, ROOT),
        "line": i + 1,
        "text": line.strip()[:110],
        "kind": kind,
        "what": what
      })

  say("## ★全件　%d 件" % len(hits))
  say()
  by_kind = {}
  for h in hits:
    by_kind.setdefault(h["kind"], []).append(h)
  for k in sorted(by_kind):
    say("- **%s** … %d 件" % (k, len(by_kind[k])))
  say()

  for kind in ["学校の 月額の 下限", "★分かりません", "個人・一年の よそおい",
               "★外から 来た 下書き"]:
    rows = by_kind.get(kind, [])
    if not rows:
      continue
    say("## %s　%d 件　── %s" % (kind, len(rows), rows[0]["what"]))
    say()
    say("| 場所 | 行 |")
    say("|---|---|")
    for h in rows:
      say("| `%s:%d` | `%s` |" % (h["path"], h["line"], h["text"].replace("|", "\\|")))
    say()

  say("## ★この 紙が 見て いない こと")
  say()
  say("★★前後の 言葉で 見分けて います。★中身を 読んで いません。")
  say("　★★「★分かりません」は もちろん、★分けられた ものも、")
  say("　★★**触る 前に 1件ずつ お確かめください。**")
  say("★★絵・PDF・zip の 中は 見て いません。")
  say("★★`デスクトップ/` の 下は 別の 帳面なので 外しました。")

  p = os.path.join(OUT, "2026-09-13-school-price-floor.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★docs/reports/2026-09-13-school-price-floor.md（全%d行）" % len(lines))
  print("★12,800 は 全部で %d 件" % len(hits))
  for k in sorted(by_kind):
    print("  %-22s %d 件" % (k, len(by_kind[k])))
  return 0


if __name__ == "__main__":
  sys.exit(main())
