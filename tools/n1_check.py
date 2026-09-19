# -*- coding: utf-8 -*-
"""★N-1 の 決め ── ★書いた 値は 読まれて いるか／作った 関数は 呼ばれて いるか（★2026-09-19）

  ★★★坂本さんの お決め（★N-1 RULE）──
    ★「書き込んで いる 値は 必ず どこかで 読まれて いるか。
     ★作った 関数は 必ず どこかから 呼ばれて いるか。」

  ★★★数えるのは 2つ です。
    ①`lib/*.js` の `export` の うち、★どこからも 取り寄せられて いない もの
    ②`components/*.jsx` の `async function handle…` の うち、★呼ばれて いない もの

  ★★★見つかった もの が すべて 誤り では ありません。
    ★★「これから 使う」ものも あります。★一覧を 出すだけ です。★消しません。

  ★★較正 ── ★必ず 呼ばれて いる ものを 当て、★無い 名を 当てない こと。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def 読む(みち):
  return io.open(みち, encoding="utf-8").read()


def 集める(場所, 拡張):
  出 = {}
  for base, _, files in os.walk(os.path.join(ROOT, 場所)):
    if "node_modules" in base:
      continue
    for f in files:
      if f.endswith(拡張):
        p = os.path.join(base, f)
        出[os.path.relpath(p, ROOT)] = 読む(p)
  return 出


def main():
  lib = 集める("lib", ".js")
  comp = 集める("components", ".jsx")
  app = 集める("app", ".js")
  みな = dict(lib)
  みな.update(comp)
  みな.update(app)
  全文 = "\n".join(みな.values())

  # ★★較正
  assert "createClient" in 全文, "★読めて いません"
  assert "アリマセンヨ" not in 全文, "★無い ものを 当てて います"

  print("=== ①取り寄せられて いない `export`（lib）===")
  ねむり = []
  for f, 本 in sorted(lib.items()):
    if f.endswith("tokens.js"):
      continue
    for m in re.finditer(r"^export (?:const|function) ([A-Za-z_$][\w$]*)", 本, re.M):
      名 = m.group(1)
      # ★★自分の ファイル の 外で 呼ばれて いるか。
      よそ = [g for g, t in みな.items()
              if g != f and re.search(r"\b%s\b" % re.escape(名), t)]
      if not よそ:
        ねむり.append((f, 名))
  for f, 名 in ねむり:
    print("  %-34s %s" % (f, 名))
  print("  …… %d件" % len(ねむり))

  print()
  print("=== ②呼ばれて いない `handle…`（components）===")
  死 = []
  for f, 本 in sorted(comp.items()):
    for m in re.finditer(r"(?:async )?function (handle[A-Z]\w*)", 本):
      名 = m.group(1)
      回 = len(re.findall(r"\b%s\b" % re.escape(名), 本))
      よそ = sum(len(re.findall(r"\b%s\b" % re.escape(名), t))
                 for g, t in みな.items() if g != f)
      if 回 <= 1 and よそ == 0:
        死.append((f, 名))
  for f, 名 in 死:
    print("  %-34s %s" % (f, 名))
  print("  …… %d件" % len(死))


if __name__ == "__main__":
  main()
