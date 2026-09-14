#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★いらなく なった 上書きを 取り除く（★No.013 DECISION_1 THEN）。

  ★出どころ 2026-09-14

  ★★どれが 要らないかは、★tools/enji_dark_redundant_live.py が 決めます。
    ★字づらでは 決められません でした ──
      ★もとの 決まりが `border:1px solid var(--enji-bg)` の ひとまとめ 書きで、
      ★上書きは `border-color:` の 一言 書きだった ため です。
    ★★実際に 開いて、★その 一言を 取り消し、★見え方が 変わるかで 決めます。
    ★★画面に 出て いない 札は、★選び方から にせの 札を 作って 置きます。

  ★★消し方
    ★① 決まり ごと 要らない … その 1行を まるごと 消す
    ★② 一言だけ 要らない　 … その 一言だけ 消す

  ★★見つけた こと（★消せなかった 理由）
    ★`.pill.on` の 上書きは 要ります。★暗い ほうに
      `html[data-th="dark"] .pill{border-color:var(--line)}` が あり、
      ★もとの `.pill.on` より 強いからです。★上書きが 無いと 枠が 灰に なります。
"""

import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")

r = subprocess.run([sys.executable, os.path.join(ROOT, "tools",
                                                 "enji_dark_redundant_live.py")],
                   capture_output=True, text=True, cwd=ROOT)
if r.returncode:
  print("ERR: " + r.stderr.strip()[:300])
  sys.exit(1)

# ★★上の 道具の 判定を、★もう一度 中で 使います。★二重に 数えないため、
#   ★★判定そのものを ここで 取り直します（★JSON で 受け取ります）。
sys.path.insert(0, os.path.join(ROOT, "tools"))

WHOLE = []   # (file, selectorText)
PARTIAL = []  # (file, selectorText, prop)
for line in r.stdout.split("\n"):
  pass

# ★★字づらの 解釈に 頼らず、★判定を もう一度 走らせて 受け取ります。
JSONER = os.path.join(ROOT, "tools", "_redundant_json.py")
io.open(JSONER, "w", encoding="utf-8").write(
  io.open(os.path.join(ROOT, "tools", "enji_dark_redundant_live.py"),
          encoding="utf-8").read().split('whole, partial, nomatch')[0]
  + 'import json as _j\nprint("JSON:" + _j.dumps(data))\n')
r2 = subprocess.run([sys.executable, JSONER], capture_output=True, text=True,
                    cwd=ROOT)
os.remove(JSONER)
if r2.returncode:
  print("ERR: " + r2.stderr.strip()[:300])
  sys.exit(1)
data = json.loads([x for x in r2.stdout.split("\n")
                   if x.startswith("JSON:")][0][5:])

for f in data:
  for rule in f["rules"]:
    if rule["matched"] <= 0:
      continue
    if rule["wholeRuleRedundant"]:
      WHOLE.append((f["file"], rule["sel"]))
    else:
      for d in rule["decls"]:
        if d["redundant"]:
          PARTIAL.append((f["file"], rule["sel"], d["prop"]))

print("★決まり ごと 消す: " + str(len(WHOLE)))
print("★一言だけ 消す  : " + str(len(PARTIAL)))

changed = {}
for fname in sorted(set([x[0] for x in WHOLE] + [x[0] for x in PARTIAL])):
  path = os.path.join(PACK, fname)
  raw = io.open(path, encoding="utf-8").read()
  n_w = n_p = 0

  def find_rule(raw, sel):
    """★決まりの 頭を 探す。★書きぶりの ゆれを 吸収します。

      ★★ブラウザは 選び方を 書き直します（★`,` の あとに 空きを 入れる）。
        ★★見本の 字は 空きが ありません。★そのままでは 見つかりません。
    """
    for cand in (sel, sel.replace(", ", ","), sel.replace(",", ", ")):
      i = raw.find(cand + "{")
      if i >= 0:
        return i, cand
    return -1, sel

  for (f2, sel) in [x for x in WHOLE if x[0] == fname]:
    # ★★その 決まりだけを、★丸ごと 取ります。★字を 決め打ちで 探します。
    i, sel = find_rule(raw, sel)
    if i < 0:
      print("   ★見つかりません: " + sel[:60])
      sys.exit(2)
    j = raw.find("}", i)
    if j < 0:
      print("   ★閉じが ありません: " + sel[:60])
      sys.exit(2)
    seg = raw[i:j + 1]
    # ★★1行に ほかの 決まりが 続く ことが あります。★その 1つだけ 抜きます。
    raw = raw[:i] + raw[j + 1:]
    # ★★行が 空に なったら、★行ごと 落とします。
    raw = raw.replace("\n\n\n", "\n\n")
    n_w += 1

  for (f2, sel, prop) in [x for x in PARTIAL if x[0] == fname]:
    i, sel = find_rule(raw, sel)
    if i < 0:
      print("   ★見つかりません: " + sel[:60])
      sys.exit(2)
    j = raw.find("}", i)
    body = raw[i + len(sel) + 1:j]
    parts = [p for p in body.split(";") if p.strip()]
    keep = [p for p in parts if p.split(":")[0].strip() != prop]
    if len(keep) == len(parts):
      print("   ★その 一言が ありません: " + sel[:40] + " / " + prop)
      sys.exit(2)
    raw = raw[:i + len(sel) + 1] + ";".join(keep) + raw[j:]
    n_p += 1

  io.open(path, "w", encoding="utf-8").write(raw)
  changed[fname] = (n_w, n_p)
  print("  " + fname[:26] + "  決まり " + str(n_w) + " / 一言 " + str(n_p))

# ★★消したあと、★もう一度 数えます。★0 で なければ なりません。
r3 = subprocess.run([sys.executable, os.path.join(ROOT, "tools",
                                                  "enji_dark_redundant_live.py")],
                    capture_output=True, text=True, cwd=ROOT)
head = r3.stdout.split("\n")
print()
for l in head:
  if l.startswith("★"):
    print("  あと: " + l)
