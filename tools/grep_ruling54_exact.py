#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★Opus が 名指しした 6語を、★家の 中 ぜんぶで 探します。

  ★★出どころ　Opus（★2026-09-16）──
    「★リポジトリ全体（アプリ本体・docs/・特商法ページ）で
      ★以下を 検索し、★file:line で 全て 報告して ください。★まだ 直さない こと。
      ★「束に なって」「束になって」「二重には」「調べるの 束」
      ★「名簿から 外れる」「名簿から外れる」」

  ★★前の 道具（ruling54_sweep.py）は **考え**を 探しました。
    ★★こちらは **語**を そのまま 探します。★言い換えません。★広げません。
      ★★2つ 要る わけ ── ★あちらは 取りこぼしを 拾い、
        ★こちらは「頼まれた とおりに 数えた」ことを 示します。

  ★★自分の 出した 紙は 読みません（★2026-09-16 に 1度 尻尾を 噛みました）。
"""

import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-6語のありか.md")

WORDS = ["束に なって", "束になって", "二重には", "調べるの 束",
         "名簿から 外れる", "名簿から外れる"]

SKIP_DIR = {".git", "node_modules", ".next", "dist", "build", ".vercel",
            "capacitor-www", "ios"}
EXT = {".js", ".jsx", ".ts", ".tsx", ".md", ".txt", ".html", ".sql", ".json", ".css"}

# ★★この 道具と、★きょうの 調べの 紙は 読みません。★自分を 数えない ため。
SELF = {os.path.realpath(OUT),
        os.path.realpath(__file__),
        os.path.realpath(os.path.join(ROOT, "tools", "ruling54_sweep.py")),
        os.path.realpath(os.path.join(
          ROOT, "docs", "reports", "2026-09-16-裁定その54の反映漏れ.md")),
        os.path.realpath(os.path.join(
          ROOT, "docs", "reports", "2026-09-16-プランの画面が空白.md"))}

hits = []
read = 0
for dp, dns, fns in os.walk(ROOT):
  dns[:] = [d for d in dns if d not in SKIP_DIR and not d.startswith(".")]
  for fn in fns:
    if os.path.splitext(fn)[1].lower() not in EXT:
      continue
    p = os.path.join(dp, fn)
    if os.path.realpath(p) in SELF:
      continue
    try:
      s = io.open(p, encoding="utf-8", errors="ignore").read()
    except Exception:
      continue
    read += 1
    if not any(w in s for w in WORDS):
      continue
    for i, line in enumerate(s.split("\n"), 1):
      for w in WORDS:
        if w in line:
          hits.append((w, os.path.relpath(p, ROOT), i, line.strip()))

if read == 0:
  print("★★1つも 読めませんでした。★止まります。")
  sys.exit(1)


def kind(rel):
  if rel.startswith(("app/", "components/", "lib/")):
    return "★本番に 出ます"
  if rel.startswith("app/legal"):
    return "★特商法など"
  if "pack-final" in rel:
    return "★見本（正）"
  if "docs/opus" in rel or "_before" in rel:
    return "見本の 控え"
  if rel.startswith(("docs/reports", "docs/records")):
    return "記録（直しません）"
  if rel.startswith("docs/"):
    return "書きもの"
  return "その他"


L = []
A = L.append
A("# 6語の ありか")
A("")
A("★出どころ　Opus（2026-09-16）")
A("★**まだ 直して いません。** 言い換えも して いません。")
A("")
A("## 探した 語（6つ・そのまま）")
A("")
for w in WORDS:
  A("・「%s」" % w)
A("")
A("★読んだ 紙 … %d 枚（★家の 中だけ）" % read)
A("")
A("## 見つかった ところ（%d 件）" % len(hits))
A("")
if not hits:
  A("★ありません。")
else:
  A("| 語 | どこ | 行 | どういう 紙か |")
  A("|---|---|---|---|")
  for w, rel, i, line in hits:
    A("| %s | `%s` | %d | %s |" % (w, rel, i, kind(rel)))
  A("")
  A("### 中身")
  A("")
  cur = None
  for w, rel, i, line in hits:
    if (rel, i) != cur:
      cur = (rel, i)
      A("**`%s:%d`**　%s" % (rel, i, kind(rel)))
      A("")
      A("```")
      A(line[:300])
      A("```")
      A("")

A("## 紙の 種類ごと")
A("")
g = {}
for w, rel, i, line in hits:
  g.setdefault(kind(rel), set()).add(rel)
A("| どういう 紙か | 紙の 数 |")
A("|---|---|")
for k in sorted(g):
  A("| %s | %d |" % (k, len(g[k])))
A("")
live = sorted(g.get("★本番に 出ます", []))
A("### ★本番に 出る 紙（%d）" % len(live))
A("")
if not live:
  A("★ありません。")
for x in live:
  A("・`%s`" % x)
A("")
A("## 特商法の ページ")
A("")
tk = [x for w, x, i, l in hits if x.startswith("app/legal")]
A("★" + ("見つかりました: " + ", ".join(sorted(set(tk))) if tk else "**ありません。**"))
A("")
A("★★直して いません。★ご指示を お待ちします。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("FILES_READ: %d" % read)
print("HITS: %d" % len(hits))
for w in WORDS:
  print("  「%s」: %d" % (w, len([1 for x in hits if x[0] == w])))
print("--- file:line ---")
for w, rel, i, line in hits:
  print("%s:%d  %s  [%s]" % (rel, i, w, kind(rel)))
