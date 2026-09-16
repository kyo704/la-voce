#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★裁定その54 の 反映漏れを 探します。

  ★★出どころ　Opus（★2026-09-16）──
    「★同じ 文言が 他にも 残って いないか 確認。
      ★grep対象「束に なって」「二重には いただきません」
      ★範囲 アプリ本体・見本・営業資料・特商法ページ 全て。
      ★裁定その54 が 全箇所に 反映されて いない 可能性が ある。」

  ★★裁定その54（★2026-09-13・坂本さん承認済み）──
    「★学校の 400円は 運営のみ。★個人の 有料機能は 学生が 自分で 買う」
    ★→「調べる」は もはや 学校費用に 含まれない。

  ★★だから 探すのは 2つ です ──
    ★① Opus が 名指しした 2語（★確実な 印）
    ★② 同じ 考えの 言い換え（★「学校が 調べるを 払う」と 読める 文）
      ★★②を 入れる わけ ── ★2語を 消しても、★言い換えが 残れば
        ★同じ 誤りが 本番に 出ます。★語を 消すのでは なく、★考えを 探します。
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.expanduser("~")
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-裁定その54の反映漏れ.md")

# ★★探す 先。★家の 外も 見ます（★営業資料は 家の 外に あります）。
ROOTS = [
  ("アプリ・見本・記録（la-voce）", ROOT),
  ("営業資料ほか（デスクトップ docs:）", os.path.join(HOME, "Desktop", "docs:")),
  ("デスクトップ直下", os.path.join(HOME, "Desktop")),
  ("月曜日sonnetに渡すもの", os.path.join(ROOT, "月曜日sonnetに渡すもの")),
  ("デスクトップ（家の中の写し）", os.path.join(ROOT, "デスクトップ")),
]

SKIP_DIR = {".git", "node_modules", ".next", "dist", "build", ".vercel",
            "DCIM", "MP_ROOT", "AnyTrans.app", "ios", "capacitor-www"}
EXT = {".js", ".jsx", ".ts", ".tsx", ".md", ".txt", ".html", ".sql", ".json", ".css"}

# ★① Opus が 名指しした 2語
NAMED = ["束に なって", "二重には いただきません"]
# ★★字の ゆれも 拾います。★空白の あるなしで 逃げられない ように。
# ★★★2026-09-16、★ここで 1度 誤りました（★出す 前に 捕まえました）。
#   ★★`束\s*に\s*なっ` は、★**「約束に なって」**に 当たります。
#     ★★3件を「本番に 出ます」と 数えました。★どれも 別の 話 でした。
#       ★components/VocalTracker.jsx … 「約束に なって しまいます」
#       ★lib/outboundRoutes.js　　　 … 「約束に なって いません」
#   ★★だから、★前の 字を 見ます。★「約」の あとの 束は、★束では ありません。
#   ★★もう 1つ ある ── `lib/recordV2.js` の「場面ごとの 束に なって」。
#     ★★こちらは 本当に「束」ですが、★お金の 話では ありません。
#     ★★語は 同じ、★意味が ちがう。★だから ③ に 分けます。
#       ★★消して しまうと、★次に 探した 人が また 拾い、また 悩みます。
NAMED_RE = [
  ("束に なって", re.compile(r"(?<![約花約])束\s*に\s*なっ")),
  ("二重には いただきません", re.compile(r"二重\s*に\s*は?\s*いただ")),
]

# ★③ 語は 同じだが、★お金の 話では ない もの。
#   ★★近くに この どれかが 無ければ、★別の 意味と 見ます。
MONEY_RE = re.compile(r"調べる|学校|名簿|お支払|支払|円|プラン|有料|課金|束で")

# ★② 同じ 考えの 言い換え
IDEA_RE = [
  ("名簿に入っている間は…（学校が 調べるを 賄う、と 読める）",
   re.compile(r"名簿に\s*入っている\s*間")),
  ("名簿から外れると止まります（★調べるは 止まりません）",
   re.compile(r"名簿から\s*外れると\s*止ま")),
  ("学校が（調べる／分析／有料機能）を 払う、と 読める",
   re.compile(r"学校[がはも][^\n]{0,24}(調べる|分析|有料)")),
  ("束（たば）としての 提供",
   re.compile(r"バンドル|一括提供|込みで\s*ご利用")),
  # ★★★2026-09-16、★ここを 足しました。
  #   ★★はじめの 型では、★営業資料 v5 の いちばん 大事な 1行を **拾えません** でした ──
  #     「★400円には、その学生の「しらべる」（市販価格 580円相当）と、…」
  #   ★★2語（束／二重）も、★「名簿に入っている間」も 使って いません。
  #     ★★同じ ことを、★別の 言い方で 書いて います。
  #   ★★これが「語を 消すのでは なく、★考えを 探す」の 意味 です。
  #     ★★1度 取りこぼして、★手で 読んで 見つけました。★型に 戻しました。
  ("400円に「しらべる」が 含まれる、と 書いて ある",
   re.compile(r"400\s*円[には][^\n]{0,40}(しらべる|調べる)")),
  ("学生ぶんの 有料機能を 学校が 賄う、と 読める",
   re.compile(r"(学生|生徒)の[^\n]{0,16}(しらべる|調べる)[^\n]{0,20}(含|込|賄|付)")),
  ("市販価格との くらべ（束で 安く なる、の 言い方）",
   re.compile(r"市販価格|お安く\s*なりま")),
]

hits = []
seen_files = set()


def scan(label, base):
  if not os.path.isdir(base):
    return 0
  n = 0
  for dp, dns, fns in os.walk(base):
    dns[:] = [d for d in dns if d not in SKIP_DIR and not d.startswith(".")]
    # ★★デスクトップ直下は 深く 潜りません（★別の 仕事の 山が あります）。
    if base == os.path.join(HOME, "Desktop") and dp != base:
      dns[:] = []
      continue
    for fn in fns:
      if os.path.splitext(fn)[1].lower() not in EXT:
        continue
      p = os.path.join(dp, fn)
      rp = os.path.realpath(p)
      # ★★★自分の 出した 紙を 読みません（★2026-09-16）。
      #   ★★1度目は 57件、★2度目は **375件** に なりました。
      #     ★★増えた ぶんは、★すべて この 道具 自身の 報告 です。
      #       ★見つけた 行を そのまま 引いて 書くので、★次に 読むと また 当たります。
      #   ★★数が 増えたのを「見落として いた」と 読みかけました。
      #     ★★ちがいます。★道具が 自分の 尻尾を 噛んで いた だけ です。
      if rp == os.path.realpath(OUT):
        continue
      if rp in seen_files:
        continue
      seen_files.add(rp)
      n += 1
      try:
        s = io.open(p, encoding="utf-8", errors="ignore").read()
      except Exception:
        continue
      for line_no, line in enumerate(s.split("\n"), 1):
        for name, rx in NAMED_RE:
          if rx.search(line):
            # ★★近くに お金の 話が あるか。★前後 2行 まで 見ます。
            lines = s.split("\n")
            near = "".join(lines[max(0, line_no - 3):line_no + 2])
            kind = "①" if MONEY_RE.search(near) else "③"
            hits.append((kind, name, label, p, line_no, line.strip()))
        for name, rx in IDEA_RE:
          if rx.search(line):
            hits.append(("②", name, label, p, line_no, line.strip()))
  return n


counted = 0
for label, base in ROOTS:
  counted += scan(label, base)

if counted == 0:
  print("★★1つも 読めませんでした。★止まります。")
  sys.exit(1)

# ★★同じ 行を 2度 出しません。
uniq, key = [], set()
for h in hits:
  k = (h[3], h[4], h[1])
  if k in key:
    continue
  key.add(k)
  uniq.append(h)


def rel(p):
  if p.startswith(ROOT):
    return os.path.relpath(p, ROOT)
  return p.replace(HOME, "~")


def live(p):
  """★これは 本番に 出る ものか。★出ない もの（記録・報告）か。"""
  r = rel(p)
  if r.startswith(("app/", "components/", "lib/")):
    return "★本番に 出ます"
  if "pack-final" in r or "docs/opus" in r:
    return "★見本"
  if r.startswith(("docs/reports", "docs/records")):
    return "記録（直しません）"
  if not r.startswith(("app", "components", "lib", "docs", "supabase", "tools")):
    return "★家の 外（営業資料など）"
  return "その他"


L = []
A = L.append
A("# 裁定その54 の 反映漏れ さがし")
A("")
A("★出どころ　Opus（2026-09-16）")
A("★**1文字も 直して いません。** 見つけた ところを 並べるだけ です。")
A("")
A("## 裁定その54（2026-09-13・坂本さん承認済み）")
A("")
A("> 学校の 400円は 運営のみ。個人の 有料機能は 学生が 自分で 買う")
A("")
A("★→「調べる」は もはや 学校費用に 含まれません。")
A("")
A("## 探し方")
A("")
A("★2つ 探しました。")
A("")
A("・**①** Opus が 名指しした 2語 …… 「束に なって」「二重には いただきません」")
A("・**②** 同じ 考えの 言い換え …… 「学校が 調べるを 賄う」と 読める 文")
A("・**③** 語は 同じだが、★お金の 話では ない もの（★直す 必要が ありません）")
A("")
A("★★②を 入れた わけ ── ★2語を 消しても、★言い換えが 残れば")
A("　★同じ 誤りが 本番に 出ます。★語では なく **考え**を 探しました。")
A("")
A("★読んだ 紙 … %d 枚" % counted)
A("")
A("## 見つかった ところ（%d 件）" % len(uniq))
A("")
if not uniq:
  A("★ありません。")
else:
  A("| | 何 | どこ | 行 | どういう 紙か |")
  A("|---|---|---|---|---|")
  for kind, name, label, p, ln, line in uniq:
    A("| %s | %s | `%s` | %d | %s |" % (kind, name[:26], rel(p), ln, live(p)))
  A("")
  A("### 中身")
  A("")
  for kind, name, label, p, ln, line in uniq:
    A("**%s　%s**　`%s:%d`　%s" % (kind, name, rel(p), ln, live(p)))
    A("")
    A("```")
    A(line[:300])
    A("```")
    A("")

A("## まとめ")
A("")
grp = {}
for kind, name, label, p, ln, line in uniq:
  grp.setdefault(live(p), []).append(p)
A("| どういう 紙か | 件数 |")
A("|---|---|")
for k in sorted(grp):
  A("| %s | %d |" % (k, len(grp[k])))
A("")
A("★★「★本番に 出ます」が 0 件なら、★利用者の 目には 触れて いません。")
A("　★それでも 見本と 営業資料は 直す 値打ちが あります ──")
A("　★★見本は これから 実装の 元に なり、★営業資料は 学校に お見せする もの です。")
A("")
A("★★私からは 直しません。")
A("　★見本は Opus が 当てると 伺って います。")
A("　★営業資料は 坂本さんの もの です。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
b = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
io.open(OUT, "w", encoding="utf-8").write(
  b[0] + "\n全%d行 / 末尾は「%s」\n" % (len(b) + 1, b[-1]) + "\n".join(b[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("FILES_READ: %d" % counted)
print("HITS: %d" % len(uniq))
for k in sorted(grp):
  print("  %s: %d" % (k, len(grp[k])))
