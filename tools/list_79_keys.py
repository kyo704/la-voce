# -*- coding: utf-8 -*-
"""★79点の 鍵の 一覧（★絵を お願いする ため の 素材）。

  ★★`lib/character.js` の `SHOP_ITEMS` から、★おうちの もの だけ を 出します。

  ★★★正規表現で 読みません。
    ★★2026-09-18、★はじめ 正規表現で 読み、★79点の うち **60点** しか
      ★取れません でした。★行の 形が そろって いなかった ため です。
    ★★足りない ことに 気づけたのは、★数を 確かめて いた から です。
    ★★だから、★`node` に 読ませて、★JSON で 受け取ります。★本物の 値 です。

  ★★★自分の 取り出しを 自分で 確かめます ── ★79 で なければ 止まります。
"""

import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOUSE = ["floor", "wall", "window", "scenery", "backdrop",
         "furniture", "garden", "wallhang"]
HIDDEN = ["wall", "floor", "window", "scenery", "furniture", "garden", "wallhang"]


def shop_items():
  """★`node` に 読ませます。★書き写しません。"""
  code = (
    "import { SHOP_ITEMS } from '%s/lib/character.js';"
    "console.log(JSON.stringify(SHOP_ITEMS));" % ROOT)
  r = subprocess.run(["node", "--input-type=module", "-e", code],
                     capture_output=True, text=True, cwd=ROOT)
  out = r.stdout.strip()
  if not out:
    sys.exit("★止まりました ── SHOP_ITEMS を 読めません でした。\n" + r.stderr[:400])
  return json.loads(out)


def main():
  items = shop_items()
  rows = [x for x in items if x.get("category") in HOUSE]

  # ★★★立ち会い ── ★数が 合わなければ 止まります。
  if len(items) != 101:
    sys.exit("★止まりました ── お店の 合計が %d でした（★101 の はず）。" % len(items))
  if len(rows) != 79:
    sys.exit("★止まりました ── おうちの ものが %d でした（★79 の はず）。"
             "★取り出しが 欠けて います。" % len(rows))

  tr = io.open(os.path.join(ROOT, "lib/translations.js"), encoding="utf-8").read()
  ch = io.open(os.path.join(ROOT, "components/CharacterHome.jsx"), encoding="utf-8").read()

  def ja(nk):
    m = re.search(r"\b" + re.escape(str(nk)) + r':\s*\{\s*ja:\s*"([^"]*)"', tr)
    return m.group(1) if m else ""

  def drawn(key):
    m = re.search(re.escape(key) + r":\s*(\w+Icon)", ch)
    return m.group(1) if m else ""

  # ★★日本語を 1つも 引けなければ、★引き方が 壊れて います。
  named = [r for r in rows if ja(r.get("nameKey"))]
  if not named:
    sys.exit("★止まりました ── 日本語の 名を 1つも 引けません でした。")

  by = {}
  for r in rows:
    by.setdefault(r["category"], []).append(r)

  L = []
  w = L.append
  w("# ★79点の 鍵の 一覧（★絵を お願いする ため）")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/list_79_keys.py`（2026-09-18）")
  w("")
  w("★★`lib/character.js` の `SHOP_ITEMS`（★101点）から、"
    "★おうちの もの **79点**を 出しました。")
  w("★★日本語の 名を 引けた もの … %d / %d" % (len(named), len(rows)))
  w("")
  w("## ★お願いする とき に 添える こと")
  w("")
  w("```")
  w("・png は 鍵の 名（★下の 表の 1列目）で ください")
  w("・manifest.json を 添えて ください ── ★いまの 内装120点と 同じ 形")
  w("    key / category / name / style / src / width / height /")
  w("    floorY / contentTop / contentX / contentY / placement / anchor / z")
  w("  ★★floorY（★床に 着く 線）が 無いと、★絵が 浮きます（★2026-09-08 の 一件）")
  w("・粒テクスチャは かけないで ください（★部屋ぜんぶに 1回・README の 注意）")
  w("```")
  w("")
  w("## ★数")
  w("")
  w("| 分類 | 数 | 門の 中で 見えるか |")
  w("|---|---|---|")
  hidden_n = 0
  for c in HOUSE:
    n = len(by.get(c, []))
    if not n:
      continue
    if c in HIDDEN:
      hidden_n += n
    w("| %s | %d | %s |" % (c, n, "見えません" if c in HIDDEN else "★見えます"))
  w("| **計** | **%d** | ★%d点が 見えません |" % (len(rows), hidden_n))
  w("")
  for c in HOUSE:
    if not by.get(c):
      continue
    w("## %s（%d点）" % (c, len(by[c])))
    w("")
    w("| 鍵 | 日本語 | いまの 絵 | 値 |")
    w("|---|---|---|---|")
    for r in by[c]:
      w("| `%s` | %s | %s | %s |" % (
        r["key"], ja(r.get("nameKey")) or "—",
        drawn(r["key"]) or "（色・模様）", r.get("cost", "")))
    w("")
  w("★★「いまの 絵」が `…Icon` の もの は、★SVG を 手で 描いた 部品 です。")
  w("★★空の もの は、★色や 模様で 描いて います（★絵の ファイルが ありません）。")
  w("")
  w("★★どちらも「★ファイルを 置き換える」では 済みません。")
  w("　★★`InteriorLayer`（★画像を 描く 仕組み）へ 寄せる 仕事 に なります。")

  body = "\n".join(L) + "\n"
  lines = body.split("\n")
  lines[2] = "全%d行 / 末尾は「%s」" % (
    len(lines) - 1, [x for x in lines if x.strip()][-1])
  path = os.path.join(ROOT, "docs/reports/2026-09-18-79点の鍵の一覧.md")
  io.open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("お店 %d ／ おうちの もの %d ／ 門の 中で 見えない %d"
        % (len(items), len(rows), hidden_n))


main()
