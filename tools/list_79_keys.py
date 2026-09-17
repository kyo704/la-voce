# ============================================================================
# ★★★2026-09-18、★この 道具は **止まりました**（★坂本さんの お決め）。
#
#   ★★お決め ── 「★古い 79点の 名前・データは 放棄。
#     ★実機に 出て いない ものは 放棄。★庭に 置く ものは 一切 やらない」。
#   ★★だから、★79点の 結び直しは **要らなく なりました**。
#
#   ★★★消しません。★走らせません。
#     ★★消すと、★「なぜ この 案が あったのか」が 分からなく なります。
#     ★★きょう 何度も 見た 形 です ── ★記録が 無い ものは、★半年後に
#       ★もう一度 同じ ことを 調べ直す ことに なります。
#
#   ★★★もう一度 使う とき の 引き金 ──
#     ★「古い 鍵を 残した まま、★新しい 絵に 結び直す」話が 戻った とき。
#     ★★いまは 戻りません。★古い 鍵ごと 手放す、という お決め です。
#
#   ★記録 … `docs/records/記録-2026-09-18-79点の仕事を止めました.md`
# ============================================================================

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

  # ★★★120点（★いま 蔵に ある 内装）と 重なるかを 見ます（★Opus の お求め・2026-09-18）。
  #   ★★同じ **分類**が あるか、★そして その 分類に 何点 あるか。
  #   ★★「分類が 同じ」は「もの が 同じ」では ありません。★そこは 分けて 書きます。
  idx = json.load(io.open(
    os.path.join(ROOT, "docs/assets/sheep-interior-index.json"), encoding="utf-8"))["items"]
  have = {}
  for x in idx:
    have.setdefault(x["category"], []).append(x)
  # ★★床・壁の 敷きつめは `tile` に まとまって います。★鍵の 頭で 分けます。
  tile_floor = [x for x in have.get("tile", []) if x["key"].startswith("floor")]
  tile_wall = [x for x in have.get("tile", []) if x["key"].startswith("wall")]
  # ★★古い 分類 → 新しい 分類（★あてはめ）。★空は「当たる ものが 無い」。
  MAP = {
    "floor": ("tile（floor）", len(tile_floor), "256×256・敷きつめ"),
    "wall": ("tile（wall）", len(tile_wall), "256×256・敷きつめ"),
    "window": ("window ＋ view", len(have.get("window", [])) * 0 + len(have.get("window", [])), "384×384（枠）"),
    "scenery": ("view", len(have.get("view", [])), "480×320（外の 景色）"),
    "backdrop": ("", 0, "★当たる ものが ありません"),
    "furniture": ("furniture", len(have.get("furniture", [])), "320×320"),
    "garden": ("garden", len(have.get("garden", [])), "320×320"),
    "wallhang": ("wallart", len(have.get("wallart", [])), "320×320"),
  }

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
  w("| 古い 分類 | 数 | 120点の 側 | 向こうの 数 | 要る 大きさ | 門の 中で 見えるか |")
  w("|---|---|---|---|---|---|")
  hidden_n = 0
  for c in HOUSE:
    n = len(by.get(c, []))
    if not n:
      continue
    if c in HIDDEN:
      hidden_n += n
    to, cnt, size = MAP.get(c, ("", 0, ""))
    w("| %s | %d | %s | %s | %s | %s |" % (
      c, n, to or "★無し", cnt if to else "—", size,
      "見えません" if c in HIDDEN else "★見えます"))
  w("| **計** | **%d** | | | | ★%d点が 見えません |" % (len(rows), hidden_n))
  w("")
  w("## ★★Q1 ── ★79点は、★120点と 重なりますか")
  w("")
  w("★★**分類で 見ると、★ほとんど 重なります。**")
  w("")
  w("```")
  need = 0
  for c in HOUSE:
    n = len(by.get(c, []))
    if not n:
      continue
    to, cnt, _ = MAP.get(c, ("", 0, ""))
    if to:
      w("%-10s %2d点 → %-16s が %3d点 ある … ★描き足し 不要の 見込み" % (c, n, to, cnt))
    else:
      need += n
      w("%-10s %2d点 → ★★当たる ものが 無い …… ★★描き足しが 要ります" % (c, n))
  w("")
  w("★要る と 思われる もの … ★★%d点" % need)
  w("```")
  w("")
  w("★★★ただし「分類が 同じ」は「★もの が 同じ」では ありません。")
  w("　★★古い `window_wooden` と 新しい `window_01` は、★別の 絵 です。")
  w("　★★**同じ 役**を する ものが 既に ある、という 意味 です。")
  w("　★★「古い 鍵を 新しい 絵に 差し替える」なら 描き足しは 要りません ──")
  w("　　★★`window_wooden` を `window_01` の 絵に 結ぶ だけ です。")
  w("　★★「古い 絵を 1点ずつ 作り直す」なら、★79点 ぜんぶ 要ります。")
  w("　★★★どちらかで、★見積もりが 2〜3日 と 0日 に 分かれます。★お決めを ください。")
  w("")
  w("## ★★Q2 ── ★120点の `tile` 9点と、★79点の floor 15／wall 17 の 関わり")
  w("")
  w("★★蔵の 目録には、★`tile` が **138点** あります（★zip の 9点 では ありません）。")
  w("")
  w("```")
  w("tile 138 の 内わけ（★鍵の 頭で 分けました）")
  w("  floor_*  ★70点")
  w("  wall_*   ★59点")
  w("  tile_*   ★ 9点（★zip の 9点 が これ）")
  w("  ★どれも 256×256・`placement: surface`（敷きつめ）")
  w("```")
  w("")
  w("★★★つまり、★床 15点・壁 17点に 対して、★**床 70点・壁 59点**が もう あります。")
  w("　★★足りないのでは なく、★**余って います**。")
  w("　★★zip の `tile` 9点は、★138点の うちの 9点 です。★別便で 129点 入って います。")
  w("")
  for c in HOUSE:
    if not by.get(c):
      continue
    w("## %s（%d点）" % (c, len(by[c])))
    w("")
    to, cnt, size = MAP.get(c, ("", 0, ""))
    w("★120点の 側 … %s%s ／ 要る 大きさ … %s"
      % (to or "★当たる ものが ありません", (" %d点" % cnt) if to else "", size))
    w("")
    w("| 鍵 | 日本語 | いまの SVG の 部品 | 120点に 同じ 分類が あるか | 要る 大きさ | 値 |")
    w("|---|---|---|---|---|---|")
    for r in by[c]:
      w("| `%s` | %s | %s | %s | %s | %s |" % (
        r["key"], ja(r.get("nameKey")) or "—",
        drawn(r["key"]) or "（色・模様）",
        ("★あり（%s・%d点）" % (to, cnt)) if to else "★★無し",
        size, r.get("cost", "")))
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
