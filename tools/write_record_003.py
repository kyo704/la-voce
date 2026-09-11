#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# ★修正の記録 No.003 を 書き出す（★学年の 札）
#
#   ★出どころ 2026-09-11、★Opus の お決め ──
#     「★grade_label は 直す。★GRANT 1行。★見つけた 経緯を『見つけ方』に 書く」
#
#   ★★様式は No.001／No.002 に 合わせます。
#   ★★台帳への 実行は 坂本さんです。★だから「直した日」は まだ 空です。
#
#   使い方  python3 tools/write_record_003.py
# ============================================================================

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "records",
                   "修正の記録-No.003-学年の札を直せない.md")
BAR = "────────────────────────────────────────"


def main():
  lines = []

  def say(t=""):
    lines.append(t)

  say(BAR)
  say("　修正の記録　No.003")
  say(BAR)
  say("　見つけた日　　2026年9月11日")
  say()
  say("　見つけた人　　Code（Opus）")
  say("　　　　　　　　★★見つけ方　★**頼まれた 範囲の 外で、★たまたま。**")
  say("　　　　　　　　　★§3（★10役職 × 5つの表 ＝ 50通り）を 回して いる 途中、")
  say("　　　　　　　　　★`memberships` への 書き込みの 道を 数えた ところ、")
  say("　　　　　　　　　★ブラウザから 直に 書いて いる 列が 3つ 出て きた ──")
  say("　　　　　　　　　　　role／grade_label／（新しい 行の insert）")
  say("　　　　　　　　　★★そこで 3つ とも 投げて みて、★分かりました。")
  say()
  say("　　　　　　　　★★はじめ この 3つを 見落として いました。")
  say("　　　　　　　　　★`.update(` が `from(` と **ちがう 行**に ある 書き方を、")
  say("　　　　　　　　　★探し方が 拾えて いなかった ためです。")
  say("　　　　　　　　　★窓を 上下に 広げて、★出て きました。")
  say()
  say("　何が起きたか　★**学年の 札（grade_label）を、★誰も 直せません。**")
  say()
  say("　　　　　　　　★画面は この 列を、★ブラウザから 直に 書いて います")
  say("　　　　　　　　　（★components/VocalTracker.jsx:11737）。")
  say("　　　　　　　　★★けれど authenticated に、★その 列の UPDATE が ありません。")
  say()
  say("　　　　　　　　★★10役職 とも、★同じ 返事に なります ──")
  say("　　　　　　　　　　42501　permission denied for table memberships")
  say("　　　　　　　　　　hint　 GRANT UPDATE ON public.memberships TO authenticated;")
  say()
  say("　　　　　　　　★★役職の 話では ありません。★誰でも 止まります。")
  say("　　　　　　　　　★同じ 表の `role` は 通ります（★列ごとの 許しが ある）。")
  say("　　　　　　　　　★`grade_label` には 無い。★それだけの ちがい です。")
  say()
  say("　範囲　　　　　★本番の 台帳（Supabase・production）。")
  say("　　　　　　　　★★**できない** 側の 不具合です。★開いて いる 穴では ありません。")
  say("　　　　　　　　　★漏れません。★誰かの 権限が 増えても いません。")
  say("　　　　　　　　★★失われる ものは ありません。★書けない だけ です。")
  say()
  say("　　　　　　　　★★いつから か　★**分かりません。**")
  say("　　　　　　　　　★2026-09-04 の 許しの 片づけ")
  say("　　　　　　　　　　（supabase/2026-09-04-org-events-grants-cleanup.sql）")
  say("　　　　　　　　　★の あたりが あやしいのですが、★確かめて いません。")
  say("　　　　　　　　　★★あやしい、と 書くに とどめます。")
  say()
  say("　原因　　　　　★列ごとの 許しを 付ける とき、★`role` だけを 付けた。")
  say("　　　　　　　　★★画面が 書いて いる 列を、★数え上げて いなかった。")
  say("　　　　　　　　★★どの 列に 許しが 要るかは、★画面の コードが 決めます。")
  say("　　　　　　　　　★その 突き合わせを して いませんでした。")
  say("　　　　　　　　　★★それを 埋めるのが A6（★列ごとの 一覧）です。")
  say()
  say(BAR)
  say("　★直した日　　　★★まだ です")
  say(BAR)
  say()
  say("　★★SQL は 書きました。★台帳への 実行は 坂本さんです。")
  say()
  say("　　　supabase/2026-09-11-No003-学年の札を直せるようにする.sql")
  say()
  say("　★直す 中身（★1行）")
  say()
  say("　　　grant update (grade_label) on public.memberships to authenticated;")
  say()
  say("　★★表ごとの UPDATE は 付けません。★列だけ です。")
  say("　　★★表ごとに 付けると、★post_id も role も 一緒に 開きます。")
  say("　　★★9月11日の 教訓 ── ★表の 許しが 残って いると、")
  say("　　　★列の 許しは 黙って 負けます。")
  say()
  say("　★★決まり（RLS）は 1本も 触りません。")
  say("　　★★誰が 直せるかは、★これまでどおり 決まりが 決めます。")
  say("　　★★許しは「その 列に 手が 届くか」だけ。★門は 決まりの ほうです。")
  say()
  say("　　直した日　　　★")
  say("　　直した人　　　★")
  say("　　確かめた方法　★")
  say()
  say(BAR)
  say("　★確かめ方（★流した あと）")
  say(BAR)
  say()
  say("　★① SQL の ④　── `grade_label` と `role` の 2行に なる こと")
  say("　★② SQL の ⑤　── 表ごとの UPDATE は **0行の まま** で ある こと")
  say("　★③ 実地　　　── 使い捨ての 学校で、★学年の 札を 書き換えて みる")
  say()
  say("　　　python3 tools/perm_matrix.py docs/reports/50通り-10校.txt")
  say()
  say("　　★★いま　　　　★10役職 とも「・止まる　42501 permission denied」")
  say("　　★★直った あと　★決まりの 許す 役職で「★通る」に 変わる こと")
  say("　　★★★全員が 通る ように なっては いけません。")
  say("　　　★★もし 全員 通ったら、★表ごとの 許しを 付けて しまって います。")
  say("　　　★★その ときは ⑥（戻し方）で 戻して ください。")
  say()
  say(BAR)
  say("　★この 記録の 出どころ")
  say(BAR)
  say()
  say("　　docs/reports/2026-09-11-50通り-通しの結果.md　★（参考）の 節")
  say("　　docs/reports/2026-09-11-どの道を通って書いているか.md")
  say("　　docs/reports/2026-09-11-役職を直に書く道があるか.md")
  say("　　docs/reports/2026-09-11-membershipsに今なにが通るか.md　★④")
  say()
  say("　★この 紙自身も、★tools/write_record_003.py が 書き出して います。")
  say(BAR)

  with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
  print("★" + os.path.relpath(OUT, ROOT) + " に 書きました（全%d行）。" % len(lines))
  return 0


if __name__ == "__main__":
  sys.exit(main())
