#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★見本の 新しい 版と、★いま 使って いる 版の ちがいを 数えます。

  ★★出どころ　坂本さん（★2026-09-16）──
    「★新しい 見本を 渡す。★入れ替える 前に、★きょう 測った 数に
      ★障る 変更（★組み立て・文言・CSS の 値）が 無いかを 確かめて ほしい。」

  ★★だから、★ちがいを 4つに 分けます ──
    ★A 組み立て　… SC[] / SH[] の 増減。★画面そのものが 増えた・減った
    ★B 文言　　　… 目に 見える 字の 変わり
    ★C 見た目　　… CSS の 値（★寸法・色・余白）
    ★D その他　　… 覚え書き・空行など、★測りに 障らない もの

  ★★そして「★きょう 測った 画面」に 印を 付けます。
    ★★ここが 動いて いたら、★きょうの 数は 取り直し です。
"""

import io
import os
import re
import sys
import difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-統合版見本との差分.md")

PAIRS = [
  ("さわれる・全画面",
   "docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
   "docs/opus/00-動く見本（さわれる・全画面）_2026-09-16_統合版.html"),
  ("PC・iPad（運営）",
   "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html",
   "docs/opus/00-動く見本-PC・iPad（運営）_2026-09-16_統合版.html"),
]

# ★★きょう 測った 画面。★ここが 動いて いたら 取り直しです。
MEASURED = {
  "設定": "2.35倍（見本729px / 実装1711px）",
  "もっと": "1.89倍",
  "account": "1.00倍（見本274px / 実装275px）",
  "アカウント": "1.00倍（見本274px / 実装275px）",
}


def rd(rel):
  p = os.path.join(ROOT, rel)
  if not os.path.exists(p):
    print("★★ありません: " + rel)
    print("　★くらべません。★止まります。")
    sys.exit(1)
  return io.open(p, encoding="utf-8").read()


def keys(src):
  """★画面（SC）と 板（SH）の 名を 拾います。"""
  return (set(re.findall(r"SC\['([^']*)'\]=", src)),
          set(re.findall(r"SH\['([^']*)'\]=", src)))


def css_decls(src):
  """★CSS の 一つ一つの 言い付け（`名:値`）を 拾います。

    ★★`<style>` の 中だけ を 見ます。★本文の inline style は B/C に 出ます。
  """
  out = {}
  for blk in re.findall(r"<style[^>]*>([\s\S]*?)</style>", src):
    # ★★`セレクタ{中身}` に ほどきます。
    for sel, body in re.findall(r"([^{}]+)\{([^{}]*)\}", blk):
      s = re.sub(r"\s+", " ", sel).strip()
      for d in body.split(";"):
        if ":" not in d:
          continue
        k, v = d.split(":", 1)
        out[(s, k.strip())] = re.sub(r"\s+", " ", v).strip()
  return out


def visible_text(src):
  """★目に 見える 字（★日本語の かたまり）を 拾います。"""
  t = re.sub(r"<style[\s\S]*?</style>", " ", src)
  t = re.sub(r"<!--[\s\S]*?-->", " ", t)
  found = re.findall(r"[ぁ-んァ-ヶ一-龥ー][ぁ-んァ-ヶ一-龥ー0-9（）()、。・〜ー\s]{1,40}", t)
  return set(re.sub(r"\s+", " ", x).strip() for x in found if len(x.strip()) > 1)


def which_screen(src, pos):
  """★その 行が、★どの 画面の 中か。"""
  last = None
  for m in re.finditer(r"S[CH]\['([^']*)'\]=", src[:pos]):
    last = m.group(1)
  return last or "（画面の 外）"


# ══════════ ★戻って いないか（★いちばん 大事な 数え）══════════
#
#   ★★新しい 版が、★**前の 決めより 古い 土台**から 作られて いると、
#     ★すでに 決めた ことが、★黙って もとに 戻ります。
#   ★★2026-09-16、★実際に 2つ 戻って いました。
#     ★★どちらも「差分の 一覧」を 端から 読まなければ 見つかりません。
#       ★だから、★名指しで 数えます。
#
#   ★★ここに 並べるのは「★日付の ある お決め」です。
#     ★★足す ときは、★いつ・どなたが 決めたかを 必ず 書いて ください。
DECIDED = [
  {"what": "料金の 下限 9,800円",
   "when": "2026-09-13",
   "find": "下限 9,800円",
   "reverted_to": "下限 12,800円",
   "note": "見本に「★2026-09-13 改定。前は 12,800円」と 書いて あります。"},
  {"what": "もっとの「教室 ▸ 生徒を 招待する」",
   "when": "2026-09-15",
   "find": "生徒を 招待する",
   "reverted_to": "（行ごと ありません）",
   "note": "裁定 ㋒／No.025。★これが 無いと 先生の 側の 入口が 1つも ありません。"},
]

L = []
A = L.append
A("# 見本の 新しい 版との 差分")
A("")
A("★出どころ　坂本さん（2026-09-16）「微妙に修正した 正式版」")
A("★**まだ 入れ替えて いません。** ご判断を お待ちします。")
A("")

verdict_rows = []

for title, old_rel, new_rel in PAIRS:
  old, new = rd(old_rel), rd(new_rel)

  A("---")
  A("")
  A("## " + title)
  A("")
  A("| | いま | 新しい 版 |")
  A("|---|---|---|")
  A("| 行 | %d | %d |" % (old.count("\n") + 1, new.count("\n") + 1))
  A("| 大きさ | %d | %d |" % (len(old), len(new)))
  A("")

  # ══════════ A 組み立て ══════════
  osc, osh = keys(old)
  nsc, nsh = keys(new)
  add_sc, del_sc = sorted(nsc - osc), sorted(osc - nsc)
  add_sh, del_sh = sorted(nsh - osh), sorted(osh - nsh)
  A("### A　組み立て（画面の 増減）")
  A("")
  if not (add_sc or del_sc or add_sh or del_sh):
    A("★ありません。**画面は 1つも 増えず、1つも 減って いません。**")
  for x in add_sc:
    A("・★増えた 画面　`SC['" + x + "']`")
  for x in del_sc:
    A("・★★減った 画面　`SC['" + x + "']`")
  for x in add_sh:
    A("・★増えた 板　`SH['" + x + "']`")
  for x in del_sh:
    A("・★★減った 板　`SH['" + x + "']`")
  A("")

  # ══════════ C 見た目（CSS）══════════
  oc, nc = css_decls(old), css_decls(new)
  chg = [(k, oc[k], nc[k]) for k in oc if k in nc and oc[k] != nc[k]]
  addc = [(k, nc[k]) for k in nc if k not in oc]
  delc = [(k, oc[k]) for k in oc if k not in nc]
  A("### C　見た目（`<style>` の 値）")
  A("")
  A("★変わった %d ／ 増えた %d ／ 減った %d" % (len(chg), len(addc), len(delc)))
  A("")
  if chg:
    A("| どこ | 何 | いま | 新しい 版 |")
    A("|---|---|---|---|")
    for (sel, k), a_, b_ in sorted(chg)[:60]:
      A("| `%s` | `%s` | `%s` | `%s` |" % (sel[:34], k, a_[:26], b_[:26]))
    if len(chg) > 60:
      A("")
      A("★ほか %d 件（★全部は 報告の 紙に 入りません）" % (len(chg) - 60))
  if addc:
    A("")
    A("**増えた 言い付け**")
    for (sel, k), v in sorted(addc)[:40]:
      A("・`%s` … `%s: %s`" % (sel[:34], k, v[:30]))
    if len(addc) > 40:
      A("・★ほか %d 件" % (len(addc) - 40))
  if delc:
    A("")
    A("**★★減った 言い付け**")
    for (sel, k), v in sorted(delc)[:40]:
      A("・`%s` … `%s: %s`" % (sel[:34], k, v[:30]))
    if len(delc) > 40:
      A("・★ほか %d 件" % (len(delc) - 40))
  A("")

  # ══════════ B 文言 ══════════
  ot, nt = visible_text(old), visible_text(new)
  addt, delt = sorted(nt - ot), sorted(ot - nt)
  A("### B　文言（目に 見える 字）")
  A("")
  A("★増えた %d ／ 減った %d" % (len(addt), len(delt)))
  A("")
  if addt:
    A("**増えた 字**")
    for x in addt[:40]:
      A("・" + x[:56])
    if len(addt) > 40:
      A("・★ほか %d 件" % (len(addt) - 40))
  if delt:
    A("")
    A("**★★減った 字**")
    for x in delt[:40]:
      A("・" + x[:56])
    if len(delt) > 40:
      A("・★ほか %d 件" % (len(delt) - 40))
  A("")

  # ══════════ ★きょう 測った 画面に 触れて いるか ══════════
  ol, nl = old.split("\n"), new.split("\n")
  sm = difflib.SequenceMatcher(None, ol, nl, autojunk=False)
  touched = {}
  for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
      continue
    pos = len("\n".join(ol[:i1]))
    sc = which_screen(old, pos)
    touched.setdefault(sc, [0, 0])
    touched[sc][0] += (i2 - i1)
    touched[sc][1] += (j2 - j1)

  # ══════════ ★戻って いないか ══════════
  A("### ★★戻って いないか（決めた ことが 消えて いないか）")
  A("")
  back = []
  for d in DECIDED:
    was, now = old.count(d["find"]), new.count(d["find"])
    if was > 0 and now == 0:
      back.append(d)
  if not back:
    A("★この 見本では ありません。")
  else:
    A("★★**戻って います。%d 件。**" % len(back))
    A("")
    for d in back:
      A("#### ★★" + d["what"] + "（" + d["when"] + " の お決め）")
      A("")
      A("・いま　　　`" + d["find"] + "`")
      A("・新しい 版　`" + d["reverted_to"] + "`")
      A("・" + d["note"])
      A("")
    A("★★新しい 版は、★これらの お決め **より 前**の 土台から 作られて います。")
    A("　★**そのまま 入れ替えると、決めた ことが 黙って 消えます。**")
    A("")

  A("### ★きょう 測った 画面に 触れて いるか")
  A("")
  hit = [(k, v) for k, v in touched.items() if k in MEASURED]
  if not hit:
    A("★**触れて いません。** きょうの 数は そのまま 使えます。")
    for k in MEASURED:
      verdict_rows.append((title, k, MEASURED[k], "そのまま"))
  else:
    A("★★**触れて います。★きょうの 数は 取り直しです。**")
    A("")
    A("| 画面 | きょうの 数 | 消えた行 | 足した行 |")
    A("|---|---|---|---|")
    for k, v in sorted(hit):
      A("| %s | %s | %d | %d |" % (k, MEASURED.get(k, "-"), v[0], v[1]))
      verdict_rows.append((title, k, MEASURED[k], "★取り直し"))
  A("")

  A("### 触れた ところ（画面ごと）")
  A("")
  A("| 画面 | 消えた行 | 足した行 |")
  A("|---|---|---|")
  for k, v in sorted(touched.items(), key=lambda x: -(x[1][0] + x[1][1]))[:30]:
    mark = "★ " if k in MEASURED else ""
    A("| %s%s | %d | %d |" % (mark, k, v[0], v[1]))
  A("")

A("---")
A("")
A("## まとめ")
A("")
A("| 見本 | 画面 | きょうの 数 | どう なるか |")
A("|---|---|---|---|")
for t, k, v, s in verdict_rows:
  if k == "アカウント":
    continue
  A("| %s | %s | %s | %s |" % (t, k, v, s))
A("")
A("★★入れ替えるかは、坂本さんの お決め です。私からは しません。")
A("★★入れ替える なら、★上の「★取り直し」の 画面を 撮り直します。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
body = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
hdr = "全%d行 / 末尾は「%s」" % (len(body) + 1, body[-1])
io.open(OUT, "w", encoding="utf-8").write(body[0] + "\n" + hdr + "\n"
                                          + "\n".join(body[1:]) + "\n")
print("OUT: " + os.path.relpath(OUT, ROOT))
print("LINES: %d" % (len(body) + 1))
