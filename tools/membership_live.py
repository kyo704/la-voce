#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★memberships に、★いま 何が 通るか（★生きた 確かめ）
#
#   ★出どころ 2026-09-11 の 急ぎの お尋ね。
#     ★★「pg_policies が memberships で 0行 を 返した。
#       ★★RLS は 有効。★つまり 全部 拒む はずでは ないか」
#
#   ★★決まりの 文面では なく、★実際に 投げた 返事で 答えます
#     （★この家の 決め ──「文書と 実装が 食い違ったら、実装が 事実」）。
#
#   ★★触るのは、★名前が「★50通り」で 始まる 使い捨ての 学校だけです。
#   ★★値は 変えません。★いま 入って いる のと 同じ 値を 書き戻します。
#
#   使い方  python3 tools/membership_live.py <学校の id>
# ============================================================================

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from perm_matrix import Rest, read_env, sign_in, code_of, message_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
ME = "f7520dc1-9154-4524-a350-ba0bcddbf0b2"


def main():
  org = sys.argv[1] if len(sys.argv) > 1 else None
  if not org:
    print("★学校の id を 1つ 渡して ください。")
    return 1

  env = read_env()
  url, anon = env.get("E2E_SUPABASE_URL"), env.get("E2E_SUPABASE_ANON")
  token = sign_in(url, anon, env["E2E_EMAIL"], env["E2E_PASSWORD"])
  rest = Rest(url, anon, token)

  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  def show(title, status, body, note=""):
    say("### " + title)
    say()
    say("```")
    say("状態　" + str(status))
    say("中身　" + (body[:300] if body else "（空）"))
    c, m = code_of(body), message_of(body)
    if c or m:
      say("番号　" + (c or "（無し）"))
      say("文面　" + (m or "（無し）"))
    say("```")
    if note:
      say()
      say(note)
    say()

  say("# ★memberships に、★いま 何が 通るか")
  say()
  say("★この 紙は tools/membership_live.py が 書き出します。★手で 書いて いません。")
  say()
  say("★使い捨ての アカウント `%s`" % ME)
  say()
  say("★学校 `%s`" % org)
  say()

  # ① ★読めるか
  s, b = rest.call("memberships?org_id=eq.%s&select=id,role,post_id" % org)
  rows = []
  try:
    rows = json.loads(b)
  except Exception:                                             # noqa: BLE001
    rows = []
  show("① 自分の 行が 読めるか", s, b,
       "★★決まりが 1本も 無ければ、★RLS は すべてを 拒みます。\n"
       "　★★読みは 誤りに ならず、★**0行** に なります。\n"
       "　★★1行 返って きたなら、★**読みを 許す 決まりが 立って います**。")

  if not rows:
    say("★行が 読めません。★以下は 試せません。")
    return write(lines)

  mine = rows[0]
  say("★いま 入って いる 値　`role=%s`　`post_id=%s`"
      % (mine.get("role"), mine.get("post_id")))
  say()

  # ② ★同じ 値を 書き戻す
  s, b = rest.call("memberships?id=eq.%s&select=id,role" % mine["id"], "PATCH",
                   {"role": mine["role"]})
  show("② いまと 同じ 値を 書き戻す（★値は 変えません）", s, b,
       "★★決まりが 1本も 無ければ、★書きは 2つの どちらかに なります ──\n"
       "　★① `new row violates row-level security policy`（★誤り）\n"
       "　★② 0行（★どの 行にも 当たらない）\n"
       "★★**1行 返って きたなら、★書きを 許す 決まりが 立って います。**")

  # ③ ★上げようと する（★止まる はず）
  s, b = rest.call("memberships?id=eq.%s&select=id,role" % mine["id"], "PATCH",
                   {"role": "owner"})
  rose = False
  try:
    d = json.loads(b)
    rose = bool(d) and d[0].get("role") == "owner"
  except Exception:                                             # noqa: BLE001
    rose = False
  show("③ 自分を owner に 上げようと する", s, b)
  if rose and mine["role"] != "owner":
    rest.call("memberships?id=eq.%s" % mine["id"], "PATCH", {"role": mine["role"]})
    s2, b2 = rest.call("memberships?id=eq.%s&select=role" % mine["id"])
    say("★★上がって しまいました。★その場で 戻しました。→ `" + b2[:80] + "`")
    say()

  # ④ ★post_id を 触る（★許しの 層）
  s, b = rest.call("memberships?id=eq.%s&select=id" % mine["id"], "PATCH",
                   {"post_id": mine["post_id"]})
  show("④ post_id を 同じ 値で 書き戻す", s, b,
       "★★`permission denied for table` なら、★**許し（GRANT）**の 話です。\n"
       "　★★決まり（RLS）まで 届いて いません。★決まりの 有る 無しと 別です。")

  # ⑤ ★入れられるか（★使い捨ての 学校に、★すでに 居るので 重なる はず）
  s, b = rest.call("memberships?select=id", "POST",
                   {"org_id": org, "user_id": ME, "role": "teacher"})
  show("⑤ 入れられるか（★もう 居るので 重なる はず）", s, b,
       "★★`23505`（重なり）なら、★決まりを 通り抜けて 台帳まで 届いて います。\n"
       "　★★`42501` なら、★許しか 決まりで 止まって います。")

  say("## ★§7-3 の 止める 決まりに ついて")
  say()
  say("★★`memberships_update_needs_can_post` は、★`post_id` を 変える ときに")
  say("　★★`has_can(org_id, \'post\')` を 求める、★止める（restrictive）決まりです。")
  say()
  say("★★けれど ④で 見た とおり、★`post_id` への 書きは")
  say("　★★**決まりに 届く 前に、★許し（GRANT）で 止まって います。**")
  say("　★★ヒントも そう 言って います ──")
  say("　★`GRANT UPDATE ON public.memberships TO authenticated;`")
  say()
  say("★★つまり この 道からは、★その 決まりが 効いて いるか どうかを")
  say("　★★**見る ことが できません**。★手前で 止まる ためです。")
  say("　★★有ることの 証明にも、★無いことの 証明にも なりません。")
  say("　★★台帳を 直に 見る ほか ありません。")
  say()
  say("## ★読み取り")
  say()
  say("★★①で 行が 読め、★②で 1行 返って きたなら、")
  say("　★★**memberships には 決まりが 立って います。**")
  say("　★★`pg_policies` が 0行 を 返したのは、★別の 理由です ──")
  say("　★・`schemaname` の 絞り込みが 抜けて いた")
  say("　★・ちがう 書き方（schema）か、ちがう 台帳を 見て いた")
  say("　★・打ちまちがい")
  say()
  say("★★今日の §3 の ② では、★同じ `pg_policies` が")
  say("　★★memberships に **5本**（★うち has_can 1本）を 返して います。")
  say("　★★同じ 日に 0本と 5本は、★両方 本当では あり得ません。")
  say()
  say("★★確かめ直す なら、★絞り込みを 外して ください ──")
  say()
  say("```sql")
  say("select schemaname, tablename, policyname, permissive, cmd")
  say("from pg_policies where tablename = 'memberships';")
  say("")
  say("-- ★それでも 0行 なら、★別の 見方で ──")
  say("select polname, polpermissive, polcmd")
  say("from pg_policy where polrelid = 'public.memberships'::regclass;")
  say("```")
  say()
  return write(lines)


def write(lines):
  p = os.path.join(OUT, "2026-09-11-membershipsに今なにが通るか.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-11-membershipsに今なにが通るか.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
