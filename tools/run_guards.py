#!/usr/bin/env python3
"""★★★見張りを ぜんぶ 走らせ、★**終わりの 番号**で 判じます。

  ★★★なぜ 作ったか（★2026-09-23）──
    ★私は「落ちた もの」を、★画面に 出る 字で 探して いました ──
      `✗ N` ／ `N件 落ちました` ／ `RESULT: NG` ／ `NG `
    ★★ところが 見張りごとに 言い方が ちがいます ──
      `❌ 失敗あり` ／ `❌ 2 件` ／ `★止まりました ──` ／ ★そもそも 落ちて 何も 出ない
    ★★★そのため **7本の 赤**を 見落とし、★「ぜんぶ 通りました」と 何度も 言いました。
      ★字で 探すのを やめます。★`process.exit` の 番号 だけ を 見ます。

  python3 tools/run_guards.py          ★落ちた ものだけ 並べます
  python3 tools/run_guards.py --all    ★ぜんぶ 並べます
"""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
置場 = os.path.join(ROOT, "components", "tests")


def main(引):
  みな = "--all" in 引
  本 = sorted(f for f in os.listdir(置場) if f.endswith(".test.js"))
  落ち = []
  for f in 本:
    r = subprocess.run(["node", os.path.join(置場, f)], capture_output=True, text=True, cwd=ROOT)
    出 = (r.stdout or "") + (r.stderr or "")
    しっぽ = [l for l in 出.strip().split("\n") if l.strip()][-1:] or [""]
    if r.returncode != 0:
      落ち.append((f, r.returncode, しっぽ[0][:110]))
      print("  ★NG(%d) %-44s %s" % (r.returncode, f[:-8], しっぽ[0][:110]))
    elif みな:
      print("  ok      %-44s %s" % (f[:-8], しっぽ[0][:80]))
  print()
  print("★見張り %d 本 ／ ★落ちた %d 本" % (len(本), len(落ち)))
  if 落ち:
    print("RESULT: NG")
    return 1
  print("RESULT: OK")
  return 0


if __name__ == "__main__":
  sys.exit(main(sys.argv[1:]))
