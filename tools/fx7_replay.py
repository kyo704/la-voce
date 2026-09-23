#!/usr/bin/env python3
"""★★★移行を 頭から 当て直します（★裁定175・FX7）。

  ★supabase/migrations/ の ファイル名の 順に、★1本ずつ 当てます。
  ★★エラーが 出たら **その場で 止まり**、★中身を そのまま 出します。★直しません。

  python3 tools/fx7_replay.py --ref=<入れ物> [--from=<番>] [--ok]
"""
import json, os, sys, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _mgmt import token
from apply_migration import 何度でも同じか

DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "supabase", "migrations")
HON = "xxjtplvpcneksrofkjmf"


def 送る(ref, 名, sql, 版):
  r = urllib.request.Request(
    "https://api.supabase.com/v1/projects/%s/database/migrations" % ref,
    data=json.dumps({"name": 名, "query": sql, "version": 版}).encode(),
    headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json"})
  try:
    urllib.request.urlopen(r, timeout=300).read()
    return None
  except urllib.error.HTTPError as e:
    return "%s %s" % (e.code, e.read().decode()[:1200])


def main():
  a = sys.argv[1:]
  ref = next((x.split("=", 1)[1] for x in a if x.startswith("--ref=")), None)
  最初 = next((x.split("=", 1)[1] for x in a if x.startswith("--from=")), "")
  if not ref:
    print(__doc__); return 2
  if ref == HON:
    print("★止まりました ── ★本番には 当てません（裁定175 SCOPE_OUT）。"); return 2
  本 = sorted(x for x in os.listdir(DIR) if x.endswith(".sql"))
  本 = [x for x in 本 if x >= 最初]
  print("★送り先 ……", ref)
  print("★当てる 本 ……", len(本))
  if "--ok" not in a:
    for x in 本:
      わけ = 何度でも同じか(open(os.path.join(DIR, x), encoding="utf-8").read())
      print("  %-62s %s" % (x[:62], "NG " + " / ".join(わけ) if わけ else "OK"))
    print("★当てて いません。★--ok を 付けて ください。"); return 0
  for i, x in enumerate(本, 1):
    sql = open(os.path.join(DIR, x), encoding="utf-8").read()
    版, 名 = x[:14], x[15:-4]
    err = 送る(ref, 名, sql, 版)
    print("  %3d/%d  %-58s %s" % (i, len(本), 名[:58], "★当たりました" if err is None else "★★400"))
    if err:
      print("\n★★★止まりました ── %s" % x)
      print("★★これが「移行の 抜け」です。★直さずに Opus に 返します ──\n")
      print(err)
      return 1
  print("\n★★★全部 当たりました（%d 本）。" % len(本))
  return 0


if __name__ == "__main__":
  sys.exit(main())
