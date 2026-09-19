# -*- coding: utf-8 -*-
"""★列の 露わ 調べ ── ★裁定 その93 の 横断（★2026-09-19）

  ★★★決まり（RLS）は **行** を 守ります。★**列** は 守りません。
    ★★ある 方が 行を 1つ 読めると、★その 行の 列は 全部 渡ります。
    ★★画面に 出さなくても、★通信の 中身を 見れば 読めます。

  ★★★だから 探します ──
    ★★学生（在籍）や 先生が 読める 表の うち、
    ★★その 役目に 要らない 列を 持つ もの。
    ★★とくに `note` `memo` `created_by` `内部の 計算用` の たぐい。

  ★★★較正 ── ★`lesson_presets` は 直した ばかり です。
    ★★あれが「読めない」側に 出る ことを 確かめます。
"""

import io, os, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_read import 問う, 真

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ★★気を つけたい 列の 名（★裁定 その93 の お言葉）。
気になる = ("note", "memo", "created_by", "updated_by", "internal",
          "need_count", "score", "rank", "reason", "comment", "remark",
          "teacher_note", "staff_note", "admin_note")

# ---------------------------------------------------------------------------
# 【一】★誰が 読める 表か ── ★決まりの 式に 何が 現れるかで 見ます
# ---------------------------------------------------------------------------
表 = 問う("""
select c.relname as hyo,
       count(*) filter (where p.polcmd in ('r','*'))::text as yomu_kimari,
       bool_or(position('enrollments' in
         coalesce(pg_get_expr(p.polqual, p.polrelid),
                  pg_get_expr(p.polwithcheck, p.polrelid))) > 0
         and p.polcmd in ('r','*'))::text as gakusei,
       bool_or(position('teacher_student_links' in
         coalesce(pg_get_expr(p.polqual, p.polrelid),
                  pg_get_expr(p.polwithcheck, p.polrelid))) > 0
         and p.polcmd in ('r','*'))::text as sensei_musubi,
       bool_or(position('student_id = auth.uid()' in
         coalesce(pg_get_expr(p.polqual, p.polrelid),
                  pg_get_expr(p.polwithcheck, p.polrelid))) > 0
         and p.polcmd in ('r','*'))::text as honnin,
       bool_or(position('teacher_id = auth.uid()' in
         coalesce(pg_get_expr(p.polqual, p.polrelid),
                  pg_get_expr(p.polwithcheck, p.polrelid))) > 0
         and p.polcmd in ('r','*'))::text as jibun_no_koma
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
group by c.relname
order by c.relname
""")
if not 表:
  raise SystemExit("★止まりました ── 決まりを 1つも 読めません")

# ★★★較正 ── ★`lesson_presets` は 学生に 開いて いない はず です（★裁定 その93）。
較 = [r for r in 表 if r["hyo"] == "lesson_presets"]
if not 較:
  raise SystemExit("★止まりました ── `lesson_presets` が 出て きません")
if 真(較[0], "gakusei"):
  raise SystemExit("★止まりました ── `lesson_presets` が まだ 学生に 開いて います")
# ★★当たる はずの 方 ── ★`lessons` は ご本人の 枝を 持ちます。
当 = [r for r in 表 if r["hyo"] == "lessons"]
if not 当 or not 真(当[0], "honnin"):
  raise SystemExit("★止まりました ── `lessons` の ご本人の 枝が 見えません。道具が 壊れて います。")

開いて = {r["hyo"] for r in 表 if 真(r, "gakusei") or 真(r, "honnin")
        or 真(r, "sensei_musubi") or 真(r, "jibun_no_koma")}

# ---------------------------------------------------------------------------
# 【二】★その 表の 列
# ---------------------------------------------------------------------------
列 = 問う("""
select table_name as hyo, column_name as hashira, data_type as kata
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position
""")
# ★★★列の 権（★2026-09-19 に 足しました）。
#   ★★決まりを 通った 方に、★その 列が 渡るか どうか は、
#     ★★**列の 権**（`grant select (…)`）でも 決まります。
#   ★★★これを 見て いません でした。★取り上げた あとも「露わ」と 出ます。
#     ★★直した ことが 道具に 映りません。★それでは 使えません。
権 = 問う("""
select table_name as hyo, column_name as hashira
from information_schema.column_privileges
where table_schema = 'public' and grantee = 'authenticated'
  and privilege_type = 'SELECT'
order by table_name, column_name
""")
渡る = {(r["hyo"], r["hashira"]) for r in 権}
if not 渡る:
  raise SystemExit("★止まりました ── 列の 権を 1つも 読めません")
# ★★較正 ── ★必ず 渡る 列（`lessons.scheduled_at`）で 確かめます。
if ("lessons", "scheduled_at") not in 渡る:
  raise SystemExit("★止まりました ── 較正が 合いません。道具が 壊れて います。")

表ごと = {}
for r in 列:
  表ごと.setdefault(r["hyo"], []).append(r["hashira"])

# ★★★画面が その 列を 頼んで いるか（★蔵の 字を 読みます）。
#   ★★頼んで いる なら、★見せる つもり の 列 かも しれません。
#   ★★頼んで いない のに 渡って いる なら、★それは 露わ です。
#   ★★★はじめ、★蔵ぜんぶ を 探して いました（★2026-09-19）。
#     ★★`created_by` は、★別の 表を 読む ところにも 出て きます。
#     ★★「頼んで いる」が すべて ○ に なり、★露わが 隠れて いました。
#   ★★★だから、★**列を 並べた ところ だけ** を 見ます。
#     ★★`…_COLUMNS = "…"` と `.select("…")` の 中 です。
import re as _re
頼みの並び = []
for みち in ("lib/classroomShell.js", "components/VocalTracker.jsx"):
  文 = io.open(os.path.join(ROOT, みち), encoding="utf-8").read()
  頼みの並び += _re.findall(r'_COLUMNS\s*=\s*\n?\s*"([^"]+)"', 文)
  頼みの並び += _re.findall(r'\.select\("([^"]+)"', 文)
if not 頼みの並び:
  raise SystemExit("★止まりました ── 列の 並びを 1つも 読めません")
# ★★較正 ── ★必ず 在る はず の 列で、★見つかる ことを 確かめます。
if not any("scheduled_at" in x for x in 頼みの並び):
  raise SystemExit("★止まりました ── 較正が 合いません（`scheduled_at` は 必ず 頼みます）")
頼む列 = set()
for x in 頼みの並び:
  for c in x.replace("(", ",").replace(")", ",").split(","):
    頼む列.add(c.strip())

当たり = []
for 名 in sorted(開いて):
  ひ = [c for c in 表ごと.get(名, []) if any(g == c or c.endswith("_" + g) for g in 気になる)]
  if ひ:
    誰 = [r for r in 表 if r["hyo"] == 名][0]
    頼み = {c: c in 頼む列 for c in ひ}
    渡り = {c: (名, c) in 渡る for c in ひ}
    # ★★★渡らない 列は、★もう 露わでは ありません。★数えません。
    ひ = [c for c in ひ if 渡り[c]]
    if not ひ:
      continue
    当たり.append((名, ひ, 誰, 頼み))

# ---------------------------------------------------------------------------
# 【三】★読み道（`security definer`）が すでに ある もの
# ---------------------------------------------------------------------------
読み道 = 問う("""
select p.proname as na, p.prosecdef::text as teigi,
       pg_get_function_result(p.oid) as kaeri
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by p.proname
""")

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-列の露わ調べ.md" % 今日)

行 = []
行.append("# ★列の 露わ 調べ ── ★裁定 その93 の 横断")
行.append("")
行.append("★%s ／ ★`tools/column_exposure_audit.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★★決まり（RLS）は **行** を 守ります。★**列** は 守りません。")
行.append("★★行を 1つ 読める 方には、★その 行の 列が 全部 渡ります。")
行.append("")
行.append("## ★調べた 範囲")
行.append("")
行.append("★決まりの ある 表 …… **%d**" % len(表))
行.append("★そのうち、★学生・生徒ご本人・結びついた 先生・自分の コマ の")
行.append("★どれかで 開いて いる 表 …… **%d**" % len(開いて))
行.append("")
行.append("## ★当たり ── ★気に なる 列を 持つ 表（%d）" % len(当たり))
行.append("")
if 当たり:
  行.append("| 表 | 気に なる 列 | 画面が 頼んで いるか | 在籍 | ご本人 | 結びつき | 自分の コマ |")
  行.append("|---|---|---|---|---|---|---|")
  for 名, ひ, 誰, 頼み in 当たり:
    行.append("| `%s` | %s | %s | %s | %s | %s | %s |" % (
      名, "／".join("`%s`" % c for c in ひ),
      "／".join(("頼む" if 頼み[c] else "★頼んで いない") for c in ひ),
      "○" if 真(誰, "gakusei") else "ー",
      "○" if 真(誰, "honnin") else "ー",
      "○" if 真(誰, "sensei_musubi") else "ー",
      "○" if 真(誰, "jibun_no_koma") else "ー"))
else:
  行.append("★ありません。")
行.append("")
行.append("## ★すでに ある 読み道（`security definer`）")
行.append("")
行.append("| 名 | 返す もの |")
行.append("|---|---|")
for r in 読み道:
  行.append("| `%s` | %s |" % (r["na"], r["kaeri"]))
行.append("")
行.append("## ★この 調べに できない こと")
行.append("")
行.append("★★★列の 名 だけ を 見て います。★中身は 見て いません。")
行.append("★★名が おとなしくても、★中に 覚え書きが 入る 列は あり得ます。")
行.append("★★★「その 役目に 要るか」は、★人が 決める こと です。★機械は 当てられません。")
行.append("★★「画面が 頼んで いる」列は、★見せる つもりの もの かも しれません。")
行.append("★★★頼んで いない のに 渡って いる 列 こそ、★露わ です。")
行.append("★★この 表は、★お尋ねする ところの 一覧 です。★答えでは ありません。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("決まりのある表 %d ／ 開いて いる 表 %d ／ 当たり %d ／ 読み道 %d"
      % (len(表), len(開いて), len(当たり), len(読み道)))
