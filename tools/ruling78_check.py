# -*- coding: utf-8 -*-
"""★裁定 その78（運営の 画面の 姿）── ★いま どこまで 在るか（★2026-09-19）

  ★★★§11「Code への 実装の 覚え書き」を 1つずつ 当たります。
    ★★在る／無い だけを 数えます。★良し悪しは 見ません。

  ★★荷は `tools/pack_path.py` が 選びます（★名指し しません）。

  ★★較正 ── ★在る ものを 見つけ、★無い ものを 見つけない こと。
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
  if not os.path.exists(p):
    return None
  return io.open(p, encoding="utf-8").read()


# ★項目 …… （裁定の 名, 何を 探すか, どこを 見るか）
項目 = [
  ("NAVG ★ナビの まとまり 5つ", r"NAV_GROUPS|NAVG", ["lib/opsNav.js"]),
  ("ICO ★しるし 10種", r"ICONS|ICO\b", ["lib/opsIcons.js"]),
  ("WIDE ★自動で レールに する 幅", r"RAIL_AT|WIDE", ["lib/opsNav.js", "components/OpsShell.jsx"]),
  # ★★★名は 変えて あります。★中身で 探します（★2026-09-19）。
  #   ★★はじめ `PALETTE|PALL` だけ を 探し、★「ありません」と 出しました。
  #   ★★★在る ものを 見落とす 道具は、★無い ものを 作らせます。
  ("PALL ★さがすの 中身（3つの まとまり）",
   r"GROUP_HEADS|searchGroups", ["lib/opsSearch.js"]),
  ("svg(k,sz) ★しるしを 出す", r"function (svg|icon)|export function .*[Ii]con", ["lib/opsIcons.js"]),
  ("navHTML() ★ナビ 全体",
   r"showSideNav|navGroupsFor|NAV_GROUPS", ["components/OpsShell.jsx", "lib/opsNav.js"]),
  ("isRail() ★たたむか", r"isRail|rail", ["lib/opsNav.js", "components/OpsShell.jsx"]),
  ("toggleRail() ★たたむ 押し札", r"toggleRail|onToggleRail|setRail", ["components/OpsShell.jsx"]),
  ("palHTML() ★さがす（⌘K）", r"metaKey|⌘K|cmdk|Meta", ["components/OpsShell.jsx"]),
  (".side / .side.rail ★CSS", r"SIDE_WIDTH|\.side", ["lib/opsSettingsNav.js", "components/OpsShell.jsx",
                                                     "lib/opsNav.js"]),
  (".tblwrap の 貼り付け", r"TABLE_CLASS|tblwrap", ["lib/visualTokens.js"]),
  ("★行の 高さ ＝ 40px × つまみ", r"TABLE_ROW_BASE_PX", ["lib/visualTokens.js"]),
]

作らない = [
  ("✕ 密度の 切替", r"density|密度"),
  ("✕ 行の 高さの 別つまみ", r"rowHeightVar|行の高さのつまみ"),
  ("✕ ナビを 隠す（ハンバーガー）", r"hamburger|☰"),
]


def main():
  # ★★較正 ── ★荷が 読めて いる こと。
  裁定 = io.open(os.path.join(荷(), "ruling-78-ops-layout.md"), encoding="utf-8").read()
  assert "## 11" in 裁定, "★§11 を 読めて いません"
  assert 読む("components", "OpsShell.jsx"), "★当たりの ファイルが ありません"
  assert 読む("components", "アリマセン.jsx") is None, "★無い ものを 見つけて います"
  # ★★探し方の 較正 ── ★在る ものを 当てる。
  assert re.search(r"GROUP_HEADS", 読む("lib", "opsSearch.js")), "★さがすの 中身が 読めません"
  assert re.search(r"NAV_GROUPS", 読む("lib", "opsNav.js")), "★ナビの まとまりが 読めません"

  print("=== §11 の 覚え書き ===")
  無い = []
  for 名, 何, どこ in 項目:
    当 = []
    for d in どこ:
      本 = 読む(*d.split("/"))
      if 本 and re.search(何, 本):
        当.append(d)
    print("  %-34s %s" % (名, "／".join(当) if 当 else "★ありません"))
    if not 当:
      無い.append(名)

  print()
  print("=== 作らない もの（★在ったら 困る）===")
  みな = "\n".join(読む(*d.split("/")) or "" for d in
                   ["components/OpsShell.jsx", "lib/opsNav.js", "lib/opsSearch.js"])
  for 名, 何 in 作らない:
    出 = re.findall(何, みな)
    print("  %-34s %s" % (名, "★在ります（%d）" % len(出) if 出 else "ありません（★正）"))

  print()
  print("=== 数が 裁定と 合うか ===")
  # ★★★数え方の 較正 ── ★在る ものを 正しく 数える こと。
  #   ★★はじめ `key:` を 探し、★ナビの まとまりを 0 と 数えました（★実は `head:`）。
  #   ★★しるしも 2字下げ だけ を 数え、★7 と 出しました（★実は 10）。
  nav = 読む("lib", "opsNav.js")
  ico = 読む("lib", "opsIcons.js")
  sea = 読む("lib", "opsSearch.js")
  g = re.search(r"NAV_GROUPS = Object\.freeze\(\[(.*?)\]\);", nav, re.S)
  数g = len(re.findall(r"\{\s*head:", g.group(1))) if g else 0
  i = re.search(r"ICO = Object\.freeze\(\{(.*?)^\}\);", ico, re.S | re.M)
  数i = len(re.findall(r"^\s{2}(\w+):", i.group(1), re.M)) if i else 0
  h = re.search(r"GROUP_HEADS = Object\.freeze\(\[(.*?)\]\)", sea, re.S)
  数h = len(re.findall(r'"[^"]+"', h.group(1))) if h else 0
  assert 数g > 0 and 数i > 0 and 数h > 0, "★数え方が 壊れて います"
  for 名, 実, 望 in [("ナビの まとまり", 数g, 5), ("しるし", 数i, 10),
                     ("さがすの まとまり", 数h, 3)]:
    print("  %-18s 実装 %-3d 裁定 %-3d %s" % (名, 実, 望, "" if 実 == 望 else "★ちがいます"))
  鍵 = re.search(r'FOLD_KEY = "(\w)"', nav).group(1)
  開 = re.search(r'OPEN_KEY = "(\w)"', sea).group(1)
  print("  %-18s たたむ ⌘%s ／ さがす ⌘%s" % ("鍵", 鍵.upper(), 開.upper()))

  print()
  print("★足りない もの …… %d件" % len(無い))


if __name__ == "__main__":
  main()
