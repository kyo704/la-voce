#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★組織の 層の 列を、★1行ずつ 並べる
#
#   ★出どころ 2026-09-11、★Opus の お決め（★学年の 札）の ③。
#     ★★「同じ 形の 穴を、★ほかの 列でも 探す」
#
#   ★★1列に つき 1行。★どの 列に ついても、★同じ 3つを 尋ねます ──
#     ★① 学校が 決める ものか、★ご本人が 名乗る ものか
#     ★② 画面から 書いて いるか（★どこから）
#     ★③ いま 歯止めが あるか（★許し・決まり・引き金・アプリ）
#
#   ★★列の 一覧は、★台帳から 取ります（★思い出しで 書きません）。
#     ★★1行 読んで 列の 名前を 見ます。
#
#   使い方  python3 tools/membership_columns.py
# ============================================================================

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from perm_matrix import Rest, read_env, sign_in  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")

# ★★どちらの ものか。★Opus の お決め（2026-09-11）を 写します。
#   ★★「学校」…… ★学校が 決める。★ご本人は 読めるだけ。
#   ★★「本人」…… ★ご本人が 名乗る。
#   ★★「しくみ」… ★人が 決める ものでは ない（★id・日付など）。
WHOSE = {
  "role": ("学校", "★§7 で 済み。role_rank の 階が 歯止め。"),
  "grade_label": ("学校", "★No.004。★2026-09-11 に 決まった。"),
  "post_id": ("学校", "★§7-3 で 済み。★裏口だけ が 書く。"),
  "display_title": ("？", "★中身を 見て いません。★下の「★調べる」を ご覧ください。"),
  "display_title_updated_by": ("しくみ", "★誰が 直したかの 控え。"),
  "display_title_updated_at": ("しくみ", "★いつ 直したかの 控え。"),
  "org_id": ("しくみ", "★つながり先。"),
  "user_id": ("しくみ", "★つながり先。"),
  "id": ("しくみ", "★行の 名前。"),
  "created_at": ("しくみ", "★作られた 日。"),
}

WRITE = re.compile(r"\.(insert|update|upsert)\(")
FROM = re.compile(r'from\("([a-z_]+)"\)')


def sources():
  out = []
  for top in ("components", "lib", "app"):
    for base, _d, files in os.walk(os.path.join(ROOT, top)):
      if "tests" in base:
        continue
      for fn in files:
        if fn.endswith((".js", ".jsx")):
          out.append(os.path.relpath(os.path.join(base, fn), ROOT))
  return sorted(out)


def writers(table):
  """★その 表へ 書いて いる ところを、★列の 名前つきで 集めます。"""
  found = []
  for path in sources():
    with open(os.path.join(ROOT, path), encoding="utf-8") as f:
      src = f.read().split("\n")
    for i, line in enumerate(src):
      if not WRITE.search(line):
        continue
      tb = None
      for j in range(i, max(-1, i - 4), -1):
        m = FROM.search(src[j])
        if m:
          tb = m.group(1)
          break
      if tb != table:
        continue
      block = "\n".join(src[max(0, i - 14):i + 8])
      admin = "admin.from(" in "\n".join(src[max(0, i - 3):i + 1])
      how = ("裏口" if admin else "サーバ") if path.startswith("app/api/") else "ブラウザ 直"
      found.append((path, i + 1, block, how))
  return found


def main():
  env = read_env()
  url, anon = env.get("E2E_SUPABASE_URL"), env.get("E2E_SUPABASE_ANON")
  token = sign_in(url, anon, env["E2E_EMAIL"], env["E2E_PASSWORD"])
  rest = Rest(url, anon, token)

  s, b = rest.call("memberships?select=*&limit=1")
  try:
    cols = list(json.loads(b)[0].keys())
  except Exception:                                             # noqa: BLE001
    cols = []

  w = writers("memberships")
  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★組織の 層の 列 ── ★1列ずつ")
  say()
  say("★この 紙は tools/membership_columns.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★列の 名前は 台帳から 取りました（★1行 読んで 見ました）。")
  say("★★どちらの ものかは、★Opus の お決めを 写して います。")
  say("　★★決まって いない ものには「？」を 置きます。★埋めません。")
  say()
  say("## public.memberships　★" + str(len(cols)) + " 列")
  say()
  say("| 列 | 誰の もの | 画面から 書くか | いまの 歯止め | 覚え書き |")
  say("|---|---|---|---|---|")

  todo = []
  for c in sorted(cols):
    whose, note = WHOSE.get(c, ("？", "★お決めが まだ です。"))
    mine = [x for x in w if re.search(r"\b" + re.escape(c) + r"\b\s*:", x[2])]
    if mine:
      ways = sorted({x[3] for x in mine})
      where = "／".join(ways) + "（%d か所）" % len(mine)
    else:
      where = "★書いて いない"
    if c == "role":
      guard = "★決まり（role_rank）"
    elif c == "grade_label":
      guard = "★★No.004 で 引き金を 立てる（★まだ）"
    elif c == "post_id":
      guard = "★許し 無し ＋ 止める 決まり"
    elif not mine:
      guard = "──"
    else:
      guard = "★★**無し**"
      if whose == "学校":
        todo.append(c)
      elif whose == "？":
        todo.append(c)
    say("| `%s` | %s | %s | %s | %s |" % (c, whose, where, guard, note))
  say()

  say("## ★歯止めの 無い 列")
  say()
  if todo:
    for c in todo:
      whose = WHOSE.get(c, ("？", ""))[0]
      say("- `%s`　★誰の ものか … %s" % (c, whose))
    say()
    say("★★「？」の ものは、★先に お決めが 要ります。")
    say("　★★私が 決めません。★学校が 決める ものか、★ご本人が 名乗る ものか。")
  else:
    say("★ありません。")
  say()

  say("## ★★同じ 層の ほかの 表")
  say()
  say("★★Opus の 挙げられた もの ── ★在籍の 状態（active／withdrawn／on-leave）、")
  say("　★★在籍の 始まり・終わりの 日。★これらは `memberships` では なく")
  say("　★★`enrollments` に あります。★別の 表です。")
  say()
  s2, b2 = rest.call("enrollments?select=*&limit=1")
  try:
    ecols = list(json.loads(b2)[0].keys())
  except Exception:                                             # noqa: BLE001
    ecols = []
  if ecols:
    say("### public.enrollments　★" + str(len(ecols)) + " 列")
    say()
    ew = writers("enrollments")
    say("| 列 | 画面から 書くか |")
    say("|---|---|")
    for c in sorted(ecols):
      mine = [x for x in ew if re.search(r"\b" + re.escape(c) + r"\b\s*:", x[2])]
      ways = sorted({x[3] for x in mine})
      say("| `%s` | %s |" % (c, "／".join(ways) if ways else "★書いて いない"))
    say()
    say("★★`enrollments` の 列は、★どれも まだ 誰の ものか 決まって いません。")
    say("　★★お決めを いただいてから、★同じ 形で 見ます。")
  else:
    say("★`enrollments` の 行が 読めません でした（★0行 か、★読む 許しが 無い）。")
    say("★★列の 名前が 取れないので、★ここは 埋められません。")
    say("　★★使い捨ての 学校に 種を まけば 読めます ──")
    say("　★supabase/2026-09-11-§3-50通り-在籍と受け持ちの種まき.sql")
  say()

  say("## ★この 紙が 見て いない こと")
  say()
  say("★★「画面から 書くか」は、★帳面の 字を 読んだ 結果です。")
  say("　★★実際に 通るか どうかは、★投げて みない と 分かりません。")
  say("　★★`grade_label` は、★2026-09-11 の 朝まで")
  say("　　★「画面が 書いて いる」のに「★誰も 書けない」状態でした。")
  say()
  say("★★「いまの 歯止め」は、★私が 知って いる ぶん です。")
  say("　★★台帳に、★私の 知らない 引き金や 決まりが ある かも しれません。")
  say("　★★確かめる には、★pg_trigger と pg_policies を 見る ほか ありません。")

  p = os.path.join(OUT, "2026-09-11-membership-columns.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★docs/reports/2026-09-11-membership-columns.md に 書きました（全%d行）。"
        % len(lines))
  print("★memberships %d 列／enrollments %d 列" % (len(cols), len(ecols)))
  print("★歯止めの 無い 列　" + ("／".join(todo) if todo else "なし"))
  return 0


if __name__ == "__main__":
  sys.exit(main())
