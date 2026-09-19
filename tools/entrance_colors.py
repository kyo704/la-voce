# -*- coding: utf-8 -*-
"""★入口の 画面の 色 ── ★Q1〜Q3 の 確かめ（★裁定 その101 の 追補・2026-09-19）

  ★★★Q1 ★#7A1F2B は 入口 いがいに 使われて いないか
  ★★★Q2 ★入口に、★ほかにも ずれた 色が ないか（★緑・黄・灰・線）
  ★★★Q3 ★暗い 画面の 入口が あるか

  ★★較正 ── ★必ず 当たる 色と、★当たらない 色で 試します。
"""

import io, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
註 = re.compile(r"^\s*(//|\*|/\*)")
色 = re.compile(r"#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b")

入口 = ["app/login/page.js", "app/reset-password/page.js", "app/signup/page.js",
       "app/page.js", "app/shindan/page.js", "app/start/page.js"]

# ★★いまの 色（★`lib/tokens.js` の C から 読みます。★書き写しません）。
本 = io.open(os.path.join(ROOT, "lib", "tokens.js"), encoding="utf-8").read()
名 = dict(re.findall(r'^\s*([a-zA-Z0-9_]+):\s*"(#[0-9A-Fa-f]{3,8})"', 本, re.M))
if len(名) < 8:
  raise SystemExit("★止まりました ── いまの 色を %d しか 読めません" % len(名))
# ★★較正。
if 名.get("curtain", "").upper() != "#840C24":
  raise SystemExit("★止まりました ── 較正が 合いません（えんじが ちがいます）")


def 近い(h):
  """★いまの 色の 中で、★いちばん 近い もの。★差も 返します。"""
  def 分解(x):
    x = x.lstrip("#")
    if len(x) == 3:
      x = "".join(c * 2 for c in x)
    return [int(x[i:i + 2], 16) for i in (0, 2, 4)]
  a = 分解(h)
  出 = None
  for k, v in 名.items():
    b = 分解(v)
    d = sum((a[i] - b[i]) ** 2 for i in range(3)) ** 0.5
    if 出 is None or d < 出[1]:
      出 = (k, d, v)
  return 出


調べ = {}
for f in 入口:
  p = os.path.join(ROOT, f)
  if not os.path.exists(p):
    continue
  中 = {}
  for l in io.open(p, encoding="utf-8").read().split("\n"):
    if 註.match(l):
      continue
    for m in 色.finditer(l):
      v = m.group(0).upper()
      中[v] = 中.get(v, 0) + 1
  if 中:
    調べ[f] = 中

# ★Q1 ── ★#7A1F2B は どこに あるか。
どこ = {}
for 根, 枝, 葉 in os.walk(ROOT):
  枝[:] = [d for d in 枝 if d not in ("node_modules", ".next", ".git", "tests", "docs")]
  for g in 葉:
    if not g.endswith((".js", ".jsx")):
      continue
    q = os.path.join(根, g)
    n = 0
    for l in io.open(q, encoding="utf-8", errors="ignore").read().split("\n"):
      if 註.match(l):
        continue
      n += l.upper().count("#7A1F2B")
    if n:
      どこ[os.path.relpath(q, ROOT)] = n

# ★Q3 ── ★暗い 画面の 支度が あるか。
暗 = {}
for f in 入口:
  p = os.path.join(ROOT, f)
  if not os.path.exists(p):
    continue
  中 = io.open(p, encoding="utf-8").read()
  暗[f] = ("prefers-color-scheme" in 中) or ("data-th" in 中) or ("dark" in 中.lower())

今日 = datetime.date.today().isoformat()
行 = []
行.append("# ★入口の 画面の 色 ── ★Q1〜Q3")
行.append("")
行.append("★%s ／ ★`tools/entrance_colors.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("## ★Q1 ★#7A1F2B は どこに あるか")
行.append("")
行.append("| ファイル | 数 | 入口か |")
行.append("|---|---|---|")
for k, n in sorted(どこ.items(), key=lambda x: -x[1]):
  行.append("| `%s` | %d | %s |" % (k, n, "入口" if k in 入口 else "★入口では ありません"))
行.append("")
外 = [k for k in どこ if k not in 入口]
if 外:
  行.append("★★★入口の 外にも あります …… %s" % "／".join("`%s`" % x for x in 外))
  行.append("★★そちらも 揃えるのか、★別の ものと するのか、★決めが 要ります。")
else:
  行.append("★★入口 だけ です。")
行.append("")
行.append("## ★Q2 ★入口の 色（★いまの 色と どれだけ ちがうか）")
行.append("")
for f, 中 in 調べ.items():
  行.append("### `%s`" % f)
  行.append("")
  行.append("| 色 | のべ | いちばん 近い 名 | 差 |")
  行.append("|---|---|---|---|")
  for v, n in sorted(中.items(), key=lambda x: -x[1]):
    k, d, h = 近い(v)
    印 = "★同じ" if d == 0 else ("近い" if d < 20 else "★ちがう")
    行.append("| `%s` | %d | `%s`（%s） | %.0f %s |" % (v, n, k, h, d, 印))
  行.append("")
行.append("## ★Q3 ★暗い 画面の 支度")
行.append("")
行.append("| ファイル | 支度 |")
行.append("|---|---|")
for f, b in 暗.items():
  行.append("| `%s` | %s |" % (f, "あり" if b else "★ありません"))
行.append("")
行.append("★★★暗い 画面が 無ければ、★そちらの 直しは 要りません。")
行.append("")
行.append("## ★この 調べに できない こと")
行.append("")
行.append("★★字を 読んで います。★描かれた 姿を 見て いません。")
行.append("★★★写真は 坂本さんに お願いします。★私には 撮れません。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出 = os.path.join(ROOT, "docs", "reports", "%s-入口の色の調べ.md" % 今日)
io.open(出, "w", encoding="utf-8").write(本文)
print(出)
print("#7A1F2B …… %d ファイル ／ 入口の 外 %d" % (len(どこ), len(外)))
