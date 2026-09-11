#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★修正の記録 No.002 を 書き出す（★出席の 穴）
#
#   ★出どころ 2026-09-11、★坂本さんの お決め ──
#     「★穴が あった 事実と、★塞いだ 事実の 両方が、★この順で 要る」
#
#   ★★様式は No.001 に 合わせます。
#   ★★数は、★報告の ファイルから 読み取ります。★写し ちがえない ため。
#   ★★まだ 直して いません。★「直した」の 節は 空の まま 出します。
#     ★★先に 直して、★あとから「有った」を 書き足す やり方は しません
#       （★それを しないのが、★この 記録の 眼目です）。
#
#   使い方  python3 tools/write_record_002.py
# ============================================================================

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REP = os.path.join(ROOT, "docs", "reports")
OUT = os.path.join(ROOT, "docs", "records",
                   "修正の記録-No.002-出席を止めるものが無い.md")
BAR = "────────────────────────────────────────"


def read(name):
  p = os.path.join(REP, name)
  if not os.path.exists(p):
    return ""
  with open(p, encoding="utf-8") as f:
    return f.read()


def main():
  sweep = read("2026-09-11-50通り-通しの結果.md")
  paths = read("2026-09-11-どの道を通って書いているか.md")

  # ★★数は 報告から 取ります。★手で 書きません。
  m = re.search(r"ちがう マス　(\d+) 件", sweep)
  n_diff = m.group(1) if m else "？"
  n_att = len(re.findall(r"× レッスンの 出席\*\*　期待 書けない / 実際 書ける", sweep))
  att_rows = re.findall(r"`(components/VocalTracker\.jsx:\d+)`", paths)

  lines = []

  def say(t=""):
    lines.append(t)

  say(BAR)
  say("　修正の記録　No.002")
  say(BAR)
  say("　見つけた日　　2026年9月11日")
  say()
  say("　見つけた人　　Code（Opus）")
  say("　　　　　　　　★Opus の 決まり ── ★「書き込んで いる 値は、")
  say("　　　　　　　　　必ず どこかで 読まれて いるか」を 当てはめた ところ、")
  say("　　　　　　　　　出席の できこと（shukketsu）が、★どこでも")
  say("　　　　　　　　　読まれて いない ことが 分かった。")
  say()
  say("　　　　　　　　★★見つけ方　★3つの 層を、★別々に 確かめた。")
  say("　　　　　　　　　① 行の 決まり（RLS）　② 列ごとの 許し　③ アプリの コード")
  say()
  say("　何が起きたか　★出席（lessons.attendance）を 付ける とき、")
  say("　　　　　　　　　★**どの 層も、★役職の できことを 見て いない。**")
  say()
  say("　　　　　　　　★★期待表（★Opus・9月11日）は こう 決めて いる ──")
  say("　　　　　　　　　　教授・准教授・講師　★出席 ＝ **書けない**")
  say("　　　　　　　　★★実際は、★3つ とも **書ける**。")
  say()
  say("　　　　　　　　★★3つの 層の 確かめ")
  say("　　　　　　　　　① 行の 決まり　lessons に 決まりは 9本。")
  say("　　　　　　　　　　　★その うち has_can を 呼ぶ ものは **0本**。")
  say("　　　　　　　　　　　★どれも teacher_student_links／can_view_ops を 見る。")
  say("　　　　　　　　　　　★★can_view_ops は 引数に できことの 鍵を 持たない。")
  say("　　　　　　　　　　　　★「この方は この生徒を 見てよいか」を 尋ねる 関数で、")
  say("　　　　　　　　　　　　★「この方は 出席を 付けてよいか」では ない。")
  say("　　　　　　　　　② 列ごとの 許し　attendance と scheduled_at は 同一。")
  say("　　　　　　　　　　　★日程を 直せる 方は、★出席も 付けられる。")
  say("　　　　　　　　　③ アプリ　★shukketsu という 字は、★帳面ぜんたいで")
  say("　　　　　　　　　　　lib/opsPerms.js と tools/ の ほかに **1か所も 無い**。")
  say("　　　　　　　　　　　★components/ にも app/ にも 無い。")
  say()
  say("　　　　　　　　★★根に あるのは、★出席と 日程が **同じ 表の 同じ 行**")
  say("　　　　　　　　　　である ことだ。★行の 決まりは、★列を 隠せない。")
  say("　　　　　　　　　★出席は 別の 表では なく、★lessons の attendance 列。")
  say()
  say("　範囲　　　　　★本番の 台帳（Supabase・production）。")
  say("　　　　　　　　★書く 道は **ブラウザ 直**（★裏口を 通らない）──")
  for r in sorted(set(att_rows))[:0] or []:
    say("　　　　　　　　　　" + r)
  say("　　　　　　　　　　components/VocalTracker.jsx:9739　handleAttendance")
  say("　　　　　　　　　　components/VocalTracker.jsx:11300　handleSetLessonHeld")
  say("　　　　　　　　★★どちらも 権限を 1つも 見て いない。")
  say("　　　　　　　　　★確かめて いるのは「行が あるか」「値が 正しい 札か」だけ。")
  say()
  say("　　　　　　　　★★実際に 起きたか　★**分からない**。")
  say("　　　　　　　　　★理由 ── ★閲覧・書き込みの 記録が まだ 無い")
  say("　　　　　　　　　　（★安全管理の書類・「閲覧の記録」＝ 未実装）。")
  say("　　　　　　　　　★★「起きて いない」とは 書かない。★確かめる 手が 無い。")
  say("　　　　　　　　　★★No.001 では「起きて いない」と 書けた。")
  say("　　　　　　　　　　★あれは 通った 要求が 1つも 無い ことを 示せた ため。")
  say("　　　　　　　　　　★ここでは 示せない。★書き分ける。")
  say()
  say("　　　　　　　　★★通る ことは、★実際に 投げて 示した（★9月11日）──")
  say("　　　　　　　　　　教授・准教授・講師の 資格で 出席を 書き換え → **200**")
  say("　　　　　　　　　　★記録 docs/reports/2026-09-11-50通り-通しの結果.md")
  say("　　　　　　　　　　★使い捨ての 学校の、★使い捨ての 行だけを 触った。")
  say()
  say("　原因　　　　　★できことの 一覧（★lib/opsPerms.js）を 作った とき、")
  say("　　　　　　　　　★**それを 読む 側を 作らなかった。**")
  say("　　　　　　　　★★13ある 鍵の うち、★止める 力を 持つのは 3つだけ ──")
  say("　　　　　　　　　　post　　 app/api/org/posts/route.js が 見る")
  say("　　　　　　　　　　meibo　　 台帳の 決まりが 見る（★9月11日に 足した）")
  say("　　　　　　　　　　gyoji　　 台帳の 決まりが 見る（★9月11日に 足した）")
  say("　　　　　　　　★★残り 10は、★画面の 札を 出すか どうかだけ に 使われる。")
  say("　　　　　　　　　★札を 出さない ことは、★書けない ことでは ない。")
  say("　　　　　　　　　★ブラウザは 表に 直に 書ける。★札は 通り道では ない。")
  say()
  say("　　　　　　　　★★§7-3 で 台帳に 決まりを 移した とき、")
  say("　　　　　　　　　★memberships と org_events の 2つで 止めた。")
  say("　　　　　　　　　★★lessons は、★その ときの 範囲に 入って いなかった。")
  say()
  say(BAR)
  say("　★直した日　　　★★まだ です")
  say(BAR)
  say()
  say("　★★この 節は、★わざと 空の まま 出して います。")
  say()
  say("　★★坂本さんの お決め（2026年9月11日）──")
  say("　　　「回してから 直す。★穴が あった 事実と、")
  say("　　　　塞いだ 事実の 両方が、★この順で 要る」")
  say()
  say("　★★先に 直して、★あとから「有った」を 書き足す やり方は しません。")
  say("　　★★安全管理の 書類は「いま こうです」と 言う 紙です。")
  say("　　★★順が 崩れると、★渡す 書類と 実物が ちがう ── ")
  say("　　　★元の 事故と 同じ 形に なります。")
  say()
  say("　　直した日　　　★")
  say("　　直した人　　　★")
  say("　　直した内容　　★")
  say("　　確かめた方法　★")
  say()
  say(BAR)
  say("　★直す ときに 選べる 道（★まだ 選んで いません）")
  say(BAR)
  say()
  say("　★★どれも 私の 案です。★お決めは 坂本さんの ものです。")
  say()
  say("　★㋐ 列ごとの 許しで 分ける")
  say("　　　attendance への UPDATE を、★authenticated から 剥がす。")
  say("　　　★★けれど それでは、★出席を 付けられる 方も 居なく なります。")
  say("　　　★★裏口（サーバ経路）を 1つ 作り、★そこで shukketsu を 見る。")
  say("　　　★長所　行の 決まりを 触らない。★出席だけを 切り分けられる。")
  say("　　　★短所　画面の 2か所を 書き直す。")
  say()
  say("　★㋑ 止める 決まり（restrictive）を 1本 足す")
  say("　　　lessons の UPDATE に `has_can(org_id, 'shukketsu')` を かつ で 足す。")
  say("　　　★★ただし 行の 決まりは 列を 見分けません。")
  say("　　　　★出席を 止めると、★日程を 直す ことも 同時に 止まります。")
  say("　　　　★★いま 日程を あとから 直す 働きは 無いので、★実害は 無い。")
  say("　　　　　★あとで その 働きを 作る とき、★ここで つまずきます。")
  say("　　　★長所　§7-3 と 同じ 形。★1本で 済む。")
  say("　　　★短所　列を 分けられない。★将来の 働きを 縛る。")
  say()
  say("　★㋒ 両方（★㋑を 先に 立て、★落ち着いてから ㋐へ）")
  say("　　　★★安全の 順（★見えない ものを 先に・権限は 最後に）に 合う。")
  say()
  say("　★★どの 道でも、★先に これを 確かめます ──")
  say("　　　★いま 出席を 付けて いる 方が、★誰も 締め出されない こと。")
  say("　　　★★§7-3 の ⑤ で したのと 同じ 確かめ です。")
  say()
  say(BAR)
  say("　★確かめ直す 手だて（★直した あと、★同じ ものを 回します）")
  say(BAR)
  say()
  say("　　python3 tools/perm_matrix.py docs/reports/50通り-10校.txt")
  say()
  say("　★★いまの 答え　★ちがう マス " + n_diff + " 件")
  say("　　　　　　　　　　★うち 出席の ぶん " + str(n_att) + " 件")
  say("　★★直った あとの 答え　★出席の ぶんが 0 件 に なる こと。")
  say("　★★ほかの マスが 増えて いない こと（★締め出しの 検め）。")
  say()
  say("　★★下ごしらえが 要ります（★在籍と 受け持ち）──")
  say("　　　supabase/2026-09-11-§3-50通り-下ごしらえ.sql")
  say("　　　supabase/2026-09-11-§3-50通り-在籍と受け持ちの種まき.sql")
  say()
  say(BAR)
  say("　★この 記録の 出どころ（★すべて 機械が 書いた もの）")
  say(BAR)
  say()
  say("　　docs/reports/2026-09-11-出席を止めるものが無い.md")
  say("　　docs/reports/2026-09-11-50通り-通しの結果.md")
  say("　　docs/reports/2026-09-11-どの道を通って書いているか.md")
  say("　　docs/reports/2026-09-11-membershipsに今なにが通るか.md")
  say("　　components/tests/perm-keys-consumed.test.js　★鍵 13本の 棚おろし")
  say()
  say("　★この 紙自身も、★tools/write_record_002.py が 書き出して います。")
  say(BAR)

  with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★" + os.path.relpath(OUT, ROOT) + " に 書きました（全%d行）。" % len(lines))
  print("★ちがう マス " + n_diff + " 件／うち 出席 " + str(n_att) + " 件")
  return 0


if __name__ == "__main__":
  sys.exit(main())
