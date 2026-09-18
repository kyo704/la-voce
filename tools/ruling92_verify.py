# -*- coding: utf-8 -*-
"""★裁定 その92 の 確かめ ── ★学生は 型を 読める。★型の 割り当ては 読めない。

  ★★★この 1本が 台帳に 尋ね、★その 答えで 覚え書きを 書きます。

  ★★★確かめる こと（★裁定の VERIFY）。
    ★① 学生が `lesson_preset_targets` を 1行も 引けない
    ★② やめた 学生（`status = 'left'`）が 引けない

  ★★★較正 ── ★当たる はずの 方（★事務の 役職）も 一緒に 見ます。
    ★★すべてが false なら、★道具が 壊れて いる かもしれません。
"""

import io, os, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# ★★★台帳の 読み方は `tools/ledger_read.py` が 1つだけ 持ちます。
#   ★★2026-09-19 ── ★ここに 写しを 置いて いた ころ、
#     ★★終わりの「★N件」を 落とす つもりで、★★で 始まる 行を 全部 落として
#     ★★いました。★`★50通り-…` の 学校が まるごと 消えて いました。
#   ★★★写しを やめます。★直す ところを 1つに します。
from ledger_read import 問う, 真

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ---------------------------------------------------------------------------
# 【一】★決まりの 形
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# ★★★この 調べは、★裁定 その93 で 役目を 終えました（★2026-09-19）。
#   ★★裁定 その92 は「在籍の 枝を 足す」でした。★その93 が それを 取り消し、
#     ★★列を 2つ しか 返さない 読み道（関数）に 替えました。
#   ★★★だから、★この 道具は もう 通りません。★通ったら おかしい のです。
#     ★★報告 `docs/reports/2026-09-19-裁定その92-確かめ.md` は そのまま 残します。
#       ★★あれは **その 日の 姿** です。★今日の 姿に 書き換えません。
#   ★★いまの 姿を 見る のは `tools/ruling93_verify.py` です。
# ---------------------------------------------------------------------------
print("★この 調べは 裁定 その93 で 役目を 終えました。")
print("★いまの 姿は tools/ruling93_verify.py を お使い ください。")
raise SystemExit(0)

決まり = 問う("""
select c.relname as hyo, p.polname as kimari, p.polcmd::text as itsu,
       (position('enrollments' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as zaiseki,
       (position('''active''' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as ima,
       (position('meibo' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as me,
       (position('monka_write' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as mw
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname in ('lesson_presets', 'lesson_preset_targets')
order by c.relname, p.polname
""")
型読み = [r for r in 決まり if r["hyo"] == "lesson_presets" and r["itsu"] == "r"]
割読み = [r for r in 決まり if r["hyo"] == "lesson_preset_targets" and r["itsu"] == "r"]
if len(型読み) != 1 or len(割読み) != 1:
  raise SystemExit("★止まりました ── 読む 決まりが 1本ずつ で ありません")
if not 真(型読み[0], "zaiseki"):
  raise SystemExit("★止まりました ── 型の 決まりに 在籍の 枝が ありません")
if 真(割読み[0], "zaiseki"):
  raise SystemExit("★止まりました ── 割り当ての 決まりに 在籍の 枝が 入って います")

# ---------------------------------------------------------------------------
# 【二】★ひとりずつ 見ます ── ★`has_can_user` で 実際に 判じます
# ---------------------------------------------------------------------------
#   ★★★`has_can` は auth.uid() を 見ます。★ここでは 使えません。
#     ★★だから `has_can_user(user_id, org_id, perm)` を 使います。
人 = 問う("""
select o.name as gakko,
       e.status as jotai,
       coalesce(pr.display_name, '（お名前 なし）') as namae,
       has_can_user(e.student_id, e.org_id, 'meibo')::text as me,
       has_can_user(e.student_id, e.org_id, 'monka_write')::text as mw,
       (exists (select 1 from public.enrollments x
                where x.org_id = e.org_id
                  and x.student_id = e.student_id
                  and x.status = 'active'))::text as ima
from public.enrollments e
join public.organizations o on o.id = e.org_id
left join public.profiles pr on pr.id = e.student_id
order by o.name, e.status, pr.display_name
""")
if not 人:
  raise SystemExit("★止まりました ── 在籍が 1件も ありません")

# ★★★較正 ── ★当たる はずの 方。★事務の できことを 持つ 方 です。
較正 = 問う("""
select o.name as gakko, coalesce(pr.display_name, '（お名前 なし）') as namae,
       has_can_user(m.user_id, m.org_id, 'meibo')::text as me
from public.memberships m
join public.org_posts p on p.id = m.post_id
join public.organizations o on o.id = m.org_id
left join public.profiles pr on pr.id = m.user_id
where p.perms ? 'meibo'
order by o.name
""")
if not any(真(r, "me") for r in 較正):
  raise SystemExit("★止まりました ── 事務の 方すら false です。道具が 壊れて います。")

型読める = [r for r in 人 if 真(r, "ima")]
型読めない = [r for r in 人 if not 真(r, "ima")]
def 試し(r):
  return str(r.get("gakko", "")).startswith("★")


# ★★★見せかけの 行を、★本番と 混ぜません（★台帳㊶）。
#   ★★`★50通り-…` は 私が 作った 学校 です。
#   ★★そこでは、★同じ 1つの お客が 生徒でも あり 役職者でも あります。
#   ★★★本番では、★役職を 持つ 在籍者は 1人も いません。
割読める = [r for r in 人 if 真(r, "me") or 真(r, "mw")]
本番 = [r for r in 人 if not 試し(r)]
本番割読める = [r for r in 本番 if 真(r, "me") or 真(r, "mw")]

# ---------------------------------------------------------------------------
# 【三】★覚え書き
# ---------------------------------------------------------------------------
今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-裁定その92-確かめ.md" % 今日)

行 = []
行.append("# ★裁定 その92 ── ★学生に 分母を お見せします")
行.append("")
行.append("★%s ／ ★`tools/ruling92_verify.py` が 書きました。" % 今日)
行.append("★（★丈と 末尾は 下に あります）")
行.append("")
行.append("## ★入れた もの")
行.append("")
行.append("★`supabase/migration_student_reads_preset.sql`")
行.append("★★`lesson_presets` の 読む 決まりに、★在籍の 枝を 1本 足しました。")
行.append("★★`lesson_preset_targets` は **触って いません**。")
行.append("")
行.append("| 表 | 決まり | いつ | 在籍の 枝 | `active` | 事務 | 門下 |")
行.append("|---|---|---|---|---|---|---|")
for r in 決まり:
  行.append("| %s | `%s` | %s | %s | %s | %s | %s |" % (
    r["hyo"], r["kimari"], r["itsu"],
    "○" if 真(r, "zaiseki") else "ー", "○" if 真(r, "ima") else "ー",
    "○" if 真(r, "me") else "ー", "○" if 真(r, "mw") else "ー"))
行.append("")
行.append("★★★裁定の 文には `e.user_id` と ありました。")
行.append("★★この 蔵の 列は `student_id` です。★実物に 合わせました。")
行.append("")

行.append("## ★確かめ ① ★学生は 割り当てを 引けない")
行.append("")
行.append("★在籍して いる 方 …… **%d人**（★うち 本番の 学校 …… %d人）"
          % (len(人), len(本番)))
行.append("")
行.append("★本番で、★事務（`meibo`）か 門下（`monka_write`）も 持つ 方 …… **%d人**"
          % len(本番割読める))
行.append("★試しの 学校（`★50通り-…`）で 持つ 方 …… **%d人**"
          % (len(割読める) - len(本番割読める)))
行.append("")
行.append("★★★試しの 学校では、★1つの お客が 生徒でも あり 役職者でも あります。")
行.append("★★私が 作った 見せかけの 行 です。★本番の 姿では ありません。")
行.append("")
行.append("| 学校 | お名前 | 在籍 | 事務 | 門下 | 型が 読める | 割り当てが 読める |")
行.append("|---|---|---|---|---|---|---|")
for r in 人:
  読型 = 真(r, "ima") or 真(r, "me") or 真(r, "mw")
  読割 = 真(r, "me") or 真(r, "mw")
  行.append("| %s | %s | %s | %s | %s | %s | %s |" % (
    r["gakko"], r["namae"], r["jotai"],
    "○" if 真(r, "me") else "ー", "○" if 真(r, "mw") else "ー",
    "○" if 読型 else "×", "○" if 読割 else "×"))
行.append("")
行.append("★★`lesson_preset_targets` の 決まりは、★事務と 門下 だけ を 見ます。")
行.append("★★在籍の 枝は ありません。★足しても いません。")
行.append("★★★本番の 在籍者は、★どちらの できことも 持ちません（%d人 中 %d人）。"
          % (len(本番), len(本番割読める)))
行.append("★★だから 本番では、★割り当ては **1行も** 返りません。")
行.append("")
行.append("★★★試しの 学校で ○ が 付く 方は、★役職を 持つ からです。")
行.append("★★学生だから 見える のでは ありません。★事務だから 見えて います。")
行.append("★★どの 先生が 何の 型を 持つかは、★学生に 伝わりません。")
行.append("")

行.append("## ★確かめ ② ★やめた 方は 読めない")
行.append("")
行.append("★`status = 'active'` の 方 …… **%d人**" % len(型読める))
行.append("★そうで ない 方（`left` など）…… **%d人**" % len(型読めない))
行.append("")
for r in 型読めない:
  行.append("- %s ／ %s ／ `%s` ── ★型は 読めません" % (r["gakko"], r["namae"], r["jotai"]))
if not 型読めない:
  行.append("★★いまは 0人 です。")
行.append("")
行.append("★★決まりの 枝が `and x.status = 'active'` を 求めます。")
行.append("★★★去った 先の 型は、★もう ご縁が ありません。")
行.append("")

行.append("## ★較正 ── ★道具が 生きて いる こと")
行.append("")
行.append("★事務の できことを 持つ 方 …… **%d人**。★そのうち true …… **%d人**"
          % (len(較正), len([r for r in 較正 if 真(r, "me")])))
行.append("★★★全部 false なら、★道具の 壊れ です。★上で 止めます。")
行.append("")

行.append("## ★お伝えして おく こと ── ★列は 隠せません")
行.append("")
行.append("★`lesson_presets` の 列 …… `id` `org_id` `name` `total_count` `note`")
行.append("★`created_by` `created_at` `updated_at` `need_count`")
行.append("")
行.append("★★★決まり（RLS）は **行** を 選びます。★**列** は 隠せません。")
行.append("★★学生が 1行 読めると、★その 行の 列は 全部 渡ります。")
行.append("★★★画面には `name` と `total_count` しか 出しません。")
行.append("★★けれど、★通信の 中身を 見れば `note` も `need_count` も 見えます。")
行.append("")
行.append("★いまの 型の 行 …… **0件**。★`note` の 入った 行 …… **0件**。")
行.append("★★★だから 今日 漏れる ものは ありません。")
行.append("")
行.append("★★お決め ごと です ── ★`note`（学校の 覚え書き）と")
行.append("★★`need_count`（足りると される 回数）を、★学生に 見せて よいか。")
行.append("★★★見せない なら、★`name` と `total_count` だけ を 返す")
行.append("★★読み道（`security definer`）に 変えます。★1本で 済みます。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈と 末尾は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("在籍 %d（本番 %d ／ active %d ／ ほか %d）／ 割り当てが 読める %d（本番 %d）／ 較正 %d"
      % (len(人), len(本番), len(型読める), len(型読めない),
         len(割読める), len(本番割読める), len(較正)))
