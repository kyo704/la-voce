#!/usr/bin/env python3
"""★★★「ずっと 緑」なのか、★「何も 見て いない」のか（★Opus の ACTION_1）。

  ★★★きっかけ ── ★2026-09-23、★`contrast` が **止まって いました**。
    ★★26の 確かめが 死んだ まま、★私は「緑」と 数えて いました。
    ★★★同じ ことが ほかでも 起きて いないか を 見ます。

  ★★見かた（★安い 順に 3つ）
    ㋐ 終わりの 番号 …… 0 で 終わるか（`run_guards.py` が 見ます）
    ㋑ ★**確かめの 数** … ★通った しるし（✓ / ok / ○）が いくつ 出たか
       ★★0 なら、★その 見張りは **1つも 確かめて いません**。
    ㋒ ★読んだ ファイル … ★何も 読んで いなければ、★見る ものが ありません

  ★★★㋑が この 道具の 肝 です。★`contrast` は ㋐で 捕まりましたが、
    ★「静かに 何も せず 0 で 終わる」形は ㋐では 捕まりません。

  python3 tools/guard_vacuity.py            ★あやしい ものだけ
  python3 tools/guard_vacuity.py --all      ★ぜんぶ
"""
import os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
置場 = os.path.join(ROOT, "components", "tests")
# ★通った しるし。★見張りごとに 言い方が ちがう ので、★広く 拾います。
シルシ = re.compile(r"(?:^|\s)(?:✓|ok\b|○|PASS\b|✅)", re.M)


def main(引):
  みな = "--all" in 引
  本 = sorted(f for f in os.listdir(置場) if f.endswith(".test.js"))
  あやしい = []
  for f in 本:
    r = subprocess.run(["node", os.path.join(置場, f)], capture_output=True, text=True, cwd=ROOT)
    出 = (r.stdout or "") + (r.stderr or "")
    数 = len(シルシ.findall(出))
    行 = len([l for l in 出.split("\n") if l.strip()])
    わけ = []
    if r.returncode != 0:
      わけ.append("落ちて います")
    elif 数 == 0:
      わけ.append("★確かめの しるしが **0**")
    elif 数 <= 2:
      わけ.append("確かめが %d しか ありません" % 数)
    if 行 <= 2 and r.returncode == 0:
      わけ.append("出て くる 字が %d 行だけ" % 行)
    if わけ:
      あやしい.append((f, 数, わけ))
      print("  ★%-44s 確かめ %3d ／ %s" % (f[:-8], 数, "・".join(わけ)))
    elif みな:
      print("   %-44s 確かめ %3d" % (f[:-8], 数))
  print()
  print("★見張り %d 本 ／ ★あやしい %d 本" % (len(本), len(あやしい)))
  print("★★『確かめ 0』は、★通って いるのでは なく **見て いない** 見込み です。")
  return 0 if not あやしい else 1


if __name__ == "__main__":
  sys.exit(main(sys.argv[1:]))
