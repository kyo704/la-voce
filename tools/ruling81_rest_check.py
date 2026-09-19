# -*- coding: utf-8 -*-
"""★裁定81 の 残り ── ★§4（運営の ナビ）と §8（入れる 順番）（★2026-09-19）

  ★★★§4 は 5つ ── ★幅／まとまり／たたむ／ラベルを 消さない／さがす。
  ★★★§8 は 7つの 順番 ── ★どこまで 入って いるかを 数えます。

  ★★荷は `tools/pack_path.py` が 選びます。★数は 裁定から 読みます
    （★こちらに 写しません ── ★写した 数は 古く なります）。

  ★★較正 ── ★在る ものを 当て、★無い ものを 当てない こと。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_path import 荷  # noqa: E402


def 読む(*みち):
  p = os.path.join(ROOT, *みち)
  return io.open(p, encoding="utf-8").read() if os.path.exists(p) else None


def main():
  裁定 = io.open(os.path.join(荷(), "ruling-81-visual-design.md"),
                 encoding="utf-8").read()
  nav = 読む("lib", "opsNav.js")
  sea = 読む("lib", "opsSearch.js")
  shell = 読む("components", "OpsShell.jsx")
  # ★★★ナビの 本体は `OpsNav.jsx` です（★2026-09-19）。
  #   ★★`OpsShell.jsx` だけ を 見て、★「ラベルを 消して いる」と 出して いました。
  #   ★★★見る 先が 足りない 道具は、★在る ものを 無いと 言います。
  opsnav = 読む("components", "OpsNav.jsx") or ""
  vis = 読む("lib", "visualTokens.js")
  uiv2 = 読む("components", "UiV2.jsx")

  # ★★較正
  assert "## 4 運営の ナビ" in 裁定, "★§4 を 読めて いません"
  assert nav and sea and shell and vis, "★見る ファイルが ありません"
  assert 読む("lib", "アリマセン.js") is None, "★無い ものを 見つけて います"
  # ★★探し方の 較正 ── ★在る ものを 当てる。
  assert re.search(r"clip:", 読む("components", "OpsNav.jsx")), "★ナビの 札を 読めません"
  assert re.search(r"ROSTER_TABLE_AT", 読む("lib", "opsRosterTable.js")), "★境界を 読めません"

  print("=== §4 運営の ナビ ===")

  # ★4-1 幅 ── ★数は 裁定から 読みます。
  展 = int(re.search(r"展開\s*★(\d+)px", 裁定).group(1))
  レ = int(re.search(r"レール\s*★(\d+)px", 裁定).group(1))
  実展 = int(re.search(r"SIDE_WIDTH = (\d+)", nav).group(1))
  実レ = int(re.search(r"RAIL_WIDTH = (\d+)", nav).group(1))
  print("  4-1 幅 …… 展開 %d/%d ／ レール %d/%d %s"
        % (実展, 展, 実レ, レ, "" if (実展, 実レ) == (展, レ) else "★ちがいます"))

  # ★4-2 まとまり
  望 = len(re.findall(r"^ \['", re.search(r"var NAVG = \[(.*?)\];", 裁定, re.S).group(1), re.M))
  実 = len(re.findall(r"\{\s*head:", re.search(
    r"NAV_GROUPS = Object\.freeze\(\[(.*?)\]\);", nav, re.S).group(1)))
  print("  4-2 まとまり …… %d/%d %s" % (実, 望, "" if 実 == 望 else "★ちがいます"))

  # ★4-3 たたむ ── ★手（⌘B）と 自動（表の 画面 ＋ iPad・PCでは しない）
  手 = re.search(r'FOLD_KEY = "(\w)"', nav).group(1)
  自動 = bool(re.search(r"WIDE_SCREENS", nav))
  pc = bool(re.search(r'PC_AT|dev !== "pc"|deviceOf', nav))
  print("  4-3 たたむ …… 手 ⌘%s ／ 表の画面の 一覧 %s ／ PC では 自動に しない %s"
        % (手.upper(), "あり" if 自動 else "★なし", "あり" if pc else "★なし"))

  # ★4-4 たたんでも ラベルを 消さない
  読上 = bool(re.search(# ★★引用符が 間に 入ります（`clip: "rect(0 0 0 0)"`）。
      r"clip:\s*[\"']?rect|srOnly|sr-only|visuallyHidden", nav + shell + opsnav))
  題 = bool(re.search(r"title=\{|aria-label", shell + opsnav))
  print("  4-4 ラベル …… 読み上げに 残す %s ／ 指を 乗せると 名前 %s"
        % ("あり" if 読上 else "★なし", "あり" if 題 else "★なし"))

  # ★4-5 さがす
  開 = re.search(r'OPEN_KEY = "(\w)"', sea).group(1)
  閉 = re.search(r'CLOSE_KEY = "(\w+)"', sea).group(1)
  出分 = bool(re.search(r"searchGroups\(perms\)|function searchGroups\(perms", sea))
  print("  4-5 さがす …… 開く ⌘%s ／ 閉じる %s ／ 役職で 出し分け %s"
        % (開.upper(), 閉, "あり" if 出分 else "★なし"))

  print()
  print("=== §8 入れる 順番（★7つ）===")
  順 = [
    ("1 色の トークン", bool(re.search(r"TOKENS_LIGHT", vis))),
    ("2 文字の 6段", bool(re.search(r"TYPE_STEPS", vis))),
    ("3 表の 貼り付け", bool(re.search(r"TABLE_CLASS", vis))),
    ("4 しるし", bool(読む("lib", "opsIcons.js"))),
    ("5 ナビの たたみ", bool(re.search(r"isRail", nav))),
    ("6 さがす", bool(re.search(r"OPEN_KEY", sea))),
    # ★★★境界は `lib/opsRosterTable.js` が 測って 出します（★§5-4）。
    #   ★★はじめ `CARD_AT|asCards` を 探し、★「ありません」と 出して いました。
    ("7 表と カードの 切り替え",
     bool(re.search(r"TABLE_AT|ROSTER_TABLE_AT",
                    (読む("lib", "opsRosterTable.js") or "")
                    + (読む("lib", "opsPostMatrix.js") or "")))),
  ]
  for 名, 在 in 順:
    print("  %-24s %s" % (名, "あり" if 在 else "★ありません"))
  print()
  print("★足りない もの …… %d件" % len([1 for _, 在 in 順 if not 在]))


if __name__ == "__main__":
  main()
