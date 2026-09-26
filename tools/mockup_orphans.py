#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本の 中で、★どこからも 開かれて いない 画面を 数えます（★2026-09-26）。

★★★なぜ 要るか ── ★こちらで 画面を 作って あっても、
  ★見本に 入口が 無い なら、★入口を こちらで 決める ことに なります。
  ★★台帳「見本に ある 仕掛けだけ を 使う」に 反します。
  ★★★だから「見本の 側の 欠け」として 数え、★Opus に お返しします。

★★★見つけられる もの ──
  ★`SC['名']`／`SH['名']` が ある のに、★ほかの 画面の 本文に `'名'` が 1度も 出ない 画面。
★★★見つけられない もの ──
  ★字を 組み立てて 開く 道（★`push(k)` の `k` が 変数 の とき）。
  ★別の 名（別名）で 開かれて いる とき。
  ★★だから 出た ものは **目で たどって から** 返す こと。

★使い方  python3 tools/mockup_orphans.py [見本の 紙 …]
"""
import io, os, re, sys

蔵 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
既定 = [
  "docs/design/pack-final/00-動く見本-iPhoneで開く用.html",
  "docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
  "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html"
]

def 孤立(p):
  s = io.open(os.path.join(蔵, p), encoding="utf-8", errors="ignore").read()
  画面 = {}
  for m in re.finditer(r"(SC|SH|OSC|OSH)\[\s*'([^']+)'\s*\]\s*=\s*function\([^)]*\)\s*\{", s):
    i = m.end(); j = s.find("};", i)
    画面[m.group(2)] = s[i:j]
  出 = []
  for 名, 中 in 画面.items():
    親 = [k for k, v in 画面.items() if k != 名 and ("'" + 名 + "'") in v]
    if not 親:
      出.append(名)
  return 画面, sorted(出)

def main():
  紙 = sys.argv[1:] or 既定
  print("MOCKUP_ORPHANS")
  ぜんぶ = {}
  for p in 紙:
    if not os.path.exists(os.path.join(蔵, p)):
      print("  ★紙が ありません ──", p); continue
    画面, 孤 = 孤立(p)
    print("  %-46s ★画面 %3d ／ ★孤立 %3d" % (os.path.basename(p), len(画面), len(孤)))
    ぜんぶ[p] = 孤
  # ★★どの 紙でも 孤立して いる もの だけ を 出します。
  #   ★★1つの 紙で 孤立 でも、★別の 紙で 親が ある なら 傷では ありません。
  共 = None
  for 孤 in ぜんぶ.values():
    共 = set(孤) if 共 is None else (共 & set(孤))
  共 = sorted(共 or [])
  print("\n★どの 見本でも どこからも 開かれて いない（%d）" % len(共))
  for 名 in 共: print("    %s" % 名)
  print("\nRESULT: %s" % ("OK" if not 共 else "DIFF（%d 件）" % len(共)))
  return 0

if __name__ == "__main__":
  sys.exit(main())
