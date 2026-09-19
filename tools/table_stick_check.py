# -*- coding: utf-8 -*-
"""★裁定81 §3/§5-1（表の 貼り付け）── ★いま どの 画面に 効いて いるか（★2026-09-19）

  ★★★効くには 3つ 揃う 必要が あります。
    ①`.wsv`（`SCOPE_CLASS`）の 中に 在る こと ── ★CSS が その 名の 中 だけ に かかります
    ②表の 入れ物に `.tblwrap`（`TABLE_CLASS`）が 付いて いる こと
    ③左の 列に `.stick` か `.anc` が 付いて いる こと（★横すべりの 錨）

  ★★★`<table>` を 使って いない 表（★`div` で 組んだ もの）は、
    ★★`thead th` の 決まりが 効きません。★別に 数えます。

  ★★較正 ── ★在る ものを 見つけ、★無い ものを 見つけない こと。
"""

import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KOMP = os.path.join(ROOT, "components")


def 読む(f):
  return io.open(os.path.join(KOMP, f), encoding="utf-8").read()


def main():
  vt = io.open(os.path.join(ROOT, "lib", "visualTokens.js"), encoding="utf-8").read()
  名 = re.search(r'TABLE_CLASS = "([^"]+)"', vt).group(1)
  錨 = re.findall(r'"(stick|anc)"', vt)
  殻 = re.search(r'SCOPE_CLASS = "([^"]+)"', vt).group(1)

  # ★★較正
  assert 名 == "tblwrap", "★入れ物の 名が 変わって います: " + 名
  assert set(錨) == {"stick", "anc"}, "★錨の 名が 変わって います"
  assert 殻, "★殻の 名を 読めて いません"
  # ★★★探し方の 較正 ── ★在る ものを 見つけ、★無い ものを 見つけない。
  当 = 読む("OpsRosterTable.jsx")
  assert "ANCHOR_CLASSES" in 当, "★当たりの 画面に 錨が ありません"
  assert re.search(r"<table[\s>]", 当), "★当たりの 画面に 表が ありません"
  assert not re.search(r"<table[\s>]", 読む("UiV2.jsx")), "★無い ものを 見つけて います"
  assert "TABLE_CLASS" in 読む("OpsMonka.jsx"), "★当たりの 画面に 入れ物が ありません"

  一覧 = sorted(f for f in os.listdir(KOMP) if f.endswith(".jsx"))
  表あり, 入れ物あり, 錨あり = [], [], []
  for f in 一覧:
    本 = 読む(f)
    t = len(re.findall(r"<table[\s>]", 本))
    # ★★★`className={TABLE_CLASS}` の 形も 数えます（★2026-09-19・錨と 同じ 誤り）。
    #   ★★字だけ を 探し、★入れ物を 0 と 数えて いました。
    w = (len(re.findall(re.escape(名), 本))
         + len(re.findall(r"\bTABLE_CLASS\b", 本))
         - (1 if "TABLE_CLASS" in 本 and "import" in 本 else 0))
    # ★★★`className={ANCHOR_CLASSES[1]}` の 形も 数えます（★2026-09-19）。
    #   ★★はじめ 字だけ を 探し、★錨を 0 と 数えて いました。
    #   ★★★「無い」と「探し方が ちがう」を、★同じ 顔で 出して いました。
    a = (len(re.findall(r'className="[^"]*\b(?:stick|anc)\b', 本))
         + len(re.findall(r"ANCHOR_CLASSES", 本)) - (1 if "import" in 本 and
                                                     "ANCHOR_CLASSES" in 本 else 0))
    if t:
      表あり.append((f, t, w, a))
    elif w or a:
      入れ物あり.append((f, t, w, a))
  print("★入れ物の 名 …… .%s ／ 錨 …… .stick .anc ／ 殻 …… .%s" % (名, 殻))
  print()
  print("=== `<table>` を 使って いる 画面 ===")
  if not 表あり:
    print("  ★ありません")
  for f, t, w, a in 表あり:
    print("  %-26s 表 %-3d 入れ物 %-3d 錨 %d%s"
          % (f, t, w, a, "" if w else "　★入れ物が ありません"))
  print()
  print("=== 表では ないが 入れ物・錨を 使って いる 画面 ===")
  if not 入れ物あり:
    print("  ★ありません")
  for f, t, w, a in 入れ物あり:
    print("  %-26s 入れ物 %-3d 錨 %d" % (f, w, a))


if __name__ == "__main__":
  main()
