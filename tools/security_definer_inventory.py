#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★SECURITY DEFINER の 関数を 並べる（★裁定 その51 CONDITION_2）。

  ★★なぜ 要るか。
    ★★SECURITY DEFINER の 関数は、★**RLS を 越えます**。
      ★呼んだ 人の 権限では なく、★作った 人の 権限で 動きます。
    ★★だから「名前で 見張る」のでは 足りません。
      ★★別の 名前で 同じ ことを する 関数が 足されたら、★素通りします。
    ★★見るべきは **どの 表を 読むか** です。

  ★★私は 台帳に 尋ねられません（★pg_proc は 匿名に 開いて いません）。
    ★★だから 2つ 出します ──
      ★① この 倉庫の SQL から 読み取れる 分
      ★② 坂本さんに 台帳で 流して いただく 問い
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQL = os.path.join(ROOT, "supabase")

TABLES = ["entries", "profiles", "memberships", "enrollments", "assignments",
          "org_messages", "org_events", "org_invitations", "teacher_student_links",
          "teacher_notes", "cycle_periods", "notes", "article_notes",
          "repertoire_tessitura", "role_master", "project_master", "lessons",
          "org_posts", "organizations", "subscriptions", "feedback"]

found = []
for root, dirs, files in os.walk(SQL):
  for f in sorted(files):
    if not f.endswith(".sql"):
      continue
    rel = os.path.relpath(os.path.join(root, f), ROOT)
    s = io.open(os.path.join(root, f), encoding="utf-8").read()
    for m in re.finditer(
        r'create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_0-9]+)\s*\(',
        s, re.I):
      name = m.group(1)
      body = s[m.start():m.start() + 6000]
      end = body.lower().find("$$;")
      if end > 0:
        body = body[:end]
      sd = bool(re.search(r'security\s+definer', body, re.I))
      reads = sorted({t for t in TABLES
                      if re.search(r'\b(?:from|join|update|insert into|delete from)\s+'
                                   r'(?:public\.)?' + t + r'\b', body, re.I)})
      found.append({"file": rel, "name": name, "sd": sd, "reads": reads,
                    "retired": "/retired/" in rel.replace("\\", "/")})

sd = [x for x in found if x["sd"]]
live = [x for x in sd if not x["retired"]]
ret = [x for x in sd if x["retired"]]

print("★この 倉庫の SQL に ある 関数: " + str(len(found)))
print("　★うち SECURITY DEFINER: " + str(len(sd))
      + "（★生きて いる 紙 " + str(len(live)) + " ／ 片づけた 紙 " + str(len(ret)) + "）")
print()
print("★生きて いる 紙の SECURITY DEFINER")
for x in live:
  print("  " + x["name"] + "　読む 表: "
        + (", ".join(x["reads"]) if x["reads"] else "（読み取れません）"))
  print("      " + x["file"])
print()
print("★片づけた 紙の SECURITY DEFINER（★流して いません）")
for x in ret:
  print("  " + x["name"] + "　読む 表: " + ", ".join(x["reads"]))
  print("      " + x["file"])
print()
danger = [x for x in live if "entries" in x["reads"]]
print("★★`entries` を 読む SECURITY DEFINER（★生きて いる 紙）: " + str(len(danger)))
for x in danger:
  print("  ✗ " + x["name"] + "　" + x["file"])
if not danger:
  print("  ✓ ありません")

print()
print("★★この 数えが 見て いない こと")
print("　★この 倉庫の SQL だけ です。★台帳に 直に 作った ものは 見えません。")
print("　★だから、★下の 問いを 台帳で 流して いただく 必要が あります。")
print()
print("-- ★台帳で 流す 問い（★SQL Editor）")
print("select p.proname, p.prosecdef,")
print("       pg_get_functiondef(p.oid) like '%entries%' as entries_を読む")
print("  from pg_proc p join pg_namespace n on n.oid = p.pronamespace")
print(" where n.nspname = 'public' and p.prosecdef")
print(" order by p.proname;")
