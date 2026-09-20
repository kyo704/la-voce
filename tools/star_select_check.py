#!/usr/bin/env python3
# ★`select("*")` を 使って いる ところ と、★それが 通るか（★裁定 その113 §5-1）。
#   ★★★列ごとの 渡し（column grant）の ある 表では、★`*` は **要求ごと** 落ちます。
#     ★★0行では ありません。★`data` が null に なります。★画面は 黙って 空に なります。
#   ★★きょう 2件 見つかりました ── `lessons`（9/20 朝）と `org_events`（9/20 夜）。
#
#   ★★読むだけ です。★台帳へ 1度 尋ねて、★危ない 表を 数えます。
#   ★★較正 ── ★`*` の 例で 当たり、★列を 並べた 例で 外れる こと。
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOSHI = re.compile(r'\.from\("(\w+)"\)\s*\n?\s*\.select\("\*"')

def 危ない表():
  sql = ("with tbl as (select table_name from information_schema.role_table_grants "
         "where grantee='authenticated' and privilege_type='SELECT' and table_schema='public'), "
         "col as (select distinct table_name from information_schema.column_privileges "
         "where grantee='authenticated' and privilege_type='SELECT' and table_schema='public') "
         "select c.table_name from col c where c.table_name not in (select table_name from tbl)")
  out = subprocess.run(["python3", str(ROOT / "tools" / "ask_ledger.py"), "--raw", sql],
                       capture_output=True, text=True).stdout
  return {l.split(": ", 1)[1].strip() for l in out.split("\n") if l.startswith("table_name: ")}

def calib():
  a = '.from("lessons").select("*").eq("id", x)'
  b = '.from("lessons").select(COLUMNS).eq("id", x)'
  return bool(HOSHI.search(a)) and not HOSHI.search(b)

def main():
  if not calib():
    print("★止まりました ── ★較正に 落ちました")
    raise SystemExit(1)
  危 = 危ない表()
  print("★列ごとの 渡しの ある 表（★`*` が 落ちる）:", ", ".join(sorted(危)) or "なし")
  当, 全 = [], 0
  for d in ("app", "components", "lib"):
    for p in sorted((ROOT / d).rglob("*")):
      if p.suffix not in (".js", ".jsx") or "tests" in p.parts:
        continue
      s = p.read_text(encoding="utf-8", errors="replace")
      for m in HOSHI.finditer(s):
        全 += 1
        n = s.count("\n", 0, m.start()) + 1
        if m.group(1) in 危:
          当.append((str(p.relative_to(ROOT)), n, m.group(1)))
  print(f"★`*` を 使って いる ところ {全}件 ／ ★その うち **落ちる** もの {len(当)}件")
  for x in 当:
    print(f"  ★落ちます {x[0]}:{x[1]}  {x[2]}")

if __name__ == "__main__":
  main()
