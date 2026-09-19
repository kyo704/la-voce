# -*- coding: utf-8 -*-
"""★見本の 運営 画面と、★実装の 部品の 対応（★裁定 その84 NEW_ORDER 2）

  ★★この 1本が、★数を 取り、★その 数で 覚え書きを 書きます。
    ★★手で 書いた 文と、★道具の 数を 並べません（★2026-09-16 の 決まり）。

  ★★★止まる 決まり（★2026-09-16 の お決め）
    ★★数える もとの ファイルが 1つでも 無ければ、★止まります。
    ★★取り出しに 穴が あれば、★止まります。
      ★★「0件」を「無い」と 読ませません。

  ★★呼び方  python3 tools/ops_screen_map.py
"""

import io, json, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# ★★荷の 名指しを やめました（★2026-09-19）。★`pack_path` が 選びます。
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pack_path import 荷
MIHON = os.path.join(荷(),
                     "00-動く見本-PC・iPad（運営）.html")
MAP = os.path.join(ROOT, "tools", "ops_screen_map.json")


def 止まる(わけ):
  print("★止まりました ── " + わけ)
  sys.exit(2)


# ---------------------------------------------------------------------------
# 【一】★見本から 画面を 取り出す
# ---------------------------------------------------------------------------
if not os.path.exists(MIHON):
  止まる("見本が ありません: " + MIHON)

見本 = io.open(MIHON, encoding="utf-8").read()
画面 = re.findall(r"^function (P_[A-Za-z0-9_]+)\(", 見本, re.M)

# ★★★取り出しの 自己点検。
#   ★★呼ばれて いるのに、★定義を 拾えて いない ものが あれば 止まります。
呼ばれ = set(re.findall(r"\b(P_[A-Za-z0-9_]+)\b", 見本))
# ★★大文字だけ の 名は、★画面では なく 部品 です（P_HEAD・P_COLS など）。
呼ばれ = {p for p in 呼ばれ if not p[2:].isupper()}
欠け = sorted(呼ばれ - set(画面))
if 欠け:
  止まる("呼ばれて いるのに 定義を 拾えない ものが あります: " + " ".join(欠け))
if len(画面) < 30:
  止まる("画面が %d 本 しか 拾えません。取り出しが 壊れて います。" % len(画面))

# ---------------------------------------------------------------------------
# 【二】★題を 取り出す（★画面の 中の 最初の h2）
# ---------------------------------------------------------------------------
def 題(名):
  i = 見本.index("function %s(" % 名)
  つぎ = [見本.index("function %s(" % x) for x in 画面
          if 見本.index("function %s(" % x) > i]
  塊 = 見本[i:min(つぎ) if つぎ else len(見本)]
  m = re.search(r"<h2[^>]*>([^<]{1,40})", 塊)
  if m:
    return m.group(1).strip()
  m = re.search(r"HEAD\('([^']{1,40})'", 塊)
  return m.group(1).strip() if m else ""


# ---------------------------------------------------------------------------
# 【三】★対応表（★手で 書きます。★道具は 確かめる だけ）
# ---------------------------------------------------------------------------
if not os.path.exists(MAP):
  止まる("対応表が ありません: " + MAP)
対応 = json.loads(io.open(MAP, encoding="utf-8").read())
表 = 対応.get("対応", {})

# ★★対応表に ある のに 見本に 無い 名 ＝ ★書き間違い です。★止まります。
迷子 = [k for k in 表 if k not in 画面]
if 迷子:
  止まる("対応表に、見本に 無い 名が あります: " + " ".join(迷子))

# ★★行き先の 部品が 本当に ある か。
無い部品 = []
for k, v in 表.items():
  for f in (v.get("部品") or []):
    if not os.path.exists(os.path.join(ROOT, f)):
      無い部品.append("%s → %s" % (k, f))
if 無い部品:
  止まる("対応表の 行き先が ありません: " + " / ".join(無い部品))

# ---------------------------------------------------------------------------
# 【四】★3つに 分ける（★2026-09-16 の お決め ── ★2つでは ありません）
# ---------------------------------------------------------------------------
ある, まだ, 作らない = [], [], []
for 名 in 画面:
  v = 表.get(名)
  if v is None:
    まだ.append((名, 題(名), "", ""))
  elif v.get("作らない"):
    作らない.append((名, 題(名), v.get("わけ", ""), v.get("引き金", "")))
  else:
    ある.append((名, 題(名), "／".join(v.get("部品") or []), v.get("覚え", "")))

今日 = datetime.date.today().isoformat()
出 = os.path.join(ROOT, "docs", "reports", "%s-運営34画面の対応.md" % 今日)

行 = []
行.append("# ★見本の 運営 画面と、★実装の 対応")
行.append("")
行.append("★裁定 その84 NEW_ORDER 2 ／ ★%s ／ ★`tools/ops_screen_map.py` が 書きました。" % 今日)
行.append("")
行.append("## ★数")
行.append("")
行.append("| | 本 |")
行.append("|---|---|")
行.append("| 見本の 画面 | %d |" % len(画面))
行.append("| ★① 実装が ある | %d |" % len(ある))
行.append("| ★② まだ ない | %d |" % len(まだ))
行.append("| ★③ 作らないと 決めた | %d |" % len(作らない))
行.append("")
行.append("★★★3つに 分けます。★2つでは ありません（★2026-09-16 の お決め）。")
行.append("★★③ は「見本に ある のに、★作らないと **決めた**」もの です。")
行.append("★★★③ には 必ず わけと 引き金が 要ります。★無い 行は 道具が 受け取りません。")
行.append("")

行.append("## ★① 実装が ある（%d）" % len(ある))
行.append("")
行.append("| 見本 | 題 | 実装 | 覚え |")
行.append("|---|---|---|---|")
for a in ある:
  行.append("| `%s` | %s | %s | %s |" % a)
行.append("")

行.append("## ★② まだ ない（%d）" % len(まだ))
行.append("")
if まだ:
  行.append("| 見本 | 題 |")
  行.append("|---|---|")
  for a in まだ:
    行.append("| `%s` | %s |" % (a[0], a[1]))
else:
  行.append("★ありません。")
行.append("")

行.append("## ★③ 作らないと 決めた（%d）" % len(作らない))
行.append("")
if 作らない:
  行.append("| 見本 | 題 | わけ | 引き金 |")
  行.append("|---|---|---|---|")
  for a in 作らない:
    行.append("| `%s` | %s | %s | %s |" % a)
else:
  行.append("★ありません。")
行.append("")
行.append("## ★道具の 較正")
行.append("")
行.append("★見本から %d 本 取り出し、★呼ばれて いる 名 %d との 差は 0 でした。"
          % (len(画面), len(呼ばれ)))
行.append("★差が 1つでも あれば、★この 道具は 覚え書きを 書かずに 止まります。")

本文 = "\n".join(行) + "\n"
本文 = 本文.replace("\n\n", "\n\n★全{丈}行 ／ 末尾は「%s」\n\n" % 行[-1], 1)
本文 = 本文.replace("{丈}", str(len(本文.splitlines())))
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("見本 %d ／ ① %d ／ ② %d ／ ③ %d" % (len(画面), len(ある), len(まだ), len(作らない)))
