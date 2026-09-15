#!/usr/bin/env python3
# ============================================================================
# ★画面の 棚おろし ── ★両方向（★在るのに 無い ／ 無いのに 在る）
#
#   ★出どころ [ACTION] Opus → Code（★2026-09-16）
#     「★今日のツールは 片方しか 報告して いませんでした」
#     「各見本画面に ついて、★両方向を 報告する:
#       ★在るのに 無い（missing）／★無いのに 在る（extra）」
#
#   ★★★きょう 一日、★私は「どれだけ 足したか」だけを 測って いました。
#     ★★「何を 欠いて いるか」を、★一度も 測って いません でした。
#     ★★だから 2.38倍 という 数だけを 追い、
#       ★★★4つの 欠落（5段の 文字・ダークモード・羊の 動き・お知らせ）に
#         ★きょう 一日 気づきません でした。
#     ★★多い ことは 見えます。★**無い ことは 見えません**。
#       ★★見えない ほうを、★道具に 見させます。
#
#   ★★数える もとは、★**撮った 絵の 書き出し**です。★中身の 字では ありません。
#     ★見本 … `docs/design/compare/mihon/<名>@390.json`
#     ★実装 … `docs/design/compare/all/frames/SC-<名>@390.json`
#
#   ★★どちらかが 無ければ、★数えずに 止まります（★2026-09-14 の 決め）。
# ============================================================================

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIHON = os.path.join(ROOT, "docs", "design", "compare", "mihon")
APP = os.path.join(ROOT, "docs", "design", "compare", "all", "frames")


def norm(t):
  """★見くらべる ための 形。★空白と 矢印を そろえます。"""
  t = re.sub(r"\s+", "", str(t or ""))
  return t.replace("›", "").replace("→", "").replace("‹", "").strip()


def load(path, key="text"):
  if not os.path.exists(path):
    return None
  try:
    d = json.load(open(path, encoding="utf-8"))
  except Exception:
    return None
  return [str(x.get(key) or "").strip() for x in d if str(x.get(key) or "").strip()]


def main():
  names = sys.argv[1:]
  if not names:
    print("★どの 画面か、★名前を ください。　例）python3 tools/screen_both_ways.py 設定 もっと")
    return 1

  bad = []
  for n in names:
    a = os.path.join(MIHON, n + "@390.json")
    b = os.path.join(APP, "SC-" + n + "@390.json")
    if not os.path.exists(a):
      bad.append("見本 " + os.path.relpath(a, ROOT))
    if not os.path.exists(b):
      bad.append("実装 " + os.path.relpath(b, ROOT))
  if bad:
    print("★★撮った 書き出しが ありません:")
    for x in bad:
      print("   ", x)
    print("　★数えません。★止まります。")
    print("　★見本 … node tools/mihon_shot.js <名>")
    print("　★実装 … node tools/compare.js --frames")
    return 1

  for n in names:
    mi = load(os.path.join(MIHON, n + "@390.json")) or []
    ap = load(os.path.join(APP, "SC-" + n + "@390.json")) or []
    mset = {norm(x): x for x in mi if norm(x)}
    aset = {norm(x): x for x in ap if norm(x)}

    print("=" * 66)
    print("■ %s　　見本 %d 塊 ／ 実装 %d 塊" % (n, len(mi), len(ap)))
    print("=" * 66)

    # ★★★こちらが 大事 です。★きょう 一度も 測って いません でした。
    missing = [mset[k] for k in mset if k not in aset]
    print()
    print("★★① 見本に 在るのに、★実装に 無い（★%d 件）" % len(missing))
    if not missing:
      print("   ✓ ありません")
    for x in missing:
      print("   ★ %s" % x[:60])

    extra = [aset[k] for k in aset if k not in mset]
    print()
    print("② 実装に 在って、★見本に 無い（%d 件）" % len(extra))
    if not extra:
      print("   ✓ ありません")
    for x in extra:
      print("   ・ %s" % x[:60])

    print()
    print("★まとめ ── 欠け %d ／ 足し %d" % (len(missing), len(extra)))
    print("　★★欠けの ほうを 先に 見て ください。")
    print("　　★多い ことは 目に 見えます。★無い ことは 見えません。")
    print()

  print("=" * 66)
  print("★★この 数えが 見て いない こと")
  print("　★字が 同じか だけ です。★色・大きさ・並び・余白は 見て いません。")
  print("　★言い換えた 字は「無い」と 出ます。★見て、★ご判断ください。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
