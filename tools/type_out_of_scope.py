# -*- coding: utf-8 -*-
"""★裁定81 §2（★文字の 6段）の 対象外 ── ★古い 画面 だけ の 画面を 数えます（★2026-09-19）

  ★★★坂本さんの お決め（★D67）── ★「触らない」。
    ★★開発中の 画面 だけ 変えます。★いまの 一般の 画面は 変えません。

  ★★★この 道具は 台帳に 貼る 表を 作ります。★手で 書きません。
    ★★数が 動いたら、★もう一度 走らせて 貼り直します。

  ★★届き先の 見分けは `tools/screen_gate_check.py` に 任せます。★2つ 持ちません。
"""

import importlib.util
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def 読み込む():
  みち = os.path.join(ROOT, "tools", "screen_gate_check.py")
  仕 = importlib.util.spec_from_file_location("gate", みち)
  m = importlib.util.module_from_spec(仕)
  仕.loader.exec_module(m)
  return m


def main():
  g = 読み込む()
  一覧 = sorted(f for f in os.listdir(os.path.join(ROOT, "components"))
                if f.endswith(".jsx"))
  DAN = [12, 12.5, 13, 13.5, 14.5, 15.5]
  行, 合未満, 合段外 = [], 0, 0
  for f in 一覧:
    本 = g.読む(f)
    v = g.大きさ(本)
    未満 = len([x for x in v if x < 12])
    段外 = len([x for x in v if 12 <= x < 16 and x not in DAN])
    if not (未満 or 段外):
      continue
    名 = f[:-4]
    if 名 == "VocalTracker":
      continue
    ど = g.判じ(名, 一覧, 0, set())
    if ど not in ("古い画面", "置いて いません", "混ざって います"):
      continue
    行.append((f, 未満, 段外, ど))
    合未満 += 未満
    合段外 += 段外

  # ★★較正 ── ★1件も 出ないのは おかしい（★古い 画面は 在ります）。
  if not 行:
    raise SystemExit("★止まりました ── 1件も 出ません。道具を お確かめ ください")

  出 = []
  出.append("★%d画面 ／ 12未満 %d ／ 6段の外 %d（★%s に 数えました）"
            % (len(行), 合未満, 合段外, "2026-09-19"))
  出.append("")
  出.append("| 画面 | 12未満 | 6段の外 | 届く 先 |")
  出.append("|---|---|---|---|")
  for f, 未満, 段外, ど in 行:
    出.append("| `components/%s` | %d | %d | %s |" % (f, 未満, 段外, ど))
  print("\n".join(出))


if __name__ == "__main__":
  main()
