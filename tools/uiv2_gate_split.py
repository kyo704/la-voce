# -*- coding: utf-8 -*-
"""★共通部品 UiV2 ── ★門の 中だけ か、★38人にも 出るか（★2026-09-19）

  ★★★裁定 その103（★文字の 6段）を UiV2 に 当てる 前に、★当たる 範囲を 分けます。
    ★★UiV2 は 部品の 蔵 です。★どこから 呼ばれて いるかで、★届く 人が 変わります。

  ★★★分け方
    ①UiV2 の 出しもの（`export`）を 数えます。
    ②その 名を 呼んで いる ファイルを 探します（★自分自身は 除きます）。
    ③呼び手の ファイルが「門の 中だけ」か どうかを 見ます ──
        ★`components/*V2.jsx` …… ★門の 中だけ の 画面（★名で 分かります）
        ★`VocalTracker.jsx` …… ★行ごとに 上へ たどり、★`layoutV2` の 印を 見ます
        ★その他 …… ★38人にも 出る と 見なします（★安全な ほうへ 倒します）

  ★★★これは 見立て です。★確かめは 実機 です。

  ★★較正 ── ★必ず 当たる ものと、★当たらない もので 試します。
"""

import io
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UIV2 = os.path.join(ROOT, "components", "UiV2.jsx")
VT = os.path.join(ROOT, "components", "VocalTracker.jsx")

註 = re.compile(r"^\s*(//|\*|/\*)")
門の外 = re.compile(r"!layoutV2")
# ★★★`className={layoutV2 ? "a" : "b"}` は 門では ありません（★2026-09-19）。
#   ★★着せる 名を 変える だけ です。★出す 出さないを 決めて いません。
#   ★★★ここを 門と 読んで、★レッスンモードの 図を「門の中」と 取り違えました。
門の中 = re.compile(r"(?<!className=\{)layoutV2\s*(&&|\?)")
DAN = [12, 12.5, 13, 13.5, 14.5, 15.5]


def 読む(p):
  return io.open(p, encoding="utf-8").read()


def 出しもの(本):
  """★`export function X` ／ `export const X` の 名。"""
  return sorted(set(re.findall(
    r"^export\s+(?:default\s+)?(?:function|const)\s+([A-Za-z_$][\w$]*)",
    本, re.M)))


def 大きさ(本):
  """★fontSize の 値（px）だけ を 拾います。★余白の rem は 拾いません。"""
  出 = []
  for a, b in re.findall(r'fontSize:\s*(?:"([^"]+)"|rem\(([\d.]+)\))', 本):
    if b:
      出.append(float(b))
    else:
      m = re.match(r"^([\d.]+)rem$", a)
      if m:
        出.append(float(m.group(1)) * 16)
      else:
        m = re.match(r"^([\d.]+)px$", a)
        if m:
          出.append(float(m.group(1)))
  return 出


def 深さ(l):
  return len(l) - len(l.lstrip())


def 囲い(本行, i):
  """★その 行を 囲って いる 条件を、★字下げで たどります。

    ★★★上へ 何行 たどるか、では 決めません（★2026-09-19）。
      ★★`{activeTab === "analysis" && !layoutV2 && (` は 2700行 上に あり、
        ★★けれど その 節は とっくに 閉じて いました。
      ★★★「近い 行」では なく、★「自分より 浅い 行」を たどります。
        ★★閉じた 節は、★字下げが 戻るので 通り過ぎません。
  """
  出 = []
  d = 深さ(本行[i])
  for j in range(i - 1, -1, -1):
    l = 本行[j]
    if 註.match(l) or not l.strip():
      continue
    if 深さ(l) < d:
      d = 深さ(l)
      出.append(l)
      if d == 0:
        break
  return 出


def 門(本行, i):
  """★門の 中か、★外か、★印が 無いか。

    ★★★印が 無い ＝ ★門を 通りません ＝ ★38人の 古い 画面にも 出ます。
      ★★「分からない」では ありません。★通らない、と いう 答え です。
  """
  for l in 囲い(本行, i):
    if 門の外.search(l):
      return "外"
    if 門の中.search(l):
      return "中"
  return "印が無い"


def どの門(f):
  """★その ファイルが 誰に 届くか。

    ★★`*V2.jsx` …… ★`layoutV2` の 門の 中だけ（★坂本さんだけ）
    ★★`Ops*.jsx` …… ★運営の 画面（★学校に 入って いる 方だけ・★済み）
    ★★それ以外 …… ★38人にも 出ます（★安全な ほうへ 倒します）
  """
  if f.endswith("V2.jsx"):
    return "門の中だけ"
  if f.startswith("Ops"):
    return "運営の画面（済み）"
  return "★38人にも出る"


def main():
  uiv2 = 読む(UIV2)
  名 = 出しもの(uiv2)

  # ★★較正 ── ★当たりと 外れ。
  assert "Ask" in 名 or len(名) > 5, "★出しものを 読めて いません"
  assert 大きさ('fontSize: rem(11.5)') == [11.5], "★道具が 壊れて います"
  assert 大きさ('padding: rem(4)') == [], "★余白を 字と 数えて います"
  assert 門(["if (!layoutV2) {", "  x"], 1) == "外", "★印の 見分けが 壊れて います"
  assert 門(["if (layoutV2 && y) {", "  x"], 1) == "中", "★印の 見分けが 壊れて います"
  # ★★★閉じた 節を 通り過ぎない こと（★これが 直した ところ です）。
  閉じた = ["{layoutV2 && (", "  <A />", ")}", "{activeTab === \"info\" && (", "  <B />"]
  assert 門(閉じた, 4) == "印が無い", "★閉じた 節を 拾って います"
  # ★★★着せる 名の 三項は 門では ありません（★2026-09-19・取り違えました）。
  着せる = ['<div className={layoutV2 ? "woolsong-v2" : undefined}>', "  <A />"]
  assert 門(着せる, 1) == "印が無い", "★className の 三項を 門と 読んで います"
  assert 門(閉じた, 1) == "中", "★開いて いる 節を 落として います"

  # ★① UiV2 の 中の 字の 大きさ
  数 = {}
  for v in 大きさ(uiv2):
    数[v] = 数.get(v, 0) + 1
  未満 = sum(n for v, n in 数.items() if v < 12)
  段外 = sum(n for v, n in 数.items() if 12 <= v < 16 and v not in DAN)

  # ★② 呼び手
  呼び手 = {}
  for f in sorted(os.listdir(os.path.join(ROOT, "components"))):
    if not f.endswith(".jsx") or f == "UiV2.jsx":
      continue
    本 = 読む(os.path.join(ROOT, "components", f))
    if "UiV2" not in 本:
      continue
    # ★★★UiV2 から 取り寄せて いる ことを、★まず 確かめます。
    #   ★★名が 出て くる だけ では 足りません（★同じ 名の 別物が あります）。
    if not re.search(r'from\s+"@/components/UiV2"', 本):
      continue
    # ★★★置いて いる ところ（`<Name`）だけ を 数えます。
    つかう = [n for n in 名 if re.search(r"<%s[\s/>]" % re.escape(n), 本)]
    if つかう:
      呼び手[f] = つかう

  # ★③ VocalTracker の 中は 行ごとに 見ます。
  vt行 = 読む(VT).split("\n")
  vt = {"中": 0, "外": 0, "印が無い": 0}
  どちらも = []
  使った名 = set(呼び手.get("VocalTracker.jsx", []))
  つかい所 = re.compile(r"<(%s)[\s/>]" % "|".join(re.escape(n) for n in 使った名)) \
    if 使った名 else None
  if つかい所:
    for i, l in enumerate(vt行):
      if 註.match(l) or not つかい所.search(l):
        continue
      印 = 門(vt行, i)
      vt[印] += 1
      if 印 != "中":
        どちらも.append((i + 1, l.strip()[:80]))

  # ★④ 12未満 の 字が、★どの 部品の 中に あるか。
  #   ★★その 部品を 呼んで いるのが 誰かで、★届く 人が 決まります。
  本行 = uiv2.split("\n")
  区切り = re.compile(
    r"^export\s+(?:default\s+)?(?:function|const)\s+([A-Za-z_$][\w$]*)")
  今の名 = None
  部品ごと = {}
  for l in 本行:
    m = 区切り.match(l)
    if m:
      今の名 = m.group(1)
    if 註.match(l):
      continue
    for v in 大きさ(l):
      if v < 12 and 今の名:
        部品ごと.setdefault(今の名, []).append(v)

  届き = {}
  for 部品, 値 in 部品ごと.items():
    どこ = sorted({どの門(k) for k, ns in 呼び手.items() if 部品 in ns})
    届き[部品] = (値, どこ or ["★呼び手が 見つかりません"])

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-UiV2の門の内と外.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as f:
    f.write("# ★共通部品 UiV2 ── ★門の 中か、★38人にも 出るか\n\n")
    f.write("★%s ／ ★`tools/uiv2_gate_split.py` が 書きました。\n\n" % 今日)
    f.write("## ① UiV2 の 字の 大きさ\n\n")
    f.write("- 12未満 …… %d\n- 段外（12〜16で 6段に 無い）…… %d\n" % (未満, 段外))
    f.write("- 内訳 …… %s\n\n" % dict(sorted(数.items())))
    f.write("## ② UiV2 を 呼んで いる ファイル\n\n")
    for k in sorted(呼び手):
      f.write("- %s …… %s（%d 種）\n" % (k, どの門(k), len(呼び手[k])))
    f.write("\n## ③ VocalTracker の 中の 置き所\n\n")
    f.write("- 門の 中 …… %d\n- 門の 外 …… %d\n- 門を 通らない（★38人にも 出ます）…… %d\n\n"
            % (vt["中"], vt["外"], vt["印が無い"]))
    f.write("### ★門の 外 ／ 門を 通らない ところ（★38人の 画面）\n\n")
    for 番, 字 in どちらも:
      f.write("- %d 行 …… `%s`\n" % (番, 字))
    f.write("\n## ④ 12未満 の 字は、★どの 部品の 中に あるか\n\n")
    f.write("| 部品 | 12未満 | 届く 先 |\n|---|---|---|\n")
    for 部品 in sorted(届き):
      値, どこ = 届き[部品]
      f.write("| `%s` | %s | %s |\n"
              % (部品, "・".join(str(x) for x in 値), "／".join(どこ)))
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  print("UIV2_12未満: %d ／ 段外: %d" % (未満, 段外))
  print("UIV2_内訳: %s" % dict(sorted(数.items())))
  for k in sorted(呼び手):
    print("  %-26s %s (%d)" % (k, どの門(k), len(呼び手[k])))
  print("VT: 門の中 %d ／ 門の外 %d ／ 門を通らない %d"
        % (vt["中"], vt["外"], vt["印が無い"]))
  print("--- 12未満 の 部品 ---")
  for 部品 in sorted(届き):
    値, どこ = 届き[部品]
    print("  %-14s %-14s %s"
          % (部品, "・".join(str(x) for x in 値), "／".join(どこ)))


if __name__ == "__main__":
  main()
