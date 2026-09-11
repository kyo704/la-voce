#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★memberships.post_id と org_posts を、★ブラウザから 直に 書いて いないか
#
#   ★出どころ 2026-09-11 の お尋ね。
#     ★★「app/api/org/posts/route.js の 外に、★直に 書く 道が あるか」
#     ★★無ければ、★50通りの 10マスは「私が ちがう 道を 試した」で 片づきます。
#
#   ★★字を そのまま 並べます。★言い分を 足しません。
#
#   使い方  python3 tools/direct_post_writes.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
ROUTE = "app/api/org/posts/route.js"

WRITE = re.compile(r"\.(insert|update|upsert|delete)\(")
FROM = re.compile(r'from\("([a-z_]+)"\)')


def sources():
  out = []
  for top in ("components", "lib", "app"):
    for base, _d, files in os.walk(os.path.join(ROOT, top)):
      if "tests" in base:
        continue
      for fn in files:
        if fn.endswith((".js", ".jsx")):
          out.append(os.path.relpath(os.path.join(base, fn), ROOT))
  return sorted(out)


def main():
  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  say("# ★役職（post）を 直に 書く 道が あるか")
  say()
  say("★この 紙は tools/direct_post_writes.py が 書き出します。★手で 書いて いません。")
  say()

  hits = {"post_id": [], "org_posts": [], "memberships（ほか）": []}

  for path in sources():
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
      src = f.read().split("\n")
    for i, line in enumerate(src):
      if not WRITE.search(line):
        continue
      table = None
      for j in range(i, max(-1, i - 4), -1):
        m = FROM.search(src[j])
        if m:
          table = m.group(1)
          break
      if table not in ("memberships", "org_posts"):
        continue
      block = "\n".join(src[max(0, i - 12):i + 7])
      where = "%s:%d" % (path, i + 1)
      inside = path == ROUTE
      admin = "admin.from(" in src[max(0, i - 3):i + 1][-1] or "admin" in "".join(src[max(0, i - 1):i + 1])
      row = (where, line.strip()[:88], "★この 経路の 中" if inside else "★★経路の 外",
             "裏口" if admin else "ふつう")
      if table == "org_posts":
        hits["org_posts"].append(row)
      elif "post_id" in block:
        hits["post_id"].append(row)
      else:
        hits["memberships（ほか）"].append(row)

  for title, rows in hits.items():
    say("## " + title)
    say()
    outside = [r for r in rows if "外" in r[2]]
    if not rows:
      say("★1か所も ありません。")
      say()
      continue
    say("| 場所 | どこ | 行 |")
    say("|---|---|---|")
    for r in rows:
      say("| `%s` | %s | `%s` |" % (r[0], r[2], r[1].replace("|", "\\|")))
    say()
    say("★経路（`%s`）の **外**に ある もの　**%d か所**" % (ROUTE, len(outside)))
    say()

  say("## ★答え")
  say()
  out_post = [r for r in hits["post_id"] if "外" in r[2]]
  out_op = [r for r in hits["org_posts"] if "外" in r[2]]
  if not out_post and not out_op:
    say("★`memberships.post_id` も `org_posts` も、")
    say("★**`%s` の 外から 直に 書いて いる 道は ありません。**" % ROUTE)
    say()
    say("★★だから 50通りの「役職と 所属」10マスは、")
    say("　★★**私が、★画面の 通らない 道を 試した もの**です。")
    say("　★★不具合では ありません。")
  else:
    say("★★外に 道が あります。★下の 行を ご覧ください。")
    for r in out_post + out_op:
      say("- `%s`　`%s`" % (r[0], r[1]))
  say()

  say("## ★★ただし、★別の ことが 見つかりました")
  say()
  others = [r for r in hits["memberships（ほか）"] if "外" in r[2]]
  if others:
    say("★`memberships` の **ほかの 列**を、★ブラウザから 直に 書いて いる 道が")
    say("★**%d か所** あります。" % len(others))
    say()
    for r in others:
      say("- `%s`　`%s`" % (r[0], r[1]))
    say()
    say("★★50通りで、★`memberships` への UPDATE は こう 返って きました ──")
    say("　★`42501　permission denied for table memberships`")
    say()
    say("★★あれは `post_id` を 変えようと した ときの 返事です。")
    say("　★★`role` や `grade_label` にも 同じ ことが 起きるか どうかは、")
    say("　★★**まだ 確かめて いません**。★列ごとの 許しは 列ごとに ちがいます。")
    say()
    say("★★もし 同じなら、★この 2つの 働きは いま 動いて いません ──")
    say("　★「人の 役職（role）を 変える」")
    say("　★「学年の 札（grade_label）を 直す」")
    say("★★確かめる 一手が 要ります。★まだ 何も 直して いません。")
  else:
    say("★ありません。")
  say()

  p = os.path.join(OUT, "2026-09-11-役職を直に書く道があるか.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-11-役職を直に書く道があるか.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
