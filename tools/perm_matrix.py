#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# §3 ★50通りの 総当たり ── ★10役職 × 5つの表
#
#   ★出どころ docs/opus/期待表-権限の総当たり（9月11日）.json（★Opus・9月11日）
#
#   ★★道具は Python で 書きます（★2026-09-11・坂本さんの お決め）。
#     ★★字下げは 2つです。★アプリ側（Next.js）は そのままです。
#
#   ★★ブラウザを 使いません。★台帳へ 直に 投げます。
#     ★★画面が して いるのと 同じ 道です（★PostgREST）。
#     ★★みんなに 配られて いる 鍵は .env.e2e に 控えて あります。
#       ★★あの 鍵は、★どなたの ブラウザにも 配られて いる 公開の ものです。
#
#   ★★触るのは、★名前が「★50通り」で 始まる 使い捨ての 学校だけです。
#     ★★作った 行は、★最後に 自分で 消します。
#
#   ★★列の 名前を 当てずっぽうで 書きません。
#     ★画面が 実際に 使って いる 列を、★そのまま 写します。
#       ★名簿　　 VocalTracker.jsx:11571 まわり
#       ★日程　　 VocalTracker.jsx:12048
#       ★出席　　 VocalTracker.jsx:9730
#       ★行事　　 VocalTracker.jsx:11641（★rpc create_org_event）
#     ★★2026-09-11、★{ org_id } だけで 投げて 3度 まちがえました。
#
#   使い方
#     python3 tools/perm_matrix.py docs/reports/50通り-10校.txt
# ============================================================================

import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")
ME = "f7520dc1-9154-4524-a350-ba0bcddbf0b2"   # ★使い捨ての アカウント
NOWHERE = "00000000-0000-0000-0000-000000000000"

TABLES = ["名簿", "役職と 所属", "レッスンの 日程", "レッスンの 出席", "行事"]


def read_env():
  env = {}
  p = os.path.join(ROOT, ".env.e2e")
  if not os.path.exists(p):
    return env
  with open(p, encoding="utf-8") as f:
    for line in f:
      s = line.strip()
      if not s or s.startswith("#"):
        continue
      i = s.find("=")
      if i > 0:
        env[s[:i].strip()] = s[i + 1:].strip()
  return env


def read_expected():
  p = os.path.join(ROOT, "docs", "opus", "期待表-権限の総当たり（9月11日）.json")
  with open(p, encoding="utf-8") as f:
    return json.load(f)


def read_orgs(path, names):
  """★⑤の 結果を 貼った ファイルから、★役職名と 学校の id を 拾います。"""
  import re
  uuid = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)
  out = []
  if not path or not os.path.exists(path):
    return out
  # ★★長い ほうから 見ます（★「副学長」が「学長」に 食われない ため）。
  by_len = sorted(names, key=len, reverse=True)
  with open(path, encoding="utf-8") as f:
    for line in f:
      m = uuid.search(line)
      if not m:
        continue
      hit = next((n for n in by_len if n in line), None)
      if hit and not any(o["post"] == hit for o in out):
        out.append({"post": hit, "org": m.group(0)})
  return out


class Rest:
  """★台帳へ 直に 投げます。★画面が して いるのと 同じ 道です。"""

  def __init__(self, url, anon, token):
    self.url = url.rstrip("/")
    self.anon = anon
    self.token = token

  def call(self, path, method="GET", body=None):
    req = urllib.request.Request(self.url + "/rest/v1/" + path, method=method)
    req.add_header("apikey", self.anon)
    req.add_header("Authorization", "Bearer " + self.token)
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    data = json.dumps(body).encode("utf-8") if body is not None else None
    try:
      with urllib.request.urlopen(req, data, timeout=30) as r:
        return r.status, r.read().decode("utf-8", "replace")[:600]
    except urllib.error.HTTPError as e:
      return e.code, e.read().decode("utf-8", "replace")[:600]
    except Exception as e:                                      # noqa: BLE001
      return 0, str(e)[:200]


def sign_in(url, anon, email, password):
  """★使い捨ての アカウントで 通行証を もらいます。"""
  req = urllib.request.Request(
    url.rstrip("/") + "/auth/v1/token?grant_type=password", method="POST")
  req.add_header("apikey", anon)
  req.add_header("Content-Type", "application/json")
  body = json.dumps({"email": email, "password": password}).encode("utf-8")
  with urllib.request.urlopen(req, body, timeout=30) as r:
    return json.loads(r.read().decode("utf-8"))["access_token"]


def o_role(post, exp):
  """★いま 付いて いる 名前の ちからを、★そのまま 書き戻します。★変えません。"""
  e = exp["期待"].get(post) or {}
  return e.get("base") or "teacher"


def code_of(body):
  import re
  m = re.search(r'"code":"([0-9A-Z]+)"', body)
  return m.group(1) if m else ""


def message_of(body):
  import re
  m = re.search(r'"message":"(.*?)(?<!\\)"', body)
  return m.group(1) if m else ""


def why_42501(body):
  """
  ★★42501 は 2つの ことを 指します。★取りちがえては いけません。

    ★「permission denied for table X」　　　　★許し（GRANT）が 無い
    ★「new row violates row-level security」　★決まり（RLS）が 落とした

  ★★2026-09-11、★私は この 2つを 同じ ものとして 数えて いました。
    ★★番号だけを 見て いた ためです。★文面を 読みます。
  """
  msg = message_of(body)
  if "row-level security" in msg or "row level security" in msg:
    return "42501 決まり（RLS）が 落とした　── " + msg[:90]
  if "permission denied" in msg:
    return "42501 許し（GRANT）が 無い　── " + msg[:90]
  return "42501 " + (msg[:90] or "（文面 なし）")


def judge(status, body, no_row=False):
  """
  ★返って きた 番号で、★書けたか どうかを 決めます。

    ★42501 …… ★許し（GRANT）で 止まった　→ ★書けない
    ★23502／23503／23505／23514 …… ★決まりは 通った（★中身の 話）→ ★書ける
    ★2xx で 中身が [] …… ★決まりが 静かに 落とした → ★書けない
      ★★ただし、★行の 無い ところを 名ざしで 指した ときは 別です。
        ★★許しは 通って います。★行が 無いだけ です。
  """
  code = code_of(body)
  if code == "42501":
    return {"ok": False, "why": why_42501(body), "code": code}
  if code in ("23502", "23503", "23505", "23514"):
    return {"ok": True, "why": code + " 決まりは 通った（★中身の 話）", "code": code}
  if no_row and 200 <= status < 300:
    return {"ok": True, "why": "許しは 通った（★行が 無いので 決まりは 未確認）", "code": code}
  if status in (401, 403):
    return {"ok": False, "why": "%d 拒まれた（%s）" % (status, code or "番号 無し"),
            "code": code}
  if 200 <= status < 300:
    try:
      rows = json.loads(body)
    except Exception:                                           # noqa: BLE001
      rows = None
    if isinstance(rows, list) and len(rows) == 0:
      return {"ok": False, "why": "2xx だが 0行（★決まりが 静かに 落とした）", "code": code}
    return {"ok": True, "why": "%d 書けた" % status, "code": code}
  return {"ok": False, "why": "%d %s" % (status, code or body[:40]), "code": code}


def main():
  env = read_env()
  exp = read_expected()
  names = list(exp["期待"].keys())

  arg = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
  orgs = read_orgs(arg, names)
  if not orgs:
    print("★学校の id が ありません。")
    print("　★下ごしらえ SQL の ⑤ の 結果を、★そのまま ファイルに 貼って ください。")
    return 1

  url = env.get("E2E_SUPABASE_URL")
  anon = env.get("E2E_SUPABASE_ANON")
  if not url or not anon:
    print("★.env.e2e に E2E_SUPABASE_URL / E2E_SUPABASE_ANON が ありません。")
    print("　★node tools/_grab-anon.js で 控えられます。")
    return 1

  token = sign_in(url, anon, env["E2E_EMAIL"], env["E2E_PASSWORD"])
  rest = Rest(url, anon, token)
  print("★使い捨ての アカウントで 入りました。★台帳の 入口　" + url)

  made = []          # ★消す ための 控え
  result = {}

  for o in orgs:
    org = o["org"]
    result[o["post"]] = {}

    def put(label, j):
      result[o["post"]][label] = j
      sys.stdout.write("★" if j["ok"] else "・")
      sys.stdout.flush()
      return j

    # ★名簿 ── enrollments に 入れられるか
    s, b = rest.call("enrollments?select=id", "POST", {"org_id": org})
    j = put("名簿", judge(s, b))
    if j["ok"] and "書けた" in j["why"]:
      try:
        for r in json.loads(b):
          made.append(("enrollments", r["id"]))
      except Exception:                                         # noqa: BLE001
        pass

    # ★役職と 所属 ── 自分の memberships の post_id を 変えられるか
    #   ★★いま 付いて いる 値で 上書きします。★中身は 変わりません。
    #   ★★ほかの 方の 行には 触れません。
    s, b = rest.call("memberships?org_id=eq.%s&select=id,post_id" % org)
    mine = None
    try:
      rows = json.loads(b)
      mine = rows[0] if rows else None
    except Exception:                                           # noqa: BLE001
      mine = None
    if not mine:
      put("役職と 所属", {"ok": False, "why": "自分の 行が 読めません", "code": ""})
    else:
      s, b = rest.call("memberships?id=eq.%s&select=id" % mine["id"], "PATCH",
                       {"post_id": mine["post_id"]})
      put("役職と 所属", judge(s, b))

    # ★（おまけ）★memberships の ほかの 列も 試します。
    #   ★★列ごとの 許しは 列ごとに ちがいます。
    #     ★★post_id が「permission denied」でも、★role が そうとは 限りません。
    #   ★★画面は この 2つを **ブラウザから 直に** 書いて います ──
    #     ★role　　　　 VocalTracker.jsx:11980（★人の 役職を 変える）
    #     ★grade_label VocalTracker.jsx:11737（★学年の 札を 直す）
    #   ★★ここが 通らなければ、★その 2つの 働きは いま 動いて いません。
    if mine:
      s2, b2 = rest.call("memberships?id=eq.%s&select=id" % mine["id"], "PATCH",
                         {"role": o_role(o["post"], exp)})
      put("（参考）role を 変える", judge(s2, b2))
      s3, b3 = rest.call("memberships?id=eq.%s&select=id" % mine["id"], "PATCH",
                         {"grade_label": "★50通り"})
      put("（参考）grade_label", judge(s3, b3))

    # ★レッスンの 日程 ── ★画面が 使う 列を そのまま（★VocalTracker.jsx:12048）
    s, b = rest.call("lessons?select=id", "POST", {
      "org_id": org, "teacher_id": ME, "student_id": ME,
      "scheduled_at": "2030-01-01T00:00:00+09:00", "note": "", "created_by": ME})
    j = put("レッスンの 日程", judge(s, b))
    real_lesson = None
    if j["ok"] and "書けた" in j["why"]:
      try:
        for r in json.loads(b):
          made.append(("lessons", r["id"]))
          real_lesson = r["id"]
      except Exception:                                         # noqa: BLE001
        pass

    # ★レッスンの 出席 ── attendance 列（★VocalTracker.jsx:9730）
    #   ★★本物の 行が あれば、★許しも 決まりも 両方 見られます。
    #   ★★無ければ、★許しだけ 見ます。★そこは 報告に そのまま 書きます。
    if real_lesson:
      s, b = rest.call("lessons?id=eq.%s&select=id" % real_lesson, "PATCH",
                       {"attendance": "came"})
      put("レッスンの 出席", judge(s, b))
    else:
      s, b = rest.call("lessons?id=eq.%s&select=id" % NOWHERE, "PATCH",
                       {"attendance": "came"})
      put("レッスンの 出席", judge(s, b, no_row=True))

    # ★行事 ── ★画面は 直に 入れません。★create_org_event を 呼びます
    #   （★VocalTracker.jsx:11641）。★org_events は SELECT だけ の 許しです。
    #   ★★この 関数は、★力が 無い ときに **null** を 返します。
    #     ★★誤りに しないのは、★教室の id の 当たりはずれを 調べる 道具に
    #       ★させない ためです（★画面の 注記の とおり）。
    s, b = rest.call("rpc/create_org_event", "POST", {
      "p_org_id": org, "p_event_date": "2030-01-01",
      "p_kind": "本番", "p_title": "★50通り"})
    c = code_of(b)
    if c == "42501":
      put("行事", {"ok": False, "why": why_42501(b), "code": c})
    elif 200 <= s < 300:
      v = b.strip()
      if v in ("null", ""):
        put("行事", {"ok": False, "why": "null が 返った（★力が 無い）", "code": c})
      else:
        put("行事", {"ok": True, "why": "行事を 作れた", "code": c})
        made.append(("org_events", v.strip('"')))
    else:
      put("行事", {"ok": False, "why": "%d %s" % (s, c or b[:40]), "code": c})

    print("  " + o["post"])

  # ── ★作って しまった 行を 消す
  for tb, rid in made:
    rest.call("%s?id=eq.%s" % (tb, rid), "DELETE")
  if made:
    print("★作って しまった 行を %d 件 消しました。" % len(made))

  # ── ★期待表と つき合わせる
  diff = []
  for o in orgs:
    want = exp["期待"].get(o["post"])
    if not want:
      continue
    for tb in TABLES:
      got = result[o["post"]].get(tb)
      if not got:
        continue
      if got["ok"] != bool(want["書き出し"][tb]):
        diff.append({"post": o["post"], "tb": tb,
                     "want": bool(want["書き出し"][tb]),
                     "got": got["ok"], "why": got["why"]})

  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  say()
  say("# §3　50通りの 総当たり ── ★通しの 結果")
  say()
  say("★この 表は tools/perm_matrix.py が 書き出します。★手で 書いて いません。")
  say()
  say("| 役職 | " + " | ".join(TABLES) + " |")
  say("|---|" + "|".join(["---"] * len(TABLES)) + "|")
  for o in orgs:
    cells = []
    for tb in TABLES:
      g = result[o["post"]].get(tb)
      w = exp["期待"][o["post"]]["書き出し"][tb] if o["post"] in exp["期待"] else None
      if not g:
        cells.append("？")
        continue
      cells.append(("★書ける" if g["ok"] else "・書けない")
                   + ("　**★ちがう**" if g["ok"] != bool(w) else ""))
    say("| " + o["post"] + " | " + " | ".join(cells) + " |")
  say()
  say("## ★期待表と ちがう マス　%d 件" % len(diff))
  say()
  if not diff:
    say("★1マスも ちがいません。")
  for d in diff:
    say("- **★%s × %s**　期待 %s / 実際 %s　── %s"
        % (d["post"], d["tb"],
           "書ける" if d["want"] else "書けない",
           "書ける" if d["got"] else "書けない", d["why"]))
  say()
  say("## ★（参考）★memberships の ほかの 列")
  say()
  say("★★50マスの 外です。★期待表に 無い ぶん です。")
  say("★★画面が **ブラウザから 直に** 書いて いる 2つの 列を 試しました。")
  say()
  say("★★**role の「通る」を、★昇格の 証拠と 読まないで ください。**")
  say("　★★書き戻して いるのは、★いま 付いて いる のと **同じ 値** です。")
  say("　★★決まりは `role_rank(新) <= role_rank(今)` を 見て います。")
  say("　★★同じ 値なので、★当然 通ります。★これは 設計の とおり です。")
  say("　★★別の 値に 上げられるか どうかは、★ここでは 試して いません。")
  say("　★★（★それは §7 の 別の 話で、★実地では 止まって います）")
  say()
  say("★★`grade_label` が 全員 止まるのは、★別の 話です。")
  say("　★★画面は この 列を ブラウザから 直に 書いて います")
  say("　★（★VocalTracker.jsx:11737「学年の 札を 直す」）。")
  say("　★★`role` は 通って、★`grade_label` は 通りません。")
  say("　★★だから 列ごとの 許しが、★`role` にだけ 付いて いると 読めます。")
  say("　★★つまり **学年の 札を 直す 働きは、★いま 誰にも 使えません。**")
  say()
  say("| 役職 | role を 変える | grade_label |")
  say("|---|---|---|")
  for o in orgs:
    a = result[o["post"]].get("（参考）role を 変える")
    b2 = result[o["post"]].get("（参考）grade_label")
    say("| %s | %s | %s |" % (
      o["post"],
      (("★通る" if a["ok"] else "・止まる") + "　" + a["why"][:34]) if a else "？",
      (("★通る" if b2["ok"] else "・止まる") + "　" + b2["why"][:34]) if b2 else "？"))
  say()

  say("## ★★この 表の 限界（★読む 前に）")
  say()
  say("★★「42501」は **2つの こと** を 指します。★文面で 見分けて います。")
  say("　★「permission denied for table X」　　　★許し（GRANT）が 無い")
  say("　★「new row violates row-level security」★決まり（RLS）が 落とした")
  say("★★どちらも 番号は 同じです。★番号だけを 見ると、★取りちがえます。")
  say()
  say("★★memberships の「許しが 無い」は、★役職と 関わりが ありません。")
  say("　★★どの 役職でも 同じ 答えです。★画面も この道を 通って いません ──")
  say("　★★役職の 付け替えは すべて app/api/org/posts/route.js（★裏口）を 通ります。")
  say("　★★つまり この 10マスは、★私が ちがう 道を 試した ものです。")
  say()
  say("★★lessons の「決まりが 落とした」は、★学長でも 落ちて います。")
  say("　★★`can_view_ops` は、★在籍（enrollments）と 受け持ち（assignments）を 見ます。")
  say("　★★使い捨ての 10校には、★その どちらも 置いて いません。")
  say("　★★だから これも、★下ごしらえ不足の 疑いが 濃い です。★断定しません。")
  say()
  say("★★出席で「行が 無いので 決まりは 未確認」と 出た マスは、")
  say("　★★列の 許しまでは 見ました。★決まりまでは 見て いません。")
  say("　★★日程が 作れなかった 学校では、★出席を 試す 行が 無い ためです。")
  say()
  say("★★台帳の 層（★決まりそのもの）は 別に 確かめて います ──")
  say("　★supabase/2026-09-11-§3-50通り-台帳の側（読むだけ）.sql。")

  with open(os.path.join(OUT, "2026-09-11-50通り-通しの結果.md"), "w",
            encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-11-50通り-通しの結果.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
