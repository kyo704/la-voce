#!/usr/bin/env python3
"""★当てる 前に、★その SQL が **すでに 在る もの** に 頼って いないかを 数えます。

  ★★★出どころ 2026-09-26 ── ★`sql/107` を 当てた 直後、★掃除が **7つ とも** 落ちました。
    ★`case … then public.sweep_referrals() … end` は ★1つの 式 です。
    ★★式の 中に 無い 関数が 1つ あると、★どの 枝でも 組み立てに 失敗します。
    ★★★`begin … exception` は 仕事ごとに ありました。★それでも 全部 落ちました。
      ★★だから「例外で 拾って いるから 大丈夫」は ★当たりません。

  ★★見る もの ── ★その SQL が 呼ぶ `public.○○(` の うち、
    ★★その SQL 自身が 作って いない もの。★それが 台帳に 在るかを 問います。

  ★使い方
    python3 tools/sql_deps_check.py supabase/opus/20260926_107_retention_missing.sql
    python3 tools/sql_deps_check.py --all supabase/opus
"""
import io, os, re, sys, subprocess, json, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def strip(sql):
  sql = re.sub(r"/\*[\s\S]*?\*/", " ", sql)
  return re.sub(r"(?m)--[^\n]*$", " ", sql)


def tsukuru(s):
  out = set()
  for m in re.finditer(r"create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)", s, re.I):
    out.add(m.group(1).lower())
  for m in re.finditer(r"create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)", s, re.I):
    out.add(m.group(1).lower())
  return out


def yobu(s):
  out = set()
  for m in re.finditer(r"public\.(\w+)\s*\(", s):
    n = m.group(1).lower()
    if n in YOGO or TSUKAU.match(n): continue
    out.add(n)
  return out


# ★★★数えない 名（★2026-09-26 の 較正で 出た 偽の 当たり）──
#   ★SQL の 語（and／date／select …）／★役（anon・authenticated）／
#   ★もとから ある 道具（jsonb_… ／ to_… ／ coalesce …）／★別名（slots など）。
#   ★★これらを 数えると、★どの SQL も NG に なります ── ★見張りが 意味を 失います。
YOGO = set("""
select from join update insert into values table only lateral where and or not null
true false case when then else end as on using set default check constraint exists
distinct order by limit offset group having union all with returning conflict do
nothing cascade restrict add drop alter create replace function returns language
security definer stable volatile immutable trigger before after each row execute
begin declare loop foreach array if elsif raise exception perform return next
date interval now text integer boolean uuid jsonb timestamp timestamptz numeric
smallint bigint anon authenticated public postgres service_role
""".split())
# ★もとから ある 道具（★`public.` が 付かない もの）。
TSUKAU = re.compile(r"^(jsonb_|json_|to_|array_|string_|regexp_|extract|coalesce|greatest"
                    r"|least|count|max|min|sum|avg|now|upper|lower|btrim|left|right"
                    r"|length|char_length|octet_length|encode|digest|gen_random|md5)")


def hyou(s):
  out = set()
  for m in re.finditer(r"(?:from|join|update|insert\s+into)\s+(?:public\.)?(\w+)", s, re.I):
    n = m.group(1).lower()
    if n in YOGO or TSUKAU.match(n): continue
    out.add(n)
  return out


def aru(names):
  """★本番の 台帳に 在る 関数・表の 名を 返します。"""
  if not names: return set()
  q = ("select proname as n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace "
       "where ns.nspname='public' union select table_name from information_schema.tables "
       "where table_schema='public'")
  out = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "ask_ledger.py"), q],
                       capture_output=True, text=True, cwd=ROOT).stdout
  return set(x.strip().lower() for x in out.split("\n") if x.strip() and "★" not in x and "|" not in x and "-" not in x)


def main():
  引 = [a for a in sys.argv[1:] if not a.startswith("--")]
  files = []
  if "--all" in sys.argv:
    files = sorted(glob.glob(os.path.join(引[0] if 引 else "supabase/opus", "*.sql")))
  else:
    files = 引
  在る = aru({"x"})
  print("SQL_DEPS  ★台帳に 在る 名 …… %d" % len(在る))
  悪 = 0
  for f in files:
    s = strip(io.open(f, encoding="utf-8", errors="replace").read())
    自 = tsukuru(s)
    要 = (yobu(s) | hyou(s)) - 自
    無 = sorted(x for x in 要 if x not in 在る)
    印 = "OK " if not 無 else "NG "
    if 無: 悪 += 1
    print("  %s%-46s 頼る %2d ／ ★無い %d %s"
          % (印, os.path.basename(f), len(要), len(無), ("── " + "／".join(無)) if 無 else ""))
  print("RESULT: %s" % ("OK" if not 悪 else "NG（%d 本）" % 悪))
  return 1 if 悪 else 0


if __name__ == "__main__":
  sys.exit(main())
