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
"""★79点の 古い 鍵を、★新しい 絵に 結び直す 案（★裁定・㋐）。

  ★★★これは **案** です。★決めでは ありません。
    ★★機械が 出せるのは「★同じ 分類の 何番目か」までです。
    ★★「この 絵で よいか」は、★Opus と 坂本さんが ご覧に なって 決めます。

  ★★結ぶ 決め（★この 道具が する こと）──
    ・古い 鍵は **消しません**（★裁定 条件1）。★指す 絵 だけ を 書きます。
    ・同じ 役の 分類へ 結びます（★floor → tile(floor) など）。
    ・その 分類の 中で、★**出て くる 順**に 1つずつ 当てます。
    ・当てる 先が 足りなく なったら、★そこで 止まります（★勝手に 使い回しません）。
    ・当たる 分類が 無い もの（★backdrop）は、★空の まま 残します。

  ★★★自分の 取り出しを 自分で 確かめます ── ★79行 で なければ 止まります。
"""

import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★古い 分類 → 新しい 分類（★`docs/reports/2026-09-18-79点の鍵の一覧.md` の 見立て）
TO = {
  "floor": "tile:floor",
  "wall": "tile:wall",
  "window": "window",
  "scenery": "view",
  "furniture": "furniture",
  "garden": "garden",
  "wallhang": "wallart",
  "backdrop": None,          # ★当たる ものが ありません（★描き足し）
}

# ★絵が 要らない もの（★部屋の 作りを 変える 合図・★絵では ありません）
NOT_ART = {"backdrop_mountains_near", "backdrop_mountains_huge",
           "backdrop_room_expand", "backdrop_garden_expand"}


def shop_items():
  code = ("import { SHOP_ITEMS } from '%s/lib/character.js';"
          "console.log(JSON.stringify(SHOP_ITEMS));" % ROOT)
  r = subprocess.run(["node", "--input-type=module", "-e", code],
                     capture_output=True, text=True, cwd=ROOT)
  if not r.stdout.strip():
    sys.exit("★止まりました ── SHOP_ITEMS を 読めません。\n" + r.stderr[:300])
  return json.loads(r.stdout)


def main():
  items = shop_items()
  rows = [x for x in items if x.get("category") in TO]
  if len(rows) != 79:
    sys.exit("★止まりました ── おうちの ものが %d でした（★79 の はず）。" % len(rows))

  # ★★古い 名（日本語）も 出します（★Opus の お求め・2026-09-18）。
  #   ★★「和風の 鍵が、★和風の 絵に 当たって いるか」を 見るには、
  #     ★★両方の 名と **様式**が 要ります。★鍵だけでは 判じられません。
  import re as _re
  tr = io.open(os.path.join(ROOT, "lib/translations.js"), encoding="utf-8").read()

  def ja(nk):
    m = _re.search(r"\b" + _re.escape(str(nk)) + r':\s*\{\s*ja:\s*"([^"]*)"', tr)
    return m.group(1) if m else ""

  idx = json.load(io.open(os.path.join(ROOT, "docs/assets/sheep-interior-index.json"),
                          encoding="utf-8"))["items"]
  pool = {}
  for x in idx:
    c = x["category"]
    if c == "tile":
      c = "tile:floor" if x["key"].startswith("floor") else \
          ("tile:wall" if x["key"].startswith("wall") else "tile:other")
    pool.setdefault(c, []).append(x)

  used = {}
  取れた = set()   # ★★名で 先に 当てた 絵。★二度 使いません。
  out = []
  足りない = []
  for r in rows:
    c = r["category"]
    to = TO.get(c)
    if to is None:
      out.append({**r, "new": None, "note": "★絵が 要らない 合図"
                  if r["key"] in NOT_ART else "★★描き足しが 要ります"})
      continue
    lst = pool.get(to, [])
    # ★★★名で 近い ものを 先に 当てます（★2026-09-18・Opus の ご指摘）。
    #   ★★順に 当てる だけ では、★`floor_tatami`（畳）に
    #     ★「ウォルナット」が 当たりました。★和風の 鍵に 洋風の 絵 です。
    #   ★★古い 名の 中の 言葉が、★新しい 名にも あれば、★そちらを 先に。
    #   ★★これでも **決めでは ありません**。★手がかりを 増やす だけ です。
    候補 = None
    古名 = ja(r.get("nameKey")) or ""
    for 語 in ["畳", "テラコッタ", "カーペット", "絨毯", "大理石", "タイル",
               "障子", "格子", "円窓", "丸窓", "アーチ", "ステンドグラス",
               "竹", "和紙", "煉瓦", "しっくい", "漆喰", "板", "石"]:
      if 語 and 語 in 古名:
        空き = [x for x in lst if x["key"] not in 取れた
                and 語 in (x.get("name") or "")]
        if 空き:
          候補 = 空き[0]
          break
    if 候補 is not None:
      取れた.add(候補["key"])
      out.append({**r, "new": 候補["key"], "newName": 候補.get("name", ""),
                  "newStyle": 候補.get("style", ""), "newCat": to,
                  "note": "★名で 合わせました"})
      continue
    i = used.get(to, 0)
    while i < len(lst) and lst[i]["key"] in 取れた:
      i += 1
    used[to] = i
    if i >= len(lst):
      足りない.append(r["key"])
      out.append({**r, "new": None, "note": "★★当てる 先が 足りません"})
      continue
    used[to] = i + 1
    取れた.add(lst[i]["key"])
    out.append({**r, "new": lst[i]["key"], "newName": lst[i].get("name", ""),
                "newStyle": lst[i].get("style", ""), "newCat": to, "note": ""})

  if len(out) != 79:
    sys.exit("★止まりました ── 表が %d 行に なりました。" % len(out))

  結べた = [x for x in out if x.get("new")]
  L = []
  w = L.append
  w("# ★79点の 結び直しの 表（★案）")
  w("")
  w("★この 行は あとで 差し替えます")
  w("")
  w("生成: `tools/map_79_to_new.py`（2026-09-18）")
  w("")
  w("★★★これは **案** です。★決めでは ありません。")
  w("　★★機械が 出せるのは「★同じ 分類の 何番目か」までです。")
  w("　★★「この 絵で よいか」は、★Opus と 坂本さんが ご覧に なって 決めます。")
  w("")
  w("## ★決め（★裁定 その72 の 条件）")
  w("")
  w("```")
  w("条件1 ★古い 鍵を 消しません。★指す 絵（src）だけ を 変えます")
  w("条件2 ★余るのは 正しい。★指されない 絵は、★箱2 の 中身に 使えます")
  w("条件3 ★この 表を 記録に 残します（★この 紙が それ です）")
  w("```")
  w("")
  w("## ★数")
  w("")
  w("- 結べた … **%d / 79**" % len(結べた))
  w("- 結べない（★描き足し）… **%d**"
    % len([x for x in out if not x.get("new") and x["key"] not in NOT_ART]))
  w("- 絵が 要らない 合図 … **%d**" % len([x for x in out if x["key"] in NOT_ART]))
  if 足りない:
    w("- ★★当てる 先が 足りない … %s" % ", ".join(足りない))
  w("")
  w("## ★余る 絵（★箱2 の 中身に 使えます）")
  w("")
  w("| 新しい 分類 | ある 数 | 指された 数 | ★余り |")
  w("|---|---|---|---|")
  for c in sorted(pool):
    n, u = len(pool[c]), used.get(c, 0)
    if u or c.startswith("tile"):
      w("| %s | %d | %d | **%d** |" % (c, n, u, n - u))
  w("")
  w("## ★表（79行）")
  w("")
  w("| 古い 鍵 | 古い 名前 | 新しい 絵 | 新しい 名前 | 様式 | 覚え書き |")
  w("|---|---|---|---|---|---|")
  for x in out:
    w("| `%s` | %s | %s | %s | %s | %s |" % (
      x["key"], ja(x.get("nameKey")) or "—",
      ("`%s`" % x["new"]) if x.get("new") else "★★—",
      x.get("newName", "") or "—", x.get("newStyle", "") or "—",
      x.get("note", "")))
  w("")
  w("## ★★見て いただきたい ところ")
  w("")
  w("★★機械は「順に 当てた」だけ です。★中身を 見て いません。")
  w("　★★**様式**の 列を ご覧ください。★和風の 鍵に 洋風の 絵が 当たって いれば 誤り です。")
  w("　★れい … `floor_tatami`（畳）に、★洋風の 絵が 当たって いないか。")
  w("　　　　  `window_shoji`（障子）に、★格子でない 絵が 当たって いないか。")
  w("★★★**名と 様式で 見て、★おかしい ものを 教えて ください。**")
  w("　★★入れ替えるのは、★この 表の 1列を 書き直す だけ です。")

  body = "\n".join(L) + "\n"
  lines = body.split("\n")
  lines[2] = "全%d行 / 末尾は「%s」" % (len(lines) - 1, [x for x in lines if x.strip()][-1])
  path = os.path.join(ROOT, "docs/opus/2026-09-18-79点の結び直しの表（案）.md")
  io.open(path, "w", encoding="utf-8").write("\n".join(lines))
  print(path)
  print("結べた %d / 79 ／ 描き足し %d ／ 合図 %d"
        % (len(結べた),
           len([x for x in out if not x.get("new") and x["key"] not in NOT_ART]),
           len([x for x in out if x["key"] in NOT_ART])))


main()
