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
EXCL = os.path.join(ROOT, "tools", "excluded_by_design.json")


def excluded(name):
  """★見本に 在るが、★意図して 実装して いない もの（★3つめの 組）。

    ★★出どころ　坂本さん（★2026-09-16）──
      「★2つの 組だけ では 足りない。
        ★『★意図して 出して いない』を 3つめ に 分ける こと。
        ★★これが 無いと、★次の 突き合わせでも 毎回 蒸し返される。」

    ★★2026-09-16、★「端末を 見る（2台）」を **欠け**として 出しました。
      ★★欠けでは ありません。★Supabase が 端末の 一覧を くれない ので、
        ★作れません。★動かない 札を 出すのは 押せない 札（★§8⑤）です。
      ★★同じ ものを 毎回 出すと、★本当の 欠けが その 中に 埋もれます。

    ★★紙が 壊れて いたら、★黙って 空に しません。★止めます。
  """
  if not os.path.exists(EXCL):
    print("★★ありません: " + os.path.relpath(EXCL, ROOT))
    print("　★3つめの 組を 数えられません。★止まります。")
    sys.exit(1)
  try:
    d = json.load(open(EXCL, encoding="utf-8"))
  except Exception as e:
    print("★★読めません: " + os.path.relpath(EXCL, ROOT) + " … " + str(e))
    print("　★止まります。")
    sys.exit(1)
  out = {}
  for x in d.get(name, []):
    # ★★引き金の 無い ものを 通しません。★二度と 見直されなく なります。
    if not x.get("trigger"):
      print("★★引き金が ありません: " + str(x.get("text"))[:30])
      print("　★引き金の 無い 除外は 置けません（★台帳の 決まり）。★止まります。")
      sys.exit(1)
    out[norm(x.get("text"))] = x
  return out


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


def app_path(n):
  """★実装側の 書き出しを 探します。

    ★★見本には 2つの 形が あります ── ★1枚の 画面（SC）と、★下から
      上がる 板（SH）。★道具は ながく `SC-` しか 見て いません でした。
    ★★だから「アカウント」は、★**在るのに 無い** と 出ます。
      ★★正しくは `SH-account` です。★名も ちがい、★前置きも ちがいます。
    ★★ここで 両方を 見ます。★見つからない ときは 呼び手に 返して、
      ★止まって もらいます（★勝手に 空で 進めません）。
  """
  for pre in ("SC-", "SH-"):
    q = os.path.join(APP, pre + n + "@390.json")
    if os.path.exists(q):
      return q
  return os.path.join(APP, "SC-" + n + "@390.json")


def main():
  names = sys.argv[1:]
  if not names:
    print("★どの 画面か、★名前を ください。　例）python3 tools/screen_both_ways.py 設定 もっと")
    return 1

  bad = []
  for n in names:
    a = os.path.join(MIHON, n + "@390.json")
    b = app_path(n)
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
    ap = load(app_path(n)) or []
    mset = {norm(x): x for x in mi if norm(x)}
    aset = {norm(x): x for x in ap if norm(x)}

    print("=" * 66)
    print("■ %s　　見本 %d 塊 ／ 実装 %d 塊" % (n, len(mi), len(ap)))
    print("=" * 66)

    # ★★★こちらが 大事 です。★きょう 一度も 測って いません でした。
    ex = excluded(n)
    gap = [mset[k] for k in mset if k not in aset and k not in ex]
    skip = [(mset[k], ex[k]) for k in mset if k not in aset and k in ex]
    # ★★もう 実装に 在る のに、★除外の 紙に 残って いる もの。
    #   ★★紙が 古く なった しるし です。★黙って 見過ごしません。
    stale = [ex[k] for k in ex if k in aset]

    print()
    print("★★① 見本に 在るのに、★実装に 無い ── ★漏れ（★%d 件）" % len(gap))
    if not gap:
      print("   ✓ ありません")
    for x in gap:
      print("   ★ %s" % x[:60])

    extra = [aset[k] for k in aset if k not in mset]
    print()
    print("② 実装に 在って、★見本に 無い ── ★足したもの（%d 件）" % len(extra))
    if not extra:
      print("   ✓ ありません")
    for x in extra:
      print("   ・ %s" % x[:60])

    print()
    print()
    print("③ 見本に 在るが、★意図して 実装して いない ── ★除外（%d 件）" % len(skip))
    if not skip:
      print("   ✓ ありません")
    for x, e in skip:
      print("   ・%s" % x[:60])
      print("       わけ　　%s" % e.get("why", ""))
      print("       引き金　%s" % e.get("trigger", ""))
      print("       台帳　　%s" % e.get("ledger", ""))
    if stale:
      print()
      print("★★④ 除外の 紙が 古く なって います（%d 件）" % len(stale))
      print("　★下の ものは、★もう 実装に 在ります。★紙から 外して ください。")
      for e in stale:
        print("   ・%s（台帳 %s）" % (e.get("text"), e.get("ledger")))
    print()
    print("★まとめ ── 漏れ %d ／ 足し %d ／ 除外 %d"
          % (len(gap), len(extra), len(skip)))
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
