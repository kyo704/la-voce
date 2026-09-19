# -*- coding: utf-8 -*-
"""★裁定 その81 §2（文字の 6段）── ★いまの 分布を 数える（★2026-09-19）

  ★★★6段 …… ★12 ／ 12.5 ／ 13 ／ 13.5 ／ 14.5 ／ 15.5（★16 以上は そのまま）
  ★★決まり ──「この 6段 いがいを 使わない」「12px より 小さい 字を 使わない」

  ★★★数える もの
    ★① `fontSize: rem(px)` ── ★字の 大きさ と 書いて ある ところ だけ
    ★② `fontSize: "…rem"` ／ `"…px"` と 直に 書いて いる ところ
    ★③ Tailwind の `text-…`（★別の 決まりの 数）

  ★★較正 ── ★必ず 在る 数と、★無い 数で 試します。
"""

import io, os, re, sys, datetime
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
見る所 = ["components", "lib", "app"]
除く = ("tests", "node_modules", ".next")
段 = [12, 12.5, 13, 13.5, 14.5, 15.5]

# ★★★はじめ `rem(…)` を ぜんぶ 数えて いました（★2026-09-19）。
#   ★★`rem()` は px を rem に 直す 助け です。★余白にも 使います。
#   ★★★`rem(4)` は 4px の 余白 です。★字の 大きさでは ありません。
#     ★★12 より 小さい ものが 322 と 出ました。★そんなに ありません。
#   ★★だから「字の 大きさ」と 書いて ある ところ だけ を 数えます。
rem呼び = re.compile(r"fontSize:\s*rem\(([0-9.]+)\)")
直rem = re.compile(r"fontSize:\s*[\"'`]([0-9.]+)rem")
直px = re.compile(r"fontSize:\s*[\"'`]([0-9.]+)px")
tw = re.compile(r"text-(xs|sm|base|lg|xl|2xl|3xl|\[[0-9.]+(px|rem)\])")
TW = {"xs": 12, "sm": 14, "base": 16, "lg": 18, "xl": 20, "2xl": 24, "3xl": 30}

rem数 = Counter(); px数 = Counter(); tw数 = Counter()
ファイル = Counter()
for 頭 in 見る所:
  p = os.path.join(ROOT, 頭)
  if not os.path.isdir(p):
    continue
  for 根, 枝, 葉 in os.walk(p):
    枝[:] = [d for d in 枝 if d not in 除く]
    for f in 葉:
      if not f.endswith((".js", ".jsx")):
        continue
      q = os.path.join(根, f)
      本 = io.open(q, encoding="utf-8").read()
      素 = re.sub(r"/\*.*?\*/", "", 本, flags=re.S)
      素 = "\n".join(l for l in 素.split("\n") if not re.match(r"^\s*//", l))
      n = 0
      for m in rem呼び.finditer(素):
        rem数[float(m.group(1))] += 1; n += 1
      for m in 直rem.finditer(素):
        rem数[round(float(m.group(1)) * 16, 2)] += 1; n += 1
      for m in 直px.finditer(素):
        px数[float(m.group(1))] += 1; n += 1
      for m in tw.finditer(素):
        tw数[m.group(1)] += 1
      if n:
        ファイル[os.path.relpath(q, ROOT)] = n

if not rem数:
  raise SystemExit("★止まりました ── `rem()` を 1つも 見つけられません")
if 12.5 not in rem数:
  raise SystemExit("★止まりました ── 較正が 合いません（12.5 が ありません）")

合 = Counter()
合.update(rem数); 合.update(px数)
段内 = sum(v for k, v in 合.items() if k in 段)
段外 = sum(v for k, v in 合.items() if k not in 段 and k < 16)
大 = sum(v for k, v in 合.items() if k >= 16)
小 = sum(v for k, v in 合.items() if k < 12)

今日 = datetime.date.today().isoformat()
行 = []
行.append("# ★裁定 その81 §2 ── ★いまの 文字の 大きさ")
行.append("")
行.append("★%s ／ ★`tools/type_scope.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★6段 …… 12 ／ 12.5 ／ 13 ／ 13.5 ／ 14.5 ／ 15.5（★16 以上は そのまま）")
行.append("")
行.append("| | 数 |")
行.append("|---|---|")
行.append("| 6段の 中 | %d |" % 段内)
行.append("| ★6段の 外（12〜16 の あいだ） | %d |" % 段外)
行.append("| 16 以上（そのまま でよい） | %d |" % 大)
行.append("| ★★12 より 小さい | %d |" % 小)
行.append("| 合計 | %d |" % sum(合.values()))
行.append("")
行.append("## ★使われて いる 大きさ（★多い 順）")
行.append("")
行.append("| px | のべ | 6段か |")
行.append("|---|---|---|")
for k, v in sorted(合.items(), key=lambda x: -x[1]):
  印 = "○" if k in 段 else ("16以上" if k >= 16 else ("★12未満" if k < 12 else "★段の 外"))
  行.append("| %s | %d | %s |" % (k, v, 印))
行.append("")
行.append("## ★Tailwind の 字（★別の 決まりの 数）")
行.append("")
行.append("| 名 | のべ | px |")
行.append("|---|---|---|")
for k, v in tw数.most_common():
  行.append("| `text-%s` | %d | %s |" % (k, v, TW.get(k, "—")))
行.append("")
行.append("★★★`text-xs` は 12px です。★6段の いちばん 下と 同じ です。")
行.append("★★`text-sm`（14）と `text-base`（16）は、★6段に ありません。")
行.append("")
行.append("## ★この 数の 読み方")
行.append("")
行.append("★★`rem()` は 16 で 割って います。★元の 数（px）で 数えました。")
行.append("★★★端末の 文字の 大きさで、★実際の 見え方は 変わります。")
行.append("★★★12 より 小さい ものが あれば、★そこが いちばん の 問題 です。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-裁定81の文字の大きさ.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("段内 %d ／ 段外 %d ／ 16以上 %d ／ 12未満 %d ／ Tailwind %d"
      % (段内, 段外, 大, 小, sum(tw数.values())))
