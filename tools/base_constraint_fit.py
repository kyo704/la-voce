#!/usr/bin/env python3
"""★★★しばりの 字を 本番に 合わせます（★裁定175・base_manifest の constraints）。

  ★★わけ ── ★PostgreSQL は `AND` の 入れ子を 読み直す ときに **平ら**に します。
    ★本番の `((a>=1) AND (a<=20))` は、★もとが `between` だった ので 入れ子の まま 残ります。
    ★★同じ 意味 ですが、★`pg_get_constraintdef` の 字が 変わり、★md5 が 合いません。

  ★★★手で 1本だけ 直しません。★**ちがう ものを 見つけて、★書き換えて、★また くらべます**。
    ★合わなければ 元に 戻します。★合った ものだけ 残します。

  python3 tools/base_constraint_fit.py <試しの ref> [--ok]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import q, HON

FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    "supabase", "migrations", "20260101000003_base_03_constraints.sql")
SQL = """select r.relname t, c.conname nm, pg_get_constraintdef(c.oid) d
 from pg_constraint c join pg_class r on r.oid=c.conrelid join pg_namespace n on n.oid=r.relnamespace
 where n.nspname='public' order by r.relname, c.conname"""
# ★`((X >= a) AND (X <= b))` → `(X BETWEEN a AND b)`
P = re.compile(r"\(\((?P<x>[^()]+(?:\([^()]*\))?[^()]*) >= (?P<a>[^()]+)\) AND \((?P=x) <= (?P<b>[^()]+)\)\)")


def main():
  if len(sys.argv) < 2:
    print(__doc__); return 2
  ref = sys.argv[1]
  if ref == HON:
    print("★止まりました ── ★本番には 当てません。"); return 2
  本 = {(x["t"], x["nm"]): x["d"] for x in q(HON, SQL)}
  試 = {(x["t"], x["nm"]): x["d"] for x in q(ref, SQL)}
  差 = [(k, 本[k], 試.get(k)) for k in sorted(本) if 本[k] != 試.get(k)]
  print("★ちがう しばり ……", len(差))
  if not 差:
    print("RESULT: ★合って います"); return 0
  直 = []
  for (t, nm), ほ, し in 差:
    新 = P.sub(lambda m: "(%s BETWEEN %s AND %s)" % (m.group("x"), m.group("a"), m.group("b")), ほ)
    print("  %s.%s" % (t, nm))
    print("    本番 …… %s" % ほ[:150])
    print("    書き換え … %s" % 新[:150])
    if 新 == ほ:
      print("    ★★書き換えられません。★Opus に 返します。"); continue
    if "--ok" not in sys.argv:
      continue
    q(ref, "alter table public.%s drop constraint %s" % (t, nm))
    q(ref, "alter table public.%s add constraint %s %s" % (t, nm, 新))
    あと = {(x["t"], x["nm"]): x["d"] for x in q(ref, SQL)}.get((t, nm))
    if あと == ほ:
      print("    ★合いました")
      直.append((t, nm, ほ, 新))
    else:
      print("    ★★まだ ちがいます。★元に 戻します ──", あと)
      q(ref, "alter table public.%s drop constraint %s" % (t, nm))
      q(ref, "alter table public.%s add constraint %s %s" % (t, nm, ほ))
  if not 直:
    return 1
  # ★★合った ぶんは、★土台の ファイルにも 書き戻します（★次に 作り直す ときの ため）
  s = open(FILE, encoding="utf-8").read()
  for t, nm, ほ, 新 in 直:
    古行 = "alter table public.%s add constraint %s %s;" % (t, nm, ほ)
    新行 = "alter table public.%s add constraint %s %s;" % (t, nm, 新)
    if 古行 not in s:
      print("  ★★土台の 中に 見つかりません ……", nm); return 1
    s = s.replace(古行, 新行)
  open(FILE, "w", encoding="utf-8").write(s)
  print("★土台の ファイルにも 書き戻しました（%d 本）" % len(直))
  return 0


if __name__ == "__main__":
  sys.exit(main())
