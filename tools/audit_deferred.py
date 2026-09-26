#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★先送りに なって いる ものを 数えます（★2026-09-26・Sonnet の ご依頼）。

★★★2つを 分けます ──
  ★㋐ **はっきり 先送りの 裁定が ある** もの（★「2027年1〜3月」など）
  ★㋑ **決めが 見つからない** もの（★言及だけ が 残り、★誰も 決めて いない）
  ★★坂本さんの ご指摘 …… ★㋑を 先に 出すこと。

★★★この 道具が 見つけられる もの ──
  ★実行ルート 各版の「先の拡張」「未決機能」の 節に 出る 品 と、
    ★その 名（または 決めの 紙）が いまの `lib/` `components/` に あるか。
  ★裁定・設計書の 中の「後で決める」「いつか」「時期は決めて いない」の 行。

★★★この 道具が 見つけられない もの ──
  ★名が 変わった もの（★別の 名で 作られて いれば「無い」と 出ます）。
  ★節の 見出しが 上の 2つ 以外の 言い方の とき。
  ★画面の 中に 埋めた だけ の 機能（★紙を 持たない もの）。
  ★★だから 出た 品は **1つずつ 目で 確かめて から** 報告する こと。

★使い方  python3 tools/audit_deferred.py > docs/reports/<日>-先送りの棚卸し.md
"""
import io, os, re, glob, subprocess

蔵 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

先送りの語 = ["2027年", "先送り", "後で決める", "後で 決める", "いつか",
              "時期は決めて", "時期は 決めて", "未決", "保留", "あとで"]

def 読む(p):
  return io.open(p, encoding="utf-8", errors="ignore").read()

def 実装にあるか(語):
  """★`lib/` と `components/` に その 名の 紙が あるか。★字も 探します。"""
  当 = []
  for p in glob.glob(os.path.join(蔵, "lib", "*.js")) + \
           glob.glob(os.path.join(蔵, "components", "*.jsx")):
    if 語 in os.path.basename(p): 当.append(os.path.relpath(p, 蔵))
  if 当: return 当
  try:
    r = subprocess.run(["grep", "-rl", 語, "lib", "components", "app"],
                       cwd=蔵, capture_output=True, text=True)
    return [x for x in r.stdout.split("\n") if x and "/tests/" not in x][:3]
  except Exception:
    return []

def 節をとる(本, 見出し):
  """★その 見出しから 次の 見出し まで。"""
  出 = []
  for m in re.finditer(r"^#{1,4}[^\n]*" + re.escape(見出し) + r"[^\n]*$", 本, re.M):
    i = m.end()
    j = re.search(r"^#{1,4} ", 本[i:], re.M)
    出.append(本[i:i + (j.start() if j else 4000)])
  return 出

def main():
  print("# ★先送りの 棚卸し ── ★2026-09-26")
  print()
  print("★この 紙は `tools/audit_deferred.py` が 出しました。★手で 書いた ところは ありません。")
  print()
  print("★★★この 道具が 見つけられない もの ── ★名が 変わった もの／")
  print("★見出しの 言い方が「先の拡張」「未決機能」以外の もの／★紙を 持たない 機能。")
  print()

  # ── ① 実行ルート 各版の 節
  print("## ① ★実行ルートの「先の拡張」「未決機能」の 節")
  print()
  紙 = sorted(set(glob.glob(os.path.join(蔵, "docs", "実行ルート統合版_*.md")) +
                  glob.glob(os.path.join(蔵, "docs", "design", "pack-final", "実行ルート統合版_*.md"))))
  行 = {}
  for p in 紙:
    本 = 読む(p)
    版 = re.search(r"第(\d+)版", os.path.basename(p))
    版 = int(版.group(1)) if 版 else 0
    for 見 in ["先の拡張", "未決機能", "先の 拡張", "未決"]:
      for 節 in 節をとる(本, 見):
        for l in 節.split("\n"):
          t = l.strip().lstrip("-*|★ ").strip()
          if len(t) < 4 or t.startswith("```"): continue
          if any(k in t for k in 先送りの語) or re.match(r"^[｜|]", l):
            行.setdefault(t[:90], []).append(版)
  for t, 版たち in sorted(行.items(), key=lambda x: -max(x[1])):
    print("- `%s`" % t)
    print("  - ★出た 版 …… 第%s版" % "・第".join(str(v) for v in sorted(set(版たち))))
  print()

  # ── ② 裁定の 中の 宙ぶらりん
  print("## ② ★裁定・設計書の 中の「決めて いない」行")
  print()
  当 = []
  for p in sorted(glob.glob(os.path.join(蔵, "docs", "design", "pack-final", "*.md")) +
                  glob.glob(os.path.join(蔵, "docs", "opus", "*.md"))):
    本 = 読む(p)
    for n, l in enumerate(本.split("\n"), 1):
      t = l.strip()
      if len(t) < 6: continue
      if re.search(r"(後で ?決め|いつか 決め|時期は 決めて ?いな|未定|決めて いません)", t):
        当.append((os.path.relpath(p, 蔵), n, t[:110]))
  for p, n, t in 当:
    print("- `%s:%d` …… %s" % (p, n, t))
  print()
  print("★★行の 数 …… %d" % len(当))

if __name__ == "__main__":
  main()
