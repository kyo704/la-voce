#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★消す 決まりが 無い 22の 表を、★3つに 分ける（★No.014 の 続き）。

  ★出どころ 2026-09-14、★坂本さん

  ★★22件を「22の 不具合」と 読んでは いけません。
    ★★この 製品は「消さない。印を つける」で 通して います。
      ★だから 消す 決まりが 無いのは、★多くは わざと です。

  ★★分け方
    ★① 別の 消し方が ある（withdrawn_at / revoked_at / status など）
    ★② 足すだけの 記録（★あとから 直さない 台帳）
    ★③ **画面が 本当に `.delete()` を 呼び、★消える ことを 当てにして いる**
       ★★これが repertoire_tessitura と 同じ 形です。

  ★★③かどうかは、★字を 読むだけでは 決まりません。
    ★★呼んで いるのが 画面か、★裏方（service_role）かで まったく 違います。
      ★裏方は RLS を 越えます。★決まりが 無くても 消えます。
    ★★だから 呼び出し 1つずつに、★どの 鍵を 使うかを 見ます。

  ★★別の 消し方が あるかは、★字では なく **台帳に 尋ねて** 確かめます。
    ★★PostgREST は、★無い 列を 選ぶと 42703 を 返します。
      ★★あるか 無いかが、★それで はっきり します。
"""

import io
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TABLES = """age_answer_changes cohort_changes consent_records email_change_log
events feedback item_acquisitions link_consents minor_billing_consents
notice_targets org_invitations org_message_reads org_messages org_posts
organizations profiles purchases questionnaire_responses subscriptions
teacher_invitations teacher_student_links user_notices""".split()

# ★★「印を つける」ための 列。★どれか 1つでも あれば ①の 見込み。
SOFT = ["deleted_at", "withdrawn_at", "revoked_at", "status", "ended_at",
        "left_at", "cancelled_at", "canceled_at", "archived_at", "expires_at",
        "declined_at", "accepted_at", "is_active", "active", "read_at",
        "dismissed_at", "closed_at", "consumed_at", "used_at"]

URL = None
KEY = None
for line in io.open(os.path.join(ROOT, ".env.local"), encoding="utf-8"):
  if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
    URL = line.split("=", 1)[1].strip()
  if line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
    KEY = line.split("=", 1)[1].strip()

TOKEN = None


def login():
  global TOKEN
  body = json.dumps({"email": os.environ.get("REPRO_EMAIL",
                                             "kyo0703opera+localtest@gmail.com"),
                     "password": os.environ.get("REPRO_PASS",
                                                "LocalTest-2026-0914!")}).encode()
  req = urllib.request.Request(URL + "/auth/v1/token?grant_type=password",
                               data=body,
                               headers={"apikey": KEY,
                                        "Content-Type": "application/json"})
  TOKEN = json.loads(urllib.request.urlopen(req).read())["access_token"]


def has_column(table, col):
  """★その 列が あるか。★台帳に 尋ねて 確かめます。"""
  req = urllib.request.Request(
    URL + "/rest/v1/" + table + "?select=" + col + "&limit=1",
    headers={"apikey": KEY, "Authorization": "Bearer " + TOKEN})
  try:
    urllib.request.urlopen(req).read()
    return True
  except urllib.error.HTTPError as e:
    txt = e.read().decode("utf-8", "replace")
    if "42703" in txt or "does not exist" in txt:
      return False
    # ★★読む 決まりが 無い ときも ここに 来ます。★分けて 返します。
    return None


# ★★①『どこから 消して いるか』。★鍵の 種類まで 見ます。
SRC = []
for d in ("components", "lib", "app"):
  for root, dirs, files in os.walk(os.path.join(ROOT, d)):
    dirs[:] = [x for x in dirs if x not in ("node_modules", "tests")]
    for f in files:
      if f.endswith((".js", ".jsx")):
        SRC.append(os.path.relpath(os.path.join(root, f), ROOT))
SRC.sort()

RAW = {rel: io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
       for rel in SRC}


def admin_file(rel):
  """★裏方の 鍵（service_role）を 使う ファイルか。"""
  r = RAW[rel]
  return ("supabase/admin" in r or "createAdminClient" in r
          or "SUPABASE_SERVICE_ROLE_KEY" in r)


def deletes_of(table):
  out = []
  for rel in SRC:
    raw = RAW[rel]
    for m in re.finditer(r'from\("' + table + r'"\)\s*\n?\s*\.delete\(', raw):
      ln = raw[:m.start()].count("\n") + 1
      out.append({"file": rel, "line": ln, "admin": admin_file(rel)})
  return out


def softwrites_of(table):
  """★『印を つける』書き込みを して いるか。"""
  out = []
  for rel in SRC:
    raw = RAW[rel]
    for m in re.finditer(r'from\("' + table + r'"\)\s*\n?\s*\.update\(\{([^}]*)\}',
                         raw):
      cols = [c for c in SOFT if c in m.group(1)]
      if cols:
        ln = raw[:m.start()].count("\n") + 1
        out.append({"file": rel, "line": ln, "cols": cols})
  return out


login()
rows = []
for t in TABLES:
  cols = []
  unknown = False
  for c in SOFT:
    r = has_column(t, c)
    if r is True:
      cols.append(c)
    elif r is None:
      unknown = True
  dels = deletes_of(t)
  softs = softwrites_of(t)
  ui_dels = [d for d in dels if not d["admin"]]
  if ui_dels:
    cat = 3
  elif cols or softs:
    cat = 1
  else:
    cat = 2
  rows.append({"table": t, "cols": cols, "unknown": unknown,
               "dels": dels, "ui_dels": ui_dels, "softs": softs, "cat": cat})

for r in rows:
  print("%d  %-26s 印:%-28s 消す呼び:%d(画面 %d)"
        % (r["cat"], r["table"], ",".join(r["cols"])[:28] or "—",
           len(r["dels"]), len(r["ui_dels"])))

cat3 = [r for r in rows if r["cat"] == 3]
print("\n★③（repertoire_tessitura と 同じ 形）: " + str(len(cat3)))
for r in cat3:
  for d in r["ui_dels"]:
    print("   " + r["table"] + "  " + d["file"] + ":" + str(d["line"]))

L = []
L.append("# 消す 決まりの 無い 22の 表 ── 3つに 分ける")
L.append("__LINE2__")
L.append("")
L.append("★出どころ 2026-09-14、★No.014 の 続き（★坂本さん）")
L.append("")
L.append("★★22件を「22の 不具合」と 読んでは いけません。")
L.append("　★この 製品は「消さない。印を つける」で 通して います。")
L.append("")
L.append("## 分け方")
L.append("")
L.append("| | 何を 見たか |")
L.append("|---|---|")
L.append("| ① 別の 消し方が ある | 台帳に 尋ねて、印の 列が あるか |")
L.append("| ② 足すだけの 記録 | 消す 呼び出しも 印の 列も 無い |")
L.append("| ③ **同じ 形** | **画面が `.delete()` を 呼ぶ** |")
L.append("")
L.append("★★③の 見分けで いちばん 大事な こと ──")
L.append("　★`.delete()` を 呼ぶ ファイルが、★**どの 鍵を 使うか**。")
L.append("　★★裏方の 鍵（`service_role`）は RLS を 越えます。")
L.append("　　★決まりが 無くても 消えます。★不具合には なりません。")
L.append("　★★画面の 鍵だけが、★黙って 0行に なります。")
L.append("")
L.append("## 分けた 結果")
L.append("")
L.append("| 組 | 表 | 印の 列 | 消す 呼び出し | うち 画面から |")
L.append("|---|---|---|---|---|")
for r in sorted(rows, key=lambda x: (-x["cat"], x["table"])):
  L.append("| " + str(r["cat"]) + " | `" + r["table"] + "` | "
           + (", ".join("`" + c + "`" for c in r["cols"]) or "—") + " | "
           + str(len(r["dels"])) + " | " + str(len(r["ui_dels"])) + " |")
L.append("")
for cat, name in ((3, "③ 同じ 形（★見て いただきたい もの）"),
                  (1, "① 別の 消し方が ある"),
                  (2, "② 足すだけの 記録")):
  sel = [r for r in rows if r["cat"] == cat]
  L.append("## " + name + "　" + str(len(sel)) + "件")
  L.append("")
  if not sel:
    L.append("★ありません。")
    L.append("")
    continue
  for r in sel:
    L.append("- `" + r["table"] + "`")
    if r["cols"]:
      L.append("  - 印の 列 … " + ", ".join("`" + c + "`" for c in r["cols"]))
    for d in r["dels"]:
      L.append("  - 消す 呼び出し … `" + d["file"] + ":" + str(d["line"]) + "`　"
               + ("★裏方の 鍵（RLS を 越えます）" if d["admin"] else "★**画面の 鍵**"))
    for w in r["softs"]:
      L.append("  - 印を つける 書き込み … `" + w["file"] + ":" + str(w["line"])
               + "`　" + ", ".join("`" + c + "`" for c in w["cols"]))
    if not r["dels"] and not r["softs"] and not r["cols"]:
      L.append("  - 消す 呼び出しも 印の 列も ありません。")
  L.append("")
L.append("## 直して いません")
L.append("")
L.append("★★③が あっても、★決まりを 足して いません。")
L.append("　★No.014 と 同じ 段取りで、★お決めを お待ちします。")
L.append("")
L.append("## この 数えが 見て いない こと")
L.append("")
L.append("- 印の 列は **試し用の 企画**に 尋ねました。★本番では ありません。")
L.append("- 「足すだけの 記録」かは、★表に 付けた 注記を 読んで いません。")
L.append("  ★消す 呼び出しも 印の 列も 無い、という ことだけ です。")
L.append("- `.delete()` の 呼び出しは 字で 探します。")
L.append("  ★表の 名前を 組み立てて 渡す 書き方は 見つけられません。")
L.append("- 鍵の 見分けは **ファイル単位** です。")
L.append("  ★1つの ファイルで 2つの 鍵を 使い分けて いると、粗く 出ます。")

body = "\n".join(L)
last = [x for x in body.split("\n") if x.strip()][-1]
body = body.replace("__LINE2__", "全" + str(len(body.split("\n"))) + "行 / 末尾は「"
                    + last + "」")
out = os.path.join(ROOT, "docs", "reports", "2026-09-14-missing-delete-policies.md")
io.open(out, "w", encoding="utf-8").write(body + "\n")
print("\n→ " + out)
