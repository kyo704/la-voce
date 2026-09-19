# -*- coding: utf-8 -*-
"""★VocalTracker の 生の 色 ── ★門の 中か、★38人にも 出るか（★2026-09-19）

  ★★★裁定 その81 §1 を 当てる 前に、★当たる 範囲を 分けます。
    ★★門の 中（`layoutV2`）だけ に 出る ところ と、
    ★★門の 外（★38人）にも 出る ところ を、★別に 数えます。

  ★★★分け方（★機械に できる ところ まで）
    ★★その 行から 上へ たどり、★いちばん 近い 目印を 見ます ──
      ★`!layoutV2` …… ★門の 外
      ★`layoutV2 &&` ／ `layoutV2 ?` …… ★門の 中
    ★★見つからなければ「どちらにも 出うる」に します。
    ★★★これは 見立て です。★確かめは 実機 です。

  ★★較正 ── ★必ず 当たる ものと、★当たらない もので 試します。
"""

import io, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
みち = os.path.join(ROOT, "components", "VocalTracker.jsx")
本 = io.open(みち, encoding="utf-8").read().split("\n")

色 = re.compile(r"#[0-9A-Fa-f]{3,8}\b|rgba?\(")
註 = re.compile(r"^\s*(//|\*|/\*)")
門の外 = re.compile(r"!layoutV2")
門の中 = re.compile(r"layoutV2\s*(&&|\?)")

# ★★較正 ── ★目印が 本当に ある か。
if not any(門の中.search(l) for l in 本):
  raise SystemExit("★止まりました ── 門の 目印が ありません。道具が 壊れて います。")
if any(門の中.search("ここには ありません") for _ in [0]):
  raise SystemExit("★止まりました ── 無い はずの ものが 当たりました。")

出 = {"中": [], "外": [], "どちらも": []}
for i, l in enumerate(本):
  if 註.match(l) or not 色.search(l):
    continue
  # ★★上へ 200行 まで たどります。
  印 = "どちらも"
  for j in range(i, max(-1, i - 200), -1):
    上 = 本[j]
    if 註.match(上):
      continue
    if 門の外.search(上):
      印 = "外"; break
    if 門の中.search(上):
      印 = "中"; break
  出[印].append((i + 1, l.strip()[:70]))

今日 = datetime.date.today().isoformat()
行 = []
行.append("# ★VocalTracker の 生の 色 ── ★門の 中か、★外か")
行.append("")
行.append("★%s ／ ★`tools/vt_color_split.py` が 書きました。" % 今日)
行.append("★（★丈は 下に あります）")
行.append("")
行.append("★★★38人に 出る ところは、★別に 数えます。★同じ 直しを 一度に しません。")
行.append("")
行.append("| どこ | 数 |")
行.append("|---|---|")
行.append("| 門の 中（`layoutV2`）だけ | %d |" % len(出["中"]))
行.append("| ★門の 外（38人）にも 出る | %d |" % len(出["外"]))
行.append("| どちらにも 出うる（目印 なし） | %d |" % len(出["どちらも"]))
行.append("| 合計 | %d |" % sum(len(v) for v in 出.values()))
行.append("")
for 名, 題 in (("中", "★門の 中 だけ"), ("外", "★★門の 外（38人）にも 出る"),
             ("どちらも", "★どちらにも 出うる")):
  行.append("## %s（%d）" % (題, len(出[名])))
  行.append("")
  if not 出[名]:
    行.append("★ありません。")
    行.append("")
    continue
  行.append("| 行 | 中身 |")
  行.append("|---|---|")
  for n, t in 出[名][:40]:
    行.append("| %d | `%s` |" % (n, t.replace("|", "／")))
  if len(出[名]) > 40:
    行.append("| … | ★ほか %d 行 |" % (len(出[名]) - 40))
  行.append("")

行.append("## ★この 分け方の 限り")
行.append("")
行.append("★★上へ 200行 たどって、★いちばん 近い 目印を 見て います。")
行.append("★★★入れ子の 奥では、★外の 目印を 拾えない ことが あります。")
行.append("★★「どちらにも 出うる」は、★助けの 関数や 定数の 中 です。")
行.append("★★★当てる ときは、★門の 中 から 始めます。★外は 最後 です。")

本文 = "\n".join(行) + "\n"
丈 = len(本文.splitlines())
本文 = 本文.replace("★（★丈は 下に あります）",
                   "★全%d行 ／ 末尾は「%s」" % (丈, 行[-1]), 1)
出先 = os.path.join(ROOT, "docs", "reports", "%s-個人本体の色の内訳.md" % 今日)
io.open(出先, "w", encoding="utf-8").write(本文)
print(出先)
print("中 %d ／ 外 %d ／ どちらも %d"
      % (len(出["中"]), len(出["外"]), len(出["どちらも"])))
