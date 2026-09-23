#!/usr/bin/env python3
"""★見本の 1画面の もとを 出します。使い方: python3 tools/sc_src.py <鍵> [行数]"""
import io, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "docs", "design", "pack-final")
M = ["00-動く見本-PC・iPad（運営）.html", "00-動く見本-iPhoneで開く用.html",
     "00-動く見本（さわれる・全画面）.html", "00-動く見本-PC・iPad（個人）.html"]
key = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 4000
for f in M:
  p = os.path.join(PACK, f)
  if not os.path.exists(p): continue
  s = io.open(p, encoding="utf-8").read()
  m = re.search(r"SC\['" + re.escape(key) + r"'\]\s*=\s*(\w+)", s)
  if m and m.group(1) != "function":
    i = s.find("function %s(" % m.group(1))
  else:
    i = s.find("SC['%s']=" % key)
  if i < 0: continue
  print("★見本:", f); print(s[i:i+n]); sys.exit(0)
print("★見つかりません:", key); sys.exit(2)
