#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★2つの 層を、★1つの 中で 混ぜて いないか（★裁定 その55／その57）。

  ★出どころ 2026-09-14。★弁護士の 確認を 取らない と 決めた ので、
    ★分けて ある ことを **機械で** 守ります。★気持ちでは 守りません。

  ★★禁じる こと
    ★`entries`（★体調の 層）と、
    ★`enrollments` ／ `memberships` ／ `org_*` など（★学校の 層）を、
    ★**1つの 問い・1つの 関数・1つの 書き出し**で 一緒に 読む こと。

  ★★だめな 例
    ★`JOIN entries ON enrollments`
    ★学年別／門下別／先生別 の 体調の 数
    ★「3年生の 記録率」── ★これも つなぎ合わせ です

  ★★よい 例
    ★学校の 層どうしを つなぐ（★名簿と 出欠、名簿と 日程）
    ★1人の 方が ご自分の ものを 書き出す（★どちらの 層も 入ります）

  ★★★名前では なく **表**で 見ます。
    ★★名前で 見ると、★別の 名前の 関数が 素通りします。

  ★★見る 単位
    ★① SQL の 関数・ビューの **中身**
    ★② 画面・サーバの **1つの 問い**（★PostgREST の 埋め込みを 含む）
    ★③ 書き出しの 表の 並び
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★★体調の 層。★人が 自分で 書いた もの。
HEALTH = ["entries", "cycle_periods"]

# ★★学校の 層。★学校から お預かりした もの・学校の しくみ。
ORG = ["enrollments", "memberships", "assignments", "organizations",
       "org_events", "org_invitations", "org_messages", "org_posts",
       "org_message_reads", "teacher_student_links", "teacher_invitations",
       "lessons", "attendance", "notice_targets", "org_master"]

# ★★1人の 方が ご自分の ものを 扱う ところ。★ここは 混ざって よい。
#   ★★書き出し・退会・控えは、★その 方 1人の ものを 集めます。
#   ★★つなぎ合わせでは ありません。★同じ 人の ものを 並べるだけ です。
ALLOWED_FILES = [
  "lib/exportData.js",        # ★ご自分の 書き出し
  "lib/accountDeletion.js",   # ★退会の ときに 消す 表の 並び
  "lib/backupTables.js",      # ★控えの 表の 並び
  "lib/authUserReferences.js",  # ★人の id を 持つ 列の 並び
  "lib/orgClosure.js",        # ★教室を 閉じる ときの 表の 並び
  "tools/layer_join_guard.py",
]


def word(t):
  return r'\b' + re.escape(t) + r'\b'


def scan_sql():
  """★関数・ビューの 中身で、★2つの 層が 一緒に 出て いないか。"""
  out = []
  base = os.path.join(ROOT, "supabase")
  for root, dirs, files in os.walk(base):
    for f in sorted(files):
      if not f.endswith(".sql"):
        continue
      rel = os.path.relpath(os.path.join(root, f), ROOT)
      retired = "/retired/" in rel.replace("\\", "/")
      s = io.open(os.path.join(root, f), encoding="utf-8").read()
      for m in re.finditer(
          r'create\s+(?:or\s+replace\s+)?(function|view)\s+(?:public\.)?([a-z_0-9]+)',
          s, re.I):
        kind, name = m.group(1).lower(), m.group(2)
        body = s[m.start():m.start() + 8000]
        end = body.find("$$;")
        if end > 0:
          body = body[:end]
        elif kind == "view":
          end = body.find(";")
          body = body[:end] if end > 0 else body
        h = sorted({t for t in HEALTH if re.search(word(t), body)})
        o = sorted({t for t in ORG if re.search(word(t), body)})
        if h and o:
          out.append({"file": rel, "kind": kind, "name": name,
                      "health": h, "org": o, "retired": retired})
  return out


def scan_js():
  """★1つの 問いの 中で、★2つの 層が 一緒に 出て いないか。

    ★★PostgREST は、★1つの `select()` の 中に ほかの 表を 埋められます。
      `select("*, org:organizations(*)")`
    ★★これが「1つの 問いで つなぐ」形です。
  """
  out = []
  for d in ("components", "lib", "app"):
    base = os.path.join(ROOT, d)
    if not os.path.isdir(base):
      continue
    for root, dirs, files in os.walk(base):
      dirs[:] = [x for x in dirs if x not in ("node_modules", "tests")]
      for f in sorted(files):
        if not f.endswith((".js", ".jsx")):
          continue
        rel = os.path.relpath(os.path.join(root, f), ROOT)
        if rel.replace("\\", "/") in ALLOWED_FILES:
          continue
        s = io.open(os.path.join(root, f), encoding="utf-8").read()
        # ★★`.from("X")` から、★その 問いの 終わりまでを 見ます。
        for m in re.finditer(r'\.from\("([a-z_0-9]+)"\)', s):
          tbl = m.group(1)
          fam = "health" if tbl in HEALTH else ("org" if tbl in ORG else None)
          if fam is None:
            continue
          seg = s[m.end():m.end() + 500]
          # ★★1つの 問いの 終わり。★`;` か 次の `.from(` まで。
          cut = seg.find(";")
          nxt = seg.find('.from("')
          if nxt >= 0 and (cut < 0 or nxt < cut):
            cut = nxt
          if cut > 0:
            seg = seg[:cut]
          other = HEALTH if fam == "org" else ORG
          hit = sorted({t for t in other if re.search(word(t), seg)})
          if hit:
            ln = s[:m.start()].count("\n") + 1
            out.append({"file": rel, "line": ln, "from": tbl,
                        "other": hit, "text": seg.strip()[:90]})
  return out


sqlhits = scan_sql()
jshits = scan_js()
live_sql = [x for x in sqlhits if not x["retired"]]
ret_sql = [x for x in sqlhits if x["retired"]]

print("★体調の 層: " + ", ".join(HEALTH))
print("★学校の 層: " + ", ".join(ORG))
print()
print("① 台帳の 関数・ビュー")
print("　★生きて いる 紙で 混ざって いる: " + str(len(live_sql)))
for x in live_sql:
  print("  ✗ " + x["name"] + "（" + x["kind"] + "）  "
        + ", ".join(x["health"]) + " ＋ " + ", ".join(x["org"]))
  print("      " + x["file"])
if not live_sql:
  print("  ✓ ありません")
print("　★片づけた 紙: " + str(len(ret_sql)))
for x in ret_sql:
  print("  （" + x["name"] + "  " + x["file"] + "）")
print()
print("② 画面・サーバの 1つの 問い")
print("　★混ざって いる: " + str(len(jshits)))
for x in jshits:
  print("  ✗ " + x["file"] + ":" + str(x["line"])
        + "  from(" + x["from"] + ") ＋ " + ", ".join(x["other"]))
  print("      " + x["text"])
if not jshits:
  print("  ✓ ありません")
print()
print("★★のけて いる ファイル（★1人の 方の ものを 集める ところ）")
for f in ALLOWED_FILES:
  if f.startswith("tools/"):
    continue
  print("  ・" + f)
print()
bad = len(live_sql) + len(jshits)
print(("★★通りました。★層は 分かれて います。" if bad == 0
       else "★★" + str(bad) + " か所で 混ざって います。"))
print()
print("★★この 見張りが 見て いない こと")
print("　★字の 並びだけ を 見ます。★台帳に 直に 作った 関数は 見えません。")
print("　★1つの 問いの 終わりを、★`;` か 次の `.from(` で 決めて います。")
print("　★2つの 問いの 結果を、★あとで JavaScript で つなぐ ことは 見えません。")
sys.exit(0 if bad == 0 else 1)
