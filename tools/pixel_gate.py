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

★★★基準画の 型（★2026-09-26 に 足しました）──
  ★見本とでは なく、★**実装 自身の 前の 絵**（基準画）と くらべます。
  ★★差 0 が 意味を 持つ のは こちら です（★見本とは 組み立てが 違う ので 0 に なりません）。
  ★置き場 …… docs/design/pixel_baseline/<名>.png ＋ <名>.json（★撮った 環境の 名札・覆い）

  python3 tools/pixel_gate.py --baseline 届いたもの          # ★基準画と くらべる
  python3 tools/pixel_gate.py --baseline --all
  python3 tools/pixel_gate.py --update-baseline 届いたもの   # ★基準画を 作る／替える

  ★★★この 型が 意味を 持つ のは ★**同じ 環境で 撮った 2枚 どうし だけ** です（★Opus Q5）。
    ★台（OS）・見るもの（chrome の 版）・大きさ・倍・時計・言葉・時刻帯 ──
    ★★1つでも 違えば ★その 基準画は **無効** です。★くらべずに 止まります。
    ★★chrome が 上がった とき、★別の 機械で 動かす とき は ★基準画を 撮り直します
      （★`--update-baseline`。★前後の 差を 見て から 決めます）。
  ★★くらべる 前に 必ず 較正します ──
    ★基準画の 1画素を 1 だけ 変えた 写しを 作り、★差 1 を 見つけられる ことを 確かめます。
    ★★見つけられなければ ★くらべません（★`pixel_lint.calibrate` を そのまま 使います）。
  ★★替える 前に 必ず 前後の 差を 出し、★`yes` と 打たれた ときだけ 上書きします。
  ★★台帳の 中身（★試しの 台帳の 行）が 変われば ★画面も 変わります。★それも 差に 出ます。
"""
import json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel_lint  # ★較正と くらべる 式は ここ 1つ（★2つ 書きません）

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

# ════════════════════════════════════════════════════════════════════
# ★★★基準画の 型（★2026-09-26）
#   ★くらべる 相手は ★実装 自身の 前の 絵 です。★見本では ありません。
#   ★★撮るのは `tools/baseline_shot.js`（★時計・動き・倍を 止めて 撮る）。
#   ★★較正と くらべる 式は `pixel_lint`（★2つ 書きません）。
# ════════════════════════════════════════════════════════════════════
基準 = os.path.join(蔵, "docs/design/pixel_baseline")
基準_今 = os.path.join(基準, "_now")     # ★今回 撮った 絵（★git に 入れません）
基準_差 = os.path.join(基準, "_diff")    # ★差の 絵（★git に 入れません）

def 基準を撮る(名, 出す):
  """★実装を 1枚 撮ります。★返す もの …… (名札, 覆い) ／ 撮れなければ (None, 理由)"""
  r = 走る(["node", "tools/baseline_shot.js", 名, 出す])
  名札 = 覆い = None
  for l in r.stdout.split("\n"):
    if l.startswith("ENV: "): 名札 = json.loads(l[5:])
    if l.startswith("MASK: "): 覆い = json.loads(l[6:])
  if r.returncode != 0 or 名札 is None or not os.path.exists(出す):
    return None, (r.stdout + r.stderr).strip()[-400:]
  return 名札, 覆い or []

def 名札の差(a, b):
  return [(k, a.get(k), b.get(k)) for k in sorted(set(a) | set(b)) if a.get(k) != b.get(k)]

def 覆いの箱(*覆い群):
  箱 = []
  for 覆い in 覆い群:
    for m in 覆い:
      t = tuple(m["箱"])
      if t not in 箱: 箱.append(t)
  return 箱

def 較正する(基準画, 箱):
  """★★くらべる 前に 道具を 試します ── ★試せなければ くらべません。
  ★① `pixel_lint.calibrate` …… ★同じ 画 → 0 ／ ★1画素を 1 だけ 変える → 1
  ★② ★覆い つき でも 同じ（★覆いの **外** の 1画素を 1 だけ 変えた 基準画 を 作る）
     ★★覆いが 広がり すぎて 画面を 呑んで いたら、★ここで 落ちます。
  """
  import numpy as np
  from PIL import Image
  ok1 = pixel_lint.calibrate(基準画, quiet=True)
  a = np.asarray(Image.open(基準画).convert("RGB")).copy()
  h, w, _ = a.shape
  覆われ = np.zeros((h, w), bool)
  for (x0, y0, x1, y1) in 箱: 覆われ[y0:y1, x0:x1] = True
  外 = np.argwhere(~覆われ)
  if not len(外):
    return False, "★覆いが 画面 ぜんぶ を 呑んで います"
  y, x = 外[len(外) // 2]
  v = int(a[y, x, 0]); a[y, x, 0] = v - 1 if v > 0 else 1   # ★巻き戻さない（pixel_lint と 同じ）
  os.makedirs(基準_差, exist_ok=True)
  仕込み = os.path.join(基準_差, "_較正-1画素.png")
  Image.fromarray(a).save(仕込み)
  r = pixel_lint.compare(基準画, 仕込み, 0.0, 箱)
  os.remove(仕込み)
  ok2 = r.get("diff") == 1
  return ok1 and ok2, "①素の 較正 %s ／ ②覆い つき・(%d,%d) を 1 変える → 差 %s %s" % (
    "○" if ok1 else "★★NG", x, y, r.get("diff"), "○" if ok2 else "★★NG 見逃しました")

def 差を出す(前, 後, 箱, 名):
  """★差の 数・率・絵。★大きさが 違えば 数は 出せません（★-1）。"""
  import numpy as np
  from PIL import Image
  r = pixel_lint.compare(前, 後, 0.0, 箱)
  if r["diff"] < 0:
    return r
  if r["diff"]:
    a, _ = pixel_lint.load(前); b, _ = pixel_lint.load(後)
    d = pixel_lint.delta(a, b)
    for (x0, y0, x1, y1) in 箱: d[y0:y1, x0:x1] = 0
    out = np.asarray(Image.open(後).convert("RGB")).copy()
    out[d > 0] = [255, 0, 255]
    os.makedirs(基準_差, exist_ok=True)
    r["絵"] = os.path.join(基準_差, "%s-差.png" % 名)
    Image.fromarray(out).save(r["絵"])
  return r

def 差を言う(r, 頭="  "):
  if r["diff"] < 0:
    print(頭 + "★大きさが 違います …… " + r["err"].replace("大きさが 違います ", ""))
    print(頭 + "   ★★画素の 差は 数えられません（★縦が 伸び縮み した ＝ 中身が 変わった）")
    return
  print(頭 + "差 %d 画素 / %d（%.6f%%）" % (r["diff"], r["total"], r["pct"]))
  if r["diff"]:
    print(頭 + "   場所 %s ／ いちばん 大きい ずれ %.3f" % (r["box"], r["worst"]))
    print(頭 + "   差の 絵 …… " + os.path.relpath(r["絵"], 蔵))

def 覆いを言う(箱, 覆い群, 頭="  "):
  if not 箱: print(頭 + "覆い …… なし"); return
  なぜ = sorted({m["なぜ"] for 覆い in 覆い群 for m in 覆い})
  print(頭 + "覆い（★くらべて いない ところ）…… %d か所 %s ／ %s" % (len(箱), 箱, "・".join(なぜ)))

def 基準と比べる(名):
  print("=" * 66)
  print("★" + 名 + "（★基準画と くらべる）")
  前 = os.path.join(基準, 名 + ".png"); 札 = os.path.join(基準, 名 + ".json")
  if not (os.path.exists(前) and os.path.exists(札)):
    print("  ★基準画が ありません …… " + os.path.relpath(前, 蔵))
    print("     ★★作る とき …… python3 tools/pixel_gate.py --update-baseline " + 名)
    return {"名": 名, "画素": None, "なぜ": "基準画が 無い"}
  前札 = json.load(open(札, encoding="utf-8"))
  os.makedirs(基準_今, exist_ok=True)
  後 = os.path.join(基準_今, 名 + ".png")
  後名札, 後覆い = 基準を撮る(名, 後)
  if 後名札 is None:
    print("  ★撮れません ……\n" + 後覆い)
    return {"名": 名, "画素": None, "なぜ": "撮れない"}
  違い = 名札の差(前札["名札"], 後名札)
  if 違い:
    # ★★★環境が 違えば ★基準画は 無効 です（★Opus Q5）。★くらべません。
    print("  ★★止まりました ── ★撮った 環境が 基準画と 違います（★この 基準画は 無効）")
    for k, a, b in 違い: print("     %s …… 基準 %s ／ 今 %s" % (k, a, b))
    return {"名": 名, "画素": None, "なぜ": "環境が 違う（無効）"}
  箱 = 覆いの箱(前札.get("覆い", []), 後覆い)
  通, 言 = 較正する(前, 箱)
  print("  較正 …… " + 言)
  if not 通:
    print("  ★★止まりました ── ★道具が ずれを 見逃します。★くらべません。")
    return {"名": 名, "画素": None, "なぜ": "較正が 落ちた"}
  覆いを言う(箱, [前札.get("覆い", []), 後覆い])
  r = 差を出す(前, 後, 箱, 名)
  差を言う(r)
  return {"名": 名, "画素": r["diff"] if r["diff"] >= 0 else None,
          "なぜ": None if r["diff"] >= 0 else "大きさが 違う", "率": r.get("pct")}

def 基準を替える(名):
  print("=" * 66)
  print("★" + 名 + "（★基準画を 作る／替える）")
  os.makedirs(基準_今, exist_ok=True)
  # ★★★2回 撮ります ── ★2枚 が 0 で なければ ★その 画面は 撮る たびに 変わります。
  #   ★★揺れる 絵を 基準に すると ★毎回 赤に なり、★誰も 見なく なります。
  甲 = os.path.join(基準_今, 名 + "-甲.png"); 乙 = os.path.join(基準_今, 名 + "-乙.png")
  甲札, 甲覆い = 基準を撮る(名, 甲)
  乙札, 乙覆い = 基準を撮る(名, 乙) if 甲札 else (None, None)
  if 甲札 is None or 乙札 is None:
    print("  ★撮れません ……\n" + str(甲覆い if 甲札 is None else 乙覆い))
    return 1
  箱 = 覆いの箱(甲覆い, 乙覆い)
  通, 言 = 較正する(甲, 箱)
  print("  較正 …… " + 言)
  if not 通:
    print("  ★★止まりました ── ★道具が ずれを 見逃します。★替えません。"); return 1
  揺れ = pixel_lint.compare(甲, 乙, 0.0, 箱)
  print("  2回 撮った 揺れ …… 差 %s 画素" % 揺れ["diff"])
  if 揺れ["diff"] != 0:
    print("  ★★止まりました ── ★撮る たびに 変わります。★基準に できません。"); return 1
  覆いを言う(箱, [甲覆い])
  前 = os.path.join(基準, 名 + ".png"); 札 = os.path.join(基準, 名 + ".json")
  if os.path.exists(前) and os.path.exists(札):
    # ★★★誤って 上書きしない ために ★前後の 差を 出してから 聞きます。
    前札 = json.load(open(札, encoding="utf-8"))
    違い = 名札の差(前札["名札"], 甲札)
    print("  ★今の 基準画 …… %s（%s に 撮影）" % (os.path.relpath(前, 蔵), 前札.get("撮った時")))
    if 違い:
      print("  ★★環境が 変わります（★前の 基準画は この 環境では 無効 でした）")
      for k, a, b in 違い: print("     %s …… 前 %s ／ 今 %s" % (k, a, b))
    差を言う(差を出す(前, 甲, 覆いの箱(前札.get("覆い", []), 甲覆い), 名), "  前後の ")
    try:
      答 = input("  ★この 絵で 基準画を 上書きする なら yes と 打って ください > ").strip()
    except EOFError:
      答 = ""
    if 答 != "yes":
      print("  ★上書き しません（★基準画は 前の まま）"); return 1
  os.makedirs(基準, exist_ok=True)
  import shutil
  shutil.copyfile(甲, 前)
  頭 = 走る(["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
  import datetime
  json.dump({"名札": 甲札, "覆い": 甲覆い, "撮った木": 頭,
             "撮った時": datetime.datetime.now().astimezone().isoformat(timespec="seconds")},
            open(札, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
  print("  ★基準画を 書きました …… " + os.path.relpath(前, 蔵))
  return 0

def 基準と比べる_全部(的):
  出来 = [基準と比べる(n) for n in 的]
  print("=" * 66)
  print("★まとめ（★基準画と くらべる）")
  for r in 出来:
    if r["画素"] is None:
      print("  %-12s ★くらべて いません（%s）" % (r["名"], r["なぜ"]))
    else:
      print("  %-12s 差 %d 画素（%.6f%%）" % (r["名"], r["画素"], r["率"]))
  赤 = [r for r in 出来 if r["画素"] != 0]
  print("RESULT: " + ("OK" if not 赤 else "DIFF（%d枚）" % len(赤)))
  return 0 if not 赤 else 1

def 基準を替える_全部(的):
  結 = [(n, 基準を替える(n)) for n in 的]
  print("=" * 66)
  for n, c in 結: print("  %-12s %s" % (n, "書きました" if c == 0 else "★書いて いません"))
  落 = [n for n, c in 結 if c != 0]
  print("RESULT: " + ("OK" if not 落 else "NG（%d枚）" % len(落)))
  return 0 if not 落 else 1

def main():
  名一覧 = json.load(open(道, encoding="utf-8"))
  名一覧 = [k for k in 名一覧 if not k.startswith("★")]
  引 = [a for a in sys.argv[1:] if not a.startswith("--")]
  的 = 名一覧 if "--all" in sys.argv else 引
  if not 的:
    print(__doc__); return 2
  if "--update-baseline" in sys.argv:
    return 基準を替える_全部(的)
  if "--baseline" in sys.argv:
    return 基準と比べる_全部(的)
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
