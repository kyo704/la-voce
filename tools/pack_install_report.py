# -*- coding: utf-8 -*-
"""★荷（見本の パック）を 入れ替えた ときの 覚え書き（★2026-09-19）

  ★★★この 1本が 数え、★この 1本が 書きます。

  ★★較正 ── ★4本 そろって いない なら 止まります。
"""

import io, os, re, sys, datetime, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
新 = os.path.join(ROOT, "docs", "opus", "visual-2026-09-18", "pack")
旧 = os.path.join(ROOT, "docs", "opus", "visual-2026-09-18", sys.argv[1]
                  if len(sys.argv) > 1 else "_prev-第8版")

見本 = ["00-動く見本-PC・iPad（個人）.html", "00-動く見本-PC・iPad（運営）.html",
       "00-動く見本-iPhoneで開く用.html", "00-動く見本（さわれる・全画面）.html"]

for d in (新, 旧):
  if not os.path.isdir(d):
    raise SystemExit("★止まりました ── ありません: " + d)
足りない = [f for f in 見本 if not os.path.exists(os.path.join(新, f))]
if 足りない:
  raise SystemExit("★止まりました ── 4本 そろって いません: " + " ".join(足りない))


def 印(みち):
  return hashlib.sha256(io.open(みち, "rb").read()).hexdigest()[:12]


def 関数(みち):
  return set(re.findall(r"function (\w+)\s*\(", io.open(みち, encoding="utf-8").read()))


行 = []
今日 = datetime.date.today().isoformat()
行.append("# ★見本の 荷を 入れ替えました")
行.append("")
行.append("★%s ／ ★`tools/pack_install_report.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★新しい 荷 …… `%s`" % os.path.relpath(新, ROOT))
行.append("★前の 荷 …… `%s`" % os.path.relpath(旧, ROOT))
行.append("")
行.append("## ★4本の 見本")
行.append("")
行.append("| 見本 | 丈 | 前と 同じか | 増えた 仕掛け |")
行.append("|---|---|---|---|")
変わった = 0
for f in 見本:
  a, b = os.path.join(旧, f), os.path.join(新, f)
  同 = os.path.exists(a) and 印(a) == 印(b)
  ふえ = sorted(関数(b) - 関数(a)) if os.path.exists(a) else []
  if not 同:
    変わった += 1
  行.append("| %s | %d | %s | %s |" % (
    f, os.path.getsize(b), "同じ" if 同 else "★ちがう",
    "／".join("`%s`" % x for x in ふえ) or "（なし）"))
行.append("")

新書 = sorted(set(os.listdir(新)) - set(os.listdir(旧)))
消書 = sorted(set(os.listdir(旧)) - set(os.listdir(新)))
行.append("## ★書きもの")
行.append("")
行.append("★増えた …… %s" % ("／".join("`%s`" % x for x in 新書) or "（なし）"))
行.append("★減った …… %s" % ("／".join("`%s`" % x for x in 消書) or "（なし）"))
行.append("")
for x in 新書:
  p = os.path.join(新, x)
  if not x.endswith(".md"):
    continue
  中 = io.open(p, encoding="utf-8").read()
  行.append("### `%s`" % x)
  行.append("")
  行.append("★%d行。" % len(中.splitlines()))
  頭 = [l for l in 中.splitlines() if l.startswith("## ")]
  行.append("★節 …… %s" % "／".join(h[3:] for h in 頭))
  行.append("")

行.append("## ★退いた 荷")
行.append("")
行.append("★`docs/opus/visual-2026-09-18/` の 下 …… %s"
          % "／".join(sorted(x for x in os.listdir(os.path.dirname(新)) if x.startswith("_prev"))))
行.append("")
行.append("★★★消して いません。★前の 版は そのまま 置いて あります。")
行.append("")
行.append("## ★この 覚え書きに 書いて いない こと")
行.append("")
行.append("★★中身の 良し悪しを 見て いません。★何が 増えたかを 数えた だけ です。")
行.append("★★★見た目は 確かめて いません（`VISUAL: UNVERIFIED`）。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-見本の荷の入れ替え.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("見本 4本 ／ ちがう %d ／ 増えた 書きもの %d" % (変わった, len(新書)))
