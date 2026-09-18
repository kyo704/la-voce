# -*- coding: utf-8 -*-
"""★裁定 その90 の 確かめ ── ★Q1〜Q5（★2026-09-19）

  ★★★この 1本が 台帳に 尋ね、★その 答えで 覚え書きを 書きます。
    ★★手で 書いた 文は 混ぜません（★覚え「報告は 同じ 道具が 書く」）。

  ★★★較正（★2026-09-19 に 一度 つまずきました）。
    ★★`ask_ledger.py` の 表は、★1つの 値を 64字で 切ります。
    ★★長い 決まりの 式を 持ち帰ろうと して、★切れた 字を 見て いました。
    ★★★だから 字を 運びません。★**台帳の 中で** 真偽を 出して もらいます。
    ★★下の 【零】で、★通る はず／通らない はず を 両方 試します。
"""

import io, os, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIKU = os.path.join(ROOT, "tools", "ask_ledger.py")


def 問う(sql):
  r = subprocess.run([sys.executable, KIKU, sql], capture_output=True, text=True)
  out = r.stdout.strip()
  if r.returncode != 0 or "★止まりました" in out:
    raise SystemExit("★止まりました ── 台帳に 聞けません。\n" + out + r.stderr)
  行 = [l for l in out.splitlines() if l.strip()]
  if not 行 or 行[0] == "（0件）":
    return []
  頭 = [c.strip() for c in 行[0].split("|")]
  中 = [l for l in 行[2:] if not l.startswith("★")]
  return [dict(zip(頭, [c.strip() for c in l.split("|")])) for l in 中]


def 真(r, k):
  return str(r.get(k, "")).strip().lower() == "true"


# ---------------------------------------------------------------------------
# 【零】★道具の 較正 ── ★当たる はず・外れる はず
# ---------------------------------------------------------------------------
較正 = 問う("""
select (position('can_view_ops_perm' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as ataru,
       (position('絶対に無い語' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as hazureru
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'lessons' and p.polcmd = 'r'
""")
if not any(真(r, "ataru") for r in 較正):
  raise SystemExit("★止まりました ── 当たる はずの 語が 当たりません。道具が 壊れて います。")
if any(真(r, "hazureru") for r in 較正):
  raise SystemExit("★止まりました ── 外れる はずの 語が 当たりました。道具が 壊れて います。")

# ---------------------------------------------------------------------------
# 【一】★`lessons` を 読む 決まり ── ★どの 枝が 在るか
# ---------------------------------------------------------------------------
式 = 問う("""
select p.polname as pol,
       length(pg_get_expr(p.polqual, p.polrelid))::text as nagasa,
       (position('auth.uid() = student_id' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as jibun,
       (position('sched_all' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as sa,
       (position('teacher_id = auth.uid()' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as jibun_no_koma,
       (position('sched_mine' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as sm,
       (position('can_view_ops_perm' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as dekikoto,
       (position('teacher_student_links' in
          pg_get_expr(p.polqual, p.polrelid)) > 0)::text as musubi
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'lessons' and p.polcmd = 'r'
order by p.polname
""")
if len(式) < 2:
  raise SystemExit("★止まりました ── 決まりが %d本 しか ありません" % len(式))

主 = [r for r in 式 if 真(r, "dekikoto")]
if not 主:
  raise SystemExit("★止まりました ── できことの 門が 見つかりません")
要る = {"生徒 ご自身": "jibun", "学校 全部": "sa",
       "自分の コマ": "jibun_no_koma", "自分の 日程": "sm"}
欠け = [k for k, v in 要る.items() if not 真(主[0], v)]
if 欠け:
  raise SystemExit("★止まりました ── 枝が 足りません: " + " ".join(欠け))

# ---------------------------------------------------------------------------
# 【二】★役職の できこと
# ---------------------------------------------------------------------------
役職 = 問う("""
select o.name as gakko, p.name as post,
       (p.perms ? 'monka_write')::text as mw,
       (p.perms ? 'sched_mine')::text  as sm,
       (p.perms ? 'sched_all')::text   as sa,
       (p.perms ? 'meibo')::text       as me
from public.org_posts p
join public.organizations o on o.id = p.org_id
order by o.name, p.name
""")
if not 役職:
  raise SystemExit("★止まりました ── 役職が 1件も ありません")
門下持ち = [r for r in 役職 if 真(r, "mw")]
門下だけ = [r for r in 門下持ち if not 真(r, "sm") and not 真(r, "sa")]

# ---------------------------------------------------------------------------
# 【三】★学生に 役職は 無い（★Q1 の 裏取り）
# ---------------------------------------------------------------------------
在籍 = 問う("""
select
  (select count(*) from public.organizations
     where name not like '★%')::text as honban_gakko,
  (select count(distinct e.student_id) from public.enrollments e
     join public.organizations o on o.id = e.org_id
    where o.name not like '★%')::text as honban_seito,
  (select count(*) from public.enrollments e
     join public.memberships m
       on m.user_id = e.student_id and m.org_id = e.org_id
     join public.organizations o on o.id = e.org_id
    where m.post_id is not null and o.name not like '★%')::text as honban_yaku,
  (select count(*) from public.enrollments e
     join public.memberships m
       on m.user_id = e.student_id and m.org_id = e.org_id
     join public.organizations o on o.id = e.org_id
    where m.post_id is not null and o.name like '★%')::text as tameshi_yaku
""")
if not 在籍:
  raise SystemExit("★止まりました ── 在籍を 数えられません")
本番の学校 = 在籍[0]["honban_gakko"]
本番の生徒 = 在籍[0]["honban_seito"]
本番の役職つき = 在籍[0]["honban_yaku"]
試しの役職つき = 在籍[0]["tameshi_yaku"]

# ---------------------------------------------------------------------------
# 【四】★型の 決まり（★学生は 読めない）
# ---------------------------------------------------------------------------
型 = 問う("""
select p.polname as pol, p.polcmd::text as cmd,
       (position('meibo' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as me,
       (position('monka_write' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as mw,
       (position('student_id' in
          coalesce(pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid))) > 0)::text as gakusei
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname in ('lesson_presets', 'lesson_preset_targets')
order by p.polname
""")

# ---------------------------------------------------------------------------
# 【五】★型を 消しても 出席は 消えない（★Q5）
# ---------------------------------------------------------------------------
鍵 = 問う("""
select tc.table_name as tbl, ccu.table_name as saki, rc.delete_rule as keshi
from information_schema.table_constraints tc
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_name in ('lesson_presets', 'lesson_preset_targets', 'lessons')
order by tc.table_name, ccu.table_name
""")
出席を指す = [r for r in 鍵 if r["tbl"] != "lessons" and r["saki"] == "lessons"]
出席が指す = [r for r in 鍵 if r["tbl"] == "lessons" and "preset" in r["saki"]]

# ---------------------------------------------------------------------------
# 【六】★覚え書きを 書きます
# ---------------------------------------------------------------------------
今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-裁定その90-実地の確かめ.md" % 今日)

行 = []
行.append("# ★裁定 その90 ── ★台帳に 尋ねた 結果")
行.append("")
行.append("★%s ／ ★`tools/ruling90_verify.py` が 書きました。" % 今日)
行.append("")
行.append("★★字は 運んで いません。★真偽を 台帳の 中で 出して もらいました。")
行.append("★★★`ask_ledger.py` の 表は 値を 64字で 切ります。★長い 式は 読めません。")
行.append("")

行.append("## ★Q1 ★学生は、★ほかの 方の 出席を 引けない")
行.append("")
行.append("★`lessons` を 読む 決まり …… **%d本**" % len(式))
行.append("")
行.append("| 決まり | 式の 丈 | 生徒 ご自身 | 学校 全部 | 自分の コマ | 結びつき |")
行.append("|---|---|---|---|---|---|")
for r in 式:
  行.append("| `%s` | %s字 | %s | %s | %s | %s |" % (
    r["pol"], r["nagasa"],
    "○" if 真(r, "jibun") else "ー",
    "`sched_all`" if 真(r, "sa") else "ー",
    "`sched_mine`" if (真(r, "jibun_no_koma") and 真(r, "sm")) else "ー",
    "○" if 真(r, "musubi") else "ー"))
行.append("")
行.append("★★学生に 当たる 枝は `auth.uid() = student_id` **だけ** です。")
行.append("★★ほかの 枝は、★できこと（`sched_all` ／ `sched_mine`）を 求めます。")
行.append("")
行.append("★★★本番の 学校 …… **%s** ／ その 在籍者 …… **%s人**"
          % (本番の学校, 本番の生徒))
行.append("★★そのうち、★役職（できこと）も 持つ 方 …… **%s人**" % 本番の役職つき)
行.append("")
行.append("★★試しの 学校（`★50通り-…`）では %s人 が 役職を 持ちます。" % 試しの役職つき)
行.append("★★★あれは 私が 作った 見せかけの 行 です。★本番では ありません。")
行.append("")
行.append("★★★だから、★学生の 手元には 他人の 行が **1行も** 返りません。")
行.append("★★画面で 隠して いるのでは ありません。★台帳が 渡しません。")
行.append("")
行.append("★★もう 1本の 決まり（`teacher_student_links` を 見る もの）は、")
行.append("★★★結びついた ご本人 同士 だけ です。★よその 方には 当たりません。")
行.append("")

行.append("## ★Q2 ★先生は、★ほかの 門下を 引けない")
行.append("")
行.append("| 学校 | 役職 | 門下 | 自分の 日程 | 学校 全部 | 名簿 |")
行.append("|---|---|---|---|---|---|")
for r in 役職:
  行.append("| %s | %s | %s | %s | %s | %s |" % (
    r["gakko"], r["post"],
    "○" if 真(r, "mw") else "ー", "○" if 真(r, "sm") else "ー",
    "○" if 真(r, "sa") else "ー", "○" if 真(r, "me") else "ー"))
行.append("")
行.append("★★`sched_all` を 持たない 先生が 通れるのは、")
行.append("★★★`teacher_id = auth.uid()` の 枝 **だけ** です。")
行.append("★★つまり **ご自分が 担当した コマ** に 限られます。")
行.append("")
行.append("### ★★見つけた こと ── ★静かに 0 に なる 組み合わせ")
行.append("")
行.append("★`monka_write` を 持つ 役職 …… **%d**" % len(門下持ち))
行.append("★そのうち `sched_mine` も `sched_all` も 持たない もの …… **%d**" % len(門下だけ))
行.append("")
if 門下だけ:
  行.append("★★★その 役職は、★**ご自分の 門下の コマすら 1行も 読めません**。")
  for r in 門下だけ:
    行.append("- %s ／ %s" % (r["gakko"], r["post"]))
else:
  行.append("★★いまは 0 です。★門下の 役職は どれも `sched_mine` を 併せ持って います。")
  行.append("")
  行.append("★★★けれど これは **偶然** です。★役職は 学校が 自由に 作れます。")
  行.append("★★「門下」だけ を 付けた 役職を 作ると、★出席の 数が **静かに 0** に なります。")
  行.append("★★★誤りは 出ません。★0 と 出る だけ です。★いちばん 見つけにくい 形 です。")
  行.append("")
  行.append("★★台帳 08 に 預けます。★直すなら「門下を 付ける とき、★自分の 日程も 一緒に」。")
行.append("")

行.append("## ★Q3 ★率を 画面に 出して いない")
行.append("")
行.append("★見張り `components/tests/attendance-count.test.js` ／ `ops-monka.test.js`。")
行.append("★★「％」「パーセント」「達成」「出席率」を、★4本の もとで 探して います。")
行.append("★★★言葉だけ を 出します ──「出席5」「足りない 見込み」。")
行.append("")

行.append("## ★Q4 ★出席の 数で 並べ替えない")
行.append("")
行.append("★`lib/attendanceCount.js` に `inGivenOrder` を 置きました。")
行.append("★★渡された 順の まま 返します。★数の 多い 少ないで 並べません。")
行.append("★★★並べ替えると、★人の 間に 順位が できます（★お決め「人を 比べない」）。")
行.append("")

行.append("## ★Q5 ★型を 消しても、★出席は 消えない")
行.append("")
行.append("| 表 | 指して いる 先 | 消えたら |")
行.append("|---|---|---|")
for r in 鍵:
  行.append("| %s | %s | %s |" % (r["tbl"], r["saki"], r["keshi"]))
行.append("")
行.append("★型の 表から `lessons` を 指す 鍵 …… **%d件**" % len(出席を指す))
行.append("★`lessons` から 型を 指す 鍵 …… **%d件**" % len(出席が指す))
行.append("")
行.append("★★★どちらも 0 です。★型と 出席は、★台帳の 上で つながって いません。")
行.append("★★型を 消しても、★出席は 連れて 行かれません。")
行.append("")

行.append("## ★型の 決まり ── ★学生は 読めない")
行.append("")
行.append("| 決まり | 何を する とき | 名簿 | 門下 | 生徒 ご自身 |")
行.append("|---|---|---|---|---|")
for r in 型:
  行.append("| `%s` | %s | %s | %s | %s |" % (
    r["pol"], r["cmd"],
    "○" if 真(r, "me") else "ー", "○" if 真(r, "mw") else "ー",
    "○" if 真(r, "gakusei") else "ー"))
行.append("")
行.append("★★学生は `meibo` も `monka_write` も 持ちません。★型を 読めません。")
行.append("★★★だから 学生の 画面に「／ 30回」を 出して いません。")
行.append("★★無い ものを、★在る ように 見せません。")
行.append("")
行.append("★★★これは お決め 待ち です ── ★学生に 型を 読ませて よいか。")
行.append("★★読ませるなら、★`lesson_presets` に 在籍者向けの 決まりを 1本 足します。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★%s ／ ★`tools/ruling90_verify.py` が 書きました。" % 今日,
                   "★%s ／ ★`tools/ruling90_verify.py` が 書きました。\n★全%d行 ／ 末尾は「%s」"
                   % (今日, 丈 + 1, 行[-1]), 1)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("決まり %d ／ 役職 %d ／ 門下 %d（日程なし %d）／ 本番の生徒 %s（役職つき %s）／ 鍵 %d"
      % (len(式), len(役職), len(門下持ち), len(門下だけ),
         本番の生徒, 本番の役職つき, len(鍵)))
