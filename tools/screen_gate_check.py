# -*- coding: utf-8 -*-
"""★その 画面は 門の 中か ── ★名では なく、★置き所で 確かめます（★2026-09-19）

  ★★★坂本さんの お指図（★D65）──
    ★「"V2" と 名の つく 画面は 門の 中と 見なす。★ただし 念のため、
      ★各画面で 実際に `layoutV2` の 条件分岐が あるか、★簡易確認してから」。

  ★★★名は しるし です。★証しでは ありません。
    ★★`WardrobePanel` ／ `MyTimetable` ／ `SheepShelf` には V2 が ありません。
    ★★`RecordV2Head` には V2 が あります。★けれど 名で 決めません。

  ★★★調べ方
    ①その 画面を 置いて いる 行を、★全部の 部品から 探します。
    ②その 行を 囲って いる 条件を **字下げ** で たどります。
    ③置き手 自身が 門の 中だけ なら、★置かれた 側も 門の 中 です（★2段 まで）。

  ★★較正 ── ★当たり（VocalTracker の 門の中）・外れ（無い 名）・閉じた節。
"""

import io
import os
import re
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KOMP = os.path.join(ROOT, "components")
註 = re.compile(r"^\s*(//|\*|/\*)")
門の外 = re.compile(r"!layoutV2")
# ★★★`className={layoutV2 ? "a" : "b"}` は 門では ありません（★2026-09-19）。
#   ★★着せる 名を 変える だけ です。★出す 出さないを 決めて いません。
#   ★★★ここを 門と 読んで、★レッスンモードの 図を「門の中」と 取り違えました。
門の中 = re.compile(r"(?<!className=\{)layoutV2\s*(&&|\?)")
# ★★★運営の 道（★2026-09-19）。★`layoutV2` の 門では ありませんが、
#   ★★届く 先は 学校に 入って いる 方 だけ で、★12画面は もう 6段 です。
#   ★★★`Renraku` を「古い画面」と 読んで いました ── ★本当は 運営の 画面 でした。
運営 = re.compile(r"mayEnterOps\(")
DAN = [12, 12.5, 13, 13.5, 14.5, 15.5]


def 読む(f):
  return io.open(os.path.join(KOMP, f), encoding="utf-8").read()


def 深さ(l):
  return len(l) - len(l.lstrip())


def 門(行, i):
  d = 深さ(行[i])
  for j in range(i - 1, -1, -1):
    l = 行[j]
    if 註.match(l) or not l.strip():
      continue
    if 深さ(l) < d:
      d = 深さ(l)
      if 門の外.search(l):
        return "門の外"
      if 門の中.search(l):
        return "門の中"
      if 運営.search(l):
        return "運営の道"
      if d == 0:
        break
  return "門を通らない"


def 大きさ(本):
  出 = []
  # ★★★三項も 拾います（★2026-09-19）。
  #   ★★`fontSize: rem(六段 ? 12.5 : 11.5)` を 見落として いました。
  #   ★★★見えなく なった 字は、★直った ことに なりません。
  for 式 in re.findall(r"fontSize:\s*([^,}\n]+)", 本):
    # ①字で 書いた もの …… "0.75rem" ／ "12px"
    for a, t2 in re.findall(r'"([\d.]+)(rem|px)"', 式):
      出.append(float(a) * (16 if t2 == "rem" else 1))
    # ②`rem(…)` の 中の 数 …… ★三項も 拾います（`rem(六段 ? 12.5 : 11.5)`）
    for なか in re.findall(r"rem\(([^)]*)\)", 式):
      出 += [float(x) for x in re.findall(r"\d+(?:\.\d+)?", なか)]
    # ③そのままの 数 …… `fontSize: 12`
    if not re.search(r'"|rem\(', 式):
      出 += [float(x) for x in re.findall(r"^\s*(\d+(?:\.\d+)?)\s*$", 式)]
  return 出


def 置き所(名, ファイル一覧):
  """★その 画面が 置かれて いる ところを、★門つきで 返します。"""
  さがす = re.compile(r"<%s(?![A-Za-z0-9_])" % re.escape(名))
  出 = []
  for f in ファイル一覧:
    if f == 名 + ".jsx":
      continue
    本 = 読む(f)
    if not さがす.search(本):
      continue
    行 = 本.split("\n")
    for i, l in enumerate(行):
      if 註.match(l) or not さがす.search(l):
        continue
      出.append((f, i + 1, 門(行, i)))
  return 出


def 判じ(名, 一覧, 深, 見た):
  """★その 画面が 誰に 届くか。★2段 まで たどります。"""
  if 名 in 見た or 深 > 2:
    return "分かりません"
  見た = 見た | {名}
  所 = 置き所(名, 一覧)
  if not 所:
    return "置いて いません"
  判 = set()
  for f, _, ど in 所:
    if ど in ("門の中", "運営の道"):
      判.add("門の中" if ど == "門の中" else "運営")
    elif ど == "門の外":
      判.add("古い画面")
    else:
      # ★★置き手 自身を たどります。
      親 = f[:-4]
      上 = 判じ(親, 一覧, 深 + 1, 見た)
      判.add("門の中" if 上 == "門の中だけ" else "古い画面")
  if 判 == {"門の中"}:
    return "門の中だけ"
  if 判 == {"運営"}:
    return "運営の画面だけ"
  if 判 == {"門の中", "運営"}:
    return "門の中と 運営だけ"
  if 判 == {"古い画面"}:
    return "古い画面"
  return "混ざって います"


def main():
  一覧 = sorted(f for f in os.listdir(KOMP) if f.endswith(".jsx"))

  # ★★較正
  assert 門(["if (layoutV2 && a) {", "  <A />"], 1) == "門の中"
  assert 門(["if (!layoutV2) {", "  <A />"], 1) == "門の外"
  閉じた = ["{layoutV2 && (", "  <A />", ")}", '{activeTab === "info" && (', "  <B />"]
  assert 門(閉じた, 4) == "門を通らない", "★閉じた 節を 拾って います"
  運 = ["if (mayEnterOps(gate)) {", "  <A />"]
  assert 門(運, 1) == "運営の道", "★運営の 道を 見分けて いません"
  # ★★★着せる 名の 三項は 門では ありません（★2026-09-19・取り違えました）。
  着せる = ['<div className={layoutV2 ? "woolsong-v2" : undefined}>', "  <A />"]
  assert 門(着せる, 1) == "門を通らない", "★className の 三項を 門と 読んで います"
  assert 置き所("アリマセン", 一覧) == [], "★無い 名を 拾って います"
  # ★★大きさの 較正 ── ★三項・字・そのままの 数・余白。
  assert 大きさ("fontSize: rem(六段 ? 12.5 : 11.5)") == [12.5, 11.5], "★三項を 落として います"
  assert 大きさ('fontSize: "0.75rem"') == [12.0]
  assert 大きさ("fontSize: 12") == [12.0]
  assert 大きさ("padding: rem(4)") == [], "★余白を 字と 数えて います"
  assert 置き所("OpsShell", 一覧), "★在る 名を 拾えて いません"

  行 = []
  行.append("# ★その 画面は 門の 中か（★置き所で 確かめました）")
  行.append("")
  行.append("★%s ／ ★`tools/screen_gate_check.py` が 書きました。"
            % datetime.date.today().isoformat())
  行.append("")
  行.append("| 画面 | 12未満 | 6段の外 | 届く 先 | 置き所 |")
  行.append("|---|---|---|---|---|")
  表 = []
  for f in 一覧:
    本 = 読む(f)
    v = 大きさ(本)
    未満 = len([x for x in v if x < 12])
    段外 = len([x for x in v if 12 <= x < 16 and x not in DAN])
    if not (未満 or 段外):
      continue
    名 = f[:-4]
    if 名 in ("VocalTracker",):
      continue
    ど = 判じ(名, 一覧, 0, set())
    所 = 置き所(名, 一覧)
    行.append("| `%s` | %d | %d | %s | %s |"
              % (f, 未満, 段外, ど,
                 "／".join("%s:%d(%s)" % (a[:-4], b, c) for a, b, c in 所) or "―"))
    表.append((f, 未満, 段外, ど))

  みち = os.path.join(ROOT, "docs", "reports",
                     "%s-画面の門しらべ.md" % datetime.date.today().isoformat())
  io.open(みち, "w", encoding="utf-8").write("\n".join(行) + "\n")
  print("REPORT: %s" % os.path.relpath(みち, ROOT))
  for f, 未満, 段外, ど in 表:
    print("  %-26s 12未満 %-3d 段外 %-3d %s" % (f, 未満, 段外, ど))


if __name__ == "__main__":
  main()
