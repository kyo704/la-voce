# -*- coding: utf-8 -*-
"""★実行ルート 第5版の「状態」を、★蔵と 台帳で 確かめる（★2026-09-19）

  ★★★決まり ──「文書と 実装が 食い違ったら、★実装の ほうが 事実」。
    ★★第5版は 9月19日 朝の 見立て です。★そのあと 動いた ものが あります。

  ★★★この 1本が 調べ、★この 1本が 書きます。
    ★★較正 ── ★必ず 在る はずの 目印で、★見つかる ことを 確かめます。
"""

import io, os, re, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_read import 問う, 真


def 読む(みち):
  p = os.path.join(ROOT, みち)
  if not os.path.exists(p):
    raise SystemExit("★止まりました ── ありません: " + みち)
  return io.open(p, encoding="utf-8").read()


蔵 = 読む("components/VocalTracker.jsx")
名簿 = 読む("components/OpsRoster.jsx")
if "onInvite" not in 名簿:
  raise SystemExit("★止まりました ── 較正が 合いません（名簿に `onInvite` が ありません）")

調べ = []

# ★① 名簿 →「＋ 招く」（★裁定 その82）
渡す = bool(re.search(r"onInvite=\{", 蔵))
調べ.append(("① 名簿 →「＋ 招く」", "その82", "実装 待ち（最優先）",
           "済み" if 渡す else "★まだ",
           "`components/VocalTracker.jsx` が `onInvite` を 渡して います"
           if 渡す else "★渡して いません"))

# ★② 門下閲覧の 抜け道（★裁定 その88）
門 = 問う("""
select (position('renraku_all' in pg_get_expr(p.polqual, p.polrelid)) > 0)::text as ra,
       (position('teacher_id IS NULL' in pg_get_expr(p.polqual, p.polrelid)) > 0)::text as oshirase,
       length(pg_get_expr(p.polqual, p.polrelid))::text as nagasa
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'org_messages' and p.polcmd = 'r'
""")
if not 門:
  raise SystemExit("★止まりました ── `org_messages` の 決まりが 読めません")
塞い = 真(門[0], "oshirase")
調べ.append(("② 門下閲覧の 抜け道", "その88", "★今日 塞ぐ",
           "済み" if 塞い else "★まだ",
           "`renraku_all` は `teacher_id IS NULL`（お知らせ）の ときだけ です（式 %s字）"
           % 門[0]["nagasa"] if 塞い else "★門下にも 効いて います"))

# ★その86（can_view_ops を できことに）
できこと = 問う("""
select count(*)::text as kazu from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'can_view_ops_perm'
""")
あり = int(できこと[0]["kazu"]) > 0 if できこと else False
調べ.append(("can_view_ops を できことに", "その86", "実装 待ち",
           "済み" if あり else "★まだ",
           "`can_view_ops_perm` が 台帳に あります" if あり else "★ありません"))

# ★その90（出席の 回数・授業の 型）
型 = 問う("""
select count(*)::text as kazu from information_schema.tables
where table_schema = 'public' and table_name = 'lesson_presets'
""")
型あり = int(型[0]["kazu"]) > 0 if 型 else False
出席 = os.path.exists(os.path.join(ROOT, "lib", "attendanceCount.js"))
調べ.append(("出席の 回数・授業の 型", "その90", "見本に 実装済み",
           "済み" if (型あり and 出席) else "★まだ",
           "`lesson_presets` が あり、★`lib/attendanceCount.js` が 数えます"
           if (型あり and 出席) else "★足りません"))

# ★その91（出欠つけ 5件）
一括 = os.path.exists(os.path.join(ROOT, "components", "OpsAttendanceBulk.jsx"))
調べ.append(("出欠つけ 5件", "その91", "実装 待ち", "済み" if 一括 else "★まだ",
           "`components/OpsAttendanceBulk.jsx` が あります" if 一括 else "★ありません"))

# ★その93（lesson_presets の 列露出）
読み道 = 問う("""
select pg_get_function_result(p.oid) as kaeri
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_lesson_preset_for_student'
""")
調べ.append(("lesson_presets の 列露出", "その93", "実装 待ち",
           "済み" if 読み道 else "★まだ",
           "読み道が 返すのは `%s`" % 読み道[0]["kaeri"] if 読み道 else "★ありません"))

# ★その79（ホーム 1画面・出欠タブ）
節 = 読む("lib/opsHomeSections.js")
描く = set(re.findall(r'出す\("(\w+)"\)', 読む("components/OpsHome.jsx")))
全節 = re.findall(r'\{\s*key:\s*"(\w+)"', 節[節.index("export const HOME_SECTIONS"):
                                        節.index("]);", 節.index("export const HOME_SECTIONS"))])
調べ.append(("ホーム 1画面・出欠タブ", "その79", "★Code 確認 待ち",
           "済み" if set(全節) <= 描く else "★まだ",
           "節 %d の うち %d を 描いて います" % (len(全節), len(描く & set(全節)))))

今日 = datetime.date.today().isoformat()
行 = []
行.append("# ★実行ルート 第5版 ── ★蔵と 台帳で 確かめました")
行.append("")
行.append("★%s ／ ★`tools/route_v5_status.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★★第5版は 9月19日 **朝** の 見立て です。")
行.append("★★そのあとに 動いた ものが あります。★実装の ほうが 事実 です。")
行.append("")
行.append("| 何 | 裁定 | ★第5版の 見立て | ★いまの 蔵 | 何で そう 言えるか |")
行.append("|---|---|---|---|---|")
for 名, 裁, 文書, 実, 訳 in 調べ:
  行.append("| %s | %s | %s | %s | %s |" % (名, 裁, 文書, 実, 訳))
行.append("")
済 = len([x for x in 調べ if x[3] == "済み"])
行.append("★数えた %d の うち、★済んで いる もの …… **%d**" % (len(調べ), 済))
行.append("")
行.append("## ★それでも 残って いる もの")
行.append("")
行.append("★★第5版 §1③「見た目の 一式（★裁定 その81 §1〜§3）」")
行.append("★★★色の トークンと 文字の 6段は `lib/visualTokens.js` に あります。")
行.append("★★けれど、★画面が それを 使って いるか は、★別の 話 です。")
行.append("")
行.append("★★§2 第1の 5「1対1の マッチング」（★裁定 その94）── ★手を つけて いません。")
行.append("★★§13 の 4「画面の 文字を 1か所に」── ★手を つけて いません。")
行.append("")
行.append("## ★この 調べに できない こと")
行.append("")
行.append("★★字と 台帳を 見て います。★描かれた 姿を 見て いません。")
行.append("★★★`VISUAL: UNVERIFIED` です。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-実行ルート第5版の確かめ.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("数えた %d ／ 済み %d" % (len(調べ), 済))
