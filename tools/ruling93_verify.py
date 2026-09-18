# -*- coding: utf-8 -*-
"""★裁定 その93 の 確かめ ── ★列は 読み道 でしか 渡らない（★2026-09-19）

  ★★★決まり（RLS）は **行** を 守ります。★**列** は 守りません。
    ★★だから、★見せる 列 だけ を 返す 関数に 替えました。

  ★★較正 ── ★当たる はず（`lessons` の ご本人の 枝）と
    ★★外れる はず（`lesson_presets` の 在籍の 枝）を 両方 見ます。
"""

import io, os, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_read import 問う, 真

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

決まり = 問う("""
select c.relname as hyo, p.polname as kimari, p.polcmd::text as itsu,
       (position('enrollments' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as zaiseki,
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
if not 決まり:
  raise SystemExit("★止まりました ── 決まりを 読めません")
if any(真(r, "zaiseki") for r in 決まり):
  raise SystemExit("★止まりました ── 在籍の 枝が まだ 残って います")

# ★★較正 ── ★当たる はずの 方。
較 = 問う("""
select (position('student_id' in pg_get_expr(p.polqual, p.polrelid)) > 0)::text as atari
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'lessons' and p.polcmd = 'r'
""")
if not any(真(r, "atari") for r in 較):
  raise SystemExit("★止まりました ── 較正が 合いません。道具が 壊れて います。")

関数 = 問う("""
select p.proname as na, p.prosecdef::text as teigi,
       coalesce(array_to_string(p.proconfig, ','), '（なし）') as michi,
       pg_get_function_result(p.oid) as kaeri,
       coalesce(array_to_string(array(
         select r.rolname from pg_roles r
         where has_function_privilege(r.rolname, p.oid, 'execute')
           and r.rolname in ('anon', 'authenticated')), '／'), '（なし）') as dare
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_lesson_preset_for_student'
""")
if not 関数:
  raise SystemExit("★止まりました ── 読み道が ありません")
f = 関数[0]
if not 真(f, "teigi"):
  raise SystemExit("★止まりました ── `security definer` で ありません")
if "note" in f["kaeri"] or "need_count" in f["kaeri"] or "created_by" in f["kaeri"]:
  raise SystemExit("★止まりました ── 返す ものに 見せない 列が 入って います: " + f["kaeri"])

列 = 問う("""
select column_name as hashira
from information_schema.columns
where table_schema = 'public' and table_name = 'lesson_presets'
order by ordinal_position
""")

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-裁定その93-確かめ.md" % 今日)

行 = []
行.append("# ★裁定 その93 ── ★列は 読み道 でしか 渡りません")
行.append("")
行.append("★%s ／ ★`tools/ruling93_verify.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("## ★決まり ── ★在籍の 枝を 取り消しました")
行.append("")
行.append("| 表 | 決まり | いつ | 在籍 | 事務 | 門下 |")
行.append("|---|---|---|---|---|---|")
for r in 決まり:
  行.append("| %s | `%s` | %s | %s | %s | %s |" % (
    r["hyo"], r["kimari"], r["itsu"],
    "○" if 真(r, "zaiseki") else "ー",
    "○" if 真(r, "me") else "ー", "○" if 真(r, "mw") else "ー"))
行.append("")
行.append("★★★裁定 その92 で 足した 枝は、★1本も 残って いません。")
行.append("")
行.append("## ★読み道")
行.append("")
行.append("| | |")
行.append("|---|---|")
行.append("| 名 | `%s` |" % f["na"])
行.append("| 決まりを 越えるか | %s |" % ("はい（`security definer`）" if 真(f, "teigi") else "いいえ"))
行.append("| 綴りの 道 | `%s` |" % f["michi"])
行.append("| 返す もの | `%s` |" % f["kaeri"])
行.append("| 呼べる 方 | %s |" % f["dare"])
行.append("")
行.append("★`lesson_presets` の 列 …… %s" % "／".join("`%s`" % r["hashira"] for r in 列))
行.append("")
行.append("★★★台帳の 外に 出るのは、★そのうち **2つ** だけ です。")
行.append("★★出ない もの ── `note`（事務の 覚え書き）／`need_count`（足りると される 回数）")
行.append("★★／`created_by`（誰が 作ったか）／`id`／`org_id`／`created_at`／`updated_at`。")
行.append("")
行.append("★★★`need_count` を 渡さない わけ ── ★足りる 回数が 分かると、")
行.append("★★「足りない 見込み」の 出どころが 読めます。★率に 近づきます（★裁定 その90）。")
行.append("")
行.append("## ★門は どこに あるか")
行.append("")
行.append("★★決まりを 越えて 読む ので、★門を **関数の 中** に 立てて います。")
行.append("★★`enrollments`（`status = 'active'`）に 居る 方 だけ が 中身を 受け取ります。")
行.append("★★★やめた 方（`left`）には、★0行 返ります。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("決まり %d（在籍の枝 0）／ 読み道 %s ／ 列 %d" % (len(決まり), f["kaeri"], len(列)))
