#!/usr/bin/env python3
"""★★★条件4 ── ★記録の 外で 当てた ぶんが 土台に 入って いるか（★裁定175）。

  ★★手で 名を 並べません。★9/14 以降の 47本の 移行**から** 名を 取り出し、
    ★新しい 入れ物に あるかを 1つずつ 見ます。
  ★★★私が 名を 思い出して 書くと、★間違えた ときに「抜け」に 見えます（2026-09-23 に 4件）。
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import q

D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "migrations")


def 落とす(s):
  s = "\n".join(re.sub(r"--.*$", "", l) for l in s.split("\n"))
  return re.sub(r"/\*.*?\*/", " ", s, flags=re.S)


def main():
  ref = sys.argv[1]
  表, 関, 決, 引 = set(), set(), set(), set()
  本 = sorted(x for x in os.listdir(D) if x.endswith(".sql") and not x.startswith("20260101"))
  for x in 本:
    s = 落とす(open(os.path.join(D, x), encoding="utf-8").read())
    表 |= {m.lower() for m in re.findall(r"create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_0-9]+)", s, re.I)}
    関 |= {m.lower() for m in re.findall(r"create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_0-9]+)", s, re.I)}
    決 |= {m for m in re.findall(r'create\s+policy\s+"?([^"\n]+?)"?\s+on\s', s, re.I)}
    引 |= {m.lower() for m in re.findall(r"create\s+trigger\s+([a-z_0-9]+)", s, re.I)}
  # ★消された ものは 除きます（★あとの 移行で drop されて いれば、★本番にも ありません）
  消表, 消関, 消決 = set(), set(), set()
  for x in 本:
    s = 落とす(open(os.path.join(D, x), encoding="utf-8").read())
    消表 |= {m.lower() for m in re.findall(r"drop\s+table\s+(?:if\s+exists\s+)?(?:public\.)?([a-z_0-9]+)", s, re.I)}
    消関 |= {m.lower() for m in re.findall(r"drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-z_0-9]+)", s, re.I)}
    消決 |= {m for m in re.findall(r'drop\s+policy\s+(?:if\s+exists\s+)?"?([^"\n]+?)"?\s+on\s', s, re.I)}
  あ表 = {r["n"] for r in q(ref, "select table_name n from information_schema.tables where table_schema='public'")}
  あ関 = {r["n"] for r in q(ref, "select proname n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public'")}
  あ決 = {r["n"] for r in q(ref, "select policyname n from pg_policies where schemaname='public'")}
  あ引 = {r["n"] for r in q(ref, "select tgname n from pg_trigger where not tgisinternal")}
  計 = 0
  for 題, 欲, 消, 有 in [("表", 表, 消表, あ表), ("関数", 関, 消関, あ関), ("決まり", 決, 消決, あ決), ("引き金", 引, set(), あ引)]:
    見 = sorted(x for x in 欲 if x not in 有)
    後で消 = sorted(x for x in 見 if x in 消)
    本当 = sorted(x for x in 見 if x not in 消)
    計 += len(本当)
    print("★%-5s 移行が 作る %3d ／ 無い %2d（うち あとで 消された %d）" % (題, len(欲), len(見), len(後で消)))
    for x in 本当:
      print("    ★★土台に ありません …… %s" % x)
    for x in 後で消:
      print("    ・あとの 移行で 消えた …… %s" % x)
  print("\n★★★土台に 無い もの …… %d 件" % 計)
  return 0 if 計 == 0 else 1


if __name__ == "__main__":
  sys.exit(main())
