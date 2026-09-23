#!/usr/bin/env python3
"""★★★土台を 書き出します（★裁定175 ㋐・2026-09-23）。

  ★★わけ ── ★本番の 移行の 記録は 2026-09-14 から 始まって います。
    ★それより 前の 台帳は、★画面（SQL Editor）から 手で 作られました。
    ★★だから、★移行を 頭から 当てても **104表 中 94表が ありません**。
    ★★★この 道具は、★**いま 本番に ある 形**を 読んで、★1本目の 移行に します。

  ★★★中身（行）は 読みません。★**形 だけ** です。
    ★読むのは 目録（pg_catalog）だけ。★利用者の 記録には 触りません。

  ★★入れる もの（裁定175 条件1）
    拡張 ／ 連番 ／ 表と 列 ／ しばり ／ 索引 ／ 関数 ／ 引き金 ／
    行の 決まり（RLS）／ ★権限（GRANT）／ ★既定の 権限 ／ 註

  ★使い方
    python3 tools/schema_dump.py            ★書き出します（supabase/migrations/ へ）
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import q, HON

DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "migrations")
# ★2026-09-14 より 前の 番 を 使います。★頭に 来ます。
BAN = "20260101"

# ★拡張が 持って いる ものは 書きません（pg_trgm の 関数・索引の 型 など）。
NO_EXT = "not exists (select 1 from pg_depend d where d.objid = %s.oid and d.deptype = 'e')"


def 出す(番, 名, 本文):
  p = os.path.join(DIR, "%s%s_base_%s.sql" % (BAN, 番, 名))
  open(p, "w", encoding="utf-8").write(本文)
  print("  %-58s %6d 字" % (os.path.basename(p), len(本文)))
  return p


def 頭(題):
  return ("-- ★★★土台 ── %s\n"
          "-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。\n"
          "-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。\n\n" % 題)


# ────────────────────────────────────────────────────── 一 拡張・既定の 権限
def 一_拡張():
  s = 頭("拡張と 既定の 権限")
  s += "-- ★★★1 拡張\n"
  for r in q(HON, """select e.extname, n.nspname from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace
      where e.extname not in ('plpgsql') order by 1"""):
    s += 'create extension if not exists "%s" with schema %s;\n' % (r["extname"], r["nspname"])
  s += "\n-- ★★★2 スキーマの 権限\n"
  for r in q(HON, """select coalesce(nullif(a.grantee::regrole::text,'-'),'public') g, a.privilege_type p
      from pg_namespace n, aclexplode(n.nspacl) a where n.nspname='public' order by 1,2"""):
    s += "grant %s on schema public to %s;\n" % (r["p"].lower(), r["g"])
  s += ("\n-- ★★★3 これから 作る ものの 既定の 権限\n"
        "--   ★★anon が 入って いません。★本番で 外されて います。\n"
        "--   ★★新しい 入れ物の 出来たては anon が **入って います**。★ここで 外します。\n"
        "--   ★★supabase_admin の ぶんは 書きません。★postgres からは 変えられません（★元から 同じ）。\n"
        "--   ★★★ここが 抜けると、★あとの 47本が 作る 表に anon が 付いて しまいます。\n")
  種 = {"r": "tables", "S": "sequences", "f": "functions"}
  for r in q(HON, """select pg_get_userbyid(d.defaclrole) r, d.defaclobjtype t, d.defaclacl::text acl
      from pg_default_acl d where d.defaclnamespace = 'public'::regnamespace
       and pg_get_userbyid(d.defaclrole) = 'postgres' order by 2"""):
    if r["t"] not in 種:
      continue
    もの = 種[r["t"]]
    有 = set(re.findall(r"(\w+)=[\w*]*/", r["acl"]))
    s += "alter default privileges for role %s in schema public revoke all on %s from anon;\n" % (r["r"], もの)
    for g in sorted(有):
      s += "alter default privileges for role %s in schema public grant all on %s to %s;\n" % (r["r"], もの, g)
  return s


# ────────────────────────────────────────────────────── 二 表
TYPE_Q = """
select c.relname t, c.relrowsecurity rls, c.relforcerowsecurity frls, c.relpersistence per,
       a.attnum, a.attname col, format_type(a.atttypid, a.atttypmod) typ,
       a.attnotnull nn, a.attidentity ident, a.attgenerated gen,
       pg_get_expr(d.adbin, d.adrelid) def,
       case when a.attcollation <> 0 and a.attcollation <> tt.typcollation
            then (select cl.collname from pg_collation cl where cl.oid = a.attcollation) end coll
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  join pg_type tt on tt.oid = a.atttypid
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relname, a.attnum
"""


def 二_表():
  行 = q(HON, TYPE_Q)
  表 = {}
  for r in 行:
    表.setdefault(r["t"], []).append(r)
  # ★連番 ── 列の 既定が nextval を 呼ぶ もの は、★先に 作ります。
  s = 頭("表と 列")
  連 = q(HON, "select sequencename, data_type from pg_sequences where schemaname='public' order by 1")
  if 連:
    s += "-- ★★★連番\n"
    for r in 連:
      s += "create sequence if not exists public.%s as %s;\n" % (r["sequencename"], r["data_type"])
    s += "\n"
  s += "-- ★★★表（★しばりは 次の 本で 付けます。★表どうしの 順番に 縛られない ため）\n\n"
  for t in sorted(表):
    列 = 表[t]
    頭行 = 列[0]
    仮 = "unlogged " if 頭行["per"] == "u" else ""
    s += "create %stable if not exists public.%s (\n" % (仮, t)
    行文 = []
    for c in 列:
      x = "  %s %s" % (c["col"], c["typ"])
      if c["coll"]:
        x += ' collate "%s"' % c["coll"]
      if c["gen"] == "s":
        x += " generated always as (%s) stored" % c["def"]
      elif c["ident"] in ("a", "d"):
        x += " generated %s as identity" % ("always" if c["ident"] == "a" else "by default")
      elif c["def"] is not None:
        x += " default %s" % c["def"]
      if c["nn"]:
        x += " not null"
      行文.append(x)
    s += ",\n".join(行文) + "\n);\n"
    # ★あとから 列が 増えた ときも 追いつく 形（何度 流しても 同じ）
    for c in 列:
      s += "alter table public.%s add column if not exists %s %s;\n" % (t, c["col"], c["typ"])
    s += "\n"
  # ★連番の 持ち主
  持 = q(HON, """select s.relname sq, c.relname t, a.attname col
     from pg_class s join pg_depend d on d.objid = s.oid and d.classid = 'pg_class'::regclass
     join pg_class c on c.oid = d.refobjid join pg_attribute a on a.attrelid = c.oid and a.attnum = d.refobjsubid
     join pg_namespace n on n.oid = s.relnamespace
     where s.relkind = 'S' and n.nspname = 'public' and d.deptype in ('a','i')""")
  if 持:
    s += "-- ★★★連番の 持ち主\n"
    for r in 持:
      s += "alter sequence public.%s owned by public.%s.%s;\n" % (r["sq"], r["t"], r["col"])
  return s


# ────────────────────────────────────────────────────── 三 しばり
def 三_しばり():
  s = 頭("しばり（主キー・一意・検査・外部キー）")
  s += "-- ★★★順は p → u → c → f。★外部キーは 相手の 主キーが 要ります。\n\n"
  for 種 in ("p", "u", "c", "f"):
    行 = q(HON, """select r.relname t, c.conname nm, pg_get_constraintdef(c.oid) d
        from pg_constraint c join pg_class r on r.oid = c.conrelid
        join pg_namespace n on n.oid = r.relnamespace
        where n.nspname = 'public' and c.contype = '%s'
          and not exists (select 1 from pg_depend dd where dd.objid = c.oid and dd.deptype = 'e')
        order by r.relname, c.conname""" % 種)
    s += "-- ★%s（%d）\n" % ({"p": "主キー", "u": "一意", "c": "検査", "f": "外部キー"}[種], len(行))
    for r in 行:
      s += ("do $$ begin\n"
            "  if not exists (select 1 from pg_constraint where conname = '%s' and conrelid = 'public.%s'::regclass) then\n"
            "    alter table public.%s add constraint %s %s;\n"
            "  end if;\nend $$;\n" % (r["nm"], r["t"], r["t"], r["nm"], r["d"]))
    s += "\n"
  return s


# ────────────────────────────────────────────────────── 四 索引
def 四_索引():
  行 = q(HON, """select c.relname t, i.relname nm, pg_get_indexdef(x.indexrelid) d
     from pg_index x join pg_class i on i.oid = x.indexrelid join pg_class c on c.oid = x.indrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and not exists (select 1 from pg_constraint k where k.conindid = x.indexrelid)
       and not exists (select 1 from pg_depend d where d.objid = i.oid and d.deptype = 'e')
     order by c.relname, i.relname""")
  s = 頭("索引（しばりが 作る ものは 除く）")
  s += "-- ★%d 本\n\n" % len(行)
  for r in 行:
    d = re.sub(r"^CREATE (UNIQUE )?INDEX ", lambda m: "create %sindex if not exists " % (m.group(1) or "").lower(),
               r["d"])
    s += d + ";\n"
  return s


# ────────────────────────────────────────────────────── 五 関数
def 五_関数(分=3):
  行 = q(HON, """select p.proname nm, pg_get_function_identity_arguments(p.oid) args, pg_get_functiondef(p.oid) d
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind in ('f','p')
       and not exists (select 1 from pg_depend dd where dd.objid = p.oid and dd.deptype = 'e')
     order by p.proname, p.oid""")
  出力 = []
  塊 = (len(行) + 分 - 1) // 分
  for i in range(分):
    part = 行[i * 塊:(i + 1) * 塊]
    if not part:
      continue
    s = 頭("関数 %d／%d（%d 本）" % (i + 1, 分, len(part)))
    s += "-- ★`create or replace` なので、★何度 流しても 同じ です。\n"
    s += "set local check_function_bodies = off;\n\n"
    for r in part:
      d = r["d"].rstrip()
      if not d.endswith(";"):
        d += ";"
      d = re.sub(r"^CREATE OR REPLACE (FUNCTION|PROCEDURE)", r"create or replace \1", d)
      d = re.sub(r"^CREATE (FUNCTION|PROCEDURE)", r"create or replace \1", d)
      s += d + "\n\n"
    出力.append(s)
  return 出力


# ────────────────────────────────────────────────────── 六 引き金
def 六_引き金():
  # ★★★`public` の 外に ある 引き金も、★中身が `public` の 関数 なら 私たちの もの です。
  #   ★★2026-09-23 …… ★`auth.users` の `on_auth_user_created` を 落として いました。
  #     ★★落とすと、★人を 作っても `profiles` の 行が できません。
  #     ★★★種まきが `MINOR_TEACHER_LINK_BLOCKED` で 止まって、★やっと 分かりました。
  #       ★目録の くらべ（public だけ を 見る）では **見えません** でした。
  行 = q(HON, """select n.nspname sch, c.relname t, g.tgname nm, pg_get_triggerdef(g.oid) d
     from pg_trigger g join pg_class c on c.oid = g.tgrelid
     join pg_namespace n on n.oid = c.relnamespace
     join pg_proc p on p.oid = g.tgfoid join pg_namespace pn on pn.oid = p.pronamespace
     where not g.tgisinternal and pn.nspname = 'public'
       and not exists (select 1 from pg_depend dd where dd.objid = g.oid and dd.deptype = 'e')
     order by n.nspname, c.relname, g.tgname""")
  s = 頭("引き金")
  外 = [r for r in 行 if r["sch"] != "public"]
  s += "-- ★%d 本（★うち public の 外 …… %d 本）\n" % (len(行), len(外))
  if 外:
    s += ("-- ★★public の 外に 置く 引き金 ── ★中身は `public` の 関数 です。★私たちの もの です。\n"
          "--   ★★`auth` や `storage` の **中身**（行）は 入れません。★引き金 だけ です。\n")
  s += "\n"
  for r in 行:
    s += "drop trigger if exists %s on %s.%s;\n%s;\n\n" % (r["nm"], r["sch"], r["t"], r["d"])
  return s


def 七_決まり():
  rls = q(HON, """select c.relname t, c.relrowsecurity r, c.relforcerowsecurity f
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname='public' and c.relkind='r' order by 1""")
  pol = q(HON, """select tablename t, policyname nm, permissive perm, roles::text roles, cmd, qual, with_check
     from pg_policies where schemaname='public' order by tablename, policyname""")
  s = 頭("行の 決まり（RLS）と ポリシー")
  s += "-- ★行の 決まりを 入れる 表 …… %d／%d\n" % (sum(1 for x in rls if x["r"]), len(rls))
  s += "-- ★ポリシー …… %d\n\n" % len(pol)
  for r in rls:
    s += "alter table public.%s %s row level security;\n" % (r["t"], "enable" if r["r"] else "disable")
    if r["f"]:
      s += "alter table public.%s force row level security;\n" % r["t"]
  s += "\n"
  for r in pol:
    役 = ", ".join(x.strip() for x in r["roles"].strip("{}").split(",") if x.strip())
    s += 'drop policy if exists "%s" on public.%s;\n' % (r["nm"], r["t"])
    s += 'create policy "%s" on public.%s as %s for %s to %s' % (
      r["nm"], r["t"], "permissive" if r["perm"] == "PERMISSIVE" else "restrictive", r["cmd"].lower(), 役)
    if r["qual"] is not None:
      s += "\n  using (%s)" % r["qual"]
    if r["with_check"] is not None:
      s += "\n  with check (%s)" % r["with_check"]
    s += ";\n\n"
  return s


# ────────────────────────────────────────────────────── 八 権限
PRIV = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]
AITE = ["anon", "authenticated", "service_role", "postgres"]


def 八_権限():
  s = 頭("権限（GRANT）")
  s += ("-- ★★★取り上げてから 与えます（台帳 …… 列ごとの GRANT は、★表ごとの GRANT に 負けます）。\n"
        "-- ★★ここが 抜けると、★いま 直して いる 穴が 試しで 再び 起きません。\n\n")
  # ★表
  tg = q(HON, """select c.relname t, coalesce(nullif(a.grantee::regrole::text,'-'),'public') g,
        a.privilege_type p
     from pg_class c join pg_namespace n on n.oid = c.relnamespace, aclexplode(c.relacl) a
     where n.nspname='public' and c.relkind in ('r','S') order by 1,2,3""")
  表 = {}
  for r in tg:
    表.setdefault(r["t"], {}).setdefault(r["g"], []).append(r["p"])
  すべての表 = [x["relname"] for x in q(HON,
    "select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','S') order by 1")]
  s += "-- ★★★1 表と 連番\n"
  for t in すべての表:
    s += "revoke all on public.%s from %s;\n" % (t, ", ".join(AITE))
    for g in sorted(表.get(t, {})):
      s += "grant %s on public.%s to %s;\n" % (", ".join(sorted(set(表[t][g]))).lower(), t, g)
  # ★列
  cg = q(HON, """select c.relname t, coalesce(nullif(x.grantee::regrole::text,'-'),'public') g,
        x.privilege_type p, a.attname col
     from pg_attribute a join pg_class c on c.oid = a.attrelid
     join pg_namespace n on n.oid = c.relnamespace, aclexplode(a.attacl) x
     where n.nspname='public' and a.attacl is not null order by 1,2,3,4""")
  列 = {}
  for r in cg:
    列.setdefault((r["t"], r["g"], r["p"]), []).append(r["col"])
  s += "\n-- ★★★2 列ごと（%d 組）\n" % len(列)
  for (t, g, p), cols in sorted(列.items()):
    s += "grant %s (%s) on public.%s to %s;\n" % (p.lower(), ", ".join(sorted(cols)), t, g)
  # ★関数
  fg = q(HON, """select p.proname nm, pg_get_function_identity_arguments(p.oid) args,
        coalesce(nullif(a.grantee::regrole::text,'-'),'public') g
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace, aclexplode(p.proacl) a
     where n.nspname='public' and a.privilege_type = 'EXECUTE'
       and not exists (select 1 from pg_depend dd where dd.objid = p.oid and dd.deptype='e')
     order by 1,2,3""")
  関 = {}
  for r in fg:
    関.setdefault("public.%s(%s)" % (r["nm"], r["args"]), []).append(r["g"])
  s += "\n-- ★★★3 関数（%d 本）\n" % len(関)
  for k in sorted(関):
    s += "revoke all on function %s from public, %s;\n" % (k, ", ".join(AITE))
    s += "grant execute on function %s to %s;\n" % (k, ", ".join(sorted(set(関[k]))))
  return s


# ────────────────────────────────────────────────────── 九 註
def 九_註():
  s = 頭("註（comment on）")
  n = 0
  for r in q(HON, """select c.relname t, d.description x from pg_description d
      join pg_class c on c.oid = d.objoid join pg_namespace n on n.oid = c.relnamespace
      where n.nspname='public' and d.objsubid = 0 and c.relkind='r' order by 1"""):
    s += "comment on table public.%s is %s;\n" % (r["t"], 引(r["x"])); n += 1
  for r in q(HON, """select c.relname t, a.attname col, d.description x from pg_description d
      join pg_class c on c.oid = d.objoid join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum = d.objsubid
      where n.nspname='public' and d.objsubid > 0 order by 1,2"""):
    s += "comment on column public.%s.%s is %s;\n" % (r["t"], r["col"], 引(r["x"])); n += 1
  for r in q(HON, """select p.proname nm, pg_get_function_identity_arguments(p.oid) args, d.description x
      from pg_description d join pg_proc p on p.oid = d.objoid
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and not exists (select 1 from pg_depend dd where dd.objid=p.oid and dd.deptype='e')
      order by 1,2"""):
    s += "comment on function public.%s(%s) is %s;\n" % (r["nm"], r["args"], 引(r["x"])); n += 1
  print("  ★註 …… %d" % n)
  return s


def 引(x):
  return "'" + x.replace("'", "''") + "'"


def main():
  print("★本番の 形を 読みます（★読むだけ）……")
  出す("000001", "01_extensions", 一_拡張())
  出す("000002", "02_tables", 二_表())
  出す("000003", "03_constraints", 三_しばり())
  出す("000004", "04_indexes", 四_索引())
  for i, s in enumerate(五_関数()):
    出す("0000%02d" % (5 + i), "0%d_functions_%d" % (5 + i, i + 1), s)
  出す("000008", "08_triggers", 六_引き金())
  出す("000009", "09_rls", 七_決まり())
  出す("000010", "10_grants", 八_権限())
  出す("000011", "11_comments", 九_註())
  return 0


if __name__ == "__main__":
  sys.exit(main())
