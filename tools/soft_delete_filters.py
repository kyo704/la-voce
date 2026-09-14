#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★消した ものを 拾い直して いる ところを 探す（★No.014 の 下調べ）。

  ★出どころ 2026-09-14、★坂本さん
    ★「一覧を 作る ところ すべてを 調べ、★まとめて 直す」

  ★★きっかけ ── ★消した 曲が、★読み直すと 戻って いました。
    ★ノートは 行を 消しません。★`deleted_at` を 入れるだけ です。
    ★★一覧を 作る ところが、★それを 見て いませんでした。

  ★★だから 2つの ことを 数えます。
    ★① 台帳に 尋ねる ところ … `.from("表").select(...)` に
       `deleted_at` の しぼりが あるか
    ★② 手もとで しぼる ところ … `.filter(...)` `.map(...)` が
       `deleted_at` を 見て いるか

  ★★どの 表が 論理削除かを 先に 決めます。
    ★`deleted_at` を 書いて いる 表 ＝ 論理削除の 表 です。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = []
for d in ("components", "lib", "app"):
  for root, dirs, files in os.walk(os.path.join(ROOT, d)):
    dirs[:] = [x for x in dirs if x not in ("tests", "node_modules")]
    for f in files:
      if f.endswith((".js", ".jsx")):
        SRC.append(os.path.relpath(os.path.join(root, f), ROOT))
SRC.sort()

# ★★① どの 表が deleted_at を 使うか
soft = {}
for rel in SRC:
  raw = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
  for m in re.finditer(r'from\("([a-z_]+)"\)\s*\.update\(\{[^}]*deleted_at', raw):
    soft.setdefault(m.group(1), []).append(rel)

# ★★人の 書いた ものを しまう 表 だけを 見ます。
#   ★★`profiles` と `account_deletions` の deleted_at は、★退会の しくみです。
#     ★★自分の 1行を 引く ところに、★この しぼりは 要りません。
#     ★★入れると 退会の 取り消し（30日）が 働かなく なります。
#   ★★はじめの 数えは これを 分けて おらず、★21件の うち 20件が
#     ★`profiles` でした。★読む 人を 迷わせます。
SKIP = {"profiles", "account_deletions"}
soft = {k: v for k, v in soft.items() if k not in SKIP}
print("★人の 書いた ものを しまう 表（★deleted_at を 入れる）: " + str(sorted(soft)))
print("　★のけた 表（退会の しくみ）: " + str(sorted(SKIP)))

# ★★② 読む ところ
reads = []
for rel in SRC:
  raw = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
  lines = raw.split("\n")
  for m in re.finditer(r'from\("([a-z_]+)"\)\s*\n?\s*\.select\(', raw):
    tbl = m.group(1)
    if tbl not in soft:
      continue
    ln = raw[:m.start()].count("\n") + 1
    # ★★この 問い合わせの 終わりまでを 見ます（★次の await か ; まで）。
    seg = raw[m.start():m.start() + 700]
    seg = seg.split(";")[0]
    has = ("deleted_at" in seg)
    reads.append({"file": rel, "line": ln, "tbl": tbl, "ok": has,
                  "text": lines[ln - 1].strip()[:76]})

print("\n★論理削除の 表を 読む ところ: " + str(len(reads)))
ng = [r for r in reads if not r["ok"]]
for r in reads:
  print(("  ✓ " if r["ok"] else "  ✗ ") + r["file"] + ":" + str(r["line"])
        + "  " + r["tbl"])

# ★★③ 手もとで しぼる ところ
#   ★★ノートは 一度 読んで 端末に 置き、★画面ごとに しぼって います。
#     ★★だから 台帳の しぼりだけ 見ても 足りません。
local = []
for rel in SRC:
  raw = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
  for i, line in enumerate(raw.split("\n")):
    if line.strip().startswith("//") or line.strip().startswith("*"):
      continue
    if not re.search(r'(myNotes|notes)\s*\.\s*(filter|find|some|map)\(', line):
      continue
    # ★★見本の 言い回しを 並べる ところ（★TT_COPY.notes など）は、
    #   ★台帳の 行では ありません。★のけます。
    if re.search(r'[A-Z_]+_?COPY\.notes|COPY\.notes', line):
      continue
    local.append({"file": rel, "line": i + 1, "ok": "deleted_at" in line,
                  "text": line.strip()[:92]})

print("\n★手もとで ノートを しぼる ところ: " + str(len(local)))
lng = [x for x in local if not x["ok"]]
for x in local:
  print(("  ✓ " if x["ok"] else "  ✗ ") + x["file"] + ":" + str(x["line"]))
  if not x["ok"]:
    print("        " + x["text"])

L = []
L.append("# 消した ものを 拾い直して いる ところ")
L.append("__LINE2__")
L.append("")
L.append("★出どころ 2026-09-14、★坂本さん「一覧を 作る ところ すべてを 調べよ」")
L.append("")
L.append("## まとめ")
L.append("")
L.append("- 論理削除の 表 … " + "、".join("`" + t + "`" for t in sorted(soft)))
L.append("- 台帳に 尋ねる ところ … " + str(len(reads)) + "件。"
         + "★しぼりが 無い もの **" + str(len(ng)) + "件**")
L.append("- 手もとで しぼる ところ … " + str(len(local)) + "件。"
         + "★`deleted_at` を 見て いない もの **" + str(len(lng)) + "件**")
L.append("")
L.append("## 台帳に 尋ねる ところ")
L.append("")
L.append("| | 置き場所 | 表 |")
L.append("|---|---|---|")
for r in reads:
  L.append("| " + ("✓" if r["ok"] else "✗") + " | `" + r["file"] + ":"
           + str(r["line"]) + "` | `" + r["tbl"] + "` |")
L.append("")
L.append("## 手もとで しぼる ところ")
L.append("")
L.append("| | 置き場所 | 字 |")
L.append("|---|---|---|")
for x in local:
  L.append("| " + ("✓" if x["ok"] else "✗") + " | `" + x["file"] + ":"
           + str(x["line"]) + "` | `" + x["text"].replace("|", "\\|")[:64] + "` |")
L.append("")
L.append("## ★2026-09-14 の 訂正")
L.append("")
L.append("★★前の 便で「一覧の しぼりに `!n.deleted_at` が 欠けて いる」と")
L.append("　★申し上げました。★**それは 誤りでした。**")
L.append("")
L.append("★★`components/VocalTracker.jsx:9931` の `fetchNotes` は、")
L.append("　★① `.is(\"deleted_at\", null)` で すでに しぼって います。")
L.append("　★② `deleted_at` を **読み出して すら いません**（★select の 並びに 無い）。")
L.append("")
L.append("★★だから 手もとの `myNotes` の 行に `deleted_at` は 付いて いません。")
L.append("　★`!n.deleted_at` は **いつも 真** です。★足しても 何も 変わりません。")
L.append("")
L.append("★★曲が 戻る 本当の 理由は、★まだ 分かって いません。")
L.append("　★残る 筋は 次の 2つです ──")
L.append("")
L.append("- `repertoire`（`lib/repertoireLog.js`）は **`entries` から 作られます**。")
L.append("  ★消す ときは `entries.activities` から 名前を 外して 書き戻します。")
L.append("  ★★外し そこねた 日が あれば、★読み直すと 戻ります。")
L.append("  ★`findAffectedDatesForRepertoire` は、★手もとに 読み込んだ 日しか 見ません。")
L.append("- 旧い 列 `entries.repertoire` から、★読むとき 1件 作り直す 道が あります")
L.append("  （★`migrateLegacyToActivities`・`components/VocalTracker.jsx:7926` の 注記）。")
L.append("")
L.append("★★どちらも、★動かして 確かめないと 決められません。")
L.append("　★いまの 手もとでは アプリを 動かせません（★`.env.local` が ありません）。")
L.append("")
L.append("## この 数えが 見て いない こと")
L.append("")
L.append("- 字の 並びだけ を 見ます。★動かして いません。")
L.append("- 台帳の しぼりは、★`.select(` から 次の `;` までを 見ます。")
L.append("  ★行を またいで 組み立てる 問い合わせは 取りこぼします。")
L.append("- 手もとの しぼりは、★`notes` `rows` `list` と 名の 付く ものだけです。")

body = "\n".join(L)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__", "全" + str(len(body.split("\n"))) + "行 / 末尾は「"
                    + last + "」")
out = os.path.join(ROOT, "docs", "reports", "2026-09-14-soft-delete-filters.md")
io.open(out, "w", encoding="utf-8").write(body + "\n")
print("\n→ " + out)
