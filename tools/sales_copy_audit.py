#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# A4 ★売り文句と、★実際に ある 画面・働きを つき合わせる
#
#   ★★これは **下ごしらえ** です。★合否を 出す 道具では ありません。
#     ★★字の 重なりを 数える だけ で、★その 働きが 動く ことの 証しでは ありません。
#     ★★どれも 最後は 画面を 開いて お確かめください。
#
#   ★入れもの  売り文句の 書いて ある テキスト
#     ★★正の 営業資料は PDF です（docs/opus/Woolsong_営業資料_v5…pdf）。
#       ★★私からは 読めません。★テキストに 出して いただく 必要が あります。
#
#   ★くらべる 先  docs/design/pack-final/functions.md
#
#   使い方  python3 tools/sales_copy_audit.py <売り文句の ファイル>
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
FUNCS = os.path.join(ROOT, "docs", "design", "pack-final", "functions.md")

# ★★2026-09-13、★はじめ「〜できます」の 形だけを 探して いました。
#   ★★この 文書は、★節の 下に 1行ずつ 並べる 書き方です ──
#     「いま、できること」／「これから 作ること」／「やらないと 決めて いること」
#   ★★だから 2件しか 取れません でした。★節ごと 読みます。
# ★★2026-09-13、★「できること」も 節と して 数えて いました。
#   ★★4ページ目（★個人の 料金）にも 同じ 見出しが あり、
#     ★★値段や 返品の 文まで「いま ある」に 入って いました。
#   ★★見出しは、★この 3つ だけ に します。
#   ★★節は 12行で 打ち切ります。★次の 見出しが 来なくても 止めます。
SECTIONS = {
  "いま、できること": "★いま ある と 言って いる",
  "これから作ること": "★まだ 無い と 言って いる",
  "やらないと決めていること": "★作らない と 言って いる",
}
SECTION_MAX = 12
SECTION_END = re.compile(r"^(\d+ページ目|Woolsong ／|時期|どれを|★|【)")

CLAIM = [
  r"「([^」]{4,40})」が\s*でき",
  r"「([^」]{4,40})」が\s*可能",
  r"([^\s、。・|]{4,30})が\s*できます",
  r"([^\s、。・|]{4,30})を\s*(?:見られ|残せ|出せ|作れ|送れ|数えられ|持て)ます",
]


def read_sections(text):
  """★節の 下に 並んで いる 1行ずつを 拾います。"""
  out = []
  cur = None
  n = 0
  for raw in text.split("\n"):
    line = re.sub(r"^\d+:\s*", "", raw).strip()
    if not line:
      continue
    key = line.replace(" ", "").replace("　", "")
    if key in SECTIONS:
      cur, n = SECTIONS[key], 0
      continue
    if cur is None:
      continue
    if SECTION_END.match(line) or key in SECTIONS:
      cur = None
      continue
    if len(line) < 6 or len(line) > 60:
      continue
    out.append((cur, line))
    n += 1
    if n >= SECTION_MAX:
      cur = None
  return out

STOP = set("のにをはがでとやもへ、。・（）「」★ ")


def grams(s, n=2):
  t = "".join(c for c in s if c not in STOP)
  return {t[i:i + n] for i in range(max(0, len(t) - n + 1))}


def main():
  if len(sys.argv) < 2:
    print("使い方: python3 tools/sales_copy_audit.py <売り文句の ファイル>")
    print()
    print("★正の 営業資料は PDF です。★私からは 読めません。")
    print("★★テキストに 出して いただく 必要が あります。")
    return 1
  src_path = sys.argv[1]
  with open(src_path, encoding="utf-8") as f:
    sales = f.read()
  with open(FUNCS, encoding="utf-8") as f:
    funcs = f.read()

  heads = []
  for line in funcs.split("\n"):
    m = re.match(r"^#{2,3}\s+(.+)$", line.strip())
    if m:
      heads.append(m.group(1))
  fg = grams(funcs)

  claims = []
  kind = {}
  for k, line in read_sections(sales):
    if line not in claims:
      claims.append(line)
      kind[line] = k
  for p in CLAIM:
    for m in re.finditer(p, sales):
      c = m.group(1).strip()
      if c and c not in claims:
        claims.append(c)
        kind[c] = "★「できます」の 形"

  lines = []

  def say(t=""):
    lines.append(t)

  say("# A4 ★売り文句と、★ある ものの つき合わせ")
  say()
  say("★この 紙は tools/sales_copy_audit.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★**合否では ありません。** ★字の 重なりを 数えた だけ です。")
  say("　★★重なって いても、★その 働きが 動く 証しには なりません。")
  say("　★★重なって いなくても、★別の 言い方で 在る かも しれません。")
  say("　★★**どれも 最後は 画面を 開いて お確かめください。**")
  say()
  say("★読んだ もの　`%s`" % os.path.relpath(src_path, ROOT))
  say("★くらべた 先　`docs/design/pack-final/functions.md`（★見出し %d）" % len(heads))
  say()

  rows = []
  for c in claims:
    cg = grams(c)
    ratio = (len(cg & fg) / len(cg)) if cg else 0.0
    best, bs = "—", 0.0
    for h in heads:
      hg = grams(h)
      if not hg:
        continue
      r = len(cg & hg) / len(cg) if cg else 0
      if r > bs:
        bs, best = r, h
    rows.append({"claim": c, "ratio": ratio, "best": best, "bs": bs,
                 "kind": kind.get(c, "—")})

  need = [r for r in rows if r["ratio"] < 0.5]
  say("## ★数")
  say()
  say("- 売り文句 **%d**" % len(rows))
  say("- 重なりが 半分 未満 **%d**（★とくに 見て ください）" % len(need))
  say()
  say("| 言って いる こと | どの 節 | 重なり | 近い 見出し |")
  say("|---|---|---|---|")
  for r in sorted(rows, key=lambda x: (x["kind"], x["ratio"])):
    mark = "★" if r["ratio"] < 0.5 else ""
    say("| %s%s | %s | %.0f%% | %s |" % (mark, r["claim"][:44].replace("|", "\\|"),
                                         r["kind"], r["ratio"] * 100, r["best"][:28]))
  say()
  say("## ★この 紙が して いない こと")
  say()
  say("★★画面を 1つも 開いて いません。")
  say("★★重なりが 高い ものも、★いくつか 手で 確かめて ください。")
  say("　★★字が 似て いる ことと、★働く ことは 別です。")
  say("　★★2026-09-13 に 分かった 例 ── ★名簿の 画面は 字の うえでは 在り、")
  say("　★★どの 学校でも 1行も 出ませんでした。")
  say("★★正の 営業資料は PDF です。★そこから 出した テキストで 回して ください。")

  p = os.path.join(OUT, "2026-09-13-A4-売り文句のつき合わせ.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("docs/reports/2026-09-13-A4-売り文句のつき合わせ.md  全%d行" % len(lines))
  print("売り文句 %d ／ 重なり 半分 未満 %d" % (len(rows), len(need)))
  return 0


if __name__ == "__main__":
  sys.exit(main())
