#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★いらなく なった 暗い ほうの 上書きを 見つける（★No.013 DECISION_1 THEN）。

  ★出どころ 2026-09-14

  ★★54行を --enji-bg に そろえた ので、★暗い ほうの 上書きの うち、
    ★同じ ことを 言って いる だけの ものが 出ます。
  ★★消してよいのは、★次の 両方が 当てはまる ときだけ です ──
    ★① 上書きの 中の ひと言（宣言）が、★もとの 決まりと 同じ 値に なる
    ★② その ひと言を 消しても、★ほかの ひと言が 残らない
      ★（★残るなら、★その 決まり ごと 消すのは 誤りです）
  ★★どちらとも 言えない ものは、★消さずに 並べます。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
MIHON = [f for f in sorted(os.listdir(PACK)) if f.startswith("00-動く見本")]


def decls(block):
  out = {}
  for k, v in re.findall(r'([a-zA-Z-]+)\s*:\s*([^;}]+)', block):
    out[k.strip()] = v.strip()
  return out


clear, unsure = [], []
for f in MIHON:
  raw = io.open(os.path.join(PACK, f), encoding="utf-8").read()
  # ★★もとの 決まり（★暗い ほうで ない もの）を 選び方ごとに 集めます。
  base = {}
  for m in re.finditer(r'(?m)^([^\n{@/][^{\n]*)\{([^}]*)\}', raw):
    sel, body = m.group(1).strip(), m.group(2)
    if 'data-th="dark"' in sel or sel.startswith(":root"):
      continue
    for s in [x.strip() for x in sel.split(",") if x.strip()]:
      base.setdefault(s, {}).update(decls(body))

  for m in re.finditer(r'(?m)^(html\[data-th="dark"\][^{\n]*)\{([^}]*)\}', raw):
    sel, body = m.group(1).strip(), m.group(2)
    d = decls(body)
    if not any(v == "var(--enji-bg)" for v in d.values()):
      continue
    sels = [x.replace('html[data-th="dark"]', "").strip()
            for x in sel.split(",") if x.strip()]
    line = raw[:m.start()].count("\n") + 1
    # ★★ひと言ごとに、★もとの 決まりと 同じかを 見ます。
    same, differ = [], []
    for k, v in d.items():
      vals = {base.get(s, {}).get(k) for s in sels}
      if vals == {v}:
        same.append(k)
      else:
        differ.append(k + "(" + str(sorted(x for x in vals if x)) + ")")
    rec = {"file": f, "line": line, "sel": sel[:78],
           "same": same, "differ": differ, "n": len(sels)}
    (clear if not differ else unsure).append(rec)

print("① 決まり ごと 消してよい もの（★ひと言が すべて 同じ）: " + str(len(clear)))
for r in clear:
  print("   " + r["file"][:20] + ":" + str(r["line"]) + "  " + r["sel"][:64])
print("\n② 消せない もの（★違う ひと言が 残る）: " + str(len(unsure)))
for r in unsure:
  print("   " + r["file"][:20] + ":" + str(r["line"]) + "  " + r["sel"][:52])
  print("        同じ " + str(r["same"]) + " / 違う " + str(r["differ"])[:90])
