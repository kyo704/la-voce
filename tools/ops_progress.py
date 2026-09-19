# -*- coding: utf-8 -*-
"""★運営 画面の 進み ぐあい（★2026-09-18・裁定 その84 NEW_ORDER 2）

  ★★★この 1本が 数えます。★手で 数えません。
    ★★見本の 画面 …… ★見本の 紙から 数えます
    ★★くらべの 済み … ★`tools/screen_diff/*.json` から 数えます
    ★★実装の 有無 …… ★`tools/ops_screen_map.json` から

  ★★止まる 決まり ── ★見本が 無い／仕分けが 無い ときは 止まります。
"""

import io, json, os, re, sys, datetime, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# ★★荷の 名指しを やめました（★2026-09-19）。★`pack_path` が 選びます。
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_path import 荷
MIHON = os.path.join(荷(),
                     "00-動く見本-PC・iPad（運営）.html")


def 止まる(わけ):
  print("★止まりました ── " + わけ)
  sys.exit(2)


if not os.path.exists(MIHON):
  止まる("見本が ありません")
見本 = io.open(MIHON, encoding="utf-8").read()
画面 = re.findall(r"^function (P_[A-Za-z0-9_]+)\(", 見本, re.M)
節 = re.findall(r"^function (st[A-Za-z0-9_]+)\(", 見本, re.M)
if len(画面) < 30:
  止まる("画面を %d しか 拾えません" % len(画面))

MAP = os.path.join(ROOT, "tools", "ops_screen_map.json")
if not os.path.exists(MAP):
  止まる("対応表が ありません")
対応 = json.loads(io.open(MAP, encoding="utf-8").read()).get("対応") or {}

# ★★くらべの 済んだ もの
済み = {}
for f in sorted(glob.glob(os.path.join(ROOT, "tools", "screen_diff", "*.json"))):
  名 = os.path.basename(f).replace(".json", "")
  S = json.loads(io.open(f, encoding="utf-8").read())
  ns = S.get("節") or []
  ある = sum(1 for n in ns if not n.get("作らない")
             and n.get("実装の印") and "このもじれつは" not in str(n.get("実装の印")))
  ない = sum(1 for n in ns if not n.get("作らない")
             and (not n.get("実装の印") or "このもじれつは" in str(n.get("実装の印"))))
  作 = sum(1 for n in ns if n.get("作らない"))
  済み[名] = {"題": S.get("題", 名), "節": len(ns), "一致": ある, "未": ない, "作らない": 作}

# ★★★くらべの 名が、★見本にも 仕分けにも ある こと。
for 名 in 済み:
  if not (名 in 画面 or 名 in 節):
    止まる("くらべの 名が 見本に ありません: " + 名)

実装あり = [n for n in 画面 if n in 対応 and not 対応[n].get("作らない")]
実装なし = [n for n in 画面 if n not in 対応]
くらべ済 = [n for n in 画面 if n in 済み]
くらべまだ = [n for n in 実装あり if n not in 済み]

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-運営画面の進みぐあい.md" % 今日)

行 = []
行.append("# ★運営 画面の 進み ぐあい")
行.append("")
行.append("★%s ／ ★`tools/ops_progress.py` が 書きました。" % 今日)
行.append("")
行.append("## ★数")
行.append("")
行.append("| | 本 |")
行.append("|---|---|")
行.append("| 見本の 画面（`P_…`） | %d |" % len(画面))
行.append("| 設定の 中の 節（`st…`） | %d |" % len(節))
行.append("| ★実装が ある 画面 | %d |" % len(実装あり))
行.append("| ★実装が まだ の 画面 | %d |" % len(実装なし))
行.append("| ★★くらべが 済んだ もの | %d |" % len(済み))
行.append("| ★★実装が あって、★くらべが まだ | %d |" % len(くらべまだ))
行.append("")
行.append("## ★くらべが 済んだ もの（%d）" % len(済み))
行.append("")
行.append("| 名 | 題 | 節 | 一致 | 未 | 作らないと 決めた |")
行.append("|---|---|---|---|---|---|")
for k in sorted(済み, key=lambda x: -済み[x]["節"]):
  v = 済み[k]
  行.append("| `%s` | %s | %d | %d | %d | %d |"
            % (k, v["題"], v["節"], v["一致"], v["未"], v["作らない"]))
合 = {x: sum(済み[k][x] for k in 済み) for x in ("節", "一致", "未", "作らない")}
行.append("| **合計** | | **%d** | **%d** | **%d** | **%d** |"
          % (合["節"], 合["一致"], 合["未"], 合["作らない"]))
行.append("")
行.append("## ★実装が あって、★くらべが まだ（%d）" % len(くらべまだ))
行.append("")
if くらべまだ:
  行.append("| 名 | 実装 |")
  行.append("|---|---|")
  for n in くらべまだ:
    行.append("| `%s` | %s |" % (n, "／".join(対応[n].get("部品") or [])))
else:
  行.append("★ありません。")
行.append("")
行.append("## ★実装が まだ の 画面（%d）" % len(実装なし))
行.append("")
行.append("　".join("`%s`" % n for n in 実装なし))
行.append("")
行.append("## ★この 数の 読み方")
行.append("")
行.append("★★「くらべが 済んだ」は、★見本と 突き合わせ、★差を 直すか、")
行.append("★★作らないと 決めて 台帳に 記した もの です。")
行.append("★★★見た目は 確かめて いません（`VISUAL: UNVERIFIED`）。")
行.append("★★実機の 写真で お確かめ ください。")

本文 = "\n".join(行) + "\n"
本文 = 本文.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
本文 = 本文.replace("{丈}", str(len(本文.splitlines())))
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("見本 %d ／ 実装あり %d ／ くらべ済 %d ／ くらべまだ %d ／ 実装まだ %d"
      % (len(画面), len(実装あり), len(済み), len(くらべまだ), len(実装なし)))
