#!/usr/bin/env python3
# ============================================================================
# ★見本に 無い もの ── ★入れた もの と、★これから の もの
#
#   ★出どころ [ACTION] 坂本さん（★2026-09-15）
#     「見本(SC[]/SH[])には 存在しないが、今日までに 実装済み・追加した 要素と、
#       今後 追加予定の 要素を、それぞれ 一覧に してください」
#
#   ★★この 道具は、★きょう 書いた 紙から 機械で 拾います。
#     ★手で 並べません。★手で 並べると、★落ちたものに 気づけません。
#
#   ★★決まり（★2026-09-14・坂本さん）──
#     ① 読む 紙が 1枚でも 無ければ、★数えずに 止まります
#     ② 自分の 抜き取りを 検算します ── ★拾えなかった 節を 名指しで 出します
#
#   ★★拾い方
#     ★「見本より 多い ところ」「わざと 違えて いる ところ」などの 見出しの 下から、
#       ★表の 行（`| ㋐ | … |`）と 箇条書き（`- ㋐ …`）を 拾います。
#     ★これから の ものは、★台帳（やること-9月15日のあと.md）の `## ㉑` … から。
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★読む 紙。★1枚でも 無ければ 止まります。
DONE_DOCS = [
  ("設定",           "docs/reports/2026-09-15-設定-調べ.md"),
  ("アカウント",     "docs/reports/2026-09-15-アカウント-調べ.md"),
  ("もっているもの", "docs/reports/2026-09-15-もっているものの調べ.md"),
  ("書き出す",       "docs/reports/2026-09-15-書き出すの調べ.md"),
  ("退会する・同居", "docs/reports/2026-09-15-退会するの調べと同居問題の裁定案.md"),
  ("教室の殻",       "docs/reports/2026-09-15-教室の殻-次のレッスンと行事の下調べ.md"),
  ("招待の入口",     "docs/reports/2026-09-15-招待の入口が無い.md"),
  ("教室に招く",     "docs/reports/2026-09-15-教室に招くの調べ.md"),
  ("学ぶ",           "docs/records/修正の記録-No.021-学ぶの画面に見本の5つを入れる.md"),
  ("教室の殻",       "docs/records/修正の記録-No.026-生徒の教室の殻.md"),
  # ★★「もっているもの」は 調べの 紙で 読んで います。★記録の 紙を 重ねません。
  #   ★★2026-09-15、★同じ 4件が 2度 出て いました。



]
LEDGER = "docs/records/やること-9月15日のあと.md"

# ★★見出しからは 拾えない もの。
#
#   ★★「見本より 多い ところ」という 見出しを 持たない 紙が あります。
#     ★★丸ごと 新しい 機能は、★そもそも 見本と 見くらべる 節が ありません。
#   ★★だから ここに 書きます。★ただし ★紙を 指し、★紙が 無ければ 止まります。
#     ★★私の 記憶から 書きません。★出どころの 無い 行を 置きません。
WHOLLY_NEW = [
  ("教室の殻", "次の レッスン",
   "docs/records/修正の記録-No.026-生徒の教室の殻.md",
   "第3版 §6／Opus 2026-09-15", "意図",
   "見本に この 節が ありません。★生徒が 自分の 教室を 見る 画面が 1つも 無かった"),
  ("教室の殻", "近い 行事",
   "docs/records/修正の記録-No.026-生徒の教室の殻.md",
   "第3版 §6／行事と時間割の裁定 2026-09-15", "意図",
   "同上。★出欠は 集めません。★日づけのまま 出します"),
  ("教室の殻", "先生からの 連絡",
   "docs/records/修正の記録-No.026-生徒の教室の殻.md",
   "第3版 §6／Opus 2026-09-15", "意図",
   "同上。★v1 では 既読を 書きません"),
  ("もっと", "生徒を 招待する の 行",
   "docs/records/修正の記録-No.025-招待の入口をもっとに置く.md",
   "Opus 裁定 ㋒ 2026-09-15", "意図",
   "見本の 9行に ありません。★見本は 門の 外の 画面で、★帯に lesson が あります。"
   "★描かれて いない 状態を 埋めた もの（★変更では なく 補い）。★見本にも 足しました"),
  ("書き出す", "見出しを 日本語に する",
   "docs/records/修正の記録-No.023-書き出しの見出しを日本語にする.md",
   "Opus 裁定 ㋒ 2026-09-15", "意図",
   "見本は「画面と 同じ ことば」とだけ 言い、★73語の 対応表は ありません。"
   "★列名と 中身が 食い違う 3列は、★中身の ほうに 合わせました"),
  ("書き出す", "入れるものの 一覧（19表）",
   "docs/records/修正の記録-No.023-書き出しの見出しを日本語にする.md",
   "Opus 裁定 ㋑ 2026-09-15", "意図",
   "見本は 5行。★一部だけだと「残りは 含まれない」と 読まれるため 全部 出しました"),
  ("アカウント", "ログアウトを アカウントの シートへ",
   "docs/reports/2026-09-15-退会するの調べと同居問題の裁定案.md",
   "Opus 裁定 ㋙ 2026-09-15", "意図",
   "見本の SH['account'] どおり。★門の 外は 1文字も 変えて いません"),
  ("管理画面", "投げたものを 受け止める 1枚（error.js）",
   "docs/records/やること-9月15日のあと.md",
   "Opus 2026-09-15（★404 の 切り分け）", "便宜",
   "見本に ありません。★原因が 分かるまでの 道具です。★㊲ に 書いて あります"),
]

# ★「見本より 多い」「わざと 違えて いる」を 表す 見出し。
EXTRA_HEAD = re.compile(
  r"^#{2,3}\s*.*(見本より\s*多い|わざと\s*違えて|見本に\s*(は\s*)?(無い|ない|ありません)"
  r"|現状維持|消さないで|多いところ|足して\s*いる)", re.M)
ANY_HEAD = re.compile(r"^(#{2,4})\s+(.*)$", re.M)
MARK = r"[㋐-㋾①-⑳]"
ROW = re.compile(r"^\|\s*(" + MARK + r")\s*\|\s*([^|]+?)\s*\|", re.M)
BULLET = re.compile(r"^[-・]\s*(" + MARK + r")\s*(.+)$", re.M)
# ★★印つきの 小見出し（★`### ㋐ 30日の猶予` の 形）。
#   ★★2026-09-15、★検算が 8件 拾い残しを 見つけました。★これが その 形 でした。
SUBHEAD = re.compile(r"^#{3,4}\s*★?\s*(" + MARK + r")\s*(.+)$", re.M)
# ★★印の 無い 箇条書き（★`- 気候・滞在地 … 見本に ありません` の 形）。
PLAIN = re.compile(r"^[-・]\s*(?!" + MARK + r")(★?[^\n]{6,})$", re.M)


def read(rel):
  return open(os.path.join(ROOT, rel), encoding="utf-8").read()


def sections(text):
  """
  ★見出しごとに 切ります。★(深さ, 見出し, 中身) を 返します。

    ★★2026-09-15、★検算が 4件 拾い残しを 見つけました。
      ★★「見本より 多いところ」という **親**の 節の 下に、
        ★`### ㋕ …` という **子**の 節が 並んで いました。
      ★★親には 中身が 無く、★子は 見出しが 当たらないので 素通り ──
        ★どちらにも 拾われて いません でした。
      ★★だから 深さを 持たせ、★親が 当たれば **子も 一緒に** 見ます。
  """
  hits = list(ANY_HEAD.finditer(text))
  out = []
  for i, m in enumerate(hits):
    end = hits[i + 1].start() if i + 1 < len(hits) else len(text)
    out.append((len(m.group(1)), m.group(2).strip(), text[m.end():end]))
  return out


def main():
  missing = [p for _, p in DONE_DOCS if not os.path.exists(os.path.join(ROOT, p))]
  missing += [w[2] for w in WHOLLY_NEW if not os.path.exists(os.path.join(ROOT, w[2]))]
  if not os.path.exists(os.path.join(ROOT, LEDGER)):
    missing.append(LEDGER)
  if missing:
    print("★★読む はずの 紙が ありません:")
    for p in missing:
      print("   ", p)
    print("　★数えません。★止まります。")
    return 1

  print("★見本に 無い もの ── ★きょうの 紙から 機械で 拾いました")
  print("　★読んだ 紙: %d 枚 ＋ 台帳 1枚" % len(DONE_DOCS))
  print()

  print("=" * 68)
  print("■ 実装済み（★見本に 無い もの）")
  print("=" * 68)
  done = []
  uncovered = []
  for screen, rel in DONE_DOCS:
    text = read(rel)
    secs = sections(text)
    for idx, (depth, head, body) in enumerate(secs):
      if not EXTRA_HEAD.search("## " + head):
        continue
      # ★★親が 当たったら、★その 下の 深い 節も まとめて 見ます。
      for d2, h2, b2 in secs[idx + 1:]:
        if d2 <= depth:
          break
        # ★★2026-09-15、★ここを 1度 まちがえました。
        #   ★`"\n#" * d2` は `\n#\n#\n#` に なります。★見出しに なりません。
        #   ★正しくは、★改行 1つ ＋ `#` を d2 個 です。
        body += "\n" + ("#" * d2) + " " + h2 + "\n" + b2
      items = [(m.group(1), m.group(2)) for m in ROW.finditer(body)]
      items += [(m.group(1), m.group(2)) for m in BULLET.finditer(body)]
      items += [(m.group(1), m.group(2)) for m in SUBHEAD.finditer(body)]
      # ★★見出し そのものに 印が ある 形（★`### ㋔ 見本にない行を…`）。
      hm = re.match(r"^★?\s*(" + MARK + r")\s*(.+)$", head)
      if hm:
        items.append((hm.group(1), hm.group(2)))
      if not items:
        # ★★印の 無い 箇条書きも 拾います。★印が 無いだけで、★中身は あります。
        items = [("・", m.group(1)) for m in PLAIN.finditer(body)]
      if not items:
        # ★★印の 無い 表の 行（★`| 節 | 見本に | |` の 形）。
        #   ★★設定の「B ── アプリに あって、見本に 無い もの」が これ でした。
        #   ★★1列目を 名前、★最後の 列を わけ として 読みます。
        for line in body.split("\n"):
          if not line.strip().startswith("|"):
            continue
          cols = [c.strip() for c in line.strip().strip("|").split("|")]
          if len(cols) < 2 or set(cols[0]) <= set("-: "):
            continue
          if cols[0] in ("節", "何", "印", "見本", "名前"):
            continue
          why = cols[-1] if len(cols) > 1 else ""
          items.append(("・", cols[0] + ("　── " + why if why else "")))
      if not items:
        uncovered.append((screen, head))
        continue
      for mark, what in items:
        what = re.sub(r"\*\*|★", "", what).strip()
        if not what or what in ("何", "何を", "中身"):
          continue
        # ★★意図して 違えた ものか、★間に合わせか。
        #   ★★紙に「お決め」「裁定」「消さないで」と 書いて あれば 意図。
        #   ★★「まだ」「いまは」「仮に」と あれば 間に合わせ。
        #   ★★どちらとも 書いて いなければ、★★「★紙に 書いて いません」と 出します。
        #     ★私が その場で 決めません。★書いて いない ことは 書いて いない、と 言います。
        # ★★はじめ、★字の まわり だけを 見て いました。
        #   ★★小見出しから 拾った ものは、★その 字が 中身に ありません。
        #     ★だから いつも「書いて いません」に なって いました。
        #   ★★親の 見出しも 一緒に 見ます ──
        #     ★「消さないでください」「現状維持」は、★たいてい 親に 書いて あります。
        at = body.find(what)
        near = head + "\n" + (body[max(0, at - 260):at + 480] if at >= 0 else body)
        if re.search(r"お決め|裁定|消さないで|現状維持|変更禁止|原則|約束", near):
          why = "意図"
        elif re.search(r"まだ|いまは|仮に|間に合わせ|暫定|先送り", near):
          why = "便宜"
        else:
          why = "★紙に 書いて いません"
        done.append((screen, mark, what, head, why))

  seen = set()
  cur = None
  for screen, mark, what, head, why in done:
    key = (screen, mark, what[:24])
    if key in seen:
      continue
    seen.add(key)
    if screen != cur:
      print("\n── %s" % screen)
      cur = screen
    print("   %s  %-58s  %s" % (mark, what[:58], why))
  print("\n  ★合計 %d 件" % len(seen))

  print()
  print("── ★丸ごと 新しい もの（★見くらべる 節が そもそも ありません）")
  for screen, what, rel, ruling, why, note in WHOLLY_NEW:
    print("   %s ／ %s" % (screen, what))
    print("      %s ／ 裁定 … %s" % (why, ruling))
    print("      %s" % note)
  print("\n  ★丸ごと 新しい もの: %d 件" % len(WHOLLY_NEW))

  print()
  print("=" * 68)
  print("■ 今後 追加予定（★台帳の 先送り）")
  print("=" * 68)
  led = read(LEDGER)
  for _d, head, body in sections(led):
    m = re.match(r"^([㉑-㊿]|[㉑-㋏])\s*(.*)$", head)
    if not m:
      continue
    trig = ""
    tm = re.search(r"###\s*★?引き金\s*\n+(.+?)(?:\n\n|\n###)", body, re.S)
    if tm:
      trig = " ".join(re.sub(r"\*\*|★|`", "", tm.group(1)).split())[:64]
    print("   %s  %s" % (m.group(1), m.group(2)[:60]))
    if trig:
      print("        引き金 … %s" % trig)

  print()
  print("=" * 68)
  print("★この 数え 自身の 検算")
  if uncovered:
    print("　★★拾えなかった 節が %d 件 あります。★手で ご覧ください:" % len(uncovered))
    for screen, head in uncovered:
      print("     ・%s … 「%s」" % (screen, head[:52]))
    print("　★★印（㋐ など）の 付いて いない 書き方の 節です。")
  else:
    print("　✓ 見出しに 当たった 節は、★すべて 中身を 拾えました")
  # ★★1件も 拾えなかった 紙を、★名指しで 出します。
  #   ★★「見本より 多い」という 見出しを 持たない 紙です。
  #   ★★黙って いると、★その 画面には 何も 無い ように 見えます。
  hit = set(sc for sc, _m, _w, _h, _y in done)
  silent = [sc for sc, _rel in DONE_DOCS if sc not in hit]
  if silent:
    print()
    print("★★この 一覧に 1件も 出て いない 紙 ── %d 枚" % len(silent))
    for sc in silent:
      print("   ・%s" % sc)
    print("　★★「見本より 多い」という 見出しを 持たない 紙です。")
    print("　★★中身が 無い とは 限りません。★手で お確かめ ください。")

  print()
  print("★★この 道具が 見て いない こと")
  print("　★紙に 書いて いない ものは 出ません。★報告を 書き忘れた ものは 落ちます。")
  print("　★コードそのものは 読んで いません。★紙だけ です。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
