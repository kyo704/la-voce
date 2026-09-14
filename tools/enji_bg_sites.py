#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★`background: var(--enji)` の ところを 数え、★暗い ほうで 上書きが あるかを 見る。

  ★出どころ 2026-09-14、★No.013 STEP_4（★ON_MISMATCH: STOP_AND_REPORT）

  ★★なぜ 気に なるか
    ★★--enji は「字・線」の 役に なりました。★暗い ほうでは #E790A2 です。
    ★★地に --enji を 使って いる ところが 残って いると、
      ★暗い ほうで **桃色の 地**に なります。
    ★★その 上の 白い 字は、★比 2.36 です。★読めません。
    ★★ただし、★暗い ほうで 別に 上書きして いれば、★困りません。
  ★★だから「上書きが あるか」で 2つに 分けます。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]

rows = []
for f in MIHON:
  raw = io.open(os.path.join(PACK, f), encoding="utf-8").read()
  lines = raw.split("\n")
  # ★★暗い ほうで、★地を 上書きして いる 選び方を すべて 集めます。
  dark_bg = set()
  for m in re.finditer(r'html\[data-th="dark"\]([^{]*)\{([^}]*)\}', raw):
    if re.search(r'background(?:-color)?\s*:', m.group(2)):
      for sel in m.group(1).split(","):
        sel = sel.replace('html[data-th="dark"]', "").strip()
        if sel:
          dark_bg.add(sel)
  for i, line in enumerate(lines):
    if not re.search(r'background(?:-color)?\s*:\s*var\(--enji\)', line):
      continue
    if 'data-th="dark"' in line:
      continue
    sel = line.split("{")[0].strip()
    parts = [s.strip() for s in sel.split(",") if s.strip()]
    covered = [p for p in parts if p in dark_bg]
    rows.append({"file": f, "line": i + 1, "sel": sel,
                 "n": len(re.findall(r'background(?:-color)?\s*:\s*var\(--enji\)', line)),
                 "covered": len(covered) == len(parts) and bool(parts),
                 "inline": "style=" in line and "{" not in line.split("style=")[0]})

tot = sum(r["n"] for r in rows)
cov = [r for r in rows if r["covered"]]
un = [r for r in rows if not r["covered"]]
print("★background:var(--enji) … " + str(tot) + "回 / " + str(len(rows)) + "行")
print("　★暗い ほうで 上書きが ある : " + str(len(cov)) + "行")
print("　★上書きが ない            : " + str(len(un)) + "行  ← ★桃色の 地に なります")
print()
for r in un:
  print("  " + r["file"][:24] + ":" + str(r["line"]) + "  " + r["sel"][:78])

L = []
L.append("# 暗い ほうで 地が 桃色に なる ところ")
L.append("__LINE2__")
L.append("")
L.append("★出どころ 2026-09-14、★No.013 STEP_4（★ON_MISMATCH: STOP_AND_REPORT）")
L.append("")
L.append("## 何が 起きて いるか")
L.append("")
L.append("★★`--enji` は「字・線」に なりました。★暗い ほうでは `#E790A2`（桃）です。")
L.append("★★`background: var(--enji)` が **" + str(tot) + "回 / " + str(len(rows))
         + "行** 残って います。")
L.append("")
L.append("| | 行 | どう なるか |")
L.append("|---|---|---|")
L.append("| 暗い ほうで 上書きが ある | " + str(len(cov)) + " | ★困りません |")
L.append("| 上書きが ない | " + str(len(un)) + " | ★地が 桃色。★白字は 比 2.36 |")
L.append("")
L.append("## 上書きが ない ところ（★" + str(len(un)) + "行）")
L.append("")
L.append("| 見本 | 行 | 選び方 |")
L.append("|---|---|---|")
for r in un:
  f = r["file"].replace("00-動く見本", "").replace(".html", "").strip("-（）") or "全画面"
  L.append("| " + f + " | " + str(r["line"]) + " | `" + r["sel"][:70] + "` |")
L.append("")
L.append("## お決めを お願いします")
L.append("")
L.append("- ㋐ 上の " + str(len(un)) + "行を `var(--enji-bg)` に 直す")
L.append("- ㋑ 暗い ほうの 上書きを 足す")
L.append("- ㋒ そのままに する")
L.append("")
L.append("## この 数えが 見て いない こと")
L.append("")
L.append("- 字の 並びだけ を 見ます。★実際の 見た目は 見て いません。")
L.append("- 上書きは、★選び方が 字づらで 一致する ものだけ 数えて います。")
L.append("  ★親から 掛かる 上書きは 数えて いません。")

body = "\n".join(L)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__",
                    "全" + str(len(body.split("\n"))) + "行 / 末尾は「" + last + "」")
out = os.path.join(ROOT, "docs", "reports", "2026-09-14-dark-theme-role-split.md")
io.open(out, "w", encoding="utf-8").write(body + "\n")
print("\n→ " + out)
