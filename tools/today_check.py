# -*- coding: utf-8 -*-
"""★きょう 入れた ものを、★実機で 確かめる ための 覚え書き（★2026-09-19）

  ★★★私は 描かれた 姿を 見られません。★写真は 坂本さんが お撮り ください。
    ★★だから ここでは「★どこを 開いて、★何を ご覧に なるか」を 並べます。

  ★★★この 1本が 台帳に 尋ね、★この 1本が 書きます。
    ★★いまの 行の 数も 一緒に 出します ── ★空の ままだと 出ない ものが あります。

  ★★較正 ── ★必ず 在る ものと、★必ず 無い もので 試します。
"""

import io, os, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_read import 問う

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

数 = 問う("""
select
 (select count(*) from public.org_divisions)::text as katachi,
 (select count(*) from public.my_periods)::text as koma,
 (select count(*) from public.enrollments where status = 'active')::text as zaiseki,
 (select count(*) from public.enrollments where grade_year is not null)::text as gakunen,
 (select count(*) from public.assignments where ended_at is null)::text as ukemochi,
 (select count(*) from public.org_billing)::text as seikyu,
 (select count(*) from public.portfolios)::text as keireki,
 (select count(*) from public.lesson_presets)::text as kata
""")
if not 数:
  raise SystemExit("★止まりました ── 台帳に 聞けません")
n = 数[0]
if n["koma"] == "" or n["zaiseki"] == "":
  raise SystemExit("★止まりました ── 数が 読めません")

確かめ = [
  ("設定の 骨", "運営 → 設定",
   "左に 一覧、右に 中身。狭い ときは 縦に 並びます",
   ["節が できことで 増え減りする（学長と 先生で ちがう）",
    "触れない 節が「まだ」と 出て、何が 足りないかが 書いて ある",
    "見やすさ を 押すと、文字の 大きさが 5段 出る"], None),
  ("学校の 形", "運営 → 設定 → 学校の 形",
   "学部・学科・分野を 足す・消す",
   ["学科は 上の 学部を 先に 選ぶ",
    "同じ 名は 足せない（わけが 字で 出る）",
    "使われて いる ものは 消せない",
    "学年は「ここでは 足せません」と 出る"],
   "いま 0つ です。まず 1つ 足して から、下の ものを ご覧ください" if n["katachi"] == "0" else None),
  ("ご請求の 宛名・宛先", "運営 → 設定 → ご請求",
   "宛名・部署・ご担当・送り先・インボイス番号",
   ["お支払いの できことが 無い 方には、欄が 出ず 値だけ 出る",
    "銀行振込（請求書）だけ 選べる。カード・口座振替は「まだ」",
    "直すと、下の「記録」に 1行 増える"],
   "いま 0行 です。何か 入れると 1行 できます" if n["seikyu"] == "0" else None),
  ("ひとと 役職", "運営 → 設定 → ひとと 役職",
   "確かめ・学科・分野",
   ["ご自分で 選んだ ままの 方に「確かめる」が 出る",
    "確かめると、いつ 確かめたかが 出る",
    "学科・分野の 札で 一覧が 絞れる"], None),
  ("名簿（その人）", "運営 → 名簿 → お名前を 押す",
   "学科・出席・在籍の ようす",
   ["学科・コースと、その 上の 学部が 出る",
    "この3か月の 出席・休み・休講の 数が 出る（率は 出ない）",
    "在籍 ⇄ 休会 を 選べる。退会は ここに 無い",
    "休会に すると、ご請求の 人数が 1人 減る"], None),
  ("招く", "運営 → 名簿 → ＋ 招く",
   "学年・学科を 決めて から 合言葉",
   ["学年（1〜6）と 学科を 選べる。選ばなくても よい",
    "合言葉が 出る"], None),
  ("日程を 組む", "運営 → 門下 → レッスンの 日程を 組む",
   "空いて いる コマから 置く",
   ["行が ご自分の コマ、列が 7日",
    "マスに 人数が 出る（時間割を 書いて いる 方 だけ）",
    "マスを 押すと、来られる 方が 出る。押すと 置く",
    "置いた ものを 外せる",
    "まだ できない こと が 4つ 出る"],
   "ご自分の コマが %s件 です。0なら 行が 出ません" % n["koma"]),
  ("お知らせを 書く", "運営 → 連絡 → ＋ お知らせを 書く",
   "宛先を 段で 狭める",
   ["学科・学年・お名前で 狭められる",
    "いま 何人に 届くかが いつも 出る",
    "0人に なると「出す」が 押せなく なる",
    "題の 欄が ある"], None),
  ("開いた 記録", "運営 → 連絡（門下を 開かずに）",
   "学校ぜんぶの 記録",
   ["誰が・いつ・どの 門下 が 並ぶ",
    "何を 読んだかは どこにも 出ない"], None),
  ("経歴（個人）", "もっと → 経歴（ポートフォリオ）",
   "字の もの と 録画の リンク",
   ["お名前・声種・じぶんのことば が 残る",
    "学んだところ・賞・師事 を 足せる・消せる",
    "録画は https の リンクだけ。押すと 外へ 移る",
    "公開の 範囲は「自分だけ」から 始まる"], None)
]

今日 = datetime.date.today().isoformat()
行 = []
行.append("# ★きょう 入れた ものの 確かめ（★実機）")
行.append("")
行.append("★%s ／ ★`tools/today_check.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★★私は 描かれた 姿を 見られません。★写真は 坂本さんが お撮り ください。")
行.append("★★見つかった ちがいは、★1つずつ お知らせ ください。★直します。")
行.append("")
行.append("## ★いまの 台帳の 数")
行.append("")
行.append("| もの | 行 |")
行.append("|---|---|")
for k, ラベル in (("katachi", "学校の 形"), ("koma", "ご自分の コマ"),
                ("zaiseki", "在籍（active）"), ("gakunen", "学年（数）が 入って いる"),
                ("ukemochi", "受け持ち"), ("seikyu", "ご請求"),
                ("keireki", "経歴"), ("kata", "授業の 型")):
  行.append("| %s | %s |" % (ラベル, n[k]))
行.append("")
行.append("★★★0の ものは、★画面に 何も 出ません。★それは 壊れて いる のでは ありません。")
行.append("")

for i, (名, 道, 何, 見る, 注) in enumerate(確かめ, 1):
  行.append("## ★%d %s" % (i, 名))
  行.append("")
  行.append("★どこ …… %s" % 道)
  行.append("★何が できる …… %s" % 何)
  行.append("")
  for x in 見る:
    行.append("- [ ] %s" % x)
  if 注:
    行.append("")
    行.append("★★%s" % 注)
  行.append("")

行.append("## ★お願い")
行.append("")
行.append("★★「合って いる」と 思われた ものも、★そのまま お知らせ ください。")
行.append("★★★私の ほうでは、★字と 台帳しか 見て いません。")
行.append("★★見た目・触り心地・読みやすさは、★写真でしか 分かりません。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-きょうの確かめ.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("確かめる 画面 %d ／ 見る ところ %d"
      % (len(確かめ), sum(len(x[3]) for x in 確かめ)))
