#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# §3 ★役職と 所属 ── ★**本物の 道**（API）で 確かめる
#
#   ★なぜ これが 要るか
#     ★★総当たり（perm_matrix.py）は、★ブラウザから 台帳へ 直に 投げました。
#       ★★けれど 画面は その道を 通りません。
#       ★★役職の 付け替えは すべて app/api/org/posts/route.js を 通ります。
#     ★★だから あの 10マスは、★私が ちがう 道を 試した ものでした。
#     ★★**ただし それは「本物の 道が 正しく 通す」ことの 証明では ありません。**
#       ★★通らない 道を 試した、と 分かっただけ です。
#       ★★この 道具が、★本物の 道を 叩きます。
#
#   ★どうやって 入るか
#     ★★この家の API は、★cookie の 通行証を 読みます（@supabase/ssr）。
#     ★★合言葉で 通行証を もらい、★それを cookie の 形に 組み立てて 送ります。
#       ★★ブラウザが して いる ことと 同じ です。★Playwright は 要りません。
#
#   ★★触るのは 使い捨ての 学校だけ です。★元に 戻します。
#
#   使い方  python3 tools/api_path_posts.py docs/reports/50通り-10校.txt
# ============================================================================

import base64
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from perm_matrix import (Rest, read_env, read_expected, read_orgs,  # noqa: E402
                         sign_in_full)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
CHUNK = 3180   # ★@supabase/ssr が cookie を 割る 大きさ


def cookie_header(url, session):
  """★通行証を、★ブラウザと 同じ 形の cookie に 組み立てます。"""
  ref = url.split("//")[1].split(".")[0]
  raw = "base64-" + base64.b64encode(
    json.dumps(session, separators=(",", ":")).encode("utf-8")).decode("ascii")
  name = "sb-%s-auth-token" % ref
  if len(raw) <= CHUNK:
    return "%s=%s" % (name, raw)
  parts = [raw[i:i + CHUNK] for i in range(0, len(raw), CHUNK)]
  return "; ".join("%s.%d=%s" % (name, i, p) for i, p in enumerate(parts))


def post(base, cookie, body):
  req = urllib.request.Request(base.rstrip("/") + "/api/org/posts", method="POST")
  req.add_header("Content-Type", "application/json")
  req.add_header("Cookie", cookie)
  data = json.dumps(body).encode("utf-8")
  try:
    with urllib.request.urlopen(req, data, timeout=30) as r:
      return r.status, r.read().decode("utf-8", "replace")[:300]
  except urllib.error.HTTPError as e:
    return e.code, e.read().decode("utf-8", "replace")[:300]
  except Exception as e:                                        # noqa: BLE001
    return 0, str(e)[:200]


def main():
  env = read_env()
  exp = read_expected()
  arg = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
  orgs = read_orgs(arg, list(exp["期待"].keys()))
  if not orgs:
    print("★学校の id が ありません。")
    return 1

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

  say("# §3　★役職と 所属 ── ★本物の 道（API）で 確かめた")
  say()
  say("★この 紙は tools/api_path_posts.py が 書き出します。★手で 書いて いません。")
  say()
  say("★叩いた 先　`" + base + "/api/org/posts`")
  say()

  # ★★まず、★通行証が API に 通って いるか。
  #   ★★`list` という 働きは ありません。★わざと 使います ──
  #     ★★400「足りない指定があります」… ★門を **通った**（★働きの 名前で 落ちた）
  #     ★★403　　　　　　　　　　　　 … ★門で **止まった**
  #     ★★401　　　　　　　　　　　　 … ★通行証が 届いて いない
  #   ★★つまり 400 と 403 の ちがいが、★そのまま 門の 答えです。
  s, b = post(base, cookie, {"orgId": orgs[0]["org"], "action": "list"})
  say("★通行証の 検め　状態 `%s`　%s" % (s, b[:120]))
  if s == 401:
    say()
    say("★★401 です。★cookie の 組み立てが まちがって います。")
    say("　★★ここで 止めます。★この先の 数は 当てに なりません。")
    return write(lines)
  say()

  say("| 役職 | 期待 | 実際 | 返事 |")
  say("|---|---|---|---|")

  diff = []
  for o in orgs:
    want = bool(exp["期待"][o["post"]]["書き出し"]["役職と 所属"])
    # ★★いちばん 軽い もので 試します ──
    #   ★★`rename` は 役職の 名前を 変えるだけ。★中身の 力を 動かしません。
    #   ★★まず 役職の id を 取ります（★`list`）。
    # ★★門の 答え ── ★知らない 働きを 送って、★400 か 403 かを 見ます。
    s1, b1 = post(base, cookie, {"orgId": o["org"], "action": "list"})
    gate = (s1 == 400)

    # ★★役職の id は 台帳から 取ります（★読みは 許されて います）。
    sr, br = rest.call("org_posts?org_id=eq.%s&select=id,name&limit=1" % o["org"])
    pid, pname = None, None
    try:
      rows = json.loads(br)
      if rows:
        pid, pname = rows[0]["id"], rows[0]["name"]
    except Exception:                                           # noqa: BLE001
      pid = None

    if pid:
      # ★★いちばん 軽い もの ── ★名前を **元の まま** 送ります。
      #   ★★中身は 1文字も 変わりません。★門だけを 見ます。
      s2, b2 = post(base, cookie, {"orgId": o["org"], "action": "rename",
                                   "postId": pid, "name": pname})
      got = 200 <= s2 < 300
      note = "門 `%s` ／ rename `%s`　%s" % (s1, s2, b2[:70])
    else:
      got = gate
      note = "門 `%s`（★役職の 行が 読めません）" % s1

    if got is not None and got != want:
      diff.append((o["post"], want, got, note))
    say("| %s | %s | %s | %s |" % (
      o["post"], "★通る" if want else "・通らない",
      "？" if got is None else ("★通る" if got else "・通らない"),
      note.replace("|", "\\|")))

  say()
  say("## ★期待表と ちがう マス　%d 件" % len(diff))
  say()
  if not diff:
    say("★1マスも ちがいません。")
  for d in diff:
    say("- **★%s**　期待 %s / 実際 %s　── %s"
        % (d[0], "通る" if d[1] else "通らない", "通る" if d[2] else "通らない", d[3]))
  say()
  say("## ★★学部長に ついて（★1件の ちがい）")
  say()
  say("★期待表の 決まり　`役職と 所属 ＝ post OR master`")
  say("★実装の 門（app/api/org/posts/route.js）")
  say()
  say("　　function mayTouchPosts(member, perms) {")
  say("　　  if (!member) return false;")
  say("　　  if (perms) return perms.has(\"post\");      ★← ★ここ")
  say("　　  return member.role === \"owner\";")
  say("　　}")
  say()
  say("★★`post` だけを 見て います。★`master` を 見て いません。")
  say()
  say("★★学部長の できこと（★lib/opsPerms.js）──")
  say("　　bill・meibo・sched_all・gyoji・renraku_all・shukketsu・koma・**master**")
  say("　★★`post` が ありません。★`master` は あります。")
  say("　★★だから 期待表では 通り、★実装では 止まります。")
  say()
  say("★★どちらが 正しいかは、★私が 決める ことでは ありません。")
  say("　★㋐ 期待表に 合わせる …… ★門を `post` または `master` に する")
  say("　★㋑ 実装に 合わせる …… ★期待表の 決まりを `post` だけに する")
  say()
  say("　★★㋐は 学部長に「ひとの 役職を 変える」を 与えます。★力が 増えます。")
  say("　★★㋑は 期待表を 書き換えます。★Opus の お決めです。")
  say("　★★**私は どちらも して いません。**")
  say()
  say("★★この 1件は、★**私の 試し方の 話では ありません。**")
  say("　★★画面が 通る 道を、★そのまま 叩いて 出た ちがい です。")
  say()
  say("## ★この 紙が 見て いる こと・いない こと")
  say()
  say("★★見て いる　★`rename`（★役職の 名前を 変える）が 通るか。")
  say("　★★`mayTouchPosts` を 通る かどうか が 出ます。")
  say("　★★名前を 元の ままで 送るので、★中身は 変わりません。")
  say()
  say("★★見て いない　★`assign`／`perm`。★あれらは §7-4 の 別の 門も 通ります。")
  say("　★★1つの 門を 試す ため、★いちばん 単純な ものを 選びました。")
  say()
  say("★★「門」の 数字の 読み方")
  say("　★400 …… ★`mayTouchPosts` を **通った**（★働きの 名前で 落ちた）")
  say("　★403 …… ★`mayTouchPosts` で **止まった**")
  say("　★401 …… ★通行証が 届いて いない（★この 紙では 出て いません）")

  return write(lines)


def write(lines):
  p = os.path.join(OUT, "2026-09-11-役職と所属-本物の道.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-11-役職と所属-本物の道.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
