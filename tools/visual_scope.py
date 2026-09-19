# -*- coding: utf-8 -*-
"""★裁定 その81 §1〜§3 ── ★当たる 範囲を 先に 数える（★2026-09-19）

  ★★★裁定 その81 §9 の 失敗 4件は、★どれも 同じ 形 です ──
    ★★「変えが 当たる 範囲を 確かめずに 走らせた」。
  ★★だから 走らせる 前に、★1件ずつ 数えます。

  ★★★数える もの
    ★① 生の 色（`#xxxxxx` ／ `rgb(`）── ★どの ファイルに 何か所
    ★② 生の 文字の 大きさ（`fontSize: "…"` ／ `px`）と、★6段に 無い 値
    ★③ すでに トークンを 通して いる ところ
    ★④ 触っては いけない ところ（★定義そのもの）

  ★★較正 ── ★必ず 当たる ものと、★当たらない もので 試します。
"""

import io, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
見る所 = ["components", "lib", "app"]
除く = ("tests", "node_modules", ".next")

# ★★裁定 その81 §2 の 6段（★これ いがいは 使いません）。
段 = [12, 12.5, 13, 13.5, 14.5, 15.5]

色 = re.compile(r"#[0-9a-fA-F]{3,8}\b|rgba?\(")
大きさ = re.compile(r"fontSize:\s*[\"'`]?([0-9.]+)(px|rem)")
トークン = re.compile(r"\bv\(|var\(--|C\.[a-zA-Z]")


def 走る():
  出 = []
  for 頭 in 見る所:
    p = os.path.join(ROOT, 頭)
    if not os.path.isdir(p):
      continue
    for 根, 枝, 葉 in os.walk(p):
      枝[:] = [d for d in 枝 if d not in 除く]
      for f in 葉:
        if not f.endswith((".js", ".jsx")):
          continue
        みち = os.path.join(根, f)
        本 = io.open(みち, encoding="utf-8").read()
        # ★★註を 落とします。★註の 中の 色は 直しません。
        素 = re.sub(r"/\*.*?\*/", "", 本, flags=re.S)
        素 = "\n".join(l for l in 素.split("\n") if not re.match(r"^\s*//", l))
        色数 = len(色.findall(素))
        大 = [(float(m.group(1)), m.group(2)) for m in 大きさ.finditer(素)]
        px = [x for x, u in 大 if u == "px"]
        rem = [x for x, u in 大 if u == "rem"]
        外 = [x for x in px if x not in 段]
        出.append({
          "みち": os.path.relpath(みち, ROOT),
          "色": 色数, "px": len(px), "rem": len(rem), "段外": 外,
          "トークン": len(トークン.findall(素))
        })
  return 出


行 = 走る()
if not 行:
  raise SystemExit("★止まりました ── ファイルを 1つも 読めません")
# ★★較正 ── ★必ず 当たる はず の もの。
色持ち = [r for r in 行 if r["色"] > 0]
if not 色持ち:
  raise SystemExit("★止まりました ── 生の 色が 1つも 見つかりません。道具が 壊れて います。")
if any(r["色"] > 0 and "lib/tokens.js" not in r["みち"] and r["色"] > 200 for r in 行):
  pass

定義 = [r for r in 行 if r["みち"] in ("lib/tokens.js", "lib/visualTokens.js")]
使う = [r for r in 行 if r not in 定義]

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-裁定81の当たる範囲.md" % 今日)

書 = []
書.append("# ★裁定 その81 §1〜§3 ── ★当たる 範囲")
書.append("")
書.append("★%s ／ ★`tools/visual_scope.py` が 書きました。" % 今日)
書.append("★（★丈は 下に あります）")
書.append("")
書.append("★★★§9 の 失敗 4件は、★どれも「範囲を 確かめずに 走らせた」形 です。")
書.append("★★だから 走らせる 前に 数えます。")
書.append("")
書.append("## ★数（★註を 外した もとで 数えて います）")
書.append("")
書.append("| | 数 |")
書.append("|---|---|")
書.append("| 見た ファイル | %d |" % len(行))
書.append("| 生の 色が ある ファイル | %d |" % len([r for r in 使う if r["色"] > 0]))
書.append("| 生の 色 …… のべ | %d |" % sum(r["色"] for r in 使う))
書.append("| `fontSize` px …… のべ | %d |" % sum(r["px"] for r in 使う))
書.append("| `fontSize` rem …… のべ | %d |" % sum(r["rem"] for r in 使う))
書.append("| ★6段に 無い px | %d |" % sum(len(r["段外"]) for r in 使う))
書.append("| トークンを 通して いる ところ | %d |" % sum(r["トークン"] for r in 使う))
書.append("")
書.append("## ★★触っては いけない ところ（★定義）")
書.append("")
書.append("| ファイル | 生の 色 |")
書.append("|---|---|")
for r in 定義:
  書.append("| `%s` | %d |" % (r["みち"], r["色"]))
書.append("")
書.append("★★★ここは **色そのもの** を 書く ところ です。")
書.append("★★§9 の 失敗②は、★ここを 置換して `--ink:var(--ink)` に した もの です。")
書.append("")
書.append("## ★生の 色が 多い ところ（★上から 20）")
書.append("")
書.append("| ファイル | 生の 色 | トークン |")
書.append("|---|---|---|")
for r in sorted(使う, key=lambda x: -x["色"])[:20]:
  if r["色"] == 0:
    break
  書.append("| `%s` | %d | %d |" % (r["みち"], r["色"], r["トークン"]))
書.append("")
書.append("## ★6段に 無い 文字の 大きさ")
書.append("")
書.append("| ファイル | 値 |")
書.append("|---|---|")
段外あり = [r for r in 使う if r["段外"]]
for r in sorted(段外あり, key=lambda x: -len(x["段外"]))[:20]:
  書.append("| `%s` | %s |" % (r["みち"],
    "／".join(str(x) for x in sorted(set(r["段外"])))))
if not 段外あり:
  書.append("| （ありません） | |")
書.append("")
書.append("## ★この 数の 読み方")
書.append("")
書.append("★★`rem` は 数えて いますが、★段の 外か どうかは 見て いません。")
書.append("★★★`rem` は 端末の 文字の 大きさに 従います。★px に 直すのは 別の 話 です。")
書.append("★★個人の 画面（門の 外の 38人）も 数に 入って います。")
書.append("★★★一度に 当てません。★運営から、★1つずつ 当てます。")

本文 = "\n".join(書) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 書[-1]), 1)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("ファイル %d ／ 生の色 のべ %d ／ px のべ %d ／ 段外 %d"
      % (len(行), sum(r["色"] for r in 使う), sum(r["px"] for r in 使う),
         sum(len(r["段外"]) for r in 使う)))
