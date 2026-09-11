#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★机の上に、★いま 要る ものを ひと揃い 置く
#
#   ★出どころ 2026-09-11、★坂本さんの ご指示「ファイルにして デスクトップに」
#
#   ★★長い ものを 会話に 流すと、★途中で 切れて 届きません。
#     ★★だから 机の上の ファイルが、★正（ただし）い ほうです。
#
#   ★★目次も ここで 書き出します（★手で 書きません）。
#     ★★どの 紙が「読む もの」で、★どれが「流す もの」かを 分けます。
#
#   使い方  python3 tools/desk_drop.py
# ============================================================================

import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESK = os.path.expanduser("~/Desktop")
FOLDER = os.path.join(DESK, "Woolsong-2026-09-11")

# ★（置き場, 相対の 道, どういう 紙か）
ITEMS = [
  ("① 読む もの（★記録）",
   "docs/records/修正の記録-No.002-出席を止めるものが無い.md",
   "★出席の 穴。★10役職 とも 見張られて いない。「直した」は わざと 空。"),
  ("① 読む もの（★記録）",
   "docs/records/修正の記録-No.003-学年の札を直せない.md",
   "★学年の 札。★済み（9月11日）。★私の 合否の 誤りも 書いて ある。"),
  ("① 読む もの（★記録）",
   "docs/records/修正の記録-No.004-学年の札は学校が決める.md",
   "★学年の 札は 学校が 決める。★済み（9月11日）。★締め出し 0。"),
  ("① 読む もの（★記録）",
   "docs/records/修正の記録-No.001-権限の昇格.md",
   "★§7 の ぶん。★9月11日に 閉じた もの。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-レッスンを消すと出席も消えるか.md",
   "★消して 作り直す やり方は 無い。★ただし 重なりが 1つ 残る。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-50通り-通しの結果.md",
   "★10役職 × 5つの表。★ちがう マスと、★その わけ。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-membership-columns.md",
   "★組織の 層の 列を 1行ずつ。★誰の ものか・歯止めが あるか。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-どの道を通って書いているか.md",
   "★ブラウザ 直か、★裏口か。★50通りの 読み方が 決まる。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-役職を直に書く道があるか.md",
   "★役職は 経路の 外から 書けない。★5マスは 私の 試し方の 話。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-membershipsに今なにが通るか.md",
   "★決まりは 立って いる。★pg_policies 0行 の お知らせと 合わない。"),
  ("② 読む もの（★調べた 結果）",
   "docs/reports/2026-09-11-出席を止めるものが無い.md",
   "★3つの 層 すべてで 止まって いない ことの 証拠。"),
  ("③ 流す もの（★SQL・順に）",
   "supabase/2026-09-11-No004-学年の札は学校が決める.sql",
   "★★次に 流す もの。★引き金で 塞ぐ。★①②を 先に 見て ください。"),
  ("④ 片づけ（★あとで）",
   "supabase/2026-09-11-§3-50通り-在籍と受け持ちの種まき.sql",
   "★④の 印を 外すと 片づく。★**学校より 先に** これを 消す。"),
  ("④ 片づけ（★あとで）",
   "supabase/2026-09-11-§3-50通り-下ごしらえ.sql",
   "★⑥の 印を 外すと 片づく。★種まきの あとで。"),
]


def main():
  if os.path.isdir(FOLDER):
    shutil.rmtree(FOLDER)
  os.makedirs(FOLDER)

  lines = []

  def say(t=""):
    lines.append(t)

  say("# ★2026年9月11日　★机の上の ひと揃い")
  say()
  say("★この 目次は tools/desk_drop.py が 書き出します。★手で 書いて いません。")
  say()
  say("★★長い ものを 会話に 流すと 途中で 切れます。")
  say("　★★**この フォルダの ファイルが、★正しい ほうです。**")
  say()

  here = None
  n = 0
  for group, rel, note in ITEMS:
    src = os.path.join(ROOT, rel)
    if not os.path.exists(src):
      continue
    name = os.path.basename(rel)
    shutil.copy2(src, os.path.join(FOLDER, name))
    n += 1
    with open(src, encoding="utf-8") as f:
      rows = f.read().rstrip("\n").split("\n")
    if group != here:
      say()
      say("## " + group)
      say()
      here = group
    say("### " + name)
    say()
    say("　★全%d行" % len(rows))
    say("　★末尾は「%s」" % (rows[-1].strip() if rows[-1].strip() else rows[-2].strip()))
    say("　★" + note)
    say()

  say("---")
  say()
  say("## ★いま 待って いる お決め")
  say()
  say("1. ★出席の 穴（No.002）── ★㋐ 列の 許しで 分ける／★㋑ 止める 決まりを 1本／★㋒ 両方")
  say("   　★★日程を あとから 直す 働きを 作るか どうかと、★つながって います。")
  say("2. ★レッスンを 消す ときの 念押し ── ★㋐ 念押しを 出す／★㋑ ✕ を 出さない")
  say("3. ★No.004（学年の 札）── ★SQL を 流して よいか")
  say("4. ★`display_title` は 誰の ものか ── ★学校が 決める／★ご本人が 名乗る")
  say()
  say("## ★私が いま して いる こと")
  say()
  say("★§3 の ② ── ★役職の 5マスを、★API の 道で 実際に 叩いて 確かめる。")
  say("　★★「私の 試し方の 話だった」で 閉じる 前に、★本物の 道で 通る ことを 見ます。")
  say()
  say("## ★まだ 何も 直して いません")
  say()
  say("★★台帳へ 流したのは、★No.003（学年の札の 許し 1行）だけ です。")
  say("　★★それも 坂本さんの お手で 流して いただきました。")

  idx = os.path.join(FOLDER, "00-目次.md")
  with open(idx, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

  print("★" + FOLDER)
  print("★%d 枚 ＋ 目次 を 置きました。" % n)
  subprocess.run(["open", "-R", idx])
  return 0


if __name__ == "__main__":
  sys.exit(main())
