#!/usr/bin/env python3
# ★引く 列の 一覧を、★台帳から 作ります（★裁定 その113 §5-1・2026-09-20）。
#   ★★`select("*")` を やめる ため の もと です。
#   ★★★渡して いない 列は 入れません。★入れると、★また 要求ごと 落ちます。
#   ★★読むだけ です。★作った 紙は `lib/dbColumns.js`。
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HYO = [
  "subscriptions", "org_invitations", "recovery_codes", "entries",
  "questionnaire_responses", "repertoire_tessitura", "role_master",
  "project_master", "teacher_student_links", "chapter_state",
  "article_progress", "article_notes", "organizations", "enrollments",
  "assignments", "memberships", "org_billing", "my_periods", "my_timetable",
  "character_inventory",
]

def 尋ねる(sql):
  out = subprocess.run(
    ["python3", str(ROOT / "tools" / "ask_ledger.py"), "--raw", sql],
    capture_output=True, text=True).stdout
  return [l.split(": ", 1)[1].strip() for l in out.split("\n") if l.startswith("c: ")]

def main():
  L = ["// ============================================================================",
       "// ★引く 列（★台帳から 作りました・2026-09-20）",
       "//",
       "//   ★★★`select(\"*\")` を 使いません（★裁定 その113 §5-1）。",
       "//     ★★列ごとの 渡し（column grant）の ある 表では、★`*` は 要求ごと 落ちます。",
       "//     ★★0行では なく `data` が null です。★画面は 黙って 空に なります。",
       "//     ★★★2026-09-20 に 2件 起きました ── `lessons` と `org_events`。",
       "//",
       "//   ★★この 紙は `tools/gen_columns.py` が 作りました。★手で 直さないで ください。",
       "//     ★★列を 足したら、★もう一度 走らせて ください。",
       "//   ★★入って いるのは、★**いま 渡して ある 列 だけ** です。",
       "// ============================================================================",
       ""]
  for t in HYO:
    cols = 尋ねる(
      "select string_agg(c.column_name, ', ' order by c.ordinal_position) "
      f"filter (where has_column_privilege('authenticated','public.{t}', c.column_name,'SELECT')) as c "
      f"from information_schema.columns c where c.table_schema='public' and c.table_name='{t}'")
    if not cols or not cols[0]:
      print("★飛ばしました（読めません）:", t)
      continue
    名 = "COLS_" + t.upper()
    L.append(f'/** ★`{t}` ── ★渡して ある 列 だけ。 */')
    L.append(f'export const {名} =')
    行, いま = [], ""
    for c in cols[0].split(", "):
      if len(いま) + len(c) > 70:
        # ★★★行を 折る ときも、★読点の あとの 空白を 残します（★2026-09-20）。
        #   ★★`"…, trial_end," + "current_period_end"` に なって いました。
        #   ★★つなぐと `trial_end,current_period_end`。★台帳は 通しますが、読めません。
        行.append(いま.rstrip())
        いま = ""
      いま += c + ", "
    行.append(いま.rstrip().rstrip(","))
    L.append('  "' + '"\n  + "'.join(行) + '";')
    L.append("")
  p = ROOT / "lib" / "dbColumns.js"
  p.write_text("\n".join(L) + "\n", encoding="utf-8")
  print("FILE:", p, "／ 表", len(HYO))

if __name__ == "__main__":
  main()
