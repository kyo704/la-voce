# -*- coding: utf-8 -*-
"""★見本に 残って いる「未読」の 仕掛けを 数えます（★2026-09-18・裁定 その87 の あと）"""
import io, os, re, sys
ROOT = os.path.dirname(os.path.abspath("."))
# ★★荷の 名指しを やめました（★2026-09-19）。★`pack_path` が 選びます。
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_path import 荷
D = 荷()
本 = [f for f in sorted(os.listdir(D)) if f.endswith(".html")]
if len(本) != 4:
  print("★止まりました ── 見本が 4本 ありません（%d本）" % len(本)); sys.exit(2)
語 = ["MONKAUN", "UNREAD", "markAll", "function unN", "MISOU", "class=\"dot\"", "未読"]
print("| 見本 | " + " | ".join(語) + " |")
for f in 本:
  s = io.open(os.path.join(D, f), encoding="utf-8").read()
  print("| %s | " % f.replace("00-動く見本", "").replace(".html", "")
        + " | ".join(str(s.count(w)) for w in 語) + " |")
# ★★較正 ── ★必ず ある 語で、★数え方が 生きて いる ことを 確かめます。
s0 = io.open(os.path.join(D, 本[0]), encoding="utf-8").read()
if s0.count("function") < 10:
  print("★止まりました ── 数え方が 壊れて います"); sys.exit(2)
print("\n★較正 ok（`function` が %d 個 見つかりました）" % s0.count("function"))
