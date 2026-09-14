#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★暗い ほうが、★アプリで 効いて いるか（★2026-09-14）。

  ★出どころ 2026-09-14、★坂本さん
    ★「端末は いつも 暗い ほうなのに、★Woolsong は 明るい ままです」

  ★★見る ところは 3つ です。
    ★① アプリの どこかで、★暗い ほうに 切り替えて いるか
       ★（`data-th` を 立てる ／ `prefers-color-scheme` を 見る）
    ★② 切り替える ための 入口（★設定の 行）が あるか
    ★③ 見本は どうやって 切り替えて いるか（★写すため）

  ★★見本の ファイルは 数から のけます。★アプリでは ありません。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

APP_DIRS = ["app", "components", "lib", "public"]
APP_FILES = ["tailwind.config.js", "next.config.js", "capacitor.config.json"]
PACK = os.path.join(ROOT, "docs", "design", "pack-final")

MARKS = {
  "data-th": r'data-th',
  "prefers-color-scheme": r'prefers-color-scheme',
  "color-scheme": r'color-scheme\s*:',
  "darkMode（Tailwind）": r'darkMode',
  "dark: の クラス": r'\bdark:[a-z-]',
  # ★★`matchMedia` は 明暗 以外にも 使われます（★動きを 減らす 設定）。
  #   ★★はじめ これを 数に 入れて しまい、★「9件 ある」と 出ました。
  #     ★★中身は ぜんぶ `prefers-reduced-motion` でした。★別の 話です。
  "matchMedia（明暗のみ）": r'matchMedia\([^)]*prefers-color-scheme',
  "theme-color": r'theme-color',
}

src = []
for d in APP_DIRS:
  base = os.path.join(ROOT, d)
  if not os.path.isdir(base):
    continue
  for root, dirs, files in os.walk(base):
    dirs[:] = [x for x in dirs if x not in ("node_modules", "tests")]
    for f in files:
      if f.endswith((".js", ".jsx", ".css", ".json", ".webmanifest")):
        src.append(os.path.relpath(os.path.join(root, f), ROOT))
for f in APP_FILES:
  if os.path.exists(os.path.join(ROOT, f)):
    src.append(f)
src.sort()

print("★見た ファイル: " + str(len(src)))
print()
hits = {}
for rel in src:
  raw = io.open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace").read()
  for name, pat in MARKS.items():
    for m in re.finditer(pat, raw):
      ln = raw[:m.start()].count("\n") + 1
      hits.setdefault(name, []).append((rel, ln,
                                        raw.split("\n")[ln - 1].strip()[:90]))

print("① アプリの 中で、★暗い ほうに 切り替えて いるか")
for name in MARKS:
  rows = hits.get(name, [])
  print("  " + ("✗ 0件  " if not rows else "  " + str(len(rows)) + "件  ") + name)
  for r in rows[:4]:
    print("        " + r[0] + ":" + str(r[1]) + "  " + r[2])

total = sum(len(v) for v in hits.values())
# ★★ついでに、★明暗 以外の matchMedia も 数えて 出します。
other = 0
for rel in src:
  raw = io.open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace").read()
  other += len(re.findall(r'matchMedia', raw))
print("\n  ★（参考）matchMedia は 全部で " + str(other)
      + "件。★どれも 動きを 減らす 設定です")
print("\n  ★合わせて " + str(total) + "件")

print("\n② 切り替える 入口（★もっと の 行）")
more = io.open(os.path.join(ROOT, "lib", "moreMenu.js"), encoding="utf-8").read()
rows = re.findall(r'\{ key: "([^"]+)", label: "([^"]+)"', more)
print("  ★もっと の 行: " + str(len(rows)))
theme = [r for r in rows if "明る" in r[1] or "暗" in r[1] or "見た目" in r[1]
         or "テーマ" in r[1]]
print("  " + ("✗ 明暗の 行は ありません" if not theme else str(theme)))

print("\n③ 見本は どうやって 切り替えて いるか")
mi = os.path.join(PACK, "00-動く見本（さわれる・全画面）.html")
raw = io.open(mi, encoding="utf-8").read()
for m in re.finditer(r'.{0,90}prefers-color-scheme.{0,110}', raw):
  print("  " + m.group(0).strip()[:190])
for m in re.finditer(r".{0,70}setAttribute\('data-th'.{0,60}", raw):
  print("  " + m.group(0).strip()[:130])
# ★★どこから 呼ばれて いるか
for m in re.finditer(r"function setTh\([^)]*\)\{[\s\S]{0,220}", raw):
  print("  " + m.group(0).replace("\n", " ")[:230])

print("\n★★まとめ")
if total == 0:
  print("  ★アプリに、★暗い ほうの しくみは **1つも ありません**。")
  print("  ★端末の 設定を 見る ところも ありません。")
  print("  ★だから 端末が 暗い ほうでも、★明るい ままに なります。")
  print("  ★★No.013 で 直した `--enji-bg` は、★見本の 中だけの 話です。")
  print("    ★アプリの 画面には、★まだ 一度も 出て いません。")
