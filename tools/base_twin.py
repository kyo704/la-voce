#!/usr/bin/env python3
"""★★★本番と 新しい 試しの「形」を くらべます（★裁定175 条件4・検証）。

  ★ledger_inventory の twin は 関数 だけ を 見ます。
  ★★土台が 拾えて いるかを 見るには、★表・列・しばり・索引・引き金・
    ★行の 決まり・★権限（表・列・関数）も 見る 必要が あります。

  python3 tools/base_twin.py <試しの ref>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import q, HON

# ★★どれも「名前 → 中身」の 組に なる 形で 読みます。
Q = {
  "表": """select c.relname k, (c.relrowsecurity::text||'|'||c.relforcerowsecurity::text||'|'||c.relpersistence::text) v
     from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'""",
  "列": """select c.relname||'.'||a.attname k,
       format_type(a.atttypid,a.atttypmod)||'|'||a.attnotnull::text||'|'||coalesce(pg_get_expr(d.adbin,d.adrelid),'-')||'|'||a.attidentity::text||'|'||a.attgenerated::text v
     from pg_class c join pg_namespace n on n.oid=c.relnamespace
     join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
     left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
     where n.nspname='public' and c.relkind='r'""",
  "しばり": """select r.relname||'.'||c.conname k, pg_get_constraintdef(c.oid) v
     from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace
     where n.nspname='public'""",
  "索引": """select i.relname k, pg_get_indexdef(x.indexrelid) v
     from pg_index x join pg_class i on i.oid=x.indexrelid join pg_class c on c.oid=x.indrelid
     join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'""",
  "関数": """select p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' k,
       md5(pg_get_functiondef(p.oid))||'|'||p.prosecdef::text v
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')""",
  "引き金": """select c.relname||'.'||g.tgname k, pg_get_triggerdef(g.oid) v
     from pg_trigger g join pg_class c on c.oid=g.tgrelid join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and not g.tgisinternal""",
  "決まり": """select tablename||'.'||policyname k,
       cmd||'|'||permissive||'|'||roles::text||'|'||md5(coalesce(qual,'')||'#'||coalesce(with_check,'')) v
     from pg_policies where schemaname='public'""",
  "表の権限": """select c.relname||' → '||coalesce(nullif(a.grantee::regrole::text,'-'),'public') k,
       string_agg(a.privilege_type,',' order by a.privilege_type) v
     from pg_class c join pg_namespace n on n.oid=c.relnamespace, aclexplode(c.relacl) a
     where n.nspname='public' and c.relkind in ('r','S') group by 1""",
  "列の権限": """select c.relname||'.'||a.attname||' → '||coalesce(nullif(x.grantee::regrole::text,'-'),'public') k,
       string_agg(x.privilege_type,',' order by x.privilege_type) v
     from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace,
       aclexplode(a.attacl) x where n.nspname='public' and a.attacl is not null group by 1""",
  "関数の権限": """select p.proname||'('||pg_get_function_identity_arguments(p.oid)||') → '||coalesce(nullif(a.grantee::regrole::text,'-'),'public') k,
       string_agg(a.privilege_type,',' order by a.privilege_type) v
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace, aclexplode(p.proacl) a
     where n.nspname='public' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e') group by 1""",
  "既定の権限": """select pg_get_userbyid(d.defaclrole)||'/'||d.defaclobjtype::text k, d.defaclacl::text v
     from pg_default_acl d where d.defaclnamespace='public'::regnamespace""",
  "外の引き金": """select n.nspname||'.'||c.relname||'.'||g.tgname k, pg_get_triggerdef(g.oid) v
     from pg_trigger g join pg_class c on c.oid=g.tgrelid join pg_namespace n on n.oid=c.relnamespace
     join pg_proc p on p.oid=g.tgfoid join pg_namespace pn on pn.oid=p.pronamespace
     where not g.tgisinternal and pn.nspname='public' and n.nspname <> 'public'""",
  "拡張": "select extname k, extnamespace::regnamespace::text v from pg_extension",
  "註": """select c.relname||coalesce('.'||a.attname,'') k, d.description v from pg_description d
     join pg_class c on c.oid=d.objoid join pg_namespace n on n.oid=c.relnamespace
     left join pg_attribute a on a.attrelid=c.oid and a.attnum=d.objsubid and d.objsubid>0
     where n.nspname='public' and c.relkind='r'""",
}


def 読む(ref):
  out = {}
  for 名, sql in Q.items():
    out[名] = {r["k"]: r["v"] for r in q(ref, sql)}
  return out


def main():
  if len(sys.argv) < 2:
    print(__doc__); return 2
  試 = sys.argv[1]
  本 = 読む(HON); 験 = 読む(試)
  計 = 0
  for 名 in Q:
    p, t = 本[名], 験[名]
    差 = []
    for k in sorted(set(p) | set(t)):
      if k not in t: 差.append(("本番にだけ", k, p[k]))
      elif k not in p: 差.append(("試しにだけ", k, t[k]))
      elif p[k] != t[k]: 差.append(("中身が ちがう", k, "本番=%s / 試し=%s" % (p[k], t[k])))
    計 += len(差)
    print("★%-10s 本番 %4d ／ 試し %4d ── 差 %d" % (名, len(p), len(t), len(差)))
    for 種, k, v in 差[:40]:
      print("    [%s] %s  %s" % (種, k, str(v)[:170]))
    if len(差) > 40:
      print("    … ほか %d 件" % (len(差) - 40))
  print("\n★★★差 …… 合計 %d 件" % 計)
  return 0 if 計 == 0 else 1


if __name__ == "__main__":
  sys.exit(main())
