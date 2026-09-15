#!/usr/bin/env python3
# ============================================================================
# ★画面の 込み具合 ── ★見本と くらべます
#
#   ★出どころ [ACTION] 坂本さん（★2026-09-15）
#     「見本と 比べて 余計な 言葉が 多く、レイアウトが めちゃくちゃ」
#     「今日の 検証は『文言が あるか』のみで、★実際の 画面密度・視認性は
#       ★一度も 確認して いません」
#
#   ★★★そのとおりです。★私は きょう 一日、★字が 在るかだけを 見て いました。
#     ★★決まり（★2026-09-11）に、★こう 書いて あります ──
#       「★word-presence checking is retired as an acceptance signal」
#     ★★私は それを 守って いませんでした。
#
#   ★★この 道具は、★**撮った 絵**から 数えます。★中身の 字からでは ありません。
#     ★`tools/compare.js --frames` が 書き出した
#       `docs/design/compare/all/frames/<画面>@390.json` を 読みます。
#     ★★見える ものだけ が 入って います（★display:none は 入りません）。
#
#   ★★見本の 側は、★動く見本の HTML から 同じ ように 数えます。
# ============================================================================

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "docs", "design", "compare", "all", "frames")
MIHON = os.path.join(ROOT, "docs", "design", "pack-final",
                     "00-動く見本（さわれる・全画面）.html")

# ★見る 画面。★(撮った 絵の 名前, 見本の 関数名)
SCREENS = [
  ("SC-設定", "設定"),
  ("SC-書き出す", "書き出す"),
  ("SC-退会", "退会"),
  ("SC-プラン", "プラン"),
  ("SC-学ぶ", "学ぶ"),
  ("SC-台帳", "台帳"),
]


def mihon_text(name):
  """★見本の 1画面から、★画面に 出る 字だけを 取ります。"""
  s = open(MIHON, encoding="utf-8", errors="replace").read()
  key = "SC['" + name + "']"
  if key not in s:
    return None
  i = s.rindex(key)
  j = s.index("{", s.index("function", i))
  d, k = 0, j
  while k < len(s):
    if s[k] == "{":
      d += 1
    elif s[k] == "}":
      d -= 1
      if d == 0:
        break
    k += 1
  body = s[i:k + 1]
  # ★HTML の 札を 外し、★地の 字だけ に します。
  body = re.sub(r"<[^>]*>", "\x00", body)
  out = []
  for part in body.split("\x00"):
    for m in re.finditer(r"[ぁ-んァ-ヶ一-龠ー０-９0-9、。・（）「」：／…%\s]{2,}", part):
      v = " ".join(m.group(0).split())
      if len(v) >= 2 and re.search(r"[ぁ-んァ-ヶ一-龠]", v):
        out.append(v)
  return out


def main():
  if not os.path.isdir(FRAMES):
    print("★★撮った 絵が ありません: %s" % FRAMES)
    print("　★node tools/compare.js --frames で 撮って ください。")
    print("　★★『通った』では ありません。★『見て いない』です。")
    return 1
  if not os.path.exists(MIHON):
    print("★★見本が ありません: %s" % MIHON)
    print("　★数えません。★止まります。")
    return 1

  print("★画面の 込み具合 ── ★撮った 絵から 数えました（★390 幅）")
  print()
  print("  %-14s %8s %8s   %8s %8s   %s" %
        ("画面", "見本の字", "アプリ字", "見本の塊", "アプリ塊", "倍"))
  print("  " + "-" * 66)

  missing = []
  rows = []
  for frame, fn in SCREENS:
    p = os.path.join(FRAMES, frame + "@390.json")
    if not os.path.exists(p):
      missing.append(frame)
      continue
    items = json.load(open(p, encoding="utf-8"))
    app_txt = [d.get("text", "") for d in items if d.get("text")]
    app_chars = sum(len(re.sub(r"\s", "", t)) for t in app_txt)
    mi = mihon_text(fn)
    if mi is None:
      missing.append("見本 " + fn)
      continue
    mi_chars = sum(len(re.sub(r"\s", "", t)) for t in mi)
    ratio = (app_chars / mi_chars) if mi_chars else 0
    rows.append((frame, mi_chars, app_chars, len(mi), len(app_txt), ratio))
    print("  %-14s %8d %8d   %8d %8d   %.1f倍" %
          (frame, mi_chars, app_chars, len(mi), len(app_txt), ratio))

  if missing:
    print()
    print("★★読めなかった もの: %d 件" % len(missing))
    for m in missing:
      print("   ・%s" % m)
    print("　★数を 出しません。★飛ばしません。")
    return 1

  print()
  print("★★いちばん 込んで いる 順")
  for frame, mc, ac, mn, an, r in sorted(rows, key=lambda x: -x[5]):
    mark = "★★" if r >= 3 else ("★" if r >= 2 else "  ")
    print("   %s %-14s %.1f倍（%d字 → %d字）" % (mark, frame, r, mc, ac))

  print()
  print("★★この 数えが 見て いない こと")
  print("　★見た目の 詰まり具合・行間・色は 数えて いません。★字の 量だけ です。")
  print("　★絵は 撮って あります ── docs/design/compare/all/frames/*.png")
  print("　★★絵を ご覧に なるのが、★いちばん 早い です。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
