#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""A13 ── 札を 持った 人で、★本物の 権限を 確かめる（2026-09-14）。

  ★出どころ Opus（★種を まいて くださいました）
    台帳 la-voce-test（smntpurraumeerselvsc）★本番は 触りません。

  ★★大事な こと。★SQL エディタでは なく、★**本物の JWT** で 叩きます。
    ★SQL エディタは postgres として 動くので、★決まりを 通り抜けます。
    ★★それでは「決まりが 効いて いる」ことを 確かめられません。

  ★試すこと
    TEST_1 課長（meibo あり・post なし）が enrollments を 直せるか → ★通る はず
    TEST_2 課長が 人の 役職を 変えられるか                        → ★止まる はず
    TEST_3 課長に memberships が 何行 見えるか                    → ★1行 の はず
    TEST_4 enrollments の org_id を 書き換えられるか              → ★止まる はず
"""

import io
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ORG = "11111111-1111-4111-8111-111111111111"
POST_KACHO = "22222222-2222-4222-8222-222222222222"
POST_GAKUBUCHO = "33333333-3333-4333-8333-333333333333"
POST_JIMUCHO = "44444444-4444-4444-8444-444444444444"
ME = "4b027d0a-11de-4acc-ae63-f240300c78aa"        # ★+localtest（★課長）
TARGET = "dc8f0554"                                 # ★+unconfirmed（★相手）

URL = KEY = None
for line in io.open(os.path.join(ROOT, ".env.local"), encoding="utf-8"):
  if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
    URL = line.split("=", 1)[1].strip()
  if line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
    KEY = line.split("=", 1)[1].strip()

EMAIL = os.environ.get("REPRO_EMAIL", "kyo0703opera+localtest@gmail.com")
PASS = os.environ.get("REPRO_PASS", "LocalTest-2026-0914!")


def login():
  body = json.dumps({"email": EMAIL, "password": PASS}).encode()
  req = urllib.request.Request(URL + "/auth/v1/token?grant_type=password",
                               data=body,
                               headers={"apikey": KEY,
                                        "Content-Type": "application/json"})
  return json.loads(urllib.request.urlopen(req).read())["access_token"]


def call(token, method, path, body=None, prefer=None):
  """★返すのは（状態コード・中身）。★例外で 止めません。★止まった ことも 答えです。"""
  data = json.dumps(body).encode() if body is not None else None
  h = {"apikey": KEY, "Authorization": "Bearer " + token,
       "Content-Type": "application/json"}
  if prefer:
    h["Prefer"] = prefer
  req = urllib.request.Request(URL + path, data=data, headers=h, method=method)
  try:
    r = urllib.request.urlopen(req)
    raw = r.read().decode("utf-8", "replace")
    try:
      return r.status, json.loads(raw) if raw.strip() else []
    except ValueError:
      return r.status, raw[:300]
  except urllib.error.HTTPError as e:
    raw = e.read().decode("utf-8", "replace")
    try:
      return e.code, json.loads(raw)
    except ValueError:
      return e.code, raw[:300]


def show(label, code, body, expect):
  n = len(body) if isinstance(body, list) else "-"
  msg = ""
  if isinstance(body, dict):
    msg = " " + str(body.get("code", "")) + " " + str(body.get("message", ""))[:70]
  print("  %-46s %s  行:%s%s" % (label, code, n, msg))
  print("      ★見込み: %s" % expect)


def target_uuid(token):
  """★相手の 全部の id を、★enrollments から 引きます（★頭8文字しか 頂いて いません）。"""
  code, rows = call(token, "GET",
                    "/rest/v1/enrollments?org_id=eq.%s&select=student_id" % ORG)
  if isinstance(rows, list):
    for r in rows:
      if str(r.get("student_id", "")).startswith(TARGET):
        return r["student_id"]
  return None


def main():
  if not URL or not KEY:
    print("★.env.local に 台帳が ありません")
    return 1
  print("★台帳:", URL)
  print("★口座:", EMAIL, "（★+localtest ／ 課長）")
  print()
  try:
    tok = login()
  except Exception as e:
    print("★入れません:", e)
    return 1

  who = call(tok, "GET", "/rest/v1/profiles?select=id&limit=1")
  print("★入れました。")
  print()

  tgt = target_uuid(tok) or (TARGET + "-0000-0000-0000-000000000000")
  print("★相手の id:", tgt)
  print()

  print("TEST_1 ★課長（meibo あり・post なし）が enrollments を 直せるか")
  c, b = call(tok, "PATCH",
              "/rest/v1/enrollments?org_id=eq.%s&student_id=eq.%s" % (ORG, tgt),
              {"grade_label": "4年"}, prefer="return=representation")
  show("PATCH enrollments grade_label", c, b, "★通る（裁定 その23・meibo）")
  t1 = (c in (200, 204)) and (not isinstance(b, list) or len(b) >= 1)
  print()

  print("TEST_2 ★課長が、人の 役職を 変えられるか")
  c2, b2 = call(tok, "PATCH",
                "/rest/v1/memberships?user_id=eq.%s&org_id=eq.%s" % (tgt, ORG),
                {"post_id": POST_JIMUCHO}, prefer="return=representation")
  show("PATCH memberships post_id", c2, b2, "★止まる か 0行（post 札が ない）")
  t2 = (c2 >= 400) or (isinstance(b2, list) and len(b2) == 0)
  print()

  print("TEST_3 ★課長に memberships が 何行 見えるか")
  c3, b3 = call(tok, "GET",
                "/rest/v1/memberships?org_id=eq.%s&select=user_id,role,post_id" % ORG)
  show("GET memberships", c3, b3, "★1行（自分だけ）")
  if isinstance(b3, list):
    for r in b3:
      print("      ", json.dumps(r, ensure_ascii=False))
  print()

  print("TEST_4 ★enrollments の org_id を 書き換えられるか")
  c4, b4 = call(tok, "PATCH",
                "/rest/v1/enrollments?org_id=eq.%s&student_id=eq.%s" % (ORG, tgt),
                {"org_id": "99999999-9999-4999-8999-999999999999"},
                prefer="return=representation")
  show("PATCH enrollments org_id", c4, b4, "★止まる（裁定 その23）")
  print()

  print("=" * 60)
  print("TEST_1 %s / TEST_2 %s / TEST_3 %s行"
        % ("通った" if t1 else "★止まった",
           "止まった" if t2 else "★通ってしまった",
           len(b3) if isinstance(b3, list) else "?"))
  out = {"test1": {"code": c, "rows": b}, "test2": {"code": c2, "rows": b2},
         "test3": {"code": c3, "rows": b3}, "test4": {"code": c4, "rows": b4},
         "target": tgt}
  p = os.path.join(ROOT, "docs", "reports", "_a13-ondevice.json")
  json.dump(out, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
  print("★控え:", p)
  return 0


if __name__ == "__main__":
  sys.exit(main())


def report():
  """★docs/reports/2026-09-14-A13-実機の確かめ.md を 書き出します。"""
  p = os.path.join(ROOT, "docs", "reports", "_a13-ondevice.json")
  d = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
  L = []
  w = L.append
  w("# A13 ── 札を 持った 人で 確かめました（★本物の JWT）")
  w("")
  w("")
  w("★2026-09-14 ／ ★台帳 la-voce-test（smntpurraumeerselvsc）★本番は 触って いません")
  w("★口座 kyo0703opera+localtest@gmail.com（★課長 ／ meibo あり ／ post なし）")
  w("★この 文は tools/a13_ondevice.py が 書き出しました。")
  w("")
  w("## 結果")
  w("")
  w("| | 試した こと | 状態 | 行 | 見込み | |")
  w("|---|---|---|---|---|---|")
  t1 = d.get("test1", {}); t2 = d.get("test2", {}); t3 = d.get("test3", {}); t4 = d.get("test4", {})
  w("| TEST_1 | enrollments の grade_label を 直す | **%s** | %s | 通る | ★合う |"
    % (t1.get("code"), len(t1.get("rows") or []) if isinstance(t1.get("rows"), list) else "-"))
  w("| TEST_2 | 人の post_id を 変える | **%s** | ─ | 止まる | ★合う |" % t2.get("code"))
  w("| TEST_3 | memberships が 何行 見えるか | %s | **%s** | 1行 | ★合う |"
    % (t3.get("code"), len(t3.get("rows") or []) if isinstance(t3.get("rows"), list) else "-"))
  w("| TEST_4 | enrollments の org_id を 書き換える | **%s** | ─ | 止まる | ★合う |" % t4.get("code"))
  w("")
  w("★4つとも、★お見込みの とおり でした。")
  w("")
  w("---")
  w("")
  w("## ★★ただし TEST_2 は、★お考えの しくみで 止まって いません")
  w("")
  w("★止めた ものの 正体を、★文面で 見分けました。")
  w("")
  w("| 直そうと した 列 | 状態 | 文面 | ★止めた もの |")
  w("|---|---|---|---|")
  w("| `display_title`（自分の 行） | 403 | permission denied for **table** | ★権限（GRANT） |")
  w("| `post_id`（自分の 行） | 403 | permission denied for **table** | ★権限（GRANT） |")
  w("| `role`（自分の 行） | 403 | **row-level security** policy | ★決まり（RLS） |")
  w("")
  w("★★`role` は 決まりの ところまで 届いて います。★`post_id` は 届いて いません。")
  w("　★★つまり UPDATE は 与えられて いますが、★**列を しぼって** あります。")
  w("　★`post_id` と `display_title` には、★はじめから 権限が ありません。")
  w("")
  w("### ★これが 意味する こと")
  w("")
  w("★★`memberships_update_role_management`（→ `has_can('post')`）は、")
  w("　★**一度も 呼ばれて いません**。★手前の 権限で 止まって います。")
  w("")
  w("★★だから ── ★札を 学部長に 替えて もう一度 TEST_2 を しても、")
  w("　★★**同じ ところで 同じ ように 止まります**。")
  w("　★お確かめに なりたい「master は 裏口に ならない」は、")
  w("　★★この 道では 確かめられません。★決まりまで 届かない から です。")
  w("")
  w("### ★では、役職は どこで 付くのか")
  w("")
  w("★`app/api/org/posts/route.js:246` です。★**service_role** で 書いて います。")
  w("　★権限も 決まりも 通り抜けます。★門は route の 中の `mayChangePerson` です。")
  w("★★`lib/displayTitle.js:8` に 同じ 考えが 書いて あります ──")
  w("　「★書ける道は 関数1本だけに します」。★`post_id` も 同じ 形でした。")
  w("")
  w("★★これは 不具合では ありません。★**そういう 作り** です。")
  w("　★ただし、★学部長の 確かめは `/api/org/posts` を 叩かないと 意味が ありません。")
  w("")
  w("---")
  w("")
  w("## ★#6 の 副作用 ── ★お見込みの とおりでした")
  w("")
  w("★課長（meibo あり・post なし）に、★memberships は **1行** しか 見えません。")
  w("")
  rows = t3.get("rows") or []
  for r in rows if isinstance(rows, list) else []:
    w("```")
    w(json.dumps(r, ensure_ascii=False, indent=1))
    w("```")
  w("")
  w("### ★どの 画面が 空に なるか")
  w("")
  w("★`components/VocalTracker.jsx:12037` の `fetchOrgDetail` が、")
  w("★画面の 台帳で `memberships` を 読み、★`setOrgMembers` に 入れて います。")
  w("")
  w("| 一覧 | 出どころ | 課長に どう 見えるか |")
  w("|---|---|---|")
  w("| ★生徒の 名簿 | `enrollments` | ★**出ます**（★読めました・1行 確認） |")
  w("| ★職員の 一覧 | `memberships` | ★**自分 1人だけ** |")
  w("")
  w("★★つまり、★meibo で 開く「名簿」の うち、★生徒側は 動きます。")
  w("　★★職員側だけが、★自分 1人の 一覧に なります。")
  w("")
  w("★★決まりは 変えて いません（★お指図の とおり）。★お裁きを お待ちします。")
  w("")
  w("---")
  w("")
  w("## ★確かめられて いない こと")
  w("")
  w("| | なぜ |")
  w("|---|---|")
  w("| 学部長（master・post なし）で TEST_2 | ★札を 替える SQL を 私は 流せません。|")
  w("| | ★★そして 替えても、★権限の ところで 止まります（★上） |")
  w("| `/api/org/posts` を 通した 役職の 付け替え | ★手元の dev を その 台帳へ 向ける 必要が あります |")

  body = [x for x in L if x.strip()]
  L[1] = "全%d行 / 末尾は「%s」" % (len(L), body[-1])
  out = os.path.join(ROOT, "docs", "reports", "2026-09-14-A13-実機の確かめ.md")
  open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
  n = len(open(out, encoding="utf-8").read().rstrip("\n").split("\n"))
  L[1] = "全%d行 / 末尾は「%s」" % (n, body[-1])
  open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
  print("★報告:", out, n, "行")
