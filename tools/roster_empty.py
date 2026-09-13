#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★名簿の 画面は、★誰かを 出せるのか
#
#   ★出どころ 2026-09-13、★⑥（実機の 確かめ）が 止まった こと。
#     ★★使い捨ての 学校の 名簿が「在籍 0」に なりました。
#     ★★はじめ 私は「種まきが 足りない」と 思いました。★ちがいました。
#
#   ★★字を 並べます。★言い分は 足しません。
#
#   使い方  python3 tools/roster_empty.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "reports")


def read(*parts):
  with open(os.path.join(ROOT, *parts), encoding="utf-8") as f:
    return f.read()


def main():
  lines = []

  def say(t=""):
    print(t)
    lines.append(t)

  roster = read("lib", "orgRoster.js")
  ui = read("components", "OpsRoster.jsx")
  vt = read("components", "VocalTracker.jsx")
  test = read("components", "tests", "org-roster.test.js")

  say("# ★名簿の 画面は、★誰かを 出せるのか")
  say()
  say("★この 紙は tools/roster_empty.py が 書き出します。★手で 書いて いません。")
  say()

  say("## ① ★名簿に 渡される もの")
  say()
  m = re.search(r"const members = (orgMembers\[opsOrgId\] \|\| \[\]);", vt)
  say("```js")
  say("// components/VocalTracker.jsx")
  say(m.group(0) if m else "（見つかりません）")
  say("```")
  say()
  say("★★`orgMembers` は `memberships` を そのまま 入れた ものです ──")
  m2 = re.search(r'supabase\.from\("memberships"\)\.select\("\*"\)\.eq\("org_id", orgId\)', vt)
  say("```js")
  say(m2.group(0) if m2 else "（見つかりません）")
  say("```")
  say()
  say("★★`enrollments` は **別の 入れもの**に 入り、★名簿には 渡されません。")
  say()

  say("## ② ★名簿が 行を 出さない 決め")
  say()
  m3 = re.search(r"export const NOT_COUNTED_ROLES[^\n]*", roster)
  m4 = re.search(r"export function matchesChip[\s\S]*?\n  \}", roster)
  say("```js")
  say("// lib/orgRoster.js")
  say(m3.group(0) if m3 else "")
  say()
  say(m4.group(0) if m4 else "")
  say("```")
  say()
  say("★★1行目で 落ちます。★`owner` `admin` `teacher` `staff` の 4つ とも。")
  say()
  m5 = re.search(r"const list = useMemo\(\(\) => \{[\s\S]*?matchesChip\(m, chip\)[^\n]*", ui)
  say("```js")
  say("// components/OpsRoster.jsx")
  say(m5.group(0) if m5 else "")
  say("```")
  say("★★数えるだけでは ありません。★**行そのものを 出しません。**")
  say()

  say("## ③ ★台帳が 許す `role` の 値")
  say()
  say("```")
  say("memberships_role_check")
  say("CHECK ((role = ANY (ARRAY['owner', 'admin', 'teacher', 'staff'])))")
  say("★空でよいか … NO（★NOT NULL）")
  say("```")
  say("★★2026-09-13、★坂本さんが 台帳に 尋ねて くださった 答えです。")
  say()

  say("## ★★④ 食い違い")
  say()
  say("★★名簿に 出るのは「4つの どれでも ない 方」です。")
  say("★★台帳が 許すのは「4つの どれか」だけ です。★空も 許しません。")
  say()
  say("★★つまり ── ★**名簿は、★どの 学校でも、★誰も 出せません。**")
  say()

  say("## ⑤ ★見張りは 何を 期待して いるか")
  say()
  hits = re.findall(r'\{ role: "([a-z]+)"[^}]*\}', test)
  kinds = sorted(set(hits))
  say("★`components/tests/org-roster.test.js` が 使って いる `role` の 値 ──")
  say()
  for k in kinds:
    say("- `%s`　%s" % (k, "★★台帳が 許しません" if k not in
                       ("owner", "admin", "teacher", "staff") else "★台帳も 許します"))
  say()
  say("★★見張りは `student` を 前提に 書かれて います。")
  say("　★★台帳に その 値は ありません。")
  say("　★★見張りは 作り物の 行を 使うので、★通って しまいます。")
  say("　★★台帳を 見て いないからです。")
  say()

  say("## ⑥ ★`status` の ほうも")
  say()
  say("★★`matchesChip` は `member.status`（★enrolled／paused／invited）を 見ます。")
  say("★★`memberships` に `status` という 列は **ありません**")
  say("　（★2026-09-11 に 10列を 数えました ──")
  say("　★id／org_id／user_id／role／created_at／display_title／")
  say("　★display_title_updated_by／display_title_updated_at／grade_label／post_id）。")
  say("★★だから 札（ようす）の しぼり込みも、★はじめから 働きません。")
  say()

  say("## ★私が まちがえた こと")
  say()
  say("★★はじめ「種まきが 足りない」と 見立てました。")
  say("　★★`role='teacher'` で 相手役を 入れれば 出る、と 思い込んで いました。")
  say("★★次に「`role` を 空に すれば よい」と 申しました。")
  say("　★★`NOT NULL` でした。★坂本さんが 止めて くださいました。")
  say("★★**どちらも、★名簿が 誰を 並べるのかを 読まずに 言いました。**")
  say()

  say("## ★これから どう するか（★私は 決めません）")
  say()
  say("★★台帳を ゆるめる ことは、★ここでは **しません**。")
  say("　★★`NOT NULL` も 4つの 値も、★わざと そう して ある かも しれません。")
  say("　★★分からない まま 広げるのが、★いちばん 危ない ことです。")
  say()
  say("★先に 決めて いただきたい こと ──")
  say()
  say("　★㋐ 生徒は `memberships` に 居るのか、★`enrollments` に 居るのか")
  say("　★㋑ 居るのが `enrollments` なら、★名簿は そちらを 読むべきでは ないか")
  say("　★㋒ `memberships` に 居るなら、★`role` に 5つ目（★student）が 要る")
  say("　★　　★その ときは `status` の 列も 要ります")
  say()
  say("★★どちらに しても、★これは ⑥の 段取りの 話では なく、")
  say("　★★**名簿の 画面が 誰も 出せない**という 話です。")
  say()

  say("## ★⑥は どこまで 見られるか")
  say()
  say("★(a) 学部長が 人の 役職を 変える　　→ ★**見られません**（★名簿が 空）")
  say("★(b) 学長が 変える　　　　　　　　→ ★**見られません**（★同じ 画面）")
  say("★(c) 持って いない 鍵を 渡そうと する → ★**見られます**")
  say("　★★設定の タブ（OpsPosts）は、★名簿を 通りません。")
  say("　★★課長に 付け替えれば、★いま すぐ ご覧いただけます。")
  say()
  say("★★(a)(b) を 見るには、★先に 上の ㋐㋑㋒ の お決めが 要ります。")

  p = os.path.join(OUT, "2026-09-13-名簿が誰も出せない.md")
  with open(p, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("\n★docs/reports/2026-09-13-名簿が誰も出せない.md に 書きました。")
  return 0


if __name__ == "__main__":
  sys.exit(main())
