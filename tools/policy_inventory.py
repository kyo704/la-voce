#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★役割に 寄る 決まりの 棚おろし（★裁定 その23・項目4／9月15日の 関門）
#
#   ★★台帳に **実際に 立って いる** 決まりを 並べます。
#     ★★帳面の 字では ありません（★そちらは tools/role_dependent.py）。
#
#   ★入れもの  docs/reports/_policies.tsv
#     ★★③の 結果を、★そのまま 貼った もの。
#     ★★1行 1本。★区切りは タブ。★見出しの 行が あっても かまいません。
#        表<TAB>決まり<TAB>何に<TAB>読める条件<TAB>書ける条件
#
#   ★★「どの 鍵に あたるか」は、★私が 決めません。
#     ★★表と cmd から、★lib/opsPerms.js の 名前を 添えるだけ です。
#     ★★添えられない ものは「★お決めが 要ります」と 出します。
#
#   使い方  python3 tools/policy_inventory.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
SRC = os.path.join(OUT, "_policies.tsv")

# ★表 × 何に → ★あたりそうな 鍵（★lib/opsPerms.js の 名前）
MAP = {
  ("enrollments", "SELECT"): "meibo",
  ("enrollments", "INSERT"): "meibo",
  ("enrollments", "UPDATE"): "meibo",
  ("enrollments", "DELETE"): "meibo",
  ("memberships", "SELECT"): "meibo",
  ("memberships", "INSERT"): "post",
  ("memberships", "UPDATE"): "post",
  ("memberships", "DELETE"): "post",
  ("assignments", "SELECT"): "meibo",
  ("assignments", "INSERT"): "meibo",
  ("assignments", "UPDATE"): "meibo",
  ("assignments", "DELETE"): "meibo",
  ("org_events", "SELECT"): "gyoji",
  ("org_events", "INSERT"): "gyoji",
  ("org_events", "UPDATE"): "gyoji",
  ("org_events", "DELETE"): "gyoji",
  ("org_messages", "SELECT"): "renraku_all",
  ("org_messages", "INSERT"): "renraku_all",
  ("org_messages", "UPDATE"): "renraku_all",
  ("org_messages", "DELETE"): "renraku_all",
  ("org_invitations", "SELECT"): "meibo",
  ("org_invitations", "INSERT"): "meibo",
  ("org_invitations", "UPDATE"): "meibo",
  ("org_invitations", "DELETE"): "meibo",
}

# ★★変えない ほうが よい もの（★すでに 確かめ済み）。
KEEP = {
  "memberships_update_role_management":
    "★自分の 役割を 自分で 下げる 道。★role_rank の 階で 守られて いる。"
    "★実地で 10役職 とも owner へ 上げられない ことを 確かめた（2026-09-11）。"
    "★役割の 話なので、★できことに 移す ものでは ない。",
}


def read_rows():
  if not os.path.exists(SRC):
    return None
  rows = []
  with open(SRC, encoding="utf-8") as f:
    for line in f:
      if not line.strip():
        continue
      c = [x.strip() for x in line.rstrip("\n").split("\t")]
      if len(c) < 3:
        continue
      if c[0] in ("表", "tablename", "schemaname"):
        continue
      rows.append({
        "table": c[0], "name": c[1], "cmd": c[2].upper(),
        "using": c[3] if len(c) > 3 else "",
        "check": c[4] if len(c) > 4 else ""
      })
  return rows


def main():
  rows = read_rows()
  if rows is None:
    print("★入れものが ありません: docs/reports/_policies.tsv")
    print("★③の 結果を タブ区切りで 貼って ください。")
    print("　表<TAB>決まり<TAB>何に<TAB>読める条件<TAB>書ける条件")
    return 1

  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★役割に 寄る 決まり ── ★1本ずつ")
  say()
  say("★この 紙は tools/policy_inventory.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★台帳に **実際に 立って いる** 決まりです（★pg_policies）。")
  say("　★★帳面の 字の ほうは 別の 紙です ──")
  say("　★docs/reports/2026-09-13-役割に寄る-帳面の字.md")
  say()
  say("★★**決めて いません。** ★添えた 鍵は lib/opsPerms.js の 名前です。")
  say("　★★お決めは Opus と 坂本さんの ものです。")
  say()

  tables = sorted({r["table"] for r in rows})
  say("## ★数")
  say()
  say("- 決まり　**%d 本**" % len(rows))
  say("- 表　　　**%d**　（%s）" % (len(tables), "／".join(tables)))
  say()
  say("★★この 2つが、★安全管理の 書類に 書く 母数です。")
  say()

  say("## ★1本ずつ")
  say()
  say("| 表 | 決まり | 何に | あたりそうな 鍵 | 見立て |")
  say("|---|---|---|---|---|")
  need = 0
  for r in sorted(rows, key=lambda x: (x["table"], x["cmd"], x["name"])):
    both = (r["using"] + " " + r["check"])
    # ★★条件の 本文を 読んで 分けます（★2026-09-13）。
    #   ★★はじめ「has_can が 無ければ ぜんぶ 候補」と して いました。
    #     ★★それだと、★**自分の 行だけ**を 見て いる 枝まで 候補に なります。
    #     ★★`auth.uid() = user_id` は 役割の 話では ありません。
    #   ★★見るのは 2つ だけ です ──
    #     ★`is_org_owner_or_admin(...)` を 呼んで いるか
    #     ★`role = 'owner'` の ように 役割の 名前を 直に 書いて いるか
    role_fn = "is_org_owner_or_admin" in both
    role_lit = ("'owner'" in both) or ("'admin'" in both)
    if r["name"] in KEEP:
      view = "★そのまま"
    elif "has_can" in both:
      view = "★もう できことを 見て いる"
    elif role_fn or role_lit:
      view = "★★できことへ 移す 候補"
      need += 1
    else:
      view = "★自分の 行だけ（★役割を 見て いない）"
    key = MAP.get((r["table"], r["cmd"]))
    if not key and r["cmd"] == "ALL":
      key = MAP.get((r["table"], "UPDATE"))
    say("| %s | `%s` | %s | %s | %s |" % (
      r["table"], r["name"], r["cmd"], key or "★お決めが 要ります", view))
  say()
  say("★★できことへ 移す 候補　**%d 本**" % need)
  say()
  say("★★★「候補」の 中にも、★自分の 行を 見る 枝が **一緒に 入って います**。")
  say("　★★例 `memberships_select` ── `auth.uid() = user_id OR is_org_owner_or_admin(...)`")
  say("　★★直すのは **右の 枝だけ** です。★左の 枝（★自分の 行）は 触りません。")
  say("　★★まるごと 置き換えると、★ご自分の 行が 読めなく なります。")
  say()

  say("## ★条件の 本文（★1本ずつ）")
  say()
  for r in sorted(rows, key=lambda x: (x["table"], x["cmd"], x["name"])):
    say("### `%s`　（%s ／ %s）" % (r["name"], r["table"], r["cmd"]))
    say()
    say("```")
    say("読める 条件　" + (r["using"] or "（無し）"))
    say("書ける 条件　" + (r["check"] or "（無し）"))
    say("```")
    say()

  say("## ★そのまま に する もの と、★その わけ")
  say()
  for n, why in KEEP.items():
    say("- `%s`" % n)
    say("  %s" % why)
  say()

  say("## ★身元を 固める 形（★assignments に すでに ある）")
  say()
  say("★★`assignments_all_owner_admin` の WITH CHECK が、")
  say("　★`assignments_old_identity()` で org_id／teacher_id／student_id を")
  say("　★**書き換えられない** ように して います。")
  say()
  say("★★裁定 その23 の ② ──「org_id は 動かせない ように」は、")
  say("　★★この 形を そのまま 使えます。")
  say("　★★`has_can` で 通す／通さないを 決め、")
  say("　★★そのうえで **身元の 列は 前の まま**を かつ で 足します。")
  say("　★★2つを 1つの 条件に 混ぜません。★1つの ことに 1つの しるし。")
  say()
  say("★★中身を 読んで いません。★次の 1問で 読めます ──")
  say()
  say("```sql")
  say("select pg_get_functiondef(p.oid)")
  say("from pg_proc p join pg_namespace n on n.oid = p.pronamespace")
  say("where n.nspname = 'public' and p.proname = 'assignments_old_identity';")
  say("```")
  say()

  say("## ★この 紙が 見て いない こと")
  say()
  say("★★条件の 本文は 並べて いません（★長い ため）。")
  say("　★★docs/reports/_policies.tsv に そのまま 入って います。")
  say("★★どの 鍵に 移すかは、★表と cmd から 添えた だけ です。")
  say("　★★1本ずつ、★条件の 本文を 読んで お決めください。")

  p = os.path.join(OUT, "2026-09-13-role-dependent-policies.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("docs/reports/2026-09-13-role-dependent-policies.md  全%d行" % len(lines))
  print("決まり %d 本 / 表 %d / 移す候補 %d" % (len(rows), len(tables), need))
  return 0


if __name__ == "__main__":
  sys.exit(main())
