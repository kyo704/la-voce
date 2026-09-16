#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★Supabase は、★ある人の 端末（セッション）の 一覧を くれるか。

  ★★出どころ　坂本さん（★2026-09-16）──
    「★OPTIONAL, 30 minutes, report only:
      ★can Supabase list active sessions for a user?
      ★if yes: this becomes buildable and ㉚'s trigger has fired
      ★if no: it stays in category 3 permanently
      ★do not build either way. report」

  ★★この 家の 決め（★2026-09-15）──
    「★紙だけで 結ばない こと。★台帳に 直接 照会して 裏を 取る 工程を 挟む。」
  ★★私は 台帳（データベース）に 触れません。★だから ここでは 2つに 分けます ──
    ★① 手元の 書物から 分かる こと …… ★ここで 結びます
    ★② 台帳を 見ないと 分からない こと …… ★問いを 書いて、★お渡しします
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports", "2026-09-16-端末の一覧は取れるか.md")
SQL = os.path.join(ROOT, "supabase", "問い-端末の一覧が取れるか.sql")

ADMIN = os.path.join(ROOT, "node_modules", "@supabase", "auth-js",
                     "dist", "module", "GoTrueAdminApi.d.ts")
TYPES = os.path.join(ROOT, "node_modules", "@supabase", "auth-js",
                     "dist", "module", "lib", "types.d.ts")

for p in (ADMIN, TYPES):
  if not os.path.exists(p):
    print("★★ありません: " + os.path.relpath(p, ROOT))
    print("　★調べません。★止まります（★npm install が 要ります）。")
    sys.exit(1)

admin = io.open(ADMIN, encoding="utf-8").read()
types = io.open(TYPES, encoding="utf-8").read()

# ★★admin の 上に 生えて いる 手を、★そのまま 数えます。
methods = sorted(set(re.findall(r"^\s{4}(\w+)\(", admin, re.M)))
methods = [m for m in methods if not m.startswith("_") and m not in ("constructor",)]

# ★★「一覧」に 当たる 手が あるか。
lists = [m for m in methods if m.lower().startswith("list")]
session_words = [m for m in methods if "session" in m.lower()]

# ★★User の 姿に、★端末の 影が あるか。
um = re.search(r"export interface User \{[\s\S]{0,3000}?\n\}", types)
user_fields = sorted(set(re.findall(r"^\s{4}(\w+)\??:", um.group(0), re.M))) if um else []
user_has_sessions = "sessions" in user_fields
user_has_last = "last_sign_in_at" in user_fields

pkg = io.open(os.path.join(ROOT, "package.json"), encoding="utf-8").read()
ver = re.search(r'"@supabase/supabase-js":\s*"([^"]+)"', pkg)
ver = ver.group(1) if ver else "?"

# ══════════ ★台帳への 問い（★私は 走らせません）══════════
sql = """-- ★端末（セッション）の 一覧は 取れるか ── ★調べる ためだけ の 問い
--
--   ★出どころ　坂本さん（★2026-09-16・台帳 ㉚ の 引き金）
--
--   ★★これは **読むだけ** です。★1行も 書きません。★1つも 変えません。
--     ★BEGIN / ROLLBACK を 使って いません（★2026-09-15 の 決め）。
--     ★あの とき、★SQL Editor が ROLLBACK を 効かせず、
--     ★坂本さんの お手元に 権限が 残りました。★二度と しません。
--
--   ★Supabase の SQL Editor に そのまま 貼って、★結果を お知らせ ください。

-- ══════════ ① auth.sessions は 在るか。★何を 持って いるか ══════════
select
  c.relname                          as 表の名,
  a.attname                          as 列の名,
  format_type(a.atttypid, a.atttypmod) as かた
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where n.nspname = 'auth'
  and c.relname in ('sessions', 'refresh_tokens')
order by c.relname, a.attnum;

-- ══════════ ② いま 何行 あるか（★中身は 見ません。★数だけ）══════════
select 'auth.sessions' as 表, count(*) as 行 from auth.sessions
union all
select 'auth.refresh_tokens', count(*) from auth.refresh_tokens;

-- ══════════ ③ PostgREST から 見えて いるか（★見えては いけません）══════════
select
  grantee as だれに,
  table_schema || '.' || table_name as なにを,
  privilege_type as なにが
from information_schema.role_table_grants
where table_schema = 'auth'
  and table_name in ('sessions', 'refresh_tokens')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
order by grantee, table_name;

-- ══════════ ④ いま この 家に、auth を 読む 関数が あるか ══════════
select
  p.proname as 関数,
  p.prosecdef as 持ち主の力で動くか,
  pg_get_function_identity_arguments(p.oid) as ひきすう
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and pg_get_functiondef(p.oid) ilike '%auth.sessions%'
order by p.proname;
"""
io.open(SQL, "w", encoding="utf-8").write(sql)

# ══════════ ★報告 ══════════
L = []
A = L.append
A("# 端末（セッション）の 一覧は 取れるか")
A("")
A("★出どころ　坂本さん（2026-09-16）／★台帳 ㉚ の 引き金")
A("★REPORT_ONLY ── 作って いません。1行も 足して いません。")
A("")
A("## 答え（いまの ところ）")
A("")
A("★**ライブラリからは 取れません。** ★台帳から なら、**たぶん 取れます。**")
A("★★けれど、★**たぶん** で 引き金を 引きません。★問いを お渡しします。")
A("")
A("---")
A("")
A("## ① ライブラリ ── ★取れません（★手元の 書物で 結べます）")
A("")
A("★`@supabase/supabase-js@" + ver + "` の `auth.admin` に 生えて いる 手を、")
A("★そのまま 数えました（★" + os.path.relpath(ADMIN, ROOT) + "）。")
A("")
A("| | |")
A("|---|---|")
A("| 手の 数 | " + str(len(methods)) + " |")
A("| 「一覧」の 手 | " + (", ".join("`" + x + "`" for x in lists) if lists else "なし") + " |")
A("| 名に session を 持つ 手 | "
  + (", ".join("`" + x + "`" for x in session_words) if session_words else "**ありません**") + " |")
A("| `User` の 姿に `sessions` | " + ("在り" if user_has_sessions else "**ありません**") + " |")
A("| `User` の 姿に `last_sign_in_at` | " + ("在り" if user_has_last else "なし") + " |")
A("")
A("★★`signOut(jwt, scope)` は 在ります。★けれど これは **切る** 手 です。")
A("　★しかも、★切りたい その 端末の jwt を **もう 持って いる** ことが 要ります。")
A("　★★**数えられません。** 数えられない ものを「（2台）」とは 書けません。")
A("")
A("★★`listUsers()` は 人の 一覧 です。★端末の 一覧では ありません。")
A("")
A("---")
A("")
A("## ② 台帳 ── ★たぶん 取れます。★けれど 確かめて いません")
A("")
A("★Supabase の 認証（GoTrue）は、★`auth` という 別の 棚に 表を 持って います。")
A("★そこに `auth.sessions` が 在る はず です ── ★端末の 名乗りと、★最後に 使った 時刻。")
A("")
A("★★**「はず」です。★私は 見て いません。**")
A("　★★2026-09-15、★紙だけ 読んで `lessons` の 決まりを 逆に 報告しました。")
A("　　★書物に 無い 決まりが、★台帳には 在りました。")
A("　★★あれ以来、★紙で 結んだ ことは、★台帳に 聞いてから 言います。")
A("")
A("★取れると したら、★道は これ 1つ です ──")
A("")
A("```")
A("public.my_devices()  ── SECURITY DEFINER")
A("   auth.sessions から、auth.uid() の 行だけ を 返す")
A("   revoke all from public, anon, authenticated")
A("   grant execute to authenticated")
A("```")
A("")
A("★★この 家に 同じ 形が 2つ あります ── `get_student_entries`／`admin_entry_stats`。")
A("　★だから 新しい 仕掛けでは ありません。")
A("")
A("★★けれど、★これは **認証の 棚に 手を 入れる** ことです。")
A("　★★この 家で いちばん 触って いない ところ です。")
A("　★★私の 一存で 進める ものでは ありません。")
A("")
A("---")
A("")
A("## ③ お願い ── 問いを 1つ 走らせて いただけますか")
A("")
A("★" + os.path.relpath(SQL, ROOT))
A("")
A("★**読むだけ** です。1行も 書きません。1つも 変えません。")
A("★`BEGIN` / `ROLLBACK` を 使って いません（2026-09-15 の 決め）。")
A("")
A("★4つ 聞きます ──")
A("")
A("1. `auth.sessions` は 在るか。どんな 列を 持つか（★名乗り・時刻が 要ります）")
A("2. いま 何行 あるか（★中身は 見ません。数だけ）")
A("3. `anon` / `authenticated` から 見えて いないか（★見えては いけません）")
A("4. すでに `auth.sessions` を 読む 関数が ないか")
A("")
A("---")
A("")
A("## ④ 結果に よって どう なるか")
A("")
A("| ①の 答え | ㉚ は |")
A("|---|---|")
A("| 列が 在り、名乗りと 時刻を 持つ | ★引き金が **引けます**。作れる ように なります |")
A("| 表が 無い／列が 足りない | ★3つめの 組（除外）の まま です |")
A("| すでに 見えて しまって いる | ★★**別件**です。先に そちらを 閉じます |")
A("")
A("★★③ が もし 出たら、★触覚より 先です。★すぐ お知らせ ください。")
A("")
A("---")
A("")
A("## ⑤ 決めて いただく こと")
A("")
A("★取れると 分かった としても、★**作るかは 別の お決め** です。")
A("")
A("★★1つ お伝えして おきます ── ★見本の「（2台）」は 数を 出します。")
A("　★数を 出す なら、★**いま 何台 つながって いるか**を 数える ことに なります。")
A("　★それは「見る」だけの 画面では ありません。")
A("　★★見た 人は、★次に「★切りたい」と 思います。")
A("　★★切る 手（`signOut`）は 在りますが、★jwt が 要ります ── ★持って いません。")
A("　★★つまり「★見えるが 切れない」画面に なり ます。")
A("　　★これも 押せない 札 に 近い 形 です。")
A("　★★作る ときは、そこまで 含めて お決め ください。")

io.open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
body = io.open(OUT, encoding="utf-8").read().rstrip("\n").split("\n")
hdr = "全%d行 / 末尾は「%s」" % (len(body) + 1, body[-1])
io.open(OUT, "w", encoding="utf-8").write(body[0] + "\n" + hdr + "\n"
                                          + "\n".join(body[1:]) + "\n")

print("OUT: " + os.path.relpath(OUT, ROOT))
print("SQL: " + os.path.relpath(SQL, ROOT))
print("LINES: %d" % (len(body) + 1))
print("ADMIN_METHODS: %d" % len(methods))
print("SESSION_METHODS: %s" % (",".join(session_words) or "none"))
print("USER_HAS_SESSIONS: %s" % ("yes" if user_has_sessions else "no"))
print("LIB_CAN_LIST: no")
