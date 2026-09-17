# -*- coding: utf-8 -*-
"""★羊の 部屋 ── ★「したく」と「全画面」で、★同じ 部屋を 描いて いるか。

  ★★出どころ　Opus「羊の部屋 ── 座標のずれを直す」（★2026-09-17）。
    ★★「ずれる」のでは ありません。★**別の 部屋**に 描いて います ──
      ★全画面 … viewBox "0 0 360 730"／床 fy=352
      ★したく … viewBox "0 0 360 290"／床 fy=168
    ★★y=546 に 置いた ものは、★290 の 部屋には **在りません**。

  ★★★道具を 先に 作り、★わざと 壊して 止まる ことを 確かめてから 直します
    （★Opus の 順番 7・「1と2を 飛ばさないで ください」）。

  ★★見るのは 4つ です ──
    ① viewBox が 1つ か
    ② 床（fy）と 高さ（ht）が 1つ か
    ③ preserveAspectRatio が `meet` か（★`slice` は 切り取ります）
    ④ 家具を 出し分けて いないか（`if(!small)`）
  ★★あわせて、★押せる ところが 入れ物の ％で 置かれて いないかも 見ます。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [
  "docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
  "docs/design/pack-final/00-動く見本-iPhoneで開く用.html",
]


def big_room(src):
  """★`bigRoom` の 中身を 切り出します。"""
  i = src.find("function bigRoom(")
  if i < 0:
    return None
  j = src.find("\n return h}", i)
  if j < 0:
    j = src.find("\nfunction ", i + 10)
  return src[i:j + 12 if j > 0 else i + 6000]


def read(rel):
  p = os.path.join(ROOT, rel)
  if not os.path.exists(p):
    sys.exit("★止まりました ── 見つかりません: " + rel)
  return io.open(p, encoding="utf-8").read()


def examine(body):
  """★部屋の 決めごとを 取り出します。"""
  if body is None:
    return None
  vbs = sorted(set(re.findall(r"'(0 0 360 \d+)'", body)))
  # ★`viewBox="…"` に べた書き された ものも 拾います。
  vbs += sorted(set(re.findall(r'viewBox="(0 0 360 \d+)"', body)))
  vbs = sorted(set(vbs))
  fy = re.search(r"fy\s*=\s*([^,;]+)", body)
  ht = re.search(r"ht\s*=\s*([^,;]+)", body)
  par = re.search(r'preserveAspectRatio="([^"]+)"', body)
  return {
    "takes_small": bool(re.match(r"function bigRoom\(\s*small\s*\)", body)),
    "viewBoxes": vbs,
    "fy": fy.group(1).strip() if fy else None,
    "ht": ht.group(1).strip() if ht else None,
    "par": par.group(1) if par else None,
    "splits_furniture": "if(!small)" in body.replace(" ", ""),
    "small_ternaries": len(re.findall(r"small\s*\?", body)),
    "box_percent_hit": 'class="hhit"' in body,
  }


def place(x, y, ht):
  """★部屋の 座標が、★その 部屋の 中で どこに 当たるか（★0〜1）。

    ★★高さが 違えば、★同じ y が 別の ところに 当たります。
      ★★730 の 部屋の y=546 は 下から 25％。
      ★★290 の 部屋には、★そもそも y=546 が **在りません**。
  """
  h = float(ht)
  return {"x": round(x / 360.0, 4), "y": round(y / h, 4), "inside": 0 <= y <= h}


def drift(a_ht, b_ht, x=262, y=546):
  a = place(x, y, a_ht)
  b = place(x, y, b_ht)
  return (a != b), a, b


def calibrate():
  """★わざと 壊して、★止まる ことを 確かめます。"""
  # ★① ずれて いる ── ★730 と 290。★出なければ 道具が 壊れて います。
  bad, a, b = drift(730, 290)
  if not bad:
    sys.exit("★止まりました ── 較正に 失敗。730 と 290 の ずれが 出ません。")
  if b["inside"]:
    sys.exit("★止まりました ── 較正に 失敗。290 の 部屋に y=546 は 在りません。")
  # ★② 揃って いる ── ★730 と 730。★出たら 道具が 壊れて います。
  ok, _, _ = drift(730, 730)
  if ok:
    sys.exit("★止まりました ── 較正に 失敗。同じ 高さで ずれが 出ます。")
  # ★③ わざと 壊した 中身を 読ませ、★見分ける か。
  broken = examine("""function bigRoom(small){
    var vb=small?'0 0 360 290':'0 0 360 730', fy=small?168:352, ht=small?290:730;
    var h='<svg viewBox="'+vb+'" preserveAspectRatio="xMidYMax slice">';
    if(!small){ h+='x'; }
    return h}""")
  if not broken["takes_small"] or len(broken["viewBoxes"]) < 2:
    sys.exit("★止まりました ── 較正に 失敗。壊れた 中身を 見分けられません。")
  if not broken["splits_furniture"] or broken["par"] != "xMidYMax slice":
    sys.exit("★止まりました ── 較正に 失敗。出し分けか 切り取りを 見落として います。")
  # ★④ 直した 中身。★何も 出ない こと。
  fixed = examine("""function bigRoom(){
    var fy=352, ht=730;
    var h='<svg viewBox="0 0 360 730" preserveAspectRatio="xMidYMid meet">';
    return h}""")
  if fixed["takes_small"] or len(fixed["viewBoxes"]) != 1:
    sys.exit("★止まりました ── 較正に 失敗。直した ものを 壊れて いると 言います。")
  if fixed["splits_furniture"] or fixed["par"] != "xMidYMid meet":
    sys.exit("★止まりました ── 較正に 失敗。直した ものに 印を 付けます。")
  return True


def main():
  calibrate()
  print("★較正: 通りました（★ずれる／揃う／壊れた 中身／直した 中身 の 4つ）")
  print()
  bad_files = 0
  for rel in FILES:
    body = big_room(read(rel))
    if body is None:
      sys.exit("★止まりました ── bigRoom が ありません: " + rel)
    e = examine(body)
    問題 = []
    if e["takes_small"]:
      問題.append("small を 受け取って いる")
    if len(e["viewBoxes"]) != 1:
      問題.append("viewBox が %d つ … %s" % (len(e["viewBoxes"]), " / ".join(e["viewBoxes"])))
    if e["fy"] and "?" in e["fy"]:
      問題.append("床 fy を 出し分けて いる … %s" % e["fy"])
    if e["ht"] and "?" in e["ht"]:
      問題.append("高さ ht を 出し分けて いる … %s" % e["ht"])
    if e["par"] != "xMidYMid meet":
      問題.append("切り取って いる … preserveAspectRatio=\"%s\"" % e["par"])
    if e["splits_furniture"]:
      問題.append("家具を 出し分けて いる（if(!small)）")
    if e["box_percent_hit"]:
      問題.append("押せる ところが 入れ物の ％（class=\"hhit\"）")
    print("■ %s" % rel)
    if 問題:
      bad_files += 1
      for x in 問題:
        print("   ★ " + x)
      # ★★実際に どれだけ ずれるか。
      hts = sorted({int(v.split()[-1]) for v in e["viewBoxes"]})
      if len(hts) == 2:
        _, a, b = drift(hts[1], hts[0])
        print("   ★ 置いた もの (262, 546) … 大: y=%.4f ／ 小: y=%.4f（在る=%s）"
              % (a["y"], b["y"], b["inside"]))
    else:
      print("   ok  1つの 部屋を 描いて います")
    print()
  if bad_files:
    print("★%d 本が、★2つの 部屋を 描いて います。" % bad_files)
    sys.exit(1)
  print("★2本とも、★1つの 部屋を 描いて います。")


main()
