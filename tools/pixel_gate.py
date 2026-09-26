#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本と 実装の 見た目を、★1画素まで くらべる ところまで 運びます（★2026-09-26）。

★★★Opus から 届いた 順（★そのまま 守ります）──
  ①`tools/dom_compare_personal.py` …… 骨組み（★字と 並び）を くらべる
  ②通ったら shoot.js …… ★時計を 止めて、★同じ 撮り方で 2枚 撮る
  ③`pixel_lint.py --calibrate` …… ★道具を 試す（★1画素の 差を 見つけられるか）
  ④較正が 落ちたら **止める**（★本番の 画を くらべない）
  ⑤`pixel_lint.py` …… ★閾値 0.0 で くらべる

★★★この 道具が 見つけられる もの ──
  ★同じ 環境で 撮った 2枚の 間の、★1画素・RGB差1 までの ずれ。
  ★大きさ（縦横）の 違い。

★★★この 道具が 見つけられない もの ──
  ★**別の 環境で 撮った 2枚** の ずれ（★字の 形が 違う ので いつも 赤 に なります）。
    ★★だから 撮る 環境を 下に 書き留めます。★混ぜたら 結果は 無効 です。
  ★見本と 実装が **別の 組み立て** で 同じ 見た目に 見える とき、★その 中身の 違い。
    ★★それは ①（骨組み）が 見ます。
  ★覆った ところ（★版の 字 など）の 中の ずれ。★覆いは 下に 並べます。

★使い方
  python3 tools/pixel_gate.py 届いたもの
  python3 tools/pixel_gate.py --all
"""
import json, os, subprocess, sys

蔵 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
出 = os.path.join(蔵, "docs/design/compare/personal")
道 = os.path.join(蔵, "tools/dom_personal_map.json")

# ★★★撮る 環境（★ここを 書き留めます。★混ぜたら 無効 です）。
#   ★★2026-09-26 …… macOS（darwin 21.6.0）／ Playwright の Chromium ／ dsf 3 ／ 390x844。
環境 = {
  "台": "macOS darwin 21.6.0",
  "見る もの": "Playwright chromium（★同じ 立ち上げ で 2枚）",
  "横": 390, "縦": 844, "倍": 3,
  "時計": "2026-09-26T10:00:00+09:00",
  "言葉": "ja-JP", "時刻帯": "Asia/Tokyo"
}

def 走る(cmd, **kw):
  return subprocess.run(cmd, cwd=蔵, capture_output=True, text=True, **kw)

def 一枚(名):
  print("=" * 66)
  print("★" + 名)
  # ── ① 骨組み
  r = 走る(["node", "tools/dom_compare_personal.js", 名])
  最後 = [l for l in r.stdout.split("\n") if l.startswith("RESULT:")]
  骨 = 最後[-1] if 最後 else "RESULT: （出ません）"
  print("  ①骨組み …… " + 骨.replace("RESULT: ", ""))
  if 骨 != "RESULT: OK":
    print("  ★止まりました ── ★骨組みが 合って いません。★絵を くらべません。")
    print("     ★★字が 違う ものを 画素で くらべても、★何が 悪いか 分かりません。")
    return {"名": 名, "骨": 骨, "画素": None, "なぜ": "骨組みが 先"}
  # ── ② 2枚 撮る …… ★`dom_compare_personal.js` が すでに 撮って います。
  #   ★★同じ 立ち上げ・同じ 大きさ で 撮って いる ので、★環境は 揃って います。
  見本 = os.path.join(出, "%s-見本.png" % 名)
  実機 = os.path.join(出, "%s-実機.png" % 名)
  for p in (見本, 実機):
    if not os.path.exists(p):
      print("  ★絵が ありません …… " + p); return {"名": 名, "骨": 骨, "画素": None, "なぜ": "絵が 無い"}
  # ── ③ 較正（★先に 道具を 試す）
  c = 走る([sys.executable, "tools/pixel_lint.py", "--calibrate", 見本])
  通 = "RESULT: OK" in c.stdout
  print("  ③較正 …… " + ("○ 1画素の 差を 見つけられます" if 通 else "★★NG"))
  if not 通:
    # ── ④ 落ちたら 止める
    print("  ★止まりました ── ★道具が ずれを 見逃します。★くらべません。")
    print(c.stdout.strip()[-400:])
    return {"名": 名, "骨": 骨, "画素": None, "なぜ": "較正が 落ちた"}
  # ── ④.5 ★高さを 揃えます（★黙って 切りません）。
  #   ★★見本の 枠（`#bd`）と 実機の `main` は、★中身の 量で 高さが 変わります。
  #   ★★横は どちらも 390 です。★縦だけ、★短い ほうに 合わせます。
  #   ★★★切り落とした 高さは 下に **必ず** 出します。
  from PIL import Image
  a, b = Image.open(見本), Image.open(実機)
  切 = None
  if a.size != b.size:
    w, h = min(a.size[0], b.size[0]), min(a.size[1], b.size[1])
    切 = {"見本": a.size, "実機": b.size, "そろえた": (w, h)}
    見本 = os.path.join(出, "%s-見本-そろえ.png" % 名)
    実機 = os.path.join(出, "%s-実機-そろえ.png" % 名)
    a.crop((0, 0, w, h)).save(見本)
    b.crop((0, 0, w, h)).save(実機)
    print("  ④★高さを 揃えました …… 見本 %s ／ 実機 %s → %s" % (切["見本"], 切["実機"], 切["そろえた"]))
    print("     ★切り落とした 縦 …… 見本 %d / 実機 %d 画素" % (a.size[1] - h, b.size[1] - h))
  # ── ⑤ くらべる（★閾値 0.0）
  d = 走る([sys.executable, "tools/pixel_lint.py", 見本, 実機])
  for l in d.stdout.split("\n"):
    if "くらべました" in l or "大きさが 違います" in l or "いちばん 大きい" in l:
      print("  ⑤" + l.strip())
  数 = None
  for l in d.stdout.split("\n"):
    if "差 " in l and "px /" in l:
      try: 数 = int(l.split("差 ")[1].split(" px")[0])
      except Exception: pass
  return {"名": 名, "骨": 骨, "画素": 数, "なぜ": None, "切": 切,
          "出": d.stdout.strip().split("\n")[-1]}

def main():
  名一覧 = json.load(open(道, encoding="utf-8"))
  名一覧 = [k for k in 名一覧 if not k.startswith("★")]
  引 = [a for a in sys.argv[1:] if not a.startswith("--")]
  的 = 名一覧 if "--all" in sys.argv else 引
  if not 的:
    print(__doc__); return 2
  print("★撮る 環境 ……")
  for k, v in 環境.items(): print("    %s …… %s" % (k, v))
  出来 = [一枚(n) for n in 的]
  print("=" * 66)
  print("★まとめ")
  for r in 出来:
    if r["画素"] is None:
      print("  %-12s ★くらべて いません（%s）" % (r["名"], r["なぜ"]))
    else:
      print("  %-12s 差 %d 画素" % (r["名"], r["画素"]))
  赤 = [r for r in 出来 if r["画素"] is None or r["画素"] != 0]
  print("RESULT: " + ("OK" if not 赤 else "DIFF（%d枚）" % len(赤)))
  return 0 if not 赤 else 1

if __name__ == "__main__":
  sys.exit(main())
