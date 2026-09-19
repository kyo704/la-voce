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

  # ★★★較正 ── ★必ず 使われて いる ものを、★眠って いると 言わない こと。
  #   ★★はじめ、★「無い 名を 当てない」だけ を 見て いました。
  #     ★★それでは、★ぜんぶを 眠りと 言う 道具でも 通ります。
  assert "createClient" in 全文, "★読めて いません"
  assert "アリマセンヨ" not in 全文, "★無い ものを 当てて います"
  for 当 in ["HIDE_LINE", "TABLE_CLASS", "cameCount"]:
    よそ = [g for g, s in みな.items()
            if not g.startswith("lib/") and re.search(r"\b%s\b" % 当, s)]
    assert よそ, "★使われて いる %s を 見つけられません" % 当

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

  # ★★全部の 数（★割合を 出す ため）。
  総 = 0
  for f, 本 in lib.items():
    総 += len(re.findall(r"^export (?:const|function) ", 本, re.M))

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

  # ★★覚え書きに します（★数だけでは 次の 人に 伝わりません）。
  import datetime
  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-N1の棚卸し.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as g:
    g.write("# ★N-1 の 棚卸し ── ★書いた ものは 読まれて いるか\n\n")
    g.write("★%s ／ ★`tools/n1_check.py` が 書きました。\n\n" % 今日)
    g.write("★★★見つかった もの が すべて 誤り では ありません。\n")
    g.write("★★「これから 使う」ものも あります。★消して いません。\n\n")
    g.write("## ★① 取り寄せられて いない `export`\n\n")
    g.write("★`lib/` の `export` …… **%d** ／ その うち よそから 呼ばれて いない …… **%d**\n\n"
            % (総, len(ねむり)))
    多 = {}
    for f, _ in ねむり:
      多[f] = 多.get(f, 0) + 1
    g.write("| ファイル | 眠って いる 数 |\n|---|---|\n")
    for f, n in sorted(多.items(), key=lambda x: -x[1])[:20]:
      g.write("| `%s` | %d |\n" % (f, n))
    g.write("\n## ★② 呼ばれて いない `handle…`\n\n")
    for f, 名 in 死:
      g.write("- `%s` …… `%s`\n" % (f, 名))
    if not 死:
      g.write("★ありません。\n")
    g.write("\n## ★この 数の 読み方\n\n")
    g.write("★★見張り（`components/tests/`）から 呼ばれて いる ものは、★使われて いる と 数えます。\n")
    g.write("★★`lib/tokens.js` は 外して います（★色の 名は 一覧 です）。\n")
    g.write("★★★`export` を 消すかどうかは、★1つずつ 見て から です。\n")
  print("REPORT: %s" % os.path.relpath(みち, ROOT))


if __name__ == "__main__":
  main()
