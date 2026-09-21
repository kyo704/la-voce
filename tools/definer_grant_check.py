#!/usr/bin/env python3
# ★security definer の 関数を、★誰に 渡して いるか（★2026-09-21）。
#
#   ★★★きっかけ ── ★`matching_report_makes_cut` に `execute` が 渡って いました。
#     ★★PostgreSQL は、★関数を 作ると 既定で みんなに 渡します。
#     ★★ほかの 6本は 取り上げて いました。★1本 だけ 抜けて いました。
#
#   ★★★引き金の 関数は、★直に 呼べません（★2026-09-21 に 本番で 確かめました）。
#     ★★「trigger functions can only be called as triggers」と 返ります。
#     ★★だから 渡って いても 穴では ありません。★けれど 揃えます。
#
#   ★★この 道具は **読むだけ** です。★取り上げる SQL は 書き出すだけ です。
#   ★★較正 ── ★渡して いない 1本（`matching_visible`）が「渡して いない」と 出ること。
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ★画面から 呼ぶ ため、★渡して いてよい もの。
#   ★★名で 覚えません。★`get_` で 始まる 読み口 と、★裁定で 決めた 書き口 です。
YURUSU = re.compile(r"^(get_|has_can|has_guardian_consent)")

def きく(sql, 本番):
  a = ["python3", str(ROOT / "tools" / "ask_ledger.py")]
  if not 本番:
    a.append("--test")
  a.append(sql)
  return subprocess.run(a, capture_output=True, text=True, timeout=300).stdout

def 読む(本番):
  sql = ("select p.proname, t.typname, "
         "coalesce((select string_agg(r.grantee, '/' order by r.grantee) "
         "from information_schema.routine_privileges r "
         "where r.routine_schema='public' and r.routine_name=p.proname "
         "and r.grantee in ('anon','authenticated')), '-') as who "
         "from pg_proc p join pg_namespace n on n.oid=p.pronamespace "
         "join pg_type t on t.oid=p.prorettype "
         "where n.nspname='public' and p.prosecdef order by 1")
  out = きく(sql, 本番)
  行 = []
  for l in out.split("\n"):
    m = re.match(r"^(\w+)\s*\|\s*(\w+)\s*\|\s*(\S+)\s*$", l.strip())
    # ★★見出しの 行（proname | typname | who）を 拾わない ように します。
    #   ★★2026-09-21、★一覧の 先頭に「proname …… who」が 混ざりました。
    if m and m.group(1) != "proname":
      行.append({"名": m.group(1), "返り": m.group(2), "渡し先": m.group(3)})
  return 行

def main():
  本番 = "--test" not in sys.argv
  行 = 読む(本番)
  if len(行) < 5:
    print("★止まりました ── ★台帳から 読めて いません（", len(行), "件）")
    raise SystemExit(1)
  # ★較正 ── ★渡して いない はずの 1本が、★そう 出る こと。
  見 = next((x for x in 行 if x["名"] == "matching_visible"), None)
  if not 見 or 見["渡し先"] != "-":
    print("★止まりました ── ★較正に 落ちました（matching_visible の 渡し先 =",
          (見 or {}).get("渡し先"), "）")
    raise SystemExit(1)

  引き金 = [x for x in 行 if x["返り"] == "trigger" and x["渡し先"] != "-"]
  そのほか = [x for x in 行 if x["返り"] != "trigger" and x["渡し先"] != "-"
              and not YURUSU.match(x["名"])]
  print(f"★security definer の 関数 {len(行)}本（{'本番' if 本番 else '試し'}）")
  print(f"★引き金の 関数で、★渡って いる もの {len(引き金)}本")
  for x in 引き金:
    print(f"    {x['名']} …… {x['渡し先']}")
  # ★★★こちらは **誤りの 一覧では ありません**。
  #   ★★画面から 呼ぶ 書き口は、★渡って いて 当たり前 です
  #     （★`mark_attendance` / `move_lesson` / `transfer_contract_owner` など）。
  #   ★★目で 見る ため の 一覧 です。★1年に 1度 眺めれば 足ります。
  print(f"★そのほかの definer で、★画面から 呼べる もの {len(そのほか)}本"
        + "（★誤りの 一覧では ありません。★目で 見る ため です）")
  for x in そのほか:
    print(f"    {x['名']} …… {x['渡し先']}")
  if 引き金:
    p = ROOT / "supabase" / "migration_revoke_trigger_fns.sql"
    l = ["-- ★引き金の 関数から `execute` を 取り上げます（★道具が 書きました）。",
         "-- ★引き金から 呼ぶ ぶんには 要りません。",
         "-- ★直に 呼んでも「trigger functions can only be called as triggers」で 止まります。",
         ""]
    for x in 引き金:
      l.append(f"revoke all on function public.{x['名']}() from public, anon, authenticated;")
    p.write_text("\n".join(l) + "\n", encoding="utf-8")
    print(f"\n★取り上げる SQL を 書き出しました …… {p}")
    print("★走らせて いません。★書き込みは お言葉を いただいて から です。")

if __name__ == "__main__":
  main()
