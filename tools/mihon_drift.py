#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本と 実装が ずれて いないか、★作り直さずに 見ます。

  ★★`mihon_to_spec.py` は **書き換え**ます。
    ★こちらは **見るだけ** です。★見張りから 呼べます。
  ★★ずれて いたら 落ちます ── ★「見本が 動いたのに、実装が 古い」を 捕まえます。
"""

import io
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, "lib", "mihonSpec.json")
DP = os.path.join(ROOT, "lib", "displayPrefs.js")
CSS = os.path.join(ROOT, "app", "globals.css")

for p in (SPEC, DP, CSS):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    sys.exit(1)

spec = json.load(io.open(SPEC, encoding="utf-8"))
dp = io.open(DP, encoding="utf-8").read()
css = io.open(CSS, encoding="utf-8").read()

bad = []

m = re.search(r"export const SCALES = (\[[^\]]*\]);", dp)
if not m:
  bad.append("SCALES を 読めません")
else:
  got = json.loads(m.group(1))
  if got != spec["scaleKeys"]:
    bad.append("段が ちがいます　見本 %s ／ 実装 %s" % (spec["scaleKeys"], got))

m = re.search(r"export const SCALE_LABELS = (\{[^}]*\});", dp)
if m:
  got = json.loads(m.group(1))
  if got != spec["scaleLabels"]:
    bad.append("字が ちがいます")

# ★★★ここは 自動で ついて きません。★正直に 数えます。
#   ★★`app/globals.css` の `[data-scale="…"]` は、★手で 書いた 段 です。
#     ★★見本で 段が 増えても、★CSS は 増えません。
#     ★★5→6 の ためしで、★実際に ここだけ 取り残されました。
have = set(re.findall(r'\[data-scale="([a-z]+)"\]', css))
need = [k for k in spec["scaleKeys"] if k != "normal"]   # ★normal は 既定（段 不要）
missing_css = [k for k in need if k not in have]
if missing_css:
  bad.append("app/globals.css に 段が ありません: " + ", ".join(missing_css))

print("段: %d  %s" % (len(spec["scaleKeys"]), " / ".join(spec["scaleKeys"])))
print("CSS の 段: %s" % ", ".join(sorted(have)))
if bad:
  print("")
  print("★★ずれて います:")
  for x in bad:
    print("   ★ " + x)
  print("　★直し方 … node tools/mihon_extract.js 設定 && python3 tools/mihon_to_spec.py")
  print("　★★CSS の 段は 手で 足して ください（★自動では 増えません）。")
  sys.exit(1)
print("★ずれて いません。")
