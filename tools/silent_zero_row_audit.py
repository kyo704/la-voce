# -*- coding: utf-8 -*-
"""★「決まりが 無くて、黙って 0行 成功」── ★同じ 形を さがす。

  ★★2026-09-16、★教室を やめる が 黙って 失敗しました。
    ★★PostgREST の `update` は、★0行に 当たっても 誤りを 返しません。
    ★★`.select()` が 無いと、★呼ぶ 側は 見分けられません。

  ★★この 道具は **紙の 側** だけ を 読みます。
    ★★台帳（grant と policy の 突き合わせ）は、★私には 引けません。
      ★そちらは `supabase/問い-決まりの無い書き込み.sql` を お走らせください。
    ★★だから ここでは 「0行を 見分けられない 書き込み」を 数えます。

  ★★★自分の 抜き出しを 自分で 確かめます（★立ち会いの 決まり）。
    ★★数えた ファイルが 1つも 無ければ、★止まります。
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ["app", "components", "lib"]
SKIP = ("/tests/", "node_modules", ".next")

# ★書き込みの 始まり ── `.from("表")` の あと、★`.update(` / `.insert(` /
#   `.upsert(` / `.delete(` が 来る ところ。
START = re.compile(r'\.from\(\s*"([a-z_]+)"\s*\)')
VERB = re.compile(r'\.(update|insert|upsert|delete)\(')
HAS_SELECT = re.compile(r'\.select\(')


def strip_comments(src):
  """★注記を、★同じ 長さの 空白に 置き換えます（★行が ずれない ように）。"""
  out = []
  i, n = 0, len(src)
  while i < n:
    if src.startswith("//", i):
      j = src.find("\n", i)
      j = n if j < 0 else j
      out.append(" " * (j - i))
      i = j
    elif src.startswith("/*", i):
      j = src.find("*/", i + 2)
      j = n if j < 0 else j + 2
      out.append("".join(c if c == "\n" else " " for c in src[i:j]))
      i = j
    else:
      out.append(src[i])
      i += 1
  return "".join(out)


def files():
  found = []
  for d in DIRS:
    base = os.path.join(ROOT, d)
    for cur, _dirs, names in os.walk(base):
      for name in names:
        if not name.endswith((".js", ".jsx")):
          continue
        path = os.path.join(cur, name)
        if any(s in path for s in SKIP):
          continue
        found.append(path)
  return sorted(found)


def scan(path):
  """★1つの 書き込みを 見ます。★`.select(` が 鎖の 中に あるか。"""
  raw = open(path, encoding="utf-8").read()
  code = strip_comments(raw)
  hits = []
  for m in START.finditer(code):
    table = m.group(1)
    # ★鎖の 終わりを さがします ── ★`;` まで（★ほどほどの 幅で 切ります）。
    tail = code[m.end():m.end() + 600]
    stop = tail.find(";")
    chain = tail if stop < 0 else tail[:stop]
    v = VERB.search(chain)
    if not v:
      continue
    after = chain[v.end():]
    line = code[:m.start()].count("\n") + 1
    hits.append({
      "file": os.path.relpath(path, ROOT),
      "line": line,
      "table": table,
      "verb": v.group(1),
      "sees_rows": bool(HAS_SELECT.search(after)),
      "text": raw.splitlines()[line - 1].strip()[:110],
    })
  return hits


def main():
  paths = files()
  if not paths:
    sys.exit("★止まりました ── 読む ファイルが 1つも ありません。")

  all_hits = []
  for p in paths:
    all_hits.extend(scan(p))

  if not all_hits:
    sys.exit("★止まりました ── 書き込みが 1つも 見つかりません。抜き出しが 壊れて います。")

  blind = [h for h in all_hits if not h["sees_rows"]]
  by_table = {}
  for h in blind:
    by_table.setdefault(h["table"], []).append(h)

  out = []
  w = out.append
  w("# ★「決まりが 無くて、黙って 0行 成功」── ★紙の 側の 一覧")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/silent_zero_row_audit.py`（2026-09-16）")
  w("")
  w("## ★何を 数えたか")
  w("")
  w("- 読んだ ファイル: %d 本（app / components / lib、tests は 除く）" % len(paths))
  w("- 見つけた 書き込み: %d か所" % len(all_hits))
  w("- ★そのうち **行数を 見て いない**もの: %d か所" % len(blind))
  w("- 表の 数: %d" % len(by_table))
  w("")
  w("## ★これが なぜ 危ないか")
  w("")
  w("`update` / `delete` は、★当たる 行が 0でも 誤りを 返しません。")
  w("`.select()` を 付けない 限り、★呼ぶ 側に 0行は 見えません。")
  w("2026-09-16、★教室を やめる が これで 黙って 失敗しました。")
  w("")
  w("★`insert` / `upsert` は 別 です ── ★入らなければ 誤りが 返ります。")
  w("★危ないのは `update` と `delete` です。★下の 表で 分けて います。")
  w("")
  w("## ★表ごと（★あぶない 順 ── update / delete が 先）")
  w("")

  def danger(rows):
    return sum(1 for r in rows if r["verb"] in ("update", "delete"))

  for table in sorted(by_table, key=lambda t: (-danger(by_table[t]), t)):
    rows = by_table[table]
    d = danger(rows)
    w("### `%s` ── %d か所（★update/delete %d）" % (table, len(rows), d))
    w("")
    for r in sorted(rows, key=lambda r: (r["file"], r["line"])):
      mark = "★" if r["verb"] in ("update", "delete") else "　"
      w("- %s`%s` %s:%d" % (mark, r["verb"], r["file"], r["line"]))
      w("  - `%s`" % r["text"])
    w("")

  w("## ★この 一覧で 足りない こと")
  w("")
  w("★これは **紙** です。★台帳では ありません。")
  w("「`.select()` が 無い」と「決まりが 無い」は 別の 話 です ──")
  w("決まりが あって ちゃんと 書けて いる ところも、★ここに 並びます。")
  w("")
  w("★本当に 知りたいのは、")
  w("**`authenticated` に 表の 権利が あって、対応する 決まりが 無い 表**です。")
  w("★それは 台帳に しか ありません。")
  w("`supabase/問い-決まりの無い書き込み.sql` を お走らせください。")
  w("")
  w("★2つを 重ねた ところが、★本当の 危ない 場所 です。")

  body = "\n".join(out) + "\n"
  path = os.path.join(ROOT, "docs/reports/2026-09-16-黙って0行成功の一覧.md")
  lines = body.split("\n")
  # ★2行目に 全体の 丈と 末尾を 置きます（★報告の 決まり）。
  last = [l for l in lines if l.strip()][-1]
  lines[2] = "全%d行 / 末尾は「%s」" % (len(lines) - 1, last)
  open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("書き込み %d / 行数を見ていない %d / 表 %d" % (len(all_hits), len(blind), len(by_table)))


main()
