#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★「出す か どうか」と「止める か どうか」が 分かれ得る 組
#
#   ★出どころ 2026-09-13。★学部長に「役職を 変える」の 札が 出て、
#     ★押すと サーバが 403 で 断って いました。★押せない 札です。
#
#   ★★探し方
#     ★① 画面の 出し分けに 使われて いる 判じ（may…／can…）を 集める
#     ★② その 判じが、★守りの 側（API の 門・台帳の 決まり）でも
#        ★**同じ 名前で** 使われて いるか を 見る
#     ★★同じ 名前で 両方に 出て いれば、★1つの 決めごとです。★分かれません。
#     ★★片方にしか 無ければ、★分かれ得ます。★そこを 並べます。
#
#   ★★決めません。★並べる だけ です。
#
#   使い方  python3 tools/shown_vs_enforced.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")

SHOW_DIRS = ["components"]
GUARD_DIRS = ["app/api", "supabase"]
LIB = "lib"

NAME = re.compile(r"\b((?:may|can)[A-Z][A-Za-z]*)\b")


def scan(dirs, exts=(".js", ".jsx", ".sql")):
  found = {}
  for top in dirs:
    base = os.path.join(ROOT, top)
    if not os.path.isdir(base):
      continue
    for d, ds, fs_ in os.walk(base):
      ds[:] = [x for x in ds if x != "node_modules" and x != "tests"
               and not x.startswith(".")]
      for fn in fs_:
        if not fn.endswith(exts):
          continue
        rel = os.path.relpath(os.path.join(d, fn), ROOT)
        try:
          with open(os.path.join(d, fn), encoding="utf-8") as f:
            src = f.read()
        except Exception:                                       # noqa: BLE001
          continue
        for m in NAME.finditer(src):
          found.setdefault(m.group(1), set()).add(rel)
  return found


def main():
  show = scan(SHOW_DIRS, (".jsx", ".js"))
  guard = scan(GUARD_DIRS, (".js", ".sql"))
  lib = scan([LIB], (".js",))

  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★「出す」と「止める」が 分かれ得る 組")
  say()
  say("★この 紙は tools/shown_vs_enforced.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★出どころ 2026-09-13 ── ★学部長に「役職を 変える」の 札が 出て、")
  say("　★押すと サーバが 403 で 断って いました。★押せない 札です。")
  say()
  say("★★**決めて いません。** ★並べた だけ です。")
  say()

  both, only_show, only_guard = [], [], []
  for k in sorted(set(list(show) + list(guard))):
    if k in show and k in guard:
      both.append(k)
    elif k in show:
      only_show.append(k)
    else:
      only_guard.append(k)

  say("## ★数")
  say()
  say("- 画面にも 守りにも 出る　**%d**（★1つの 決めごと。分かれません）" % len(both))
  say("- **画面にだけ 出る　%d**（★★分かれ得ます）" % len(only_show))
  say("- 守りにだけ 出る　**%d**" % len(only_guard))
  say()

  say("## ★★画面にだけ 出る もの（★分かれ得ます）")
  say()
  say("| 判じ | 画面 | lib に あるか |")
  say("|---|---|---|")
  for k in only_show:
    where = "、".join(sorted(show[k])[:2])
    say("| `%s` | %s | %s |" % (k, where[:54], "あり" if k in lib else "—"))
  say()
  say("★★「lib に あり」なら、★決めごとは 1か所に あります。")
  say("　★★それでも、★守りの 側が 同じ 判じを 使って いなければ 分かれます。")
  say("　★★1つずつ、★守りが 何を 見て いるかを お確かめください。")
  say()

  say("## ★画面にも 守りにも 出る もの")
  say()
  for k in both:
    say("- `%s`　画面 %s ／ 守り %s"
        % (k, "、".join(sorted(show[k])[:1]), "、".join(sorted(guard[k])[:1])))
  say()

  say("## ★すでに 分かって いる 1件（★今日 直した もの）")
  say()
  say("- `mayEditRoster` が「名簿を 直す」と「役職を 変える」を 兼ねて いました。")
  say("  ★★学部長は `meibo` を 持つので 札が 出ました。")
  say("  ★★`post` は 持たないので、★サーバが 403 で 断りました。")
  say("  ★★2026-09-13 に `mayChangePostOf` へ 分けました。")
  say()

  say("## ★この 紙が 見て いない こと")
  say()
  say("★★名前が 同じかどうかを 見て います。★中身は 見て いません。")
  say("　★★同じ 名前でも、★渡す ものが ちがえば 答えは 変わります。")
  say("　★★2026-09-13 の 例 ── ★`gate` が できことか 名前の ちからかで 変わりました。")
  say("★★台帳の 決まり（RLS）は 別です ──")
  say("　★docs/reports/2026-09-13-role-dependent-policies.md")

  p = os.path.join(OUT, "2026-09-13-出すと止めるが分かれ得る組.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("docs/reports/2026-09-13-出すと止めるが分かれ得る組.md  全%d行" % len(lines))
  print("両方 %d ／ 画面だけ %d ／ 守りだけ %d" % (len(both), len(only_show), len(only_guard)))
  print()
  print("★★画面にだけ 出る もの:")
  for k in only_show:
    print("  " + k + ("  （lib に あり）" if k in lib else ""))
  return 0


if __name__ == "__main__":
  sys.exit(main())
