#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""★下ごしらえを 通って いない 検査を 数えます（★裁定135 の 5度目・2026-09-21）。

  ★★★なぜ 要るか
    ★★`lib/strip.js` に 穴が あり、★註 700行 が 外れません でした。
    ★★同じ 形の 穴は、★**自分で 書いた 下ごしらえ** から 生まれます。
    ★★だから「共通の ものを 通って いるか」を 数えます。

  ★★★数える 先は「立って いる 検査」だけ です。
    ★★`tools/` には 一度きりの 調べ物が 100本 以上 あります。
      ★★あれらは 走らせた その日 の ため の もの です。
      ★★全部を 直すのは 骨折り で、★直した ところで 誰も 走らせません。
    ★★★立って いる 検査 ── ★仕事を 止める 力の ある もの。
      ★その 一覧を 下に 名ざしで 持ちます。★増えたら ここに 足します。

  ★★通って いない ものは、★わけと 外す 条件を 添えて 名ざしします。
    ★★名ざしの 無い ものが 1つでも あれば 落ちます。

  ★較正 …… `python3 tools/strip_usage_check.py --selftest`
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# ★立って いる 検査（★仕事を 止める 力の ある もの）。
立ッテイル = [
  "price_hardcode_scan.py",
  "gate_mismatch.py",
  "insp_perm_matrix.py",
  "promise_extract.py",
]

# ★通って いない ことを 承知して いる もの（★わけ と 外す 条件）。
ショウチ = {
  "gate_mismatch.py": {
    "わけ": "SQL と JS の 両方を 見ます。SQL 側の 下ごしらえは 台帳の 問い"
            "（regexp_replace）で して います。JS 側は この 紙の 中に 写しが あります",
    "when": "SQL 側の 下ごしらえも Python に 移す 日。"
            "そのとき strip_common に SQL の 形を 足します",
  },
  "insp_perm_matrix.py": {
    "わけ": "役職の 名（\"owner\" など）を 字の 中から 探します。"
            "字を 残す 下ごしらえと 相性が よく、いまの 形で 正しく 動いて います",
    "when": "この 検査が 註の 中の 役職名を 拾った 日",
  },
  "promise_extract.py": {
    "わけ": "見本（HTML）を 読みます。JavaScript の 下ごしらえでは ありません",
    "when": "見本の 中の <script> だけを 見る ように なった 日",
  },
}


def 使っているか(名):
  t = open(os.path.join(HERE, 名), encoding="utf-8").read()
  return "strip_common" in t


def main():
  通ラナイ = [n for n in 立ッテイル
              if os.path.exists(os.path.join(HERE, n)) and not 使っているか(n)]
  名ザシ無シ = [n for n in 通ラナイ if n not in ショウチ]
  古イ名ザシ = [n for n in ショウチ if n not in 通ラナイ]

  print("STRIP_USAGE_CHECK 立って いる 検査 %d 本" % len(立ッテイル))
  for n in 立ッテイル:
    印 = "○" if 使っているか(n) else ("△" if n in ショウチ else "✗")
    print("  %s %s" % (印, n))
  for n in 名ザシ無シ:
    print("★落ちました ── `%s` が 共通の 下ごしらえを 通って いません。" % n)
    print("　★`strip_common` を 使うか、★わけと 外す 条件を 添えて")
    print("　★`tools/strip_usage_check.py` の `ショウチ` に 名ざして ください。")
  for n in 古イ名ザシ:
    print("★落ちました ── `%s` は 通る ように なりました。" % n)
    print("　★`ショウチ` から 外して ください。★古い 一覧は 嘘を つきます。")
  if 名ザシ無シ or 古イ名ザシ:
    return 1
  for n in sorted(ショウチ):
    print("　（承知）%s …… %s" % (n, ショウチ[n]["when"]))
  print("RESULT: PASS（通って いない ものは、すべて 名ざし済み）")
  return 0


def selftest():
  """★較正 ── ★名ざしを 外すと 落ちる。★戻すと 通る。"""
  ok = True
  もと = dict(ショウチ)
  ショウチ.pop("promise_extract.py", None)
  if main() == 0:
    print("SELFTEST FAIL: 名ざしを 外しても 通った")
    ok = False
  ショウチ.clear()
  ショウチ.update(もと)
  ショウチ["__ありません__.py"] = {"わけ": "", "when": ""}
  if main() == 0:
    print("SELFTEST FAIL: 古い 名ざしが あっても 通った")
    ok = False
  ショウチ.pop("__ありません__.py")
  if main() != 0:
    print("SELFTEST FAIL: 正しい 形で 落ちた")
    ok = False
  print("SELFTEST", "PASS" if ok else "FAIL")
  return 0 if ok else 2


if __name__ == "__main__":
  sys.exit(selftest() if "--selftest" in sys.argv else main())
