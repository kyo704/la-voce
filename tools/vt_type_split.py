# -*- coding: utf-8 -*-
"""★VocalTracker の 字 ── ★門の 中か、★38人の 古い 画面にも 出るか（★2026-09-19）

  ★★★裁定 その103 を VocalTracker に 当てる 前に、★当たる 範囲を 分けます。
    ★★坂本さんの お指図 ──
      ★「今の 個人画面と 開発中の 個人画面は 別。★開発中の 画面だけ 変える」。

  ★★★分け方（★`tools/uiv2_gate_split.py` と 同じ 決め）
    ★その 行を 囲って いる 条件を、★**字下げ**で たどります。
    ★★「上へ N行」では 決めません ── ★閉じた 節を 通り過ぎます。
      ★★2026-09-19、★200行 の 窓で 14か所を 取り違えました。

  ★★較正 ── ★当たり・外れ・閉じた節 の 3つで 試します。
"""

import io
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VT = os.path.join(ROOT, "components", "VocalTracker.jsx")
註 = re.compile(r"^\s*(//|\*|/\*)")
門の外 = re.compile(r"!layoutV2")
門の中 = re.compile(r"layoutV2\s*(&&|\?)")
DAN = [12, 12.5, 13, 13.5, 14.5, 15.5]


def 深さ(l):
  return len(l) - len(l.lstrip())


def 門(本行, i):
  d = 深さ(本行[i])
  for j in range(i - 1, -1, -1):
    l = 本行[j]
    if 註.match(l) or not l.strip():
      continue
    if 深さ(l) < d:
      d = 深さ(l)
      if 門の外.search(l):
        return "門の外"
      if 門の中.search(l):
        return "門の中"
      if d == 0:
        break
  return "門を通らない"


def 大きさ(l):
  出 = []
  for a, b in re.findall(r'fontSize:\s*(?:"([^"]+)"|rem\(([\d.]+)\))', l):
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


def main():
  # ★★較正 ── ★当たり・外れ・閉じた節。
  assert 門(["if (layoutV2 && a) {", "  <A />"], 1) == "門の中"
  assert 門(["if (!layoutV2) {", "  <A />"], 1) == "門の外"
  閉じた = ["{layoutV2 && (", "  <A />", ")}", '{activeTab === "info" && (', "  <B />"]
  assert 門(閉じた, 4) == "門を通らない", "★閉じた 節を 拾って います"
  assert 大きさ('fontSize: rem(11.5)') == [11.5]
  assert 大きさ('padding: rem(4)') == []

  本 = io.open(VT, encoding="utf-8").read().split("\n")
  出 = {}
  for i, l in enumerate(本):
    if 註.match(l):
      continue
    for v in 大きさ(l):
      if v >= 16:
        続 = "16以上"
      elif v < 12:
        続 = "12未満"
      elif v in DAN:
        続 = "6段の中"
      else:
        続 = "6段の外"
      出.setdefault(門(本, i), {}).setdefault(続, []).append((i + 1, v))

  今日 = datetime.date.today().isoformat()
  みち = os.path.join(ROOT, "docs", "reports", "%s-VocalTrackerの字の門わけ.md" % 今日)
  with io.open(みち, "w", encoding="utf-8") as f:
    f.write("# ★VocalTracker の 字 ── ★門の 中か、★38人にも 出るか\n\n")
    f.write("★%s ／ ★`tools/vt_type_split.py` が 書きました。\n\n" % 今日)
    f.write("| どこ | 12未満 | 6段の外 | 6段の中 | 16以上 |\n|---|---|---|---|---|\n")
    for ど in ["門の中", "門を通らない", "門の外"]:
      d = 出.get(ど, {})
      f.write("| %s | %d | %d | %d | %d |\n"
              % (ど, len(d.get("12未満", [])), len(d.get("6段の外", [])),
                 len(d.get("6段の中", [])), len(d.get("16以上", []))))
    for ど in ["門の中", "門を通らない", "門の外"]:
      for 続 in ["12未満", "6段の外"]:
        # ★★中身も 出します。★数だけでは 直せません。
        並 = 出.get(ど, {}).get(続, [])
        if 並:
          f.write("\n## ★%s ／ %s（%d件）\n\n" % (ど, 続, len(並)))
          for 行, v in 並:
            f.write("- %d 行 …… %s px　`%s`\n" % (行, v, 本[行 - 1].strip()[:70]))
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  for ど in ["門の中", "門を通らない", "門の外"]:
    d = 出.get(ど, {})
    print("%-12s 12未満 %-4d 6段の外 %-4d 6段の中 %-4d 16以上 %d"
          % (ど, len(d.get("12未満", [])), len(d.get("6段の外", [])),
             len(d.get("6段の中", [])), len(d.get("16以上", []))))


if __name__ == "__main__":
  main()
