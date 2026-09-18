# -*- coding: utf-8 -*-
"""★裁定 その86 の 確かめ（★台帳の 門を できこと に 揃えた こと）

  ★★この 1本が 台帳に 尋ね、★その 答えで 覚え書きを 書きます。
    ★★手で 書いた 文と、★道具の 数を 並べません。

  ★★★較正つきで 尋ねます。★通る はず・通らない はず を 両方 見ます。
    ★★片方 だけ 見ると、★いつも True を 返す 壊れた 門でも 通ります。
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


学校 = "'★はじめの1人テスト（消してよい）'"
共通 = """
with koma as (
  select l.org_id, l.student_id, l.teacher_id from public.lessons l
  join public.organizations o on o.id = l.org_id
  where o.name = %s limit 1
), nushi as (
  select m.user_id from public.memberships m
  join public.organizations o on o.id = m.org_id
  where o.name = %s limit 1
), yoso as (
  select u.id from auth.users u
  where u.id not in (select user_id from public.memberships m where m.org_id = (select org_id from koma))
    and u.id not in (select student_id from public.enrollments e where e.org_id = (select org_id from koma))
  limit 1
)
""" % (学校, 学校)

較正 = 問う(共通 + """
select
  public.can_view_ops((select user_id from nushi), (select org_id from koma), (select student_id from koma))::text as a_furui,
  public.can_view_ops_perm((select user_id from nushi), (select org_id from koma), (select student_id from koma), 'sched_all')::text as b_motsu,
  public.can_view_ops_perm((select user_id from nushi), (select org_id from koma), (select student_id from koma), 'sched_mine')::text as c_motanai,
  public.can_view_ops_perm((select id from yoso), (select org_id from koma), (select student_id from koma), 'sched_all')::text as d_yoso,
  (select count(*) from public.assignments a where a.org_id = (select org_id from koma)
     and a.teacher_id = (select user_id from nushi) and a.ended_at is null)::text as ukemochi
""")[0]

# ★★★較正 ── ★答えの 分かって いる 4つ。★1つでも ちがえば 書かずに 止まります。
期待 = {"a_furui": "True", "b_motsu": "True", "c_motanai": "False", "d_yoso": "False"}
# ★★`::text` は 小文字で 返します（★"true"／"false"）。★大小を そろえます。
ちがい = {k: (較正[k], v) for k, v in 期待.items()
        if str(較正[k]).lower() != v.lower()}
if ちがい:
  raise SystemExit("★止まりました ── 較正が 合いません: " + str(ちがい))

決まり = 問う("""
select c.relname as tbl, p.polname as pol, p.polcmd::text as cmd
from pg_policy p join pg_class c on c.oid = p.polrelid
where pg_get_expr(p.polqual, p.polrelid) like '%can_view_ops_perm%'
   or pg_get_expr(p.polwithcheck, p.polrelid) like '%can_view_ops_perm%'
order by c.relname, p.polname
""")
のこり = 問う("""
select c.relname as tbl, p.polname as pol
from pg_policy p join pg_class c on c.oid = p.polrelid
where pg_get_expr(p.polqual, p.polrelid) like '%can_view_ops(%'
   or pg_get_expr(p.polwithcheck, p.polrelid) like '%can_view_ops(%'
""")

役職 = 問う("""
select o.name as gakko, p.name as post, m.role as yaku,
       (p.perms ? 'sched_all')::text  as sa,
       (p.perms ? 'sched_mine')::text as sm,
       (select count(*) from public.lessons l where l.org_id = m.org_id)::text as koma,
       (select count(*) from public.lessons l
          where l.org_id = m.org_id
            and ( public.can_view_ops_perm(m.user_id, l.org_id, l.student_id, 'sched_all')
                  or (l.teacher_id = m.user_id
                      and public.can_view_ops_perm(m.user_id, l.org_id, l.student_id, 'sched_mine')) )
       )::text as mieru,
       (select count(*) from public.assignments a
          where a.org_id = m.org_id and a.teacher_id = m.user_id and a.ended_at is null)::text as uke
from public.memberships m
join public.org_posts p on p.id = m.post_id
join public.organizations o on o.id = m.org_id
where (select count(*) from public.lessons l where l.org_id = m.org_id) > 0
order by o.name, p.name
""")

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-裁定その86-台帳の門の確かめ.md" % 今日)

行 = []
行.append("# ★台帳の 門を できこと に 揃えました ── ★確かめ")
行.append("")
行.append("★裁定 その86 ／ ★%s ／ ★`tools/ruling86_verify.py` が 書きました。" % 今日)
行.append("")
行.append("## ★較正（★答えの 分かって いる 4つ）")
行.append("")
行.append("★1つでも ちがえば、★この 道具は 覚え書きを 書かずに 止まります。")
行.append("")
行.append("| 尋ねた こと | 答え | 期待 |")
行.append("|---|---|---|")
行.append("| ★古い 門（役割の 名で 通る） | %s | True |" % 較正["a_furui"])
行.append("| ★新しい 門・持って いる できこと（sched_all） | %s | True |" % 較正["b_motsu"])
行.append("| ★新しい 門・持って いない できこと（sched_mine） | %s | False |" % 較正["c_motanai"])
行.append("| ★新しい 門・よその 方 | %s | False |" % 較正["d_yoso"])
行.append("")
行.append("★★★この 4つが 言って いる こと ──")
行.append("")
行.append("★① 学長（owner）は、★受け持ちが **%s件** です。" % 較正["ukemochi"])
行.append("★★それでも `sched_all` で 通ります。★受け持ちが 通した のでは ありません。")
行.append("★★★これが VERIFY ① の 中身 です ──「できことが あれば、★受け持ち 0 でも 出る」。")
行.append("")
行.append("★② 同じ 学長が、★**持って いない** できこと では 通りません。")
行.append("★★owner という 役割は、★もう 門を 開けません。")
行.append("")
行.append("## ★決まり（RLS）")
行.append("")
行.append("| 表 | 決まり | いつ |")
行.append("|---|---|---|")
for r in 決まり:
  行.append("| %s | %s | %s |" % (r["tbl"], r["pol"], r["cmd"]))
行.append("")
行.append("★古い 門（`can_view_ops`）を 呼んで いる 決まり …… **%d件**" % len(のこり))
行.append("")
行.append("## ★役職ごとに、★何行 見えるか（★コマの ある 学校 だけ）")
行.append("")
行.append("| 学校 | 役職 | 役割 | sched_all | sched_mine | 学校のコマ | 見えるコマ | 受け持ち |")
行.append("|---|---|---|---|---|---|---|---|")
for r in 役職:
  行.append("| %s | %s | %s | %s | %s | %s | %s | %s |"
            % (r["gakko"], r["post"], r["yaku"], r["sa"], r["sm"], r["koma"], r["mieru"], r["uke"]))
行.append("")
行.append("## ★確かめて いない こと")
行.append("")
行.append("★① 事務（staff）＋ `sched_all` ＋ 受け持ち 0 の **実際の 行**。")
行.append("★★その 役職の 学校に、★コマが 1つも ありません。")
行.append("★★本番に 仮の コマを 書きません（★台帳㊶）。★門を 直に 呼んで 確かめて います。")
行.append("")
行.append("★② `sched_mine` だけ の 先生の 実際の 行。★同じく コマが ありません。")
行.append("★★決まりの 式に `teacher_id = auth.uid()` が 入って いる ことは、")
行.append("★★`components/tests/can-view-ops-perm.test.js` が 数えて います。")

本文 = "\n".join(行) + "\n"
本文 = 本文.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
本文 = 本文.replace("{丈}", str(len(本文.splitlines())))
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("較正 4/4 ／ 決まり %d ／ 古い門の のこり %d" % (len(決まり), len(のこり)))
