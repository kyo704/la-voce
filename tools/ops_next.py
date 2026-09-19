# -*- coding: utf-8 -*-
"""★次に どの 画面を やるか ── ★数えて 並べる（★裁定 その97・2026-09-19）

  ★★★裁定 その97 で、★見た目 先行（裁定 その84）を 取り消しました。
    ★★1画面ずつ、★**機能まで** 仕上げます。
    ★★マッチング（裁定 その94〜96）は 後ろへ 回ります。

  ★★★この 1本が 数え、★この 1本が 覚え書きを 書きます。
    ★★くらべの 仕分け（`tools/screen_diff/*.json`）と、
    ★★台帳の 表の 有無 から、★残りと 詰まりを 出します。

  ★★較正 ── ★必ず 在る 表・必ず 無い 表 の 両方で 試します。
"""

import io, json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ledger_read import 問う
from pack_path import 運営 as _運営

仕分け先 = os.path.join(ROOT, "tools", "screen_diff")
見本 = io.open(_運営(), encoding="utf-8").read()

# ★★★はじめ、★`function P_…` を 全部 数えて いました（★2026-09-19）。
#   ★★助けの 関数（`stBlock` `stTaisho` …）まで 画面に 数えて いました。
#   ★★52 に なりました。★見本の README は 29 と 書いて います。
#   ★★★だから、★見本が **自分で 並べて いる 表** を 読みます。
#     ★`var TAB={…}` … ★帯の 7つ
#     ★`var SC={…}`  … ★開く 画面 29
#     ★`var body={…}` … ★設定の 節 12
def 並び(あたま, しっぽ):
  i = 見本.index(あたま)
  j = 見本.index(しっぽ, i)
  return [m.group(2) for m in re.finditer(r"'([^']+)':(\w+)", 見本[i:j])]

帯 = 並び("var TAB={", "};")
開く = 並び("var SC={", "};")
節 = 並び("var body={", "}[S.st2]")
if len(開く) != 29 or len(帯) != 7:
  raise SystemExit("★止まりました ── 見本の 並びが 変わりました（帯 %d ／ 画面 %d）"
                   % (len(帯), len(開く)))
# ★★★並びの 中には、★その場で 書いた 関数も あります
#   （★`'コマを決める':function(){…}`）。★名が `function` に なります。
#   ★★見本の 中に `function <名>(` が ある ものだけ を 画面と します。
画面 = [x for x in dict.fromkeys(帯 + 開く + 節)
       if ("function %s(" % x) in 見本]

# ---------------------------------------------------------------------------
# 【一】★台帳に 表が あるか
# ---------------------------------------------------------------------------
表 = 問う("""
select table_name as na from information_schema.tables
where table_schema = 'public' order by table_name
""")
ある表 = {r["na"] for r in 表}
# ★★較正 ── ★必ず 在る ものと、★必ず 無い もの。
if "lessons" not in ある表:
  raise SystemExit("★止まりました ── 較正が 合いません（`lessons` が 見えません）")
if "★ありえない表★" in ある表:
  raise SystemExit("★止まりました ── 較正が 合いません（無い はずの 表が 見えます）")

# ★★画面ごとの「詰まり」── ★その 画面に 要る 表。
詰まり = {
  "P_kasa": ["overlap_notices"], "P_kasaT": ["overlap_notices"],
  "P_kumu": ["my_timetable"], "P_okeru": ["lesson_slots"],
  "P_daihyo": ["assignments"], "P_mada": ["my_timetable"],
  "P_monkaHito": ["assignments"], "P_monkaInvite": ["monka_invitations"],
  "P_pay": ["org_billing"], "P_seikyuNa": ["org_billing"],
  "P_atesaki": ["org_billing"], "P_ryoshu": ["org_billing"],
  "P_autoSet": ["org_events"], "P_kasaFix": ["overlap_notices"],
  "P_settei": [], "P_sonohito": [], "P_setPost": [], "P_write": []
}

行 = []
まだ, 欠け = [], []
for 名 in 画面:
  p = os.path.join(仕分け先, 名 + ".json")
  if not os.path.exists(p):
    まだ.append((名, 詰まり.get(名, [])))
    continue
  j = json.loads(io.open(p, encoding="utf-8").read())
  節 = j.get("節") or []
  ない = [n for n in 節 if not n.get("作らない")
          and not all(x in "" for x in [])]
  # ★★「②」の 数は 覚え書き（報告）に あります。★ここでは 仕分けから 数え直します。
  二 = []
  本文 = ""
  for f in (j.get("実装") or []):
    q = os.path.join(ROOT, f)
    if os.path.exists(q):
      本文 += io.open(q, encoding="utf-8").read()
  for n in 節:
    if n.get("作らない"):
      continue
    印 = n.get("実装の印")
    印 = 印 if isinstance(印, list) else [印]
    if not all(x and x in 本文 for x in 印):
      二.append(n.get("見本"))
  if 二:
    欠け.append((名, j.get("題") or 名, 二, 詰まり.get(名, [])))

def 要る表(ts):
  return [t for t in ts if t not in ある表]

今日 = datetime.date.today().isoformat()
行.append("# ★次に やる 画面 ── ★数えて 並べました")
行.append("")
行.append("★%s ／ ★`tools/ops_next.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★★裁定 その97 ── ★見た目 先行を 取り消し、★1画面ずつ **機能まで**。")
行.append("★★マッチング（裁定 その94〜96）は 後ろへ 回ります。")
行.append("")
行.append("## ★数え方")
行.append("")
行.append("★見本が 自分で 並べて いる 表から 取りました。")
行.append("★帯 …… **%d** ／ 開く 画面 …… **%d** ／ 設定の 節 …… **%d**"
          % (len(帯), len(開く), len(節)))
行.append("")
行.append("## ★① 画面が まだ 無い もの（%d）" % len(まだ))
行.append("")
行.append("| 画面 | 要る 表 | 台帳に あるか |")
行.append("|---|---|---|")
for 名, ts in まだ:
  無 = 要る表(ts)
  行.append("| `%s` | %s | %s |" % (
    名, "／".join("`%s`" % t for t in ts) or "（要らない）",
    "★足りません: " + "／".join(無) if 無 else "○ そろって います"))
行.append("")
行.append("## ★② 画面は ある が、★欠けが ある もの（%d）" % len(欠け))
行.append("")
行.append("| 画面 | 題 | 欠け | 要る 表 |")
行.append("|---|---|---|---|")
for 名, 題, 二, ts in sorted(欠け, key=lambda x: -len(x[2])):
  無 = 要る表(ts)
  行.append("| `%s` | %s | %d | %s |" % (
    名, 題, len(二), "★足りません: " + "／".join(無) if 無 else "○"))
行.append("")
行.append("## ★中身（★欠けの 一覧）")
行.append("")
for 名, 題, 二, ts in sorted(欠け, key=lambda x: -len(x[2])):
  行.append("### `%s` %s" % (名, 題))
  行.append("")
  for x in 二:
    行.append("- %s" % x)
  行.append("")
行.append("## ★この 数の 読み方")
行.append("")
行.append("★★「欠け」は、★仕分けに 書いた 印が 蔵に 見つからない もの です。")
行.append("★★★見た目の 良し悪しでは ありません。★**無い** ものです。")
行.append("★★「要る 表」は、★私が 見立てた ものです。★作る ときに 確かめて ください。")

本文出 = "\n".join(行) + "\n"
丈 = len(本文出.splitlines())
本文出 = 本文出.replace("★（★丈は 下に あります）",
                     "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-次にやる画面.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文出)
print(出)
print("見本の画面 %d ／ 画面が まだ %d ／ 欠けが ある %d"
      % (len(画面), len(まだ), len(欠け)))
