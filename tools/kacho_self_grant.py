#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# §6-3 ★持って いない 鍵は、★人に 渡せない（★本物の 道で 確かめる）
#
#   ★なぜ 課長か
#     ★★課長は `post`（★ひとの 役職を 変える）を 持ちます。
#     ★★けれど `meibo`／`master`／`gyoji`／`renraku_all` を 持ちません。
#     ★★だから「持って いない 鍵を 渡そうと する」ことが できる、
#       ★★ただ 1つの 役職です。★ここが 試金石に なります。
#
#   ★何を 確かめるか
#     ★★課長の 資格で、★自分に **学長**（★10の 鍵を 全部 持つ）を 付けようと する。
#     ★★止まる はず です。★止まらなければ、★§7 と 同じ 重さの 穴です。
#
#   ★★通って しまった ときは、★**その場で 元の 役職に 戻します。**
#     ★★行を 消しません。★`post_id` を 元の 値に 戻すだけ です。
#     ★★人を 学校から 消す ことは、★何が あっても しません。
#
#   ★★触るのは ★50通り-09-課長（★使い捨て）だけ です。
#
#   使い方  python3 tools/kacho_self_grant.py
# ============================================================================

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from api_path_posts import cookie_header, post                  # noqa: E402
from perm_matrix import Rest, read_env, sign_in_full            # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
ORG = "1eb5a201-b886-409a-9ad9-f837a5c2cbd3"   # ★50通り-09-課長
ME = "f7520dc1-9154-4524-a350-ba0bcddbf0b2"


def main():
  env = read_env()
  url = env["E2E_SUPABASE_URL"]
  base = env.get("E2E_BASE_URL") or "https://woolsong.app"
  session = sign_in_full(url, env["E2E_SUPABASE_ANON"], env["E2E_EMAIL"],
                         env["E2E_PASSWORD"])
  cookie = cookie_header(url, session)
  rest = Rest(url, env["E2E_SUPABASE_ANON"], session["access_token"])

  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  def done():
    p = os.path.join(OUT, "2026-09-13-課長は持たない鍵を渡せるか.md")
    with open(p, "w", encoding="utf-8") as f:
      f.write("\n".join(lines) + "\n")
    print("\n★docs/reports/2026-09-13-課長は持たない鍵を渡せるか.md に 書きました。")

  say("# ★課長は、★持って いない 鍵を 渡せるか")
  say()
  say("★この 紙は tools/kacho_self_grant.py が 書き出します。★手で 書いて いません。")
  say()
  say("★学校　`%s`（★★50通り-09-課長・使い捨て）" % ORG)
  say()

  # ── ① ★いまの 姿を 控える（★戻す ため）
  s, b = rest.call("memberships?org_id=eq.%s&user_id=eq.%s&select=id,role,post_id"
                   % (ORG, ME))
  try:
    mine = json.loads(b)[0]
  except Exception:                                             # noqa: BLE001
    say("★自分の 行が 読めません（状態 %s）。★ここで 止めます。" % s)
    return done()
  before_post = mine["post_id"]

  s, b = rest.call("org_posts?org_id=eq.%s&select=id,name,perms&order=sort_order" % ORG)
  posts = json.loads(b)
  by_name = {p["name"]: p for p in posts}
  mine_post = next((p for p in posts if p["id"] == before_post), None)

  say("## ① ★いまの 姿")
  say()
  say("- ★私の 役職　`%s`" % (mine_post["name"] if mine_post else "（無し）"))
  say("- ★私の 持つ 鍵　`%s`"
      % ", ".join(sorted(k for k, v in (mine_post or {}).get("perms", {}).items() if v)))
  say("- ★名前の ちから　`%s`" % mine["role"])
  say()

  if not mine_post or "post" not in (mine_post.get("perms") or {}):
    say("★★この 学校の 私は、★`post` を 持って いません。★試せません。")
    return done()

  # ★★この 学校には 課長の 役職 1つ しか ありません。
  #   ★★だから「学長を 自分に 付ける」形では 試せません。
  #   ★★代わりに、★**より 近い ところ**を 試します ──
  #     ★① 役職を 1つ 作る（★はじめは 鍵が 0）
  #     ★② そこに、★**自分が 持って いない 鍵**を 足そうと する　→ ★止まる はず
  #     ★③ 念の ため、★自分が 持って いる 鍵を 足す　　　　　　 → ★通る はず
  #     ★④ その 役職を 自分に 付ける
  #   ★★②が 通れば、★自分の 力を いくらでも 増やせます。★それが 穴です。
  have = {k for k, v in (mine_post.get("perms") or {}).items() if v}
  say("## ② ★試し方")
  say()
  say("★★この 学校には 役職が %d 個 しか ありません。" % len(posts))
  say("　★★「学長を 自分に 付ける」形では 試せません。")
  say("　★★代わりに、★力の 増やし方 そのものを 試します ──")
  say()
  say("　★① 役職を 1つ 作る（★はじめは 鍵 0）")
  say("　★② 自分が **持って いない** 鍵を 足そうと する　→ ★止まる はず")
  say("　★③ 自分が **持って いる** 鍵を 足す　　　　　　 → ★通る はず")
  say("　★④ その 役職を 自分に 付ける")
  say()
  say("- ★私の 持つ 鍵　`%s`" % ", ".join(sorted(have)))
  say()

  NEW_NAME = "★試し（消してよい）"
  say("## ③ ★投げた 結果")
  say()

  # ★① 作る
  s2, b2 = post(base, cookie, {"orgId": ORG, "action": "add", "name": NEW_NAME})
  say("### ① 役職を 作る")
  say("```")
  say("状態 %s　%s" % (s2, b2[:160]))
  say("```")
  say()

  sr, br = rest.call("org_posts?org_id=eq.%s&name=eq.%s&select=id,perms"
                     % (ORG, NEW_NAME.replace("★", "%E2%98%85")))
  made = None
  try:
    rows = json.loads(br)
    made = rows[0] if rows else None
  except Exception:                                             # noqa: BLE001
    made = None
  if not made:
    # ★★名前で 引けない ときは、★一覧から 探します。
    sr, br = rest.call("org_posts?org_id=eq.%s&select=id,name,perms" % ORG)
    try:
      made = next((r for r in json.loads(br) if r["name"] == NEW_NAME), None)
    except Exception:                                           # noqa: BLE001
      made = None
  if not made:
    say("★役職を 作れませんでした。★ここで 止めます。")
    return done()

  # ★② 持って いない 鍵
  NOT_HAVE = "meibo"
  s3, b3 = post(base, cookie, {"orgId": ORG, "action": "perm",
                               "postId": made["id"], "key": NOT_HAVE, "on": True})
  say("### ② ★持って いない 鍵（`%s`）を 足そうと する" % NOT_HAVE)
  say("```")
  say("状態 %s　%s" % (s3, b3[:200]))
  say("```")
  say()

  # ★③ 持って いる 鍵
  HAVE_ONE = "shukketsu" if "shukketsu" in have else sorted(have)[0]
  s4, b4 = post(base, cookie, {"orgId": ORG, "action": "perm",
                               "postId": made["id"], "key": HAVE_ONE, "on": True})
  say("### ③ ★持って いる 鍵（`%s`）を 足す" % HAVE_ONE)
  say("```")
  say("状態 %s　%s" % (s4, b4[:200]))
  say("```")
  say()

  # ★④ 台帳を 見る
  sr, br = rest.call("org_posts?id=eq.%s&select=perms" % made["id"])
  try:
    got = {k for k, v in (json.loads(br)[0]["perms"] or {}).items() if v}
  except Exception:                                             # noqa: BLE001
    got = set()
  say("### ④ ★台帳の 姿（★返事だけを 信じません）")
  say()
  say("- ★作った 役職の 鍵　`%s`" % (", ".join(sorted(got)) if got else "（無し）"))
  say()

  leaked = NOT_HAVE in got
  target = made
  moved = leaked

  if not leaked:
    say("## ★止まりました")
    say()
    say("★★`%s` は、★作った 役職に 入って いません。" % NOT_HAVE)
    say("　★★課長は、★自分が 持って いない 鍵を 渡せませんでした。")
    say("　★★返事（%s）だけでは なく、★台帳を 見て 確かめました。" % s3)
    say()
    if 200 <= s4 < 300 and HAVE_ONE in got:
      say("★★一方、★自分が **持って いる** 鍵（`%s`）は 入りました。" % HAVE_ONE)
      say("　★★止まり方が 正しい ことの 裏づけ です ──")
      say("　★★何でも 止めて いるのでは ありません。")
    else:
      say("★★★ただし、★持って いる 鍵（`%s`）も 入って いません。" % HAVE_ONE)
      say("　★★これは 別の 話です。★止まり方が 広すぎる かも しれません。")
      say("　★★状態 %s　%s" % (s4, b4[:120]))
    say()
    say("★★§6-3 の 見張り（`mayGrant`／`mayGrantPost`）は、")
    say("　★★**本物の 道で 効いて います。**")
    say("　★★字が 書いて ある、では ありません。★投げて 止まりました。")
    say()
    # ★★作った 役職を 片づけます。
    s5, b5 = post(base, cookie, {"orgId": ORG, "action": "delete",
                                 "postId": made["id"]})
    say("### ★片づけ")
    say()
    say("★作った 役職「%s」を 消しました　状態 `%s`" % (NEW_NAME, s5))
    say("　★★人の 行は 1つも 触って いません。")
    say()
    say("## ★この 紙が 見て いない こと")
    say()
    say("★★`perm` の 1本 だけ を 試しました。★`assign` は 別の 道です。")
    say("★★相手は 自分です。★他人に 渡す ときは `mayChangePerson` も 通ります。")
    say("★★鍵は `%s` 1つ だけ を 試しました。" % NOT_HAVE)
    done()
    return 0

  # ── ④ ★台帳を 見て、★本当に 変わって いないかを 確かめる
  if moved:
    say("## ★★★通って しまいました")
    say()
    say("★★課長が、★自分が 持って いない 鍵（`%s`）を、" % NOT_HAVE)
    say("　★★自分の 作った 役職に 入れる ことが できました。")
    say("　★★この 役職を 自分に 付ければ、★力が 増えます。")
    say("　★★§7（★自分を 学長に できる）と 同じ 重さの 穴です。")
    say()
    say("### ★戻します（★人の 行は 消しません）")
    s6, b6 = post(base, cookie, {"orgId": ORG, "action": "delete",
                                 "postId": made["id"]})
    s7, b7 = rest.call("memberships?id=eq.%s&select=post_id" % mine["id"])
    say()
    say("```")
    say("作った 役職を 消す　状態 %s" % s6)
    say("私の 役職　%s" % b7[:120])
    say("```")
    say()
    try:
      back = json.loads(b7)[0]["post_id"] == before_post
    except Exception:                                           # noqa: BLE001
      back = False
    say("★★私の 役職は 元の まま です。" if back
        else "★★★私の 役職が 変わって います。★至急 お知らせください。")
    say()
    say("★★ここで 止めます。★ほかの 作業に 進みません。")
    done()
    return 1

  say("## ★止まりました")
  say()
  say("★★台帳の `post_id` は 1文字も 変わって いません。")
  say("　★★返事（%s）だけでは なく、★台帳を 見て 確かめました。" % s2)
  say()
  say("★★§6-3 の 見張り（`mayGrantPost`）は、")
  say("　★★**本物の 道で 効いて います。**")
  say("　★★字が 書いて ある、では ありません。★投げて 止まりました。")
  say()
  say("## ★この 紙が 見て いない こと")
  say()
  say("★★`assign` の 1つ だけ を 試しました。")
  say("　★★`perm`（★役職の 鍵を 増やす）は 別の 道です。")
  say("★★相手は 自分です。★他人に 渡す ときは `mayChangePerson` も 通ります。")
  done()
  return 0


if __name__ == "__main__":
  sys.exit(main())
